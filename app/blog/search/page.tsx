'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, ArrowLeft } from 'lucide-react'
import BlogListing from '@/components/blog/BlogListing'
import BlogBreadcrumbs from '@/components/blog/BlogBreadcrumbs'
import NewsletterSignup from '@/components/blog/NewsletterSignup'
import { getPublishedPosts, type CmsPost } from '@/lib/blog/cmsService'

function SearchInner() {
  const params = useSearchParams()
  const router = useRouter()
  const initial = params.get('q') || ''

  const [term, setTerm] = useState(initial)
  const [posts, setPosts] = useState<CmsPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getPublishedPosts().then((p) => { if (alive) { setPosts(p); setLoading(false) } })
    return () => { alive = false }
  }, [])

  useEffect(() => { setTerm(initial) }, [initial])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/blog/search?q=${encodeURIComponent(term.trim())}`)
  }

  return (
    <>
      <section className="pt-32 pb-12 gradient-dark relative overflow-hidden">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-5">
            <BlogBreadcrumbs crumbs={[{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog' }, { label: 'Search' }]} />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-5">
            {initial ? <>Results for &ldquo;<span className="text-brand-red">{initial}</span>&rdquo;</> : 'Search insights'}
          </h1>
          <form onSubmit={onSubmit} className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search articles, topics, regulations…"
              aria-label="Search articles"
              className="w-full pl-11 pr-24 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 bg-brand-red hover:bg-brand-red-deep text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <BlogListing
            posts={posts}
            loading={loading}
            initialQuery={initial}
            showSearch={false}
            variant="list"
            emptyMessage="No published articles yet."
          />
          <div className="mt-10">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to all articles
            </Link>
          </div>
        </div>
      </section>

      <NewsletterSignup source="blog-search" />
    </>
  )
}

export default function BlogSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-black" />}>
      <SearchInner />
    </Suspense>
  )
}
