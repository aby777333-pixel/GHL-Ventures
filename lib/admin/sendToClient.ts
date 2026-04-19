/* ─────────────────────────────────────────────────────────────
   Send-to-Client Helper

   Used by admin modules (Allotment, Debenture Certificate,
   Monthly Payout) to deliver a generated document into the
   respective client's dashboard Documents tab.

   Flow:
     1. Convert HTML → text/html Blob → File
     2. uploadFile() → ghl-documents bucket, clients/ folder
     3. Insert a row into the existing `documents` table so the
        client sees it immediately in their Documents tab (filter
        matches `client_id.eq.<clients.id>`).

   Reuses uploadFile + inserts directly into `documents` so it
   stays in sync with the existing client-side uploadClientDocument
   helper. Admin is recorded as uploaded_by.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { uploadFile } from '@/lib/supabase/storageService'

const sb = supabase as any

export interface SendToClientInput {
  clientId: string                  // clients.id (matches documents.client_id)
  html: string                      // full HTML document (can include auto-print script)
  fileName: string                  // e.g. "allotment-letter-GHL001.html"
  title: string                     // e.g. "Allotment Letter — Folio GHL001"
  category: 'agreement' | 'report' | 'compliance'
}

export interface SendToClientResult {
  ok: boolean
  fileUrl?: string
  error?: string
}

export async function sendDocumentToClient(input: SendToClientInput): Promise<SendToClientResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase not configured' }
  }

  try {
    // 1. Resolve admin user id (recorded on the document row).
    const { data: authData } = await sb.auth.getUser()
    const adminUserId: string | null = authData?.user?.id || null

    // 2. Build file from HTML string.
    const blob = new Blob([input.html], { type: 'text/html' })
    const file = new File([blob], input.fileName, { type: 'text/html' })

    // 3. Upload to storage (bucket/folder routed via 'client/documents').
    const uploadRes = await uploadFile(file, 'client/documents', {
      entityType: 'client',
      entityId: input.clientId,
      portal: 'admin',
      uploadedBy: adminUserId || undefined,
      category: input.category,
      accessLevel: 'restricted',
      description: input.title,
    })

    if (!uploadRes.success || !uploadRes.file?.url) {
      return { ok: false, error: uploadRes.error || 'Upload failed' }
    }

    const fileUrl = uploadRes.file.url

    // 4. Insert into documents table so the client's Documents tab picks it up.
    //    DocumentsTab filters by client_id OR entity_id and filters titles/categories
    //    that include "Allotment", "Debenture Certificate", or category 'agreement'.
    const { error: insertErr } = await sb.from('documents').insert({
      title: input.title,
      file_url: fileUrl,
      file_name: input.fileName,
      file_size: file.size,
      file_type: 'html',
      mime_type: 'text/html',
      category: input.category,
      entity_type: 'client',
      entity_id: input.clientId,
      client_id: input.clientId,
      uploaded_by: adminUserId,
      access_level: 'restricted',
      status: 'active',
    })

    if (insertErr) {
      return { ok: false, error: `DB insert failed: ${insertErr.message}`, fileUrl }
    }

    return { ok: true, fileUrl }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Unknown error' }
  }
}
