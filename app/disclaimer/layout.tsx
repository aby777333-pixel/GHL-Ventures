import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Disclaimer | GHL India Ventures | SEBI Registered AIF',
  description: 'Investment disclaimer for GHL India Ventures. SEBI-registered Category II AIF. Investments are subject to market risks.',
  alternates: {
    canonical: 'https://ghlindiaventures.com/disclaimer',
  },
}

export default function DisclaimerLayout({ children }: { children: React.ReactNode }) {
  return children
}
