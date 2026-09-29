'use client'

/* Renders CMS article content for every content_format the CMS
   supports. `paragraphs` reproduces the exact markup the legacy
   pages used, so migrated posts render identically to before. */

import { useMemo } from 'react'

interface Props {
  content: string | null | undefined
  format?: 'html' | 'markdown' | 'paragraphs' | 'component'
  className?: string
}

/** Wrap bare <table> in a scroll container so wide tables never
 *  force the page to scroll sideways on a phone. */
function prepareHtml(html: string): string {
  return demoteH1(html).replace(
    /<table(?![^>]*data-wrapped)/gi,
    '<div class="table-scroll"><table data-wrapped="1"',
  ).replace(/<\/table>/gi, '</table></div>')
}

/** The article page already renders the post title as the page's one <h1>.
 *  Content pasted into the CMS (often straight from ChatGPT) brings its own
 *  <h1>s, giving the page 2–3 of them (Pulse: H1_MULTIPLE). Render those as
 *  <h2 class="article-h1">; blog.css styles that class exactly as the body
 *  <h1> looked, so nothing changes visually. Our class goes first so it
 *  wins over any class="" the pasted tag already carries. */
function demoteH1(html: string): string {
  return html
    .replace(/<h1(?=[\s>])/gi, '<h2 class="article-h1"')
    .replace(/<\/h1\s*>/gi, '</h2>')
}

/** Minimal, dependency-free markdown → HTML for the subset the
 *  editor can emit. Full articles are authored as HTML; markdown
 *  exists as an escape hatch for pasted content. */
function markdownToHtml(md: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const lines = md.split(/\r?\n/)
  const out: string[] = []
  let inList: 'ul' | 'ol' | null = null
  const closeList = () => { if (inList) { out.push(`</${inList}>`); inList = null } }

  const inline = (s: string) => esc(s)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img alt="$1" src="$2" loading="lazy" />')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) { closeList(); continue }
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) { closeList(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue }
    if (/^>\s?/.test(line)) { closeList(); out.push(`<blockquote><p>${inline(line.replace(/^>\s?/, ''))}</p></blockquote>`); continue }
    if (/^([-*+])\s+/.test(line)) {
      if (inList !== 'ul') { closeList(); out.push('<ul>'); inList = 'ul' }
      out.push(`<li>${inline(line.replace(/^([-*+])\s+/, ''))}</li>`); continue
    }
    if (/^\d+\.\s+/.test(line)) {
      if (inList !== 'ol') { closeList(); out.push('<ol>'); inList = 'ol' }
      out.push(`<li>${inline(line.replace(/^\d+\.\s+/, ''))}</li>`); continue
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { closeList(); out.push('<hr />'); continue }
    closeList()
    out.push(`<p>${inline(line)}</p>`)
  }
  closeList()
  return out.join('\n')
}

export default function ArticleBody({ content, format = 'html', className = '' }: Props) {
  const body = content || ''

  // Legacy plain-text posts: identical markup to the pre-CMS renderer.
  const paragraphs = useMemo(
    () => (format === 'paragraphs' ? body.split(/\n{2,}|\n/).filter((p) => p.trim()) : []),
    [body, format],
  )

  const html = useMemo(() => {
    if (format === 'paragraphs' || format === 'component') return ''
    if (format === 'markdown') return prepareHtml(markdownToHtml(body))
    return prepareHtml(body)
  }, [body, format])

  if (format === 'paragraphs') {
    return (
      <div className={`article-body ${className}`}>
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    )
  }

  return (
    <div
      className={`article-body ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
