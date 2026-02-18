'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  X, Calculator, TrendingUp, IndianRupee, BarChart3, Layers,
  ArrowRight, CheckCircle2, AlertTriangle, Crown, Percent,
  Clock, ShieldCheck, Zap, Scale, Trophy, ChevronDown
} from 'lucide-react'
import { formatINR } from '@/lib/calculatorUtils'

/* ============================================================
   ALL-INDIA INVESTMENT VEHICLES DATA
   ============================================================ */
const INVESTMENT_VEHICLES = [
  {
    id: 'fd',
    name: 'Bank Fixed Deposit',
    shortName: 'FD',
    returnRate: 7.0,
    minInvestment: 10000,
    lockIn: '1-5 years',
    taxBracket: 'Slab rate (up to 30%)',
    risk: 'Low',
    riskLevel: 1,
    liquidity: 'High (with penalty)',
    regulator: 'RBI',
    color: '#6B7280',
    icon: ShieldCheck,
    pros: ['Capital protection', 'Guaranteed returns', 'Easy to open'],
    cons: ['Low real returns after inflation', 'Interest fully taxable', 'No wealth creation'],
  },
  {
    id: 'ppf',
    name: 'Public Provident Fund',
    shortName: 'PPF',
    returnRate: 7.1,
    minInvestment: 500,
    lockIn: '15 years',
    taxBracket: 'Tax-free (EEE)',
    risk: 'Zero',
    riskLevel: 0,
    liquidity: 'Very Low',
    regulator: 'Govt of India',
    color: '#10B981',
    icon: ShieldCheck,
    pros: ['Tax-free returns', 'Government backed', 'EEE tax benefit'],
    cons: ['15-year lock-in', 'Low returns', '₹1.5L annual cap'],
  },
  {
    id: 'nps',
    name: 'National Pension System',
    shortName: 'NPS',
    returnRate: 9.5,
    minInvestment: 6000,
    lockIn: 'Till age 60',
    taxBracket: 'Partial tax-free',
    risk: 'Low-Medium',
    riskLevel: 2,
    liquidity: 'Very Low',
    regulator: 'PFRDA',
    color: '#0EA5E9',
    icon: Clock,
    pros: ['Extra ₹50K tax deduction', 'Low expense ratio', 'Pension income'],
    cons: ['Locked till 60', 'Mandatory annuity purchase', 'Limited withdrawal'],
  },
  {
    id: 'gold',
    name: 'Gold (SGB / Physical)',
    shortName: 'Gold',
    returnRate: 10.0,
    minInvestment: 5000,
    lockIn: '5-8 yrs (SGB)',
    taxBracket: 'LTCG 12.5% after 3 yrs',
    risk: 'Low-Medium',
    riskLevel: 2,
    liquidity: 'Medium',
    regulator: 'RBI (SGB)',
    color: '#F59E0B',
    icon: Crown,
    pros: ['Inflation hedge', 'SGB gives 2.5% p.a. interest', 'No storage cost (SGB)'],
    cons: ['No regular income', 'Price volatility', 'Physical gold has making charges'],
  },
  {
    id: 'realestate',
    name: 'Direct Real Estate',
    shortName: 'Real Estate',
    returnRate: 8.0,
    minInvestment: 5000000,
    lockIn: '5-10 years',
    taxBracket: 'LTCG 12.5% after 2 yrs',
    risk: 'Medium',
    riskLevel: 3,
    liquidity: 'Very Low',
    regulator: 'RERA',
    color: '#22C55E',
    icon: Scale,
    pros: ['Rental income', 'Tangible asset', 'Leverage via loans'],
    cons: ['High entry cost', 'Illiquid', 'Maintenance & legal hassles'],
  },
  {
    id: 'mf_equity',
    name: 'Equity Mutual Funds',
    shortName: 'Equity MF',
    returnRate: 13.0,
    minInvestment: 500,
    lockIn: 'None (ELSS: 3 yrs)',
    taxBracket: 'LTCG 12.5% above ₹1.25L',
    risk: 'Medium-High',
    riskLevel: 4,
    liquidity: 'High',
    regulator: 'SEBI',
    color: '#3B82F6',
    icon: TrendingUp,
    pros: ['Professional management', 'SIP from ₹500', 'High liquidity'],
    cons: ['Market volatility', 'Expense ratio', 'No guaranteed returns'],
  },
  {
    id: 'nifty50',
    name: 'NIFTY 50 Index Fund',
    shortName: 'NIFTY 50',
    returnRate: 12.5,
    minInvestment: 500,
    lockIn: 'None',
    taxBracket: 'LTCG 12.5% above ₹1.25L',
    risk: 'Medium-High',
    riskLevel: 4,
    liquidity: 'High',
    regulator: 'SEBI',
    color: '#6366F1',
    icon: BarChart3,
    pros: ['Low expense ratio', 'Diversified', 'Passive investing'],
    cons: ['Market risk', 'No alpha generation', 'Full market drawdowns'],
  },
  {
    id: 'pms',
    name: 'Portfolio Management Services',
    shortName: 'PMS',
    returnRate: 16.0,
    minInvestment: 5000000,
    lockIn: '3 years typical',
    taxBracket: 'LTCG 12.5% above ₹1.25L',
    risk: 'High',
    riskLevel: 5,
    liquidity: 'Medium',
    regulator: 'SEBI',
    color: '#A855F7',
    icon: Zap,
    pros: ['Customized portfolio', 'Direct stock ownership', 'Expert fund manager'],
    cons: ['₹50L minimum', 'High fees (2%+20%)', 'Concentration risk'],
  },
  {
    id: 'ghl_debenture',
    name: 'GHL Debenture Route',
    shortName: 'GHL NCD',
    returnRate: 16.0,
    minInvestment: 1000000,
    lockIn: '3-5 years',
    taxBracket: 'LTCG 12.5% after 3 yrs',
    risk: 'Medium',
    riskLevel: 3,
    liquidity: 'Low',
    regulator: 'SEBI',
    color: '#8B5CF6',
    icon: Trophy,
    pros: ['₹10L entry (vs ₹1Cr AIF)', 'Institutional returns', 'Structured exit', 'Stressed asset upside'],
    cons: ['Lock-in period', 'Not government guaranteed', 'Illiquid during tenure'],
    isGHL: true,
  },
  {
    id: 'ghl_aif',
    name: 'GHL AIF (Direct)',
    shortName: 'GHL AIF',
    returnRate: 22.0,
    minInvestment: 10000000,
    lockIn: '5-7 years',
    taxBracket: 'Pass-through (investor level)',
    risk: 'High',
    riskLevel: 5,
    liquidity: 'Low',
    regulator: 'SEBI (Cat II AIF)',
    color: '#D0021B',
    icon: Trophy,
    pros: ['Highest potential IRR', 'SEBI regulated (Cat II)', 'Deep-value stressed assets', 'Professional fund management'],
    cons: ['₹1Cr minimum', 'Long lock-in', 'Market & execution risk'],
    isGHL: true,
  },
]

/* ============================================================
   HELPERS
   ============================================================ */

function getRiskColor(level: number) {
  if (level <= 1) return 'text-green-400'
  if (level <= 2) return 'text-emerald-400'
  if (level <= 3) return 'text-yellow-400'
  if (level <= 4) return 'text-orange-400'
  return 'text-red-400'
}

function getRiskBg(level: number) {
  if (level <= 1) return 'bg-green-500'
  if (level <= 2) return 'bg-emerald-500'
  if (level <= 3) return 'bg-yellow-500'
  if (level <= 4) return 'bg-orange-500'
  return 'bg-red-500'
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

function ComparisonBar({ vehicle, amount, years, maxTotal }: {
  vehicle: typeof INVESTMENT_VEHICLES[0]
  amount: number
  years: number
  maxTotal: number
}) {
  const total = amount * Math.pow(1 + vehicle.returnRate / 100, years)
  const returns = total - amount
  const pct = (total / maxTotal) * 100

  return (
    <div className={`group ${vehicle.isGHL ? 'ring-1 ring-brand-red/30 bg-brand-red/5 rounded-xl p-3 -mx-3' : 'p-3 -mx-3 rounded-xl hover:bg-white/5 transition-colors'}`}>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <div className="flex items-center gap-2">
          <vehicle.icon className="w-3.5 h-3.5" style={{ color: vehicle.color }} />
          <span className={`font-semibold ${vehicle.isGHL ? 'text-white' : 'text-gray-300'}`}>
            {vehicle.name}
          </span>
          {vehicle.isGHL && (
            <span className="px-1.5 py-0.5 bg-brand-red text-white text-[8px] font-bold uppercase rounded tracking-wider">GHL</span>
          )}
        </div>
        <span className="text-white font-bold">{formatINR(total)}</span>
      </div>
      <div className="h-7 bg-white/5 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
          style={{
            width: `${Math.max(pct, 8)}%`,
            backgroundColor: vehicle.color,
            boxShadow: vehicle.isGHL ? `0 0 15px ${vehicle.color}40` : undefined,
          }}
        >
          <span className="text-white text-[9px] font-bold whitespace-nowrap">
            +{formatINR(returns)} ({vehicle.returnRate}% p.a.)
          </span>
        </div>
      </div>
    </div>
  )
}

function DetailCard({ vehicle, amount, years, expanded, onToggle }: {
  vehicle: typeof INVESTMENT_VEHICLES[0]
  amount: number
  years: number
  expanded: boolean
  onToggle: () => void
}) {
  const total = amount * Math.pow(1 + vehicle.returnRate / 100, years)
  const returns = total - amount
  const effectiveAmount = Math.max(amount, vehicle.minInvestment)
  const effectiveTotal = effectiveAmount * Math.pow(1 + vehicle.returnRate / 100, years)
  const canInvest = amount >= vehicle.minInvestment

  return (
    <div className={`rounded-xl border transition-all duration-300 ${
      vehicle.isGHL
        ? 'border-brand-red/30 bg-brand-red/5'
        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
    }`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${vehicle.color}20` }}>
            <vehicle.icon className="w-4.5 h-4.5" style={{ color: vehicle.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-bold">{vehicle.shortName}</span>
              {vehicle.isGHL && (
                <span className="px-1.5 py-0.5 bg-brand-red text-white text-[8px] font-bold uppercase rounded tracking-wider">GHL</span>
              )}
              <span className={`text-[10px] font-semibold ${getRiskColor(vehicle.riskLevel)}`}>{vehicle.risk}</span>
            </div>
            <p className="text-gray-500 text-[10px]">{vehicle.returnRate}% p.a. | Min: {formatINR(vehicle.minInvestment)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-white text-sm font-bold">{formatINR(total)}</p>
            <p className="text-green-400 text-[10px]">+{formatINR(returns)}</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* Key stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Lock-in', value: vehicle.lockIn },
              { label: 'Tax', value: vehicle.taxBracket },
              { label: 'Liquidity', value: vehicle.liquidity },
              { label: 'Regulator', value: vehicle.regulator },
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-gray-500 text-[9px] uppercase tracking-wider">{s.label}</p>
                <p className="text-gray-300 text-[10px] font-medium mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Risk meter */}
          <div>
            <p className="text-gray-500 text-[9px] uppercase tracking-wider mb-1">Risk Level</p>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5].map(l => (
                <div key={l} className={`h-1.5 flex-1 rounded-full ${l <= vehicle.riskLevel ? getRiskBg(vehicle.riskLevel) : 'bg-white/10'}`} />
              ))}
            </div>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-green-400 text-[9px] uppercase tracking-wider font-semibold mb-1">Advantages</p>
              {vehicle.pros.map(p => (
                <div key={p} className="flex items-start gap-1 mb-0.5">
                  <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />
                  <span className="text-gray-400 text-[10px] leading-tight">{p}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-amber-400 text-[9px] uppercase tracking-wider font-semibold mb-1">Considerations</p>
              {vehicle.cons.map(c => (
                <div key={c} className="flex items-start gap-1 mb-0.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-gray-400 text-[10px] leading-tight">{c}</span>
                </div>
              ))}
            </div>
          </div>

          {!canInvest && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <p className="text-amber-400 text-[10px]">
                Minimum investment: {formatINR(vehicle.minInvestment)}. Your amount ({formatINR(amount)}) is below the threshold.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   WEALTH JOURNEY CALCULATOR (Year-by-year growth)
   ============================================================ */
function WealthJourneyTab({ amount, years }: { amount: number; years: number }) {
  const selectedVehicles = ['fd', 'gold', 'nifty50', 'ghl_debenture', 'ghl_aif']
  const vehicles = INVESTMENT_VEHICLES.filter(v => selectedVehicles.includes(v.id))

  const yearlyData = useMemo(() => {
    return Array.from({ length: years }, (_, yr) => {
      const year = yr + 1
      return {
        year,
        values: vehicles.map(v => ({
          id: v.id,
          name: v.shortName,
          color: v.color,
          total: amount * Math.pow(1 + v.returnRate / 100, year),
          isGHL: v.isGHL,
        })),
      }
    })
  }, [amount, years, vehicles])

  const maxVal = Math.max(...yearlyData.flatMap(d => d.values.map(v => v.total)))

  return (
    <div>
      <p className="text-gray-400 text-xs mb-4">See how your {formatINR(amount)} grows year-by-year across top investment options.</p>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {vehicles.map(v => (
          <div key={v.id} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }} />
            <span className="text-gray-400 text-[10px] font-medium">{v.shortName}</span>
          </div>
        ))}
      </div>

      {/* Year-by-year chart (horizontal bars per year) */}
      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {yearlyData.map(yd => (
          <div key={yd.year}>
            <p className="text-gray-500 text-[10px] font-semibold mb-1">Year {yd.year}</p>
            <div className="space-y-1">
              {yd.values.map(v => (
                <div key={v.id} className="flex items-center gap-2">
                  <span className="text-gray-500 text-[9px] w-14 shrink-0 text-right">{v.name}</span>
                  <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(v.total / maxVal) * 100}%`,
                        backgroundColor: v.color,
                        boxShadow: v.isGHL ? `0 0 8px ${v.color}30` : undefined,
                      }}
                    />
                  </div>
                  <span className="text-gray-300 text-[9px] font-semibold w-16 shrink-0">{formatINR(v.total)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 rounded-xl bg-brand-red/10 border border-brand-red/20">
        <p className="text-brand-red text-[10px] font-bold uppercase tracking-wider mb-1">After {years} Years</p>
        <div className="grid grid-cols-2 gap-2">
          {yearlyData[yearlyData.length - 1]?.values.map(v => (
            <div key={v.id} className="flex items-center justify-between">
              <span className="text-gray-400 text-[10px]">{v.name}</span>
              <span className={`text-[10px] font-bold ${v.isGHL ? 'text-brand-red' : 'text-white'}`}>{formatINR(v.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   TAX IMPACT CALCULATOR
   ============================================================ */
function TaxImpactTab({ amount, years }: { amount: number; years: number }) {
  const [taxBracket, setTaxBracket] = useState(30)

  const vehicles = useMemo(() => {
    return INVESTMENT_VEHICLES.map(v => {
      const gross = amount * Math.pow(1 + v.returnRate / 100, years)
      const grossReturns = gross - amount

      let taxRate: number
      if (v.id === 'ppf') taxRate = 0
      else if (v.id === 'fd') taxRate = taxBracket
      else if (v.id === 'nps') taxRate = taxBracket * 0.4
      else taxRate = 12.5

      const taxAmount = grossReturns * (taxRate / 100)
      const netReturns = grossReturns - taxAmount
      const netTotal = amount + netReturns

      return { ...v, gross, grossReturns, taxRate, taxAmount, netReturns, netTotal }
    }).sort((a, b) => b.netTotal - a.netTotal)
  }, [amount, years, taxBracket])

  const maxNet = Math.max(...vehicles.map(v => v.netTotal))

  return (
    <div>
      <p className="text-gray-400 text-xs mb-3">Compare post-tax returns. Real wealth = what you keep after tax.</p>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-gray-400 text-xs">Your Tax Bracket:</span>
        {[5, 20, 30].map(b => (
          <button
            key={b}
            onClick={() => setTaxBracket(b)}
            className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all ${
              taxBracket === b ? 'bg-brand-red text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {b}%
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {vehicles.map((v, idx) => (
          <div key={v.id} className={`flex items-center gap-2 p-2 rounded-lg ${v.isGHL ? 'bg-brand-red/5 ring-1 ring-brand-red/20' : 'hover:bg-white/5'} transition-colors`}>
            <span className="text-gray-600 text-[10px] w-4 shrink-0 font-bold">#{idx + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-[10px] font-semibold truncate ${v.isGHL ? 'text-white' : 'text-gray-300'}`}>{v.shortName}</span>
                {v.isGHL && <span className="px-1 py-0.5 bg-brand-red text-white text-[7px] font-bold rounded">GHL</span>}
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(v.netTotal / maxNet) * 100}%`, backgroundColor: v.color }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-white text-[10px] font-bold">{formatINR(v.netTotal)}</p>
              <p className="text-red-400 text-[8px]">Tax: {formatINR(v.taxAmount)} ({v.taxRate.toFixed(1)}%)</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   INFLATION-ADJUSTED CALCULATOR
   ============================================================ */
function InflationTab({ amount, years }: { amount: number; years: number }) {
  const [inflation, setInflation] = useState(6)

  const vehicles = useMemo(() => {
    return INVESTMENT_VEHICLES.map(v => {
      const nominal = amount * Math.pow(1 + v.returnRate / 100, years)
      const realRate = ((1 + v.returnRate / 100) / (1 + inflation / 100) - 1) * 100
      const realValue = amount * Math.pow(1 + realRate / 100, years)
      const purchasing = realValue
      const inflationLoss = nominal - realValue
      const beatsInflation = v.returnRate > inflation

      return { ...v, nominal, realRate, realValue, purchasing, inflationLoss, beatsInflation }
    }).sort((a, b) => b.realValue - a.realValue)
  }, [amount, years, inflation])

  const maxReal = Math.max(...vehicles.map(v => v.realValue))

  return (
    <div>
      <p className="text-gray-400 text-xs mb-3">See your real purchasing power after inflation eats into returns.</p>

      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Inflation Rate</span>
          <span className="text-white font-semibold">{inflation}% p.a.</span>
        </div>
        <input
          type="range"
          min={3}
          max={10}
          step={0.5}
          value={inflation}
          onChange={e => setInflation(Number(e.target.value))}
          className="w-full accent-brand-red"
        />
        <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
          <span>3%</span><span>10%</span>
        </div>
      </div>

      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {vehicles.map(v => (
          <div key={v.id} className={`p-2.5 rounded-lg ${v.isGHL ? 'bg-brand-red/5 ring-1 ring-brand-red/20' : 'hover:bg-white/5'} transition-colors`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold ${v.isGHL ? 'text-white' : 'text-gray-300'}`}>{v.shortName}</span>
                {v.isGHL && <span className="px-1 py-0.5 bg-brand-red text-white text-[7px] font-bold rounded">GHL</span>}
                {v.beatsInflation ? (
                  <span className="text-green-400 text-[8px]">Beats inflation</span>
                ) : (
                  <span className="text-red-400 text-[8px]">Loses to inflation</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-white text-[10px] font-bold">{formatINR(v.realValue)}</span>
                <span className="text-gray-500 text-[8px] ml-1">real</span>
              </div>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max((v.realValue / maxReal) * 100, 5)}%`, backgroundColor: v.color }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[8px]">
              <span className="text-gray-500">Nominal: {formatINR(v.nominal)}</span>
              <span className="text-red-400">Inflation loss: {formatINR(v.inflationLoss)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   MAIN COMPONENT: ALL INVESTMENTS CALCULATOR
   ============================================================ */

type TabKey = 'compare' | 'detail' | 'journey' | 'tax' | 'inflation'

interface AllInvestmentsCalculatorProps {
  isOpen: boolean
  onClose: () => void
}

export default function AllInvestmentsCalculator({ isOpen, onClose }: AllInvestmentsCalculatorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('compare')
  const [amount, setAmount] = useState(10000000) // ₹1 Cr
  const [years, setYears] = useState(5)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const compareResults = useMemo(() => {
    return INVESTMENT_VEHICLES.map(v => ({
      ...v,
      total: amount * Math.pow(1 + v.returnRate / 100, years),
    })).sort((a, b) => b.total - a.total)
  }, [amount, years])

  const maxTotal = useMemo(() => Math.max(...compareResults.map(r => r.total)), [compareResults])

  const tabs: { key: TabKey; label: string; icon: typeof Calculator }[] = [
    { key: 'compare', label: 'Compare All', icon: Layers },
    { key: 'detail', label: 'Deep Dive', icon: BarChart3 },
    { key: 'journey', label: 'Growth Map', icon: TrendingUp },
    { key: 'tax', label: 'Tax Impact', icon: Percent },
    { key: 'inflation', label: 'Real Value', icon: IndianRupee },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: 'rgba(10, 10, 10, 0.97)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-white transition-colors p-1"
          aria-label="Close calculator"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-5 pb-0 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-brand-red" />
            </div>
            <div>
              <h3 className="text-white text-lg font-bold">All Investments &amp; Comparison</h3>
              <p className="text-gray-500 text-[10px]">Compare every major Indian investment vehicle side by side</p>
            </div>
          </div>

          {/* Shared controls */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Investment Amount</span>
                <span className="text-white font-semibold">{formatINR(amount)}</span>
              </div>
              <input
                type="range"
                min={100000}
                max={100000000}
                step={100000}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full accent-brand-red"
              />
              <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
                <span>₹1L</span><span>₹10Cr</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Duration</span>
                <span className="text-white font-semibold">{years} years</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="w-full accent-brand-red"
              />
              <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
                <span>1 yr</span><span>20 yrs</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 text-[9px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap px-2 ${
                  activeTab === tab.key
                    ? 'text-brand-red border-b-2 border-brand-red'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* Compare All Tab */}
          {activeTab === 'compare' && (
            <div>
              <p className="text-gray-400 text-xs mb-3">
                {formatINR(amount)} invested for {years} years across every major Indian investment.
              </p>
              <div className="space-y-1">
                {compareResults.map(v => (
                  <ComparisonBar key={v.id} vehicle={v} amount={amount} years={years} maxTotal={maxTotal} />
                ))}
              </div>

              {/* GHL Advantage callout */}
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-brand-red/10 to-transparent border border-brand-red/20">
                <div className="flex items-start gap-2">
                  <Trophy className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-xs font-bold mb-1">The GHL Advantage</p>
                    <p className="text-gray-400 text-[10px] leading-relaxed">
                      GHL AIF targets {INVESTMENT_VEHICLES.find(v => v.id === 'ghl_aif')?.returnRate}% IRR through deep-discount stressed real estate acquisitions via NCLT.
                      Even the GHL Debenture Route at ₹10L entry outperforms most traditional instruments.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deep Dive Tab */}
          {activeTab === 'detail' && (
            <div className="space-y-2">
              <p className="text-gray-400 text-xs mb-3">Tap any investment to see full details, pros, cons, and tax treatment.</p>
              {INVESTMENT_VEHICLES.map(v => (
                <DetailCard
                  key={v.id}
                  vehicle={v}
                  amount={amount}
                  years={years}
                  expanded={expandedCard === v.id}
                  onToggle={() => setExpandedCard(expandedCard === v.id ? null : v.id)}
                />
              ))}
            </div>
          )}

          {/* Wealth Journey Tab */}
          {activeTab === 'journey' && (
            <WealthJourneyTab amount={amount} years={years} />
          )}

          {/* Tax Impact Tab */}
          {activeTab === 'tax' && (
            <TaxImpactTab amount={amount} years={years} />
          )}

          {/* Inflation / Real Value Tab */}
          {activeTab === 'inflation' && (
            <InflationTab amount={amount} years={years} />
          )}

          {/* Disclaimer */}
          <p className="text-gray-600 text-[8px] text-center mt-5 leading-relaxed">
            For illustration purposes only. Returns are assumed rates based on historical averages and target IRRs. Past performance is not indicative of future results.
            Actual returns may vary. Tax rates as per Union Budget 2025-26. Consult your financial advisor and read the PPM before investing.
          </p>
        </div>
      </div>
    </div>
  )
}
