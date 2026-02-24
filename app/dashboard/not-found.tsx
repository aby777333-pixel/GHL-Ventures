'use client'

import Link from 'next/link'
import {
  Compass, ArrowLeft, LayoutDashboard, Wallet, TrendingUp,
  FileText, Bell, Settings,
} from 'lucide-react'

const INVESTOR_LINKS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Portfolio', href: '/dashboard/portfolio', icon: Wallet },
  { label: 'Performance', href: '/dashboard/performance', icon: TrendingUp },
  { label: 'Documents', href: '/dashboard/documents', icon: FileText },
  { label: 'Alerts', href: '/dashboard/alerts', icon: Bell },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardNotFound() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #0d0d14 50%, #0a0a0a 100%)' }}
    >
      {/* Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-[200px] md:text-[320px] font-extrabold text-white/[0.015] leading-none tracking-tighter">
          404
        </span>
      </div>

      {/* Blue accent glow for investor portal */}
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 text-center py-16 max-w-3xl">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20">
            <Compass className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">
          Investor Dashboard
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-400 text-base max-w-md mx-auto mb-10 leading-relaxed">
          The dashboard page you&apos;re looking for doesn&apos;t exist.
          Navigate to your portfolio or other sections below.
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-2.5 bg-brand-red text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all duration-300 shadow-lg shadow-brand-red/20"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-6 py-2.5 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div className="max-w-xl mx-auto">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-semibold mb-4">
            Quick Navigation
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {INVESTOR_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-gray-400 text-xs hover:bg-white/[0.06] hover:text-blue-400 hover:border-blue-500/20 transition-all duration-300"
                >
                  <Icon className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400 transition-colors shrink-0" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
