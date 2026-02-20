import type { Metadata } from 'next';

const SITE_URL = 'https://ghl-india-ventures-2025.netlify.app';

export const metadata: Metadata = {
  title: 'Startup Application Portal | Apply for GHL India Ventures Funding',
  description:
    "Apply for investment from GHL India Ventures' startup programme. We invest in early-stage, pre-Series A startups across fintech, healthtech, cleantech, and SaaS with strong unit economics and experienced founders.",
  keywords: [
    'startup funding India',
    'apply for AIF investment',
    'GHL India Ventures startup',
    'pre-Series A funding India',
    'venture capital application',
    'startup investment Chennai',
  ],
  openGraph: {
    title: 'Startup Application Portal | Apply for GHL India Ventures Funding',
    description:
      "Apply for investment from GHL India Ventures' startup programme. We invest in early-stage, pre-Series A startups across fintech, healthtech, cleantech, and SaaS.",
    url: `${SITE_URL}/contact/startup-apply`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GHL India Ventures — Startup Application Portal',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Startup Application Portal | Apply for GHL India Ventures Funding',
    description:
      "Apply for investment from GHL India Ventures' startup programme. We invest in early-stage, pre-Series A startups across fintech, healthtech, cleantech, and SaaS.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/contact/startup-apply`,
  },
};

export default function StartupApplyLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Contact', item: `${SITE_URL}/contact` },
      { '@type': 'ListItem', position: 3, name: 'Startup Application', item: `${SITE_URL}/contact/startup-apply` },
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
