'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  X, BookOpen, ChevronRight, ChevronLeft, Download, Mail,
  Globe, Shield, Building2, FileText, Users, TrendingUp,
  Banknote, Scale, AlertTriangle, Phone, CheckCircle,
  ArrowRight, Lock, MapPin, Clock, Sparkles
} from 'lucide-react'

// ================================================================
// NRI Investment Handbook — Full 15-Chapter Content
// ================================================================

interface Chapter {
  id: number
  title: string
  icon: ReactNode
  content: string[]
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: 'Welcome to India\'s Growth Story',
    icon: <Globe className="w-5 h-5" />,
    content: [
      'India\'s economic transformation is one of the most compelling investment narratives of the 21st century. With GDP growth consistently outpacing major economies, a young and aspirational demographic, and sweeping reforms in digital infrastructure, taxation, and capital markets, the country offers Non-Resident Indians a rare opportunity to participate in wealth creation at scale.',
      'For NRIs, investing in India is not just a financial decision — it is a connection to home, a legacy-building exercise, and a strategic diversification of global portfolios. Yet, despite the opportunity, many NRIs remain on the sidelines due to regulatory complexity, lack of trust in local intermediaries, or simply not knowing where to start.',
      'GHL India Ventures was created to bridge this gap. As a SEBI-registered Category II Alternative Investment Fund (Reg. No. IN/AIF2/2425/1517), we offer NRIs a fully compliant, institutional-grade pathway to invest in two of India\'s most asymmetric opportunity sets: stressed real estate recovery and early-stage startup investments.',
      'This handbook is your comprehensive guide to understanding how NRI investment works in India, what regulatory frameworks govern it, and how GHL India Ventures makes the process seamless, transparent, and rewarding.',
    ],
  },
  {
    id: 2,
    title: 'Why India? The Macroeconomic Case',
    icon: <TrendingUp className="w-5 h-5" />,
    content: [
      'India is projected to become the world\'s third-largest economy by 2027. The International Monetary Fund forecasts sustained GDP growth of 6.5–7% annually, driven by structural reforms, manufacturing incentives (PLI schemes), and a booming digital economy.',
      'Key growth drivers include: a domestic consumption engine powered by 1.4 billion people with rising incomes; a digital public infrastructure (UPI, Aadhaar, ONDC) that has no parallel globally; massive government spending on infrastructure — highways, metros, airports, and smart cities; and a startup ecosystem that is now the world\'s third largest by unicorn count.',
      'For NRI investors specifically, favourable currency dynamics (INR depreciation over decades) mean that returns earned in INR and converted back to USD, GBP, AED, or SGD can deliver significant purchasing power gains. India\'s real estate and startup sectors, in particular, offer risk-adjusted returns that are difficult to replicate in mature Western markets.',
      'The opportunity is structural, not cyclical. India\'s demographic dividend — with a median age of 28 and 65% of the population below 35 — ensures that consumption, housing demand, and entrepreneurial activity will continue to accelerate for the next two decades.',
    ],
  },
  {
    id: 3,
    title: 'Understanding AIFs for NRIs',
    icon: <Shield className="w-5 h-5" />,
    content: [
      'An Alternative Investment Fund (AIF) is a privately pooled investment vehicle registered with SEBI that collects funds from sophisticated investors for investing in accordance with a defined investment policy. Category II AIFs, like GHL India Ventures, invest in unlisted securities, real estate, private equity, and distressed assets.',
      'For NRIs, AIFs offer several advantages over direct investment: professional fund management with institutional-grade due diligence; SEBI-regulated structure ensuring transparency and investor protection; diversified portfolio across multiple assets rather than concentrated single-asset risk; clear governance framework with independent trustees, custodians, and auditors.',
      'The minimum investment in a Category II AIF is ₹1 Crore (approximately USD 120,000), as mandated by SEBI. GHL India Ventures also offers a Debenture Route starting at ₹10 Lakhs for NRIs who wish to start with a smaller commitment.',
      'NRIs from most countries can invest in Indian AIFs, subject to FEMA (Foreign Exchange Management Act) regulations and RBI guidelines. The fund accepts investments through NRO (Non-Resident Ordinary) and NRE (Non-Resident External) accounts held with Indian banks.',
    ],
  },
  {
    id: 4,
    title: 'FEMA & RBI Compliance Framework',
    icon: <Scale className="w-5 h-5" />,
    content: [
      'All NRI investments in India are governed by the Foreign Exchange Management Act (FEMA) 1999 and the Reserve Bank of India\'s (RBI) Master Directions on foreign investment. Understanding these regulations is essential for compliant and hassle-free investing.',
      'Key FEMA provisions for NRI AIF investment: NRIs can invest in Category II AIFs under the automatic route — no prior RBI approval is required. Investment can be made through NRO or NRE accounts in Indian Rupees. Repatriation of investment returns is permitted under FEMA rules, subject to applicable tax deductions (TDS). The fund manager handles all RBI reporting obligations on behalf of NRI investors.',
      'Important compliance points: NRIs from Pakistan and Bangladesh require prior RBI approval. Investments must be made in Indian Rupees through proper banking channels. KYC documentation includes passport, overseas address proof, PAN card, and bank account details. Tax residency certificates (TRC) may be required for treaty benefit claims.',
      'GHL India Ventures maintains a dedicated NRI compliance desk that assists investors with all regulatory documentation, FEMA filings, and tax compliance. Our compliance team has processed over 100 NRI investment applications across 15 countries.',
    ],
  },
  {
    id: 5,
    title: 'Investment Routes: AIF vs Debenture',
    icon: <Banknote className="w-5 h-5" />,
    content: [
      'GHL India Ventures offers two distinct investment pathways for NRIs, each designed for different risk appetites and investment sizes.',
      'Route 1 — Direct AIF (₹1 Crore minimum): This is the primary investment route through our SEBI-registered Category II AIF. Investors become unit holders in the fund and gain exposure to the entire portfolio of stressed real estate assets and startup investments. Benefits include: full portfolio diversification, SEBI regulatory protection, quarterly NAV reporting, target IRR of 18–25%, and a fund tenure of 7–10 years with provision for extensions.',
      'Route 2 — Debenture Route (₹10 Lakhs minimum): For NRIs who prefer a smaller entry point or fixed-income-like exposure, the Debenture Route involves investing through Non-Convertible Debentures (NCDs) issued by the fund\'s SPV entities. Benefits include: lower entry point, fixed coupon structure, asset-backed security, shorter tenures (3–5 years), and target returns of 14–18% per annum.',
      'Both routes are fully FEMA-compliant and can be funded through NRO or NRE accounts. The choice between routes depends on your investment horizon, risk tolerance, and desired portfolio allocation. Our advisory team provides personalised guidance to help NRIs select the optimal route.',
    ],
  },
  {
    id: 6,
    title: 'Stressed Real Estate: The Opportunity',
    icon: <Building2 className="w-5 h-5" />,
    content: [
      'India\'s stressed real estate market represents one of the most compelling deep-value investment opportunities globally. Estimates suggest that over ₹4 lakh crore worth of real estate projects across India are stalled or stressed, creating a massive pool of undervalued assets available for acquisition at significant discounts.',
      'GHL India Ventures specialises in acquiring stressed real estate assets through the NCLT (National Company Law Tribunal) resolution process under the Insolvency and Bankruptcy Code (IBC). These assets are typically acquired at 40–60% below replacement cost, providing a substantial margin of safety.',
      'Our investment process: identification of stressed assets through proprietary deal flow networks; deep legal, financial, and market due diligence; acquisition through NCLT resolution or direct negotiation; professional project management to complete construction and obtain occupancy certificates; exit through sales to end-users, institutional buyers, or portfolio transactions.',
      'For NRI investors, this strategy offers exposure to physical real estate in India without the operational headaches of direct property ownership — no tenant management, no maintenance, no regulatory paperwork. The fund handles everything, and investors receive returns proportional to their commitment.',
    ],
  },
  {
    id: 7,
    title: 'Startup Investments: Early-Stage Growth',
    icon: <Sparkles className="w-5 h-5" />,
    content: [
      'India\'s startup ecosystem has matured remarkably over the past decade. With over 100 unicorns, a thriving angel investor community, and deep pools of venture capital, India is now the world\'s third-largest startup ecosystem by company count.',
      'GHL India Ventures allocates a portion of the fund to early-stage startup investments (seed to pre-Series A) across sectors including fintech, healthtech, SaaS, cleantech, and agritech. This allocation provides NRI investors with exposure to high-growth opportunities that can deliver outsized returns.',
      'Our startup investment approach: rigorous 7-layer due diligence covering team, market, product, unit economics, governance, competitive moat, and exit potential; sector-focused approach in areas where India has structural advantages; active portfolio support through mentorship, introductions, and follow-on funding; target portfolio of 8–12 startup investments for diversification.',
      'For NRIs working in global technology hubs like Silicon Valley, Singapore, or London, investing in Indian startups through GHL offers a way to participate in India\'s innovation economy while leveraging the fund\'s on-ground expertise for deal sourcing and portfolio management.',
    ],
  },
  {
    id: 8,
    title: 'NRI Taxation Guide',
    icon: <FileText className="w-5 h-5" />,
    content: [
      'Taxation is one of the most critical considerations for NRI investors. India has a comprehensive tax framework for non-resident investors, and understanding it is essential for optimising post-tax returns.',
      'Key tax provisions: Category II AIFs have pass-through status, meaning income earned by the fund is taxed in the hands of investors, not at the fund level. Capital gains on equity-oriented investments held for more than 12 months are taxed as Long-Term Capital Gains (LTCG) at 12.5% above ₹1.25 lakh exemption. Short-term capital gains on equity are taxed at 20%. Interest income and other gains are taxed at applicable slab rates (maximum 30% for NRIs).',
      'Double Taxation Avoidance Agreements (DTAA): India has DTAA treaties with over 90 countries. NRIs can claim relief under the applicable DTAA to avoid being taxed twice on the same income. Common treaty partners include the USA, UK, UAE, Singapore, Canada, and Australia. GHL India Ventures provides tax computation statements and TDS certificates to help NRI investors claim DTAA benefits in their country of residence.',
      'Withholding Tax (TDS): The fund deducts TDS on all distributions to NRI investors as per applicable rates. NRIs can file Indian income tax returns to claim refunds if excess TDS has been deducted. Our tax advisory partners assist NRI investors with return filing and refund processing.',
    ],
  },
  {
    id: 9,
    title: 'Repatriation of Funds',
    icon: <Globe className="w-5 h-5" />,
    content: [
      'One of the primary concerns for NRI investors is the ability to repatriate investment returns and principal back to their country of residence. India\'s FEMA framework provides clear guidelines for repatriation.',
      'NRE Account investments: Investments made through NRE accounts are fully repatriable — both principal and returns can be freely transferred abroad in foreign currency. No RBI approval is required for repatriation of NRE-sourced investments.',
      'NRO Account investments: Investments made through NRO accounts are repatriable up to USD 1 million per financial year under the automatic route. Amounts exceeding USD 1 million require RBI approval. Repatriation is subject to applicable Indian tax deductions.',
      'GHL India Ventures assists NRI investors with: proper routing of investment through NRO/NRE accounts for optimal repatriation flexibility; documentation for bank remittance (Form 15CA/15CB); coordination with authorised dealer banks for smooth fund transfers; tax clearance certificates required for large repatriations. We recommend NRIs planning significant investments consult with both Indian and overseas tax advisors to structure their investment for maximum repatriation efficiency.',
    ],
  },
  {
    id: 10,
    title: 'KYC & Onboarding Process',
    icon: <Users className="w-5 h-5" />,
    content: [
      'GHL India Ventures has streamlined the NRI onboarding process to be as frictionless as possible. The entire process can be completed remotely without requiring a visit to India.',
      'Step 1 — Initial Consultation: Schedule a video call with our NRI Advisory Team. We understand your investment objectives, risk tolerance, and preferred route (AIF or Debenture). This consultation is complimentary and non-binding.',
      'Step 2 — KYC Documentation: Submit the following documents digitally: valid passport (all pages); overseas proof of address (utility bill, bank statement, or driving licence); PAN card (Indian Permanent Account Number); NRO/NRE bank account details; recent passport-size photograph; FATCA/CRS self-certification form; tax residency certificate (if applicable for DTAA benefits).',
      'Step 3 — Agreement Execution: Review and digitally sign the subscription agreement and contribution agreement. All documents are prepared by our legal team and can be executed electronically using Aadhaar e-sign or digital signature certificates. Step 4 — Fund Transfer: Transfer the investment amount from your NRO/NRE account to the fund\'s designated bank account. Step 5 — Confirmation: Receive unit allotment confirmation and welcome kit within 7 business days of fund receipt.',
    ],
  },
  {
    id: 11,
    title: 'Governance & Investor Protection',
    icon: <Shield className="w-5 h-5" />,
    content: [
      'Investor protection is the foundation of GHL India Ventures\' operating philosophy. Our governance framework exceeds SEBI\'s minimum requirements and is designed to give NRI investors the confidence that comes from institutional-grade oversight.',
      'Governance structure: SEBI-registered AIF with mandatory compliance reporting; independent trustee overseeing fund operations; SEBI-approved custodian safeguarding investor assets; annual statutory audit by a Big-4 affiliated firm; quarterly NAV computation and investor reporting; investment committee with independent members.',
      'Investor rights: quarterly portfolio reports with detailed asset-level performance; annual audited financial statements; right to attend annual investor meetings (virtual attendance available for NRIs); ability to raise grievances through SEBI\'s SCORES platform; transparent fee structure with no hidden charges.',
      'Communication: dedicated NRI relationship manager for each investor; monthly market update newsletters; quarterly investor calls with the fund management team; secure investor portal with 24/7 access to portfolio information. Our commitment is simple: your money, our expertise, complete transparency.',
    ],
  },
  {
    id: 12,
    title: 'Country-Specific Guidance',
    icon: <MapPin className="w-5 h-5" />,
    content: [
      'NRI investment regulations and tax implications vary significantly by country of residence. Here is a brief guide for the most common NRI corridors.',
      'United States: US-resident NRIs must be aware of PFIC (Passive Foreign Investment Company) rules, FBAR (Foreign Bank Account Report) requirements, and Form 8938 reporting for foreign financial assets exceeding thresholds. The India-US DTAA provides relief on dividend and interest income. Consult a US CPA familiar with Indian investments.',
      'United Kingdom: UK-resident NRIs benefit from the India-UK DTAA. Capital gains on Indian investments may be subject to UK CGT depending on domicile status. Non-domiciled NRIs may benefit from the remittance basis of taxation. Singapore: Singapore has no capital gains tax, making it an efficient jurisdiction for NRI investment in India. The India-Singapore DTAA is favourable for dividend and interest income.',
      'UAE/GCC: The UAE has no personal income tax, making it highly tax-efficient for NRI investors. However, NRIs must ensure proper documentation of tax residency status. Indian tax (TDS) will still apply on Indian-sourced income. Canada & Australia: Both have comprehensive DTAA treaties with India. NRIs should be aware of foreign income reporting requirements in both jurisdictions.',
    ],
  },
  {
    id: 13,
    title: 'Risk Factors & Disclosures',
    icon: <AlertTriangle className="w-5 h-5" />,
    content: [
      'All investments carry risk, and it is important for NRI investors to understand the specific risks associated with AIF investments in India.',
      'Market risks: Real estate market fluctuations can impact asset valuations. Startup investments are inherently high-risk with potential for total loss. Currency risk — INR depreciation against the investor\'s home currency can reduce effective returns, while appreciation can enhance them.',
      'Regulatory risks: Changes in FEMA regulations, RBI guidelines, or Indian tax laws could impact investment returns or repatriation. SEBI regulatory changes may affect fund operations. Government policy changes in real estate or startup sectors could impact specific investments.',
      'Operational risks: Stressed real estate projects may face delays in resolution or construction. Startup companies may fail to achieve projected milestones. Liquidity risk — AIF investments are locked in for the fund tenure and cannot be easily liquidated. Past performance is not indicative of future results. GHL India Ventures provides detailed risk disclosures in the Private Placement Memorandum (PPM), which all investors must review before committing capital.',
    ],
  },
  {
    id: 14,
    title: 'Frequently Asked Questions',
    icon: <BookOpen className="w-5 h-5" />,
    content: [
      'Can NRIs from any country invest? NRIs and PIOs (Persons of Indian Origin) from most countries can invest. Citizens of Pakistan and Bangladesh require prior RBI approval. Citizens of countries under UN sanctions cannot invest.',
      'Do I need to visit India for onboarding? No. The entire process — consultation, KYC, agreement signing, and fund transfer — can be completed remotely. We support Aadhaar e-sign and digital signature certificates for document execution.',
      'What happens to my investment if I return to India? If you become a resident Indian during the fund tenure, your investment continues as-is. However, the tax treatment will change to resident Indian rates. You should inform the fund and your tax advisor of the status change.',
      'Can I invest jointly with my spouse? Yes, joint investments are permitted where both parties complete KYC. The primary holder must be an NRI. How are returns distributed? Returns are distributed after each asset exit, following a waterfall structure: return of capital first, then preferred return, then profit sharing. Interim distributions may occur from rental income or coupon payments (Debenture Route).',
    ],
  },
  {
    id: 15,
    title: 'Getting Started — Next Steps',
    icon: <Phone className="w-5 h-5" />,
    content: [
      'You are now equipped with the knowledge to make an informed decision about investing in India through GHL India Ventures. Here are your next steps.',
      'Step 1 — Book a Free NRI Consultation: Schedule a 30-minute video call with our NRI Advisory Team. We\'ll discuss your investment goals, risk tolerance, preferred route, and answer any specific questions. Available in your timezone — we operate across IST, GST, EST, PST, and AEST.',
      'Step 2 — Receive a Personalised Investment Proposal: Based on our consultation, we\'ll prepare a customised investment proposal outlining the recommended route, expected returns, tax implications specific to your country of residence, and a detailed timeline.',
      'Step 3 — Begin Your Investment Journey: Complete KYC, sign agreements digitally, transfer funds, and begin receiving quarterly updates on your portfolio. Welcome to the GHL India Ventures family. Contact us: Phone: +91 44 2843 1043 | +91 7200 255 252 | Email: nri@ghlindiaventures.com | WhatsApp: +91 7200 255 252',
    ],
  },
]

// ================================================================
// Context + Provider
// ================================================================

interface NRIHandbookContextType {
  openHandbook: () => void
}

const NRIHandbookContext = createContext<NRIHandbookContextType>({ openHandbook: () => {} })

export function useNRIHandbook() {
  return useContext(NRIHandbookContext)
}

export function NRIHandbookProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openHandbook = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <NRIHandbookContext.Provider value={{ openHandbook }}>
      {children}
      {isOpen && <NRIHandbookModal onClose={close} />}
    </NRIHandbookContext.Provider>
  )
}

// ================================================================
// Modal Component
// ================================================================

function NRIHandbookModal({ onClose }: { onClose: () => void }) {
  const [currentChapter, setCurrentChapter] = useState(0)
  const [showEmailCapture, setShowEmailCapture] = useState(true)
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [showTOC, setShowTOC] = useState(true)

  // Check if user previously submitted email
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ghl-nri-handbook-email')
      if (saved) {
        setEmailSubmitted(true)
        setShowEmailCapture(false)
      }
    } catch {}
  }, [])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // ESC to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    try {
      localStorage.setItem('ghl-nri-handbook-email', email)
    } catch {}
    setEmailSubmitted(true)
    setShowEmailCapture(false)
  }

  const chapter = CHAPTERS[currentChapter]

  // Email capture gate
  if (showEmailCapture && !emailSubmitted) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* Email capture card */}
        <div className="relative w-full max-w-md bg-brand-offwhite rounded-2xl border border-brand-black/10 shadow-2xl p-8 animate-[fadeInUp_0.3s_ease-out]">
          <button onClick={onClose} className="absolute top-4 right-4 text-brand-grey hover:text-brand-black transition-colors">
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-red/10 mb-4">
              <BookOpen className="w-8 h-8 text-brand-red" />
            </div>
            <h3 className="text-xl font-bold text-brand-black mb-2">NRI Investment Handbook</h3>
            <p className="text-sm text-brand-grey">
              15 chapters covering everything NRIs need to know about investing in India through GHL India Ventures.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {[
              'FEMA & RBI compliance framework',
              'AIF vs Debenture route comparison',
              'Country-specific tax guidance',
              'Step-by-step onboarding process',
            ].map((item) => (
              <div key={item} className="flex items-center text-sm text-brand-grey">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-grey" />
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
            <button
              type="submit"
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Read Handbook
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[10px] text-brand-grey/60 text-center mt-3">
            By submitting, you agree to receive communications from GHL India Ventures.
            We respect your privacy and will never spam.
          </p>
        </div>
      </div>
    )
  }

  // Main handbook reader
  return (
    <div className="fixed inset-0 z-[9999] flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Main container */}
      <div className="relative w-full max-w-5xl mx-auto my-4 sm:my-8 flex flex-col bg-brand-offwhite rounded-2xl border border-brand-black/10 shadow-2xl overflow-hidden animate-[fadeInUp_0.3s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-brand-black/10 bg-brand-offwhite/95 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-brand-red" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-black">NRI Investment Handbook</h2>
              <p className="text-[10px] text-brand-grey">Chapter {currentChapter + 1} of {CHAPTERS.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTOC(!showTOC)}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-[10px] font-medium rounded-lg border border-brand-black/10 text-brand-grey hover:text-brand-black hover:bg-brand-black/5 transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              Contents
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-brand-grey hover:text-brand-black hover:bg-brand-black/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Table of Contents — sidebar */}
          {showTOC && (
            <div className="hidden sm:block w-64 border-r border-brand-black/10 overflow-y-auto shrink-0 bg-brand-black/[0.02]">
              <div className="p-3">
                <p className="text-[9px] uppercase font-bold tracking-wider text-brand-grey/60 mb-2 px-2">Chapters</p>
                {CHAPTERS.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => setCurrentChapter(idx)}
                    className={`w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg text-[11px] transition-all mb-0.5 ${
                      idx === currentChapter
                        ? 'bg-brand-red/10 text-brand-red font-semibold'
                        : 'text-brand-grey hover:text-brand-black hover:bg-brand-black/5'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[9px] font-bold bg-brand-black/5">
                      {ch.id}
                    </span>
                    <span className="line-clamp-2 leading-tight">{ch.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chapter content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
              {/* Chapter heading */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center text-brand-red shrink-0">
                  {chapter.icon}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-brand-red">
                    Chapter {chapter.id}
                  </p>
                  <h3 className="text-lg sm:text-xl font-bold text-brand-black leading-tight">
                    {chapter.title}
                  </h3>
                </div>
              </div>

              {/* Content paragraphs */}
              <div className="space-y-4">
                {chapter.content.map((para, idx) => (
                  <p key={idx} className="text-sm leading-relaxed text-brand-grey">
                    {para}
                  </p>
                ))}
              </div>

              {/* Navigation buttons at bottom */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-brand-black/10">
                <button
                  onClick={() => setCurrentChapter(Math.max(0, currentChapter - 1))}
                  disabled={currentChapter === 0}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    currentChapter === 0
                      ? 'text-brand-grey/30 cursor-not-allowed'
                      : 'text-brand-grey hover:text-brand-black'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-[10px] text-brand-grey/50">
                  {currentChapter + 1} / {CHAPTERS.length}
                </span>

                <button
                  onClick={() => setCurrentChapter(Math.min(CHAPTERS.length - 1, currentChapter + 1))}
                  disabled={currentChapter === CHAPTERS.length - 1}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    currentChapter === CHAPTERS.length - 1
                      ? 'text-brand-grey/30 cursor-not-allowed'
                      : 'text-brand-red hover:text-brand-red/80'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar at bottom */}
        <div className="h-1 bg-brand-black/5 shrink-0">
          <div
            className="h-full bg-brand-red transition-all duration-300"
            style={{ width: `${((currentChapter + 1) / CHAPTERS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default NRIHandbookModal
