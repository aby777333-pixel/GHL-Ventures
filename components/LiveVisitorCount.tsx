'use client'

import { useState, useEffect } from 'react'
import { Eye } from 'lucide-react'

export default function LiveVisitorCount() {
  const [count, setCount] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Simulate a realistic visitor count (between 14 and 47)
    const base = 14 + Math.floor(Math.random() * 20)
    setCount(base)
    setTimeout(() => setShow(true), 2000)

    // Fluctuate every 8-15 seconds
    const interval = setInterval(() => {
      setCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1
        const next = prev + delta
        return Math.max(8, Math.min(55, next))
      })
    }, 8000 + Math.random() * 7000)

    return () => clearInterval(interval)
  }, [])

  if (!show) return null

  return (
    <div className="fixed z-[9990] flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-500"
      style={{
        bottom: '28px',
        left: '92px',
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <span className="relative flex items-center">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </span>
      <Eye className="w-3 h-3 text-gray-400" />
      <span className="text-gray-300">
        <strong className="text-white font-semibold">{count}</strong> viewing now
      </span>
    </div>
  )
}
