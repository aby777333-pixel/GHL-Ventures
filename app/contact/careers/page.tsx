'use client'

import { useState } from 'react'
import { Send, Briefcase, GraduationCap, MapPin, Heart, CheckCircle, ArrowRight, ChevronDown, Mail } from 'lucide-react'
import SpaceHero from '@/components/SpaceHero'
import AnimatedSection from '@/components/AnimatedSection'

const BENEFITS = [
  { icon: Briefcase, title: 'Mission-Driven Work', desc: 'Manage real capital, make real impact. Work on stressed real estate resolution and startup investing that creates tangible value.', glow: 'glow-card-red' },
  { icon: GraduationCap, title: 'Learning-First Culture', desc: 'Regular Investment Committee exposure, mentorship from senior fund managers, and access to industry conferences and certification support.', glow: 'glow-card-blue' },
  { icon: MapPin, title: 'Chennai Headquarters', desc: 'Based in the vibrant financial hub of Egmore, Chennai — with proximity to NCLT, legal firms, and a thriving startup ecosystem.', glow: 'glow-card-emerald' },
  { icon: Heart, title: 'Competitive Compensation', desc: 'Market-competitive salary, performance-linked bonuses, and the opportunity to grow with a high-growth alternative investment firm.', glow: 'glow-card-amber' },
]

const POSITIONS = [
  {
    title: 'Investment Analyst (Real Estate)',
    department: 'Investment Team',
    location: 'Chennai',
    type: 'Full-time',
    responsibilities: [
      'Conduct due diligence on stressed real estate assets including legal, financial, and market analysis',
      'Prepare investment memos and present to the Investment Committee',
      'Monitor portfolio performance and NAV computation for real estate holdings',
      'Coordinate with legal teams on NCLT/IBC proceedings and resolution plans',
    ],
  },
  {
    title: 'Startup Associate',
    department: 'Investment Team',
    location: 'Chennai',
    type: 'Full-time',
    responsibilities: [
      'Source and screen early-stage startup opportunities across target sectors',
      'Lead preliminary due diligence and founder meetings',
      'Build financial models and valuation frameworks for startup investments',
      'Support portfolio companies with strategic guidance and connections',
    ],
  },
  {
    title: 'Compliance Associate',
    department: 'Compliance',
    location: 'Chennai',
    type: 'Full-time',
    responsibilities: [
      'Ensure fund operations comply with SEBI AIF Regulations and RBI guidelines',
      'Prepare and file periodic regulatory reports with SEBI',
      'Manage investor KYC/AML documentation and verification',
      'Support internal and external audit processes',
    ],
  },
  {
    title: 'Business Development Executive',
    department: 'Client Relations',
    location: 'Chennai / Remote',
    type: 'Full-time',
    responsibilities: [
      'Develop and nurture relationships with HNI investors and family offices',
      'Conduct investor presentations and one-on-one consultations',
      'Manage the investor onboarding process end-to-end',
      'Represent GHL India Ventures at industry events and conferences',
    ],
  },
  {
    title: 'Financial Controller (Fund Accounting)',
    department: 'Finance',
    location: 'Chennai',
    type: 'Full-time',
    responsibilities: [
      'Oversee fund accounting, NAV computation, and capital account management',
      'Prepare quarterly investor reports and annual audited financial statements',
      'Manage drawdown schedules, distribution waterfalls, and fee calculations',
      'Coordinate with fund administrator, custodian, and auditors',
    ],
  },
]

const glowColors = ['glow-card-red', 'glow-card-blue', 'glow-card-violet', 'glow-card-emerald', 'glow-card-amber']

export default function CareersPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', position: '',
    experience: '', currentCompany: '', currentCTC: '',
    linkedin: '', portfolio: '', coverLetter: '', privacy: false,
  })
  const [submitted, setSubmitted] = useState(false)
  const [expandedRole, setExpandedRole] = useState<number | null>(null)

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleApplyForRole = (roleTitle: string) => {
    setFormData((prev) => ({ ...prev, position: roleTitle }))
    document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden gradient-dark pt-40 pb-12">
        <SpaceHero variant="mars" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-black/50 pointer-events-none" />
        <div className="container-max mx-auto relative z-10 text-center">
          <AnimatedSection>
            <span className="eyebrow text-brand-red">Join Our Team</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mt-3 mb-5">
              Careers at <span className="text-gradient">GHL India Ventures</span>
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              Build the future of alternative investing in India. Join a mission-driven team managing stressed real estate recovery and early-stage startup investments.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Why Work With Us ── */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-12">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Culture & Benefits</span>
            <h2 className="section-title mt-2 text-brand-black">Why Work With Us</h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 100}>
                <div className={`card h-full hover:-translate-y-1 ${item.glow}`}>
                  <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-brand-red" />
                  </div>
                  <h3 className="font-bold text-brand-black mb-2 text-sm">{item.title}</h3>
                  <p className="text-brand-grey text-xs leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open Positions ── */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto max-w-3xl">
          <AnimatedSection className="text-center mb-10">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Current Openings</span>
            <h2 className="section-title mt-2 text-brand-black">Open Positions</h2>
          </AnimatedSection>

          <div className="space-y-4">
            {POSITIONS.map((role, i) => (
              <AnimatedSection key={role.title} delay={i * 80}>
                <div className={`border border-gray-200 rounded-xl overflow-hidden bg-white ${glowColors[i % 5]}`}>
                  <button
                    onClick={() => setExpandedRole(expandedRole === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h3 className="font-bold text-brand-black text-base">{role.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-xs bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full font-medium">{role.department}</span>
                        <span className="text-xs bg-gray-100 text-brand-grey px-2 py-0.5 rounded-full">{role.location}</span>
                        <span className="text-xs bg-gray-100 text-brand-grey px-2 py-0.5 rounded-full">{role.type}</span>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-brand-grey shrink-0 transition-transform duration-300 ${expandedRole === i ? 'rotate-180 text-brand-red' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${expandedRole === i ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-5 pb-5">
                      <h4 className="font-semibold text-brand-black text-sm mb-2">Key Responsibilities</h4>
                      <ul className="space-y-1.5 mb-4">
                        {role.responsibilities.map((resp, j) => (
                          <li key={j} className="text-brand-grey text-sm flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-brand-red rounded-full shrink-0 mt-1.5" />
                            {resp}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleApplyForRole(role.title)}
                        className="inline-flex items-center px-5 py-2 bg-brand-red text-white font-semibold text-xs rounded-lg hover:bg-red-700 transition-all"
                      >
                        Apply for This Role <ArrowRight className="ml-2 w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Application Form ── */}
      <section id="apply" className="section-padding bg-white">
        <div className="container-max mx-auto max-w-3xl">
          <AnimatedSection>
            <div className="card glow-card-red">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="text-xl font-bold text-brand-black mb-2">Apply Now</h2>
                  <p className="text-brand-grey text-sm mb-6">Fill out the form below and our HR team will get back to you within 5 working days.</p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Full Name *" required className="input-field" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
                    <input type="email" placeholder="Email *" required className="input-field" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey text-sm">+91</span>
                      <input type="tel" placeholder="Phone *" required className="input-field pl-14" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                    </div>
                    <select className="input-field" value={formData.position} onChange={(e) => handleChange('position', e.target.value)} required>
                      <option value="">Position Applying For *</option>
                      {POSITIONS.map((p) => (
                        <option key={p.title} value={p.title}>{p.title}</option>
                      ))}
                      <option value="General Application">General Application</option>
                    </select>
                    <select className="input-field" value={formData.experience} onChange={(e) => handleChange('experience', e.target.value)} required>
                      <option value="">Years of Experience *</option>
                      <option value="0-1">0 – 1 years</option>
                      <option value="1-3">1 – 3 years</option>
                      <option value="3-5">3 – 5 years</option>
                      <option value="5-10">5 – 10 years</option>
                      <option value="10+">10+ years</option>
                    </select>
                    <input type="text" placeholder="Current Company / Institution" className="input-field" value={formData.currentCompany} onChange={(e) => handleChange('currentCompany', e.target.value)} />
                    <input type="text" placeholder="Current CTC (Optional)" className="input-field" value={formData.currentCTC} onChange={(e) => handleChange('currentCTC', e.target.value)} />
                    <input type="url" placeholder="LinkedIn Profile URL" className="input-field" value={formData.linkedin} onChange={(e) => handleChange('linkedin', e.target.value)} />
                  </div>

                  <input type="url" placeholder="Portfolio / Work Samples URL (Optional)" className="input-field" value={formData.portfolio} onChange={(e) => handleChange('portfolio', e.target.value)} />

                  <div>
                    <textarea placeholder="Why do you want to join GHL India Ventures? *" required className="input-field resize-none" rows={4} maxLength={500} value={formData.coverLetter} onChange={(e) => handleChange('coverLetter', e.target.value)} />
                    <p className="text-xs text-brand-grey mt-1">{formData.coverLetter.length}/500 characters</p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" required checked={formData.privacy} onChange={(e) => handleChange('privacy', e.target.checked)} className="w-4 h-4 text-brand-red rounded border-gray-300 mt-0.5 focus:ring-brand-red" />
                    <span className="text-xs text-brand-grey">I consent to GHL India Ventures processing my personal data for recruitment purposes and confirm that the information provided is accurate.</span>
                  </label>

                  <button type="submit" className="btn-primary w-full text-center flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Submit Application
                  </button>
                </form>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-black mb-2">Application Submitted!</h3>
                  <p className="text-brand-grey text-sm mb-6">Thank you for your interest in joining GHL India Ventures. Our HR team will review your application and reach out within 5 working days.</p>
                  <button onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', position: '', experience: '', currentCompany: '', currentCTC: '', linkedin: '', portfolio: '', coverLetter: '', privacy: false }) }} className="text-brand-red font-semibold text-sm hover:underline">
                    Submit Another Application
                  </button>
                </div>
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section-padding bg-brand-red">
        <div className="container-max mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Not Seeing a Fit?</h2>
            <p className="text-white/80 text-base max-w-2xl mx-auto mb-8">
              We are always looking for exceptional talent. Send your CV and a note about what excites you about alternative investments.
            </p>
            <a href="mailto:careers@ghlindiaventures.com" className="inline-flex items-center px-8 py-3 bg-white text-brand-red font-bold text-sm rounded-lg hover:bg-gray-100 transition-all shadow-lg">
              <Mail className="mr-2 w-5 h-5" /> careers@ghlindiaventures.com
            </a>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
