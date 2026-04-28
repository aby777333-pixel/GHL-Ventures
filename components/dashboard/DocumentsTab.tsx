'use client'

import { useState, useMemo } from 'react'
import { Eye, Download, Upload, FileText, Receipt } from 'lucide-react'
import { useDocuments } from '@/lib/supabase/dashboardDataHooks'
import { uploadClientDocument } from '@/lib/supabase/dashboardDataService'
import { uploadFile, saveBlobAs } from '@/lib/supabase/storageService'

interface Props {
  clientId: string
  userId: string
  theme: 'dark' | 'light'
  onToast: (msg: string, type: 'success' | 'info') => void
}

// Display-only title normalization. Admin saves Investment Documents under
// terse types (`agreement`, `certificate`); the investor needs the full
// "Debenture Agreement" / "Debenture Certificate" wording per the
// 25-04-2026 testing report (INV-4).
function normalizeTitle(raw?: string): string {
  const t = (raw || '').trim()
  if (!t) return ''
  // Already canonical
  if (/debenture\s+(agreement|certificate)/i.test(t)) return t
  if (/^agreement$/i.test(t)) return 'Debenture Agreement'
  if (/^certificate$/i.test(t)) return 'Debenture Certificate'
  return t
}

// Group a doc by its functional type. We use this both for sectioning and
// for the "only Debenture Agreement gets a signed-copy slot" rule (INV-1).
function classify(doc: any): 'agreement' | 'certificate' | 'allotment' | 'acknowledgement' | 'tds' | 'other' {
  const dt = (doc.document_type || '').toLowerCase()
  const title = (doc.title || '').toLowerCase()
  if (dt === 'tds' || title.includes('tds')) return 'tds'
  if (dt === 'agreement' || dt === 'debenture_agreement' || title.includes('agreement')) return 'agreement'
  if (dt === 'certificate' || dt === 'debenture_certificate' || title.includes('certificate')) return 'certificate'
  if (dt === 'allotment' || title.includes('allotment')) return 'allotment'
  if (dt === 'acknowledgement' || title.includes('acknowledgement')) return 'acknowledgement'
  return 'other'
}

export default function DocumentsTab({ clientId, userId, theme, onToast }: Props) {
  const isDark = theme === 'dark'
  const { data: documents, refetch } = useDocuments(clientId)
  const [uploading, setUploading] = useState(false)

  const cardCls = `rounded-xl border p-6 ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-gray-200'}`

  const handleUploadSigned = async (docId: string, file: File) => {
    setUploading(true)
    try {
      const result = await uploadFile(file, 'client/kyc', { entityType: 'client', entityId: clientId, description: 'Signed document' })
      if (result?.file?.url) {
        await uploadClientDocument({ client_id: clientId, user_id: userId, title: `Signed - ${file.name}`, category: 'agreement', file_url: result.file.url, file_name: file.name, file_size: file.size, file_type: file.name.split('.').pop() || '', mime_type: file.type })
        onToast('Signed document uploaded', 'success')
        refetch()
      }
    } catch { onToast('Upload failed', 'info') }
    setUploading(false)
  }

  const handleView = (url: string) => { if (url) window.open(url, '_blank') }
  const handleDownload = async (url: string, fileName: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      saveBlobAs(blob, fileName)
    } catch { onToast('Download failed', 'info') }
  }

  // Filter to investment-related documents and split into two groups:
  //   • Investment Documents — agreement / certificate / allotment / acknowledgement
  //   • TDS Documents — type='tds' or title contains 'TDS' (INV-5)
  // Hide auto-generated ack-letter rows that have no actual file_url
  // (INV-2 — admin-triggered placeholder is hidden until they upload).
  const { investDocs, tdsDocs } = useMemo(() => {
    const all = (documents || []).filter((d: any) => {
      const k = classify(d)
      if (k === 'other') {
        // Keep legacy categories (compliance / report) so historical docs still show
        const cat = (d.category || '').toLowerCase()
        return cat === 'agreement' || cat === 'compliance' || cat === 'report'
      }
      // Hide placeholder rows (INV-2)
      if (k === 'acknowledgement' && !d.file_url) return false
      return true
    })
    const tds: any[] = []
    const inv: any[] = []
    for (const d of all) {
      if (classify(d) === 'tds') tds.push(d)
      else inv.push(d)
    }
    return { investDocs: inv, tdsDocs: tds }
  }, [documents])

  // Render helpers
  const investmentTable = (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        <thead><tr className={`text-xs uppercase ${isDark ? 'text-gray-500 border-white/10' : 'text-gray-500 border-gray-200'} border-b`}>
          <th className="py-3 text-left">Title</th>
          <th className="py-3 text-left">Document</th>
          <th className="py-3 text-left">Signed Documents</th>
        </tr></thead>
        <tbody>
          {investDocs.map((doc: any) => {
            const kind = classify(doc)
            const showSigned = kind === 'agreement' // INV-1 — only Debenture Agreement
            return (
              <tr key={doc.id} className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                <td className="py-3 font-medium">{normalizeTitle(doc.title)}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { if (doc.file_url) handleView(doc.file_url) }} disabled={!doc.file_url} className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { if (doc.file_url) handleDownload(doc.file_url, doc.file_name || doc.title) }} disabled={!doc.file_url} className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"><Download className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td className="py-3">
                  {showSigned ? (
                    <label className="cursor-pointer">
                      <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadSigned(doc.id, f) }} />
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded border text-xs ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-300 hover:bg-gray-50'}`}>
                        <Upload className="w-3 h-3" />{uploading ? 'Uploading...' : 'Upload'}
                      </span>
                    </label>
                  ) : <span className="text-gray-500">-</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  const tdsTable = (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        <thead><tr className={`text-xs uppercase ${isDark ? 'text-gray-500 border-white/10' : 'text-gray-500 border-gray-200'} border-b`}>
          <th className="py-3 text-left">Title</th>
          <th className="py-3 text-left">Document</th>
        </tr></thead>
        <tbody>
          {tdsDocs.map((doc: any) => (
            <tr key={doc.id} className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
              <td className="py-3 font-medium">{doc.title || 'TDS Document'}</td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => { if (doc.file_url) handleView(doc.file_url) }} disabled={!doc.file_url} className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"><Eye className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if (doc.file_url) handleDownload(doc.file_url, doc.file_name || doc.title) }} disabled={!doc.file_url} className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"><Download className="w-3.5 h-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // Tests 28-04-2026 #4: TDS rows historically saved their title as
  // "TDS Certificate — 25 Apr 2026". The investor only needs to see
  // "TDS Certificate" — the date column already prints when it was issued.
  const cleanTitle = (raw: string) => {
    if (!raw) return raw
    if (raw.startsWith('TDS Certificate')) return 'TDS Certificate'
    return raw
  }

  return (
    <div className="space-y-6">
      {/* Investment Documents */}
      <div className={cardCls}>
        <h2 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Investment Documents</h2>
        {investDocs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No documents available yet. Documents will appear here after your investment is processed.</p>
          </div>
        ) : investmentTable}
      </div>

      {/* TDS Documents — admin can upload many; investor views/downloads each */}
      <div className={cardCls}>
        <div className="flex items-center gap-2 mb-6">
          <Receipt className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>TDS Documents</h2>
        </div>
        {tdsDocs.length === 0 ? (
          <div className="text-center py-10">
            <Receipt className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No TDS documents yet. Quarterly TDS certificates will appear here as they are issued.</p>
          </div>
        ) : tdsTable}
      </div>
    </div>
  )
}
