import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Access Denied | GHL India Ventures',
  description: 'You do not have permission to access this resource.',
  // Utility screen, not content: keep it out of the index (Pulse: H1_MISSING).
  robots: { index: false, follow: true },
}

export default function ForbiddenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
