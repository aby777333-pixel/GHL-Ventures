'use client'

/**
 * /contact/consultation/ — standalone consultation landing page (2026-09-07)
 * ------------------------------------------------------------------
 * A focused destination for Meta ad traffic: headline, trust signals and
 * the consultation form, without the FAQ / office-info / hero imagery of
 * the main /contact/ page.
 *
 * The form itself is the SHARED <ConsultationForm />, the same component
 * /contact/ renders — so this page can never drift from the real form, and
 * it inherits the same submit behaviour, including the redirect to
 * /contact/thankyou/ that Meta keys its conversion on.
 */

import AnimatedSection from '@/components/AnimatedSection'
import ConsultationForm from '@/components/ConsultationForm'
import { ShieldCheck, Clock, Lock } from 'lucide-react'

const TRUST_POINTS = [
  { icon: ShieldCheck, label: 'SEBI Registered', detail: 'Category II AIF · IN/AIF2/24-25/1517' },
  { icon: Clock, label: 'Response in 24–48 hrs', detail: 'A senior team member calls you back' },
  { icon: Lock, label: 'Your details stay private', detail: 'Shared only with our investment team' },
]

export default function ConsultationLandingPage() {
  return (
    <section className="section-padding bg-brand-offwhite pt-32 md:pt-40">
      <div className="container-max mx-auto">
        <AnimatedSection>
          <div className="max-w-2xl mx-auto text-center mb-10">
            <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.18em] text-brand-red">
              Speak with our investment team
            </span>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-4 mb-4">
              <span className="text-brand-red">Request</span>{' '}
              <span className="text-brand-black dark:text-white">a Consultation</span>
            </h1>
            <p className="text-sm md:text-base text-brand-grey dark:text-gray-300">
              Tell us a little about what you are looking for. We will schedule a call at a time that suits you
              and walk you through the fund, the process and the paperwork.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid lg:grid-cols-5 gap-6 items-start">
          {/* Form */}
          <div className="lg:col-span-3">
            <AnimatedSection direction="left">
              <div className="card glow-card-red">
                <ConsultationForm />
              </div>
            </AnimatedSection>
          </div>

          {/* Trust signals */}
          <div className="lg:col-span-2">
            <AnimatedSection direction="right">
              <div className="space-y-6">
                {TRUST_POINTS.map((point) => {
                  const Icon = point.icon
                  return (
                    <div key={point.label} className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0 icon-ring-hover">
                        <Icon className="w-6 h-6 text-brand-red" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-brand-black dark:text-white mb-1">{point.label}</h2>
                        <p className="text-sm text-brand-grey dark:text-gray-300">{point.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  )
}
