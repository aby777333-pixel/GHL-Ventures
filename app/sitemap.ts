import type { MetadataRoute } from 'next'
import {
  getPublishedPosts, getCategories, getTags, getAuthors, getReports,
} from '@/lib/blog/cmsService'
import { FUND_ARTICLES } from '@/lib/constants'

const SITE_URL = 'https://ghlindiaventures.com'

/* Regenerated hourly on the droplet so newly published articles enter
   the sitemap without a deploy. Ignored by the static export. */
export const revalidate = 3600

/* Replaces the hand-maintained public/sitemap.xml, which had gone
   stale (16 URLs) and — worse — pointed every <loc> at the
   ghl-india-ventures-2025.netlify.app mirror instead of the real
   domain. Blog URLs are pulled live from the CMS at build time, so
   publishing a post and redeploying updates the sitemap with it. */

/* TRAILING SLASH — next.config.js sets `trailingSlash: true`, so the URL that
   actually returns 200 is /about/, and /about 308-redirects to it. Next's
   sitemap generator does NOT apply that setting, so every <loc> here used to
   point at the redirecting form: 94 URLs, 94 redirects, and a Search Console
   coverage report full of "Page with redirect". `abs()` below is the fix —
   build every <loc> through it, never by string concatenation. */
function abs(path: string): string {
  const clean = `/${path.replace(/^\/+/, '').replace(/\/+$/, '')}`
  return clean === '/' ? `${SITE_URL}/` : `${SITE_URL}${clean}/`
}

/* LASTMOD — stamping every URL with `new Date()` on each build teaches search
   engines that our timestamps are noise, at which point they stop using them
   to schedule crawls. Content-backed URLs (articles, taxonomy) get a real
   date from the CMS record. Hand-authored pages get the constant below:
   bump it when a static page's copy actually changes, not on every deploy. */
const STATIC_LASTMOD = new Date('2026-09-19T00:00:00.000Z')

const STATIC_ROUTES: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/',                       priority: 1.0,  freq: 'weekly'  },
  { path: '/about',                  priority: 0.8,  freq: 'monthly' },
  { path: '/why-aifs',               priority: 0.8,  freq: 'monthly' },
  { path: '/fund',                   priority: 0.9,  freq: 'weekly'  },
  { path: '/fund/direct-aif',        priority: 0.8,  freq: 'monthly' },
  { path: '/fund/debenture-route',   priority: 0.8,  freq: 'monthly' },
  { path: '/fund/nri-invest',        priority: 0.7,  freq: 'monthly' },
  { path: '/portfolio',              priority: 0.8,  freq: 'monthly' },
  { path: '/education',              priority: 0.7,  freq: 'monthly' },
  { path: '/education/insights',     priority: 0.7,  freq: 'monthly' },
  { path: '/financial-iq',           priority: 0.7,  freq: 'weekly'  },
  { path: '/downloads',              priority: 0.6,  freq: 'monthly' },
  { path: '/tools',                  priority: 0.6,  freq: 'monthly' },
  { path: '/contact',                priority: 0.7,  freq: 'monthly' },
  { path: '/contact/faqs',           priority: 0.6,  freq: 'monthly' },
  { path: '/contact/careers',        priority: 0.5,  freq: 'monthly' },
  { path: '/contact/grievance',      priority: 0.4,  freq: 'yearly'  },
  { path: '/contact/refer',          priority: 0.5,  freq: 'monthly' },
  { path: '/contact/startup-apply',  priority: 0.5,  freq: 'monthly' },
  { path: '/disclaimer',             priority: 0.3,  freq: 'yearly'  },
  // blog hubs
  { path: '/blog',                   priority: 0.9,  freq: 'daily'   },
  { path: '/blog/archive',           priority: 0.5,  freq: 'weekly'  },
  { path: '/blog/reports',           priority: 0.7,  freq: 'weekly'  },
]

/* The three blog hubs and every taxonomy page are "last modified" when their
   newest article was, not when the site was last deployed. */
const BLOG_HUB_PATHS = new Set(['/blog', '/blog/archive', '/blog/reports'])

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []
  let newestPost = STATIC_LASTMOD

  // ── blog articles ──────────────────────────────────────
  const articleEntries: MetadataRoute.Sitemap = []
  try {
    const posts = await getPublishedPosts()
    for (const p of posts) {
      if (p.noindex) continue
      const stamp = new Date(p.updated_at || p.published_at || p.created_at)
      if (!Number.isNaN(stamp.getTime()) && stamp > newestPost) newestPost = stamp
      articleEntries.push({
        url: abs(`/blog/${p.slug}`),
        lastModified: Number.isNaN(stamp.getTime()) ? STATIC_LASTMOD : stamp,
        changeFrequency: 'monthly',
        priority: p.featured ? 0.9 : 0.7,
      })
    }
  } catch { /* a CMS blip must not fail the build */ }

  // ── hand-authored pages ────────────────────────────────
  for (const r of STATIC_ROUTES) {
    entries.push({
      url: abs(r.path),
      lastModified: BLOG_HUB_PATHS.has(r.path) ? newestPost : STATIC_LASTMOD,
      changeFrequency: r.freq,
      priority: r.priority,
    })
  }

  entries.push(...articleEntries)

  // ── taxonomy ───────────────────────────────────────────
  try {
    const [cats, tags, authors] = await Promise.all([
      getCategories({ withCounts: true }), getTags({ withCounts: true }), getAuthors(),
    ])
    for (const c of cats) {
      if (!c.post_count) continue
      entries.push({ url: abs(`/blog/category/${c.slug}`), lastModified: newestPost, changeFrequency: 'weekly', priority: 0.6 })
    }
    for (const t of tags) {
      if (!t.post_count) continue
      entries.push({ url: abs(`/blog/tag/${t.slug}`), lastModified: newestPost, changeFrequency: 'weekly', priority: 0.4 })
    }
    for (const a of authors) {
      entries.push({ url: abs(`/blog/author/${a.slug}`), lastModified: newestPost, changeFrequency: 'monthly', priority: 0.4 })
    }
  } catch { /* ignore */ }

  // ── other content collections already on the site ──────
  try {
    for (const a of FUND_ARTICLES as readonly any[]) {
      entries.push({ url: abs(`/fund/${a.slug}`), lastModified: STATIC_LASTMOD, changeFrequency: 'monthly', priority: 0.6 })
    }
  } catch { /* ignore */ }

  /* Financial IQ articles come from Supabase `financial_iq_posts`, the same
     table app/financial-iq/[slug]/page.tsx pre-builds from.

     This used to read the FINANCIAL_IQ_ARTICLES constant in lib/constants.ts,
     which is a legacy stub list the site itself stopped rendering when the
     articles moved to the CMS. Two consequences, both live in the sitemap:
     one of its two slugs ('what-is-alternative-investment-fund') no longer
     exists — it renders "Article Not Found", i.e. we were submitting a soft
     404 to Google — and the other ~24 published articles were absent from the
     sitemap entirely. Reading the table fixes both and cannot drift again. */
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import('@supabase/supabase-js')
      /* Default fetch on purpose. This route is statically generated, so a
         `cache: 'no-store'` fetch here throws "Dynamic server usage", the
         catch below swallows it, and the sitemap ships incomplete. See the
         note at the top of lib/supabase/client.ts. */
      const sb = createClient(supabaseUrl, supabaseKey)
      const { data } = await sb
        .from('financial_iq_posts')
        .select('slug, updated_at, published_at')
        .eq('is_published', true)
      for (const a of (data ?? []) as any[]) {
        if (!a?.slug) continue
        const stamp = new Date(a.updated_at || a.published_at || STATIC_LASTMOD)
        entries.push({
          url: abs(`/financial-iq/${a.slug}`),
          lastModified: Number.isNaN(stamp.getTime()) ? STATIC_LASTMOD : stamp,
          changeFrequency: 'monthly',
          priority: 0.5,
        })
      }
    }
  } catch { /* a CMS blip must not fail the build — the sitemap just ships without these */ }

  // de-duplicate, last write wins
  const seen = new Map<string, MetadataRoute.Sitemap[number]>()
  for (const e of entries) seen.set(e.url, e)
  return Array.from(seen.values())
}
