'use client'

/* ClientAIAdvisor — AI-powered investment advisor chat for the Client Dashboard.
   Mirrors the admin AIAdvisorTab pattern with client-specific context and questions. */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Brain, Send, Sparkles, BookOpen, Shield, Globe, Gift, HelpCircle } from 'lucide-react'
import { callClientClaudeAPI, getClientSimulatedResponse, type ClaudeMessage } from '@/lib/client/clientClaudeApi'

interface Props {
  theme: 'dark' | 'light'
  t: (dark: string, light: string) => string
}

const SUGGESTED_QUERIES = [
  'How is my portfolio performing?',
  'What are the current NAV updates?',
  'Explain AIF investment structures',
  'What documents do I need for KYC?',
  'Tell me about NRI investment options',
]

const TOPIC_CARDS = [
  { icon: Sparkles, title: 'Portfolio & Returns', desc: 'NAV updates, performance, allocation', color: '#D0021B' },
  { icon: BookOpen, title: 'KYC & Onboarding', desc: 'Documents, verification status', color: '#3B82F6' },
  { icon: Shield, title: 'Tax & Compliance', desc: 'AIF taxation, SEBI regulations', color: '#10B981' },
  { icon: Globe, title: 'NRI Investments', desc: 'FEMA, accounts, repatriation', color: '#F59E0B' },
  { icon: Gift, title: 'Referral Program', desc: 'Invite friends, earn rewards', color: '#8B5CF6' },
  { icon: HelpCircle, title: 'Fee Structure', desc: 'Management fees, charges', color: '#EC4899' },
]

export default function ClientAIAdvisor({ theme, t }: Props) {
  const isDark = theme === 'dark'
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: 'Welcome to the GHL Investment Advisor! I can help you understand your portfolio, explain investment structures, guide you through KYC, and answer questions about AIF investments. Try one of the suggested topics below.' },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkKey = () => {
      const userKey = sessionStorage.getItem('claude_api_key') || ''
      setIsLive(!!userKey || typeof window !== 'undefined')
    }
    checkKey()
    const interval = setInterval(checkKey, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const handleSend = useCallback(async () => {
    if (!input.trim() || thinking) return
    const userMsg = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setInput('')
    setThinking(true)

    const userKey = sessionStorage.getItem('claude_api_key') || undefined

    try {
      const history: ClaudeMessage[] = messages
        .filter(m => m.role === 'user' || m.role === 'ai')
        .map(m => ({ role: m.role === 'ai' ? 'assistant' as const : 'user' as const, content: m.content }))
      history.push({ role: 'user', content: userMsg })
      if (history.length > 0 && history[0].role === 'assistant') history.shift()

      const response = await callClientClaudeAPI(history, userKey)
      setMessages(prev => [...prev, { role: 'ai', content: response }])
    } catch {
      const fallback = getClientSimulatedResponse(userMsg)
      setMessages(prev => [...prev, { role: 'ai', content: `⚠️ *Live AI unavailable — showing cached guidance*\n\n${fallback}` }])
    }

    setThinking(false)
  }, [input, thinking, messages])

  const renderMarkdown = (text: string) => {
    return text.split('**').map((part, j) =>
      j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={`text-xl font-bold ${t('text-white', 'text-gray-900')}`}>AI Investment Advisor</h2>
        <p className={`text-sm mt-1 ${t('text-gray-500', 'text-gray-600')}`}>Ask questions about your investments, portfolio, KYC, or AIF regulations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chat Interface */}
        <div className="lg:col-span-2 flex flex-col" style={{ minHeight: '600px' }}>
          <div className={`flex flex-col flex-1 rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-gray-200'}`} style={isDark ? { backdropFilter: 'blur(24px)' } : {}}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '500px' }}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3.5 ${
                    m.role === 'user'
                      ? 'bg-brand-red/20 border border-brand-red/30'
                      : isDark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    {m.role === 'ai' && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Brain className="w-3.5 h-3.5 text-brand-red" />
                        <span className="text-[10px] text-brand-red font-semibold uppercase">GHL Investment Advisor{isLive ? ' · Live' : ''}</span>
                      </div>
                    )}
                    <div className={`text-sm whitespace-pre-wrap leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      {renderMarkdown(m.content)}
                    </div>
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className={`rounded-2xl p-3.5 ${isDark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-brand-red animate-pulse" />
                      <span className={`text-sm animate-pulse ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {isLive ? 'Consulting advisor...' : 'Preparing guidance...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Queries */}
            <div className={`flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide border-t ${isDark ? 'border-white/[0.04]' : 'border-gray-100'}`}>
              {SUGGESTED_QUERIES.map(q => (
                <button key={q} onClick={() => setInput(q)} className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] border transition-colors ${
                  isDark
                    ? 'text-gray-400 bg-white/[0.03] border-white/[0.06] hover:border-brand-red/30 hover:text-white'
                    : 'text-gray-500 bg-gray-50 border-gray-200 hover:border-brand-red/30 hover:text-gray-900'
                }`}>{q}</button>
              ))}
            </div>

            {/* Input */}
            <div className={`p-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about investments, KYC, portfolio..."
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none ${
                    isDark
                      ? 'bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-gray-600 focus:border-brand-red/40'
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-brand-red/40'
                  }`}
                />
                <button onClick={handleSend} disabled={thinking} className="px-4 py-2.5 rounded-xl bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors disabled:opacity-50">
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-[10px] mt-2 text-center">
                {isLive
                  ? <span className="text-emerald-400">● Live AI connected — responses powered by Claude</span>
                  : <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>○ Cached mode — AI advisor providing general guidance</span>
                }
              </p>
            </div>
          </div>
        </div>

        {/* Topic Cards */}
        <div className="space-y-4">
          <div className={`rounded-2xl border p-4 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-gray-200'}`} style={isDark ? { backdropFilter: 'blur(24px)' } : {}}>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Topics I Can Help With</h4>
            <div className="space-y-2">
              {TOPIC_CARDS.map(card => (
                <button
                  key={card.title}
                  onClick={() => setInput(card.desc)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                    isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${card.color}15`, border: `1px solid ${card.color}30` }}>
                    <card.icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{card.title}</p>
                    <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{card.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-gray-200'}`} style={isDark ? { backdropFilter: 'blur(24px)' } : {}}>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Important Disclaimer</h4>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              This AI advisor provides general investment information and guidance. It does not constitute financial advice.
              Past performance does not guarantee future returns. Investments in AIFs are subject to market risks.
              For personalized advice, please consult your Relationship Manager or a qualified financial advisor.
            </p>
            <p className={`text-[10px] mt-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
              SEBI Registration: IN/AIF2/24-25/1517
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
