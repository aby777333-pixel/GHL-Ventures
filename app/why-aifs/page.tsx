'use client'

import { useState } from 'react'
import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import { BRAND } from '@/lib/constants'
import {
  ArrowRight, Shield, TrendingUp, BarChart3, Target,
  Briefcase, Globe, Layers, Building2, Users, Landmark,
  FileText, Lock, Scale, PieChart, Lightbulb, Zap,
  CheckCircle, Home, ChevronRight, ChevronDown, ChevronUp,
  DollarSign, Eye, Award, ShieldCheck, Activity
} from 'lucide-react'
import SpaceHero from '@/components/SpaceHero'

/* ───────────────────────────── 1. HERO — City Theme ───────────────────────────── */
function WhyAIFsHero() {
  return (
    <section className="relative min-h-[60vh] flex items-center gradient-dark overflow-hidden">
      <SpaceHero variant="city" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-16 left-20 w-80 h-80 bg-brand-red rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-56 h-56 bg-amber-500 rounded-full blur-3xl" />
      </div>

      <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-32 pb-20">
        <AnimatedSection>
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-8">
            <Link href="/" className="hover:text-white transition-colors flex items-center">
              <Home className="w-3.5 h-3.5 mr-1" /> Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-brand-red font-medium">Why AIFs</span>
          </nav>

          <div className="inline-flex items-center px-4 py-2 bg-brand-red/10 border border-brand-red/20 rounded-full mb-6">
            <Lightbulb className="w-4 h-4 text-brand-red mr-2" />
            <span className="text-brand-red text-sm font-medium">Investor Education</span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-2 mb-5 leading-tight">
            Understanding <span className="text-gradient">Alternative</span><br />
            <span className="text-gradient">Investment Funds</span> <span className="italic font-normal text-gray-300">in India</span>
          </h1>
          <p className="text-base text-gray-300 max-w-3xl leading-relaxed mb-8">
            A comprehensive guide to SEBI-regulated AIFs &mdash; what they are, how they work,
            their advantages, and how institutional-grade strategies deliver superior
            risk-adjusted returns for India&apos;s discerning investors.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-2.5 text-white font-semibold text-sm rounded-lg transition-all hover:shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #D0021B 0%, #a00216 100%)' }}
            >
              Schedule a Consultation <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <a
              href="#what-is-aif"
              className="inline-flex items-center px-6 py-2.5 text-white/80 font-semibold text-sm rounded-lg border border-white/15 hover:border-brand-red hover:text-brand-red transition-all"
            >
              Start Learning &darr;
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ───────────────────────────── 2. WHAT IS AN AIF ───────────────────────────── */
function WhatIsAIF() {
  return (
    <section id="what-is-aif" className="section-padding bg-white">
      <div className="container-max mx-auto">
        <AnimatedSection>
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Fundamentals</span>
          <h2 className="section-title mt-2 text-brand-black">What Is an Alternative Investment Fund?</h2>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-10 mt-8">
          <AnimatedSection direction="left">
            <div className="space-y-5 text-brand-grey leading-relaxed">
              <p>
                An <strong className="text-brand-black">Alternative Investment Fund (AIF)</strong> is a privately
                pooled investment vehicle established in India that collects funds from sophisticated
                investors for investing in accordance with a defined investment policy. Unlike publicly
                available instruments such as mutual funds, AIFs offer access to
                <strong className="text-brand-black"> high-growth, institutional-grade strategies</strong>.
              </p>
              <p>
                Governed by the <strong className="text-brand-black">SEBI (Alternative Investment Funds) Regulations, 2012</strong>,
                AIFs operate under a rigorous regulatory framework that mandates transparent governance,
                periodic disclosures, and custodial safeguards. They can be structured as trusts, companies,
                LLPs, or body corporates.
              </p>
              <p>
                AIFs encompass private equity, venture capital, real estate, distressed assets, structured credit,
                infrastructure, and hedge fund strategies. The Indian AIF ecosystem manages commitments
                exceeding <strong className="text-brand-black">&nbsp;&#x20B9;15 lakh crore</strong> &mdash; a testament to the growing
                institutional appetite for alternative strategies.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection direction="right">
            <div className="bg-gradient-to-br from-brand-black to-brand-darkgrey rounded-3xl p-8 text-white">
              <div className="border-l-2 border-brand-red pl-5 mb-6">
                <p className="text-gray-300 italic leading-relaxed text-sm">
                  &ldquo;Any fund established or incorporated in India which is a privately pooled investment
                  vehicle which collects funds from sophisticated investors, whether Indian or foreign,
                  for investing in accordance with a defined investment policy for the benefit of its investors.&rdquo;
                </p>
                <p className="text-brand-red text-xs font-semibold mt-3">&mdash; SEBI (AIF) Regulations, 2012</p>
              </div>

              <div className="space-y-4 mt-6">
                {[
                  { icon: FileText, label: 'Regulator', value: 'Securities and Exchange Board of India (SEBI)' },
                  { icon: Landmark, label: 'Governing Law', value: 'SEBI (AIF) Regulations, 2012' },
                  { icon: DollarSign, label: 'Min Investment', value: 'As per SEBI AIF Regulations' },
                  { icon: Users, label: 'Eligible Investors', value: 'HNIs, Family Offices, Institutions, NRIs' },
                  { icon: Scale, label: 'Structure', value: 'SEBI Regulated AIF Structure' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-brand-red/15 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-brand-red" />
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs font-medium">{item.label}</span>
                      <p className="text-gray-200 text-sm">{item.value}</p>
                    </div>
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

/* ───────────────────────────── 3. THREE CATEGORIES ───────────────────────────── */
function Categories() {
  const categories = [
    {
      num: 'Category I',
      title: 'Growth & Impact Capital',
      desc: 'Funds that invest in sectors considered socially or economically desirable by the government. These receive incentives and concessions due to their developmental impact.',
      tags: ['Venture Capital', 'Angel Funds', 'Infrastructure', 'Social Ventures', 'SME Funds'],
      color: 'blue',
      borderColor: 'border-t-blue-500',
      numColor: 'text-blue-400',
      highlight: null,
    },
    {
      num: 'Category II',
      title: 'Private Equity & Credit',
      desc: 'Funds that do not fall under Category I or III and do not undertake leverage except for day-to-day operational needs. This is the largest AIF segment.',
      tags: ['Private Equity', 'Private Credit', 'Real Estate', 'Distressed Assets', 'Fund of Funds'],
      color: 'red',
      borderColor: 'border-t-brand-red',
      numColor: 'text-brand-red',
      highlight: 'GHL India Ventures operates as a Category II AIF',
    },
    {
      num: 'Category III',
      title: 'Trading & Hedge Strategies',
      desc: 'Funds that employ diverse or complex strategies and may use leverage through investment in listed or unlisted derivatives.',
      tags: ['Hedge Funds', 'PIPE Funds', 'Long-Short Equity', 'Derivatives'],
      color: 'violet',
      borderColor: 'border-t-violet-500',
      numColor: 'text-violet-400',
      highlight: null,
    },
  ]

  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <AnimatedSection>
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">SEBI Classification</span>
          <h2 className="section-title mt-2 text-brand-black">The Three Categories of AIFs</h2>
          <p className="section-subtitle mt-4 max-w-3xl">
            SEBI classifies Alternative Investment Funds into three distinct categories, each with
            specific investment mandates, regulatory constraints, and risk-return profiles.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {categories.map((cat, i) => (
            <AnimatedSection key={cat.num} delay={i * 120}>
              <div className={`card h-full border-t-[3px] ${cat.borderColor} hover:-translate-y-2`}>
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${cat.numColor}`}>{cat.num}</span>
                <h3 className="font-bold text-lg text-brand-black mt-2 mb-3">{cat.title}</h3>
                <p className="text-brand-grey text-sm leading-relaxed mb-4">{cat.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-gray-100 text-brand-grey text-xs rounded-full font-medium">{tag}</span>
                  ))}
                </div>
                {cat.highlight && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-brand-red rounded-full animate-pulse" />
                    <span className="text-xs text-brand-grey font-medium">{cat.highlight}</span>
                  </div>
                )}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 4. ADVANTAGES ───────────────────────────── */
function Advantages() {
  const advantages = [
    { icon: TrendingUp, title: 'Alpha Generation', desc: 'AIFs have historically generated significant alpha over public market benchmarks, with 75% of AIFs successfully delivering positive alpha.' },
    { icon: PieChart, title: 'True Portfolio Diversification', desc: 'Access asset classes with low correlation to public markets \u2014 stressed real estate, private credit, early-stage ventures, and infrastructure.' },
    { icon: Shield, title: 'Institutional Governance', desc: 'SEBI-mandated compliance ensures quarterly NAV reporting, third-party audits, custodial safeguards, and transparent fee structures.' },
    { icon: Award, title: 'Professional Fund Management', desc: 'Capital managed by experienced investment professionals with deep domain expertise and proven track records in complex deals.' },
    { icon: Zap, title: 'Access to Exclusive Deals', desc: 'AIFs participate in deal flows individuals cannot access \u2014 NCLT resolutions, pre-IPO placements, structured credit opportunities.' },
    { icon: BarChart3, title: 'Tax Pass-Through Structure', desc: 'Category I and II AIFs enjoy a tax pass-through regime for all income except business income, avoiding double taxation.' },
    { icon: Target, title: 'Customised Strategy Alignment', desc: 'Unlike one-size-fits-all mutual funds, AIFs can be designed around specific themes matching investor conviction.' },
    { icon: Globe, title: 'NRI & Global Participation', desc: 'Qualified NRIs can invest through NRO accounts with full FEMA/RBI compliance, providing a regulated gateway to Indian alternatives.' },
  ]

  return (
    <section className="section-padding bg-white">
      <div className="container-max mx-auto">
        <AnimatedSection>
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Why AIFs</span>
          <h2 className="section-title mt-2 text-brand-black">Advantages of Investing in Alternative Investment Funds</h2>
          <p className="section-subtitle mt-4 max-w-3xl">
            AIFs offer sophisticated investors access to strategies, asset classes, and return profiles
            that are simply not available through conventional instruments.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-5 mt-8">
          {advantages.map((adv, i) => (
            <AnimatedSection key={adv.title} delay={i * 80}>
              <div className="card flex gap-4 items-start hover:-translate-y-1 h-full">
                <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                  <adv.icon className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-black mb-1.5">{adv.title}</h3>
                  <p className="text-brand-grey text-sm leading-relaxed">{adv.desc}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 5. INDUSTRY STATS ───────────────────────────── */
function IndustryStats() {
  const stats = [
    { value: '\u20B915L Cr+', label: 'Total AIF Commitments', sub: 'As of Sep 2025' },
    { value: '1,550+', label: 'Registered AIFs', sub: 'SEBI Registered' },
    { value: '49%', label: '10-Year CAGR', sub: 'Commitment Growth' },
    { value: '75%', label: 'Alpha Generators', sub: 'Positive alpha vs benchmarks' },
  ]

  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <AnimatedSection>
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">India&apos;s AIF Industry</span>
          <h2 className="section-title mt-2 text-brand-black">A Market in Unprecedented Growth</h2>
          <p className="section-subtitle mt-4 max-w-3xl">
            India&apos;s alternative investment ecosystem has entered a defining phase &mdash; with commitments
            growing at a 49% CAGR over the last decade, AIFs are now a cornerstone of sophisticated
            wealth management.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <div className="bg-gradient-to-br from-brand-black to-brand-darkgrey rounded-3xl p-8 md:p-10 mt-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-brand-red mb-1">{stat.value}</div>
                  <div className="text-white text-xs font-semibold uppercase tracking-wider">{stat.label}</div>
                  <div className="text-gray-500 text-xs mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-600 text-xs mt-6">
              Source: SEBI Statistics, PMS Bazaar Industry Report, NSE AIF Primer. Data for illustrative purposes.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ───────────────────────────── 6. HOW AIF WORKS ───────────────────────────── */
function HowItWorks() {
  const steps = [
    { num: '01', title: 'Commitment', desc: 'Investor commits capital via the Private Placement Memorandum (PPM) after thorough KYC and eligibility verification.' },
    { num: '02', title: 'Drawdown', desc: 'Capital is called in tranches as investment opportunities arise, minimising negative carry on uncommitted capital.' },
    { num: '03', title: 'Deployment', desc: 'Funds are invested per the defined strategy \u2014 stressed assets, private equity, structured credit, or venture deals.' },
    { num: '04', title: 'Management', desc: 'Active portfolio management with quarterly NAV reporting, compliance audits, and transparent investor communications.' },
    { num: '05', title: 'Exit & Distribution', desc: 'Returns are distributed as investments are exited \u2014 through sales, IPOs, secondary markets, or in-specie distribution.' },
  ]

  return (
    <section className="section-padding bg-white">
      <div className="container-max mx-auto">
        <AnimatedSection>
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">The Process</span>
          <h2 className="section-title mt-2 text-brand-black">How an AIF Investment Works</h2>
          <p className="section-subtitle mt-4 max-w-3xl">
            From commitment to exit &mdash; a structured, transparent journey managed by experienced
            professionals under SEBI oversight.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-8 relative">
          {/* Connecting line — desktop only */}
          <div className="hidden md:block absolute top-[32px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-brand-red/20 to-transparent" />

          {steps.map((step, i) => (
            <AnimatedSection key={step.num} delay={i * 100}>
              <div className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-brand-offwhite border-2 border-gray-200 flex items-center justify-center mx-auto mb-4 z-10 relative hover:border-brand-red hover:bg-brand-red/5 transition-all">
                  <span className="text-brand-red font-mono font-bold text-sm">{step.num}</span>
                </div>
                <h4 className="font-bold text-brand-black text-sm mb-2">{step.title}</h4>
                <p className="text-brand-grey text-xs leading-relaxed">{step.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 7. WHAT GHL DOES ───────────────────────────── */
function GHLApproach() {
  const strategies = [
    {
      num: '01',
      title: 'Stressed Real Estate Recovery',
      desc: 'We acquire distressed and stalled real estate projects through NCLT resolutions under the IBC at significant discounts. Our team revitalises these assets \u2014 clearing legal encumbrances, completing construction, and repositioning for sale or lease.',
      tags: ['NCLT Acquisitions', 'IBC Framework', 'Asset Revitalisation', 'Chennai Focus'],
    },
    {
      num: '02',
      title: 'Early-Stage Venture Capital',
      desc: 'We back visionary founders building transformative businesses across India\u2019s most promising sectors \u2014 fintech, healthtech, cleantech, and deep technology. Our approach is conviction-based, not trend-chasing.',
      tags: ['Pre-Series A to Series A', 'Fintech', 'HealthTech', 'CleanTech'],
    },
    {
      num: '03',
      title: 'Institutional-Grade Governance',
      desc: 'Every investment undergoes 360-degree forensic diligence. We maintain quarterly NAV disclosures, third-party audits, custodian-held assets, and open-door governance.',
      tags: ['Quarterly NAV', 'Third-Party Audits', 'Custodial Safeguards', 'ESG Integration'],
    },
    {
      num: '04',
      title: 'Accessible Entry via SEBI Co-Invest Framework',
      desc: 'For investors seeking alternative entry, GHL offers a SEBI Co-Invest Framework \u2014 providing access to institutional-grade returns through a structured co-invest instrument.',
      tags: ['Contact for Details', 'Co-Invest Structure', 'Structured Returns', 'Salaried Professionals'],
    },
  ]

  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 items-center mb-8">
          <AnimatedSection>
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Our Approach</span>
            <h2 className="section-title mt-2 text-brand-black">What GHL India Ventures Does Differently</h2>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <p className="text-brand-grey leading-relaxed">
              As a SEBI-registered Category II AIF (Reg. No. {BRAND.sebi}), GHL India Ventures combines
              deep market intelligence with disciplined risk management across two high-conviction
              strategies &mdash; both designed to capture value where conventional capital cannot reach.
            </p>
          </AnimatedSection>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {strategies.map((s, i) => (
            <AnimatedSection key={s.num} delay={i * 100}>
              <div className="card h-full hover:-translate-y-2 relative overflow-hidden group">
                <span className="absolute top-4 right-5 text-4xl font-bold text-brand-red/5 font-mono">{s.num}</span>
                <h3 className="font-bold text-brand-black text-lg mb-3 pr-12">{s.title}</h3>
                <p className="text-brand-grey text-sm leading-relaxed mb-4">{s.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-brand-red/5 text-brand-red text-xs rounded-full font-medium border border-brand-red/10">{tag}</span>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 8. SEBI FRAMEWORK ───────────────────────────── */
function SEBIFramework() {
  const cards = [
    { icon: Lock, title: 'Mandatory Registration', desc: 'Every AIF must be registered with SEBI before accepting any investor commitments, with stringent checks on governance and compliance.' },
    { icon: FileText, title: 'Private Placement Memorandum', desc: 'AIFs must issue a detailed PPM disclosing investment strategy, risk factors, fee structure, track record, and exit mechanisms.' },
    { icon: Landmark, title: 'Custodian & Auditor Requirements', desc: 'Assets are held by independent custodians, not the fund manager. Annual audits ensure no conflicts of interest.' },
    { icon: BarChart3, title: 'NAV & Reporting Standards', desc: 'AIFs must report Net Asset Value periodically with enhanced disclosure norms on portfolio composition and performance.' },
    { icon: Scale, title: 'Investment Restrictions', desc: 'Category I and II AIFs cannot undertake leverage beyond day-to-day operations. Concentration limits and related-party restrictions apply.' },
    { icon: ShieldCheck, title: 'Due Diligence Obligations', desc: 'Following 2024 amendments, AIFs and Key Management Personnel must conduct specific due diligence on investors and investments.' },
  ]

  return (
    <section className="section-padding bg-white">
      <div className="container-max mx-auto">
        <AnimatedSection>
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Regulatory Framework</span>
          <h2 className="section-title mt-2 text-brand-black">How SEBI Protects AIF Investors</h2>
          <p className="section-subtitle mt-4 max-w-3xl">
            India&apos;s AIF regulatory framework is among the most robust globally, ensuring investor
            protection, transparency, and institutional accountability at every stage.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {cards.map((card, i) => (
            <AnimatedSection key={card.title} delay={i * 80}>
              <div className="card h-full hover:-translate-y-1">
                <div className="w-10 h-10 bg-brand-red/10 rounded-lg flex items-center justify-center mb-4">
                  <card.icon className="w-5 h-5 text-brand-red" />
                </div>
                <h3 className="font-bold text-brand-black mb-2">{card.title}</h3>
                <p className="text-brand-grey text-sm leading-relaxed">{card.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 9. COMPARISON TABLE ───────────────────────────── */
function ComparisonTable() {
  const rows = [
    { param: 'Minimum Investment', aif: 'As per SEBI AIF Regulations', pms: '\u20B950 Lakhs', mf: '\u20B9500', fd: '\u20B91,000' },
    { param: 'Regulator', aif: 'SEBI', pms: 'SEBI', mf: 'SEBI', fd: 'RBI' },
    { param: 'Asset Classes', aif: 'PE, Real Estate, Credit, VC, Distressed', pms: 'Listed Equities & Bonds', mf: 'Listed Securities', fd: 'Bank Deposits' },
    { param: 'Investor Base', aif: 'HNIs, Family Offices, Institutions', pms: 'HNIs', mf: 'Retail & Institutional', fd: 'Everyone' },
    { param: 'Liquidity', aif: 'Low (3\u20137 year lock-in)', pms: 'Medium', mf: 'High (open-ended)', fd: 'Medium' },
    { param: 'Return Potential', aif: 'High (strategy dependent)', pms: 'Moderate-High', mf: 'Moderate', fd: 'Low-Moderate' },
    { param: 'Tax Treatment', aif: 'Pass-through (Cat I & II)', pms: 'Individual taxation', mf: 'Fund-level + Investor', fd: 'Income tax slab' },
    { param: 'Diversification', aif: 'Unlisted, alternative assets', pms: 'Listed market exposure', mf: 'Listed market exposure', fd: 'None' },
    { param: 'Manager Skin in Game', aif: 'Mandatory co-investment', pms: 'Optional', mf: 'Optional', fd: 'N/A' },
  ]

  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <AnimatedSection>
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Compare</span>
          <h2 className="section-title mt-2 text-brand-black">AIF vs Traditional Investments</h2>
          <p className="section-subtitle mt-4 max-w-3xl">
            See how Alternative Investment Funds stack up against conventional instruments on the
            parameters that matter most to sophisticated investors.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={150}>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-4 font-bold text-brand-black text-xs uppercase tracking-wider whitespace-nowrap">Parameter</th>
                  <th className="text-left px-5 py-4 font-bold text-brand-red text-xs uppercase tracking-wider bg-brand-red/5 whitespace-nowrap">Category II AIF</th>
                  <th className="text-left px-5 py-4 font-semibold text-brand-grey text-xs uppercase tracking-wider whitespace-nowrap">PMS</th>
                  <th className="text-left px-5 py-4 font-semibold text-brand-grey text-xs uppercase tracking-wider whitespace-nowrap">Mutual Funds</th>
                  <th className="text-left px-5 py-4 font-semibold text-brand-grey text-xs uppercase tracking-wider whitespace-nowrap">Fixed Deposits</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.param} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/50'} hover:bg-gray-50 transition-colors`}>
                    <td className="px-5 py-3.5 font-semibold text-brand-black whitespace-nowrap">{row.param}</td>
                    <td className="px-5 py-3.5 text-brand-red font-medium bg-brand-red/[0.03]">{row.aif}</td>
                    <td className="px-5 py-3.5 text-brand-grey">{row.pms}</td>
                    <td className="px-5 py-3.5 text-brand-grey">{row.mf}</td>
                    <td className="px-5 py-3.5 text-brand-grey">{row.fd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ───────────────────────────── 10. INSIGHTS ───────────────────────────── */
function Insights() {
  const insights = [
    { tag: 'Market Trend', title: 'India\u2019s AIF Ecosystem Crosses \u20B923 Lakh Crore', desc: 'Combined PMS and AIF assets have grown at a 31% CAGR over the last decade, driven by HNIs and institutional investors seeking diversification.' },
    { tag: 'Regulatory Reform', title: 'SEBI\u2019s 2025 Reforms Reshape the Landscape', desc: 'From the new Co-Investment Vehicle framework to Accredited Investor-only schemes, SEBI is creating a more flexible, investor-friendly environment.' },
    { tag: 'Opportunity', title: 'Private Credit Emerges as a Powerhouse', desc: 'Private credit now accounts for 15% of total AIF commitments at nearly \u20B92 lakh crore \u2014 up from just 6% five years ago.' },
    { tag: 'Growth Driver', title: 'Stressed Real Estate: India\u2019s Hidden Alpha', desc: 'With thousands of stalled projects and a robust IBC framework, stressed real estate offers deep-discount entry points for patient capital.' },
    { tag: 'Global Context', title: 'India\u2019s Alternative Allocation Gap', desc: 'Alternative investments represent 15\u201320% of HNI portfolios globally but less than 5% in India. With 36 lakh+ HNIs, the runway is massive.' },
    { tag: 'Future Outlook', title: 'The Road to \u20B925 Lakh Crore by 2027', desc: 'With government support, growing NPS allocations to alternatives, and increasing family office participation, AIFs are projected to reach 15% of India\u2019s total wealth management AUM.' },
  ]

  return (
    <section className="section-padding bg-white">
      <div className="container-max mx-auto">
        <AnimatedSection>
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Insights</span>
          <h2 className="section-title mt-2 text-brand-black">Why Now Is the Right Time for AIFs</h2>
          <p className="section-subtitle mt-4 max-w-3xl">
            Macro tailwinds, regulatory reforms, and a maturing ecosystem make this a defining moment
            for alternative capital in India.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {insights.map((ins, i) => (
            <AnimatedSection key={ins.title} delay={i * 80}>
              <div className="card h-full hover:-translate-y-2">
                <span className="inline-block px-2.5 py-1 bg-brand-red/10 text-brand-red text-xs font-semibold rounded-full mb-3">{ins.tag}</span>
                <h3 className="font-bold text-brand-black mb-2 leading-snug">{ins.title}</h3>
                <p className="text-brand-grey text-sm leading-relaxed">{ins.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 11. FAQ ───────────────────────────── */
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      q: 'Who can invest in an AIF?',
      a: 'AIFs are designed for sophisticated investors. Eligible participants include Indian residents, HNIs, family offices, corporates, banks, NBFCs, insurance companies, pension funds, and NRIs (through NRO accounts). The minimum investment is as per SEBI AIF Regulations for Category I and II AIFs. SEBI has also introduced the concept of Accredited Investors who may access specific schemes with differentiated terms.',
    },
    {
      q: 'How is an AIF different from a mutual fund?',
      a: 'While both are pooled investment vehicles regulated by SEBI, they differ significantly. Mutual funds are publicly offered, have low minimums (\u20B9500), and primarily invest in listed securities. AIFs are privately placed with higher minimums as per SEBI AIF Regulations, invest in unlisted and alternative assets, have longer lock-in periods, and offer access to strategies not available through public markets.',
    },
    {
      q: 'What is the lock-in period for an AIF?',
      a: 'Close-ended Category I and II AIFs typically have a tenure of 3 to 7 years, with a possible extension of up to 2 years (subject to investor approval). Category III AIFs may be open-ended or close-ended. The lock-in reflects the nature of illiquid, alternative assets that require time for value creation.',
    },
    {
      q: 'What fees do AIFs charge?',
      a: 'AIF fee structures typically include a Management Fee (1\u20132% annually on committed or invested capital), a Performance Fee or Carried Interest (typically 15\u201320% of profits above a hurdle rate), and operational expenses. All fees must be disclosed in the Private Placement Memorandum (PPM).',
    },
    {
      q: 'How are AIF returns taxed?',
      a: 'Category I and II AIFs enjoy a tax pass-through status for all income except business income. This means investors are taxed as if they directly invested \u2014 capital gains, interest, and dividends flow through to the investor and are taxed at their individual rates. Category III AIFs are taxed at the fund level.',
    },
    {
      q: 'Can NRIs invest in Indian AIFs?',
      a: 'Yes. NRIs can invest in Indian AIFs through their NRO (Non-Resident Ordinary) account. The fund handles all FEMA and RBI compliance requirements. NRI investors are subject to India\u2019s tax treaties (DTAAs) and may have withholding tax obligations.',
    },
    {
      q: 'What is GHL India Ventures\u2019 SEBI registration?',
      a: `GHL India Ventures is registered with SEBI as a Category II Alternative Investment Fund under Registration Number ${BRAND.sebi}. The fund is headquartered at ${BRAND.address}.`,
    },
  ]

  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <AnimatedSection>
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Frequently Asked Questions</span>
          <h2 className="section-title mt-2 text-brand-black">AIF Questions, Answered</h2>
        </AnimatedSection>

        <AnimatedSection delay={150}>
          <div className="mt-8 max-w-3xl">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-200">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="flex justify-between items-center w-full py-5 text-left group"
                >
                  <span className="font-semibold text-brand-black group-hover:text-brand-red transition-colors pr-4">{faq.q}</span>
                  {openIndex === i ? (
                    <ChevronUp className="w-5 h-5 text-brand-red shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-brand-grey shrink-0" />
                  )}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-[400px] pb-5' : 'max-h-0'}`}>
                  <p className="text-brand-grey text-sm leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ───────────────────────────── 12. CTA ───────────────────────────── */
function WhyAIFsCTA() {
  return (
    <section className="section-padding bg-brand-red">
      <div className="container-max mx-auto text-center">
        <AnimatedSection>
          <span className="text-white/70 font-semibold text-xs uppercase tracking-wider">Get Started</span>
          <h2 className="text-2xl md:text-3xl font-bold text-white mt-3 mb-4">
            Ready to Explore Alternative Investments?
          </h2>
          <p className="text-white/80 text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Schedule a private consultation with our investment advisory team. Learn how GHL India
            Ventures&apos; institutional-grade strategies can work for your portfolio.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-3 bg-white text-brand-red font-bold text-sm rounded-lg hover:bg-gray-100 transition-all shadow-lg"
            >
              Request a Consultation <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/fund"
              className="inline-flex items-center px-8 py-3 text-white font-semibold text-sm rounded-lg border border-white/30 hover:bg-white/10 transition-all"
            >
              Explore Our Fund
            </Link>
          </div>
          <div className="mt-6 text-white/60 text-sm">
            Or call us directly:{' '}
            <a href={`tel:${BRAND.phone2.replace(/\s/g, '')}`} className="text-white hover:text-white/90 transition-colors">{BRAND.phone2}</a>
            {' '}&nbsp;|&nbsp;{' '}
            <a href={`mailto:${BRAND.email}`} className="text-white hover:text-white/90 transition-colors">{BRAND.email}</a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ───────────────────────────── 13. DISCLAIMER ───────────────────────────── */
function Disclaimer() {
  return (
    <section className="py-8 px-4 bg-gray-50 border-t border-gray-200">
      <div className="container-max mx-auto">
        <p className="text-xs text-brand-grey leading-relaxed opacity-70">
          <strong className="text-brand-black">Important Disclaimer:</strong> Investments in Alternative Investment Funds (AIFs) and
          Non-Convertible Debentures (NCDs) are subject to market risks including the possible loss of principal amount invested.
          Past performance is not indicative of future results. The information on this page is for educational and general
          informational purposes only and does not constitute an offer, invitation, solicitation, or investment advice.
          Prospective investors must read the Private Placement Memorandum (PPM) and all scheme-related documents carefully
          before making any investment decisions. The industry statistics and data referenced are sourced from publicly available
          reports and are provided for illustrative purposes.{' '}
          <strong className="text-brand-black">SEBI Registration No. {BRAND.sebi}.</strong> Category II AIF minimum investment is as per SEBI AIF Regulations. The fund does not guarantee any returns.
        </p>
      </div>
    </section>
  )
}

/* ───────────────────────────── PAGE ───────────────────────────── */
export default function WhyAIFsPage() {
  return (
    <>
      <WhyAIFsHero />
      <WhatIsAIF />
      <Categories />
      <Advantages />
      <IndustryStats />
      <HowItWorks />
      <GHLApproach />
      <SEBIFramework />
      <ComparisonTable />
      <Insights />
      <FAQ />
      <WhyAIFsCTA />
      <Disclaimer />
    </>
  )
}
