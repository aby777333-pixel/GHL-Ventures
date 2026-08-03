import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Content Studio | GHL India Ventures',
  description: 'Blog and research publishing console for the GHL India Ventures content team.',
  robots: { index: false, follow: false },
}

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
