'use client'

/**
 * ConsultationForm — the "Request a Consultation" card (2026-09-07)
 * ------------------------------------------------------------------
 * Extracted verbatim from app/contact/page.tsx so the main contact page
 * and the standalone Meta landing page at /contact/consultation/ share
 * ONE implementation. Duplicating the markup would have let the two
 * drift, and the ad landing page silently falling behind the real form
 * is exactly the sort of bug nobody notices for months.
 *
 * Behaviour is unchanged from the original: dual write to
 * contact_submissions + leads, only hard-fail when neither persisted, and
 * a full-page navigation to /contact/thankyou/ on success so the Meta
 * Pixel reports a PageView at the conversion URL.
 */

import { useState } from 'react'
import Link from 'next/link'
import { submitContactForm, submitLead } from '@/lib/supabase/reportsDataService'
import { CheckCircle, Send } from 'lucide-react'
import { LegalLink } from '@/components/LegalPopup'

export default function ConsultationForm() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    inquiryType: '',
    investmentRange: '',
    contactMethod: 'Phone',
    message: '',
    accredited: false,
    privacy: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      // Both helpers swallow their own errors and report via the returned
      // { success } flag — so inspect the results rather than relying on a
      // rejected promise (that is how a broken lead write went unnoticed).
      const [contactRes, leadRes] = await Promise.all([
        submitContactForm({
          formType: formData.inquiryType || 'contact',
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          message: formData.message,
          investmentRange: formData.investmentRange,
          investmentInterest: formData.inquiryType,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
        submitLead({
          firstName: formData.name.split(' ')[0] || '',
          lastName: formData.name.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          source: 'website',
          investmentInterest: formData.inquiryType,
          investmentRange: formData.investmentRange,
          message: formData.message,
          contactMethod: formData.contactMethod,
        }),
      ])

      if (!contactRes?.success) console.warn('[contact] contact_submissions write failed:', (contactRes as any)?.error)
      if (!leadRes?.success) console.warn('[contact] leads write failed:', (leadRes as any)?.error)

      // Only hard-fail when nothing persisted. If one of the two landed the
      // enquiry is still reachable by the team (Comms → Contact, or the CRM),
      // and showing an error would only push the visitor into resubmitting.
      if (!contactRes?.success && !leadRes?.success) {
        setError('Something went wrong. Please try again, or email info@ghlindiaventures.com.')
        return
      }

      // Kept as a fallback: if the navigation below is blocked or slow, the
      // visitor still sees a confirmation instead of a stuck form.
      setSubmitted(true)

      // Send the visitor to the dedicated /contact/thankyou/ page so Meta can
      // key a URL-based custom conversion on it.
      //
      // This MUST be a real browser navigation, not router.push(): the
      // site-wide Pixel in app/layout.tsx fires fbq('track','PageView') once
      // on initial load and has no route-change listener, so a client-side
      // push would leave Meta with no PageView at the thank-you URL. A full
      // load re-runs the Pixel and reports the correct URL.
      //
      // The lead-notification email is an un-awaited fetch, so it is sent
      // with keepalive (see sendLeadNotification) to survive this navigation.
      if (typeof window !== 'undefined') {
        window.location.assign('/contact/thankyou/')
      }
    } catch (err) {
      console.warn('Form submission to Supabase failed:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }


  return (
    <>
                  {submitted ? (
                    <div className="text-center py-16">
                      {/* Animated checkmark */}
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
                        <div className="relative w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-brand-black dark:text-white mb-3">Thank You!</h3>
                      <p className="text-brand-grey dark:text-gray-300 mb-2 max-w-md mx-auto">
                        Your consultation request has been received. Our investment team will reach out within 24&ndash;48 business hours.
                      </p>
                      <p className="text-sm text-brand-grey dark:text-gray-300 mb-8">
                        In the meantime, explore our{' '}
                        <Link href="/downloads" className="text-brand-red hover:underline">downloads</Link>{' '}
                        or{' '}
                        <Link href="/fund" className="text-brand-red hover:underline">fund overview</Link>.
                      </p>
                      <button
                        onClick={() => {
                          setSubmitted(false)
                          setFormData({
                            name: '', email: '', phone: '', city: '', inquiryType: '', investmentRange: '',
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
                      <h2 className="text-2xl font-bold text-brand-black dark:text-white mb-2">Request a Consultation</h2>
                      <p className="text-brand-grey dark:text-gray-300 text-sm mb-8">
                        Fill in your details and our team will schedule a call at your convenience.
                      </p>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name */}
                        <div>
                          <label htmlFor="contact-name" className="block text-sm font-medium text-brand-black dark:text-white mb-2">
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
                            <label htmlFor="contact-email" className="block text-sm font-medium text-brand-black dark:text-white mb-2">
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
                            <label htmlFor="contact-phone" className="block text-sm font-medium text-brand-black dark:text-white mb-2">
                              Phone Number <span className="text-brand-red">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey dark:text-gray-300 text-sm font-medium">
                                +91
                              </span>
                              <input
                                id="contact-phone"
                                type="tel"
                                required
                                maxLength={10}
                                pattern="[0-9]{10}"
                                title="Please enter a valid 10-digit mobile number"
                                className="input-field pl-14"
                                placeholder="XXXXX XXXXX"
                                value={formData.phone}
                                onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); handleChange('phone', v) }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Inquiry Type + City */}
                        <div className="grid md:grid-cols-2 gap-5">
                          <div>
                            <label htmlFor="contact-inquiry" className="block text-sm font-medium text-brand-black dark:text-white mb-2">
                              Inquiry Type
                            </label>
                            <select
                              id="contact-inquiry"
                              className="input-field"
                              value={formData.inquiryType}
                              onChange={(e) => handleChange('inquiryType', e.target.value)}
                            >
                              <option value="">Select inquiry type</option>
                              <option value="investment">Investment Consultation</option>
                              <option value="fund-info">Fund Information</option>
                              <option value="nri-investment">NRI Investment</option>
                              <option value="land-broker">Land Broker</option>
                              <option value="realty-broker">Realty Broker</option>
                              <option value="startup-funding">Startup Funding</option>
                              <option value="partnership">Partnership Inquiry</option>
                              <option value="general">General Inquiry</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="contact-city" className="block text-sm font-medium text-brand-black dark:text-white mb-2">
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
                        </div>

                        {/* Investment Range */}
                        <div>
                          <label htmlFor="contact-range" className="block text-sm font-medium text-brand-black dark:text-white mb-2">
                            Investment Amount Range
                          </label>
                          <select
                            id="contact-range"
                            className="input-field"
                            value={formData.investmentRange}
                            onChange={(e) => handleChange('investmentRange', e.target.value)}
                          >
                            <option value="">Select a range</option>
                            <option value="under-1">{'\u20B9'}Under 1 Cr</option>
                            <option value="1-5">{'\u20B9'}1 Cr &ndash; {'\u20B9'}5 Cr</option>
                            <option value="5-10">{'\u20B9'}5 Cr &ndash; {'\u20B9'}10 Cr</option>
                            <option value="10-25">{'\u20B9'}10 Cr &ndash; {'\u20B9'}25 Cr</option>
                            <option value="25+">{'\u20B9'}25 Cr+</option>
                          </select>
                        </div>

                        {/* Preferred Contact Method */}
                        <div>
                          <label className="block text-sm font-medium text-brand-black dark:text-white mb-3">
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
                                <span className="text-sm text-brand-grey dark:text-gray-300 group-hover:text-brand-black dark:text-white transition-colors">
                                  {method}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Message */}
                        <div>
                          <label htmlFor="contact-message" className="block text-sm font-medium text-brand-black dark:text-white mb-2">
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
                            <span className="text-sm text-brand-grey dark:text-gray-300">
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
                            <span className="text-sm text-brand-grey dark:text-gray-300">
                              I agree to the{' '}
                              <LegalLink type="privacy" className="text-brand-red hover:underline">Privacy Policy</LegalLink>{' '}
                              and consent to being contacted. <span className="text-brand-red">*</span>
                            </span>
                          </label>
                        </div>

                        {/* Error Message */}
                        {error && (
                          <div className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                            {error}
                          </div>
                        )}

                        {/* Submit */}
                        <button type="submit" disabled={submitting} className="btn-primary w-full text-center disabled:opacity-60 disabled:cursor-not-allowed">
                          <Send className="w-4 h-4 mr-2" />
                          {submitting ? 'Submitting...' : 'Request a Consultation'}
                        </button>
                      </form>
                    </>
                  )}
    </>
  )
}
