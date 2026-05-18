/* ─────────────────────────────────────────────────────────────
   GHL Sarvam Widget — multilingual concierge on the left middle
   of the public site.

   • Bot mode: instant answers from SARVAM_KB (with TTS playback
     in 11+ Indian languages and Sarvam STT voice input).
   • Human mode: hands the session to the Staff Portal "GHL
     Sarvam" tab via the existing chat_sessions backbone — a
     CS supervisor can take over and reply in real time.
   • Channel tagged 'sarvam' so the regular CS Live Chat queue
     stays clean; only the Sarvam tab picks these up.
   ───────────────────────────────────────────────────────────── */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import {
  Sparkles, X, Send, Mic, MicOff, Loader2, Globe, Headphones,
  Bot, User, ChevronRight,
} from 'lucide-react'
import {
  createChatSession,
  sendChatMessage,
  getVisitorChatMessages,
  getActiveSessionForVisitor,
  pollNewMessages,
  type ChatSession,
} from '@/lib/supabase/chatService'
import {
  SARVAM_LANGUAGES,
  SARVAM_TTS_LANGUAGES,
  toSarvamLangCode,
  type SarvamLanguageCode,
} from '@/lib/sarvamService'
import { speechToText } from '@/lib/sarvam/sarvamService'
import { findSarvamKBAnswer, SARVAM_KB } from './SarvamKnowledge'
import TTSPlayer from '@/components/shared/TTSPlayer'

const PORTAL_PREFIXES = ['/staff', '/admin', '/dashboard']

const ACCENT = '#6366F1'         // indigo-500
const GRADIENT = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'

type SarvamMode = 'bot' | 'human'

interface SarvamMessage {
  id: string
  text: string
  sender: 'user' | 'bot' | 'agent' | 'system'
  timestamp: Date
  /** When set, the speaker on this bubble auto-plays in this language. */
  lang?: SarvamLanguageCode
}

let counter = 0
function uid() { return `sm-${Date.now()}-${++counter}` }

function renderMarkdown(text: string) {
  return text.split('\n').map((line, li) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const els = parts.map((p, pi) =>
      pi % 2 === 1 ? <strong key={pi} className="font-semibold text-white">{p}</strong> : <span key={pi}>{p}</span>
    )
    return <span key={li}>{li > 0 && <br />}{els}</span>
  })
}

export default function SarvamWidget() {
  const pathname = usePathname()
  const isPortal = PORTAL_PREFIXES.some(p => pathname.startsWith(p))

  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<SarvamMode>('bot')
  const [messages, setMessages] = useState<SarvamMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [langCode, setLangCode] = useState<SarvamLanguageCode>('en-IN')
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [unread, setUnread] = useState(0)
  const [session, setSession] = useState<ChatSession | null>(null)
  const [agentName, setAgentName] = useState<string>('')
  const [showPulse, setShowPulse] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastPollRef = useRef<string>(new Date().toISOString())
  const seenMsgIds = useRef<Set<string>>(new Set())

  // ── Initial welcome ────────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) {
      const welcome = SARVAM_KB.find(e => e.id === 'sarvam-greet')!
      setMessages([{
        id: uid(),
        text: welcome.answer,
        sender: 'bot',
        timestamp: new Date(),
        lang: langCode,
      }])
      setSuggestions(welcome.suggestions || [])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Restore active session on mount (only if it's a Sarvam session) ──
  useEffect(() => {
    async function restore() {
      const s = await getActiveSessionForVisitor()
      if (s && s.channel === 'sarvam') {
        setSession(s)
        setMode('human')
        const history = await getVisitorChatMessages(s.id)
        if (history.length > 0) {
          const uiMsgs: SarvamMessage[] = history.map(m => ({
            id: m.id,
            text: m.message,
            sender: m.sender_type === 'visitor' ? 'user'
              : m.sender_type === 'agent' ? 'agent'
              : m.sender_type === 'bot' ? 'bot' : 'system',
            timestamp: new Date(m.created_at),
            lang: langCode,
          }))
          history.forEach(m => seenMsgIds.current.add(m.id))
          setMessages(uiMsgs)
          lastPollRef.current = history[history.length - 1].created_at
        }
        if (s.assigned_rep_id) setAgentName('Supervisor')
      }
    }
    restore()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Poll for supervisor messages when in human mode ─────────
  useEffect(() => {
    if (!session?.id || mode !== 'human') {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }
    const sessionId = session.id

    const poll = async () => {
      const newMsgs = await pollNewMessages(sessionId, lastPollRef.current)
      if (newMsgs.length > 0) {
        const unseen = newMsgs.filter(m => !seenMsgIds.current.has(m.id))
        if (unseen.length > 0) {
          unseen.forEach(m => seenMsgIds.current.add(m.id))
          lastPollRef.current = unseen[unseen.length - 1].created_at
          const uiMsgs: SarvamMessage[] = unseen.map(m => ({
            id: m.id,
            text: m.message,
            sender: m.sender_type === 'agent' ? 'agent' as const
              : m.sender_type === 'system' ? 'system' as const
              : 'bot' as const,
            timestamp: new Date(m.created_at),
            lang: langCode,
          }))
          setMessages(prev => [...prev, ...uiMsgs])
          setIsTyping(false)

          const agentMsg = unseen.find(m => m.sender_type === 'agent')
          if (agentMsg) {
            if (agentMsg.sender_name) setAgentName(agentMsg.sender_name)
            else setAgentName('Supervisor')
          }
          if (!isOpen) setUnread(prev => prev + unseen.length)
        }
      }
    }
    pollRef.current = setInterval(poll, 3000)
    poll()
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [session?.id, mode, isOpen, langCode])

  // ── Auto-scroll ────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, isTyping])

  // ── Focus input on open ────────────────────────────────────
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 250)
    if (isOpen) { setUnread(0); setShowPulse(false) }
  }, [isOpen])

  // ── Bot reply ──────────────────────────────────────────────
  const replyAsBot = useCallback((userText: string) => {
    const match = findSarvamKBAnswer(userText)
    const fallback = `I do not have that exact answer yet, but I can connect you with a human supervisor — tap "Talk to a human" below.`
    const reply: SarvamMessage = {
      id: uid(),
      text: match ? match.entry.answer : fallback,
      sender: 'bot',
      timestamp: new Date(),
      lang: langCode,
    }
    const delay = Math.min(500 + reply.text.length * 6, 1800)
    setTimeout(() => {
      setMessages(prev => [...prev, reply])
      setSuggestions(match?.entry.suggestions || ['Talk to a human', 'What is AIF?', 'Minimum investment'])
      setIsTyping(false)
      if (!isOpen) setUnread(u => u + 1)
    }, delay)
  }, [isOpen, langCode])

  // ── Send message ───────────────────────────────────────────
  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content) return
    const userMsg: SarvamMessage = { id: uid(), text: content, sender: 'user', timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSuggestions([])
    setIsTyping(true)

    if (mode === 'bot') {
      replyAsBot(content)
      return
    }

    // Human mode — persist to Supabase, supervisor will see it
    if (session?.id) {
      await sendChatMessage({
        sessionId: session.id,
        senderType: 'visitor',
        senderName: 'Visitor',
        message: content,
      })
    }
    setTimeout(() => setIsTyping(false), 8000)
  }, [input, mode, session, replyAsBot])

  // ── Mode switch ────────────────────────────────────────────
  const switchToHuman = useCallback(async () => {
    if (mode === 'human') return
    setMode('human')
    setIsTyping(true)
    setSuggestions([])

    const sys: SarvamMessage = {
      id: uid(),
      text: 'Connecting you with a supervisor from the GHL Sarvam team...',
      sender: 'system',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, sys])

    const created = await createChatSession({
      visitorName: 'Sarvam Visitor',
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      channel: 'sarvam',
    })
    if (created) {
      setSession(created)
      await sendChatMessage({
        sessionId: created.id,
        senderType: 'system',
        message: `New GHL Sarvam session opened from ${pathname}. Visitor language: ${langCode}.`,
      })
      // Replay the bot conversation context for the supervisor
      const lastFew = messages.slice(-4)
      for (const m of lastFew) {
        if (m.sender === 'bot' || m.sender === 'user') {
          await sendChatMessage({
            sessionId: created.id,
            senderType: m.sender === 'user' ? 'visitor' : 'bot',
            message: m.text,
          })
        }
      }
    }
    setTimeout(() => setIsTyping(false), 1500)
  }, [mode, pathname, langCode, messages])

  // ── Sarvam STT voice input ─────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (blob.size < 100) return
        setIsProcessingVoice(true)
        try {
          const result = await speechToText(blob, { language_code: langCode })
          if (result.transcript) {
            setInput(result.transcript)
            // Auto-send the transcribed message
            setTimeout(() => handleSend(result.transcript), 200)
          }
        } catch {
          /* silent — user can type instead */
        } finally {
          setIsProcessingVoice(false)
        }
      }
      recorder.start(250)
      setIsRecording(true)
    } catch {
      setIsRecording(false)
    }
  }, [langCode, handleSend])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    setIsRecording(false)
  }, [])

  useEffect(() => {
    if (!isRecording) return
    const t = setTimeout(stopRecording, 30000)
    return () => clearTimeout(t)
  }, [isRecording, stopRecording])

  // ── Don't render on staff/admin/dashboard portals ──────────
  if (isPortal) return null

  const selectedLang = SARVAM_LANGUAGES.find(l => l.code === langCode)

  return (
    <div id="ghl-sarvam-widget" data-ghl-widget="sarvam">
      {/* ── Floating Launcher — left middle ── */}
      <div
        className="fixed z-[9998] pointer-events-auto"
        style={{ left: '20px', top: '50%', transform: 'translateY(-50%)' }}
      >
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex flex-col items-center focus:outline-none"
            aria-label="Open GHL Sarvam multilingual assistant"
          >
            {showPulse && (
              <span
                className="absolute inset-0 rounded-2xl animate-pulse-ring pointer-events-none"
                style={{ border: `2px solid ${ACCENT}80` }}
              />
            )}
            <div
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-105"
              style={{ background: GRADIENT, boxShadow: `0 0 24px ${ACCENT}66` }}
            >
              <Sparkles className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </div>
            <span
              className="mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold text-white tracking-wide"
              style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              SARVAM
            </span>
          </button>
        )}
      </div>

      {/* ── Expanded Panel — slides from left ──
          The Tailwind class `pointer-events-auto` is REQUIRED here
          (not just the inline style). globals.css disables pointer
          events on every descendant of `[data-ghl-widget]` with
          `!important`, and only restores it for elements that
          carry the literal class. Inline style loses that fight. */}
      <div
        className={`fixed z-[9998] transition-all duration-300 ease-out ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{
          left: '20px',
          top: '50%',
          transform: `translateY(-50%) translateX(${isOpen ? '0' : '-1rem'})`,
          opacity: isOpen ? 1 : 0,
          width: '360px',
          height: '560px',
          maxHeight: 'calc(100vh - 120px)',
          maxWidth: 'calc(100vw - 2rem)',
          background: 'rgba(10,10,14,0.95)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(99,102,241,0.18)',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.15)',
        }}
        role="dialog"
        aria-label="GHL Sarvam multilingual concierge"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center px-4 py-3 shrink-0 border-b border-white/[0.06]">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: GRADIENT }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-semibold text-sm">GHL Sarvam</span>
                <span
                  className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold"
                  style={{ background: 'rgba(99,102,241,0.18)', color: '#a5b4fc' }}
                >
                  {mode === 'bot' ? 'AI' : 'LIVE'}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 truncate">
                {mode === 'bot'
                  ? 'Multilingual concierge · 11+ Indian languages'
                  : `${agentName || 'Supervisor'} is on the line`}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Language strip */}
          <div className="shrink-0 px-3 py-2 border-b border-white/[0.04] flex items-center gap-2 relative">
            <button
              onClick={() => setShowLangDropdown(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] transition-colors"
            >
              <Globe className="w-3 h-3" />
              <span>{selectedLang?.native || 'English'}</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${showLangDropdown ? 'rotate-90' : ''}`} />
            </button>
            <span className="text-[10px] text-gray-600">Tap 🔊 on any reply to hear it</span>

            {showLangDropdown && (
              <div
                className="absolute top-full left-3 mt-1 w-56 max-h-[240px] overflow-y-auto rounded-xl shadow-2xl z-10"
                style={{ background: '#0e0e14', border: '1px solid rgba(99,102,241,0.18)' }}
              >
                {SARVAM_LANGUAGES.map(l => {
                  const supportsTTS = SARVAM_TTS_LANGUAGES.includes(l.code as SarvamLanguageCode)
                  return (
                    <button
                      key={l.code}
                      onClick={() => { setLangCode(l.code as SarvamLanguageCode); setShowLangDropdown(false) }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/[0.06] ${
                        langCode === l.code ? 'text-white bg-white/[0.04]' : 'text-gray-400'
                      }`}
                    >
                      <span className="font-medium">{l.native}</span>
                      <span className="text-gray-600 ml-auto text-[10px]">{l.label}</span>
                      {!supportsTTS && (
                        <span className="text-[8px] text-amber-400 uppercase">stt</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
            style={{ scrollbarWidth: 'thin', scrollbarColor: `${ACCENT}66 transparent` }}
          >
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                {msg.sender === 'system' ? (
                  <div className="w-full flex justify-center">
                    <span className="px-3 py-1 rounded-full text-[10px] text-gray-500 bg-white/[0.04]">
                      {renderMarkdown(msg.text)}
                    </span>
                  </div>
                ) : msg.sender === 'user' ? (
                  <div className="max-w-[80%]">
                    <div
                      className="px-3.5 py-2.5 rounded-2xl rounded-tr-md text-[13px] leading-relaxed text-white"
                      style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}33` }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  /* Bot or Agent */
                  <div className="flex items-start space-x-2 max-w-[88%]">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: GRADIENT }}
                    >
                      {msg.sender === 'agent'
                        ? <User className="w-3 h-3 text-white" />
                        : <Bot className="w-3 h-3 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <div
                        className="px-3.5 py-2.5 rounded-2xl rounded-tl-md text-[13px] leading-relaxed text-gray-100"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        {renderMarkdown(msg.text)}
                      </div>
                      <div className="flex items-center gap-2 mt-1 ml-1">
                        <TTSPlayer
                          text={msg.text}
                          lang={msg.lang || langCode}
                          size="sm"
                          accent={ACCENT}
                        />
                        <span className="text-[9px] text-gray-600">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Suggestions */}
            {suggestions.length > 0 && !isTyping && (
              <div className="flex flex-wrap gap-1.5 pt-1 animate-fade-in">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => s.toLowerCase().includes('human') || s.toLowerCase().includes('advisor') || s.toLowerCase().includes('supervisor')
                      ? switchToHuman()
                      : handleSend(s)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-300 hover:text-white transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${ACCENT}44` }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {isTyping && (
              <div className="flex items-start space-x-2 animate-fade-in">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: GRADIENT }}
                >
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-md" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex space-x-1.5">
                    {[0, 150, 300].map(d => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Talk to human row */}
          {mode === 'bot' && (
            <div className="shrink-0 px-3 pb-2">
              <button
                onClick={switchToHuman}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${ACCENT}55`, color: '#c7d2fe' }}
              >
                <Headphones className="w-3.5 h-3.5" />
                Talk to a human supervisor
              </button>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 px-3 pt-2 pb-3 border-t border-white/[0.04]">
            <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex items-center gap-2">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessingVoice}
                title={isRecording ? 'Stop recording' : `Speak (${selectedLang?.native})`}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0"
                style={{
                  background: isRecording ? `${ACCENT}33` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isRecording ? ACCENT : 'rgba(255,255,255,0.08)'}`,
                  color: isRecording ? '#ef4444' : '#a5b4fc',
                }}
              >
                {isProcessingVoice ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : isRecording ? <MicOff className="w-3.5 h-3.5" />
                  : <Mic className="w-3.5 h-3.5" />}
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={mode === 'human' ? 'Message the supervisor...' : 'Ask in any language...'}
                disabled={isTyping}
                className="flex-1 px-3.5 py-2 rounded-full text-[13px] text-white placeholder-gray-500 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-all hover:scale-105 shrink-0"
                style={{ background: input.trim() ? GRADIENT : `${ACCENT}33` }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <p className="text-[9px] text-gray-600 text-center mt-1.5">
              Powered by Sarvam AI · Multilingual concierge for GHL India Ventures
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
