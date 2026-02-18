import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Downloads | Fund Brochure & Investor Documents | GHL India Ventures',
  description: 'Download GHL India Ventures fund brochure, Private Placement Memorandum (PPM), factsheets, and investor presentations. SEBI-registered Category II AIF resources.',
  openGraph: {
    title: 'Downloads | Investor Documents | GHL India Ventures',
    description: 'Access fund brochures, factsheets, and investor presentations for GHL India Ventures AIF.',
    url: 'https://ghl-india-ventures-2025.netlify.app/downloads',
  },
  alternates: {
    canonical: 'https://ghl-india-ventures-2025.netlify.app/downloads',
  },
}

export default function DownloadsLayout({ children }: { children: React.ReactNode }) {
  return children
}
