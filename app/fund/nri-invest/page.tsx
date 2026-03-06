'use client'

import { useState } from 'react'
import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import { BRAND } from '@/lib/constants'
import SpaceHero from '@/components/SpaceHero'
import { NRIHandbookProvider, useNRIHandbook } from '@/components/NRIHandbook'
import FundCalculatorSection from '@/components/FundCalculatorSection'
import {
  ArrowRight, ArrowLeft, Shield, Globe, Building2, TrendingUp,
  Users, CheckCircle, FileText, Phone, Mail, ChevronRight,
  ChevronDown, Banknote, Scale, MapPin, Clock,
  Star, BookOpen, Sparkles, Lock, Heart, Target,
  BarChart3, Briefcase, Home, ExternalLink, Plane,
  AlertTriangle, IndianRupee, Landmark, GraduationCap
} from 'lucide-react'

// ────────────────────────────────────────────────
// Main Page Wrapper (provides NRI Handbook context)
// ────────────────────────────────────────────────
export default function NRIInvestPage() {
  return (
    <NRIHandbookProvider>
      <NRIInvestContent />
    </NRIHandbookProvider>
  )
}

// ────────────────────────────────────────────────
// Page Content
// ────────────────────────────────────────────────
function NRIInvestContent() {
  const { openHandbook } = useNRIHandbook()

  return (
    <>
      {/* ═══════════════════════════════════════════════
          1. HERO — NRI Flight Theme
         ═══════════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] flex items-center gradient-dark overflow-hidden">
        <SpaceHero variant="nri-flight" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-80 h-80 bg-brand-red/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-60 h-60 bg-orange-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-40 pb-32">
          <AnimatedSection>
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-gray-400 mb-6">
              <Link href="/" className="hover:text-white transition-colors flex items-center">
                <Home className="w-3.5 h-3.5 mr-1" /> Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 mx-1" />
              <Link href="/fund" className="hover:text-white transition-colors">Fund</Link>
              <ChevronRight className="w-3.5 h-3.5 mx-1" />
              <span className="text-brand-red font-medium">NRI Invest</span>
            </nav>

            <div className="inline-flex items-center px-4 py-2 bg-brand-red/10 border border-brand-red/20 rounded-full mb-6">
              <Shield className="w-4 h-4 text-brand-red mr-2" />
              <span className="text-brand-red text-sm font-medium">SEBI Reg: {BRAND.sebi}</span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-5 leading-tight">
              Invest in India.<br />
              <span className="text-gradient">From Anywhere in the World.</span>
            </h1>
            <p className="text-base lg:text-lg text-gray-300 max-w-3xl leading-relaxed mb-4">
              A SEBI-registered Category II AIF designed for Non-Resident Indians.
              Access India&apos;s stressed real estate recovery and early-stage startup opportunities
              through a fully FEMA/RBI-compliant investment structure.
            </p>
            <p className="text-sm text-gray-500 max-w-2xl">
              NRO/NRE routing &bull; Fully repatriable &bull; Remote onboarding &bull; Available in your timezone
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="#consultation" className="btn-primary">
                Book NRI Consultation <Plane className="ml-2 w-4 h-4" />
              </Link>
              <button
                onClick={openHandbook}
                className="inline-flex items-center px-6 py-2.5 text-sm border-2 border-white/20 text-white font-bold rounded-lg hover:bg-white/10 transition-all"
              >
                <BookOpen className="mr-2 w-4 h-4" /> Download NRI Handbook
              </button>
            </div>
          </AnimatedSection>

          {/* Quick Stats */}
          <AnimatedSection delay={200}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl">
              {[
                { label: 'NRI Corridors Served', value: '15+', icon: <Globe className="w-5 h-5" /> },
                { label: 'AIF Investment', value: 'As per SEBI', icon: <IndianRupee className="w-5 h-5" /> },
                { label: 'Co-Invest Framework', value: 'Contact Us', icon: <Banknote className="w-5 h-5" /> },
                { label: 'FEMA Compliant', value: '100%', icon: <Shield className="w-5 h-5" /> },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
                  <div className="flex justify-center mb-2 text-brand-red">{stat.icon}</div>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-[11px] text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          2. TRUST & STRUCTURE — Why NRIs Trust GHL
         ═══════════════════════════════════════════════ */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-brand-red text-sm font-bold uppercase tracking-wider mb-2">Built for NRI Confidence</p>
              <h2 className="text-2xl md:text-3xl font-bold text-brand-black mb-4">
                Why NRIs Trust GHL India Ventures
              </h2>
              <p className="text-brand-grey max-w-2xl mx-auto">
                Institutional-grade governance meets NRI-specific compliance.
                Every rupee is protected, reported, and repatriable.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Shield className="w-6 h-6" />,
                title: 'SEBI Registered',
                desc: 'Category II AIF (IN/AIF2/2425/1517) with mandatory quarterly audits, independent trustee oversight, and SEBI grievance redressal.',
              },
              {
                icon: <Scale className="w-6 h-6" />,
                title: 'FEMA & RBI Compliant',
                desc: 'Full compliance with Foreign Exchange Management Act. NRO/NRE routing, automatic route investment, and seamless repatriation support.',
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: 'Remote Onboarding',
                desc: 'Complete the entire investment process from anywhere — KYC, agreements, fund transfer. No India visit required.',
              },
              {
                icon: <Landmark className="w-6 h-6" />,
                title: 'Independent Custodian',
                desc: 'Your assets are safeguarded by a SEBI-approved custodian. Fund money never commingles with the manager\'s operating accounts.',
              },
              {
                icon: <FileText className="w-6 h-6" />,
                title: 'Quarterly Reporting',
                desc: 'Detailed NAV reports, asset-level performance updates, and audited financials delivered directly to your inbox every quarter.',
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: 'Your Timezone',
                desc: 'NRI Advisory Team available across IST, GST, EST, PST, and AEST. Schedule calls when it works for you.',
              },
            ].map((item, idx) => (
              <AnimatedSection key={item.title} delay={idx * 100}>
                <div className="card p-6 rounded-2xl h-full hover:shadow-lg transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center text-brand-red mb-4 group-hover:bg-brand-red group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-bold text-brand-black mb-2">{item.title}</h3>
                  <p className="text-sm text-brand-grey leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          3. WHY INDIA — Macroeconomic Case
         ═══════════════════════════════════════════════ */}
      <section className="section-padding bg-white dark:bg-brand-black">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-brand-red text-sm font-bold uppercase tracking-wider mb-2">The India Opportunity</p>
              <h2 className="text-2xl md:text-3xl font-bold text-brand-black mb-4">
                Why India? Why Now?
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <AnimatedSection direction="left">
              <div className="space-y-5">
                {[
                  { stat: '6.5–7%', label: 'Projected GDP growth p.a.', detail: 'Fastest-growing major economy globally' },
                  { stat: '3rd', label: 'Largest economy by 2027', detail: 'IMF projections confirm trajectory' },
                  { stat: '₹4L Cr+', label: 'Stressed real estate pool', detail: 'Deep-value acquisition opportunity' },
                  { stat: '100+', label: 'Unicorn startups', detail: '3rd largest startup ecosystem globally' },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4 items-start">
                    <div className="w-16 h-16 rounded-xl bg-brand-red/10 flex items-center justify-center shrink-0">
                      <span className="text-brand-red font-bold text-sm text-center leading-tight">{item.stat}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-black text-sm">{item.label}</h4>
                      <p className="text-xs text-brand-grey">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <div className="card p-6 sm:p-8 rounded-2xl h-full">
                <h3 className="text-lg font-bold text-brand-black mb-4">NRI-Specific Advantages</h3>
                <div className="space-y-3">
                  {[
                    'Favourable INR dynamics amplify USD/GBP/AED returns on conversion',
                    'DTAA treaties with 90+ countries prevent double taxation',
                    'Fully repatriable investment via NRE route',
                    'NRO route allows up to USD 1M repatriation per year automatically',
                    'No prior RBI approval needed (automatic route)',
                    'Demographic dividend: median age 28, 65% under 35',
                    'Digital India infrastructure (UPI, Aadhaar) has no global parallel',
                    'Government PLI schemes driving manufacturing renaissance',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-brand-grey leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          NRI CALCULATOR, COMPARISON & GHL ADVANTAGES
         ═══════════════════════════════════════════════ */}
      <FundCalculatorSection mode="both" showComparison={true} showAdvantages={true} />

      {/* ═══════════════════════════════════════════════
          4. NRI FUND CARDS — Two Investment Routes
         ═══════════════════════════════════════════════ */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-brand-red text-sm font-bold uppercase tracking-wider mb-2">Investment Routes</p>
              <h2 className="text-2xl md:text-3xl font-bold text-brand-black mb-4">
                Choose Your NRI Investment Pathway
              </h2>
              <p className="text-brand-grey max-w-2xl mx-auto">
                Two distinct routes designed for different risk appetites and investment sizes.
                Both are fully FEMA-compliant and can be funded through NRO or NRE accounts.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Route 1: Direct AIF */}
            <AnimatedSection direction="left">
              <div className="card rounded-2xl overflow-hidden h-full border-2 border-brand-red/20 hover:border-brand-red/40 transition-colors group">
                <div className="p-1">
                  <div className="bg-gradient-to-r from-brand-red to-red-800 p-6 rounded-t-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">Direct AIF Route</h3>
                        <p className="text-white/70 text-xs">For HNIs & Family Offices</p>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      As per SEBI <span className="text-sm font-normal text-white/60">AIF Regulations</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    'Full portfolio diversification across RE & startups',
                    'SEBI regulatory protection & oversight',
                    'Quarterly NAV reporting',
                    'Target IRR: 18–25%',
                    'Fund tenure: 7–10 years',
                    'Independent custodian safeguard',
                    'Pass-through taxation',
                    'Annual audited financials',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-brand-grey">{item}</span>
                    </div>
                  ))}
                  <div className="pt-4">
                    <Link href="/fund/direct-aif" className="btn-primary w-full flex items-center justify-center gap-2">
                      Explore Direct AIF <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Route 2: Debenture */}
            <AnimatedSection direction="right">
              <div className="card rounded-2xl overflow-hidden h-full border-2 border-brand-black/10 hover:border-brand-red/20 transition-colors group">
                <div className="p-1">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-t-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <Banknote className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">SEBI Co-Invest Framework</h3>
                        <p className="text-white/70 text-xs">Accessible Entry Point</p>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      Contact Us <span className="text-sm font-normal text-white/60">for details</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    'SEBI-compliant co-invest structure',
                    'Asset-backed security',
                    'Fixed coupon structure',
                    'Target returns: 14–18% p.a.',
                    'Shorter tenure: 3–5 years',
                    'Lower entry point for NRIs',
                    'Exposure to stressed RE recovery',
                    'Regular interest payouts',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-brand-grey">{item}</span>
                    </div>
                  ))}
                  <div className="pt-4">
                    <Link href="/fund/debenture-route" className="inline-flex items-center justify-center gap-2 w-full px-6 py-2.5 text-sm border-2 border-brand-red text-brand-red font-bold rounded-lg hover:bg-brand-red hover:text-white transition-all">
                      Explore Co-Invest Framework <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          5. COMPLIANCE & TAX ACCORDION
         ═══════════════════════════════════════════════ */}
      <ComplianceAccordion />

      {/* ═══════════════════════════════════════════════
          6. HOW IT WORKS — Step-by-Step
         ═══════════════════════════════════════════════ */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-brand-red text-sm font-bold uppercase tracking-wider mb-2">Your Journey</p>
              <h2 className="text-2xl md:text-3xl font-bold text-brand-black mb-4">
                How It Works: 5 Simple Steps
              </h2>
              <p className="text-brand-grey max-w-2xl mx-auto">
                From first call to first quarterly report — the entire process can be completed
                remotely in under 2 weeks.
              </p>
            </div>
          </AnimatedSection>

          <div className="max-w-4xl mx-auto">
            {[
              {
                step: 1,
                title: 'Book a Free NRI Consultation',
                desc: 'Schedule a 30-minute video call with our NRI Advisory Team. We discuss your investment goals, risk tolerance, country-specific considerations, and recommend the optimal route. Available in your timezone.',
                icon: <Phone className="w-5 h-5" />,
                time: 'Day 1',
              },
              {
                step: 2,
                title: 'Receive Personalised Proposal',
                desc: 'Based on the consultation, receive a customised investment proposal covering recommended route, expected returns, tax implications specific to your country of residence, and a detailed timeline.',
                icon: <FileText className="w-5 h-5" />,
                time: 'Day 2-3',
              },
              {
                step: 3,
                title: 'Complete KYC Remotely',
                desc: 'Submit passport, address proof, PAN card, NRO/NRE bank details, and FATCA/CRS certification digitally. Our compliance team verifies everything within 48 hours.',
                icon: <Users className="w-5 h-5" />,
                time: 'Day 3-5',
              },
              {
                step: 4,
                title: 'Sign & Fund',
                desc: 'Review and digitally sign the subscription agreement via Aadhaar e-sign or digital signature. Transfer investment amount from your NRO/NRE account to the fund\'s designated bank account.',
                icon: <Banknote className="w-5 h-5" />,
                time: 'Day 5-7',
              },
              {
                step: 5,
                title: 'Portfolio Access & Reporting',
                desc: 'Receive unit allotment confirmation, welcome kit, and access to the secure investor portal. Quarterly NAV reports, annual audited financials, and a dedicated relationship manager — all yours.',
                icon: <BarChart3 className="w-5 h-5" />,
                time: 'Day 7-10',
              },
            ].map((item, idx) => (
              <AnimatedSection key={item.step} delay={idx * 100}>
                <div className="flex gap-4 sm:gap-6 mb-8 last:mb-0">
                  {/* Step indicator with connecting line */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-brand-red flex items-center justify-center text-white font-bold text-sm shrink-0 relative z-10">
                      {item.step}
                    </div>
                    {idx < 4 && (
                      <div className="w-0.5 h-full bg-brand-red/20 mt-1" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="card p-5 sm:p-6 rounded-2xl flex-1 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="text-brand-red">{item.icon}</div>
                        <h3 className="font-bold text-brand-black text-sm sm:text-base">{item.title}</h3>
                      </div>
                      <span className="text-[10px] font-medium text-brand-red bg-brand-red/10 px-2 py-1 rounded-full shrink-0">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-sm text-brand-grey leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          7. SOCIAL PROOF — NRI Corridors
         ═══════════════════════════════════════════════ */}
      <section className="section-padding bg-white dark:bg-brand-black">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-brand-red text-sm font-bold uppercase tracking-wider mb-2">Global NRI Network</p>
              <h2 className="text-2xl md:text-3xl font-bold text-brand-black mb-4">
                Serving NRIs Across 15+ Countries
              </h2>
            </div>
          </AnimatedSection>

          {/* Country flags / regions */}
          <AnimatedSection>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4 max-w-5xl mx-auto mb-12">
              {[
                { country: 'UAE', flag: '🇦🇪', city: 'Dubai, Abu Dhabi' },
                { country: 'USA', flag: '🇺🇸', city: 'NYC, SF, Houston' },
                { country: 'UK', flag: '🇬🇧', city: 'London, Manchester' },
                { country: 'Singapore', flag: '🇸🇬', city: 'Singapore' },
                { country: 'Canada', flag: '🇨🇦', city: 'Toronto, Vancouver' },
                { country: 'Australia', flag: '🇦🇺', city: 'Sydney, Melbourne' },
                { country: 'Oman', flag: '🇴🇲', city: 'Muscat' },
                { country: 'Kuwait', flag: '🇰🇼', city: 'Kuwait City' },
                { country: 'Bahrain', flag: '🇧🇭', city: 'Manama' },
                { country: 'Qatar', flag: '🇶🇦', city: 'Doha' },
                { country: 'Germany', flag: '🇩🇪', city: 'Berlin, Munich' },
                { country: 'Hong Kong', flag: '🇭🇰', city: 'Hong Kong' },
                { country: 'Malaysia', flag: '🇲🇾', city: 'KL' },
                { country: 'New Zealand', flag: '🇳🇿', city: 'Auckland' },
              ].map((item) => (
                <div key={item.country} className="card p-3 rounded-xl text-center hover:shadow-md transition-all">
                  <div className="text-2xl mb-1">{item.flag}</div>
                  <div className="text-xs font-bold text-brand-black">{item.country}</div>
                  <div className="text-[10px] text-brand-grey">{item.city}</div>
                </div>
              ))}
            </div>
          </AnimatedSection>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: 'The remote onboarding was seamless. I completed everything from Dubai without visiting India. The NRI compliance team made FEMA compliance stress-free.',
                name: 'Rajesh K.',
                location: 'Dubai, UAE',
                role: 'IT Professional, 12+ years abroad',
              },
              {
                quote: 'What I appreciate most is the quarterly reporting. I always know exactly where my money is invested and how each asset is performing. Transparency is rare in India.',
                name: 'Priya M.',
                location: 'London, UK',
                role: 'Finance Director, Family Office',
              },
              {
                quote: 'As a US-resident NRI, the DTAA guidance was invaluable. The team helped me understand the PFIC implications and structured my investment optimally.',
                name: 'Vikram S.',
                location: 'San Francisco, USA',
                role: 'Tech Entrepreneur',
              },
            ].map((item, idx) => (
              <AnimatedSection key={item.name} delay={idx * 100}>
                <div className="card p-6 rounded-2xl h-full">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-sm text-brand-grey leading-relaxed mb-4 italic">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <div>
                    <p className="text-sm font-bold text-brand-black">{item.name}</p>
                    <p className="text-xs text-brand-grey">{item.location}</p>
                    <p className="text-[10px] text-brand-grey/60">{item.role}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          8. NRI HANDBOOK CTA
         ═══════════════════════════════════════════════ */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto card rounded-2xl overflow-hidden">
              <div className="grid md:grid-cols-2">
                {/* Left — Info */}
                <div className="p-6 sm:p-8 flex flex-col justify-center">
                  <div className="inline-flex items-center px-3 py-1.5 bg-brand-red/10 rounded-full mb-4 w-fit">
                    <BookOpen className="w-3.5 h-3.5 text-brand-red mr-1.5" />
                    <span className="text-brand-red text-xs font-bold">Free Download</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-brand-black mb-3">
                    NRI Investment Handbook
                  </h3>
                  <p className="text-sm text-brand-grey mb-4 leading-relaxed">
                    15 comprehensive chapters covering everything NRIs need to know:
                    FEMA compliance, AIF vs Co-Invest routes, country-specific tax guidance,
                    repatriation rules, and step-by-step onboarding.
                  </p>
                  <div className="space-y-2 mb-6">
                    {[
                      '15 chapters, 60+ pages',
                      'Country-specific tax guides (US, UK, UAE, Singapore, Canada, Australia)',
                      'FEMA & RBI compliance checklist',
                      'KYC document checklist',
                      'Repatriation flowchart',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-brand-grey">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={openHandbook}
                    className="btn-primary w-fit flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Read Handbook
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {/* Right — Visual */}
                <div className="bg-gradient-to-br from-brand-red/5 to-brand-red/10 p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-32 mx-auto rounded-lg bg-white shadow-xl border border-brand-black/10 flex flex-col items-center justify-center mb-4 relative">
                      <BookOpen className="w-8 h-8 text-brand-red mb-2" />
                      <p className="text-[8px] font-bold text-brand-black leading-tight text-center px-2">NRI Investment Handbook</p>
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-red text-white text-[8px] font-bold flex items-center justify-center">
                        PDF
                      </div>
                    </div>
                    <p className="text-xs text-brand-grey">Version 2.0 &bull; February 2026</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          9. NRI CONSULTATION FORM
         ═══════════════════════════════════════════════ */}
      <ConsultationForm />

      {/* ═══════════════════════════════════════════════
          10. EMOTIONAL CLOSE
         ═══════════════════════════════════════════════ */}
      <section className="section-padding gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-20 w-60 h-60 bg-brand-red/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto">
              <Heart className="w-8 h-8 text-brand-red mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
                Your Roots. Your Returns.<br />
                <span className="text-gradient">Your India Story Starts Here.</span>
              </h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                You left India to build a life. Now, invest back in the land that shaped you.
                Not with emotion alone — but with institutional-grade strategy, SEBI-regulated governance,
                and a team that speaks your language, in your timezone.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="#consultation" className="btn-primary">
                  Book NRI Consultation <Plane className="ml-2 w-4 h-4" />
                </Link>
                <button
                  onClick={openHandbook}
                  className="inline-flex items-center px-6 py-2.5 text-sm border-2 border-white/20 text-white font-bold rounded-lg hover:bg-white/10 transition-all"
                >
                  <BookOpen className="mr-2 w-4 h-4" /> Read NRI Handbook
                </button>
                <Link
                  href="/fund"
                  className="inline-flex items-center px-6 py-2.5 text-sm border-2 border-white/20 text-white font-bold rounded-lg hover:bg-white/10 transition-all"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back to Fund
                </Link>
              </div>
              <p className="text-[10px] text-gray-500 mt-8">
                GHL India Ventures Trust &bull; SEBI Cat II AIF &bull; Reg: {BRAND.sebi} &bull;
                Mutual fund investments are subject to market risks. Past performance is not indicative of future results.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}

// ================================================================
// COMPLIANCE ACCORDION
// ================================================================

function ComplianceAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  const items = [
    {
      title: 'FEMA Compliance',
      icon: <Scale className="w-5 h-5" />,
      content: [
        'NRIs can invest in Category II AIFs under the automatic route — no prior RBI approval required.',
        'Investment must be in Indian Rupees through NRO or NRE banking channels.',
        'Repatriation of returns is permitted under FEMA rules, subject to applicable TDS.',
        'The fund manager handles all RBI reporting obligations on behalf of NRI investors.',
        'NRIs from Pakistan and Bangladesh require prior RBI approval.',
      ],
    },
    {
      title: 'RBI Guidelines',
      icon: <Landmark className="w-5 h-5" />,
      content: [
        'NRE account investments are fully repatriable — both principal and returns.',
        'NRO account: up to USD 1 million repatriable per financial year under automatic route.',
        'Amounts exceeding USD 1M from NRO accounts require RBI approval.',
        'Investment through proper banking channels (SWIFT/NEFT) with proper documentation.',
        'Form 15CA/15CB required for outward remittance from India.',
      ],
    },
    {
      title: 'Taxation for NRIs',
      icon: <FileText className="w-5 h-5" />,
      content: [
        'Category II AIFs have pass-through status — income taxed in investors\' hands, not at fund level.',
        'LTCG on equity: 12.5% above ₹1.25L exemption (held >12 months).',
        'STCG on equity: 20% (held <12 months).',
        'DTAA treaties with 90+ countries prevent double taxation.',
        'TDS deducted at source on all distributions — refunds available via IT return.',
        'GHL provides tax computation statements and TDS certificates for DTAA claims.',
      ],
    },
    {
      title: 'KYC Requirements',
      icon: <Users className="w-5 h-5" />,
      content: [
        'Valid passport (all pages) — can be submitted digitally.',
        'Overseas address proof (utility bill, bank statement, or driving licence).',
        'Indian PAN card (Permanent Account Number).',
        'NRO/NRE bank account details with cancelled cheque.',
        'Recent passport-size photograph.',
        'FATCA/CRS self-certification form.',
        'Tax Residency Certificate (TRC) if claiming DTAA benefits.',
      ],
    },
    {
      title: 'Country-Specific Notes',
      icon: <Globe className="w-5 h-5" />,
      content: [
        'USA: Be aware of PFIC rules, FBAR filing, and Form 8938 requirements. India-US DTAA applies.',
        'UK: India-UK DTAA provides relief. Non-dom NRIs may benefit from remittance basis.',
        'UAE/GCC: No personal income tax — highly tax-efficient. Indian TDS still applies.',
        'Singapore: No capital gains tax — efficient for NRI India investments. Favourable DTAA.',
        'Canada/Australia: Comprehensive DTAA treaties. Report foreign income in home country returns.',
      ],
    },
  ]

  return (
    <section className="section-padding bg-white dark:bg-brand-black">
      <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="text-center mb-12">
            <p className="text-brand-red text-sm font-bold uppercase tracking-wider mb-2">Compliance & Tax</p>
            <h2 className="text-2xl md:text-3xl font-bold text-brand-black mb-4">
              NRI Regulatory Framework
            </h2>
            <p className="text-brand-grey max-w-2xl mx-auto">
              Complete transparency on FEMA, RBI, taxation, and KYC requirements.
              Our compliance desk handles the complexity — you focus on investing.
            </p>
          </div>
        </AnimatedSection>

        <div className="max-w-3xl mx-auto space-y-3">
          {items.map((item, idx) => (
            <AnimatedSection key={item.title} delay={idx * 50}>
              <div className="card rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-red/10 flex items-center justify-center text-brand-red shrink-0">
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-brand-black text-sm sm:text-base">{item.title}</h3>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-brand-grey transition-transform duration-300 shrink-0 ${openIdx === idx ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openIdx === idx ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-4 sm:px-5 pb-5 space-y-2">
                    {item.content.map((line, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-brand-grey leading-relaxed">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// ================================================================
// CONSULTATION FORM
// ================================================================

function ConsultationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    investmentRange: '',
    route: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    try {
      const { submitContactForm, submitLead } = await import('@/lib/supabase/reportsDataService')
      await Promise.all([
        submitContactForm({
          formType: 'nri_invest',
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
          city: formData.country,
          message: `Route: ${formData.route}\nInvestment Range: ${formData.investmentRange}\n\n${formData.message}`,
          investmentRange: formData.investmentRange,
          investmentInterest: 'nri-investment',
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
        submitLead({
          firstName: formData.name.split(' ')[0] || '',
          lastName: formData.name.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          phone: formData.phone,
          city: formData.country,
          source: 'website',
          investmentInterest: 'nri-investment',
          investmentRange: formData.investmentRange,
          message: formData.message,
        }),
      ])
    } catch (err) { console.warn('NRI form Supabase error:', err) }
  }

  return (
    <section id="consultation" className="section-padding bg-white dark:bg-brand-black">
      <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="text-center mb-12">
            <p className="text-brand-red text-sm font-bold uppercase tracking-wider mb-2">Get Started</p>
            <h2 className="text-2xl md:text-3xl font-bold text-brand-black mb-4">
              Book Your Free NRI Consultation
            </h2>
            <p className="text-brand-grey max-w-2xl mx-auto">
              Schedule a complimentary 30-minute video call with our NRI Advisory Team.
              Available in your timezone — IST, GST, EST, PST, or AEST.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className="max-w-2xl mx-auto">
            {submitted ? (
              <div className="card p-8 sm:p-12 rounded-2xl text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-brand-black mb-2">
                  Consultation Request Received
                </h3>
                <p className="text-sm text-brand-grey mb-6">
                  Our NRI Advisory Team will contact you within 24 hours to schedule
                  your complimentary video consultation. Check your email for confirmation.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <a
                    href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent('Hi, I just submitted an NRI consultation request on the website.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <Phone className="w-4 h-4" /> WhatsApp Us
                  </a>
                  <Link href="/fund" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-grey border border-brand-black/10 rounded-lg hover:bg-brand-black/5 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Fund
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="card p-6 sm:p-8 rounded-2xl space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-black mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field w-full"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-black mb-1.5">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field w-full"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-black mb-1.5">Phone (with country code) *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field w-full"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-black mb-1.5">Country of Residence *</label>
                    <select
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="">Select country</option>
                      <option value="UAE">UAE</option>
                      <option value="USA">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Oman">Oman</option>
                      <option value="Kuwait">Kuwait</option>
                      <option value="Qatar">Qatar</option>
                      <option value="Bahrain">Bahrain</option>
                      <option value="Germany">Germany</option>
                      <option value="Hong Kong">Hong Kong</option>
                      <option value="Malaysia">Malaysia</option>
                      <option value="New Zealand">New Zealand</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-black mb-1.5">Investment Range</label>
                    <select
                      value={formData.investmentRange}
                      onChange={(e) => setFormData({ ...formData, investmentRange: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="">Select range</option>
                      <option value="10L-50L">Contact for Co-Invest Details</option>
                      <option value="50L-1Cr">As per SEBI AIF Regulations</option>
                      <option value="1Cr-5Cr">Multiple Crores</option>
                      <option value="5Cr+">Large Allocation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-black mb-1.5">Preferred Route</label>
                    <select
                      value={formData.route}
                      onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="">Select route</option>
                      <option value="direct-aif">Direct AIF Route</option>
                      <option value="debenture">SEBI Co-Invest Framework</option>
                      <option value="unsure">Not sure yet — need guidance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-black mb-1.5">
                    Additional Notes <span className="text-brand-grey font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input-field w-full min-h-[100px] resize-y"
                    placeholder="Any specific questions or areas of interest..."
                  />
                </div>

                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                  <Plane className="w-4 h-4" />
                  Request NRI Consultation
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[10px] text-brand-grey/60 text-center">
                  By submitting, you agree to receive communications from GHL India Ventures.
                  Your information is protected and will never be shared with third parties.
                </p>
              </form>
            )}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
