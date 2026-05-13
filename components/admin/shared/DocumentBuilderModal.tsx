'use client'

/* ─────────────────────────────────────────────────────────────
   Document Builder — drag-to-reorder section editor

   Lets the admin compose an arbitrary document from typed blocks
   (heading, paragraph, key-value list, bullet list, image, signature
   line) and export the result as PDF (via jspdf) or Word .docx
   (via the `docx` library). The output has no GHL/Landmaxo
   branding — purely the content the admin entered, so it doubles
   as a generic letter / report builder.

   Blocks can be added, removed, and re-ordered via HTML5
   drag-and-drop. State is kept in memory only; if the admin
   wants to keep a draft they can re-open the modal in the same
   tab session (we stash state in sessionStorage on every change).
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus, Trash2, GripVertical, Download, Eye, Type, ListChecks,
  Heading1, AlignLeft, Image as ImageIcon, PenLine, FileText, Loader2,
  RefreshCw, Library,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  ImageRun,
} from 'docx'
import AdminModal, { ModalButton } from './AdminModal'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { getDownloadUrl } from '@/lib/supabase/storageService'
import { DOCUMENT_TEMPLATES, type DocumentKind } from '@/lib/admin/documentTemplates'

// ── Block model ─────────────────────────────────────────────────
type BlockKind = 'heading' | 'paragraph' | 'kv-list' | 'bullet-list' | 'image' | 'signature'

interface BaseBlock { id: string; kind: BlockKind }
interface HeadingBlock extends BaseBlock { kind: 'heading'; text: string; level: 1 | 2 | 3; align: 'left' | 'center' | 'right' }
interface ParagraphBlock extends BaseBlock { kind: 'paragraph'; text: string }
interface KvListBlock extends BaseBlock { kind: 'kv-list'; rows: { label: string; value: string }[] }
interface BulletListBlock extends BaseBlock { kind: 'bullet-list'; items: string[] }
interface ImageBlock extends BaseBlock { kind: 'image'; dataUrl: string; width: number; align: 'left' | 'center' | 'right' }
interface SignatureBlock extends BaseBlock { kind: 'signature'; labels: string[] } // two signature lines

type Block = HeadingBlock | ParagraphBlock | KvListBlock | BulletListBlock | ImageBlock | SignatureBlock

const STORAGE_KEY = 'ghl-admin-document-builder-draft-v1'

const blankBlock = (kind: BlockKind): Block => {
  const id = `b-${Math.random().toString(36).slice(2, 10)}`
  switch (kind) {
    case 'heading':     return { id, kind, text: 'Untitled heading', level: 1, align: 'center' }
    case 'paragraph':   return { id, kind, text: '' }
    case 'kv-list':     return { id, kind, rows: [{ label: 'Label', value: 'Value' }] }
    case 'bullet-list': return { id, kind, items: [''] }
    case 'image':       return { id, kind, dataUrl: '', width: 280, align: 'center' }
    case 'signature':   return { id, kind, labels: ['Authorised Signatory', 'Authorised Signatory'] }
  }
}

const blockPalette: { kind: BlockKind; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { kind: 'heading',     label: 'Heading',     icon: Heading1 },
  { kind: 'paragraph',   label: 'Paragraph',   icon: AlignLeft },
  { kind: 'kv-list',     label: 'Field List',  icon: ListChecks },
  { kind: 'bullet-list', label: 'Bullets',     icon: Type },
  { kind: 'image',       label: 'Image',       icon: ImageIcon },
  { kind: 'signature',   label: 'Signatures',  icon: PenLine },
]

interface Props {
  open: boolean
  onClose: () => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

interface LibraryImage {
  id: string
  title: string
  fileName: string
  url: string                       // resolved public OR signed URL
  bucket?: string | null
  path?: string | null
  thumbUrl?: string                 // same as url; UI uses <img>
}

export default function DocumentBuilderModal({ open, onClose, showToast }: Props) {
  const [docTitle, setDocTitle] = useState('Untitled Document')
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 'b-init-heading', kind: 'heading', text: 'Untitled Document', level: 1, align: 'center' },
    { id: 'b-init-para', kind: 'paragraph', text: '' },
  ])
  const [busy, setBusy] = useState<null | 'pdf' | 'docx' | 'preview'>(null)
  const dragId = useRef<string | null>(null)

  // ── Library ──────────────────────────────────────────────────────
  // Pulls uploaded images from public.documents on open and on Refresh.
  // The admin clicks (or drags) a tile to insert it into the canvas; the
  // image is fetched on demand and inlined as a base64 data URL so the
  // PDF / DOCX exporters can embed it without any further network call.
  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [insertingId, setInsertingId] = useState<string | null>(null)
  // Tracks which item is being dragged out of the library so canvas
  // can decide whether to handle an external-drop vs. a reorder-drop.
  const draggedLibraryImageRef = useRef<LibraryImage | null>(null)

  // Restore + autosave draft to sessionStorage.
  useEffect(() => {
    if (!open) return
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed?.blocks)) setBlocks(parsed.blocks)
        if (typeof parsed?.docTitle === 'string') setDocTitle(parsed.docTitle)
      }
    } catch { /* ignore */ }
  }, [open])

  useEffect(() => {
    if (!open) return
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ docTitle, blocks })) } catch { /* ignore */ }
  }, [open, docTitle, blocks])

  // ── Block ops ─────────────────────────────────────────────────
  const addBlock = (kind: BlockKind) => setBlocks(bs => [...bs, blankBlock(kind)])
  const removeBlock = (id: string) => setBlocks(bs => bs.filter(b => b.id !== id))
  const updateBlock = useCallback((id: string, patch: Partial<Block>) => {
    setBlocks(bs => bs.map(b => b.id === id ? ({ ...b, ...patch } as Block) : b))
  }, [])

  const onDragStart = (id: string) => { dragId.current = id }
  const onDragOver = (e: React.DragEvent) => { e.preventDefault() }
  const onDrop = (overId: string) => {
    // Library-image drag takes priority: insert a new Image block at the
    // drop target rather than reorder.
    const libImg = draggedLibraryImageRef.current
    if (libImg) {
      draggedLibraryImageRef.current = null
      void insertImageFromLibrary(libImg, overId)
      return
    }
    const fromId = dragId.current
    if (!fromId || fromId === overId) return
    setBlocks(bs => {
      const from = bs.findIndex(b => b.id === fromId)
      const to = bs.findIndex(b => b.id === overId)
      if (from < 0 || to < 0) return bs
      const next = bs.slice()
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    dragId.current = null
  }

  // ── Library loaders ───────────────────────────────────────────
  const loadLibrary = useCallback(async () => {
    if (!isSupabaseConfigured()) { setLibraryImages([]); return }
    setLibraryLoading(true)
    try {
      const sb: any = supabase
      const { data, error } = await sb
        .from('documents')
        .select('id, title, file_name, file_url, mime_type, metadata')
        .or('mime_type.ilike.image/%,file_type.ilike.png,file_type.ilike.jpg,file_type.ilike.jpeg,file_type.ilike.webp,file_type.ilike.gif')
        .eq('is_template', false)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) {
        console.warn('[DocumentBuilder] library load:', error.message)
        setLibraryImages([])
        return
      }
      // Resolve each row to a usable URL (signed for private buckets).
      const out: LibraryImage[] = []
      for (const raw of (data || []) as any[]) {
        const meta = raw?.metadata && typeof raw.metadata === 'object' ? raw.metadata : {}
        const bucket: string | null = meta.bucket || null
        const path: string | null = meta.path || null
        let url = String(raw.file_url || '')
        if (!url.startsWith('https://') && bucket && path) {
          const res = await getDownloadUrl(path, bucket)
          if (res.success && res.url) url = res.url
        }
        if (!url || !url.startsWith('http')) continue
        out.push({
          id: raw.id,
          title: raw.title || raw.file_name || 'Untitled',
          fileName: raw.file_name || 'image',
          url,
          bucket,
          path,
          thumbUrl: url,
        })
      }
      setLibraryImages(out)
    } catch (e: any) {
      console.warn('[DocumentBuilder] library load error:', e?.message || e)
      setLibraryImages([])
    } finally {
      setLibraryLoading(false)
    }
  }, [])

  useEffect(() => { if (open) loadLibrary() }, [open, loadLibrary])

  // ── Library actions ───────────────────────────────────────────
  // Fetches the chosen image and converts to a data URL so the exporters
  // can embed it without another network hop. The fetch is CORS-friendly
  // — Supabase storage sets `Access-Control-Allow-Origin: *` on object URLs.
  const fetchAsDataUrl = async (url: string): Promise<string> => {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const blob = await resp.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Read failed'))
      reader.readAsDataURL(blob)
    })
  }

  const insertImageFromLibrary = useCallback(async (img: LibraryImage, anchorId?: string | null) => {
    setInsertingId(img.id)
    try {
      const dataUrl = await fetchAsDataUrl(img.url)
      setBlocks(bs => {
        const block: ImageBlock = {
          id: `b-${Math.random().toString(36).slice(2, 10)}`,
          kind: 'image',
          dataUrl,
          width: 320,
          align: 'center',
        }
        if (!anchorId) return [...bs, block]
        const idx = bs.findIndex(b => b.id === anchorId)
        if (idx < 0) return [...bs, block]
        const next = bs.slice()
        next.splice(idx + 1, 0, block)
        return next
      })
      showToast(`Inserted "${img.title}".`, 'success')
    } catch (e: any) {
      showToast(`Could not insert image: ${e?.message || 'fetch failed'}`, 'error')
    } finally {
      setInsertingId(null)
    }
  }, [showToast])

  // Field templates — drop a Heading + KV List block pair sourced from
  // DOCUMENT_TEMPLATES so the admin doesn't have to type the placeholder
  // table from scratch.
  const insertFieldTemplate = useCallback((kind: DocumentKind) => {
    const t = DOCUMENT_TEMPLATES[kind]
    if (!t) return
    setBlocks(bs => ([
      ...bs,
      { id: `b-${Math.random().toString(36).slice(2, 10)}`, kind: 'heading', text: t.headline, level: 1, align: 'center' },
      { id: `b-${Math.random().toString(36).slice(2, 10)}`, kind: 'kv-list', rows: t.fields.map(f => ({ label: f.label, value: `{{${f.key}}}` })) },
    ]))
    showToast(`Added ${t.title} template fields.`, 'success')
  }, [showToast])

  // ── Export: PDF ──────────────────────────────────────────────
  const renderPdfBlob = (): Blob => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 56
    let y = margin

    const ensureSpace = (h: number) => {
      if (y + h > pageH - margin) { doc.addPage(); y = margin }
    }

    for (const b of blocks) {
      if (b.kind === 'heading') {
        const size = b.level === 1 ? 18 : b.level === 2 ? 14 : 12
        doc.setFont('helvetica', 'bold').setFontSize(size)
        const lines = doc.splitTextToSize(b.text || '', pageW - margin * 2)
        const lineH = size + 4
        ensureSpace(lines.length * lineH + 6)
        for (const line of lines) {
          const x = b.align === 'center' ? pageW / 2 : b.align === 'right' ? pageW - margin : margin
          doc.text(line, x, y, { align: b.align })
          y += lineH
        }
        y += 6
      } else if (b.kind === 'paragraph') {
        doc.setFont('helvetica', 'normal').setFontSize(11)
        const lines = doc.splitTextToSize(b.text || '', pageW - margin * 2)
        for (const line of lines) {
          ensureSpace(16)
          doc.text(line, margin, y)
          y += 14
        }
        y += 6
      } else if (b.kind === 'kv-list') {
        doc.setFontSize(11)
        for (const row of b.rows) {
          ensureSpace(20)
          doc.setFont('helvetica', 'bold')
          doc.text(`${row.label}:`, margin, y)
          doc.setFont('helvetica', 'normal')
          const valLines = doc.splitTextToSize(row.value || '', pageW - margin - (margin + 180))
          doc.text(valLines, margin + 180, y)
          y += Math.max(20, valLines.length * 14)
        }
        y += 6
      } else if (b.kind === 'bullet-list') {
        doc.setFont('helvetica', 'normal').setFontSize(11)
        for (const item of b.items) {
          const lines = doc.splitTextToSize(item || '', pageW - margin * 2 - 16)
          ensureSpace(lines.length * 14 + 4)
          for (let i = 0; i < lines.length; i++) {
            doc.text(i === 0 ? '•  ' + lines[i] : '   ' + lines[i], margin, y)
            y += 14
          }
        }
        y += 6
      } else if (b.kind === 'image' && b.dataUrl) {
        ensureSpace(b.width * 0.6 + 12)
        const x = b.align === 'center' ? (pageW - b.width) / 2 : b.align === 'right' ? pageW - margin - b.width : margin
        try {
          // jspdf accepts a data URL directly. Height auto-scales from a square box.
          doc.addImage(b.dataUrl, 'PNG', x, y, b.width, b.width * 0.6, undefined, 'FAST')
        } catch { /* ignore — broken image */ }
        y += b.width * 0.6 + 12
      } else if (b.kind === 'signature') {
        ensureSpace(40)
        const halves = b.labels.slice(0, 2)
        const x1 = margin
        const x2 = pageW / 2 + 10
        doc.setFontSize(11)
        doc.line(x1, y, x1 + 180, y)
        if (halves[1]) doc.line(x2, y, x2 + 180, y)
        y += 14
        doc.text(halves[0] || '', x1, y)
        if (halves[1]) doc.text(halves[1], x2, y)
        y += 20
      }
    }

    return doc.output('blob')
  }

  // ── Export: Word ──────────────────────────────────────────────
  const renderDocxBlob = async (): Promise<Blob> => {
    const children: any[] = []
    const headingLevelMap: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
      1: HeadingLevel.HEADING_1,
      2: HeadingLevel.HEADING_2,
      3: HeadingLevel.HEADING_3,
    }

    for (const b of blocks) {
      if (b.kind === 'heading') {
        children.push(new Paragraph({
          text: b.text || '',
          heading: headingLevelMap[b.level],
          alignment: b.align === 'center' ? AlignmentType.CENTER : b.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
        }))
      } else if (b.kind === 'paragraph') {
        // Preserve newlines by splitting into multiple paragraphs.
        const parts = (b.text || '').split('\n')
        for (const part of parts) children.push(new Paragraph({ children: [new TextRun(part)] }))
      } else if (b.kind === 'kv-list') {
        for (const row of b.rows) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: `${row.label}: `, bold: true }),
              new TextRun({ text: row.value || '' }),
            ],
          }))
        }
      } else if (b.kind === 'bullet-list') {
        for (const item of b.items) {
          children.push(new Paragraph({ text: item || '', bullet: { level: 0 } }))
        }
      } else if (b.kind === 'image' && b.dataUrl) {
        try {
          const base64 = b.dataUrl.split(',')[1] || ''
          const bin = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
          children.push(new Paragraph({
            children: [new ImageRun({
              data: bin,
              transformation: { width: b.width, height: Math.round(b.width * 0.6) },
            } as any)],
            alignment: b.align === 'center' ? AlignmentType.CENTER : b.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
          }))
        } catch { /* ignore */ }
      } else if (b.kind === 'signature') {
        children.push(new Paragraph({ text: '' }))
        children.push(new Paragraph({ text: '_________________________            _________________________' }))
        children.push(new Paragraph({ text: `${b.labels[0] || ''}                                  ${b.labels[1] || ''}` }))
      }
    }

    const doc = new Document({
      creator: 'GHL India Ventures Admin',
      title: docTitle,
      sections: [{ properties: {}, children }],
    })

    return await Packer.toBlob(doc)
  }

  const safeName = useMemo(() => (docTitle || 'document').replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-'), [docTitle])

  const downloadBlob = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeName}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  const handlePreview = () => {
    try {
      setBusy('preview')
      const blob = renderPdfBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e: any) {
      showToast(`Preview failed: ${e?.message || 'unknown'}`, 'error')
    } finally { setBusy(null) }
  }

  const handleExportPdf = () => {
    try {
      setBusy('pdf')
      const blob = renderPdfBlob()
      downloadBlob(blob, 'pdf')
      showToast('PDF downloaded.', 'success')
    } catch (e: any) {
      showToast(`PDF export failed: ${e?.message || 'unknown'}`, 'error')
    } finally { setBusy(null) }
  }

  const handleExportDocx = async () => {
    try {
      setBusy('docx')
      const blob = await renderDocxBlob()
      downloadBlob(blob, 'docx')
      showToast('Word document downloaded.', 'success')
    } catch (e: any) {
      showToast(`Word export failed: ${e?.message || 'unknown'}`, 'error')
    } finally { setBusy(null) }
  }

  return (
    <AdminModal
      isOpen={open}
      onClose={onClose}
      title="Document Builder"
      subtitle="Drag blocks to reorder. Export as PDF or Word — no logos or pre-filled data added."
      maxWidth="max-w-5xl"
      footer={
        <>
          <ModalButton onClick={onClose} disabled={!!busy}>Close</ModalButton>
          <ModalButton onClick={handlePreview} disabled={!!busy}>
            {busy === 'preview' ? (<span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Rendering…</span>)
                                : (<span className="inline-flex items-center gap-2"><Eye className="w-4 h-4" /> Preview PDF</span>)}
          </ModalButton>
          <ModalButton onClick={handleExportDocx} disabled={!!busy}>
            {busy === 'docx' ? (<span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating…</span>)
                             : (<span className="inline-flex items-center gap-2"><Download className="w-4 h-4" /> Export .docx</span>)}
          </ModalButton>
          <ModalButton variant="primary" onClick={handleExportPdf} disabled={!!busy}>
            {busy === 'pdf' ? (<span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating…</span>)
                            : (<span className="inline-flex items-center gap-2"><FileText className="w-4 h-4" /> Export PDF</span>)}
          </ModalButton>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        {/* Block palette + Library */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 px-1">Add Block</div>
          {blockPalette.map(p => {
            const Icon = p.icon
            return (
              <button key={p.kind} onClick={() => addBlock(p.kind)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-gray-300 hover:bg-white/[0.08] hover:text-white transition-colors">
                <Icon className="w-3.5 h-3.5" /> {p.label}
              </button>
            )
          })}

          {/* Field Templates — click to drop a ready-made Heading + Field
              List for one of the four known document kinds. */}
          <div className="pt-3 border-t border-white/[0.06]">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 px-1 mb-1.5">Field Templates</div>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(DOCUMENT_TEMPLATES) as DocumentKind[]).map(k => (
                <button
                  key={k}
                  onClick={() => insertFieldTemplate(k)}
                  className="px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-medium text-amber-200 hover:bg-amber-500/20 transition-colors text-left"
                  title={`Insert ${DOCUMENT_TEMPLATES[k].title} fields`}
                >
                  {DOCUMENT_TEMPLATES[k].title.replace(' Letter', '').replace('Debenture ', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Image Library — pulled from uploaded documents (mime image/*). */}
          <div className="pt-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Library className="w-3 h-3" /> Image Library
              </div>
              <button
                onClick={loadLibrary}
                disabled={libraryLoading}
                className="text-[10px] text-gray-500 hover:text-white inline-flex items-center gap-1 disabled:opacity-50"
                title="Refresh library"
              >
                {libraryLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              </button>
            </div>
            {libraryLoading && libraryImages.length === 0 ? (
              <div className="text-[10px] text-gray-500 px-1 py-2">Loading…</div>
            ) : libraryImages.length === 0 ? (
              <div className="text-[10px] text-gray-500 px-1 py-2">No images uploaded yet. Use <span className="text-amber-300">Upload to Library</span> to add some.</div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {libraryImages.map(img => (
                  <button
                    key={img.id}
                    draggable
                    onDragStart={(e) => {
                      draggedLibraryImageRef.current = img
                      // Hide the reorder semantic during this drag.
                      dragId.current = null
                      try { e.dataTransfer.setData('text/plain', img.id) } catch { /* ignore */ }
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    onDragEnd={() => { draggedLibraryImageRef.current = null }}
                    onClick={() => insertImageFromLibrary(img)}
                    disabled={insertingId === img.id}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-white/[0.08] bg-white/[0.04] hover:border-brand-red/40 transition-colors disabled:opacity-60"
                    title={`${img.title}\n${img.fileName}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.thumbUrl} alt={img.title} className="w-full h-full object-cover" />
                    {insertingId === img.id && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      </span>
                    )}
                    <span className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 text-[9px] text-white bg-black/60 truncate">{img.title}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[9px] text-gray-600 px-1 mt-1.5">Click or drag onto the canvas.</p>
          </div>

          <div className="pt-3 border-t border-white/[0.06]">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 px-1 mb-1.5">Title (file name)</div>
            <input value={docTitle} onChange={e => setDocTitle(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red/40" />
          </div>
        </div>

        {/* Canvas */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {blocks.length === 0 && (
            <div className="py-10 rounded-xl border-2 border-dashed border-white/[0.08] text-center text-sm text-gray-500">
              No blocks yet — add one from the panel on the left.
            </div>
          )}
          {blocks.map(b => (
            <div
              key={b.id}
              draggable
              onDragStart={() => onDragStart(b.id)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(b.id)}
              className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3"
            >
              <div className="flex items-start gap-2">
                <span title="Drag to reorder" className="mt-1"><GripVertical className="w-4 h-4 text-gray-500 cursor-grab" /></span>
                <div className="flex-1">
                  <BlockEditor block={b} onChange={(patch) => updateBlock(b.id, patch)} />
                </div>
                <button onClick={() => removeBlock(b.id)} className="p-1 text-gray-500 hover:text-red-300" title="Remove block">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <div className="pt-1">
            <button onClick={() => addBlock('paragraph')} className="inline-flex items-center gap-1.5 text-[11px] text-brand-red hover:underline">
              <Plus className="w-3 h-3" /> Add paragraph
            </button>
          </div>
        </div>
      </div>
    </AdminModal>
  )
}

// ── Per-block editors ────────────────────────────────────────────
function BlockEditor({ block, onChange }: { block: Block; onChange: (patch: Partial<Block>) => void }) {
  const input = 'w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40'

  if (block.kind === 'heading') {
    return (
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">Heading</div>
        <input value={block.text} onChange={e => onChange({ text: e.target.value } as any)} className={input + ' text-sm font-semibold'} placeholder="Heading text" />
        <div className="flex gap-2 text-[11px]">
          <select value={String(block.level)} onChange={e => onChange({ level: Number(e.target.value) as 1 | 2 | 3 } as any)} className={input + ' max-w-[100px]'}>
            <option value="1">H1</option><option value="2">H2</option><option value="3">H3</option>
          </select>
          <select value={block.align} onChange={e => onChange({ align: e.target.value as any } as any)} className={input + ' max-w-[120px]'}>
            <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
          </select>
        </div>
      </div>
    )
  }

  if (block.kind === 'paragraph') {
    return (
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">Paragraph</div>
        <textarea value={block.text} onChange={e => onChange({ text: e.target.value } as any)} rows={3} placeholder="Write your paragraph…" className={input + ' resize-none font-mono text-[12px]'} />
      </div>
    )
  }

  if (block.kind === 'kv-list') {
    return (
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">Field List</div>
        <div className="space-y-1.5">
          {block.rows.map((row, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input value={row.label} onChange={e => onChange({ rows: block.rows.map((r, j) => j === i ? { ...r, label: e.target.value } : r) } as any)} placeholder="Label" className={input} />
              <input value={row.value} onChange={e => onChange({ rows: block.rows.map((r, j) => j === i ? { ...r, value: e.target.value } : r) } as any)} placeholder="Value" className={input} />
            </div>
          ))}
        </div>
        <div className="flex gap-2 text-[11px]">
          <button onClick={() => onChange({ rows: [...block.rows, { label: '', value: '' }] } as any)} className="text-brand-red hover:underline">+ Add field</button>
          {block.rows.length > 1 && <button onClick={() => onChange({ rows: block.rows.slice(0, -1) } as any)} className="text-gray-400 hover:text-white">Remove last</button>}
        </div>
      </div>
    )
  }

  if (block.kind === 'bullet-list') {
    return (
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">Bullet List</div>
        <div className="space-y-1.5">
          {block.items.map((item, i) => (
            <input key={i} value={item} onChange={e => onChange({ items: block.items.map((v, j) => j === i ? e.target.value : v) } as any)} placeholder={`Item ${i + 1}`} className={input} />
          ))}
        </div>
        <div className="flex gap-2 text-[11px]">
          <button onClick={() => onChange({ items: [...block.items, ''] } as any)} className="text-brand-red hover:underline">+ Add item</button>
          {block.items.length > 1 && <button onClick={() => onChange({ items: block.items.slice(0, -1) } as any)} className="text-gray-400 hover:text-white">Remove last</button>}
        </div>
      </div>
    )
  }

  if (block.kind === 'image') {
    return (
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">Image</div>
        {!block.dataUrl ? (
          <label className="flex flex-col items-center justify-center gap-1 py-6 border border-dashed border-white/[0.12] rounded-lg cursor-pointer hover:bg-white/[0.03]">
            <ImageIcon className="w-5 h-5 text-gray-500" />
            <div className="text-[11px] text-gray-400">Click to pick an image (PNG/JPG)</div>
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              const reader = new FileReader()
              reader.onload = () => onChange({ dataUrl: String(reader.result) } as any)
              reader.readAsDataURL(f)
            }} />
          </label>
        ) : (
          <>
            <img src={block.dataUrl} alt="" className="max-h-40 rounded-lg border border-white/[0.08]" />
            <div className="flex gap-2 text-[11px]">
              <label className="bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1 text-gray-300 cursor-pointer hover:text-white">
                Replace
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const reader = new FileReader()
                  reader.onload = () => onChange({ dataUrl: String(reader.result) } as any)
                  reader.readAsDataURL(f)
                }} />
              </label>
              <button onClick={() => onChange({ dataUrl: '' } as any)} className="text-gray-400 hover:text-white">Clear</button>
              <select value={block.align} onChange={e => onChange({ align: e.target.value as any } as any)} className={input + ' max-w-[120px]'}>
                <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
              </select>
              <input type="number" min={120} max={600} value={block.width} onChange={e => onChange({ width: Math.max(120, Math.min(600, Number(e.target.value) || 280)) } as any)} className={input + ' max-w-[120px]'} placeholder="Width px" />
            </div>
          </>
        )}
      </div>
    )
  }

  if (block.kind === 'signature') {
    return (
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">Signatures</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {block.labels.map((label, i) => (
            <input key={i} value={label} onChange={e => onChange({ labels: block.labels.map((v, j) => j === i ? e.target.value : v) } as any)} placeholder={`Signatory ${i + 1}`} className={input} />
          ))}
        </div>
      </div>
    )
  }

  return null
}
