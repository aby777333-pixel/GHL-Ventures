import type { Metadata } from 'next';

const SITE_URL = 'https://ghl-india-ventures-2025.netlify.app';

export const metadata: Metadata = {
  title: 'Careers at GHL India Ventures | Join Our Alternative Investment Team',
  description:
    'Explore career opportunities at GHL India Ventures — a SEBI-registered Category II AIF based in Chennai. We are hiring across investment analysis, compliance, real estate, startup due diligence, and client relations.',
  keywords: [
    'careers GHL India Ventures',
    'AIF jobs India',
    'investment analyst jobs Chennai',
    'alternative investment careers',
    'fund management jobs India',
    'GHL India Ventures hiring',
  ],
  openGraph: {
    title: 'Careers at GHL India Ventures | Join Our Alternative Investment Team',
    description:
      'Explore career opportunities at GHL India Ventures — a SEBI-registered Category II AIF based in Chennai. We are hiring across investment analysis, compliance, and more.',
    url: `${SITE_URL}/contact/careers`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GHL India Ventures — Careers',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Careers at GHL India Ventures | Join Our Alternative Investment Team',
    description:
      'Explore career opportunities at GHL India Ventures — a SEBI-registered Category II AIF based in Chennai. We are hiring across investment analysis, compliance, and more.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/contact/careers`,
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Contact', item: `${SITE_URL}/contact` },
      { '@type': 'ListItem', position: 3, name: 'Careers', item: `${SITE_URL}/contact/careers` },
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
