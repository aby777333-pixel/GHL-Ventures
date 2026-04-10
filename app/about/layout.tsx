import type { Metadata } from 'next';

const SITE_URL = 'https://ghlindiaventures.com';

export const metadata: Metadata = {
  title: 'About GHL India Ventures | SEBI Registered Category II AIF Chennai',
  description:
    'Learn about GHL India Ventures — a SEBI-registered Category II AIF (IN/AIF2/2425/1517) based in Chennai. Our team, investment philosophy, stressed real estate recovery strategy, and startup investment approach.',
  keywords: [
    'GHL India Ventures about',
    'SEBI registered AIF Chennai',
    'Category II AIF India',
    'investment philosophy',
    'fund management team Chennai',
    'stressed real estate fund',
    'why GHL',
  ],
  openGraph: {
    title: 'About GHL India Ventures | SEBI Registered Category II AIF Chennai',
    description:
      'Learn about GHL India Ventures — a SEBI-registered Category II AIF (IN/AIF2/2425/1517) based in Chennai. Our team, investment philosophy, stressed real estate recovery strategy, and startup investment approach.',
    url: `${SITE_URL}/about`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'About GHL India Ventures — SEBI Registered Category II AIF Chennai',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About GHL India Ventures | SEBI Registered Category II AIF Chennai',
    description:
      'Learn about GHL India Ventures — a SEBI-registered Category II AIF (IN/AIF2/2425/1517) based in Chennai. Our team, investment philosophy, stressed real estate recovery strategy, and startup investment approach.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
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
        name: 'About',
        item: `${SITE_URL}/about`,
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
