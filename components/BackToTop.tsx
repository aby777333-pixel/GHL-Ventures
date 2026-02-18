'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      type="button"
      className={`fixed z-[9991] w-11 h-11 bg-brand-red text-white rounded-full
        flex items-center justify-center hover:bg-red-700 transition-all duration-300 cursor-pointer ${
          show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-75 pointer-events-none'
        }`}
      style={{
        bottom: '40px',
        left: '24px',
        boxShadow: '0 4px 20px rgba(208,2,27,0.4)',
      }}
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}
