'use client'

import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import PlaceholderImage from '@/components/PlaceholderImage'
import { BLOG_POSTS, FUND_ARTICLES } from '@/lib/constants'
import SpaceHero from '@/components/SpaceHero'
import {
  BarChart3,
  Clock,
  Calendar,
  ArrowRight,
  Search,
  BookOpen,
  TrendingUp,
  Building2,
  Lightbulb,
  GraduationCap,
  Newspaper,
  Mail,
  User,
} from 'lucide-react'
import { useState } from 'react'

const allPosts = [
  ...BLOG_POSTS.map((p) => ({
    ...p,
    author: 'GHL Research Team',
    linkPrefix: '/blog' as const,
  })),
  ...FUND_ARTICLES.map((a) => ({
    ...a,
    image: '/blog/default.jpg',
    author: 'GHL Editorial',
    linkPrefix: '/fund' as const,
  })),
]

const CATEGORIES = [
  'All',
  'Real Estate',
  'Startups',
  'Market Analysis',
  'Investor Education',
  'Fund News',
  'Tax & Compliance',
] as const

const categoryIcons: Record<string, React.ElementType> = {
  'Real Estate': Building2,
  Startups: Lightbulb,
  'Market Analysis': TrendingUp,
  'Investor Education': GraduationCap,
  'Fund News': Newspaper,
}

function getCategoryForPost(post: (typeof allPosts)[number]): string {
  const cat = post.category.toLowerCase()
  if (cat.includes('education') || cat.includes('basics') || cat.includes('fundamentals') || cat.includes('strategy'))
    return 'Investor Education'
  if (cat.includes('market') || cat.includes('insights') || cat.includes('esg') || cat.includes('risk'))
    return 'Market Analysis'
  if (
    cat.includes('fintech') ||
    cat.includes('technology') ||
    cat.includes('ecosystem') ||
    cat.includes('sector')
  )
    return 'Startups'
  if (cat.includes('regulation') || cat.includes('fund'))
    return 'Fund News'
  if (cat.includes('green') || cat.includes('real estate'))
    return 'Real Estate'
  return 'Market Analysis'
}

function getCardIcon(mappedCategory: string) {
  return categoryIcons[mappedCategory] || BarChart3
}

function getCardGradient(mappedCategory: string): string {
  switch (mappedCategory) {
    case 'Real Estate':
      return 'from-amber-500/15 to-orange-500/10'
    case 'Startups':
      return 'from-violet-500/15 to-purple-500/10'
    case 'Market Analysis':
      return 'from-blue-500/15 to-cyan-500/10'
    case 'Investor Education':
      return 'from-emerald-500/15 to-green-500/10'
    case 'Fund News':
      return 'from-brand-red/15 to-rose-500/10'
    default:
      return 'from-brand-red/10 to-brand-red/5'
  }
}

function getPlaceholderTheme(mappedCategory: string): string {
  switch (mappedCategory) {
    case 'Real Estate':
      return 'real-estate'
    case 'Startups':
      return 'startup'
    case 'Market Analysis':
      return 'analytics'
    case 'Investor Education':
      return 'education'
    case 'Fund News':
      return 'fund'
    default:
      return 'finance'
  }
}

export default function BlogPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')

  const filtered = allPosts.filter((post) => {
    const matchesSearch =
      search === '' ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase())
    const mappedCat = getCategoryForPost(post)
    const matchesCategory = activeCategory === 'All' || mappedCat === activeCategory
    return matchesSearch && matchesCategory
  })

  const featuredPost = allPosts[0]
  const featuredCategory = getCategoryForPost(featuredPost)

  return (
    <>
      {/* SEO-optimized Hero */}
      <section className="pt-40 pb-12 gradient-dark relative overflow-hidden">
        {/* Space: Rocket theme */}
        <SpaceHero variant="rocket" />
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-brand-red/3 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <span className="inline-flex items-center px-4 py-1.5 bg-brand-red/10 border border-brand-red/20 rounded-full text-brand-red text-xs font-semibold uppercase tracking-wider mb-6">
              <BookOpen className="w-4 h-4 mr-2" />
              Insights &amp; Analysis
            </span>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-4 mb-5 leading-tight">
              Financial Intelligence.{' '}
              <span className="text-gradient">Delivered.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-300 max-w-3xl leading-relaxed">
              Market insights, sector deep-dives, and thought leadership from the GHL India Ventures
              research team. Stay ahead of the curve in alternative investments.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Featured Article */}
      <section className="bg-white py-12">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-brand-black via-gray-900 to-brand-black border border-gray-800 group">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Image placeholder */}
                <div className="min-h-[280px]">
                  <PlaceholderImage theme={getPlaceholderTheme(featuredCategory)} aspectRatio="h-64 lg:h-full w-full" label="Featured Article" className="rounded-none" />
                </div>
                {/* Content */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <span className="inline-block px-3 py-1 bg-brand-red text-white text-xs font-bold uppercase tracking-wider rounded-full w-fit mb-4">
                    {featuredCategory}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-brand-red transition-colors leading-tight">
                    {featuredPost.title}
                  </h2>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1.5" />
                      {(featuredPost as typeof allPosts[number]).author}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5" />
                      {new Date(featuredPost.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1.5" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                  <Link
                    href={`${(featuredPost as typeof allPosts[number]).linkPrefix}/${featuredPost.slug}`}
                    className="inline-flex items-center text-brand-red font-bold hover:underline group/link"
                  >
                    Read Full Article
                    <ArrowRight className="ml-2 w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Filter Tabs + Search */}
      <section className="bg-white border-b border-gray-200 sticky top-20 z-30">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Search bar */}
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-grey" />
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10 text-sm"
                aria-label="Search articles"
              />
            </div>
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-brand-red text-white shadow-lg shadow-brand-red/25'
                      : 'bg-gray-100 text-brand-grey hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Masonry-style Blog Grid */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-brand-grey/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-brand-black mb-2">No articles found</h3>
              <p className="text-brand-grey">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
              {filtered.map((post, i) => {
                const mappedCat = getCategoryForPost(post)

                return (
                  <AnimatedSection key={post.slug} delay={i * 80}>
                    <div
                      className="card group hover:-translate-y-1 break-inside-avoid"
                      id={post.slug}
                    >
                      {/* 16:9 Image placeholder */}
                      <PlaceholderImage theme={getPlaceholderTheme(mappedCat)} aspectRatio="aspect-video" label={mappedCat} className="rounded-xl mb-4" />

                      {/* Category tag pill */}
                      <span className="inline-block px-3 py-1 bg-brand-red/10 text-brand-red text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                        {mappedCat}
                      </span>

                      {/* Title (max 2 lines) */}
                      <h3 className="font-bold text-lg text-brand-black mb-2 group-hover:text-brand-red transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>

                      {/* Author + date + read time */}
                      <div className="flex items-center gap-3 mb-3">
                        {/* Avatar placeholder */}
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-red/20 to-brand-red/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-brand-red/60" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-brand-grey">
                          <span className="font-medium text-brand-black/70">
                            {(post as typeof allPosts[number]).author}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(post.date).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {post.readTime}
                          </span>
                        </div>
                      </div>

                      {/* Excerpt (2 lines) */}
                      <p className="text-brand-grey text-sm mb-4 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>

                      {/* Read Article link */}
                      <Link
                        href={`${(post as typeof allPosts[number]).linkPrefix}/${post.slug}`}
                        className="inline-flex items-center text-brand-red text-sm font-semibold hover:underline group/link mt-auto"
                      >
                        Read Article
                        <ArrowRight className="ml-1.5 w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </AnimatedSection>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup Block */}
      <section className="section-padding bg-brand-black relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-red/5 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto relative z-10">
          <AnimatedSection>
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-brand-red" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Get investment insights delivered to your inbox.
              </h2>
              <p className="text-gray-400 text-base mb-6">
                Curated market analysis, sector deep-dives, and exclusive research from our team.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-lg mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="input-field flex-1"
                  aria-label="Email for newsletter"
                />
                <button className="inline-flex items-center justify-center px-8 py-3 bg-brand-red text-white font-bold rounded-lg hover:bg-red-700 transition-all whitespace-nowrap shadow-lg shadow-brand-red/25">
                  Subscribe
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
              <p className="text-gray-600 text-sm mt-4">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
