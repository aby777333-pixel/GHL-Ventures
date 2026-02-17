'use client'

import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import { BRAND } from '@/lib/constants'
import {
  ArrowRight, Shield, TrendingUp, Target, CheckCircle, Users,
  BarChart3, Eye, FileText, Phone, Building2, Sparkles,
  ArrowLeft, Star
} from 'lucide-react'

export default function DirectAIFPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-16 gradient-dark overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-80 h-80 bg-brand-red/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-60 h-60 bg-brand-red/5 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-gray-400 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/fund" className="hover:text-white transition-colors">Fund</Link>
              <span className="mx-2">/</span>
              <span className="text-brand-red font-medium">Direct AIF Route</span>
            </nav>

            <div className="inline-flex items-center px-4 py-2 bg-brand-red/10 border border-brand-red/20 rounded-full mb-6">
              <Shield className="w-4 h-4 text-brand-red mr-2" />
              <span className="text-brand-red text-sm font-medium">SEBI Reg: {BRAND.sebi}</span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-5 leading-tight">
              Direct AIF Route<br />
              <span className="text-gradient">For HNIs & Family Offices</span>
            </h1>
            <p className="text-base text-gray-300 max-w-3xl leading-relaxed">
              Direct ownership in premium ventures through a SEBI-registered Category II Alternative Investment Fund.
              Access institutional-grade deal flow with full transparency, professional management, and target returns of 15–25% IRR.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/contact" className="btn-primary">
                Schedule a Meeting <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link href="/fund" className="inline-flex items-center px-6 py-2.5 text-sm border-2 border-white/20 text-white font-bold rounded-lg hover:bg-white/10 transition-all">
                <ArrowLeft className="mr-2 w-4 h-4" /> Back to Fund
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-10">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Overview</span>
            <h2 className="section-title mt-2 text-brand-black">Why Choose the Direct AIF Route?</h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Target, title: 'Target Returns', value: '15–25% IRR', desc: 'Institutional-grade returns through disciplined alternative investing' },
              { icon: Building2, title: 'Direct Ownership', value: 'Premium Assets', desc: 'Direct stake in stressed real estate & high-growth startups' },
              { icon: Eye, title: 'Full Transparency', value: 'Quarterly Reports', desc: 'Detailed NAV, portfolio updates & performance reporting' },
              { icon: Shield, title: 'SEBI Regulated', value: 'Category II AIF', desc: 'Regulated by SEBI with custodian, auditor & compliance' },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 100}>
                <div className="card text-center h-full group hover:-translate-y-1">
                  <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-red transition-all">
                    <item.icon className="w-6 h-6 text-brand-red group-hover:text-white transition-all" />
                  </div>
                  <div className="text-xl font-bold text-brand-red mb-1">{item.value}</div>
                  <h3 className="text-sm font-bold text-brand-black mb-2">{item.title}</h3>
                  <p className="text-xs text-brand-grey">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Details */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-10">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Details</span>
            <h2 className="section-title mt-2 text-brand-black">Fund Parameters</h2>
          </AnimatedSection>

          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="card overflow-hidden">
                <div className="grid sm:grid-cols-2 gap-0">
                  {[
                    { label: 'Minimum Investment', value: '₹1 Crore' },
                    { label: 'Fund Category', value: 'SEBI Category II AIF' },
                    { label: 'Investment Horizon', value: '5–7 Years' },
                    { label: 'Target IRR', value: '15–25%' },
                    { label: 'Fund Size Target', value: '₹500 Crore' },
                    { label: 'SEBI Registration', value: BRAND.sebi },
                    { label: 'Management Fee', value: '2% p.a.' },
                    { label: 'Performance Fee', value: '20% above hurdle' },
                  ].map((item, i) => (
                    <div key={item.label} className={`flex justify-between items-center px-5 py-3.5 ${
                      i % 2 === 0 ? 'bg-white' : 'bg-brand-offwhite/50'
                    } ${i < 6 ? 'border-b border-gray-100' : ''}`}>
                      <span className="text-sm text-brand-grey">{item.label}</span>
                      <span className="text-sm font-bold text-brand-black">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-10">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Benefits</span>
            <h2 className="section-title mt-2 text-brand-black">What You Get</h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Sparkles, title: 'Dual Investment Strategy', desc: 'Capital deployed across stressed real estate resolution and early-stage startup investments — two uncorrelated return streams in a single vehicle.' },
              { icon: Users, title: 'Exclusive Deal Flow', desc: 'Access institutional-grade opportunities sourced through our proprietary network of banks, NCLT listings, accelerators, and venture partners.' },
              { icon: BarChart3, title: 'Active Value Creation', desc: 'Hands-on project management for real estate, board participation for startups — we don\'t just invest capital, we create value.' },
              { icon: FileText, title: 'Complete Transparency', desc: 'Quarterly NAV updates, detailed portfolio reports, annual audited statements, and direct access to our investment team.' },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 100}>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-brand-red/10 rounded-lg flex items-center justify-center shrink-0 mt-1">
                    <item.icon className="w-5 h-5 text-brand-red" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-brand-black mb-2">{item.title}</h3>
                    <p className="text-sm text-brand-grey leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Who Is This For */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-10">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Eligibility</span>
            <h2 className="section-title mt-2 text-brand-black">Who Is This For?</h2>
          </AnimatedSection>

          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="card">
                <ul className="space-y-4">
                  {[
                    'High-Net-Worth Individuals (HNIs) with investable surplus of ₹1 Crore or more',
                    'Family Offices seeking diversified alternative asset exposure',
                    'Corporate treasuries looking for superior risk-adjusted returns',
                    'NRIs seeking regulated investment vehicles in Indian alternatives',
                    'Accredited investors who understand illiquidity and long-term value creation',
                  ].map((item) => (
                    <li key={item} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand-red mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm text-brand-black/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-brand-red text-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto relative z-10">
          <AnimatedSection>
            <Star className="w-10 h-10 text-white/80 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Ready to Invest Through the Direct AIF Route?
            </h2>
            <p className="text-white/80 text-base max-w-2xl mx-auto mb-6">
              Schedule a confidential meeting with our investment team to discuss your allocation,
              review our portfolio, and understand the opportunity.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 text-sm bg-white text-brand-red font-bold rounded-lg hover:bg-gray-100 transition-all shadow-lg"
              >
                Schedule Meeting <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                href="/downloads"
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm border-2 border-white/30 text-white font-bold rounded-lg hover:bg-white/10 transition-all"
              >
                Download Fund Documents
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
