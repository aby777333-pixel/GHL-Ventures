'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import {
  X, BookOpen, Clock, ChevronLeft, ChevronRight,
  Bookmark, BookmarkCheck, Share2, Copy, ExternalLink,
  Minus, Plus, Volume2, Languages, Sparkles, Lock,
  Check,
} from 'lucide-react'
import {
  getArticle, getCategory, getNextArticle, getPreviousArticle,
  DIFFICULTY_CONFIG, CATEGORY_ICONS,
} from '@/lib/educationData'
import type { Article, Category } from '@/lib/educationData'

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface ArticleReaderContextValue {
  openArticle: (id: number) => void
}

const ArticleReaderContext = createContext<ArticleReaderContextValue>({
  openArticle: () => {},
})
export const useArticleReader = () => useContext(ArticleReaderContext)

/* ------------------------------------------------------------------ */
/*  Local-storage helpers                                              */
/* ------------------------------------------------------------------ */

const LS_BOOKMARKS = 'ghl-edu-bookmarks'
const LS_PROGRESS = 'ghl-edu-progress'
const LS_FONTSIZE = 'ghl-edu-fontsize'

function getBookmarks(): number[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_BOOKMARKS) || '[]') } catch { return [] }
}
function setBookmarks(ids: number[]) {
  localStorage.setItem(LS_BOOKMARKS, JSON.stringify(ids))
}

function getProgress(): Record<number, number> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(LS_PROGRESS) || '{}') } catch { return {} }
}
function setProgress(p: Record<number, number>) {
  localStorage.setItem(LS_PROGRESS, JSON.stringify(p))
}

function getFontSize(): number {
  if (typeof window === 'undefined') return 16
  try { return parseInt(localStorage.getItem(LS_FONTSIZE) || '16') || 16 } catch { return 16 }
}
function setFontSizeLS(s: number) {
  localStorage.setItem(LS_FONTSIZE, String(s))
}

/* ------------------------------------------------------------------ */
/*  Provider + Modal                                                   */
/* ------------------------------------------------------------------ */

export function ArticleReaderProvider({ children }: { children: React.ReactNode }) {
  const [articleId, setArticleId] = useState<number | null>(null)
  const [scrollPct, setScrollPct] = useState(0)
  const [bookmarks, setBookmarksState] = useState<number[]>([])
  const [fontSize, setFontSize] = useState(16)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load from localStorage on mount
  useEffect(() => {
    setBookmarksState(getBookmarks())
    setFontSize(getFontSize())
  }, [])

  const openArticle = useCallback((id: number) => {
    setArticleId(id)
    setScrollPct(0)
    setShareOpen(false)
  }, [])

  const close = useCallback(() => {
    setArticleId(null)
    setScrollPct(0)
    setShareOpen(false)
  }, [])

  // Body scroll lock
  useEffect(() => {
    if (articleId !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [articleId])

  // ESC to close
  useEffect(() => {
    if (articleId === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [articleId, close])

  // Scroll tracking
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || articleId === null) return
    const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)
    const clamped = Math.min(100, Math.max(0, pct))
    setScrollPct(clamped)

    // Save to localStorage
    const progress = getProgress()
    if (clamped > (progress[articleId] || 0)) {
      progress[articleId] = clamped
      setProgress(progress)
    }
  }, [articleId])

  // Reset scroll position when article changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [articleId])

  // Bookmark toggle
  const toggleBookmark = useCallback((id: number) => {
    setBookmarksState(prev => {
      const next = prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
      setBookmarks(next)
      return next
    })
  }, [])

  // Font size
  const changeFontSize = useCallback((delta: number) => {
    setFontSize(prev => {
      const next = Math.min(24, Math.max(12, prev + delta))
      setFontSizeLS(next)
      return next
    })
  }, [])

  // Share
  const copyLink = useCallback(async () => {
    const url = window.location.origin + '/education/insights'
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  // Derive data
  const article = articleId !== null ? getArticle(articleId) : undefined
  const category = article ? getCategory(article.categoryId) : undefined
  const nextArt = articleId !== null ? getNextArticle(articleId) : undefined
  const prevArt = articleId !== null ? getPreviousArticle(articleId) : undefined
  const isBookmarked = articleId !== null && bookmarks.includes(articleId)
  const diffConfig = article ? DIFFICULTY_CONFIG[article.difficulty] : null

  return (
    <ArticleReaderContext.Provider value={{ openArticle }}>
      {children}

      {/* Backdrop */}
      {articleId !== null && (
        <div className="fixed inset-0 z-[9999] flex">
          {/* Click-outside overlay */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={close} />

          {/* Modal */}
          <div className="relative mx-auto w-full max-w-3xl flex flex-col bg-[#0A0A0A] overflow-hidden my-0 sm:my-4 sm:rounded-2xl border border-white/10">
            {/* Reading progress bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 z-10">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-200"
                style={{ width: `${scrollPct}%` }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {category && (
                  <span className={`text-xs px-2 py-0.5 rounded-full bg-${category.color}-500/20 text-${category.color}-400 whitespace-nowrap`}>
                    {category.name}
                  </span>
                )}
                {diffConfig && (
                  <span className="text-xs whitespace-nowrap">
                    {diffConfig.emoji} {diffConfig.label}
                  </span>
                )}
                {article && (
                  <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {article.readTime} min
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Font size */}
                <button
                  onClick={() => changeFontSize(-1)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Decrease font size"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-gray-500 w-5 text-center">{fontSize}</span>
                <button
                  onClick={() => changeFontSize(1)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Increase font size"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* Bookmark */}
                <button
                  onClick={() => articleId !== null && toggleBookmark(articleId)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isBookmarked
                      ? 'text-amber-400 bg-amber-400/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                >
                  {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>

                {/* Share */}
                <div className="relative">
                  <button
                    onClick={() => setShareOpen(!shareOpen)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  {shareOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg p-2 min-w-[160px] z-50 shadow-xl">
                      <button
                        onClick={copyLink}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-white/10 rounded-md transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied!' : 'Copy link'}
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(article?.title + ' — GHL India Ventures Education Hub')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-white/10 rounded-md transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article?.title + ' — GHL India Ventures')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-white/10 rounded-md transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Twitter / X
                      </a>
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window?.location?.origin + '/education/insights')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-white/10 rounded-md transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> LinkedIn
                      </a>
                    </div>
                  )}
                </div>

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* Close */}
                <button
                  onClick={close}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Close (ESC)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-5 sm:px-8 py-6"
            >
              {article && category && (
                <>
                  {/* Title */}
                  <h1
                    className="font-bold text-white leading-tight mb-4"
                    style={{ fontSize: `${fontSize + 8}px` }}
                  >
                    {article.title}
                  </h1>

                  {/* Meta line */}
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                    <span className="text-xs text-gray-500">Article {article.id} of 53</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {category.name}
                    </span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">{scrollPct}% read</span>
                  </div>

                  {/* Article content */}
                  <div className="space-y-4">
                    {article.content.map((para, i) => {
                      // Check if paragraph looks like a heading (short, no period at end)
                      const isHeading = para.length < 80 && !para.endsWith('.') && !para.endsWith(',') && !para.includes('. ')
                      if (isHeading) {
                        return (
                          <h2
                            key={i}
                            className="font-semibold text-white mt-6 mb-2"
                            style={{ fontSize: `${fontSize + 2}px` }}
                          >
                            {para}
                          </h2>
                        )
                      }
                      return (
                        <p
                          key={i}
                          className="text-gray-300 leading-relaxed"
                          style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
                        >
                          {para}
                        </p>
                      )
                    })}
                  </div>

                  {/* Disclaimer */}
                  <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-500 italic leading-relaxed">
                      Disclaimer: This article is for educational purposes only and does not constitute investment advice.
                      Investments in AIFs are subject to market risks including loss of principal.
                      Past performance is not indicative of future results. SEBI Reg. No. IN/AIF2/2425/1517.
                    </p>
                  </div>

                  {/* Coming Soon features */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    {[
                      { icon: Volume2, label: 'Listen (TTS)' },
                      { icon: Languages, label: 'Translate' },
                      { icon: Sparkles, label: 'AI Summary' },
                    ].map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        disabled
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-500 text-xs cursor-not-allowed group relative"
                      >
                        <Lock className="w-3 h-3" />
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white/10 text-gray-400 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Coming Soon
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Prev / Next navigation */}
                  <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between gap-4">
                    {prevArt ? (
                      <button
                        onClick={() => openArticle(prevArt.id)}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
                      >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="truncate max-w-[200px]">{prevArt.title}</span>
                      </button>
                    ) : <div />}
                    {nextArt ? (
                      <button
                        onClick={() => openArticle(nextArt.id)}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group text-right"
                      >
                        <span className="truncate max-w-[200px]">{nextArt.title}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ) : <div />}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </ArticleReaderContext.Provider>
  )
}
