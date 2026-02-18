'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, TrendingUp, AlertTriangle, ShieldCheck, Flame, ThermometerSun } from 'lucide-react'
import { formatINR } from '@/lib/calculatorUtils'

/* ============================================================
   INFLATION-ADJUSTED RETURN DATA
   ============================================================ */
const ASSETS = [
  { id: 'savings', name: 'Savings Account', nominalRate: 3.5, color: '#4B5563', icon: '🏦' },
  { id: 'fd', name: 'Bank FD', nominalRate: 7.0, color: '#6B7280', icon: '🏛️' },
  { id: 'ppf', name: 'PPF', nominalRate: 7.1, color: '#10B981', icon: '🛡️' },
  { id: 'gold', name: 'Gold', nominalRate: 10.0, color: '#F59E0B', icon: '🪙' },
  { id: 'nps', name: 'NPS', nominalRate: 9.5, color: '#0EA5E9', icon: '📊' },
  { id: 'debt_mf', name: 'Debt MF', nominalRate: 7.5, color: '#9CA3AF', icon: '📄' },
  { id: 'realestate', name: 'Real Estate', nominalRate: 8.0, color: '#22C55E', icon: '🏠' },
  { id: 'equity_mf', name: 'Equity MF', nominalRate: 13.0, color: '#3B82F6', icon: '📈' },
  { id: 'nifty', name: 'NIFTY 50', nominalRate: 14.0, color: '#2563EB', icon: '📊' },
  { id: 'ghl_deb', name: 'GHL Debenture', nominalRate: 16.0, color: '#D0021B', icon: '🔴' },
  { id: 'ghl_aif', name: 'GHL AIF', nominalRate: 20.0, color: '#EF4444', icon: '🚀' },
]

const CPI_RATES = [
  { label: '4% (RBI Target)', rate: 4 },
  { label: '5% (Recent Avg)', rate: 5 },
  { label: '6% (High)', rate: 6 },
  { label: '7% (Very High)', rate: 7 },
  { label: '8% (Crisis)', rate: 8 },
]

interface InflationProofCheckerProps {
  isOpen: boolean
  onClose: () => void
}

export default function InflationProofChecker({ isOpen, onClose }: InflationProofCheckerProps) {
  const [amount, setAmount] = useState(10000000)
  const [years, setYears] = useState(10)
  const [cpiIdx, setCpiIdx] = useState(1) // 5% default

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const cpiRate = CPI_RATES[cpiIdx].rate

  const results = useMemo(() => {
    return ASSETS.map(a => {
      const nominalValue = amount * Math.pow(1 + a.nominalRate / 100, years)
      const realValue = nominalValue / Math.pow(1 + cpiRate / 100, years)
      const realRate = ((1 + a.nominalRate / 100) / (1 + cpiRate / 100) - 1) * 100
      const purchasingPowerKept = (realValue / amount) * 100
      const beatsInflation = a.nominalRate > cpiRate
      const inflationCost = nominalValue - realValue

      return {
        ...a,
        nominalValue,
        realValue,
        realRate,
        purchasingPowerKept,
        beatsInflation,
        inflationCost,
      }
    }).sort((a, b) => b.realValue - a.realValue)
  }, [amount, years, cpiRate])

  const losers = results.filter(r => !r.beatsInflation)
  const winners = results.filter(r => r.beatsInflation)

  // Purchasing power of uninvested money
  const cashPP = amount / Math.pow(1 + cpiRate / 100, years)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0D0D0D] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-white/10 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Inflation-Proof Checker</h2>
              <p className="text-xs text-gray-500">Is your investment beating inflation?</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Controls */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Investment Amount</label>
              <select
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value={1000000}>₹10 Lakh</option>
                <option value={2500000}>₹25 Lakh</option>
                <option value={5000000}>₹50 Lakh</option>
                <option value={10000000}>₹1 Crore</option>
                <option value={50000000}>₹5 Crore</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Time Period: {years} years</label>
              <input
                type="range"
                min={1}
                max={20}
                value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>1 yr</span><span>10 yr</span><span>20 yr</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Assumed CPI Inflation</label>
              <select
                value={cpiIdx}
                onChange={e => setCpiIdx(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                {CPI_RATES.map((c, i) => (
                  <option key={i} value={i}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cash Purchasing Power Warning */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3">
            <Flame className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <div className="text-sm text-red-300 font-medium">Inflation Erodes Cash</div>
              <p className="text-xs text-red-200/60 mt-1">
                If you keep {formatINR(amount)} as cash for {years} years at {cpiRate}% inflation, its real purchasing power drops to just <strong className="text-red-300">{formatINR(cashPP)}</strong> — a loss of <strong className="text-red-300">{formatINR(amount - cashPP)}</strong> in buying power.
              </p>
            </div>
          </div>

          {/* Inflation Winners */}
          {winners.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-400">
                  Beats Inflation ({winners.length} investments)
                </h3>
              </div>
              <div className="space-y-2">
                {winners.map((r, i) => (
                  <div key={r.id} className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{r.icon}</span>
                        <div>
                          <span className="text-sm text-white font-medium">{r.name}</span>
                          <span className="text-xs text-gray-500 ml-2">{r.nominalRate}% nominal</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">+{r.realRate.toFixed(1)}% real</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-500">Nominal Value</div>
                        <div className="text-xs text-white font-medium">{formatINR(r.nominalValue)}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-500">Real Value (Today&apos;s ₹)</div>
                        <div className="text-xs text-emerald-400 font-medium">{formatINR(r.realValue)}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-500">Purchasing Power</div>
                        <div className="text-xs text-white font-medium">{r.purchasingPowerKept.toFixed(0)}%</div>
                      </div>
                    </div>
                    {/* Real value bar */}
                    <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((r.realValue / (results[0]?.realValue || 1)) * 100, 100)}%`,
                          background: r.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inflation Losers */}
          {losers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-red-400">
                  Loses to Inflation ({losers.length} investments)
                </h3>
              </div>
              <div className="space-y-2">
                {losers.map(r => (
                  <div key={r.id} className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{r.icon}</span>
                        <div>
                          <span className="text-sm text-white font-medium">{r.name}</span>
                          <span className="text-xs text-gray-500 ml-2">{r.nominalRate}% nominal</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-400">{r.realRate.toFixed(1)}% real</div>
                        <div className="text-[10px] text-red-400/60">Losing money in real terms</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-500">Nominal Value</div>
                        <div className="text-xs text-white font-medium">{formatINR(r.nominalValue)}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-500">Real Value (Today&apos;s ₹)</div>
                        <div className="text-xs text-red-400 font-medium">{formatINR(r.realValue)}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-500">Purchasing Power</div>
                        <div className="text-xs text-red-400 font-medium">{r.purchasingPowerKept.toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
              <ThermometerSun className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <div className="text-xs text-gray-400">Inflation Cost on {formatINR(amount)}</div>
              <div className="text-lg font-bold text-amber-400 mt-1">
                {formatINR(amount - cashPP)}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                Lost in {years} years at {cpiRate}% CPI if kept as cash
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-xs text-gray-400">Best Inflation-Proof Option</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                {results[0]?.name || 'N/A'}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                Real value: {formatINR(results[0]?.realValue || 0)} ({results[0]?.purchasingPowerKept.toFixed(0)}% purchasing power)
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-600 text-center">
            Calculations use nominal returns vs CPI inflation. Actual returns may vary. Tax impact not included — use our Tax Impact Analyzer for post-tax analysis. GHL India Ventures — SEBI-registered Category II AIF.
          </p>
        </div>
      </div>
    </div>
  )
}
