'use client'

/* Reusable media library — rendered as a full tab in the CMS and as
   a picker modal from the editor / cover-image fields. */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Upload, Trash2, Copy, Check, Search, X, Loader2, ImageIcon, FileText, Info,
} from 'lucide-react'
import {
  listMedia, uploadMedia, deleteMedia, updateMediaAlt, type MediaItem,
} from '@/lib/blog/adminService'

const FOLDERS = ['all', 'general', 'covers', 'inline', 'reports', 'migrated'] as const

interface Props {
  mode?: 'page' | 'picker'
  accept?: string
  onPick?: (url: string, alt: string) => void
  onClose?: () => void
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void
}

function prettySize(n?: number | null) {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export default function MediaLibrary({
  mode = 'page', accept = 'image/*', onPick, onClose, showToast,
}: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [folder, setFolder] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [editingAlt, setEditingAlt] = useState<string | null>(null)
  const [altDraft, setAltDraft] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const toast = useCallback((m: string, t: 'success' | 'error' | 'info' = 'info') => {
    if (showToast) showToast(m, t)
  }, [showToast])

  const reload = useCallback(async () => {
    setLoading(true)
    setItems(await listMedia(folder))
    setLoading(false)
  }, [folder])

  useEffect(() => { reload() }, [reload])

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    let okCount = 0
    for (const file of Array.from(files)) {
      if (file.size > 25 * 1024 * 1024) { toast(`${file.name} is over 25 MB — skipped.`, 'error'); continue }
      const target = folder === 'all' ? 'general' : folder
      const res = await uploadMedia(file, target)
      if (res.ok) okCount++
      else toast(`${file.name}: ${res.message}`, 'error')
    }
    setBusy(false)
    if (okCount) toast(`${okCount} file${okCount === 1 ? '' : 's'} uploaded.`, 'success')
    if (fileRef.current) fileRef.current.value = ''
    reload()
  }

  async function remove(item: MediaItem) {
    if (!window.confirm(`Delete “${item.file_name}” permanently? Any article still using it will show a broken image.`)) return
    const res = await deleteMedia(item)
    toast(res.ok ? 'File deleted.' : (res.message || 'Delete failed.'), res.ok ? 'success' : 'error')
    if (res.ok) reload()
  }

  async function saveAlt(item: MediaItem) {
    const res = await updateMediaAlt(item.id, altDraft)
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, alt_text: altDraft } : i)))
      toast('Alt text saved.', 'success')
    } else toast(res.message || 'Could not save alt text.', 'error')
    setEditingAlt(null)
  }

  function copyUrl(url: string) {
    navigator.clipboard?.writeText(url).then(
      () => { setCopied(url); setTimeout(() => setCopied(null), 1800) },
      () => toast('Could not copy — select the URL manually.', 'error'),
    )
  }

  const filtered = items.filter((i) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return i.file_name.toLowerCase().includes(q) || (i.alt_text || '').toLowerCase().includes(q)
  })

  const body = (
    <>
      {/* toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-red"
          />
        </div>
        <select
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-red"
        >
          {FOLDERS.map((f) => <option key={f} value={f} className="bg-[#161A1D]">{f === 'all' ? 'All folders' : f}</option>)}
        </select>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-brand-red hover:bg-brand-red-deep disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-white/10">
          <ImageIcon className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50 mb-4">No files here yet.</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm font-semibold text-brand-red hover:underline"
          >
            Upload your first file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filtered.map((item) => {
            const isImage = (item.mime_type || '').startsWith('image/')
            return (
              <div key={item.id} className="group rounded-xl border border-white/10 bg-white/5 overflow-hidden flex flex-col">
                <button
                  type="button"
                  onClick={() => (mode === 'picker' && onPick ? onPick(item.public_url, item.alt_text || '') : copyUrl(item.public_url))}
                  className="aspect-square bg-[#0B090A] relative overflow-hidden"
                  title={mode === 'picker' ? 'Insert this file' : 'Copy URL'}
                >
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.public_url} alt={item.alt_text || item.file_name} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/40">
                      <FileText className="w-8 h-8" />
                      <span className="text-[10px] uppercase tracking-wider">
                        {(item.mime_type || 'file').split('/').pop()}
                      </span>
                    </div>
                  )}
                  {mode === 'picker' && (
                    <span className="absolute inset-0 bg-brand-red/0 group-hover:bg-brand-red/25 transition-colors" />
                  )}
                </button>

                <div className="p-2 flex-1 flex flex-col gap-1.5">
                  <p className="text-[11px] text-white/70 truncate" title={item.file_name}>{item.file_name}</p>

                  {editingAlt === item.id ? (
                    <div className="flex gap-1">
                      <input
                        autoFocus
                        value={altDraft}
                        onChange={(e) => setAltDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveAlt(item); if (e.key === 'Escape') setEditingAlt(null) }}
                        placeholder="Alt text"
                        className="flex-1 min-w-0 px-1.5 py-1 rounded bg-white/10 border border-white/15 text-[10px] text-white focus:outline-none focus:border-brand-red"
                      />
                      <button type="button" onClick={() => saveAlt(item)} className="p-1 text-emerald-400" title="Save">
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setEditingAlt(item.id); setAltDraft(item.alt_text || '') }}
                      className="text-left text-[10px] text-white/35 hover:text-white/70 truncate transition-colors"
                      title="Edit alt text (used for accessibility and SEO)"
                    >
                      {item.alt_text || 'Add alt text…'}
                    </button>
                  )}

                  <div className="flex items-center justify-between gap-1 mt-auto pt-1">
                    <span className="text-[10px] text-white/25">{prettySize(item.file_size)}</span>
                    <div className="flex items-center gap-0.5">
                      <button type="button" onClick={() => copyUrl(item.public_url)} title="Copy URL"
                        className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                        {copied === item.public_url ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button type="button" onClick={() => remove(item)} title="Delete"
                        className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {mode === 'page' && (
        <p className="mt-5 text-[11px] text-white/30 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
          Files are stored in the public <code className="text-white/50">ghl-media</code> bucket and served with a
          one-year cache header. Images are lazy-loaded on the public site.
        </p>
      )}
    </>
  )

  if (mode === 'picker') {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Media library">
        <div className="bg-[#161A1D] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
          <div className="flex items-center justify-between gap-4 p-4 border-b border-white/10">
            <h2 className="text-sm font-bold text-white">Media library</h2>
            <button onClick={onClose} aria-label="Close"
              className="p-1.5 rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto">{body}</div>
        </div>
      </div>
    )
  }

  return <div>{body}</div>
}
