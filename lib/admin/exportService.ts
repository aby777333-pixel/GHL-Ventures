/* ================================================================
   Export & Sharing Service — Multi-format export + share utilities

   Supports: CSV, JSON, PDF (placeholder), Google Sheets (mock),
   WhatsApp/Telegram sharing, clipboard, and share link generation.
   Uses storageService.saveBlobAs for all file downloads.
   ================================================================ */

import { saveBlobAs } from '@/lib/supabase/storageService'

// ── Types ─────────────────────────────────────────────────────
export type ExportFormat = 'csv' | 'json' | 'pdf' | 'xlsx'
export type ShareTarget = 'whatsapp' | 'telegram' | 'email' | 'clipboard' | 'google-sheets' | 'google-drive'

export interface ExportOptions {
  filename: string
  title?: string
  columns?: { key: string; label: string }[]
  dateRange?: { from: string; to: string }
}

export interface ShareOptions {
  title: string
  description?: string
  url?: string
  data?: string
}

// ── CSV Export ────────────────────────────────────────────────
export async function exportToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions
): Promise<void> {
  if (!data.length) return

  const columns = options.columns || Object.keys(data[0]).map(k => ({ key: k, label: k }))
  const headers = columns.map(c => c.label).join(',')
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key]
      if (val === null || val === undefined) return ''
      const str = String(val)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }).join(',')
  ).join('\n')

  const bom = '\uFEFF' // UTF-8 BOM for Excel compatibility
  const blob = new Blob([`${bom}${headers}\n${rows}`], { type: 'text/csv;charset=utf-8' })
  await downloadBlob(blob, `${options.filename}.csv`)
}

// ── JSON Export ───────────────────────────────────────────────
export async function exportToJSON<T>(data: T[], options: ExportOptions): Promise<void> {
  const output = {
    exported_at: new Date().toISOString(),
    title: options.title || options.filename,
    record_count: data.length,
    data,
  }
  const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' })
  await downloadBlob(blob, `${options.filename}.json`)
}

// ── PDF Export (placeholder — generates styled HTML for print) ──
export function exportToPDF<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions
): void {
  const columns = options.columns || Object.keys(data[0]).map(k => ({ key: k, label: k }))

  const html = `
<!DOCTYPE html>
<html><head>
<title>${options.title || options.filename}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; color: #1a1a1a; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f5f5f5; text-align: left; padding: 8px 12px; border-bottom: 2px solid #ddd; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
  td { padding: 6px 12px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #fafafa; }
  .footer { margin-top: 20px; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
  @media print { body { margin: 20px; } }
</style>
</head><body>
  <h1>${options.title || options.filename}</h1>
  <div class="meta">GHL India Ventures &bull; Exported ${new Date().toLocaleDateString('en-IN')} &bull; ${data.length} records</div>
  <table>
    <thead><tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
    <tbody>${data.map(row => `<tr>${columns.map(c => `<td>${row[c.key] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
  <div class="footer">GHL India Ventures Pvt. Ltd. &bull; SEBI Reg: IN/AIF2/2425/1517 &bull; Confidential</div>
  <script>window.print()</script>
</body></html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// ── Share Functions ────────────────────────────────────────────

export function shareViaWhatsApp(options: ShareOptions): void {
  const text = encodeURIComponent(`${options.title}${options.description ? '\n' + options.description : ''}${options.url ? '\n' + options.url : ''}`)
  window.open(`https://wa.me/?text=${text}`, '_blank')
}

export function shareViaTelegram(options: ShareOptions): void {
  const text = encodeURIComponent(`${options.title}${options.description ? '\n' + options.description : ''}`)
  const url = options.url ? encodeURIComponent(options.url) : ''
  window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank')
}

export function shareViaEmail(options: ShareOptions): void {
  const subject = encodeURIComponent(options.title)
  const body = encodeURIComponent(`${options.description || ''}\n\n${options.url || ''}`)
  window.open(`mailto:?subject=${subject}&body=${body}`, '_self')
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    }
    // Fallback
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return true
  } catch {
    return false
  }
}

// ── Google Sheets ─────────────────────────────────────────────
export function exportToGoogleSheets(title: string): string {
  // TODO: Integrate Google Sheets API
  return ''
}

// ── Google Drive ──────────────────────────────────────────────
export function exportToGoogleDrive(title: string): string {
  // TODO: Integrate Google Drive API
  return ''
}

// ── Generate Share Link ────────────────────────────────────────
export function generateShareLink(reportId: string, expiresIn: '1h' | '24h' | '7d' | '30d' = '24h'): string {
  const token = btoa(`${reportId}:${Date.now()}:${expiresIn}`)
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${token}`
}

// ── Helper: Download Blob (delegates to centralized storageService) ──
async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  await saveBlobAs(blob, filename)
}

// ── Helper: Open system file picker for uploads ───────────────
export async function openFilePicker(options?: {
  accept?: string
  multiple?: boolean
}): Promise<File[]> {
  // Try File System Access API first (opens native file picker)
  if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
    try {
      const acceptTypes: Record<string, string[]> = {}
      if (options?.accept) {
        // Parse accept string like ".pdf,.xlsx,.docx"
        const exts = options.accept.split(',').map(s => s.trim())
        acceptTypes['application/*'] = exts
      }
      const handles = await (window as any).showOpenFilePicker({
        multiple: options?.multiple ?? false,
        types: options?.accept ? [{ description: 'Files', accept: acceptTypes }] : undefined,
      })
      const files: File[] = []
      for (let i = 0; i < handles.length; i++) {
        const file = await handles[i].getFile()
        files.push(file)
      }
      return files
    } catch (err: any) {
      if (err?.name === 'AbortError') return [] // User cancelled
    }
  }

  // Fallback: create hidden input and trigger click
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    if (options?.accept) input.accept = options.accept
    if (options?.multiple) input.multiple = true
    input.style.display = 'none'
    input.addEventListener('change', () => {
      const files = input.files ? Array.from(input.files) : []
      document.body.removeChild(input)
      resolve(files)
    })
    // Handle cancel (no change event fires)
    input.addEventListener('cancel', () => {
      document.body.removeChild(input)
      resolve([])
    })
    document.body.appendChild(input)
    input.click()
  })
}

// ── Format Helpers ────────────────────────────────────────────
export function formatExportTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

export function getExportFilename(module: string, format: ExportFormat): string {
  return `GHL_${module}_${formatExportTimestamp()}.${format}`
}
