'use client'

/* ============================================================
   Investor Tools (Find Your Ideal Investment Route)
   ------------------------------------------------------------
   Self-contained section — owns its own modal state + renders.
   Extracted 2026-05-10 so the /about page can host this block
   in place of the leadership team grid (and the home page can
   drop it cleanly to host that team grid instead).

   Contains:
     - 6 tool cards (Risk Quiz, Calculator, All Investments
       Comparison, Wealth Growth Map, Tax Impact Analyzer,
       Inflation-Proof Check)
     - the 6 modals these cards open
   ============================================================ */

import { useState } from 'react'
import { Sparkles, Calculator, Scale, Target, IndianRupee, TrendingUp, ArrowRight } from 'lucide-react'
import AnimatedSection from '@/components/AnimatedSection'
import RiskAssessmentQuiz from '@/components/RiskAssessmentQuiz'
import InvestmentCalculator from '@/components/InvestmentCalculator'
import AllInvestmentsCalculator from '@/components/AllInvestmentsCalculator'
import WealthGrowthMap from '@/components/WealthGrowthMap'
import TaxImpactAnalyzer from '@/components/TaxImpactAnalyzer'
import InflationProofChecker from '@/components/InflationProofChecker'

export default function InvestorToolsSection() {
  const [quizOpen, setQuizOpen] = useState(false)
  const [calcOpen, setCalcOpen] = useState(false)
  const [allCalcOpen, setAllCalcOpen] = useState(false)
  const [wealthMapOpen, setWealthMapOpen] = useState(false)
  const [taxAnalyzerOpen, setTaxAnalyzerOpen] = useState(false)
  const [inflationCheckOpen, setInflationCheckOpen] = useState(false)

  return (
    <>
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
              <div className="card-glass text-center p-7 hover:bg-white/10 transition-all cursor-pointer group flex flex-col w-full" onClick={() => setQuizOpen(true)}>
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
              <div className="card-glass text-center p-7 hover:bg-white/10 transition-all cursor-pointer group flex flex-col w-full" onClick={() => setCalcOpen(true)}>
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

            {/* All Investments Comparison */}
            <AnimatedSection delay={300} className="flex">
              <div className="card-glass text-center p-7 hover:bg-white/10 transition-all cursor-pointer group flex flex-col w-full ring-1 ring-brand-red/20" onClick={() => setAllCalcOpen(true)}>
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
              <div className="card-glass text-center p-7 hover:bg-white/10 transition-all cursor-pointer group flex flex-col w-full" onClick={() => setWealthMapOpen(true)}>
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
              <div className="card-glass text-center p-7 hover:bg-white/10 transition-all cursor-pointer group flex flex-col w-full" onClick={() => setTaxAnalyzerOpen(true)}>
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
              <div className="card-glass text-center p-7 hover:bg-white/10 transition-all cursor-pointer group flex flex-col w-full" onClick={() => setInflationCheckOpen(true)}>
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

      {/* Modals — bound to the section's local state so the calculator
          system is fully self-contained and can drop into any page. */}
      <RiskAssessmentQuiz isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
      <InvestmentCalculator isOpen={calcOpen} onClose={() => setCalcOpen(false)} />
      <AllInvestmentsCalculator isOpen={allCalcOpen} onClose={() => setAllCalcOpen(false)} />
      <WealthGrowthMap isOpen={wealthMapOpen} onClose={() => setWealthMapOpen(false)} />
      <TaxImpactAnalyzer isOpen={taxAnalyzerOpen} onClose={() => setTaxAnalyzerOpen(false)} />
      <InflationProofChecker isOpen={inflationCheckOpen} onClose={() => setInflationCheckOpen(false)} />
    </>
  )
}
