import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Direct AIF Route | HNI Investment | GHL India',
  description: 'GHL India Ventures Direct AIF Route for HNIs and family offices. SEBI Category II AIF. Real estate & startups. As per SEBI AIF Regulations.',
  openGraph: {
    title: 'Direct AIF Route | HNI Investment | GHL India Ventures',
    description: 'Category II AIF for HNIs and family offices. As per SEBI AIF Regulations with institutional-grade governance.',
    url: 'https://ghl-india-ventures-2025.netlify.app/fund/direct-aif',
  },
  alternates: {
    canonical: 'https://ghl-india-ventures-2025.netlify.app/fund/direct-aif',
  },
}

export default function DirectAIFLayout({ children }: { children: React.ReactNode }) {
  return children
}
