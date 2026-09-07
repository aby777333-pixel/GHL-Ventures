import type { Metadata } from 'next';

const SITE_URL = 'https://ghlindiaventures.com';

export const metadata: Metadata = {
  title: 'Request a Consultation | GHL India Ventures',
  description:
    'Speak with the GHL India Ventures investment team. Share your details and we will schedule a call at your convenience. SEBI Registered Category II AIF.',
  // Standalone landing page for paid traffic. It carries the same form as
  // /contact/, so it is kept out of search to avoid competing with (and
  // duplicating) the canonical contact page.
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
  openGraph: {
    title: 'Request a Consultation | GHL India Ventures',
    description:
      'Speak with the GHL India Ventures investment team. Share your details and we will schedule a call at your convenience.',
    url: `${SITE_URL}/contact/consultation`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Request a Consultation — GHL India Ventures',
      },
    ],
    locale: 'en_IN',
  },
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
};

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
