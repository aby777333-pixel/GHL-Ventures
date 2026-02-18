'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, IndianRupee, Percent, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react'
import { formatINR } from '@/lib/calculatorUtils'

/* ============================================================
   TAX RULES FOR INDIAN INVESTMENTS (FY 2024-25)
   ============================================================ */
const INVESTMENTS = [
  {
    id: 'fd',
    name: 'Bank FD',
    preRate: 7.0,
    taxType: 'slab' as const,
    description: 'Interest taxed at your income slab rate',
    color: '#6B7280',
    section: 'Interest Income',
    stcg: null,
    ltcg: null,
    holding: '—',
  },
  {
    id: 'ppf',
    name: 'PPF',
    preRate: 7.1,
    taxType: 'exempt' as const,
    description: 'EEE — Contribution, interest & maturity all tax-free',
    color: '#10B981',
    section: 'Sec 80C (EEE)',
    stcg: null,
    ltcg: null,
    holding: '15 years',
  },
  {
    id: 'gold_sgb',
    name: 'Gold (SGB)',
    preRate: 10.0,
    taxType: 'custom' as const,
    description: 'Interest taxed at slab; LTCG exempt at maturity (8 yrs)',
    color: '#F59E0B',
    section: 'Capital Gains',
    stcg: 'Slab rate (<3 yrs)',
    ltcg: '12.5% (>3 yrs) / Exempt at maturity',
    holding: '8 years',
  },
  {
    id: 'equity_mf',
    name: 'Equity MF',
    preRate: 13.0,
    taxType: 'equity' as const,
    description: 'STCG 20% (<1 yr), LTCG 12.5% above ₹1.25L (>1 yr)',
    color: '#3B82F6',
    section: 'Capital Gains',
    stcg: '20% (<1 yr)',
    ltcg: '12.5% above ₹1.25L',
    holding: '1 year',
  },
  {
    id: 'nifty',
    name: 'NIFTY 50 Index',
    preRate: 14.0,
    taxType: 'equity' as const,
    description: 'Same equity tax rules as Equity MF',
    color: '#2563EB',
    section: 'Capital Gains',
    stcg: '20% (<1 yr)',
    ltcg: '12.5% above ₹1.25L',
    holding: '1 year',
  },
  {
    id: 'realestate',
    name: 'Real Estate',
    preRate: 8.0,
    taxType: 'realestate' as const,
    description: 'LTCG 12.5% after 2 years (no indexation from July 2024)',
    color: '#22C55E',
    section: 'Capital Gains',
    stcg: 'Slab rate (<2 yrs)',
    ltcg: '12.5% (>2 yrs)',
    holding: '2 years',
  },
  {
    id: 'debt_mf',
    name: 'Debt MF',
    preRate: 7.5,
    taxType: 'slab' as const,
    description: 'All gains taxed at income slab rate (post Apr 2023)',
    color: '#9CA3AF',
    section: 'Slab Rate',
    stcg: 'Slab rate',
    ltcg: 'Slab rate',
    holding: '—',
  },
  {
    id: 'ghl_deb',
    name: 'GHL Debenture',
    preRate: 16.0,
    taxType: 'slab' as const,
    description: 'Listed NCD — interest/gains taxed at slab rate',
    color: '#D0021B',
    section: 'Interest Income',
    stcg: null,
    ltcg: null,
    holding: '3 years',
  },
  {
    id: 'ghl_aif',
    name: 'GHL AIF (Cat II)',
    preRate: 20.0,
    taxType: 'aif' as const,
    description: 'Pass-through taxation — equity LTCG 12.5%, debt at slab',
    color: '#EF4444',
    section: 'Pass-through (Sec 115UB)',
    stcg: 'Varies by asset',
    ltcg: '12.5% (equity portion)',
    holding: '3+ years',
  },
]

const SLABS = [
  { label: '0% (Under ₹7L)', rate: 0 },
  { label: '5% Slab', rate: 0.05 },
  { label: '10% Slab', rate: 0.10 },
  { label: '20% Slab', rate: 0.20 },
  { label: '30% Slab (₹15L+)', rate: 0.30 },
]

function calcPostTax(inv: typeof INVESTMENTS[0], amount: number, years: number, slabRate: number): { preTax: number; postTax: number; taxPaid: number; effectiveRate: number } {
  const preTax = amount * Math.pow(1 + inv.preRate / 100, years)
  const gain = preTax - amount
  let taxPaid = 0

  switch (inv.taxType) {
    case 'exempt':
      taxPaid = 0
      break
    case 'slab':
      taxPaid = gain * slabRate
      break
    case 'equity':
      // LTCG 12.5% above ₹1.25L exemption
      taxPaid = Math.max(0, gain - 125000) * 0.125
      break
    case 'realestate':
      taxPaid = gain * 0.125
      break
    case 'aif':
      // Blended: ~60% equity (LTCG 12.5%), ~40% debt (slab rate)
      taxPaid = gain * 0.6 * 0.125 + gain * 0.4 * slabRate
      break
    case 'custom':
      // Gold SGB: exempt at maturity (8 yrs), else 12.5%
      taxPaid = years >= 8 ? 0 : gain * 0.125
      break
    default:
      taxPaid = gain * slabRate
  }

  const postTax = preTax - taxPaid
  const effectiveRate = years > 0 ? (Math.pow(postTax / amount, 1 / years) - 1) * 100 : 0

  return { preTax, postTax, taxPaid, effectiveRate }
}

interface TaxImpactAnalyzerProps {
  isOpen: boolean
  onClose: () => void
}

export default function TaxImpactAnalyzer({ isOpen, onClose }: TaxImpactAnalyzerProps) {
  const [amount, setAmount] = useState(10000000)
  const [years, setYears] = useState(5)
  const [slabIdx, setSlabIdx] = useState(4) // 30% default

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const slabRate = SLABS[slabIdx].rate

  const results = useMemo(() => {
    return INVESTMENTS.map(inv => ({
      ...inv,
      ...calcPostTax(inv, amount, years, slabRate),
    })).sort((a, b) => b.postTax - a.postTax)
  }, [amount, years, slabRate])

  const maxPostTax = results[0]?.postTax || 1

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0D0D0D] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-white/10 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tax Impact Analyzer</h2>
              <p className="text-xs text-gray-500">Real returns = what you keep after tax</p>
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
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value={1000000}>₹10 Lakh</option>
                <option value={2500000}>₹25 Lakh</option>
                <option value={5000000}>₹50 Lakh</option>
                <option value={10000000}>₹1 Crore</option>
                <option value={50000000}>₹5 Crore</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Holding Period: {years} yrs</label>
              <input
                type="range"
                min={1}
                max={20}
                value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>1 yr</span><span>10 yr</span><span>20 yr</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Your Tax Slab</label>
              <select
                value={slabIdx}
                onChange={e => setSlabIdx(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {SLABS.map((s, i) => (
                  <option key={i} value={i}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tax Slab Indicator */}
          <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-lg px-4 py-2">
            <Percent className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-xs text-sky-300">
              Showing post-tax returns at <strong>{(slabRate * 100).toFixed(0)}% income tax slab</strong>. Slab-taxed investments (FD, Debt MF, Debentures) are impacted most by your tax bracket.
            </span>
          </div>

          {/* Results Table */}
          <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Investment</div>
              <div className="col-span-2 text-right">Pre-Tax Value</div>
              <div className="col-span-2 text-right">Tax Paid</div>
              <div className="col-span-2 text-right">Post-Tax Value</div>
              <div className="col-span-1 text-right">Eff. Rate</div>
              <div className="col-span-2">Post-Tax Bar</div>
            </div>
            {results.map((r, i) => (
              <div key={r.id} className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${i % 2 === 0 ? 'bg-white/[0.02]' : ''} hover:bg-white/5 transition-colors`}>
                <div className="col-span-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
                  <div>
                    <div className="text-sm text-white font-medium">{r.name}</div>
                    <div className="text-[10px] text-gray-600">{r.section}</div>
                  </div>
                </div>
                <div className="col-span-2 text-right text-sm text-gray-300">{formatINR(r.preTax)}</div>
                <div className="col-span-2 text-right">
                  <span className={`text-sm ${r.taxPaid > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {r.taxPaid > 0 ? `-${formatINR(r.taxPaid)}` : 'Tax Free'}
                  </span>
                </div>
                <div className="col-span-2 text-right text-sm font-bold text-white">{formatINR(r.postTax)}</div>
                <div className="col-span-1 text-right">
                  <span className="text-xs font-medium" style={{ color: r.color }}>{r.effectiveRate.toFixed(1)}%</span>
                </div>
                <div className="col-span-2">
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(r.postTax / maxPostTax) * 100}%`, background: r.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tax Rules Quick Reference */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Tax Rules Quick Reference (FY 2024-25)</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {INVESTMENTS.map(inv => (
                <div key={inv.id} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: inv.color }} />
                  <div>
                    <div className="text-xs text-white font-medium">{inv.name}</div>
                    <div className="text-[10px] text-gray-500">{inv.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Insight */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm text-amber-300 font-medium mb-1">Key Insight</div>
              <p className="text-xs text-amber-200/70">
                At the {(slabRate * 100).toFixed(0)}% tax slab, slab-taxed instruments like FDs lose up to {(slabRate * 100).toFixed(0)}% of their gains to tax.
                Tax-efficient options like PPF (EEE), Equity MFs (12.5% LTCG with ₹1.25L exemption), and GHL AIF (pass-through with equity LTCG)
                preserve significantly more of your wealth.
              </p>
            </div>
          </div>

          <p className="text-[10px] text-gray-600 text-center">
            Tax calculations are illustrative based on current tax rules. Consult your CA/tax advisor for personalized advice. Surcharge and cess not included. GHL India Ventures — SEBI-registered Category II AIF.
          </p>
        </div>
      </div>
    </div>
  )
}
