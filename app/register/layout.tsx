import type { Metadata } from 'next'

/* Same reasoning as app/login/layout.tsx: the page is a client component, so
   the robots directive has to live in a layout. Crawlable but noindex, rather
   than robots.txt-blocked, so the directive is actually seen. */
export const metadata: Metadata = {
  title: 'Create Account | GHL India Ventures',
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
