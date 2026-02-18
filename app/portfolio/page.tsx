'use client'

import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import PlaceholderImage from '@/components/PlaceholderImage'
import {
  Building2,
  ArrowRight,
  TrendingUp,
  Target,
  MapPin,
  ExternalLink,
  Lightbulb,
  Users,
  Network,
  Settings,
  Cpu,
  HeartPulse,
  Landmark,
  Calendar,
} from 'lucide-react'
import { useState } from 'react'
import SpaceHero from '@/components/SpaceHero'

/* ─── Portfolio Data ─── */

type PortfolioStatus = 'Active' | 'Exited' | 'Pipeline'
type PortfolioSector = 'Real Estate' | 'Startups'

interface PortfolioCompany {
  name: string
  tagline: string
  sector: PortfolioSector
  type: string
  city: string
  description: string
  investmentYear: number
  status: PortfolioStatus
  icon: React.ElementType
}

const PORTFOLIO: PortfolioCompany[] = [
  // Real Estate
  {
    name: 'Egmore Heights',
    tagline: 'Premium residential revival in the heart of Chennai',
    sector: 'Real Estate',
    type: 'Stressed RE',
    city: 'Chennai',
    description: 'Distressed residential tower project acquired and restructured. Construction restart, new approvals obtained, and sales relaunch executed under GHL oversight.',
    investmentYear: 2024,
    status: 'Active',
    icon: Building2,
  },
  {
    name: 'Velachery Commercial Hub',
    tagline: 'Grade-A office space repositioning',
    sector: 'Real Estate',
    type: 'Stressed RE',
    city: 'Chennai',
    description: 'Stalled commercial office complex in Velachery. Restructured developer debt, secured occupancy certificates, and initiated tenant fit-outs for IT/ITES occupiers.',
    investmentYear: 2024,
    status: 'Active',
    icon: Building2,
  },
  {
    name: 'Coimbatore Township',
    tagline: 'Integrated township on the outskirts of Coimbatore',
    sector: 'Real Estate',
    type: 'Stressed RE',
    city: 'Coimbatore',
    description: 'Mixed-use township project with residential plots and commercial zones. Resolved RERA compliance issues and relaunched phased development.',
    investmentYear: 2025,
    status: 'Pipeline',
    icon: Building2,
  },
  // Startups
  {
    name: 'TechVista Solutions',
    tagline: 'AI-powered enterprise supply chain SaaS',
    sector: 'Startups',
    type: 'SaaS',
    city: 'Chennai',
    description: 'Enterprise software platform leveraging AI for supply chain optimization. Serving 40+ mid-market and enterprise clients across India and SEA.',
    investmentYear: 2023,
    status: 'Active',
    icon: Cpu,
  },
  {
    name: 'MedConnect Health',
    tagline: 'Rural telemedicine for Bharat',
    sector: 'Startups',
    type: 'HealthTech',
    city: 'Bangalore',
    description: 'Digital health platform connecting rural communities to specialist doctors through telemedicine kiosks and an AI triage engine.',
    investmentYear: 2023,
    status: 'Active',
    icon: HeartPulse,
  },
  {
    name: 'FinEdge Capital',
    tagline: 'Next-gen MSME lending platform',
    sector: 'Startups',
    type: 'Fintech',
    city: 'Mumbai',
    description: 'Technology-driven lending platform providing collateral-free working capital to SMEs and MSMEs with sub-24-hour disbursement.',
    investmentYear: 2022,
    status: 'Exited',
    icon: Landmark,
  },
]

const FILTER_TABS = ['All', 'Real Estate', 'Startups', 'Exited'] as const

function getStatusColor(status: PortfolioStatus) {
  switch (status) {
    case 'Active':
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
    case 'Exited':
      return 'bg-blue-500/10 text-blue-700 border-blue-500/20'
    case 'Pipeline':
      return 'bg-amber-500/10 text-amber-700 border-amber-500/20'
  }
}

function getCardGradient(sector: PortfolioSector) {
  return sector === 'Real Estate'
    ? 'from-amber-500/15 to-orange-500/10'
    : 'from-violet-500/15 to-purple-500/10'
}

export default function PortfolioPage() {
  const [activeFilter, setActiveFilter] = useState<string>('All')

  const filtered = PORTFOLIO.filter((c) => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Exited') return c.status === 'Exited'
    return c.sector === activeFilter
  })

  return (
    <>
      {/* Hero */}
      <section className="pt-40 pb-20 gradient-dark relative overflow-hidden">
        {/* Space: Satellite theme */}
        <SpaceHero variant="satellite" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-brand-red/3 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <span className="inline-flex items-center px-4 py-1.5 bg-brand-red/10 border border-brand-red/20 rounded-full text-brand-red text-sm font-semibold uppercase tracking-wider mb-6">
              <Target className="w-4 h-4 mr-2" />
              Our Investments
            </span>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-4 mb-5 leading-tight">
              Where We&apos;ve Placed Our{' '}
              <span className="text-gradient">Conviction</span>
            </h1>
            <p className="text-base text-gray-300 max-w-3xl leading-relaxed">
              A focused portfolio spanning stressed real estate resolution and high-growth startup
              investments across India&apos;s most dynamic markets.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Portfolio Stats */}
      <section className="bg-white section-padding pb-8">
        <div className="container-max mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '6', label: 'Portfolio Companies' },
              { value: '4', label: 'Cities' },
              { value: '₹200Cr+', label: 'Capital Deployed' },
              { value: '1', label: 'Successful Exit' },
            ].map((stat, i) => (
              <AnimatedSection key={stat.label} delay={i * 100}>
                <div className="text-2xl md:text-3xl font-bold text-brand-red mb-1">{stat.value}</div>
                <div className="text-brand-grey text-sm">{stat.label}</div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="bg-white border-b border-gray-200 sticky top-20 z-30">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === tab
                    ? 'bg-brand-red text-white shadow-lg shadow-brand-red/25'
                    : 'bg-gray-100 text-brand-grey hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 text-brand-grey/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-brand-black mb-2">No investments match this filter</h3>
              <p className="text-brand-grey">Try selecting a different category.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((company, i) => {
                const statusColor = getStatusColor(company.status)

                return (
                  <AnimatedSection key={company.name} delay={i * 100}>
                    <div className="card group hover:-translate-y-2 h-full flex flex-col">
                      {/* Image placeholder */}
                      <div className="relative mb-5">
                        <PlaceholderImage
                          theme={company.sector === 'Real Estate' ? 'real-estate' : 'startup'}
                          aspectRatio="aspect-[16/10]"
                          label={company.name}
                          className="rounded-xl"
                        />
                        {/* Status badge */}
                        <span
                          className={`absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full border ${statusColor} z-10`}
                        >
                          {company.status}
                        </span>
                      </div>

                      {/* Name + tagline */}
                      <h3 className="font-bold text-xl text-brand-black mb-1 group-hover:text-brand-red transition-colors">
                        {company.name}
                      </h3>
                      <p className="text-brand-grey text-sm italic mb-3">{company.tagline}</p>

                      {/* Tag pills */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2.5 py-0.5 bg-brand-red/10 text-brand-red text-xs font-semibold rounded-full">
                          {company.sector}
                        </span>
                        <span className="px-2.5 py-0.5 bg-gray-100 text-brand-grey text-xs font-medium rounded-full flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {company.city}
                        </span>
                        <span className="px-2.5 py-0.5 bg-gray-100 text-brand-grey text-xs font-medium rounded-full">
                          {company.type}
                        </span>
                      </div>

                      {/* Description (2 lines) */}
                      <p className="text-brand-grey text-sm mb-4 line-clamp-2 leading-relaxed">
                        {company.description}
                      </p>

                      {/* Investment year + View Details */}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                        <span className="text-xs text-brand-grey flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1.5" />
                          Invested {company.investmentYear}
                        </span>
                        <button className="text-brand-red text-sm font-semibold flex items-center group/btn hover:underline cursor-pointer">
                          View Details
                          <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </AnimatedSection>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* How We Add Value */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-10">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Our Edge</span>
            <h2 className="section-title text-brand-black mt-2">How We Add Value</h2>
            <p className="section-subtitle mx-auto mt-4">
              Beyond capital, we bring hands-on expertise and an extensive network to every investment.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Lightbulb,
                title: 'Strategic Guidance',
                desc: 'We work closely with founders and developers to refine go-to-market strategy, product-market fit, and growth roadmaps.',
                gradient: 'from-amber-500/10 to-yellow-500/5',
              },
              {
                icon: Users,
                title: 'Board Governance',
                desc: 'Active board participation ensuring disciplined execution, financial accountability, and alignment with investor interests.',
                gradient: 'from-blue-500/10 to-cyan-500/5',
              },
              {
                icon: Network,
                title: 'Network Access',
                desc: 'Introductions to strategic partners, enterprise clients, distribution channels, and top-tier talent across our ecosystem.',
                gradient: 'from-violet-500/10 to-purple-500/5',
              },
              {
                icon: Settings,
                title: 'Operational Support',
                desc: 'Process optimization, compliance frameworks, and operational excellence programs to accelerate scaling.',
                gradient: 'from-emerald-500/10 to-green-500/5',
              },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 100}>
                <div className="card group hover:-translate-y-2 h-full text-center">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform`}
                  >
                    <item.icon className="w-8 h-8 text-brand-red" />
                  </div>
                  <h3 className="font-bold text-lg text-brand-black mb-3">{item.title}</h3>
                  <p className="text-brand-grey text-sm leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-brand-red text-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto relative z-10">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Are You a Founder? Have a Distressed Asset?
            </h2>
            <p className="text-white/80 text-base max-w-2xl mx-auto mb-6">
              Whether you&apos;re building a high-growth startup or hold a stressed real estate asset,
              we&apos;d love to explore how we can partner together.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 text-sm bg-white text-brand-red font-bold rounded-lg hover:bg-gray-100 transition-all shadow-lg"
              >
                Get In Touch <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/fund"
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm border-2 border-white/30 text-white font-bold rounded-lg hover:bg-white/10 transition-all"
              >
                Learn About Our Fund <ExternalLink className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
