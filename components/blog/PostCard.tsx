'use client'

import Link from 'next/link'
import { Calendar, Clock, ArrowRight, Eye } from 'lucide-react'
import PlaceholderImage from '@/components/PlaceholderImage'
import { excerptOf, formatShortDate, readTimeLabel, type CmsPost } from '@/lib/blog/cmsService'

interface Props {
  post: CmsPost
  variant?: 'grid' | 'list' | 'compact' | 'hero'
  showViews?: boolean
  priority?: boolean
}

/** Same category→stock-theme mapping the pre-CMS blog page used, so
 *  posts without an uploaded cover keep the imagery they have today. */
function placeholderTheme(category?: string | null): string {
  const c = (category || '').toLowerCase()
  if (c.includes('real estate') || c.includes('stressed') || c.includes('property')) return 'real-estate'
  if (c.includes('startup') || c.includes('venture')) return 'startup'
  if (c.includes('market') || c.includes('analysis') || c.includes('research')) return 'analytics'
  if (c.includes('education') || c.includes('tips') || c.includes('guide')) return 'education'
  if (c.includes('fund') || c.includes('aif') || c.includes('company')) return 'fund'
  return 'finance'
}

function CoverImage({ post, className, priority }: { post: CmsPost; className: string; priority?: boolean }) {
  const src = post.thumbnail_image || post.cover_image
  if (!src) {
    return (
      <PlaceholderImage
        theme={placeholderTheme(post.blog_categories?.name || post.category)}
        aspectRatio={className}
        label={post.title}
        className="rounded-none"
      />
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={post.title}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={`${className} object-cover`}
    />
  )
}

export default function PostCard({ post, variant = 'grid', showViews = false, priority }: Props) {
  const href = `/blog/${post.slug}`
  const date = formatShortDate(post.published_at || post.created_at)
  const categoryName = post.blog_categories?.name || post.category

  if (variant === 'compact') {
    return (
      <Link href={href} className="group flex gap-3 items-start">
        <CoverImage post={post} className="w-16 h-16 rounded-lg flex-shrink-0" />
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-brand-black group-hover:text-brand-red transition-colors blog-clamp-2 leading-snug">
            {post.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
            <span>{date}</span>
            {showViews && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views}</span>}
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'hero') {
    return (
      <Link href={href} className="group block">
        <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
          <div className="aspect-[16/10] md:aspect-auto md:h-full overflow-hidden">
            <CoverImage post={post} className="w-full h-full min-h-[220px] group-hover:scale-[1.03] transition-transform duration-500" priority={priority} />
          </div>
          <div className="p-6 md:p-8 min-w-0">
            {categoryName && (
              <span className="inline-flex px-3 py-1 bg-brand-red/10 text-brand-red rounded-full text-[11px] font-semibold uppercase tracking-wider mb-3">
                {categoryName}
              </span>
            )}
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-brand-black leading-tight mb-3 group-hover:text-brand-red transition-colors">
              {post.title}
            </h2>
            <p className="text-gray-600 leading-relaxed blog-clamp-3 mb-4">{excerptOf(post, 220)}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{date}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{readTimeLabel(post)}</span>
            </div>
            <span className="inline-flex items-center gap-2 text-brand-red font-semibold text-sm">
              Read article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'list') {
    return (
      <Link href={href} className="group flex flex-col sm:flex-row gap-5 py-6 border-b border-gray-200 last:border-0">
        <div className="sm:w-56 flex-shrink-0 aspect-[16/10] rounded-xl overflow-hidden">
          <CoverImage post={post} className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="min-w-0 flex-1">
          {categoryName && <span className="text-[11px] font-semibold text-brand-red uppercase tracking-wider">{categoryName}</span>}
          <h3 className="text-lg font-bold text-brand-black mt-1 mb-2 group-hover:text-brand-red transition-colors blog-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-gray-600 blog-clamp-2 mb-3">{excerptOf(post)}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{date}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{readTimeLabel(post)}</span>
            {showViews && <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{post.views}</span>}
          </div>
        </div>
      </Link>
    )
  }

  // grid (default)
  return (
    <Link href={href} className="group flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 h-full">
      <div className="aspect-[16/10] overflow-hidden">
        <CoverImage post={post} className="w-full h-full group-hover:scale-105 transition-transform duration-500" priority={priority} />
      </div>
      <div className="p-5 flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {categoryName && (
            <span className="text-[11px] font-semibold text-brand-red uppercase tracking-wider">{categoryName}</span>
          )}
          {post.editors_pick && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-black text-white">
              Editor&rsquo;s pick
            </span>
          )}
        </div>
        <h3 className="text-base font-bold text-brand-black leading-snug mb-2 group-hover:text-brand-red transition-colors blog-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-gray-600 blog-clamp-3 mb-4 flex-1">{excerptOf(post)}</p>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{date}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{readTimeLabel(post)}</span>
          {showViews && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views}</span>}
        </div>
      </div>
    </Link>
  )
}
