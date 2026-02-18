'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_LINKS, BRAND } from '@/lib/constants'
import { Menu, X, Phone, ArrowRight, LogIn, UserPlus, ShieldCheck, Search } from 'lucide-react'
import Logo from '@/components/Logo'
import MarketDataMarquee from '@/components/MarketDataMarquee'
import CurrencyTicker from '@/components/CurrencyTicker'
import NotificationCenter from '@/components/NotificationCenter'
import ThemeToggle from '@/components/ThemeToggle'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <header className="fixed top-0 left-0 right-0 z-50" role="banner">
      {/* ── Market Data Marquee ── */}
      <MarketDataMarquee />

      {/* ── Currency Ticker ── */}
      <CurrencyTicker />

      {/* ── Announcement Bar ── */}
      <div
        className="w-full overflow-hidden"
        style={{ backgroundColor: '#1a0000' }}
      >
        <div className="animate-marquee whitespace-nowrap py-1">
          <span
            className="inline-block text-white/80 mx-8"
            style={{ fontSize: '11px', letterSpacing: '0.02em' }}
          >
            SEBI Registered AIF &nbsp;|&nbsp; Registration No. IN/AIF2/2425/1517
            &nbsp;|&nbsp; AIF: Min &#8377;1 Crore &nbsp;|&nbsp; Debenture Route: From &#8377;10 Lakhs &nbsp;|&nbsp;
            Stressed Real Estate &amp; Early-Stage Startups &nbsp;|&nbsp;
            Chennai, India
          </span>
          <span
            className="inline-block text-white/80 mx-8"
            style={{ fontSize: '11px', letterSpacing: '0.02em' }}
          >
            SEBI Registered AIF &nbsp;|&nbsp; Registration No. IN/AIF2/2425/1517
            &nbsp;|&nbsp; AIF: Min &#8377;1 Crore &nbsp;|&nbsp; Debenture Route: From &#8377;10 Lakhs &nbsp;|&nbsp;
            Stressed Real Estate &amp; Early-Stage Startups &nbsp;|&nbsp;
            Chennai, India
          </span>
        </div>
      </div>

      {/* ── Main Nav Bar ── */}
      <nav
        className={`transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-[20px] shadow-lg'
            : 'bg-[#0A0A0A]'
        }`}
        aria-label="Main navigation"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[56px]">
            {/* ── Logo ── */}
            <Link
              href="/"
              className="flex items-center space-x-2 group shrink-0"
              aria-label="GHL India Ventures Home"
            >
              <Logo size={38} />
              <span
                className={`font-bold tracking-wide transition-colors duration-300 hidden sm:inline ${
                  scrolled ? 'text-brand-black' : 'text-white'
                }`}
                style={{ fontSize: '12px', letterSpacing: '0.1em' }}
              >
                GHL INDIA VENTURES
              </span>
            </Link>

            {/* ── Desktop Nav Links (centred) ── */}
            <div className="hidden xl:flex items-center justify-center flex-1 mx-4">
              <div className="flex items-center" style={{ gap: '4px' }}>
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative uppercase font-semibold transition-colors duration-200 px-2.5 py-1.5 rounded ${
                        isActive
                          ? 'text-brand-red'
                          : scrolled
                          ? 'text-brand-black/80 hover:text-brand-red'
                          : 'text-white/80 hover:text-brand-red'
                      }`}
                      style={{
                        fontSize: '10.5px',
                        letterSpacing: '0.07em',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {link.label}
                      {/* Active underline */}
                      <span
                        className={`absolute left-2 right-2 -bottom-0.5 h-[1.5px] bg-brand-red transition-all duration-300 ${
                          isActive ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* ── Right side: Auth + CTA + Hamburger ── */}
            <div className="flex items-center space-x-1.5 shrink-0">
              {/* Search shortcut — desktop */}
              <button
                onClick={() => {
                  // Dispatch Ctrl+K to open command palette
                  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true, bubbles: true }))
                }}
                className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-all duration-200 border ${
                  scrolled
                    ? 'border-gray-200 text-brand-black/50 hover:bg-gray-50 hover:text-brand-black'
                    : 'border-white/15 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
                style={{ fontSize: '10px' }}
                title="Quick search (Ctrl+K)"
              >
                <Search className="w-3 h-3" />
                <kbd className="text-[9px] opacity-60 font-mono">⌘K</kbd>
              </button>

              {/* Auth buttons — desktop */}
              <div className="hidden xl:flex items-center space-x-1">
                <Link
                  href="/login"
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full font-semibold transition-all duration-200 border ${
                    scrolled
                      ? 'border-gray-200 text-brand-black/70 hover:bg-gray-50 hover:text-brand-black'
                      : 'border-white/15 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  style={{ fontSize: '10px', letterSpacing: '0.03em' }}
                >
                  <LogIn className="w-2.5 h-2.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full font-semibold text-white transition-all duration-200 hover:opacity-90"
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.03em',
                    background: 'linear-gradient(135deg, #D0021B 0%, #a00216 100%)',
                  }}
                >
                  <UserPlus className="w-2.5 h-2.5" />
                  <span>Sign Up</span>
                </Link>
                <Link
                  href="/admin/login"
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${
                    scrolled
                      ? 'text-gray-400 hover:text-brand-red hover:bg-red-50'
                      : 'text-white/40 hover:text-brand-red hover:bg-white/10'
                  }`}
                  title="Admin Portal"
                >
                  <ShieldCheck className="w-3 h-3" />
                </Link>
              </div>

              {/* Notification Center & Theme Toggle — desktop */}
              <div className="hidden xl:flex items-center space-x-0.5">
                <ThemeToggle scrolled={scrolled} />
                <NotificationCenter scrolled={scrolled} />
              </div>

              {/* Divider */}
              <div className={`hidden xl:block w-px h-4 mx-1 ${
                scrolled ? 'bg-gray-200' : 'bg-white/15'
              }`} />

              {/* Let's Talk pill button — desktop */}
              <Link
                href="/contact"
                className="hidden xl:inline-flex items-center space-x-1 text-white font-semibold
                  rounded-full px-3.5 py-1.5 transition-all duration-300 transform hover:scale-105
                  hover:shadow-lg hover:shadow-red-500/25"
                style={{
                  background: 'linear-gradient(135deg, #D0021B 0%, #a00216 100%)',
                  fontSize: '10.5px',
                  letterSpacing: '0.03em',
                }}
              >
                <span>Let&apos;s Talk</span>
                <ArrowRight className="w-3 h-3" />
              </Link>

              {/* Hamburger — mobile / tablet */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`xl:hidden p-2 rounded-lg transition-colors duration-200 ${
                  scrolled
                    ? 'text-brand-black hover:bg-gray-100'
                    : 'text-white hover:bg-white/10'
                }`}
                aria-expanded={isOpen}
                aria-label="Toggle menu"
              >
                {isOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Full-Screen Overlay Menu ── */}
      <div
        className={`fixed inset-0 z-40 xl:hidden transition-all duration-500 ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        style={{ top: 0 }}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-brand-black/95 backdrop-blur-md transition-opacity duration-500 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsOpen(false)}
        />

        {/* Menu content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full px-8">
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors p-2"
            aria-label="Close menu"
          >
            <X className="w-7 h-7" />
          </button>

          {/* Logo in overlay */}
          <div className="absolute top-5 left-5 flex items-center space-x-2">
            <Logo size={38} />
            <span className="text-white font-bold" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>
              GHL INDIA VENTURES
            </span>
          </div>

          {/* Nav Links — staggered animation */}
          <nav className="flex flex-col items-center space-y-5">
            {NAV_LINKS.map((link, index) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`uppercase font-semibold text-xl transition-all duration-500 ${
                    isActive ? 'text-brand-red' : 'text-white/80 hover:text-brand-red'
                  }`}
                  style={{
                    letterSpacing: '0.08em',
                    transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* CTA in overlay */}
          <div
            className="mt-8 transition-all duration-500"
            style={{
              transitionDelay: isOpen ? `${NAV_LINKS.length * 50 + 50}ms` : '0ms',
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
            }}
          >
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center space-x-2 text-white text-sm font-semibold
                rounded-full px-7 py-2.5 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25"
              style={{
                background: 'linear-gradient(135deg, #D0021B 0%, #a00216 100%)',
              }}
            >
              <span>Let&apos;s Talk</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Auth buttons in mobile overlay */}
          <div
            className="mt-5 flex items-center space-x-3 transition-all duration-500"
            style={{
              transitionDelay: isOpen ? `${NAV_LINKS.length * 50 + 100}ms` : '0ms',
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
            }}
          >
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center space-x-2 text-white/70 text-xs font-medium border border-white/20 rounded-full px-5 py-2 hover:bg-white/10 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/register"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center space-x-2 text-white text-xs font-medium rounded-full px-5 py-2 hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #D0021B 0%, #a00216 100%)' }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </Link>
          </div>
          <Link
            href="/admin/login"
            onClick={() => setIsOpen(false)}
            className="mt-3 inline-flex items-center space-x-1.5 text-white/40 text-xs hover:text-brand-red transition-colors"
            style={{
              transitionDelay: isOpen ? `${NAV_LINKS.length * 50 + 150}ms` : '0ms',
              opacity: isOpen ? 1 : 0,
            }}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Admin Portal</span>
          </Link>

          {/* Phone at bottom of overlay */}
          <div
            className="absolute bottom-8 flex items-center space-x-2 text-white/60 transition-all duration-500"
            style={{
              transitionDelay: isOpen ? `${NAV_LINKS.length * 50 + 100}ms` : '0ms',
              opacity: isOpen ? 1 : 0,
            }}
          >
            <Phone className="w-3.5 h-3.5" />
            <a
              href={`tel:${BRAND.phone2.replace(/\s/g, '')}`}
              className="text-xs hover:text-brand-red transition-colors"
            >
              {BRAND.phone2}
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
