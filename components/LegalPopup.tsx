'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { X, FileText, Shield, Scale, CheckCircle } from 'lucide-react'

// ── Legal content types ──
export type LegalDocType = 'privacy' | 'terms' | 'disclaimer'

interface LegalPopupContextValue {
  openLegal: (type: LegalDocType) => void
}

const LegalPopupContext = createContext<LegalPopupContextValue>({ openLegal: () => {} })
export const useLegalPopup = () => useContext(LegalPopupContext)

// ── Document metadata ──
const DOC_META: Record<LegalDocType, { title: string; icon: typeof FileText }> = {
  privacy: { title: 'Privacy Policy', icon: Shield },
  terms: { title: 'Terms & Conditions', icon: Scale },
  disclaimer: { title: 'Disclaimer', icon: FileText },
}

// ── Provider + Modal ──
export function LegalPopupProvider({ children }: { children: React.ReactNode }) {
  const [activeDoc, setActiveDoc] = useState<LegalDocType | null>(null)
  const [atBottom, setAtBottom] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const openLegal = useCallback((type: LegalDocType) => {
    setActiveDoc(type)
    setAtBottom(false)
  }, [])

  const close = useCallback(() => {
    setActiveDoc(null)
    setAtBottom(false)
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeDoc) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [activeDoc])

  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [close])

  // Detect scroll to bottom
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const threshold = 40
    if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
      setAtBottom(true)
    }
  }

  const meta = activeDoc ? DOC_META[activeDoc] : null
  const IconComp = meta?.icon || FileText

  return (
    <LegalPopupContext.Provider value={{ openLegal }}>
      {children}

      {/* ── Modal Overlay ── */}
      <div
        className={`fixed inset-0 z-[9999] transition-all duration-300 ${
          activeDoc ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={close}
        />

        {/* Modal Panel */}
        <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
          <div
            className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col transition-all duration-300 ${
              activeDoc ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
            }`}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center">
                  <IconComp className="w-5 h-5 text-brand-red" />
                </div>
                <div>
                  <h2 className="font-bold text-brand-black text-lg">{meta?.title}</h2>
                  <p className="text-xs text-brand-grey">GHL India Ventures Trust</p>
                </div>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-brand-grey" />
              </button>
            </div>

            {/* ── Scrollable Content ── */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-6 py-6 legal-content"
            >
              {activeDoc === 'privacy' && <PrivacyContent />}
              {activeDoc === 'terms' && <TermsContent />}
              {activeDoc === 'disclaimer' && <DisclaimerContent />}
            </div>

            {/* ── Footer with Accept & Close ── */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 shrink-0 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center gap-2">
                {!atBottom && (
                  <p className="text-xs text-brand-grey animate-pulse">↓ Scroll down to read the full document</p>
                )}
                {atBottom && (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">You have reached the end of the document</span>
                  </div>
                )}
              </div>
              <button
                onClick={close}
                disabled={!atBottom}
                className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  atBottom
                    ? 'bg-brand-red text-white hover:bg-red-700 shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Accept &amp; Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </LegalPopupContext.Provider>
  )
}

// ── Clickable Legal Link Component ──
export function LegalLink({
  type,
  children,
  className = '',
}: {
  type: LegalDocType
  children: React.ReactNode
  className?: string
}) {
  const { openLegal } = useLegalPopup()
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLegal(type) }}
      className={`cursor-pointer ${className}`}
      type="button"
    >
      {children}
    </button>
  )
}

// ════════════════════════════════════════════════════════════════
// LEGAL CONTENT COMPONENTS
// ════════════════════════════════════════════════════════════════

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-bold text-brand-black mt-6 mb-2">{children}</h3>
}

function Para({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-brand-grey leading-relaxed mb-3">{children}</p>
}

function DocHeader({ date }: { date: string }) {
  return (
    <div className="bg-brand-offwhite rounded-xl p-4 mb-6 border border-gray-100">
      <p className="text-xs text-brand-grey font-medium">GHL India Ventures Trust</p>
      <p className="text-xs text-brand-grey">{date}</p>
      <p className="text-xs text-brand-grey mt-1">SEBI Registration No. IN/AIF2/2425/1517</p>
    </div>
  )
}

// ── Privacy Policy Content ──
function PrivacyContent() {
  return (
    <>
      <DocHeader date="Effective Date: 1 January 2026 | Last Updated: 20 February 2026 | Version: 1.0" />

      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-xs text-brand-grey">
        <p className="font-semibold text-brand-black mb-2">Table of Contents</p>
        <div className="grid grid-cols-2 gap-1">
          <span>1. Introduction</span><span>8. Cookies &amp; Tracking Technologies</span>
          <span>2. Information We Collect</span><span>9. Your Rights</span>
          <span>3. How We Use Your Information</span><span>10. Children&apos;s Privacy</span>
          <span>4. Legal Basis for Processing</span><span>11. International Data Transfers</span>
          <span>5. Information Sharing &amp; Disclosure</span><span>12. Changes to This Policy</span>
          <span>6. Data Security</span><span>13. Grievance Redressal &amp; Contact</span>
          <span>7. Data Retention</span><span>&nbsp;</span>
        </div>
      </div>

      <SectionTitle>1. Introduction</SectionTitle>
      <Para>GHL India Ventures Trust (&ldquo;GHL,&rdquo; &ldquo;We,&rdquo; &ldquo;Us,&rdquo; &ldquo;Company&rdquo;) is committed to protecting the privacy and security of personal information entrusted to us by our website visitors, registered users, prospective investors, and existing investors.</Para>
      <Para>This Privacy Policy explains how we collect, use, store, disclose, and protect your personal information when you access or use our website (ghlindiaventures.com), investor portal, interactive tools, and related services (collectively, the &ldquo;Platform&rdquo;).</Para>
      <Para>This Privacy Policy is published in compliance with the Information Technology Act, 2000; the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011; the Digital Personal Data Protection Act, 2023 (to the extent notified and applicable); and applicable SEBI regulations governing data handling by Alternative Investment Funds.</Para>
      <Para>By accessing or using the Platform, you consent to the collection, use, and processing of your information as described in this Privacy Policy. If you do not agree with this policy, please do not use the platform.</Para>

      <SectionTitle>2. Information We Collect</SectionTitle>
      <Para><strong>2.1 Information You Provide Directly:</strong> Registration Data (full name, email address, phone number, city, and investment amount range); KYC Information (PAN number, Aadhaar, date of birth, address proof, bank account details, source of funds declaration, occupation, net worth declaration, and photographs); Investment Information (commitments, transaction history, drawdown requests, distribution records); Identity Verification (government-issued identity documents, signature specimens, and beneficial ownership declarations); Communication Data (messages, inquiries, feedback sent via the Platform, email, phone, or WhatsApp); and Professional Information (company name, designation, industry, and professional qualifications).</Para>
      <Para><strong>2.2 Information Collected Automatically:</strong> Device Information (IP address, browser type and version, operating system, device identifiers, screen resolution); Usage Data (pages visited, time spent on pages, click patterns, referral sources, navigation paths); Log Data (server logs, access times, error logs, session identifiers); Location Data (approximate geographic location derived from your IP address); and Cookies &amp; Similar Technologies (see Section 8).</Para>
      <Para><strong>2.3 Information from Third Parties:</strong> KYC Verification Services (identity and address verification from NSDL, CDSL, CKYC registry); Regulatory Databases (PEP screening, sanctions screening, and AML databases); Payment Processors (transaction confirmation and payment status from banking partners); and Analytics Providers (aggregated website analytics and usage patterns).</Para>

      <SectionTitle>3. How We Use Your Information</SectionTitle>
      <Para><strong>3.1 Core Services:</strong> Processing and managing your account registration and authentication; conducting mandatory KYC verification and investor eligibility assessment; processing investment commitments, drawdowns, distributions, and related transactions; providing access to the Investor Portal, portfolio dashboard, and document repository; and generating quarterly reports, NAV statements, tax certificates, and investor communications.</Para>
      <Para><strong>3.2 Communication:</strong> Sending fund updates, market insights, performance reports, and important announcements; responding to your inquiries, feedback, and support requests; and providing educational content, newsletters, and thought leadership (with your consent).</Para>
      <Para><strong>3.3 Legal &amp; Regulatory Compliance:</strong> Complying with SEBI reporting obligations; meeting AML and CTF obligations under PMLA; responding to lawful requests from regulatory authorities; conducting internal audits and compliance reviews; and fulfilling tax reporting obligations under the Income Tax Act, 1961.</Para>
      <Para><strong>3.4 Platform Improvement:</strong> Analyzing usage patterns to improve functionality; detecting and preventing fraud and unauthorized access; and conducting research and analytics to enhance our services.</Para>

      <SectionTitle>4. Legal Basis for Processing</SectionTitle>
      <Para>We process your personal information on the following legal bases: Contractual Necessity (processing necessary to perform our obligations under the Terms of Service, subscription agreements, or the PPM); Legal Obligation (processing required to comply with SEBI regulations, PMLA, the Income Tax Act, FEMA, and other applicable laws); Consent (processing based on your explicit consent, which you may withdraw at any time); and Legitimate Interest (processing necessary for fraud prevention, platform security, and service improvement).</Para>

      <SectionTitle>5. Information Sharing &amp; Disclosure</SectionTitle>
      <Para>GHL India Ventures does not sell, rent, or trade your personal information to third parties for marketing purposes. We may share your information only in the following circumstances:</Para>
      <Para><strong>Regulatory Authorities:</strong> SEBI, RBI, Income Tax Department, Financial Intelligence Unit (FIU-IND), and other regulatory or law enforcement agencies, as required by law.</Para>
      <Para><strong>Fund Service Providers:</strong> Custodians, auditors, legal advisors, registrar and transfer agents, and fund administrators who require access to perform services on behalf of the fund.</Para>
      <Para><strong>KYC Agencies:</strong> NSDL, CDSL, CKYC registry, and authorized intermediaries for identity verification and compliance purposes.</Para>
      <Para><strong>Technology Partners:</strong> Cloud hosting providers, analytics services, and cybersecurity firms who process data on our behalf under strict confidentiality agreements.</Para>
      <Para><strong>Banking &amp; Payment Partners:</strong> Banks and payment processors for executing transactions related to your investments.</Para>
      <Para><strong>Legal Proceedings:</strong> When required by law, court order, subpoena, or other legal process.</Para>
      <Para><strong>Business Transfers:</strong> In connection with a merger, acquisition, reorganisation, or sale of assets, your information may be transferred to the successor entity, subject to the same privacy protections.</Para>
      <Para>All third-party service providers are contractually obligated to maintain the confidentiality and security of your information.</Para>

      <SectionTitle>6. Data Security</SectionTitle>
      <Para>We implement industry-standard technical and organizational security measures to protect your personal information, including: 256-bit SSL/TLS encryption for all data in transit and AES-256 encryption for sensitive data at rest; role-based access controls, multi-factor authentication for administrative access, and the principle of least privilege; firewalls, intrusion detection systems, regular vulnerability assessments, and penetration testing; continuous security monitoring, automated threat detection, and incident response procedures; regular data protection and security awareness training for all personnel; and secure office premises with access controls and CCTV surveillance.</Para>
      <Para><strong>IMPORTANT:</strong> While we implement robust security measures, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your information. You are responsible for maintaining the confidentiality of your account credentials.</Para>

      <SectionTitle>7. Data Retention</SectionTitle>
      <Para>We retain your personal information for the following periods: Active Investors&mdash;for the duration of your investment relationship plus a minimum of 8 years from the date of the last transaction; KYC Records&mdash;minimum 5 years from the date of cessation of the investor relationship, as mandated under PMLA; Prospective Investors&mdash;for up to 3 years from the date of your last interaction; Website Visitors&mdash;analytics and cookie data retained for up to 2 years; and Tax Records&mdash;as required under the Income Tax Act, 1961 (typically 8 years).</Para>
      <Para>Upon expiry of the applicable retention period, personal information will be securely deleted or anonymised in accordance with our data disposal procedures.</Para>

      <SectionTitle>8. Cookies &amp; Tracking Technologies</SectionTitle>
      <Para><strong>8.1 Essential Cookies:</strong> Required for the basic operation of the Platform, including user authentication, session management, security, and load balancing. These cannot be disabled without affecting platform functionality.</Para>
      <Para><strong>8.2 Analytics Cookies:</strong> Help us understand how visitors interact with the platform by collecting anonymous usage data. You can opt out of analytics cookies through your browser settings.</Para>
      <Para><strong>8.3 Functional Cookies:</strong> Remember your preferences (such as language, region, or display settings) to provide a personalized experience.</Para>
      <Para><strong>8.4 Managing Cookies:</strong> You can manage cookie preferences through your browser settings. Most browsers allow you to block or delete cookies. However, disabling essential cookies may impair your ability to use certain features of the Platform.</Para>

      <SectionTitle>9. Your Rights</SectionTitle>
      <Para>Subject to applicable law and regulatory requirements, you have the following rights: Right of Access (request a copy of the personal information we hold about you); Right to Correction (request correction of inaccurate or incomplete personal information); Right to Erasure (request deletion, subject to legal and regulatory retention obligations); Right to Withdraw Consent (where processing is based on consent); Right to Grievance Redressal (lodge a complaint with our Grievance Officer or the relevant Data Protection Authority); and Right to Nomination (as an investor, nominate a person to receive your investment in the event of your death).</Para>
      <Para>To exercise any of these rights, please contact our Grievance Officer at info@ghlindiaventures.com. We will respond within 30 days.</Para>

      <SectionTitle>10. Children&apos;s Privacy</SectionTitle>
      <Para>The Platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18 years of age. If we become aware that we have inadvertently collected such information, we will take steps to delete it promptly. If you are a parent or guardian and believe your child has provided personal information to us, please contact us immediately at info@ghlindiaventures.com.</Para>

      <SectionTitle>11. International Data Transfers</SectionTitle>
      <Para>Your personal information is primarily stored and processed in India. In certain circumstances, your data may be transferred to jurisdictions outside India&mdash;for example, where we use cloud infrastructure or technology service providers located in other countries. Where such transfers occur, we ensure that appropriate safeguards are in place, including contractual data processing agreements. For NRI investors, data may also be processed in accordance with the regulations of your country of residence, including applicable DTAA provisions.</Para>

      <SectionTitle>12. Changes to This Policy</SectionTitle>
      <Para>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or regulatory guidance. Changes will be effective upon posting the updated policy on the platform with a revised &ldquo;Last Updated&rdquo; date. For material changes, we will provide notice to registered users via email or a prominent notice on the Platform.</Para>

      <SectionTitle>13. Grievance Redressal &amp; Contact</SectionTitle>
      <Para>In accordance with the Information Technology Act, 2000 and applicable SEBI regulations, GHL India Ventures has appointed a Grievance Officer to address your concerns regarding data privacy:</Para>
      <Para>Grievance Officer, GHL India Ventures Trust, 2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai, Tamil Nadu &ndash; 600 008, India.</Para>
      <Para>Email: info@ghlindiaventures.com | Phone: +91 44 2843 1043 | +91 7200 255 252 | Office Hours: Monday to Saturday, 10:00 AM to 6:00 PM IST.</Para>
      <Para>We will acknowledge receipt of your privacy-related grievance within 48 hours and endeavor to resolve it within thirty (30) business days. If you are not satisfied with our response, you may escalate your complaint to the relevant Data Protection Authority or approach SEBI through the SCORES portal (scores.gov.in) for investment-related grievances.</Para>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <Para>SEBI Registration No. IN/AIF2/2425/1517 | Category II Alternative Investment Fund. This Privacy Policy governs data handling practices of GHL India Ventures Trust. For investment-related terms, please refer to our Terms of Service and the Private Placement Memorandum.</Para>
        <Para>&copy; 2026 GHL India Ventures Trust. All Rights Reserved.</Para>
      </div>
    </>
  )
}

// ── Terms of Service Content ──
function TermsContent() {
  return (
    <>
      <DocHeader date="Effective Date: 1 January 2026 | Last Updated: 20 February 2026 | Version: 1.0" />

      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-xs text-brand-grey">
        <p className="font-semibold text-brand-black mb-2">Table of Contents</p>
        <div className="grid grid-cols-2 gap-1">
          <span>1. Acceptance of Terms</span><span>9. Prohibited Conduct</span>
          <span>2. About GHL India Ventures</span><span>10. Third-Party Links &amp; Content</span>
          <span>3. Eligibility &amp; Registration</span><span>11. Limitation of Liability</span>
          <span>4. Account Responsibilities</span><span>12. Indemnification</span>
          <span>5. Investor Portal Services</span><span>13. Termination &amp; Suspension</span>
          <span>6. Investment Disclaimers</span><span>14. Modifications to Terms</span>
          <span>7. KYC &amp; Regulatory Compliance</span><span>15. Governing Law &amp; Jurisdiction</span>
          <span>8. Intellectual Property</span><span>16. Grievance Redressal &amp; Contact</span>
        </div>
      </div>

      <SectionTitle>1. Acceptance of Terms</SectionTitle>
      <Para>By accessing, browsing, or using the GHL India Ventures website (ghlindiaventures.com), including its investor portal, interactive tools, downloadable materials, and any associated services (collectively, the &ldquo;Platform&rdquo;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;).</Para>
      <Para>If you do not agree to these terms, you must immediately discontinue use of the platform. Your continued access to or use of the Platform after any modifications to these Terms constitutes your acceptance of the revised Terms.</Para>
      <Para>These Terms constitute a legally binding agreement between you (&ldquo;User,&rdquo; &ldquo;You&rdquo;) and GHL India Ventures Trust (&ldquo;GHL,&rdquo; &ldquo;We,&rdquo; &ldquo;Us,&rdquo; &ldquo;Company&rdquo;).</Para>

      <SectionTitle>2. About GHL India Ventures</SectionTitle>
      <Para>GHL India Ventures Trust is a SEBI-registered Category II Alternative Investment Fund, registered under the Securities and Exchange Board of India (Alternative Investment Funds) Regulations, 2012, bearing Registration Number IN/AIF2/2425/1517.</Para>
      <Para>Registered Office: 2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai, Tamil Nadu &ndash; 600 008, India.</Para>
      <Para>The company specializes in stressed real estate special situations and early-stage venture capital investments. Nothing on this Platform shall be construed as the Company operating in any capacity beyond its SEBI-registered mandate.</Para>

      <SectionTitle>3. Eligibility &amp; Registration</SectionTitle>
      <Para><strong>3.1 General Access:</strong> The informational sections of this platform are available to all visitors. However, certain features&mdash;including the Investor Portal, document downloads, portfolio tracking, and interactive investment tools&mdash;require account registration.</Para>
      <Para><strong>3.2 Account Registration Requirements:</strong> To create an account on the Platform, you represent and warrant that: you are at least 18 years of age and possess the legal capacity to enter into binding agreements under applicable Indian law; all information provided during registration is accurate, current, and complete; you will promptly update your registration information to maintain its accuracy; and if registering on behalf of an entity (company, trust, family office, or partnership), you have the authority to bind that entity to these Terms.</Para>
      <Para><strong>3.3 Investment Eligibility:</strong> Access to certain sections of the Platform, including fund-related documentation and performance data, may be restricted to individuals or entities who qualify as eligible investors under SEBI (Alternative Investment Funds) Regulations, 2012. By accessing such restricted content, you confirm that you meet the applicable eligibility criteria, including but not limited to minimum investment thresholds prescribed by SEBI.</Para>
      <Para><strong>IMPORTANT:</strong> Account creation on this platform does not constitute an investment, commitment, or subscription to any fund or scheme managed by GHL India Ventures. Investments can only be made pursuant to the Private Placement Memorandum (PPM) and applicable scheme documents, after completing mandatory KYC verification.</Para>

      <SectionTitle>4. Account Responsibilities</SectionTitle>
      <Para>You are solely responsible for: maintaining the confidentiality of your login credentials, including your email, password, and any multi-factor authentication details; all activities that occur under your account, whether or not authorized by you; and immediately notifying GHL India Ventures at info@ghlindiaventures.com or +91 7200 255 252 of any unauthorized use of your account or any other breach of security.</Para>
      <Para>GHL India Ventures shall not be liable for any loss or damage arising from your failure to safeguard your account credentials. We reserve the right to suspend or terminate accounts that we reasonably believe have been compromised or are being used in violation of these Terms.</Para>

      <SectionTitle>5. Investor Portal Services</SectionTitle>
      <Para>The GHL India Ventures Investor Portal provides registered users with access to the following services (subject to eligibility and KYC verification):</Para>
      <ul className="list-disc pl-6 mb-3 space-y-1 text-sm text-brand-grey">
        <li><strong>Portfolio Dashboard:</strong> View your committed capital, drawn-down amounts, current NAV, and distribution history.</li>
        <li><strong>Document Repository:</strong> Access fund-related documents, including the PPM, scheme information, quarterly reports, audited financials, and tax statements.</li>
        <li><strong>Interactive Tools:</strong> Risk assessment quizzes, investment calculators, wealth growth projections, and comparison tools for educational purposes.</li>
        <li><strong>Communication Center:</strong> Receive updates, fund announcements, and direct communication from the GHL advisory team.</li>
        <li><strong>Transaction Requests:</strong> Submit drawdown requests, redemption inquiries, and other transaction-related communications.</li>
      </ul>
      <Para>All data displayed on the Investor Portal is for informational purposes and is updated periodically. NAV and portfolio values shown may not reflect real-time valuations. Definitive portfolio information is provided in official quarterly statements issued by the fund&apos;s custodian and auditor.</Para>

      <SectionTitle>6. Investment Disclaimers</SectionTitle>
      <Para><strong>6.1 No Investment Advice:</strong> The content on this Platform&mdash;including articles, blog posts, tools, calculators, market commentary, and educational materials&mdash;is provided for general informational and educational purposes only. Nothing on this platform constitutes investment advice, financial advice, tax advice, legal advice, or a recommendation to buy, sell, or hold any investment.</Para>
      <Para><strong>6.2 No Offer or Solicitation:</strong> Nothing on this platform constitutes an offer, invitation, or solicitation to invest in any fund, scheme, security, or financial instrument managed or recommended by GHL India Ventures. Any investment in the fund can only be made pursuant to the Private Placement Memorandum (PPM) and applicable scheme documents provided directly by the Company.</Para>
      <Para><strong>6.3 Risk Disclosure:</strong> Investments in Alternative Investment Funds (AIFs), Non-Convertible Debentures (NCDs), and other alternative assets are subject to significant risks, including but not limited to: possible loss of the entire principal amount invested; illiquidity risk; market risk, credit risk, interest rate risk, and concentration risk; regulatory and legal risk specific to the Indian and international markets; and risks specific to stressed and distressed assets, including litigation, construction delays, and regulatory clearances.</Para>
      <Para>Past performance is not indicative of future results. The value of investments and the income from them can fall as well as rise. There is no guarantee that the investment objectives of any fund or scheme will be achieved.</Para>
      <Para><strong>6.4 Projections &amp; Simulations:</strong> Any projections, forecasts, target returns, or simulations displayed on this Platform (including through our interactive tools and calculators) are hypothetical in nature and are provided solely for illustrative purposes. They do not represent actual returns and should not be relied upon for making investment decisions. Actual outcomes may differ materially from projected outcomes.</Para>

      <SectionTitle>7. KYC &amp; Regulatory Compliance</SectionTitle>
      <Para>GHL India Ventures is committed to full compliance with all applicable regulatory requirements, including but not limited to: SEBI (Alternative Investment Funds) Regulations, 2012; Prevention of Money Laundering Act, 2002 (PMLA) and associated rules; SEBI KYC (Know Your Client) Requirements for securities markets; Foreign Exchange Management Act, 1999 (FEMA) for NRI and foreign investors; and Income Tax Act, 1961 and associated reporting obligations.</Para>
      <Para>By creating an account or engaging with investment-related services, you agree to provide all requested KYC documentation and further authorize GHL India Ventures to verify such information with relevant authorities and third-party service providers.</Para>
      <Para>GHL India Ventures reserves the right to refuse, suspend, or terminate access to services where KYC or compliance requirements are not satisfactorily met.</Para>

      <SectionTitle>8. Intellectual Property</SectionTitle>
      <Para>All content on this platform&mdash;including but not limited to text, graphics, logos, icons, images, audio clips, video content, data compilations, software, design elements, and interactive tools&mdash;is the exclusive property of GHL India Ventures Trust or its licensors and is protected by Indian and international intellectual property laws.</Para>
      <Para>You are granted a limited, non-exclusive, non-transferable, revocable licence to access and use the Platform for personal, non-commercial purposes. You shall not reproduce, distribute, modify, or create derivative works from any Platform content without prior written consent; use any data mining, scraping, or automated tools; remove or alter any copyright, trademark, or proprietary notices; or use the GHL India Ventures name, logo, or branding for any purpose without prior written authorization.</Para>

      <SectionTitle>9. Prohibited Conduct</SectionTitle>
      <Para>When using the Platform, you agree not to: provide false, misleading, or fraudulent information during registration or KYC processes; impersonate any person or entity; attempt to gain unauthorized access to any part of the Platform; introduce viruses, malware, or any other harmful technology; use the Platform for any activity that violates applicable laws; share your account credentials with third parties; use the platform&apos;s content for competing commercial purposes; or engage in activities that could disrupt the functioning of the Platform.</Para>

      <SectionTitle>10. Third-Party Links &amp; Content</SectionTitle>
      <Para>The Platform may contain links to third-party websites, services, or content. These links are provided for convenience and informational purposes only. GHL India Ventures does not endorse, control, or assume responsibility for any third-party websites or services. Market data, stock tickers, currency rates, and news feeds displayed on the Platform are sourced from third-party providers and may be delayed or inaccurate.</Para>

      <SectionTitle>11. Limitation of Liability</SectionTitle>
      <Para>To the maximum extent permitted by applicable law: the Platform and all content, tools, and services are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind; GHL India Ventures expressly disclaims all warranties, including warranties of merchantability, fitness for a particular purpose, accuracy, and non-infringement; GHL India Ventures shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform; and in no event shall the total liability of GHL India Ventures exceed the amount you have paid, if any, for accessing the Platform in the twelve (12) months preceding the claim.</Para>

      <SectionTitle>12. Indemnification</SectionTitle>
      <Para>You agree to indemnify, defend, and hold harmless GHL India Ventures Trust, its trustees, directors, officers, employees, agents, licensors, and affiliates from and against all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising from or related to: your use of or access to the Platform; your violation of these terms or any applicable law or regulation; your violation of any third-party rights; any content or information you submit through the Platform; or any false, inaccurate, or misleading information provided by you.</Para>

      <SectionTitle>13. Termination &amp; Suspension</SectionTitle>
      <Para>GHL India Ventures may, at its sole discretion and without prior notice, suspend or terminate your account and access to the Platform for any reason, including but not limited to: breach of these terms; failure to complete or maintain KYC requirements; suspicious activity, including potential fraud or money laundering; upon request by law enforcement or regulatory authorities; or extended inactivity of the account.</Para>
      <Para>You may terminate your account at any time by contacting us at info@ghlindiaventures.com. Termination of your account does not affect any existing investment commitments or obligations. Sections relating to Investment Disclaimers, Limitation of Liability, Indemnification, Intellectual Property, and Governing Law shall survive termination.</Para>

      <SectionTitle>14. Modifications to Terms</SectionTitle>
      <Para>GHL India Ventures reserves the right to modify, amend, or update these terms at any time. Changes will be effective upon posting the revised terms on the platform with an updated &ldquo;Last Updated&rdquo; date. For material changes, we will make reasonable efforts to notify registered users via email or a prominent notice on the Platform. We recommend reviewing these terms periodically.</Para>

      <SectionTitle>15. Governing Law &amp; Jurisdiction</SectionTitle>
      <Para>These Terms shall be governed by and construed in accordance with the laws of India. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located in Chennai, Tamil Nadu, India. The parties agree that, prior to initiating any court proceedings, they shall attempt to resolve disputes amicably through good-faith negotiation for a period of thirty (30) days from the date of written notice of the dispute.</Para>

      <SectionTitle>16. Grievance Redressal &amp; Contact</SectionTitle>
      <Para>For any questions, concerns, grievances, or complaints regarding these Terms or the Platform, please contact:</Para>
      <Para>Compliance Officer / Grievance Officer, GHL India Ventures Trust, 2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai, Tamil Nadu &ndash; 600 008, India.</Para>
      <Para>Email: info@ghlindiaventures.com | Phone: +91 44 2843 1043 | +91 7200 255 252 | Office Hours: Monday to Saturday, 10:00 AM to 6:00 PM IST.</Para>
      <Para>We will acknowledge receipt of your grievance within 48 hours and endeavor to resolve it within thirty (30) business days, in accordance with applicable SEBI guidelines on investor grievance redressal.</Para>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <Para>SEBI Registration No. IN/AIF2/2425/1517 | Category II Alternative Investment Fund. Investments in AIFs involve risks, including the possible loss of principal. Past performance is not indicative of future results.</Para>
        <Para>&copy; 2026 GHL India Ventures Trust. All Rights Reserved.</Para>
      </div>
    </>
  )
}

// ── Disclaimer Content ──
function DisclaimerContent() {
  return (
    <>
      <DocHeader date="Effective Date: 1 February 2025 | Last Updated: 20 February 2026" />

      <SectionTitle>Regulatory Status</SectionTitle>
      <Para>
        GHL India Ventures Trust is registered with the Securities and Exchange Board of India (SEBI) as a Category II Alternative Investment Fund under Registration Number IN/AIF2/2425/1517, pursuant to the SEBI (Alternative Investment Funds) Regulations, 2012. This registration does not imply that SEBI endorses, guarantees, or recommends any investment product, strategy, or communication published by GHL India Ventures.
      </Para>

      <SectionTitle>Not an Offer or Solicitation</SectionTitle>
      <Para>
        Nothing on this website or in any of our communications constitutes or shall be construed as an offer, invitation, solicitation, or advertisement to the public to subscribe to or purchase any securities, units, debentures, or any other financial product offered or managed by GHL India Ventures Trust. Any investment in GHL India Ventures products is made exclusively on the basis of the Private Placement Memorandum (PPM) and other scheme-related documents provided to eligible investors through a formal onboarding process.
      </Para>

      <SectionTitle>Investment Risk Warning</SectionTitle>
      <Para>
        Investments in Alternative Investment Funds (AIFs), Non-Convertible Debentures (NCDs), and related financial instruments involve significant risks, including but not limited to the risk of total or partial loss of the principal amount invested, illiquidity, market volatility, regulatory changes, and risks specific to stressed real estate and early-stage venture capital investments.
      </Para>
      <Para>
        Past performance of any fund, investment, or strategy referenced on this website is not indicative of future results. There is no guarantee that any target returns, IRR projections, or wealth growth illustrations will be achieved. All financial projections, return estimates, and portfolio performance figures shown on this website are for illustrative and educational purposes only.
      </Para>

      <SectionTitle>Not Financial, Legal, or Tax Advice</SectionTitle>
      <Para>
        The information, articles, tools, and educational content published on this website are provided for general informational purposes only and do not constitute financial advice, investment advice, legal advice, or tax advice. GHL India Ventures does not act as your financial advisor or legal counsel by virtue of your access to this website. Before making any investment decision, you should conduct your own independent due diligence, review all scheme-related documents including the PPM, and seek advice from a qualified and independent financial advisor, legal counsel, and tax professional.
      </Para>

      <SectionTitle>Eligibility Restriction</SectionTitle>
      <Para>
        The information on this website is intended solely for persons who qualify as Accredited Investors or Qualified Buyers as defined under SEBI regulations and applicable Indian law. It is not intended for retail investors, minors, or persons for whom investment in AIFs or NCDs would be unlawful under the laws of their country of residence or domicile. Persons accessing this website from outside India are responsible for ensuring that their access to and use of this information complies with all laws and regulations applicable in their jurisdiction.
      </Para>

      <SectionTitle>NRI and Foreign Investor Note</SectionTitle>
      <Para>
        Non-Resident Indians (NRIs) may invest through NRO accounts subject to FEMA and RBI guidelines. All investment activities involving foreign inflows are subject to applicable regulatory approvals and reporting requirements. GHL India Ventures does not solicit investment from persons in jurisdictions where such solicitation is not permitted.
      </Para>

      <SectionTitle>Market Data and News Disclaimer</SectionTitle>
      <Para>
        Live market data, news tickers, exchange rates, and market commentary displayed on this website are sourced from third-party data providers and are provided for informational context only. GHL India Ventures does not warrant the accuracy, completeness, or timeliness of such data. This data should not be relied upon for trading or investment decisions.
      </Para>

      <SectionTitle>Website Accuracy</SectionTitle>
      <Para>
        While GHL India Ventures makes reasonable efforts to ensure that the information on this website is accurate and up-to-date, we make no representations or warranties, express or implied, regarding the accuracy, reliability, completeness, or suitability of the information for any purpose. We reserve the right to change, update, or remove any content on this website without notice.
      </Para>

      <SectionTitle>SEBI Grievance Redressal</SectionTitle>
      <Para>
        In case of any grievances related to securities market activities, investors may lodge complaints with SEBI through the SEBI SCORES platform at scores.gov.in or contact SEBI&apos;s toll-free helpline at 1800 22 7575. Investors may also contact GHL India Ventures directly at info@ghlindiaventures.com or call +91 7200 255 252.
      </Para>
      <Para>
        For formal complaints, please write to: Compliance Officer, GHL India Ventures Trust, 2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai, Tamil Nadu &ndash; 600 008. Email: info@ghlindiaventures.com
      </Para>

      <SectionTitle>Limitation of Liability</SectionTitle>
      <Para>
        GHL India Ventures Trust, its trustees, directors, employees, and agents shall not be liable for any loss or damage, whether direct, indirect, consequential, or incidental, arising from your access to or use of this website, reliance on any information contained herein, or any investment made on the basis of such information.
      </Para>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <Para>&copy; 2026 GHL India Ventures Trust. All Rights Reserved. SEBI Registration No. IN/AIF2/2425/1517.</Para>
      </div>
    </>
  )
}
