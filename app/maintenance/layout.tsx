import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Under Maintenance | GHL India Ventures',
  description: 'GHL India Ventures is undergoing scheduled maintenance. We will be back shortly.',
  // Utility screen, not content: keep it out of the index (Pulse: H1_MISSING).
  robots: { index: false, follow: true },
}

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
