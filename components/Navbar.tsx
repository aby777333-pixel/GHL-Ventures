'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_LINKS, BRAND } from '@/lib/constants'
import { Menu, X, Phone, ArrowRight, LogIn, UserPlus, ShieldCheck, Search, ChevronDown, ChevronRight as ChevRight, BadgeCheck } from 'lucide-react'
import Logo from '@/components/Logo'
// MarketDataMarquee and CurrencyTicker moved to home page (above NewsScroller)
import NotificationCenter from '@/components/NotificationCenter'
import ThemeToggle from '@/components/ThemeToggle'
import ThemePicker from '@/components/ThemePicker'

const PORTAL_PREFIXES = ['/staff', '/admin', '/dashboard']

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false)
  const aboutRef = useRef<HTMLDivElement>(null)
  const aboutTimeout = useRef<NodeJS.Timeout | null>(null)
  const [fundOpen, setFundOpen] = useState(false)
  const [mobileFundOpen, setMobileFundOpen] = useState(false)
  const fundRef = useRef<HTMLDivElement>(null)
  const fundTimeout = useRef<NodeJS.Timeout | null>(null)
  const [educationOpen, setEducationOpen] = useState(false)
  const [mobileEducationOpen, setMobileEducationOpen] = useState(false)
  const educationRef = useRef<HTMLDivElement>(null)
  const educationTimeout = useRef<NodeJS.Timeout | null>(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [mobileContactOpen, setMobileContactOpen] = useState(false)
  const contactRef = useRef<HTMLDivElement>(null)
  const contactTimeout = useRef<NodeJS.Timeout | null>(null)
  const pathname = usePathname()

  // Hide on portal routes (staff, admin, dashboard)
  if (PORTAL_PREFIXES.some(p => pathname.startsWith(p))) return null

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
    setAboutOpen(false)
    setMobileAboutOpen(false)
    setFundOpen(false)
    setMobileFundOpen(false)
    setEducationOpen(false)
    setMobileEducationOpen(false)
    setContactOpen(false)
    setMobileContactOpen(false)
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) {
        setAboutOpen(false)
      }
      if (fundRef.current && !fundRef.current.contains(e.target as Node)) {
        setFundOpen(false)
      }
      if (educationRef.current && !educationRef.current.contains(e.target as Node)) {
        setEducationOpen(false)
      }
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) {
        setContactOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Check if About submenu item is active
  const isAboutActive = pathname === '/about' || pathname === '/tools' || pathname === '/downloads'

  // Check if Fund submenu item is active
  const isFundActive = pathname.startsWith('/fund')

  // Check if Education submenu item is active
  const isEducationActive = pathname.startsWith('/education')

  // Check if Contact submenu item is active
  const isContactActive = pathname === '/contact' || pathname === '/contact/faqs' || pathname === '/contact/refer' || pathname === '/contact/startup-apply' || pathname === '/contact/grievance' || pathname === '/contact/careers'

  const handleAboutEnter = () => {
    if (aboutTimeout.current) clearTimeout(aboutTimeout.current)
    setAboutOpen(true)
  }
  const handleAboutLeave = () => {
    aboutTimeout.current = setTimeout(() => setAboutOpen(false), 200)
  }

  const handleFundEnter = () => {
    if (fundTimeout.current) clearTimeout(fundTimeout.current)
    setFundOpen(true)
  }
  const handleFundLeave = () => {
    fundTimeout.current = setTimeout(() => setFundOpen(false), 200)
  }

  const handleEducationEnter = () => {
    if (educationTimeout.current) clearTimeout(educationTimeout.current)
    setEducationOpen(true)
  }
  const handleEducationLeave = () => {
    educationTimeout.current = setTimeout(() => setEducationOpen(false), 200)
  }

  const handleContactEnter = () => {
    if (contactTimeout.current) clearTimeout(contactTimeout.current)
    setContactOpen(true)
  }
  const handleContactLeave = () => {
    contactTimeout.current = setTimeout(() => setContactOpen(false), 200)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50" role="banner">
      {/* ── Main Nav Bar ── */}
      <nav
        className={`transition-all duration-300 ${
          scrolled
            ? 'navbar-scrolled backdrop-blur-[20px] shadow-lg'
            : 'bg-[#0A0A0A]'
        }`}
        aria-label="Main navigation"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[56px]">
            {/* ── Logo ── */}
            <Link
              href="/"
              className="flex items-center group shrink-0"
              aria-label="GHL India Ventures Home"
            >
              <Logo size={44} />
            </Link>

            {/* ── Desktop Nav Links (centred) ── */}
            <div className="hidden xl:flex items-center justify-center flex-1 mx-4">
              <div className="flex items-center" style={{ gap: '2px' }}>
                {NAV_LINKS.map((link) => {
                  // Check if this link has children (dropdown)
                  const hasChildren = 'children' in link && link.children
                  const isAbout = link.label === 'About'
                  const isFund = link.label === 'Fund'
                  const isEducation = link.label === 'Education'
                  const isContact = link.label === 'Contact'
                  const isActive = hasChildren
                    ? (isAbout ? isAboutActive : isFund ? isFundActive : isEducation ? isEducationActive : isContactActive)
                    : pathname === link.href

                  if (hasChildren) {
                    const dropdownOpen = isAbout ? aboutOpen : isFund ? fundOpen : isEducation ? educationOpen : contactOpen
                    const dropdownRef = isAbout ? aboutRef : isFund ? fundRef : isEducation ? educationRef : contactRef
                    const onEnter = isAbout ? handleAboutEnter : isFund ? handleFundEnter : isEducation ? handleEducationEnter : handleContactEnter
                    const onLeave = isAbout ? handleAboutLeave : isFund ? handleFundLeave : isEducation ? handleEducationLeave : handleContactLeave
                    const toggleOpen = isAbout
                      ? () => setAboutOpen(!aboutOpen)
                      : isFund
                      ? () => setFundOpen(!fundOpen)
                      : isEducation
                      ? () => setEducationOpen(!educationOpen)
                      : () => setContactOpen(!contactOpen)

                    return (
                      <div
                        key={link.label}
                        ref={dropdownRef}
                        className="relative"
                        onMouseEnter={onEnter}
                        onMouseLeave={onLeave}
                      >
                        <button
                          onClick={toggleOpen}
                          className={`relative uppercase font-semibold transition-colors duration-200 px-2 py-1.5 rounded inline-flex items-center gap-0.5 ${
                            isActive
                              ? 'text-brand-red'
                              : scrolled
                              ? 'text-gray-800 dark:text-white/80 hover:text-brand-red'
                              : 'text-white/80 hover:text-brand-red'
                          }`}
                          style={{
                            fontSize: '9.5px',
                            letterSpacing: '0.06em',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {link.label}
                          <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                          {/* Active underline */}
                          <span
                            className={`absolute left-2 right-2 -bottom-0.5 h-[1.5px] bg-brand-red transition-all duration-300 ${
                              isActive ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                        </button>

                        {/* Dropdown panel */}
                        <div
                          className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 transition-all duration-200 ${
                            dropdownOpen
                              ? 'opacity-100 translate-y-0 pointer-events-auto'
                              : 'opacity-0 -translate-y-2 pointer-events-none'
                          }`}
                        >
                          <div
                            className={`rounded-xl border shadow-2xl py-1.5 overflow-hidden ${isAbout ? 'min-w-[160px]' : isFund ? 'min-w-[180px]' : isEducation ? 'min-w-[150px]' : 'min-w-[190px]'} ${
                              scrolled
                                ? 'bg-white/[0.97] dark:bg-[#111]/[0.97] border-black/[0.08] dark:border-white/[0.1]'
                                : 'bg-[#0f0f14]/[0.97] border-white/[0.1]'
                            }`}
                            style={{ backdropFilter: 'blur(20px)' }}
                          >
                            {link.children.map((child) => {
                              const childActive = pathname === child.href
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={`flex items-center px-4 py-2.5 transition-all duration-150 ${
                                    childActive
                                      ? 'text-brand-red'
                                      : scrolled
                                      ? 'text-gray-800 dark:text-white/80 hover:text-brand-red hover:bg-gray-50 dark:hover:bg-white/5'
                                      : 'text-white/80 hover:text-brand-red hover:bg-white/5'
                                  }`}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    letterSpacing: '0.04em',
                                  }}
                                >
                                  <ChevRight className="w-3 h-3 mr-2 opacity-40" />
                                  {child.label}
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // Regular nav link
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative uppercase font-semibold transition-colors duration-200 px-2 py-1.5 rounded ${
                        isActive
                          ? 'text-brand-red'
                          : scrolled
                          ? 'text-gray-800 dark:text-white/80 hover:text-brand-red'
                          : 'text-white/80 hover:text-brand-red'
                      }`}
                      style={{
                        fontSize: '9.5px',
                        letterSpacing: '0.06em',
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
                    ? 'border-gray-200 dark:border-white/15 text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-white'
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
                      ? 'border-gray-200 dark:border-white/15 text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
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
                      ? 'text-gray-400 dark:text-white/40 hover:text-brand-red hover:bg-red-50 dark:hover:bg-white/10'
                      : 'text-white/40 hover:text-brand-red hover:bg-white/10'
                  }`}
                  title="Admin Portal"
                >
                  <ShieldCheck className="w-3 h-3" />
                </Link>
                <Link
                  href="/staff/login"
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${
                    scrolled
                      ? 'text-gray-400 dark:text-white/40 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-white/10'
                      : 'text-white/40 hover:text-amber-500 hover:bg-white/10'
                  }`}
                  title="Employee & Support Staff Portal"
                >
                  <BadgeCheck className="w-3 h-3" />
                </Link>
              </div>

              {/* Theme Controls & Notification Center — desktop */}
              <div className="hidden xl:flex items-center space-x-0.5">
                <ThemePicker scrolled={scrolled} />
                <ThemeToggle scrolled={scrolled} />
                <NotificationCenter scrolled={scrolled} />
              </div>

              {/* Divider */}
              <div className={`hidden xl:block w-px h-4 mx-1 ${
                scrolled ? 'bg-gray-200 dark:bg-white/20' : 'bg-white/15'
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
                    ? 'text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
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
          <div className="absolute top-5 left-5">
            <Logo size={44} />
          </div>

          {/* Nav Links — staggered animation with mobile About accordion */}
          <nav className="flex flex-col items-center space-y-5">
            {(() => {
              let animIndex = 0
              return NAV_LINKS.map((link) => {
                const hasChildren = 'children' in link && link.children
                const currentIndex = animIndex
                animIndex += 1

                if (hasChildren) {
                  const isAboutMenu = link.label === 'About'
                  const isFundMenu = link.label === 'Fund'
                  const isEducationMenu = link.label === 'Education'
                  const mobileOpen = isAboutMenu ? mobileAboutOpen : isFundMenu ? mobileFundOpen : isEducationMenu ? mobileEducationOpen : mobileContactOpen
                  const toggleMobile = isAboutMenu
                    ? () => setMobileAboutOpen(!mobileAboutOpen)
                    : isFundMenu
                    ? () => setMobileFundOpen(!mobileFundOpen)
                    : isEducationMenu
                    ? () => setMobileEducationOpen(!mobileEducationOpen)
                    : () => setMobileContactOpen(!mobileContactOpen)
                  const isDropdownActive = isAboutMenu ? isAboutActive : isFundMenu ? isFundActive : isEducationMenu ? isEducationActive : isContactActive

                  return (
                    <div key={link.label} className="flex flex-col items-center">
                      <button
                        onClick={toggleMobile}
                        className={`uppercase font-semibold text-xl transition-all duration-500 inline-flex items-center gap-1.5 ${
                          isDropdownActive ? 'text-brand-red' : 'text-white/80 hover:text-brand-red'
                        }`}
                        style={{
                          letterSpacing: '0.08em',
                          transitionDelay: isOpen ? `${currentIndex * 50}ms` : '0ms',
                          opacity: isOpen ? 1 : 0,
                          transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                        }}
                      >
                        {link.label}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {/* Sub-items */}
                      <div
                        className={`flex flex-col items-center space-y-3 overflow-hidden transition-all duration-300 ${
                          mobileOpen ? `${isAboutMenu ? 'max-h-[200px]' : isFundMenu ? 'max-h-[250px]' : isEducationMenu ? 'max-h-[100px]' : 'max-h-[350px]'} mt-3 opacity-100` : 'max-h-0 mt-0 opacity-0'
                        }`}
                      >
                        {link.children.map((child) => {
                          const childActive = pathname === child.href
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setIsOpen(false)}
                              className={`text-base font-medium transition-colors ${
                                childActive ? 'text-brand-red' : 'text-white/60 hover:text-brand-red'
                              }`}
                              style={{ letterSpacing: '0.06em' }}
                            >
                              {child.label}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                }

                // Regular mobile nav link
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
                      transitionDelay: isOpen ? `${currentIndex * 50}ms` : '0ms',
                      opacity: isOpen ? 1 : 0,
                      transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                    }}
                  >
                    {link.label}
                  </Link>
                )
              })
            })()}
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
          <div
            className="mt-3 flex items-center space-x-4"
            style={{
              transitionDelay: isOpen ? `${NAV_LINKS.length * 50 + 150}ms` : '0ms',
              opacity: isOpen ? 1 : 0,
            }}
          >
            <Link
              href="/admin/login"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center space-x-1.5 text-white/40 text-xs hover:text-brand-red transition-colors"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin Portal</span>
            </Link>
            <Link
              href="/staff/login"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center space-x-1.5 text-white/40 text-xs hover:text-amber-500 transition-colors"
            >
              <BadgeCheck className="w-3 h-3" />
              <span>Staff Portal</span>
            </Link>
          </div>

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
