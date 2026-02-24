'use client'

import Link from 'next/link'
import {
  ShieldX, Home, ArrowLeft, Lock, Phone, LogIn,
} from 'lucide-react'

export default function ForbiddenPage() {
  return (
    <section className="min-h-screen flex items-center justify-center gradient-dark relative overflow-hidden">
      {/* Background decorative 403 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-[220px] md:text-[350px] lg:text-[450px] font-extrabold text-white/[0.02] leading-none tracking-tighter">
          403
        </span>
      </div>

      {/* Amber glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[180px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 text-center py-20 max-w-2xl">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-amber-500/20">
            <ShieldX className="w-10 h-10 text-amber-500" />
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          Access Denied
        </h2>
        <p className="text-gray-400 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
          You don&apos;t have permission to access this page. If you believe this is an error, please contact your administrator or log in with appropriate credentials.
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link
            href="/login"
            className="inline-flex items-center px-8 py-3 bg-brand-red text-white font-semibold rounded-full hover:bg-red-700 transition-all duration-300 shadow-lg shadow-brand-red/20"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Log In
          </Link>
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

        {/* Info card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium mb-1">Why am I seeing this?</p>
              <ul className="text-gray-400 text-xs space-y-1 leading-relaxed">
                <li>Your session may have expired</li>
                <li>Your role may not have access to this module</li>
                <li>The resource may require additional authorization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
