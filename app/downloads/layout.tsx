import type { Metadata } from 'next';

const SITE_URL = 'https://ghl-india-ventures-2025.netlify.app';

export const metadata: Metadata = {
  title: 'Downloads — Brochures, PPM & Reports | GHL India Ventures',
  description:
    'Download GHL India Ventures corporate brochure, investment roadmap, fund factsheet, and compliance documents. SEBI-registered Category II AIF documentation.',
  keywords: [
    'GHL India Ventures brochure',
    'AIF PPM download',
    'fund factsheet download',
    'investment roadmap',
    'AIF corporate brochure',
    'GHL India Ventures documents',
  ],
  openGraph: {
    title: 'Downloads — Brochures, PPM & Reports | GHL India Ventures',
    description:
      'Download GHL India Ventures corporate brochure, investment roadmap, fund factsheet, and compliance documents. SEBI-registered Category II AIF documentation.',
    url: `${SITE_URL}/downloads`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GHL India Ventures Downloads — Brochures, PPM & Reports',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Downloads — Brochures, PPM & Reports | GHL India Ventures',
    description:
      'Download GHL India Ventures corporate brochure, investment roadmap, fund factsheet, and compliance documents. SEBI-registered Category II AIF documentation.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/downloads`,
  },
};

export default function DownloadsLayout({ children }: { children: React.ReactNode }) {
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
        name: 'Downloads',
        item: `${SITE_URL}/downloads`,
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
