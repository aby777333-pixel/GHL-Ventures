'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, X, FileText, Image, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

interface FileUploaderProps {
  bucket: string
  folder?: string
  accept?: string
  maxSizeMB?: number
  multiple?: boolean
  onUploadComplete?: (files: UploadedFile[]) => void
  onError?: (error: string) => void
  className?: string
  label?: string
  description?: string
}

export interface UploadedFile {
  name: string
  path: string
  url: string
  size: number
  type: string
}

export default function FileUploader({
  bucket,
  folder = '',
  accept = '*/*',
  maxSizeMB = 10,
  multiple = false,
  onUploadComplete,
  onError,
  className = '',
  label = 'Upload Files',
  description = 'Drag & drop or click to select files',
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
    return <File className="w-5 h-5 text-gray-500" />
  }

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError(null)

    // Validate file sizes
    for (const file of Array.from(files)) {
      if (file.size > maxSizeBytes) {
        const errMsg = `${file.name} exceeds ${maxSizeMB}MB limit`
        setError(errMsg)
        onError?.(errMsg)
        return
      }
    }

    if (!isSupabaseConfigured()) {
      // Mock upload for demo mode
      const mockUploaded: UploadedFile[] = Array.from(files).map(f => ({
        name: f.name,
        path: `${folder}/${f.name}`,
        url: URL.createObjectURL(f),
        size: f.size,
        type: f.type,
      }))
      setUploadedFiles(prev => [...prev, ...mockUploaded])
      onUploadComplete?.(mockUploaded)
      return
    }

    setUploading(true)
    setProgress(0)

    const results: UploadedFile[] = []
    const fileArray = Array.from(files)

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = folder ? `${folder}/${timestamp}_${safeName}` : `${timestamp}_${safeName}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        const errMsg = `Failed to upload ${file.name}: ${uploadError.message}`
        setError(errMsg)
        onError?.(errMsg)
        continue
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

      results.push({
        name: file.name,
        path: filePath,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
      })

      setProgress(Math.round(((i + 1) / fileArray.length) * 100))
    }

    setUploading(false)
    setUploadedFiles(prev => [...prev, ...results])
    if (results.length > 0) onUploadComplete?.(results)
  }, [bucket, folder, maxSizeBytes, maxSizeMB, onUploadComplete, onError])

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={className}>
      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver ? 'border-brand-red bg-red-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={async () => {
          // Try native file picker (File System Access API)
          if ('showOpenFilePicker' in window) {
            try {
              const handles = await (window as any).showOpenFilePicker({ multiple })
              const picked: File[] = []
              for (let i = 0; i < handles.length; i++) picked.push(await handles[i].getFile())
              if (picked.length > 0) {
                const dt = new DataTransfer()
                for (let i = 0; i < picked.length; i++) dt.items.add(picked[i])
                handleFiles(dt.files)
              }
              return
            } catch (err: any) {
              if (err?.name === 'AbortError') return // User cancelled
            }
          }
          inputRef.current?.click()
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
            <p className="text-sm text-gray-600">Uploading… {progress}%</p>
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-red transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-500">{description}</p>
            <p className="text-xs text-gray-400">Max {maxSizeMB}MB per file</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {uploadedFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
