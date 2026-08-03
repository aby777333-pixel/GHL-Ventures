'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase as _sb, isSupabaseConfigured } from '@/lib/supabase/client'
import {
  Calendar, Clock, ArrowLeft, User, Tag, Share2, BookOpen,
} from 'lucide-react'

const sb = _sb as any

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  category: string
  cover_image: string
  author: string
  tags: string[]
  published: boolean
  read_time: number
  published_at: string
  created_at: string
}

export default function DynamicBlogViewer({ slug }: { slug: string }) {
  const router = useRouter()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    if (!isSupabaseConfigured()) { setLoading(false); setNotFound(true); return }
    async function load() {
      const { data, error } = await sb
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle()

      if (error || !data) {
        // Before giving up, check whether this URL was renamed. The CMS
        // records a redirect automatically whenever a slug changes, so an
        // old link keeps working even between deploys.
        try {
          const { data: target } = await sb.rpc('resolve_blog_redirect', { p_path: `/blog/${slug}` })
          if (target && typeof target === 'string' && target !== `/blog/${slug}`) {
            router.replace(target)
            return
          }
        } catch { /* fall through to not-found */ }
        setNotFound(true)
        setLoading(false)
        return
      }
      setPost(data)

      // Load related posts
      const { data: related } = await sb
        .from('blog_posts')
        .select('id, title, slug, excerpt, category, cover_image, author, published_at, read_time')
        .eq('published', true)
        .neq('slug', slug)
        .order('published_at', { ascending: false })
        .limit(3)
      if (related) setRelatedPosts(related)

      setLoading(false)
    }
    load()
  }, [slug, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading article...</p>
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
          <p className="text-gray-400 mb-6">The article you are looking for does not exist or has been removed.</p>
          <Link href="/blog" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-red text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  const publishDate = post.published_at || post.created_at
  const formattedDate = new Date(publishDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // Split content into paragraphs for better rendering
  const paragraphs = post.content.split(/\n\n|\n/).filter(p => p.trim())

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-8 gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>

          <span className="inline-flex items-center px-3 py-1 bg-brand-red/10 border border-brand-red/20 rounded-full text-brand-red text-xs font-semibold uppercase tracking-wider mb-4">
            {post.category}
          </span>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
            {post.title}
          </h1>

          <p className="text-lg text-gray-300 max-w-3xl mb-6 leading-relaxed">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" /> {post.author}
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

      {/* Cover Image */}
      {post.cover_image && (
        <section className="bg-white">
          <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
            <div className="rounded-2xl overflow-hidden shadow-xl max-h-[480px]">
              <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
            </div>
          </div>
        </section>
      )}

      {/* Article Body */}
      <section className="bg-white py-12">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <article className="max-w-3xl mx-auto prose prose-lg prose-gray">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-gray-700 leading-relaxed mb-5 text-base">
                {p}
              </p>
            ))}
          </article>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="max-w-3xl mx-auto mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-gray-400" />
                {post.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
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
                <Link key={rp.id} href={`/blog/${rp.slug}`} className="group">
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    {rp.cover_image && (
                      <div className="aspect-video overflow-hidden">
                        <img src={rp.cover_image} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <div className="p-4">
                      <span className="text-xs font-medium text-brand-red uppercase">{rp.category}</span>
                      <h3 className="font-semibold text-brand-black dark:text-white mt-1 mb-2 line-clamp-2 group-hover:text-brand-red transition-colors">
                        {rp.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{rp.excerpt}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(rp.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
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
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Explore our investment opportunities and start building your alternative investment portfolio today.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/fund" className="px-6 py-3 bg-brand-red text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
              Explore Funds
            </Link>
            <Link href="/blog" className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors border border-white/10">
              More Articles
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
