import type { Metadata } from 'next';

const SITE_URL = 'https://ghl-india-ventures-2025.netlify.app';

export const metadata: Metadata = {
  title: 'Investment Fund | Category II AIF — Stressed Real Estate & Startups | GHL India Ventures',
  description:
    "Explore GHL India Ventures' SEBI-registered Category II AIF — dual strategy combining stressed real estate recovery via NCLT and early-stage venture capital. Min ₹1 Crore AIF or ₹10 Lakhs Debenture Route.",
  keywords: [
    'AIF fund India',
    'Category II AIF fund',
    'stressed real estate investment',
    'startup investment fund',
    'NCLT real estate recovery',
    'debenture route',
    'private equity India',
    'AIF minimum investment 1 crore',
    'venture capital fund India',
  ],
  openGraph: {
    title: 'Investment Fund | Category II AIF — Stressed Real Estate & Startups | GHL India Ventures',
    description:
      "Explore GHL India Ventures' SEBI-registered Category II AIF — dual strategy combining stressed real estate recovery via NCLT and early-stage venture capital. Min ₹1 Crore AIF or ₹10 Lakhs Debenture Route.",
    url: `${SITE_URL}/fund`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GHL India Ventures Investment Fund — Category II AIF Stressed Real Estate & Startups',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Investment Fund | Category II AIF — Stressed Real Estate & Startups | GHL India Ventures',
    description:
      "Explore GHL India Ventures' SEBI-registered Category II AIF — dual strategy combining stressed real estate recovery via NCLT and early-stage venture capital. Min ₹1 Crore AIF or ₹10 Lakhs Debenture Route.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/fund`,
  },
};

export default function FundLayout({ children }: { children: React.ReactNode }) {
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
        name: 'Fund',
        item: `${SITE_URL}/fund`,
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
