import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@supabase/supabase-js'

const DynamicFIQViewer = dynamic(() => import('./DynamicFIQViewer'), { ssr: false })

const SITE_URL = 'https://ghlindiaventures.com'

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
    const { data } = await sb
      .from('financial_iq_posts')
      .select('slug')
      .eq('is_published', true)
    const dbSlugs = (data || [])
      .map((r: any) => r.slug)
      .filter((s: any): s is string => typeof s === 'string' && s.length > 0)
    const merged = Array.from(new Set([...FALLBACK_FIQ_SLUGS, ...dbSlugs]))
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
    const title = (data as any).meta_title || `${(data as any).title} | Financial IQ — GHL India Ventures`
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

export default function FinancialIQArticlePage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" /></div>}>
      <DynamicFIQViewer slug={params.slug} />
    </Suspense>
  )
}
