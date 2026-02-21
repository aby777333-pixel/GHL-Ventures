'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, TrendingUp, Target, ArrowRight, Crown, ChevronDown } from 'lucide-react'
import { formatINR } from '@/lib/calculatorUtils'

/* ============================================================
   ASSET CLASSES FOR GROWTH MAP
   ============================================================ */
const ASSETS = [
  { id: 'fd', name: 'Fixed Deposit', rate: 7.0, color: '#6B7280', taxRate: 0.30 },
  { id: 'ppf', name: 'PPF', rate: 7.1, color: '#10B981', taxRate: 0 },
  { id: 'gold', name: 'Gold (SGB)', rate: 10.0, color: '#F59E0B', taxRate: 0.125 },
  { id: 'nifty', name: 'NIFTY 50', rate: 14.0, color: '#3B82F6', taxRate: 0.125 },
  { id: 'realestate', name: 'Real Estate', rate: 8.0, color: '#22C55E', taxRate: 0.125 },
  { id: 'mf_equity', name: 'Equity MF', rate: 13.0, color: '#8B5CF6', taxRate: 0.125 },
  { id: 'ghl_deb', name: 'GHL Co-Invest', rate: 16.0, color: '#D0021B', taxRate: 0.30 },
  { id: 'ghl_aif', name: 'GHL AIF', rate: 20.0, color: '#EF4444', taxRate: 0.125 },
]

interface WealthGrowthMapProps {
  isOpen: boolean
  onClose: () => void
}

export default function WealthGrowthMap({ isOpen, onClose }: WealthGrowthMapProps) {
  const [amount, setAmount] = useState(10000000) // ₹1 Cr
  const [horizon, setHorizon] = useState<5 | 10 | 20>(10)
  const [selected, setSelected] = useState<string[]>(['fd', 'nifty', 'ghl_aif'])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Build year-by-year data
  const yearlyData = useMemo(() => {
    const data: { year: number; values: Record<string, number> }[] = []
    for (let y = 0; y <= horizon; y++) {
      const values: Record<string, number> = {}
      ASSETS.forEach(a => {
        values[a.id] = amount * Math.pow(1 + a.rate / 100, y)
      })
      data.push({ year: y, values })
    }
    return data
  }, [amount, horizon])

  // Final values for ranking
  const finalValues = useMemo(() => {
    return ASSETS.map(a => ({
      ...a,
      finalValue: amount * Math.pow(1 + a.rate / 100, horizon),
      gain: amount * Math.pow(1 + a.rate / 100, horizon) - amount,
      multiplier: Math.pow(1 + a.rate / 100, horizon),
    })).sort((a, b) => b.finalValue - a.finalValue)
  }, [amount, horizon])

  const maxFinal = finalValues[0]?.finalValue || 1

  // Chart scaling
  const chartMax = useMemo(() => {
    const selectedAssets = ASSETS.filter(a => selected.includes(a.id))
    let max = amount
    selectedAssets.forEach(a => {
      const val = amount * Math.pow(1 + a.rate / 100, horizon)
      if (val > max) max = val
    })
    return max * 1.1
  }, [amount, horizon, selected])

  const toggleAsset = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0D0D0D] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-white/10 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Wealth Growth Map</h2>
              <p className="text-xs text-gray-500">Year-by-year portfolio growth visualization</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Controls */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Investment Amount</label>
              <select
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value={1000000}>₹10 Lakh</option>
                <option value={2500000}>₹25 Lakh</option>
                <option value={5000000}>₹50 Lakh</option>
                <option value={10000000}>₹1 Crore</option>
                <option value={50000000}>₹5 Crore</option>
                <option value={100000000}>₹10 Crore</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Time Horizon</label>
              <div className="flex gap-2">
                {([5, 10, 20] as const).map(y => (
                  <button
                    key={y}
                    onClick={() => setHorizon(y)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      horizon === y
                        ? 'bg-violet-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {y} Years
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Asset toggles */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Select assets to compare on chart</label>
            <div className="flex flex-wrap gap-2">
              {ASSETS.map(a => (
                <button
                  key={a.id}
                  onClick={() => toggleAsset(a.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    selected.includes(a.id)
                      ? 'border-transparent text-white'
                      : 'border-white/10 text-gray-500 hover:text-gray-300'
                  }`}
                  style={selected.includes(a.id) ? { background: a.color } : {}}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>

          {/* Growth Chart (simplified bar chart per year) */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-4">Growth Trajectory — {formatINR(amount)} over {horizon} years</h3>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Chart area */}
                <div className="relative h-64 flex items-end gap-1">
                  {yearlyData.filter((_, i) => {
                    // Show every year for 5yr, every 2 for 10yr, every 4 for 20yr
                    if (horizon <= 5) return true
                    if (horizon <= 10) return i % 2 === 0 || i === horizon
                    return i % 4 === 0 || i === horizon
                  }).map((yd, idx) => {
                    const filteredAssets = ASSETS.filter(a => selected.includes(a.id))
                    const barWidth = filteredAssets.length > 0 ? 100 / filteredAssets.length : 100
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="flex items-end gap-px w-full h-52">
                          {filteredAssets.map(a => {
                            const val = yd.values[a.id]
                            const heightPct = Math.max((val / chartMax) * 100, 2)
                            return (
                              <div
                                key={a.id}
                                className="flex-1 rounded-t transition-all duration-300 relative group"
                                style={{ height: `${heightPct}%`, background: a.color, minWidth: '4px' }}
                              >
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 text-[9px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  {a.name}: {formatINR(val)}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1">Yr {yd.year}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Final Rankings Table */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">
              Final Value Ranking — After {horizon} Years
            </h3>
            <div className="space-y-2">
              {finalValues.map((asset, i) => (
                <div key={asset.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.05)', color: i < 3 ? '#000' : '#9CA3AF' }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-white font-medium truncate">{asset.name}</span>
                      <span className="text-xs text-gray-500">{asset.rate}% p.a.</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(asset.finalValue / maxFinal) * 100}%`, background: asset.color }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-white">{formatINR(asset.finalValue)}</div>
                    <div className="text-[10px] text-gray-500">{asset.multiplier.toFixed(1)}x</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gain Summary */}
          <div className="grid sm:grid-cols-3 gap-3">
            {finalValues.filter(a => a.id.startsWith('ghl')).concat(finalValues.filter(a => a.id === 'fd').slice(0, 1)).map(a => (
              <div key={a.id} className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
                <div className="text-xs text-gray-400 mb-1">{a.name}</div>
                <div className="text-lg font-bold text-white">{formatINR(a.finalValue)}</div>
                <div className="text-xs mt-1" style={{ color: a.color }}>
                  +{formatINR(a.gain)} gain ({((a.finalValue / amount - 1) * 100).toFixed(0)}%)
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-gray-600 text-center">
            Past performance does not guarantee future results. Projected returns are illustrative only. GHL India Ventures is a SEBI-registered Category II AIF. Investments in AIFs are subject to market risk.
          </p>
        </div>
      </div>
    </div>
  )
}
