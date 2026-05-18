/* ─────────────────────────────────────────────────────────────
   GHL Smarty — Knowledge Base

   Compact KB tuned for the multilingual Smarty concierge.
   The same knowledge surface is shown to website visitors
   (via the side widget) and to staff supervisors in the
   "GHL Smarty" tab. Keep entries short — they may be played
   back as speech in 11+ Indian languages.
   (Internal type names retain "Sarvam" prefix — they pre-date
   the rebrand. Renaming would churn imports across the app.)
   ───────────────────────────────────────────────────────────── */

export type SarvamKBCategory =
  | 'support'
  | 'fund'
  | 'aif'
  | 'co-invest'
  | 'process'
  | 'returns'
  | 'risk'
  | 'tax'
  | 'portfolio'
  | 'compliance'
  | 'fees'
  | 'account'
  | 'existing-investor'
  | 'liquidity'
  | 'comparison'
  | 'segment'

export interface SarvamKBEntry {
  id: string
  category: SarvamKBCategory
  question: string
  answer: string
  keywords: string[]
  suggestions?: string[]
}

export const SARVAM_KB: SarvamKBEntry[] = [
  {
    id: 'sarvam-greet',
    category: 'support',
    question: 'Welcome message',
    answer: 'Namaste! I am GHL Smarty — your multilingual investment assistant. I can answer questions about our SEBI-registered AIF and Co-Invest Framework in 11+ Indian languages. Press the speaker icon to hear any reply aloud.',
    keywords: ['hi', 'hello', 'namaste', 'start', 'hey', 'help'],
    suggestions: ['What is AIF?', 'Minimum investment', 'How to invest', 'Talk to advisor'],
  },
  {
    id: 'sarvam-about',
    category: 'fund',
    question: 'Who is GHL India Ventures?',
    answer: 'GHL India Ventures is a SEBI-registered Category II Alternative Investment Fund based in Chennai. Registration: IN/AIF2/24-25/1517. We focus on stressed real estate recovery and growth equity.',
    keywords: ['ghl', 'about', 'who', 'company', 'ventures'],
    suggestions: ['Investment routes', 'Returns', 'KYC documents'],
  },
  {
    id: 'sarvam-what-is-aif',
    category: 'aif',
    question: 'What is an AIF?',
    answer: 'An Alternative Investment Fund (AIF) is a SEBI-regulated pooled investment vehicle. Category II AIFs invest in real estate, private equity, and structured debt. They offer institutional-grade access usually unavailable to retail investors.',
    keywords: ['aif', 'alternative', 'fund', 'category', 'sebi'],
    suggestions: ['Direct AIF route', 'Co-Invest Framework', 'Minimum investment'],
  },
  {
    id: 'sarvam-routes',
    category: 'fund',
    question: 'What investment routes does GHL offer?',
    answer: 'We offer two routes. Direct AIF Route — for HNIs and Family Offices, targeting 15-25% IRR. SEBI Co-Invest Framework — for salaried professionals seeking structured returns and sustenance income.',
    keywords: ['routes', 'options', 'ways', 'invest', 'how'],
    suggestions: ['Direct AIF details', 'Co-Invest details', 'Compare routes'],
  },
  {
    id: 'sarvam-min',
    category: 'fund',
    question: 'What is the minimum investment?',
    answer: 'Direct AIF Route: as per SEBI AIF Regulations for Category II funds. Co-Invest Framework: please speak with our team for the current minimum. Both invest in the same underlying portfolio.',
    keywords: ['minimum', 'amount', 'how much', 'min', 'start'],
    suggestions: ['Investment process', 'KYC documents', 'Talk to advisor'],
  },
  {
    id: 'sarvam-process',
    category: 'process',
    question: 'How do I start investing?',
    answer: 'Five steps: 1) Initial consultation. 2) KYC verification — PAN, Aadhaar, bank proof. 3) Subscription agreement. 4) Transfer to custodian bank. 5) Investor dashboard access. The whole process takes 5-7 business days.',
    keywords: ['how', 'invest', 'start', 'process', 'begin', 'steps'],
    suggestions: ['KYC documents', 'Schedule consultation'],
  },
  {
    id: 'sarvam-kyc',
    category: 'process',
    question: 'What KYC documents are needed?',
    answer: 'PAN card, Aadhaar or passport, address proof, cancelled cheque or bank statement, passport-size photo, and an income proof. NRIs need FEMA-compliant docs and an NRE or NRO account.',
    keywords: ['kyc', 'documents', 'pan', 'aadhaar', 'proof'],
    suggestions: ['NRI process', 'Investment process'],
  },
  {
    id: 'sarvam-returns',
    category: 'returns',
    question: 'What returns can I expect?',
    answer: 'Direct AIF Route targets 15-25% IRR. The Co-Invest Framework offers attractive risk-adjusted structured returns. Returns are driven by deep-discount NCLT acquisitions plus active portfolio management. Past performance is not a guarantee.',
    keywords: ['returns', 'irr', 'profit', 'performance', 'yield', 'earn'],
    suggestions: ['Risk', 'Portfolio', 'Compare routes'],
  },
  {
    id: 'sarvam-risk',
    category: 'risk',
    question: 'What are the risks?',
    answer: 'AIF investments are subject to market and execution risks. We mitigate them through SEBI compliance, quarterly audits, third-party custodian safeguards, transparent NAV reporting, and diversification across stressed-asset projects.',
    keywords: ['risk', 'safe', 'safety', 'volatile', 'lose'],
    suggestions: ['Returns', 'Compliance', 'Talk to advisor'],
  },
  {
    id: 'sarvam-tax',
    category: 'tax',
    question: 'How are returns taxed?',
    answer: 'Category II AIFs have pass-through status. Income is taxed in the investor’s hands at the applicable slab for interest income, and as capital gains for equity. We share annual Form 64C details. Please consult a CA for your specific case.',
    keywords: ['tax', 'taxation', 'taxes', '64c', 'capital gains'],
    suggestions: ['Returns', 'NRI process'],
  },
  {
    id: 'sarvam-nri',
    category: 'process',
    question: 'How can NRIs invest?',
    answer: 'NRIs can invest via NRE or NRO accounts on a repatriable or non-repatriable basis, with FEMA-compliant documentation. RBI permissions apply where required. Our team handles the full onboarding remotely.',
    keywords: ['nri', 'foreign', 'overseas', 'fema', 'nre', 'nro'],
    suggestions: ['KYC documents', 'Talk to advisor'],
  },
  {
    id: 'sarvam-advisor',
    category: 'support',
    question: 'Connect me with an advisor',
    answer: 'I can hand this conversation over to one of our investment advisors. Click "Talk to a human" below — a supervisor from our team will join this chat live.',
    keywords: ['advisor', 'human', 'agent', 'talk', 'real', 'person'],
    suggestions: ['Schedule call', 'Email us'],
  },
  // ── Fund details ───────────────────────────────────────
  {
    id: 'sarvam-sebi-reg',
    category: 'compliance',
    question: 'Are you SEBI registered?',
    answer: 'Yes. GHL India Ventures is a SEBI-registered Category II Alternative Investment Fund. Registration number: IN/AIF2/24-25/1517. SEBI registration means we follow strict disclosure, custodial, and audit norms — your investment sits with an independent custodian, not on our balance sheet.',
    keywords: ['sebi', 'registered', 'registration', 'license', 'regulated'],
    suggestions: ['What is AIF?', 'Compliance', 'Custodian'],
  },
  {
    id: 'sarvam-leadership',
    category: 'fund',
    question: 'Who runs GHL India Ventures?',
    answer: 'The fund is led by a senior team with backgrounds in real estate, BFSI, and capital markets. Each fund decision passes through an investment committee with independent oversight. Visit our About page or ask a supervisor for the latest leadership profiles.',
    keywords: ['team', 'leadership', 'founder', 'management', 'ceo', 'who'],
    suggestions: ['About the fund', 'Schedule call'],
  },
  {
    id: 'sarvam-categories',
    category: 'aif',
    question: 'What are AIF Category I, II, III?',
    answer: 'AIFs are SEBI-regulated pools categorised by strategy. Category I: socially desirable funds (venture capital, infrastructure, SME). Category II: real estate, private equity, structured debt — like GHL. Category III: hedge-fund-style strategies that may use leverage. Each category has distinct tax and investor-eligibility rules.',
    keywords: ['category', 'cat-i', 'cat-ii', 'cat-iii', 'types', 'classification'],
    suggestions: ['Direct AIF route', 'Compare routes'],
  },
  {
    id: 'sarvam-debenture',
    category: 'fund',
    question: 'What is the Debenture route?',
    answer: 'The Debenture route is a fixed-income style product that lets you participate in stressed real estate cashflows through listed or unlisted debentures rather than direct AIF units. It targets steadier coupon-style returns and a defined tenure. Speak to our team for the current series, coupon, and minimum.',
    keywords: ['debenture', 'ncd', 'bond', 'coupon', 'fixed income'],
    suggestions: ['Compare routes', 'Talk to advisor', 'Co-Invest Framework'],
  },
  {
    id: 'sarvam-llp',
    category: 'fund',
    question: 'What is the LLP route?',
    answer: 'The LLP route is a special-purpose Limited Liability Partnership vehicle some investors use to take direct exposure to a specific project pool. Eligibility, minimums, and rights are project-specific — please ask an advisor; this route is offered on a case-by-case basis.',
    keywords: ['llp', 'partnership', 'limited liability', 'vehicle'],
    suggestions: ['Direct AIF route', 'Talk to advisor'],
  },
  {
    id: 'sarvam-hurdle',
    category: 'returns',
    question: 'What is the hurdle rate?',
    answer: 'The hurdle rate is the preferred return investors get before the fund manager earns any performance fee (carry). For GHL Category II AIF, the hurdle is in line with SEBI conventions for stressed-asset funds. Below the hurdle, 100% of returns flow to investors; above it, a share goes to the manager.',
    keywords: ['hurdle', 'preferred return', 'carry', 'waterfall'],
    suggestions: ['Fees', 'Returns', 'Distribution'],
  },
  {
    id: 'sarvam-payouts',
    category: 'returns',
    question: 'How and when are returns paid out?',
    answer: 'Distributions follow the fund waterfall: return of capital first, then preferred return up to the hurdle, then carry split. Cash distributions happen as underlying projects monetise — typical real-estate recovery timelines are 24-48 months. There is no fixed monthly coupon (use the Debenture route if you need a regular coupon).',
    keywords: ['payout', 'distribution', 'payment', 'when', 'cashflow', 'monthly'],
    suggestions: ['Lock-in', 'Debenture route', 'Returns'],
  },
  {
    id: 'sarvam-lockin',
    category: 'liquidity',
    question: 'What is the lock-in period?',
    answer: 'Category II AIFs are close-ended. The fund tenure is typically 4-6 years with possible 1-2 year extensions per SEBI. There is no early-redemption window — exit happens as the fund distributes underlying recoveries. Plan with a 4+ year horizon in mind.',
    keywords: ['lock-in', 'lockin', 'tenure', 'duration', 'period', 'years'],
    suggestions: ['Exit options', 'Liquidity', 'Risk'],
  },
  {
    id: 'sarvam-exit',
    category: 'liquidity',
    question: 'Can I exit early?',
    answer: 'Early exit is generally not available because the fund is close-ended and capital is deployed into illiquid projects. In exceptional cases, secondary transfer to another eligible investor may be arranged subject to manager approval and SEBI rules. Talk to an RM for your specific situation.',
    keywords: ['exit', 'redeem', 'withdraw', 'early', 'sell', 'transfer'],
    suggestions: ['Lock-in period', 'Talk to RM'],
  },
  {
    id: 'sarvam-mgmt-fee',
    category: 'fees',
    question: 'What is the management fee?',
    answer: 'The management fee for our Category II AIF is in the standard 1.5-2% per annum range on committed capital, with adjustments after the deployment period. Performance fee (carry) is 20% above the hurdle. GST applies on fees. Exact numbers are in the Private Placement Memorandum (PPM).',
    keywords: ['management fee', 'mgmt fee', 'expense ratio', 'cost', 'charge'],
    suggestions: ['Performance fee', 'Hurdle rate'],
  },
  {
    id: 'sarvam-perf-fee',
    category: 'fees',
    question: 'What is the performance fee?',
    answer: 'The performance fee (carry) is 20% of returns above the hurdle. It only applies when investors have first received their full capital back AND the preferred return. This aligns the manager with investor outcomes — we earn meaningfully only after you do.',
    keywords: ['performance fee', 'carry', 'carried interest', 'incentive'],
    suggestions: ['Hurdle rate', 'Management fee', 'Returns'],
  },
  {
    id: 'sarvam-entry-load',
    category: 'fees',
    question: 'Is there an entry or exit load?',
    answer: 'For the Direct AIF route: entry load is generally nil; exit load may apply if the manager arranges a secondary transfer before fund maturity. For the Debenture route: any premium/discount is built into the issue. Always check the term sheet for the specific series you are subscribing to.',
    keywords: ['entry load', 'exit load', 'premium', 'discount', 'fees'],
    suggestions: ['Fee structure', 'Documentation'],
  },
  // ── Portfolio + strategy ──────────────────────────────
  {
    id: 'sarvam-portfolio',
    category: 'portfolio',
    question: 'What is in the portfolio?',
    answer: 'The portfolio is concentrated on stressed real estate recovery — residential and commercial projects acquired through NCLT/IBC processes at 40-60% discounts to replacement cost. The pipeline includes select growth-stage company exposures as well. Specific project names are shared with registered investors after KYC.',
    keywords: ['portfolio', 'investments', 'projects', 'holdings', 'pipeline'],
    suggestions: ['NCLT process', 'Geography', 'Schedule call'],
  },
  {
    id: 'sarvam-nclt',
    category: 'portfolio',
    question: 'What is NCLT and how does it create discounts?',
    answer: 'NCLT (National Company Law Tribunal) administers India\'s Insolvency and Bankruptcy Code (IBC). Stressed real-estate projects enter NCLT when developers default. As a resolution applicant, GHL can acquire viable assets at deep discounts because the process clears legal encumbrances and forces a haircut on existing claims. We pick projects where completion economics still work after the discount.',
    keywords: ['nclt', 'ibc', 'insolvency', 'bankruptcy', 'discount', 'distressed'],
    suggestions: ['Portfolio', 'Risk', 'Returns'],
  },
  {
    id: 'sarvam-geography',
    category: 'portfolio',
    question: 'What cities do you invest in?',
    answer: 'Focus geographies are Chennai, Bengaluru, Hyderabad, and select Tier-1 metros. We chase assets, not addresses — projects need credible end-user demand, clear titles after NCLT resolution, and completion economics that work at our acquisition price. Tier-2 cities are evaluated case by case.',
    keywords: ['city', 'location', 'cities', 'geography', 'where', 'chennai', 'bengaluru'],
    suggestions: ['Portfolio', 'About the fund'],
  },
  // ── Risk + safety ─────────────────────────────────────
  {
    id: 'sarvam-volatility',
    category: 'risk',
    question: 'How volatile are the returns?',
    answer: 'AIF returns are NOT marked-to-market like listed stocks. Quarterly NAV reflects valuation movement in the underlying projects, which is smoother than equity. The main risks are project-execution delays and approval delays — not daily market noise. Returns are lumpy: most flow toward the end of the tenure.',
    keywords: ['volatile', 'volatility', 'fluctuation', 'mark to market', 'nav'],
    suggestions: ['Risk', 'NAV updates', 'Returns'],
  },
  {
    id: 'sarvam-safety',
    category: 'risk',
    question: 'How safe is my money?',
    answer: 'Safety controls: SEBI Category II registration, independent custodian (capital is NOT on the manager\'s balance sheet), quarterly audited NAV, mandatory disclosures, and project-level diversification. Investment risk remains real — past performance does not guarantee future returns and capital is at risk. The structure minimises operational and counterparty risk, not market risk.',
    keywords: ['safe', 'safety', 'secure', 'protection', 'guarantee'],
    suggestions: ['Compliance', 'Custodian', 'Risk'],
  },
  {
    id: 'sarvam-custodian',
    category: 'compliance',
    question: 'Who holds my money?',
    answer: 'An independent SEBI-registered custodian holds the fund\'s assets and accounts. Capital flows through the custodian into project SPVs as commitments draw down — never through the manager\'s own balance sheet. Quarterly third-party audits reconcile every line.',
    keywords: ['custodian', 'who holds', 'safekeeping', 'audit', 'bank'],
    suggestions: ['Compliance', 'Safety', 'SEBI registration'],
  },
  // ── Process ───────────────────────────────────────────
  {
    id: 'sarvam-timeline',
    category: 'process',
    question: 'How long does onboarding take?',
    answer: 'Typical timeline once you decide to invest: Day 1 — share intent and KYC documents. Day 2-3 — KYC verification and subscription agreement. Day 4-5 — fund transfer to custodian. Day 5-7 — investor dashboard activation and contribution confirmation. NRI onboarding takes a couple of extra days for FEMA paperwork.',
    keywords: ['timeline', 'how long', 'time', 'duration', 'days', 'onboarding'],
    suggestions: ['KYC documents', 'How to invest'],
  },
  {
    id: 'sarvam-esign',
    category: 'process',
    question: 'Can I sign documents online?',
    answer: 'Yes. Subscription agreements and KYC forms can be e-signed using Aadhaar-based eSign or DigiLocker workflows. Wet-ink signatures are still accepted if you prefer. NRIs typically use the digital path because it speeds up FEMA compliance.',
    keywords: ['esign', 'e-sign', 'digital signature', 'online sign', 'aadhaar'],
    suggestions: ['KYC documents', 'NRI process'],
  },
  {
    id: 'sarvam-payment',
    category: 'process',
    question: 'How do I transfer the investment amount?',
    answer: 'Capital is transferred to the fund\'s custodian account via RTGS or NEFT from the bank account on your KYC. Cash, third-party transfers, and overseas wires bypassing the FEMA route are not accepted. Confirmation reaches your dashboard within one working day of the credit.',
    keywords: ['transfer', 'pay', 'rtgs', 'neft', 'bank', 'fund transfer'],
    suggestions: ['Timeline', 'KYC documents'],
  },
  {
    id: 'sarvam-demat',
    category: 'process',
    question: 'Do I need a demat account?',
    answer: 'For the Direct AIF route, AIF units are typically held in dematerialised form, so a demat account is needed (NSDL or CDSL). For the Debenture route, listed debentures go into your demat too. We can help you open one if you don\'t have one yet.',
    keywords: ['demat', 'nsdl', 'cdsl', 'depository', 'units'],
    suggestions: ['KYC documents', 'How to invest'],
  },
  // ── NRI ───────────────────────────────────────────────
  {
    id: 'sarvam-nri-account',
    category: 'process',
    question: 'NRE or NRO — which account should I use?',
    answer: 'NRE (Non-Resident External) is fully repatriable — principal and returns can be sent back overseas freely. NRO (Non-Resident Ordinary) is non-repatriable beyond USD 1 million per year. Most NRI investors use NRE for AIF investments. We help structure the right account on your country\'s tax footprint.',
    keywords: ['nre', 'nro', 'account', 'repatriable', 'nri'],
    suggestions: ['NRI process', 'Tax for NRIs'],
  },
  {
    id: 'sarvam-nri-tax',
    category: 'tax',
    question: 'How are NRIs taxed?',
    answer: 'For Category II AIFs, income is taxed in the investor\'s hands at the slab rate (interest) or as capital gains (equity component). TDS at 10% (or treaty rate, if lower) applies on certain income to NRIs. India has Double Tax Avoidance Agreements (DTAA) with most major jurisdictions — we provide Form 64C annually so you or your CA can claim treaty relief. Consult a tax advisor for your specific case.',
    keywords: ['nri tax', 'taxation nri', 'dtaa', 'tds', 'treaty'],
    suggestions: ['Tax basics', 'NRI process'],
  },
  {
    id: 'sarvam-fema',
    category: 'process',
    question: 'What FEMA paperwork is needed for NRIs?',
    answer: 'FEMA documentation includes: declaration that funds are sourced from NRE/NRO/FCNR accounts, foreign address proof, PIS account (only if applicable), and a FEMA-compliant subscription agreement. RBI reporting is handled by the custodian on your behalf. Total NRI onboarding adds 2-3 days versus a resident investor.',
    keywords: ['fema', 'rbi', 'foreign', 'overseas', 'reporting'],
    suggestions: ['NRI process', 'KYC documents'],
  },
  // ── Comparisons ───────────────────────────────────────
  {
    id: 'sarvam-vs-fd',
    category: 'comparison',
    question: 'How is this different from a Fixed Deposit?',
    answer: 'FDs offer assured returns and full liquidity — typically 6-8% pre-tax. Our AIF / Debenture targets meaningfully higher returns (15-25% IRR for the Direct route) but with lock-in, market risk, and lumpy distributions. FDs suit emergency funds; AIFs suit a portion of your long-term wealth that you can leave invested for 4+ years.',
    keywords: ['fd', 'fixed deposit', 'compare', 'vs fd', 'bank'],
    suggestions: ['Returns', 'Risk', 'Lock-in'],
  },
  {
    id: 'sarvam-vs-mf',
    category: 'comparison',
    question: 'How is this different from mutual funds?',
    answer: 'Mutual funds are open-ended, daily-liquid, and capped by SEBI on alternatives like real estate and unlisted equity. AIFs are close-ended, illiquid, and can access deep-discount stressed-asset opportunities that mutual funds cannot. AIFs are designed for HNIs (₹1 Cr+) seeking access to institutional-grade alternatives — not for routine equity savings.',
    keywords: ['mutual fund', 'mf', 'compare', 'vs mf'],
    suggestions: ['Why AIF?', 'Risk'],
  },
  {
    id: 'sarvam-vs-pms',
    category: 'comparison',
    question: 'How is this different from a PMS?',
    answer: 'A Portfolio Management Service (PMS) gives each client a separate account of listed securities, with portfolio-level transparency and daily liquidity. AIFs are pooled vehicles for unlisted or illiquid strategies (like ours: stressed real estate). PMS minimum is ₹50 lakh, AIFs ₹1 Cr. They serve different goals — listed-equity stock picking vs alternative-asset access.',
    keywords: ['pms', 'portfolio management', 'compare', 'vs pms'],
    suggestions: ['Why AIF?', 'Compare routes'],
  },
  {
    id: 'sarvam-vs-direct-realestate',
    category: 'comparison',
    question: 'Why not just buy property directly?',
    answer: 'Direct property buying gives you control but concentrates risk in one asset, ties up registration costs (6-8%), property tax, maintenance, tenant management, and exit illiquidity. Our AIF spreads capital across many discounted projects through NCLT, professional management handles execution, and you avoid the operational drag. Returns are net of all that overhead.',
    keywords: ['direct real estate', 'buy property', 'compare', 'vs property'],
    suggestions: ['Portfolio', 'Returns'],
  },
  // ── Account / login / existing investor ───────────────
  {
    id: 'sarvam-login',
    category: 'existing-investor',
    question: 'How do I log into my investor dashboard?',
    answer: 'Visit ghlindiaventures.com and click Login → Investor. Use your registered email and the password set during onboarding. Forgotten password: use the "Forgot Password" link or ask a supervisor here. Dashboard shows your contribution, capital calls, NAV, and statements.',
    keywords: ['login', 'sign in', 'dashboard', 'account', 'password'],
    suggestions: ['Forgot password', 'Talk to RM'],
  },
  {
    id: 'sarvam-statements',
    category: 'existing-investor',
    question: 'How do I get my account statement?',
    answer: 'Quarterly account statements and the annual tax statement (Form 64C for AIF) are posted in the investor dashboard under Reports. We also email a copy on the same day. If you cannot locate a specific statement, a supervisor can resend it instantly — just ask.',
    keywords: ['statement', 'report', 'account statement', '64c', 'tax statement'],
    suggestions: ['Tax', 'Dashboard login'],
  },
  {
    id: 'sarvam-nav-update',
    category: 'existing-investor',
    question: 'When is the NAV updated?',
    answer: 'NAV is computed quarterly per SEBI norms and published in your investor dashboard within 30 days of quarter-end (typically by the 30th of April, July, October, and January). The NAV is third-party audited. Interim valuation drafts are not shared because they can mislead.',
    keywords: ['nav', 'valuation', 'price', 'update', 'quarterly'],
    suggestions: ['Reports', 'Volatility'],
  },
  {
    id: 'sarvam-capital-call',
    category: 'existing-investor',
    question: 'What is a capital call?',
    answer: 'A capital call is when the fund draws a tranche of your committed capital as projects come online. You commit, say, ₹1 Cr at signing; the fund calls it down in instalments (typically 30-50% upfront, balance over 12-18 months). You get advance notice for each call. Missing a call has consequences spelled out in the PPM, so honour them on time.',
    keywords: ['capital call', 'drawdown', 'commitment', 'tranche'],
    suggestions: ['How to invest', 'Lock-in'],
  },
  {
    id: 'sarvam-nominee',
    category: 'account',
    question: 'How do I add or update a nominee?',
    answer: 'Nominee details are part of the KYC pack at onboarding. To update: log into your dashboard, go to Profile → Nominee, upload the nominee\'s PAN/Aadhaar, and e-sign the change. We process the update within one working day. You can add up to three nominees with percentage splits.',
    keywords: ['nominee', 'beneficiary', 'successor', 'add', 'update'],
    suggestions: ['KYC update', 'Dashboard login'],
  },
  {
    id: 'sarvam-joint',
    category: 'account',
    question: 'Can I invest jointly with my spouse or parent?',
    answer: 'Yes — joint investor accounts are supported (either-or-survivor, or anyone-or-survivor). Both holders must complete KYC and sign the subscription agreement. Tax reporting follows the first holder unless the joint agreement states otherwise. Joint holdings simplify succession and are recommended for retirees.',
    keywords: ['joint', 'spouse', 'parent', 'two holders', 'survivor'],
    suggestions: ['KYC documents', 'Nominee'],
  },
  // ── Segments / investor types ─────────────────────────
  {
    id: 'sarvam-hni',
    category: 'segment',
    question: 'I am an HNI — what suits me?',
    answer: 'For HNIs and family offices, the Direct AIF route is the natural fit — institutional access to stressed real estate, full investor reporting, dedicated relationship manager, and priority on co-investment opportunities. Many HNIs allocate 10-20% of investable surplus here as an alternative-asset sleeve.',
    keywords: ['hni', 'high net worth', 'family office', 'wealthy', 'rich'],
    suggestions: ['Direct AIF route', 'Schedule call'],
  },
  {
    id: 'sarvam-salaried',
    category: 'segment',
    question: 'I am salaried — what suits me?',
    answer: 'For salaried professionals, the SEBI Co-Invest Framework is built specifically for you — structured returns, lower minimum than Direct AIF, and the same underlying portfolio. Many of our salaried investors layer it on top of equity SIPs and EPF/PPF as the alternative-asset sleeve. Ask a supervisor for the current minimum and structure.',
    keywords: ['salaried', 'employee', 'salary', 'working professional'],
    suggestions: ['Co-Invest Framework', 'Schedule call'],
  },
  {
    id: 'sarvam-retiree',
    category: 'segment',
    question: 'I am retired — what suits me?',
    answer: 'Retirees typically prefer the Debenture route because it targets steadier coupon-style cashflow rather than back-loaded AIF distributions. Pair it with FDs and PPF for short-term liquidity. Lock-in still applies, so allocate only the portion of corpus you do not need in the next 4 years.',
    keywords: ['retired', 'retiree', 'senior citizen', 'pension'],
    suggestions: ['Debenture route', 'Lock-in', 'Talk to advisor'],
  },
  // ── Support / contact ─────────────────────────────────
  {
    id: 'sarvam-contact',
    category: 'support',
    question: 'How do I contact GHL?',
    answer: 'Email info@ghlindiaventures.com, call +91 7200 255 252 (Mon-Sat 10:00 AM-6:30 PM IST), or WhatsApp the same number. Office: 2D Queens Court, 6 Montieth Road, Egmore, Chennai 600008. You can also keep chatting with me here and ask for a supervisor to take over live.',
    keywords: ['contact', 'phone', 'email', 'reach', 'office', 'address'],
    suggestions: ['Schedule call', 'Talk to a human'],
  },
  {
    id: 'sarvam-schedule',
    category: 'support',
    question: 'Can I schedule a call?',
    answer: 'Yes — share your name, phone, and a preferred time window and I will route it to an investment advisor. Calls are typically 30-45 minutes covering your goals, the right route for you, and a Q&A on the PPM. There is no obligation to invest after a discovery call.',
    keywords: ['schedule', 'book', 'call', 'meeting', 'appointment'],
    suggestions: ['Talk to a human', 'Email us'],
  },
  {
    id: 'sarvam-grievance',
    category: 'support',
    question: 'How do I raise a complaint?',
    answer: 'Email grievance@ghlindiaventures.com or raise a ticket from your investor dashboard. We respond within 3 working days. Unresolved complaints can be escalated to SEBI SCORES (scores.gov.in) — every SEBI-registered intermediary is bound by this redressal mechanism.',
    keywords: ['complaint', 'grievance', 'issue', 'problem', 'scores'],
    suggestions: ['Contact', 'Talk to a human'],
  },
  {
    id: 'sarvam-ppm',
    category: 'compliance',
    question: 'What is the PPM?',
    answer: 'The Private Placement Memorandum (PPM) is the SEBI-mandated offering document for an AIF. It contains the strategy, fees, risk factors, tax treatment, fund tenure, distribution waterfall, and investor rights. Every prospective investor must read the PPM before signing the subscription agreement. We share it after a discovery call.',
    keywords: ['ppm', 'memorandum', 'placement', 'document', 'offering'],
    suggestions: ['How to invest', 'Schedule call'],
  },
  {
    id: 'sarvam-disclaimer',
    category: 'risk',
    question: 'What is the standard risk disclaimer?',
    answer: 'Investments in Alternative Investment Funds are subject to market risk. Past performance does not guarantee future returns. Returns shown are targets, not assurances. Please read the Private Placement Memorandum (PPM) carefully before investing. GHL India Ventures is a SEBI-registered Category II AIF — registration does not certify investment outcomes.',
    keywords: ['disclaimer', 'risk warning', 'past performance', 'caveat'],
    suggestions: ['Risk', 'PPM'],
  },
  // ── Misc ──────────────────────────────────────────────
  {
    id: 'sarvam-min-tenure',
    category: 'liquidity',
    question: 'What is the typical fund tenure?',
    answer: 'Our Category II AIF runs 4-6 years from final close, with optional 1-2 year extensions per SEBI norms. The Debenture route may have a separate, shorter tenure (often 24-36 months) defined per series. Choose the vehicle whose tenure matches your liquidity comfort.',
    keywords: ['tenure', 'duration', 'how long', 'maturity'],
    suggestions: ['Lock-in', 'Debenture route'],
  },
  {
    id: 'sarvam-multi-fund',
    category: 'fund',
    question: 'Can I invest in multiple GHL routes?',
    answer: 'Yes — many investors blend routes. A common split: AIF Direct for the alternative-asset sleeve, Debenture route for steady cashflow, and the Co-Invest framework for a specific project they want focused exposure to. Each route is documented separately and can be sized independently.',
    keywords: ['multiple', 'combine', 'mix', 'both', 'all routes'],
    suggestions: ['Compare routes', 'Talk to advisor'],
  },
  {
    id: 'sarvam-corp',
    category: 'segment',
    question: 'Can a company or LLP invest?',
    answer: 'Yes — eligible non-individual investors include Indian companies, LLPs, partnership firms, trusts, and registered HNI family offices. Corporate investors need their Board/partners\' resolution authorising the investment plus standard KYC. The minimum is the same as for individuals.',
    keywords: ['company', 'corporate', 'llp invest', 'trust', 'partnership invest'],
    suggestions: ['How to invest', 'KYC documents'],
  },
  {
    id: 'sarvam-pan-mandatory',
    category: 'process',
    question: 'Is PAN mandatory?',
    answer: 'Yes. PAN is mandatory for every Indian investor and for NRIs investing into Indian AIFs. If you don\'t have a PAN yet (some NRIs don\'t), our team helps you get one — it takes 7-10 working days online. We cannot accept any subscription without a valid PAN.',
    keywords: ['pan', 'mandatory', 'required', 'tax id'],
    suggestions: ['KYC documents', 'NRI process'],
  },
  {
    id: 'sarvam-cooling',
    category: 'process',
    question: 'Is there a cooling-off period?',
    answer: 'Once the subscription agreement is signed and capital is credited, there is no statutory cooling-off because AIFs are private placements, not retail products. You CAN, however, decline a future capital call by forfeiting earlier contributions per the PPM. So commit only after reading the PPM and discussing with an advisor.',
    keywords: ['cooling off', 'cancel', 'rescind', 'reverse'],
    suggestions: ['PPM', 'Talk to advisor'],
  },
  {
    id: 'sarvam-gst',
    category: 'tax',
    question: 'Is GST applicable on fees?',
    answer: 'Yes, GST at the prevailing rate (currently 18%) applies on management fee and performance fee. GST does not apply on the investment principal itself or on distributions you receive — only on the manager\'s fee invoices. GST is reflected in the quarterly account statement.',
    keywords: ['gst', 'tax on fee', 'service tax'],
    suggestions: ['Fee structure', 'Tax basics'],
  },
  {
    id: 'sarvam-investor-categories',
    category: 'segment',
    question: 'Who is eligible to invest?',
    answer: 'SEBI defines eligibility for Category II AIFs. Resident individuals, NRIs (via NRE/NRO/FCNR), Indian companies, LLPs, trusts, family offices, and some foreign entities under FPI rules are eligible. The investor must meet the minimum commitment per the PPM. We screen eligibility during KYC.',
    keywords: ['eligible', 'eligibility', 'who can invest', 'qualify'],
    suggestions: ['KYC documents', 'Minimum investment'],
  },
  {
    id: 'sarvam-currency',
    category: 'process',
    question: 'Can I invest in foreign currency?',
    answer: 'AIF units are denominated in INR. NRIs and foreign investors transfer foreign currency into their NRE/NRO/FCNR account, which is then converted to INR at the bank\'s prevailing rate before subscription. The custodian receives only INR. Distributions also come in INR — repatriation rules depend on whether you used NRE (free) or NRO (capped).',
    keywords: ['currency', 'usd', 'dollar', 'forex', 'foreign currency'],
    suggestions: ['NRI process', 'NRE vs NRO'],
  },
  {
    id: 'sarvam-tax-form-64c',
    category: 'tax',
    question: 'What is Form 64C?',
    answer: 'Form 64C is the statutory annual statement that an AIF issues to each investor. It breaks down the investor\'s share of fund income by category (interest, dividend, capital gains) for use in your personal tax return. We issue Form 64C by mid-June for the previous financial year and post it in your dashboard.',
    keywords: ['form 64c', '64c', 'tax form', 'income statement'],
    suggestions: ['Tax basics', 'Reports'],
  },
  {
    id: 'sarvam-history',
    category: 'fund',
    question: 'How old is GHL India Ventures?',
    answer: 'GHL India Ventures was founded in 2024 with the explicit thesis of recovering value in India\'s NCLT-stuck real estate cohort. SEBI registration as a Category II AIF was granted under IN/AIF2/24-25/1517. The team itself has decades of cumulative experience in real estate, BFSI, and capital markets.',
    keywords: ['history', 'when founded', 'age', 'started', 'old'],
    suggestions: ['About the fund', 'Leadership'],
  },
]

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'be', 'to', 'of', 'and', 'or',
  'in', 'on', 'for', 'with', 'at', 'by', 'me', 'i', 'you', 'my',
  'we', 'us', 'do', 'does', 'how', 'what', 'when', 'where', 'why',
])

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(t => !STOP_WORDS.has(t))
}

export interface SarvamKBMatch {
  entry: SarvamKBEntry
  score: number
}

/** Score every KB entry against the user's query and return the best match. */
export function findSarvamKBAnswer(query: string): SarvamKBMatch | null {
  const tokens = tokenize(query)
  if (tokens.length === 0) return null

  let best: SarvamKBMatch | null = null
  for (const entry of SARVAM_KB) {
    let score = 0
    for (const t of tokens) {
      if (entry.keywords.some(k => k.includes(t) || t.includes(k))) score += 2
      if (entry.question.toLowerCase().includes(t)) score += 1
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score }
    }
  }
  return best
}
