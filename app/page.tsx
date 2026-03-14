'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import PlaceholderImage from '@/components/PlaceholderImage'
import { useIntersectionObserver, useCountUp } from '@/lib/hooks'
import { BRAND, PORTFOLIO_COMPANIES, BLOG_POSTS } from '@/lib/constants'
import {
  ArrowRight, Shield, MapPin, BadgeCheck, IndianRupee,
  TrendingUp, Target, Users, BarChart3, Eye, Scale, Leaf,
  Building2, Quote, Star, Phone, Mail, Clock,
  BookOpen, Video, FileText, ExternalLink, Play,
  Landmark, LockKeyhole, Sparkles, Calculator, ChevronDown
} from 'lucide-react'
import { submitContactForm, submitLead } from '@/lib/supabase/reportsDataService'
import MarketDataMarquee from '@/components/MarketDataMarquee'
import CurrencyTicker from '@/components/CurrencyTicker'
import RiskAssessmentQuiz from '@/components/RiskAssessmentQuiz'
import InvestmentCalculator from '@/components/InvestmentCalculator'
import AllInvestmentsCalculator from '@/components/AllInvestmentsCalculator'
import WealthGrowthMap from '@/components/WealthGrowthMap'
import TaxImpactAnalyzer from '@/components/TaxImpactAnalyzer'
import InflationProofChecker from '@/components/InflationProofChecker'
import { AlertTriangle } from 'lucide-react'
import VoiceInput from '@/components/shared/VoiceInput'
import SpaceHero from '@/components/SpaceHero'
/* ================================================================
   HELPER: VideoPlayer — HTML5 video with cinematic styling
   ================================================================ */
function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)

  const toggle = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true); setStarted(true) }
    else { v.pause(); setPlaying(false) }
  }, [])

  return (
    <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl shadow-brand-red/20">
      <video
        ref={videoRef}
        src="/videos/ghl-story.mp4"
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        preload="metadata"
        onClick={toggle}
        onEnded={() => setPlaying(false)}
      />

      {/* Cinematic vignette */}
      {!started && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)',
        }} />
      )}

      {/* Big play button — before start */}
      {!playing && (
        <div
          className="absolute inset-0 flex items-center justify-center z-30 bg-black/40 cursor-pointer group"
          onClick={toggle}
        >
          <div className="relative">
            <div className="absolute -inset-5 w-32 h-32 rounded-full bg-brand-red/15 animate-ping" style={{ animationDuration: '2.5s' }} />
            <div className="relative w-24 h-24 bg-brand-red/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-brand-red/30 group-hover:scale-110 transition-all duration-300 shadow-2xl shadow-brand-red/30 border border-brand-red/20">
              <Play className="w-10 h-10 text-brand-red ml-1" />
            </div>
          </div>
          <p className="absolute bottom-8 text-white/40 text-xs tracking-widest uppercase">
            {started ? 'Resume Playback' : 'Watch the GHL India Ventures Story'}
          </p>
        </div>
      )}
    </div>
  )
}

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
      <div className="text-3xl md:text-4xl font-extrabold text-brand-black dark:text-white mb-1 tracking-tight stat-glow">
        {prefix}{count}{suffix}
      </div>
      <div className="text-brand-grey dark:text-gray-400 text-sm font-medium uppercase tracking-widest">{label}</div>
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
  // ── Additional stars for denser sky ──
  // Extra small scattered
  { x: 1, y: 12, size: 'sm', delay: 0.4 }, { x: 4, y: 30, size: 'sm', delay: 1.6 },
  { x: 9, y: 48, size: 'sm', delay: 2.8 }, { x: 11, y: 62, size: 'sm', delay: 0.2 },
  { x: 14, y: 82, size: 'sm', delay: 1.4 }, { x: 19, y: 8, size: 'sm', delay: 2.6 },
  { x: 21, y: 45, size: 'sm', delay: 0.7 }, { x: 24, y: 68, size: 'sm', delay: 1.9 },
  { x: 29, y: 22, size: 'sm', delay: 2.3 }, { x: 31, y: 55, size: 'sm', delay: 0.5 },
  { x: 34, y: 78, size: 'sm', delay: 1.1 }, { x: 36, y: 8, size: 'sm', delay: 2.7 },
  { x: 39, y: 32, size: 'sm', delay: 0.8 }, { x: 41, y: 62, size: 'sm', delay: 1.5 },
  { x: 44, y: 15, size: 'sm', delay: 2.1 }, { x: 46, y: 85, size: 'sm', delay: 0.3 },
  { x: 49, y: 42, size: 'sm', delay: 1.8 }, { x: 51, y: 65, size: 'sm', delay: 2.4 },
  { x: 54, y: 18, size: 'sm', delay: 0.6 }, { x: 56, y: 75, size: 'sm', delay: 1.3 },
  { x: 59, y: 38, size: 'sm', delay: 2.9 }, { x: 61, y: 52, size: 'sm', delay: 0.1 },
  { x: 63, y: 12, size: 'sm', delay: 1.7 }, { x: 66, y: 82, size: 'sm', delay: 2.2 },
  { x: 69, y: 28, size: 'sm', delay: 0.9 }, { x: 71, y: 58, size: 'sm', delay: 1.0 },
  { x: 74, y: 92, size: 'sm', delay: 2.5 }, { x: 76, y: 35, size: 'sm', delay: 0.4 },
  { x: 79, y: 15, size: 'sm', delay: 1.6 }, { x: 81, y: 68, size: 'sm', delay: 2.0 },
  { x: 84, y: 42, size: 'sm', delay: 0.7 }, { x: 86, y: 8, size: 'sm', delay: 1.2 },
  { x: 89, y: 55, size: 'sm', delay: 2.8 }, { x: 91, y: 78, size: 'sm', delay: 0.5 },
  { x: 94, y: 32, size: 'sm', delay: 1.9 }, { x: 97, y: 62, size: 'sm', delay: 2.3 },
  { x: 3, y: 95, size: 'sm', delay: 0.8 }, { x: 17, y: 5, size: 'sm', delay: 1.4 },
  { x: 26, y: 38, size: 'sm', delay: 2.6 }, { x: 42, y: 58, size: 'sm', delay: 0.3 },
  // Extra medium
  { x: 6, y: 25, size: 'md', delay: 1.0 }, { x: 16, y: 52, size: 'md', delay: 2.4 },
  { x: 26, y: 75, size: 'md', delay: 0.6 }, { x: 36, y: 18, size: 'md', delay: 1.8 },
  { x: 46, y: 55, size: 'md', delay: 2.2 }, { x: 56, y: 85, size: 'md', delay: 0.4 },
  { x: 66, y: 42, size: 'md', delay: 1.6 }, { x: 76, y: 12, size: 'md', delay: 2.8 },
  { x: 86, y: 58, size: 'md', delay: 0.9 }, { x: 94, y: 72, size: 'md', delay: 1.2 },
  // Extra large bright
  { x: 14, y: 42, size: 'lg', delay: 2.1 }, { x: 44, y: 32, size: 'lg', delay: 0.5 },
  { x: 74, y: 52, size: 'lg', delay: 1.3 }, { x: 86, y: 15, size: 'lg', delay: 2.7 },
  { x: 28, y: 85, size: 'lg', delay: 0.8 }, { x: 62, y: 8, size: 'lg', delay: 1.5 },
]

/* Business TV — Bloomberg Quicktake live (default) + India Markets + News feed */
function LiveFinancialTV() {
  const [widgetLoaded, setWidgetLoaded] = useState(false)
  const [tvTab, setTvTab] = useState<'bloomberg' | 'india' | 'news'>('bloomberg')

  useEffect(() => {
    setWidgetLoaded(true)
  }, [])

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-sm">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-1 relative z-20">
        <div className="flex items-center gap-0.5 bg-white/5 rounded-full p-0.5 flex-wrap">
          <button
            onClick={() => setTvTab('bloomberg')}
            className={`px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              tvTab === 'bloomberg' ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className={`absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 ${tvTab === 'bloomberg' ? 'animate-ping' : ''}`} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
            </span>
            Bloomberg
          </button>
          <button
            onClick={() => setTvTab('india')}
            className={`px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              tvTab === 'india' ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className={`absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 ${tvTab === 'india' ? 'animate-ping' : ''}`} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            India Markets
          </button>
          <button
            onClick={() => setTvTab('news')}
            className={`px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${
              tvTab === 'news' ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Headlines
          </button>
        </div>
      </div>

      <div className="relative bg-black" style={{ height: '340px' }}>
        {/* Bloomberg Quicktake — 24/7 live via channel ID */}
        {tvTab === 'bloomberg' && widgetLoaded && (
          <iframe
            key="bloomberg-quicktake-live"
            src="https://www.youtube.com/embed/live_stream?channel=UChirEOpgFCupRAk5etXqPaA&autoplay=1&mute=1&modestbranding=1&rel=0"
            title="Bloomberg Quicktake — Live"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        )}

        {/* India Markets — Live TradingView Market Overview (SENSEX, NIFTY, Indian stocks) */}
        {tvTab === 'india' && widgetLoaded && (
          <iframe
            key="india-market-overview"
            src={`https://s.tradingview.com/embed-widget/market-overview/?locale=en#${encodeURIComponent(JSON.stringify({
              colorTheme: 'dark',
              dateRange: '1D',
              showChart: true,
              isTransparent: true,
              width: '100%',
              height: '100%',
              plotLineColorGrowing: 'rgba(233, 30, 99, 1)',
              plotLineColorFalling: 'rgba(233, 30, 99, 1)',
              gridLineColor: 'rgba(240, 243, 250, 0)',
              scaleFontColor: 'rgba(209, 212, 220, 1)',
              belowLineFillColorGrowing: 'rgba(233, 30, 99, 0.12)',
              belowLineFillColorFalling: 'rgba(233, 30, 99, 0.12)',
              belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
              belowLineFillColorFallingBottom: 'rgba(41, 98, 255, 0)',
              symbolActiveColor: 'rgba(233, 30, 99, 0.12)',
              tabs: [
                {
                  title: 'Indices',
                  symbols: [
                    { s: 'BSE:SENSEX', d: 'SENSEX' },
                    { s: 'NSE:NIFTY', d: 'NIFTY 50' },
                    { s: 'NSE:BANKNIFTY', d: 'Bank Nifty' },
                    { s: 'BSE:SMLCAP', d: 'Small Cap' },
                    { s: 'BSE:MIDCAP', d: 'Mid Cap' },
                  ],
                },
                {
                  title: 'Top Stocks',
                  symbols: [
                    { s: 'BSE:RELIANCE', d: 'Reliance' },
                    { s: 'BSE:TCS', d: 'TCS' },
                    { s: 'BSE:HDFCBANK', d: 'HDFC Bank' },
                    { s: 'BSE:INFY', d: 'Infosys' },
                    { s: 'BSE:ICICIBANK', d: 'ICICI Bank' },
                  ],
                },
              ],
            }))}`}
            title="India Markets — Live Overview"
            className="w-full h-full border-0"
            loading="lazy"
          />
        )}

        {/* Business News Feed — TradingView Timeline */}
        {tvTab === 'news' && widgetLoaded && (
          <iframe
            key="tradingview-timeline"
            src={`https://s.tradingview.com/embed-widget/timeline/?locale=en#${encodeURIComponent(JSON.stringify({
              feedMode: 'market',
              market: 'stock',
              colorTheme: 'dark',
              isTransparent: true,
              displayMode: 'regular',
              width: '100%',
              height: '100%',
            }))}`}
            title="Business News — TradingView"
            className="w-full h-full border-0"
            loading="lazy"
          />
        )}
      </div>
    </div>
  )
}

function HeroSection() {

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: 'linear-gradient(180deg, #020012 0%, #060020 20%, #08001a 40%, #0a0014 60%, #0c0a10 80%, #0a0a0a 100%)' }}>

      <SpaceHero variant="aurora" />

      {/* ---- CINEMATIC SPACE BACKGROUND ---- */}

      {/* Deep space subtle nebula patches */}
      <div className="nebula-patch" style={{ top: '8%', left: '10%', width: '300px', height: '300px', background: 'rgba(60, 20, 120, 0.05)' }} />
      <div className="nebula-patch" style={{ top: '25%', right: '5%', width: '250px', height: '250px', background: 'rgba(30, 40, 120, 0.04)', animationDelay: '-7s' }} />

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

      {/* ISS orbiting across the sky */}
      <div className="space-station">
        <div className="space-station-body" />
      </div>

      {/* Airplane 1 — cruising through moonlit clouds near horizon */}
      <div className="airplane">
        <div className="airplane-body">
          <span className="airplane-light airplane-light-red" />
          <span className="airplane-light airplane-light-white" />
          <span className="airplane-light airplane-light-green" />
        </div>
      </div>

      {/* Airplane 2 — second plane going opposite direction, higher */}
      <div className="airplane-2">
        <div className="airplane-body">
          <span className="airplane-light airplane-light-red" />
          <span className="airplane-light airplane-light-white" />
          <span className="airplane-light airplane-light-green" />
        </div>
      </div>

      {/* Airplane 3 — higher altitude, smaller */}
      <div className="airplane-3">
        <div className="airplane-body">
          <span className="airplane-light airplane-light-red" />
          <span className="airplane-light airplane-light-white" />
          <span className="airplane-light airplane-light-green" />
        </div>
      </div>

      {/* Airplane 4 — low near horizon, slow */}
      <div className="airplane-4">
        <div className="airplane-body">
          <span className="airplane-light airplane-light-red" />
          <span className="airplane-light airplane-light-white" />
          <span className="airplane-light airplane-light-green" />
        </div>
      </div>

      {/* Earth arc — night side with city light glow */}
      <div className="space-arc" />
      <div className="space-arc-inner" />

      {/* Earth surface — faint city lights visible on the night side */}
      <div className="earth-city-lights" />

      {/* Horizon glow — the thin atmosphere line */}
      <div className="space-horizon" />

      {/* Subtle grain overlay */}
      <div className="absolute inset-0 grain-overlay pointer-events-none" />

      {/* Subtle brand radial */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 25% 50%, rgba(208, 2, 27, 0.06) 0%, transparent 60%)' }} />

      {/* ---- END SPACE BACKGROUND ---- */}

      <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-28 pb-14">
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
                SEBI Registered <span className="text-gradient-shimmer">Alternative Investment Fund</span> — Where Bold Capital Meets Intelligence
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <p className="text-base text-gray-300 mb-8 max-w-xl leading-relaxed" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
                GHL India Ventures delivers institutional-grade alternative investments for India&apos;s discerning investors. As per SEBI AIF Regulations.
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
                  { icon: IndianRupee, text: 'Managed by Trustee' },
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

            {/* Market Hotlists — Top Gainers, Losers, Most Active (compact + scrollable) */}
            <AnimatedSection delay={600} direction="right">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-sm">
                <div className="overflow-y-auto scrollbar-hide" style={{ height: '200px' }}>
                  <iframe
                    key="hotlists-widget"
                    src={`https://s.tradingview.com/embed-widget/hotlists/?locale=en#${encodeURIComponent(JSON.stringify({
                      colorTheme: 'dark',
                      dateRange: '12M',
                      exchange: 'BSE',
                      showChart: false,
                      showSymbolLogo: true,
                      width: '100%',
                      height: '100%',
                      isTransparent: true,
                      plotLineColorGrowing: 'rgba(0,200,100,1)',
                      plotLineColorFalling: 'rgba(255,23,68,1)',
                      gridLineColor: 'rgba(255,255,255,0.06)',
                      scaleFontColor: 'rgba(255,255,255,0.5)',
                      belowLineFillColorGrowing: 'rgba(0,200,100,0.05)',
                      belowLineFillColorFalling: 'rgba(255,23,68,0.05)',
                      belowLineFillColorGrowingBottom: 'rgba(0,0,0,0)',
                      belowLineFillColorFallingBottom: 'rgba(0,0,0,0)',
                      symbolActiveColor: 'rgba(208,2,27,0.15)',
                    }))}`}
                    title="Market Hotlists — Top Movers"
                    className="w-full border-0"
                    style={{ height: '460px' }}
                    loading="lazy"
                  />
                </div>
                {/* Live badge */}
                <div className="absolute top-2 right-3 z-10 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-green-400 text-[9px] font-semibold uppercase tracking-wider">Live</span>
                </div>
                {/* Scroll hint gradient at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
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
    <section className="relative py-2.5" style={{ backgroundColor: '#0D0D0D', borderTop: '1px solid rgba(208,2,27,0.15)', borderBottom: '1px solid rgba(208,2,27,0.15)' }}>
      <div className="container-max mx-auto overflow-hidden">
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
      </div>
    </section>
  )
}

/* ================================================================
   SECTION 2: Ticker / Stats Strip
   ================================================================ */
function TickerStrip() {
  const text = `SEBI Registration No. ${BRAND.sebi}  \u2022  Category II AIF  \u2022  As per SEBI AIF Regulations  \u2022  Stressed Real Estate & Early-Stage Startups  \u2022  Chennai, India  \u2022  ${BRAND.email}`

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
            <div className="relative aspect-[4/3] bg-gray-900 overflow-hidden card-img-zoom group/img rounded-3xl">
              <img src="/images/home/team-professionals.jpg" alt="GHL India Ventures Team" className="w-full h-full object-cover transition-transform duration-500" loading="lazy" />
            </div>
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
              <CountUpStat end={100} suffix="+" label="Years of Man Experience" />
              <CountUpStat end={300} prefix="₹" suffix=" Cr+" label="Value Created" />
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
              <div className="card h-full group hover-lift hover:border-brand-red/20 border border-transparent">
                <div className="w-14 h-14 bg-brand-red/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-brand-red transition-all duration-300 icon-ring-hover">
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
      <div className="absolute inset-0 hero-gradient pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(208,2,27,0.15) 0%, transparent 65%)' }} />

      <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection className="text-center mb-10">
          <span className="eyebrow !text-brand-red">From Our Chairman</span>
          <h2 className="section-title mt-3 text-white">The GHL India Ventures Story</h2>
          <p className="text-gray-400 text-sm mt-3 max-w-lg mx-auto">
            Experience our cinematic overview of India&apos;s alternative investment frontier.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <div className="relative max-w-5xl mx-auto">
            <VideoPlayer />
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
      img: '/images/home/sebi-regulated.jpg',
    },
    {
      title: 'Diversified Portfolio',
      desc: 'We balance high-conviction plays in stressed real estate recovery with early-stage startup exposure, offering built-in diversification across asset types, geographies, and time horizons.',
      icon: BarChart3,
      img: '/images/home/diversified-portfolio.jpg',
    },
    {
      title: 'Expert-Led Strategy',
      desc: 'Our investment committee brings 25+ years of experience spanning private equity, structured finance, and entrepreneurial growth. Every decision is backed by rigorous analysis.',
      icon: Target,
      img: '/images/home/expert-strategy.jpg',
    },
    {
      title: 'Investor-First Approach',
      desc: 'Quarterly NAV reporting, transparent fee structures, dedicated relationship managers, and a governance framework that places investor interests at the absolute centre of every decision.',
      icon: Users,
      img: '/images/home/investor-first.jpg',
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
                  <div className="relative aspect-[4/3] bg-gray-900 overflow-hidden card-img-zoom group/img rounded-3xl">
                    <img src={f.img} alt={f.title} className="w-full h-full object-cover transition-transform duration-500" loading="lazy" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 translate-y-1 opacity-90 group-hover/img:translate-y-0 group-hover/img:opacity-100 transition-all duration-300">
                      <p className="text-white/90 text-xs font-medium">{f.title}</p>
                    </div>
                  </div>
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
              <div className="card group hover-lift h-full">
                <div className="w-14 h-14 bg-brand-offwhite rounded-xl flex items-center justify-center mb-5 icon-ring-hover">
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
            const themes = ['analytics', 'real-estate', 'startup', 'finance', 'compliance', 'fund', 'portfolio', 'team'] as const
            return (
              <AnimatedSection key={post.slug} delay={i * 120}>
                <Link href={`/blog#${post.slug}`} className="card group block h-full hover-lift">
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
      <div className="absolute inset-0 hero-gradient pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-red/20 rounded-full blur-[120px] pointer-events-none" />

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
              <div className="card h-full flex flex-col quote-card">
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
              <div key={b.text} className="flex items-center gap-2 px-5 py-3 bg-brand-offwhite rounded-xl border border-gray-200 trust-badge badge-bounce">
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
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value
    setForm(prev => ({ ...prev, [target.name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      await Promise.all([
        submitContactForm({
          formType: 'homepage_consultation',
          fullName: form.fullName,
          email: form.email,
          phone: `${form.isd} ${form.phone}`,
          city: form.city,
          message: form.message,
          investmentRange: form.amount,
          investmentInterest: 'consultation',
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
        submitLead({
          firstName: form.fullName.split(' ')[0] || '',
          lastName: form.fullName.split(' ').slice(1).join(' ') || '',
          email: form.email,
          phone: `${form.isd} ${form.phone}`,
          city: form.city,
          source: 'website',
          investmentInterest: 'consultation',
        }),
      ])
      setSubmitted(true)
    } catch (err) {
      console.warn('Home form submission failed (non-critical):', err)
      setFormError('Something went wrong. Please try again or call us directly.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-padding bg-brand-offwhite dark:!bg-[#111111]">
      <div className="container-max mx-auto">
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Left: Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <AnimatedSection>
                <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <BadgeCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-brand-black mb-3">Thank You!</h3>
                  <p className="text-brand-grey text-base mb-2">
                    Your consultation request has been received. Our investment advisory team will reach out within <strong>24-48 hours</strong>.
                  </p>
                  <p className="text-brand-grey text-sm mb-6">
                    For immediate assistance, call us at <a href={`tel:${BRAND.phone2}`} className="text-brand-red font-semibold hover:underline">{BRAND.phone2}</a>
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setForm({ fullName: '', email: '', phone: '', isd: '+91', city: '', amount: '', message: '', accredited: false, privacy: false })
                    }}
                    className="text-sm text-brand-red font-semibold hover:underline"
                  >
                    Submit another inquiry
                  </button>
                </div>
              </AnimatedSection>
            ) : (
            <>
            <div className="border-l-4 border-brand-red pl-6 mb-10">
              <AnimatedSection>
                <span className="eyebrow">Get Started</span>
                <h2 className="section-title mt-3 text-brand-black dark:text-white">Start Your Investment Journey</h2>
                <p className="text-brand-grey text-base mt-2">
                  Request a private consultation with our investment advisory team.
                </p>
              </AnimatedSection>
            </div>

            <AnimatedSection delay={200}>
              <form onSubmit={handleSubmit} className="space-y-5">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-brand-black dark:text-white mb-1.5">Full Name *</label>
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
                    <label className="block text-sm font-semibold text-brand-black dark:text-white mb-1.5">Email *</label>
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
                    <label className="block text-sm font-semibold text-brand-black dark:text-white mb-1.5">Phone *</label>
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
                        pattern="[0-9]{10}"
                        title="Enter a 10-digit phone number"
                        placeholder="98765 43210"
                        className="input-field flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-black dark:text-white mb-1.5">City</label>
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
                  <label className="block text-sm font-semibold text-brand-black dark:text-white mb-1.5">Investment Amount *</label>
                  <select
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    required
                    className="input-field"
                  >
                    <option value="">Select a range</option>
                    <option value="10L-1Cr">Contact for Co-Invest Details</option>
                    <option value="1-5">&#8377;1 Cr – &#8377;5 Cr</option>
                    <option value="5-10">&#8377;5 Cr – &#8377;10 Cr</option>
                    <option value="10-25">&#8377;10 Cr – &#8377;25 Cr</option>
                    <option value="25+">&#8377;25 Cr+</option>
                    <option value="not-sure">Not sure yet — help me decide</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-brand-black dark:text-white">Message</label>
                    <VoiceInput
                      compact
                      onTranscript={(text) => setForm(prev => ({ ...prev, message: (prev.message ? prev.message + ' ' : '') + text }))}
                      showLanguageSelector
                    />
                  </div>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell us about your investment goals... (or use voice input)"
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
                      I confirm that I am an accredited / qualified investor as per SEBI AIF Regulations.
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
                      I agree to the <Link href="/disclaimer" className="text-brand-red underline hover:no-underline">Privacy Policy</Link> and consent to being contacted by the GHL India Ventures team. *
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-white font-bold text-base rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    background: 'linear-gradient(135deg, #D0021B 0%, #8B0000 100%)',
                    boxShadow: '0 6px 30px rgba(208,2,27,0.4)',
                  }}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                      Submitting…
                    </>
                  ) : (
                    <>Request a Consultation <ArrowRight className="ml-2 w-5 h-5" /></>
                  )}
                </button>
              </form>
            </AnimatedSection>
            </>
            )}
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
                  <a href={BRAND.sebiUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-red transition-colors">SEBI Reg. No. {BRAND.sebi}</a>
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
      <div className="absolute inset-0 hero-gradient pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
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
                Model returns across SIP, SEBI Co-Invest Framework, and Direct AIF. Compare FDs, gold, and NIFTY 50 side by side.
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
                Visualize year-by-year portfolio growth. See how your investment in GHL compounds vs traditional assets over 5, 10, or 20 years.
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
      a: 'The minimum investment for the Direct AIF Route is as per SEBI regulations for Category II AIFs. For the SEBI Co-Invest Framework, please contact our advisory team for current eligibility and investment details — ideal for salaried professionals looking to access institutional-grade returns.',
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
            <strong className="text-amber-400">Investment Risk Disclaimer:</strong> Investments in Alternative Investment Funds (AIFs) and related co-invest instruments are subject to market risks including possible loss of principal. Past performance is not indicative of future results. The information on this website does not constitute an offer, solicitation, or investment advice. Prospective investors must read the Private Placement Memorandum (PPM) and all scheme-related documents before investing. SEBI Registration No. IN/AIF2/2425/1517. Category II AIF minimum investment as per SEBI regulations.
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

      {/* ── Market Data Marquees — moved from Navbar to right above News ── */}
      <MarketDataMarquee />
      <CurrencyTicker />
      <div className="w-full" style={{ backgroundColor: '#1a0000' }}>
        <div className="container-max mx-auto overflow-hidden">
          <div className="animate-marquee whitespace-nowrap py-1.5">
            <span className="inline-block text-white/80 mx-8" style={{ fontSize: '11px', letterSpacing: '0.02em' }}>
              SEBI Registered AIF &nbsp;|&nbsp; Registration No. <a href={BRAND.sebiUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-red transition-colors">IN/AIF2/2425/1517</a>
              &nbsp;|&nbsp; AIF: As per SEBI Regulations &nbsp;|&nbsp; SEBI Co-Invest Framework &nbsp;|&nbsp;
              Stressed Real Estate &amp; Early-Stage Startups &nbsp;|&nbsp;
              Chennai, India
            </span>
            <span className="inline-block text-white/80 mx-8" style={{ fontSize: '11px', letterSpacing: '0.02em' }}>
              SEBI Registered AIF &nbsp;|&nbsp; Registration No. <a href={BRAND.sebiUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-red transition-colors">IN/AIF2/2425/1517</a>
              &nbsp;|&nbsp; AIF: As per SEBI Regulations &nbsp;|&nbsp; SEBI Co-Invest Framework &nbsp;|&nbsp;
              Stressed Real Estate &amp; Early-Stage Startups &nbsp;|&nbsp;
              Chennai, India
            </span>
          </div>
        </div>
      </div>

      <NewsScroller />
      <WhoWeAre />
      <hr className="section-divider-animated" />
      <InvestmentCapabilities />
      <VideoFeature />
      <hr className="section-divider-animated" />
      <WhyChooseUs />
      <InvestorToolsCTA
        onOpenQuiz={() => setQuizOpen(true)}
        onOpenCalc={() => setCalcOpen(true)}
        onOpenAllCalc={() => setAllCalcOpen(true)}
        onOpenWealthMap={() => setWealthMapOpen(true)}
        onOpenTaxAnalyzer={() => setTaxAnalyzerOpen(true)}
        onOpenInflationCheck={() => setInflationCheckOpen(true)}
      />
      <hr className="section-divider-animated" />
      <PortfolioSpotlight />
      <hr className="section-divider-animated" />
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
