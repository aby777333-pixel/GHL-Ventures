import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | GHL India Ventures | SEBI AIF Chennai',
  description: 'GHL India Ventures: SEBI-registered Category II AIF in Chennai. 25+ years experience, 500 Cr+ value created, 50+ team.',
  openGraph: {
    title: 'About GHL India Ventures | SEBI Registered AIF',
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
