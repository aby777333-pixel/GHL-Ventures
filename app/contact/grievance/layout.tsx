import type { Metadata } from 'next';

const SITE_URL = 'https://ghlindiaventures.com';

export const metadata: Metadata = {
  title: 'Grievance Redressal | Investor Complaint Resolution | GHL India Ventures',
  description:
    "GHL India Ventures' investor grievance redressal mechanism. Lodge a complaint, track resolution status, and contact our compliance officer. SEBI-mandated investor protection measures for Category II AIF investors.",
  keywords: [
    'AIF grievance redressal',
    'investor complaint GHL India',
    'SEBI AIF complaint mechanism',
    'investor protection AIF',
    'GHL India Ventures compliance',
    'AIF complaint resolution India',
  ],
  openGraph: {
    title: 'Grievance Redressal | Investor Complaint Resolution | GHL India Ventures',
    description:
      "GHL India Ventures' investor grievance redressal mechanism. Lodge a complaint, track resolution status, and contact our compliance officer.",
    url: `${SITE_URL}/contact/grievance`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GHL India Ventures — Grievance Redressal',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grievance Redressal | Investor Complaint Resolution | GHL India Ventures',
    description:
      "GHL India Ventures' investor grievance redressal mechanism. Lodge a complaint, track resolution status, and contact our compliance officer.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/contact/grievance`,
  },
};

export default function GrievanceLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Contact', item: `${SITE_URL}/contact` },
      { '@type': 'ListItem', position: 3, name: 'Grievance Redressal', item: `${SITE_URL}/contact/grievance` },
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
