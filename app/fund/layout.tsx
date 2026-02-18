import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Category II AIF Investment Fund | Stressed Real Estate & Startups | GHL',
  description: 'Explore GHL India Ventures Category II AIF investment fund. Invest in stressed real estate recovery and early-stage startups. SEBI registered IN/AIF2/2425/1517. Minimum ₹1 Crore.',
  keywords: ['Category II AIF fund India', 'stressed real estate fund India', 'alternative investment fund minimum investment', 'SEBI registered AIF', 'AIF investment Chennai'],
  openGraph: {
    title: 'Category II AIF Investment Fund | GHL India Ventures',
    description: 'SEBI-registered Category II AIF focused on stressed real estate and startup investments. Minimum ₹1 Crore.',
    url: 'https://ghl-india-ventures-2025.netlify.app/fund',
  },
  alternates: {
    canonical: 'https://ghl-india-ventures-2025.netlify.app/fund',
  },
}

export default function FundLayout({ children }: { children: React.ReactNode }) {
  return children
}
