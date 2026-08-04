'use client'

/* ─────────────────────────────────────────────────────────────
   CMS article renderer — the editorial surface for every post
   whose body lives in the CMS (html / markdown / paragraphs).

   Posts backed by a bespoke React component are NOT rendered here;
   the page routes those to their original component so the pillar
   pages keep their exact layout.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Calendar, Clock, ArrowLeft, User, Tag as TagIcon, Eye, ArrowRight,
} from 'lucide-react'
import ArticleBody from '@/components/blog/ArticleBody'
import ImageZoom from '@/components/blog/ImageZoom'
import ShareButtons from '@/components/blog/ShareButtons'
import PostCard from '@/components/blog/PostCard'
import NewsletterSignup from '@/components/blog/NewsletterSignup'
import CommentsSection from '@/components/blog/CommentsSection'
import BlogAnalytics from '@/components/blog/BlogAnalytics'
import BlogBreadcrumbs from '@/components/blog/BlogBreadcrumbs'
import PlaceholderImage from '@/components/PlaceholderImage'
import {
  getRelatedPosts, formatDate, readTimeLabel, canonicalFor,
  BLOG_SITE_URL, type CmsPost,
} from '@/lib/blog/cmsService'

export default function ArticleView({ post, preview = false }: { post: CmsPost; preview?: boolean }) {
  const [related, setRelated] = useState<CmsPost[]>([])

  useEffect(() => {
    let alive = true
    getRelatedPosts(post, 3).then((r) => { if (alive) setRelated(r) })
    return () => { alive = false }
  }, [post])

  const categoryName = post.blog_categories?.name || post.category
  const categorySlug = post.blog_categories?.slug
  const author = post.blog_authors
  const authorName = author?.name || post.author || 'GHL India Ventures'
  const date = formatDate(post.published_at || post.created_at)
  const shareUrl = canonicalFor(post)

  return (
    <>
      {!preview && <BlogAnalytics slug={post.slug} />}

      {preview && (
        <div className="sticky top-0 z-50 bg-amber-500 text-black text-center text-xs font-bold py-2 px-4">
          PREVIEW — {String(post.status).toUpperCase()}. This is how the article will look once published.
          Views are not counted here.
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="pt-32 pb-10 gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-5">
            <BlogBreadcrumbs
              crumbs={[
                { label: 'Home', href: '/' },
                { label: 'Blog', href: '/blog' },
                ...(categoryName && categorySlug
                  ? [{ label: categoryName, href: `/blog/category/${categorySlug}` }]
                  : []),
                { label: post.title },
              ]}
            />
          </div>

          <div className="max-w-4xl">
            {categoryName && (
              <Link
                href={categorySlug ? `/blog/category/${categorySlug}` : '/blog'}
                className="inline-flex items-center px-3 py-1 bg-brand-red/10 border border-brand-red/20 rounded-full text-brand-red text-[11px] font-semibold uppercase tracking-wider mb-4 hover:bg-brand-red/20 transition-colors"
              >
                {categoryName}
              </Link>
            )}

            <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-4">
              {post.title}
            </h1>

            {post.subtitle && (
              <p className="text-lg text-gray-200 max-w-3xl mb-3 leading-relaxed">{post.subtitle}</p>
            )}
            {post.excerpt && (
              <p className="text-base text-gray-400 max-w-3xl mb-6 leading-relaxed">{post.excerpt}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {author?.slug
                  ? <Link href={`/blog/author/${author.slug}`} className="hover:text-white transition-colors">{authorName}</Link>
                  : authorName}
              </span>
              {date && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{date}</span>}
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{readTimeLabel(post)}</span>
              {post.views > 0 && (
                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{post.views.toLocaleString('en-IN')} views</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ImageZoom wraps the cover + body + gallery so every article image
          is click-to-zoom. Related-post cards are deliberately outside it —
          those are links, and should navigate rather than open a lightbox. */}
      <ImageZoom>
      {/* ── Cover ────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          {/* The cover used to sit at `-mt-4`, deliberately overlapping the
              hero — but that pulled it into the author/date/read-time row, so
              on narrower screens (where the metadata wraps onto two lines) the
              image covered it. It now sits clearly BELOW the header with real
              spacing. `relative z-10` is kept because the hero above is
              positioned. The image keeps its own aspect ratio rather than
              being cropped — covers are often designed graphics whose top and
              bottom carry meaning. */}
          <div className="max-w-4xl mx-auto relative z-10 mt-8 rounded-2xl overflow-hidden shadow-xl">
            {post.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-auto block"
                loading="eager"
                decoding="async"
              />
            ) : (
              <PlaceholderImage theme="finance" aspectRatio="aspect-[21/9]" label={post.title} className="rounded-none" />
            )}
          </div>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────── */}
      <section className="bg-white py-12">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <article className="max-w-3xl mx-auto">
            <ArticleBody content={post.content} format={post.content_format} />

            {/* video */}
            {post.video_url && (
              <div className="mt-8 rounded-2xl overflow-hidden aspect-video bg-black">
                <iframe
                  src={post.video_url}
                  title={`${post.title} — video`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* gallery */}
            {Array.isArray(post.gallery) && post.gallery.length > 0 && (
              <div className="mt-10">
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-brand-black mb-4">Gallery</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {post.gallery.map((g, i) => (
                    <figure key={i} className="rounded-xl overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.url} alt={g.alt || `${post.title} — image ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      {g.caption && <figcaption className="p-2 text-xs text-gray-500 text-center">{g.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </div>
            )}

            {/* tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <TagIcon className="w-4 h-4 text-gray-400" />
                  {post.tags.map((tag, i) => (
                    <Link
                      key={i}
                      href={`/blog/tag/${String(tag).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-brand-red hover:text-white transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* share */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <ShareButtons url={shareUrl} title={post.title} excerpt={post.excerpt || ''} />
            </div>

            {/* author bio */}
            {author && (author.bio || author.title) && (
              <div className="mt-10 bg-brand-offwhite rounded-2xl p-6 flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {author.avatar_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={author.avatar_url} alt={author.name} className="w-full h-full object-cover" loading="lazy" />
                    : <User className="w-5 h-5 text-brand-red" />}
                </div>
                <div className="min-w-0">
                  <Link href={`/blog/author/${author.slug}`} className="text-sm font-bold text-brand-black hover:text-brand-red transition-colors">
                    {author.name}
                  </Link>
                  {author.title && <p className="text-xs text-gray-500 mb-2">{author.title}</p>}
                  {author.bio && <p className="text-sm text-gray-600 leading-relaxed">{author.bio}</p>}
                </div>
              </div>
            )}
          </article>

          <CommentsSection postId={post.id} enabled={!!post.allow_comments} />
        </div>
      </section>
      </ImageZoom>

      {/* ── Related ──────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="bg-brand-offwhite py-14">
          <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-brand-black">Related articles</h2>
              <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-red hover:underline">
                All articles <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </div>
        </section>
      )}

      <NewsletterSignup source="blog-article" />

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="bg-brand-black py-12 border-t border-white/5">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to invest smarter?</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Explore our investment opportunities and start building your alternative investment portfolio today.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/fund" className="px-6 py-3 bg-brand-red text-white rounded-xl font-medium hover:bg-brand-red-deep transition-colors">
              Explore Funds
            </Link>
            <Link href="/blog" className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors border border-white/10 inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> More Articles
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export { BLOG_SITE_URL }
