'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, X } from 'lucide-react'
import { ALL_MARKET_DATA, ECONOMIC_HEADLINES } from '@/lib/marketData'
import type { MarketTicker } from '@/lib/marketData'

export default function MarketDataMarquee() {
  const [dismissed, setDismissed] = useState(true)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('ghl-market-dismissed')
    if (wasDismissed !== 'true') setDismissed(false)

    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      setCurrentTime(`${hours}:${minutes} IST`)
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('ghl-market-dismissed', 'true')
  }

  if (dismissed) return null

  const renderTickerItem = (ticker: MarketTicker, index: number) => (
    <span key={`${ticker.symbol}-${index}`} className="inline-flex items-center shrink-0">
      {index > 0 && (
        <span className="mx-3 text-white/20" style={{ fontSize: '6px' }}>{'\u25CF'}</span>
      )}
      <span className="text-white/50 mr-1.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>
        {ticker.label}
      </span>
      <span className="text-white font-mono font-semibold mr-1" style={{ fontSize: '10.5px' }}>
        {ticker.value}
      </span>
      <span
        className={`inline-flex items-center font-mono ${ticker.isPositive ? 'text-emerald-400' : 'text-red-400'}`}
        style={{ fontSize: '10px' }}
      >
        {ticker.isPositive ? (
          <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
        ) : (
          <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
        )}
        {ticker.changePercent}
      </span>
    </span>
  )

  const renderHeadlines = () =>
    ECONOMIC_HEADLINES.map((headline, index) => (
      <span key={`headline-${index}`} className="inline-flex items-center shrink-0">
        <span className="mx-4 text-amber-400/80" style={{ fontSize: '10px' }}>
          {'\uD83D\uDCF0'}
        </span>
        <span className="text-white/60 italic" style={{ fontSize: '10px' }}>
          {headline}
        </span>
      </span>
    ))

  const tickerContent = (
    <>
      {ALL_MARKET_DATA.map((ticker, index) => renderTickerItem(ticker, index))}
      {renderHeadlines()}
    </>
  )

  return (
    <div className="relative w-full" style={{ backgroundColor: '#0d0d0d' }}>
      <div className="max-w-7xl mx-auto overflow-hidden relative">
        <div
          className="flex whitespace-nowrap py-2 animate-marquee-fast"
          style={{ animationPlayState: 'running' }}
          onMouseEnter={(e) => { e.currentTarget.style.animationPlayState = 'paused' }}
          onMouseLeave={(e) => { e.currentTarget.style.animationPlayState = 'running' }}
        >
          <div className="flex items-center shrink-0 pr-8">{tickerContent}</div>
          <div className="flex items-center shrink-0 pr-8">{tickerContent}</div>
        </div>

        {currentTime && (
          <span
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white/25 font-mono z-10 pointer-events-none hidden sm:inline"
            style={{ fontSize: '8px' }}
          >
            {currentTime}
          </span>
        )}

        <button
          onClick={handleDismiss}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-0.5 rounded text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
          aria-label="Dismiss market data bar"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
