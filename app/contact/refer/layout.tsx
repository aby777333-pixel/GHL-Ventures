import type { Metadata } from 'next';

const SITE_URL = 'https://ghl-india-ventures-2025.netlify.app';

export const metadata: Metadata = {
  title: 'Refer an Investor | GHL India Ventures Referral Programme',
  description:
    'Know a High Net-Worth Individual interested in Category II AIF investing? Refer them to GHL India Ventures and help them access institutional-grade alternative investments in stressed real estate and startups.',
  keywords: [
    'refer investor GHL India',
    'AIF referral programme',
    'HNI investment referral',
    'alternative investment referral India',
    'GHL India Ventures referral',
  ],
  openGraph: {
    title: 'Refer an Investor | GHL India Ventures Referral Programme',
    description:
      'Know a High Net-Worth Individual interested in Category II AIF investing? Refer them to GHL India Ventures and help them access institutional-grade alternative investments.',
    url: `${SITE_URL}/contact/refer`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GHL India Ventures — Refer an Investor',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Refer an Investor | GHL India Ventures Referral Programme',
    description:
      'Know a High Net-Worth Individual interested in Category II AIF investing? Refer them to GHL India Ventures and help them access institutional-grade alternative investments.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/contact/refer`,
  },
};

export default function ReferLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Contact', item: `${SITE_URL}/contact` },
      { '@type': 'ListItem', position: 3, name: 'Refer an Investor', item: `${SITE_URL}/contact/refer` },
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
