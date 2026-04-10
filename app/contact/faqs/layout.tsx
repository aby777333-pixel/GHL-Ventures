import type { Metadata } from 'next';

const SITE_URL = 'https://ghlindiaventures.com';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | GHL India Ventures AIF',
  description:
    'Answers to common questions about investing in GHL India Ventures — Category II AIF eligibility, minimum investment, fund structure, KYC process, returns distribution, and SEBI compliance.',
  keywords: [
    'GHL India Ventures FAQ',
    'AIF investment questions India',
    'Category II AIF minimum investment',
    'SEBI AIF FAQ',
    'HNI investment queries',
    'AIF KYC process India',
    'alternative investment fund questions',
  ],
  openGraph: {
    title: 'Frequently Asked Questions | GHL India Ventures AIF',
    description:
      'Answers to common questions about investing in GHL India Ventures — Category II AIF eligibility, minimum investment, fund structure, KYC process, returns distribution, and SEBI compliance.',
    url: `${SITE_URL}/contact/faqs`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GHL India Ventures — Frequently Asked Questions',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frequently Asked Questions | GHL India Ventures AIF',
    description:
      'Answers to common questions about investing in GHL India Ventures — Category II AIF eligibility, minimum investment, fund structure, KYC process, returns distribution, and SEBI compliance.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/contact/faqs`,
  },
};

export default function FaqsLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Contact', item: `${SITE_URL}/contact` },
      { '@type': 'ListItem', position: 3, name: 'FAQs', item: `${SITE_URL}/contact/faqs` },
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
