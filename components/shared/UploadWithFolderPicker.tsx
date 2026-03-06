'use client'

import { useState, useRef } from 'react'
import { Upload, X, AlertTriangle, ChevronDown, Database, FileText } from 'lucide-react'
import { BUCKETS } from '@/lib/supabase/storageService'
import { uploadFile } from '@/lib/supabase/storageService'

// Bucket display config - friendly names and descriptions
const BUCKET_OPTIONS = [
  { key: 'DOCUMENTS', id: BUCKETS.DOCUMENTS, name: 'Documents', description: 'Primary document storage', icon: '📄' },
  { key: 'TEMPLATES', id: BUCKETS.TEMPLATES, name: 'Templates', description: 'Reusable document templates', icon: '📋' },
  { key: 'MEDIA', id: BUCKETS.MEDIA, name: 'Media', description: 'Images, videos, and audio files', icon: '🖼️' },
  { key: 'EXPORTS', id: BUCKETS.EXPORTS, name: 'Exports', description: 'Generated reports and exports', icon: '📊' },
  { key: 'TEMP', id: BUCKETS.TEMP, name: 'Temp Uploads', description: 'Temporary staging area', icon: '⏳' },
  { key: 'BACKUPS', id: BUCKETS.BACKUPS, name: 'Backups', description: 'Database and config backups', icon: '💾' },
  { key: 'AVATARS', id: BUCKETS.AVATARS, name: 'Avatars', description: 'User profile images', icon: '👤' },
  { key: 'MARKETING', id: BUCKETS.MARKETING, name: 'Marketing Assets', description: 'Campaign and brand assets', icon: '📢' },
  { key: 'UPLOADS', id: BUCKETS.UPLOADS, name: 'General Uploads', description: 'Legacy upload storage', icon: '📁' },
  { key: 'KYC', id: BUCKETS.KYC, name: 'KYC Documents', description: 'Know Your Customer files', icon: '🔐' },
  { key: 'RESUMES', id: BUCKETS.RESUMES, name: 'Resumes', description: 'Resume and CV files', icon: '📝' },
]

interface UploadWithFolderPickerProps {
  open: boolean
  onClose: () => void
  defaultRoute?: string
  accept?: string
  multiple?: boolean
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  onUploadComplete?: (results: { success: boolean; fileName: string }[]) => void
  theme?: 'dark' | 'teal'
  portal?: string
}

export default function UploadWithFolderPicker({
  open,
  onClose,
  defaultRoute = 'admin/documents',
  accept = '.pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.zip',
  multiple = true,
  showToast,
  onUploadComplete,
  theme = 'dark',
  portal = 'admin',
}: UploadWithFolderPickerProps) {
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [step, setStep] = useState<'bucket' | 'confirm' | 'uploading'>('bucket')
  const pendingFilesRef = useRef<FileList | null>(null)

  const accentBg = theme === 'teal' ? 'bg-teal-600' : 'bg-brand-red'
  const accentHover = theme === 'teal' ? 'hover:bg-teal-700' : 'hover:bg-red-600'
  const accentBorder = theme === 'teal' ? 'border-teal-500/30' : 'border-brand-red/30'
  const accentBgLight = theme === 'teal' ? 'bg-teal-500/10' : 'bg-brand-red/10'
  const accentText = theme === 'teal' ? 'text-teal-400' : 'text-red-400'

  const selectedBucketData = BUCKET_OPTIONS.find(b => b.id === selectedBucket) || null

  const handleChooseFiles = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    if (multiple) input.multiple = true

    input.onchange = () => {
      const files = input.files
      if (!files || files.length === 0) return
      pendingFilesRef.current = files
      setStep('confirm')
    }
    input.click()
  }

  const handleConfirmUpload = async () => {
    const files = pendingFilesRef.current
    if (!files || files.length === 0 || !selectedBucket) {
      setStep('bucket')
      return
    }

    setStep('uploading')
    showToast?.(`Uploading ${files.length} file(s)...`, 'info')

    // Build route key from portal and bucket
    const routeKey = defaultRoute

    const results: { success: boolean; fileName: string }[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const result = await uploadFile(file, routeKey, {
        bucket: selectedBucket,
        portal,
      })
      results.push({ success: result.success, fileName: file.name })
    }

    const okCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    if (okCount > 0) {
      const bucketName = selectedBucketData?.name || selectedBucket
      showToast?.(`${okCount} file(s) uploaded to "${bucketName}"`, 'success')
    }
    if (failCount > 0) showToast?.(`${failCount} file(s) failed to upload`, 'error')

    onUploadComplete?.(results)
    pendingFilesRef.current = null
    setStep('bucket')
    onClose()
  }

  const handleCancelConfirm = () => {
    pendingFilesRef.current = null
    setStep('bucket')
  }

  const handleClose = () => {
    pendingFilesRef.current = null
    setStep('bucket')
    setSelectedBucket(null)
    setDropdownOpen(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Documents
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Select a storage repository, then choose files to upload</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bucket Selector */}
        <div className="px-4 pt-4 pb-2">
          <label className="text-xs font-medium text-gray-400 mb-2 block">Storage Repository</label>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-left transition-colors border ${
                selectedBucket
                  ? `${accentBgLight} ${accentBorder}`
                  : 'bg-white/[0.04] border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              {selectedBucketData ? (
                <div className="flex items-center gap-3">
                  <span className="text-lg">{selectedBucketData.icon}</span>
                  <div>
                    <span className="text-sm font-medium text-white block">{selectedBucketData.name}</span>
                    <span className="text-[11px] text-gray-500">{selectedBucketData.description}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Select a storage repository...</span>
                </div>
              )}
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#111] border border-white/[0.10] rounded-xl shadow-2xl z-50 max-h-[280px] overflow-y-auto">
                {BUCKET_OPTIONS.map(bucket => (
                  <button
                    key={bucket.key}
                    onClick={() => {
                      setSelectedBucket(bucket.id)
                      setDropdownOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.06] ${
                      selectedBucket === bucket.id ? `${accentBgLight}` : ''
                    }`}
                  >
                    <span className="text-base">{bucket.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-white block">{bucket.name}</span>
                      <span className="text-[10px] text-gray-500">{bucket.description}</span>
                    </div>
                    {selectedBucket === bucket.id && (
                      <span className={`text-xs ${accentText}`}>{'\u2713'}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected bucket info */}
        {selectedBucketData && (
          <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-base">{selectedBucketData.icon}</span>
              <span className="text-sm font-medium text-white">{selectedBucketData.name}</span>
              <span className="text-[10px] text-gray-500 ml-auto font-mono">{selectedBucketData.id}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 p-4 border-t border-white/[0.06] mt-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleChooseFiles}
            disabled={!selectedBucket}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${accentBg} ${accentHover}`}
          >
            <Upload className="w-4 h-4" />
            Choose Files & Upload
          </button>
        </div>

        {/* Confirmation Overlay */}
        {step === 'confirm' && pendingFilesRef.current && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl">
            <div className="w-full max-w-sm mx-6 bg-[#111] border border-white/[0.10] rounded-2xl shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${accentBgLight}`}>
                  <AlertTriangle className={`w-5 h-5 ${accentText}`} />
                </div>
                <h3 className="text-base font-semibold text-white">Confirm Upload</h3>
              </div>

              <p className="text-sm text-gray-300 mb-3">
                Are you sure you want to upload {pendingFilesRef.current.length === 1 ? 'this file' : `these ${pendingFilesRef.current.length} files`} to the selected repository?
              </p>

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] mb-1">
                <span className="text-base">{selectedBucketData?.icon}</span>
                <span className="text-sm font-medium text-white truncate">{selectedBucketData?.name}</span>
                <span className="text-[10px] text-gray-500 ml-auto font-mono">{selectedBucketData?.id}</span>
              </div>

              <div className="mb-5 mt-3 space-y-1 max-h-[120px] overflow-y-auto">
                {Array.from(pendingFilesRef.current).map((file, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    <FileText className="w-3 h-3 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="text-gray-600 shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelConfirm}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpload}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors ${accentBg} ${accentHover}`}
                >
                  <Upload className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Uploading Overlay */}
        {step === 'uploading' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-red border-t-transparent" />
              <p className="text-sm text-gray-400">Uploading files...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
