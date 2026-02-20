'use client'

import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import { BRAND } from '@/lib/constants'
import {
  ArrowRight, Shield, TrendingUp, CheckCircle, Users,
  Wallet, Heart, Home, Briefcase, Clock,
  ArrowLeft, Star, IndianRupee, ShieldCheck, BarChart3
} from 'lucide-react'
import SpaceHero from '@/components/SpaceHero'
import FundCalculatorSection from '@/components/FundCalculatorSection'

export default function DebentureRoutePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-16 overflow-hidden gradient-dark">
        <SpaceHero variant="supernova" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-80 h-80 bg-brand-red/8 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-gray-400 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/fund" className="hover:text-white transition-colors">Fund</Link>
              <span className="mx-2">/</span>
              <span className="text-brand-red font-medium">Debenture Route</span>
            </nav>

            <div className="inline-flex items-center px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
              <Heart className="w-4 h-4 text-brand-red mr-2" />
              <span className="text-white/80 text-sm font-medium">Designed for Salaried Families</span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-5 leading-tight">
              Debenture Route<br />
              <span className="text-gradient">For Salaried Professionals</span>
            </h1>
            <p className="text-base text-gray-300 max-w-3xl leading-relaxed">
              Flexible investment starting at just ₹10 Lakhs. Build a steady alternative income stream for your family
              through structured debenture investments backed by GHL India Ventures&apos; dual asset strategy.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/contact" className="btn-primary">
                Start Investing <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link href="/fund" className="inline-flex items-center px-6 py-2.5 text-sm border-2 border-white/20 text-white font-bold rounded-lg hover:bg-white/10 transition-all">
                <ArrowLeft className="mr-2 w-4 h-4" /> Back to Fund
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="section-padding bg-white dark:bg-brand-black">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-10">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">At a Glance</span>
            <h2 className="section-title mt-2 text-brand-black">Why the Debenture Route?</h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: IndianRupee, title: 'Accessible Entry', value: '₹10 Lakhs', desc: 'Start with an amount that fits a salaried professional\'s savings' },
              { icon: TrendingUp, title: 'Structured Returns', value: 'Steady Income', desc: 'Pre-defined returns framework for predictable cash flows' },
              { icon: Heart, title: 'Family Focused', value: 'Sustenance', desc: 'Ideal for families seeking an alternative income stream' },
              { icon: ShieldCheck, title: 'Professionally Managed', value: 'Expert Team', desc: 'Your capital is managed by institutional-grade professionals' },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 100}>
                <div className={`card text-center h-full group hover:-translate-y-1 ${['glow-card-red','glow-card-blue','glow-card-violet','glow-card-amber'][i % 4]}`}>
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

      {/* How It Works */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-10">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Process</span>
            <h2 className="section-title mt-2 text-brand-black">How It Works</h2>
          </AnimatedSection>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Invest', desc: 'Start with a minimum of ₹10 Lakhs. Complete KYC and sign the debenture agreement with GHL India Ventures.' },
                { step: '02', title: 'We Deploy', desc: 'Your capital is professionally deployed into stressed real estate resolution and high-growth startup investments across India.' },
                { step: '03', title: 'You Earn', desc: 'Receive structured returns based on the pre-defined framework. Your family benefits from a steady alternative income stream.' },
              ].map((item, i) => (
                <AnimatedSection key={item.step} delay={i * 150}>
                  <div className={`card text-center h-full ${['glow-card-cyan','glow-card-emerald','glow-card-amber'][i % 3]}`}>
                    <div className="w-10 h-10 bg-brand-red text-white rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                      {item.step}
                    </div>
                    <h3 className="text-base font-bold text-brand-black mb-2">{item.title}</h3>
                    <p className="text-sm text-brand-grey leading-relaxed">{item.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Salaried Professionals */}
      <section className="section-padding bg-white dark:bg-brand-black">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-10">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Benefits</span>
            <h2 className="section-title mt-2 text-brand-black">Built for Working Families</h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Wallet, title: 'Alternative Income Stream', desc: 'Create a secondary income source that doesn\'t depend on your employer. Financial security beyond your salary.' },
              { icon: Clock, title: 'Zero Active Management', desc: 'No need to track markets, read charts, or make daily decisions. Our professional team handles everything.' },
              { icon: Briefcase, title: 'Career Freedom', desc: 'With alternative income flowing in, you can upskill, switch careers, or take entrepreneurial risks without financial fear.' },
              { icon: Home, title: 'Family Security', desc: 'Build a financial safety net for your family — protection against job loss, health emergencies, or economic downturns.' },
              { icon: BarChart3, title: 'Better Than FDs', desc: 'Structured returns that aim to meaningfully outperform traditional Fixed Deposits while maintaining a focus on capital safety.' },
              { icon: Users, title: 'Not Just for Crorepatis', desc: 'At ₹10 Lakhs, alternative investment exposure is now accessible to salaried professionals across India — not just ultra-HNIs.' },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 80}>
                <div className={`card flex gap-4 h-full ${['glow-card-red','glow-card-blue','glow-card-violet','glow-card-emerald','glow-card-amber','glow-card-cyan'][i % 6]}`}>
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

      {/* Calculator, Comparison & GHL Advantages */}
      <FundCalculatorSection mode="debenture" showComparison={true} showAdvantages={true} />

      {/* Comparison: Debenture vs FD */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-10">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Comparison</span>
            <h2 className="section-title mt-2 text-brand-black">Debenture Route vs Fixed Deposits</h2>
          </AnimatedSection>

          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="card overflow-hidden glow-card-blue">
                <div className="grid grid-cols-3 bg-brand-black text-white">
                  <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Parameter</div>
                  <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center">GHL Debenture</div>
                  <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center">Bank FD</div>
                </div>
                {[
                  { param: 'Minimum Investment', ghl: '₹10 Lakhs', fd: '₹1,000+' },
                  { param: 'Returns Potential', ghl: 'Higher*', fd: '6–7% p.a.' },
                  { param: 'Asset Backing', ghl: 'Real Estate + Startups', fd: 'Bank Guarantee' },
                  { param: 'Professional Management', ghl: '✓ Institutional-grade', fd: '✗ None' },
                  { param: 'Diversification Benefit', ghl: '✓ Alternative Assets', fd: '✗ Same Asset Class' },
                  { param: 'Tax Efficiency', ghl: 'Pass-through Structure', fd: 'Taxed as Income' },
                  { param: 'Liquidity', ghl: 'Lock-in Period', fd: 'Premature Withdrawal' },
                  { param: 'DICGC Insurance', ghl: '✗ Not applicable', fd: '✓ Up to ₹5 Lakhs' },
                ].map((row, i) => (
                  <div key={row.param} className={`grid grid-cols-3 ${i % 2 === 0 ? 'bg-white dark:bg-white/[0.03]' : 'bg-brand-offwhite/50 dark:bg-white/[0.06]'} border-b border-gray-100 dark:border-white/5 last:border-0`}>
                    <div className="px-4 py-3 text-xs font-medium text-brand-black">{row.param}</div>
                    <div className="px-4 py-3 text-xs text-center font-semibold text-brand-red">{row.ghl}</div>
                    <div className="px-4 py-3 text-xs text-center text-brand-grey">{row.fd}</div>
                  </div>
                ))}
                <div className="px-4 py-3 bg-gray-50 text-[10px] text-brand-grey">
                  *Returns are not guaranteed and depend on fund performance. Past performance is not indicative of future results. Investment in debentures involves risks including potential loss of capital.
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Who Is This For */}
      <section className="section-padding bg-white dark:bg-brand-black">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-10">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Ideal For</span>
            <h2 className="section-title mt-2 text-brand-black">Is the Debenture Route Right for You?</h2>
          </AnimatedSection>

          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="card glow-card-emerald">
                <ul className="space-y-4">
                  {[
                    'Salaried professionals (IT, banking, manufacturing, healthcare) seeking a financial safety net',
                    'Dual-income families looking to build an alternative income stream',
                    'First-time alternative investors who want professional fund management',
                    'Young professionals saving for long-term goals (children\'s education, retirement, home)',
                    'Anyone with ₹10 Lakhs+ savings who wants better returns than FDs without stock market volatility',
                    'Families concerned about job security in the age of AI and automation',
                  ].map((item) => (
                    <li key={item} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand-red mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm text-brand-black/80 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding text-center relative overflow-hidden gradient-dark">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-red/5 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto relative z-10">
          <AnimatedSection>
            <Heart className="w-10 h-10 text-brand-red mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Secure Your Family&apos;s Financial Future
            </h2>
            <p className="text-gray-400 text-base max-w-2xl mx-auto mb-6">
              Start with just ₹10 Lakhs. Build an alternative income stream that doesn&apos;t depend on your job.
              Your family&apos;s financial security starts with one smart decision.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/contact"
                className="btn-primary"
              >
                Get Started Today <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                href="/blog/afraid-of-losing-your-job-invest-for-security"
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm border-2 border-white/20 text-white font-bold rounded-lg hover:bg-white/10 transition-all"
              >
                Read: Why Salaried Professionals Should Invest
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
