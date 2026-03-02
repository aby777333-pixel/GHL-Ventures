'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Brain, Sparkles, Send } from 'lucide-react'
import AdminGlass from '../../admin/shared/AdminGlass'
import { callStaffClaudeAPI, getStaffSimulatedResponse, type ClaudeMessage } from '@/lib/staff/staffClaudeApi'
import type { StaffRole } from '@/lib/staff/staffTypes'

// ── Props ────────────────────────────────────────────────────────
interface AIToolsModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  role: StaffRole
}

// ── Suggested Queries ────────────────────────────────────────────
const STAFF_SUGGESTED_QUERIES = [
  'Draft a follow-up email for a client',
  'What\'s the KYC verification process?',
  'Explain our AIF fee structure to a client',
  'How do I handle a client complaint?',
  'What are the SEBI compliance requirements?',
]

// ── Main Export ──────────────────────────────────────────────────
export default function AIToolsModule({ subTab, navigate, showToast, role }: AIToolsModuleProps) {
  return (
    <div className="space-y-6 admin-section-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-teal-400" />
          AI Advisor
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-powered assistant for your daily tasks — powered by Claude
        </p>
      </div>

      {/* AI Advisor Chat */}
      <StaffAIAdvisorChat showToast={showToast} />
    </div>
  )
}

// ── Staff AI Advisor Chat ─────────────────────────────────────────
function StaffAIAdvisorChat({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: 'Welcome to the GHL Staff Assistant! I can help you draft client communications, explain processes, handle compliance questions, and assist with your daily tasks. Try one of the suggested queries below.' },
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

      const response = await callStaffClaudeAPI(history, userKey)
      setMessages(prev => [...prev, { role: 'ai', content: response }])
    } catch {
      const fallback = getStaffSimulatedResponse(userMsg)
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chat Interface */}
      <div className="lg:col-span-2 flex flex-col" style={{ minHeight: '600px' }}>
        <AdminGlass className="flex flex-col flex-1" padding="p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '500px' }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3.5 ${m.role === 'user' ? 'bg-teal-500/20 border border-teal-500/30' : 'bg-white/[0.04] border border-white/[0.08]'}`}>
                  {m.role === 'ai' && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Brain className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-[10px] text-teal-400 font-semibold uppercase">GHL Staff Assistant{isLive ? ' · Live' : ''}</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{renderMarkdown(m.content)}</div>
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3.5">
                  <div className="flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                    <span className="text-sm text-gray-400 animate-pulse">{isLive ? 'Querying assistant...' : 'Preparing response...'}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Queries */}
          <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide border-t border-white/[0.04]">
            {STAFF_SUGGESTED_QUERIES.map(q => (
              <button key={q} onClick={() => setInput(q)} className="flex-shrink-0 px-3 py-1 rounded-full text-[10px] text-gray-400 bg-white/[0.03] border border-white/[0.06] hover:border-teal-500/30 hover:text-white transition-colors">{q}</button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/[0.06]">
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask about processes, draft emails, compliance..." className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/40" />
              <button onClick={handleSend} disabled={thinking} className="px-4 py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/30 hover:bg-teal-500/30 transition-colors disabled:opacity-50">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-[10px] mt-2 text-center">
              {isLive
                ? <span className="text-emerald-400">● Live AI connected — responses powered by Claude</span>
                : <span className="text-gray-600">○ Cached mode — showing pre-built guidance</span>
              }
            </p>
          </div>
        </AdminGlass>
      </div>

      {/* Quick Actions Panel */}
      <div className="space-y-4">
        <AdminGlass>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h4>
          <div className="space-y-2">
            {[
              { label: 'Draft welcome email', icon: '✉️', query: 'Draft a welcome email for a new investor who just completed KYC' },
              { label: 'KYC checklist', icon: '📋', query: 'Give me the complete KYC document checklist for a new investor' },
              { label: 'Complaint response', icon: '📞', query: 'Help me draft a professional response to a client complaint about delayed NAV update' },
              { label: 'NRI onboarding', icon: '🌏', query: 'What are the steps to onboard an NRI investor from the UAE?' },
              { label: 'Fee explanation', icon: '💰', query: 'How should I explain our fee structure to a prospective investor?' },
              { label: 'SEBI compliance', icon: '📜', query: 'What are the key SEBI compliance points I need to remember for client communications?' },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => setInput(action.query)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-white/[0.04] transition-colors"
              >
                <span className="text-base">{action.icon}</span>
                <span className="text-xs text-gray-400 hover:text-white transition-colors">{action.label}</span>
              </button>
            ))}
          </div>
        </AdminGlass>

        <AdminGlass>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Compliance Reminders</h4>
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <p className="text-[11px] text-gray-300 leading-relaxed">Always include risk disclaimers in client communications</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <p className="text-[11px] text-gray-300 leading-relaxed">KYC must be completed before accepting investments</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <p className="text-[11px] text-gray-300 leading-relaxed">Grievances must be acknowledged within 3 working days</p>
            </div>
          </div>
        </AdminGlass>
      </div>
    </div>
  )
}
