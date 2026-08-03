/* ─────────────────────────────────────────────────────────────
   Blog article route — CMS-backed.

   Routing rules, in order:
     1. Post found in the CMS with a `legacy_component` → render the
        original bespoke React component inside RichBlogArticle, with
        title/SEO/category taken from the CMS. The pillar pages keep
        their exact layout; only their metadata became editable.
     2. Post found in the CMS → render ArticleView (html / markdown /
        paragraphs). `paragraphs` reproduces the legacy markup.
     3. Not found at build time → DynamicBlogViewer looks it up in the
        browser, so a post published after the last deploy still opens.

   The legacy BLOG_POSTS / BLOG_CONTENT constants are retained purely
   as an offline fallback — the CMS is the source of truth.
   ───────────────────────────────────────────────────────────── */

import { BLOG_POSTS, BRAND } from '@/lib/constants'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import RichBlogArticle from '@/components/RichBlogArticle'
import ArticleView from './ArticleView'
import Blog1CategoryIIAIF from '@/components/blog/Blog1CategoryIIAIF'
import Blog2StressedRealEstate from '@/components/blog/Blog2StressedRealEstate'
import Blog3EarlyStageGrowth from '@/components/blog/Blog3EarlyStageGrowth'
import Blog4GovernanceTransparency from '@/components/blog/Blog4GovernanceTransparency'
import Blog5PillarGuide from '@/components/blog/Blog5PillarGuide'
import { getAllPublishedSlugs, getPostBySlug, type CmsPost } from '@/lib/blog/cmsService'

const DynamicBlogViewer = dynamic(() => import('./DynamicBlogViewer'), { ssr: false })

const SITE_URL = 'https://ghlindiaventures.com'

// ─── Bespoke article components, keyed by blog_posts.legacy_component ───
const RICH_BLOG_COMPONENTS: Record<string, React.ComponentType> = {
  Blog1CategoryIIAIF,
  Blog2StressedRealEstate,
  Blog3EarlyStageGrowth,
  Blog4GovernanceTransparency,
  Blog5PillarGuide,
}

/** Slugs that were hardcoded before the CMS existed. Kept in the
 *  static-params union so a CMS outage during a build can never drop
 *  an already-indexed URL from the exported site. */
const LEGACY_SLUGS = [
  'why-stressed-real-estate-is-india-s-best-kept-investment-secret',
  'understanding-category-ii-aifs-a-complete-guide-for-indian-investors',
  'tax-benefits-aif-investing',
  'rise-of-debenture-investments',
  'evaluate-real-estate-fund-metrics',
  'india-startup-ecosystem-2025',
  '5-tax-benefits-of-investing-in-alternative-investment-funds',
  'the-rise-of-debenture-investments-fixed-returns-in-uncertain-markets',
  'how-to-evaluate-a-real-estate-fund-key-metrics-every-investor-should-know',
  'india-s-startup-ecosystem-2025-where-smart-money-is-flowing',
]

export async function generateStaticParams() {
  const cmsSlugs = await getAllPublishedSlugs()
  const all = new Set<string>([
    ...BLOG_POSTS.map((p) => p.slug),
    ...LEGACY_SLUGS,
    ...cmsSlugs,
  ])
  return Array.from(all).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  const legacy = BLOG_POSTS.find((p) => p.slug === params.slug)

  const title = post?.meta_title || post?.title || legacy?.title
  const description = post?.meta_description || post?.excerpt || legacy?.excerpt
  if (!title) return { title: 'Article Not Found' }

  const canonical = post?.canonical_url?.trim() || `${SITE_URL}/blog/${params.slug}`
  const image = post?.og_image || post?.cover_image || `${SITE_URL}/og-image.jpg`

  return {
    title: post?.meta_title || `${title} | GHL India Ventures Blog`,
    description,
    keywords: post?.meta_keywords || undefined,
    ...(post?.noindex ? { robots: { index: false, follow: false } } : {}),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post?.published_at || legacy?.date,
      modifiedTime: post?.updated_at || undefined,
      authors: [post?.blog_authors?.name || post?.author || 'GHL India Ventures'],
      url: canonical,
      siteName: 'GHL India Ventures',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

// ─── Structured data ───────────────────────────────────────
function buildSchemas(post: CmsPost, canonical: string) {
  const authorName = post.blog_authors?.name || post.author || 'GHL India Ventures'
  const wordCount = String(post.content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length

  const article = {
    '@context': 'https://schema.org',
    '@type': post.content_format === 'component' ? 'Article' : 'BlogPosting',
    headline: post.title,
    description: post.meta_description || post.excerpt || undefined,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    ...(post.cover_image ? { image: [post.cover_image] } : {}),
    author: post.blog_authors
      ? {
          '@type': 'Person',
          name: authorName,
          ...(post.blog_authors.slug ? { url: `${SITE_URL}/blog/author/${post.blog_authors.slug}` } : {}),
        }
      : { '@type': 'Organization', name: authorName, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'GHL India Ventures',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    articleSection: post.blog_categories?.name || post.category || undefined,
    ...(wordCount ? { wordCount } : {}),
    ...(post.tags?.length ? { keywords: post.tags.join(', ') } : {}),
    url: canonical,
  }

  const org = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: 'GHL India Ventures',
    description:
      'SEBI Registered Category II Alternative Investment Fund in India specializing in stressed real estate and venture capital investments.',
    url: SITE_URL,
    areaServed: 'India',
    serviceType: 'Alternative Investment Fund',
    identifier: { '@type': 'PropertyValue', name: 'SEBI Registration', value: BRAND.sebi },
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      ...(post.blog_categories
        ? [{
            '@type': 'ListItem', position: 3,
            name: post.blog_categories.name,
            item: `${SITE_URL}/blog/category/${post.blog_categories.slug}`,
          }]
        : []),
      { '@type': 'ListItem', position: post.blog_categories ? 4 : 3, name: post.title, item: canonical },
    ],
  }

  return [article, org, breadcrumb]
}

// FAQ block for the pillar guide — preserved from the pre-CMS page.
const PILLAR_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Category II AIF in India?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A Category II AIF (Alternative Investment Fund) is a privately pooled investment vehicle regulated under SEBI (Alternative Investment Funds) Regulations, 2012. It invests in private equity, stressed real estate, venture capital, and special situations, targeting 18–30% IRR for sophisticated investors.',
      },
    },
    {
      '@type': 'Question',
      name: 'Who can invest in a Category II AIF?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Category II AIFs are designed for High Net-Worth Individuals (HNIs), Ultra HNIs, family offices, institutional investors, and corporate treasuries. The minimum investment is as per SEBI AIF regulations.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the minimum investment in Category II AIF India?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The minimum investment required for a Category II AIF in India is as per SEBI regulations. Contact our team for current details.',
      },
    },
    {
      '@type': 'Question',
      name: 'What returns do Category II AIFs generate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Well-managed Category II AIFs typically target 18–30% IRR depending on the strategy. Stressed real estate strategies target 18–25% IRR, while venture capital strategies target 22–30% IRR.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Category II AIF regulated by SEBI?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, all Category II AIFs must be registered with SEBI and operate under the SEBI (Alternative Investment Funds) Regulations, 2012.',
      },
    },
  ],
}

export default async function BlogArticlePage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)

  // ── 3. unknown at build time → resolve in the browser ──
  if (!post) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-brand-black flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <DynamicBlogViewer slug={params.slug} />
      </Suspense>
    )
  }

  const canonical = post.canonical_url?.trim() || `${SITE_URL}/blog/${post.slug}`
  const schemas = buildSchemas(post, canonical)
  if (post.slug === 'category-ii-aif-india-complete-guide') schemas.push(PILLAR_FAQ as any)

  // ── 1. bespoke component article ──────────────────────
  const RichComponent = post.legacy_component ? RICH_BLOG_COMPONENTS[post.legacy_component] : undefined

  if (RichComponent) {
    const relatedArticles = BLOG_POSTS
      .filter((p) => p.slug !== post.slug)
      .slice(0, 3)
      .map((p) => ({
        slug: p.slug, title: p.title, excerpt: p.excerpt,
        date: p.date, category: p.category, readTime: p.readTime,
      }))

    return (
      <RichBlogArticle
        article={{
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt || '',
          date: post.published_at || post.created_at,
          category: post.blog_categories?.name || post.category || '',
          readTime: `${post.read_time || 8} min read`,
        }}
        relatedArticles={relatedArticles}
        sebiReg={BRAND.sebi}
        schemas={schemas}
      >
        <RichComponent />
      </RichBlogArticle>
    )
  }

  // ── 2. CMS-authored article ───────────────────────────
  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
      <ArticleView post={post} />
    </>
  )
}
