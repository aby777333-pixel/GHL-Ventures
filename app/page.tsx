'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import PlaceholderImage from '@/components/PlaceholderImage'
import { useIntersectionObserver, useCountUp } from '@/lib/hooks'
import { BRAND, PORTFOLIO_COMPANIES, BLOG_POSTS } from '@/lib/constants'
import {
  ArrowRight, Shield, Play, MapPin, BadgeCheck, IndianRupee,
  TrendingUp, Target, Users, BarChart3, Eye, Scale, Leaf,
  Building2, Quote, Star, Phone, Mail, Clock,
  BookOpen, Video, FileText,
  Landmark, LockKeyhole, Sparkles, Calculator, ChevronDown
} from 'lucide-react'
import RiskAssessmentQuiz from '@/components/RiskAssessmentQuiz'
import InvestmentCalculator from '@/components/InvestmentCalculator'
import AllInvestmentsCalculator from '@/components/AllInvestmentsCalculator'
import WealthGrowthMap from '@/components/WealthGrowthMap'
import TaxImpactAnalyzer from '@/components/TaxImpactAnalyzer'
import InflationProofChecker from '@/components/InflationProofChecker'
import { AlertTriangle } from 'lucide-react'
import SpaceHero from '@/components/SpaceHero'

/* ================================================================
   HELPER: Animated Counter (standalone)
   ================================================================ */
function CountUpStat({ end, prefix, suffix, label }: {
  end: number; prefix?: string; suffix?: string; label: string
}) {
  const { ref, isVisible } = useIntersectionObserver(0.3)
  const { count, startCounting } = useCountUp(end, 2200)

  useEffect(() => {
    if (isVisible) startCounting()
  }, [isVisible, startCounting])

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-extrabold text-white mb-1 tracking-tight">
        {prefix}{count}{suffix}
      </div>
      <div className="text-gray-400 text-sm font-medium uppercase tracking-widest">{label}</div>
    </div>
  )
}

/* ================================================================
   SECTION 1: Hero -- Full Viewport, Space/Cosmos Theme
   ================================================================ */

/* Star field data - positioned deterministically to avoid hydration mismatch */
const STARS = [
  // Small stars (1px)
  { x: 5, y: 8, size: 'sm', delay: 0 }, { x: 12, y: 15, size: 'sm', delay: 1.2 },
  { x: 22, y: 5, size: 'sm', delay: 0.5 }, { x: 35, y: 12, size: 'sm', delay: 2.1 },
  { x: 42, y: 25, size: 'sm', delay: 0.8 }, { x: 55, y: 8, size: 'sm', delay: 1.5 },
  { x: 68, y: 18, size: 'sm', delay: 0.3 }, { x: 75, y: 6, size: 'sm', delay: 2.5 },
  { x: 82, y: 22, size: 'sm', delay: 1.8 }, { x: 90, y: 10, size: 'sm', delay: 0.7 },
  { x: 15, y: 35, size: 'sm', delay: 1.1 }, { x: 28, y: 42, size: 'sm', delay: 2.3 },
  { x: 48, y: 38, size: 'sm', delay: 0.4 }, { x: 62, y: 32, size: 'sm', delay: 1.7 },
  { x: 78, y: 40, size: 'sm', delay: 0.9 }, { x: 88, y: 35, size: 'sm', delay: 2.0 },
  { x: 8, y: 55, size: 'sm', delay: 1.4 }, { x: 25, y: 60, size: 'sm', delay: 0.6 },
  { x: 38, y: 52, size: 'sm', delay: 2.2 }, { x: 52, y: 58, size: 'sm', delay: 1.0 },
  { x: 70, y: 55, size: 'sm', delay: 0.2 }, { x: 85, y: 62, size: 'sm', delay: 1.9 },
  { x: 18, y: 72, size: 'sm', delay: 2.4 }, { x: 45, y: 70, size: 'sm', delay: 0.1 },
  { x: 65, y: 75, size: 'sm', delay: 1.6 }, { x: 92, y: 48, size: 'sm', delay: 0.8 },
  { x: 3, y: 88, size: 'sm', delay: 1.3 }, { x: 33, y: 85, size: 'sm', delay: 2.1 },
  { x: 58, y: 82, size: 'sm', delay: 0.5 }, { x: 80, y: 78, size: 'sm', delay: 1.7 },
  // Extra small blinkers scattered throughout
  { x: 7, y: 3, size: 'sm', delay: 0.9 }, { x: 16, y: 28, size: 'sm', delay: 2.7 },
  { x: 27, y: 18, size: 'sm', delay: 0.3 }, { x: 37, y: 48, size: 'sm', delay: 1.8 },
  { x: 47, y: 6, size: 'sm', delay: 2.4 }, { x: 57, y: 30, size: 'sm', delay: 0.7 },
  { x: 67, y: 65, size: 'sm', delay: 1.5 }, { x: 77, y: 45, size: 'sm', delay: 2.9 },
  { x: 87, y: 25, size: 'sm', delay: 0.4 }, { x: 95, y: 55, size: 'sm', delay: 1.2 },
  { x: 2, y: 40, size: 'sm', delay: 2.0 }, { x: 13, y: 92, size: 'sm', delay: 0.6 },
  { x: 43, y: 90, size: 'sm', delay: 1.9 }, { x: 73, y: 88, size: 'sm', delay: 2.3 },
  { x: 96, y: 82, size: 'sm', delay: 0.1 }, { x: 53, y: 95, size: 'sm', delay: 1.1 },
  // Medium stars (2px)
  { x: 10, y: 20, size: 'md', delay: 0.8 }, { x: 30, y: 30, size: 'md', delay: 1.5 },
  { x: 50, y: 15, size: 'md', delay: 2.0 }, { x: 72, y: 28, size: 'md', delay: 0.3 },
  { x: 88, y: 18, size: 'md', delay: 1.2 }, { x: 20, y: 50, size: 'md', delay: 2.5 },
  { x: 40, y: 45, size: 'md', delay: 0.6 }, { x: 60, y: 48, size: 'md', delay: 1.8 },
  { x: 75, y: 60, size: 'md', delay: 0.9 }, { x: 15, y: 78, size: 'md', delay: 2.2 },
  { x: 55, y: 72, size: 'md', delay: 1.1 }, { x: 85, y: 70, size: 'md', delay: 0.4 },
  // Extra medium blinkers
  { x: 5, y: 45, size: 'md', delay: 1.7 }, { x: 35, y: 55, size: 'md', delay: 2.8 },
  { x: 65, y: 85, size: 'md', delay: 0.5 }, { x: 93, y: 38, size: 'md', delay: 1.3 },
  { x: 48, y: 78, size: 'md', delay: 2.1 }, { x: 22, y: 88, size: 'md', delay: 0.9 },
  // Large stars (3px, with glow)
  { x: 18, y: 12, size: 'lg', delay: 1.0 }, { x: 45, y: 22, size: 'lg', delay: 2.3 },
  { x: 70, y: 10, size: 'lg', delay: 0.7 }, { x: 25, y: 65, size: 'lg', delay: 1.6 },
  { x: 60, y: 42, size: 'lg', delay: 2.8 }, { x: 90, y: 52, size: 'lg', delay: 0.2 },
  { x: 38, y: 80, size: 'lg', delay: 1.4 }, { x: 82, y: 85, size: 'lg', delay: 2.6 },
  // Extra large bright blinkers
  { x: 8, y: 68, size: 'lg', delay: 1.9 }, { x: 52, y: 5, size: 'lg', delay: 0.8 },
  { x: 95, y: 15, size: 'lg', delay: 2.5 }, { x: 32, y: 72, size: 'lg', delay: 0.3 },
]

/* Live TV channel options — using direct video IDs for stable streams,
   channel handle-based /live embed as fallback for channels with rotating streams. */
const LIVE_CHANNELS = [
  { id: 'cnbc', label: 'CNBC-TV18', videoId: 'P857H4ej-MQ', handle: 'CNBCTV18Digital' },
  { id: 'bloomberg', label: 'Bloomberg', videoId: null, handle: 'Bloomberg' },
  { id: 'ndtv', label: 'NDTV Profit', videoId: 'EN-N1xhtBqU', handle: 'NDTVProfitIndia' },
  { id: 'zee', label: 'Zee Business', videoId: 'x0X9YeejdcM', handle: 'ZeeBusiness' },
  { id: 'etnow', label: 'ET Now', videoId: 'C6DdVpvyoK8', handle: 'ETNow' },
]

function getLiveEmbedUrl(ch: typeof LIVE_CHANNELS[0]) {
  if (ch.videoId) return `https://www.youtube.com/embed/${ch.videoId}?autoplay=0&rel=0`
  return `https://www.youtube.com/embed?listType=playlist&list=UU${ch.handle}&autoplay=0&rel=0`
}

function LiveFinancialTV() {
  const [activeChannel, setActiveChannel] = useState(0)
  const ch = LIVE_CHANNELS[activeChannel]

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-sm">
      <div className="aspect-video relative bg-black">
        <iframe
          key={ch.id}
          src={getLiveEmbedUrl(ch)}
          title={`${ch.label} Live - Financial News`}
          className="w-full h-full absolute inset-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
      {/* Live indicator badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full border border-white/10">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-white text-[10px] font-bold uppercase tracking-wider">Live</span>
      </div>
      {/* Channel switcher */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 pt-8">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {LIVE_CHANNELS.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveChannel(i)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider transition-all ${
                i === activeChannel
                  ? 'bg-brand-red text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function HeroSection() {
  /* Live chart symbol options */
  const CHART_SYMBOLS = [
    { label: 'NIFTY 50', symbol: 'NSE:NIFTY' },
    { label: 'SENSEX', symbol: 'BSE:SENSEX' },
    { label: 'BANK NIFTY', symbol: 'NSE:BANKNIFTY' },
    { label: 'Reliance', symbol: 'NSE:RELIANCE' },
    { label: 'TCS', symbol: 'NSE:TCS' },
    { label: 'HDFC Bank', symbol: 'NSE:HDFCBANK' },
    { label: 'Gold MCX', symbol: 'MCX:GOLD1!' },
    { label: 'Silver MCX', symbol: 'MCX:SILVER1!' },
    { label: 'Crude Oil', symbol: 'MCX:CRUDEOIL1!' },
  ]
  const [chartSymbol, setChartSymbol] = useState(0)
  const [chartDropdownOpen, setChartDropdownOpen] = useState(false)

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: 'linear-gradient(180deg, #030014 0%, #0a0020 30%, #0d0010 60%, #0a0a0a 100%)' }}>

      <SpaceHero variant="aurora" />

      {/* ---- SPACE BACKGROUND LAYERS ---- */}

      {/* Deep space nebula patches */}
      <div className="nebula-patch" style={{ top: '10%', left: '10%', width: '300px', height: '300px', background: 'rgba(208, 2, 27, 0.06)' }} />
      <div className="nebula-patch" style={{ top: '30%', right: '5%', width: '250px', height: '250px', background: 'rgba(80, 20, 120, 0.05)', animationDelay: '-7s' }} />
      <div className="nebula-patch" style={{ bottom: '20%', left: '30%', width: '350px', height: '200px', background: 'rgba(208, 2, 27, 0.04)', animationDelay: '-13s' }} />

      {/* Star field */}
      {STARS.map((star, i) => (
        <span
          key={i}
          className={`star star-${star.size}`}
          style={{
            top: `${star.y}%`,
            left: `${star.x}%`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}

      {/* Single shooting star */}
      <span className="shooting-star" style={{ top: '18%', left: '25%', animation: 'shooting-star 8s ease-out infinite 5s' }} />

      {/* Comets (larger, with long gradient tails) */}
      <div className="comet" style={{ top: '10%', left: '5%', animation: 'comet-streak-1 12s ease-out infinite 2s' }}>
        <div className="comet-head" />
      </div>
      <div className="comet" style={{ top: '35%', left: '70%', animation: 'comet-streak-2 16s ease-out infinite 7s' }}>
        <div className="comet-head" />
      </div>
      <div className="comet" style={{ top: '55%', left: '20%', animation: 'comet-streak-3 14s ease-out infinite 12s' }}>
        <div className="comet-head" />
      </div>
      <div className="comet" style={{ top: '20%', left: '45%', animation: 'comet-streak-1 18s ease-out infinite 20s' }}>
        <div className="comet-head" />
      </div>

      {/* Space station orbiting across the sky */}
      <div className="space-station">
        <div className="space-station-body" />
      </div>

      {/* Passenger airplane with blinking lights — subtle, high in the sky */}
      <div className="airplane">
        <div className="airplane-body">
          <span className="airplane-light airplane-light-red" />
          <span className="airplane-light airplane-light-white" />
          <span className="airplane-light airplane-light-green" />
        </div>
      </div>

      {/* Big arc / planetary horizon with silver edge */}
      <div className="space-arc" />
      <div className="space-arc-inner" />

      {/* Horizon glow band with silver-white sunrise bloom */}
      <div className="space-horizon" />

      {/* Subtle grain overlay */}
      <div className="absolute inset-0 grain-overlay pointer-events-none" />

      {/* Red burst radial (existing brand style) */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 25% 50%, rgba(208, 2, 27, 0.08) 0%, transparent 60%)' }} />

      {/* ---- END SPACE BACKGROUND ---- */}

      <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-44 pb-14">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
          {/* LEFT: Hero Copy */}
          <div>
            <AnimatedSection delay={0}>
              <div className="inline-flex items-center px-4 py-2 bg-brand-red/10 border border-brand-red/20 rounded-full mb-8 backdrop-blur-sm">
                <Shield className="w-4 h-4 text-brand-red mr-2" />
                <span className="text-brand-red text-xs font-semibold uppercase tracking-widest">
                  SEBI Registered &nbsp;|&nbsp; Category II AIF
                </span>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-extrabold text-white leading-[1.08] mb-5 tracking-tight" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.8), 0 0 40px rgba(208,2,27,0.15)' }}>
                SEBI Registered <span className="text-gradient">Alternative Investment Fund</span> — Where Bold Capital Meets Intelligence
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <p className="text-base text-gray-300 mb-8 max-w-xl leading-relaxed" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
                GHL India Ventures delivers institutional-grade alternative investments for India&apos;s discerning investors. Minimum &#8377;1 Crore.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={550}>
              <div className="flex flex-wrap gap-4 mb-10">
                <Link href="/fund" className="btn-primary">
                  Explore Our Fund <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
                <Link href="/contact" className="btn-outline-white">
                  Talk to an Advisor
                </Link>
              </div>
            </AnimatedSection>

            {/* Trust badges */}
            <AnimatedSection delay={700}>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: BadgeCheck, text: 'SEBI Reg.' },
                  { icon: MapPin, text: 'Egmore, Chennai' },
                  { icon: Landmark, text: 'Category II AIF' },
                  { icon: IndianRupee, text: '₹1 Cr Minimum' },
                ].map(b => (
                  <span
                    key={b.text}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-300 text-xs font-medium backdrop-blur-sm"
                  >
                    <b.icon className="w-3.5 h-3.5 text-brand-red" />
                    {b.text}
                  </span>
                ))}
              </div>
            </AnimatedSection>
          </div>

          {/* RIGHT: Live Financial TV + Image Slider */}
          <div className="space-y-6">
            {/* Live Financial TV Embed — with channel switcher */}
            <AnimatedSection delay={400} direction="right">
              <LiveFinancialTV />
            </AnimatedSection>

            {/* Live Indian Market Chart (TradingView Advanced) */}
            <AnimatedSection delay={600} direction="right">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-sm">
                {/* Chart symbol dropdown */}
                <div className="absolute top-2 left-2 z-20">
                  <div className="relative">
                    <button
                      onClick={() => setChartDropdownOpen(!chartDropdownOpen)}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-black/80 backdrop-blur-sm rounded-full border border-white/15 text-white text-[9px] font-semibold uppercase tracking-wider hover:bg-black/90 transition-all shadow-lg"
                    >
                      <TrendingUp className="w-2.5 h-2.5 text-brand-red" />
                      {CHART_SYMBOLS[chartSymbol].label}
                      <ChevronDown className={`w-2.5 h-2.5 transition-transform ${chartDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {chartDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-44 bg-[#111]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                        {CHART_SYMBOLS.map((sym, i) => (
                          <button
                            key={sym.symbol}
                            onClick={() => { setChartSymbol(i); setChartDropdownOpen(false) }}
                            className={`w-full text-left px-3 py-2 text-[10px] font-medium transition-all ${
                              i === chartSymbol
                                ? 'bg-white/10 text-brand-red'
                                : 'text-white/70 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {sym.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* TradingView Advanced Chart Widget */}
                <div className="h-56">
                  <iframe
                    key={CHART_SYMBOLS[chartSymbol].symbol}
                    src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(CHART_SYMBOLS[chartSymbol].symbol)}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=000000&studies=MASimple%409%2CRSI%4014&theme=dark&style=1&timezone=Asia%2FKolkata&withdateranges=1&showpopupbutton=0&hideideas=1&studies_overrides=%7B%7D&overrides=%7B%22paneProperties.background%22%3A%22%23000000%22%2C%22paneProperties.backgroundType%22%3A%22solid%22%2C%22scalesProperties.textColor%22%3A%22%23FFFFFF%22%2C%22scalesProperties.lineColor%22%3A%22%23333333%22%2C%22mainSeriesProperties.candleStyle.upColor%22%3A%22%2300C853%22%2C%22mainSeriesProperties.candleStyle.downColor%22%3A%22%23FF1744%22%2C%22mainSeriesProperties.candleStyle.borderUpColor%22%3A%22%2300C853%22%2C%22mainSeriesProperties.candleStyle.borderDownColor%22%3A%22%23FF1744%22%2C%22mainSeriesProperties.candleStyle.wickUpColor%22%3A%22%2300C853%22%2C%22mainSeriesProperties.candleStyle.wickDownColor%22%3A%22%23FF1744%22%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=&utm_medium=widget&utm_campaign=chart`}
                    title={`${CHART_SYMBOLS[chartSymbol].label} Live Chart`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    allow="encrypted-media"
                  />
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <div className="w-7 h-11 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   SECTION 1.5: News Scroller — World & India Headlines
   ================================================================ */
function NewsScroller() {
  const headlines = [
    { label: '🇮🇳 India', text: 'SENSEX rallies 450 points; NIFTY crosses 23,800 on strong FII buying' },
    { label: '🌍 Global', text: 'US Fed signals potential rate cut in June as inflation eases to 2.3%' },
    { label: '🇮🇳 India', text: 'India GDP growth revised upward to 7.2% for FY26 by IMF' },
    { label: '🌍 Global', text: 'China manufacturing PMI expands at fastest pace in 14 months' },
    { label: '🇮🇳 India', text: 'RBI holds repo rate at 6.25% — maintains accommodative stance' },
    { label: '🌍 Global', text: 'European markets open higher on easing trade tensions' },
    { label: '🇮🇳 India', text: 'Indian startup funding sees 40% jump in Q1 2026 — $4.2B raised' },
    { label: '🌍 Global', text: 'Gold surges past $2,400/oz as safe-haven demand spikes worldwide' },
    { label: '🇮🇳 India', text: 'SEBI tightens AIF disclosure norms — enhanced reporting from Q3 2026' },
    { label: '🌍 Global', text: 'Crude oil drops below $72/bbl as OPEC+ signals production increase' },
    { label: '🇮🇳 India', text: 'Real estate sector sees 25% growth in Chennai micro-markets' },
    { label: '🌍 Global', text: 'Japan Nikkei 225 gains 1.8% on tech rally and weak yen boost' },
  ]

  const feed = headlines.map(h => `${h.label}  ${h.text}`).join('  \u00A0\u00A0\u2022\u00A0\u00A0  ')

  return (
    <section className="relative overflow-hidden py-2.5" style={{ backgroundColor: '#0D0D0D', borderTop: '1px solid rgba(208,2,27,0.15)', borderBottom: '1px solid rgba(208,2,27,0.15)' }}>
      <div className="flex items-center">
        <span className="shrink-0 px-4 py-1 bg-brand-red text-white text-[10px] font-bold uppercase tracking-widest rounded-r-full mr-4">
          Live News
        </span>
        <div className="flex-1 overflow-hidden">
          <div className="flex whitespace-nowrap animate-marquee">
            {[0, 1].map(i => (
              <span key={i} className="inline-block text-gray-300 text-xs font-medium tracking-wide px-4">
                {feed}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   SECTION 2: Ticker / Stats Strip
   ================================================================ */
function TickerStrip() {
  const text = `SEBI Registration No. ${BRAND.sebi}  \u2022  Category II AIF  \u2022  Min Investment: \u20B91 Crore  \u2022  Stressed Real Estate & Early-Stage Startups  \u2022  Chennai, India  \u2022  ${BRAND.email}`

  return (
    <section className="relative overflow-hidden py-3" style={{ backgroundColor: '#1a0000' }}>
      <div className="flex whitespace-nowrap animate-marquee">
        {[0, 1].map(i => (
          <span key={i} className="inline-block text-gray-400 text-sm font-medium tracking-wide px-8">
            {text} &nbsp;&nbsp;&bull;&nbsp;&nbsp; {text}
          </span>
        ))}
      </div>
    </section>
  )
}

/* ================================================================
   SECTION 3: Who We Are (Split Layout)
   ================================================================ */
function WhoWeAre() {
  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left: Image placeholder */}
          <AnimatedSection direction="left">
            <PlaceholderImage theme="team" aspectRatio="aspect-[4/3]" label="GHL India Ventures Team / Chennai Office" className="rounded-3xl" />
          </AnimatedSection>

          {/* Right: Stats + copy */}
          <AnimatedSection direction="right">
            <span className="eyebrow">Who We Are</span>
            <h2 className="section-title mt-3 text-brand-black">
              Capital That <span className="text-gradient">Creates Value</span>
            </h2>

            {/* Animated counter stats */}
            <div className="grid grid-cols-2 gap-6 my-10">
              <CountUpStat end={25} suffix="+" label="Years of Experience" />
              <CountUpStat end={500} prefix="₹" suffix=" Cr+" label="Value Created" />
              <CountUpStat end={1000} suffix="+" label="Pitch Decks Analyzed" />
              <CountUpStat end={50} suffix="+" label="Strong Support Team" />
            </div>

            <p className="text-brand-grey text-base leading-relaxed mb-4">
              GHL India Ventures is a SEBI-registered Category II Alternative Investment Fund focused on two high-conviction strategies: recovering value from stressed real estate assets and backing early-stage startups poised to transform India&apos;s economic landscape.
            </p>
            <p className="text-brand-grey text-base leading-relaxed mb-8">
              Headquartered in Chennai, our leadership brings over 25 years of experience spanning private equity, financial services, and strategic advisory.
            </p>

            <Link href="/about" className="btn-primary">
              Read Our Full Story <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   SECTION 4: Investment Capabilities (6 Cards)
   ================================================================ */
function InvestmentCapabilities() {
  const pillars = [
    { icon: TrendingUp, title: 'Value Investing', desc: 'We seek asymmetric risk-reward opportunities in stressed assets and emerging ventures where intrinsic value is deeply misunderstood.' },
    { icon: Shield, title: 'Risk Management', desc: 'A multi-layered risk framework ensures downside protection across every allocation, from macro stress testing to deal-level hedging.' },
    { icon: BarChart3, title: 'Fundamental Analysis', desc: 'Every investment undergoes 360-degree forensic diligence — financial modelling, management scoring, and sector benchmarking.' },
    { icon: Eye, title: 'Liquidity Management', desc: 'We engineer liquidity windows and secondary exit pathways to balance portfolio agility with long-term conviction.' },
    { icon: Scale, title: 'Transparency & Accountability', desc: 'Institutional-grade reporting, quarterly NAV disclosures, and open-door governance that treats every investor as a partner.' },
    { icon: Leaf, title: 'Ethical / ESG Considerations', desc: 'We integrate environmental, social, and governance criteria at every stage, because sustainable returns demand responsible capital.' },
  ]

  return (
    <section className="section-padding bg-white">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="eyebrow">Our Approach</span>
          <h2 className="section-title mt-3 text-brand-black">Six Pillars of Our Investment Philosophy</h2>
          <p className="section-subtitle mx-auto mt-4">
            We don&apos;t just invest capital — we invest conviction.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pillars.map((p, i) => (
            <AnimatedSection key={p.title} delay={i * 120}>
              <div className="card h-full group hover:-translate-y-2 hover:border-brand-red/20 border border-transparent">
                <div className="w-14 h-14 bg-brand-red/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-brand-red transition-all duration-300">
                  <p.icon className="w-7 h-7 text-brand-red group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-brand-black mb-3">{p.title}</h3>
                <p className="text-brand-grey text-sm leading-relaxed">{p.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   SECTION 5: Video Feature (Full-Width, Dark)
   ================================================================ */
function VideoFeature() {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      {/* Dark gradient + red radial bg */}
      <div className="absolute inset-0 hero-gradient" />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, rgba(208,2,27,0.15) 0%, transparent 65%)' }}
      />

      <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection className="text-center mb-10">
          <span className="eyebrow !text-brand-red">From Our Chairman</span>
          <h2 className="section-title mt-3 text-white">The GHL India Ventures Story</h2>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <div className="relative max-w-4xl mx-auto group cursor-pointer">
            <PlaceholderImage theme="hero" aspectRatio="aspect-video" label="Chairman's Message — 3 minutes" className="rounded-3xl border border-white/10" />
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="relative">
                <div className="absolute inset-0 w-20 h-20 rounded-full bg-brand-red/40 animate-pulse-ring" />
                <div className="relative w-20 h-20 bg-brand-red rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-brand-red/30">
                  <Play className="w-9 h-9 text-white ml-1" />
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ================================================================
   SECTION 6: Why Choose Us (Alternating Layout)
   ================================================================ */
function WhyChooseUs() {
  const features = [
    {
      title: 'SEBI-Regulated Trust',
      desc: 'Our registration as a Category II Alternative Investment Fund (IN/AIF2/2425/1517) guarantees full regulatory compliance, third-party audits, and custodial safeguards for every rupee you commit.',
      icon: Shield,
    },
    {
      title: 'Diversified Portfolio',
      desc: 'We balance high-conviction plays in stressed real estate recovery with early-stage startup exposure, offering built-in diversification across asset types, geographies, and time horizons.',
      icon: BarChart3,
    },
    {
      title: 'Expert-Led Strategy',
      desc: 'Our investment committee brings 25+ years of experience spanning private equity, structured finance, and entrepreneurial growth. Every decision is backed by rigorous analysis.',
      icon: Target,
    },
    {
      title: 'Investor-First Approach',
      desc: 'Quarterly NAV reporting, transparent fee structures, dedicated relationship managers, and a governance framework that places investor interests at the absolute centre of every decision.',
      icon: Users,
    },
  ]

  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="eyebrow">The GHL Advantage</span>
          <h2 className="section-title mt-3 text-brand-black">Why Choose Us</h2>
        </AnimatedSection>

        <div className="space-y-14">
          {features.map((f, i) => {
            const isEven = i % 2 === 0
            return (
              <div
                key={f.title}
                className={`grid lg:grid-cols-2 gap-12 items-center ${isEven ? '' : 'lg:direction-rtl'}`}
              >
                {/* Image placeholder */}
                <AnimatedSection direction={isEven ? 'left' : 'right'} className={isEven ? '' : 'lg:order-2'}>
                  <PlaceholderImage theme={i === 0 ? 'compliance' : i === 1 ? 'portfolio' : i === 2 ? 'finance' : 'team'} aspectRatio="aspect-[4/3]" label={f.title} className="rounded-3xl" />
                </AnimatedSection>

                {/* Text */}
                <AnimatedSection direction={isEven ? 'right' : 'left'} className={isEven ? '' : 'lg:order-1'}>
                  <span className="inline-block px-3 py-1 bg-brand-red/10 text-brand-red text-xs font-bold uppercase tracking-widest rounded-full mb-4">
                    0{i + 1}
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-brand-black mb-3">{f.title}</h3>
                  <p className="text-brand-grey text-base leading-relaxed">{f.desc}</p>
                </AnimatedSection>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   SECTION 7: Portfolio Spotlight (Carousel / Grid)
   ================================================================ */
function PortfolioSpotlight() {
  return (
    <section className="section-padding bg-white">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="eyebrow">Portfolio</span>
          <h2 className="section-title mt-3 text-brand-black">Companies We Back</h2>
          <p className="section-subtitle mx-auto mt-4">Partnering with visionary founders building transformative businesses across India.</p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {PORTFOLIO_COMPANIES.slice(0, 6).map((company, i) => (
            <AnimatedSection key={company.name} delay={i * 100}>
              <div className="card group hover:-translate-y-2 h-full">
                <div className="w-14 h-14 bg-brand-offwhite rounded-xl flex items-center justify-center mb-5">
                  <Building2 className="w-7 h-7 text-brand-red" />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-brand-black">{company.name}</h3>
                  <span className="text-[11px] bg-brand-red/10 text-brand-red px-2.5 py-1 rounded-full font-semibold">
                    {company.stage}
                  </span>
                </div>
                <p className="text-brand-grey text-sm mb-4 leading-relaxed">{company.description}</p>
                <span className="text-xs font-semibold text-brand-grey uppercase tracking-widest">{company.sector}</span>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/portfolio" className="btn-outline-red">
            View Full Portfolio <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   SECTION 8: Latest from Blog (3 Cards)
   ================================================================ */
function BlogSection() {
  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="eyebrow">Insights</span>
          <h2 className="section-title mt-3 text-brand-black">Financial Intelligence. Delivered.</h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BLOG_POSTS.slice(0, 6).map((post, i) => {
            const themes = ['analytics', 'real-estate', 'startup', 'finance', 'compliance', 'hero', 'portfolio', 'team'] as const
            return (
              <AnimatedSection key={post.slug} delay={i * 120}>
                <Link href={`/blog#${post.slug}`} className="card group block h-full hover:-translate-y-2">
                  {/* Image placeholder */}
                  <PlaceholderImage theme={themes[i % themes.length]} aspectRatio="h-48 w-full" label={post.category} className="rounded-xl mb-5" />
                  <span className="text-xs font-bold text-brand-red uppercase tracking-widest">{post.category}</span>
                  <h3 className="text-lg font-bold text-brand-black mt-2 mb-2 group-hover:text-brand-red transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-brand-grey text-sm mb-4 leading-relaxed line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-brand-grey">
                    <span>{new Date(post.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span>{post.readTime}</span>
                  </div>
                </Link>
              </AnimatedSection>
            )
          })}
        </div>

        <div className="text-center mt-10">
          <Link href="/blog" className="btn-outline-red">
            Visit Our Blog <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   SECTION 9: Financial IQ Teaser
   ================================================================ */
function FinancialIQTeaser() {
  const pills = [
    { icon: Video, label: 'Videos' },
    { icon: FileText, label: 'Articles' },
    { icon: BookOpen, label: 'Glossary' },
  ]

  return (
    <section className="relative py-14 md:py-20 overflow-hidden">
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-red/20 rounded-full blur-[120px]" />

      <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <AnimatedSection>
          <span className="eyebrow !text-brand-red">Learn &amp; Grow</span>
          <h2 className="section-title mt-3 text-white">Build Your Financial IQ</h2>
          <p className="text-gray-400 text-base max-w-2xl mx-auto mt-3 mb-8">
            Knowledge is the ultimate edge. Explore curated content designed to sharpen your investment acumen.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {pills.map(p => (
              <span
                key={p.label}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white text-sm font-semibold hover:bg-brand-red/20 hover:border-brand-red/30 transition-all cursor-pointer"
              >
                <p.icon className="w-4 h-4 text-brand-red" />
                {p.label}
              </span>
            ))}
          </div>

          <Link href="/financial-iq" className="btn-primary">
            Explore Financial IQ <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ================================================================
   SECTION 10: Testimonials / Trust Signals
   ================================================================ */
function TestimonialsSection() {
  const testimonials = [
    {
      quote: 'The depth of diligence and the transparency of reporting gave me confidence that my capital was in the hands of genuine professionals.',
      name: 'R****** M.',
      title: 'HNI Investor, Mumbai',
    },
    {
      quote: 'What impressed us was the governance structure. Quarterly NAV updates, open communication, and a team that treats investors as true partners.',
      name: 'S****** K.',
      title: 'Family Office, Bengaluru',
    },
    {
      quote: 'GHL India Ventures brought a rare combination of deep market knowledge and ethical rigour. Their stressed-asset strategy is genuinely differentiated.',
      name: 'A****** P.',
      title: 'Institutional LP, Chennai',
    },
  ]

  return (
    <section className="section-padding bg-white">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="eyebrow">Trust</span>
          <h2 className="section-title mt-3 text-brand-black">What Our Investors Say</h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {testimonials.map((t, i) => (
            <AnimatedSection key={i} delay={i * 150}>
              <div className="card h-full flex flex-col">
                <Quote className="w-8 h-8 text-brand-red mb-4 shrink-0" />
                <p className="text-brand-grey leading-relaxed flex-1 mb-6 text-sm">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-brand-red fill-brand-red" />
                  ))}
                </div>
                <div>
                  <p className="font-bold text-brand-black text-sm">{t.name}</p>
                  <p className="text-brand-grey text-xs">{t.title}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Trust badges */}
        <AnimatedSection delay={300}>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { icon: Shield, text: 'SEBI Registered' },
              { icon: BadgeCheck, text: 'Category II Certified' },
              { icon: LockKeyhole, text: '256-bit Encryption' },
              { icon: Landmark, text: 'Custodian-Held Assets' },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-2 px-5 py-3 bg-brand-offwhite rounded-xl border border-gray-200">
                <b.icon className="w-5 h-5 text-brand-red" />
                <span className="text-brand-black text-sm font-semibold">{b.text}</span>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ================================================================
   SECTION 11: Pre-Footer Contact Form
   ================================================================ */
function ContactFormSection() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    isd: '+91',
    city: '',
    amount: '',
    message: '',
    accredited: false,
    privacy: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value
    setForm(prev => ({ ...prev, [target.name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Form submission logic
  }

  return (
    <section className="section-padding" style={{ backgroundColor: '#F8F7F5' }}>
      <div className="container-max mx-auto">
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Left: Form */}
          <div className="lg:col-span-3">
            <div className="border-l-4 border-brand-red pl-6 mb-10">
              <AnimatedSection>
                <span className="eyebrow">Get Started</span>
                <h2 className="section-title mt-3 text-brand-black">Start Your Investment Journey</h2>
                <p className="text-brand-grey text-base mt-2">
                  Request a private consultation with our investment advisory team.
                </p>
              </AnimatedSection>
            </div>

            <AnimatedSection delay={200}>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-brand-black mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      required
                      placeholder="Your full name"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-black mb-1.5">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-brand-black mb-1.5">Phone *</label>
                    <div className="flex gap-2">
                      <select
                        name="isd"
                        value={form.isd}
                        onChange={handleChange}
                        className="input-field !w-24 shrink-0"
                      >
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+971">+971</option>
                        <option value="+65">+65</option>
                      </select>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        placeholder="98765 43210"
                        className="input-field flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-black mb-1.5">City</label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Chennai"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-black mb-1.5">Investment Amount *</label>
                  <select
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    required
                    className="input-field"
                  >
                    <option value="">Select a range</option>
                    <option value="10L-1Cr">&#8377;10 Lakhs – &#8377;1 Cr (Debenture Route)</option>
                    <option value="1-5">&#8377;1 Cr – &#8377;5 Cr</option>
                    <option value="5-10">&#8377;5 Cr – &#8377;10 Cr</option>
                    <option value="10-25">&#8377;10 Cr – &#8377;25 Cr</option>
                    <option value="25+">&#8377;25 Cr+</option>
                    <option value="not-sure">Not sure yet — help me decide</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-black mb-1.5">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell us about your investment goals..."
                    className="input-field resize-none"
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="accredited"
                      checked={form.accredited}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 accent-brand-red"
                    />
                    <span className="text-sm text-brand-grey leading-relaxed">
                      I confirm that I am an accredited / qualified investor with a minimum investable surplus of &#8377;1 Crore.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="privacy"
                      checked={form.privacy}
                      onChange={handleChange}
                      required
                      className="mt-1 w-4 h-4 accent-brand-red"
                    />
                    <span className="text-sm text-brand-grey leading-relaxed">
                      I agree to the <Link href="/privacy" className="text-brand-red underline hover:no-underline">Privacy Policy</Link> and consent to being contacted by the GHL India Ventures team. *
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-white font-bold text-base rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    background: 'linear-gradient(135deg, #D0021B 0%, #8B0000 100%)',
                    boxShadow: '0 6px 30px rgba(208,2,27,0.4)',
                  }}
                >
                  Request a Consultation <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </form>
            </AnimatedSection>
          </div>

          {/* Right: Contact info card */}
          <div className="lg:col-span-2">
            <AnimatedSection delay={300} direction="right">
              <div className="card-dark sticky top-28">
                <h3 className="text-xl font-bold text-white mb-6">Get in Touch</h3>

                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-red/20 rounded-xl flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Phone</p>
                      <p className="text-white text-sm font-medium">{BRAND.phone1}</p>
                      <p className="text-white text-sm font-medium">{BRAND.phone2}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-red/20 rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Email</p>
                      <p className="text-white text-sm font-medium">{BRAND.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-red/20 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Address</p>
                      <p className="text-white text-sm font-medium leading-relaxed">{BRAND.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-red/20 rounded-xl flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Office Hours</p>
                      <p className="text-white text-sm font-medium">Mon – Sat: 10:00 AM – 6:00 PM IST</p>
                    </div>
                  </div>
                </div>

                <hr className="border-white/10 my-6" />

                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Shield className="w-4 h-4 text-brand-red" />
                  <span>SEBI Reg. No. {BRAND.sebi}</span>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   SECTION: Risk Quiz + Calculator CTA (after WhyChooseUs)
   ================================================================ */
function InvestorToolsCTA({ onOpenQuiz, onOpenCalc, onOpenAllCalc, onOpenWealthMap, onOpenTaxAnalyzer, onOpenInflationCheck }: { onOpenQuiz: () => void; onOpenCalc: () => void; onOpenAllCalc: () => void; onOpenWealthMap: () => void; onOpenTaxAnalyzer: () => void; onOpenInflationCheck: () => void }) {
  return (
    <section className="relative py-14 md:py-20 overflow-hidden">
      <div className="absolute inset-0 hero-gradient" />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(208,2,27,0.12) 0%, transparent 65%)' }}
      />

      <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection className="text-center mb-10">
          <span className="eyebrow !text-brand-red">Interactive Tools</span>
          <h2 className="section-title mt-3 text-white">Find Your Ideal Investment Route</h2>
          <p className="text-gray-400 text-base max-w-2xl mx-auto mt-3">
            Not sure where to start? Use our interactive tools to discover the investment path that matches your goals and risk appetite.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {/* Risk Quiz Card */}
          <AnimatedSection delay={100} className="flex">
            <div className="card-glass text-center p-7 hover:bg-white/10 transition-all cursor-pointer group flex flex-col w-full" onClick={onOpenQuiz}>
              <div className="w-14 h-14 rounded-2xl bg-brand-red/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-red transition-all duration-300">
                <Sparkles className="w-7 h-7 text-brand-red group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-white text-lg font-bold mb-2">Risk Assessment Quiz</h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-5">
                Answer 7 quick questions and we&apos;ll recommend the ideal investment route for your profile — Conservative, Moderate, or Aggressive.
              </p>
              <span className="inline-flex items-center justify-center gap-2 text-brand-red text-sm font-semibold group-hover:gap-3 transition-all mt-auto">
                Take the Quiz <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </AnimatedSection>

          {/* Calculator Card */}
          <AnimatedSection delay={200} className="flex">
            <div className="card-glass text-center p-7 hover:bg-white/10 transition-all cursor-pointer group flex flex-col w-full" onClick={onOpenCalc}>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500 transition-all duration-300">
                <Calculator className="w-7 h-7 text-amber-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-white text-lg font-bold mb-2">Investment Calculator</h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-5">
                Model returns across SIP, Debenture Route, and Direct AIF. Compare FDs, gold, and NIFTY 50 side by side.
              </p>
              <span className="inline-flex items-center justify-center gap-2 text-amber-500 text-sm font-semibold group-hover:gap-3 transition-all mt-auto">
                Calculate Returns <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </AnimatedSection>

          {/* NEW: All Investments & Comparison Calculator */}
          <AnimatedSection delay={300} className="flex">
            <div className="card-glass text-center p-7 hover:bg-white/10 transition-all cursor-pointer group flex flex-col w-full ring-1 ring-brand-red/20" onClick={onOpenAllCalc}>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500 transition-all duration-300">
                <Scale className="w-7 h-7 text-emerald-500 group-hover:text-white transition-colors" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <h3 className="text-white text-lg font-bold">All Investments Comparison</h3>
                <span className="px-1.5 py-0.5 bg-brand-red text-white text-[8px] font-bold uppercase rounded tracking-wider">New</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-5">
                Compare every Indian investment — FDs, PPF, Gold, NPS, Real Estate, Mutual Funds, PMS vs GHL. See tax impact, inflation-adjusted returns, and year-by-year growth.
              </p>
              <span className="inline-flex items-center justify-center gap-2 text-emerald-500 text-sm font-semibold group-hover:gap-3 transition-all mt-auto">
                Compare All Investments <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </AnimatedSection>

          {/* Wealth Goal Planner */}
          <AnimatedSection delay={400} className="flex">
            <div className="card-glass text-center p-7 hover:bg-white/10 transition-all cursor-pointer group flex flex-col w-full" onClick={onOpenWealthMap}>
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-violet-500 transition-all duration-300">
                <Target className="w-7 h-7 text-violet-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-white text-lg font-bold mb-2">Wealth Growth Map</h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-5">
                Visualize year-by-year portfolio growth. See how ₹1 Crore in GHL compounds vs traditional assets over 5, 10, or 20 years.
              </p>
              <span className="inline-flex items-center justify-center gap-2 text-violet-500 text-sm font-semibold group-hover:gap-3 transition-all mt-auto">
                Map Your Growth <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </AnimatedSection>

          {/* Tax Impact Analyzer */}
          <AnimatedSection delay={500} className="flex">
            <div className="card-glass text-center p-7 hover:bg-white/10 transition-all cursor-pointer group flex flex-col w-full" onClick={onOpenTaxAnalyzer}>
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-sky-500 transition-all duration-300">
                <IndianRupee className="w-7 h-7 text-sky-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-white text-lg font-bold mb-2">Tax Impact Analyzer</h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-5">
                Real wealth = what you keep after tax. Compare post-tax returns across all asset classes at your income slab (5%, 20%, 30%).
              </p>
              <span className="inline-flex items-center justify-center gap-2 text-sky-500 text-sm font-semibold group-hover:gap-3 transition-all mt-auto">
                Analyze Tax Impact <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </AnimatedSection>

          {/* Inflation-Proof Checker */}
          <AnimatedSection delay={600} className="flex">
            <div className="card-glass text-center p-7 hover:bg-white/10 transition-all cursor-pointer group flex flex-col w-full" onClick={onOpenInflationCheck}>
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-rose-500 transition-all duration-300">
                <TrendingUp className="w-7 h-7 text-rose-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-white text-lg font-bold mb-2">Inflation-Proof Check</h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-5">
                Is your investment beating inflation? See real purchasing power after CPI erosion. Many &ldquo;safe&rdquo; investments actually lose you money.
              </p>
              <span className="inline-flex items-center justify-center gap-2 text-rose-500 text-sm font-semibold group-hover:gap-3 transition-all mt-auto">
                Check Real Returns <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   SECTION: FAQ — SEO-Optimized Investor Questions
   ================================================================ */
function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const faqs = [
    {
      q: 'What is a Category II AIF?',
      a: 'A Category II Alternative Investment Fund (AIF) is a SEBI-regulated pooled investment vehicle that invests in real estate, private equity, distressed assets, and unlisted companies. GHL India Ventures is registered under SEBI Registration No. IN/AIF2/2425/1517, with mandatory quarterly audits and third-party custodial safeguards.',
    },
    {
      q: 'What is the minimum investment in GHL India Ventures?',
      a: 'The minimum investment for the Direct AIF Route is ₹1 Crore, as mandated by SEBI for Category II AIFs. For the Debenture Route (NCD structure), the minimum investment starts at ₹10 Lakhs — ideal for salaried professionals looking to access institutional-grade returns.',
    },
    {
      q: 'Is GHL India Ventures SEBI registered?',
      a: 'Yes. GHL India Ventures is registered with the Securities and Exchange Board of India (SEBI) as a Category II Alternative Investment Fund under Registration Number IN/AIF2/2425/1517. This ensures institutional-grade governance, transparent NAV reporting, and strict regulatory compliance.',
    },
    {
      q: 'How does stressed real estate investment work?',
      a: 'Stressed real estate investment involves acquiring distressed or undervalued properties through NCLT (National Company Law Tribunal) resolutions under the IBC (Insolvency and Bankruptcy Code) at 40-60% discounts below replacement cost. GHL India Ventures revitalizes these assets — completing construction, clearing legal encumbrances, and repositioning for sale or lease.',
    },
    {
      q: 'What is the expected IRR on the fund?',
      a: 'Specific fund performance data is available to registered investors after KYC verification. Our stressed real estate strategy is designed for significant value creation through deep-discount NCLT acquisitions. Past performance is not indicative of future results. Please contact our advisory team at +91 7200 255 252 for detailed information.',
    },
    {
      q: 'Can NRIs invest in GHL India Ventures?',
      a: 'Yes, Non-Resident Indians (NRIs) can invest through their NRO account. GHL India Ventures handles all FEMA/RBI compliance documentation. Our team has successfully onboarded NRI investors from the US, UK, UAE, Singapore, and Australia.',
    },
  ]

  return (
    <section className="py-16 md:py-24" style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.98) 0%, rgba(26,26,26,1) 100%)' }}>
      <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-12">
          <span className="eyebrow !text-brand-red">Frequently Asked Questions</span>
          <h2 className="section-title mt-3 text-white">Common Investor Questions</h2>
          <p className="text-gray-400 text-base max-w-2xl mx-auto mt-3">
            Everything you need to know about investing with GHL India Ventures, SEBI registration, and our fund structure.
          </p>
        </AnimatedSection>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, idx) => (
            <AnimatedSection key={idx} delay={idx * 80}>
              <div className="card-glass overflow-hidden">
                <button
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left group"
                >
                  <h3 className="text-white text-sm md:text-base font-semibold pr-4">{faq.q}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-brand-red shrink-0 transition-transform duration-300 ${
                      openIdx === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openIdx === idx ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="px-6 pb-5 text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={500} className="text-center mt-10">
          <Link
            href="/contact"
            className="btn-primary"
          >
            Schedule a Consultation <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ================================================================
   SECTION: Investment Disclaimer (SEBI Compliance)
   ================================================================ */
function InvestmentDisclaimer() {
  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0D0D0D' }}>
      <div className="container-max mx-auto">
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400 leading-relaxed">
            <strong className="text-amber-400">Investment Risk Disclaimer:</strong> Investments in Alternative Investment Funds (AIFs) and Non-Convertible Debentures (NCDs) are subject to market risks including possible loss of principal. Past performance is not indicative of future results. The information on this website does not constitute an offer, solicitation, or investment advice. Prospective investors must read the Private Placement Memorandum (PPM) and all scheme-related documents before investing. SEBI Registration No. IN/AIF2/2425/1517. Category II AIF minimum investment: &#8377;1 Crore as mandated by SEBI.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   HOME PAGE — All Sections + Modals
   ================================================================ */
export default function HomePage() {
  const [quizOpen, setQuizOpen] = useState(false)
  const [calcOpen, setCalcOpen] = useState(false)
  const [allCalcOpen, setAllCalcOpen] = useState(false)
  const [wealthMapOpen, setWealthMapOpen] = useState(false)
  const [taxAnalyzerOpen, setTaxAnalyzerOpen] = useState(false)
  const [inflationCheckOpen, setInflationCheckOpen] = useState(false)

  return (
    <>
      <HeroSection />
      <InvestmentDisclaimer />
      <NewsScroller />
      <WhoWeAre />
      <InvestmentCapabilities />
      <VideoFeature />
      <WhyChooseUs />
      <InvestorToolsCTA
        onOpenQuiz={() => setQuizOpen(true)}
        onOpenCalc={() => setCalcOpen(true)}
        onOpenAllCalc={() => setAllCalcOpen(true)}
        onOpenWealthMap={() => setWealthMapOpen(true)}
        onOpenTaxAnalyzer={() => setTaxAnalyzerOpen(true)}
        onOpenInflationCheck={() => setInflationCheckOpen(true)}
      />
      <PortfolioSpotlight />
      <BlogSection />
      <FinancialIQTeaser />
      <FAQSection />
      <TestimonialsSection />
      <ContactFormSection />

      {/* Modals */}
      <RiskAssessmentQuiz isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
      <InvestmentCalculator isOpen={calcOpen} onClose={() => setCalcOpen(false)} />
      <AllInvestmentsCalculator isOpen={allCalcOpen} onClose={() => setAllCalcOpen(false)} />
      <WealthGrowthMap isOpen={wealthMapOpen} onClose={() => setWealthMapOpen(false)} />
      <TaxImpactAnalyzer isOpen={taxAnalyzerOpen} onClose={() => setTaxAnalyzerOpen(false)} />
      <InflationProofChecker isOpen={inflationCheckOpen} onClose={() => setInflationCheckOpen(false)} />
    </>
  )
}
