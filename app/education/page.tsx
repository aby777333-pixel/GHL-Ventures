import type { Metadata } from 'next'
import EducationRedirect from './EducationRedirect'

/* /education/ is only a client-side hop to /education/insights/. It was in
   the sitemap as "index" with no <h1> (Pulse: H1_MISSING) — a soft redirect.
   Page-level metadata, so it does not affect /education/insights/ (which
   has its own layout). The redirect itself is unchanged. */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function EducationPage() {
  return <EducationRedirect />
}
