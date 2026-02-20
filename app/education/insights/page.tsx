'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Search, BookOpen, Clock, Bookmark, BookmarkCheck,
  ArrowRight, Trophy, Flame, Star, ChevronRight,
  Filter, X, Award, TrendingUp, Download, FileText,
  Lock, CheckCircle2, Sparkles,
} from 'lucide-react'
import SpaceHero from '@/components/SpaceHero'
import AnimatedSection from '@/components/AnimatedSection'
import { useArticleReader } from '@/components/ArticleReader'
import {
  CATEGORIES, ARTICLES, getArticlesByCategory, searchArticles,
  DIFFICULTY_CONFIG, CATEGORY_ICONS,
} from '@/lib/educationData'
import type { Article, Category, Difficulty } from '@/lib/educationData'

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

const LS_BOOKMARKS = 'ghl-edu-bookmarks'
const LS_PROGRESS = 'ghl-edu-progress'

function getBookmarks(): number[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_BOOKMARKS) || '[]') } catch { return [] }
}
function setBookmarksLS(ids: number[]) {
  localStorage.setItem(LS_BOOKMARKS, JSON.stringify(ids))
}

function getProgress(): Record<number, number> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(LS_PROGRESS) || '{}') } catch { return {} }
}

/* ------------------------------------------------------------------ */
/*  Reading Progress Ring (SVG)                                        */
/* ------------------------------------------------------------------ */

function ProgressRing({ pct, size = 36 }: { pct: number; size?: number }) {
  const r = (size - 4) / 2
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={3} opacity={0.1} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={pct >= 100 ? '#10b981' : pct > 0 ? '#f59e0b' : 'transparent'}
        strokeWidth={3}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
      {pct >= 100 && (
        <text
          x={size / 2} y={size / 2}
          textAnchor="middle" dominantBaseline="central"
          className="fill-emerald-400"
          style={{ fontSize: '10px', transform: 'rotate(90deg)', transformOrigin: 'center' }}
        >
          ✓
        </text>
      )}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Glow card color classes (cycling)                                   */
/* ------------------------------------------------------------------ */

const GLOW_COLORS = [
  'glow-card-red', 'glow-card-blue', 'glow-card-emerald', 'glow-card-amber',
  'glow-card-violet', 'glow-card-cyan', 'glow-card-rose', 'glow-card-orange',
  'glow-card-indigo', 'glow-card-teal',
]

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function InsightsPage() {
  const { openArticle } = useArticleReader()
  const [activeTab, setActiveTab] = useState<number>(0) // 0 = All, 1-8 = categories, 9 = Compendium
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [progress, setProgressState] = useState<Record<number, number>>({})
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [mounted, setMounted] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)

  // Load from localStorage
  useEffect(() => {
    setBookmarks(getBookmarks())
    setProgressState(getProgress())
    setMounted(true)

    // Listen for storage changes (from reader modal)
    const handler = () => {
      setBookmarks(getBookmarks())
      setProgressState(getProgress())
    }
    window.addEventListener('storage', handler)
    // Also poll every 2s for same-tab updates
    const poll = setInterval(handler, 2000)
    return () => {
      window.removeEventListener('storage', handler)
      clearInterval(poll)
    }
  }, [])

  // Toggle bookmark
  const toggleBookmark = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
      setBookmarksLS(next)
      return next
    })
  }, [])

  // Filter articles
  const filteredArticles = useMemo(() => {
    let arts = searchQuery.trim()
      ? searchArticles(searchQuery.trim())
      : activeTab === 0
        ? ARTICLES
        : getArticlesByCategory(activeTab)

    if (showBookmarksOnly) {
      arts = arts.filter(a => bookmarks.includes(a.id))
    }

    return arts
  }, [searchQuery, activeTab, showBookmarksOnly, bookmarks])

  // Stats
  const readCount = useMemo(() => {
    return Object.values(progress).filter(p => p >= 90).length
  }, [progress])

  const knowledgeScore = useMemo(() => {
    let score = 0
    ARTICLES.forEach(a => {
      if ((progress[a.id] || 0) >= 90) {
        score += DIFFICULTY_CONFIG[a.difficulty].points
      }
    })
    return score
  }, [progress])

  const maxScore = useMemo(() => {
    return ARTICLES.reduce((sum, a) => sum + DIFFICULTY_CONFIG[a.difficulty].points, 0)
  }, [])

  // Category completion badges
  const categoryCompletion = useMemo(() => {
    const map: Record<number, { total: number; done: number }> = {}
    CATEGORIES.forEach(c => {
      const arts = getArticlesByCategory(c.id)
      const done = arts.filter(a => (progress[a.id] || 0) >= 90).length
      map[c.id] = { total: arts.length, done }
    })
    return map
  }, [progress])

  // Smart recommendations
  const recommendations = useMemo(() => {
    const unread = ARTICLES.filter(a => (progress[a.id] || 0) < 50)
    // Prioritize articles in categories where user has some progress
    const catProgress: Record<number, number> = {}
    CATEGORIES.forEach(c => {
      const arts = getArticlesByCategory(c.id)
      const readInCat = arts.filter(a => (progress[a.id] || 0) >= 50).length
      if (readInCat > 0 && readInCat < arts.length) {
        catProgress[c.id] = readInCat
      }
    })

    const prioritized = unread.sort((a, b) => {
      const aP = catProgress[a.categoryId] || 0
      const bP = catProgress[b.categoryId] || 0
      return bP - aP
    })

    return prioritized.slice(0, 3)
  }, [progress])

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center gradient-dark overflow-hidden">
        <SpaceHero variant="datastream" />
        {/* Decorative blurs */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-brand-red rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-40 pb-12">
          <AnimatedSection>
            <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-8">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-500">Education</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-brand-red font-medium">Insights</span>
            </nav>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
              Investor Education<br />
              <span className="text-gradient">Hub</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-xl leading-relaxed">
              53 Articles · 8 Categories · One Mission: Informed Investing
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Progress Dashboard */}
      <section className="section-padding bg-brand-offwhite border-b border-brand-black/5">
        <div className="container-max">
          <AnimatedSection>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Articles Read */}
              <div className="card rounded-2xl p-5 flex items-center gap-4">
                <div className="relative">
                  <ProgressRing pct={mounted ? (readCount / 53) * 100 : 0} size={56} />
                  <BookOpen className="absolute inset-0 m-auto w-5 h-5 text-brand-grey" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-black">{mounted ? readCount : 0}<span className="text-brand-grey text-sm font-normal"> / 53</span></p>
                  <p className="text-xs text-brand-grey">Articles Completed</p>
                </div>
              </div>

              {/* Knowledge Score */}
              <div className="card rounded-2xl p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-black">{mounted ? knowledgeScore : 0}<span className="text-brand-grey text-sm font-normal"> / {maxScore}</span></p>
                  <p className="text-xs text-brand-grey">Knowledge Score</p>
                </div>
              </div>

              {/* Bookmarks */}
              <div className="card rounded-2xl p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <BookmarkCheck className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-black">{mounted ? bookmarks.length : 0}</p>
                  <p className="text-xs text-brand-grey">Saved Bookmarks</p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Smart Recommendations */}
          {mounted && recommendations.length > 0 && readCount > 0 && readCount < 53 && (
            <AnimatedSection className="mt-6">
              <div className="bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <p className="text-sm font-medium text-amber-400">Recommended for You</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recommendations.map(art => (
                    <button
                      key={art.id}
                      onClick={() => openArticle(art.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 card rounded-lg text-xs text-brand-grey hover:text-brand-black transition-colors"
                    >
                      <span>{art.title}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>

      {/* Search + Category Tabs + Grid */}
      <section className="section-padding bg-brand-offwhite" id="articles">
        <div className="container-max">
          {/* Search Bar */}
          <AnimatedSection>
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-grey" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setActiveTab(0) }}
                placeholder="Search 53 articles by title, topic, or keyword…"
                className="input-field w-full pl-12 pr-12 py-4 rounded-2xl text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-grey hover:text-brand-black"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </AnimatedSection>

          {/* Filters row */}
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  showBookmarksOnly
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'card text-brand-grey hover:text-brand-black'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                My Bookmarks
              </button>
              {searchQuery && (
                <span className="text-xs text-gray-500">
                  {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>
          </AnimatedSection>

          {/* Category Tabs */}
          {!searchQuery && (
            <AnimatedSection>
              <div className="relative mb-8">
                {/* Gradient fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-brand-offwhite to-transparent z-10 pointer-events-none sm:hidden" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-brand-offwhite to-transparent z-10 pointer-events-none sm:hidden" />

                <div ref={tabsRef} className="flex overflow-x-auto scrollbar-hide gap-1 pb-2 -mx-1 px-1">
                  {/* All tab */}
                  <button
                    onClick={() => setActiveTab(0)}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                      activeTab === 0
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : 'card text-brand-grey hover:text-brand-black'
                    }`}
                  >
                    All Articles
                    <span className="ml-1.5 text-[10px] opacity-60">53</span>
                  </button>

                  {/* Category tabs */}
                  {CATEGORIES.map(cat => {
                    const Icon = CATEGORY_ICONS[cat.icon]
                    const comp = categoryCompletion[cat.id]
                    const isComplete = comp && comp.done === comp.total && comp.total > 0
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveTab(cat.id)}
                        className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${
                          activeTab === cat.id
                            ? `bg-${cat.color}-500/10 text-${cat.color}-400 border border-${cat.color}-500/30`
                            : 'card text-brand-grey hover:text-brand-black'
                        }`}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        {cat.name}
                        <span className="text-[10px] opacity-60">{cat.articleCount}</span>
                        {isComplete && mounted && <Award className="w-3 h-3 text-amber-400" />}
                      </button>
                    )
                  })}

                  {/* Compendium tab */}
                  <button
                    onClick={() => setActiveTab(9)}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${
                      activeTab === 9
                        ? 'bg-brand-black/10 text-brand-black border border-brand-black/20'
                        : 'card text-brand-grey hover:text-brand-black'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Complete Compendium
                  </button>
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* Article Grid */}
          {activeTab !== 9 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredArticles.map((art, idx) => {
                const cat = CATEGORIES.find(c => c.id === art.categoryId)
                const diff = DIFFICULTY_CONFIG[art.difficulty]
                const pct = mounted ? (progress[art.id] || 0) : 0
                const isRead = pct >= 90
                const isBm = mounted && bookmarks.includes(art.id)
                const glowClass = GLOW_COLORS[idx % GLOW_COLORS.length]

                return (
                  <AnimatedSection key={art.id}>
                    <div
                      className={`${glowClass} group cursor-pointer h-full flex flex-col`}
                      onClick={() => openArticle(art.id)}
                    >
                      <div className="p-5 flex flex-col flex-1">
                        {/* Top row: progress ring + badges */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <ProgressRing pct={pct} size={32} />
                            {cat && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${cat.color}-500/15 text-${cat.color}-400`}>
                                {cat.name}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={e => toggleBookmark(art.id, e)}
                            className={`p-1 rounded-lg transition-colors ${
                              isBm ? 'text-amber-400' : 'text-gray-600 hover:text-gray-300'
                            }`}
                          >
                            {isBm ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Difficulty + Read time */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] text-gray-500">{diff.emoji} {diff.label}</span>
                          <span className="text-[10px] text-gray-600">·</span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {art.readTime} min
                          </span>
                          {isRead && mounted && (
                            <>
                              <span className="text-[10px] text-gray-600">·</span>
                              <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Read
                              </span>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-semibold text-brand-black group-hover:text-brand-red transition-colors mb-2 line-clamp-2 leading-snug">
                          {art.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-brand-grey line-clamp-2 flex-1 leading-relaxed">
                          {art.description}
                        </p>

                        {/* Read button */}
                        <div className="mt-4 pt-3 border-t border-brand-black/5">
                          <span className="inline-flex items-center gap-1 text-xs text-brand-red font-medium transition-colors">
                            {isRead ? 'Read Again' : 'Read Article'}
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>
                )
              })}
            </div>
          )}

          {/* Empty state */}
          {filteredArticles.length === 0 && activeTab !== 9 && (
            <AnimatedSection>
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">No articles found matching your search.</p>
                <button
                  onClick={() => { setSearchQuery(''); setShowBookmarksOnly(false) }}
                  className="mt-3 text-red-400 text-sm hover:text-red-300 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            </AnimatedSection>
          )}

          {/* Compendium tab content */}
          {activeTab === 9 && (
            <AnimatedSection>
              <div className="max-w-xl mx-auto text-center py-12">
                <div className="w-20 h-20 rounded-2xl card flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-brand-grey" />
                </div>
                <h3 className="text-xl font-bold text-brand-black mb-3">Complete Education Compendium</h3>
                <p className="text-sm text-brand-grey mb-2">
                  All 53 articles compiled into a single PDF document for offline reading and reference.
                </p>
                <p className="text-xs text-brand-grey/60 mb-6">
                  February 2026 Edition · ~120 pages · PDF format
                </p>
                <button
                  disabled
                  className="inline-flex items-center gap-2 px-6 py-3 card rounded-xl text-brand-grey text-sm cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <Download className="w-4 h-4" />
                  Download PDF
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 ml-1">Coming Soon</span>
                </button>
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>

      {/* Learning Path Section */}
      <section className="section-padding bg-brand-offwhite border-t border-brand-black/5">
        <div className="container-max">
          <AnimatedSection>
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-brand-black mb-2">Your Learning Path</h2>
              <p className="text-sm text-brand-grey">Progress through each category from beginner to advanced</p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map(cat => {
              const Icon = CATEGORY_ICONS[cat.icon]
              const comp = categoryCompletion[cat.id]
              const pctDone = comp ? Math.round((comp.done / comp.total) * 100) : 0
              const isComplete = comp && comp.done === comp.total && comp.total > 0

              return (
                <AnimatedSection key={cat.id}>
                  <div
                    className="card rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => { setActiveTab(cat.id); document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth' }) }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-${cat.color}-500/10 flex items-center justify-center`}>
                        {Icon && <Icon className={`w-5 h-5 text-${cat.color}-400`} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-brand-black">{cat.name}</p>
                        <p className="text-[10px] text-brand-grey">
                          {mounted ? comp?.done || 0 : 0} / {comp?.total || 0} articles
                        </p>
                      </div>
                      {isComplete && mounted && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10">
                          <Award className="w-3 h-3 text-amber-400" />
                          <span className="text-[10px] text-amber-400 font-medium">Master</span>
                        </div>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-brand-black/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isComplete ? 'bg-emerald-500' : `bg-${cat.color}-500`
                        }`}
                        style={{ width: mounted ? `${pctDone}%` : '0%' }}
                      />
                    </div>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-brand-offwhite border-t border-brand-black/5">
        <div className="container-max">
          <AnimatedSection>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-brand-black mb-3">
                Ready to Put Your Knowledge Into Action?
              </h2>
              <p className="text-sm text-brand-grey mb-8">
                Now that you understand AIFs, stressed real estate, and venture capital investing,
                explore how GHL India Ventures can be part of your wealth strategy.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/fund"
                  className="btn-primary px-8 py-3 inline-flex items-center gap-2 text-sm"
                >
                  Explore the Fund <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-3 border border-brand-black/20 rounded-xl text-sm text-brand-grey hover:text-brand-black hover:bg-brand-black/5 transition-all inline-flex items-center gap-2"
                >
                  Talk to Our Team <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
