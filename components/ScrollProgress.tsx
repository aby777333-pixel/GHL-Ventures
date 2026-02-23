'use client'

import { usePathname } from 'next/navigation'
import { useScrollProgress } from '@/lib/hooks'

const PORTAL_PREFIXES = ['/staff', '/admin', '/dashboard']

export default function ScrollProgress() {
  const pathname = usePathname()
  const progress = useScrollProgress()

  if (PORTAL_PREFIXES.some(p => pathname.startsWith(p))) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent">
      <div
        className="h-full bg-brand-red transition-all duration-150"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Page scroll progress"
      />
    </div>
  )
}
