import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AIF Fund | Stressed Real Estate & Startups | GHL',
  description: 'GHL India Ventures Category II AIF fund. Stressed real estate recovery & startup investments. SEBI Reg. IN/AIF2/2425/1517. Min 1 Cr.',
  keywords: ['Category II AIF fund India', 'stressed real estate fund India', 'alternative investment fund minimum investment', 'SEBI registered AIF', 'AIF investment Chennai'],
  openGraph: {
    title: 'Category II AIF Fund | GHL India Ventures',
    description: 'SEBI-registered Category II AIF focused on stressed real estate and startup investments. Minimum 1 Crore.',
    url: 'https://ghl-india-ventures-2025.netlify.app/fund',
  },
  alternates: {
    canonical: 'https://ghl-india-ventures-2025.netlify.app/fund',
  },
}

export default function FundLayout({ children }: { children: React.ReactNode }) {
  return children
}
