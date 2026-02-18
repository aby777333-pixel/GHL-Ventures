import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | GHL India Ventures | Chennai AIF',
  description: 'Contact GHL India Ventures for investment advisory. Egmore, Chennai 600008. Phone: +91 7200 255 252. SEBI Registered AIF.',
  openGraph: {
    title: 'Contact GHL India Ventures | Chennai',
    description: 'Reach our investment advisory team in Chennai. SEBI-registered Category II AIF.',
    url: 'https://ghl-india-ventures-2025.netlify.app/contact',
  },
  alternates: {
    canonical: 'https://ghl-india-ventures-2025.netlify.app/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
