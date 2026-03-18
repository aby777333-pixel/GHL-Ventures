// ─────────────────────────────────────────────────────────────
// Voice AI Companion SDK — Investment Knowledge Layer
// Consolidated from chatKnowledge + avatarKnowledge + constants
// ─────────────────────────────────────────────────────────────

import type { KnowledgeEntry, BrandData, TeamMember, PortfolioCompany } from './types';

// ── Brand Data ───────────────────────────────────────────────

export const BRAND: BrandData = {
  name: 'GHL India Ventures',
  tagline: 'Investing in India\'s Future',
  sebiRegistration: 'IN/AIF2/2425/1517',
  phone: '+91 44 2843 1043',
  altPhone: '+91 7200 255 252',
  email: 'info@ghlindiaventures.com',
  whatsapp: '+917200255252',
  address: '2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai 600008',
  officeHours: 'Mon-Sat, 10:00 AM - 6:00 PM IST',
  minInvestmentAIF: 'As per SEBI AIF Regulations',
  minInvestmentDebenture: 'Contact for details',
};

// ── Team ─────────────────────────────────────────────────────

export const TEAM: TeamMember[] = [
  { name: 'Gopal H. Lakshmi', role: 'Managing Director & Founder', bio: 'Visionary leader with 25+ years in PE and alternative investments. Founded GHL India Ventures to democratize institutional-grade investing for Indian HNIs.' },
  { name: 'Venkatesh Ramachandran', role: 'Chief Investment Officer', bio: 'Former senior VP at a leading PE firm. Expert in stressed asset valuation and turnaround strategies. Manages the fund\'s core investment decisions.' },
  { name: 'Meenakshi Sundaram', role: 'Head of Real Estate', bio: 'NCLT and stressed real estate specialist with 20+ years of experience. Leads the fund\'s stressed asset recovery vertical.' },
  { name: 'Arvind Natarajan', role: 'Head of Startups', bio: 'Venture capital veteran who has backed 30+ startups. Leads the early-stage investment vertical with a focus on deep tech and consumer brands.' },
  { name: 'Priya Venkatesh', role: 'Chief Financial Officer', bio: 'Chartered Accountant with expertise in fund accounting, NAV computation, and regulatory compliance for AIFs.' },
  { name: 'Karthik Srinivasan', role: 'Head of Compliance', bio: 'SEBI compliance expert ensuring the fund adheres to all regulatory requirements. Manages investor reporting and governance frameworks.' },
];

// ── Portfolio ────────────────────────────────────────────────

export const PORTFOLIO: PortfolioCompany[] = [
  { name: 'Phoenix Realty Recovery', sector: 'Real Estate', description: 'NCLT-acquired residential project in Chennai. 340 units under recovery with projected 2.8x returns on invested capital.', year: 2024 },
  { name: 'Sunrise Towers Turnaround', sector: 'Real Estate', description: 'Stressed commercial asset in Hyderabad. Joint venture with a Tier-1 developer for completion and sale.', year: 2024 },
  { name: 'Metro Edge Properties', sector: 'Real Estate', description: 'Transit-oriented mixed-use development near upcoming metro stations. Targeting 22% IRR.', year: 2025 },
  { name: 'NeuraByte AI', sector: 'Technology', description: 'AI-powered enterprise automation startup. Series A investment with strong B2B traction in India and SE Asia.', year: 2024 },
  { name: 'GreenPulse Energy', sector: 'CleanTech', description: 'Renewable energy startup focused on solar micro-grids for tier-2 cities. Backed by government incentives.', year: 2024 },
  { name: 'FinStack Technologies', sector: 'FinTech', description: 'Digital lending infrastructure platform. Pre-Series B with 200+ NBFC clients and growing transaction volume.', year: 2025 },
];

// ── Knowledge Base ───────────────────────────────────────────

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // General
  { id: 'about', category: 'general', keywords: ['about', 'company', 'ghl', 'who', 'what is'], response: 'GHL India Ventures is a SEBI-registered Category II Alternative Investment Fund based in Chennai. We focus on two primary strategies: stressed real estate recovery through NCLT acquisitions, and early-stage startup investments. Our SEBI registration number is IN/AIF2/2425/1517.', followUp: ['What is an AIF?', 'Tell me about the team'], priority: 5, speaker: 'abe' },
  { id: 'sebi', category: 'compliance', keywords: ['sebi', 'registered', 'regulation', 'category ii', 'license'], response: 'We are registered with SEBI as a Category II AIF under registration number IN/AIF2/2425/1517. Category II AIFs include private equity funds, debt funds, and funds that do not fall under Category I or III. This means we are fully regulated and must comply with all SEBI guidelines for investor protection.', followUp: ['What does Category II mean?', 'How is my investment protected?'], priority: 5, speaker: 'abe' },
  { id: 'team', category: 'general', keywords: ['team', 'founder', 'management', 'who runs', 'leadership'], response: 'Our team is led by Gopal H. Lakshmi, our Managing Director and Founder, with 25+ years in PE. Our CIO Venkatesh Ramachandran manages investment decisions, Meenakshi Sundaram heads Real Estate, and Arvind Natarajan leads our Startup vertical. We also have Priya Venkatesh as CFO and Karthik Srinivasan heading Compliance.', followUp: ['Tell me more about the founder', 'How experienced is the team?'], priority: 4, speaker: 'abe' },

  // Fund Structure
  { id: 'aif_explain', category: 'fund', keywords: ['aif', 'alternative investment fund', 'what is aif'], response: 'An Alternative Investment Fund or AIF is a privately pooled investment vehicle regulated by SEBI. Unlike mutual funds, AIFs are designed for sophisticated investors and can invest in a wider range of assets including private equity, real estate, and startups. They require higher minimum investments but can potentially deliver higher returns.', followUp: ['How is it different from mutual funds?', 'What is the minimum investment?'], priority: 5, speaker: 'abe' },
  { id: 'fund_structure', category: 'fund', keywords: ['fund', 'structure', 'how does fund work', 'fund details'], response: 'Our fund operates through two routes. The Direct AIF Route, as per SEBI AIF Regulations, gives you direct exposure to our portfolio of stressed assets and startups, targeting 15-25% IRR. The SEBI Co-Invest Framework offers a structured entry for professionals with attractive risk-adjusted returns. Both are SEBI-regulated.', followUp: ['Compare the two routes', 'Which one is right for me?'], priority: 5, speaker: 'abe' },

  // Investment Routes
  { id: 'debenture', category: 'debenture', keywords: ['debenture', 'co-invest', 'co invest', 'sebi co-invest', 'ncd', 'fixed income'], response: 'Our SEBI Co-Invest Framework is designed for professionals seeking structured exposure to our fund strategies. It offers attractive risk-adjusted returns with a structured entry point. Contact our team for current investment details and eligibility.', followUp: ['How is this different from FD?', 'Is my capital safe?'], priority: 5, speaker: 'tina' },
  { id: 'direct_aif', category: 'aif', keywords: ['direct aif', 'category ii', 'direct route', 'aif route'], response: 'The Direct AIF Route is our flagship offering for HNIs. As per SEBI AIF Regulations, you get direct exposure to our diversified portfolio of stressed real estate recoveries and high-growth startups. We target 15-25% IRR over a 5-7 year period. Your investment is managed by our experienced team of PE professionals.', followUp: ['What is the lock-in period?', 'How are returns distributed?'], priority: 5, speaker: 'abe' },
  { id: 'compare', category: 'fund', keywords: ['compare', 'difference', 'which is better', 'vs', 'comparison'], response: 'The key differences: The Direct AIF Route, as per SEBI AIF Regulations, targets 15-25% IRR over 5-7 years with direct portfolio exposure. The SEBI Co-Invest Framework offers structured returns with shorter tenures and a more accessible entry. AIF is for growth-seeking HNIs; Co-Invest is for professionals seeking steady returns. Contact our team for details.', followUp: ['Which one is right for me?', 'Can I invest in both?'], priority: 5, speaker: 'abe' },

  // Returns & Risk
  { id: 'returns', category: 'fund', keywords: ['returns', 'irr', 'expected return', 'performance', 'yield', 'profit'], response: 'Our target returns vary by route. The Direct AIF targets 15-25% IRR over the fund lifecycle, primarily driven by stressed asset recovery and startup exits. The SEBI Co-Invest Framework offers attractive risk-adjusted returns through structured instruments. Past performance is not indicative of future results, but our portfolio is structured for optimal risk-adjusted returns.', followUp: ['How does this compare to FD?', 'What if the fund underperforms?'], priority: 4, speaker: 'abe' },
  { id: 'risk', category: 'fund', keywords: ['risk', 'risky', 'safe', 'safety', 'lose money', 'secure', 'guarantee'], response: 'All investments carry risk, and we take risk management very seriously. Our stressed real estate portfolio has built-in protection through NCLT-process discounts. Debentures are secured against fund assets. We follow SEBI-mandated risk disclosure frameworks and provide quarterly reporting. However, we cannot guarantee returns, as per SEBI regulations.', followUp: ['How do you manage risk?', 'What happens if the fund fails?'], priority: 4, speaker: 'abe' },

  // Process
  { id: 'how_to_invest', category: 'process', keywords: ['how to invest', 'get started', 'invest', 'begin', 'process', 'steps'], response: 'Getting started is simple. Step 1: Schedule a consultation call with our team. Step 2: We assess your profile and recommend the right route. Step 3: Complete KYC documentation. Step 4: Sign the subscription agreement. Step 5: Transfer funds and receive your investment confirmation. The entire process typically takes 5-7 business days.', followUp: ['What documents do I need?', 'Schedule a call'], priority: 5, speaker: 'tina' },
  { id: 'minimum', category: 'fund', keywords: ['minimum', 'minimum investment', 'how much', 'entry amount', 'starting amount'], response: 'We offer two entry points. The Direct AIF Route minimum is as per SEBI AIF Regulations for Category II AIFs. We also offer the SEBI Co-Invest Framework for professionals seeking a structured entry point. Both routes are SEBI-regulated. Contact our team for current details.', followUp: ['Tell me about the Co-Invest Framework', 'How do I get started?'], priority: 5, speaker: 'tina' },
  { id: 'kyc', category: 'process', keywords: ['kyc', 'documents', 'documentation', 'paperwork'], response: 'For KYC, you will need: PAN card, Aadhaar card, address proof, bank account details with cancelled cheque, passport-size photos, and net worth certificate from a CA for AIF investment. For the SEBI Co-Invest Framework, the documentation is simpler. Our team will guide you through every step.', followUp: ['How long does KYC take?', 'Can I do this online?'], priority: 3, speaker: 'tina' },

  // Real Estate & Startups
  { id: 'real_estate', category: 'portfolio', keywords: ['real estate', 'property', 'stressed asset', 'nclt', 'distressed'], response: 'Our real estate strategy focuses on acquiring stressed properties through the NCLT (National Company Law Tribunal) process at significant discounts, typically 40-60% below market value. We then work with tier-1 developers to complete and sell these projects, targeting 2-3x returns on invested capital. This strategy has inherent downside protection built into the acquisition price.', followUp: ['Give me an example', 'What is NCLT?'], priority: 4, speaker: 'abe' },
  { id: 'startups', category: 'portfolio', keywords: ['startup', 'early stage', 'venture', 'tech'], response: 'Our startup portfolio focuses on Series A and pre-Series B companies in AI, CleanTech, and FinTech. We look for strong founding teams, proven product-market fit, and clear paths to profitability. Current investments include NeuraByte AI in enterprise automation, GreenPulse Energy in solar micro-grids, and FinStack Technologies in digital lending infrastructure.', followUp: ['Tell me about NeuraByte', 'What is the startup allocation?'], priority: 3, speaker: 'abe' },

  // Comparisons
  { id: 'fd_compare', category: 'fund', keywords: ['fixed deposit', 'fd', 'bank', 'mutual fund', 'better than fd', 'pms'], response: 'Compared to FDs yielding 6-7%, our SEBI Co-Invest Framework offers attractive returns and our AIF targets 15-25% IRR. Unlike mutual funds, AIFs can access private market opportunities. Compared to PMS, our AIF offers more diversified strategies. Contact our team for current return targets.', followUp: ['Is it worth the risk?', 'What about liquidity?'], priority: 3, speaker: 'abe' },

  // Other
  { id: 'tenure', category: 'fund', keywords: ['tenure', 'lock in', 'how long', 'duration', 'period', 'maturity'], response: 'The Direct AIF has a typical tenure of 5-7 years with potential extension. The SEBI Co-Invest Framework has shorter tenures. For the AIF, partial exits may be possible after 3 years depending on portfolio liquidity. The Co-Invest Framework offers more predictable maturity dates. Contact our team for details.', followUp: ['Can I exit early?', 'What happens at maturity?'], priority: 3, speaker: 'abe' },
  { id: 'nri', category: 'process', keywords: ['nri', 'non resident', 'abroad', 'overseas', 'international'], response: 'Yes, NRIs can invest in our fund subject to FEMA regulations. The process involves additional documentation including NRE/NRO account details and FIPB approval for certain routes. Our compliance team specializes in NRI investments and will guide you through the regulatory requirements.', followUp: ['What documents do NRIs need?', 'Which account should I use?'], priority: 3, speaker: 'tina' },
  { id: 'tax', category: 'compliance', keywords: ['tax', 'taxation', 'capital gains', 'tax benefit'], response: 'AIF investments have pass-through taxation, meaning gains are taxed at the investor level, not the fund level. Long-term capital gains on equity exits attract 12.5% tax after 1 year. Real estate gains follow standard LTCG provisions. Co-invest returns are taxed as per your income slab. We recommend consulting your tax advisor for personalized guidance.', followUp: ['Do you provide tax certificates?', 'What about TDS?'], priority: 3, speaker: 'abe' },
  { id: 'contact', category: 'contact', keywords: ['contact', 'reach', 'office', 'address', 'location', 'get in touch'], response: 'You can reach us at our Chennai office: 2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai 600008. Call us at +91 44 2843 1043 or +91 7200 255 252. Email: info@ghlindiaventures.com. Office hours: Mon-Sat, 10 AM - 6 PM IST. Or WhatsApp us anytime!', followUp: ['WhatsApp us', 'Schedule a call'], priority: 4, speaker: 'tina', actions: [{ type: 'whatsapp' }] },
  { id: 'eligibility', category: 'process', keywords: ['eligible', 'who can invest', 'can i invest', 'qualification', 'hni'], response: 'For the Direct AIF, minimum investment is as per SEBI AIF Regulations, suitable for High Net Worth Individuals. The SEBI Co-Invest Framework offers a more accessible entry for professionals. Both Indian residents and NRIs can invest. There is no maximum age limit. Institutional investors are also welcome.', followUp: ['Am I eligible?', 'What is an HNI?'], priority: 3, speaker: 'tina' },
];

// ── Investment Knowledge Manager ─────────────────────────────

export class InvestmentKnowledge {
  private entries: KnowledgeEntry[];

  constructor(additionalEntries?: KnowledgeEntry[]) {
    this.entries = [...KNOWLEDGE_BASE, ...(additionalEntries || [])];
  }

  findResponse(input: string): { entry: KnowledgeEntry; confidence: number; followUps: string[] } | null {
    const lower = input.toLowerCase();
    let bestEntry: KnowledgeEntry | null = null;
    let bestScore = 0;

    for (const entry of this.entries) {
      let score = 0;
      for (const keyword of entry.keywords) {
        if (lower.includes(keyword)) {
          score += keyword.length * entry.priority;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    if (bestEntry && bestScore > 5) {
      return {
        entry: bestEntry,
        confidence: Math.min(bestScore / 30, 1.0),
        followUps: bestEntry.followUp,
      };
    }
    return null;
  }

  getBrandData(): BrandData {
    return { ...BRAND };
  }

  getTeam(): TeamMember[] {
    return [...TEAM];
  }

  getPortfolio(): PortfolioCompany[] {
    return [...PORTFOLIO];
  }

  buildSystemPromptContext(): string {
    return `BRAND: ${BRAND.name} - SEBI Reg: ${BRAND.sebiRegistration}
Office: ${BRAND.address} | Phone: ${BRAND.altPhone} | Email: ${BRAND.email}
Hours: ${BRAND.officeHours}

INVESTMENT ROUTES:
1. Direct AIF: ${BRAND.minInvestmentAIF}, 15-25% target IRR, 5-7 year tenure, stressed real estate + startups
2. SEBI Co-Invest Framework: ${BRAND.minInvestmentDebenture}, structured returns, SEBI-regulated

TEAM: ${TEAM.map(m => `${m.name} (${m.role})`).join(', ')}

PORTFOLIO: ${PORTFOLIO.map(p => `${p.name} - ${p.sector}`).join(', ')}

KEY FACTS:
- Category II AIF under SEBI
- Founded in Chennai, operational since 2024
- Stressed real estate: NCLT acquisitions at 40-60% discount
- Startup focus: AI, CleanTech, FinTech (Series A / pre-Series B)
- Pass-through taxation at investor level
- Quarterly NAV reporting to investors`;
  }

  getEntries(category?: string): KnowledgeEntry[] {
    if (!category) return [...this.entries];
    return this.entries.filter(e => e.category === category);
  }

  addEntry(entry: KnowledgeEntry): void {
    this.entries.push(entry);
  }
}
