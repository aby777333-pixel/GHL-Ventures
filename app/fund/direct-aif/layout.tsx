import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Direct AIF Route | HNI & Family Office Investment | GHL India Ventures',
  description: 'GHL India Ventures Direct AIF Route for HNIs and family offices. SEBI-registered Category II AIF with minimum ₹1 Crore investment in stressed real estate and startups.',
  openGraph: {
    title: 'Direct AIF Route | HNI Investment | GHL India Ventures',
    description: 'Category II AIF for HNIs and family offices. Minimum ₹1 Crore with institutional-grade governance.',
    url: 'https://ghl-india-ventures-2025.netlify.app/fund/direct-aif',
  },
  alternates: {
    canonical: 'https://ghl-india-ventures-2025.netlify.app/fund/direct-aif',
  },
}

export default function DirectAIFLayout({ children }: { children: React.ReactNode }) {
  return children
}
