import type { Metadata } from 'next'

const SITE_URL = 'https://ghlindiaventures.com'

export const metadata: Metadata = {
  title: 'What is an AIF? | Alternative Investment Funds Explained | GHL India Ventures',
  description:
    'Comprehensive guide to Alternative Investment Funds (AIFs) in India — what they are, how they work, SEBI regulations, three categories, advantages, comparison with mutual funds & PMS, and how GHL India Ventures delivers institutional-grade AIF strategies.',
  keywords: [
    'what is AIF', 'alternative investment fund India', 'AIF explained', 'SEBI AIF regulations',
    'Category I AIF', 'Category II AIF', 'Category III AIF', 'AIF vs mutual fund',
    'AIF vs PMS', 'AIF minimum investment', 'AIF tax benefits', 'private equity India',
    'stressed real estate fund', 'venture capital AIF', 'GHL India Ventures AIF',
    'SEBI registered AIF Chennai', 'HNI investment India', 'AIF for NRI',
    'alternative investments India', 'AIF advantages', 'how AIF works',
  ],
  openGraph: {
    title: 'What is an AIF? | Alternative Investment Funds Explained',
    description: 'Complete guide to SEBI-regulated Alternative Investment Funds — categories, advantages, how they work, and how GHL India Ventures delivers institutional-grade returns.',
    url: `${SITE_URL}/why-aifs`,
    siteName: 'GHL India Ventures',
    type: 'article',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'Understanding Alternative Investment Funds in India — GHL India Ventures' }],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What is an AIF? | Alternative Investment Funds Explained',
    description: 'Comprehensive guide to AIFs in India — what they are, how they work, SEBI regulations, advantages, and comparison with traditional investments.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/why-aifs`,
  },
}

export default function WhyAIFsLayout({ children }: { children: React.ReactNode }) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Who can invest in an AIF?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AIFs are designed for sophisticated investors including Indian residents, HNIs, family offices, corporates, banks, NBFCs, insurance companies, pension funds, and NRIs (through NRO accounts). The minimum investment for Category I and II AIFs is as per SEBI regulations.',
        },
      },
      {
        '@type': 'Question',
        name: 'How is an AIF different from a mutual fund?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Mutual funds are publicly offered with low minimums and invest in listed securities. AIFs are privately placed with higher minimums as per SEBI regulations, invest in unlisted and alternative assets, have longer lock-in periods, and offer access to strategies not available through public markets.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the lock-in period for an AIF?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Close-ended Category I and II AIFs typically have a tenure of 3 to 7 years, with a possible extension of up to 2 years. The lock-in reflects the nature of illiquid, alternative assets that require time for value creation.',
        },
      },
      {
        '@type': 'Question',
        name: 'What fees do AIFs charge?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AIF fee structures typically include a Management Fee (1–2% annually), a Performance Fee or Carried Interest (typically 15–20% of profits above a hurdle rate), and operational expenses. All fees must be disclosed in the PPM.',
        },
      },
      {
        '@type': 'Question',
        name: 'How are AIF returns taxed?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Category I and II AIFs enjoy tax pass-through status for all income except business income. Investors are taxed as if they directly invested. Category III AIFs are taxed at the fund level.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can NRIs invest in Indian AIFs?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. NRIs can invest in Indian AIFs through their NRO account. The fund handles all FEMA and RBI compliance requirements. NRI investors are subject to India\'s tax treaties and may have withholding tax obligations.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is GHL India Ventures\' SEBI registration?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'GHL India Ventures is registered with SEBI as a Category II AIF under Registration Number IN/AIF2/2425/1517, headquartered in Chennai, Tamil Nadu.',
        },
      },
    ],
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Understanding Alternative Investment Funds in India',
    description: 'Comprehensive guide to SEBI-regulated AIFs — what they are, how they work, their advantages, and how institutional-grade strategies deliver superior risk-adjusted returns.',
    author: { '@type': 'Organization', name: 'GHL India Ventures' },
    publisher: { '@type': 'Organization', name: 'GHL India Ventures', logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.svg` } },
    url: `${SITE_URL}/why-aifs`,
    mainEntityOfPage: `${SITE_URL}/why-aifs`,
    datePublished: '2025-01-15',
    dateModified: '2026-02-19',
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Why AIFs', item: `${SITE_URL}/why-aifs` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  )
}
