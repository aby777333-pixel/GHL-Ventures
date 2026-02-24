'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, Home, ArrowLeft, RefreshCw, Phone,
} from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GHL Error Boundary]', error)
  }, [error])

  return (
    <section className="min-h-screen flex items-center justify-center gradient-dark relative overflow-hidden">
      {/* Background decorative 500 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-[220px] md:text-[350px] lg:text-[450px] font-extrabold text-white/[0.02] leading-none tracking-tighter">
          500
        </span>
      </div>

      {/* Subtle red glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[180px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 text-center py-20 max-w-2xl">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-red-500/20">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          Something Went Wrong
        </h2>
        <p className="text-gray-400 text-lg max-w-lg mx-auto mb-4 leading-relaxed">
          An unexpected error occurred. Our team has been notified. Please try again or contact support if the issue persists.
        </p>

        {error.digest && (
          <p className="text-gray-600 text-xs font-mono mb-8">
            Error ID: {error.digest}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <button
            onClick={reset}
            className="inline-flex items-center px-8 py-3 bg-brand-red text-white font-semibold rounded-full hover:bg-red-700 transition-all duration-300 shadow-lg shadow-brand-red/20"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center px-8 py-3 border-2 border-white/20 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-8 py-3 border-2 border-white/20 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>

        {/* Support contact */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-3">
            Need immediate help?
          </p>
          <a
            href="tel:+914428197777"
            className="inline-flex items-center gap-2 text-brand-red hover:text-red-400 transition-colors text-sm font-medium"
          >
            <Phone className="w-4 h-4" />
            +91 44 2819 7777
          </a>
        </div>
      </div>
    </section>
  )
}
