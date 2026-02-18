'use client'

import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import PlaceholderImage from '@/components/PlaceholderImage'
import { BRAND, FUND_ARTICLES } from '@/lib/constants'
import {
  ArrowRight, Shield, TrendingUp, Target, BarChart3, Clock,
  FileText, CheckCircle, DollarSign, Users, Briefcase, PieChart,
  AlertTriangle, BookOpen, Play, Home, ChevronRight,
  Search, ClipboardCheck, Gavel, Rocket, Eye,
  Building2, Sparkles, Layers, ShieldCheck, BarChart2
} from 'lucide-react'
import SpaceHero from '@/components/SpaceHero'

/* ───────────────────────────── 1. HERO ───────────────────────────── */
function FundHero() {
  return (
    <section className="relative min-h-[80vh] flex items-center gradient-dark overflow-hidden">
      {/* Space: Nebula theme */}
      <SpaceHero variant="nebula" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-brand-red rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-brand-red rounded-full blur-3xl" />
      </div>

      <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-40 pb-32">
        <AnimatedSection>
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-8">
            <Link href="/" className="hover:text-white transition-colors flex items-center">
              <Home className="w-3.5 h-3.5 mr-1" /> Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-brand-red font-medium">Fund</span>
          </nav>

          <div className="inline-flex items-center px-4 py-2 bg-brand-red/10 border border-brand-red/20 rounded-full mb-6">
            <Shield className="w-4 h-4 text-brand-red mr-2" />
            <span className="text-brand-red text-sm font-medium">SEBI Reg: {BRAND.sebi}</span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-2 mb-5 leading-tight">
            Institutional Access.<br />
            <span className="text-gradient">HNI Returns.</span>
          </h1>
          <p className="text-base text-gray-300 max-w-3xl leading-relaxed">
            A Category II Alternative Investment Fund designed to deliver superior risk-adjusted returns
            through stressed real estate resolution and early-stage startup investments across India.
          </p>
        </AnimatedSection>

        {/* Two video placeholders */}
        <AnimatedSection delay={200}>
          <div className="grid md:grid-cols-2 gap-6 mt-10 max-w-4xl">
            {[
              { label: 'Fund Strategy Overview', theme: 'fund' },
              { label: 'Real Estate Portfolio Deep Dive', theme: 'real-estate' },
            ].map((item) => (
              <div key={item.label} className="relative group cursor-pointer">
                <PlaceholderImage theme={item.theme} aspectRatio="aspect-video" label={item.label} className="rounded-2xl border border-white/10" />
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-16 h-16 bg-brand-red/20 rounded-full flex items-center justify-center group-hover:bg-brand-red/30 transition-all">
                    <Play className="w-6 h-6 text-brand-red" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ───────────────────────────── 2. FUND OVERVIEW ───────────────────────────── */
function FundOverview() {
  const metrics = [
    { icon: FileText, label: 'Fund Type', value: 'Category II AIF' },
    { icon: Shield, label: 'SEBI Registration', value: BRAND.sebi },
    { icon: DollarSign, label: 'Invest From', value: '₹10 Lakhs' },
    { icon: Clock, label: 'Investment Horizon', value: '5-7 Years' },
    { icon: TrendingUp, label: 'Target IRR', value: '18-22%' },
    { icon: Target, label: 'Fund Size Target', value: '₹500 Crore' },
  ]

  return (
    <section className="section-padding bg-white">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Overview</span>
          <h2 className="section-title mt-2 text-brand-black">Fund at a Glance</h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {metrics.map((item, i) => (
            <AnimatedSection key={item.label} delay={i * 80}>
              <div className="card text-center h-full group hover:-translate-y-1">
                <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-red transition-all">
                  <item.icon className="w-6 h-6 text-brand-red group-hover:text-white transition-colors" />
                </div>
                <p className="text-brand-grey text-xs uppercase tracking-wider mb-1">{item.label}</p>
                <p className="font-bold text-brand-black text-lg">{item.value}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 2B. INVESTMENT ROUTES — TWO PATHS ───────────────────────────── */
function InvestmentRoutes() {
  const routes = [
    {
      badge: 'Direct AIF',
      title: 'Direct AIF Route',
      subtitle: 'Best for HNIs & Family Offices',
      minInvestment: '₹1 Crore',
      features: [
        'Direct ownership in premium ventures',
        'Target returns: 15–25% IRR',
        'Full transparency & reporting',
        'SEBI Category II AIF structure',
      ],
      href: '/fund/direct-aif',
      gradient: 'from-brand-red to-[#a00216]',
      iconBg: 'bg-brand-red/10',
    },
    {
      badge: 'Debenture',
      title: 'Debenture Route',
      subtitle: 'Best for Salaried Professionals',
      minInvestment: '₹10 Lakhs',
      features: [
        'Flexible investment options',
        'Steady alternative income stream',
        'Ideal for families seeking sustenance',
        'Structured returns framework',
      ],
      href: '/fund/debenture-route',
      gradient: 'from-[#1a1a2e] to-brand-black',
      iconBg: 'bg-white/10',
    },
  ]

  return (
    <section className="section-padding bg-brand-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-red/5 rounded-full blur-3xl" />
      </div>
      <div className="container-max mx-auto relative z-10">
        <AnimatedSection className="text-center mb-10">
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Choose Your Path</span>
          <h2 className="section-title mt-2 text-white">Two Investment Routes</h2>
          <p className="section-subtitle mx-auto mt-3 text-gray-400">
            Whether you&apos;re an HNI investor or a salaried professional, we have a route designed for you.
          </p>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {routes.map((route, i) => (
            <AnimatedSection key={route.title} delay={i * 150} direction={i === 0 ? 'left' : 'right'}>
              <div className="relative group h-full">
                {/* Card */}
                <div className="relative bg-white rounded-2xl p-8 h-full flex flex-col overflow-hidden border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* Top badge */}
                  <div className="flex items-center justify-between mb-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      i === 0 ? 'bg-brand-red/10 text-brand-red' : 'bg-brand-black/10 text-brand-black'
                    }`}>
                      {route.badge}
                    </span>
                    <span className="text-xs text-brand-grey">Min. Investment</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-brand-black mb-1">{route.title}</h3>
                  <p className="text-sm text-brand-grey mb-4">{route.subtitle}</p>

                  {/* Min Investment — prominent */}
                  <div className={`text-3xl font-extrabold mb-6 bg-gradient-to-r ${route.gradient} bg-clip-text text-transparent`}>
                    {route.minInvestment}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {route.features.map((feature) => (
                      <li key={feature} className="flex items-start text-sm text-brand-black/80">
                        <CheckCircle className="w-4 h-4 text-brand-red mr-2.5 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={route.href}
                    className={`inline-flex items-center justify-center w-full py-3 text-sm font-bold rounded-lg transition-all duration-300 ${
                      i === 0
                        ? 'bg-brand-red text-white hover:bg-red-700'
                        : 'bg-brand-black text-white hover:bg-gray-800'
                    }`}
                  >
                    View Details <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 3. INVESTMENT STRATEGY — TWO PILLARS ───────────────────────────── */
function InvestmentStrategy() {
  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Strategy</span>
          <h2 className="section-title mt-2 text-brand-black">Two Investment Pillars</h2>
          <p className="section-subtitle mx-auto mt-4">
            Our dual-vertical approach captures value across India&apos;s most compelling alternative asset classes.
          </p>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Pillar 1: Stressed Real Estate */}
          <AnimatedSection direction="left">
            <div className="card h-full">
              {/* Image placeholder */}
              <PlaceholderImage theme="real-estate" aspectRatio="aspect-[16/9]" label="Stressed Real Estate Portfolio" className="rounded-xl mb-6" />
              <div className="inline-flex items-center px-3 py-1 bg-brand-red/10 rounded-full mb-4">
                <Building2 className="w-3.5 h-3.5 text-brand-red mr-1.5" />
                <span className="text-brand-red text-xs font-semibold uppercase tracking-wider">Pillar 1</span>
              </div>
              <h3 className="text-xl font-bold text-brand-black mb-3">Stressed Real Estate</h3>
              <p className="text-brand-grey leading-relaxed mb-6">
                India&apos;s stressed real estate market represents a multi-trillion-rupee opportunity.
                We acquire distressed properties and incomplete projects at significant discounts, then apply
                resolution, restructuring, and revival strategies to unlock trapped value. Our team&apos;s deep
                expertise in RERA compliance, NCLT processes, and construction management enables us to
                transform stalled assets into performing investments.
              </p>
              <div className="space-y-3">
                {[
                  'Distressed property acquisition at deep discounts',
                  'NCLT and IBC resolution expertise',
                  'RERA-compliant project completion',
                  'JV and JDA structuring with landowners',
                  'Focus on South India metros with expansion pan-India',
                ].map((item) => (
                  <div key={item} className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
                    <span className="text-brand-black text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Pillar 2: Early-Stage Startups */}
          <AnimatedSection direction="right">
            <div className="card h-full">
              {/* Image placeholder */}
              <PlaceholderImage theme="startup" aspectRatio="aspect-[16/9]" label="Startup Portfolio Companies" className="rounded-xl mb-6" />
              <div className="inline-flex items-center px-3 py-1 bg-brand-red/10 rounded-full mb-4">
                <Sparkles className="w-3.5 h-3.5 text-brand-red mr-1.5" />
                <span className="text-brand-red text-xs font-semibold uppercase tracking-wider">Pillar 2</span>
              </div>
              <h3 className="text-xl font-bold text-brand-black mb-3">Early-Stage Startups</h3>
              <p className="text-brand-grey leading-relaxed mb-6">
                India&apos;s startup ecosystem is the third largest globally, producing world-class founders
                across technology, healthcare, fintech, and climate. We invest in pre-Series A and Series A
                companies with strong unit economics, scalable business models, and founders with domain
                expertise. Beyond capital, we provide strategic mentorship, network access, and governance support.
              </p>
              <div className="space-y-3">
                {[
                  'Proprietary deal flow through 100+ founder network',
                  'Rigorous 6-stage due diligence process',
                  'Sector focus: SaaS, HealthTech, FinTech, CleanTech',
                  'Active board participation and mentorship',
                  'Co-investment opportunities for strategic LPs',
                ].map((item) => (
                  <div key={item} className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
                    <span className="text-brand-black text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 4. FUND STRUCTURE DIAGRAM ───────────────────────────── */
function FundStructure() {
  return (
    <section className="section-padding bg-white">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Structure</span>
          <h2 className="section-title mt-2 text-brand-black">Fund Structure</h2>
        </AnimatedSection>

        <AnimatedSection>
          <div className="max-w-4xl mx-auto">
            {/* Structure diagram placeholder */}
            <div className="relative bg-brand-offwhite border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center">
              <Layers className="w-16 h-16 text-brand-red mx-auto mb-6" />
              <p className="text-gray-500 text-sm mb-8">[DIAGRAM: AIF Fund Structure]</p>

              {/* Simplified text-based structure */}
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-brand-black mb-2 text-sm">Investors (LPs)</h4>
                  <p className="text-brand-grey text-xs">HNIs, Family Offices, Institutional Investors contribute capital to the Fund.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-brand-red/20">
                  <h4 className="font-bold text-brand-red mb-2 text-sm">GHL India Ventures AIF</h4>
                  <p className="text-brand-grey text-xs">Category II AIF registered with SEBI. Managed by GHL India Ventures as Investment Manager.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-brand-black mb-2 text-sm">Portfolio Assets</h4>
                  <p className="text-brand-grey text-xs">Stressed Real Estate Projects + Early-Stage Startup Equity positions.</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-4">
                {['Independent Custodian', 'SEBI-empanelled Auditor', 'Legal Counsel', 'Fund Administrator'].map((role) => (
                  <span key={role} className="px-3 py-1.5 bg-white rounded-full text-xs font-medium text-brand-grey border border-gray-200">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ───────────────────────────── 5. RISK FRAMEWORK ───────────────────────────── */
function RiskFramework() {
  const protocols = [
    {
      icon: ShieldCheck,
      title: 'Portfolio Diversification',
      desc: 'No single investment exceeds 15% of fund corpus. Balanced allocation across real estate and startups to manage concentration risk.',
    },
    {
      icon: Eye,
      title: 'Continuous Monitoring',
      desc: 'Real-time dashboards for real estate project milestones and startup KPIs. Monthly IC reviews on all portfolio positions.',
    },
    {
      icon: ClipboardCheck,
      title: 'Multi-Stage Due Diligence',
      desc: 'Six-stage diligence covering commercial, financial, legal, regulatory, technical, and ESG dimensions before any capital deployment.',
    },
    {
      icon: Gavel,
      title: 'Legal & Regulatory Safeguards',
      desc: 'Comprehensive legal structuring, RERA compliance checks for real estate, and SHA/SSA protections for startup investments.',
    },
    {
      icon: BarChart2,
      title: 'Valuation Discipline',
      desc: 'Independent third-party valuations. Conservative NAV marking. Quarterly reporting with full transparency to investors.',
    },
  ]

  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Risk Management</span>
          <h2 className="section-title mt-2 text-brand-black">Risk Framework</h2>
          <p className="section-subtitle mx-auto mt-4">
            Five institutional-grade protocols that protect capital at every stage of the investment lifecycle.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {protocols.map((p, i) => (
            <AnimatedSection key={p.title} delay={i * 100}>
              <div className="card h-full group hover:-translate-y-1">
                <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-red transition-all">
                  <p.icon className="w-6 h-6 text-brand-red group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-brand-black mb-2">{p.title}</h3>
                <p className="text-brand-grey text-sm leading-relaxed">{p.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 6. INVESTMENT PROCESS — 5 STEP TIMELINE ───────────────────────────── */
function InvestmentProcess() {
  const steps = [
    { step: '01', icon: Search, title: 'Deal Sourcing', desc: 'Proprietary deal flow through our network of 100+ founders, developers, brokers, NCLT professionals, and sector experts across India.' },
    { step: '02', icon: ClipboardCheck, title: 'Due Diligence', desc: 'Rigorous commercial, financial, legal, technical, and ESG analysis. Site visits for real estate; deep founder and market diligence for startups.' },
    { step: '03', icon: Gavel, title: 'IC Approval', desc: 'Formal Investment Committee review with independent advisor input. Unanimous approval required for capital deployment.' },
    { step: '04', icon: Rocket, title: 'Execution', desc: 'Structured deal closing with comprehensive legal documentation. Board seats for startups; project management oversight for real estate.' },
    { step: '05', icon: Eye, title: 'Monitoring & Exit', desc: 'Active value creation with quarterly performance reviews. Strategic exit planning to maximise investor returns within the fund horizon.' },
  ]

  return (
    <section className="section-padding bg-white">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Process</span>
          <h2 className="section-title mt-2 text-brand-black">Investment Process</h2>
        </AnimatedSection>

        <div className="max-w-4xl mx-auto">
          {/* Horizontal connector line (desktop) */}
          <div className="hidden lg:block relative mb-12">
            <div className="absolute top-6 left-[10%] right-[10%] h-0.5 bg-gray-200" />
            <div className="flex justify-between relative">
              {steps.map((s, i) => (
                <div key={s.step} className="flex flex-col items-center w-1/5">
                  <div className="w-12 h-12 bg-brand-red rounded-full flex items-center justify-center z-10 shadow-lg shadow-brand-red/20">
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-brand-red font-bold text-xs mt-2">{s.step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div className="grid lg:grid-cols-5 gap-4">
            {steps.map((s, i) => (
              <AnimatedSection key={s.step} delay={i * 100}>
                <div className="card text-center h-full">
                  {/* Mobile icon */}
                  <div className="lg:hidden w-10 h-10 bg-brand-red rounded-full flex items-center justify-center mx-auto mb-3">
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-brand-black text-sm mb-2">{s.title}</h4>
                  <p className="text-brand-grey text-xs leading-relaxed">{s.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 7. RETURNS & PERFORMANCE ───────────────────────────── */
function ReturnsPerformance() {
  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Performance</span>
          <h2 className="section-title mt-2 text-brand-black">Returns & Performance</h2>
        </AnimatedSection>

        <AnimatedSection>
          <div className="max-w-4xl mx-auto">
            {/* Chart placeholder */}
            <div className="relative mb-8">
              <PlaceholderImage theme="analytics" aspectRatio="aspect-[16/7]" label="Fund Performance vs Benchmark — Updated Quarterly" className="rounded-2xl" />
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <p className="text-white/50 text-xs text-center px-4">Performance data will be displayed here once the fund completes its first reporting period.</p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-brand-red">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
                <div className="text-xs text-brand-grey leading-relaxed space-y-2">
                  <p>
                    <strong className="text-brand-black">Important Disclosures:</strong> Investments in AIFs are subject to market risks.
                    Past performance is not indicative of future results. The value of investments may go down as well as up.
                    Investors may not receive the full amount invested.
                  </p>
                  <p>
                    AIF investments are illiquid. There is no secondary market for these units.
                    Target IRR of 18-22% is an estimate and not a commitment or guarantee.
                    Please read the Private Placement Memorandum carefully before investing.
                  </p>
                  <p>
                    This website does not constitute an offer or solicitation of an offer to purchase units of the Fund.
                    Investment in the Fund is subject to the terms and conditions of the PPM and Contribution Agreement.
                    SEBI Registration: {BRAND.sebi}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ───────────────────────────── 8. FUND ARTICLES ───────────────────────────── */
function FundArticles() {
  return (
    <section className="section-padding bg-white">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Resources</span>
          <h2 className="section-title mt-2 text-brand-black">Fund Insights</h2>
          <p className="section-subtitle mx-auto mt-4">
            Educational articles and analysis to help you make informed investment decisions.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {FUND_ARTICLES.slice(0, 10).map((article, i) => (
            <AnimatedSection key={article.slug} delay={i * 60}>
              <Link href={`/fund/${article.slug}`} className="card block group h-full hover:-translate-y-1">
                {/* Image placeholder */}
                <PlaceholderImage
                  theme={article.category.toLowerCase().includes('real estate') ? 'real-estate' : article.category.toLowerCase().includes('startup') || article.category.toLowerCase().includes('fintech') ? 'startup' : article.category.toLowerCase().includes('regulation') ? 'compliance' : 'education'}
                  aspectRatio="aspect-[16/10]"
                  label={article.category}
                  className="rounded-lg mb-4"
                />

                {/* Category tag */}
                <div className="flex items-center space-x-2 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 bg-brand-red/10 rounded text-brand-red text-[10px] font-semibold uppercase tracking-wider">
                    {article.category}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-brand-black mb-2 group-hover:text-brand-red transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-brand-grey text-xs mb-3 line-clamp-2">{article.excerpt}</p>

                <div className="flex items-center justify-between text-[10px] text-brand-grey mt-auto pt-3 border-t border-gray-100">
                  <span>By GHL Research</span>
                  <span>{new Date(article.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  <span>{article.readTime}</span>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 9. CTA ───────────────────────────── */
function FundCTA() {
  return (
    <section className="section-padding gradient-dark text-white">
      <div className="container-max mx-auto text-center">
        <AnimatedSection>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Interested in Our Fund?</h2>
          <p className="text-gray-400 text-base max-w-2xl mx-auto mb-8">
            Reach out to learn more about investment opportunities, or download our detailed fund documents.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="btn-primary">
              Schedule Meeting <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/downloads" className="inline-flex items-center px-6 py-2.5 text-sm border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-all">
              Download Documents
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ───────────────────────────── PAGE ───────────────────────────── */
export default function FundPage() {
  return (
    <>
      <FundHero />
      <FundOverview />
      <InvestmentRoutes />
      <InvestmentStrategy />
      <FundStructure />
      <RiskFramework />
      <InvestmentProcess />
      <ReturnsPerformance />
      <FundArticles />
      <FundCTA />
    </>
  )
}
