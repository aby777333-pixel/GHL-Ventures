// ============================================================
// GHL India Ventures - Risk Assessment Quiz Data
// ============================================================

export interface QuizOption {
  label: string
  score: number
}

export interface QuizQuestion {
  id: number
  question: string
  options: QuizOption[]
}

export interface RiskProfile {
  name: string
  range: [number, number]
  description: string
  recommendation: string
  route: string
  routeLink: string
  color: string
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is your primary investment goal?',
    options: [
      { label: 'Capital preservation with steady income', score: 1 },
      { label: 'Balanced growth with some income', score: 2 },
      { label: 'Long-term capital appreciation', score: 3 },
      { label: 'Maximum growth, willing to accept volatility', score: 4 },
    ],
  },
  {
    id: 2,
    question: 'What is your preferred investment horizon?',
    options: [
      { label: '1-2 years', score: 1 },
      { label: '3-4 years', score: 2 },
      { label: '5-7 years', score: 3 },
      { label: '7+ years', score: 4 },
    ],
  },
  {
    id: 3,
    question: 'If your investment dropped 20% in one quarter, you would:',
    options: [
      { label: 'Sell immediately to prevent further loss', score: 1 },
      { label: 'Sell some holdings and hold the rest', score: 2 },
      { label: 'Hold and wait for recovery', score: 3 },
      { label: 'Buy more at the lower price', score: 4 },
    ],
  },
  {
    id: 4,
    question: 'What is your investable surplus (beyond emergency funds)?',
    options: [
      { label: '₹10 Lakhs - ₹50 Lakhs', score: 1 },
      { label: '₹50 Lakhs - ₹1 Crore', score: 2 },
      { label: '₹1 Crore - ₹5 Crore', score: 3 },
      { label: '₹5 Crore+', score: 4 },
    ],
  },
  {
    id: 5,
    question: 'What is your primary source of income?',
    options: [
      { label: 'Salaried professional', score: 1 },
      { label: 'Self-employed / Business owner', score: 2 },
      { label: 'Mixed (salary + business)', score: 3 },
      { label: 'Investments and passive income', score: 4 },
    ],
  },
  {
    id: 6,
    question: 'How familiar are you with Alternative Investment Funds (AIFs)?',
    options: [
      { label: 'Never heard of them', score: 1 },
      { label: 'Heard of them, no direct experience', score: 2 },
      { label: 'Have invested in mutual funds / PMS', score: 3 },
      { label: 'Have invested in AIFs / PE / VC before', score: 4 },
    ],
  },
  {
    id: 7,
    question: 'What matters most to you in an investment?',
    options: [
      { label: 'Safety and SEBI regulatory protection', score: 1 },
      { label: 'Regular returns with moderate risk', score: 2 },
      { label: 'High returns with professional risk management', score: 3 },
      { label: 'Outsized returns with high conviction', score: 4 },
    ],
  },
]

export const RISK_PROFILES: RiskProfile[] = [
  {
    name: 'Conservative',
    range: [7, 14],
    description: 'You prefer stability and capital preservation. Structured products with predictable returns align well with your risk appetite.',
    recommendation: 'The SEBI Co-Invest Framework is ideal for you — structured returns backed by real assets. Contact us for investment details.',
    route: 'SEBI Co-Invest Framework',
    routeLink: '/fund/debenture-route',
    color: '#22C55E',
  },
  {
    name: 'Moderate',
    range: [15, 21],
    description: 'You seek a balanced approach — willing to take calculated risks for better returns while maintaining downside protection.',
    recommendation: 'Both our investment routes could work for you. Start with the SEBI Co-Invest Framework for stability, then consider the Direct AIF for growth.',
    route: 'Both Routes',
    routeLink: '/fund',
    color: '#F59E0B',
  },
  {
    name: 'Aggressive',
    range: [22, 28],
    description: 'You are a sophisticated investor comfortable with volatility and long-term commitments for potentially outsized returns.',
    recommendation: 'The Direct AIF Route targeting 15–25% IRR is designed for investors like you. Investment as per SEBI AIF Regulations.',
    route: 'Direct AIF Route',
    routeLink: '/fund/direct-aif',
    color: '#D0021B',
  },
]

export function getProfile(score: number): RiskProfile {
  for (const profile of RISK_PROFILES) {
    if (score >= profile.range[0] && score <= profile.range[1]) {
      return profile
    }
  }
  return RISK_PROFILES[1] // default moderate
}
