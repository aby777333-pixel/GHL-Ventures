'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, Share2, RotateCcw, Sparkles, Star, ArrowRight, Trophy, Target, Shield, Zap, Brain, Heart } from 'lucide-react'

interface Question {
  id: number
  question: string
  options: { text: string; scores: Record<string, number> }[]
}

interface Archetype {
  id: string
  name: string
  title: string
  emoji: string
  color: string
  bgGradient: string
  philosophy: string
  traits: string[]
  famousQuote: string
  matchPercentage?: number
  icon: React.ElementType
}

const ARCHETYPES: Archetype[] = [
  {
    id: 'buffett',
    name: 'Warren Buffett',
    title: 'The Value Oracle',
    emoji: '🦅',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-900/50 to-emerald-800/30',
    philosophy: 'Buy wonderful companies at fair prices and hold forever. Patience is the ultimate edge.',
    traits: ['Patient', 'Value-Focused', 'Long-term Thinker', 'Risk-Averse'],
    famousQuote: 'Be fearful when others are greedy, and greedy when others are fearful.',
    icon: Shield,
  },
  {
    id: 'jhunjhunwala',
    name: 'Rakesh Jhunjhunwala',
    title: 'The Indian Bull',
    emoji: '🐂',
    color: 'text-orange-400',
    bgGradient: 'from-orange-900/50 to-orange-800/30',
    philosophy: 'Bet big on India\'s growth story. Conviction in emerging market potential drives extraordinary returns.',
    traits: ['Optimistic', 'Bold', 'India-Focused', 'Growth-Driven'],
    famousQuote: 'Invest in India and in equities. The country has huge potential.',
    icon: Zap,
  },
  {
    id: 'lynch',
    name: 'Peter Lynch',
    title: 'The Street Researcher',
    emoji: '🔍',
    color: 'text-blue-400',
    bgGradient: 'from-blue-900/50 to-blue-800/30',
    philosophy: 'Invest in what you know. The best ideas come from everyday observations and deep research.',
    traits: ['Curious', 'Analytical', 'Hands-On', 'Diversified'],
    famousQuote: 'Know what you own, and know why you own it.',
    icon: Brain,
  },
  {
    id: 'soros',
    name: 'George Soros',
    title: 'The Macro Strategist',
    emoji: '🌊',
    color: 'text-violet-400',
    bgGradient: 'from-violet-900/50 to-violet-800/30',
    philosophy: 'Markets are driven by human psychology. Find the reflexive feedback loops and act decisively.',
    traits: ['Contrarian', 'Macro-Thinker', 'Decisive', 'Bold'],
    famousQuote: 'It\'s not whether you\'re right or wrong — it\'s how much money you make when right.',
    icon: Target,
  },
  {
    id: 'premji',
    name: 'Azim Premji',
    title: 'The Steady Builder',
    emoji: '🏗️',
    color: 'text-amber-400',
    bgGradient: 'from-amber-900/50 to-amber-800/30',
    philosophy: 'Build with integrity, think in decades. Sustainable wealth comes from ethical, long-term business building.',
    traits: ['Ethical', 'Disciplined', 'Patient', 'Philanthropic'],
    famousQuote: 'If people are not laughing at your goals, your goals are too small.',
    icon: Heart,
  },
  {
    id: 'dalio',
    name: 'Ray Dalio',
    title: 'The Principle Machine',
    emoji: '⚙️',
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-900/50 to-cyan-800/30',
    philosophy: 'Systematize everything. Build principles-based decision frameworks and diversify radically.',
    traits: ['Systematic', 'Data-Driven', 'All-Weather', 'Process-Oriented'],
    famousQuote: 'He who lives by the crystal ball will eat shattered glass.',
    icon: Trophy,
  },
]

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'A stock you own drops 30% in a week. What\'s your first instinct?',
    options: [
      { text: 'Buy more — the fundamentals haven\'t changed', scores: { buffett: 3, premji: 2, jhunjhunwala: 1 } },
      { text: 'Analyze what changed in the macro environment', scores: { soros: 3, dalio: 2 } },
      { text: 'Research if competitors are affected too', scores: { lynch: 3, dalio: 1 } },
      { text: 'Hold tight — I believe in India\'s long-term story', scores: { jhunjhunwala: 3, premji: 2 } },
    ],
  },
  {
    id: 2,
    question: 'What excites you most about an investment opportunity?',
    options: [
      { text: 'It\'s deeply undervalued by the market', scores: { buffett: 3, lynch: 1 } },
      { text: 'It\'s riding a massive macro trend', scores: { soros: 3, jhunjhunwala: 2 } },
      { text: 'I use the product and love it', scores: { lynch: 3, buffett: 1 } },
      { text: 'My quantitative models show a clear edge', scores: { dalio: 3, soros: 1 } },
    ],
  },
  {
    id: 3,
    question: 'How do you feel about concentrated vs. diversified portfolios?',
    options: [
      { text: 'Concentration — a few great bets is all you need', scores: { buffett: 3, jhunjhunwala: 2 } },
      { text: 'Balanced — I pick 15-25 names I understand well', scores: { lynch: 3, premji: 1 } },
      { text: 'Highly diversified across asset classes and geographies', scores: { dalio: 3, soros: 1 } },
      { text: 'Depends on conviction — I go all-in when I\'m sure', scores: { soros: 2, jhunjhunwala: 3 } },
    ],
  },
  {
    id: 4,
    question: 'What\'s your ideal investment horizon?',
    options: [
      { text: 'Forever — I buy businesses, not stocks', scores: { buffett: 3, premji: 3 } },
      { text: '3-5 years — enough to ride the growth cycle', scores: { jhunjhunwala: 3, lynch: 2 } },
      { text: 'As long as my thesis holds — could be months or years', scores: { soros: 3, dalio: 2 } },
      { text: 'I rebalance systematically on a set schedule', scores: { dalio: 3, lynch: 1 } },
    ],
  },
  {
    id: 5,
    question: 'Which sector excites you most right now?',
    options: [
      { text: 'Financial services and insurance — boring but profitable', scores: { buffett: 3, premji: 1 } },
      { text: 'Deep tech, AI, and semiconductors', scores: { dalio: 2, soros: 2, lynch: 1 } },
      { text: 'India\'s consumption and infrastructure boom', scores: { jhunjhunwala: 3, premji: 2 } },
      { text: 'Distressed assets and special situations', scores: { soros: 3, buffett: 1 } },
    ],
  },
  {
    id: 6,
    question: 'How important is social impact in your investment decisions?',
    options: [
      { text: 'Very — I want my money to make a positive difference', scores: { premji: 3, dalio: 1 } },
      { text: 'Returns come first, but I avoid harmful industries', scores: { buffett: 2, lynch: 2 } },
      { text: 'I\'m focused purely on risk-adjusted returns', scores: { dalio: 3, soros: 2 } },
      { text: 'Building India\'s economy IS the social impact', scores: { jhunjhunwala: 3, premji: 1 } },
    ],
  },
  {
    id: 7,
    question: 'You spot an investment everyone thinks is risky. You...',
    options: [
      { text: 'Dig deeper — the crowd is often wrong on value', scores: { buffett: 3, lynch: 2 } },
      { text: 'Go contrarian and size up big if conviction is high', scores: { soros: 3, jhunjhunwala: 2 } },
      { text: 'Run the numbers through my framework before deciding', scores: { dalio: 3, lynch: 1 } },
      { text: 'Invest modestly — patience will reveal the truth', scores: { premji: 3, buffett: 1 } },
    ],
  },
]

export default function InvestorPersonality() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [result, setResult] = useState<Archetype | null>(null)
  const [allResults, setAllResults] = useState<Archetype[]>([])
  const [showWidget, setShowWidget] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowWidget(true), 7000)
    return () => clearTimeout(timer)
  }, [])

  const handleAnswer = (option: { scores: Record<string, number> }) => {
    const newScores = { ...scores }
    Object.entries(option.scores).forEach(([key, val]) => {
      newScores[key] = (newScores[key] || 0) + val
    })
    setScores(newScores)

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      // Calculate results
      const maxScore = Math.max(...Object.values(newScores))
      const results = ARCHETYPES.map(a => ({
        ...a,
        matchPercentage: Math.round(((newScores[a.id] || 0) / maxScore) * 100),
      })).sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))

      setAllResults(results)
      setResult(results[0])
      setAnimateIn(true)
    }
  }

  const handleReset = () => {
    setCurrentQ(0)
    setScores({})
    setResult(null)
    setAllResults([])
    setAnimateIn(false)
  }

  const handleShare = () => {
    if (!result) return
    const text = `I'm ${result.matchPercentage}% ${result.name} (${result.title})! 🎯 Find out your investor personality at GHL India Ventures.`
    if (navigator.share) {
      navigator.share({ title: 'My Investor Personality', text, url: window.location.href })
    } else {
      navigator.clipboard.writeText(text)
      alert('Result copied to clipboard!')
    }
  }

  if (!showWidget) return null

  return (
    <>
      {/* Floating trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed z-[9992] flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 hover:scale-105 group"
          style={{
            top: '244px',
            left: '16px',
            background: 'rgba(10,10,10,0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
          title="Discover your investor personality"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-gray-500 leading-none mb-0.5">Discover</p>
            <p className="text-[11px] text-gray-300 group-hover:text-white transition-colors font-medium">
              Investor You
            </p>
          </div>
        </button>
      )}

      {/* Quiz Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[99998] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setIsOpen(false); handleReset() } }}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(10,10,10,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}
          >
            {/* Close */}
            <button onClick={() => { setIsOpen(false); handleReset() }} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>

            {!result ? (
              /* ── QUESTION VIEW ── */
              <div className="px-6 pt-8 pb-6">
                {/* Progress */}
                <div className="flex items-center gap-2 mb-6">
                  {QUESTIONS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i < currentQ ? 'bg-brand-red' : i === currentQ ? 'bg-brand-red/50' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>

                {/* Question number */}
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] text-gray-500 font-medium">
                    Question {currentQ + 1} of {QUESTIONS.length}
                  </span>
                </div>

                {/* Question */}
                <h3 className="text-white text-lg font-bold mb-6 leading-snug">
                  {QUESTIONS[currentQ].question}
                </h3>

                {/* Options */}
                <div className="space-y-2.5">
                  {QUESTIONS[currentQ].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      className="w-full text-left px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-red/30 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                          {opt.text}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-brand-red transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ── RESULT VIEW ── */
              <div className={`transition-all duration-700 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {/* Result header gradient */}
                <div className={`bg-gradient-to-br ${result.bgGradient} px-6 pt-8 pb-6`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">Your Investor Personality</p>
                      <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <span className="text-3xl">{result.emoji}</span>
                        {result.name}
                      </h2>
                      <p className={`text-sm font-semibold ${result.color} mt-1`}>{result.title}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-black ${result.color}`}>{result.matchPercentage}%</div>
                      <p className="text-[10px] text-gray-500">Match</p>
                    </div>
                  </div>

                  {/* Philosophy */}
                  <p className="text-sm text-gray-300 leading-relaxed italic">
                    &quot;{result.philosophy}&quot;
                  </p>
                </div>

                {/* Traits & details */}
                <div className="px-6 py-5">
                  {/* Traits */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {result.traits.map(trait => (
                      <span key={trait} className={`px-3 py-1 rounded-full text-[11px] font-medium ${result.bgGradient} ${result.color} border border-white/5`}>
                        {trait}
                      </span>
                    ))}
                  </div>

                  {/* Famous quote */}
                  <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/5 mb-5">
                    <p className="text-[10px] text-gray-600 mb-1">Famous Quote</p>
                    <p className="text-sm text-gray-300 italic">&quot;{result.famousQuote}&quot;</p>
                  </div>

                  {/* Other matches */}
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Other Matches</p>
                  <div className="space-y-1.5 mb-5">
                    {allResults.slice(1, 4).map(a => {
                      const Icon = a.icon
                      return (
                        <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
                          <span className="text-lg">{a.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-300 font-medium">{a.name}</p>
                            <p className="text-[10px] text-gray-600">{a.title}</p>
                          </div>
                          <span className={`text-xs font-bold ${a.color}`}>{a.matchPercentage}%</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShare}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-red hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Share Result
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retry
                    </button>
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02]">
                  <a
                    href="/fund"
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-brand-red/10 hover:bg-brand-red/20 border border-brand-red/20 transition-colors group"
                  >
                    <div>
                      <p className="text-xs text-white font-semibold">Invest Like {result.name.split(' ')[0]}</p>
                      <p className="text-[10px] text-gray-500">Explore our fund aligned with your style</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-brand-red group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
