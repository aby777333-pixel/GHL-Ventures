import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Under Maintenance | GHL India Ventures',
  description: 'GHL India Ventures is undergoing scheduled maintenance. We will be back shortly.',
}

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
