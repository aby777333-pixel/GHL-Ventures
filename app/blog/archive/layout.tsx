import type { Metadata } from 'next';

const SITE_URL = 'https://ghlindiaventures.com';

/* page.tsx here is a client component, so it cannot export metadata and
   used to inherit app/blog/layout.tsx wholesale — including
   `canonical: /blog`. That told search engines this page is a duplicate of
   the blog hub while the sitemap listed it as indexable (Pulse:
   SITEMAP_CONFLICT). This layout only supplies the page's own metadata;
   it renders children untouched. */
export const metadata: Metadata = {
  title: 'Blog Archive — Every Article by Date | GHL India Ventures',
  description:
    'The complete GHL India Ventures research archive: every article on alternative investments, Category II AIFs, stressed real estate and wealth strategy, grouped by year.',
  openGraph: {
    title: 'Blog Archive — Every Article by Date | GHL India Ventures',
    description:
      'The complete GHL India Ventures research archive: every article on alternative investments, Category II AIFs, stressed real estate and wealth strategy, grouped by year.',
    url: `${SITE_URL}/blog/archive`,
    siteName: 'GHL India Ventures',
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'GHL India Ventures Blog Archive' }],
    locale: 'en_IN',
  },
  alternates: {
    canonical: `${SITE_URL}/blog/archive`,
  },
};

export default function BlogArchiveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
