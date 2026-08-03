import type { MetadataRoute } from 'next'
import {
  getPublishedPosts, getCategories, getTags, getAuthors, getReports,
} from '@/lib/blog/cmsService'
import { FUND_ARTICLES, FINANCIAL_IQ_ARTICLES } from '@/lib/constants'

const SITE_URL = 'https://ghlindiaventures.com'

/* Replaces the hand-maintained public/sitemap.xml, which had gone
   stale (16 URLs) and — worse — pointed every <loc> at the
   ghl-india-ventures-2025.netlify.app mirror instead of the real
   domain. Blog URLs are pulled live from the CMS at build time, so
   publishing a post and redeploying updates the sitemap with it. */

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }))

  // ── blog articles ──────────────────────────────────────
  try {
    const posts = await getPublishedPosts()
    for (const p of posts) {
      if (p.noindex) continue
      entries.push({
        url: `${SITE_URL}/blog/${p.slug}`,
        lastModified: new Date(p.updated_at || p.published_at || p.created_at),
        changeFrequency: 'monthly',
        priority: p.featured ? 0.9 : 0.7,
      })
    }
  } catch { /* a CMS blip must not fail the build */ }

  // ── taxonomy ───────────────────────────────────────────
  try {
    const [cats, tags, authors] = await Promise.all([
      getCategories({ withCounts: true }), getTags({ withCounts: true }), getAuthors(),
    ])
    for (const c of cats) {
      if (!c.post_count) continue
      entries.push({ url: `${SITE_URL}/blog/category/${c.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 })
    }
    for (const t of tags) {
      if (!t.post_count) continue
      entries.push({ url: `${SITE_URL}/blog/tag/${t.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.4 })
    }
    for (const a of authors) {
      entries.push({ url: `${SITE_URL}/blog/author/${a.slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 })
    }
  } catch { /* ignore */ }

  // ── other content collections already on the site ──────
  try {
    for (const a of FUND_ARTICLES as readonly any[]) {
      entries.push({ url: `${SITE_URL}/fund/${a.slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 })
    }
    for (const a of FINANCIAL_IQ_ARTICLES as readonly any[]) {
      entries.push({ url: `${SITE_URL}/financial-iq/${a.slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 })
    }
  } catch { /* ignore */ }

  // de-duplicate, last write wins
  const seen = new Map<string, MetadataRoute.Sitemap[number]>()
  for (const e of entries) seen.set(e.url, e)
  return Array.from(seen.values())
}
