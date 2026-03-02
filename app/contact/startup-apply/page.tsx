'use client'

import { useState } from 'react'
import { submitContactForm, submitLead } from '@/lib/supabase/reportsDataService'
import { Send, Users, Target, TrendingUp, Lightbulb, Cpu, BarChart3, CheckCircle, ArrowRight, Clock } from 'lucide-react'
import SpaceHero from '@/components/SpaceHero'
import AnimatedSection from '@/components/AnimatedSection'
import Link from 'next/link'

const CRITERIA = [
  { icon: Users, title: 'Strong Founding Team', desc: '2+ co-founders with deep domain expertise, complementary skills, and skin in the game.', glow: 'glow-card-red' },
  { icon: Target, title: 'Product-Market Fit', desc: 'Demonstrated PMF or strong early signals — paying customers, growing wait-lists, or validated pilots.', glow: 'glow-card-blue' },
  { icon: TrendingUp, title: 'Large Addressable Market', desc: 'Target market of ₹500 Crore+ TAM with clear path to capturing meaningful share.', glow: 'glow-card-violet' },
  { icon: BarChart3, title: 'Capital Efficiency', desc: 'Sustainable unit economics (or a clear timeline to profitability) with disciplined burn rate.', glow: 'glow-card-emerald' },
  { icon: Cpu, title: 'Technology-Enabled', desc: 'Scalable, technology-driven business model with defensible competitive advantages.', glow: 'glow-card-amber' },
  { icon: Lightbulb, title: '18-Month Milestone Plan', desc: 'Clear roadmap of achievable milestones for the next 18 months with measurable KPIs.', glow: 'glow-card-cyan' },
]

const PROCESS = [
  { step: '01', title: 'Application Review', timeline: 'Within 5 working days', desc: 'Our investment team reviews your application and deck for strategic fit.' },
  { step: '02', title: 'Initial Call', timeline: '30-minute session', desc: 'A focused conversation with our startup investment team to understand your vision and traction.' },
  { step: '03', title: 'Deep Dive & Due Diligence', timeline: '4–6 weeks', desc: 'Comprehensive evaluation including market analysis, financial modelling, and reference checks.' },
  { step: '04', title: 'Term Sheet & Decision', timeline: 'Final stage', desc: 'If the due diligence is positive, we present a term sheet and work towards closing.' },
]

export default function StartupApplyPage() {
  const [formData, setFormData] = useState({
    founderName: '', email: '', phone: '', linkedin: '',
    companyName: '', foundingYear: '', website: '', stage: '',
    sector: '', city: '', mrr: '', mau: '', metrics: '',
    amountSeeking: '', useOfFunds: '', pitch: '',
    privacy: false,
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    try {
      await Promise.all([
        submitContactForm({
          formType: 'startup_apply',
          fullName: formData.founderName,
          email: formData.email,
          phone: formData.phone,
          company: formData.companyName,
          message: `${formData.pitch}\n\nSector: ${formData.sector}, Stage: ${formData.stage}, MRR: ${formData.mrr}, Seeking: ${formData.amountSeeking}`,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
        submitLead({
          firstName: formData.founderName.split(' ')[0] || '',
          lastName: formData.founderName.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          source: 'website',
          investmentInterest: 'startup-funding',
          message: formData.pitch,
        }),
      ])
    } catch (err) { console.warn('Startup form Supabase error:', err) }
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden gradient-dark pt-40 pb-12">
        <SpaceHero variant="galaxy" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-black/50 pointer-events-none" />
        <div className="container-max mx-auto relative z-10 text-center">
          <AnimatedSection>
            <span className="eyebrow text-brand-red">For Founders</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mt-3 mb-5">
              Startup Application <span className="text-gradient">Portal</span>
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              Apply for investment from GHL India Ventures. We back exceptional founders building scalable, technology-enabled businesses across India.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── What We Look For ── */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-12">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Selection Criteria</span>
            <h2 className="section-title mt-2 text-brand-black">What We Look For</h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CRITERIA.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 80}>
                <div className={`card h-full hover:-translate-y-1 ${item.glow}`}>
                  <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-brand-red" />
                  </div>
                  <h3 className="font-bold text-brand-black mb-2">{item.title}</h3>
                  <p className="text-brand-grey text-sm leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Investment Terms ── */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto">
          <AnimatedSection>
            <div className="bg-gradient-to-br from-brand-black to-brand-darkgrey rounded-3xl p-8 md:p-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-brand-red mb-1">₹50L – 3Cr</div>
                  <div className="text-white text-xs font-semibold uppercase tracking-wider">Typical Cheque</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-brand-red mb-1">Pre-Series A</div>
                  <div className="text-white text-xs font-semibold uppercase tracking-wider">Stage Focus</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-brand-red mb-1">5 Sectors</div>
                  <div className="text-white text-xs font-semibold uppercase tracking-wider">Fintech, Health, Clean, SaaS, Consumer</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-brand-red mb-1">Board Seat</div>
                  <div className="text-white text-xs font-semibold uppercase tracking-wider">Observer / Director</div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Application Form ── */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto max-w-3xl">
          <AnimatedSection>
            <div className="card glow-card-violet">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="text-xl font-bold text-brand-black mb-2">Application Form</h2>
                  <p className="text-brand-grey text-sm mb-6">All submissions are reviewed by our investment team. We respond within 5 working days.</p>

                  {/* Founder Info */}
                  <div>
                    <h3 className="font-semibold text-brand-black text-sm uppercase tracking-wider mb-3">Founder Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Full Name *" required className="input-field" value={formData.founderName} onChange={(e) => handleChange('founderName', e.target.value)} />
                      <input type="email" placeholder="Email *" required className="input-field" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey text-sm">+91</span>
                        <input type="tel" placeholder="Phone *" required className="input-field pl-14" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                      </div>
                      <input type="url" placeholder="LinkedIn Profile URL" className="input-field" value={formData.linkedin} onChange={(e) => handleChange('linkedin', e.target.value)} />
                    </div>
                  </div>

                  {/* Startup Info */}
                  <div>
                    <h3 className="font-semibold text-brand-black text-sm uppercase tracking-wider mb-3">Startup Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Company Name *" required className="input-field" value={formData.companyName} onChange={(e) => handleChange('companyName', e.target.value)} />
                      <input type="text" placeholder="Founding Year *" required className="input-field" value={formData.foundingYear} onChange={(e) => handleChange('foundingYear', e.target.value)} />
                      <input type="url" placeholder="Website or Pitch Deck URL" className="input-field" value={formData.website} onChange={(e) => handleChange('website', e.target.value)} />
                      <select className="input-field" value={formData.stage} onChange={(e) => handleChange('stage', e.target.value)} required>
                        <option value="">Stage *</option>
                        <option value="Pre-seed">Pre-seed</option>
                        <option value="Seed">Seed</option>
                        <option value="Pre-Series A">Pre-Series A</option>
                      </select>
                      <select className="input-field" value={formData.sector} onChange={(e) => handleChange('sector', e.target.value)} required>
                        <option value="">Sector *</option>
                        <option value="Fintech">Fintech</option>
                        <option value="HealthTech">HealthTech</option>
                        <option value="CleanTech">CleanTech</option>
                        <option value="SaaS">SaaS</option>
                        <option value="ConsumerTech">ConsumerTech</option>
                        <option value="Other">Other</option>
                      </select>
                      <input type="text" placeholder="City / HQ *" required className="input-field" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} />
                    </div>
                  </div>

                  {/* Traction */}
                  <div>
                    <h3 className="font-semibold text-brand-black text-sm uppercase tracking-wider mb-3">Traction</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Current MRR / ARR (if any)" className="input-field" value={formData.mrr} onChange={(e) => handleChange('mrr', e.target.value)} />
                      <input type="text" placeholder="Monthly Active Users (if any)" className="input-field" value={formData.mau} onChange={(e) => handleChange('mau', e.target.value)} />
                    </div>
                    <textarea placeholder="Key metrics and milestones achieved" className="input-field resize-none mt-4" rows={3} value={formData.metrics} onChange={(e) => handleChange('metrics', e.target.value)} />
                  </div>

                  {/* Funding Ask */}
                  <div>
                    <h3 className="font-semibold text-brand-black text-sm uppercase tracking-wider mb-3">Funding Ask</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Amount Seeking (₹) *" required className="input-field" value={formData.amountSeeking} onChange={(e) => handleChange('amountSeeking', e.target.value)} />
                    </div>
                    <textarea placeholder="Use of funds — how will this capital be deployed?" className="input-field resize-none mt-4" rows={3} value={formData.useOfFunds} onChange={(e) => handleChange('useOfFunds', e.target.value)} />
                  </div>

                  {/* Pitch */}
                  <div>
                    <h3 className="font-semibold text-brand-black text-sm uppercase tracking-wider mb-3">Your Pitch</h3>
                    <textarea placeholder="Tell us your story in 3 sentences — what problem are you solving and why now? *" required className="input-field resize-none" rows={4} maxLength={500} value={formData.pitch} onChange={(e) => handleChange('pitch', e.target.value)} />
                    <p className="text-xs text-brand-grey mt-1">{formData.pitch.length}/500 characters</p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" required checked={formData.privacy} onChange={(e) => handleChange('privacy', e.target.checked)} className="w-4 h-4 text-brand-red rounded border-gray-300 mt-0.5 focus:ring-brand-red" />
                    <span className="text-xs text-brand-grey">I agree that the information provided is accurate and consent to GHL India Ventures contacting me regarding this application. I understand this is not a guarantee of investment.</span>
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
                  <p className="text-brand-grey text-sm mb-6">Thank you for applying. Our investment team will review your submission and respond within 5 working days.</p>
                  <button onClick={() => { setSubmitted(false); setFormData({ founderName: '', email: '', phone: '', linkedin: '', companyName: '', foundingYear: '', website: '', stage: '', sector: '', city: '', mrr: '', mau: '', metrics: '', amountSeeking: '', useOfFunds: '', pitch: '', privacy: false }) }} className="text-brand-red font-semibold text-sm hover:underline">
                    Submit Another Application
                  </button>
                </div>
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Our Process ── */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto max-w-3xl">
          <AnimatedSection className="text-center mb-12">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">What Happens Next</span>
            <h2 className="section-title mt-2 text-brand-black">Our Process</h2>
          </AnimatedSection>
          <div className="space-y-6">
            {PROCESS.map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 100}>
                <div className="flex gap-5">
                  <div className="shrink-0">
                    <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      {item.step}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-black mb-1">{item.title}</h3>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Clock className="w-3.5 h-3.5 text-brand-red" />
                      <span className="text-brand-red text-xs font-semibold">{item.timeline}</span>
                    </div>
                    <p className="text-brand-grey text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section-padding bg-brand-red">
        <div className="container-max mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Questions Before Applying?</h2>
            <p className="text-white/80 text-base max-w-2xl mx-auto mb-8">
              Schedule a quick call with our startup investment team to discuss your venture before submitting a formal application.
            </p>
            <Link href="/contact" className="inline-flex items-center px-8 py-3 bg-white text-brand-red font-bold text-sm rounded-lg hover:bg-gray-100 transition-all shadow-lg">
              Contact Us <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
