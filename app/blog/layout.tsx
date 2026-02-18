import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | AIF Insights & Analysis | GHL India Ventures',
  description: 'Expert insights on AIFs, stressed real estate, startup investing, AIF vs PMS comparison, and investment strategies in India.',
  keywords: ['AIF vs PMS India', 'alternative investment fund tax benefits India', 'stressed real estate investment blog', 'AIF insights India', 'Category II AIF analysis'],
  openGraph: {
    title: 'Investment Insights & Blog | GHL India Ventures',
    description: 'Expert insights on AIFs, stressed real estate, startup investing, and market analysis.',
    url: 'https://ghl-india-ventures-2025.netlify.app/blog',
  },
  alternates: {
    canonical: 'https://ghl-india-ventures-2025.netlify.app/blog',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
