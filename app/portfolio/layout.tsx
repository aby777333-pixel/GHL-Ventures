import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portfolio | Real Estate & Startup Investments | GHL',
  description: 'GHL India Ventures portfolio: NCLT real estate recovery projects and startup investments in fintech, healthtech, cleantech across India.',
  keywords: ['NCLT resolution real estate India', 'startup investment fund Chennai', 'stressed real estate portfolio', 'AIF portfolio companies', 'real estate recovery investments'],
  openGraph: {
    title: 'Investment Portfolio | GHL India Ventures',
    description: 'Explore our portfolio of stressed real estate recovery projects and high-growth startup investments.',
    url: 'https://ghl-india-ventures-2025.netlify.app/portfolio',
  },
  alternates: {
    canonical: 'https://ghl-india-ventures-2025.netlify.app/portfolio',
  },
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children
}
