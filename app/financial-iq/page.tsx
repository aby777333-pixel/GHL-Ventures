'use client'

import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import PlaceholderImage from '@/components/PlaceholderImage'
import { FINANCIAL_IQ_ARTICLES } from '@/lib/constants'
import {
  BookOpen,
  GraduationCap,
  Lightbulb,
  TrendingUp,
  ArrowRight,
  Clock,
  Calendar,
  Play,
  Search,
  Calculator,
  FileText,
  Video,
  CalendarDays,
  Download,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

/* ─── Glossary Data ─── */
const GLOSSARY_TERMS: { term: string; definition: string }[] = [
  { term: 'AIF', definition: 'Alternative Investment Fund -- a privately pooled investment vehicle regulated by SEBI under the AIF Regulations, 2012.' },
  { term: 'AML', definition: 'Anti-Money Laundering -- a set of laws and regulations designed to prevent money laundering activities.' },
  { term: 'Category II AIF', definition: 'A SEBI classification for funds that include PE funds, debt funds, and funds not leveraging or borrowing other than to meet day-to-day requirements.' },
  { term: 'HNI', definition: 'High Net-worth Individual -- an investor with a substantial investable surplus, typically above Rs 1 crore for AIF participation.' },
  { term: 'IRR', definition: 'Internal Rate of Return -- the annualized effective compounded return rate that makes the net present value of all cash flows equal to zero.' },
  { term: 'KYC', definition: 'Know Your Customer -- the process of verifying the identity of investors as mandated by SEBI and RBI regulations.' },
  { term: 'NAV', definition: 'Net Asset Value -- the per-unit value of a fund, calculated by dividing total net assets by the number of outstanding units.' },
  { term: 'PE', definition: 'Private Equity -- an alternative asset class consisting of capital not listed on a public exchange, invested directly in companies.' },
  { term: 'PPM', definition: 'Private Placement Memorandum -- a legal document provided to prospective investors detailing the fund strategy, risks, terms, and structure.' },
  { term: 'SEBI', definition: 'Securities and Exchange Board of India -- the regulator for securities and capital markets in India.' },
]

/* ─── Video Library Data ─── */
const VIDEOS = [
  { title: 'What is an AIF? Explained Simply', duration: '8:24', category: 'Basics', slug: 'what-is-aif' },
  { title: 'Understanding Stressed Real Estate', duration: '12:05', category: 'Real Estate', slug: 'stressed-real-estate' },
  { title: 'How IRR Actually Works', duration: '10:32', category: 'Finance', slug: 'how-irr-works' },
  { title: 'SEBI Regulations for Cat II AIFs', duration: '15:18', category: 'Regulation', slug: 'sebi-cat-ii' },
  { title: 'Startup Valuation Methods', duration: '11:45', category: 'Startups', slug: 'startup-valuation' },
  { title: 'Building a Diversified Portfolio', duration: '9:50', category: 'Strategy', slug: 'diversified-portfolio' },
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
      <section className="pt-40 pb-20 bg-white relative overflow-hidden">
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
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-brand-black leading-tight mb-5">
                The Intelligent Investor&apos;s{' '}
                <span className="text-gradient">Resource Hub</span>
              </h1>
              <p className="text-base text-brand-grey max-w-2xl leading-relaxed">
                Knowledge is the best investment you can make.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ────────────────────────────────────────
          1. Video Library
      ──────────────────────────────────────── */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-12">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Learn Visually</span>
            <h2 className="section-title text-brand-black mt-2">Video Library</h2>
            <p className="section-subtitle mx-auto mt-4">
              Short, focused videos breaking down complex investment concepts.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {VIDEOS.map((video, i) => (
              <AnimatedSection key={video.slug} delay={i * 80}>
                <div className="card group hover:-translate-y-1 h-full">
                  {/* Thumbnail placeholder */}
                  <div className="relative w-full aspect-video rounded-xl mb-4 overflow-hidden">
                    <PlaceholderImage theme="education" aspectRatio="aspect-video" className="rounded-xl" />
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-14 h-14 bg-brand-red/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-brand-red/30">
                        <Play className="w-6 h-6 text-white ml-1" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-xs rounded font-mono z-10">
                      {video.duration}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-brand-red uppercase tracking-wider">{video.category}</span>
                  <h3 className="font-bold text-brand-black mt-1 group-hover:text-brand-red transition-colors">
                    {video.title}
                  </h3>
                </div>
              </AnimatedSection>
            ))}
          </div>
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
                <div className="card group h-full hover:-translate-y-1">
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
                  filteredGlossary.map((item) => (
                    <div
                      key={item.term}
                      className="bg-white rounded-xl p-5 border border-gray-100 hover:border-brand-red/20 hover:shadow-md transition-all"
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
              <div className="card h-full">
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

            {/* IRR Calculator placeholder */}
            <AnimatedSection delay={100}>
              <div className="card h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-black text-lg">IRR Calculator</h3>
                    <p className="text-brand-grey text-xs">Internal Rate of Return</p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                    <Calculator className="w-10 h-10 text-blue-500/50" />
                  </div>
                  <h4 className="font-bold text-brand-black text-lg mb-2">Coming Soon</h4>
                  <p className="text-brand-grey text-sm max-w-xs leading-relaxed mb-6">
                    Our IRR calculator will help you evaluate the true annualized return on your
                    alternative investments, accounting for irregular cash flows.
                  </p>
                  <span className="inline-flex items-center px-4 py-2 bg-blue-500/10 text-blue-600 text-sm font-medium rounded-full">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    In Development
                  </span>
                </div>
              </div>
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
                  <div className="card group hover:-translate-y-1 h-full">
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
                  <div className="card group hover:-translate-y-1 h-full text-center">
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
