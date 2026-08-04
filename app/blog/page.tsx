'use client'

/* ─────────────────────────────────────────────────────────────
   Blog landing page — fully CMS-driven.

   Every article, category and featured slot is read live from the
   central CMS, so anything published in the admin panel appears
   here immediately — on ghlindiaventures.com/blog/ and on
   blog.ghlindiaventures.com, which now serves from this same app.

   The hero photo treatment, brand chips and section rhythm are
   carried over from the pre-CMS page so the visual identity is
   unchanged. If the CMS is unreachable the page falls back to the
   legacy BLOG_POSTS constant and can never render empty.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import PostCard from '@/components/blog/PostCard'
import NewsletterSignup from '@/components/blog/NewsletterSignup'
import { BLOG_POSTS } from '@/lib/constants'
import {
  getPublishedPosts, getCategories, getFeaturedPost, getEditorsPicks,
  getPopularPosts, POSTS_PER_PAGE, readTimeLabel,
  type CmsPost, type CmsCategory,
} from '@/lib/blog/cmsService'
import {
  Search, BookOpen, TrendingUp, Clock, ArrowRight,
  FileText, Archive, Flame, Bookmark, Tag as TagIcon, Rss,
} from 'lucide-react'

/** Fallback built from the legacy constant — used only when the CMS
 *  cannot be reached, so the route is never blank. */
const FALLBACK: CmsPost[] = (BLOG_POSTS as readonly any[]).map((p, i) => ({
  id: `fallback-${i}`, slug: p.slug, title: p.title, subtitle: null,
  excerpt: p.excerpt, content: '', content_format: 'paragraphs', legacy_component: null,
  author: 'GHL Research Team', author_id: null, category: p.category, category_id: null,
  tags: [], cover_image: null, thumbnail_image: null, og_image: null, gallery: [],
  video_url: null, status: 'published', published: true, featured: false,
  editors_pick: false, allow_comments: false, noindex: false, canonical_url: null,
  read_time: parseInt(String(p.readTime), 10) || 6, views: 0,
  meta_title: null, meta_description: null, meta_keywords: null,
  published_at: p.date, scheduled_at: null, created_at: p.date, updated_at: p.date,
})) as CmsPost[]

export default function BlogPage() {
  const [posts, setPosts] = useState<CmsPost[]>([])
  const [categories, setCategories] = useState<(CmsCategory & { post_count?: number })[]>([])
  const [featured, setFeatured] = useState<CmsPost | null>(null)
  const [picks, setPicks] = useState<CmsPost[]>([])
  const [popular, setPopular] = useState<CmsPost[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState<string>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [all, cats, feat, ep, pop] = await Promise.all([
        getPublishedPosts(),
        getCategories({ withCounts: true }),
        getFeaturedPost(),
        getEditorsPicks(3),
        getPopularPosts(5),
      ])
      if (!alive) return
      const list = all.length ? all : FALLBACK
      setPosts(list)
      setCategories(cats.filter((c) => (c.post_count ?? 0) > 0))
      setFeatured(feat || list[0] || null)
      setPicks(ep)
      setPopular(pop)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => { setPage(1) }, [query, activeCat])

  const filtered = useMemo(() => {
    // The featured post is normally held out of the list because it already
    // has its own hero card — but that also made it unsearchable, so a search
    // for its exact title returned nothing. Keep it in the pool when the
    // reader is actually searching (the hero card is hidden then anyway).
    const searching = query.trim().length > 0
    let out = searching ? posts : posts.filter((p) => !featured || p.id !== featured.id)
    if (activeCat !== 'all') {
      out = out.filter((p) => (p.blog_categories?.slug || '') === activeCat)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      out = out.filter((p) =>
        [p.title, p.excerpt, p.category, p.author, ...(p.tags || [])]
          .filter(Boolean).some((f) => String(f).toLowerCase().includes(q)),
      )
    }
    return out
  }, [posts, activeCat, query, featured])

  // Top of the article list. Pagination scrolls back here so a page change
  // doesn't leave the reader stranded at the bottom of the next page.
  const listTopRef = useRef<HTMLDivElement | null>(null)

  const scrollToListTop = useCallback(() => {
    const el = listTopRef.current
    if (!el) return
    // The header is fixed, so offset the target by its height instead of
    // using scrollIntoView (which would tuck the heading underneath it).
    const HEADER_OFFSET = 104
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }, [])

  // Scroll AFTER React has committed the new page. Doing it inside the click
  // handler measured and scrolled against the OLD list, so the browser ended
  // up re-clamping to the bottom and the reader stayed down by the footer.
  const pendingScrollRef = useRef(false)
  useEffect(() => {
    if (!pendingScrollRef.current) return
    pendingScrollRef.current = false
    scrollToListTop()
  })

  const goToPage = (n: number) => {
    pendingScrollRef.current = true
    setPage(n)
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE))
  const current = Math.min(page, totalPages)
  const visible = filtered.slice((current - 1) * POSTS_PER_PAGE, current * POSTS_PER_PAGE)
  const showHighlights = !query && activeCat === 'all'

  return (
    <>
      {/* ── Hero (photo treatment preserved from the original page) ── */}
      <section className="pt-40 pb-32 md:pb-40 relative overflow-hidden bg-brand-black">
        <picture aria-hidden="true">
          <source srcSet="/images/heros/blog-hero-sm.jpg" media="(max-width: 768px)" />
          <img
            src="/images/heros/blog-hero.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            loading="eager"
            decoding="async"
          />
        </picture>
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <span className="inline-flex items-center px-4 py-1.5 bg-brand-red/10 border border-brand-red/20 rounded-full text-brand-red text-xs font-semibold uppercase tracking-wider mb-6">
              <BookOpen className="w-4 h-4 mr-2" />
              Insights &amp; Analysis
            </span>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-4 mb-5 leading-tight">
              Financial Intelligence.{' '}
              <span className="text-gradient-shimmer">Delivered.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-300 max-w-3xl leading-relaxed mb-8">
              Market insights, sector deep-dives, and thought leadership from the GHL India Ventures
              research team. Stay ahead of the curve in alternative investments.
            </p>

            {/* The results list sits about a screen-and-a-half below this
                box, so typing here changed nothing the reader could see and
                the search looked broken. Submitting now jumps to the results,
                and a live count gives immediate feedback either way. */}
            <form
              className="relative max-w-xl"
              onSubmit={(e) => { e.preventDefault(); scrollToListTop() }}
              role="search"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles, topics, regulations…"
                aria-label="Search articles"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/40 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:border-brand-red transition-colors"
              />
            </form>

            {query.trim() && (
              <button
                type="button"
                onClick={scrollToListTop}
                aria-live="polite"
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors"
              >
                {filtered.length === 0
                  ? <>No articles match &ldquo;{query.trim()}&rdquo;</>
                  : <>
                      {filtered.length === 1
                        ? <>1 article matches &ldquo;{query.trim()}&rdquo;</>
                        : <>{filtered.length} articles match &ldquo;{query.trim()}&rdquo;</>}
                      <span className="text-brand-red font-semibold">· View results</span>
                    </>}
              </button>
            )}

            <div className="flex flex-wrap items-center gap-5 mt-6 text-xs text-gray-300">
              <Link href="/blog/reports" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                <FileText className="w-3.5 h-3.5" /> Free research reports
              </Link>
              <Link href="/blog/archive" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                <Archive className="w-3.5 h-3.5" /> Archive
              </Link>
              <a href="/blog/rss.xml" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                <Rss className="w-3.5 h-3.5" /> RSS
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Featured ─────────────────────────────────────── */}
      {featured && showHighlights && (
        <section className="bg-brand-offwhite py-12">
          <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="flex items-center gap-2 mb-5">
                <Flame className="w-4 h-4 text-brand-red" />
                <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-brand-black">Featured</h2>
              </div>
              <PostCard post={featured} variant="hero" priority />
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ── Editor's picks ───────────────────────────────── */}
      {picks.length > 0 && showHighlights && (
        <section className="bg-white pt-12">
          <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-5">
              <Bookmark className="w-4 h-4 text-brand-red" />
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-brand-black">Editor&rsquo;s picks</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {picks.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Main grid + sidebar ──────────────────────────── */}
      <section className="bg-white py-12">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveCat('all')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  activeCat === 'all'
                    ? 'bg-brand-red text-white shadow-lg shadow-brand-red/25'
                    : 'bg-gray-200 text-slate-800 border border-gray-300 hover:bg-gray-300'
                }`}
              >
                All articles
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.slug)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                    activeCat === c.slug
                      ? 'bg-brand-red text-white shadow-lg shadow-brand-red/25'
                      : 'bg-gray-200 text-slate-800 border border-gray-300 hover:bg-gray-300'
                  }`}
                >
                  {c.name}
                  {typeof c.post_count === 'number' && <span className="ml-1.5 opacity-60">{c.post_count}</span>}
                </button>
              ))}
            </div>
          )}

          <div className="grid lg:grid-cols-[1fr_20rem] gap-10 items-start">
            <div className="min-w-0">
              {loading ? (
                <div className="grid sm:grid-cols-2 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                      <div className="aspect-[16/10] bg-gray-200" />
                      <div className="p-5 space-y-3">
                        <div className="h-3 w-20 bg-gray-200 rounded" />
                        <div className="h-4 w-full bg-gray-200 rounded" />
                        <div className="h-4 w-2/3 bg-gray-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div className="text-center py-16 bg-brand-offwhite rounded-2xl">
                  <BookOpen className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-brand-black mb-2">No articles found</h3>
                  <p className="text-gray-600 mb-5">
                    {query ? `Nothing matches “${query}”.` : 'No articles in this category yet.'}
                  </p>
                  <button
                    onClick={() => { setQuery(''); setActiveCat('all') }}
                    className="text-sm font-semibold text-brand-red hover:underline"
                  >
                    Show all articles
                  </button>
                </div>
              ) : (
                <>
                  <div ref={listTopRef} className="flex items-center justify-between gap-4 mb-5 flex-wrap">
                    <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-brand-black">
                      {query
                        ? 'Search results'
                        : activeCat === 'all'
                          ? 'Latest articles'
                          : categories.find((c) => c.slug === activeCat)?.name}
                    </h2>
                    <span className="text-xs text-gray-500">
                      {filtered.length} article{filtered.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    {visible.map((p, i) => (
                      <AnimatedSection key={p.id} delay={i * 60}>
                        <PostCard post={p} priority={i < 2} />
                      </AnimatedSection>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <nav className="flex items-center justify-center gap-1.5 mt-10 flex-wrap" aria-label="Pagination">
                      <button
                        onClick={() => goToPage(current - 1)} disabled={current === 1}
                        className="px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand-red hover:text-brand-red transition-colors"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const n = i + 1
                        const near = Math.abs(n - current) <= 1 || n === 1 || n === totalPages
                        if (!near) {
                          return (n === current - 2 || n === current + 2)
                            ? <span key={n} className="px-1.5 text-gray-400">…</span> : null
                        }
                        return (
                          <button
                            key={n} onClick={() => goToPage(n)}
                            aria-current={n === current ? 'page' : undefined}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                              n === current
                                ? 'bg-brand-red text-white'
                                : 'border border-gray-200 text-gray-600 hover:border-brand-red hover:text-brand-red'
                            }`}
                          >
                            {n}
                          </button>
                        )
                      })}
                      <button
                        onClick={() => goToPage(current + 1)} disabled={current === totalPages}
                        className="px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand-red hover:text-brand-red transition-colors"
                      >
                        Next
                      </button>
                    </nav>
                  )}
                </>
              )}
            </div>

            {/* sidebar */}
            <aside className="space-y-8 lg:sticky lg:top-28">
              {popular.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-brand-red" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-brand-black">Most read</h3>
                  </div>
                  <ol className="space-y-4">
                    {popular.map((p, i) => (
                      <li key={p.id} className="flex gap-3">
                        <span className="text-lg font-bold text-gray-200 leading-none w-6 flex-shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <Link href={`/blog/${p.slug}`} className="group min-w-0">
                          <h4 className="text-sm font-semibold text-brand-black group-hover:text-brand-red transition-colors blog-clamp-2 leading-snug">
                            {p.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{readTimeLabel(p)}</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {categories.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TagIcon className="w-4 h-4 text-brand-red" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-brand-black">Browse by topic</h3>
                  </div>
                  <ul className="space-y-1">
                    {categories.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/blog/category/${c.slug}`}
                          className="flex items-center justify-between gap-2 py-1.5 text-sm text-gray-600 hover:text-brand-red transition-colors group"
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="text-xs text-gray-400 group-hover:text-brand-red">{c.post_count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <NewsletterSignup
                variant="card"
                heading="Get our research"
                subheading="Analysis on India’s alternative investment market, delivered to your inbox."
                source="blog-sidebar"
              />

              <Link
                href="/blog/reports"
                className="block bg-brand-offwhite rounded-2xl p-5 hover:bg-gray-200 transition-colors group"
              >
                <FileText className="w-6 h-6 text-brand-red mb-3" />
                <h3 className="text-sm font-bold text-brand-black mb-1">Research reports</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Download our in-depth PDF research on India&rsquo;s alternative investment market.
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-red">
                  Browse reports <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <NewsletterSignup
        heading="Get investment insights delivered to your inbox."
        subheading="Curated market analysis, sector deep-dives, and exclusive research from our team."
        source="blog-landing"
      />
    </>
  )
}
