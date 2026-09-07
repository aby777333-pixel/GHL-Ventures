import type { Metadata } from 'next';

const SITE_URL = 'https://ghlindiaventures.com';

export const metadata: Metadata = {
  title: 'Thank You | GHL India Ventures',
  description:
    'Your consultation request has been received. Our investment team will reach out within 24-48 business hours.',
  // Conversion landing page: kept out of search so an organic visitor can
  // never land here and fire a false Meta lead conversion. Also keeps it out
  // of the sitemap's intent.
  robots: {
    index: false,
    follow: true,
    nocache: true,
    googleBot: { index: false, follow: true },
  },
  openGraph: {
    title: 'Thank You | GHL India Ventures',
    description:
      'Your consultation request has been received. Our investment team will reach out within 24-48 business hours.',
    url: `${SITE_URL}/contact/thankyou`,
    siteName: 'GHL India Ventures',
    type: 'website',
    locale: 'en_IN',
  },
  alternates: {
    canonical: `${SITE_URL}/contact/thankyou`,
  },
};

export default function ContactThankYouLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
