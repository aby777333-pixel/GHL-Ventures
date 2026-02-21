'use client'

import { useState } from 'react'
import { ChevronDown, MessageCircle, ArrowRight, HelpCircle, BookOpen, Shield, BarChart3 } from 'lucide-react'
import SpaceHero from '@/components/SpaceHero'
import AnimatedSection from '@/components/AnimatedSection'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'

const FAQ_CATEGORIES = [
  {
    title: 'Getting Started',
    icon: HelpCircle,
    items: [
      {
        q: 'What is the minimum investment amount?',
        a: 'The minimum investment in GHL India Ventures\' Category II AIF is as per SEBI AIF Regulations. The investment can be drawn down in tranches over the commitment period, so the entire amount is not required upfront.',
      },
      {
        q: 'Who can invest in GHL India Ventures?',
        a: 'Our fund is open to Indian residents, NRIs, HUFs, trusts, corporate bodies, and other eligible entities as defined by SEBI. Each investor must meet the minimum commitment as per SEBI AIF Regulations and complete KYC documentation.',
      },
      {
        q: 'How do I start investing?',
        a: 'The process is simple: (1) Connect with our investment team via the Contact page or schedule a call, (2) Complete your KYC documentation and accreditation verification, (3) Sign the subscription agreement and commit your investment amount. Our team guides you through every step.',
      },
      {
        q: 'What documents are required for KYC?',
        a: 'Standard KYC documents include PAN card, Aadhaar card, address proof, bank statement (last 6 months), passport-size photograph, and a completed FATCA declaration. NRIs will need additional documentation including overseas address proof and NRE/NRO account details.',
      },
      {
        q: 'Is there a co-invest option for professionals?',
        a: 'Yes. We offer a SEBI Co-Invest Framework designed for salaried professionals. This provides exposure to similar underlying strategies with a structured investment framework. Contact our team for minimum investment details and eligibility.',
      },
      {
        q: 'Can NRIs invest in GHL India Ventures?',
        a: 'Yes, NRIs can invest in our Category II AIF. The investment must be made through an NRE or NRO account held with an Indian bank. Our compliance team assists with all necessary RBI and FEMA documentation.',
      },
    ],
  },
  {
    title: 'Fund Structure & Strategy',
    icon: BookOpen,
    items: [
      {
        q: 'What is GHL India Ventures\' investment strategy?',
        a: 'We follow a dual-strategy approach: (1) Stressed Real Estate Recovery — acquiring distressed residential and commercial real estate assets through NCLT/IBC processes at significant discounts, completing development, and selling at market value. (2) Early-Stage Venture Capital — investing in pre-seed to pre-Series A startups across fintech, healthtech, cleantech, and SaaS.',
      },
      {
        q: 'What is the fund tenure?',
        a: 'The base fund tenure is 7–10 years, with potential extensions of up to 2 years subject to investor consent. This allows adequate time for stressed real estate resolution cycles (typically 3–5 years) and startup exits (typically 5–7 years).',
      },
      {
        q: 'How does the drawdown schedule work?',
        a: 'Your committed capital is drawn down in tranches as investment opportunities are identified. Typically, 30-40% is called in the first year, with the remainder drawn over years 2-4. You will receive at least 10 business days notice before each drawdown.',
      },
      {
        q: 'What is the allocation between real estate and startups?',
        a: 'The target allocation is approximately 60-70% towards stressed real estate recovery and 30-40% towards early-stage startups. The Investment Committee may adjust these ranges based on market conditions and opportunity flow.',
      },
      {
        q: 'How is NAV calculated?',
        a: 'Net Asset Value is calculated quarterly by our independent fund administrator. Real estate assets are valued based on independent third-party valuations, while startup investments follow IPEV (International Private Equity and Venture Capital Valuation) guidelines.',
      },
    ],
  },
  {
    title: 'Risk & Returns',
    icon: BarChart3,
    items: [
      {
        q: 'What returns can I expect?',
        a: 'While past performance does not guarantee future results, our target gross IRR is 18-22% per annum across the blended portfolio. Stressed real estate assets historically offer 15-20% IRR, while successful startup exits can deliver significantly higher multiples.',
      },
      {
        q: 'How is risk managed?',
        a: 'Risk is managed through: (1) Rigorous due diligence — independent legal, financial, and market assessment for every deal, (2) Diversification across multiple assets and sectors, (3) Conservative leverage policy, (4) Active portfolio monitoring by the Investment Committee, (5) Independent custodian and fund administrator oversight.',
      },
      {
        q: 'Is my capital guaranteed?',
        a: 'No. As with all alternative investments, the capital invested in the AIF is not guaranteed and is subject to market and investment risks. However, our focus on distressed assets acquired at deep discounts provides a built-in margin of safety.',
      },
      {
        q: 'How are returns distributed?',
        a: 'Returns follow a waterfall distribution model: (1) Return of invested capital to investors, (2) Preferred return (hurdle rate) to investors, (3) Catch-up to the fund manager, (4) Carried interest split above the hurdle. Distributions are made as portfolio companies exit.',
      },
      {
        q: 'What happens if a portfolio company fails?',
        a: 'In the event of a startup failure, the invested amount in that specific company may be fully or partially lost. This risk is mitigated by portfolio diversification — we typically invest across 8-12 startups. For real estate, the underlying asset provides intrinsic value protection.',
      },
    ],
  },
  {
    title: 'Compliance & Taxation',
    icon: Shield,
    items: [
      {
        q: 'Is GHL India Ventures SEBI registered?',
        a: 'Yes. GHL India Ventures is a SEBI-registered Category II Alternative Investment Fund with registration number IN/AIF2/2425/1517. We adhere to all SEBI AIF regulations and reporting requirements.',
      },
      {
        q: 'How are AIF returns taxed?',
        a: 'Category II AIFs enjoy pass-through taxation — income is taxed in the hands of the investor, not at the fund level. Capital gains from real estate held for more than 24 months qualify for long-term capital gains treatment. Startup exits may qualify for Section 54F reinvestment benefits.',
      },
      {
        q: 'What reports will I receive?',
        a: 'Investors receive: (1) Quarterly NAV statements, (2) Semi-annual portfolio updates, (3) Annual audited financial statements, (4) Capital account statements for tax filing, (5) Ad-hoc updates on material portfolio events.',
      },
      {
        q: 'Who audits the fund?',
        a: 'The fund is audited by an independent ICAI-registered chartered accountancy firm. The fund administrator is also independent of the fund manager, ensuring transparent NAV computation and investor reporting.',
      },
    ],
  },
]

const glowColors = ['glow-card-red', 'glow-card-blue', 'glow-card-violet', 'glow-card-emerald', 'glow-card-amber', 'glow-card-cyan']

export default function FaqsPage() {
  const [openItems, setOpenItems] = useState<Record<string, number | null>>({})

  const toggleItem = (category: string, index: number) => {
    setOpenItems((prev) => ({
      ...prev,
      [category]: prev[category] === index ? null : index,
    }))
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden gradient-dark pt-40 pb-12">
        <SpaceHero variant="comet" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-black/50 pointer-events-none" />
        <div className="container-max mx-auto relative z-10 text-center">
          <AnimatedSection>
            <span className="eyebrow text-brand-red">Knowledge Base</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mt-3 mb-5">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              Comprehensive answers about investing with GHL India Ventures — from eligibility and KYC to fund structure, risk management, and taxation.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── FAQ Categories ── */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto">
          {FAQ_CATEGORIES.map((category, catIdx) => (
            <AnimatedSection key={category.title} delay={catIdx * 100} className="mb-12 last:mb-0">
              {/* Category header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-brand-red" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-brand-black">{category.title}</h2>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                {category.items.map((item, idx) => {
                  const isOpen = openItems[category.title] === idx
                  return (
                    <div
                      key={idx}
                      className={`border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden ${glowColors[(catIdx * 3 + idx) % 6]}`}
                    >
                      <button
                        onClick={() => toggleItem(category.title, idx)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <span className="font-semibold text-brand-black pr-4 text-sm md:text-base">{item.q}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-brand-grey shrink-0 transition-transform duration-300 ${
                            isOpen ? 'rotate-180 text-brand-red' : ''
                          }`}
                        />
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-5 pb-5">
                          <p className="text-brand-grey text-sm leading-relaxed">{item.a}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── Still have questions? CTA ── */}
      <section className="section-padding bg-brand-red">
        <div className="container-max mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Still Have Questions?</h2>
            <p className="text-white/80 text-base max-w-2xl mx-auto mb-8">
              Our investment advisory team is here to help. Reach out via phone, email, or WhatsApp for a personalised consultation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-3 bg-white text-brand-red font-bold text-sm rounded-lg hover:bg-gray-100 transition-all shadow-lg"
              >
                Contact Us <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a
                href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(BRAND.whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-3 bg-[#25D366] text-white font-bold text-sm rounded-lg hover:bg-[#20bd5a] transition-all shadow-lg"
              >
                <MessageCircle className="mr-2 w-5 h-5" /> WhatsApp Us
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
