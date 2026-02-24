'use client'

import { useState, useEffect } from 'react'
import { Download, Eye, FileText, Image, File, X, Film, Music, Table, Code, Archive, FileSpreadsheet, Presentation } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { getPreviewUrl, saveFileAs, saveBlobAs, getDownloadUrl, formatFileSize, getFileTypeFromMime, logFileActivity } from '@/lib/supabase/storageService'

interface FileViewerProps {
  fileName: string
  filePath: string
  fileType?: string
  fileUrl?: string
  fileSize?: number
  bucket?: string
  showPreview?: boolean
  showDownload?: boolean
  compact?: boolean
  className?: string
  onView?: () => void
  onDownload?: () => void
  showToast?: (msg: string, type?: string) => void
}

export default function FileViewer({
  fileName,
  filePath,
  fileType = '',
  fileUrl,
  fileSize,
  bucket = 'ghl-documents',
  showPreview = true,
  showDownload = true,
  compact = false,
  className = '',
  onView,
  onDownload,
  showToast,
}: FileViewerProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const fileCategory = getFileTypeFromMime(fileType)
  const isImage = fileCategory === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)
  const isPDF = fileCategory === 'pdf' || /\.pdf$/i.test(fileName)
  const isVideo = fileCategory === 'video' || /\.(mp4|webm|mov)$/i.test(fileName)
  const isAudio = fileCategory === 'audio' || /\.(mp3|wav|ogg)$/i.test(fileName)
  const isSpreadsheet = fileCategory === 'xlsx' || fileCategory === 'csv' || /\.(xlsx|xls|csv)$/i.test(fileName)
  const isDoc = fileCategory === 'docx' || /\.(docx|doc)$/i.test(fileName)
  const isPresentation = fileCategory === 'pptx' || /\.(pptx|ppt)$/i.test(fileName)
  const isCode = fileCategory === 'json' || /\.(json|js|ts|html|css|xml)$/i.test(fileName)
  const isArchive = fileCategory === 'archive' || /\.(zip|gz|tar|rar|7z)$/i.test(fileName)
  const isText = fileCategory === 'txt' || /\.txt$/i.test(fileName)

  const canPreview = isImage || isPDF || isVideo || isAudio || isText

  // Fetch preview URL when preview modal opens
  useEffect(() => {
    if (previewOpen && !previewUrl) {
      const fetchUrl = async () => {
        if (fileUrl && fileUrl.startsWith('http')) {
          setPreviewUrl(fileUrl)
          return
        }
        if (isSupabaseConfigured()) {
          const url = await getPreviewUrl(filePath, bucket, fileType)
          setPreviewUrl(url)
        }
      }
      fetchUrl()
    }
  }, [previewOpen, previewUrl, fileUrl, filePath, bucket, fileType])

  const handleDownload = async () => {
    setLoading(true)
    try {
      if (isSupabaseConfigured()) {
        await saveFileAs(filePath, fileName, bucket, showToast)
      } else if (fileUrl && fileUrl.startsWith('blob:')) {
        // Demo mode: blob URL
        const resp = await fetch(fileUrl)
        const blob = await resp.blob()
        await saveBlobAs(blob, fileName, showToast)
      } else {
        showToast?.('File not available for download', 'info')
      }
      onDownload?.()

      // Log activity
      await logFileActivity({
        action: 'download',
        details: { fileName, filePath, bucket },
      })
    } catch {
      showToast?.('Download failed', 'error')
    }
    setLoading(false)
  }

  const handlePreview = async () => {
    if (canPreview) {
      setPreviewOpen(true)
      onView?.()
      await logFileActivity({
        action: 'view',
        details: { fileName, filePath, bucket },
      })
    } else {
      await handleDownload()
    }
  }

  const getIcon = () => {
    if (isImage) return <Image className="w-5 h-5 text-blue-500" />
    if (isPDF) return <FileText className="w-5 h-5 text-red-500" />
    if (isVideo) return <Film className="w-5 h-5 text-purple-500" />
    if (isAudio) return <Music className="w-5 h-5 text-green-500" />
    if (isSpreadsheet) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
    if (isDoc) return <FileText className="w-5 h-5 text-blue-600" />
    if (isPresentation) return <Presentation className="w-5 h-5 text-orange-500" />
    if (isCode) return <Code className="w-5 h-5 text-cyan-500" />
    if (isArchive) return <Archive className="w-5 h-5 text-yellow-600" />
    if (isText) return <Table className="w-5 h-5 text-gray-500" />
    return <File className="w-5 h-5 text-gray-500" />
  }

  const getTypeLabel = () => {
    if (isImage) return 'Image'
    if (isPDF) return 'PDF Document'
    if (isVideo) return 'Video'
    if (isAudio) return 'Audio'
    if (isSpreadsheet) return 'Spreadsheet'
    if (isDoc) return 'Word Document'
    if (isPresentation) return 'Presentation'
    if (isCode) return 'Code/Data'
    if (isArchive) return 'Archive'
    if (isText) return 'Text File'
    return fileType || 'Document'
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {getIcon()}
        <span className="text-sm text-gray-700 truncate max-w-[200px]">{fileName}</span>
        {fileSize ? <span className="text-xs text-gray-400">{formatFileSize(fileSize)}</span> : null}
        {showPreview && canPreview && (
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
          <p className="text-xs text-gray-500">
            {getTypeLabel()}
            {fileSize ? ` · ${formatFileSize(fileSize)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {showPreview && canPreview && (
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
                {fileSize ? <span className="text-xs text-gray-400 ml-1">{formatFileSize(fileSize)}</span> : null}
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
                  onClick={() => { setPreviewOpen(false); setPreviewUrl(null) }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="bg-gray-100 rounded-b-xl overflow-auto max-h-[calc(90vh-60px)] flex items-center justify-center p-4">
              {isImage && previewUrl && (
                <img
                  src={previewUrl}
                  alt={fileName}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              )}

              {isImage && !previewUrl && (
                <div className="text-center p-8">
                  <Image className="w-16 h-16 text-blue-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Loading preview...</p>
                </div>
              )}

              {isPDF && previewUrl && (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] bg-white rounded-lg shadow-lg"
                  title={fileName}
                />
              )}

              {isPDF && !previewUrl && (
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

              {isVideo && previewUrl && (
                <video
                  src={previewUrl}
                  controls
                  className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
                >
                  Your browser does not support video playback.
                </video>
              )}

              {isVideo && !previewUrl && (
                <div className="text-center p-8">
                  <Film className="w-16 h-16 text-purple-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Loading video...</p>
                </div>
              )}

              {isAudio && previewUrl && (
                <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-lg">
                  <Music className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-700 text-center mb-4">{fileName}</p>
                  <audio src={previewUrl} controls className="w-full">
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}

              {isText && (
                <div className="w-full h-[70vh] bg-white rounded-lg shadow-lg flex items-center justify-center">
                  <div className="text-center">
                    <Table className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Text File Preview</p>
                    <p className="text-xs text-gray-400 mt-1">Download to view the contents</p>
                    <button
                      onClick={handleDownload}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-red hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download File
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
