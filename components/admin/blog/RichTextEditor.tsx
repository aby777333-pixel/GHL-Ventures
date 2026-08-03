'use client'

/* ─────────────────────────────────────────────────────────────
   Rich text editor for the blog CMS.

   Deliberately dependency-free (contentEditable + execCommand)
   rather than pulling a new editor package into a working build.
   Emits clean semantic HTML that the public .article-body styles
   already know how to render.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
// The editing surface reuses the public .article-body typography so what the
// author sees matches the published page. Imported here rather than in a
// layout so it loads in BOTH the admin portal and the standalone /cms console.
import '@/styles/blog.css'
import {
  Bold, Italic, Underline, List, ListOrdered, Link2, Quote, Table2,
  Image as ImageIcon, Video, Minus, Code2, Heading2, Heading3, Heading4,
  AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, Eraser, SquareCode,
  MousePointerClick, Eye,
} from 'lucide-react'

interface Props {
  value: string
  onChange: (html: string) => void
  onRequestMedia?: (insert: (url: string, alt: string) => void) => void
  placeholder?: string
  minHeight?: number
}

type Btn = {
  icon: React.ElementType
  title: string
  run: () => void
  active?: string
}

export default function RichTextEditor({
  value, onChange, onRequestMedia, placeholder = 'Start writing…', minHeight = 460,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [showSource, setShowSource] = useState(false)
  const [source, setSource] = useState(value)
  const skipSync = useRef(false)

  // Keep the contentEditable in sync when the value changes from the
  // outside (loading a post, restoring a revision) — but never while
  // the user is typing, which would reset the caret.
  useEffect(() => {
    if (skipSync.current) { skipSync.current = false; return }
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || ''
    setSource(value || '')
  }, [value])

  const emit = useCallback(() => {
    if (!ref.current) return
    skipSync.current = true
    onChange(ref.current.innerHTML)
  }, [onChange])

  const exec = useCallback((cmd: string, arg?: string) => {
    ref.current?.focus()
    try { document.execCommand(cmd, false, arg) } catch { /* unsupported command */ }
    emit()
  }, [emit])

  /** Insert arbitrary HTML at the caret. */
  const insertHtml = useCallback((html: string) => {
    ref.current?.focus()
    try {
      document.execCommand('insertHTML', false, html)
    } catch {
      if (ref.current) ref.current.innerHTML += html
    }
    emit()
  }, [emit])

  function addLink() {
    const url = window.prompt('Link URL (use /blog/some-slug for an internal link)')
    if (!url) return
    const clean = url.trim()
    const sel = window.getSelection()?.toString()
    if (!sel) {
      const text = window.prompt('Link text', clean) || clean
      const external = /^https?:\/\//i.test(clean) && !clean.includes('ghlindiaventures.com')
      insertHtml(`<a href="${clean}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`)
      return
    }
    exec('createLink', clean)
  }

  function addTable() {
    const cols = Math.max(1, Math.min(8, parseInt(window.prompt('Number of columns', '3') || '3', 10) || 3))
    const rows = Math.max(1, Math.min(30, parseInt(window.prompt('Number of body rows', '3') || '3', 10) || 3))
    const head = `<tr>${Array.from({ length: cols }).map((_, i) => `<th>Heading ${i + 1}</th>`).join('')}</tr>`
    const body = Array.from({ length: rows })
      .map(() => `<tr>${Array.from({ length: cols }).map(() => '<td>&nbsp;</td>').join('')}</tr>`).join('')
    insertHtml(`<table><thead>${head}</thead><tbody>${body}</tbody></table><p><br /></p>`)
  }

  function addImage() {
    if (onRequestMedia) {
      onRequestMedia((url, alt) => insertHtml(`<img src="${url}" alt="${alt || ''}" loading="lazy" />`))
      return
    }
    const url = window.prompt('Image URL')
    if (!url) return
    const alt = window.prompt('Alt text (for accessibility and SEO)') || ''
    insertHtml(`<img src="${url.trim()}" alt="${alt}" loading="lazy" />`)
  }

  function addVideo() {
    const url = window.prompt('YouTube or Vimeo URL')
    if (!url) return
    let embed = url.trim()
    const yt = embed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/)
    const vm = embed.match(/vimeo\.com\/(\d+)/)
    if (yt) embed = `https://www.youtube.com/embed/${yt[1]}`
    else if (vm) embed = `https://player.vimeo.com/video/${vm[1]}`
    insertHtml(`<iframe src="${embed}" title="Embedded video" allowfullscreen loading="lazy"></iframe><p><br /></p>`)
  }

  function addButton() {
    const label = window.prompt('Button label', 'Talk to our team')
    if (!label) return
    const href = window.prompt('Button link', '/contact') || '/contact'
    insertHtml(`<p><a class="btn" href="${href.trim()}">${label}</a></p>`)
  }

  function addCallout() {
    insertHtml('<blockquote><p>Key takeaway…</p></blockquote><p><br /></p>')
  }

  const groups: Btn[][] = [
    [
      { icon: Heading2, title: 'Heading 2', run: () => exec('formatBlock', '<h2>') },
      { icon: Heading3, title: 'Heading 3', run: () => exec('formatBlock', '<h3>') },
      { icon: Heading4, title: 'Heading 4', run: () => exec('formatBlock', '<h4>') },
    ],
    [
      { icon: Bold, title: 'Bold (Ctrl+B)', run: () => exec('bold') },
      { icon: Italic, title: 'Italic (Ctrl+I)', run: () => exec('italic') },
      { icon: Underline, title: 'Underline (Ctrl+U)', run: () => exec('underline') },
    ],
    [
      { icon: List, title: 'Bulleted list', run: () => exec('insertUnorderedList') },
      { icon: ListOrdered, title: 'Numbered list', run: () => exec('insertOrderedList') },
      { icon: Quote, title: 'Pull quote / callout', run: addCallout },
    ],
    [
      { icon: AlignLeft, title: 'Align left', run: () => exec('justifyLeft') },
      { icon: AlignCenter, title: 'Align centre', run: () => exec('justifyCenter') },
      { icon: AlignRight, title: 'Align right', run: () => exec('justifyRight') },
    ],
    [
      { icon: Link2, title: 'Insert link', run: addLink },
      { icon: ImageIcon, title: 'Insert image from media library', run: addImage },
      { icon: Video, title: 'Embed video', run: addVideo },
      { icon: Table2, title: 'Insert table', run: addTable },
      { icon: MousePointerClick, title: 'Insert button', run: addButton },
      { icon: Minus, title: 'Divider', run: () => insertHtml('<hr /><p><br /></p>') },
      { icon: Code2, title: 'Inline code', run: () => { const s = window.getSelection()?.toString(); if (s) insertHtml(`<code>${s}</code>`) } },
    ],
    [
      { icon: Undo2, title: 'Undo', run: () => exec('undo') },
      { icon: Redo2, title: 'Redo', run: () => exec('redo') },
      { icon: Eraser, title: 'Clear formatting', run: () => exec('removeFormat') },
    ],
  ]

  const words = String(value || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length

  return (
    <div className="rounded-xl border border-white/10 bg-[#101316] overflow-hidden">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-[#161A1D] sticky top-0 z-10">
        {groups.map((g, gi) => (
          <div key={gi} className="flex items-center gap-0.5 pr-1.5 mr-1 border-r border-white/10 last:border-0">
            {g.map(({ icon: Icon, title, run }) => (
              <button
                key={title}
                type="button"
                title={title}
                aria-label={title}
                onMouseDown={(e) => e.preventDefault()}
                onClick={run}
                disabled={showSource}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        ))}

        <button
          type="button"
          title={showSource ? 'Back to visual editor' : 'Edit HTML source'}
          onClick={() => {
            if (showSource) { onChange(source); skipSync.current = false }
            else setSource(value)
            setShowSource((s) => !s)
          }}
          className={`ml-auto px-2.5 h-8 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors ${
            showSource ? 'bg-brand-red text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          {showSource ? <Eye className="w-3.5 h-3.5" /> : <SquareCode className="w-3.5 h-3.5" />}
          {showSource ? 'Visual' : 'HTML'}
        </button>
      </div>

      {/* surface */}
      {showSource ? (
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onBlur={() => onChange(source)}
          spellCheck={false}
          style={{ minHeight }}
          className="w-full p-4 bg-[#0B090A] text-emerald-200 font-mono text-xs leading-relaxed resize-y focus:outline-none"
        />
      ) : (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          data-placeholder={placeholder}
          style={{ minHeight }}
          /* Deliberately NO `text-gray-*` utility here. globals.css has
             `[class*="bg-[#0"] [class*="text-gray-"] { color: rgba(255,255,255,.78) !important }`
             for the marketing site, and this white editing surface sits
             inside the console's `bg-[#0B090A]` shell — so a text-gray class
             made the author's own text white-on-white. The colour comes from
             `.cms-editor` in blog.css instead, which that selector cannot match. */
          className="cms-editor article-body w-full p-5 bg-white focus:outline-none overflow-y-auto"
        />
      )}

      <div className="flex items-center justify-between gap-4 px-3 py-2 border-t border-white/10 bg-[#161A1D] text-[11px] text-white/40">
        <span>{words.toLocaleString('en-IN')} words · ~{Math.max(1, Math.ceil(words / 220))} min read</span>
        <span>{showSource ? 'Editing raw HTML' : 'Paste from Word/Docs is cleaned on save'}</span>
      </div>

      <style jsx global>{`
        .cms-editor:empty::before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        .cms-editor { max-height: 70vh; }
      `}</style>
    </div>
  )
}

/** Strips Word/Docs cruft and anything unsafe before the HTML is saved. */
export function sanitizeEditorHtml(html: string): string {
  if (!html) return ''
  let out = html
    // drop script/style blocks entirely
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // strip inline event handlers and javascript: urls
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"')
    // Word / Google Docs leftovers
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
    .replace(/\sclass="Mso[^"]*"/gi, '')
    .replace(/\sstyle="[^"]*mso-[^"]*"/gi, '')
    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '')
    .replace(/<span[^>]*>\s*<\/span>/gi, '')
    // collapse empty paragraphs
    .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
    .trim()

  // make sure external links are safe
  out = out.replace(/<a\s+([^>]*href="https?:\/\/(?!(?:www\.)?ghlindiaventures\.com)[^"]*"[^>]*)>/gi, (m, attrs) => {
    let a = attrs
    if (!/target=/i.test(a)) a += ' target="_blank"'
    if (!/rel=/i.test(a)) a += ' rel="noopener noreferrer"'
    return `<a ${a}>`
  })

  return out
}
