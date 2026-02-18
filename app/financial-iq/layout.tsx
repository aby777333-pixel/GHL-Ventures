import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Financial IQ | Learn Investing | GHL India Ventures',
  description: 'Build your Financial IQ with GHL India Ventures. Learn AIF fundamentals, SEBI regulations, and smart investing strategies.',
  keywords: ['investment education India', 'AIF glossary', 'financial literacy', 'investment terms explained', 'SEBI AIF regulations guide'],
  openGraph: {
    title: 'Financial IQ | Investment Education | GHL India Ventures',
    description: 'Learn investment fundamentals, AIF concepts, and smart investing strategies.',
    url: 'https://ghl-india-ventures-2025.netlify.app/financial-iq',
  },
  alternates: {
    canonical: 'https://ghl-india-ventures-2025.netlify.app/financial-iq',
  },
}

export default function FinancialIQLayout({ children }: { children: React.ReactNode }) {
  return children
}
