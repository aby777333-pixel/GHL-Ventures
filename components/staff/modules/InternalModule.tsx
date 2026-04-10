'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import AdminGlass from '@/components/admin/shared/AdminGlass'
import AdminBadge from '@/components/admin/shared/AdminBadge'
import { fetchAnnouncements } from '@/lib/supabase/staffDataService'
import { insertRow } from '@/lib/supabase/adminDataService'
import {
  getChannels,
  getChannelMessages,
  sendInternalMessage,
  onInternalMessage,
  type InternalChannel,
  type InternalMessage,
} from '@/lib/supabase/internalChatService'
import type { Announcement } from '@/lib/staff/staffTypes'
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
}

export default function InternalModule({ subTab, navigate, showToast }: InternalModuleProps) {
  const tab = subTab || 'chat'
  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {
    fetchAnnouncements().then(data => setAnnouncements(data))
  }, [])

  switch (tab) {
    case 'chat':        return <ChatView showToast={showToast} />
    case 'noticeboard': return <NoticeboardView announcements={announcements} />
    case 'policies':    return <PoliciesView showToast={showToast} />
    case 'feedback':    return <FeedbackView showToast={showToast} />
    case 'wellness':    return <WellnessView showToast={showToast} />
    default:            return <ChatView showToast={showToast} />
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
function ChatView({ showToast }: { showToast: Toast }) {
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
    setSending(true)
    const text = msgInput.trim()
    setMsgInput('')
    // Use a generic staff identity (in production, pull from auth context)
    const result = await sendInternalMessage(activeChannel, 'staff-user', 'Staff Member', 'staff', text)
    if (result) {
      setMessages(prev => {
        if (prev.find(m => m.id === result.id)) return prev
        return [...prev, result]
      })
      showToast('Message sent!', 'success')
    }
    setSending(false)
  }, [msgInput, sending, activeChannel, showToast])

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
                <span className="text-[10px] text-white/25">{ann.readBy.length} read</span>
              </div>
            </AdminGlass>
          )
        })}
      </div>
    </div>
  )
}

// ================================================================
//  3. COMPANY POLICIES
// ================================================================
const POLICIES: { id: string; title: string; lastUpdated: string; version: string; icon: IconFC }[] = [
  { id: 'pol-1', title: 'Leave Policy', lastUpdated: '2025-11-15', version: 'v3.2', icon: Calendar },
  { id: 'pol-2', title: 'Code of Conduct', lastUpdated: '2025-08-01', version: 'v2.1', icon: ShieldCheck },
  { id: 'pol-3', title: 'Work from Home Guidelines', lastUpdated: '2026-01-10', version: 'v1.4', icon: Lightbulb },
  { id: 'pol-4', title: 'Expense Reimbursement Policy', lastUpdated: '2026-02-18', version: 'v4.0', icon: FileText },
  { id: 'pol-5', title: 'Data Security Policy', lastUpdated: '2025-12-01', version: 'v2.0', icon: ShieldCheck },
  { id: 'pol-6', title: 'Anti-Harassment Policy', lastUpdated: '2025-09-20', version: 'v1.2', icon: Heart },
]

function PoliciesView({ showToast }: { showToast: Toast }) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Company Policies" icon={FileText} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {POLICIES.map(pol => {
          const Icon = pol.icon
          return (
            <AdminGlass key={pol.id} padding="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white mb-1">{pol.title}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-white/35 mb-2">
                    <span>Last updated: {pol.lastUpdated}</span>
                    <span>{pol.version}</span>
                  </div>
                  <button onClick={() => showToast(`Opening ${pol.title}...`, 'info')}
                    className="flex items-center gap-1 text-[10px] font-semibold text-teal-400 hover:text-teal-300 transition-colors">
                    <Eye className="w-3 h-3" /> View Document
                  </button>
                </div>
              </div>
            </AdminGlass>
          )
        })}
      </div>
    </div>
  )
}

// ================================================================
//  4. FEEDBACK & SUGGESTIONS
// ================================================================
type FeedbackCategory = 'Workplace' | 'Process' | 'Tools' | 'HR' | 'General'
type FeedbackStatus = 'submitted' | 'acknowledged' | 'resolved'

const FB_STATUS: Record<FeedbackStatus, { label: string; variant: 'success' | 'warning' | 'info' }> = {
  submitted: { label: 'Submitted', variant: 'info' },
  acknowledged: { label: 'Acknowledged', variant: 'warning' },
  resolved: { label: 'Resolved', variant: 'success' },
}

function mapTicketToFeedbackStatus(status: string): FeedbackStatus {
  if (status === 'resolved' || status === 'closed') return 'resolved'
  if (status === 'in-progress' || status === 'acknowledged') return 'acknowledged'
  return 'submitted'
}

function FeedbackView({ showToast }: { showToast: Toast }) {
  const [category, setCategory] = useState<FeedbackCategory>('General')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [recentFeedback, setRecentFeedback] = useState<{ id: string; category: FeedbackCategory; subject: string; status: FeedbackStatus; date: string }[]>([])

  // Fetch feedback from both tickets (type=feedback) and feedback table
  useEffect(() => {
    async function loadFeedback() {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        // Fetch from tickets table (where feedback is saved)
        const { data: ticketFb } = await supabase
          .from('tickets')
          .select('id, title, category, status, created_at')
          .eq('type', 'feedback')
          .order('created_at', { ascending: false })
          .limit(20) as any
        // Also fetch from dedicated feedback table
        const { data: directFb } = await supabase
          .from('feedback')
          .select('id, subject, category, status, created_at')
          .order('created_at', { ascending: false })
          .limit(20) as any

        const items: typeof recentFeedback = []
        if (ticketFb) {
          for (const t of ticketFb) {
            items.push({
              id: t.id,
              category: (t.category || 'General') as FeedbackCategory,
              subject: t.title || '—',
              status: mapTicketToFeedbackStatus(t.status),
              date: t.created_at?.split('T')[0] || '—',
            })
          }
        }
        if (directFb) {
          for (const f of directFb) {
            items.push({
              id: f.id,
              category: (f.category || 'General') as FeedbackCategory,
              subject: f.subject || '—',
              status: mapTicketToFeedbackStatus(f.status),
              date: f.created_at?.split('T')[0] || '—',
            })
          }
        }
        setRecentFeedback(items)
      } catch { /* ignore */ }
    }
    loadFeedback()
  }, [])

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) { showToast('Please fill in all required fields', 'warning'); return }
    // Save to the dedicated feedback table AND to tickets for cross-module visibility
    const { supabase } = await import('@/lib/supabase/client')
    const { data: { user } } = await supabase.auth.getUser()

    const feedbackRow = await insertRow('feedback', {
      staff_id: user?.id || null,
      subject,
      description,
      category,
      is_anonymous: anonymous,
      status: 'pending',
    })
    // Also create a ticket entry for admin visibility
    await insertRow('tickets', {
      ticket_number: `FB-${Date.now().toString(36).toUpperCase()}`,
      subject,
      description,
      type: 'feedback',
      category,
      status: 'open',
      priority: 'normal',
      is_anonymous: anonymous,
      created_by: user?.id || null,
      client_name: anonymous ? 'Anonymous Staff' : 'Staff Member',
    })

    if (feedbackRow) {
      showToast('Feedback submitted successfully!', 'success')
      // Add to local list immediately
      setRecentFeedback(prev => [{
        id: feedbackRow.id,
        category: category as FeedbackCategory,
        subject,
        status: 'submitted',
        date: new Date().toISOString().split('T')[0],
      }, ...prev])
    } else {
      showToast('Failed to submit feedback', 'error')
    }
    setSubject(''); setDescription(''); setAnonymous(false); setCategory('General')
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
            <button onClick={handleSubmit}
              className="flex items-center gap-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 px-4 py-2 rounded-lg text-xs font-semibold transition-colors">
              <Send className="w-3 h-3" /> Submit Feedback
            </button>
          </div>
        </div>
      </AdminGlass>
      {/* Recent Feedback */}
      <div>
        <h4 className="text-xs font-semibold text-white/50 mb-3">Recent Feedback</h4>
        <div className="space-y-2">
          {recentFeedback.length === 0 && (
            <p className="text-xs text-white/25 text-center py-4">No feedback submitted yet</p>
          )}
          {recentFeedback.map(fb => {
            const badge = FB_STATUS[fb.status]
            return (
              <AdminGlass key={fb.id} padding="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <AdminBadge label={fb.category} variant="info" size="sm" />
                    <span className="text-xs text-white/80 truncate">{fb.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <AdminBadge label={badge.label} variant={badge.variant} size="sm" />
                    <span className="text-[10px] text-white/25">{fb.date}</span>
                  </div>
                </div>
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

function WellnessView({ showToast }: { showToast: Toast }) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Wellness Hub" icon={Activity} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {WELLNESS_CARDS.map(card => {
          const Icon = card.icon
          return (
            <AdminGlass key={card.id} padding="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${card.bgCls} border ${card.borderCls} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.iconCls}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white mb-1">{card.title}</h4>
                  <p className="text-[11px] text-white/50 leading-relaxed mb-3">{card.desc}</p>
                  <button onClick={() => showToast(`Opening ${card.title}...`, 'info')}
                    className="flex items-center gap-1 text-[10px] font-semibold text-teal-400 hover:text-teal-300 transition-colors">
                    Learn More <ChevronRight className="w-3 h-3" />
                  </button>
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
        <div className="flex items-center gap-3 justify-center">
          {MOODS.map(mood => (
            <button key={mood.label} onClick={() => showToast(`Thanks for sharing! You're feeling: ${mood.label}`, 'success')}
              className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-teal-500/10 hover:border-teal-500/20 transition-all group">
              <span className="text-2xl group-hover:scale-110 transition-transform">{mood.emoji}</span>
              <span className="text-[10px] text-white/40 group-hover:text-teal-300 font-medium">{mood.label}</span>
            </button>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}
