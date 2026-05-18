/* ─────────────────────────────────────────────────────────────
   GHL Smarty — Staff Portal Module

   Mirrors the website-side <SarvamWidget /> from the supervisor
   side. Lists live chat_sessions where channel='sarvam', lets
   a supervisor take over (reassignChat) and reply in real time,
   and exposes the GHL Smarty knowledge base as a side-panel.

   Internal IDs ('sarvam', file names, routes) stay unchanged —
   only user-visible labels are "GHL Smarty".

   Reuses the existing chatService backbone — no new tables.
   ───────────────────────────────────────────────────────────── */

'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Sparkles, MessageCircle, Send, Loader2, BookOpen, UserCheck,
  Clock, CheckCircle2, Languages, Volume2, ArrowRight,
} from 'lucide-react'
import AdminGlass from '@/components/admin/shared/AdminGlass'
import AdminBadge from '@/components/admin/shared/AdminBadge'
import AdminKPICard from '@/components/admin/shared/AdminKPICard'
import type { StaffRole } from '@/lib/staff/staffTypes'
import {
  getActiveChatSessions,
  getChatMessages,
  sendChatMessage,
  reassignChat,
  resolveSessionFromStaff,
  type ChatSession,
  type ChatMessage as ChatMsg,
} from '@/lib/supabase/chatService'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { SARVAM_KB } from '@/components/sarvam/SarvamKnowledge'
import TTSPlayer, { type DictOption } from '@/components/shared/TTSPlayer'
import { sarvamDictList, SarvamBrowserError, type SarvamDictEntry } from '@/lib/sarvam/browserClient'

/* Bright-red Smarty accent — matches the public widget (#FF1744 →
   #D0021B). Brand red #D0021B is the deepest end of the gradient. */
const ACCENT = '#FF1744'
const ACCENT_GRAD = 'linear-gradient(135deg, #FF1744 0%, #D0021B 100%)'

const DICT_STORAGE_KEY = 'ghl-sarvam-dict-id'

/** Fetch the staff's available Sarvam pronunciation dictionaries and
 *  expose them as DictOption[] for <TTSPlayer />. Picks are persisted
 *  in localStorage so a supervisor's choice survives reloads. */
function useSarvamDicts() {
  const [dicts, setDicts] = useState<DictOption[]>([])
  const [activeDictId, setActiveDictId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await sarvamDictList()
        if (!mounted) return
        const opts: DictOption[] = (res.dictionaries || []).map((d: SarvamDictEntry) => ({
          id: d.dictionary_id,
          name: d.name || d.dictionary_id,
          word_count: d.word_count ?? null,
          languages: d.languages ?? null,
        }))
        setDicts(opts)

        const stored = typeof window !== 'undefined' ? localStorage.getItem(DICT_STORAGE_KEY) : null
        if (stored && opts.find(o => o.id === stored)) {
          setActiveDictId(stored)
        }
      } catch (err) {
        // Silent — dict picker is optional. SarvamBrowserError just means
        // the user isn't signed in or the function isn't deployed yet.
        if (!(err instanceof SarvamBrowserError)) console.warn('[sarvam] dict list failed', err)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const setActive = useCallback((id: string | null) => {
    setActiveDictId(id)
    if (typeof window === 'undefined') return
    if (id) localStorage.setItem(DICT_STORAGE_KEY, id)
    else localStorage.removeItem(DICT_STORAGE_KEY)
  }, [])

  return { dicts, activeDictId, setActive }
}

interface SarvamModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  role: StaffRole
  currentUserId?: string
  currentUserName?: string
}

// ── Filter helper: only sessions tagged as Sarvam ──────────────
function isSarvamSession(s: ChatSession): boolean {
  return s.channel === 'sarvam' || s.channel === 'web_sarvam'
}

// ════════════════════════════════════════════════════════════════
//  ACTIVE SESSIONS / CONSOLE
// ════════════════════════════════════════════════════════════════

function SarvamConsole({
  showToast, currentUserId, currentUserName,
}: Pick<SarvamModuleProps, 'showToast' | 'currentUserId' | 'currentUserName'>) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const { dicts, activeDictId, setActive } = useSarvamDicts()

  // Poll Sarvam sessions
  useEffect(() => {
    let mounted = true
    async function load() {
      const all = await getActiveChatSessions()
      if (!mounted) return
      setSessions(all.filter(isSarvamSession))
      setLoadingSessions(false)
    }
    load()
    const t = setInterval(load, 5000)
    return () => { mounted = false; clearInterval(t) }
  }, [])

  // Poll messages for the open session
  useEffect(() => {
    if (!selectedId) { setMsgs([]); return }
    let mounted = true
    async function load() {
      const m = await getChatMessages(selectedId!)
      if (mounted) setMsgs(m)
    }
    load()
    const t = setInterval(load, 3000)
    return () => { mounted = false; clearInterval(t) }
  }, [selectedId])

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [msgs])

  const active = useMemo(() => selectedId ? sessions.find(s => s.id === selectedId) : null, [selectedId, sessions])
  const waiting = useMemo(() => sessions.filter(s => s.status === 'waiting' || s.status === 'queued'), [sessions])
  const live = useMemo(() => sessions.filter(s => s.status === 'active' || s.status === 'assigned'), [sessions])

  const handleTakeOver = useCallback(async () => {
    if (!active || !currentUserId) {
      showToast('Cannot take over — missing session or user info', 'error')
      return
    }
    setSending(true)
    const ok = await reassignChat(active.id, currentUserId)
    if (ok) {
      await sendChatMessage({
        sessionId: active.id,
        senderType: 'system',
        message: `${currentUserName || 'A supervisor'} has joined the conversation.`,
      })
      showToast('You have taken over this conversation', 'success')
    } else {
      showToast('Take over failed', 'error')
    }
    setSending(false)
  }, [active, currentUserId, currentUserName, showToast])

  const handleSendReply = useCallback(async () => {
    if (!reply.trim() || !active) return
    const text = reply.trim()
    setReply('')
    setSending(true)
    const sent = await sendChatMessage({
      sessionId: active.id,
      senderType: 'agent',
      senderName: currentUserName || 'Supervisor',
      message: text,
    })
    if (sent) setMsgs(prev => [...prev, sent])
    setSending(false)
  }, [reply, active, currentUserName])

  const handleResolve = useCallback(async () => {
    if (!active) return
    const ok = await resolveSessionFromStaff(active.id)
    if (ok) {
      showToast('Session resolved', 'success')
      setSelectedId(null)
    } else {
      showToast('Resolve failed', 'error')
    }
  }, [active, showToast])

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard title="Smarty Waiting" value={waiting.length} subtitle="Need supervisor" icon={Clock} color={ACCENT} delay={0} />
        <AdminKPICard title="Live Smarty" value={live.length} subtitle="In progress" icon={MessageCircle} color="#8b5cf6" delay={100} />
        <AdminKPICard title="Total Sessions" value={sessions.length} subtitle="All channels" icon={Sparkles} color="#a78bfa" delay={200} />
        <AdminKPICard title="Languages" value={11} subtitle="Sarvam Bulbul TTS" icon={Languages} color="#22d3ee" delay={300} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Session list */}
        <div className="lg:col-span-2">
          <AdminGlass padding="p-0">
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-white">Smarty Sessions</h3>
              <span className="ml-auto text-[10px] text-gray-500">{sessions.length} total</span>
            </div>
            <div className="divide-y divide-white/[0.04] max-h-[520px] overflow-y-auto">
              {loadingSessions ? (
                <div className="flex items-center justify-center py-12 gap-2 text-xs text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Sparkles className="w-8 h-8 text-gray-600 mb-3" />
                  <p className="text-sm text-gray-400">No Smarty sessions yet</p>
                  <p className="text-xs text-gray-600 mt-1">Visitors will arrive here when they tap the SMARTY badge on the website.</p>
                </div>
              ) : sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    selectedId === s.id ? 'bg-rose-500/[0.10]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="text-sm font-medium text-white truncate">{s.visitor_name || 'Visitor'}</span>
                      {(s.status === 'waiting' || s.status === 'queued') && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />}
                    </div>
                    <span className="text-[10px] text-gray-600 shrink-0">
                      {new Date(s.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {s.page_url ? new URL(s.page_url).pathname : 'GHL Smarty'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <AdminBadge
                      label={s.status}
                      variant={s.status === 'waiting' || s.status === 'queued'
                        ? 'warning' as const
                        : s.status === 'active' || s.status === 'assigned'
                          ? 'success' as const
                          : 'info' as const}
                      size="sm"
                    />
                    {s.assigned_rep_id && <AdminBadge label="taken" variant="purple" size="sm" />}
                  </div>
                </button>
              ))}
            </div>
          </AdminGlass>
        </div>

        {/* Thread */}
        <div className="lg:col-span-3">
          <AdminGlass padding="p-0">
            {active ? (
              <div className="flex flex-col h-[560px]">
                {/* Header */}
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: ACCENT_GRAD }}>
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{active.visitor_name || 'Visitor'}</p>
                      <p className="text-[10px] text-gray-500 truncate">{active.page_url || 'GHL Smarty concierge'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!active.assigned_rep_id || active.assigned_rep_id !== currentUserId ? (
                      <button
                        onClick={handleTakeOver}
                        disabled={sending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        style={{ background: ACCENT_GRAD, color: '#fff' }}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Take Over
                      </button>
                    ) : (
                      <AdminBadge label="You're handling" variant="success" size="sm" />
                    )}
                    <button
                      onClick={handleResolve}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolve
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {msgs.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-xs text-gray-500">No messages yet</div>
                  ) : msgs.map(m => (
                    <div key={m.id} className={`flex ${m.sender_type === 'agent' ? 'justify-end' : m.sender_type === 'system' ? 'justify-center' : 'justify-start'}`}>
                      {m.sender_type === 'system' ? (
                        <span className="px-3 py-1 rounded-full text-[10px] text-gray-500 bg-white/[0.04]">{m.message}</span>
                      ) : (
                        <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${
                          m.sender_type === 'agent'
                            ? 'rounded-tr-md bg-rose-500/15 border border-rose-500/25 text-rose-50'
                            : m.sender_type === 'bot'
                              ? 'rounded-tl-md bg-white/[0.05] border border-white/[0.06] text-gray-200'
                              : 'rounded-tl-md bg-white/[0.06] border border-white/[0.08] text-gray-200'
                        }`}>
                          {m.sender_name && m.sender_type !== 'agent' && (
                            <p className="text-[10px] text-rose-300 font-medium mb-0.5">{m.sender_name}</p>
                          )}
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <TTSPlayer
                              text={m.message}
                              accent={ACCENT}
                              size="sm"
                              dictionaryId={activeDictId}
                              dictionaries={dicts}
                              onDictionaryChange={setActive}
                            />
                            <span className="text-[10px] text-gray-600">
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>

                {/* Input */}
                <div className="px-5 py-3 border-t border-white/[0.06]">
                  <form onSubmit={e => { e.preventDefault(); handleSendReply() }} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      placeholder="Reply as Smarty supervisor..."
                      className="flex-1 px-4 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/40"
                    />
                    <button
                      type="submit"
                      disabled={!reply.trim() || sending}
                      className="p-2 rounded-xl text-white transition-colors disabled:opacity-30"
                      style={{ background: ACCENT_GRAD }}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  <p className="text-[10px] text-gray-600 mt-1.5">
                    Replies are delivered live to the visitor's Smarty widget and read aloud on demand.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Sparkles className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Pick a Smarty session to begin</p>
                <p className="text-xs text-gray-600 mt-1">All conversations from the website's GHL Smarty widget appear here.</p>
              </div>
            )}
          </AdminGlass>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
//  KNOWLEDGE BASE
// ════════════════════════════════════════════════════════════════

function SarvamKBView() {
  const [activeId, setActiveId] = useState<string>(SARVAM_KB[0]?.id || '')
  const [search, setSearch] = useState('')
  const { dicts, activeDictId, setActive } = useSarvamDicts()

  const filtered = useMemo(() => {
    if (!search.trim()) return SARVAM_KB
    const q = search.toLowerCase()
    return SARVAM_KB.filter(e =>
      e.question.toLowerCase().includes(q)
      || e.answer.toLowerCase().includes(q)
      || e.keywords.some(k => k.includes(q)),
    )
  }, [search])

  const active = SARVAM_KB.find(e => e.id === activeId) || SARVAM_KB[0]

  return (
    <div className="space-y-4">
      <AdminGlass padding="p-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-rose-400" />
          <h3 className="text-sm font-semibold text-white">Smarty Knowledge Base</h3>
          <span className="ml-auto text-[10px] text-gray-500">{SARVAM_KB.length} answers · 11+ languages</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">These are the canonical replies the GHL Smarty bot uses. They can also be read aloud in any supported language.</p>
      </AdminGlass>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <AdminGlass padding="p-0">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search the KB..."
                className="w-full px-3 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/40"
              />
            </div>
            <div className="divide-y divide-white/[0.04] max-h-[520px] overflow-y-auto">
              {filtered.map(e => (
                <button
                  key={e.id}
                  onClick={() => setActiveId(e.id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    activeId === e.id ? 'bg-rose-500/[0.10]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <p className="text-xs font-medium text-white truncate">{e.question}</p>
                  <p className="text-[10px] text-gray-500 capitalize mt-0.5">{e.category}</p>
                </button>
              ))}
            </div>
          </AdminGlass>
        </div>

        <div className="lg:col-span-3">
          <AdminGlass padding="p-5">
            {active ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <AdminBadge label={active.category} variant="info" size="sm" />
                  <span className="ml-auto">
                    <TTSPlayer
                      text={active.answer}
                      accent={ACCENT}
                      size="md"
                      dictionaryId={activeDictId}
                      dictionaries={dicts}
                      onDictionaryChange={setActive}
                    />
                  </span>
                </div>
                <h4 className="text-base font-semibold text-white mb-2">{active.question}</h4>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{active.answer}</p>
                {active.suggestions && active.suggestions.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Suggested follow-ups</p>
                    <div className="flex flex-wrap gap-1.5">
                      {active.suggestions.map(s => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-full text-[11px] text-rose-200"
                          style={{ background: 'rgba(255,23,68,0.12)', border: '1px solid rgba(255,23,68,0.30)' }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-gray-500">Select an entry to view.</div>
            )}
          </AdminGlass>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
//  OVERVIEW / LANDING
// ════════════════════════════════════════════════════════════════

function SarvamOverview({ navigate }: Pick<SarvamModuleProps, 'navigate'>) {
  const [stats, setStats] = useState<{ active: number; waiting: number; total: number }>({ active: 0, waiting: 0, total: 0 })

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!isSupabaseConfigured()) return
      const all = await getActiveChatSessions()
      const sarvam = all.filter(isSarvamSession)
      if (!mounted) return
      setStats({
        total: sarvam.length,
        active: sarvam.filter(s => s.status === 'active' || s.status === 'assigned').length,
        waiting: sarvam.filter(s => s.status === 'waiting' || s.status === 'queued').length,
      })
    }
    load()
    const t = setInterval(load, 8000)
    return () => { mounted = false; clearInterval(t) }
  }, [])

  return (
    <div className="space-y-4">
      <AdminGlass padding="p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ACCENT_GRAD }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">GHL Smarty — Multilingual Concierge</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live multilingual chat on the public website · Powered by Sarvam AI · 11+ Indian languages · Bulbul TTS · Saaras STT
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <button
            onClick={() => navigate('sarvam/console')}
            className="text-left rounded-xl p-4 transition-all hover:scale-[1.01]"
            style={{ background: 'rgba(255,23,68,0.10)', border: '1px solid rgba(255,23,68,0.30)' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">Console</span>
              <ArrowRight className="w-3.5 h-3.5 text-rose-300" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.active + stats.waiting}</p>
            <p className="text-[11px] text-gray-400 mt-1">Active + waiting sessions</p>
          </button>

          <button
            onClick={() => navigate('sarvam/kb')}
            className="text-left rounded-xl p-4 transition-all hover:scale-[1.01]"
            style={{ background: 'rgba(255,23,68,0.06)', border: '1px solid rgba(255,23,68,0.18)' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">Knowledge Base</span>
              <ArrowRight className="w-3.5 h-3.5 text-rose-300" />
            </div>
            <p className="text-2xl font-bold text-white">{SARVAM_KB.length}</p>
            <p className="text-[11px] text-gray-400 mt-1">Curated answers</p>
          </button>

          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Languages</span>
              <Languages className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-white">11+</p>
            <p className="text-[11px] text-gray-400 mt-1">Sarvam Bulbul TTS</p>
          </div>
        </div>
      </AdminGlass>

      <AdminGlass padding="p-5">
        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-rose-400" />
          How supervisor takeover works
        </h4>
        <ol className="text-xs text-gray-400 leading-relaxed space-y-1.5 ml-4 list-decimal">
          <li>A visitor opens the SMARTY badge on the left of any page and chats with the bot.</li>
          <li>When they tap "Talk to a human supervisor" — or you spot a waiting session here — a chat_sessions row is created with channel = sarvam.</li>
          <li>Open the Console, pick the session, hit Take Over. Your name is broadcast to the visitor and the bot stops auto-replying.</li>
          <li>Type your reply — it is delivered live; the visitor can press the speaker icon to hear it in their chosen Indian language.</li>
          <li>Click Resolve when the conversation is done — it closes from both sides.</li>
        </ol>
      </AdminGlass>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
//  MAIN MODULE
// ════════════════════════════════════════════════════════════════

export default function SarvamModule({ subTab, navigate, showToast, role, currentUserId, currentUserName }: SarvamModuleProps) {
  const tab = subTab || 'overview'
  const TABS = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'console', label: 'Live Console', icon: MessageCircle },
    { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <AdminGlass padding="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ACCENT_GRAD }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">GHL Smarty</h2>
              <p className="text-[11px] text-gray-500">Multilingual concierge · Supervisor takeover · KB</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {TABS.map(t => {
              const Icon = t.icon
              const isActive = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => navigate(t.id === 'overview' ? 'sarvam' : `sarvam/${t.id}`)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isActive
                      ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                      : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:bg-white/[0.06] hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
      </AdminGlass>

      {/* Body */}
      {tab === 'overview' && <SarvamOverview navigate={navigate} />}
      {tab === 'console' && (
        <SarvamConsole
          showToast={showToast}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
      )}
      {tab === 'kb' && <SarvamKBView />}
    </div>
  )
}
