'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import {
  MessageCircle, X, Send, Minus, Paperclip, CheckCheck,
  ArrowRight, Mail, Video, Bot, Headphones, PhoneCall,
  User, Clock, Smile, Meh, Frown
} from 'lucide-react'
import { findBestResponse } from '@/lib/chatKnowledge'
import { PROACTIVE_MESSAGES } from '@/lib/chatProactive'
import {
  createChatSession,
  sendChatMessage,
  getVisitorChatMessages,
  getActiveSessionForVisitor,
  resolveChatSession,
  pollNewMessages,
} from '@/lib/supabase/chatService'
import type { ChatSession, ChatMessage } from '@/lib/supabase/chatService'

type ChatMode = 'aria' | 'live' | 'connect'

interface ChatMessageUI {
  id: string
  text: string
  sender: 'user' | 'aria' | 'agent' | 'system'
  timestamp: Date
}

let msgCounter = 0
function uid(): string {
  return `msg-${Date.now()}-${++msgCounter}`
}

function renderFormatted(text: string) {
  return text.split('\n').map((line, li) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const elements = parts.map((p, pi) =>
      pi % 2 === 1 ? <strong key={pi} className="font-semibold text-white">{p}</strong> : <span key={pi}>{p}</span>
    )
    return <span key={li}>{li > 0 && <br />}{elements}</span>
  })
}

const PORTAL_PREFIXES = ['/staff', '/admin']

export default function ChatWidget() {
  const pathname = usePathname()
  const isPortal = PORTAL_PREFIXES.some(p => pathname.startsWith(p))
  const [isOpen, setIsOpen] = useState(false)
  const [chatState, setChatState] = useState<'pre-form' | 'active'>('pre-form')
  const [messages, setMessages] = useState<ChatMessageUI[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [showProactive, setShowProactive] = useState(false)
  const [proactiveMsg, setProactiveMsg] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPulse, setShowPulse] = useState(true)
  const [chatMode, setChatMode] = useState<ChatMode>('aria')
  const [agentName, setAgentName] = useState('')
  const [agentConnected, setAgentConnected] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [rated, setRated] = useState(false)

  // Supabase-backed live chat session
  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastPollTimeRef = useRef<string>(new Date().toISOString())
  const seenMsgIds = useRef<Set<string>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load saved state
  useEffect(() => {
    try {
      const savedVisitor = localStorage.getItem('ghl-chat-visitor')
      if (savedVisitor) {
        const v = JSON.parse(savedVisitor)
        setVisitorName(v.name || '')
        setVisitorEmail(v.email || '')
        setChatState('active')
      }
      const savedHistory = localStorage.getItem('ghl-chat-history')
      if (savedHistory) {
        const h = JSON.parse(savedHistory)
        if (h.timestamp && Date.now() - h.timestamp < 24 * 60 * 60 * 1000) {
          setMessages(h.messages.map((m: ChatMessageUI) => ({ ...m, timestamp: new Date(m.timestamp) })))
          setChatState('active')
        } else {
          localStorage.removeItem('ghl-chat-history')
        }
      }
    } catch { /* ignore */ }
  }, [])

  // Restore active session on load
  useEffect(() => {
    async function restoreSession() {
      const session = await getActiveSessionForVisitor()
      if (session) {
        setChatSession(session)
        // Load message history from Supabase via RPC (bypasses RLS)
        const history = await getVisitorChatMessages(session.id)
        if (history.length > 0) {
          const uiMessages: ChatMessageUI[] = history.map(m => ({
            id: m.id,
            text: m.message,
            sender: m.sender_type === 'visitor' ? 'user'
              : m.sender_type === 'agent' ? 'agent'
              : m.sender_type === 'bot' ? 'aria'
              : 'system',
            timestamp: new Date(m.created_at),
          }))
          // Track seen IDs to prevent duplicate display
          history.forEach(m => seenMsgIds.current.add(m.id))
          setMessages(prev => prev.length > 0 ? prev : uiMessages)
          // Set poll timestamp to last message
          lastPollTimeRef.current = history[history.length - 1].created_at
        }
        if (session.assigned_rep_id) {
          setAgentConnected(true)
          setAgentName('Support Agent')
        }
        // Start polling if in live mode
        setChatMode('live')
      }
    }
    restoreSession()
  }, [])

  // Poll for new agent messages every 3 seconds (bypasses RLS via RPC)
  useEffect(() => {
    if (!chatSession?.id || chatMode !== 'live') {
      // Clear any existing poll
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }

    const sessionId = chatSession.id

    const poll = async () => {
      const newMsgs = await pollNewMessages(sessionId, lastPollTimeRef.current)
      if (newMsgs.length > 0) {
        const unseen = newMsgs.filter(m => !seenMsgIds.current.has(m.id))
        if (unseen.length > 0) {
          unseen.forEach(m => seenMsgIds.current.add(m.id))
          lastPollTimeRef.current = unseen[unseen.length - 1].created_at

          const uiMsgs: ChatMessageUI[] = unseen.map(m => ({
            id: m.id,
            text: m.message,
            sender: m.sender_type === 'agent' ? 'agent' as const : 'system' as const,
            timestamp: new Date(m.created_at),
          }))

          setMessages(prev => [...prev, ...uiMsgs])
          setIsTyping(false)

          // Check if an agent responded
          const agentMsg = unseen.find(m => m.sender_type === 'agent')
          if (agentMsg) {
            setAgentConnected(true)
            if (agentMsg.sender_name) setAgentName(agentMsg.sender_name)
          }
          if (!isOpen) setUnreadCount(prev => prev + unseen.length)

          // Play notification sound for new messages
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRl9vT19teleXRlZm10IBAAAAABAAIAQB8AAEAfAAAAAAAAAAAAZGF0YQ==')
            audio.volume = 0.3
            audio.play().catch(() => {})
          } catch {}
        }
      }
    }

    // Start polling every 3 seconds
    pollRef.current = setInterval(poll, 3000)
    // Also poll immediately
    poll()

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [chatSession?.id, chatMode, isOpen])

  // External open event (from dashboard support tab)
  useEffect(() => {
    const handleExternalOpen = () => setIsOpen(true)
    window.addEventListener('ghl-open-chat', handleExternalOpen)
    return () => window.removeEventListener('ghl-open-chat', handleExternalOpen)
  }, [])

  // Proactive message based on page
  useEffect(() => {
    const pm = PROACTIVE_MESSAGES[pathname]
    if (pm && !isOpen) {
      const timer = setTimeout(() => {
        setShowProactive(true)
        setProactiveMsg(pm.message)
        const dismiss = setTimeout(() => setShowProactive(false), 6000)
        return () => clearTimeout(dismiss)
      }, pm.delay)
      return () => clearTimeout(timer)
    }
  }, [pathname, isOpen])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input
  useEffect(() => {
    if (isOpen && chatState === 'active') {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, chatState])

  // Save history
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ghl-chat-history', JSON.stringify({ messages, timestamp: Date.now() }))
    }
  }, [messages])

  const addWelcome = useCallback((name?: string) => {
    const welcome: ChatMessageUI = {
      id: uid(),
      text: `Hi${name ? `, ${name}` : ''}! I'm ARIA, your GHL investment assistant.\n\nI can help you with our investment routes, fund details, or connect you with an advisor.\n\nWhat would you like to know?`,
      sender: 'aria',
      timestamp: new Date(),
    }
    setMessages([welcome])
    setQuickReplies(['Investment Routes', 'Minimum Investment', 'How to Invest', 'Talk to Advisor'])
  }, [])

  const handleOpen = () => {
    setShowProactive(false)
    setShowPulse(false)
    setUnreadCount(0)
    if (messages.length === 0 && chatState === 'active') {
      addWelcome(visitorName)
    }
    setIsOpen(true)
  }

  const handlePreFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = visitorName.trim()
    if (!name) return
    localStorage.setItem('ghl-chat-visitor', JSON.stringify({ name, email: visitorEmail }))
    setChatState('active')
    addWelcome(name)
  }

  const handleSkip = () => {
    setChatState('active')
    addWelcome()
  }

  // ── Start a live chat session via Supabase ──
  const startLiveChatSession = useCallback(async () => {
    const session = await createChatSession({
      visitorName: visitorName || 'Visitor',
      visitorEmail: visitorEmail || undefined,
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      channel: 'web_chat',
    })
    if (session) {
      setChatSession(session)
      // Send a system message indicating the session started
      await sendChatMessage({
        sessionId: session.id,
        senderType: 'system',
        message: `${visitorName || 'Visitor'} started a live chat from ${pathname}`,
      })
    }
    return session
  }, [visitorName, visitorEmail, pathname])

  // ── Mode switching ──
  const handleModeSwitch = useCallback(async (mode: ChatMode) => {
    if (mode === chatMode) return
    setChatMode(mode)
    setQuickReplies([])
    setShowRating(false)
    setRated(false)

    if (mode === 'aria') {
      const msg: ChatMessageUI = {
        id: uid(),
        text: `Switched to **ARIA Bot** — your AI assistant.\n\nHow can I help you?`,
        sender: 'system',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, msg])
      setQuickReplies(['Investment Routes', 'Minimum Investment', 'How to Invest', 'Talk to Advisor'])
      setChatState('active')
      setAgentConnected(false)
    } else if (mode === 'live') {
      setAgentConnected(false)

      const connectMsg: ChatMessageUI = {
        id: uid(),
        text: `Connecting you to a live agent...`,
        sender: 'system',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, connectMsg])
      setChatState('active')
      setIsTyping(true)

      // Create a Supabase chat session for real-time routing
      const session = await startLiveChatSession()

      if (session && session.assigned_rep_id) {
        // Rep was auto-assigned
        setTimeout(() => {
          setIsTyping(false)
          setAgentConnected(true)
          setAgentName('Support Agent')
          const agentMsg: ChatMessageUI = {
            id: uid(),
            text: 'An agent has been assigned and will respond shortly. Please share your question!',
            sender: 'system',
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, agentMsg])
          setQuickReplies(['Tell me about AIF', 'Investment options', 'Schedule a call', 'SEBI Co-Invest'])
        }, 1500)
      } else {
        // No reps available — queued
        setTimeout(() => {
          setIsTyping(false)
          const queueMsg: ChatMessageUI = {
            id: uid(),
            text: `All our agents are currently busy. You've been placed in the queue and will be connected shortly.\n\nEstimated wait time: **~2 minutes**\n\nYou can also switch to ARIA Bot for instant answers.`,
            sender: 'system',
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, queueMsg])
          setQuickReplies(['Switch to ARIA Bot', 'I\'ll wait'])
        }, 2500)
      }
    }
    // 'connect' mode doesn't add messages — just shows the panel
  }, [chatMode, startLiveChatSession])

  // ── Send message ──
  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content) return
    const userMsg: ChatMessageUI = { id: uid(), text: content, sender: 'user', timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setQuickReplies([])
    setIsTyping(true)

    if (chatMode === 'aria') {
      const { text: response, quickReplies: qr } = findBestResponse(content)
      const delay = Math.min(600 + response.length * 8, 2500)
      setTimeout(() => {
        const botMsg: ChatMessageUI = { id: uid(), text: response, sender: 'aria', timestamp: new Date() }
        setMessages(prev => [...prev, botMsg])
        setQuickReplies(qr)
        setIsTyping(false)
        if (!isOpen) setUnreadCount(prev => prev + 1)
      }, delay)
    } else if (chatMode === 'live') {
      // Send to Supabase — agent will respond in real-time via subscription
      if (chatSession?.id) {
        await sendChatMessage({
          sessionId: chatSession.id,
          senderType: 'visitor',
          senderName: visitorName || 'Visitor',
          message: content,
        })
      }

      // If no agent connected yet, show a waiting message after a delay
      if (!agentConnected) {
        setTimeout(() => {
          setIsTyping(false)
          // Don't add a fake response — wait for real agent via realtime
        }, 3000)
      } else {
        // Agent is connected — they'll respond via Supabase Realtime
        // Set a timeout to stop typing indicator if no response comes
        setTimeout(() => {
          setIsTyping(false)
        }, 10000)
      }
    }
  }, [input, isOpen, chatMode, chatSession, agentConnected, visitorName])

  const handleRate = async (rating: string) => {
    setRated(true)
    setShowRating(false)
    const rateMsg: ChatMessageUI = {
      id: uid(),
      text: `Thanks for the feedback! You rated this conversation: **${rating}**\n\nWe appreciate you chatting with us.`,
      sender: 'system',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, rateMsg])

    // Save rating to Supabase
    if (chatSession?.id) {
      await resolveChatSession(chatSession.id, rating)
    }
  }

  // ── Determine accent color per mode ──
  const modeAccent = chatMode === 'aria' ? '#D0021B' : chatMode === 'live' ? '#059669' : '#3B82F6'
  const modeGradient = chatMode === 'aria'
    ? 'linear-gradient(135deg, #D0021B, #8B0000)'
    : chatMode === 'live'
      ? 'linear-gradient(135deg, #059669, #047857)'
      : 'linear-gradient(135deg, #3B82F6, #2563EB)'

  // ── Bot avatar icon per mode ──
  const BotAvatar = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => {
    const s = size === 'md' ? 'w-8 h-8' : 'w-6 h-6'
    const icon = size === 'md' ? 'w-4 h-4' : 'w-3 h-3'
    return (
      <div className={`${s} rounded-md flex items-center justify-center shrink-0`} style={{ background: modeGradient }}>
        {chatMode === 'aria' ? <Bot className={`${icon} text-white`} /> : <User className={`${icon} text-white`} />}
      </div>
    )
  }

  const isActiveChat = chatState === 'active' && chatMode !== 'connect'

  // Don't render on staff/admin/dashboard portals
  if (isPortal) return null

  return (
    <div id="ghl-chat-widget" data-ghl-widget="chat">
      {/* ── Collapsed: Avatar Button ── */}
      <div className="fixed z-[9999]" style={{ bottom: '24px', right: '24px' }}>
        {/* Proactive bubble */}
        {showProactive && !isOpen && (
          <div className="absolute bottom-[84px] right-0 animate-fade-in" style={{ width: '280px' }}>
            <div
              className="relative rounded-2xl px-4 py-3 text-[13px] leading-relaxed text-white"
              style={{
                background: 'rgba(10,10,10,0.92)',
                backdropFilter: 'blur(28px)',
                border: '1px solid rgba(208,2,27,0.25)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              }}
            >
              {proactiveMsg}
              <div
                className="absolute -bottom-2 right-6 w-4 h-4 rotate-45"
                style={{
                  background: 'rgba(10,10,10,0.92)',
                  borderRight: '1px solid rgba(208,2,27,0.25)',
                  borderBottom: '1px solid rgba(208,2,27,0.25)',
                }}
              />
            </div>
          </div>
        )}

        {!isOpen && (
          <button
            onClick={handleOpen}
            className="group relative w-14 h-14 flex items-center justify-center focus:outline-none"
            aria-label="Open chat"
          >
            {showPulse && (
              <span className="absolute inset-0 rounded-full animate-pulse-ring" style={{ border: `2px solid rgba(208,2,27,0.5)` }} />
            )}
            <span
              className="absolute inset-0 rounded-full animate-spin-slow"
              style={{ border: '1.5px solid transparent', borderTopColor: 'rgba(208,2,27,0.6)', borderRightColor: 'rgba(208,2,27,0.2)' }}
            />
            <span
              className="relative w-12 h-12 rounded-xl flex items-center justify-center text-white"
              style={{
                background: 'linear-gradient(135deg, #D0021B 0%, #8B0000 100%)',
                boxShadow: '0 0 24px rgba(208,2,27,0.5)',
              }}
            >
              <MessageCircle className="w-5 h-5" />
            </span>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ── Expanded Chat Panel ── */}
      <div
        className={`fixed z-[9999] transition-all duration-300 ease-out ${
          isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
        style={{
          bottom: '24px', right: '24px', width: '380px', height: '540px',
          maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 120px)',
          background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
        role="dialog" aria-label="Chat"
      >
        <div className="flex flex-col h-full">
          {/* ── Header ── */}
          <div className="flex items-center px-5 py-3 shrink-0">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: modeGradient }}>
                {chatMode === 'aria' ? <Bot className="w-4 h-4 text-white" /> : chatMode === 'live' ? <Headphones className="w-4 h-4 text-white" /> : <PhoneCall className="w-4 h-4 text-white" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold text-sm">
                    {chatMode === 'aria' ? 'ARIA Bot' : chatMode === 'live' ? (agentConnected ? agentName : 'Live Chat') : 'Connect'}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${chatMode === 'live' && agentConnected ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400'}`} />
                </div>
                <p className="text-[10px] text-gray-500">
                  {chatMode === 'aria' ? 'AI Assistant · Instant replies' : chatMode === 'live' ? (agentConnected ? 'Live Agent · Online now' : 'Connecting to agent...') : 'Choose how to reach us'}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors ml-1">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setIsOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── 3-Mode Toggle Switch ── */}
          <div className="shrink-0 px-4 pb-2">
            <div className="flex items-center rounded-full p-0.5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { mode: 'aria' as ChatMode, icon: <Bot className="w-3 h-3" />, label: 'ARIA Bot', grad: 'linear-gradient(135deg, #D0021B, #8B0000)' },
                { mode: 'live' as ChatMode, icon: <Headphones className="w-3 h-3" />, label: 'Live Chat', grad: 'linear-gradient(135deg, #059669, #047857)' },
                { mode: 'connect' as ChatMode, icon: <PhoneCall className="w-3 h-3" />, label: 'Connect', grad: 'linear-gradient(135deg, #3B82F6, #2563EB)' },
              ].map(({ mode, icon, label, grad }) => (
                <button
                  key={mode}
                  onClick={() => handleModeSwitch(mode)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-[10px] font-semibold transition-all duration-300 ${
                    chatMode === mode ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                  }`}
                  style={chatMode === mode ? { background: grad } : {}}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px shrink-0" style={{ background: `${modeAccent}33` }} />

          {/* ── Pre-Form ── */}
          {chatState === 'pre-form' && chatMode !== 'connect' && (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center w-full">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: modeGradient }}>
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-base mb-1">Before we start...</h3>
                <p className="text-gray-500 text-xs mb-5">Tell us who you are for a better experience</p>
                <form onSubmit={handlePreFormSubmit} className="space-y-3">
                  <input
                    type="text" value={visitorName} onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Your Name *" required
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <input
                    type="email" value={visitorEmail} onChange={(e) => setVisitorEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90" style={{ background: modeGradient }}>
                    Start Chat
                  </button>
                </form>
                <button onClick={handleSkip} className="text-gray-500 text-xs mt-3 hover:text-white transition-colors">
                  Skip &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ── Connect Panel ── */}
          {chatMode === 'connect' && (
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Chat with a real person banner */}
              <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div className="flex items-center space-x-2 mb-1.5">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm font-semibold">Chat with a real person</span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed mb-2">
                  Switch to <strong className="text-emerald-400">Live Chat</strong> to talk to one of our advisors in real time.
                </p>
                <button
                  onClick={() => handleModeSwitch('live')}
                  className="w-full py-2 rounded-lg text-white text-xs font-semibold transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                >
                  <Headphones className="w-3 h-3 inline mr-1.5" />
                  Start Live Chat
                </button>
              </div>

              <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mb-3">Or choose a channel</p>

              {/* WhatsApp */}
              <a
                href="https://wa.me/917200255252?text=Hi%2C%20I%27d%20like%20to%20learn%20more%20about%20GHL%20India%20Ventures."
                target="_blank" rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 rounded-xl transition-all hover:scale-[1.02] mb-2.5"
                style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">WhatsApp</p>
                  <p className="text-gray-400 text-[11px]">Chat instantly · +91 7200 255 252</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500" />
              </a>

              {/* Video Call */}
              <button
                onClick={() => {
                  setIsOpen(false)
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('ghl-open-video-call'))
                  }, 300)
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all hover:scale-[1.02] mb-2.5 text-left"
                style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Video Call</p>
                  <p className="text-gray-400 text-[11px]">Schedule a face-to-face consultation</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500" />
              </button>

              {/* Email */}
              <a
                href="mailto:info@ghlindiaventures.com?subject=Investment%20Inquiry%20-%20GHL%20India%20Ventures"
                className="flex items-center space-x-3 p-3 rounded-xl transition-all hover:scale-[1.02] mb-2.5"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Email Us</p>
                  <p className="text-gray-400 text-[11px]">info@ghlindiaventures.com</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500" />
              </a>

              {/* Phone */}
              <button
                onClick={() => {
                  setIsOpen(false)
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('ghl-open-direct-call'))
                  }, 300)
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all hover:scale-[1.02] mb-2.5 text-left"
                style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Call Us</p>
                  <p className="text-gray-400 text-[11px]">+91 7200 255 252 · Mon–Sat 9:30 AM–6:30 PM</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500" />
              </button>

              {/* Telegram */}
              <a
                href="https://t.me/ghlindia"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(0,136,204,0.12)', border: '1px solid rgba(0,136,204,0.25)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-[#0088cc] flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Telegram</p>
                  <p className="text-gray-400 text-[11px]">@ghlindia · Message anytime</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500" />
              </a>

              {/* Estimated response time */}
              <div className="flex items-center justify-center space-x-1.5 mt-4 text-[10px] text-gray-600">
                <Clock className="w-3 h-3" />
                <span>Avg. response time: &lt; 2 hours during business hours</span>
              </div>
            </div>
          )}

          {/* ── Active Chat (ARIA or Live) ── */}
          {isActiveChat && (
            <>
              {/* Live chat banner */}
              {chatMode === 'live' && agentConnected && (
                <div className="shrink-0 px-4 py-2" style={{ background: 'rgba(5,150,105,0.08)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-emerald-400 text-[11px] font-medium">
                        {agentName} is assisting you
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online
                    </span>
                  </div>
                </div>
              )}

              <div
                className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
                style={{ scrollbarWidth: 'thin', scrollbarColor: `${modeAccent}66 transparent` }}
              >
                {messages.map((msg, i) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    {msg.sender === 'system' ? (
                      /* System message */
                      <div className="w-full flex justify-center">
                        <span className="px-3 py-1 rounded-full text-[10px] text-gray-500 bg-white/5">{renderFormatted(msg.text)}</span>
                      </div>
                    ) : msg.sender === 'user' ? (
                      /* User message */
                      <div className="max-w-[80%]">
                        <div className="px-3.5 py-2.5 rounded-2xl rounded-tr-md text-[13px] leading-relaxed text-white" style={{ background: `${modeAccent}22`, border: `1px solid ${modeAccent}33` }}>
                          {msg.text}
                        </div>
                      </div>
                    ) : (
                      /* Bot / Agent message */
                      <div className="flex items-start space-x-2 max-w-[88%]">
                        <div className="mt-0.5">
                          <BotAvatar />
                        </div>
                        <div>
                          <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md text-[13px] leading-relaxed text-gray-200" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {renderFormatted(msg.text)}
                          </div>
                          {i === messages.length - 1 && (msg.sender === 'aria' || msg.sender === 'agent') && (
                            <div className="flex items-center mt-1 ml-1 space-x-1">
                              <CheckCheck className="w-3 h-3 text-blue-400" />
                              <span className="text-[9px] text-gray-600">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Quick Replies */}
                {quickReplies.length > 0 && !isTyping && (
                  <div className="flex flex-wrap gap-1.5 pt-1 animate-fade-in">
                    {quickReplies.map((qr) => (
                      <button
                        key={qr} onClick={() => handleSend(qr)}
                        className="px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-300 hover:text-white transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${modeAccent}44` }}
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}

                {/* Satisfaction rating */}
                {showRating && !rated && chatMode === 'live' && (
                  <div className="animate-fade-in rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-gray-400 text-[11px] mb-2">How is your experience so far?</p>
                    <div className="flex items-center justify-center gap-4">
                      {[
                        { icon: <Smile className="w-5 h-5" />, label: 'Great', color: 'text-emerald-400 hover:text-emerald-300' },
                        { icon: <Meh className="w-5 h-5" />, label: 'Okay', color: 'text-amber-400 hover:text-amber-300' },
                        { icon: <Frown className="w-5 h-5" />, label: 'Poor', color: 'text-red-400 hover:text-red-300' },
                      ].map(({ icon, label, color }) => (
                        <button key={label} onClick={() => handleRate(label)} className={`flex flex-col items-center gap-1 transition-all ${color}`}>
                          {icon}
                          <span className="text-[9px]">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-start space-x-2 animate-fade-in">
                    <BotAvatar />
                    <div className="px-4 py-3 rounded-2xl rounded-tl-md" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="flex space-x-1.5">
                        {[0, 150, 300].map((d) => (
                          <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                    {chatMode === 'live' && !agentConnected && (
                      <span className="text-[10px] text-gray-600 self-center ml-1">Finding an agent...</span>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="shrink-0 px-4 pt-2 pb-2">
                <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex items-center space-x-2">
                  <button type="button" className="text-gray-600 hover:text-gray-400 transition-colors" title="Attachments coming soon">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                    placeholder={chatMode === 'live' ? `Message ${agentConnected ? agentName : 'agent'}...` : 'Type a message...'}
                    disabled={isTyping}
                    className="flex-1 px-3.5 py-2 rounded-full text-[13px] text-white placeholder-gray-500 outline-none"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <button
                    type="submit" disabled={!input.trim() || isTyping}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-all hover:scale-105"
                    style={{ background: input.trim() ? modeGradient : `${modeAccent}44` }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
                <p className="text-[9px] text-gray-600 text-center mt-1.5">
                  {chatMode === 'aria' ? 'ARIA provides information, not financial advice.' : `You're chatting with ${agentConnected ? agentName : 'our team'}.`}
                </p>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="shrink-0 text-center py-2 text-[9px] text-gray-600 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            Private &amp; Secure &middot; Powered by GHL AI
          </div>
        </div>
      </div>
    </div>
  )
}
