import type { Metadata } from 'next';

const SITE_URL = 'https://ghlindiaventures.com';

/* page.tsx here is a client component, so it cannot export metadata and
   used to inherit app/blog/layout.tsx wholesale — including
   `canonical: /blog`. That told search engines this page is a duplicate of
   the blog hub while the sitemap listed it as indexable (Pulse:
   SITEMAP_CONFLICT). This layout only supplies the page's own metadata;
   it renders children untouched. */
export const metadata: Metadata = {
  title: 'Free AIF Research Reports | GHL India Ventures',
  description:
    "Free in-depth PDF research on India's alternative investment market — AIF strategy, distressed real estate, startup investing and wealth management from GHL India Ventures.",
  openGraph: {
    title: 'Free Research Reports — AIF & Alternative Investments | GHL India Ventures',
    description:
      "Free in-depth PDF research on India's alternative investment market — AIF strategy, distressed real estate, startup investing and wealth management from GHL India Ventures.",
    url: `${SITE_URL}/blog/reports`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'GHL India Ventures Research Reports' }],
    locale: 'en_IN',
  },
  alternates: {
    canonical: `${SITE_URL}/blog/reports`,
  },
};

export default function BlogReportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
