'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Archive, Calendar, Clock, ArrowLeft } from 'lucide-react'
import BlogBreadcrumbs from '@/components/blog/BlogBreadcrumbs'
import NewsletterSignup from '@/components/blog/NewsletterSignup'
import { getArchiveIndex, formatShortDate, readTimeLabel, type CmsPost } from '@/lib/blog/cmsService'

type Group = { year: number; months: { month: number; label: string; count: number; posts: CmsPost[] }[] }

export default function BlogArchivePage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getArchiveIndex().then((g) => { if (alive) { setGroups(g); setLoading(false) } })
    return () => { alive = false }
  }, [])

  const total = groups.reduce((n, g) => n + g.months.reduce((m, mm) => m + mm.count, 0), 0)

  return (
    <>
      <section className="pt-32 pb-12 gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-5">
            <BlogBreadcrumbs crumbs={[{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog' }, { label: 'Archive' }]} />
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-brand-red/10 border border-brand-red/20 rounded-full text-brand-red text-[11px] font-semibold uppercase tracking-[0.18em] mb-4">
            <Archive className="w-3.5 h-3.5" /> Archive
          </span>
          <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-3">Every article, by date</h1>
          <p className="text-base text-gray-300 max-w-2xl leading-relaxed">
            The complete GHL India Ventures research archive.
            {!loading && total > 0 && ` ${total} articles published to date.`}
          </p>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-8 max-w-3xl">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
                  <div className="space-y-3">
                    {[0, 1, 2].map((j) => <div key={j} className="h-4 w-full bg-gray-100 rounded" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <p className="text-gray-600">No published articles yet.</p>
          ) : (
            <div className="max-w-3xl space-y-12">
              {groups.map((g) => (
                <div key={g.year}>
                  <h2 className="text-3xl font-bold text-brand-black mb-6 pb-3 border-b-2 border-brand-red inline-block">
                    {g.year}
                  </h2>
                  <div className="space-y-8 mt-6">
                    {g.months.map((m) => (
                      <div key={`${g.year}-${m.month}`}>
                        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-3">
                          {m.label} <span className="text-gray-300 ml-1">({m.count})</span>
                        </h3>
                        <ul className="space-y-2.5">
                          {m.posts.map((p) => (
                            <li key={p.id}>
                              <Link href={`/blog/${p.slug}`} className="group flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                <span className="text-xs text-gray-400 sm:w-28 flex-shrink-0 flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3" />
                                  {formatShortDate(p.published_at || p.created_at)}
                                </span>
                                <span className="text-sm font-medium text-brand-black group-hover:text-brand-red transition-colors flex-1 min-w-0">
                                  {p.title}
                                </span>
                                <span className="text-[11px] text-gray-400 flex items-center gap-1 flex-shrink-0">
                                  <Clock className="w-3 h-3" />{readTimeLabel(p)}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to all articles
            </Link>
          </div>
        </div>
      </section>

      <NewsletterSignup source="blog-archive" />
    </>
  )
}
