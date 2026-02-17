// ============================================================
// GHL India Ventures - Enhanced Chat Knowledge Base
// ============================================================

interface KnowledgeEntry {
  id: string
  category: string
  keywords: string[]
  response: string
  followUp: string[]
  priority: number
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ─── General ───
  {
    id: 'about-ghl',
    category: 'general',
    keywords: ['what', 'ghl', 'about', 'who', 'company', 'ventures'],
    response: '**GHL India Ventures** is a SEBI-registered Category II Alternative Investment Fund (AIF) based in Chennai, India.\n\nWe invest in two high-conviction themes:\n\u2022 **Stressed Real Estate** acquired through NCLT at deep discounts\n\u2022 **Early-Stage Startups** across technology, healthcare & logistics\n\nOur fund targets **15\u201325% IRR** with institutional-grade transparency and SEBI compliance.\n\nSEBI Registration: **IN/AIF2/2425/1517**',
    followUp: ['Investment Routes', 'How to Invest', 'Minimum Investment'],
    priority: 10,
  },
  {
    id: 'what-is-aif',
    category: 'general',
    keywords: ['aif', 'alternative', 'investment', 'fund', 'category', 'what is'],
    response: 'An **Alternative Investment Fund (AIF)** is a privately pooled investment vehicle regulated by SEBI.\n\n**Category II AIFs** like GHL India Ventures can invest in:\n\u2022 Real estate assets\n\u2022 Private equity\n\u2022 Pre-IPO companies\n\u2022 Structured debt\n\nUnlike mutual funds, AIFs offer access to institutional-grade opportunities typically unavailable to retail investors.',
    followUp: ['GHL Fund Details', 'Minimum Investment', 'How to Invest'],
    priority: 9,
  },
  // ─── Investment Routes ───
  {
    id: 'investment-routes',
    category: 'fund',
    keywords: ['routes', 'options', 'ways', 'invest', 'how', 'two', 'choose'],
    response: 'GHL offers **two investment routes** to suit different investor profiles:\n\n**1. Direct AIF Route** \u2014 For HNIs & Family Offices\n\u2022 Minimum: **\u20B91 Crore**\n\u2022 Target: 15\u201325% IRR\n\u2022 Direct ownership in premium ventures\n\n**2. Debenture Route** \u2014 For Salaried Professionals\n\u2022 Minimum: **\u20B910 Lakhs**\n\u2022 Structured returns framework\n\u2022 Ideal for families seeking sustenance\n\nWhich route interests you?',
    followUp: ['Direct AIF Details', 'Debenture Details', 'Compare Routes'],
    priority: 10,
  },
  {
    id: 'debenture-route',
    category: 'debenture',
    keywords: ['debenture', '10 lakh', 'ten lakh', 'salaried', 'steady', 'income', 'family', 'sustenance'],
    response: '**Debenture Route** \u2014 Built for Working Families\n\n\u2022 **Minimum Investment:** \u20B910 Lakhs\n\u2022 **Target Returns:** 12\u201315% p.a.\n\u2022 **Structure:** Secured debentures backed by fund assets\n\u2022 **Ideal for:** Salaried professionals, first-time alternative investors\n\n**How it works:**\n1. You invest \u2265\u20B910L in structured debentures\n2. Capital is deployed into our diversified portfolio\n3. You earn structured returns through the tenure\n\nThis is perfect for building an **alternative income stream** alongside your salary.',
    followUp: ['How to Start', 'Safety & Risk', 'Compare with FD'],
    priority: 9,
  },
  {
    id: 'direct-aif',
    category: 'aif',
    keywords: ['direct', 'aif', 'crore', '1 crore', 'hni', 'family office', 'ownership'],
    response: '**Direct AIF Route** \u2014 For Sophisticated Investors\n\n\u2022 **Minimum Investment:** \u20B91 Crore\n\u2022 **Target IRR:** 15\u201325%\n\u2022 **Direct ownership** in premium ventures\n\u2022 **Full transparency** with quarterly NAV reports\n\u2022 **SEBI Category II AIF** structure\n\n**What you get:**\n\u2022 Direct stake in stressed real estate & startup portfolio\n\u2022 Board-level governance visibility\n\u2022 Priority access to co-investment opportunities\n\u2022 Dedicated relationship manager',
    followUp: ['Investment Process', 'Portfolio Companies', 'Schedule Consultation'],
    priority: 9,
  },
  {
    id: 'compare-routes',
    category: 'fund',
    keywords: ['compare', 'difference', 'versus', 'vs', 'which', 'better', 'both'],
    response: '**Route Comparison:**\n\n| | Direct AIF | Debenture |\n|---|---|---|\n| **Min Investment** | \u20B91 Crore | \u20B910 Lakhs |\n| **Target Returns** | 15\u201325% IRR | 12\u201315% p.a. |\n| **Best For** | HNIs, Family Offices | Salaried Professionals |\n| **Structure** | Direct fund units | Secured debentures |\n| **Risk Level** | Moderate-High | Moderate |\n\nBoth routes invest in the same quality portfolio. The difference is in structure, minimum ticket, and return profile.',
    followUp: ['Debenture Details', 'Direct AIF Details', 'Talk to Advisor'],
    priority: 8,
  },
  // ─── Minimum Investment ───
  {
    id: 'minimum-investment',
    category: 'fund',
    keywords: ['minimum', 'min', 'how much', 'amount', 'entry', 'start', 'cost', 'price'],
    response: 'Our minimum investment depends on the route:\n\n\u2022 **Debenture Route:** Starting from **\u20B910 Lakhs**\n\u2022 **Direct AIF Route:** Starting from **\u20B91 Crore**\n\nThe Debenture Route was specifically designed to make alternative investments accessible to salaried professionals and families.',
    followUp: ['Debenture Route', 'Direct AIF Route', 'How to Start'],
    priority: 9,
  },
  // ─── Process ───
  {
    id: 'how-to-invest',
    category: 'process',
    keywords: ['how', 'invest', 'start', 'begin', 'process', 'steps', 'join'],
    response: '**Investment Process (5 Simple Steps):**\n\n**Step 1:** Initial Consultation \u2014 Speak with our team\n**Step 2:** KYC Verification \u2014 PAN, Aadhaar, bank details\n**Step 3:** Documentation \u2014 Sign the subscription agreement\n**Step 4:** Fund Transfer \u2014 Transfer to our custodian bank\n**Step 5:** Portfolio Access \u2014 Get your investor dashboard\n\nThe entire process typically takes **5\u20137 business days**.\n\nReady to get started? I can connect you with an advisor.',
    followUp: ['Schedule Consultation', 'KYC Requirements', 'Contact Info'],
    priority: 9,
  },
  {
    id: 'kyc-requirements',
    category: 'process',
    keywords: ['kyc', 'documents', 'requirement', 'pan', 'aadhaar', 'proof', 'identity'],
    response: '**KYC Documents Required:**\n\n\u2022 PAN Card (mandatory)\n\u2022 Aadhaar Card or Passport\n\u2022 Address Proof (utility bill / bank statement)\n\u2022 Bank Account Details (cancelled cheque)\n\u2022 Passport-size photographs\n\u2022 Income proof (for accredited investor verification)\n\nOur team guides you through the entire process. It\u2019s quick and paperwork-light.',
    followUp: ['Investment Process', 'Schedule Consultation', 'Contact Info'],
    priority: 7,
  },
  // ─── Returns & Performance ───
  {
    id: 'returns',
    category: 'fund',
    keywords: ['returns', 'performance', 'irr', 'yield', 'how much', 'earn', 'profit', 'growth'],
    response: '**Target Returns:**\n\n\u2022 **Direct AIF Route:** 15\u201325% IRR (Internal Rate of Return)\n\u2022 **Debenture Route:** 12\u201315% per annum\n\nOur returns are driven by:\n\u2022 NCLT-acquired real estate at 40\u201360% discounts\n\u2022 Early-stage startups with high growth potential\n\u2022 Active portfolio management & value creation\n\n*Note: Past performance doesn\u2019t guarantee future returns. Investments are subject to market risks.*',
    followUp: ['Portfolio Companies', 'Risk Management', 'Investment Routes'],
    priority: 8,
  },
  // ─── Safety & Risk ───
  {
    id: 'safety',
    category: 'safety',
    keywords: ['safe', 'risk', 'safety', 'secure', 'lose', 'protection', 'guarantee'],
    response: '**Our 5-Layer Risk Framework:**\n\n1. **SEBI Regulation** \u2014 Full compliance with SEBI (AIF) Regulations, 2012\n2. **Diversified Portfolio** \u2014 Across real estate & startups, multiple cities\n3. **Professional Management** \u2014 25+ years combined experience\n4. **Due Diligence** \u2014 We review 500+ pitch decks, invest in <2%\n5. **Transparent Reporting** \u2014 Quarterly NAV reports & annual audits\n\nWhile no investment is risk-free, our structure is designed to protect capital through diversification and disciplined selection.',
    followUp: ['SEBI Registration', 'Portfolio Companies', 'How to Invest'],
    priority: 8,
  },
  // ─── Portfolio ───
  {
    id: 'portfolio',
    category: 'portfolio',
    keywords: ['portfolio', 'companies', 'invested', 'holdings', 'assets', 'properties'],
    response: '**Current Portfolio (6 Investments):**\n\n**Real Estate (NCLT-acquired):**\n\u2022 Montieth Square Residences \u2014 Chennai premium\n\u2022 Nungambakkam Heights \u2014 Commercial complex\n\u2022 Coimbatore Gateway \u2014 Mixed-use development\n\n**Startups:**\n\u2022 FinStack Technologies \u2014 Fintech platform\n\u2022 MedBridge Health \u2014 Healthcare tech\n\u2022 GreenGrid Logistics \u2014 Sustainable supply chain\n\nWe deploy capital across **4 cities** with **\u20B9200 Cr+** value created.',
    followUp: ['Stressed Real Estate', 'Startup Strategy', 'Returns'],
    priority: 7,
  },
  {
    id: 'stressed-real-estate',
    category: 'portfolio',
    keywords: ['stressed', 'real estate', 'nclt', 'property', 'distressed', 'acquisition'],
    response: '**Stressed Real Estate Strategy:**\n\nWe acquire premium properties through the **NCLT (National Company Law Tribunal)** at **40\u201360% discounts** to market value.\n\n**The Process:**\n1. Identify distressed assets in premium locations\n2. Acquire through NCLT at deep discounts\n3. Renovate, reposition & unlock value\n4. Exit at market rates for significant returns\n\nThis strategy has historically delivered **20\u201330% IRR** on real estate investments.',
    followUp: ['Portfolio Companies', 'Returns', 'How to Invest'],
    priority: 7,
  },
  {
    id: 'startups',
    category: 'portfolio',
    keywords: ['startup', 'tech', 'early stage', 'venture', 'fintech', 'health'],
    response: '**Early-Stage Startup Strategy:**\n\nWe invest in startups across:\n\u2022 **Fintech** \u2014 Digital financial services\n\u2022 **Healthcare** \u2014 Health-tech platforms\n\u2022 **Logistics** \u2014 Sustainable supply chain solutions\n\n**Our Selection Process:**\n\u2022 Review 500+ pitch decks annually\n\u2022 Invest in less than 2% of reviewed opportunities\n\u2022 Focus on capital-efficient, revenue-generating startups\n\u2022 Provide strategic guidance & network access',
    followUp: ['Portfolio Companies', 'Returns', 'Risk Management'],
    priority: 7,
  },
  // ─── Team ───
  {
    id: 'team',
    category: 'team',
    keywords: ['team', 'leadership', 'chairman', 'manager', 'who manages', 'people', 'founder'],
    response: '**Leadership Team:**\n\nOur fund is managed by a team with **25+ years** of combined experience across investment banking, real estate, and startups.\n\nThe leadership brings expertise from:\n\u2022 SEBI-regulated fund management\n\u2022 NCLT acquisition processes\n\u2022 Startup ecosystem & venture capital\n\u2022 Financial compliance & governance\n\nYou can meet the full team on our **About page**. Want me to direct you there?',
    followUp: ['About GHL', 'Investment Strategy', 'Schedule Consultation'],
    priority: 6,
  },
  // ─── Contact ───
  {
    id: 'contact',
    category: 'contact',
    keywords: ['contact', 'phone', 'email', 'address', 'office', 'reach', 'call', 'whatsapp'],
    response: '**Contact GHL India Ventures:**\n\n**Phone:** +91 44 2843 1043 | +91 72002 55252\n**Email:** info@ghlindiaventures.com\n**WhatsApp:** +91 72002 55252\n\n**Office:**\n2D, Queens Court, No. 6, Montieth Road\nEgmore, Chennai \u2013 600 008\n\n**Hours:** Mon\u2013Fri, 9:30 AM \u2013 6:30 PM IST\n\nWant me to connect you with an advisor right away?',
    followUp: ['Schedule Consultation', 'WhatsApp Chat', 'Investment Process'],
    priority: 8,
  },
  // ─── SEBI / Compliance ───
  {
    id: 'sebi',
    category: 'compliance',
    keywords: ['sebi', 'registered', 'regulation', 'legal', 'compliant', 'license', 'registration'],
    response: '**SEBI Registration Details:**\n\n\u2022 **Fund Name:** GHL India Ventures\n\u2022 **Category:** Category II AIF\n\u2022 **Registration No:** IN/AIF2/2425/1517\n\u2022 **Regulator:** Securities and Exchange Board of India (SEBI)\n\nWe comply with all provisions of the **SEBI (AIF) Regulations, 2012**, including mandatory disclosures, annual audits, and investor protection measures.\n\nFor any regulatory concerns, you can also reach SEBI SCORES at **scores.gov.in**.',
    followUp: ['Safety & Risk', 'How to Invest', 'Contact Info'],
    priority: 8,
  },
  // ─── Tax ───
  {
    id: 'tax',
    category: 'fund',
    keywords: ['tax', 'taxation', 'capital gains', 'ltcg', 'stcg', 'deduction'],
    response: '**Tax Implications (Category II AIF):**\n\nCategory II AIFs have **pass-through taxation**:\n\u2022 Income is taxed in the hands of the investor, not the fund\n\u2022 **LTCG:** Applicable for holdings > 2 years\n\u2022 **STCG:** For shorter holding periods\n\u2022 Debenture interest taxed as per your income slab\n\n*We recommend consulting your tax advisor for personalized guidance based on your specific situation.*',
    followUp: ['Investment Routes', 'How to Invest', 'Talk to Advisor'],
    priority: 6,
  },
  // ─── Fund Tenure ───
  {
    id: 'tenure',
    category: 'fund',
    keywords: ['tenure', 'duration', 'how long', 'lock in', 'period', 'years', 'exit'],
    response: '**Fund Tenure:**\n\n\u2022 **Direct AIF:** Typically 7\u201310 years with possible extension\n\u2022 **Debenture Route:** Flexible tenures available\n\nThe longer tenure allows us to:\n\u2022 Acquire stressed assets at deep discounts\n\u2022 Execute value creation strategies\n\u2022 Realize full potential of startup investments\n\u2022 Optimize exit timing for maximum returns',
    followUp: ['Exit Mechanisms', 'Returns', 'How to Invest'],
    priority: 6,
  },
  {
    id: 'exit',
    category: 'fund',
    keywords: ['exit', 'redeem', 'withdraw', 'get money', 'maturity', 'liquidation'],
    response: '**Exit Mechanisms:**\n\nExits are planned through:\n\u2022 **Real Estate:** Sale of developed/repositioned assets\n\u2022 **Startups:** Strategic sale, secondary sale, or IPO\n\u2022 **Debentures:** Maturity-based redemption\n\nOur fund structure ensures planned exits at optimal valuations. Your relationship manager will keep you informed about exit timelines.',
    followUp: ['Fund Tenure', 'Returns', 'Contact Advisor'],
    priority: 5,
  },
  // ─── NAV & Reporting ───
  {
    id: 'nav-reporting',
    category: 'fund',
    keywords: ['nav', 'report', 'reporting', 'update', 'statement', 'audit'],
    response: '**Reporting & Transparency:**\n\n\u2022 **Quarterly NAV Reports** sent to all investors\n\u2022 **Annual Audited Statements** by independent auditors\n\u2022 **Monthly Portfolio Updates** via investor portal\n\u2022 **Annual General Meeting** for all unitholders\n\nAs a SEBI-regulated fund, we maintain the highest standards of transparency and disclosure.',
    followUp: ['Downloads', 'Safety & Risk', 'SEBI Registration'],
    priority: 5,
  },
  // ─── PPM ───
  {
    id: 'ppm',
    category: 'compliance',
    keywords: ['ppm', 'placement', 'memorandum', 'prospectus', 'document', 'offer'],
    response: '**Private Placement Memorandum (PPM):**\n\nThe PPM is the detailed offering document that includes:\n\u2022 Fund structure & strategy\n\u2022 Fee structure & expenses\n\u2022 Risk factors\n\u2022 Terms & conditions\n\u2022 Legal framework\n\nYou can request the PPM through our Downloads page or by contacting our team. It\u2019s shared with prospective investors after initial consultation.',
    followUp: ['Downloads', 'Investment Process', 'Contact Info'],
    priority: 5,
  },
  // ─── Complaint ───
  {
    id: 'complaint',
    category: 'compliance',
    keywords: ['complaint', 'issue', 'problem', 'grievance', 'unhappy', 'concern'],
    response: 'I\u2019m sorry to hear you have a concern. Our team takes all grievances seriously.\n\n**Grievance Redressal:**\n\u2022 **Phone:** +91 44 2843 1043\n\u2022 **Email:** info@ghlindiaventures.com\n\u2022 **Office:** 2D, Queens Court, Egmore, Chennai\n\nAs a SEBI-registered entity, you can also escalate to **SEBI SCORES** at scores.gov.in.\n\nWe aim to resolve all complaints within **30 business days**.',
    followUp: ['Contact Info', 'SEBI Registration'],
    priority: 7,
  },
  // ─── Advisor / Human ───
  {
    id: 'human-advisor',
    category: 'contact',
    keywords: ['human', 'speak', 'advisor', 'talk to', 'person', 'real', 'agent', 'schedule', 'call'],
    response: 'Of course! Our advisors are ready to help.\n\n**Reach out via:**\n\u2022 **Call:** +91 72002 55252\n\u2022 **Email:** info@ghlindiaventures.com\n\u2022 **WhatsApp:** +91 72002 55252\n\nOr visit our **Contact page** to schedule a video consultation at your convenience.\n\nThey typically respond within **2 business hours**.',
    followUp: ['WhatsApp Chat', 'Contact Page', 'Email Us'],
    priority: 8,
  },
  // ─── Eligibility ───
  {
    id: 'eligibility',
    category: 'fund',
    keywords: ['eligible', 'qualify', 'who can', 'accredited', 'criteria', 'requirement'],
    response: '**Who Can Invest?**\n\n**Debenture Route (\u20B910L+):**\n\u2022 Salaried professionals\n\u2022 Self-employed individuals\n\u2022 Small business owners\n\u2022 Indian residents with valid PAN & KYC\n\n**Direct AIF Route (\u20B91Cr+):**\n\u2022 High Net Worth Individuals (HNIs)\n\u2022 Family Offices\n\u2022 Corporate treasuries\n\u2022 NRIs (subject to RBI guidelines)\n\u2022 Accredited investors',
    followUp: ['Debenture Route', 'Direct AIF Route', 'KYC Requirements'],
    priority: 7,
  },
  // ─── FD Comparison ───
  {
    id: 'fd-comparison',
    category: 'debenture',
    keywords: ['fd', 'fixed deposit', 'bank', 'compare', 'better than', 'mutual fund'],
    response: '**GHL Debenture vs Bank FD:**\n\n| Parameter | GHL Debenture | Bank FD |\n|---|---|---|\n| **Returns** | 12\u201315% p.a. | 6\u20137% p.a. |\n| **Min Amount** | \u20B910 Lakhs | \u20B91,000 |\n| **SEBI Regulated** | Yes | RBI |\n| **Asset Backed** | Real estate + startups | Bank guarantee |\n\nThe Debenture Route targets **nearly 2x the returns** of traditional FDs, with professional fund management.',
    followUp: ['Debenture Details', 'Risk Management', 'How to Start'],
    priority: 7,
  },
  // ─── Thank you / Bye ───
  {
    id: 'goodbye',
    category: 'general',
    keywords: ['bye', 'goodbye', 'thank', 'thanks', 'that\'s all', 'done', 'great'],
    response: 'Thank you for chatting with ARIA! \ud83d\ude4f\n\nIf you have more questions later, I\u2019m always here. You can also:\n\u2022 **Call:** +91 72002 55252\n\u2022 **Email:** info@ghlindiaventures.com\n\u2022 **Visit:** Our Contact page\n\nWishing you a great investment journey with GHL! \ud83d\ude80',
    followUp: ['Investment Routes', 'Contact Info'],
    priority: 3,
  },
  // ─── Downloads ───
  {
    id: 'downloads',
    category: 'general',
    keywords: ['download', 'brochure', 'pdf', 'document', 'guide', 'report'],
    response: '**Available Downloads:**\n\n\u2022 **Corporate Brochure** \u2014 Company overview & philosophy\n\u2022 **Investment Roadmap** \u2014 Fund strategy & milestones\n\u2022 **HNI Investment Guide** \u2014 How to invest in AIFs\n\u2022 **Annual Report 2024** \u2014 Performance & compliance\n\nVisit our **Downloads page** to access these documents.',
    followUp: ['Downloads Page', 'PPM Document', 'Contact Info'],
    priority: 5,
  },
  // ─── Blog / Learning ───
  {
    id: 'blog-learning',
    category: 'general',
    keywords: ['blog', 'article', 'read', 'learn', 'education', 'financial iq', 'knowledge'],
    response: 'We have great resources to build your financial knowledge:\n\n\u2022 **Blog** \u2014 15 articles on AIFs, real estate, startups, and investing\n\u2022 **Financial IQ** \u2014 Videos, glossary, calculators, and guides\n\u2022 **Webinars** \u2014 Live sessions with fund managers\n\nI recommend starting with our article on **AIF vs PMS** or **Debenture Investments for Salaried Professionals**.',
    followUp: ['Visit Blog', 'Financial IQ', 'Investment Routes'],
    priority: 5,
  },
]

// ─── Response Matching Engine ───
export function findBestResponse(
  input: string,
  _conversationHistory?: string[]
): { text: string; quickReplies: string[] } {
  const lower = input.toLowerCase().trim()

  // Greeting detection
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|namaste|howdy)[\s!.?]*$/i.test(lower)) {
    return {
      text: 'Hello! \ud83d\udc4b Welcome to GHL India Ventures. I\u2019m ARIA, your investment assistant.\n\nI can help you with:\n\u2022 Our investment routes (from \u20B910 Lakhs)\n\u2022 Fund details & performance\n\u2022 How to start investing\n\u2022 Connecting with an advisor\n\nWhat would you like to know?',
      quickReplies: ['Investment Routes', 'Minimum Investment', 'How to Invest', 'Talk to Advisor'],
    }
  }

  // Score each entry
  let bestMatch: KnowledgeEntry | null = null
  let bestScore = 0

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        score += keyword.length > 3 ? 2 : 1
      }
    }
    // Boost by priority
    score += entry.priority * 0.1

    if (score > bestScore) {
      bestScore = score
      bestMatch = entry
    }
  }

  if (bestMatch && bestScore > 1) {
    return {
      text: bestMatch.response,
      quickReplies: bestMatch.followUp,
    }
  }

  // Fallback
  return {
    text: 'That\u2019s a great question! Let me make sure I give you the right answer.\n\nI can help with:\n\u2022 Our **investment routes** (AIF & Debenture)\n\u2022 **Fund details** & performance\n\u2022 **How to start** investing\n\u2022 **SEBI registration** & safety\n\nOr I can connect you with a human advisor right away.',
    quickReplies: ['Investment Routes', 'How to Invest', 'Safety & Risk', 'Talk to Advisor'],
  }
}
