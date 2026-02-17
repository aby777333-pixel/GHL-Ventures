// ============================================================
// GHL India Ventures - Page-Specific Proactive Chat Messages
// ============================================================

export interface ProactiveMessage {
  message: string
  delay: number
}

export const PROACTIVE_MESSAGES: Record<string, ProactiveMessage> = {
  '/': {
    message: 'Welcome to GHL India Ventures! \ud83d\udc4b Want to know how our AIF delivers institutional-grade returns?',
    delay: 8000,
  },
  '/fund': {
    message: 'Exploring our fund? I can explain our two investment routes \u2014 starting from just \u20B910 Lakhs!',
    delay: 6000,
  },
  '/fund/debenture-route': {
    message: 'The Debenture Route is perfect for salaried professionals. Want me to walk you through it?',
    delay: 5000,
  },
  '/fund/direct-aif': {
    message: 'Our Direct AIF targets 15\u201325% IRR for HNIs. Shall I explain the investment process?',
    delay: 5000,
  },
  '/about': {
    message: 'Curious about our team? Ask me about our leadership or investment philosophy!',
    delay: 7000,
  },
  '/contact': {
    message: 'Filling out the form? I can answer questions while you complete it.',
    delay: 5000,
  },
  '/portfolio': {
    message: 'Want details about any of our portfolio companies? Just ask!',
    delay: 6000,
  },
  '/financial-iq': {
    message: 'Great to see you learning! Need help understanding any investment concepts?',
    delay: 8000,
  },
  '/blog': {
    message: 'Looking for insights? I can recommend articles based on your interests.',
    delay: 7000,
  },
  '/downloads': {
    message: 'Need help choosing which document to download? I can guide you!',
    delay: 6000,
  },
}
