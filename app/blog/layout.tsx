import type { Metadata } from 'next';

const SITE_URL = 'https://ghl-india-ventures-2025.netlify.app';

export const metadata: Metadata = {
  title: 'Insights & Blog | Alternative Investment Research | GHL India Ventures',
  description:
    "Expert insights on alternative investments, stressed real estate, startup investing, AIF regulations, and wealth management strategies from GHL India Ventures' research team.",
  keywords: [
    'AIF blog',
    'alternative investment insights',
    'stressed real estate India blog',
    'startup investing insights',
    'HNI investment blog',
    'SEBI AIF news',
    'private equity India blog',
    'wealth management insights',
  ],
  openGraph: {
    title: 'Insights & Blog | Alternative Investment Research | GHL India Ventures',
    description:
      "Expert insights on alternative investments, stressed real estate, startup investing, AIF regulations, and wealth management strategies from GHL India Ventures' research team.",
    url: `${SITE_URL}/blog`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GHL India Ventures Blog — Alternative Investment Insights & Research',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Insights & Blog | Alternative Investment Research | GHL India Ventures',
    description:
      "Expert insights on alternative investments, stressed real estate, startup investing, AIF regulations, and wealth management strategies from GHL India Ventures' research team.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
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
        name: 'Blog',
        item: `${SITE_URL}/blog`,
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
