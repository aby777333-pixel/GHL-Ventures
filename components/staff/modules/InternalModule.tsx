'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import AdminGlass from '@/components/admin/shared/AdminGlass'
import AdminBadge from '@/components/admin/shared/AdminBadge'
import { fetchAnnouncements } from '@/lib/supabase/staffDataService'
import { insertRow } from '@/lib/supabase/adminDataService'
import { supabase } from '@/lib/supabase/client'
import {
  getChannels,
  getChannelMessages,
  sendInternalMessage,
  onInternalMessage,
  type InternalChannel,
  type InternalMessage,
} from '@/lib/supabase/internalChatService'
import type { Announcement, StaffUser, StaffRole } from '@/lib/staff/staffTypes'
import {
  fetchActivePolicies,
  type StaffPolicy,
} from '@/lib/supabase/policyService'
import { recordWellnessCheckin } from '@/lib/supabase/wellnessService'
import {
  MessageSquare, Send, Megaphone, FileText, MessageCircle, Heart, Smile,
  Hash, Users, Dumbbell, Brain, Calendar, Scale, ShieldCheck, ChevronRight,
  Lightbulb, Activity, Zap, Eye,
} from 'lucide-react'

// ── Props & Main ────────────────────────────────────────────────
interface InternalModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  user?: StaffUser | null
  role?: StaffRole | null
}

export default function InternalModule({ subTab, navigate, showToast, user, role }: InternalModuleProps) {
  const tab = subTab || 'chat'
  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {
    fetchAnnouncements().then(data => setAnnouncements(data || []))
  }, [])

  switch (tab) {
    case 'chat':        return <ChatView showToast={showToast} user={user} role={role} />
    case 'noticeboard': return <NoticeboardView announcements={announcements} />
    case 'policies':    return <PoliciesView showToast={showToast} />
    case 'feedback':    return <FeedbackView showToast={showToast} />
    case 'wellness':    return <WellnessView showToast={showToast} user={user} />
    default:            return <ChatView showToast={showToast} user={user} role={role} />
  }
}

type Toast = InternalModuleProps['showToast']
type IconFC = React.ComponentType<{ className?: string }>

function SectionHeader({ title, icon: Icon }: { title: string; icon: IconFC }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-teal-400" />
      <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
    </div>
  )
}

// ================================================================
//  1. INTERNAL CHAT (wired to shared internalChatService)
// ================================================================
function ChatView({ showToast, user, role }: { showToast: Toast; user?: StaffUser | null; role?: StaffRole | null }) {
  const channels = getChannels()
  const [activeChannel, setActiveChannel] = useState('general')
  const [messages, setMessages] = useState<InternalMessage[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelName = channels.find(c => c.id === activeChannel)?.name ?? 'channel'

  // Load messages when channel changes
  useEffect(() => {
    let mounted = true
    getChannelMessages(activeChannel).then(msgs => {
      if (mounted) setMessages(msgs)
    })
    return () => { mounted = false }
  }, [activeChannel])

  // Subscribe to realtime messages in the active channel
  useEffect(() => {
    const unsub = onInternalMessage(activeChannel, (payload) => {
      const msg = payload.new as InternalMessage
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })
    return () => { unsub?.() }
  }, [activeChannel])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!msgInput.trim() || sending) return
    if (!user?.id) {
      showToast('Session expired — please sign in again', 'error')
      return
    }
    setSending(true)
    const text = msgInput.trim()
    setMsgInput('')
    const result = await sendInternalMessage(
      activeChannel,
      user.id,
      user.name || user.email || 'Staff Member',
      role || 'staff',
      text,
    )
    if (result) {
      setMessages(prev => {
        if (prev.find(m => m.id === result.id)) return prev
        return [...prev, result]
      })
    } else {
      showToast('Failed to send message', 'error')
    }
    setSending(false)
  }, [msgInput, sending, activeChannel, showToast, user, role])

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts)
      return d.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    } catch { return ts }
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Internal Chat" icon={MessageSquare} />
      <AdminGlass hover={false} padding="p-0">
        <div className="flex h-[480px]">
          {/* Channel List */}
          <div className="w-52 border-r border-white/[0.06] p-3 space-y-1 shrink-0">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-2 mb-2">Channels</p>
            {channels.map(ch => {
              const active = activeChannel === ch.id
              return (
                <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ${active ? 'bg-teal-500/15 text-teal-300' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'}`}>
                  <Hash className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-medium">{ch.name}</span>
                  {ch.unread > 0 && (
                    <span className="ml-auto bg-teal-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{ch.unread}</span>
                  )}
                </button>
              )
            })}
          </div>
          {/* Message Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-semibold text-white">{channelName}</span>
              <span className="text-[10px] text-white/30 ml-auto">{messages.length} messages</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-white/25">No messages yet. Start the conversation!</p>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-teal-300">{msg.user_name}</span>
                    <span className="text-[10px] text-white/25">{formatTime(msg.created_at)}</span>
                    {msg.user_role === 'admin' && (
                      <span className="text-[9px] bg-brand-red/20 text-red-400 px-1.5 py-0.5 rounded font-medium">Admin</span>
                    )}
                  </div>
                  <p className="text-xs text-white/70 mt-0.5 leading-relaxed">{msg.message}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-2">
              <input type="text" value={msgInput} onChange={e => setMsgInput(e.target.value)}
                placeholder={`Message #${channelName}...`}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-teal-500/40"
                onKeyDown={e => { if (e.key === 'Enter') handleSend() }} />
              <button onClick={handleSend} disabled={sending}
                className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 p-2 rounded-lg transition-colors disabled:opacity-50">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </AdminGlass>
    </div>
  )
}

// ================================================================
//  2. COMPANY NOTICEBOARD
// ================================================================
const ANN_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'purple' | 'neutral' }> = {
  'policy-update': { label: 'Policy Update', variant: 'warning' },
  'process-change': { label: 'Process Change', variant: 'info' },
  event: { label: 'Event', variant: 'purple' },
  achievement: { label: 'Achievement', variant: 'success' },
  general: { label: 'General', variant: 'neutral' },
}

function NoticeboardView({ announcements }: { announcements: any[] }) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Company Noticeboard" icon={Megaphone} />
      <div className="space-y-3">
        {announcements.map(ann => {
          const badge = ANN_BADGE[ann.type] ?? { label: ann.type, variant: 'neutral' as const }
          return (
            <AdminGlass key={ann.id} padding="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <AdminBadge label={badge.label} variant={badge.variant} />
                  {ann.pinned && <AdminBadge label="Pinned" variant="error" dot />}
                </div>
                <span className="text-[10px] text-white/30 shrink-0">{ann.postedDate}</span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">{ann.title}</h4>
              <p className="text-xs text-white/60 leading-relaxed mb-3">{ann.content}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30">Posted by {ann.postedBy}</span>
                <span className="text-[10px] text-white/25">{(ann.readBy?.length ?? 0)} read</span>
              </div>
            </AdminGlass>
          )
        })}
      </div>
    </div>
  )
}

// ================================================================
//  3. COMPANY POLICIES  (admin-managed via company_policies table)
// ================================================================
const POLICY_ICON_MAP: Record<string, IconFC> = {
  Calendar, ShieldCheck, Lightbulb, FileText, Heart,
}

function resolvePolicyIcon(name: string | null | undefined): IconFC {
  if (!name) return FileText
  return POLICY_ICON_MAP[name] || FileText
}

function PoliciesView({ showToast }: { showToast: Toast }) {
  const [policies, setPolicies] = useState<StaffPolicy[]>([])
  const [loadingPolicy, setLoadingPolicy] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchActivePolicies().then(list => {
      if (!cancelled) {
        setPolicies(list)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  const handleViewDocument = async (pol: StaffPolicy) => {
    setLoadingPolicy(pol.id)
    try {
      if (pol.external_url) {
        window.open(pol.external_url, '_blank', 'noopener,noreferrer')
        return
      }
      if (pol.bucket && pol.file_path) {
        const sb = supabase as any
        const { data, error } = await sb.storage.from(pol.bucket).createSignedUrl(pol.file_path, 600)
        if (!error && data?.signedUrl) {
          window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
          return
        }
        const pub = sb.storage.from(pol.bucket).getPublicUrl(pol.file_path)
        if (pub?.data?.publicUrl) {
          window.open(pub.data.publicUrl, '_blank', 'noopener,noreferrer')
          return
        }
      }
      showToast(`"${pol.title}" document is not yet uploaded. Please contact HR to upload it.`, 'warning')
    } catch (err) {
      console.error('Error fetching policy document:', err)
      showToast(`Failed to open ${pol.title}`, 'error')
    } finally {
      setLoadingPolicy(null)
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Company Policies" icon={FileText} />
      {loading ? (
        <AdminGlass hover={false} padding="p-6"><p className="text-xs text-white/40 text-center">Loading policies…</p></AdminGlass>
      ) : policies.length === 0 ? (
        <AdminGlass hover={false} padding="p-6">
          <p className="text-xs text-white/40 text-center">No policies published yet. Ask HR to add them in the admin portal.</p>
        </AdminGlass>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {policies.map(pol => {
            const Icon = resolvePolicyIcon(pol.icon)
            const isLoading = loadingPolicy === pol.id
            const lastUpdated = pol.last_updated || (pol.updated_at ? pol.updated_at.slice(0, 10) : '')
            return (
              <AdminGlass key={pol.id} padding="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white mb-1">{pol.title}</h4>
                    {pol.description && <p className="text-[11px] text-white/45 mb-1.5">{pol.description}</p>}
                    <div className="flex items-center gap-3 text-[10px] text-white/35 mb-2 flex-wrap">
                      {lastUpdated && <span>Last updated: {lastUpdated}</span>}
                      {pol.version && <span>{pol.version}</span>}
                      {pol.category && <span className="text-teal-400/70">{pol.category}</span>}
                    </div>
                    <button onClick={() => handleViewDocument(pol)} disabled={isLoading}
                      className="flex items-center gap-1 text-[10px] font-semibold text-teal-400 hover:text-teal-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <Eye className="w-3 h-3" /> {isLoading ? 'Opening...' : 'View Document'}
                    </button>
                  </div>
                </div>
              </AdminGlass>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ================================================================
//  4. FEEDBACK & SUGGESTIONS
// ================================================================
type FeedbackCategory = 'Workplace' | 'Process' | 'Tools' | 'HR' | 'General'
type FeedbackStatus = 'submitted' | 'acknowledged' | 'resolved'

interface FeedbackRow {
  id: string
  category: string
  subject: string
  status: FeedbackStatus | string
  created_at: string
  admin_response?: string | null
}

const FB_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }> = {
  submitted: { label: 'Submitted', variant: 'info' },
  acknowledged: { label: 'Acknowledged', variant: 'warning' },
  resolved: { label: 'Resolved', variant: 'success' },
}

function FeedbackView({ showToast }: { showToast: Toast }) {
  const [category, setCategory] = useState<FeedbackCategory>('General')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recent, setRecent] = useState<FeedbackRow[]>([])

  const loadRecent = useCallback(async () => {
    try {
      const sb = supabase as any
      const { data: { user } } = await sb.auth.getUser()
      if (!user?.id) { setRecent([]); return }
      const { data, error } = await sb
        .from('feedback')
        .select('id, category, subject, status, created_at, admin_response')
        .eq('staff_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (!error && data) setRecent(data as FeedbackRow[])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadRecent() }, [loadRecent])

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) { showToast('Please fill in all required fields', 'warning'); return }
    setSubmitting(true)
    try {
      // Get current user for created_by field
      let userId: string | null = null
      try {
        const sb = supabase as any
        const { data: { user } } = await sb.auth.getUser()
        userId = user?.id || null
      } catch { /* continue */ }
      // Get user name for ticket
      let userName = 'Staff Member'
      try {
        const sb2 = supabase as any
        if (userId) {
          const { data: prof } = await sb2.from('profiles').select('full_name').eq('id', userId).maybeSingle()
          if (prof?.full_name) userName = prof.full_name
        }
      } catch { /* use default */ }
      const feedbackData: Record<string, any> = {
        staff_id: userId,
        category,
        subject,
        description,
        is_anonymous: anonymous,
        status: 'submitted',
      }
      const row = await insertRow('feedback', feedbackData)
      if (row) {
        showToast('Feedback submitted successfully!', 'success')
        loadRecent()
      } else {
        showToast('Failed to submit feedback — please try again', 'error')
      }
      setSubject(''); setDescription(''); setAnonymous(false); setCategory('General')
    } catch (err) {
      console.error('Feedback submission error:', err)
      showToast('An unexpected error occurred while submitting feedback', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Feedback & Suggestions" icon={MessageCircle} />
      <AdminGlass hover={false} padding="p-5">
        <h4 className="text-xs font-semibold text-white mb-3">Submit Feedback</h4>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as FeedbackCategory)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40 appearance-none">
              {(['Workplace', 'Process', 'Tools', 'HR', 'General'] as FeedbackCategory[]).map(c => (
                <option key={c} value={c} className="bg-gray-900">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1 block">Subject</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief subject line..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-teal-500/40" />
          </div>
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe your feedback or suggestion in detail..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-teal-500/40 resize-none" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-white/20 bg-white/[0.04] accent-teal-500" />
              <span className="text-[11px] text-white/50">Submit anonymously</span>
            </label>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Send className="w-3 h-3" /> {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </AdminGlass>
      {/* Recent Feedback */}
      <div>
        <h4 className="text-xs font-semibold text-white/50 mb-3">Your Recent Feedback</h4>
        <div className="space-y-2">
          {recent.length === 0 && (
            <p className="text-[11px] text-white/30 italic">No feedback submitted yet.</p>
          )}
          {recent.map(fb => {
            const badge = FB_STATUS[fb.status] || { label: fb.status || 'Submitted', variant: 'neutral' as const }
            return (
              <AdminGlass key={fb.id} padding="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <AdminBadge label={fb.category} variant="info" size="sm" />
                    <span className="text-xs text-white/80 truncate">{fb.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <AdminBadge label={badge.label} variant={badge.variant} size="sm" />
                    <span className="text-[10px] text-white/25">{new Date(fb.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
                {fb.admin_response && (
                  <p className="text-[11px] text-teal-300/80 mt-2 border-t border-white/[0.06] pt-2">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 mr-1">Admin:</span>
                    {fb.admin_response}
                  </p>
                )}
              </AdminGlass>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ================================================================
//  5. WELLNESS HUB
// ================================================================
const WELLNESS_CARDS: { id: string; title: string; desc: string; icon: IconFC; iconCls: string; bgCls: string; borderCls: string }[] = [
  { id: 'w1', title: 'Stress Management Tips', desc: 'Practical techniques for managing workplace stress, breathing exercises, and mindfulness practices.', icon: Brain, iconCls: 'text-purple-400', bgCls: 'bg-purple-500/10', borderCls: 'border-purple-500/20' },
  { id: 'w2', title: 'Work-Life Balance', desc: 'Guidelines for maintaining healthy boundaries, time management tips, and flexible work resources.', icon: Scale, iconCls: 'text-blue-400', bgCls: 'bg-blue-500/10', borderCls: 'border-blue-500/20' },
  { id: 'w3', title: 'Mental Health Resources', desc: 'Access to counseling services, EAP program details, and confidential support helplines.', icon: Heart, iconCls: 'text-rose-400', bgCls: 'bg-rose-500/10', borderCls: 'border-rose-500/20' },
  { id: 'w4', title: 'Fitness Challenges', desc: 'Join monthly step challenges, yoga sessions, and team fitness events. Current: 10K Steps Challenge!', icon: Dumbbell, iconCls: 'text-emerald-400', bgCls: 'bg-emerald-500/10', borderCls: 'border-emerald-500/20' },
]

const MOODS = [
  { emoji: '\uD83D\uDE04', label: 'Great' }, { emoji: '\uD83D\uDE42', label: 'Good' },
  { emoji: '\uD83D\uDE10', label: 'Okay' }, { emoji: '\uD83D\uDE1E', label: 'Tired' },
  { emoji: '\uD83D\uDE25', label: 'Stressed' },
]

function WellnessView({ showToast, user }: { showToast: Toast; user?: StaffUser | null }) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [moodSending, setMoodSending] = useState(false)
  const [lastMood, setLastMood] = useState<string | null>(null)

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Wellness Hub" icon={Activity} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {WELLNESS_CARDS.map(card => {
          const Icon = card.icon
          const isExpanded = expandedCards.has(card.id)
          return (
            <AdminGlass key={card.id} padding="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${card.bgCls} border ${card.borderCls} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.iconCls}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white mb-1">{card.title}</h4>
                  <p className="text-[11px] text-white/50 leading-relaxed mb-3">{card.desc}</p>
                  <button onClick={() => toggleCard(card.id)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-teal-400 hover:text-teal-300 transition-colors">
                    {isExpanded ? 'Show Less' : 'Learn More'} <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                      <p className="text-xs text-white/60 leading-relaxed">{card.desc}</p>
                      <p className="text-xs text-white/40 leading-relaxed">
                        For more resources, contact HR or visit the employee wellness portal. You can also reach out to the EAP helpline for confidential support.
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Try to open relevant wellness resources
                          const urls: Record<string, string> = {
                            w1: 'https://www.who.int/news-room/fact-sheets/detail/mental-health-at-work',
                            w2: 'https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response',
                            w3: 'https://www.nimhans.ac.in/',
                            w4: 'https://fit.google.com/',
                          }
                          const url = urls[card.id]
                          if (url) {
                            window.open(url, '_blank', 'noopener,noreferrer')
                            showToast(`Opening resource for "${card.title}"`, 'info')
                          } else {
                            showToast(`Resource for "${card.title}" — contact HR for more details`, 'info')
                          }
                        }}
                        className="text-[10px] font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                      >
                        Open Full Resource
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </AdminGlass>
          )
        })}
      </div>
      {/* Quick Mood Poll */}
      <AdminGlass hover={false} padding="p-5">
        <h4 className="text-xs font-semibold text-white mb-1">Quick Poll</h4>
        <p className="text-[11px] text-white/40 mb-4">How are you feeling today?</p>
        <div className="flex items-center gap-3 justify-center flex-wrap">
          {MOODS.map(mood => {
            const isActive = lastMood === mood.label
            return (
              <button
                key={mood.label}
                disabled={moodSending}
                onClick={async () => {
                  setMoodSending(true)
                  const result = await recordWellnessCheckin({
                    staffId: user?.id || null,
                    mood: mood.label.toLowerCase(),
                    moodLabel: mood.label,
                  })
                  setMoodSending(false)
                  if (result.success) {
                    setLastMood(mood.label)
                    showToast(`Thanks for sharing — logged as "${mood.label}"`, 'success')
                  } else {
                    showToast(result.error || 'Could not record mood — please retry', 'error')
                  }
                }}
                className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all group disabled:opacity-50 disabled:cursor-not-allowed ${isActive ? 'bg-teal-500/15 border-teal-500/40' : 'bg-white/[0.03] border-white/[0.06] hover:bg-teal-500/10 hover:border-teal-500/20'}`}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{mood.emoji}</span>
                <span className={`text-[10px] font-medium ${isActive ? 'text-teal-300' : 'text-white/40 group-hover:text-teal-300'}`}>{mood.label}</span>
              </button>
            )
          })}
        </div>
        {lastMood && (
          <p className="text-[10px] text-white/30 text-center mt-3">Logged just now</p>
        )}
      </AdminGlass>
    </div>
  )
}
