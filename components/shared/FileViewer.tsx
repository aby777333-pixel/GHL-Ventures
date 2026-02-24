'use client'

import { useState } from 'react'
import { Download, ExternalLink, Eye, FileText, Image, File, X, Maximize2 } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

interface FileViewerProps {
  fileName: string
  filePath: string
  fileType?: string
  bucket?: string
  showPreview?: boolean
  showDownload?: boolean
  compact?: boolean
  className?: string
}

export default function FileViewer({
  fileName,
  filePath,
  fileType = '',
  bucket = 'company-documents',
  showPreview = true,
  showDownload = true,
  compact = false,
  className = '',
}: FileViewerProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)
  const isPDF = fileType.includes('pdf') || /\.pdf$/i.test(fileName)

  const getFileUrl = async (): Promise<string | null> => {
    if (!isSupabaseConfigured()) {
      // Mock: return a placeholder
      return '#'
    }

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      if (error || !data?.signedUrl) {
        console.warn('[file] Error getting signed URL:', error?.message)
        return null
      }
      return data.signedUrl
    } catch {
      return null
    }
  }

  const handleDownload = async () => {
    setLoading(true)
    const url = await getFileUrl()
    setLoading(false)

    if (!url || url === '#') return

    // Try File System Access API — opens native Save-As dialog
    if ('showSaveFilePicker' in window) {
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
        })
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
        return
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        // Fall through to standard download
      }
    }

    // Fallback: standard download to Downloads folder
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handlePreview = async () => {
    if (isImage || isPDF) {
      setPreviewOpen(true)
    } else {
      await handleDownload()
    }
  }

  const getIcon = () => {
    if (isImage) return <Image className="w-5 h-5 text-blue-500" />
    if (isPDF) return <FileText className="w-5 h-5 text-red-500" />
    return <File className="w-5 h-5 text-gray-500" />
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {getIcon()}
        <span className="text-sm text-gray-700 truncate max-w-[200px]">{fileName}</span>
        {showPreview && (isImage || isPDF) && (
          <button
            onClick={handlePreview}
            className="text-gray-400 hover:text-brand-red transition-colors"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        {showDownload && (
          <button
            onClick={handleDownload}
            className="text-gray-400 hover:text-brand-red transition-colors"
            title="Download"
            disabled={loading}
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className={`flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors ${className}`}>
        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
          <p className="text-xs text-gray-500">{fileType || 'Document'}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {showPreview && (isImage || isPDF) && (
            <button
              onClick={handlePreview}
              className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition-colors"
              title="Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {showDownload && (
            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition-colors"
              title="Download"
              disabled={loading}
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-white rounded-t-xl border-b">
              <div className="flex items-center gap-2">
                {getIcon()}
                <span className="text-sm font-medium text-gray-700 truncate">{fileName}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="bg-gray-100 rounded-b-xl overflow-auto max-h-[calc(90vh-60px)] flex items-center justify-center p-4">
              {isImage && (
                <img
                  src={filePath.startsWith('http') ? filePath : '#'}
                  alt={fileName}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              )}
              {isPDF && (
                <div className="w-full h-[70vh] bg-white rounded-lg shadow-lg flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-red-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">PDF Preview</p>
                    <p className="text-xs text-gray-400 mt-1">Download to view the full document</p>
                    <button
                      onClick={handleDownload}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-red hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
