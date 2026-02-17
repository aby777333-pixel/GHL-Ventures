'use client'

import Link from 'next/link'
import { BRAND } from '@/lib/constants'
import {
  Home, ArrowLeft, Search, BookOpen, Phone, Download, FileText, Users,
} from 'lucide-react'

const QUICK_LINKS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'About', href: '/about', icon: Users },
  { label: 'Fund', href: '/fund', icon: FileText },
  { label: 'Contact', href: '/contact', icon: Phone },
  { label: 'Blog', href: '/blog', icon: BookOpen },
  { label: 'Downloads', href: '/downloads', icon: Download },
]

export default function NotFoundPage() {
  return (
    <section className="min-h-screen flex items-center justify-center gradient-dark relative overflow-hidden">
      {/* Background decorative 404 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-[280px] md:text-[400px] lg:text-[500px] font-extrabold text-white/[0.02] leading-none tracking-tighter">
          404
        </span>
      </div>

      {/* Subtle red glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-red/5 rounded-full blur-[180px] pointer-events-none" />

      <div className="relative z-10 container-max mx-auto px-4 text-center py-20">
        {/* Search icon */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-10 h-10 text-brand-red" />
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-400 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let us help you find what you need.
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link href="/" className="btn-primary">
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

        {/* Quick Links Grid */}
        <div className="max-w-2xl mx-auto">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-6">
            Quick Links
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center space-x-3 bg-white/5 border border-white/10 rounded-xl p-4 text-gray-300 text-sm hover:bg-white/10 hover:text-brand-red hover:border-brand-red/20 transition-all duration-300"
                >
                  <Icon className="w-4 h-4 text-gray-500 group-hover:text-brand-red transition-colors shrink-0" />
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
