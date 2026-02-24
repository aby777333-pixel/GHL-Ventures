'use client'

import Link from 'next/link'
import {
  ShieldAlert, ArrowLeft, LayoutDashboard, Users, FileText,
  BarChart3, Settings, Shield,
} from 'lucide-react'

const ADMIN_LINKS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Clients', href: '/admin/clients', icon: Users },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Compliance', href: '/admin/compliance', icon: Shield },
  { label: 'Documents', href: '/admin/reports/documents', icon: FileText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminNotFound() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0d0d0d 100%)' }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-[200px] md:text-[320px] font-extrabold text-white/[0.015] leading-none tracking-tighter">
          404
        </span>
      </div>

      {/* Red accent glow */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brand-red/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 text-center py-16 max-w-3xl">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center mx-auto border border-brand-red/20">
            <ShieldAlert className="w-8 h-8 text-brand-red" />
          </div>
        </div>

        <p className="text-brand-red text-xs font-bold uppercase tracking-[0.2em] mb-3">
          Admin Command Center
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Module Not Found
        </h2>
        <p className="text-gray-400 text-base max-w-md mx-auto mb-10 leading-relaxed">
          The admin page you&apos;re looking for doesn&apos;t exist or has been restructured.
          Navigate to an available module below.
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <Link
            href="/admin"
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
            Admin Modules
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ADMIN_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-gray-400 text-xs hover:bg-white/[0.06] hover:text-brand-red hover:border-brand-red/20 transition-all duration-300"
                >
                  <Icon className="w-3.5 h-3.5 text-gray-600 group-hover:text-brand-red transition-colors shrink-0" />
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
