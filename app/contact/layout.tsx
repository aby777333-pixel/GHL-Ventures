import type { Metadata } from 'next';

const SITE_URL = 'https://ghl-india-ventures-2025.netlify.app';

export const metadata: Metadata = {
  title: 'Contact GHL India Ventures | Schedule a Consultation | Chennai AIF',
  description:
    'Get in touch with GHL India Ventures\u0027 investment advisory team. Schedule a consultation, visit our Chennai office, or call +91 7200 255 252. SEBI Registered Category II AIF.',
  keywords: [
    'contact GHL India Ventures',
    'AIF consultation India',
    'investment advisory Chennai',
    'schedule consultation AIF',
    'GHL India Ventures phone',
    'GHL India Ventures email',
    'AIF Chennai office',
  ],
  openGraph: {
    title: 'Contact GHL India Ventures | Schedule a Consultation | Chennai AIF',
    description:
      'Get in touch with GHL India Ventures\u0027 investment advisory team. Schedule a consultation, visit our Chennai office, or call +91 7200 255 252. SEBI Registered Category II AIF.',
    url: `${SITE_URL}/contact`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Contact GHL India Ventures — Schedule a Consultation',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact GHL India Ventures | Schedule a Consultation | Chennai AIF',
    description:
      'Get in touch with GHL India Ventures\u0027 investment advisory team. Schedule a consultation, visit our Chennai office, or call +91 7200 255 252. SEBI Registered Category II AIF.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
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
        name: 'Contact',
        item: `${SITE_URL}/contact`,
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
