import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Script from 'next/script'
import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollProgress from '@/components/ScrollProgress'
import BackToTop from '@/components/BackToTop'
import MainSiteOnly from '@/components/MainSiteOnly'
import WhatsAppButton from '@/components/WhatsAppButton'
import VideoCallWidget from '@/components/VideoCallWidget'
import DirectCallWidget from '@/components/DirectCallWidget'
import CookieConsent from '@/components/CookieConsent'
import { LegalPopupProvider } from '@/components/LegalPopup'
import { ArticleReaderProvider } from '@/components/ArticleReader'
import ThemeProvider from '@/lib/ThemeProvider'
import SocialProofToasts from '@/components/SocialProofToasts'
import LiveVisitorCount from '@/components/LiveVisitorCount'

// Lazy-load heavy widgets (reduces initial page load by ~2s)
const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), { ssr: false })
const CommandPalette = dynamic(() => import('@/components/CommandPalette'), { ssr: false })
// VoiceCommandWidget hidden for now — uncomment to re-enable
// const VoiceCommandWidget = dynamic(() => import('@/components/VoiceCommandWidget'), { ssr: false })
// SpeechTranslationWidget hidden for now — uncomment to re-enable
// const SpeechTranslationWidget = dynamic(() => import('@/components/SpeechTranslationWidget'), { ssr: false })
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
  description: 'SEBI-registered Category II AIF in Chennai. Invest in stressed real estate & startups via AIF or SEBI Co-Invest Framework. SEBI Reg. IN/AIF2/2425/1517.',
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
    description: 'SEBI-registered Category II AIF investing in stressed real estate and startups. Based in Chennai.',
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
            description: 'SEBI-registered Category II Alternative Investment Fund for HNIs and family offices. Minimum investment as per SEBI AIF Regulations.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'FinancialProduct',
            name: 'SEBI Co-Invest Framework',
            description: 'Co-invest instrument providing exposure to stressed real estate recovery. Contact for investment details.',
          },
        },
      ],
    },
    sameAs: [
      'https://www.instagram.com/ghl_india_venture/',
      'https://x.com/ghlindiaventure',
      'https://www.linkedin.com/company/103819089/',
      'https://www.youtube.com/@GHLIndiaVentures',
      'https://www.facebook.com/GHLindiaVentures',
      'https://t.me/+QfQ9nVP5T4Y4ZmE1',
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
          text: 'The minimum investment for the Direct AIF Route is as per SEBI AIF Regulations for Category II AIFs. For the SEBI Co-Invest Framework, please contact our team for current investment details.',
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
        {/* Google Analytics (GA4) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2944C8HHTK"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2944C8HHTK');
          `}
        </Script>
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
              <MainSiteOnly>
                <ScrollProgress />
                <Navbar />
              </MainSiteOnly>
              <main className="flex-1" id="main-content" role="main">
                {children}
              </main>
              <MainSiteOnly>
                <Footer />
                <BackToTop />
                <WhatsAppButton />
                <CookieConsent />
                <SocialProofToasts />
                <LiveVisitorCount />
                {/* Tawk.to Live Chat */}
                <Script
                  id="tawk-to"
                  strategy="lazyOnload"
                  dangerouslySetInnerHTML={{
                    __html: `
                      var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
                      (function(){
                        var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                        s1.async=true;
                        s1.src='https://embed.tawk.to/699f1c7dedd3e21c341593ce/1jiaoeitu';
                        s1.charset='UTF-8';
                        s1.setAttribute('crossorigin','*');
                        s0.parentNode.insertBefore(s1,s0);
                      })();
                    `,
                  }}
                />
              </MainSiteOnly>
              {/* Floating widgets — always visible (useful for staff telecallers & CS) */}
              <VideoCallWidget />
              <DirectCallWidget />
              {/* VoiceCommandWidget hidden for now */}
              {/* <VoiceCommandWidget /> */}
              {/* SpeechTranslationWidget hidden for now */}
              {/* <SpeechTranslationWidget /> */}
              <CommandPalette />
              <ChatWidget />
            </ArticleReaderProvider>
          </LegalPopupProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
