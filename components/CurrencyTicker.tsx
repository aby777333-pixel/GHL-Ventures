'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface CurrencyRate {
  pair: string
  rate: number
  change: number
  flag: string
}

const BASE_RATES: CurrencyRate[] = [
  { pair: 'USD/INR', rate: 83.42, change: 0.12, flag: '🇺🇸' },
  { pair: 'EUR/INR', rate: 90.85, change: -0.08, flag: '🇪🇺' },
  { pair: 'GBP/INR', rate: 105.63, change: 0.23, flag: '🇬🇧' },
  { pair: 'JPY/INR', rate: 0.5524, change: -0.01, flag: '🇯🇵' },
  { pair: 'AED/INR', rate: 22.72, change: 0.03, flag: '🇦🇪' },
  { pair: 'SGD/INR', rate: 62.14, change: 0.15, flag: '🇸🇬' },
]

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

  return (
    <div
      className="w-full overflow-hidden py-1.5"
      style={{
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
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
  )
}
