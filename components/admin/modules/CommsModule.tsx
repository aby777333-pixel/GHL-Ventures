'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare, Send, Bell, Users, Mail, MessageCircle,
  Megaphone, AlertTriangle, CheckCircle2, Clock, Eye,
  Plus, Search, Filter, Hash, AtSign, Paperclip,
  Video, Phone, Star, Archive, Trash2, Reply, Inbox,
  User, RefreshCw,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminBadge from '../shared/AdminBadge'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import AdminCRUDPlaceholder from '../shared/AdminCRUDPlaceholder'
import { formatTimeAgo, formatDate } from '@/lib/admin/adminHooks'
import {
  getChannels,
  getChannelMessages,
  sendInternalMessage,
  onInternalMessage,
  type InternalChannel,
  type InternalMessage,
} from '@/lib/supabase/internalChatService'
import { fetchAllMessages } from '@/lib/supabase/adminDataService'

// ── Mock Data ────────────────────────────────────────────────────
interface Broadcast {
  id: string
  title: string
  channel: 'email' | 'sms' | 'whatsapp' | 'in-app'
  recipients: string
  sentBy: string
  sentDate: string
  status: 'sent' | 'scheduled' | 'draft'
  openRate?: number
  clickRate?: number
}

interface ChatMessage {
  id: string
  sender: string
  channel: string
  message: string
  timestamp: string
  read: boolean
}

interface Alert {
  id: string
  type: 'system' | 'compliance' | 'finance' | 'security'
  title: string
  message: string
  timestamp: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  acknowledged: boolean
}

// Data — populated from Supabase when available (no mock data)
const BROADCASTS: Broadcast[] = []
const INTERNAL_MESSAGES: ChatMessage[] = []
const SYSTEM_ALERTS: Alert[] = []

// ── Sub-tabs ─────────────────────────────────────────────────────
// 2026-05-12: Super-Admin menu spec adds two new entries here —
// "Contact" (website contact-form submissions) and "Email"
// (email-notification configuration). The Notification sidebar group
// targets both, while the dedicated Contact row in the sidebar deep-
// links straight to `comms/contact`.
const COMMS_TABS = [
  { id: 'messages', label: 'Investor Messages', icon: Inbox },
  { id: 'contact', label: 'Contact Submissions', icon: Inbox },
  { id: 'email', label: 'Email Notifications', icon: Bell },
  { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
  { id: 'internal', label: 'Internal Chat', icon: MessageCircle },
  { id: 'alerts', label: 'Alert Center', icon: Bell },
] as const

type CommsTab = typeof COMMS_TABS[number]['id']

interface CommsModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  user?: { id?: string; name?: string; email?: string } | null
  role?: string | null
}

export default function CommsModule({ subTab, navigate, showToast, user, role }: CommsModuleProps) {
  const activeTab = (COMMS_TABS.some(t => t.id === subTab) ? subTab : 'messages') as CommsTab

  const kpis = useMemo(() => ({
    totalBroadcasts: BROADCASTS.filter(b => b.status === 'sent').length,
    unreadMessages: INTERNAL_MESSAGES.filter(m => !m.read).length,
    activeAlerts: SYSTEM_ALERTS.filter(a => !a.acknowledged).length,
    scheduled: BROADCASTS.filter(b => b.status === 'scheduled').length,
  }), [])

  const handleTabClick = (tabId: string) => {
    navigate(tabId === 'messages' ? 'comms' : `comms/${tabId}`)
  }

  return (
    <div className="space-y-6 admin-section-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Communications Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Broadcasts, internal messaging, and system alerts</p>
        </div>
        <button
          onClick={() => showToast('Opening broadcast composer...', 'info')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors self-start admin-btn-press"
        >
          <Send className="w-4 h-4" />
          New Broadcast
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Broadcasts Sent" value={kpis.totalBroadcasts} icon={Megaphone} color="#3B82F6" delay={0} />
        <AdminKPICard title="Unread Messages" value={kpis.unreadMessages} icon={MessageCircle} color="#F59E0B" delay={50} />
        <AdminKPICard title="Active Alerts" value={kpis.activeAlerts} icon={Bell} color="#EF4444" delay={100} />
        <AdminKPICard title="Scheduled" value={kpis.scheduled} icon={Clock} color="#8B5CF6" delay={150} />
      </div>

      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
        {COMMS_TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                isActive ? 'bg-brand-red/20 text-white border border-brand-red/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === 'internal' && kpis.unreadMessages > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand-red text-[9px] text-white flex items-center justify-center font-bold">{kpis.unreadMessages}</span>
              )}
              {tab.id === 'alerts' && kpis.activeAlerts > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand-red text-[9px] text-white flex items-center justify-center font-bold">{kpis.activeAlerts}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="admin-tab-switch">
        {activeTab === 'messages' && <InvestorMessagesTab showToast={showToast} />}
        {activeTab === 'broadcast' && <BroadcastTab showToast={showToast} />}
        {activeTab === 'internal' && <InternalChatTab showToast={showToast} user={user} role={role} />}
        {activeTab === 'alerts' && <AlertCenterTab showToast={showToast} />}
        {/* 2026-05-12: Super-Admin spec — Contact submissions and
            Email notification configuration. Both render via the
            shared CRUD placeholder so the View / Edit / Delete row
            triad is visible while the dedicated Supabase tables are
            being wired in. */}
        {activeTab === 'contact' && (
          <AdminCRUDPlaceholder
            title="Contact Submissions"
            description="Every message captured by the public /contact form lands here."
            icon={Inbox}
            showToast={showToast}
            hint="Backed by the `contact_submissions` table. Each row supports View (open the message in a modal), Edit (assign / mark replied), and Delete."
          />
        )}
        {activeTab === 'email' && (
          <AdminCRUDPlaceholder
            title="Email Notifications"
            description="Templates, triggers, and delivery logs for transactional and marketing emails."
            icon={Bell}
            showToast={showToast}
            hint="Templates live in `email_templates`; deliveries in `email_logs`. View opens the rendered body, Edit lets you tweak the template, Delete removes obsolete drafts."
          />
        )}
      </div>
    </div>
  )
}

// ── Investor Messages Tab ───────────────────────────────────────
function InvestorMessagesTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMsg, setSelectedMsg] = useState<any | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  // Bug #29: inline reply composer for admin
  const [replyBody, setReplyBody] = useState('')
  const [replySending, setReplySending] = useState(false)

  const handleSendReply = useCallback(async (msg: any) => {
    if (!msg) return
    const body = replyBody.trim()
    if (!body) { showToast('Please enter a reply message', 'warning'); return }
    setReplySending(true)
    try {
      const { supabase } = await import('@/lib/supabase/client')
      const { data: { user } } = await (supabase as any).auth.getUser()
      const adminId = user?.id || null
      const adminName = user?.user_metadata?.full_name || user?.email || 'Admin'

      // The reply target is the OTHER party on this message. Messages in the
      // admin inbox can be either an investor->admin note OR an earlier
      // admin->investor note the admin is now following up on. If we just use
      // msg.from_id we'd occasionally reply to ourselves (we hit this bug
      // where reply to_id == admin's own id). So pick whichever of from/to is
      // not the current admin. Fall back to the other field if only one exists.
      let targetUserId: string | null = null
      if (msg.from_id && msg.from_id !== adminId) targetUserId = msg.from_id
      else if (msg.to_id && msg.to_id !== adminId) targetUserId = msg.to_id
      else targetUserId = msg.to_id || msg.from_id || null

      if (!targetUserId) {
        showToast('Cannot reply — unable to resolve the investor on this message', 'error')
        setReplySending(false)
        return
      }

      // The `messages` table schema has only: id, from_id, to_id, subject,
      // body, read, read_at, attachments, metadata (jsonb), created_at,
      // updated_at. Auxiliary fields live inside `metadata`.
      const subject = (msg.subject || '').startsWith('Re:') ? msg.subject : `Re: ${msg.subject || 'Your message'}`
      const payload: Record<string, any> = {
        from_id: adminId,
        to_id: targetUserId,
        subject,
        body,
        read: false,
        metadata: {
          is_admin_reply: true,
          in_reply_to: msg.id,
          from_name: adminName,
          original_subject: msg.subject || null,
        },
      }
      const { error } = await (supabase as any).from('messages').insert(payload)
      if (error) { showToast(`Reply failed: ${error.message}`, 'error'); setReplySending(false); return }
      // Mark original as read
      try { await (supabase as any).from('messages').update({ read: true, read_at: new Date().toISOString() }).eq('id', msg.id) } catch {}
      showToast('Reply sent to investor', 'success')
      setReplyBody('')
      setSelectedMsg(null)
      loadMessages()
    } catch (e: any) {
      showToast(`Reply failed: ${e?.message || 'unknown error'}`, 'error')
    } finally {
      setReplySending(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replyBody, showToast])

  const loadMessages = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAllMessages()
      setMessages(data || [])
    } catch { setMessages([]) }
    setLoading(false)
  }, [])

  useEffect(() => { loadMessages() }, [loadMessages])

  // Parse recipient type from subject like "[Relationship Manager] Subject here"
  const parseSubject = (subject: string) => {
    const match = subject?.match(/^\[(.+?)\]\s*(.*)$/)
    return match ? { type: match[1], clean: match[2] } : { type: 'General', clean: subject || 'No subject' }
  }

  const filtered = useMemo(() => {
    if (filterType === 'all') return messages
    return messages.filter(m => {
      const { type } = parseSubject(m.subject)
      return type === filterType
    })
  }, [messages, filterType])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: messages.length }
    messages.forEach(m => {
      const { type } = parseSubject(m.subject)
      counts[type] = (counts[type] || 0) + 1
    })
    return counts
  }, [messages])

  const typeColors: Record<string, string> = {
    'Relationship Manager': 'text-blue-400 bg-blue-500/15 border-blue-500/20',
    'Compliance Team': 'text-amber-400 bg-amber-500/15 border-amber-500/20',
    'Investment Team': 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20',
    'General': 'text-gray-400 bg-gray-500/15 border-gray-500/20',
  }

  if (loading) {
    return (
      <AdminGlass>
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-500 mr-2" />
          <span className="text-sm text-gray-500">Loading investor messages...</span>
        </div>
      </AdminGlass>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {['all', 'Relationship Manager', 'Compliance Team', 'Investment Team'].map(f => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              filterType === f
                ? 'bg-brand-red/20 text-white border-brand-red/30'
                : 'text-gray-500 hover:text-gray-300 border-white/[0.06] hover:bg-white/[0.04]'
            }`}
          >
            {f === 'all' ? 'All Messages' : f}
            <span className="ml-1.5 opacity-60">({typeCounts[f] || 0})</span>
          </button>
        ))}
        <button
          onClick={loadMessages}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-white border border-white/[0.06] hover:bg-white/[0.04] transition-all flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={Inbox}
          title="No investor messages"
          description={filterType === 'all' ? 'Messages from investors will appear here when they write to your team.' : `No messages for ${filterType}.`}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((msg: any) => {
            const { type, clean } = parseSubject(msg.subject)
            const colorClass = typeColors[type] || typeColors['General']
            const isSelected = selectedMsg?.id === msg.id
            return (
              <AdminGlass key={msg.id} className={`cursor-pointer transition-all hover:border-white/[0.12] ${isSelected ? 'border-brand-red/30 bg-brand-red/[0.03]' : ''}`}>
                <div onClick={() => setSelectedMsg(isSelected ? null : msg)} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-white truncate">{msg.from_name || msg?.metadata?.from_name || 'Investor'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${colorClass}`}>{type}</span>
                          {!msg.read && <span className="w-2 h-2 rounded-full bg-brand-red flex-shrink-0" />}
                        </div>
                        <p className="text-sm text-gray-300 font-medium truncate">{clean}</p>
                        {/* Bug #33: Reply composer always renders when the message is
                            selected (was previously gated on msg.body being non-empty,
                            which hid the composer for messages with attachments only). */}
                        {isSelected && (
                          <div className="mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                            <p className="text-sm text-gray-400 whitespace-pre-wrap">
                              {msg.body || <span className="italic text-gray-600">(no body)</span>}
                            </p>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                <Paperclip className="w-3 h-3" /> {msg.attachments.length} attachment(s)
                              </div>
                            )}
                            <div className="mt-4 pt-3 border-t border-white/[0.06]" onClick={(e) => e.stopPropagation()}>
                              <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Your Reply</label>
                              <textarea
                                value={replyBody}
                                onChange={(e) => setReplyBody(e.target.value)}
                                rows={3}
                                placeholder="Type your response to the investor..."
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 resize-none"
                              />
                              <div className="flex items-center justify-end gap-2 mt-2">
                                <button
                                  disabled={replySending || !replyBody.trim()}
                                  onClick={() => handleSendReply(msg)}
                                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-brand-red/30 border border-brand-red/40 hover:bg-brand-red/50 transition-colors disabled:opacity-50"
                                >
                                  <Send className="w-3 h-3" />
                                  {replySending ? 'Sending...' : 'Send Reply'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-600 whitespace-nowrap flex-shrink-0">
                      {msg.created_at ? formatTimeAgo(msg.created_at) : ''}
                    </span>
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

// ── Broadcast Tab ───────────────────────────────────────────────
function BroadcastTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const channelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    email: Mail,
    sms: MessageSquare,
    whatsapp: MessageCircle,
    'in-app': Bell,
  }

  const channelColors: Record<string, string> = {
    email: 'text-blue-400 bg-blue-500/15',
    sms: 'text-emerald-400 bg-emerald-500/15',
    whatsapp: 'text-green-400 bg-green-500/15',
    'in-app': 'text-purple-400 bg-purple-500/15',
  }

  if (BROADCASTS.length === 0) {
    return <AdminEmptyState title="No broadcasts yet" description="Broadcasts you send to clients and leads will appear here. Use the 'New Broadcast' button to compose one." />
  }

  return (
    <div className="space-y-3">
      {BROADCASTS.map(bc => {
        const Icon = channelIcons[bc.channel] || Mail
        const colorClass = channelColors[bc.channel] || 'text-gray-400 bg-gray-500/15'
        return (
          <AdminGlass key={bc.id} padding="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl flex-shrink-0 ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{bc.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                      <span>{bc.recipients}</span>
                      <span>by {bc.sentBy}</span>
                      {bc.sentDate && <span>{formatTimeAgo(bc.sentDate)}</span>}
                    </div>
                  </div>
                  <AdminBadge
                    label={bc.status}
                    variant={bc.status === 'sent' ? 'success' : bc.status === 'scheduled' ? 'info' : 'neutral'}
                    dot
                  />
                </div>
                {bc.openRate && (
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-400">Open Rate: <span className="text-white font-medium">{bc.openRate}%</span></span>
                    </div>
                    {bc.clickRate && (
                      <div className="flex items-center gap-1.5">
                        <Send className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-400">Click Rate: <span className="text-white font-medium">{bc.clickRate}%</span></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </AdminGlass>
        )
      })}
    </div>
  )
}

// ── Internal Chat Tab (wired to shared internalChatService) ─────
function InternalChatTab({ showToast, user, role }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void; user?: { id?: string; name?: string; email?: string } | null; role?: string | null }) {
  const channels = getChannels()
  const [activeChannel, setActiveChannel] = useState('general')
  const [messages, setMessages] = useState<InternalMessage[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const channelName = channels.find(c => c.id === activeChannel)?.name ?? activeChannel

  // Load messages when channel changes
  useEffect(() => {
    let mounted = true
    getChannelMessages(activeChannel).then(msgs => {
      if (mounted) setMessages(msgs)
    })
    return () => { mounted = false }
  }, [activeChannel])

  // Subscribe to realtime messages
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

  // Auto-scroll
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
      user.name || user.email || 'Admin',
      role || 'admin',
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
    try { return formatTimeAgo(ts) } catch { return ts }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Channel List */}
      <AdminGlass padding="p-3" className="lg:col-span-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Channels</h3>
        <div className="space-y-1">
          {channels.map(ch => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                activeChannel === ch.id
                  ? 'bg-brand-red/15 text-white'
                  : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" />
                {ch.name}
              </span>
              {ch.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand-red text-[10px] text-white flex items-center justify-center font-bold">{ch.unread}</span>
              )}
            </button>
          ))}
        </div>
      </AdminGlass>

      {/* Messages */}
      <AdminGlass padding="p-4" className="lg:col-span-3">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Hash className="w-4 h-4 text-gray-500" />
          {channelName}
        </h3>
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
          {messages.map(msg => (
            <div key={msg.id} className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red/30 to-blue-500/30 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                {msg.user_name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{msg.user_name}</span>
                  <span className="text-[10px] text-gray-600">{formatTime(msg.created_at)}</span>
                  {msg.user_role === 'admin' && (
                    <span className="text-[9px] bg-brand-red/20 text-red-400 px-1.5 py-0.5 rounded font-medium">Admin</span>
                  )}
                  {msg.user_role === 'staff' && (
                    <span className="text-[9px] bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded font-medium">Staff</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{msg.message}</p>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <AdminEmptyState title="No messages" description="This channel is empty. Start the conversation!" />
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Message Input */}
        <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
          <input
            type="text"
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            placeholder={`Message #${channelName}...`}
            className="flex-1 px-3 py-2 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 admin-input-glow"
            onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
          />
          <button
            onClick={handleSend}
            disabled={sending}
            className="p-2.5 rounded-xl bg-brand-red/20 text-brand-red hover:bg-brand-red/30 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </AdminGlass>
    </div>
  )
}

// ── Alert Center Tab ────────────────────────────────────────────
function AlertCenterTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const severityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    critical: AlertTriangle,
    high: AlertTriangle,
    medium: Bell,
    low: CheckCircle2,
  }

  const severityColors: Record<string, string> = {
    critical: 'text-red-400 bg-red-500/15 border-red-500/20',
    high: 'text-amber-400 bg-amber-500/15 border-amber-500/20',
    medium: 'text-blue-400 bg-blue-500/15 border-blue-500/20',
    low: 'text-gray-400 bg-gray-500/15 border-gray-500/20',
  }

  const typeColors: Record<string, string> = {
    system: 'info',
    compliance: 'warning',
    finance: 'success',
    security: 'error',
  }

  if (SYSTEM_ALERTS.length === 0) {
    return <AdminEmptyState title="No alerts" description="System alerts, compliance warnings, and security notifications will appear here." />
  }

  return (
    <div className="space-y-3">
      {SYSTEM_ALERTS.sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 }
        return (order[a.severity] || 4) - (order[b.severity] || 4)
      }).map(alert => {
        const Icon = severityIcons[alert.severity] || Bell
        const colorClass = severityColors[alert.severity] || ''
        return (
          <AdminGlass key={alert.id} padding="p-4" className={!alert.acknowledged ? 'border-l-2 border-l-brand-red' : ''}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl border flex-shrink-0 ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white">{alert.title}</p>
                      <AdminBadge label={alert.type} variant={typeColors[alert.type] as 'info' | 'warning' | 'success' | 'error'} />
                      <AdminBadge label={alert.severity} variant={alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : alert.severity === 'medium' ? 'info' : 'neutral'} />
                    </div>
                    <p className="text-xs text-gray-400">{alert.message}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{formatTimeAgo(alert.timestamp)}</p>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => showToast(`Alert "${alert.title}" acknowledged`, 'success')}
                      className="px-3 py-1 rounded-lg text-[11px] font-medium text-brand-red bg-brand-red/10 border border-brand-red/20 hover:bg-brand-red/20 transition-colors flex-shrink-0"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          </AdminGlass>
        )
      })}
    </div>
  )
}
