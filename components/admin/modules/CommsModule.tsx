'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare, Send, Bell, Users, Mail, MessageCircle,
  Megaphone, AlertTriangle, CheckCircle2, Clock, Eye,
  Plus, Search, Filter, Hash, AtSign, Paperclip,
  Video, Phone, Star, Archive, Trash2, Reply,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminBadge from '../shared/AdminBadge'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import { formatTimeAgo, formatDate } from '@/lib/admin/adminHooks'
import {
  getChannels,
  getChannelMessages,
  sendInternalMessage,
  onInternalMessage,
  type InternalChannel,
  type InternalMessage,
} from '@/lib/supabase/internalChatService'

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
const COMMS_TABS = [
  { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
  { id: 'internal', label: 'Internal Chat', icon: MessageCircle },
  { id: 'alerts', label: 'Alert Center', icon: Bell },
] as const

type CommsTab = typeof COMMS_TABS[number]['id']

interface CommsModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function CommsModule({ subTab, navigate, showToast }: CommsModuleProps) {
  const activeTab = (COMMS_TABS.some(t => t.id === subTab) ? subTab : 'broadcast') as CommsTab

  const kpis = useMemo(() => ({
    totalBroadcasts: BROADCASTS.filter(b => b.status === 'sent').length,
    unreadMessages: INTERNAL_MESSAGES.filter(m => !m.read).length,
    activeAlerts: SYSTEM_ALERTS.filter(a => !a.acknowledged).length,
    scheduled: BROADCASTS.filter(b => b.status === 'scheduled').length,
  }), [])

  const handleTabClick = (tabId: string) => {
    navigate(tabId === 'broadcast' ? 'comms' : `comms/${tabId}`)
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
        {activeTab === 'broadcast' && <BroadcastTab showToast={showToast} />}
        {activeTab === 'internal' && <InternalChatTab showToast={showToast} />}
        {activeTab === 'alerts' && <AlertCenterTab showToast={showToast} />}
      </div>
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
function InternalChatTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
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
    setSending(true)
    const text = msgInput.trim()
    setMsgInput('')
    const result = await sendInternalMessage(activeChannel, 'admin-user', 'Admin', 'admin', text)
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
