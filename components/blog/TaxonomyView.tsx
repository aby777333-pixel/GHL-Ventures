'use client'

/* Shared surface for the category, tag and author archive pages.
   Loads live from the CMS so newly published posts appear at once. */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Folder, Tag as TagIcon, User, Linkedin, Twitter, ArrowLeft } from 'lucide-react'
import BlogListing from './BlogListing'
import BlogBreadcrumbs from './BlogBreadcrumbs'
import NewsletterSignup from './NewsletterSignup'
import {
  getPostsByCategorySlug, getPostsByTagSlug, getPostsByAuthorSlug,
  getCategoryBySlug, getAuthorBySlug,
  type CmsPost, type CmsAuthor, type CmsCategory,
} from '@/lib/blog/cmsService'

type Kind = 'category' | 'tag' | 'author'

const LABEL: Record<Kind, string> = { category: 'Category', tag: 'Topic', author: 'Author' }
const ICON: Record<Kind, React.ElementType> = { category: Folder, tag: TagIcon, author: User }

export default function TaxonomyView({ kind, slug }: { kind: Kind; slug: string }) {
  const [posts, setPosts] = useState<CmsPost[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<CmsCategory | null>(null)
  const [author, setAuthor] = useState<CmsAuthor | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (kind === 'category') {
        const [c, p] = await Promise.all([getCategoryBySlug(slug), getPostsByCategorySlug(slug)])
        if (!alive) return
        setCategory(c); setPosts(p)
      } else if (kind === 'author') {
        const [a, p] = await Promise.all([getAuthorBySlug(slug), getPostsByAuthorSlug(slug)])
        if (!alive) return
        setAuthor(a); setPosts(p)
      } else {
        const p = await getPostsByTagSlug(slug)
        if (!alive) return
        setPosts(p)
      }
      if (alive) setLoading(false)
    })()
    return () => { alive = false }
  }, [kind, slug])

  const pretty = slug.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
  const heading = kind === 'category' ? (category?.name || pretty)
    : kind === 'author' ? (author?.name || pretty)
    : pretty
  const description = kind === 'category' ? category?.description
    : kind === 'author' ? author?.bio
    : `Every article tagged “${pretty}”.`

  const Icon = ICON[kind]

  return (
    <>
      <section className="pt-32 pb-12 gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-5">
            <BlogBreadcrumbs
              crumbs={[
                { label: 'Home', href: '/' },
                { label: 'Blog', href: '/blog' },
                { label: heading },
              ]}
            />
          </div>

          <span className="inline-flex items-center gap-2 px-3 py-1 bg-brand-red/10 border border-brand-red/20 rounded-full text-brand-red text-[11px] font-semibold uppercase tracking-[0.18em] mb-4">
            <Icon className="w-3.5 h-3.5" /> {LABEL[kind]}
          </span>

          <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-3">{heading}</h1>

          {description && (
            <p className="text-base text-gray-300 max-w-2xl leading-relaxed">{description}</p>
          )}

          {kind === 'author' && author && (
            <div className="flex items-center gap-3 mt-5">
              {author.title && <span className="text-sm text-gray-400">{author.title}</span>}
              {author.linkedin_url && (
                <a href={author.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                  className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center text-gray-300 hover:bg-brand-red hover:border-brand-red hover:text-white transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {author.twitter_url && (
                <a href={author.twitter_url} target="_blank" rel="noopener noreferrer" aria-label="X"
                  className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center text-gray-300 hover:bg-brand-red hover:border-brand-red hover:text-white transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

          {!loading && (
            <p className="text-xs text-gray-400 mt-5">
              {posts.length} article{posts.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <BlogListing
            posts={posts}
            loading={loading}
            emptyMessage={`No published articles in this ${LABEL[kind].toLowerCase()} yet.`}
          />
          <div className="mt-10">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to all articles
            </Link>
          </div>
        </div>
      </section>

      <NewsletterSignup source={`blog-${kind}`} />
    </>
  )
}
