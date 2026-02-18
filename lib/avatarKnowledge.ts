// GHL India Ventures Knowledge Base & Rule-Based Response Engine

export interface AvatarResponse {
  speaker: 'abe' | 'tina'
  text: string
  action?: 'navigate' | 'quiz' | 'calculator' | 'whatsapp' | 'call' | 'email' | 'form'
  actionData?: string
}

// Intent classification via phrase matching with priority
type Intent =
  | 'greeting' | 'thanks' | 'goodbye'
  | 'about_company' | 'about_fund' | 'about_sebi' | 'about_team'
  | 'investment_start' | 'minimum_investment' | 'returns' | 'risk'
  | 'real_estate' | 'startups' | 'portfolio' | 'debenture'
  | 'nri' | 'tax' | 'kyc' | 'documents'
  | 'navigate' | 'contact' | 'whatsapp' | 'call' | 'email' | 'human'
  | 'blog' | 'read_page' | 'summarize' | 'show_around' | 'quiz' | 'calculator'
  | 'confidential' | 'distress' | 'ask_question'
  | 'joke' | 'who_are_you' | 'what_can_you_do' | 'help'
  | 'unknown'

interface IntentRule {
  intent: Intent
  phrases: string[]    // exact phrase matches — checked first, highest priority
  keywords: string[]   // single keyword matches — checked second
}

// Rules checked top-to-bottom. First phrase match wins. This order is critical.
const INTENT_RULES: IntentRule[] = [
  // ── High-priority phrase-based intents (checked FIRST) ──
  { intent: 'read_page', phrases: ['read this page', 'read this', 'read the page', 'read page', 'read aloud', 'read it to me', 'read out', 'read for me', 'read to me', 'what does this page say', 'read what is on this page'], keywords: [] },
  { intent: 'summarize', phrases: ['summarize', 'summarise', 'summary', 'sum up', 'give me a summary', 'summarize this', 'summarize this page', 'tell me about this page', 'what is this page about', 'what is on this page', 'what is here', 'explain this page'], keywords: [] },
  { intent: 'show_around', phrases: ['show me around', 'tour', 'give me a tour', 'walk me through', 'explore the site', 'show me the site', 'what can i find here', 'what sections do you have', 'site tour'], keywords: [] },
  { intent: 'what_can_you_do', phrases: ['what can you do', 'what do you do', 'what are your capabilities', 'how can you help', 'what features', 'what can i ask'], keywords: [] },
  { intent: 'who_are_you', phrases: ['who are you', 'what is your name', 'tell me about yourself', 'introduce yourself', 'are you ai', 'are you a bot', 'are you real'], keywords: [] },
  { intent: 'help', phrases: ['help me', 'i need help', 'can you help', 'assist me', 'help please'], keywords: [] },
  { intent: 'ask_question', phrases: ['ask a question', 'i have a question', 'let me ask', 'can i ask'], keywords: [] },
  { intent: 'joke', phrases: ['tell me a joke', 'make me laugh', 'say something funny', 'joke'], keywords: [] },
  { intent: 'investment_start', phrases: ['help me invest', 'start investing', 'how to invest', 'want to invest', 'get started', 'begin investing', 'interested in investing', 'i want to invest'], keywords: [] },
  { intent: 'minimum_investment', phrases: ['minimum investment', 'how much to invest', 'ticket size', 'minimum amount', 'starting amount', 'least amount', 'entry amount', 'how much do i need'], keywords: ['minimum'] },
  { intent: 'about_company', phrases: ['about the company', 'about ghl', 'tell me about ghl', 'what is ghl', 'about you', 'your company'], keywords: [] },
  { intent: 'about_fund', phrases: ['what is aif', 'explain aif', 'alternative investment fund', 'category ii', 'category 2', 'about the fund', 'fund details', 'tell me about the fund'], keywords: ['aif'] },
  { intent: 'about_sebi', phrases: ['sebi registered', 'sebi registration', 'is it regulated', 'is it safe', 'is it legitimate', 'is it legal'], keywords: ['sebi'] },
  { intent: 'quiz', phrases: ['risk quiz', 'risk assessment', 'take the quiz', 'investor quiz', 'my risk profile', 'risk profile'], keywords: [] },
  { intent: 'calculator', phrases: ['investment calculator', 'calculate returns', 'return calculator', 'how much will i earn', 'calculate', 'returns calculator'], keywords: [] },
  { intent: 'debenture', phrases: ['debenture route', 'debenture option', '10 lakh route', 'ncd route', 'lower entry', 'smaller investment'], keywords: ['debenture', 'ncd'] },
  { intent: 'navigate', phrases: ['go to', 'take me to', 'navigate to', 'open the', 'visit the', 'show me the', 'go home', 'go back'], keywords: [] },
  { intent: 'human', phrases: ['talk to a human', 'talk to someone', 'real person', 'speak to someone', 'human agent', 'talk to an advisor', 'connect me'], keywords: [] },
  { intent: 'contact', phrases: ['contact details', 'office address', 'where is your office', 'office location', 'your address', 'how to reach you'], keywords: [] },
  { intent: 'whatsapp', phrases: ['chat on whatsapp', 'open whatsapp', 'whatsapp me', 'send whatsapp'], keywords: ['whatsapp'] },
  { intent: 'real_estate', phrases: ['real estate', 'stressed real estate', 'nclt resolution', 'distressed property', 'montieth square', 'nungambakkam', 'coimbatore gateway'], keywords: ['nclt', 'montieth', 'nungambakkam'] },

  // ── Lower-priority keyword-only intents ──
  { intent: 'greeting', phrases: ['good morning', 'good afternoon', 'good evening'], keywords: ['hello', 'hi', 'hey', 'namaste', 'vanakkam'] },
  { intent: 'thanks', phrases: [], keywords: ['thank', 'thanks', 'dhanyavaad', 'nandri', 'shukriya', 'gracias', 'merci'] },
  { intent: 'goodbye', phrases: ['see you', 'good bye'], keywords: ['bye', 'goodbye', 'alvida', 'adios'] },
  { intent: 'about_team', phrases: ['about the team', 'who manages'], keywords: ['leadership', 'founders', 'management'] },
  { intent: 'returns', phrases: ['expected returns', 'how much earn'], keywords: ['returns', 'profit', 'gains', 'yield', 'irr', 'performance'] },
  { intent: 'risk', phrases: ['lose money', 'is it risky'], keywords: ['risk'] },
  { intent: 'startups', phrases: ['early stage', 'startup investments'], keywords: ['startup', 'finstack', 'medbridge', 'greengrid', 'venture'] },
  { intent: 'portfolio', phrases: ['current investments', 'where invested'], keywords: ['portfolio', 'holdings', 'companies'] },
  { intent: 'nri', phrases: ['non resident', 'nri investor'], keywords: ['nri', 'nro', 'nre', 'overseas'] },
  { intent: 'tax', phrases: ['capital gains', 'tax benefit'], keywords: ['tax', 'taxation', 'ltcg', 'stcg'] },
  { intent: 'kyc', phrases: ['know your customer', 'documents needed'], keywords: ['kyc', 'aadhaar'] },
  { intent: 'documents', phrases: [], keywords: ['brochure', 'ppm', 'factsheet', 'download'] },
  { intent: 'call', phrases: [], keywords: ['call', 'phone', 'ring', 'dial'] },
  { intent: 'email', phrases: ['send email', 'write to'], keywords: ['email'] },
  { intent: 'blog', phrases: ['read blog'], keywords: ['blog', 'article', 'insights'] },
  { intent: 'confidential', phrases: ['net asset value', 'performance data', 'actual returns', 'specific returns', 'fund returns'], keywords: [] },
  { intent: 'distress', phrases: ['dont understand', 'help me please'], keywords: ['frustrated', 'angry', 'upset', 'confused'] },
  // 'invest' standalone keyword — ONLY matches if no phrase above matched first
  { intent: 'investment_start', phrases: [], keywords: ['invest'] },
]

function classifyIntent(input: string): Intent {
  // Strip emojis and punctuation, lowercase
  const lower = input.toLowerCase().replace(/[^\w\s]/g, '').trim()

  // Phase 1: Exact phrase matches (highest priority, first match wins)
  for (const rule of INTENT_RULES) {
    for (const phrase of rule.phrases) {
      if (lower.includes(phrase)) {
        return rule.intent
      }
    }
  }

  // Phase 2: Keyword matches — longest keyword wins
  let bestMatch: Intent = 'unknown'
  let bestLen = 0
  for (const rule of INTENT_RULES) {
    for (const kw of rule.keywords) {
      // Short keywords (<=3 chars) require word boundary
      if (kw.length <= 3) {
        const regex = new RegExp('\\b' + kw + '\\b', 'i')
        if (regex.test(lower) && kw.length > bestLen) {
          bestLen = kw.length
          bestMatch = rule.intent
        }
      } else if (lower.includes(kw) && kw.length > bestLen) {
        bestLen = kw.length
        bestMatch = rule.intent
      }
    }
  }

  return bestMatch
}

// Navigation targets
const NAV_TARGETS: Record<string, string> = {
  'home': '/', 'about': '/about', 'fund': '/fund', 'blog': '/blog',
  'contact': '/contact', 'portfolio': '/portfolio', 'download': '/downloads',
  'financial': '/financial-iq', 'debenture': '/fund/debenture-route',
  'direct': '/fund/direct-aif', 'login': '/login', 'register': '/register',
}

function findNavTarget(input: string): string | null {
  const lower = input.toLowerCase()
  for (const [key, path] of Object.entries(NAV_TARGETS)) {
    if (lower.includes(key)) return path
  }
  return null
}

// Extract readable page content from the DOM
function extractPageContent(): string {
  if (typeof document === 'undefined') return ''
  const selectors = [
    'h1', 'h2', 'h3',
    'main p', 'section p', 'article p',
    '[class*="hero"] p', '[class*="section"] p',
    '[class*="description"]', '[class*="subtitle"]',
  ]
  const seen = new Set<string>()
  const content: string[] = []
  for (const sel of selectors) {
    document.querySelectorAll(sel).forEach(el => {
      const text = el.textContent?.trim() || ''
      if (text.length < 15 || text.length > 300) return
      const parent = el.closest('footer, nav, [class*="footer"], [class*="disclaimer"], [class*="cookie"], [class*="toast"]')
      if (parent) return
      if (!seen.has(text)) {
        seen.add(text)
        content.push(text)
      }
    })
  }
  return content.slice(0, 10).join('. ').substring(0, 800)
}

// Page-context-aware greeting variations
const PAGE_GREETINGS: Record<string, { abe: string; tina: string }> = {
  'home': {
    abe: 'Welcome to GHL India Ventures! I\'m Abe — your guide to smart investing. What would you like to explore?',
    tina: 'Hey there! I\'m Tina. Whether you\'re just curious or ready to invest, we\'ve got you covered!',
  },
  'about': {
    abe: 'You\'re on our About page — the story behind GHL India Ventures. 25+ years of trust and track record. Any questions about our team or history?',
    tina: 'Great choice checking us out! Ask me anything about our leadership, our journey, or our Chennai headquarters.',
  },
  'fund': {
    abe: 'Welcome to the Fund Overview. This is where we break down our SEBI-registered Category II AIF structure. What would you like to understand?',
    tina: 'You\'re exploring our fund options! We have the Direct AIF at ₹1 Crore and the Debenture Route from ₹10 Lakhs. Which interests you?',
  },
  'portfolio': {
    abe: 'You\'re viewing our Portfolio — 6 active investments across stressed real estate and startups. Ask me about any specific project.',
    tina: 'Our portfolio is exciting! From Montieth Square to FinStack Technologies — each one has a story. Want details on any of them?',
  },
  'blog': {
    abe: 'Welcome to our Insights section. We publish thought leadership on AIFs, market trends, and investment strategies. Want me to recommend an article?',
    tina: 'Love that you\'re reading our blog! We cover everything from AIF taxation to market analysis. What topic interests you?',
  },
  'contact': {
    abe: 'You\'re on the Contact page. Our Chennai office is at Montieth Road, Egmore. We\'re here Mon-Sat, 10 AM to 6 PM IST.',
    tina: 'Want to reach us? Call +91 7200 255 252, WhatsApp us, or fill out the form below. We respond within 24 hours!',
  },
  'downloads': {
    abe: 'Here are all our investor resources — brochures, factsheets, and the PPM. Everything is downloadable as PDF.',
    tina: 'Perfect page for due diligence! Download our fund brochure, presentation deck, or compliance documents.',
  },
  'financial-iq': {
    abe: 'Welcome to Financial IQ — our learning center. We break down complex investment concepts into simple language.',
    tina: 'This is my favourite section! Glossary terms, video lessons, and tools to make you a smarter investor.',
  },
  'debenture': {
    abe: 'You\'re exploring the Debenture Route — our structured entry point starting at ₹10 Lakhs. Great for salaried professionals.',
    tina: 'The Debenture Route is perfect if you want to start smaller! Let me explain how it works.',
  },
  'direct-aif': {
    abe: 'This is our Direct AIF Route — the full fund experience for HNIs and family offices. Minimum ₹1 Crore, SEBI-regulated.',
    tina: 'The Direct AIF gives you the complete institutional experience. Want to know about the process?',
  },
}

export function generateResponse(input: string, visitorName?: string, pageContext?: string): AvatarResponse[] {
  const intent = classifyIntent(input)
  const name = visitorName ? ` ${visitorName}` : ''
  const page = pageContext || 'home'

  switch (intent) {
    case 'greeting': {
      const ctx = PAGE_GREETINGS[page] || PAGE_GREETINGS['home']
      return [{ speaker: 'abe', text: `Hello${name}! ${ctx.abe}` }]
    }

    case 'thanks':
      return [{ speaker: 'tina', text: `You're most welcome${name}! That's what we're here for. Anything else you'd like to know?` }]

    case 'goodbye':
      return [
        { speaker: 'abe', text: `It was wonderful talking to you${name}. Remember, smart investing is a marathon, not a sprint.` },
        { speaker: 'tina', text: `Take care! We'll be right here whenever you're ready to take the next step.` }
      ]

    case 'show_around':
      return [
        { speaker: 'abe', text: `Great${name}! Let me walk you through what we have here. GHL India Ventures is a SEBI-registered Category II AIF based in Chennai. We focus on stressed real estate recovery and early-stage startups.` },
        { speaker: 'tina', text: `Here's what you can explore: Our Fund page explains our AIF structure and investment routes. Portfolio shows our 6 active investments. Blog has expert insights on markets and AIFs. Financial IQ is our learning center. And Contact gets you straight to our team. Where would you like to start?` }
      ]

    case 'what_can_you_do':
      return [
        { speaker: 'abe', text: `I'm Abe, and together with Tina, we can help you in many ways. We can explain what an AIF is, walk you through our fund structure, read any page aloud in your language, or guide you to the right section.` },
        { speaker: 'tina', text: `I can also open our Risk Assessment Quiz, Investment Calculator, connect you to our team on WhatsApp, or summarize any page for you. Just ask naturally — I understand voice commands too!` }
      ]

    case 'who_are_you':
      return [
        { speaker: 'abe', text: `I'm Abe — your investment guide at GHL India Ventures. I'm here to answer questions about our fund, explain investment concepts, and help you navigate this website.` },
        { speaker: 'tina', text: `And I'm Tina! Think of us as your friendly concierge team. We're AI-powered, but we have deep knowledge about GHL India Ventures, AIFs, and investing in India. Ask us anything!` }
      ]

    case 'help':
      return [
        { speaker: 'abe', text: `Of course${name}! Here's what I can help with: explain our fund structure, read this page aloud, answer investment questions, guide you to any section, or connect you with our human team.` },
        { speaker: 'tina', text: `Try saying things like "Read this page", "Help me invest", "What is an AIF?", "Show me the portfolio", or "Talk to a human". I understand natural language!` }
      ]

    case 'ask_question':
      return [{ speaker: 'abe', text: `Go ahead${name}! You can ask me anything — about our fund, investment process, SEBI registration, returns, risk, or even general financial concepts. I'm all ears.` }]

    case 'joke':
      return [{ speaker: 'tina', text: `Why don't investors ever get lost? Because they always follow the returns! But seriously${name}, I'm here to help you with your investment journey. What would you like to know?` }]

    case 'about_company':
      return [{ speaker: 'abe', text: `GHL India Ventures is a SEBI-registered Category II Alternative Investment Fund (AIF), headquartered in Egmore, Chennai. We focus on two high-potential sectors: recovering stressed real estate through NCLT/IBC resolution, and backing early-stage Indian startups in fintech, healthtech, and cleantech. With 25+ years of combined leadership experience and over ₹500 Cr in value created, we're building India's future — one smart investment at a time.` }]

    case 'about_fund':
      return [
        { speaker: 'abe', text: `Great question${name}! An AIF — Alternative Investment Fund — is like a premium investment club. You pool your capital with other smart investors, and our expert team deploys it into carefully vetted opportunities. Think of it as having a dedicated team of analysts, lawyers, and sector experts working for your money.` },
        { speaker: 'tina', text: `We're a Category II AIF, which means we invest in real assets and companies — not just derivatives or speculation. Everything is regulated by SEBI, so your investment has institutional-grade governance. Would you like to explore our fund page?` }
      ]

    case 'about_sebi':
      return [{ speaker: 'abe', text: `Absolutely — your security comes first. GHL India Ventures is registered with SEBI under Registration No. IN/AIF2/2425/1517. This means mandatory quarterly audits, third-party custodial safeguards, transparent NAV reporting, and strict compliance with AIF regulations. Your money is in an institutionally governed vehicle, not a personal account.` }]

    case 'about_team':
      return [{ speaker: 'tina', text: `Our leadership team brings over 25 years of combined experience across private equity, real estate, and venture capital. They've analyzed over 1,000 pitch decks and created more than ₹500 Cr in value. Want me to take you to our About page for full details?` }]

    case 'investment_start':
      return [
        { speaker: 'abe', text: `Wonderful${name}! I'd love to help you get started. We have two investment routes: the Direct AIF at ₹1 Crore for the full institutional experience, and the Debenture Route starting at ₹10 Lakhs for a structured entry. Which sounds right for you?` },
        { speaker: 'tina', text: `Not sure which route to pick? Try our Risk Assessment Quiz — it takes just 7 questions to find your ideal investment path. Or I can take you straight to the Fund page for full details!` }
      ]

    case 'minimum_investment':
      return [{ speaker: 'abe', text: `For our main AIF, the minimum investment is ₹1 Crore — that's the SEBI-mandated minimum for Category II AIFs. However, if you're looking for a lower entry point, our Debenture Route starts at just ₹10 Lakhs. Both are excellent options depending on your situation. Want me to explain the difference?` }]

    case 'returns':
      return [{ speaker: 'abe', text: `I appreciate you asking about returns${name}! As a responsible advisor, I must note that specific fund performance data is available to registered investors after KYC verification. What I can tell you is that our stressed real estate strategy targets significant value creation through deep-discount NCLT acquisitions, and our startup portfolio is built for high-growth potential. Would you like to use our Investment Calculator to model different scenarios?`, action: 'calculator' }]

    case 'risk':
      return [{ speaker: 'abe', text: `I respect your caution${name} — being careful with your money is exactly the right mindset. Every investment we make goes through 360-degree forensic diligence. We're SEBI-registered with strict quarterly audits and third-party custodians. Our multi-layered risk management framework includes stress testing, diversification across sectors, and engineered exit pathways. Would you like to take our Risk Assessment Quiz to understand your own risk profile?`, action: 'quiz' }]

    case 'real_estate':
      return [
        { speaker: 'abe', text: `Our stressed real estate strategy is where we find the most compelling value. We acquire distressed properties at 40-60% discounts through NCLT/IBC resolution processes, revitalize them, and generate returns for our investors.` },
        { speaker: 'tina', text: `Our current projects include Montieth Square Residences (120-unit revival in Egmore), Nungambakkam Heights (premium Grade-A office tower), and Coimbatore Gateway (mixed-use township). Want to see them in detail?`, action: 'navigate', actionData: '/portfolio' }
      ]

    case 'startups':
      return [
        { speaker: 'abe', text: `We back promising Indian startups across three key sectors — fintech, healthtech, and cleantech. Each undergoes rigorous forensic diligence before we invest.` },
        { speaker: 'tina', text: `Currently, we've invested in FinStack Technologies (AI-powered MSME lending), MedBridge Health (rural telemedicine in Tamil Nadu), and GreenGrid Logistics (electric last-mile delivery). Exciting stuff!`, action: 'navigate', actionData: '/portfolio' }
      ]

    case 'portfolio':
      return [{ speaker: 'tina', text: `Let me take you to our portfolio page where you can see all our current investments across real estate and startups!`, action: 'navigate', actionData: '/portfolio' }]

    case 'debenture':
      return [{ speaker: 'abe', text: `The Debenture Route is our lower-entry option starting at just ₹10 Lakhs. It's a Non-Convertible Debenture (NCD) structure that offers exposure to our stressed real estate recovery pipeline with a more accessible investment size. Want me to show you the details?`, action: 'navigate', actionData: '/fund/debenture-route' }]

    case 'nri':
      return [
        { speaker: 'abe', text: `Absolutely${name}! NRIs can invest through their NRO account. We handle all documentation and FEMA/RBI compliance for you.` },
        { speaker: 'tina', text: `Our team has experience onboarding NRI investors from the US, UK, UAE, Singapore, and Australia. We can even schedule a call in your timezone. Shall I connect you with our team?` }
      ]

    case 'tax':
      return [{ speaker: 'abe', text: `Tax implications for AIF investments depend on your residency status and holding period. As Category II AIF, the income is taxed in the hands of the investor as pass-through. I'd recommend consulting with your tax advisor for specifics. Want me to connect you with our team?` }]

    case 'kyc':
      return [{ speaker: 'tina', text: `For KYC, you'll typically need: PAN card, Aadhaar, proof of address, bank statement (last 6 months), a passport-size photo, and income proof/net worth certificate. For NRIs, additional documents like passport and NRO account details are needed. Don't worry — we guide you through every step!` }]

    case 'documents':
      return [{ speaker: 'tina', text: `I can take you to our Downloads page where you'll find our fund brochure, PPM, factsheets, and investor presentations. Let's go!`, action: 'navigate', actionData: '/downloads' }]

    case 'navigate': {
      const target = findNavTarget(input)
      if (target) {
        return [{ speaker: 'tina', text: `Taking you there right now!`, action: 'navigate', actionData: target }]
      }
      return [{ speaker: 'tina', text: `I can take you to any page — Home, About, Fund, Blog, Portfolio, Downloads, Contact, Financial IQ, or our investment tools. Just tell me which one!` }]
    }

    case 'contact':
      return [{ speaker: 'tina', text: `Our office is at 2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai — 600008. Office hours: Mon-Sat, 10 AM - 6 PM IST. Phone: +91 44 2843 1043 / +91 7200 255 252. Email: info@ghlindiaventures.com. Want me to take you to the contact page?`, action: 'navigate', actionData: '/contact' }]

    case 'whatsapp':
      return [{ speaker: 'tina', text: `Opening WhatsApp for you right now! You'll be connected directly with our team.`, action: 'whatsapp' }]

    case 'call':
      return [{ speaker: 'tina', text: `Connecting you to +91 7200 255 252 now!`, action: 'call' }]

    case 'email':
      return [{ speaker: 'tina', text: `Opening your email client to info@ghlindiaventures.com!`, action: 'email' }]

    case 'human':
      return [{ speaker: 'tina', text: `Of course! Our office hours are Mon-Sat, 10 AM - 6 PM IST. You can call +91 7200 255 252, WhatsApp us at wa.me/917200255252, or email info@ghlindiaventures.com. Someone will be happy to help!` }]

    case 'blog':
      return [{ speaker: 'tina', text: `Our blog has great insights on AIFs, investment strategies, and market trends. Let me take you there!`, action: 'navigate', actionData: '/blog' }]

    case 'read_page': {
      const pageContent = extractPageContent()
      if (pageContent) {
        return [{ speaker: 'tina', text: `Here's what this page says: ${pageContent}` }]
      }
      return [{ speaker: 'tina', text: `This page seems to be loading still. Try scrolling down first and then ask me again — I'll read whatever content is visible!` }]
    }

    case 'summarize': {
      const content = extractPageContent()
      if (content) {
        const summary = content.substring(0, 400)
        return [{ speaker: 'abe', text: `Here's a summary of this page: ${summary}` }]
      }
      const ctx = PAGE_GREETINGS[page]
      if (ctx) {
        return [{ speaker: 'abe', text: `You're currently on our ${page} page. ${ctx.abe}` }]
      }
      return [{ speaker: 'abe', text: `This page is part of the GHL India Ventures website. Ask me about any specific section and I'll explain it in detail.` }]
    }

    case 'quiz':
      return [{ speaker: 'abe', text: `Great idea${name}! Our Risk Assessment Quiz is just 7 quick questions that'll help us understand your investment personality. Let me open it for you!`, action: 'quiz' }]

    case 'calculator':
      return [{ speaker: 'abe', text: `Let's crunch some numbers! Our Investment Calculator lets you compare returns across SIP, Debenture Route, and Direct AIF against benchmarks like FDs, Gold, and NIFTY 50. Let me open it!`, action: 'calculator' }]

    case 'confidential':
      return [{ speaker: 'abe', text: `Specific fund performance data, including NAV and actual returns, is available to registered investors after KYC verification. This is to protect both you and our existing investors. I can help you start the registration process right now though — would you like that?` }]

    case 'distress':
      return [
        { speaker: 'tina', text: `I'm sorry you're feeling that way${name}. Please know that we're here to help, not to pressure you. Take your time.` },
        { speaker: 'abe', text: `If you'd prefer to speak with a real person, our team is available Mon-Sat, 10 AM - 6 PM IST at +91 7200 255 252. They're wonderful people who genuinely care about helping you.` }
      ]

    default: {
      // Intelligent fallback based on current page context
      const pageHint = PAGE_GREETINGS[page]
      if (pageHint) {
        return [
          { speaker: 'abe', text: `That's an interesting question${name}! You're currently on our ${page} page. ${pageHint.abe} Is there something specific here I can help explain?` },
          { speaker: 'tina', text: `You can also try asking me to "read this page", "summarize this page", or ask any specific question about investments, our fund, or the site!` }
        ]
      }
      return [
        { speaker: 'abe', text: `That's an interesting question${name}! Let me help you find the right answer. You can ask me about our fund, investment process, SEBI registration, or any section of this website.` },
        { speaker: 'tina', text: `Try saying "Show me around", "Read this page", "Help me invest", or "What is an AIF?". I understand natural language! Or I can connect you with our team at +91 7200 255 252.` }
      ]
    }
  }
}
