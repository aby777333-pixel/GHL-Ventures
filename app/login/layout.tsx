import type { Metadata } from 'next'

/* app/login/page.tsx is a client component, so it cannot export metadata of
   its own — this layout is the only place a robots directive can go.

   Why noindex rather than a robots.txt Disallow: a Disallow-ed URL can still
   be listed in search results as a bare link, because the crawler is
   forbidden from fetching the page and therefore never sees the noindex. The
   sign-in page is therefore deliberately crawlable (public/robots.txt) and
   carries noindex here plus an X-Robots-Tag header in netlify.toml — which is
   what actually keeps it out of the index. `follow: true` so the crawler
   still traverses the site links in the header and footer. */
export const metadata: Metadata = {
  title: 'Sign In | GHL India Ventures',
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
