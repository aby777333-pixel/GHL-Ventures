'use client'

import { Shield, AlertTriangle } from 'lucide-react'
import AnimatedSection from '@/components/AnimatedSection'
import { BRAND } from '@/lib/constants'
import SpaceHero from '@/components/SpaceHero'

export default function DisclaimerPage() {
  return (
    <section className="relative min-h-screen py-32 md:py-40 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Space: Lightning theme */}
      <SpaceHero variant="lightning" />
      <div className="max-w-4xl mx-auto relative z-10">
        <AnimatedSection>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">Disclaimer</h1>
              <p className="text-gray-400 text-sm">GHL India Ventures Private Limited</p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
            <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 border-l-[3px] border-l-amber-500/30">
              <p className="font-semibold text-amber-400 mb-2">Investment Risk Warning</p>
              <p>
                Investments in Alternative Investment Funds (AIFs) and Non-Convertible Debentures (NCDs) are subject to market risks, including the possible loss of the principal amount invested. Past performance is not indicative of future results. Returns are not guaranteed.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.03] border-l-[3px] border-l-blue-500/30">
              <p className="font-semibold text-white mb-2">SEBI Registration</p>
              <p>
                GHL India Ventures is registered with the Securities and Exchange Board of India (SEBI) as a Category II Alternative Investment Fund under Registration Number {BRAND.sebi}. SEBI registration does not imply endorsement of the fund, its strategies, or guarantee of returns.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.03] border-l-[3px] border-l-violet-500/30">
              <p className="font-semibold text-white mb-2">Not an Offer or Solicitation</p>
              <p>
                The information on this website does not constitute an offer, invitation, or solicitation to invest in the fund. It is intended for general informational purposes only and should not be construed as investment advice, tax advice, or legal advice. Prospective investors are advised to consult their own financial, legal, and tax advisors before making any investment decisions.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.03] border-l-[3px] border-l-emerald-500/30">
              <p className="font-semibold text-white mb-2">Private Placement Memorandum</p>
              <p>
                All investments in GHL India Ventures are subject to the terms and conditions set forth in the Private Placement Memorandum (PPM). Prospective investors must read the PPM and all scheme-related documents carefully before making any investment decisions. The PPM is available upon request to qualified investors who meet the minimum eligibility criteria.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.03] border-l-[3px] border-l-red-500/30">
              <p className="font-semibold text-white mb-2">Minimum Investment</p>
              <p>
                As mandated by SEBI, the minimum investment for Category II AIFs is &#8377;1 Crore (INR Ten Million). The Debenture Route (Non-Convertible Debentures) requires a minimum investment of &#8377;10 Lakhs (INR One Million). These are distinct investment products with different risk profiles, return structures, and regulatory frameworks.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.03] border-l-[3px] border-l-cyan-500/30">
              <p className="font-semibold text-white mb-2">Forward-Looking Statements</p>
              <p>
                This website may contain forward-looking statements based on current expectations and projections about future events. These statements involve known and unknown risks, uncertainties, and other factors that may cause actual results to differ materially from those expressed or implied. GHL India Ventures undertakes no obligation to update these statements.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.03] border-l-[3px] border-l-orange-500/30">
              <p className="font-semibold text-white mb-2">Third-Party Content</p>
              <p>
                Market data, news feeds, and financial information displayed on this website are sourced from third-party providers and are provided for informational purposes only. GHL India Ventures does not guarantee the accuracy, completeness, or timeliness of such information and is not responsible for any errors or omissions.
              </p>
            </div>

            <div className="flex items-start gap-3 pt-4 border-t border-white/10">
              <Shield className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">
                <strong className="text-gray-400">SEBI Registration No. {BRAND.sebi}</strong> | Category II Alternative Investment Fund | GHL India Ventures Private Limited, 2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai 600008, Tamil Nadu, India.
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
