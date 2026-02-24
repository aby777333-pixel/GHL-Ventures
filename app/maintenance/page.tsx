'use client'

import Link from 'next/link'
import {
  Wrench, Home, Phone, Mail, Clock, RefreshCw,
} from 'lucide-react'

export default function MaintenancePage() {
  return (
    <section className="min-h-screen flex items-center justify-center gradient-dark relative overflow-hidden">
      {/* Animated gear background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="relative">
          <svg viewBox="0 0 200 200" className="w-[400px] h-[400px] text-white/[0.02] animate-[spin_60s_linear_infinite]">
            <path fill="currentColor" d="M100 18a82 82 0 110 164 82 82 0 010-164zm0 24a58 58 0 100 116 58 58 0 000-116z"/>
            <rect fill="currentColor" x="92" y="0" width="16" height="36" rx="4"/>
            <rect fill="currentColor" x="92" y="164" width="16" height="36" rx="4"/>
            <rect fill="currentColor" x="0" y="92" width="36" height="16" rx="4"/>
            <rect fill="currentColor" x="164" y="92" width="36" height="16" rx="4"/>
            <rect fill="currentColor" x="28" y="28" width="16" height="36" rx="4" transform="rotate(45 36 46)"/>
            <rect fill="currentColor" x="156" y="136" width="16" height="36" rx="4" transform="rotate(45 164 154)"/>
            <rect fill="currentColor" x="136" y="28" width="36" height="16" rx="4" transform="rotate(45 154 36)"/>
            <rect fill="currentColor" x="28" y="156" width="36" height="16" rx="4" transform="rotate(45 46 164)"/>
          </svg>
        </div>
      </div>

      {/* Blue glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[180px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 text-center py-20 max-w-2xl">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-blue-500/20 animate-pulse">
            <Wrench className="w-10 h-10 text-blue-400" />
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          Under Maintenance
        </h2>
        <p className="text-gray-400 text-lg max-w-lg mx-auto mb-4 leading-relaxed">
          We&apos;re performing scheduled maintenance to improve your experience.
          This won&apos;t take long.
        </p>

        {/* Estimated time */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-10">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-blue-300 text-sm font-medium">
            Estimated downtime: 30 minutes
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-8 py-3 bg-brand-red text-white font-semibold rounded-full hover:bg-red-700 transition-all duration-300 shadow-lg shadow-brand-red/20"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Page
          </button>
          <Link
            href="/"
            className="inline-flex items-center px-8 py-3 border-2 border-white/20 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        </div>

        {/* Contact support */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-gray-400 text-sm mb-4">
            Need urgent assistance while we&apos;re down?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:+914428197777"
              className="inline-flex items-center gap-2 text-white hover:text-brand-red transition-colors text-sm font-medium"
            >
              <Phone className="w-4 h-4" />
              +91 44 2819 7777
            </a>
            <span className="hidden sm:inline text-gray-700">|</span>
            <a
              href="mailto:support@ghlindiaventures.com"
              className="inline-flex items-center gap-2 text-white hover:text-brand-red transition-colors text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              support@ghlindiaventures.com
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
