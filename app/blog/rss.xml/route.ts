import { getPublishedPosts, excerptOf } from '@/lib/blog/cmsService'

/* RSS 2.0 feed for the blog. `force-static` lets this be emitted by
   the static export for the Netlify mirror; on the droplet (a real
   next start server) the same handler is re-evaluated on rebuild. */
export const dynamic = 'force-static'
export const revalidate = 3600

const SITE_URL = 'https://ghlindiaventures.com'

function esc(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const posts = (await getPublishedPosts()).filter((p) => !p.noindex).slice(0, 50)
  const now = new Date().toUTCString()

  const items = posts.map((p) => {
    const url = p.canonical_url?.trim() || `${SITE_URL}/blog/${p.slug}`
    const pub = new Date(p.published_at || p.created_at).toUTCString()
    const category = p.blog_categories?.name || p.category
    return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${esc(excerptOf(p, 300))}</description>
      <dc:creator>${esc(p.blog_authors?.name || p.author || 'GHL India Ventures')}</dc:creator>${
      category ? `\n      <category>${esc(category)}</category>` : ''
    }${p.cover_image ? `\n      <enclosure url="${esc(p.cover_image)}" type="image/jpeg" />` : ''}
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>GHL India Ventures — Insights</title>
    <link>${SITE_URL}/blog</link>
    <description>Research and analysis on India's alternative investment landscape from GHL India Ventures, a SEBI-registered Category II AIF.</description>
    <language>en-IN</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
