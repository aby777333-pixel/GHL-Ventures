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
  const [accepted, setAccepted] = useState(false)
  const [atBottom, setAtBottom] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const openLegal = useCallback((type: LegalDocType) => {
    setActiveDoc(type)
    setAccepted(false)
    setAtBottom(false)
  }, [])

  const close = useCallback(() => {
    setActiveDoc(null)
    setAccepted(false)
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

            {/* ── Footer with Accept + Close ── */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 shrink-0 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center gap-2">
                {!atBottom && (
                  <p className="text-xs text-brand-grey animate-pulse">Scroll down to read the full document</p>
                )}
                {atBottom && !accepted && (
                  <p className="text-xs text-green-600 font-medium">You have reached the end of the document</p>
                )}
                {accepted && (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Accepted</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={close}
                  className="px-5 py-2 text-sm font-semibold text-brand-grey border border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => { setAccepted(true); setTimeout(close, 800) }}
                  disabled={!atBottom || accepted}
                  className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                    atBottom && !accepted
                      ? 'bg-brand-red text-white hover:bg-red-700 shadow-sm'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {accepted ? 'Accepted' : 'I Accept'}
                </button>
              </div>
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
      <DocHeader date="Effective Date: 1 February 2025 | Last Updated: 20 February 2026" />

      <SectionTitle>1. Introduction</SectionTitle>
      <Para>
        GHL India Ventures Trust (&ldquo;GHL India Ventures,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is a SEBI-registered Category II Alternative Investment Fund (Registration No. IN/AIF2/2425/1517), headquartered at 2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai, Tamil Nadu &ndash; 600 008, India.
      </Para>
      <Para>
        We are committed to protecting the privacy and confidentiality of all personal information provided by visitors to our website and by prospective and existing investors. This Privacy Policy explains how we collect, use, store, and protect your personal data in compliance with applicable Indian laws, including the Digital Personal Data Protection Act, 2023 (DPDPA), the Information Technology Act, 2000, and SEBI regulations.
      </Para>
      <Para>By accessing our website or submitting any information to us, you consent to the practices described in this Privacy Policy.</Para>

      <SectionTitle>2. Information We Collect</SectionTitle>
      <Para>
        <strong>Information You Provide Directly:</strong> When you fill out our consultation request form, register on our investor portal, or contact us by phone, email, or WhatsApp, we may collect your full name, email address, phone number, city of residence, investment amount range, and any message or inquiry content you submit.
      </Para>
      <Para>
        When you proceed to formal investor onboarding, we additionally collect Know Your Customer (KYC) information, including PAN card details, Aadhaar number, bank account details, income proof, and any other documentation required under SEBI and PMLA regulations.
      </Para>
      <Para>
        <strong>Information Collected Automatically:</strong> When you visit our website, we may automatically collect technical information such as your IP address, browser type and version, pages visited, time spent on each page, referring URLs, and device information. This is collected via cookies and similar tracking technologies.
      </Para>
      <Para>
        <strong>Information From Third Parties:</strong> We may receive information about you from third-party service providers, referral partners, or publicly available sources for the purpose of investor verification and due diligence.
      </Para>

      <SectionTitle>3. How We Use Your Information</SectionTitle>
      <Para>
        We use the information we collect to respond to your consultation requests and investor inquiries; to process your investment application and complete KYC/AML verification as required by SEBI and PMLA regulations; to send you fund updates, NAV disclosures, quarterly reports, and investor communications; to provide you with access to our investor portal and download resources; to comply with our legal and regulatory obligations under SEBI, FEMA, and the Income Tax Act; to improve the functionality, content, and user experience of our website; and to send you occasional marketing communications about our fund strategies, events, and educational content, where you have consented to receive these.
      </Para>
      <Para>We do not use your personal information for automated decision-making or profiling that produces legal or similarly significant effects without your explicit consent.</Para>

      <SectionTitle>4. Legal Basis for Processing</SectionTitle>
      <Para>
        We process your personal data on the following legal bases: your consent (which you may withdraw at any time), the performance of a contract or pre-contractual steps at your request, compliance with our legal obligations as a SEBI-registered AIF, and our legitimate interests in managing and growing the fund responsibly.
      </Para>

      <SectionTitle>5. How We Share Your Information</SectionTitle>
      <Para>We do not sell, rent, or trade your personal information to third parties for commercial purposes. We may share your information with the following categories of recipients only to the extent necessary:</Para>
      <Para><strong>Regulatory Authorities</strong> &mdash; SEBI, FEMA, RBI, the Income Tax Department, and other statutory bodies as required by law.</Para>
      <Para><strong>Fund Service Providers</strong> &mdash; Our fund administrator, custodian, statutory auditor, legal counsel, and KYC/AML verification agencies engaged in connection with fund operations.</Para>
      <Para><strong>Technology Partners</strong> &mdash; Trusted technology service providers who operate our website infrastructure, investor portal, and communication systems, bound by confidentiality obligations.</Para>
      <Para><strong>Professional Advisors</strong> &mdash; Lawyers, accountants, and compliance consultants under duties of confidentiality.</Para>
      <Para>We require all third-party processors to handle your data in accordance with applicable data protection laws and to implement appropriate security measures.</Para>

      <SectionTitle>6. Data Retention</SectionTitle>
      <Para>
        We retain your personal data for as long as is necessary to fulfil the purposes for which it was collected and to comply with our legal obligations. KYC and investment-related records are retained for a minimum of five years following the end of the investor relationship, as required by SEBI and PMLA regulations. Website usage data collected via cookies is retained for a shorter period consistent with its purpose.
      </Para>

      <SectionTitle>7. Cookies and Tracking Technologies</SectionTitle>
      <Para>
        Our website uses cookies to enhance your browsing experience, analyze website traffic, and remember your preferences. You may control cookie settings through your browser. Please note that disabling certain cookies may affect the functionality of some parts of our website. We use analytics tools to understand how visitors interact with our website. This data is aggregated and does not personally identify individual users.
      </Para>

      <SectionTitle>8. Data Security</SectionTitle>
      <Para>
        We implement industry-standard technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These include 256-bit SSL encryption, secure server infrastructure, access controls, and regular security audits. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.
      </Para>

      <SectionTitle>9. Your Rights</SectionTitle>
      <Para>
        Under applicable Indian law, you have the right to access the personal data we hold about you, correct inaccurate or incomplete information, withdraw your consent to marketing communications at any time, and request deletion of your personal data where it is no longer required for legal or regulatory purposes. To exercise any of these rights, please contact us at info@ghlindiaventures.com or call +91 7200 255 252.
      </Para>

      <SectionTitle>10. NRI Investors</SectionTitle>
      <Para>For Non-Resident Indian investors, your data may be subject to FEMA and RBI reporting requirements. All cross-border data transfers are conducted in compliance with applicable Indian laws.</Para>

      <SectionTitle>11. Children&apos;s Privacy</SectionTitle>
      <Para>Our services are not directed at individuals under the age of 18. We do not knowingly collect personal information from minors.</Para>

      <SectionTitle>12. Changes to This Policy</SectionTitle>
      <Para>We may update this Privacy Policy from time to time to reflect changes in law, regulation, or our practices. The updated version will be published on our website with a revised effective date. We encourage you to review this policy periodically.</Para>

      <SectionTitle>13. Contact Us</SectionTitle>
      <Para>
        For any privacy-related queries, complaints, or requests, please contact our Compliance Officer at GHL India Ventures Trust, 2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai, Tamil Nadu &ndash; 600 008. Email: info@ghlindiaventures.com | Phone: +91 44 2843 1043 | +91 7200 255 252.
      </Para>
    </>
  )
}

// ── Terms & Conditions Content ──
function TermsContent() {
  return (
    <>
      <DocHeader date="Effective Date: 1 February 2025 | Last Updated: 20 February 2026" />

      <SectionTitle>1. Acceptance of Terms</SectionTitle>
      <Para>
        By accessing or using the website of GHL India Ventures Trust (&ldquo;GHL India Ventures,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) at ghlindiaventures.com, you agree to be bound by these Terms and Conditions in their entirety. If you do not agree with any part of these terms, please discontinue use of this website immediately.
      </Para>
      <Para>GHL India Ventures Trust is a SEBI-registered Category II Alternative Investment Fund (Registration No. IN/AIF2/2425/1517), incorporated and operating in India under applicable laws and the SEBI (Alternative Investment Funds) Regulations, 2012.</Para>

      <SectionTitle>2. Nature of This Website</SectionTitle>
      <Para>
        This website is operated for informational and investor communication purposes only. Nothing on this website constitutes or shall be deemed to constitute an offer, invitation, solicitation, or recommendation to buy, sell, or subscribe to any security, investment product, or financial instrument. All information presented on this website is provided on a general basis and does not take into account the specific investment objectives, financial situation, or needs of any individual visitor.
      </Para>

      <SectionTitle>3. Eligibility to Invest</SectionTitle>
      <Para>
        Investment in GHL India Ventures is restricted to persons who meet the definition of an &ldquo;Accredited Investor&rdquo; or &ldquo;Qualified Buyer&rdquo; as defined under SEBI regulations. The minimum investment in the Direct AIF Route is &#8377;1 Crore as mandated by SEBI. The Debenture (NCD) Route is available from &#8377;10 Lakhs subject to eligibility and documentation requirements.
      </Para>

      <SectionTitle>4. Intellectual Property</SectionTitle>
      <Para>
        All content on this website &mdash; including but not limited to text, graphics, logos, images, tool interfaces, blog articles, video content, and the overall website design &mdash; is the exclusive intellectual property of GHL India Ventures Trust or its content licensors and is protected under applicable Indian and international intellectual property laws. You may view and print content from this website for your personal, non-commercial use only.
      </Para>

      <SectionTitle>5. Interactive Tools</SectionTitle>
      <Para>
        Our website provides several interactive financial tools, including a Risk Assessment Quiz, Investment Calculator, Tax Impact Analyzer, and Wealth Growth Map. These tools are provided for educational and illustrative purposes only. The outputs and projections generated by these tools are based on assumptions and are not guaranteed to reflect actual investment outcomes. They do not constitute financial advice.
      </Para>

      <SectionTitle>6. Blog and Educational Content</SectionTitle>
      <Para>
        The blog articles and Financial IQ content published on this website are for general educational purposes only and represent the views of GHL India Ventures at the time of publication. They do not constitute investment advice, legal advice, or tax advice. Market conditions change, and information may become outdated.
      </Para>

      <SectionTitle>7. Third-Party Links</SectionTitle>
      <Para>
        This website may contain links to third-party websites, including news sources, regulatory portals, and partner organizations. These links are provided for convenience only. GHL India Ventures has no control over the content, accuracy, or practices of third-party websites and does not accept any responsibility for them.
      </Para>

      <SectionTitle>8. User Conduct</SectionTitle>
      <Para>
        You agree to use this website lawfully and in good faith. You must not use this website to transmit any unlawful, harmful, defamatory, or fraudulent content; attempt to gain unauthorized access to any part of our website or systems; interfere with the website&apos;s functionality or security; or misrepresent your identity or investment qualifications.
      </Para>

      <SectionTitle>9. Investor Portal and Account Security</SectionTitle>
      <Para>
        Where you are provided access to our investor portal through registered credentials, you are solely responsible for maintaining the confidentiality of your login details and for all activity conducted under your account. Please notify us immediately at info@ghlindiaventures.com if you suspect any unauthorized use of your account.
      </Para>

      <SectionTitle>10. Limitation of Liability</SectionTitle>
      <Para>
        To the fullest extent permitted by applicable law, GHL India Ventures Trust and its trustees, directors, officers, employees, and agents shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from your use of or reliance on this website, its content, or any investment decision made on the basis of information provided herein. This limitation applies regardless of whether such liability is asserted in contract, tort, negligence, or any other legal theory.
      </Para>

      <SectionTitle>11. Indemnification</SectionTitle>
      <Para>
        You agree to indemnify and hold harmless GHL India Ventures Trust and its trustees, employees, and agents from and against any claims, losses, damages, liabilities, and expenses (including legal fees) arising out of your use of this website, your violation of these Terms and Conditions, or your violation of any applicable law.
      </Para>

      <SectionTitle>12. Amendments</SectionTitle>
      <Para>We reserve the right to modify these Terms and Conditions at any time. Updated terms will be published on this website with a revised effective date. Your continued use of the website following any changes constitutes your acceptance of the updated terms.</Para>

      <SectionTitle>13. Governing Law and Jurisdiction</SectionTitle>
      <Para>These Terms and Conditions are governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts in Chennai, Tamil Nadu, India.</Para>

      <SectionTitle>14. Severability</SectionTitle>
      <Para>If any provision of these Terms and Conditions is found to be unlawful, void, or unenforceable for any reason, that provision shall be deemed severable and shall not affect the validity and enforceability of the remaining provisions.</Para>

      <SectionTitle>15. Contact</SectionTitle>
      <Para>
        For questions regarding these Terms and Conditions, please contact: GHL India Ventures Trust, 2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai, Tamil Nadu &ndash; 600 008. Email: info@ghlindiaventures.com | Phone: +91 44 2843 1043 | +91 7200 255 252.
      </Para>
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
