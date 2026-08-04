'use client'

/* Reusable listing surface used by the category, tag, author,
   search and archive pages. Handles client-side search, sorting
   and pagination over an already-fetched set of posts. */

import { useMemo, useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, FileText, ArrowLeft } from 'lucide-react'
import PostCard from './PostCard'
import { POSTS_PER_PAGE, type CmsPost } from '@/lib/blog/cmsService'

type SortKey = 'newest' | 'oldest' | 'popular'

interface Props {
  posts: CmsPost[]
  loading?: boolean
  emptyMessage?: string
  showSearch?: boolean
  showSort?: boolean
  perPage?: number
  variant?: 'grid' | 'list'
  initialQuery?: string
}

export default function BlogListing({
  posts,
  loading = false,
  emptyMessage = 'No articles found.',
  showSearch = true,
  showSort = true,
  perPage = POSTS_PER_PAGE,
  variant = 'grid',
  initialQuery = '',
}: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState<SortKey>('newest')
  const [page, setPage] = useState(1)

  useEffect(() => { setPage(1) }, [query, sort, posts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = posts
    if (q) {
      out = posts.filter((p) =>
        [p.title, p.excerpt, p.category, p.author, ...(p.tags || [])]
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(q)),
      )
    }
    const time = (p: CmsPost) => new Date(p.published_at || p.created_at).getTime() || 0
    const sorted = [...out]
    if (sort === 'newest') sorted.sort((a, b) => time(b) - time(a))
    if (sort === 'oldest') sorted.sort((a, b) => time(a) - time(b))
    if (sort === 'popular') sorted.sort((a, b) => (b.views || 0) - (a.views || 0))
    return sorted
  }, [posts, query, sort])

  // Top of the list. Paging scrolls back here so the reader doesn't land
  // mid-page (or above the footer) after clicking Next/Previous.
  const listTopRef = useRef<HTMLDivElement | null>(null)

  const goToPage = (n: number) => {
    setPage(n)
    const el = listTopRef.current
    if (!el) return
    const HEADER_OFFSET = 104 // fixed site header
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const current = Math.min(page, totalPages)
  const slice = filtered.slice((current - 1) * perPage, current * perPage)

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
            <div className="aspect-[16/10] bg-gray-200" />
            <div className="p-5 space-y-3">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-full bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={listTopRef}>
      {(showSearch || showSort) && (
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {showSearch && (
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles…"
                aria-label="Search articles"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-brand-black placeholder-gray-400 focus:outline-none focus:border-brand-red transition-colors"
              />
            </div>
          )}
          {showSort && (
            <div className="relative">
              <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Sort articles"
                className="pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-brand-black focus:outline-none focus:border-brand-red appearance-none cursor-pointer"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="popular">Most read</option>
              </select>
            </div>
          )}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-gray-500 mb-5">
          Showing {(current - 1) * perPage + 1}–{Math.min(current * perPage, filtered.length)} of {filtered.length} article{filtered.length === 1 ? '' : 's'}
        </p>
      )}

      {slice.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-5">{query ? `No articles match “${query}”.` : emptyMessage}</p>
          {query ? (
            <button onClick={() => setQuery('')} className="text-sm font-semibold text-brand-red hover:underline">
              Clear search
            </button>
          ) : (
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to all articles
            </Link>
          )}
        </div>
      ) : variant === 'list' ? (
        <div>{slice.map((p) => <PostCard key={p.id} post={p} variant="list" showViews />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {slice.map((p, i) => <PostCard key={p.id} post={p} priority={i < 3} />)}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1.5 mt-10 flex-wrap" aria-label="Pagination">
          <button
            onClick={() => goToPage(current - 1)}
            disabled={current === 1}
            className="px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand-red hover:text-brand-red transition-colors"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }).map((_, i) => {
            const n = i + 1
            const near = Math.abs(n - current) <= 1 || n === 1 || n === totalPages
            if (!near) {
              return (n === current - 2 || n === current + 2)
                ? <span key={n} className="px-1.5 text-gray-400">…</span>
                : null
            }
            return (
              <button
                key={n}
                onClick={() => goToPage(n)}
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
            onClick={() => goToPage(current + 1)}
            disabled={current === totalPages}
            className="px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand-red hover:text-brand-red transition-colors"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  )
}
