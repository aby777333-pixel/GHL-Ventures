'use client'

import { useState, useEffect } from 'react'
import { BRAND } from '@/lib/constants'
import { Cookie, X, Settings } from 'lucide-react'
import Link from 'next/link'

const STORAGE_KEY = 'ghl-cookie-consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true, // always on
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    // Check if user already consented
    const consent = localStorage.getItem(STORAGE_KEY)
    if (consent) {
      return // already consented, don't show
    }

    // Show after 2 second delay
    const timer = setTimeout(() => {
      setVisible(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() })
    )
    setVisible(false)
  }

  const handleDeclineNonEssential = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ necessary: true, analytics: false, marketing: false, timestamp: Date.now() })
    )
    setVisible(false)
  }

  const handleSavePreferences = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...preferences, timestamp: Date.now() })
    )
    setVisible(false)
  }

  const handleDismiss = () => {
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9997] px-4 pb-4 animate-slide-up">
      <div className="container-max mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Main banner */}
          <div className="p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start space-x-4 flex-1">
                <div className="w-10 h-10 bg-brand-red/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Cookie className="w-5 h-5 text-brand-red" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-brand-black leading-relaxed">
                    We use cookies to improve your experience on our website. By continuing to browse, you agree to our{' '}
                    <Link href="/privacy" className="text-brand-red hover:underline font-medium">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>

              {/* Dismiss X */}
              <button
                onClick={handleDismiss}
                className="text-brand-grey hover:text-brand-black transition-colors shrink-0 mt-0.5"
                aria-label="Dismiss cookie banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preferences panel (expanded) */}
            {showPreferences && (
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-black">Necessary Cookies</p>
                    <p className="text-xs text-brand-grey">Required for the website to function properly.</p>
                  </div>
                  <div className="w-10 h-6 bg-brand-red rounded-full relative cursor-not-allowed opacity-80">
                    <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-black">Analytics Cookies</p>
                    <p className="text-xs text-brand-grey">Help us understand how visitors interact with the site.</p>
                  </div>
                  <button
                    onClick={() => setPreferences((p) => ({ ...p, analytics: !p.analytics }))}
                    className={`w-10 h-6 rounded-full relative transition-colors ${
                      preferences.analytics ? 'bg-brand-red' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                        preferences.analytics ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-black">Marketing Cookies</p>
                    <p className="text-xs text-brand-grey">Used to deliver relevant ads and campaigns.</p>
                  </div>
                  <button
                    onClick={() => setPreferences((p) => ({ ...p, marketing: !p.marketing }))}
                    className={`w-10 h-6 rounded-full relative transition-colors ${
                      preferences.marketing ? 'bg-brand-red' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                        preferences.marketing ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                <button
                  onClick={handleSavePreferences}
                  className="btn-primary text-sm w-full md:w-auto"
                >
                  Save Preferences
                </button>
              </div>
            )}

            {/* Action buttons */}
            {!showPreferences && (
              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-end">
                <button
                  onClick={() => setShowPreferences(true)}
                  className="inline-flex items-center justify-center text-sm text-brand-grey hover:text-brand-black transition-colors font-medium order-3 sm:order-1"
                >
                  <Settings className="w-4 h-4 mr-1.5" />
                  Manage Preferences
                </button>
                <button
                  onClick={handleDeclineNonEssential}
                  className="px-6 py-2.5 text-sm font-semibold text-brand-black border border-gray-300 rounded-full hover:bg-gray-50 transition-all order-2"
                >
                  Decline Non-Essential
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="btn-primary text-sm order-1 sm:order-3"
                >
                  Accept All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
