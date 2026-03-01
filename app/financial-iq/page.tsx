'use client'

import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import PlaceholderImage from '@/components/PlaceholderImage'
import dynamic from 'next/dynamic'
const WebGLVideoPresentation = dynamic(
  () => import('@/components/webgl/video/WebGLVideoPresentation'),
  { ssr: false }
)
import { FINANCIAL_IQ_ARTICLES } from '@/lib/constants'
import {
  BookOpen,
  GraduationCap,
  Lightbulb,
  TrendingUp,
  ArrowRight,
  Clock,
  Calendar,
  Search,
  Calculator,
  FileText,
  CalendarDays,
  Download,
  ChevronRight,
  Plus,
  Minus,
  RotateCcw,
} from 'lucide-react'
import { useState } from 'react'
import SpaceHero from '@/components/SpaceHero'

/* ─── Glossary Data ─── */
const GLOSSARY_TERMS: { term: string; definition: string }[] = [
  { term: 'AIF', definition: 'Alternative Investment Fund -- a privately pooled investment vehicle regulated by SEBI under the AIF Regulations, 2012.' },
  { term: 'AML', definition: 'Anti-Money Laundering -- a set of laws and regulations designed to prevent money laundering activities.' },
  { term: 'Category II AIF', definition: 'A SEBI classification for funds that include PE funds, debt funds, and funds not leveraging or borrowing other than to meet day-to-day requirements.' },
  { term: 'HNI', definition: 'High Net-worth Individual -- an investor with a substantial investable surplus, as per SEBI AIF regulations for AIF participation.' },
  { term: 'IRR', definition: 'Internal Rate of Return -- the annualized effective compounded return rate that makes the net present value of all cash flows equal to zero.' },
  { term: 'KYC', definition: 'Know Your Customer -- the process of verifying the identity of investors as mandated by SEBI and RBI regulations.' },
  { term: 'NAV', definition: 'Net Asset Value -- the per-unit value of a fund, calculated by dividing total net assets by the number of outstanding units.' },
  { term: 'PE', definition: 'Private Equity -- an alternative asset class consisting of capital not listed on a public exchange, invested directly in companies.' },
  { term: 'PPM', definition: 'Private Placement Memorandum -- a legal document provided to prospective investors detailing the fund strategy, risks, terms, and structure.' },
  { term: 'SEBI', definition: 'Securities and Exchange Board of India -- the regulator for securities and capital markets in India.' },
]


/* ─── Upcoming Events ─── */
const EVENTS = [
  {
    title: 'AIF Investing Masterclass',
    date: '2025-03-15',
    time: '3:00 PM IST',
    type: 'Webinar',
    description: 'A deep dive into Category II AIF structures, taxation, and portfolio construction strategies.',
  },
  {
    title: 'Stressed Real Estate Opportunities in South India',
    date: '2025-04-02',
    time: '11:00 AM IST',
    type: 'Live Session',
    description: 'Expert panel discussing current distressed asset pipeline and resolution frameworks.',
  },
  {
    title: 'Startup Due Diligence Workshop',
    date: '2025-04-20',
    time: '2:00 PM IST',
    type: 'Workshop',
    description: 'Hands-on session covering financial modeling, term sheets, and founder evaluation.',
  },
]

/* ─── IRR Calculator (Newton-Raphson) ─── */
function computeIRR(cashFlows: number[], maxIter = 1000, tol = 1e-7): number | null {
  if (cashFlows.length < 2) return null
  let rate = 0.1 // initial guess
  for (let i = 0; i < maxIter; i++) {
    let npv = 0
    let dNpv = 0
    for (let t = 0; t < cashFlows.length; t++) {
      const disc = Math.pow(1 + rate, t)
      npv += cashFlows[t] / disc
      if (t > 0) dNpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1)
    }
    if (Math.abs(dNpv) < 1e-12) break
    const next = rate - npv / dNpv
    if (Math.abs(next - rate) < tol) return next
    rate = next
    if (rate < -0.999 || rate > 100) return null
  }
  return rate
}

function IrrCalculator() {
  const [flows, setFlows] = useState<{ year: number; amount: string }[]>([
    { year: 0, amount: '-1000000' },
    { year: 1, amount: '300000' },
    { year: 2, amount: '350000' },
    { year: 3, amount: '400000' },
    { year: 4, amount: '450000' },
  ])
  const [result, setResult] = useState<string | null>(null)

  const addFlow = () => setFlows(f => [...f, { year: f.length, amount: '' }])
  const removeFlow = (i: number) => setFlows(f => f.filter((_, idx) => idx !== i))
  const updateAmount = (i: number, val: string) => {
    setFlows(f => f.map((fl, idx) => idx === i ? { ...fl, amount: val } : fl))
  }

  const calculate = () => {
    const cf = flows.map(f => parseFloat(f.amount) || 0)
    const irr = computeIRR(cf)
    if (irr === null || !isFinite(irr)) {
      setResult('Could not compute IRR. Check your cash flows.')
    } else {
      setResult(`${(irr * 100).toFixed(2)}%`)
    }
  }

  const reset = () => {
    setFlows([
      { year: 0, amount: '-1000000' },
      { year: 1, amount: '300000' },
      { year: 2, amount: '350000' },
      { year: 3, amount: '400000' },
      { year: 4, amount: '450000' },
    ])
    setResult(null)
  }

  return (
    <div className="card h-full flex flex-col glow-card-blue">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-brand-black text-lg">IRR Calculator</h3>
          <p className="text-brand-grey text-xs">Internal Rate of Return (Newton-Raphson)</p>
        </div>
      </div>

      <p className="text-brand-grey text-xs mb-4 leading-relaxed">
        Enter your cash flows below. Use negative values for investments (outflows) and positive values for returns (inflows).
      </p>

      {/* Cash flow rows */}
      <div className="space-y-2 mb-4 max-h-52 overflow-y-auto pr-1">
        {flows.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-brand-grey text-[10px] font-semibold w-10 shrink-0 uppercase tracking-wider">Yr {f.year}</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-grey text-xs">₹</span>
              <input
                type="number"
                value={f.amount}
                onChange={e => updateAmount(i, e.target.value)}
                className="w-full pl-7 pr-2 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-brand-black text-sm font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="e.g. -1000000"
              />
            </div>
            {flows.length > 2 && (
              <button onClick={() => removeFlow(i)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all">
                <Minus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add row */}
      <button onClick={addFlow} className="w-full py-2 border border-dashed border-gray-300 dark:border-white/15 rounded-lg text-brand-grey text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-1.5 mb-4">
        <Plus className="w-3 h-3" /> Add Cash Flow
      </button>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={calculate}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)' }}
        >
          Calculate IRR
        </button>
        <button
          onClick={reset}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-brand-grey hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`mt-4 p-4 rounded-xl text-center ${result.includes('Could not') ? 'bg-red-50 dark:bg-red-500/10' : 'bg-green-50 dark:bg-green-500/10'}`}>
          <p className="text-xs text-brand-grey mb-1 uppercase tracking-wider font-semibold">
            {result.includes('Could not') ? 'Error' : 'Annualized IRR'}
          </p>
          <p className={`text-2xl font-extrabold ${result.includes('Could not') ? 'text-red-600' : 'text-green-600'}`}>
            {result}
          </p>
        </div>
      )}
    </div>
  )
}

export default function FinancialIQPage() {
  const [glossarySearch, setGlossarySearch] = useState('')
  const [activeLetter, setActiveLetter] = useState<string | null>(null)
  const [sipMonthly, setSipMonthly] = useState(25000)
  const [sipYears, setSipYears] = useState(10)
  const [sipReturn, setSipReturn] = useState(12)

  /* ─── Glossary Filter ─── */
  const filteredGlossary = GLOSSARY_TERMS.filter((item) => {
    const matchesSearch =
      glossarySearch === '' ||
      item.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      item.definition.toLowerCase().includes(glossarySearch.toLowerCase())
    const matchesLetter =
      !activeLetter || item.term.charAt(0).toUpperCase() === activeLetter
    return matchesSearch && matchesLetter
  })

  const alphabet = Array.from(new Set(GLOSSARY_TERMS.map((t) => t.term.charAt(0).toUpperCase()))).sort()

  /* ─── SIP Calculator ─── */
  const monthlyRate = sipReturn / 100 / 12
  const months = sipYears * 12
  const sipFutureValue =
    monthlyRate > 0
      ? sipMonthly * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate)
      : sipMonthly * months
  const sipTotalInvested = sipMonthly * months
  const sipWealth = sipFutureValue - sipTotalInvested

  return (
    <>
      {/* Hero */}
      <section className="pt-40 pb-20 gradient-dark relative overflow-hidden">
        {/* Space: Pulsar theme */}
        <SpaceHero variant="pulsar" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 right-0 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-72 h-72 bg-brand-red/3 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <div className="max-w-4xl">
              <div className="inline-flex items-center px-4 py-1.5 bg-brand-red/10 border border-brand-red/20 rounded-full mb-6">
                <GraduationCap className="w-4 h-4 text-brand-red mr-2" />
                <span className="text-brand-red text-sm font-semibold">Financial IQ</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-5">
                The Intelligent Investor&apos;s{' '}
                <span className="text-gradient">Resource Hub</span>
              </h1>
              <p className="text-base text-gray-300 max-w-2xl leading-relaxed">
                Knowledge is the best investment you can make.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ────────────────────────────────────────
          1. Investment Overview Video
      ──────────────────────────────────────── */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-12">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Learn Visually</span>
            <h2 className="section-title text-brand-black mt-2">Investment Overview</h2>
            <p className="section-subtitle mx-auto mt-4">
              An interactive overview of GHL India Ventures&apos; investment strategy, portfolio, and performance.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <div className="max-w-4xl mx-auto">
              <WebGLVideoPresentation className="shadow-2xl shadow-brand-red/10" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ────────────────────────────────────────
          2. Educational Articles
      ──────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-12">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Read &amp; Learn</span>
            <h2 className="section-title text-brand-black mt-2">Educational Articles</h2>
            <p className="section-subtitle mx-auto mt-4">
              Build your financial knowledge one article at a time.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FINANCIAL_IQ_ARTICLES.map((article, i) => (
              <AnimatedSection key={article.slug} delay={i * 80}>
                <div className={`card group h-full hover:-translate-y-1 ${['glow-card-orange', 'glow-card-pink', 'glow-card-teal', 'glow-card-rose', 'glow-card-blue', 'glow-card-violet', 'glow-card-emerald', 'glow-card-amber', 'glow-card-cyan', 'glow-card-red'][i % 10]}`}>
                  <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-red transition-all">
                    <BookOpen className="w-6 h-6 text-brand-red group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <GraduationCap className="w-4 h-4 text-brand-red" />
                    <span className="text-xs font-medium text-brand-red uppercase tracking-wider">
                      {article.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-brand-black mb-2 group-hover:text-brand-red transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-brand-grey text-sm mb-4 line-clamp-2">{article.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-brand-grey mt-auto pt-4 border-t border-gray-100">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(article.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {article.readTime}
                    </span>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          3. Financial Glossary
      ──────────────────────────────────────── */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-12">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Reference</span>
            <h2 className="section-title text-brand-black mt-2">Financial Glossary</h2>
            <p className="section-subtitle mx-auto mt-4">
              Key terms every alternative investment investor should know.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <div className="max-w-4xl mx-auto">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-grey" />
                <input
                  type="text"
                  placeholder="Search glossary terms..."
                  value={glossarySearch}
                  onChange={(e) => setGlossarySearch(e.target.value)}
                  className="input-field pl-10 text-sm"
                  aria-label="Search glossary"
                />
              </div>

              {/* A-Z Navigation */}
              <div className="flex flex-wrap gap-1.5 mb-8">
                <button
                  onClick={() => setActiveLetter(null)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                    !activeLetter
                      ? 'bg-brand-red text-white'
                      : 'bg-white text-brand-grey hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  All
                </button>
                {alphabet.map((letter) => (
                  <button
                    key={letter}
                    onClick={() => setActiveLetter(activeLetter === letter ? null : letter)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                      activeLetter === letter
                        ? 'bg-brand-red text-white'
                        : 'bg-white text-brand-grey hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>

              {/* Terms */}
              <div className="space-y-3">
                {filteredGlossary.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-10 h-10 text-brand-grey/40 mx-auto mb-3" />
                    <p className="text-brand-grey">No terms found. Try a different search.</p>
                  </div>
                ) : (
                  filteredGlossary.map((item, gi) => (
                    <div
                      key={item.term}
                      className={`bg-white rounded-xl p-5 border border-gray-100 hover:border-brand-red/20 hover:shadow-md transition-all ${['glow-card-violet', 'glow-card-cyan', 'glow-card-amber', 'glow-card-rose', 'glow-card-teal', 'glow-card-blue', 'glow-card-emerald', 'glow-card-red', 'glow-card-pink', 'glow-card-orange'][gi % 10]}`}
                    >
                      <div className="flex items-start gap-4">
                        <span className="inline-flex items-center justify-center w-12 h-12 bg-brand-red/10 text-brand-red font-bold text-sm rounded-xl flex-shrink-0">
                          {item.term.slice(0, 3)}
                        </span>
                        <div>
                          <h4 className="font-bold text-brand-black text-lg">{item.term}</h4>
                          <p className="text-brand-grey text-sm mt-1 leading-relaxed">{item.definition}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ────────────────────────────────────────
          4. Investment Calculators
      ──────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-12">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Tools</span>
            <h2 className="section-title text-brand-black mt-2">Investment Calculators</h2>
            <p className="section-subtitle mx-auto mt-4">
              Run quick calculations to visualize the power of disciplined investing.
            </p>
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* SIP Calculator */}
            <AnimatedSection delay={0}>
              <div className="card h-full glow-card-emerald">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-black text-lg">SIP Calculator</h3>
                    <p className="text-brand-grey text-xs">Systematic Investment Plan returns</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Monthly amount */}
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-brand-grey font-medium">Monthly Investment</span>
                      <span className="font-bold text-brand-black">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(sipMonthly)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1000}
                      max={500000}
                      step={1000}
                      value={sipMonthly}
                      onChange={(e) => setSipMonthly(Number(e.target.value))}
                      className="w-full accent-brand-red"
                    />
                    <div className="flex justify-between text-xs text-brand-grey mt-0.5">
                      <span>Rs 1,000</span>
                      <span>Rs 5,00,000</span>
                    </div>
                  </div>

                  {/* Years */}
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-brand-grey font-medium">Investment Period</span>
                      <span className="font-bold text-brand-black">{sipYears} years</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      step={1}
                      value={sipYears}
                      onChange={(e) => setSipYears(Number(e.target.value))}
                      className="w-full accent-brand-red"
                    />
                    <div className="flex justify-between text-xs text-brand-grey mt-0.5">
                      <span>1 yr</span>
                      <span>30 yrs</span>
                    </div>
                  </div>

                  {/* Expected return */}
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-brand-grey font-medium">Expected Annual Return</span>
                      <span className="font-bold text-brand-black">{sipReturn}%</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      step={0.5}
                      value={sipReturn}
                      onChange={(e) => setSipReturn(Number(e.target.value))}
                      className="w-full accent-brand-red"
                    />
                    <div className="flex justify-between text-xs text-brand-grey mt-0.5">
                      <span>1%</span>
                      <span>30%</span>
                    </div>
                  </div>

                  {/* Result */}
                  <div className="bg-brand-offwhite rounded-xl p-5 mt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-brand-grey mb-1">Total Invested</p>
                        <p className="font-bold text-brand-black text-sm">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(sipTotalInvested)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-brand-grey mb-1">Wealth Gained</p>
                        <p className="font-bold text-emerald-600 text-sm">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(sipWealth)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-brand-grey mb-1">Total Value</p>
                        <p className="font-bold text-brand-red text-lg">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(sipFutureValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* IRR Calculator — Working */}
            <AnimatedSection delay={100}>
              <IrrCalculator />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          5. Upcoming Events
      ──────────────────────────────────────── */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-12">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Events</span>
            <h2 className="section-title text-brand-black mt-2">Upcoming Webinars &amp; Sessions</h2>
            <p className="section-subtitle mx-auto mt-4">
              Join our live sessions to learn directly from investment professionals.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {EVENTS.map((event, i) => {
              const eventDate = new Date(event.date)
              return (
                <AnimatedSection key={event.title} delay={i * 100}>
                  <div className={`card group hover:-translate-y-1 h-full ${['glow-card-pink', 'glow-card-teal', 'glow-card-amber'][i % 3]}`}>
                    {/* Date badge */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-brand-red/10 rounded-xl p-3 text-center flex-shrink-0 min-w-[60px]">
                        <span className="block text-2xl font-bold text-brand-red leading-none">
                          {eventDate.getDate()}
                        </span>
                        <span className="block text-xs font-medium text-brand-red/70 uppercase mt-1">
                          {eventDate.toLocaleDateString('en-IN', { month: 'short' })}
                        </span>
                      </div>
                      <div>
                        <span className="inline-block px-2.5 py-0.5 bg-brand-red text-white text-xs font-bold rounded-full uppercase mb-2">
                          {event.type}
                        </span>
                        <h3 className="font-bold text-brand-black group-hover:text-brand-red transition-colors leading-snug">
                          {event.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-brand-grey text-sm mb-4 leading-relaxed">{event.description}</p>
                    <div className="flex items-center text-xs text-brand-grey mt-auto pt-4 border-t border-gray-100">
                      <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                      <span>
                        {eventDate.toLocaleDateString('en-IN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="mx-2 text-gray-300">|</span>
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          6. Downloadable Guides
      ──────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-12">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Resources</span>
            <h2 className="section-title text-brand-black mt-2">Downloadable Guides</h2>
            <p className="section-subtitle mx-auto mt-4">
              In-depth guides to accelerate your investment knowledge.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { title: 'AIF Investment Guide', desc: 'Everything you need to know about investing in Alternative Investment Funds.', icon: FileText },
              { title: 'Investor Onboarding Kit', desc: 'Step-by-step documentation and KYC requirements for fund participation.', icon: Download },
              { title: 'Market Outlook Report', desc: 'Our latest quarterly market analysis and sector forecasts.', icon: TrendingUp },
            ].map((guide, i) => (
              <AnimatedSection key={guide.title} delay={i * 100}>
                <Link href="/downloads" className="block">
                  <div className={`card group hover:-translate-y-1 h-full text-center ${['glow-card-rose', 'glow-card-cyan', 'glow-card-orange'][i % 3]}`}>
                    <div className="w-14 h-14 bg-brand-red/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-red transition-all">
                      <guide.icon className="w-7 h-7 text-brand-red group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-bold text-brand-black mb-2 group-hover:text-brand-red transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-brand-grey text-sm mb-4">{guide.desc}</p>
                    <span className="inline-flex items-center text-brand-red text-sm font-semibold">
                      View in Downloads
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-brand-black text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-red/5 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto relative z-10">
          <AnimatedSection>
            <GraduationCap className="w-14 h-14 text-brand-red mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Keep Learning. Keep Growing.</h2>
            <p className="text-gray-400 text-base max-w-2xl mx-auto mb-6">
              Financial literacy is the foundation of smart investing. Explore our full library of resources
              and stay ahead of the market.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/blog" className="btn-primary">
                Read Our Blog <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                href="/downloads"
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm border-2 border-white/20 text-white font-bold rounded-lg hover:bg-white/10 transition-all"
              >
                Browse Downloads <Download className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
