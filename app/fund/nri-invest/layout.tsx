import type { Metadata } from 'next'

const SITE_URL = 'https://ghl-india-ventures-2025.netlify.app'

export const metadata: Metadata = {
  title: 'NRI Invest — Invest in India from Abroad | GHL India Ventures',
  description:
    'NRI-focused SEBI-registered Category II AIF. Invest in India\'s stressed real estate & startups from anywhere in the world. FEMA/RBI-compliant structure, NRO/NRE routing, ₹1 Crore AIF or ₹10 Lakhs Debenture Route.',
  keywords: [
    'NRI investment India',
    'NRI AIF investment',
    'NRI invest in real estate India',
    'SEBI registered AIF for NRI',
    'NRI debenture investment',
    'FEMA compliant AIF',
    'NRO NRE AIF investment',
    'NRI startup investment India',
    'NRI Category II AIF',
    'GHL India Ventures NRI',
    'NRI investment fund Chennai',
    'overseas Indian investment',
  ],
  openGraph: {
    title: 'NRI Invest — Invest in India from Abroad | GHL India Ventures',
    description:
      'NRI-focused SEBI-registered Category II AIF. Invest in India\'s stressed real estate & startups from anywhere. FEMA/RBI-compliant, NRO/NRE routing.',
    url: `${SITE_URL}/fund/nri-invest`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GHL India Ventures — NRI Investment in India via SEBI Category II AIF',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NRI Invest — Invest in India from Abroad | GHL India Ventures',
    description:
      'NRI-focused SEBI-registered Category II AIF. Invest in India\'s stressed real estate & startups from anywhere. FEMA/RBI-compliant.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/fund/nri-invest`,
  },
}

export default function NRIInvestLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Fund',
        item: `${SITE_URL}/fund`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'NRI Invest',
        item: `${SITE_URL}/fund/nri-invest`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  )
}
