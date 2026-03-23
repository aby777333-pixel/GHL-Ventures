import { BLOG_POSTS, FUND_ARTICLES, BRAND } from '@/lib/constants'
import { notFound } from 'next/navigation'
import FundArticleClient from '@/app/fund/[slug]/FundArticleClient'
import RichBlogArticle from '@/components/RichBlogArticle'
import Blog1CategoryIIAIF from '@/components/blog/Blog1CategoryIIAIF'
import Blog2StressedRealEstate from '@/components/blog/Blog2StressedRealEstate'
import Blog3EarlyStageGrowth from '@/components/blog/Blog3EarlyStageGrowth'
import Blog4GovernanceTransparency from '@/components/blog/Blog4GovernanceTransparency'
import Blog5PillarGuide from '@/components/blog/Blog5PillarGuide'

const SITE_URL = 'https://ghlindiaventures.com'

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug)
  if (!post) return { title: 'Article Not Found' }

  // Enhanced SEO metadata for new blog posts
  const seoKeywords: Record<string, string> = {
    'category-ii-aif-preferred-choice-sophisticated-investors': 'Category II AIF, SEBI registered AIF, alternative investment fund India, HNI investment, sophisticated investors India',
    'stressed-real-estate-high-alpha-opportunities': 'stressed real estate India, distressed property fund, NCLT real estate, high alpha investment, real estate turnaround',
    'early-stage-growth-companies-india': 'venture capital India, early stage investing, startup investment India, growth equity fund, Series A investment',
    'governance-transparency-alternative-investment-funds': 'AIF governance, SEBI compliance, fund transparency, independent trustee, investor protection',
    'category-ii-aif-india-complete-guide': 'Category II AIF India, SEBI registered AIF, alternative investment fund India, distressed real estate fund India, venture capital fund India, HNI investment opportunities India, private equity fund India',
  }

  return {
    title: `${post.title} | GHL India Ventures Blog`,
    description: post.excerpt,
    keywords: seoKeywords[params.slug] || undefined,
    alternates: {
      canonical: `${SITE_URL}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: ['GHL India Ventures'],
      url: `${SITE_URL}/blog/${post.slug}`,
    },
  }
}

// ─── Rich Blog Component Map ───
const RICH_BLOG_COMPONENTS: Record<string, React.ComponentType> = {
  'category-ii-aif-preferred-choice-sophisticated-investors': Blog1CategoryIIAIF,
  'stressed-real-estate-high-alpha-opportunities': Blog2StressedRealEstate,
  'early-stage-growth-companies-india': Blog3EarlyStageGrowth,
  'governance-transparency-alternative-investment-funds': Blog4GovernanceTransparency,
  'category-ii-aif-india-complete-guide': Blog5PillarGuide,
}

// ─── Legacy Blog Content (plain paragraphs) ───
const BLOG_CONTENT: Record<string, string[]> = {
  'stressed-real-estate-nclt-hidden-value': [
    'The National Company Law Tribunal (NCLT) has quietly become one of the most powerful mechanisms for unlocking hidden value in India\'s stressed real estate sector. Since the implementation of the Insolvency and Bankruptcy Code (IBC) in 2016, over ₹3 lakh crore worth of stressed assets have entered resolution processes, with real estate comprising a significant portion of this pipeline.',
    'For investors who understand the mechanics of NCLT resolution, the opportunity is compelling. Stressed real estate projects — stalled constructions, developer insolvencies, and NPA-laden properties — can be acquired at 40-70% below their replacement cost. The discount reflects the distress of the seller, not the fundamental value of the asset. When resolution is executed properly, these deep discounts translate into outsized returns.',
    'The NCLT resolution process follows a structured timeline. Once a corporate insolvency resolution process (CIRP) is initiated, a resolution professional is appointed to manage the asset. Prospective resolution applicants submit their plans, which are evaluated based on feasibility, creditor recovery, and timeline. For real estate assets, the resolution plan typically involves completing construction, obtaining necessary approvals, and monetizing the finished inventory.',
    'What makes NCLT acquisitions particularly attractive is the legal clean-slate mechanism. Section 31 of the IBC provides that once a resolution plan is approved by the NCLT, the corporate debtor starts with a clean slate — free from prior encumbrances, litigations, and claims not part of the resolution plan. This legal certainty is invaluable in Indian real estate, where title disputes and legacy litigations often plague properties.',
    'Chennai\'s real estate market offers especially rich pickings for NCLT-based investing. The city has over 50 stressed residential projects in various stages of resolution, many in premium micro-markets like T. Nagar, Anna Nagar, Egmore, and the OMR corridor. Strong underlying demand from IT professionals and end-users means that completed inventory sells quickly, accelerating the return on investment.',
    'GHL India Ventures\' stressed real estate strategy is built around this NCLT opportunity. Our team brings deep expertise in navigating the tribunal process, conducting legal and financial due diligence on distressed assets, and executing post-acquisition resolution strategies. For our AIF investors, this translates into asset-backed investments acquired at institutional discounts, with a clear pathway to value realization.',
    'Risk management in NCLT investing requires specialized capabilities: thorough legal due diligence to assess title clarity and existing encumbrances, construction cost estimation to determine the total capital required for completion, market analysis to validate absorption and pricing assumptions, and regulatory navigation to ensure RERA compliance. GHL India Ventures\' multi-disciplinary team covers all these dimensions, providing institutional-grade risk management for our Category II AIF investors.',
  ],
  'startup-investing-beyond-the-hype': [
    'The Indian startup ecosystem has generated enormous excitement — and equally enormous hype. With over 100 unicorns and a vibrant funding landscape, it\'s tempting for investors to chase the latest trends: crypto, AI, quick commerce, or whatever sector is commanding headlines and elevated valuations. At GHL India Ventures, we believe that disciplined, conviction-based investing in fundamentally sound startups consistently outperforms trend-chasing.',
    'The first principle of disciplined startup investing is founder quality over sector heat. The best startups are built by exceptional founders who deeply understand their domain, have the resilience to navigate inevitable setbacks, and possess the strategic clarity to build sustainable businesses. Our investment committee weighs founder assessment at 60% of our overall decision framework — higher than any other single factor.',
    'Unit economics matter from day one. In the euphoric funding environment of 2021-22, many startups pursued growth at all costs, subsidizing customers and burning cash to capture market share. The subsequent funding winter of 2023-24 brutally exposed this approach, with numerous high-profile failures. GHL India Ventures invests only in startups that demonstrate positive unit economics or have a credible, near-term path to achieving them.',
    'Valuation discipline is the cornerstone of generating returns. When you invest at inflated valuations driven by FOMO, even a successful company may not generate adequate returns for investors. Our framework targets entry valuations that provide a 3-5x return at realistic exit scenarios — not the optimistic projections that characterize much of the venture ecosystem.',
    'Portfolio construction in startup investing follows a power-law distribution. Across a portfolio of 10-15 investments, typically 1-2 companies will generate the majority of returns, 3-4 will return capital, and the remainder may write down. Understanding and accepting this distribution is essential — the goal is to ensure that the winners are large enough to more than compensate for the inevitable losses.',
    'Our deal sourcing advantage comes from deep engagement with India\'s startup ecosystem, particularly in the South Indian corridor spanning Chennai, Bangalore, and Hyderabad. We evaluate over 200 startups annually, invest in 3-5, and provide active post-investment support through board participation, strategic mentorship, and network access. This hands-on approach has been shown to improve startup outcomes and protect investor capital.',
    'For HNI investors seeking exposure to India\'s innovation economy, investing through a SEBI-registered Category II AIF like GHL India Ventures provides institutional-grade due diligence, professional portfolio management, and regulatory oversight — the essential safeguards that differentiate disciplined startup investing from speculative angel betting.',
  ],
  'aif-vs-pms-which-is-right-for-hnis': [
    'High-net-worth individuals (HNIs) in India looking beyond traditional mutual funds often face a choice between two professional investment vehicles: Alternative Investment Funds (AIFs) and Portfolio Management Services (PMS). While both cater to sophisticated investors, they differ fundamentally in structure, investment universe, taxation, and suitability. Understanding these differences is crucial for making an informed allocation decision.',
    'Structure and Regulation: AIFs are pooled investment vehicles registered under SEBI (Alternative Investment Funds) Regulations, 2012. They pool capital from multiple investors to invest in a defined strategy. PMS, regulated under SEBI (Portfolio Managers) Regulations, 2020, provides individualized portfolio management where each investor owns a separate demat account with securities held in their name.',
    'Investment Universe: This is the most significant differentiator. PMS primarily invests in listed equity and debt securities — essentially the same universe as mutual funds, but with concentrated portfolios and flexible mandates. AIFs, particularly Category II, can invest in unlisted securities, stressed real estate, pre-IPO equity, venture capital, and other alternative asset classes that are simply inaccessible through PMS or mutual funds.',
    'Minimum Investment: SEBI mandates minimum thresholds for AIFs and PMS that reflect the institutional nature of these investments and the longer lock-in periods involved. GHL India Ventures also offers the SEBI Co-Invest Framework, making alternative investment exposure accessible to a broader investor base. Contact us for current investment details.',
    'Taxation: PMS investments are taxed as if the investor held the securities directly — standard capital gains tax applies. Category II AIFs enjoy pass-through status, meaning income is attributed to investors without fund-level taxation. For unlisted securities held over 24 months, this can result in more favorable long-term capital gains treatment.',
    'Liquidity: PMS portfolios can typically be liquidated within a few trading days (subject to market conditions). AIF investments are illiquid by design, with lock-in periods ranging from 3-10 years. This illiquidity premium is precisely what enables AIFs to invest in stressed assets and early-stage companies at attractive valuations that liquid markets cannot access.',
    'The Right Choice: For HNIs seeking exposure to listed equity with professional management and flexibility, PMS is the appropriate choice. For sophisticated investors wanting genuine portfolio diversification through alternative asset classes — stressed real estate, startup equity, unlisted investments — a Category II AIF like GHL India Ventures provides access to an entirely different return stream that complements, rather than replicates, existing listed market exposure.',
  ],
  'afraid-of-losing-your-job-invest-for-security': [
    'The headlines are hard to ignore. Mass layoffs at technology giants. AI replacing entire departments. Startups shutting down overnight. Multinational corporations restructuring their India operations. For millions of salaried professionals across India — from IT engineers in Bangalore to banking executives in Mumbai to manufacturing managers in Chennai — the fear of losing their job has never been more real or more urgent.',
    'But here\'s what most people get wrong about financial security: it\'s not about earning more from your job. It\'s about building income streams that don\'t depend on your job at all. A salary, no matter how large, is a single point of failure. When that paycheck stops — whether through layoffs, health issues, or industry disruption — families who relied entirely on employment income find themselves in crisis.',
    'This is exactly why India\'s smartest salaried professionals are looking at alternative investments as a financial safety net. Not the volatile stock market or speculative crypto, but structured investment options that provide steady, predictable returns — the kind that can supplement your salary today and replace it if needed tomorrow.',
    'At GHL India Ventures, we created the SEBI Co-Invest Framework specifically for salaried professionals and their families. With accessible entry points designed for working families, the Co-Invest Framework provides access to a structured returns framework backed by real assets and institutional-grade management. Contact us for current investment details.',
    'Consider a practical scenario: A software engineer invests through GHL\'s SEBI Co-Invest Framework. The structured returns from this investment create an alternative income stream — money that flows in regardless of whether the engineer keeps their job, gets laid off, or chooses to take a career break. For a family with EMIs, school fees, and household expenses, this secondary income stream isn\'t a luxury — it\'s survival insurance.',
    'The beauty of the SEBI Co-Invest Framework is its accessibility. You don\'t need to be a crorepati to invest. You don\'t need to understand complex financial jargon. And you don\'t need to actively manage anything. GHL India Ventures\' professional fund management team handles the investment decisions, portfolio monitoring, and reporting — you simply invest and receive structured returns.',
    'What makes this particularly compelling in 2025 is the underlying investment strategy. Your capital is deployed into real, tangible assets — stressed real estate projects being resolved at deep discounts, and high-growth startups building the future of India\'s economy. These aren\'t paper assets that swing wildly with market sentiment. They\'re backed by real properties, real companies, and real value creation.',
    'The psychological benefit is equally important. When you know that your family has an alternative income stream — one that doesn\'t depend on your employer\'s quarterly results or your industry\'s disruption cycle — you make better career decisions. You negotiate from strength, not desperation. You can afford to upskill, transition, or even take entrepreneurial risks, because your family\'s basic financial security isn\'t solely tied to your next paycheck.',
    'Don\'t wait for the pink slip to start planning. The time to build your financial safety net is now — while you still have a salary to invest from. GHL India Ventures\' SEBI Co-Invest Framework offers salaried professionals across India the opportunity to secure their family\'s future. Contact us for investment details. Because in today\'s uncertain job market, the smartest investment you can make is in your own financial independence.',
  ],
  'sebi-co-invest-framework-professionals-guide': [
    'For decades, salaried professionals in India have followed a predictable investment playbook: fixed deposits for safety, mutual funds for growth, and perhaps some real estate for long-term wealth. But in an era of declining FD rates, volatile equity markets, and unaffordable property prices, a growing number of informed families are discovering a powerful alternative: structured co-invest opportunities through SEBI-regulated vehicles.',
    'Co-invest opportunities, at their core, represent a structured arrangement where your capital is deployed into carefully selected ventures, and you receive returns based on a pre-defined framework. Unlike equity investments where returns depend entirely on market sentiment, structured co-invest instruments provide a more predictable return profile — making them ideal for families who need reliability over speculation.',
    'The traditional comparison point for structured co-invest instruments is the humble Fixed Deposit. While FDs offer safety, their returns barely keep pace with inflation. A 7% FD return against 5-6% inflation means your real wealth grows at just 1-2% per year. Structured co-invest opportunities through a professional fund like GHL India Ventures target meaningfully higher returns while maintaining a focus on capital preservation through asset-backed security.',
    'GHL India Ventures\' SEBI Co-Invest Framework has been specifically designed for salaried professionals and their families. With accessible entry points, it reaches a much broader demographic than traditional AIF investments. This democratization of alternative investment access is a deliberate strategy — we believe that the benefits of professional fund management and alternative asset exposure should not be reserved exclusively for ultra-HNIs. Contact us for current investment details.',
    'How does the capital get deployed? Your co-invest capital supports GHL India Ventures\' dual investment strategy: resolving stressed real estate projects at deep discounts and backing promising early-stage startups across India. The fund\'s professional management team conducts thorough due diligence, manages the investments actively, and structures exits to optimize returns for all investors.',
    'For salaried families, the key advantages are clear. First, steady alternative income: unlike equity where dividends are uncertain and capital gains are unpredictable, the co-invest framework provides a structured returns path. Second, professional management: you don\'t need to become an investment expert or spend hours monitoring markets. Third, asset backing: your investment is supported by real assets under institutional management, not abstract financial instruments.',
    'The ideal use case is compelling: a dual-income family deploys capital into GHL\'s SEBI Co-Invest Framework while maintaining liquidity in their existing FDs and mutual funds. The co-invest allocation creates a diversified income stream, reduces overall portfolio risk through genuine asset class diversification, and provides exposure to alternative investments that were previously available only to ultra-HNI investors.',
    'Risk considerations are important and should be honestly addressed. Co-invest instruments through a SEBI-regulated framework carry different risks than bank FDs — they are not insured by DICGC, they have a lock-in period, and returns are not guaranteed. However, the SEBI regulatory framework, professional fund management, asset-backed security, and transparent reporting provide robust risk mitigation that makes this a thoughtful addition to a salaried professional\'s portfolio.',
    'As India\'s financial landscape evolves and traditional investment options deliver diminishing returns, structured co-invest opportunities through regulated vehicles like GHL India Ventures represent a new frontier for salaried professionals. With accessible entry points, professional management and a structured returns framework, this is a compelling option for families seeking financial security beyond the conventional. Contact us for current investment details.',
  ],
  'india-aif-landscape-2025-growth-trends': [
    'India\'s Alternative Investment Fund industry has undergone a remarkable transformation. From a niche segment managing just a few thousand crores a decade ago, the AIF ecosystem now manages over ₹10 lakh crore in commitments — making it one of the fastest-growing segments of India\'s financial landscape. For investors paying attention, the signals are clear: alternative investments are no longer alternative. They are becoming mainstream.',
    'Several structural forces are driving this explosive growth. First, regulatory maturity. SEBI\'s progressive approach to AIF regulation has created a transparent, investor-friendly framework that institutional and retail investors alike can trust. The Category II AIF structure, in particular, has emerged as the preferred vehicle for private equity, real estate, and multi-strategy funds seeking a regulated yet flexible operating environment.',
    'Second, the democratization of access. Historically, alternative investments were the exclusive domain of ultra-HNIs and institutional investors. Today, innovations like the SEBI Co-Invest Framework and feeder fund structures are bringing alternative asset exposure to a broader investor base — including salaried professionals, NRIs, and family offices with more modest allocations.',
    'Third, the performance gap. With traditional fixed-income instruments delivering negative real returns after inflation, and equity markets becoming increasingly volatile, investors are actively seeking return streams that are uncorrelated with listed markets. Category II AIFs — investing in stressed real estate, venture capital, pre-IPO opportunities, and special situations — offer precisely this diversification benefit.',
    'The stressed real estate opportunity deserves special attention. India\'s Insolvency and Bankruptcy Code (IBC) has unlocked a massive pipeline of distressed properties available at 40-60% discounts to replacement cost. Funds like GHL India Ventures that specialise in NCLT resolution processes are accessing value that simply did not exist before 2016. As the IBC ecosystem matures and resolution timelines compress, this strategy is becoming even more attractive.',
    'For investors considering their first AIF allocation, the key is to look beyond headline returns and evaluate the fund manager\'s track record, investment process, governance standards, and alignment of interest. SEBI registration is a necessary but not sufficient condition — what matters is the quality of the team, the rigour of due diligence, and the transparency of reporting.',
    'As we look ahead, the Indian AIF landscape is poised for continued rapid growth. Regulatory tailwinds, expanding investor awareness, and a rich pipeline of investable opportunities across stressed assets and startups make this a compelling time to explore alternative investments. The investors who position themselves early in this structural shift stand to benefit the most.',
  ],
  'sebi-aif-regulations-2026-what-changed': [
    'The Securities and Exchange Board of India (SEBI) introduced significant regulatory updates for Alternative Investment Funds in 2026, marking one of the most comprehensive overhauls since the original AIF Regulations of 2012. These changes affect fund managers, investors, and the broader ecosystem in meaningful ways — and understanding them is essential for anyone involved in India\'s alternative investment space.',
    'The most impactful change is the enhanced valuation framework. SEBI now requires Category II AIFs to obtain independent valuations from SEBI-registered valuers at least semi-annually, with standardised methodologies for illiquid assets like stressed real estate and unlisted equity. This addresses a long-standing concern about NAV accuracy and gives investors greater confidence in reported performance.',
    'Disclosure requirements have been substantially upgraded. Fund managers must now provide quarterly portfolio reports with detailed asset-level information, including individual investment valuations, key risk metrics, and progress updates on active deals. For investors, this means unprecedented transparency into how their capital is being deployed and managed.',
    'The new regulations also introduce stricter compliance standards for fund governance. AIFs must now maintain independent compliance officers, conduct annual internal audits, and submit detailed compliance certificates to SEBI. Conflict of interest policies have been strengthened, with mandatory disclosure of related-party transactions and co-investment arrangements.',
    'One of the more nuanced changes affects the SEBI Co-Invest Framework. SEBI has clarified the regulatory treatment of co-invest structures, providing greater certainty for both fund managers and investors. The new guidelines specify disclosure requirements, fee structures, and investor protection measures specific to co-invest arrangements — a positive development for funds like GHL India Ventures that offer co-invest opportunities alongside their main fund.',
    'For existing AIF investors, the practical impact is largely positive. Better valuations, more detailed reporting, and stronger governance translate to greater protection and more informed decision-making. For fund managers, the compliance burden has increased, but well-managed funds that already maintain high governance standards will find the transition relatively straightforward.',
    'SEBI\'s 2026 regulatory updates reflect the maturing of India\'s AIF ecosystem. As the industry grows in size and complexity, proportionate regulation ensures that investor interests remain protected while the sector continues to innovate. For sophisticated investors evaluating AIF opportunities, these regulatory enhancements should provide additional comfort that India\'s alternative investment framework meets global standards of transparency and governance.',
  ],
  'ai-disruption-alternative-investments-2026': [
    'Artificial intelligence is no longer a future promise in the world of alternative investments — it is a present reality reshaping every stage of the investment lifecycle. From deal sourcing and due diligence to portfolio monitoring and exit planning, AI-powered tools are giving fund managers capabilities that were unimaginable just five years ago. For investors in Category II AIFs, understanding this transformation is essential.',
    'Deal sourcing has been revolutionised by AI-driven data analytics. Machine learning algorithms can now scan thousands of potential investment opportunities across India — from stressed real estate projects listed on NCLT platforms to early-stage startups filing for incorporation — and identify patterns that match a fund\'s specific investment thesis. What previously required weeks of manual research can now be accomplished in hours, with greater accuracy and coverage.',
    'Due diligence is another area where AI is making a profound impact. Natural language processing (NLP) models can analyse years of legal documents, court filings, financial statements, and regulatory submissions in minutes, flagging inconsistencies, risks, and hidden value that human analysts might miss. For stressed real estate investments, AI can assess property-level data, local market dynamics, and resolution probability with remarkable precision.',
    'Portfolio monitoring has evolved from periodic reporting to real-time intelligence. AI-powered dashboards now track construction progress at real estate sites using satellite imagery, monitor startup KPIs from integrated data feeds, and detect early warning signals that might indicate portfolio companies are underperforming. This enables fund managers to intervene early and protect investor value.',
    'Risk management is being transformed by predictive analytics. Machine learning models can stress-test portfolio performance across hundreds of macroeconomic scenarios — interest rate changes, regulatory shifts, market downturns — and quantify potential impacts on individual investments and the overall fund. This gives both fund managers and investors a much clearer picture of downside risks.',
    'For GHL India Ventures, these AI capabilities complement our investment team\'s deep domain expertise rather than replacing it. Technology enhances the speed and breadth of our analysis, but investment decisions remain fundamentally human — guided by experience, judgment, and a thorough understanding of India\'s unique market dynamics. The combination of AI-powered analytics and seasoned investment professionals creates a powerful competitive advantage.',
    'As AI capabilities continue to advance, the gap between AI-enabled fund managers and traditional operators will only widen. For investors selecting an AIF, the fund manager\'s technological sophistication is becoming an increasingly important evaluation criterion — alongside track record, governance, and investment strategy. The future of alternative investing in India belongs to those who can harness technology while maintaining the discipline and integrity that sophisticated investors demand.',
  ],
}

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug)
  if (!post) notFound()

  // Check if this is a rich blog post
  const RichComponent = RICH_BLOG_COMPONENTS[params.slug]

  if (RichComponent) {
    // Get related articles
    const blogArticles = BLOG_POSTS.filter((p) => p.slug !== params.slug).map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      date: p.date,
      category: p.category,
      readTime: p.readTime,
    }))
    const relatedArticles = blogArticles.slice(0, 3)

    // Enhanced Article Schema for rich blogs
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      dateModified: post.date,
      author: {
        '@type': 'Organization',
        name: 'GHL India Ventures',
        url: SITE_URL,
      },
      publisher: {
        '@type': 'Organization',
        name: 'GHL India Ventures',
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/icon.svg`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/blog/${post.slug}`,
      },
      articleSection: post.category,
      url: `${SITE_URL}/blog/${post.slug}`,
    }

    // Organization Schema (FinancialService)
    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'FinancialService',
      name: 'GHL India Ventures',
      description: 'SEBI Registered Category II Alternative Investment Fund in India specializing in stressed real estate and venture capital investments.',
      url: SITE_URL,
      areaServed: 'India',
      serviceType: 'Alternative Investment Fund',
      identifier: {
        '@type': 'PropertyValue',
        name: 'SEBI Registration',
        value: BRAND.sebi,
      },
    }

    // FAQ Schema for pillar page
    const faqSchema = params.slug === 'category-ii-aif-india-complete-guide' ? {
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
    } : undefined

    const schemas = [articleSchema, orgSchema, ...(faqSchema ? [faqSchema] : [])]

    return (
      <RichBlogArticle
        article={{
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          date: post.date,
          category: post.category,
          readTime: post.readTime,
        }}
        relatedArticles={relatedArticles}
        sebiReg={BRAND.sebi}
        schemas={schemas}
      >
        <RichComponent />
      </RichBlogArticle>
    )
  }

  // Legacy: simple paragraph-based blogs
  const content = BLOG_CONTENT[params.slug] || [
    `This article explores important aspects of alternative investing that every sophisticated investor should understand. At GHL India Ventures, we believe that informed investors make better decisions, which is why we produce educational content spanning investment strategies, market analysis, and personal finance.`,
  ]

  // Get 3 related blog articles (excluding current)
  const blogArticles = BLOG_POSTS.filter((p) => p.slug !== params.slug).map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    date: p.date,
    category: p.category,
    readTime: p.readTime,
  }))
  const relatedArticles = blogArticles.slice(0, 3)

  // Article/BlogPosting structured data for Google rich results
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Organization',
      name: 'GHL India Ventures',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'GHL India Ventures',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
    articleSection: post.category,
    wordCount: content.join(' ').split(/\s+/).length,
    url: `${SITE_URL}/blog/${post.slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <FundArticleClient
        article={{
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          date: post.date,
          category: post.category,
          readTime: post.readTime,
        }}
        content={content}
        relatedArticles={relatedArticles}
        sebiReg={BRAND.sebi}
        basePath="/blog"
      />
    </>
  )
}
