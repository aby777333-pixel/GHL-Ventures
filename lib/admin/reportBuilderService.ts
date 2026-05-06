/* ================================================================
   REPORT BUILDER SERVICE — Save / Export / Share

   Persistence
   -----------
     • Report definition (title + canvas blocks JSON) → public.reports
     • Generated PDF → ghl-exports bucket via storageService
     • Export record → public.report_exports

   Design notes
   ------------
   1. We store the full canvas-blocks payload in `reports.data` as JSONB
      (the schema already has the column). This lets us reload a saved
      report later without losing the layout.
   2. PDF generation uses jspdf + html2canvas, dynamically imported so
      a missing dependency degrades gracefully to window.print() instead
      of breaking the bundle.
   3. All Supabase calls are gated on isSupabaseConfigured() and fall
      back to localStorage so the Builder still works during local dev
      with no backend.
   ================================================================ */

import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { saveBlobToStorage, saveBlobAs, BUCKETS } from '@/lib/supabase/storageService'

const LS_KEY = 'ghl_admin_reports_drafts'

// ── Types ───────────────────────────────────────────────────────

export interface SavedBlock {
  id: string
  type: string
  label: string
  category: string
  // Optional file reference for "attachment" blocks
  fileRef?: {
    id: string
    title: string
    fileUrl: string
    fileType: string
    fileSize: number
  }
  // Optional user-edited properties (Properties Inspector)
  props?: {
    title?: string
    dataSource?: string
    dateRange?: string
    chartType?: string
    text?: string
  }
}

export interface ReportDraft {
  id: string                  // UUID for Supabase, fallback to crypto.randomUUID()
  title: string
  blocks: SavedBlock[]
  updatedAt: string
}

// ── Local-storage fallback ─────────────────────────────────────

function readLocalDrafts(): ReportDraft[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as ReportDraft[]) : []
  } catch {
    return []
  }
}

function writeLocalDrafts(drafts: ReportDraft[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(drafts.slice(0, 50)))
  } catch {
    /* quota exceeded — silently ignore */
  }
}

function upsertLocalDraft(draft: ReportDraft) {
  const drafts = readLocalDrafts()
  const idx = drafts.findIndex(d => d.id === draft.id)
  if (idx >= 0) drafts[idx] = draft
  else drafts.unshift(draft)
  writeLocalDrafts(drafts)
}

// ── Save report definition ─────────────────────────────────────

/**
 * Persist a report's definition (title + canvas JSON).
 * Saves to Supabase `reports.data` when configured, otherwise localStorage.
 * Returns the report id so the caller can reference it from
 * subsequent export / share operations.
 */
export async function saveReportDraft(
  draft: Omit<ReportDraft, 'updatedAt'> & { updatedAt?: string }
): Promise<{ success: boolean; id: string; error?: string }> {
  const fullDraft: ReportDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  }

  // Always mirror to localStorage so unsaved edits survive a refresh.
  upsertLocalDraft(fullDraft)

  if (!isSupabaseConfigured()) {
    return { success: true, id: fullDraft.id }
  }

  try {
    let userId: string | undefined
    try {
      const { data: authData } = await supabase.auth.getUser()
      userId = authData?.user?.id
    } catch { /* anon */ }

    const payload: Record<string, unknown> = {
      title: fullDraft.title,
      type: 'custom',
      status: 'draft',
      data: { blocks: fullDraft.blocks },
      generated_by: userId ?? null,
      parameters: { source: 'report_builder', client_id: fullDraft.id },
    }

    // Try update-by-parameters-client_id first; fall back to insert.
    const { data: existing } = await (supabase.from('reports') as any)
      .select('id')
      .eq('parameters->>client_id', fullDraft.id)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await (supabase.from('reports') as any)
        .update(payload)
        .eq('id', existing.id)
      if (error) throw error
      return { success: true, id: existing.id }
    }

    const { data: inserted, error } = await (supabase.from('reports') as any)
      .insert(payload)
      .select('id')
      .single()

    if (error) throw error
    return { success: true, id: inserted?.id || fullDraft.id }
  } catch (err: any) {
    // Supabase failed — localStorage copy still exists, return non-fatal.
    return { success: false, id: fullDraft.id, error: err?.message || 'Save failed' }
  }
}

// ── Export PDF ─────────────────────────────────────────────────

interface ExportOptions {
  /** DOM element to convert to PDF — typically the preview container */
  element: HTMLElement
  /** Display name (used as PDF filename + report title) */
  fileName: string
  /** Existing report id (from saveReportDraft) for export-record FK */
  reportId?: string
  /** Whether to also trigger a Save-As download dialog */
  alsoDownload?: boolean
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

interface ExportResult {
  success: boolean
  blob?: Blob
  storageUrl?: string
  storagePath?: string
  error?: string
}

/**
 * Render `element` to a PDF blob, upload to Supabase Storage, and
 * (optionally) trigger a Save-As dialog. Falls back to window.print()
 * if jspdf/html2canvas are unavailable.
 */
export async function exportReportToPDF(opts: ExportOptions): Promise<ExportResult> {
  const { element, fileName, reportId, alsoDownload = true, showToast } = opts

  // Dynamic import so a build without the deps still loads the module
  let blob: Blob
  try {
    const [{ default: jsPDF }, html2canvasMod] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ])
    const html2canvas = (html2canvasMod as any).default || html2canvasMod

    // Render the element to a canvas at 2x for retina-quality output.
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    blob = pdf.output('blob')
  } catch (err: any) {
    // Library unavailable — fall back to native print. The user gets a
    // print preview where they can choose "Save as PDF". No upload to
    // Supabase in this branch (we have no blob to ship).
    showToast?.('PDF library unavailable, opening browser print preview…', 'info')
    try {
      // Open a clean print window with just the report HTML.
      const printWindow = window.open('', '_blank', 'width=900,height=1200')
      if (!printWindow) throw new Error('Pop-up blocked')
      printWindow.document.write(`<!DOCTYPE html><html><head><title>${fileName}</title>
        <style>body{font-family:system-ui,sans-serif;margin:0;padding:24px;background:#fff;color:#111}
        @media print {body{padding:0}}</style></head>
        <body>${element.outerHTML}</body></html>`)
      printWindow.document.close()
      // Wait for images, then print
      setTimeout(() => { printWindow.focus(); printWindow.print() }, 300)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e?.message || err?.message || 'Export failed' }
    }
  }

  // Upload to Supabase Storage (ghl-exports/admin/reports)
  let storageUrl: string | undefined
  let storagePath: string | undefined
  // Storage service uses a wider toast signature — the runtime values
  // are always one of our four kinds, so widening at the boundary is safe.
  const wideToast = showToast as ((msg: string, type?: string) => void) | undefined
  if (isSupabaseConfigured()) {
    try {
      const upload = await saveBlobToStorage(blob, `${fileName}.pdf`, 'admin/reports', {
        portal: 'admin',
        entityType: 'report',
        entityId: reportId,
        showToast: wideToast,
      })
      if (upload.success && upload.file) {
        storageUrl = upload.file.url
        storagePath = upload.file.path

        // Record export in report_exports table when we have a parent report.
        if (reportId) {
          try {
            const { data: authData } = await supabase.auth.getUser()
            await (supabase.from('report_exports') as any).insert({
              report_id: reportId,
              format: 'pdf',
              file_url: storageUrl,
              file_size: blob.size,
              exported_by: authData?.user?.id ?? null,
            })
          } catch { /* non-fatal */ }
        }
      }
    } catch { /* non-fatal — local download still works */ }
  }

  if (alsoDownload) {
    await saveBlobAs(blob, `${fileName}.pdf`, wideToast)
  }

  return { success: true, blob, storageUrl, storagePath }
}

// ── Share ──────────────────────────────────────────────────────

/**
 * Build a shareable artifact:
 *   - If we have a Supabase storage URL, return it (signed URL valid 1h).
 *   - Otherwise, copy a JSON snapshot of the report to the clipboard
 *     so the user can paste it into chat / email.
 */
export async function shareReport(opts: {
  storageUrl?: string
  draft: ReportDraft
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}): Promise<{ success: boolean; method: 'url' | 'json' | 'fallback' }> {
  const { storageUrl, draft, showToast } = opts

  // Prefer copying the storage URL when we have one.
  if (storageUrl) {
    try {
      await navigator.clipboard.writeText(storageUrl)
      showToast?.('Report URL copied to clipboard', 'success')
      return { success: true, method: 'url' }
    } catch {
      /* fall through to JSON snapshot */
    }
  }

  // Fallback: copy a JSON snapshot the user can re-import.
  try {
    const snapshot = JSON.stringify({ title: draft.title, blocks: draft.blocks }, null, 2)
    await navigator.clipboard.writeText(snapshot)
    showToast?.('Report snapshot copied as JSON', 'success')
    return { success: true, method: 'json' }
  } catch {
    showToast?.('Could not copy to clipboard — please use Export instead', 'warning')
    return { success: false, method: 'fallback' }
  }
}
