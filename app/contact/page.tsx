'use client'

import { useState } from 'react'
import AnimatedSection from '@/components/AnimatedSection'
import ConsultationForm from '@/components/ConsultationForm'
import { BRAND } from '@/lib/constants'
import {
  MapPin, Phone, Mail, Clock, Send, ChevronDown,
  MessageCircle, ArrowRight, Video, Headphones,
} from 'lucide-react'
import Link from 'next/link'

const FAQ_ITEMS = [
  {
    q: 'What is the minimum investment?',
    a: 'The minimum investment in our AIF is as per SEBI guidelines for Category II Alternative Investment Funds. This threshold ensures regulatory compliance and aligns with accredited investor requirements. Contact our team for current details.',
  },
  {
    q: 'How do I start investing?',
    a: 'The process is straightforward: (1) Connect with our investment team for an introductory consultation, (2) Complete your KYC documentation and investor suitability assessment, (3) Subscribe to the fund by signing the contribution agreement and transferring capital.',
  },
  {
    q: 'What sectors do you invest in?',
    a: 'We focus on stressed real estate resolution \u2014 acquiring distressed and under-valued properties across South India and revitalising them for sale, lease, or institutional exit.',
  },
  {
    q: 'Is my investment safe?',
    a: 'GHL India Ventures is a SEBI-registered Category II AIF (IN/AIF2/24-25/1517), subject to stringent regulatory oversight. We employ a rigorous risk management framework, diversified portfolio strategy, and institutional-grade governance. However, all alternative investments carry inherent risks and past performance does not guarantee future returns.',
  },
  {
    q: 'How are returns distributed?',
    a: 'Returns are distributed as per the terms outlined in the Private Placement Memorandum (PPM). We follow a waterfall distribution model where investors receive their preferred return first, followed by a performance allocation split as specified in the fund documents.',
  },
]

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* Hero — 2026-05-18: red-ribbon handshake artwork. The image is
          mostly white / light grey on the left where the copy sits, so
          we drop the dark overlay and switch the headline + subtitle
          to red + black for high contrast on the bright backdrop.
          Background stays white as a fallback in case the PNG fails
          to load (was bg-brand-black which used to bleed through). */}
      <section className="pt-48 pb-44 md:pb-60 lg:pb-72 relative overflow-hidden bg-white">
        {/* Backdrop photo — corporate handshake on red ribbon */}
        <picture aria-hidden="true">
          <source srcSet="/images/home/contact-hero-bg-sm.png" media="(max-width: 768px)" />
          <img
            src="/images/home/contact-hero-bg.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            loading="eager"
            decoding="async"
          />
        </picture>
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            {/* Soft "smoky" panel behind the copy — radial gradient that
                fades into the image at the edges so the headline remains
                readable where the handshake silhouettes overlap. */}
            <div
              className="inline-block max-w-3xl px-6 sm:px-8 py-6 sm:py-8 rounded-2xl"
              style={{
                background: 'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 55%, rgba(255,255,255,0) 100%)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.18em] text-brand-red">
                Get In Touch
              </span>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-4 mb-5">
                <span className="text-brand-red">Contact</span>{' '}
                <span className="text-brand-black">GHL India Ventures</span>
              </h1>
              <p className="text-sm md:text-base text-brand-black">
                Schedule a consultation with our investment team. We&apos;re here to guide you through every step of your investment journey.
              </p>
            </div>
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
                  <ConsultationForm />
                </div>
              </AnimatedSection>
            </div>

            {/* RIGHT: Info Panel (40%) */}
            <div className="lg:col-span-2">
              <AnimatedSection direction="right">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-brand-black dark:text-white mb-6">Contact Information</h2>
                  </div>

                  {/* Chennai HQ */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0 icon-ring-hover">
                      <MapPin className="w-6 h-6 text-brand-red" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-black dark:text-white text-base mb-1">Chennai (Head Office)</h3>
                      <p className="text-brand-grey dark:text-gray-300 text-sm leading-relaxed">{BRAND.address}</p>
                    </div>
                  </div>

                  {/* Pending Testing 30-04-2026 (DOCX #2): Delhi branch address.
                      EDIT IN PLACE — replace the placeholder lines below with the
                      real address. Lives here on purpose so it's easy to find. */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0 icon-ring-hover">
                      <MapPin className="w-6 h-6 text-brand-red" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-black dark:text-white text-base mb-1">Delhi (Branch Office)</h3>
                      <p className="text-brand-grey dark:text-gray-300 text-sm leading-relaxed">
                        {BRAND.delhiAddress}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0 icon-ring-hover">
                      <Phone className="w-6 h-6 text-brand-red" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-black dark:text-white text-base mb-1">Phone</h3>
                      <a href={`tel:${BRAND.phone1.replace(/\s/g, '')}`} className="text-brand-grey dark:text-gray-300 text-sm hover:text-brand-red transition-colors block">
                        {BRAND.phone1}
                      </a>
                      <a href={`tel:${BRAND.phone2.replace(/\s/g, '')}`} className="text-brand-grey dark:text-gray-300 text-sm hover:text-brand-red transition-colors block">
                        {BRAND.phone2}
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0 icon-ring-hover">
                      <Mail className="w-6 h-6 text-brand-red" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-black dark:text-white text-base mb-1">Email</h3>
                      <a href={`mailto:${BRAND.email}`} className="text-brand-red text-sm hover:underline">
                        {BRAND.email}
                      </a>
                    </div>
                  </div>

                  {/* Office Hours */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0 icon-ring-hover">
                      <Clock className="w-6 h-6 text-brand-red" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-black dark:text-white text-base mb-1">Office Hours</h3>
                      <p className="text-brand-grey dark:text-gray-300 text-sm">Mon &ndash; Sat &ndash; 10.00AM &ndash; 6.30PM IST</p>
                      <p className="text-brand-grey dark:text-gray-300 text-sm">Sunday: Closed</p>
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

                  {/* ── Connect With Us — Channel Buttons ── */}
                  <div>
                    <h3 className="font-bold text-brand-black dark:text-white text-base mb-4">Connect With Us</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Video Call — opens floating video widget */}
                      <button
                        onClick={() => {
                          const btn = document.querySelector('[aria-label="Open Sales & Support Video Call"]') as HTMLElement
                          if (btn) btn.click()
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-purple-600/20"
                      >
                        <Video className="w-5 h-5" />
                        <span>Video Call</span>
                      </button>

                      {/* Direct Call — opens floating Direct Call widget */}
                      <button
                        onClick={() => {
                          const btn = document.querySelector('[aria-label="Open Direct Call"]') as HTMLElement
                          if (btn) btn.click()
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-green-600/20"
                      >
                        <Phone className="w-5 h-5" />
                        <span>Direct Call</span>
                      </button>

                      {/* Email — opens email client */}
                      <a
                        href={`mailto:${BRAND.email}?subject=Investment%20Inquiry%20-%20GHL%20India%20Ventures`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-blue-600/20"
                      >
                        <Mail className="w-5 h-5" />
                        <span>Email Us</span>
                      </a>

                      {/* Telegram — opens Telegram */}
                      <a
                        href="https://t.me/ghlindia"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0088cc] hover:bg-[#006fa8] text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-[#0088cc]/20"
                      >
                        <Send className="w-5 h-5" />
                        <span>Telegram</span>
                      </a>
                    </div>
                  </div>

                  {/* WhatsApp — full-width CTA */}
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
              <h2 className="text-2xl md:text-3xl font-bold text-brand-black dark:text-white mt-3">
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
                    <span className="font-semibold text-brand-black dark:text-white pr-4">{item.q}</span>
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
                      <p className="text-brand-grey dark:text-gray-300 text-sm leading-relaxed">{item.a}</p>
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
