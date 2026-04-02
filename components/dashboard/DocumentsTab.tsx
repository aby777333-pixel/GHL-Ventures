'use client'

import { useState } from 'react'
import { Eye, Download, Upload, FileText, Clock } from 'lucide-react'
import { useDocuments } from '@/lib/supabase/dashboardDataHooks'
import { uploadClientDocument } from '@/lib/supabase/dashboardDataService'
import { uploadFile, saveBlobAs } from '@/lib/supabase/storageService'

interface Props {
  clientId: string
  userId: string
  theme: 'dark' | 'light'
  onToast: (msg: string, type: 'success' | 'info') => void
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

  // Filter to investment-related documents
  const investDocs = (documents || []).filter((d: any) => ['agreement', 'compliance', 'report'].includes(d.category) || ['Acknowledgement', 'Debenture Agreement', 'Allotment', 'Debenture Certificate', 'TDS'].some(t => d.title?.includes(t)))

  return (
    <div className={cardCls}>
      <h2 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Investment Documents</h2>

      {investDocs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No documents available yet. Documents will appear here after your investment is processed.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <thead><tr className={`text-xs uppercase ${isDark ? 'text-gray-500 border-white/10' : 'text-gray-500 border-gray-200'} border-b`}>
              <th className="py-3 text-left">Date</th>
              <th className="py-3 text-left">Title</th>
              <th className="py-3 text-left">Document</th>
              <th className="py-3 text-left">Signed Documents</th>
            </tr></thead>
            <tbody>
              {investDocs.map((doc: any) => (
                <tr key={doc.id} className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                  <td className="py-3">{doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                  <td className="py-3 font-medium">{doc.title}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(doc.file_url)} className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDownload(doc.file_url, doc.file_name || doc.title)} className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700"><Download className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                  <td className="py-3">
                    {doc.title?.includes('Debenture') ? (
                      <label className="cursor-pointer">
                        <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadSigned(doc.id, f) }} />
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded border text-xs ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-300 hover:bg-gray-50'}`}>
                          <Upload className="w-3 h-3" />{uploading ? 'Uploading...' : 'Upload'}
                        </span>
                      </label>
                    ) : <span className="text-gray-500">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
