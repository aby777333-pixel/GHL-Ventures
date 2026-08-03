'use client'

import { usePathname } from 'next/navigation'

// '/cms' added 2026-08-03: the standalone Content Studio is a portal, not a
// public page. Without it the marketing navbar rendered on top of the console
// and hid the "New article" button, and the Smarty concierge floated over the
// sidebar menu.
const PORTAL_PREFIXES = ['/staff', '/admin', '/dashboard', '/cms']

export default function MainSiteOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPortal = PORTAL_PREFIXES.some(p => pathname.startsWith(p))
  // Client-side: return null to prevent mounting entirely
  if (isPortal) return null
  // Wrap in a CSS-targetable div so portal layouts can hide via CSS
  // in case the static export pre-renders children before hydration
  return <div className="main-site-shell">{children}</div>
}
