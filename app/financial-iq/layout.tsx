import type { Metadata } from 'next';

const SITE_URL = 'https://ghlindiaventures.com';

export const metadata: Metadata = {
  title: 'Financial IQ — Investment Education & Resources | GHL India Ventures',
  description:
    "Build your investment knowledge with GHL India Ventures' Financial IQ resources — guides on AIFs, stressed real estate, startup investing, tax planning, and wealth management.",
  keywords: [
    'financial education India',
    'investment education',
    'AIF guide',
    'learn about alternative investments',
    'financial literacy HNI',
    'investment knowledge resources',
  ],
  openGraph: {
    title: 'Financial IQ — Investment Education & Resources | GHL India Ventures',
    description:
      "Build your investment knowledge with GHL India Ventures' Financial IQ resources — guides on AIFs, stressed real estate, startup investing, tax planning, and wealth management.",
    url: `${SITE_URL}/financial-iq`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GHL India Ventures Financial IQ — Investment Education & Resources',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Financial IQ — Investment Education & Resources | GHL India Ventures',
    description:
      "Build your investment knowledge with GHL India Ventures' Financial IQ resources — guides on AIFs, stressed real estate, startup investing, tax planning, and wealth management.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/financial-iq`,
  },
};

export default function FinancialIqLayout({ children }: { children: React.ReactNode }) {
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
        name: 'Financial IQ',
        item: `${SITE_URL}/financial-iq`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
