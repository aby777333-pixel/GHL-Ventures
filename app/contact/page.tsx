'use client'

import { useState } from 'react'
import AnimatedSection from '@/components/AnimatedSection'
import { BRAND } from '@/lib/constants'
import {
  MapPin, Phone, Mail, Clock, Send, CheckCircle, ChevronDown,
  MessageCircle, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { LegalLink } from '@/components/LegalPopup'
import SpaceHero from '@/components/SpaceHero'

const FAQ_ITEMS = [
  {
    q: 'What is the minimum investment?',
    a: 'The minimum investment in our AIF is \u20B91 Crore, as per SEBI guidelines for Category II Alternative Investment Funds. This threshold ensures regulatory compliance and aligns with accredited investor requirements.',
  },
  {
    q: 'How do I start investing?',
    a: 'The process is straightforward: (1) Connect with our investment team for an introductory consultation, (2) Complete your KYC documentation and investor suitability assessment, (3) Subscribe to the fund by signing the contribution agreement and transferring capital.',
  },
  {
    q: 'What sectors do you invest in?',
    a: 'We focus on two primary verticals \u2014 stressed real estate resolution (distressed and under-valued properties across South India) and early-stage startup investments in technology, healthcare, fintech, and consumer sectors.',
  },
  {
    q: 'Is my investment safe?',
    a: 'GHL India Ventures is a SEBI-registered Category II AIF (IN/AIF2/2425/1517), subject to stringent regulatory oversight. We employ a rigorous risk management framework, diversified portfolio strategy, and institutional-grade governance. However, all alternative investments carry inherent risks and past performance does not guarantee future returns.',
  },
  {
    q: 'How are returns distributed?',
    a: 'Returns are distributed as per the terms outlined in the Private Placement Memorandum (PPM). We follow a waterfall distribution model where investors receive their preferred return first, followed by a performance allocation split as specified in the fund documents.',
  },
]

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    investmentRange: '',
    contactMethod: 'Phone',
    message: '',
    accredited: false,
    privacy: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <>
      {/* Hero */}
      <section className="pt-40 pb-12 gradient-dark relative overflow-hidden">
        {/* Space: Lunar theme */}
        <SpaceHero variant="lunar" />
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <span className="eyebrow">Get In Touch</span>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-4 mb-5">
              Contact <span className="text-gradient">GHL India Ventures</span>
            </h1>
            <p className="text-sm md:text-base text-gray-300 max-w-3xl">
              Schedule a consultation with our investment team. We&apos;re here to guide you through every step of your investment journey.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Split: Form + Info */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* LEFT: Form (60%) */}
            <div className="lg:col-span-3">
              <AnimatedSection direction="left">
                <div className="card glow-card-red">
                  {submitted ? (
                    <div className="text-center py-16">
                      {/* Animated checkmark */}
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
                        <div className="relative w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-brand-black mb-3">Thank You!</h3>
                      <p className="text-brand-grey mb-2 max-w-md mx-auto">
                        Your consultation request has been received. Our investment team will reach out within 24&ndash;48 business hours.
                      </p>
                      <p className="text-sm text-brand-grey mb-8">
                        In the meantime, explore our{' '}
                        <Link href="/downloads" className="text-brand-red hover:underline">downloads</Link>{' '}
                        or{' '}
                        <Link href="/fund" className="text-brand-red hover:underline">fund overview</Link>.
                      </p>
                      <button
                        onClick={() => {
                          setSubmitted(false)
                          setFormData({
                            name: '', email: '', phone: '', city: '', investmentRange: '',
                            contactMethod: 'Phone', message: '', accredited: false, privacy: false,
                          })
                        }}
                        className="btn-outline-red"
                      >
                        Submit Another Inquiry
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-brand-black mb-2">Request a Consultation</h2>
                      <p className="text-brand-grey text-sm mb-8">
                        Fill in your details and our team will schedule a call at your convenience.
                      </p>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name */}
                        <div>
                          <label htmlFor="contact-name" className="block text-sm font-medium text-brand-black mb-2">
                            Full Name <span className="text-brand-red">*</span>
                          </label>
                          <input
                            id="contact-name"
                            type="text"
                            required
                            className="input-field"
                            placeholder="Your full legal name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                          />
                        </div>

                        {/* Email + Phone */}
                        <div className="grid md:grid-cols-2 gap-5">
                          <div>
                            <label htmlFor="contact-email" className="block text-sm font-medium text-brand-black mb-2">
                              Email Address <span className="text-brand-red">*</span>
                            </label>
                            <input
                              id="contact-email"
                              type="email"
                              required
                              className="input-field"
                              placeholder="you@email.com"
                              value={formData.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                            />
                          </div>
                          <div>
                            <label htmlFor="contact-phone" className="block text-sm font-medium text-brand-black mb-2">
                              Phone Number <span className="text-brand-red">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey text-sm font-medium">
                                +91
                              </span>
                              <input
                                id="contact-phone"
                                type="tel"
                                required
                                className="input-field pl-14"
                                placeholder="XXXXX XXXXX"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* City + Investment Range */}
                        <div className="grid md:grid-cols-2 gap-5">
                          <div>
                            <label htmlFor="contact-city" className="block text-sm font-medium text-brand-black mb-2">
                              City of Residence
                            </label>
                            <input
                              id="contact-city"
                              type="text"
                              className="input-field"
                              placeholder="e.g. Chennai, Mumbai"
                              value={formData.city}
                              onChange={(e) => handleChange('city', e.target.value)}
                            />
                          </div>
                          <div>
                            <label htmlFor="contact-range" className="block text-sm font-medium text-brand-black mb-2">
                              Investment Amount Range
                            </label>
                            <select
                              id="contact-range"
                              className="input-field"
                              value={formData.investmentRange}
                              onChange={(e) => handleChange('investmentRange', e.target.value)}
                            >
                              <option value="">Select a range</option>
                              <option value="1-5">{'\u20B9'}1 Cr &ndash; {'\u20B9'}5 Cr</option>
                              <option value="5-10">{'\u20B9'}5 Cr &ndash; {'\u20B9'}10 Cr</option>
                              <option value="10-25">{'\u20B9'}10 Cr &ndash; {'\u20B9'}25 Cr</option>
                              <option value="25+">{'\u20B9'}25 Cr+</option>
                            </select>
                          </div>
                        </div>

                        {/* Preferred Contact Method */}
                        <div>
                          <label className="block text-sm font-medium text-brand-black mb-3">
                            Preferred Contact Method
                          </label>
                          <div className="flex flex-wrap gap-6">
                            {['Phone', 'Email', 'WhatsApp'].map((method) => (
                              <label key={method} className="flex items-center space-x-2 cursor-pointer group">
                                <input
                                  type="radio"
                                  name="contactMethod"
                                  value={method}
                                  checked={formData.contactMethod === method}
                                  onChange={(e) => handleChange('contactMethod', e.target.value)}
                                  className="w-4 h-4 text-brand-red border-gray-300 focus:ring-brand-red"
                                />
                                <span className="text-sm text-brand-grey group-hover:text-brand-black transition-colors">
                                  {method}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Message */}
                        <div>
                          <label htmlFor="contact-message" className="block text-sm font-medium text-brand-black mb-2">
                            Message
                          </label>
                          <textarea
                            id="contact-message"
                            rows={4}
                            className="input-field resize-none"
                            placeholder="Tell us about your investment goals or any questions you have..."
                            value={formData.message}
                            onChange={(e) => handleChange('message', e.target.value)}
                          />
                        </div>

                        {/* Checkboxes */}
                        <div className="space-y-3">
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.accredited}
                              onChange={(e) => handleChange('accredited', e.target.checked)}
                              className="w-4 h-4 text-brand-red rounded border-gray-300 mt-0.5 focus:ring-brand-red"
                            />
                            <span className="text-sm text-brand-grey">
                              I am an accredited / qualified investor as defined by SEBI regulations
                            </span>
                          </label>

                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              required
                              checked={formData.privacy}
                              onChange={(e) => handleChange('privacy', e.target.checked)}
                              className="w-4 h-4 text-brand-red rounded border-gray-300 mt-0.5 focus:ring-brand-red"
                            />
                            <span className="text-sm text-brand-grey">
                              I agree to the{' '}
                              <LegalLink type="privacy" className="text-brand-red hover:underline">Privacy Policy</LegalLink>{' '}
                              and consent to being contacted. <span className="text-brand-red">*</span>
                            </span>
                          </label>
                        </div>

                        {/* Submit */}
                        <button type="submit" className="btn-primary w-full text-center">
                          <Send className="w-4 h-4 mr-2" />
                          Request a Consultation
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </AnimatedSection>
            </div>

            {/* RIGHT: Info Panel (40%) */}
            <div className="lg:col-span-2">
              <AnimatedSection direction="right">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-brand-black mb-6">Contact Information</h2>
                  </div>

                  {/* Office Address */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-brand-red" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-black text-base mb-1">Office Address</h3>
                      <p className="text-brand-grey text-sm leading-relaxed">{BRAND.address}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-brand-red" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-black text-base mb-1">Phone</h3>
                      <a href={`tel:${BRAND.phone1.replace(/\s/g, '')}`} className="text-brand-grey text-sm hover:text-brand-red transition-colors block">
                        {BRAND.phone1}
                      </a>
                      <a href={`tel:${BRAND.phone2.replace(/\s/g, '')}`} className="text-brand-grey text-sm hover:text-brand-red transition-colors block">
                        {BRAND.phone2}
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-brand-red" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-black text-base mb-1">Email</h3>
                      <a href={`mailto:${BRAND.email}`} className="text-brand-red text-sm hover:underline">
                        {BRAND.email}
                      </a>
                    </div>
                  </div>

                  {/* Office Hours */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-brand-red" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-black text-base mb-1">Office Hours</h3>
                      <p className="text-brand-grey text-sm">Mon &ndash; Fri, 9:30 AM &ndash; 6:30 PM IST</p>
                      <p className="text-brand-grey text-sm">Saturday &ndash; Sunday: Closed</p>
                    </div>
                  </div>

                  {/* Google Maps Embed */}
                  <div className="rounded-2xl h-48 overflow-hidden relative">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.4!2d80.2609!3d13.0719!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDA0JzE4LjgiTiA4MMKwMTUnMzkuMiJF!5e0!3m2!1sen!2sin!4v1708250000000!5m2!1sen!2sin"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="GHL India Ventures Office - Queens Court, Egmore, Chennai"
                    />
                  </div>

                  {/* WhatsApp Quick Link */}
                  <a
                    href="https://wa.me/917200255252?text=Hi%2C%20I%27d%20like%20to%20learn%20more%20about%20GHL%20India%20Ventures."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-3 w-full py-3 px-6 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-semibold rounded-full transition-all duration-300 hover:scale-105"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto max-w-3xl">
          <AnimatedSection>
            <div className="text-center mb-8">
              <span className="eyebrow">FAQ</span>
              <h2 className="text-2xl md:text-3xl font-bold text-brand-black mt-3">
                Frequently Asked Questions
              </h2>
            </div>
          </AnimatedSection>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <AnimatedSection key={index} delay={index * 80}>
                <div className={`border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden ${['glow-card-blue','glow-card-violet','glow-card-emerald','glow-card-amber','glow-card-cyan'][index % 5]}`}>
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    aria-expanded={openFaq === index}
                  >
                    <span className="font-semibold text-brand-black pr-4">{item.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-brand-grey shrink-0 transition-transform duration-300 ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-5 pb-5">
                      <p className="text-brand-grey text-sm leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
