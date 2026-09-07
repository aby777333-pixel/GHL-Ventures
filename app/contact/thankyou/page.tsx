'use client'

/**
 * /contact/thankyou/ — conversion landing page (2026-09-07)
 * ------------------------------------------------------------------
 * The contact form used to swap to an inline "Thank You" panel, which
 * never changed the URL. Meta could not be given a URL-based custom
 * conversion, and the site-wide Pixel in app/layout.tsx fires
 * `fbq('track','PageView')` ONCE on initial load with no route-change
 * listener — so a client-side router.push here would not have produced a
 * PageView at this URL either.
 *
 * The form therefore performs a real browser navigation to this page, so
 * the Pixel script re-runs and reports a genuine PageView for
 * /contact/thankyou/ — which is what a Meta URL custom conversion keys on.
 *
 * On top of that this page fires the standard `Lead` event, so the
 * conversion can be tracked either way (Lead event or URL rule). Both are
 * guarded and fire at most once per mount.
 */

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import { CheckCircle } from 'lucide-react'

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

export default function ContactThankYouPage() {
  const fired = useRef(false)

  useEffect(() => {
    // React 18 StrictMode double-invokes effects in dev; the ref keeps the
    // conversion to one per page view.
    if (fired.current) return
    fired.current = true
    try {
      window.fbq?.('track', 'Lead', {
        content_name: 'Contact consultation request',
        content_category: 'contact',
      })
    } catch { /* analytics must never break the page */ }
    try {
      window.dataLayer?.push({ event: 'generate_lead', form_location: 'contact' })
    } catch { /* analytics must never break the page */ }
  }, [])

  return (
    <section className="section-padding bg-brand-offwhite min-h-[70vh] flex items-center">
      <div className="container-max mx-auto">
        <AnimatedSection>
          <div className="max-w-2xl mx-auto">
            <div className="card glow-card-red">
              <div className="text-center py-16">
                {/* Animated checkmark */}
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
                  <div className="relative w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-brand-black dark:text-white mb-3">Thank You!</h1>
                <p className="text-brand-grey dark:text-gray-300 mb-2 max-w-md mx-auto">
                  Your consultation request has been received. Our investment team will reach out within 24&ndash;48 business hours.
                </p>
                <p className="text-sm text-brand-grey dark:text-gray-300 mb-8">
                  In the meantime, explore our{' '}
                  <Link href="/downloads" className="text-brand-red hover:underline">downloads</Link>{' '}
                  or{' '}
                  <Link href="/fund" className="text-brand-red hover:underline">fund overview</Link>.
                </p>
                <Link href="/contact" className="btn-outline-red">
                  Submit Another Inquiry
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
