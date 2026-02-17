import type { Metadata } from 'next'
import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollProgress from '@/components/ScrollProgress'
import BackToTop from '@/components/BackToTop'
import WhatsAppButton from '@/components/WhatsAppButton'
import TelegramButton from '@/components/TelegramButton'
import VideoCallWidget from '@/components/VideoCallWidget'
import CookieConsent from '@/components/CookieConsent'
import ThemeProvider from '@/lib/ThemeProvider'
import ChatWidget from '@/components/chat/ChatWidget'
import SocialProofToasts from '@/components/SocialProofToasts'
import LiveVisitorCount from '@/components/LiveVisitorCount'
import CommandPalette from '@/components/CommandPalette'
import MarketNewsTicker from '@/components/MarketNewsTicker'
import EconomicCalendar from '@/components/EconomicCalendar'
import PortfolioHeatmap from '@/components/PortfolioHeatmap'
import VoiceNavigator from '@/components/VoiceNavigator'
import InvestorPersonality from '@/components/InvestorPersonality'
import AvatarConcierge from '@/components/AvatarConcierge'

export const metadata: Metadata = {
  title: {
    default: 'GHL India Ventures | SEBI Registered AIF - Investing in India\'s Future',
    template: '%s | GHL India Ventures',
  },
  description: 'GHL India Ventures is a SEBI-registered Category II Alternative Investment Fund (IN/AIF2/2425/1517) focused on high-growth Indian enterprises across technology, healthcare, and consumer sectors.',
  keywords: ['AIF', 'Alternative Investment Fund', 'SEBI', 'India', 'Private Equity', 'GHL India Ventures', 'Category II AIF', 'Chennai', 'Investment'],
  authors: [{ name: 'GHL India Ventures' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://ghlindiaventures.com',
    siteName: 'GHL India Ventures',
    title: 'GHL India Ventures | Investing in India\'s Future',
    description: 'SEBI-registered Category II AIF focused on high-growth Indian enterprises.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'GHL India Ventures' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GHL India Ventures',
    description: 'SEBI-registered Category II AIF investing in India\'s future.',
  },
  robots: { index: true, follow: true },
  metadataBase: new URL('https://ghlindiaventures.com'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: 'GHL India Ventures',
    description: 'SEBI-registered Category II Alternative Investment Fund',
    url: 'https://ghlindiaventures.com',
    telephone: ['+914428431043', '+917200255252'],
    email: 'info@ghlindiaventures.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '2D, Queens Court, No. 6, Montieth Road, Egmore',
      addressLocality: 'Chennai',
      addressRegion: 'Tamil Nadu',
      postalCode: '600008',
      addressCountry: 'IN',
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

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          <ScrollProgress />
          <Navbar />
          <main className="flex-1" id="main-content" role="main">
            {children}
          </main>
          <Footer />
          <BackToTop />
          <WhatsAppButton />
          <TelegramButton />
          <VideoCallWidget />
          <CookieConsent />
          <SocialProofToasts />
          <LiveVisitorCount />
          <MarketNewsTicker />
          <EconomicCalendar />
          <PortfolioHeatmap />
          <VoiceNavigator />
          <InvestorPersonality />
          <CommandPalette />
          <ChatWidget />
          <AvatarConcierge />
        </ThemeProvider>
      </body>
    </html>
  )
}
