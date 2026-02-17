'use client'

import { useState } from 'react'
import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import PlaceholderImage from '@/components/PlaceholderImage'
import {
  ArrowLeft, ArrowRight, Clock, Calendar, Tag, BookOpen,
  Share2, Linkedin, Copy, Check, MessageCircle,
  Shield, User
} from 'lucide-react'

interface Article {
  slug: string
  title: string
  excerpt: string
  date: string
  category: string
  readTime: string
}

interface Props {
  article: Article
  content: string[]
  relatedArticles: readonly Article[]
  sebiReg: string
}

/* ─── Floating Share Sidebar ─── */
function ShareSidebar({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false)
  const articleUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/fund/${slug}`
    : `/fund/${slug}`

  const handleCopy = () => {
    navigator.clipboard.writeText(articleUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLinks = [
    {
      label: 'Twitter / X',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(articleUrl)}`,
    },
    {
      label: 'LinkedIn',
      icon: <Linkedin className="w-4 h-4" />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`,
    },
    {
      label: 'WhatsApp',
      icon: <MessageCircle className="w-4 h-4" />,
      href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + articleUrl)}`,
    },
  ]

  return (
    <div className="hidden xl:flex flex-col items-center space-y-3 sticky top-32">
      <span className="text-brand-grey text-[10px] uppercase tracking-wider font-semibold mb-1">Share</span>

      {shareLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 bg-brand-offwhite rounded-full flex items-center justify-center text-brand-grey hover:bg-brand-red hover:text-white transition-all"
          aria-label={`Share on ${link.label}`}
        >
          {link.icon}
        </a>
      ))}

      {/* Copy link */}
      <button
        onClick={handleCopy}
        className="w-10 h-10 bg-brand-offwhite rounded-full flex items-center justify-center text-brand-grey hover:bg-brand-red hover:text-white transition-all"
        aria-label="Copy link"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function FundArticleClient({ article, content, relatedArticles, sebiReg }: Props) {
  return (
    <>
      {/* ─── Full-Width Hero Image Placeholder ─── */}
      <section className="relative">
        <PlaceholderImage
          theme={article.category.toLowerCase().includes('real estate') ? 'real-estate' : article.category.toLowerCase().includes('startup') || article.category.toLowerCase().includes('fintech') ? 'startup' : 'education'}
          aspectRatio="aspect-[21/9]"
          label={article.category}
          className="rounded-none"
        />
        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ─── Article Header ─── */}
      <section className="relative -mt-20 z-10">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto">
              <Link
                href="/fund"
                className="inline-flex items-center text-brand-grey hover:text-brand-red mb-6 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Fund Insights
              </Link>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="inline-flex items-center px-3 py-1 bg-brand-red/10 rounded-full text-brand-red text-xs font-semibold">
                  <Tag className="w-3 h-3 mr-1" /> {article.category}
                </span>
                <span className="text-brand-grey text-sm flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {new Date(article.date).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="text-brand-grey text-sm flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1" /> {article.readTime}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-brand-black leading-tight">
                {article.title}
              </h1>
              <p className="text-base text-brand-grey mt-3">{article.excerpt}</p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Author Block ─── */}
      <section className="py-8">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="flex items-center space-x-4 border-y border-gray-100 py-6">
                {/* Author photo placeholder */}
                <div className="w-14 h-14 rounded-full overflow-hidden shrink-0">
                  <PlaceholderImage theme="team" aspectRatio="w-14 h-14" className="rounded-full" />
                </div>
                <div className="flex-grow">
                  <p className="font-bold text-brand-black text-sm">GHL India Ventures Research Team</p>
                  <p className="text-brand-grey text-xs leading-relaxed mt-0.5">
                    Our research team combines expertise in stressed real estate analysis, startup due diligence,
                    and SEBI regulatory frameworks to produce actionable insights for sophisticated investors.
                  </p>
                </div>
                <a
                  href="https://linkedin.com/company/ghl-india-ventures"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-grey hover:text-brand-red transition-colors shrink-0"
                  aria-label="GHL India Ventures LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── Article Body with Floating Share Sidebar ─── */}
      <section className="pb-16">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto flex gap-12">
            {/* Floating sidebar (desktop only) */}
            <div className="hidden xl:block w-16 shrink-0">
              <ShareSidebar title={article.title} slug={article.slug} />
            </div>

            {/* Main content */}
            <div className="flex-grow max-w-3xl">
              <AnimatedSection>
                <div className="prose prose-lg max-w-none">
                  {content.map((para, i) => (
                    <p key={i} className="text-brand-grey leading-relaxed mb-6 text-base">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Mobile share row */}
                <div className="xl:hidden mt-10 flex items-center space-x-3 border-t border-gray-100 pt-6">
                  <Share2 className="w-5 h-5 text-brand-grey" />
                  <span className="text-brand-grey text-sm font-medium">Share this article:</span>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent('/fund/' + article.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-brand-offwhite rounded-full flex items-center justify-center text-brand-grey hover:bg-brand-red hover:text-white transition-all"
                    aria-label="Share on Twitter"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('/fund/' + article.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-brand-offwhite rounded-full flex items-center justify-center text-brand-grey hover:bg-brand-red hover:text-white transition-all"
                    aria-label="Share on LinkedIn"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(article.title + ' /fund/' + article.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-brand-offwhite rounded-full flex items-center justify-center text-brand-grey hover:bg-brand-red hover:text-white transition-all"
                    aria-label="Share on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* ─── CTA: Want to Invest? ─── */}
                <div className="mt-12 bg-gradient-to-r from-brand-black to-gray-800 rounded-2xl p-8 text-center">
                  <h3 className="text-2xl font-bold text-white mb-3">Want to invest?</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
                    Learn how our SEBI-registered Category II AIF can help you access
                    institutional-grade alternative investments starting at Rs 1 Crore.
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center px-8 py-3 bg-brand-red text-white font-bold rounded-lg hover:bg-red-700 transition-all"
                  >
                    Schedule a Consultation <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>

                {/* ─── Disclaimer ─── */}
                <div className="mt-8 bg-brand-offwhite rounded-xl p-6 border-l-4 border-brand-red">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-brand-grey leading-relaxed">
                        <strong className="text-brand-black">Disclaimer:</strong> This article is for informational purposes only
                        and does not constitute investment advice or an offer to invest. Investments in AIFs are subject to
                        market risks. Past performance is not indicative of future results. Please read the Private Placement
                        Memorandum carefully and consult your financial advisor before making any investment decisions.
                      </p>
                      <p className="text-xs text-brand-grey mt-2">
                        <strong className="text-brand-black">SEBI Registration:</strong> {sebiReg} | Category II AIF |
                        SEBI (AIF) Regulations, 2012
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Related Articles ─── */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-12">
            <span className="text-brand-red font-semibold text-sm uppercase tracking-wider">Keep Reading</span>
            <h2 className="text-2xl font-bold text-brand-black mt-2">Related Articles</h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {relatedArticles.map((ra, i) => (
              <AnimatedSection key={ra.slug} delay={i * 100}>
                <Link href={`/fund/${ra.slug}`} className="card block group h-full hover:-translate-y-1">
                  {/* Image placeholder */}
                  <PlaceholderImage
                    theme={ra.category.toLowerCase().includes('real estate') ? 'real-estate' : ra.category.toLowerCase().includes('startup') || ra.category.toLowerCase().includes('fintech') ? 'startup' : 'education'}
                    aspectRatio="aspect-[16/10]"
                    label={ra.category}
                    className="rounded-lg mb-4"
                  />

                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs font-semibold text-brand-red uppercase">{ra.category}</span>
                  </div>
                  <h3 className="font-bold text-brand-black mb-2 group-hover:text-brand-red transition-colors line-clamp-2">
                    {ra.title}
                  </h3>
                  <p className="text-brand-grey text-sm line-clamp-2">{ra.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-brand-grey mt-4 pt-3 border-t border-gray-100">
                    <span>{new Date(ra.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span>{ra.readTime}</span>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
