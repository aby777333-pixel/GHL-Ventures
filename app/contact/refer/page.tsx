'use client'

import { useState } from 'react'
import { submitContactForm, submitLead } from '@/lib/supabase/reportsDataService'
import { Send, Users, Heart, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react'
import SpaceHero from '@/components/SpaceHero'
import AnimatedSection from '@/components/AnimatedSection'
import Link from 'next/link'

const STEPS = [
  { step: '01', title: 'Submit a Referral', desc: 'Fill out the form below with your details and the details of the person you are referring.' },
  { step: '02', title: 'We Reach Out', desc: 'Our investment advisory team contacts your referral within 48 business hours for a personal consultation.' },
  { step: '03', title: 'Build Wealth Together', desc: 'When your referral invests, you have helped connect them to institutional-grade alternative investments.' },
]

const BENEFITS = [
  { icon: TrendingUp, title: 'Institutional-Grade Access', desc: 'Connect your network to SEBI-registered Category II AIF opportunities typically reserved for institutional investors.', glow: 'glow-card-blue' },
  { icon: Heart, title: 'Add Genuine Value', desc: 'Help HNIs in your circle diversify beyond equities and fixed deposits into alternative asset classes with strong return potential.', glow: 'glow-card-emerald' },
  { icon: Users, title: 'Strengthen Relationships', desc: 'Build trust and strengthen professional relationships by introducing meaningful financial opportunities.', glow: 'glow-card-violet' },
]

export default function ReferPage() {
  const [formData, setFormData] = useState({
    yourName: '', yourEmail: '', yourPhone: '', relationship: '',
    theirName: '', theirEmail: '', theirPhone: '', theirCity: '',
    investableSurplus: '', message: '', privacy: false,
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
          formType: 'refer_investor',
          fullName: formData.yourName,
          email: formData.yourEmail,
          phone: formData.yourPhone,
          message: formData.message,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
        submitLead({
          firstName: formData.theirName.split(' ')[0] || '',
          lastName: formData.theirName.split(' ').slice(1).join(' ') || '',
          email: formData.theirEmail,
          phone: formData.theirPhone,
          city: formData.theirCity,
          source: 'referral',
          investmentInterest: formData.investableSurplus,
          investmentRange: formData.investableSurplus,
          message: formData.message,
        }),
      ])
    } catch (err) { console.warn('Referral form Supabase error:', err) }
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden gradient-dark pt-40 pb-12">
        <SpaceHero variant="meteor" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-black/50 pointer-events-none" />
        <div className="container-max mx-auto relative z-10 text-center">
          <AnimatedSection>
            <span className="eyebrow text-brand-red">Referral Programme</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mt-3 mb-5">
              Refer an <span className="text-gradient">Investor</span>
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              Know someone who could benefit from institutional-grade alternative investments? Introduce them to GHL India Ventures.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-12">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Simple Process</span>
            <h2 className="section-title mt-2 text-brand-black">How It Works</h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <AnimatedSection key={step.step} delay={i * 100}>
                <div className="text-center">
                  <div className="w-14 h-14 bg-brand-red/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-brand-red font-bold text-lg">{step.step}</span>
                  </div>
                  <h3 className="font-bold text-brand-black text-lg mb-2">{step.title}</h3>
                  <p className="text-brand-grey text-sm leading-relaxed">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Referral Form ── */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto max-w-3xl">
          <AnimatedSection>
            <div className="card glow-card-red">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="text-xl font-bold text-brand-black mb-2">Referral Form</h2>
                  <p className="text-brand-grey text-sm mb-6">All information is kept strictly confidential and used only to reach out to your referral.</p>

                  {/* Your Details */}
                  <div>
                    <h3 className="font-semibold text-brand-black text-sm uppercase tracking-wider mb-3">Your Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Your Full Name *" required className="input-field" value={formData.yourName} onChange={(e) => handleChange('yourName', e.target.value)} />
                      <input type="email" placeholder="Your Email *" required className="input-field" value={formData.yourEmail} onChange={(e) => handleChange('yourEmail', e.target.value)} />
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey text-sm">+91</span>
                        <input type="tel" placeholder="Your Phone *" required className="input-field pl-14" value={formData.yourPhone} onChange={(e) => handleChange('yourPhone', e.target.value)} />
                      </div>
                      <select className="input-field" value={formData.relationship} onChange={(e) => handleChange('relationship', e.target.value)} required>
                        <option value="">Relationship *</option>
                        <option value="Family">Family</option>
                        <option value="Friend">Friend</option>
                        <option value="Business Associate">Business Associate</option>
                        <option value="Professional Network">Professional Network</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Investee Details */}
                  <div>
                    <h3 className="font-semibold text-brand-black text-sm uppercase tracking-wider mb-3">Investee Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Their Full Name *" required className="input-field" value={formData.theirName} onChange={(e) => handleChange('theirName', e.target.value)} />
                      <input type="email" placeholder="Their Email (Optional)" className="input-field" value={formData.theirEmail} onChange={(e) => handleChange('theirEmail', e.target.value)} />
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey text-sm">+91</span>
                        <input type="tel" placeholder="Their Phone *" required className="input-field pl-14" value={formData.theirPhone} onChange={(e) => handleChange('theirPhone', e.target.value)} />
                      </div>
                      <input type="text" placeholder="Their City" className="input-field" value={formData.theirCity} onChange={(e) => handleChange('theirCity', e.target.value)} />
                    </div>
                    <div className="mt-4">
                      <select className="input-field" value={formData.investableSurplus} onChange={(e) => handleChange('investableSurplus', e.target.value)}>
                        <option value="">Approximate Investable Surplus</option>
                        <option value="1-5Cr">₹1 – 5 Crore</option>
                        <option value="5-10Cr">₹5 – 10 Crore</option>
                        <option value="10Cr+">₹10 Crore+</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    placeholder="Why might they be interested? (Optional context for our team)"
                    className="input-field resize-none"
                    rows={3}
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                  />

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" required checked={formData.privacy} onChange={(e) => handleChange('privacy', e.target.checked)} className="w-4 h-4 text-brand-red rounded border-gray-300 mt-0.5 focus:ring-brand-red" />
                    <span className="text-xs text-brand-grey">I confirm that the person I am referring is aware I am sharing their contact details and consent to being contacted by GHL India Ventures.</span>
                  </label>

                  <button type="submit" className="btn-primary w-full text-center flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Submit Referral
                  </button>
                </form>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-black mb-2">Referral Submitted!</h3>
                  <p className="text-brand-grey text-sm mb-6">Thank you for your referral. Our team will reach out to your contact within 48 business hours.</p>
                  <button onClick={() => { setSubmitted(false); setFormData({ yourName: '', yourEmail: '', yourPhone: '', relationship: '', theirName: '', theirEmail: '', theirPhone: '', theirCity: '', investableSurplus: '', message: '', privacy: false }) }} className="text-brand-red font-semibold text-sm hover:underline">
                    Submit Another Referral
                  </button>
                </div>
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Why Refer ── */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-12">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Benefits</span>
            <h2 className="section-title mt-2 text-brand-black">Why Refer?</h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-6">
            {BENEFITS.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 100}>
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

      {/* ── CTA ── */}
      <section className="section-padding bg-brand-red">
        <div className="container-max mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Want to Learn More First?</h2>
            <p className="text-white/80 text-base max-w-2xl mx-auto mb-8">
              Explore our fund structure, strategy, and track record before making a referral.
            </p>
            <Link href="/fund" className="inline-flex items-center px-8 py-3 bg-white text-brand-red font-bold text-sm rounded-lg hover:bg-gray-100 transition-all shadow-lg">
              Explore Our Fund <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
