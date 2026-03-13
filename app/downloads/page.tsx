'use client'

import { useState, useEffect } from 'react'
import AnimatedSection from '@/components/AnimatedSection'
import PlaceholderImage from '@/components/PlaceholderImage'
import { BRAND } from '@/lib/constants'
import { submitContactForm, submitLead } from '@/lib/supabase/reportsDataService'
import { logDownload } from '@/lib/supabase/downloadTrackingService'
import {
  FileText, Download, Calendar, HardDrive, File,
  CheckCircle, BookOpen, Map, BarChart3, Building2,
} from 'lucide-react'
import SpaceHero from '@/components/SpaceHero'

const SECTIONS = [
  {
    id: 'brochure',
    icon: Building2,
    title: 'Corporate Brochure',
    description: 'Company overview, leadership team, investment philosophy, and fund positioning.',
    imageTheme: 'team',
    document: {
      title: 'GHL India Ventures Corporate Brochure',
      desc: 'A comprehensive overview of our firm, our team, and our investment philosophy. Learn about our mission to invest in India\'s future through stressed real estate and high-growth startups.',
      lastUpdated: 'January 2025',
      fileSize: '6.3 MB',
      fileType: 'PDF',
    },
  },
  {
    id: 'roadmap',
    icon: Map,
    title: 'Investment Roadmap',
    description: 'Fund strategy, deployment milestones, sector allocation, and 5-year vision.',
    imageTheme: 'finance',
    document: {
      title: 'Fund Investment Roadmap',
      desc: 'Our strategic blueprint covering fund deployment timelines, sector allocation targets, key milestones, and the 5-year vision for capital deployment and returns.',
      lastUpdated: 'December 2024',
      fileSize: '12.0 MB',
      fileType: 'PDF',
    },
  },
  {
    id: 'guide',
    icon: BookOpen,
    title: 'Investment Guide',
    description: 'HNI investment guide, AIF explained, how to invest step by step.',
    imageTheme: 'education',
    document: {
      title: 'HNI Investment Guide to AIFs 2026',
      desc: 'A detailed guide designed for High Net-worth Individuals explaining what AIFs are, the regulatory framework, how to evaluate funds, and a step-by-step process to invest with GHL India Ventures.',
      lastUpdated: 'March 2026',
      fileSize: '262 KB',
      fileType: 'PDF',
    },
  },
  {
    id: 'nav',
    icon: BarChart3,
    title: 'NAV Report',
    description: 'Net Asset Value reports, fund performance, portfolio snapshot, and compliance updates.',
    imageTheme: 'analytics',
    document: {
      title: 'NAV Report FY2026 Q1',
      desc: 'Comprehensive NAV report including portfolio company updates, NAV progression, sector-wise performance analysis, compliance disclosures, and the outlook for the upcoming quarter.',
      lastUpdated: 'March 2026',
      fileSize: '372 KB',
      fileType: 'PDF',
    },
  },
]

interface GateFormState {
  name: string
  email: string
  phone: string
  accredited: boolean
}

const GLOW_COLORS = ['glow-card-red', 'glow-card-blue', 'glow-card-violet', 'glow-card-emerald', 'glow-card-amber', 'glow-card-cyan']

function DownloadCard({
  section,
  index,
}: {
  section: (typeof SECTIONS)[number]
  index: number
}) {
  const [gateForm, setGateForm] = useState<GateFormState>({
    name: '',
    email: '',
    phone: '',
    accredited: false,
  })
  const [downloaded, setDownloaded] = useState(false)

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault()
    setDownloaded(true)

    // 1. Capture lead + contact submission (feeds Admin Sales Pipeline & CS Lead Queue)
    let contactResult: any = null
    let leadResult: any = null
    try {
      ;[contactResult, leadResult] = await Promise.all([
        submitContactForm({
          formType: 'document_download',
          fullName: gateForm.name,
          email: gateForm.email,
          phone: gateForm.phone,
          message: `Downloaded: ${section.document.title} (${section.document.fileType}, ${section.document.fileSize})`,
          investmentInterest: section.id,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
        submitLead({
          firstName: gateForm.name.split(' ')[0] || '',
          lastName: gateForm.name.split(' ').slice(1).join(' ') || '',
          email: gateForm.email,
          phone: gateForm.phone,
          source: 'website',
          investmentInterest: `download-${section.id}`,
          message: `Downloaded: ${section.document.title}`,
        }),
      ])
    } catch (err) {
      console.warn('Download lead capture failed (non-critical):', err)
    }

    // 2. Log download activity (feeds Admin Analytics & CS Follow-up)
    try {
      await logDownload({
        documentId: section.id,
        documentTitle: section.document.title,
        documentType: section.document.fileType,
        fileSize: section.document.fileSize,
        downloaderName: gateForm.name,
        downloaderEmail: gateForm.email,
        downloaderPhone: gateForm.phone,
        isAccredited: gateForm.accredited,
        leadId: leadResult?.data?.id || undefined,
        contactSubmissionId: contactResult?.data?.id || undefined,
      })
    } catch {
      // Non-critical — don't block download
    }

    // 3. Trigger the actual PDF download
    try {
      const a = document.createElement('a')
      a.href = `/downloads/${section.id}.pdf`
      a.download = `${section.document.title}.pdf`
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      // Fallback — email delivery
    }
  }

  return (
    <div className={`card ${GLOW_COLORS[index % GLOW_COLORS.length]}`}>
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Preview + Info */}
        <div>
          {/* Document preview mockup */}
          <div className="relative rounded-xl overflow-hidden mb-6">
            <PlaceholderImage theme={section.imageTheme || 'fund'} aspectRatio="aspect-[4/3]" label={`${section.document.title} — ${section.document.fileType}`} className="rounded-xl" />
          </div>

          <h3 className="text-xl font-bold text-brand-black mb-2">{section.document.title}</h3>
          <p className="text-brand-grey text-sm leading-relaxed mb-4">{section.document.desc}</p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-brand-grey">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {section.document.lastUpdated}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              {section.document.fileSize}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <File className="w-3.5 h-3.5" />
              {section.document.fileType}
            </span>
          </div>


        </div>

        {/* Right: Download Gate Form */}
        <div>
          {downloaded ? (
            <div className={`bg-green-50 border border-green-200 rounded-xl p-8 text-center h-full flex flex-col items-center justify-center ${GLOW_COLORS[(index + 4) % GLOW_COLORS.length]}`}>
              <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
              <h4 className="text-lg font-bold text-brand-black mb-2">Request Submitted</h4>
              <p className="text-sm text-brand-grey mb-4">
                Your download should begin automatically. If it doesn&apos;t start, a copy will be sent to your email shortly.
              </p>
              <button
                onClick={() => setDownloaded(false)}
                className="text-sm text-brand-red hover:underline"
              >
                Download Again
              </button>
            </div>
          ) : (
            <div className={`bg-gray-50 rounded-xl p-6 border border-gray-100 ${GLOW_COLORS[(index + 2) % GLOW_COLORS.length]}`}>
              <h4 className="text-base font-bold text-brand-black mb-1">Download This Document</h4>
              <p className="text-xs text-brand-grey mb-5">
                Fill in your details to access the document instantly.
              </p>

              <form onSubmit={handleDownload} className="space-y-4">
                <div>
                  <label htmlFor={`${section.id}-name`} className="block text-xs font-medium text-brand-black mb-1.5">
                    Full Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    id={`${section.id}-name`}
                    type="text"
                    required
                    className="input-field text-sm"
                    placeholder="Your name"
                    value={gateForm.name}
                    onChange={(e) => setGateForm({ ...gateForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor={`${section.id}-email`} className="block text-xs font-medium text-brand-black mb-1.5">
                    Email Address <span className="text-brand-red">*</span>
                  </label>
                  <input
                    id={`${section.id}-email`}
                    type="email"
                    required
                    className="input-field text-sm"
                    placeholder="you@email.com"
                    value={gateForm.email}
                    onChange={(e) => setGateForm({ ...gateForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor={`${section.id}-phone`} className="block text-xs font-medium text-brand-black mb-1.5">
                    Phone Number <span className="text-brand-red">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey text-sm">+91</span>
                    <input
                      id={`${section.id}-phone`}
                      type="tel"
                      required
                      className="input-field text-sm pl-12"
                      placeholder="XXXXX XXXXX"
                      value={gateForm.phone}
                      onChange={(e) => setGateForm({ ...gateForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gateForm.accredited}
                    onChange={(e) => setGateForm({ ...gateForm, accredited: e.target.checked })}
                    className="w-4 h-4 text-brand-red rounded border-gray-300 mt-0.5 focus:ring-brand-red"
                  />
                  <span className="text-xs text-brand-grey">
                    I am an accredited / qualified investor
                  </span>
                </label>

                <button type="submit" className="btn-primary w-full text-center">
                  <Download className="w-4 h-4 mr-2" />
                  Download Now
                </button>

                <p className="text-[11px] text-brand-grey text-center">
                  By downloading, you agree to our Privacy Policy.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DownloadsPage() {
  const [activeSection, setActiveSection] = useState('brochure')

  // Scroll spy for sticky nav
  useEffect(() => {
    const handleScroll = () => {
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="pt-40 pb-16 gradient-dark relative overflow-hidden">
        {/* Space: Hubble deep space theme */}
        <SpaceHero variant="hubble" />
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <span className="eyebrow">Resources</span>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-4 mb-5">
              <span className="text-gradient-shimmer">Downloads</span> &amp; Resources
            </h1>
            <p className="text-base text-gray-300 max-w-3xl">
              Access our corporate materials, investment guides, and reports. Explore each document to learn more about {BRAND.name}.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto">
          <div className="grid lg:grid-cols-[240px_1fr] gap-10">
            {/* Sticky sidebar nav (desktop) */}
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <h3 className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-4">
                  Documents
                </h3>
                <nav className="space-y-1">
                  {SECTIONS.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-sm transition-all ${
                          activeSection === section.id
                            ? 'bg-brand-red text-white font-semibold shadow-lg'
                            : 'text-brand-grey hover:bg-white hover:text-brand-black'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{section.title}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </aside>

            {/* Mobile tabs */}
            <div className="lg:hidden mb-6 flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide">
              {SECTIONS.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-full text-sm whitespace-nowrap transition-all shrink-0 ${
                      activeSection === section.id
                        ? 'bg-brand-red text-white font-semibold'
                        : 'bg-white text-brand-grey border border-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{section.title}</span>
                  </button>
                )
              })}
            </div>

            {/* Document sections */}
            <div className="space-y-16">
              {SECTIONS.map((section, index) => (
                <div key={section.id} id={section.id} className="scroll-mt-28">
                  <AnimatedSection delay={index * 100}>
                    <div className="mb-6">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-brand-red/10 rounded-lg flex items-center justify-center">
                          <section.icon className="w-5 h-5 text-brand-red" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-brand-black">{section.title}</h2>
                        </div>
                      </div>
                      <p className="text-brand-grey text-sm ml-[52px]">{section.description}</p>
                    </div>

                    <DownloadCard section={section} index={index} />
                  </AnimatedSection>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
