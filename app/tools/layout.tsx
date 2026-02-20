import type { Metadata } from 'next';

const SITE_URL = 'https://ghl-india-ventures-2025.netlify.app';

export const metadata: Metadata = {
  title: 'Investment Calculators & Tools | AIF Planning Tools | GHL India Ventures',
  description:
    'Free investment calculators and financial planning tools — SIP calculator, AIF return estimator, compound interest calculator, tax planning tools, and more from GHL India Ventures.',
  keywords: [
    'investment calculator India',
    'AIF return calculator',
    'SIP calculator',
    'compound interest calculator',
    'financial planning tools',
    'HNI investment tools',
    'tax planning calculator India',
  ],
  openGraph: {
    title: 'Investment Calculators & Tools | AIF Planning Tools | GHL India Ventures',
    description:
      'Free investment calculators and financial planning tools — SIP calculator, AIF return estimator, compound interest calculator, tax planning tools, and more from GHL India Ventures.',
    url: `${SITE_URL}/tools`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GHL India Ventures Investment Calculators & Financial Planning Tools',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Investment Calculators & Tools | AIF Planning Tools | GHL India Ventures',
    description:
      'Free investment calculators and financial planning tools — SIP calculator, AIF return estimator, compound interest calculator, tax planning tools, and more from GHL India Ventures.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/tools`,
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
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
        name: 'Tools',
        item: `${SITE_URL}/tools`,
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
