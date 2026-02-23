'use client'

import { usePathname } from 'next/navigation'

const PORTAL_PREFIXES = ['/staff', '/admin', '/dashboard']

export default function MainSiteOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPortal = PORTAL_PREFIXES.some(p => pathname.startsWith(p))
  if (isPortal) return null
  return <>{children}</>
}
