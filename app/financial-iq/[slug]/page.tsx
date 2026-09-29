import { fitTitle } from '@/lib/seo/fitTitle'
import { Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'
import DynamicFIQViewer from './DynamicFIQViewer'
import { neighboursIn } from '@/components/ArticleNeighbours'

/* The viewer used to be imported with `ssr: false`, so every article shipped
   as an empty shell with a spinner: no <h1>, no body text (Pulse: H1_MISSING
   on all of them) and nothing at all for crawlers that do not run JS. It is
   now server-rendered from the post fetched below; in the browser it still
   re-fetches from Supabase exactly as before. */
async function getArticle(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { post: null, related: [], neighbours: null }
  try {
    const sb = createClient(url, key)
    const [{ data: post }, { data: related }, { data: all }] = await Promise.all([
      sb.from('financial_iq_posts').select('*').eq('slug', slug).eq('is_published', true).maybeSingle(),
      sb.from('financial_iq_posts')
        .select('id, title, slug, excerpt, category, cover_image, author, published_at, read_time')
        .eq('is_published', true)
        .neq('slug', slug)
        .order('published_at', { ascending: false })
        .limit(3),
      // newest first, for the previous / next article links
      sb.from('financial_iq_posts').select('slug, title').eq('is_published', true)
        .order('published_at', { ascending: false }),
    ])
    const neighbours = post ? neighboursIn((all as any[]) || [], slug, (s) => `/financial-iq/${s}/`) : null
    return { post: (post as any) || null, related: ((related as any[]) || []), neighbours }
  } catch {
    return { post: null, related: [], neighbours: null }
  }
}

const SITE_URL = 'https://ghlindiaventures.com'

/* DO NOT give this file's Supabase client a `cache: 'no-store'` fetch.
   It is the obvious-looking fix for generateStaticParams() reading a stale
   article list out of a warm .next/cache, but under `output: 'export'` a
   no-store fetch marks the route dynamic and Next then emits NO static pages
   for it at all — the build still succeeds and still logs "pre-building 26",
   while out/financial-iq/ ends up containing only the index. Verified by
   doing exactly that. Build freshness comes from clearing the Netlify build
   cache on deploy instead — see docs/SEO_DEPLOYMENT.md. */

// Baseline list of known Financial IQ slugs. Used as a fallback when the
// build environment cannot reach Supabase (e.g. local dev without env vars)
// so the static export still succeeds. When Supabase IS reachable at build
// time, the DB list is merged in so newly-added published articles get
// pre-rendered too.
const FALLBACK_FIQ_SLUGS = [
  'what-is-aif',
  'understanding-ncd-debentures',
  'portfolio-diversification-alternatives',
  'how-to-read-fund-fact-sheet',
  'risk-vs-return-sweet-spot',
]

// Pre-generate static paths for every published Financial IQ article so the
// Next.js static export (output: 'export') can serve them directly from
// Netlify without requiring a runtime server.
export async function generateStaticParams() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return FALLBACK_FIQ_SLUGS.map((slug) => ({ slug }))
  }
  try {
    const sb = createClient(url, key)
    const { data, error } = await sb
      .from('financial_iq_posts')
      .select('slug')
      .eq('is_published', true)
    if (error) return FALLBACK_FIQ_SLUGS.map((slug) => ({ slug }))
    const dbSlugs = (data || [])
      .map((r: any) => r.slug)
      .filter((s: any): s is string => typeof s === 'string' && s.length > 0)
    const merged = Array.from(new Set([...FALLBACK_FIQ_SLUGS, ...dbSlugs]))
    // Logged so `netlify deploy --prod` output shows which slugs are
    // being statically pre-built for each deploy.
    console.log(`[fiq] pre-building ${merged.length} article pages: ${merged.join(', ')}`)
    return merged.map((slug) => ({ slug }))
  } catch {
    return FALLBACK_FIQ_SLUGS.map((slug) => ({ slug }))
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return { title: 'Financial IQ | GHL India Ventures' }
  }
  try {
    const sb = createClient(url, key)
    const { data } = await sb
      .from('financial_iq_posts')
      .select('title, excerpt, meta_title, meta_description, tags, published_at, updated_at')
      .eq('slug', params.slug)
      .eq('is_published', true)
      .maybeSingle()

    if (!data) {
      return { title: 'Article Not Found | GHL India Ventures' }
    }
    const title = (data as any).meta_title ||
      fitTitle((data as any).title, [' | Financial IQ — GHL India Ventures', ' | GHL India Ventures', ' | Financial IQ', ''])
    const description = (data as any).meta_description || (data as any).excerpt || ''
    const keywords = Array.isArray((data as any).tags) ? (data as any).tags.join(', ') : undefined
    return {
      title,
      description,
      keywords,
      alternates: { canonical: `${SITE_URL}/financial-iq/${params.slug}` },
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime: (data as any).published_at || undefined,
        modifiedTime: (data as any).updated_at || undefined,
        authors: ['GHL India Ventures'],
        url: `${SITE_URL}/financial-iq/${params.slug}`,
      },
    }
  } catch {
    return { title: 'Financial IQ | GHL India Ventures' }
  }
}

export default async function FinancialIQArticlePage({ params }: { params: { slug: string } }) {
  const { post, related, neighbours } = await getArticle(params.slug)
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" /></div>}>
      <DynamicFIQViewer slug={params.slug} initialPost={post} initialRelated={related} initialNeighbours={neighbours} />
    </Suspense>
  )
}
