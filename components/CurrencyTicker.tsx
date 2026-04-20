'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface CurrencyRate {
  pair: string
  rate: number
  change: number
  flag: string
}

// Mock data removed (2026-04-20) — previously had hardcoded FX rates with
// simulated fluctuations. Widget short-circuits to null when empty so the
// page layout isn't affected.
const BASE_RATES: CurrencyRate[] = []

export default function CurrencyTicker() {
  const [rates, setRates] = useState<CurrencyRate[]>(BASE_RATES)

  // Simulate live rate fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setRates(prev =>
        prev.map(r => {
          const fluctuation = (Math.random() - 0.5) * 0.3
          const newRate = +(r.rate + fluctuation * (r.rate / 100)).toFixed(r.rate < 1 ? 4 : 2)
          const newChange = +(fluctuation * (r.rate / 100)).toFixed(2)
          return { ...r, rate: newRate, change: newChange }
        })
      )
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  if (rates.length === 0) return null

  return (
    <div
      className="w-full py-1.5"
      style={{
        background: '#0d0d0d',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="max-w-7xl mx-auto overflow-hidden">
        <div className="flex animate-marquee-fast whitespace-nowrap">
          {[0, 1].map(set => (
            <div key={set} className="flex items-center">
              {rates.map((r, i) => (
                <span key={`${set}-${i}`} className="inline-flex items-center gap-1.5 px-4 text-[10px] font-medium">
                  <span className="text-gray-500">{r.flag}</span>
                  <span className="text-gray-400">{r.pair}</span>
                  <span className="text-white font-semibold">{r.rate < 1 ? r.rate.toFixed(4) : r.rate.toFixed(2)}</span>
                  <span className={`inline-flex items-center gap-0.5 ${
                    r.change > 0 ? 'text-emerald-400' : r.change < 0 ? 'text-red-400' : 'text-gray-500'
                  }`}>
                    {r.change > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : r.change < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                    {r.change > 0 ? '+' : ''}{r.change.toFixed(2)}
                  </span>
                  <span className="text-gray-700 mx-2">|</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
