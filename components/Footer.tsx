'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'
import { LegalLink } from '@/components/LegalPopup'
import { BRAND, NAV_LINKS, SOCIAL_LINKS } from '@/lib/constants'
import {
  MapPin,
  Phone,
  Mail,
  ArrowUpRight,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  Send,
  MessageCircle,
  Clock,
  Download,
  Shield,
} from 'lucide-react'

/* X (Twitter) icon — custom SVG */
function XIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

/* Google Business icon (custom SVG — lucide doesn't have one) */
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

const SocialIcon = ({ icon }: { icon: string }) => {
  switch (icon) {
    case 'linkedin':
      return <Linkedin className="w-5 h-5" />
    case 'twitter':
      return <XIcon />
    case 'instagram':
      return <Instagram className="w-5 h-5" />
    case 'youtube':
      return <Youtube className="w-5 h-5" />
    case 'facebook':
      return <Facebook className="w-5 h-5" />
    case 'telegram':
      return <Send className="w-5 h-5" />
    case 'google':
      return <GoogleIcon />
    default:
      return null
  }
}

const DOWNLOAD_LINKS = [
  { label: 'Corporate Brochure', href: '/downloads#corporate-brochure' },
  { label: 'Investment Roadmap', href: '/downloads#investment-roadmap' },
  { label: 'Investment Guide', href: '/downloads#investment-guide' },
  { label: 'NAV Report', href: '/downloads#nav' },
]

const QUICK_LINKS = NAV_LINKS.filter((link) =>
  ['/', '/about', '/fund', '/portfolio', '/blog', '/contact'].includes(link.href)
)

export default function Footer() {
  return (
    <footer role="contentinfo">
      {/* ── WhatsApp Strip ── */}
      <div
        className="w-full"
        style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
      >
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-white">
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold text-sm sm:text-base">
              Have questions? Chat with us on WhatsApp
            </span>
          </div>
          <a
            href={`https://wa.me/${BRAND.phone2.replace(/[\s+]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-white text-green-700 font-semibold
              text-sm rounded-full px-6 py-2.5 hover:bg-green-50 transition-all duration-300
              hover:shadow-lg"
          >
            <span>Chat with us on WhatsApp</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* ── Main Footer ── */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: '#0A0A0A' }}
      >
        {/* Subtle red radial gradient bleed */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center top, rgba(208,2,27,0.08) 0%, transparent 70%)',
          }}
        />

        <div className="relative container-max mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-14 pb-6">
          {/* Logo + Tagline */}
          <div className="flex flex-col items-start mb-10">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <Logo size={48} />
              <span
                className="font-bold text-white"
                style={{ fontSize: '14px', letterSpacing: '0.08em' }}
              >
                GHL INDIA VENTURES
              </span>
            </Link>
            <p className="text-white/50 text-sm italic tracking-wide">
              Creating Wealth. Building Trust. Inspiring Growth.
            </p>
          </div>

          {/* ── Four-Column Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-12">
            {/* Col 1: About GHL */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-5">
                About GHL
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {BRAND.description} We bridge growth capital gaps through strategic
                investments in stressed real estate and early-stage startups across India.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-white/8 border border-white/10 rounded-lg flex items-center
                      justify-center text-white/60 hover:bg-brand-red hover:text-white
                      hover:border-brand-red transition-all duration-300"
                    aria-label={social.label}
                    title={social.label}
                  >
                    <SocialIcon icon={social.icon} />
                  </a>
                ))}
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-5">
                Quick Links
              </h3>
              <ul className="space-y-3">
                {QUICK_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-brand-red transition-colors duration-200
                        text-sm flex items-center group"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 mr-2 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Downloads */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-5">
                Downloads
              </h3>
              <ul className="space-y-3">
                {DOWNLOAD_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-brand-red transition-colors duration-200
                        text-sm flex items-center group"
                    >
                      <Download className="w-3.5 h-3.5 mr-2 opacity-60 group-hover:opacity-100 transition-opacity duration-200" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Contact & Social */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-5">
                Contact Us
              </h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href={`tel:${BRAND.phone1.replace(/\s/g, '')}`}
                    className="flex items-start space-x-3 text-gray-400 hover:text-brand-red transition-colors duration-200 text-sm"
                  >
                    <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{BRAND.phone1}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${BRAND.phone2.replace(/\s/g, '')}`}
                    className="flex items-start space-x-3 text-gray-400 hover:text-brand-red transition-colors duration-200 text-sm"
                  >
                    <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{BRAND.phone2}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${BRAND.email}`}
                    className="flex items-start space-x-3 text-gray-400 hover:text-brand-red transition-colors duration-200 text-sm"
                  >
                    <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{BRAND.email}</span>
                  </a>
                </li>
                <li className="flex items-start space-x-3 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{BRAND.address}</span>
                </li>
                <li className="flex items-start space-x-3 text-gray-400 text-sm">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Mon - Sat: 9:30 AM - 6:30 PM IST</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ── SEBI Disclaimer ── */}
          <div className="border-t border-white/10 pt-8 mb-8">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                    SEBI Disclaimer
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    <strong className="text-gray-400">
                      SEBI Registration No. {BRAND.sebi}
                    </strong>{' '}
                    | Category II Alternative Investment Fund. Investments in Alternative
                    Investment Funds (AIFs) involve risks, including the possible loss of
                    principal amount invested. Past performance is not indicative of future
                    results. This website does not constitute an offer, invitation, or
                    solicitation to invest in the fund. The information provided herein is
                    for general informational purposes only and should not be construed as
                    investment advice. Prospective investors are advised to read all
                    scheme-related documents, including the Private Placement Memorandum
                    (PPM), carefully before making any investment decisions. Investment in
                    the fund is subject to the terms and conditions set forth in the PPM.
                    The fund does not guarantee any returns.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Bar ── */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-xs text-gray-500">
              {/* Left */}
              <p>
                &copy; 2026 GHL India Ventures Trust. All Rights Reserved.
              </p>

              {/* Center */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                <LegalLink
                  type="privacy"
                  className="hover:text-brand-red transition-colors duration-200"
                >
                  Privacy Policy
                </LegalLink>
                <span className="text-white/20">|</span>
                <LegalLink
                  type="terms"
                  className="hover:text-brand-red transition-colors duration-200"
                >
                  Terms &amp; Conditions
                </LegalLink>
                <span className="text-white/20">|</span>
                <LegalLink
                  type="disclaimer"
                  className="hover:text-brand-red transition-colors duration-200"
                >
                  Disclaimer
                </LegalLink>
              </div>

              {/* Right */}
              <p className="text-center lg:text-right">
                SEBI Registration No. {BRAND.sebi}
              </p>
            </div>

            {/* Sub-bottom risk warning */}
            <p className="text-center text-[11px] text-gray-600 mt-4 leading-relaxed">
              Investments in AIFs are subject to market risks. Past performance is not
              indicative of future returns.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
