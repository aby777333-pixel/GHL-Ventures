'use client'

import { useState } from 'react'
import { submitContactForm, submitLead } from '@/lib/supabase/reportsDataService'
import { Send, Shield, AlertTriangle, Scale, CheckCircle, ArrowRight, ChevronDown, Mail, Phone, ExternalLink } from 'lucide-react'
import SpaceHero from '@/components/SpaceHero'
import AnimatedSection from '@/components/AnimatedSection'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'

const ESCALATION_LEVELS = [
  {
    level: 'Level 1',
    title: 'Compliance Officer',
    desc: 'Write to our Compliance Officer with details of your grievance. Response within 7 working days.',
    contact: 'compliance@ghlindiaventures.com',
    contactType: 'email' as const,
  },
  {
    level: 'Level 2',
    title: 'Managing Director',
    desc: 'If the resolution at Level 1 is unsatisfactory, escalate to the Managing Director. Response within 15 working days.',
    contact: 'md@ghlindiaventures.com',
    contactType: 'email' as const,
  },
  {
    level: 'Level 3',
    title: 'SEBI SCORES Portal',
    desc: 'If the matter remains unresolved after 30 days, investors may lodge a complaint on the SEBI SCORES portal.',
    contact: 'https://scores.sebi.gov.in',
    contactType: 'link' as const,
  },
]

export default function GrievancePage() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', folioNumber: '',
    complaintType: '', incidentDate: '', description: '',
    desiredResolution: '', contactedBefore: 'No', referenceNumber: '',
    privacy: false,
  })
  const [submitted, setSubmitted] = useState(false)
  const [openEscalation, setOpenEscalation] = useState<number | null>(null)

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    try {
      await Promise.all([
        submitContactForm({
          formType: 'grievance',
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: `Complaint: ${formData.complaintType}\nDate: ${formData.incidentDate}\n\n${formData.description}\n\nDesired Resolution: ${formData.desiredResolution}`,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
        submitLead({
          firstName: formData.name.split(' ')[0] || '',
          lastName: formData.name.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          phone: formData.phone,
          source: 'website',
          investmentInterest: 'grievance',
        }),
      ])
    } catch (err) { console.warn('Grievance form Supabase error:', err) }
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden gradient-dark pt-40 pb-12">
        <SpaceHero variant="eclipse" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-black/50 pointer-events-none" />
        <div className="container-max mx-auto relative z-10 text-center">
          <AnimatedSection>
            <span className="eyebrow text-brand-red">Investor Protection</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mt-3 mb-5">
              Grievance <span className="text-gradient">Redressal</span>
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              GHL India Ventures is committed to fair and transparent resolution of investor grievances as mandated by SEBI.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Our Commitment ── */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto max-w-4xl">
          <AnimatedSection>
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="card glow-card-blue text-center">
                <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-brand-red" />
                </div>
                <h3 className="font-bold text-brand-black mb-1 text-sm">SEBI Mandated</h3>
                <p className="text-brand-grey text-xs">Compliant with SEBI AIF grievance redressal guidelines</p>
              </div>
              <div className="card glow-card-emerald text-center">
                <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-brand-red" />
                </div>
                <h3 className="font-bold text-brand-black mb-1 text-sm">2-Day Acknowledgement</h3>
                <p className="text-brand-grey text-xs">All complaints acknowledged within 2 working days</p>
              </div>
              <div className="card glow-card-violet text-center">
                <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Scale className="w-6 h-6 text-brand-red" />
                </div>
                <h3 className="font-bold text-brand-black mb-1 text-sm">30-Day Resolution</h3>
                <p className="text-brand-grey text-xs">Target resolution within 30 calendar days per SEBI norms</p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <div className="bg-brand-offwhite rounded-2xl p-6 md:p-8">
              <h2 className="font-bold text-brand-black text-lg mb-3">Our Commitment to Investors</h2>
              <p className="text-brand-grey text-sm leading-relaxed mb-4">
                As a SEBI-registered Category II AIF (Registration No. <a href={BRAND.sebiUrl} target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline">{BRAND.sebi}</a>), GHL India Ventures maintains a robust grievance redressal mechanism to protect investor interests. Every complaint is taken seriously and handled with the utmost urgency and confidentiality.
              </p>
              <p className="text-brand-grey text-sm leading-relaxed">
                We follow a structured 3-level escalation framework. If a complaint is not resolved satisfactorily at one level, investors can escalate to the next level, with SEBI&apos;s SCORES portal as the final recourse.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Grievance Form ── */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto max-w-3xl">
          <AnimatedSection>
            <div className="card glow-card-blue">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="text-xl font-bold text-brand-black mb-2">Lodge a Grievance</h2>
                  <p className="text-brand-grey text-sm mb-6">Please provide as much detail as possible to help us resolve your concern quickly.</p>

                  {/* Investor Details */}
                  <div>
                    <h3 className="font-semibold text-brand-black text-sm uppercase tracking-wider mb-3">Investor Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Full Name *" required className="input-field" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
                      <input type="email" placeholder="Email *" required className="input-field" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey text-sm">+91</span>
                        <input type="tel" placeholder="Phone *" required className="input-field pl-14" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                      </div>
                      <input type="text" placeholder="Folio / Account Number (if known)" className="input-field" value={formData.folioNumber} onChange={(e) => handleChange('folioNumber', e.target.value)} />
                    </div>
                  </div>

                  {/* Complaint Details */}
                  <div>
                    <h3 className="font-semibold text-brand-black text-sm uppercase tracking-wider mb-3">Complaint Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <select className="input-field" value={formData.complaintType} onChange={(e) => handleChange('complaintType', e.target.value)} required>
                        <option value="">Complaint Type *</option>
                        <option value="Investment / Redemption">Investment / Redemption</option>
                        <option value="NAV Discrepancy">NAV Discrepancy</option>
                        <option value="Documentation">Documentation</option>
                        <option value="Communication">Communication</option>
                        <option value="Fee / Charges">Fee / Charges</option>
                        <option value="Other">Other</option>
                      </select>
                      <input type="date" className="input-field" value={formData.incidentDate} onChange={(e) => handleChange('incidentDate', e.target.value)} title="Date of Incident" />
                    </div>
                    <textarea placeholder="Description of your grievance — please include all relevant details *" required className="input-field resize-none mt-4" rows={5} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
                    <textarea placeholder="Desired resolution — what outcome would be satisfactory?" className="input-field resize-none mt-4" rows={3} value={formData.desiredResolution} onChange={(e) => handleChange('desiredResolution', e.target.value)} />
                  </div>

                  {/* Previous Contact */}
                  <div>
                    <h3 className="font-semibold text-brand-black text-sm uppercase tracking-wider mb-3">Previous Communication</h3>
                    <div className="flex items-center gap-6 mb-4">
                      <span className="text-sm text-brand-black">Have you contacted us about this before?</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="contactedBefore" value="Yes" checked={formData.contactedBefore === 'Yes'} onChange={(e) => handleChange('contactedBefore', e.target.value)} className="w-4 h-4 text-brand-red border-gray-300 focus:ring-brand-red" />
                        <span className="text-sm text-brand-black">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="contactedBefore" value="No" checked={formData.contactedBefore === 'No'} onChange={(e) => handleChange('contactedBefore', e.target.value)} className="w-4 h-4 text-brand-red border-gray-300 focus:ring-brand-red" />
                        <span className="text-sm text-brand-black">No</span>
                      </label>
                    </div>
                    {formData.contactedBefore === 'Yes' && (
                      <input type="text" placeholder="Previous Reference Number (if any)" className="input-field" value={formData.referenceNumber} onChange={(e) => handleChange('referenceNumber', e.target.value)} />
                    )}
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" required checked={formData.privacy} onChange={(e) => handleChange('privacy', e.target.checked)} className="w-4 h-4 text-brand-red rounded border-gray-300 mt-0.5 focus:ring-brand-red" />
                    <span className="text-xs text-brand-grey">I certify that the information provided is accurate to the best of my knowledge and consent to GHL India Ventures processing this complaint.</span>
                  </label>

                  <button type="submit" className="btn-primary w-full text-center flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Submit Grievance
                  </button>
                </form>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-black mb-2">Grievance Submitted</h3>
                  <p className="text-brand-grey text-sm mb-2">Your complaint has been received. You will receive an acknowledgement within 2 working days.</p>
                  <p className="text-brand-grey text-xs mb-6">We aim to resolve all grievances within 30 calendar days.</p>
                  <button onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', folioNumber: '', complaintType: '', incidentDate: '', description: '', desiredResolution: '', contactedBefore: 'No', referenceNumber: '', privacy: false }) }} className="text-brand-red font-semibold text-sm hover:underline">
                    Submit Another Grievance
                  </button>
                </div>
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Escalation Path ── */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto max-w-3xl">
          <AnimatedSection className="text-center mb-10">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Resolution Framework</span>
            <h2 className="section-title mt-2 text-brand-black">Escalation Path</h2>
          </AnimatedSection>

          <div className="space-y-4">
            {ESCALATION_LEVELS.map((item, i) => (
              <AnimatedSection key={item.level} delay={i * 100}>
                <div className={`border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden ${['glow-card-blue', 'glow-card-amber', 'glow-card-red'][i]}`}>
                  <button
                    onClick={() => setOpenEscalation(openEscalation === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-brand-red text-white text-xs font-bold px-2.5 py-1 rounded-full">{item.level}</span>
                      <span className="font-semibold text-brand-black">{item.title}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-brand-grey shrink-0 transition-transform duration-300 ${openEscalation === i ? 'rotate-180 text-brand-red' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openEscalation === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-5 pb-5">
                      <p className="text-brand-grey text-sm leading-relaxed mb-3">{item.desc}</p>
                      {item.contactType === 'email' ? (
                        <a href={`mailto:${item.contact}`} className="inline-flex items-center gap-2 text-brand-red font-semibold text-sm hover:underline">
                          <Mail className="w-4 h-4" /> {item.contact}
                        </a>
                      ) : (
                        <a href={item.contact} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-red font-semibold text-sm hover:underline">
                          <ExternalLink className="w-4 h-4" /> Visit SEBI SCORES
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Regulatory Info ── */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto max-w-4xl">
          <AnimatedSection>
            <div className="bg-gradient-to-br from-brand-black to-brand-darkgrey rounded-3xl p-8 md:p-10">
              <h3 className="text-white font-bold text-lg mb-6 text-center">Regulatory Information</h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-brand-red font-bold text-sm mb-1">SEBI Registration</div>
                  <a href={BRAND.sebiUrl} target="_blank" rel="noopener noreferrer" className="text-white text-xs hover:text-brand-red transition-colors">{BRAND.sebi}</a>
                </div>
                <div>
                  <div className="text-brand-red font-bold text-sm mb-1">Office</div>
                  <div className="text-white text-xs">{BRAND.address}</div>
                </div>
                <div>
                  <div className="text-brand-red font-bold text-sm mb-1">Contact</div>
                  <div className="text-white text-xs">
                    <a href={`tel:${BRAND.phone2.replace(/\s/g, '')}`} className="hover:text-brand-red transition-colors flex items-center justify-center gap-1">
                      <Phone className="w-3 h-3" /> {BRAND.phone2}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section-padding bg-brand-red">
        <div className="container-max mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Need Immediate Assistance?</h2>
            <p className="text-white/80 text-base max-w-2xl mx-auto mb-8">
              Call us directly or visit our Chennai office during business hours for urgent matters.
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
