import type { Metadata } from 'next'

const SITE_URL = 'https://ghl-india-ventures-2025.netlify.app'

export const metadata: Metadata = {
  title: 'Insights — Investor Education | GHL India Ventures',
  description:
    '53 in-depth articles across 8 categories: AIFs, stressed real estate, venture capital, taxation, personal finance, NRI guides, market insights, and glossary. Free investor education by GHL India Ventures.',
  keywords: [
    'AIF investor education',
    'stressed real estate articles',
    'venture capital guide India',
    'AIF taxation guide',
    'NRI AIF investment',
    'SEBI AIF regulations',
    'investment glossary India',
    'GHL India Ventures insights',
  ],
  openGraph: {
    title: 'Insights — Investor Education | GHL India Ventures',
    description:
      '53 in-depth articles across 8 categories. Free investor education by GHL India Ventures, SEBI-registered Category II AIF.',
    url: `${SITE_URL}/education/insights`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GHL India Ventures — Investor Education Insights',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Insights — Investor Education | GHL India Ventures',
    description:
      '53 free investor education articles covering AIFs, real estate, VC, taxation & more.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/education/insights`,
  },
}

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
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
        name: 'Education',
        item: `${SITE_URL}/education`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Insights',
        item: `${SITE_URL}/education/insights`,
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
