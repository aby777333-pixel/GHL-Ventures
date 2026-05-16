'use client'

/* ─────────────────────────────────────────────────────────────
   Document Upload Modal — Admin Documents

   Drag-and-drop / click-to-pick uploader for the admin Documents
   library. Accepts PDF, Word (.doc/.docx), Excel, plain text, and
   images (jpg/png/webp). Each file is uploaded to the private
   `ghl-documents` bucket (path: `admin-library/uploads/<file>`)
   and registered in `public.documents` with `is_template = false`
   so it shows up immediately in the existing Documents grid.

   The modal does NOT delete or modify existing rows — it only
   appends. Re-uploading the same filename overwrites the object
   (upsert) but inserts a fresh row, so version history stays
   linear.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import {
  Upload, X as XIcon, CheckCircle2, AlertTriangle, Loader2,
  FileText, Image as ImageIcon, File as FileIcon,
} from 'lucide-react'
import AdminModal, { ModalButton } from './AdminModal'
import { uploadFile } from '@/lib/supabase/storageService'
import { insertRow } from '@/lib/supabase/adminDataService'

const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.gif'
const MAX_BYTES = 50 * 1024 * 1024 // 50 MB — matches the bucket limit

type StagedFile = {
  id: string
  file: File
  title: string
  category: string
  tags: string
  description: string
  status: 'idle' | 'uploading' | 'done' | 'error'
  error?: string
}

const CATEGORY_OPTIONS = [
  'general',
  'acknowledgement',
  'agreement',
  'allotment',
  'certificate',
  'kyc',
  'report',
  'invoice',
  'compliance',
  'marketing',
  'spec',
]

function iconForMime(mime: string) {
  if (mime.startsWith('image/')) return ImageIcon
  if (mime === 'application/pdf') return FileText
  return FileIcon
}

function inferCategory(filename: string): string {
  const n = filename.toLowerCase()
  if (n.includes('acknowledg')) return 'acknowledgement'
  if (n.includes('allot'))      return 'allotment'
  if (n.includes('certif'))     return 'certificate'
  if (n.includes('agreement'))  return 'agreement'
  if (n.includes('invoice'))    return 'invoice'
  if (n.includes('kyc'))        return 'kyc'
  if (n.includes('report'))     return 'report'
  return 'general'
}

interface Props {
  open: boolean
  onClose: () => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  onUploaded?: () => void
}

export default function DocumentUploadModal({ open, onClose, showToast, onUploaded }: Props) {
  const [staged, setStaged] = useState<StagedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) {
      setStaged([])
      setDragging(false)
      setBusy(false)
    }
  }, [open])

  const addFiles = useCallback((list: FileList | File[]) => {
    const files = Array.from(list)
    const tooBig = files.filter(f => f.size > MAX_BYTES)
    if (tooBig.length > 0) {
      showToast(`${tooBig.length} file(s) exceed 50 MB and were skipped.`, 'warning')
    }
    const ok = files.filter(f => f.size <= MAX_BYTES)
    setStaged(prev => [
      ...prev,
      ...ok.map(file => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim(),
        category: inferCategory(file.name),
        tags: '',
        description: '',
        status: 'idle' as const,
      })),
    ])
  }, [showToast])

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.files) addFiles(e.target.files)
    // Reset so the same file can be re-picked after removal.
    e.target.value = ''
  }

  const onDrop: React.DragEventHandler = (e) => {
    e.preventDefault(); setDragging(false)
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files)
  }

  const removeStaged = (id: string) => {
    setStaged(prev => prev.filter(s => s.id !== id))
  }
  const updateStaged = (id: string, patch: Partial<StagedFile>) => {
    setStaged(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  const handleUpload = async () => {
    if (staged.length === 0) return
    setBusy(true)
    let okCount = 0
    let failCount = 0
    for (const item of staged) {
      if (item.status === 'done') { okCount++; continue }
      updateStaged(item.id, { status: 'uploading', error: undefined })
      try {
        const tagArr = item.tags.split(',').map(t => t.trim()).filter(Boolean)
        // Upload to the private ghl-documents bucket. Folder convention
        // matches the seeded reference library so the admin UI groups
        // uploads alongside the supplied samples.
        const up = await uploadFile(item.file, 'admin/documents', {
          bucket: 'ghl-documents',
          category: item.category,
          accessLevel: 'internal',
          isConfidential: false,
          tags: tagArr,
          description: item.description,
          trackRecord: false, // we insert into `documents` directly below
        })
        if (!up.success || !up.file?.path) {
          updateStaged(item.id, { status: 'error', error: up.error || 'Upload failed' })
          failCount++
          continue
        }

        // 2026-05-16: uploadFile() adds a timestamp prefix to the object name
        // (buildPath → `${ts}_${safe}`), so we MUST persist the actual returned
        // path. Hardcoding `admin/documents/<name>` left signed-URL generation
        // pointing at a non-existent object — the Image Library + Documents
        // grid preview silently failed for every uploaded image until this fix.
        const storedBucket = up.file.bucket || 'ghl-documents'
        const storedPath = up.file.path

        const inserted = await insertRow('documents', {
          title: item.title || item.file.name,
          file_url: `supabase://${storedBucket}/${storedPath}`,
          file_name: item.file.name,
          file_type: (item.file.name.split('.').pop() || 'bin').toLowerCase(),
          mime_type: item.file.type || 'application/octet-stream',
          file_size: item.file.size,
          category: item.category,
          tags: tagArr,
          version: 1,
          is_template: false,
          is_confidential: false,
          access_level: 'internal',
          status: 'active',
          owner_type: 'admin',
          description: item.description || null,
          metadata: {
            source: 'admin-upload',
            bucket: storedBucket,
            path: storedPath,
            original_filename: item.file.name,
          },
        })
        if (!inserted) {
          updateStaged(item.id, { status: 'error', error: 'Stored in bucket but registry insert failed' })
          failCount++
          continue
        }
        updateStaged(item.id, { status: 'done' })
        okCount++
      } catch (e: any) {
        updateStaged(item.id, { status: 'error', error: e?.message || 'unknown' })
        failCount++
      }
    }
    setBusy(false)
    if (okCount > 0) {
      showToast(`${okCount} file(s) uploaded${failCount ? ` (${failCount} failed)` : ''}.`, 'success')
      onUploaded?.()
      // 2026-05-15: broadcast so the Document Builder's Image Library and
      // any future library panels can refresh themselves without waiting
      // for the parent to re-render.
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ghl-library-uploaded', { detail: { count: okCount } }))
        }
      } catch { /* ignore */ }
    }
    if (failCount > 0 && okCount === 0) {
      showToast('Upload failed — see per-row errors.', 'error')
    }
  }

  const allDone = staged.length > 0 && staged.every(s => s.status === 'done')

  return (
    <AdminModal
      isOpen={open}
      onClose={onClose}
      title="Upload to Library"
      subtitle="Drop PDFs, Word docs, spreadsheets or images. Each file becomes a row in Admin → Documents."
      maxWidth="max-w-3xl"
      footer={
        <>
          <ModalButton onClick={onClose} disabled={busy}>{allDone ? 'Done' : 'Cancel'}</ModalButton>
          <ModalButton variant="primary" onClick={handleUpload} disabled={busy || staged.length === 0 || allDone}>
            {busy ? (<span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</span>)
                  : (<span className="inline-flex items-center gap-2"><Upload className="w-4 h-4" /> Upload {staged.length > 0 ? `(${staged.filter(s => s.status !== 'done').length})` : ''}</span>)}
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Drop zone */}
        <label
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-2 py-10 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
            dragging ? 'border-brand-red/60 bg-brand-red/5' : 'border-white/[0.12] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
          }`}
        >
          <Upload className="w-7 h-7 text-gray-400" />
          <div className="text-sm text-white">Drop files here or click to browse</div>
          <div className="text-[11px] text-gray-500">PDF, Word, Excel, CSV, Text, Images — up to 50&nbsp;MB each</div>
          <input type="file" accept={ACCEPT} multiple onChange={onPick} className="hidden" />
        </label>

        {/* Staged list */}
        {staged.length > 0 && (
          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
            {staged.map(s => {
              const Icon = iconForMime(s.file.type)
              return (
                <div key={s.id} className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${s.status === 'done' ? 'text-emerald-400' : s.status === 'error' ? 'text-red-400' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate">
                          <p className="text-sm text-white truncate">{s.file.name}</p>
                          <p className="text-[11px] text-gray-500">{(s.file.size / 1024).toFixed(0)} KB · {s.file.type || 'unknown'}</p>
                        </div>
                        <button onClick={() => removeStaged(s.id)} className="p-1 text-gray-500 hover:text-white" title="Remove from queue">
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Metadata row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                        <input value={s.title} onChange={e => updateStaged(s.id, { title: e.target.value })} placeholder="Title"
                          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40" />
                        <select value={s.category} onChange={e => updateStaged(s.id, { category: e.target.value })}
                          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red/40">
                          {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input value={s.tags} onChange={e => updateStaged(s.id, { tags: e.target.value })} placeholder="tags, comma, separated"
                          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40" />
                      </div>

                      {/* Status line */}
                      <div className="mt-2 text-[11px]">
                        {s.status === 'uploading' && (
                          <span className="inline-flex items-center gap-1.5 text-amber-300"><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</span>
                        )}
                        {s.status === 'done' && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-300"><CheckCircle2 className="w-3 h-3" /> Uploaded — visible in Documents list.</span>
                        )}
                        {s.status === 'error' && (
                          <span className="inline-flex items-center gap-1.5 text-red-300"><AlertTriangle className="w-3 h-3" /> {s.error}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminModal>
  )
}
