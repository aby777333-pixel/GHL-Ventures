// ============================================================
// GHL India Ventures - Site Constants
// ============================================================

export const BRAND = {
  name: 'GHL India Ventures',
  fullName: 'GHL India Ventures Trust',
  tagline: 'Creating Wealth. Building Trust. Inspiring Growth.',
  description:
    'A SEBI-registered Category II Alternative Investment Fund specialising in stressed real estate assets and early-stage startup investments, designed exclusively for High Net-Worth Individuals seeking superior risk-adjusted returns.',
  sebi: 'IN/AIF2/2425/1517',
  phone1: '+91 44 2843 1043',
  phone2: '+91 7200 255 252',
  mobile: '+91 7200255252',
  email: 'info@ghlindiaventures.com',
  whatsapp: '+917200255252',
  whatsappMessage:
    'Hi GHL India Ventures team, I\'d like to learn more about your AIF fund.',
  address:
    '2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai, Tamil Nadu \u2013 600 008, India',
  officeHours: 'Mon\u2013Fri, 9:30 AM \u2013 6:30 PM IST',
  minInvestment: 'As per SEBI AIF Regulations',
  colors: {
    red: '#D0021B',
    black: '#0A0A0A',
    white: '#FFFFFF',
    offwhite: '#F8F7F5',
    grey: '#6B7280',
    darkgrey: '#1A1A1A',
  },
} as const

// ============================================================
// Navigation
// ============================================================

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  {
    label: 'About',
    href: '#',
    children: [
      { label: 'Why GHL?', href: '/about' },
      { label: 'Tools', href: '/tools' },
      { label: 'Downloads', href: '/downloads' },
    ],
  },
  { label: 'Why AIFs', href: '/why-aifs' },
  {
    label: 'Fund',
    href: '#',
    children: [
      { label: 'Fund Overview', href: '/fund' },
      { label: 'Direct AIF Route', href: '/fund/direct-aif' },
      { label: 'SEBI Co-Invest Framework', href: '/fund/debenture-route' },
      { label: 'NRI Invest', href: '/fund/nri-invest' },
    ],
  },
  { label: 'Blog', href: '/blog' },
  { label: 'Financial IQ', href: '/financial-iq' },
  { label: 'Portfolio', href: '/portfolio' },
  {
    label: 'Education',
    href: '#',
    children: [
      { label: 'Insights', href: '/education/insights' },
    ],
  },
  {
    label: 'Contact',
    href: '#',
    children: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'FAQs', href: '/contact/faqs' },
      { label: 'Refer an Investor', href: '/contact/refer' },
      { label: 'Startup Application', href: '/contact/startup-apply' },
      { label: 'Grievance Redressal', href: '/contact/grievance' },
      { label: 'Careers', href: '/contact/careers' },
    ],
  },
] as const

export const SOCIAL_LINKS = [
  { label: 'LinkedIn', href: 'https://linkedin.com/company/ghl-india-ventures', icon: 'linkedin' },
  { label: 'Twitter', href: 'https://twitter.com/ghlindia', icon: 'twitter' },
  { label: 'Instagram', href: 'https://instagram.com/ghlindia', icon: 'instagram' },
  { label: 'YouTube', href: 'https://youtube.com/@ghlindia', icon: 'youtube' },
  { label: 'Facebook', href: 'https://facebook.com/ghlindia', icon: 'facebook' },
  { label: 'Telegram', href: 'https://t.me/ghlindia', icon: 'telegram' },
  { label: 'Google Business', href: 'https://g.page/ghl-india-ventures', icon: 'google' },
] as const

// ============================================================
// Fund Stats
// ============================================================

export const FUND_STATS = [
  { label: 'AUM Target', value: '\u20B9500 Cr', suffix: '+' },
  { label: 'Portfolio Companies', value: '12', suffix: '+' },
  { label: 'Years Experience', value: '25', suffix: '+' },
  { label: 'SEBI Registered', value: 'Cat II', suffix: ' AIF' },
] as const

// ============================================================
// Fund Article Categories
// ============================================================

export const FUND_CATEGORIES = [
  'Investor Education',
  'Real Estate',
  'Startups',
  'Market Analysis',
  'Fund News',
  'Tax & Compliance',
  'Risk Management',
] as const

// ============================================================
// Fund Articles (10 articles)
// ============================================================

export const FUND_ARTICLES = [
  {
    slug: 'understanding-category-ii-aifs-complete-guide',
    title: 'Understanding Category II AIFs: A Complete Guide for HNI Investors',
    excerpt:
      'Everything high-net-worth investors need to know about Category II Alternative Investment Funds, from structure and regulation to risk-return profiles.',
    date: '2025-01-20',
    category: 'Investor Education',
    readTime: '10 min read',
  },
  {
    slug: 'stressed-real-estate-india-opportunity',
    title: 'Stressed Real Estate in India: Opportunity Hidden in Distress',
    excerpt:
      'How savvy investors are unlocking deep value in India\'s stressed real estate market through NCLT resolutions, RERA compliance, and strategic repositioning.',
    date: '2025-01-12',
    category: 'Real Estate',
    readTime: '8 min read',
  },
  {
    slug: 'early-stage-startups-alternative-portfolio',
    title: 'Why Early-Stage Startups Belong in Your Alternative Investment Portfolio',
    excerpt:
      'The case for allocating a portion of your alternative portfolio to early-stage ventures and how to evaluate risk at the seed and pre-Series A stage.',
    date: '2025-01-05',
    category: 'Startups',
    readTime: '7 min read',
  },
  {
    slug: 'sebi-aif-framework-sophisticated-investor',
    title: 'SEBI\'s AIF Framework: What Every Sophisticated Investor Must Know',
    excerpt:
      'A detailed breakdown of SEBI\'s regulatory framework for Alternative Investment Funds, including registration, compliance, and reporting obligations.',
    date: '2024-12-22',
    category: 'Tax & Compliance',
    readTime: '9 min read',
  },
  {
    slug: 'portfolio-diversification-beyond-mutual-funds',
    title: 'Portfolio Diversification Beyond Mutual Funds: The AIF Advantage',
    excerpt:
      'Why traditional mutual fund diversification falls short and how Category II AIFs offer access to uncorrelated, institutional-grade asset classes.',
    date: '2024-12-15',
    category: 'Investor Education',
    readTime: '6 min read',
  },
  {
    slug: 'chennai-real-estate-data-driven-thesis-2025',
    title: 'Chennai\'s Real Estate Market: Data-Driven Investment Thesis 2025',
    excerpt:
      'Micro-market analysis of Chennai\'s residential and commercial corridors, with data on absorption rates, pricing trends, and stressed asset hotspots.',
    date: '2024-12-08',
    category: 'Real Estate',
    readTime: '8 min read',
  },
  {
    slug: 'due-diligence-startup-investments-ghl-framework',
    title: 'Due Diligence in Startup Investments: The GHL India Ventures Framework',
    excerpt:
      'Our proprietary 7-layer due diligence process for evaluating early-stage companies, covering team, market, product, unit economics, and governance.',
    date: '2024-11-28',
    category: 'Startups',
    readTime: '7 min read',
  },
  {
    slug: 'tax-efficiency-category-ii-aif-pass-through',
    title: 'Tax Efficiency in Category II AIFs: Pass-Through Status Explained',
    excerpt:
      'How pass-through taxation benefits investors in Category II AIFs and the practical implications for capital gains, dividends, and annual filings.',
    date: '2024-11-18',
    category: 'Tax & Compliance',
    readTime: '6 min read',
  },
  {
    slug: 'risk-adjusted-returns-alternative-investments',
    title: 'Risk-Adjusted Returns: How Alternative Investments Beat Traditional Assets',
    excerpt:
      'Comparing Sharpe ratios, drawdown profiles, and long-term CAGR of AIF strategies against equities, fixed deposits, and mutual fund benchmarks.',
    date: '2024-11-05',
    category: 'Risk Management',
    readTime: '8 min read',
  },
  {
    slug: 'building-long-term-wealth-10-year-aif-case',
    title: 'Building Long-Term Wealth: The 10-Year AIF Investment Case',
    excerpt:
      'Why a decade-long investment horizon is the sweet spot for AIF portfolios and how patient capital compounds across market cycles.',
    date: '2024-10-25',
    category: 'Investor Education',
    readTime: '5 min read',
  },
] as const

// ============================================================
// Team Members
// ============================================================

export const TEAM_MEMBERS = [
  {
    name: 'Gopal H. Lakshmi',
    initials: 'GL',
    role: 'Founder & Managing Director',
    bio: 'Over 25 years of experience in financial services, private equity, and strategic investments across India and Southeast Asia. Visionary behind GHL India Ventures\' dual-focus strategy on stressed real estate and early-stage startups.',
    image: '/team/founder.jpg', // placeholder
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Venkatesh Ramachandran',
    initials: 'VR',
    role: 'Chief Investment Officer',
    bio: 'Former VP at a leading investment bank with 18 years of expertise in deal structuring, portfolio construction, and risk management across alternative asset classes.',
    image: '/team/cio.jpg', // placeholder
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Meenakshi Sundaram',
    initials: 'MS',
    role: 'Head of Real Estate',
    bio: 'Specialist in stressed and distressed real estate with a track record of resolving NCLT assets. Previously led acquisitions at a top-5 Indian NBFC.',
    image: '/team/head-re.jpg', // placeholder
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Arvind Natarajan',
    initials: 'AN',
    role: 'Head of Startups',
    bio: 'Serial entrepreneur turned investor with deep roots in Chennai\'s startup ecosystem. Advisor to 20+ early-stage companies across fintech, healthtech, and SaaS.',
    image: '/team/head-startups.jpg', // placeholder
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Priya Venkatesh',
    initials: 'PV',
    role: 'Chief Financial Officer',
    bio: 'Chartered Accountant with 15 years in fund accounting, NAV computation, and investor reporting for Category II and III AIFs.',
    image: '/team/cfo.jpg', // placeholder
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Karthik Srinivasan',
    initials: 'KS',
    role: 'Head of Compliance',
    bio: 'Former SEBI examiner with extensive experience in AIF regulations, anti-money laundering frameworks, and investor protection compliance.',
    image: '/team/head-compliance.jpg', // placeholder
    linkedin: 'https://linkedin.com',
  },
] as const

// ============================================================
// Advisory Board
// ============================================================

export const ADVISORY_BOARD = [
  {
    name: 'Dr. Srinivasan Iyer',
    initials: 'SI',
    role: 'Advisory Board Member',
    bio: 'Retired IAS officer and former Secretary of Commerce. Brings policy insight and a deep understanding of India\'s regulatory environment across real estate and startup sectors.',
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Kavitha Raghavan',
    initials: 'KR',
    role: 'Advisory Board Member',
    bio: 'Veteran real estate developer and former Chairperson of CREDAI Tamil Nadu. Advisor on stressed asset identification and resolution strategies.',
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Suresh Balakrishnan',
    initials: 'SB',
    role: 'Advisory Board Member',
    bio: 'Serial entrepreneur and angel investor with exits in SaaS and fintech. Provides strategic counsel on the startup investment thesis and portfolio company mentorship.',
    linkedin: 'https://linkedin.com',
  },
] as const

// ============================================================
// Portfolio Companies (6 companies)
// ============================================================

export const PORTFOLIO_COMPANIES = [
  {
    name: 'Montieth Square Residences',
    sector: 'Stressed Real Estate',
    description:
      'Revitalisation of a stalled 120-unit residential project in Egmore, Chennai, acquired through NCLT resolution at a significant discount to replacement cost.',
    stage: 'Active',
    status: 'Active' as const,
    investmentYear: 2024,
    logo: '/portfolio/montieth-square.svg', // placeholder
  },
  {
    name: 'Nungambakkam Heights',
    sector: 'Stressed Real Estate',
    description:
      'Premium commercial redevelopment of a distressed Grade-A office tower in Nungambakkam, Chennai, targeting IT/ITES tenants.',
    stage: 'Active',
    status: 'Active' as const,
    investmentYear: 2024,
    logo: '/portfolio/nungambakkam-heights.svg', // placeholder
  },
  {
    name: 'Coimbatore Gateway',
    sector: 'Stressed Real Estate',
    description:
      'Mixed-use township project on the Coimbatore-Avinashi corridor acquired from a distressed developer, with RERA approvals reinstated.',
    stage: 'Pipeline',
    status: 'Pipeline' as const,
    investmentYear: 2025,
    logo: '/portfolio/coimbatore-gateway.svg', // placeholder
  },
  {
    name: 'FinStack Technologies',
    sector: 'Fintech Startup',
    description:
      'AI-powered lending infrastructure platform enabling NBFCs and banks to underwrite loans for MSMEs across Tier 2 and Tier 3 cities in India.',
    stage: 'Pre-Series A',
    status: 'Active' as const,
    investmentYear: 2024,
    logo: '/portfolio/finstack.svg', // placeholder
  },
  {
    name: 'MedBridge Health',
    sector: 'HealthTech Startup',
    description:
      'Telemedicine and diagnostic platform connecting rural Tamil Nadu communities with specialist doctors through AI-assisted triage.',
    stage: 'Seed',
    status: 'Active' as const,
    investmentYear: 2025,
    logo: '/portfolio/medbridge.svg', // placeholder
  },
  {
    name: 'GreenGrid Logistics',
    sector: 'CleanTech Startup',
    description:
      'Electric last-mile delivery network for Chennai and Bengaluru, replacing diesel-powered fleets with EV-powered micro-hubs.',
    stage: 'Series A',
    status: 'Exited' as const,
    investmentYear: 2023,
    logo: '/portfolio/greengrid.svg', // placeholder
  },
] as const

// ============================================================
// Blog Posts
// ============================================================

export const BLOG_POSTS = [
  {
    slug: 'stressed-real-estate-nclt-hidden-value',
    title: 'How NCLT Resolutions Create Hidden Value in Stressed Real Estate',
    excerpt:
      'An inside look at how acquiring assets through the Insolvency and Bankruptcy Code can yield outsized returns for patient investors.',
    date: '2025-01-18',
    category: 'Real Estate',
    readTime: '6 min read',
    image: '/blog/nclt-value.jpg',
  },
  {
    slug: 'startup-investing-beyond-the-hype',
    title: 'Startup Investing Beyond the Hype: A Disciplined Approach',
    excerpt:
      'Why conviction-based investing in fundamentally sound startups outperforms trend-chasing, and how GHL India Ventures identifies winners.',
    date: '2025-01-10',
    category: 'Startups',
    readTime: '7 min read',
    image: '/blog/startup-discipline.jpg',
  },
  {
    slug: 'aif-vs-pms-which-is-right-for-hnis',
    title: 'AIF vs PMS: Which Is Right for High-Net-Worth Investors?',
    excerpt:
      'A head-to-head comparison of Alternative Investment Funds and Portfolio Management Services on structure, taxation, and suitability.',
    date: '2024-12-28',
    category: 'Investor Education',
    readTime: '5 min read',
    image: '/blog/aif-vs-pms.jpg',
  },
  {
    slug: 'afraid-of-losing-your-job-invest-for-security',
    title: 'Afraid of Losing Your Job? Here\'s How Smart Investing Can Secure Your Family\'s Future',
    excerpt:
      'With AI disruption and corporate layoffs on the rise, salaried professionals need a financial safety net. Discover how investing through GHL India Ventures\' SEBI co-invest framework can provide steady alternative income for your family.',
    date: '2025-02-10',
    category: 'Investor Education',
    readTime: '8 min read',
    image: '/blog/job-security-investing.jpg',
  },
  {
    slug: 'sebi-co-invest-framework-professionals-guide',
    title: 'SEBI Co-Invest Framework: A Professional\'s Guide to Structured Alternative Returns',
    excerpt:
      'Why the SEBI co-invest framework is becoming the go-to alternative for professionals seeking consistent returns beyond traditional FDs and mutual funds.',
    date: '2025-02-05',
    category: 'Investor Education',
    readTime: '7 min read',
    image: '/blog/debenture-guide.jpg',
  },
  {
    slug: 'india-aif-landscape-2025-growth-trends',
    title: 'India\'s AIF Landscape in 2025: Key Growth Trends Every Investor Should Know',
    excerpt:
      'From regulatory reforms to record fundraising, India\'s Alternative Investment Fund industry is at an inflection point. Here\'s what\'s driving the next wave of growth.',
    date: '2025-02-15',
    category: 'Market Analysis',
    readTime: '6 min read',
    image: '/blog/aif-landscape-2025.jpg',
  },
  {
    slug: 'sebi-aif-regulations-2026-what-changed',
    title: 'SEBI AIF Regulations 2026: What Changed and What It Means for Your Portfolio',
    excerpt:
      'SEBI\'s 2026 regulatory overhaul introduces new valuation norms, enhanced disclosure requirements, and tighter compliance for Category II AIFs. Here\'s how these changes impact investors and fund managers alike.',
    date: '2026-01-22',
    category: 'Market Analysis',
    readTime: '9 min read',
    image: '/blog/sebi-2026-regulations.jpg',
  },
  {
    slug: 'ai-disruption-alternative-investments-2026',
    title: 'AI Is Reshaping Alternative Investments in 2026: How Smart Capital Stays Ahead',
    excerpt:
      'From AI-driven deal sourcing and automated due diligence to predictive portfolio analytics, artificial intelligence is transforming how AIFs identify, evaluate, and manage investments in 2026.',
    date: '2026-02-10',
    category: 'Market Analysis',
    readTime: '8 min read',
    image: '/blog/ai-alternative-investments-2026.jpg',
  },
  {
    slug: 'category-ii-aif-preferred-choice-sophisticated-investors',
    title: 'Why Category II AIFs Are Becoming the Preferred Choice for Sophisticated Investors in India',
    excerpt:
      'Discover why High Net-Worth Individuals are turning to Category II Alternative Investment Funds for access to off-market opportunities, institutional governance, and attractive risk-adjusted returns targeting 18–30% IRR.',
    date: '2026-02-15',
    category: 'Investor Education',
    readTime: '8 min read',
    image: '/blog/category-ii-aif-choice.jpg',
  },
  {
    slug: 'stressed-real-estate-high-alpha-opportunities',
    title: 'How Stressed Real Estate Creates High-Alpha Investment Opportunities',
    excerpt:
      'Learn how distressed real estate projects acquired at 30–50% below intrinsic value can be transformed into stabilized assets delivering 18–25% IRR through disciplined execution and NCLT expertise.',
    date: '2026-02-16',
    category: 'Real Estate',
    readTime: '7 min read',
    image: '/blog/stressed-real-estate-alpha.jpg',
  },
  {
    slug: 'early-stage-growth-companies-india',
    title: 'Investing in India\'s Early-Stage Growth Companies: Where Scale Meets Strategy',
    excerpt:
      'India\'s startup ecosystem has matured. Explore how disciplined venture investing at the Series A to pre-IPO stage delivers 22–30% IRR by backing validated, capital-efficient companies.',
    date: '2026-02-17',
    category: 'Startups',
    readTime: '8 min read',
    image: '/blog/early-stage-growth.jpg',
  },
  {
    slug: 'governance-transparency-alternative-investment-funds',
    title: 'The Importance of Governance and Transparency in Alternative Investment Funds',
    excerpt:
      'Trust in finance is built slowly and lost instantly. Understand why SEBI-regulated governance, independent trustees, and transparent reporting are the foundation of credible AIF investing.',
    date: '2026-02-18',
    category: 'Investor Education',
    readTime: '6 min read',
    image: '/blog/governance-transparency-aif.jpg',
  },
  {
    slug: 'category-ii-aif-india-complete-guide',
    title: 'Category II AIF India: Complete Guide to SEBI Registered Alternative Investment Funds for HNIs & Institutional Investors',
    excerpt:
      'The definitive pillar guide to Category II AIFs in India — covering SEBI regulations, investment strategies, target returns, risk profiles, and why HNIs are choosing alternative investment funds for superior wealth creation.',
    date: '2026-02-19',
    category: 'Investor Education',
    readTime: '15 min read',
    image: '/blog/category-ii-aif-guide.jpg',
  },
] as const

// ============================================================
// Financial IQ Articles
// ============================================================

export const FINANCIAL_IQ_ARTICLES = [
  {
    slug: 'what-is-alternative-investment-fund',
    title: 'What Is an Alternative Investment Fund?',
    excerpt:
      'A beginner-friendly guide to understanding AIFs, their categories under SEBI, and why they matter for portfolio diversification.',
    date: '2025-01-15',
    category: 'Basics',
    readTime: '4 min read',
  },
  {
    slug: 'understanding-stressed-assets-real-estate',
    title: 'Understanding Stressed Assets in Real Estate',
    excerpt:
      'What makes a real estate asset "stressed", how the NCLT process works, and why distressed properties can be goldmines for informed investors.',
    date: '2025-01-02',
    category: 'Real Estate',
    readTime: '5 min read',
  },
  {
    slug: 'how-startup-valuations-work',
    title: 'How Startup Valuations Work: A Primer for New Investors',
    excerpt:
      'Demystifying pre-money vs post-money valuations, dilution, and how to evaluate whether a startup investment is fairly priced.',
    date: '2024-12-20',
    category: 'Startups',
    readTime: '6 min read',
  },
] as const

// ============================================================
// Milestones
// ============================================================

export const MILESTONES = [
  {
    year: '2020',
    title: 'Vision Takes Shape',
    description:
      'GHL India Ventures conceptualised with a dual-focus thesis on stressed real estate resolution and early-stage startup investing.',
  },
  {
    year: '2021',
    title: 'Core Team Assembled',
    description:
      'Brought together seasoned professionals from real estate, venture capital, compliance, and fund administration.',
  },
  {
    year: '2022',
    title: 'Pipeline Development',
    description:
      'Extensive due diligence on 50+ stressed real estate assets and 200+ startups across South India.',
  },
  {
    year: '2023',
    title: 'SEBI Registration Filed',
    description:
      'Fund structure finalised as a Category II AIF Trust and application submitted to SEBI.',
  },
  {
    year: '2024',
    title: 'SEBI Registration Granted',
    description:
      'Received SEBI Cat II AIF registration (IN/AIF2/2425/1517). First close completed and deployment initiated into stressed RE assets and startup portfolio.',
  },
  {
    year: '2025',
    title: 'Active Deployment',
    description:
      'Growth phase with active positions in 3 stressed real estate projects and 3 early-stage startups, with pipeline expanding into Tier 2 cities.',
  },
] as const

// ============================================================
// Investment Capabilities
// ============================================================

export const INVESTMENT_CAPABILITIES = [
  {
    title: 'Value Investing',
    description:
      'We acquire stressed real estate and invest in startups at valuations significantly below intrinsic value, ensuring a built-in margin of safety for our investors.',
    icon: 'value',
  },
  {
    title: 'Risk Management',
    description:
      'Rigorous multi-layer risk assessment across legal, financial, and market dimensions. Every investment undergoes stress-testing before capital deployment.',
    icon: 'shield',
  },
  {
    title: 'Fundamental Analysis',
    description:
      'Deep-dive research into asset quality, market dynamics, unit economics, and management capability forms the bedrock of our investment decisions.',
    icon: 'analysis',
  },
  {
    title: 'Liquidity Management',
    description:
      'Structured drawdown schedules and phased exits ensure optimal cash flow management across the fund\u2019s lifecycle, with clear exit pathways for each asset.',
    icon: 'liquidity',
  },
  {
    title: 'Transparency & Accountability',
    description:
      'Quarterly NAV reporting, audited financials, and an open-door communication policy keep investors informed at every stage of the fund\u2019s journey.',
    icon: 'transparency',
  },
  {
    title: 'Ethical & ESG Considerations',
    description:
      'We integrate environmental, social, and governance factors into our investment process, favouring sustainable developments and socially impactful startups.',
    icon: 'esg',
  },
] as const

// ============================================================
// Testimonials
// ============================================================

export const TESTIMONIALS = [
  {
    name: 'R. Krishnan, Chennai',
    quote:
      'GHL India Ventures gave me access to institutional-quality deal flow that was previously out of reach. The transparency in reporting and the team\u2019s hands-on approach to stressed assets gives me real confidence.',
    role: 'HNI Investor',
  },
  {
    name: 'S. Mehra, Mumbai',
    quote:
      'What sets GHL apart is their rigorous due diligence framework. They don\u2019t chase headlines\u2014they do the hard work of understanding each asset at a granular level before deploying capital.',
    role: 'Family Office Principal',
  },
  {
    name: 'V. Balasubramanian, Coimbatore',
    quote:
      'As a first-time AIF investor, I appreciated how the team walked me through every aspect of the fund structure, taxation, and expected timelines. The quarterly updates are thorough and timely.',
    role: 'Entrepreneur & Investor',
  },
] as const

// ============================================================
// FAQ Items
// ============================================================

export const FAQ_ITEMS = [
  {
    question: 'What is the minimum investment amount to participate in GHL India Ventures?',
    answer:
      'The minimum investment in our SEBI-registered Category II AIF is in line with prevailing SEBI regulations for Alternative Investment Funds. Please contact our investor relations team for the latest details. Investments are drawn down in tranches as deployment opportunities arise.',
  },
  {
    question: 'How does GHL India Ventures select stressed real estate assets?',
    answer:
      'We follow a proprietary screening process that evaluates legal clarity (NCLT/RERA status), location micro-market fundamentals, construction completion stage, and potential for value unlock through resolution or repositioning. Only assets with a clear path to resolution and strong risk-adjusted return potential make it into the portfolio.',
  },
  {
    question: 'What is the expected fund tenure and how are returns distributed?',
    answer:
      'The fund has a base tenure of 7\u201310 years with provisions for extensions. Returns are distributed to investors after exits from individual investments, following a waterfall structure that prioritises return of capital before profit sharing.',
  },
  {
    question: 'How does the fund manage risk across real estate and startup investments?',
    answer:
      'We maintain a balanced allocation between stressed real estate (lower risk, asset-backed) and early-stage startups (higher risk, higher upside). Each investment undergoes independent legal, financial, and market due diligence. Portfolio-level diversification across sectors, stages, and geographies further mitigates concentration risk.',
  },
  {
    question: 'Is GHL India Ventures regulated by SEBI, and how is investor money protected?',
    answer:
      'Yes, GHL India Ventures Trust is a SEBI-registered Category II AIF (Registration No. IN/AIF2/2425/1517). All investor funds are held in a dedicated fund account with an independent custodian. The fund is audited annually, and NAV is reported quarterly to all investors.',
  },
] as const
