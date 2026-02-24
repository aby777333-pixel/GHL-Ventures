import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Access Denied | GHL India Ventures',
  description: 'You do not have permission to access this resource.',
}

export default function ForbiddenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
