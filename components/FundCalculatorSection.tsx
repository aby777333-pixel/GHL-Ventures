'use client'

import { useState, useMemo } from 'react'
import AnimatedSection from '@/components/AnimatedSection'
import {
  Calculator, TrendingUp, IndianRupee, BarChart3, Layers,
  CheckCircle, Crown, ShieldCheck, Zap, Trophy, ArrowRight,
  Scale, Percent, Star
} from 'lucide-react'
import { formatINR } from '@/lib/calculatorUtils'

/* ============================================================
   TYPES & DATA
   ============================================================ */
type CalcMode = 'aif' | 'debenture' | 'both'

interface FundCalculatorSectionProps {
  /** Which calculators to show */
  mode: CalcMode
  /** Optional: show comparison table */
  showComparison?: boolean
  /** Optional: show GHL advantages section */
  showAdvantages?: boolean
}

/* Comparison vehicles */
const VEHICLES = [
  { id: 'fd', name: 'Bank Fixed Deposit', rate: 7.0, color: '#6B7280', risk: 'Low', icon: ShieldCheck },
  { id: 'ppf', name: 'Public Provident Fund', rate: 7.1, color: '#10B981', risk: 'Zero', icon: ShieldCheck },
  { id: 'gold', name: 'Gold (SGB)', rate: 10.0, color: '#F59E0B', risk: 'Low-Med', icon: Crown },
  { id: 'mf', name: 'Equity Mutual Funds', rate: 13.0, color: '#3B82F6', risk: 'Medium', icon: BarChart3 },
  { id: 'nifty', name: 'NIFTY 50 Index', rate: 12.5, color: '#8B5CF6', risk: 'Medium', icon: TrendingUp },
  { id: 'pms', name: 'Portfolio Mgmt (PMS)', rate: 16.0, color: '#EC4899', risk: 'Med-High', icon: Trophy },
  { id: 'realestate', name: 'Direct Real Estate', rate: 8.0, color: '#22C55E', risk: 'Medium', icon: Scale },
  { id: 'ghl-deb', name: 'GHL Debenture Route', rate: 16.0, color: '#D0021B', risk: 'Med-High', icon: Zap, isGHL: true },
  { id: 'ghl-aif', name: 'GHL Direct AIF', rate: 22.0, color: '#D0021B', risk: 'High', icon: Star, isGHL: true },
]

/* GHL Advantages over competitors */
const GHL_ADVANTAGES = [
  {
    title: 'SEBI-Regulated AIF Structure',
    desc: 'Unlike PMS or unregulated bonds, GHL is a SEBI Category II AIF with custodian, auditor, and compliance mandates.',
    vs: 'vs. PMSs and unlisted bonds that lack custodian protection',
  },
  {
    title: 'Dual Asset Strategy',
    desc: 'Stressed real estate + early-stage startups — two uncorrelated return streams that no single FD, MF, or PMS offers.',
    vs: 'vs. single-asset-class funds',
  },
  {
    title: 'Deep-Value Acquisitions',
    desc: 'We acquire distressed assets at 30-60% below market value via NCLT/IBC resolution. This built-in margin of safety is unavailable to retail investors.',
    vs: 'vs. buying at market price in MFs or direct real estate',
  },
  {
    title: 'Pass-Through Taxation',
    desc: 'Category II AIF income is taxed in the investor\'s hands, not at the fund level — unlike mutual funds with their own tax layers.',
    vs: 'vs. mutual funds with fund-level taxation on debt',
  },
  {
    title: 'Active Value Creation',
    desc: 'Board seats for startups, project management for real estate. We don\'t just invest — we build value hands-on.',
    vs: 'vs. passive FDs, index funds, and gold',
  },
  {
    title: 'Accessible Entry at ₹10 Lakhs',
    desc: 'Through our Debenture Route, salaried professionals can access alternative investments that were traditionally limited to ₹1 Crore+ investors.',
    vs: 'vs. most AIFs requiring ₹1 Crore minimum',
  },
]

/* ============================================================
   COMPONENT
   ============================================================ */
export default function FundCalculatorSection({
  mode = 'both',
  showComparison = true,
  showAdvantages = true,
}: FundCalculatorSectionProps) {
  // Calculator state
  const [activeCalc, setActiveCalc] = useState<'aif' | 'debenture'>(mode === 'debenture' ? 'debenture' : 'aif')

  // AIF state
  const [aifAmount, setAifAmount] = useState(10000000) // ₹1 Cr
  const [aifYears, setAifYears] = useState(5)
  const [aifIRR, setAifIRR] = useState(20)

  // Debenture state
  const [debAmount, setDebAmount] = useState(1000000) // ₹10L
  const [debYears, setDebYears] = useState(3)
  const [debRate, setDebRate] = useState(16)

  // Comparison state
  const [compAmount, setCompAmount] = useState(10000000)
  const [compYears, setCompYears] = useState(5)

  // Calculations
  const aifResult = useMemo(() => {
    const total = aifAmount * Math.pow(1 + aifIRR / 100, aifYears)
    return { invested: aifAmount, total, returns: total - aifAmount, cagr: aifIRR }
  }, [aifAmount, aifYears, aifIRR])

  const debResult = useMemo(() => {
    const total = debAmount * Math.pow(1 + debRate / 100, debYears)
    return { invested: debAmount, total, returns: total - debAmount, cagr: debRate }
  }, [debAmount, debYears, debRate])

  const compResults = useMemo(() => {
    return VEHICLES.map(v => ({
      ...v,
      total: compAmount * Math.pow(1 + v.rate / 100, compYears),
      returns: compAmount * Math.pow(1 + v.rate / 100, compYears) - compAmount,
    })).sort((a, b) => b.total - a.total)
  }, [compAmount, compYears])

  const maxTotal = useMemo(() => Math.max(...compResults.map(r => r.total)), [compResults])

  // Active result
  const activeResult = activeCalc === 'aif' ? aifResult : debResult

  return (
    <>
      {/* ──────── CALCULATOR SECTION ──────── */}
      <section className="section-padding bg-brand-offwhite" id="calculator">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-10">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Calculator</span>
            <h2 className="section-title mt-2 text-brand-black">Estimate Your Returns</h2>
            <p className="section-subtitle mx-auto mt-3">
              See how your investment could grow with GHL India Ventures.
              Adjust the sliders to model different scenarios.
            </p>
          </AnimatedSection>

          <div className="max-w-5xl mx-auto">
            <AnimatedSection>
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left — Calculator Inputs */}
                <div className="card p-6 sm:p-8 rounded-2xl">
                  {/* Tab toggle (only if both modes) */}
                  {mode === 'both' && (
                    <div className="flex bg-brand-offwhite rounded-lg p-1 mb-6">
                      <button
                        onClick={() => setActiveCalc('aif')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                          activeCalc === 'aif'
                            ? 'bg-brand-red text-white shadow-md'
                            : 'text-brand-grey hover:text-brand-black'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" /> Direct AIF
                      </button>
                      <button
                        onClick={() => setActiveCalc('debenture')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                          activeCalc === 'debenture'
                            ? 'bg-brand-red text-white shadow-md'
                            : 'text-brand-grey hover:text-brand-black'
                        }`}
                      >
                        <IndianRupee className="w-3.5 h-3.5" /> Debenture
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-brand-red" />
                    </div>
                    <div>
                      <h3 className="text-brand-black text-lg font-bold">
                        {activeCalc === 'aif' ? 'Direct AIF Calculator' : 'Debenture Route Calculator'}
                      </h3>
                      <p className="text-brand-grey text-xs">Adjust parameters to see projected returns</p>
                    </div>
                  </div>

                  {/* AIF Sliders */}
                  {activeCalc === 'aif' && (
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-brand-grey">Investment Amount</span>
                          <span className="text-brand-black font-bold">{formatINR(aifAmount)}</span>
                        </div>
                        <input type="range" min={10000000} max={250000000} step={5000000}
                          value={aifAmount} onChange={e => setAifAmount(Number(e.target.value))}
                          className="w-full accent-brand-red" />
                        <div className="flex justify-between text-[10px] text-brand-grey/60 mt-0.5">
                          <span>₹1 Cr</span><span>₹25 Cr</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-brand-grey">Investment Horizon</span>
                          <span className="text-brand-black font-bold">{aifYears} years</span>
                        </div>
                        <input type="range" min={3} max={10} step={1}
                          value={aifYears} onChange={e => setAifYears(Number(e.target.value))}
                          className="w-full accent-brand-red" />
                        <div className="flex justify-between text-[10px] text-brand-grey/60 mt-0.5">
                          <span>3 yrs</span><span>10 yrs</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-brand-grey">Target IRR</span>
                          <span className="text-brand-black font-bold">{aifIRR}%</span>
                        </div>
                        <input type="range" min={12} max={30} step={1}
                          value={aifIRR} onChange={e => setAifIRR(Number(e.target.value))}
                          className="w-full accent-brand-red" />
                        <div className="flex justify-between text-[10px] text-brand-grey/60 mt-0.5">
                          <span>12%</span><span>30%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Debenture Sliders */}
                  {activeCalc === 'debenture' && (
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-brand-grey">Investment Amount</span>
                          <span className="text-brand-black font-bold">{formatINR(debAmount)}</span>
                        </div>
                        <input type="range" min={1000000} max={10000000} step={100000}
                          value={debAmount} onChange={e => setDebAmount(Number(e.target.value))}
                          className="w-full accent-brand-red" />
                        <div className="flex justify-between text-[10px] text-brand-grey/60 mt-0.5">
                          <span>₹10L</span><span>₹1 Cr</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-brand-grey">Duration</span>
                          <span className="text-brand-black font-bold">{debYears} years</span>
                        </div>
                        <input type="range" min={1} max={7} step={1}
                          value={debYears} onChange={e => setDebYears(Number(e.target.value))}
                          className="w-full accent-brand-red" />
                        <div className="flex justify-between text-[10px] text-brand-grey/60 mt-0.5">
                          <span>1 yr</span><span>7 yrs</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-brand-grey">Expected Return (p.a.)</span>
                          <span className="text-brand-black font-bold">{debRate}%</span>
                        </div>
                        <input type="range" min={10} max={20} step={1}
                          value={debRate} onChange={e => setDebRate(Number(e.target.value))}
                          className="w-full accent-brand-red" />
                        <div className="flex justify-between text-[10px] text-brand-grey/60 mt-0.5">
                          <span>10%</span><span>20%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right — Results */}
                <div className="card p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-brand-black to-gray-900 text-white">
                  <div className="text-center mb-6">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Projected Returns</p>
                    <p className="text-3xl sm:text-4xl font-extrabold text-white">
                      {formatINR(activeResult.total)}
                    </p>
                    <p className="text-brand-red text-sm font-semibold mt-1">
                      +{formatINR(activeResult.returns)} returns
                    </p>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 rounded-xl bg-white/5">
                      <p className="text-gray-500 text-[9px] uppercase tracking-wider">Invested</p>
                      <p className="text-white text-sm font-bold mt-1">{formatINR(activeResult.invested)}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-white/5">
                      <p className="text-gray-500 text-[9px] uppercase tracking-wider">Returns</p>
                      <p className="text-green-400 text-sm font-bold mt-1">+{formatINR(activeResult.returns)}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-white/5">
                      <p className="text-gray-500 text-[9px] uppercase tracking-wider">CAGR</p>
                      <p className="text-brand-red text-sm font-bold mt-1">{activeResult.cagr}%</p>
                    </div>
                  </div>

                  {/* Visual bar */}
                  <div className="mb-4">
                    <div className="flex rounded-full overflow-hidden h-4">
                      <div
                        className="bg-blue-500 transition-all duration-700"
                        style={{ width: `${(activeResult.invested / activeResult.total) * 100}%` }}
                      />
                      <div
                        className="bg-green-500 transition-all duration-700"
                        style={{ width: `${(activeResult.returns / activeResult.total) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[9px] text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500 inline-block" /> Invested</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500 inline-block" /> Returns</span>
                    </div>
                  </div>

                  {/* Growth multiplier */}
                  <div className="text-center p-4 rounded-xl bg-brand-red/10 border border-brand-red/20">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">Your Money Grows</p>
                    <p className="text-2xl font-extrabold text-brand-red mt-1">
                      {(activeResult.total / activeResult.invested).toFixed(1)}x
                    </p>
                    <p className="text-gray-400 text-[10px]">
                      in {activeCalc === 'aif' ? aifYears : debYears} years
                    </p>
                  </div>

                  <p className="text-gray-600 text-[8px] text-center mt-4 leading-relaxed">
                    For illustration only. Past performance ≠ future results. Target returns are not guaranteed.
                    Consult your financial advisor before investing.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ──────── COMPARISON SECTION ──────── */}
      {showComparison && (
        <section className="section-padding bg-white">
          <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-10">
              <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Compare</span>
              <h2 className="section-title mt-2 text-brand-black">GHL vs Every Other Investment</h2>
              <p className="section-subtitle mx-auto mt-3">
                See how GHL India Ventures stacks up against traditional and alternative investments across India.
              </p>
            </AnimatedSection>

            <AnimatedSection>
              <div className="max-w-4xl mx-auto">
                {/* Controls */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <div className="card p-4 rounded-xl">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-brand-grey">Investment Amount</span>
                      <span className="text-brand-black font-bold">{formatINR(compAmount)}</span>
                    </div>
                    <input type="range" min={1000000} max={100000000} step={1000000}
                      value={compAmount} onChange={e => setCompAmount(Number(e.target.value))}
                      className="w-full accent-brand-red" />
                  </div>
                  <div className="card p-4 rounded-xl">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-brand-grey">Time Period</span>
                      <span className="text-brand-black font-bold">{compYears} years</span>
                    </div>
                    <input type="range" min={1} max={10} step={1}
                      value={compYears} onChange={e => setCompYears(Number(e.target.value))}
                      className="w-full accent-brand-red" />
                  </div>
                </div>

                {/* Comparison bars */}
                <div className="space-y-3">
                  {compResults.map((v) => {
                    const Icon = v.icon
                    return (
                      <div key={v.id} className={`card p-4 rounded-xl transition-all ${v.isGHL ? 'ring-2 ring-brand-red/30 bg-brand-red/[0.02]' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" style={{ color: v.color }} />
                            <span className={`text-sm font-semibold ${v.isGHL ? 'text-brand-red' : 'text-brand-black'}`}>
                              {v.name}
                            </span>
                            {v.isGHL && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-brand-red text-white px-1.5 py-0.5 rounded">
                                GHL
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-brand-black">{formatINR(v.total)}</span>
                            <span className="text-[10px] text-brand-grey ml-2">({v.rate}% p.a.)</span>
                          </div>
                        </div>
                        <div className="h-5 bg-brand-offwhite rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                            style={{
                              width: `${Math.max((v.total / maxTotal) * 100, 8)}%`,
                              backgroundColor: v.color,
                              opacity: v.isGHL ? 1 : 0.7,
                            }}
                          >
                            <span className="text-white text-[8px] font-bold whitespace-nowrap">
                              +{formatINR(v.returns)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between mt-1 text-[9px] text-brand-grey/60">
                          <span>Risk: {v.risk}</span>
                          <span>Growth: {(v.total / compAmount).toFixed(1)}x</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <p className="text-center text-[9px] text-brand-grey/60 mt-4">
                  Returns are based on historical averages and projections. Actual returns may vary.
                  GHL AIF target IRR is 18–22%; 22% used for illustration. Investments are subject to market risks.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ──────── GHL ADVANTAGES SECTION ──────── */}
      {showAdvantages && (
        <section className="section-padding bg-brand-offwhite">
          <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-10">
              <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Why GHL</span>
              <h2 className="section-title mt-2 text-brand-black">The GHL Advantage</h2>
              <p className="section-subtitle mx-auto mt-3">
                What makes GHL India Ventures fundamentally different from every other investment vehicle available to Indian investors.
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {GHL_ADVANTAGES.map((adv, i) => (
                <AnimatedSection key={adv.title} delay={i * 80}>
                  <div className={`card p-6 rounded-2xl h-full group hover:-translate-y-1 transition-all ${
                    ['glow-card-red', 'glow-card-blue', 'glow-card-violet', 'glow-card-emerald', 'glow-card-amber', 'glow-card-cyan'][i % 6]
                  }`}>
                    <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center mb-4 group-hover:bg-brand-red transition-all">
                      <CheckCircle className="w-5 h-5 text-brand-red group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-sm font-bold text-brand-black mb-2">{adv.title}</h3>
                    <p className="text-xs text-brand-grey leading-relaxed mb-3">{adv.desc}</p>
                    <p className="text-[10px] text-brand-red/70 font-medium italic">{adv.vs}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
