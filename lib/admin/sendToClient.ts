/* ─────────────────────────────────────────────────────────────
   Send-to-Client Helper

   Used by admin modules (Allotment, Debenture Certificate,
   Monthly Payout) to deliver a generated document into the
   respective client's dashboard Documents tab.

   Storage strategy:
     The ghl-documents + uploads buckets reject text/html uploads
     via bucket policy ("mime type text/html is not supported").
     Rather than change the bucket policy (which other tooling
     relies on), we embed the document as a base64 data URL
     directly in documents.file_url. This makes the document:

       • self-contained (no storage round-trip)
       • immediately visible in the client's Documents tab
         (DocumentsTab's View opens the data: URL in a new tab,
          Download fetches the data: URL and saves as a blob)
       • immune to storage mime restrictions / CDN propagation

     file_url starts with `data:text/html;base64,` so existing
     handleView / handleDownload in DocumentsTab work unchanged.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

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

// UTF-8 safe base64 (window.btoa only handles Latin-1 directly).
function encodeHtmlToBase64(html: string): string {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    // Route through UTF-8 so non-ASCII chars (₹, –, etc.) survive encoding.
    return window.btoa(unescape(encodeURIComponent(html)))
  }
  // Fallback for non-browser contexts (should not happen at runtime here).
  return typeof Buffer !== 'undefined' ? Buffer.from(html, 'utf-8').toString('base64') : html
}

export async function sendDocumentToClient(input: SendToClientInput): Promise<SendToClientResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase not configured' }
  }

  try {
    // 1. Resolve admin user id (recorded on the document row as uploaded_by).
    const { data: authData } = await sb.auth.getUser()
    const adminUserId: string | null = authData?.user?.id || null

    // 2. Encode HTML as a base64 data URL. Raw-byte size (for file_size) is
    //    measured via Blob so the UTF-8 length is accurate for non-ASCII.
    const byteLength = new Blob([input.html]).size
    const fileUrl = `data:text/html;base64,${encodeHtmlToBase64(input.html)}`

    // 3. Insert into documents — the client's DocumentsTab picks this up
    //    because it filters by client_id/entity_id and allows categories
    //    'agreement' / 'report' / 'compliance' or titles containing
    //    "Allotment" / "Debenture Certificate".
    const { error: insertErr } = await sb.from('documents').insert({
      title: input.title,
      file_url: fileUrl,
      file_name: input.fileName,
      file_size: byteLength,
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
      return { ok: false, error: `DB insert failed: ${insertErr.message}` }
    }

    return { ok: true, fileUrl }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Unknown error' }
  }
}
