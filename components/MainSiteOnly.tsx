'use client'

import { usePathname } from 'next/navigation'

const PORTAL_PREFIXES = ['/staff', '/admin', '/dashboard']

export default function MainSiteOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPortal = PORTAL_PREFIXES.some(p => pathname.startsWith(p))
  // Client-side: return null to prevent mounting entirely
  if (isPortal) return null
  // Wrap in a CSS-targetable div so portal layouts can hide via CSS
  // in case the static export pre-renders children before hydration
  return <div className="main-site-shell">{children}</div>
}
