import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollProgress from '@/components/ScrollProgress'
import BackToTop from '@/components/BackToTop'
// WhatsAppButton and TelegramButton removed
// import WhatsAppButton from '@/components/WhatsAppButton'
// import TelegramButton from '@/components/TelegramButton'
import VideoCallWidget from '@/components/VideoCallWidget'
import CookieConsent from '@/components/CookieConsent'
import { LegalPopupProvider } from '@/components/LegalPopup'
import { ArticleReaderProvider } from '@/components/ArticleReader'
import ThemeProvider from '@/lib/ThemeProvider'
import SocialProofToasts from '@/components/SocialProofToasts'
import LiveVisitorCount from '@/components/LiveVisitorCount'

// Lazy-load heavy widgets (reduces initial page load by ~2s)
const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), { ssr: false })
const CommandPalette = dynamic(() => import('@/components/CommandPalette'), { ssr: false })
// MarketNewsTicker removed
// const MarketNewsTicker = dynamic(() => import('@/components/MarketNewsTicker'), { ssr: false })
// EconomicCalendar removed
// const EconomicCalendar = dynamic(() => import('@/components/EconomicCalendar'), { ssr: false })
// PortfolioHeatmap removed
// const PortfolioHeatmap = dynamic(() => import('@/components/PortfolioHeatmap'), { ssr: false })
// VoiceNavigator removed (voice command bot)
// const VoiceNavigator = dynamic(() => import('@/components/VoiceNavigator'), { ssr: false })
// InvestorPersonality removed
// const InvestorPersonality = dynamic(() => import('@/components/InvestorPersonality'), { ssr: false })
// AvatarConcierge (Abe & Tina) removed
// const AvatarConcierge = dynamic(() => import('@/components/AvatarConcierge'), { ssr: false })
// VoiceCompanion removed (voice command bot)
// const VoiceCompanion = dynamic(() => import('@/components/VoiceCompanion'), { ssr: false })
// Radio widgets removed
// const BusinessRadioWidget = dynamic(() => import('@/components/BusinessRadioWidget'), { ssr: false })
// const MusicRadioWidget = dynamic(() => import('@/components/MusicRadioWidget'), { ssr: false })

const SITE_URL = 'https://ghl-india-ventures-2025.netlify.app'

export const metadata: Metadata = {
  title: {
    default: 'GHL India Ventures | SEBI Registered AIF Chennai',
    template: '%s',
  },
  description: 'SEBI-registered Category II AIF in Chennai. Invest in stressed real estate & startups. Min \u20B91 Crore (AIF) or \u20B910 Lakhs (Debenture Route). SEBI Reg. IN/AIF2/2425/1517.',
  keywords: [
    'AIF', 'Alternative Investment Fund', 'SEBI registered AIF', 'Category II AIF',
    'GHL India Ventures', 'Chennai investment fund', 'stressed real estate fund India',
    'startup investment fund', 'HNI investment India', 'NCLT real estate recovery',
    'Private Equity India', 'AIF minimum investment', 'SEBI IN/AIF2/2425/1517',
  ],
  authors: [{ name: 'GHL India Ventures' }],
  creator: 'GHL India Ventures',
  publisher: 'GHL India Ventures',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'GHL India Ventures',
    title: 'GHL India Ventures | SEBI Registered AIF Chennai',
    description: 'SEBI-registered Category II AIF investing in stressed real estate and startups. Based in Chennai. Min \u20B91 Cr.',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'GHL India Ventures - SEBI Registered Category II AIF' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GHL India Ventures | SEBI Registered AIF Chennai',
    description: 'SEBI-registered Category II AIF investing in stressed real estate and startups. Chennai.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  metadataBase: new URL(SITE_URL),
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-verification-code',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Organization + LocalBusiness combined schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': ['FinancialService', 'LocalBusiness', 'Organization'],
    '@id': `${SITE_URL}/#organization`,
    name: 'GHL India Ventures',
    legalName: 'GHL India Ventures Private Limited',
    description: 'SEBI-registered Category II Alternative Investment Fund (IN/AIF2/2425/1517) focused on stressed real estate recovery and early-stage startup investments in India.',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    image: `${SITE_URL}/og-image.jpg`,
    telephone: ['+914428431043', '+917200255252'],
    email: 'info@ghlindiaventures.com',
    foundingDate: '2024',
    numberOfEmployees: { '@type': 'QuantitativeValue', value: 50 },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '2D, Queens Court, No. 6, Montieth Road, Egmore',
      addressLocality: 'Chennai',
      addressRegion: 'Tamil Nadu',
      postalCode: '600008',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 13.0719,
      longitude: 80.2609,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '10:00',
      closes: '18:00',
    },
    priceRange: '₹₹₹₹',
    currenciesAccepted: 'INR',
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Investment Products',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'FinancialProduct',
            name: 'Category II AIF - Direct Route',
            description: 'SEBI-registered Category II Alternative Investment Fund for HNIs and family offices. Minimum investment ₹1 Crore.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'FinancialProduct',
            name: 'Debenture Route',
            description: 'Non-Convertible Debenture investment starting at ₹10 Lakhs with exposure to stressed real estate recovery.',
          },
        },
      ],
    },
    sameAs: [
      'https://linkedin.com/company/ghl-india-ventures',
      'https://twitter.com/ghlindia',
      'https://instagram.com/ghlindia',
      'https://youtube.com/@ghlindia',
      'https://facebook.com/ghlindia',
      'https://t.me/ghlindia',
      'https://g.page/ghl-india-ventures',
    ],
  }

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'About', item: `${SITE_URL}/about` },
      { '@type': 'ListItem', position: 3, name: 'Fund', item: `${SITE_URL}/fund` },
      { '@type': 'ListItem', position: 4, name: 'Portfolio', item: `${SITE_URL}/portfolio` },
      { '@type': 'ListItem', position: 5, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 6, name: 'Financial IQ', item: `${SITE_URL}/financial-iq` },
      { '@type': 'ListItem', position: 7, name: 'Contact', item: `${SITE_URL}/contact` },
    ],
  }

  // FAQPage schema for common investor questions
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is a Category II AIF?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A Category II Alternative Investment Fund (AIF) is a SEBI-regulated pooled investment vehicle that invests in real estate, private equity, distressed assets, and unlisted companies. GHL India Ventures is registered as Category II AIF under SEBI Registration No. IN/AIF2/2425/1517.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the minimum investment in GHL India Ventures?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The minimum investment for the Direct AIF Route is ₹1 Crore, as mandated by SEBI for Category II AIFs. For the Debenture Route (NCD structure), the minimum investment starts at ₹10 Lakhs.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is GHL India Ventures SEBI registered?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, GHL India Ventures is registered with the Securities and Exchange Board of India (SEBI) as a Category II Alternative Investment Fund under Registration Number IN/AIF2/2425/1517. This ensures mandatory quarterly audits, third-party custodial safeguards, and transparent NAV reporting.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does stressed real estate investment work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Stressed real estate investment involves acquiring distressed or undervalued properties through legal processes like NCLT (National Company Law Tribunal) resolutions under the IBC (Insolvency and Bankruptcy Code) at significant discounts — typically 40-60% below replacement cost. GHL India Ventures then revitalizes these assets to generate returns for investors.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the expected return on the fund?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'While specific fund performance data is available to registered investors after KYC verification, GHL India Ventures\' stressed real estate strategy is designed for significant value creation through deep-discount NCLT acquisitions. Past performance is not indicative of future results. Please consult our advisory team for detailed information.',
        },
      },
    ],
  }

  return (
    <html lang="en-IN" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.svg" />
        {/* hreflang for multilingual content (primary English-India, with x-default) */}
        <link rel="alternate" hrefLang="en-IN" href={SITE_URL} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Skip navigation link for accessibility (WCAG 2.1 AA) */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <ThemeProvider>
          <LegalPopupProvider>
            <ArticleReaderProvider>
              <ScrollProgress />
              <Navbar />
              <main className="flex-1" id="main-content" role="main">
                {children}
              </main>
              <Footer />
              <BackToTop />
              <VideoCallWidget />
              <CookieConsent />
              <SocialProofToasts />
              <LiveVisitorCount />
              <CommandPalette />
              <ChatWidget />
            </ArticleReaderProvider>
          </LegalPopupProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
