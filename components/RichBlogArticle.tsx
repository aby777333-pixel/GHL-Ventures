'use client'

import { useState } from 'react'
import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import PlaceholderImage from '@/components/PlaceholderImage'
import {
  ArrowLeft, ArrowRight, Clock, Calendar, Tag, BookOpen,
  Share2, Linkedin, Copy, Check, MessageCircle,
  Shield, User, ExternalLink
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
  children: React.ReactNode
  relatedArticles: readonly Article[]
  sebiReg: string
  schemas?: object[]
}

/* ─── Floating Share Sidebar ─── */
function ShareSidebar({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false)
  const articleUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/blog/${slug}`
    : `/blog/${slug}`

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

/* ─── Register CTA Button ─── */
export function RegisterButton() {
  return (
    <div className="my-10 text-center">
      <Link
        href="/contact"
        className="inline-flex items-center px-10 py-4 bg-gradient-to-r from-brand-red to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg"
      >
        Register an Account <ArrowRight className="ml-3 w-5 h-5" />
      </Link>
    </div>
  )
}

/* ─── Blog Image with Unsplash ─── */
export function BlogImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="my-8 rounded-xl overflow-hidden shadow-lg">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-cover aspect-video"
        loading="lazy"
      />
      {caption && (
        <figcaption className="text-xs text-brand-grey text-center py-3 px-4 bg-gray-50 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

/* ─── Blog Table ─── */
export function BlogTable({ headers, rows, caption }: { headers: string[]; rows: string[][]; caption?: string }) {
  return (
    <div className="my-8 overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      {caption && (
        <div className="px-4 py-3 bg-brand-black text-white font-semibold text-sm">
          {caption}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left font-bold text-brand-black border-b border-gray-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-brand-grey border-b border-gray-100">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Section Heading ─── */
export function SectionHeading({ children, level = 2 }: { children: React.ReactNode; level?: 2 | 3 | 4 }) {
  const classes = {
    2: 'text-2xl md:text-3xl font-bold text-brand-black mt-12 mb-4',
    3: 'text-xl md:text-2xl font-bold text-brand-black mt-10 mb-3',
    4: 'text-lg md:text-xl font-semibold text-brand-black mt-8 mb-2',
  }
  const Tag = `h${level}` as keyof JSX.IntrinsicElements
  return <Tag className={classes[level]}>{children}</Tag>
}

/* ─── Paragraph ─── */
export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-brand-grey leading-relaxed mb-6 text-base">{children}</p>
}

/* ─── Bullet List ─── */
export function BulletList({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="list-none space-y-3 mb-6 ml-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-brand-grey text-base leading-relaxed">
          <span className="w-2 h-2 rounded-full bg-brand-red mt-2 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/* ─── Numbered List ─── */
export function NumberedList({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <div className="space-y-4 mb-6">
      {items.map((item, i) => (
        <div key={i} className="flex gap-4 items-start">
          <span className="w-8 h-8 rounded-full bg-brand-red/10 text-brand-red font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
            {i + 1}
          </span>
          <div>
            <span className="font-bold text-brand-black">{item.title}</span>{' '}
            <span className="text-brand-grey text-base leading-relaxed">{item.desc}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Highlight Box ─── */
export function HighlightBox({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="my-8 bg-gradient-to-br from-brand-red/5 to-red-50 border border-brand-red/20 rounded-xl p-6">
      {title && <h4 className="font-bold text-brand-black mb-3 text-lg">{title}</h4>}
      <div className="text-brand-grey text-base leading-relaxed">{children}</div>
    </div>
  )
}

/* ─── Internal Link ─── */
export function InternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-brand-red hover:text-red-700 font-semibold underline underline-offset-2 transition-colors">
      {children}
    </Link>
  )
}

/* ─── FAQ Section ─── */
export function FAQSection({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <div className="my-10">
      <h2 className="text-2xl md:text-3xl font-bold text-brand-black mb-6">Frequently Asked Questions</h2>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-brand-black text-base pr-4">{faq.q}</span>
              <span className={`text-brand-red transition-transform ${openIndex === i ? 'rotate-45' : ''}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </span>
            </button>
            {openIndex === i && (
              <div className="px-6 pb-4 text-brand-grey text-base leading-relaxed border-t border-gray-100 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Main Rich Blog Article Layout ─── */
export default function RichBlogArticle({ article, children, relatedArticles, sebiReg, schemas }: Props) {
  return (
    <>
      {/* Schema.org structured data */}
      {schemas?.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* ─── Full-Width Hero Image Placeholder ─── */}
      <section className="relative">
        <PlaceholderImage
          theme={article.category.toLowerCase().includes('real estate') ? 'real-estate' : article.category.toLowerCase().includes('startup') ? 'startup' : 'education'}
          aspectRatio="aspect-[21/9]"
          label={article.category}
          className="rounded-none"
        />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ─── Article Header ─── */}
      <section className="relative -mt-20 z-10">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto">
              <Link
                href="/blog"
                className="inline-flex items-center text-brand-grey hover:text-brand-red mb-6 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
              </Link>
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
            <div className="hidden xl:block w-16 shrink-0">
              <ShareSidebar title={article.title} slug={article.slug} />
            </div>
            <div className="flex-grow max-w-3xl">
              <AnimatedSection>
                <div className="prose prose-lg max-w-none">
                  {children}
                </div>

                {/* Mobile share row */}
                <div className="xl:hidden mt-10 flex items-center space-x-3 border-t border-gray-100 pt-6">
                  <Share2 className="w-5 h-5 text-brand-grey" />
                  <span className="text-brand-grey text-sm font-medium">Share this article:</span>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent('/blog/' + article.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-brand-offwhite rounded-full flex items-center justify-center text-brand-grey hover:bg-brand-red hover:text-white transition-all"
                    aria-label="Share on Twitter"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('/blog/' + article.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-brand-offwhite rounded-full flex items-center justify-center text-brand-grey hover:bg-brand-red hover:text-white transition-all"
                    aria-label="Share on LinkedIn"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(article.title + ' /blog/' + article.slug)}`}
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
                  <h3 className="text-2xl font-bold text-white mb-3">Ready to Get Started?</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
                    Learn how our SEBI-registered Category II AIF can help you access
                    institutional-grade alternative investments starting at ₹1 Crore.
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
                <Link href={`/blog/${ra.slug}`} className="card block group h-full hover:-translate-y-1">
                  <PlaceholderImage
                    theme={ra.category.toLowerCase().includes('real estate') ? 'real-estate' : ra.category.toLowerCase().includes('startup') ? 'startup' : 'education'}
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
