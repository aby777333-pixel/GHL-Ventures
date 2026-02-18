import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About GHL India Ventures | SEBI Registered AIF Chennai | 25+ Years Experience',
  description: 'Learn about GHL India Ventures, a SEBI-registered Category II Alternative Investment Fund headquartered in Chennai. 25+ years experience, ₹500 Cr+ value created, 50+ strong team.',
  openGraph: {
    title: 'About GHL India Ventures | SEBI Registered AIF Chennai',
    description: 'SEBI-registered Category II AIF with 25+ years of investment experience in stressed real estate and startups.',
    url: 'https://ghl-india-ventures-2025.netlify.app/about',
  },
  alternates: {
    canonical: 'https://ghl-india-ventures-2025.netlify.app/about',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
