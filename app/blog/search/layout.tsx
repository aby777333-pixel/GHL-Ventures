import type { Metadata } from 'next';

const SITE_URL = 'https://ghlindiaventures.com';

/* page.tsx is a client component and inherited app/blog/layout.tsx wholesale:
   the blog hub's title and description (Pulse: TITLE_DUPLICATE /
   DESCRIPTION_DUPLICATE with /blog/) plus an "index" robots tag. Internal
   search results are thin, query-driven pages that should not be indexed;
   `follow` keeps the article links crawlable. Metadata only — children
   render untouched. */
export const metadata: Metadata = {
  title: 'Search Insights | GHL India Ventures',
  description: 'Search GHL India Ventures articles on alternative investments, Category II AIFs, stressed real estate and wealth strategy.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: `${SITE_URL}/blog/search`,
  },
};

export default function BlogSearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
