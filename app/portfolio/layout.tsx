import type { Metadata } from 'next';

const SITE_URL = 'https://ghl-india-ventures-2025.netlify.app';

export const metadata: Metadata = {
  title: 'Portfolio & Track Record | Investment Performance | GHL India Ventures',
  description:
    "View GHL India Ventures' investment portfolio — stressed real estate recovery projects, startup investments, sector allocation, and performance metrics.",
  keywords: [
    'AIF portfolio India',
    'investment track record',
    'stressed real estate portfolio',
    'startup portfolio India',
    'fund performance metrics',
    'AIF investment results',
  ],
  openGraph: {
    title: 'Portfolio & Track Record | Investment Performance | GHL India Ventures',
    description:
      "View GHL India Ventures' investment portfolio — stressed real estate recovery projects, startup investments, sector allocation, and performance metrics.",
    url: `${SITE_URL}/portfolio`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GHL India Ventures Portfolio & Track Record — Investment Performance',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portfolio & Track Record | Investment Performance | GHL India Ventures',
    description:
      "View GHL India Ventures' investment portfolio — stressed real estate recovery projects, startup investments, sector allocation, and performance metrics.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/portfolio`,
  },
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
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
        name: 'Portfolio',
        item: `${SITE_URL}/portfolio`,
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
