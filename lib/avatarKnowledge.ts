// GHL India Ventures Knowledge Base & Rule-Based Response Engine

export interface AvatarResponse {
  speaker: 'abe' | 'tina'
  text: string
  action?: 'navigate' | 'quiz' | 'calculator' | 'whatsapp' | 'call' | 'email' | 'form'
  actionData?: string
}

// Intent classification via keyword matching
type Intent =
  | 'greeting' | 'thanks' | 'goodbye'
  | 'about_company' | 'about_fund' | 'about_sebi' | 'about_team'
  | 'investment_start' | 'minimum_investment' | 'returns' | 'risk'
  | 'real_estate' | 'startups' | 'portfolio' | 'debenture'
  | 'nri' | 'tax' | 'kyc' | 'documents'
  | 'navigate' | 'contact' | 'whatsapp' | 'call' | 'email' | 'human'
  | 'blog' | 'read' | 'quiz' | 'calculator'
  | 'confidential' | 'distress' | 'name_response'
  | 'unknown'

interface IntentPattern {
  intent: Intent
  keywords: string[]
}

const INTENT_PATTERNS: IntentPattern[] = [
  { intent: 'greeting', keywords: ['hello', 'hi', 'hey', 'namaste', 'vanakkam', 'good morning', 'good afternoon', 'good evening'] },
  { intent: 'thanks', keywords: ['thank', 'thanks', 'dhanyavaad', 'nandri', 'shukriya', 'gracias', 'merci'] },
  { intent: 'goodbye', keywords: ['bye', 'goodbye', 'see you', 'alvida', 'adios', 'au revoir'] },
  { intent: 'about_company', keywords: ['about', 'who are you', 'company', 'ghl', 'tell me about', 'what is ghl', 'what do you do'] },
  { intent: 'about_fund', keywords: ['fund', 'aif', 'alternative investment', 'category ii', 'cat 2', 'what is aif', 'explain aif'] },
  { intent: 'about_sebi', keywords: ['sebi', 'registered', 'regulation', 'regulated', 'safe', 'secure', 'legitimate', 'legal'] },
  { intent: 'about_team', keywords: ['team', 'management', 'who manages', 'leadership', 'experience', 'founders'] },
  { intent: 'investment_start', keywords: ['invest', 'start investing', 'how to invest', 'begin', 'get started', 'interested', 'want to invest', 'help me invest'] },
  { intent: 'minimum_investment', keywords: ['minimum', 'how much', 'entry', 'ticket size', 'least amount', 'smallest', 'starting amount'] },
  { intent: 'returns', keywords: ['returns', 'profit', 'gains', 'performance', 'how much earn', 'expected', 'yield', 'irr'] },
  { intent: 'risk', keywords: ['risk', 'safe', 'lose money', 'dangerous', 'secure', 'guaranteed', 'protection'] },
  { intent: 'real_estate', keywords: ['real estate', 'property', 'nclt', 'distressed', 'stressed', 'montieth', 'nungambakkam', 'coimbatore'] },
  { intent: 'startups', keywords: ['startup', 'early stage', 'finstack', 'medbridge', 'greengrid', 'venture', 'tech'] },
  { intent: 'portfolio', keywords: ['portfolio', 'companies', 'holdings', 'where invested', 'current investments'] },
  { intent: 'debenture', keywords: ['debenture', 'ncd', 'debt', 'fixed income', 'debenture route', '10 lakh'] },
  { intent: 'nri', keywords: ['nri', 'non resident', 'overseas', 'abroad', 'foreign', 'nro', 'nre', 'international'] },
  { intent: 'tax', keywords: ['tax', 'taxation', 'capital gains', 'ltcg', 'stcg', 'tax benefit'] },
  { intent: 'kyc', keywords: ['kyc', 'know your customer', 'verification', 'documents needed', 'pan', 'aadhaar'] },
  { intent: 'documents', keywords: ['document', 'download', 'brochure', 'ppm', 'factsheet', 'presentation'] },
  { intent: 'navigate', keywords: ['go to', 'take me', 'show me', 'navigate', 'open', 'visit', 'page'] },
  { intent: 'contact', keywords: ['contact', 'reach', 'office', 'address', 'location', 'where'] },
  { intent: 'whatsapp', keywords: ['whatsapp', 'wa', 'chat on whatsapp', 'message'] },
  { intent: 'call', keywords: ['call', 'phone', 'ring', 'telephone', 'dial'] },
  { intent: 'email', keywords: ['email', 'mail', 'write to', 'send email'] },
  { intent: 'human', keywords: ['human', 'person', 'real person', 'agent', 'someone', 'talk to someone', 'speak to'] },
  { intent: 'blog', keywords: ['blog', 'article', 'read blog', 'insights', 'news'] },
  { intent: 'read', keywords: ['read', 'read this', 'read aloud', 'read page'] },
  { intent: 'quiz', keywords: ['quiz', 'risk assessment', 'risk quiz', 'test', 'assessment'] },
  { intent: 'calculator', keywords: ['calculator', 'calculate', 'compute', 'how much will', 'returns calculator'] },
  { intent: 'confidential', keywords: ['nav', 'net asset value', 'performance data', 'fund returns', 'specific returns', 'actual returns'] },
  { intent: 'distress', keywords: ['frustrated', 'angry', 'upset', 'confused', 'lost', 'don\'t understand', 'help me please', 'stressed'] },
]

function classifyIntent(input: string): Intent {
  const lower = input.toLowerCase().trim()
  let bestMatch: Intent = 'unknown'
  let bestScore = 0

  for (const pattern of INTENT_PATTERNS) {
    for (const keyword of pattern.keywords) {
      if (lower.includes(keyword) && keyword.length > bestScore) {
        bestScore = keyword.length
        bestMatch = pattern.intent
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
        { speaker: 'tina', text: `Take care! We'll be right here whenever you're ready to take the next step. 🙏` }
      ]

    case 'about_company':
      return [{ speaker: 'abe', text: `GHL India Ventures is a SEBI-registered Category II Alternative Investment Fund (AIF), headquartered in Egmore, Chennai. We focus on two high-potential sectors: recovering stressed real estate through NCLT/IBC resolution, and backing early-stage Indian startups in fintech, healthtech, and cleantech. With 25+ years of combined leadership experience and over ₹500 Cr in value created, we're building India's future — one smart investment at a time.` }]

    case 'about_fund':
      return [
        { speaker: 'abe', text: `Great question${name}! An AIF — Alternative Investment Fund — is like a premium investment club. You pool your capital with other smart investors, and our expert team deploys it into carefully vetted opportunities. Think of it as having a dedicated team of analysts, lawyers, and sector experts working for your money.` },
        { speaker: 'tina', text: `We're a Category II AIF, which means we invest in real assets and companies — not just derivatives or speculation. Everything is regulated by SEBI, so your investment has institutional-grade governance. Would you like to explore our fund page?` }
      ]

    case 'about_sebi':
      return [{ speaker: 'abe', text: `Absolutely — your security comes first. GHL India Ventures is registered with SEBI (Securities and Exchange Board of India) under Registration No. IN/AIF2/2425/1517. This means mandatory quarterly audits, third-party custodial safeguards, transparent NAV reporting, and strict compliance with AIF regulations. Your money is in an institutionally governed vehicle, not a personal account.` }]

    case 'about_team':
      return [{ speaker: 'tina', text: `Our leadership team brings over 25 years of combined experience across private equity, real estate, and venture capital. They've analyzed over 1,000 pitch decks and created more than ₹500 Cr in value. Want me to take you to our About page for full details?` }]

    case 'investment_start':
      return [
        { speaker: 'abe', text: `Wonderful${name}! I'd love to help you get started. Think of this as a friendly chat over chai, not a formal interview. Let me understand your goals...` },
        { speaker: 'tina', text: `You can start by telling us: What's your primary investment goal — capital growth, regular income, diversification, or all of these?` }
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
        { speaker: 'tina', text: `Our current projects include Montieth Square Residences (120-unit revival in Egmore, Chennai), Nungambakkam Heights (premium Grade-A office tower), and Coimbatore Gateway (mixed-use township). Want to see them in detail?`, action: 'navigate', actionData: '/portfolio' }
      ]

    case 'startups':
      return [
        { speaker: 'abe', text: `We back promising Indian startups across three key sectors — fintech, healthtech, and cleantech. Each undergoes rigorous forensic diligence before we invest.` },
        { speaker: 'tina', text: `Currently, we've invested in FinStack Technologies (AI-powered MSME lending), MedBridge Health (rural telemedicine in Tamil Nadu), and GreenGrid Logistics (electric last-mile delivery in Chennai & Bengaluru). Exciting stuff!`, action: 'navigate', actionData: '/portfolio' }
      ]

    case 'portfolio':
      return [{ speaker: 'tina', text: `Let me take you to our portfolio page where you can see all our current investments across real estate and startups!`, action: 'navigate', actionData: '/portfolio' }]

    case 'debenture':
      return [{ speaker: 'abe', text: `The Debenture Route is our lower-entry option starting at just ₹10 Lakhs. It's a Non-Convertible Debenture (NCD) structure that offers exposure to our stressed real estate recovery pipeline with a more accessible investment size. It's perfect for investors who want to start smaller before committing to the full AIF. Want me to show you the details?`, action: 'navigate', actionData: '/fund/debenture-route' }]

    case 'nri':
      return [
        { speaker: 'abe', text: `Absolutely${name}! NRIs can invest through their NRO account. We handle all documentation and FEMA/RBI compliance for you.` },
        { speaker: 'tina', text: `Our team has experience onboarding NRI investors from the US, UK, UAE, Singapore, and Australia. We can even schedule a call in your timezone. Shall I connect you with our team?` }
      ]

    case 'tax':
      return [{ speaker: 'abe', text: `Tax implications for AIF investments depend on your residency status and holding period. As Category II AIF, the income is taxed in the hands of the investor as pass-through. However, I'd recommend consulting with your tax advisor for specifics — every situation is unique. Want me to connect you with our team who can provide general guidance?` }]

    case 'kyc':
      return [{ speaker: 'tina', text: `For KYC, you'll typically need: PAN card, Aadhaar, proof of address, bank statement (last 6 months), a passport-size photo, and income proof/net worth certificate. For NRIs, additional documents like passport and NRO account details are needed. Don't worry — we guide you through every step!` }]

    case 'documents':
      return [{ speaker: 'tina', text: `I can take you to our Downloads page where you'll find our fund brochure, PPM (Private Placement Memorandum), factsheets, and investor presentations. Let's go there!`, action: 'navigate', actionData: '/downloads' }]

    case 'navigate': {
      const target = findNavTarget(input)
      if (target) {
        return [{ speaker: 'tina', text: `Let me take you there right away!`, action: 'navigate', actionData: target }]
      }
      return [{ speaker: 'tina', text: `I can take you to any page — Home, About, Fund, Blog, Portfolio, Downloads, Contact, Financial IQ, or our investment tools. Which one?` }]
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
      return [{ speaker: 'tina', text: `Of course! Our office hours are Mon-Sat, 10 AM - 6 PM IST. You can: 📞 Call +91 7200 255 252, 💬 WhatsApp wa.me/917200255252, or ✉️ Email info@ghlindiaventures.com. Someone will be happy to help!` }]

    case 'blog':
      return [{ speaker: 'tina', text: `Our blog has great insights on AIFs, investment strategies, and market trends. Let me take you there!`, action: 'navigate', actionData: '/blog' }]

    case 'read': {
      // Read actual page content
      const pageContent = typeof document !== 'undefined'
        ? Array.from(document.querySelectorAll('h1, h2, h3, p:not([class*="footer"]):not([class*="legal"]):not([class*="disclaimer"])'))
            .map(el => el.textContent?.trim())
            .filter(t => t && t.length > 20)
            .slice(0, 8)
            .join('. ')
            .substring(0, 600)
        : ''
      if (pageContent) {
        return [{ speaker: 'tina', text: `Here's what this page says: ${pageContent}` }]
      }
      return [{ speaker: 'tina', text: `I'd be happy to read this page for you! Just select any text on the page and I'll read it aloud in your chosen language.` }]
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
      const pageHint = PAGE_GREETINGS[page]
      const contextHint = pageHint ? ` Right now you're on our ${page} page — ${pageHint.abe.split('.')[0]}.` : ''
      return [
        { speaker: 'abe', text: `That's a thoughtful question${name}!${contextHint} Let me see how I can help with that.` },
        { speaker: 'tina', text: `For the most accurate answer, I'd recommend connecting with our expert team: 📞 +91 7200 255 252 | 💬 WhatsApp | ✉️ info@ghlindiaventures.com. They'll take great care of you!` }
      ]
    }
  }
}
