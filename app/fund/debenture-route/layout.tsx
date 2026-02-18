import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Debenture Route | Invest from 10 Lakhs | GHL India',
  description: 'GHL India Ventures Debenture Route: NCD investment from 10 Lakhs. Access stressed real estate returns via structured investment.',
  openGraph: {
    title: 'Debenture Route | 10 Lakhs Entry | GHL India Ventures',
    description: 'Structured NCD investment starting at 10 Lakhs with exposure to stressed real estate recovery.',
    url: 'https://ghl-india-ventures-2025.netlify.app/fund/debenture-route',
  },
  alternates: {
    canonical: 'https://ghl-india-ventures-2025.netlify.app/fund/debenture-route',
  },
}

export default function DebentureLayout({ children }: { children: React.ReactNode }) {
  return children
}
