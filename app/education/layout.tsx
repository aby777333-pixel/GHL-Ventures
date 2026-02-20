import type { Metadata } from 'next'

const SITE_URL = 'https://ghl-india-ventures-2025.netlify.app'

export const metadata: Metadata = {
  title: 'Education | GHL India Ventures — Investor Knowledge Hub',
  description:
    'Investor education hub by GHL India Ventures. 53 articles across 8 categories covering AIFs, stressed real estate, venture capital, taxation, personal finance, NRI guides, and market insights.',
  keywords: [
    'investor education India',
    'AIF education',
    'alternative investment fund guide',
    'SEBI AIF education',
    'stressed real estate guide',
    'venture capital India',
    'NRI investment guide India',
    'GHL India Ventures education',
  ],
  openGraph: {
    title: 'Education | GHL India Ventures — Investor Knowledge Hub',
    description:
      'Investor education hub with 53 articles covering AIFs, stressed real estate, venture capital, taxation, and more.',
    url: `${SITE_URL}/education`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GHL India Ventures — Investor Education Hub',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Education | GHL India Ventures — Investor Knowledge Hub',
    description:
      'Investor education hub with 53 articles across 8 categories. Learn about AIFs, stressed real estate, VC, and more.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/education`,
  },
}

export default function EducationLayout({ children }: { children: React.ReactNode }) {
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
