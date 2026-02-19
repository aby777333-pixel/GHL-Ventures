'use client'

import { useState, useEffect } from 'react'
import { Newspaper, ChevronUp, ChevronDown, X, Globe, TrendingUp, TrendingDown, Minus, IndianRupee } from 'lucide-react'

interface NewsItem {
  id: number
  headline: string
  source: string
  time: string
  category: 'india' | 'global'
  sentiment: 'positive' | 'negative' | 'neutral'
}

const NEWS_FEED: NewsItem[] = [
  { id: 1, headline: 'SENSEX rallies 450 points; NIFTY crosses 23,800 on strong FII buying', source: 'ET Markets', time: '2 min ago', category: 'india', sentiment: 'positive' },
  { id: 2, headline: 'RBI holds repo rate at 6.25% — maintains accommodative stance for growth', source: 'Mint', time: '18 min ago', category: 'india', sentiment: 'neutral' },
  { id: 3, headline: 'India\'s GDP growth revised upward to 7.2% for FY26 by IMF', source: 'Reuters', time: '35 min ago', category: 'india', sentiment: 'positive' },
  { id: 4, headline: 'SEBI tightens AIF disclosure norms — enhanced reporting from Q3 2026', source: 'LiveMint', time: '1 hr ago', category: 'india', sentiment: 'neutral' },
  { id: 5, headline: 'Gold hits ₹78,200/10g as global safe-haven demand surges', source: 'MCX', time: '1 hr ago', category: 'india', sentiment: 'positive' },
  { id: 6, headline: 'US Fed signals potential rate cut in June as inflation eases to 2.3%', source: 'Bloomberg', time: '2 hr ago', category: 'global', sentiment: 'positive' },
  { id: 7, headline: 'China manufacturing PMI expands at fastest pace in 14 months', source: 'CNBC', time: '3 hr ago', category: 'global', sentiment: 'positive' },
  { id: 8, headline: 'European markets open higher on easing trade war tensions', source: 'FT', time: '3 hr ago', category: 'global', sentiment: 'positive' },
  { id: 9, headline: 'Crude oil drops below $72/bbl as OPEC+ signals production increase', source: 'Reuters', time: '4 hr ago', category: 'global', sentiment: 'negative' },
  { id: 10, headline: 'Japan\'s Nikkei 225 gains 1.8% on tech rally and weak yen boost', source: 'Nikkei Asia', time: '5 hr ago', category: 'global', sentiment: 'positive' },
  { id: 11, headline: 'Indian startup funding sees 40% jump in Q1 2026 — $4.2B raised', source: 'Inc42', time: '5 hr ago', category: 'india', sentiment: 'positive' },
  { id: 12, headline: 'Real estate sector sees 25% growth in Chennai micro-markets', source: 'PropTiger', time: '6 hr ago', category: 'india', sentiment: 'positive' },
]

export default function MarketNewsTicker() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [filter, setFilter] = useState<'all' | 'india' | 'global'>('all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showWidget, setShowWidget] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowWidget(true), 4000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isOpen || isMinimized) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % NEWS_FEED.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isOpen, isMinimized])

  const filtered = NEWS_FEED.filter(n => filter === 'all' || n.category === filter)

  const SentimentIcon = ({ sentiment }: { sentiment: string }) => {
    if (sentiment === 'positive') return <TrendingUp className="w-3 h-3 text-emerald-400" />
    if (sentiment === 'negative') return <TrendingDown className="w-3 h-3 text-red-400" />
    return <Minus className="w-3 h-3 text-gray-400" />
  }

  if (!showWidget) return null

  // Collapsed pill — bottom, to the left of Economic Calendar
  if (!isOpen) {
    const current = NEWS_FEED[currentIndex]
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed z-[9994] flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 hover:scale-[1.02] group"
        style={{
          bottom: '24px',
          right: '310px',
          maxWidth: '280px',
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
        title="Click to expand market news"
      >
        <div className="w-7 h-7 rounded-lg bg-brand-red/20 flex items-center justify-center shrink-0">
          <Newspaper className="w-3.5 h-3.5 text-brand-red" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[10px] text-gray-500 leading-none mb-0.5">
            {current.category === 'india' ? '🇮🇳 India' : '🌍 Global'} · {current.time}
          </p>
          <p className="text-[11px] text-gray-300 truncate leading-tight group-hover:text-white transition-colors">
            {current.headline}
          </p>
        </div>
        <SentimentIcon sentiment={current.sentiment} />
      </button>
    )
  }

  // Expanded panel — anchored at bottom, grows upward
  return (
    <div
      className="fixed z-[9994] rounded-2xl transition-all duration-300"
      style={{
        bottom: '24px',
        right: '310px',
        width: '300px',
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
    >
      {/* Content area — only shows when not minimized */}
      {!isMinimized && (
        <>
          {/* Filter tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5">
            {[
              { key: 'all' as const, label: 'All', icon: <Newspaper className="w-2.5 h-2.5" /> },
              { key: 'india' as const, label: 'India', icon: <IndianRupee className="w-2.5 h-2.5" /> },
              { key: 'global' as const, label: 'Global', icon: <Globe className="w-2.5 h-2.5" /> },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                  filter === f.key
                    ? 'bg-brand-red/20 text-brand-red'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>

          {/* News list — scrollable */}
          <div className="overflow-y-auto px-2 py-1" style={{ maxHeight: '300px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(208,2,27,0.3) transparent' }}>
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <SentimentIcon sentiment={item.sentiment} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-300 leading-snug group-hover:text-white transition-colors">
                    {item.headline}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-gray-600">{item.source}</span>
                    <span className="text-[9px] text-gray-700">·</span>
                    <span className="text-[9px] text-gray-600">{item.time}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                      item.category === 'india' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {item.category === 'india' ? '🇮🇳' : '🌍'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Simulated note */}
          <div className="px-3 py-1.5 border-t border-white/5 text-center">
            <span className="text-[9px] text-gray-600">Simulated · Updated every 5 min</span>
          </div>
        </>
      )}

      {/* Header bar — always at the bottom of the panel */}
      <div className="flex items-center justify-between px-3 py-2.5 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand-red/20 flex items-center justify-center">
            <Newspaper className="w-3 h-3 text-brand-red" />
          </div>
          <span className="text-white text-xs font-semibold">Market News</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title={isMinimized ? 'Expand' : 'Collapse'}
          >
            {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => { setIsOpen(false); setIsMinimized(false) }}
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
