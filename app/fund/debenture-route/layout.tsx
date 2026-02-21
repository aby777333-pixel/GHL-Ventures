import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SEBI Co-Invest Framework | Structured Investment | GHL India',
  description: 'GHL India Ventures SEBI Co-Invest Framework: Structured co-invest opportunity. Access stressed real estate returns via regulated investment.',
  openGraph: {
    title: 'SEBI Co-Invest Framework | Structured Investment | GHL India Ventures',
    description: 'Structured co-invest opportunity with exposure to stressed real estate recovery. Contact for details.',
    url: 'https://ghl-india-ventures-2025.netlify.app/fund/debenture-route',
  },
  alternates: {
    canonical: 'https://ghl-india-ventures-2025.netlify.app/fund/debenture-route',
  },
}

export default function DebentureLayout({ children }: { children: React.ReactNode }) {
  return children
}
