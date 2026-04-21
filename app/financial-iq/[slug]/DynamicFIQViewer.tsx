'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase as _sb, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveFIQCoverImage } from '@/lib/fiqFallbackImages'
import {
  Calendar, Clock, ArrowLeft, User, Tag, BookOpen, GraduationCap,
} from 'lucide-react'

const sb = _sb as any

interface FIQPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  category: string
  cover_image: string | null
  author: string
  tags: string[]
  is_published: boolean
  read_time: number | null
  published_at: string | null
  created_at: string
  meta_title: string | null
  meta_description: string | null
}

// Split article body into blocks. A blank line = paragraph break.
// Lines starting with "**" and ending with "**" become section headings.
function renderBlocks(content: string) {
  const blocks = content.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
  return blocks.map((block, i) => {
    const boldWrap = block.match(/^\*\*([\s\S]+)\*\*$/)
    if (boldWrap) {
      return (
        <h2 key={i} className="text-xl md:text-2xl font-bold text-brand-black dark:text-white mt-10 mb-4">
          {boldWrap[1]}
        </h2>
      )
    }
    // Inline **bold** rendering
    const parts = block.split(/(\*\*[^*]+\*\*)/g)
    return (
      <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-5 text-base">
        {parts.map((part, j) => {
          const m = part.match(/^\*\*(.+)\*\*$/)
          if (m) return <strong key={j} className="font-semibold text-brand-black dark:text-white">{m[1]}</strong>
          return <span key={j}>{part}</span>
        })}
      </p>
    )
  })
}

// Resolve the real slug from the current URL — this lets a Netlify
// rewrite serve ONE pre-built HTML shell for any /financial-iq/<slug>
// path and still load the correct article from Supabase, so newly
// published articles don't 404 while waiting for the next site build.
function resolveSlug(propSlug: string): string {
  if (typeof window === 'undefined') return propSlug
  const parts = window.location.pathname.split('/').filter(Boolean)
  if (parts[0] === 'financial-iq' && parts[1]) {
    try { return decodeURIComponent(parts[1]) } catch { return parts[1] }
  }
  return propSlug
}

export default function DynamicFIQViewer({ slug: propSlug }: { slug: string }) {
  const [post, setPost] = useState<FIQPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [relatedPosts, setRelatedPosts] = useState<FIQPost[]>([])
  const slug = resolveSlug(propSlug)

  useEffect(() => {
    if (!isSupabaseConfigured()) { setLoading(false); setNotFound(true); return }
    async function load() {
      const { data, error } = await sb
        .from('financial_iq_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setPost(data as FIQPost)

      // Track view counter (fire-and-forget)
      try { sb.rpc('increment_fiq_views', { p_slug: slug }) } catch { /* ok */ }

      // Related: 3 most recent published articles excluding the current one
      const { data: related } = await sb
        .from('financial_iq_posts')
        .select('id, title, slug, excerpt, category, cover_image, author, published_at, read_time')
        .eq('is_published', true)
        .neq('slug', slug)
        .order('published_at', { ascending: false })
        .limit(3)
      if (related) setRelatedPosts(related as FIQPost[])

      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Loading article…</p>
        </div>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <BookOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Article Not Found</h1>
          <p className="text-white/70 mb-6">The Financial IQ article you are looking for does not exist or has been removed.</p>
          <Link href="/financial-iq" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-red text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Financial IQ
          </Link>
        </div>
      </div>
    )
  }

  const publishDate = post.published_at || post.created_at
  const formattedDate = new Date(publishDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description || post.excerpt,
    datePublished: publishDate,
    dateModified: publishDate,
    author: { '@type': 'Organization', name: post.author || 'GHL India Ventures' },
    publisher: {
      '@type': 'Organization',
      name: 'GHL India Ventures',
      logo: { '@type': 'ImageObject', url: 'https://ghlindiaventures.com/icon.svg' },
    },
    articleSection: post.category,
    url: `https://ghlindiaventures.com/financial-iq/${post.slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Hero */}
      <section className="pt-32 pb-8 gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link href="/financial-iq" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Financial IQ
          </Link>

          <span className="inline-flex items-center px-3 py-1 bg-brand-red/10 border border-brand-red/20 rounded-full text-brand-red text-xs font-semibold uppercase tracking-wider mb-4">
            <GraduationCap className="w-3 h-3 mr-1.5" /> {post.category}
          </span>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
            {post.title}
          </h1>

          <p className="text-lg text-white/80 max-w-3xl mb-6 leading-relaxed">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-6 text-sm text-white/70 flex-wrap">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" /> {post.author || 'GHL India Ventures'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {post.read_time || 5} min read
            </span>
          </div>
        </div>
      </section>

      {/* Cover Image — always rendered, falls back to a category-appropriate
          royalty-free Unsplash image when no custom cover is set. */}
      <section className="bg-white">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
          <div className="rounded-2xl overflow-hidden shadow-xl max-h-[480px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveFIQCoverImage(post.cover_image, post.category)}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Article Body */}
      <section className="bg-white py-12">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <article className="max-w-3xl mx-auto">
            {renderBlocks(post.content)}
          </article>

          {post.tags && post.tags.length > 0 && (
            <div className="max-w-3xl mx-auto mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-gray-400" />
                {post.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="bg-brand-offwhite py-12">
          <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-brand-black dark:text-white mb-6">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/financial-iq/${rp.slug}`} className="group">
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveFIQCoverImage(rp.cover_image, rp.category)}
                        alt={rp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <span className="text-xs font-medium text-brand-red uppercase">{rp.category}</span>
                      <h3 className="font-semibold text-brand-black dark:text-white mt-1 mb-2 line-clamp-2 group-hover:text-brand-red transition-colors">
                        {rp.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{rp.excerpt}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {rp.published_at ? new Date(rp.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {rp.read_time || 5} min</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-brand-black py-12">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to invest smarter?</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            Explore GHL India Ventures&apos; SEBI-registered Category II AIF strategies and build a portfolio that compounds through market cycles.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/fund" className="px-6 py-3 bg-brand-red text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
              Explore Funds
            </Link>
            <Link href="/financial-iq" className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors border border-white/10">
              More Articles
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
