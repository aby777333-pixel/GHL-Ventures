/* ─────────────────────────────────────────────────────────────
   GHL Sarvam — Knowledge Base

   Compact KB tuned for the multilingual Sarvam concierge.
   The same knowledge surface is shown to website visitors
   (via the side widget) and to staff supervisors in the
   "GHL Sarvam" tab. Keep entries short — they may be played
   back as speech in 11+ Indian languages.
   ───────────────────────────────────────────────────────────── */

export interface SarvamKBEntry {
  id: string
  category: 'fund' | 'aif' | 'co-invest' | 'process' | 'returns' | 'risk' | 'tax' | 'support'
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
    answer: 'Namaste! I am GHL Sarvam — your multilingual investment assistant. I can answer questions about our SEBI-registered AIF and Co-Invest Framework in 11+ Indian languages. Press the speaker icon to hear any reply aloud.',
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
