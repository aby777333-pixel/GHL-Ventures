'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowUp } from 'lucide-react'

const PORTAL_PREFIXES = ['/staff', '/admin', '/dashboard']

export default function BackToTop() {
  const pathname = usePathname()
  if (PORTAL_PREFIXES.some(p => pathname.startsWith(p))) return null
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // check initial position
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    // Try smooth scroll first
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      // Fallback for older browsers
      window.scrollTo(0, 0)
    }
    // Also try scrolling the document element directly
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [])

  return (
    <button
      onClick={scrollToTop}
      type="button"
      className={`fixed z-[9998] w-11 h-11 bg-brand-red text-white rounded-full
        flex items-center justify-center hover:bg-red-700 transition-all duration-300 cursor-pointer select-none ${
          show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-75 pointer-events-none'
        }`}
      style={{
        bottom: '24px',
        left: '24px',
        boxShadow: '0 4px 20px rgba(208,2,27,0.4)',
      }}
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}
