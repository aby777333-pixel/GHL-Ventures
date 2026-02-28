'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Headphones, Phone, Video, MessageCircle, Mail, Send, Globe,
  BarChart3, AlertTriangle, CheckCircle2, Clock, Users, Eye, Edit3,
  Plus, Filter, Search, ArrowRight, Zap, Star, TrendingUp,
  ArrowUpRight, ArrowDownRight, Smartphone, Hash, Shield, BellRing,
  Loader2,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import AdminGlass from '@/components/admin/shared/AdminGlass'
import AdminBadge from '@/components/admin/shared/AdminBadge'
import AdminKPICard from '@/components/admin/shared/AdminKPICard'
import AdminDataTable, { type Column } from '@/components/admin/shared/AdminDataTable'
import AdminModal from '@/components/admin/shared/AdminModal'
import type { StaffRole } from '@/lib/staff/staffTypes'

// Cross-portal: Real-time chat sessions & RM requests
import {
  getActiveChatSessions,
  getChatMessages,
  sendChatMessage,
  getRMRequests,
  acceptRMRequest,
  completeRMRequest,
  reassignChat,
  type ChatSession,
  type ChatMessage as ChatMsg,
  type RMRequest,
} from '@/lib/supabase/chatService'
import {
  onNewChatSession,
  onMyChatSessionUpdate,
  onChatMessage,
  onRMRequest,
  onNewLead,
  onNewContactSubmission,
} from '@/lib/supabase/realtimeSubscriptions'
import { fetchLeads } from '@/lib/supabase/leadService'
import type { Lead } from '@/lib/admin/adminTypes'

// ════════════════════════════════════════════════════════════════
//  PROPS
// ════════════════════════════════════════════════════════════════
interface CSCenterModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  role: StaffRole
}

// ════════════════════════════════════════════════════════════════
//  CONSTANTS & HELPERS
// ════════════════════════════════════════════════════════════════
const ACCENT = '#14b8a6' // teal-500

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  chat:      <MessageCircle className="w-4 h-4 text-teal-400" />,
  whatsapp:  <Smartphone className="w-4 h-4 text-emerald-400" />,
  telegram:  <Send className="w-4 h-4 text-blue-400" />,
  email:     <Mail className="w-4 h-4 text-amber-400" />,
  call:      <Phone className="w-4 h-4 text-violet-400" />,
  video:     <Video className="w-4 h-4 text-pink-400" />,
  social:    <Globe className="w-4 h-4 text-cyan-400" />,
  sms:       <Hash className="w-4 h-4 text-orange-400" />,
}

function channelIcon(ch: string) {
  return CHANNEL_ICONS[ch] ?? <MessageCircle className="w-4 h-4 text-gray-400" />
}

function priorityVariant(p: string) {
  if (p === 'critical') return 'error' as const
  if (p === 'high') return 'warning' as const
  if (p === 'medium') return 'info' as const
  return 'neutral' as const
}

function statusVariant(s: string) {
  if (s === 'open') return 'info' as const
  if (s === 'in-progress') return 'warning' as const
  if (s === 'awaiting-client' || s === 'awaiting-internal') return 'purple' as const
  if (s === 'resolved') return 'success' as const
  if (s === 'closed') return 'neutral' as const
  return 'neutral' as const
}

// ════════════════════════════════════════════════════════════════
//  PLACEHOLDER ARRAYS (mock data removed — wire to real data)
// ════════════════════════════════════════════════════════════════

const QUEUE_ITEMS: { id: string; clientName: string; channel: string; waitTime: number; priority: string; query: string }[] = []
const ACTIVE_SESSIONS: { id: string; clientName: string; channel: string; duration: string; topic: string; sentiment: string }[] = []
const INBOX_THREADS: { id: string; clientName: string; channel: string; lastMessage: string; time: string; priority: string; status: string; unread: boolean }[] = []
const THREAD_MESSAGES: { sender: string; message: string; time: string }[] = []
const TICKETS_DATA: { id: string; clientName: string; subject: string; category: string; priority: string; status: string; assignedTo: string; age: string; createdDate: string }[] = []
const PENDING_CALLS: { id: string; clientName: string; phone: string; waitTime: string; priority: string; reason: string }[] = []
const RECENT_CALLS: { id: string; clientName: string; direction: string; duration: string; outcome: string; time: string; sentiment: string }[] = []
const VIDEO_REQUESTS: { id: string; clientName: string; scheduledAt: string; purpose: string; status: string }[] = []
const VIDEO_SESSIONS: { id: string; clientName: string; date: string; duration: string; purpose: string; rating: number }[] = []
const ACTIVE_CHATS: { id: string; clientName: string; lastMsg: string; time: string; unread: number }[] = []
const CANNED_RESPONSES: { id: string; label: string; text: string }[] = []
const WHATSAPP_THREADS: { id: string; clientName: string; phone: string; lastMsg: string; time: string; unread: number; status: string }[] = []
const WA_TEMPLATES: { id: string; name: string; preview: string }[] = []
const ESCALATION_ITEMS: { id: string; ticketId: string; clientName: string; subject: string; level: number; slaRemaining: string; assignedTo: string; priority: string; escalatedAt: string }[] = []
const CSAT_TREND: { month: string; score: number; responses: number }[] = []
const CHANNEL_SATISFACTION: { channel: string; score: number; color: string }[] = []
const CLIENT_FEEDBACK: { id: string; clientName: string; score: number; channel: string; comment: string; date: string }[] = []

// ════════════════════════════════════════════════════════════════
//  SUB-TAB COMPONENTS
// ════════════════════════════════════════════════════════════════

// ── 1. CS Dashboard ──────────────────────────────────────────
function CSDashboard({ navigate, showToast }: Pick<CSCenterModuleProps, 'navigate' | 'showToast'>) {
  const [agentStatus, setAgentStatus] = useState<string>('available')

  const statuses = [
    { key: 'available', label: 'Available', color: 'bg-emerald-500' },
    { key: 'busy', label: 'Busy', color: 'bg-amber-500' },
    { key: 'away', label: 'Away', color: 'bg-gray-500' },
    { key: 'break', label: 'Break', color: 'bg-violet-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Agent Status Bar */}
      <AdminGlass padding="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Headphones className="w-5 h-5 text-teal-400" />
            <span className="text-sm font-semibold text-white">Agent Status</span>
          </div>
          <div className="flex items-center gap-2">
            {statuses.map(s => (
              <button
                key={s.key}
                onClick={() => { setAgentStatus(s.key); showToast(`Status changed to ${s.label}`, 'info') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  agentStatus === s.key
                    ? 'bg-white/[0.1] border-white/[0.15] text-white'
                    : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:bg-white/[0.06] hover:text-gray-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${s.color} ${agentStatus === s.key ? 'animate-pulse' : 'opacity-50'}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </AdminGlass>

      {/* Tawk.to Live Chat Dashboard */}
      <AdminGlass padding="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-sm font-semibold text-white">Tawk.to Live Chat</span>
              <p className="text-[11px] text-gray-500">Respond to website visitors in real-time</p>
            </div>
          </div>
          <a
            href="https://dashboard.tawk.to/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
          >
            <Globe className="w-4 h-4" />
            Open Live Chat Dashboard
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </AdminGlass>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard title="Tickets Resolved" value={0} subtitle="Today" icon={CheckCircle2} color={ACCENT} delay={0} />
        <AdminKPICard title="Avg Response Time" value="—" subtitle="Last 1 hour" icon={Clock} color="#8b5cf6" delay={100} />
        <AdminKPICard title="CSAT Score" value="—" subtitle="This week" icon={Star} color="#f59e0b" delay={200} />
        <AdminKPICard title="Calls Handled" value={0} subtitle="Today" icon={Phone} color="#ec4899" delay={300} />
      </div>

      {/* Live Queue + Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Queue */}
        <div className="lg:col-span-2">
          <AdminGlass padding="p-0">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-semibold text-white">Live Queue</h3>
                <span className="text-[10px] bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full font-medium">{QUEUE_ITEMS.length} waiting</span>
              </div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {QUEUE_ITEMS.map(q => (
                <div key={q.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <div className="flex-shrink-0">{channelIcon(q.channel)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{q.clientName}</p>
                    <p className="text-xs text-gray-500 truncate">{q.query}</p>
                  </div>
                  <AdminBadge label={q.priority} variant={priorityVariant(q.priority)} size="sm" />
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{q.waitTime}s</span>
                  </div>
                </div>
              ))}
            </div>
          </AdminGlass>
        </div>

        {/* My Active Sessions */}
        <AdminGlass padding="p-0">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-semibold text-white">My Active Sessions</h3>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {ACTIVE_SESSIONS.map(s => (
              <div key={s.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {channelIcon(s.channel)}
                    <span className="text-sm text-white font-medium">{s.clientName}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">{s.duration}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{s.topic}</p>
                <div className="mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    s.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                    s.sentiment === 'negative' ? 'bg-red-500/10 text-red-400' :
                    'bg-gray-500/10 text-gray-400'
                  }`}>{s.sentiment}</span>
                </div>
              </div>
            ))}
          </div>
        </AdminGlass>
      </div>

      {/* Quick Actions */}
      <AdminGlass padding="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Quick Actions</span>
          <button
            onClick={() => showToast('Accepting next item from queue...', 'info')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Accept Next
          </button>
          <button
            onClick={() => navigate('cs/inbox')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-300 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            Go to Inbox
          </button>
          <button
            onClick={() => navigate('cs/tickets')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-300 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View Tickets
          </button>
        </div>
      </AdminGlass>
    </div>
  )
}

// ── 2. Unified Inbox ─────────────────────────────────────────
function UnifiedInbox({ showToast }: Pick<CSCenterModuleProps, 'showToast'>) {
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [selectedThread, setSelectedThread] = useState<string | null>(null)

  const channels = ['all', 'chat', 'whatsapp', 'telegram', 'email', 'call']

  const filtered = useMemo(() => {
    if (channelFilter === 'all') return INBOX_THREADS
    return INBOX_THREADS.filter(t => t.channel === channelFilter)
  }, [channelFilter])

  const activeThread = selectedThread ? INBOX_THREADS.find(t => t.id === selectedThread) : null

  return (
    <div className="space-y-4">
      {/* Channel Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        {channels.map(ch => (
          <button
            key={ch}
            onClick={() => setChannelFilter(ch)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              channelFilter === ch
                ? 'bg-teal-500/20 border-teal-500/30 text-teal-400'
                : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:bg-white/[0.06]'
            }`}
          >
            {ch !== 'all' && channelIcon(ch)}
            <span className="capitalize">{ch}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Thread List */}
        <div className="lg:col-span-2">
          <AdminGlass padding="p-0">
            <div className="divide-y divide-white/[0.04]">
              {filtered.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedThread(t.id)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    selectedThread === t.id ? 'bg-teal-500/[0.08]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {channelIcon(t.channel)}
                      <span className={`text-sm font-medium ${t.unread ? 'text-white' : 'text-gray-400'}`}>{t.clientName}</span>
                      {t.unread && <span className="w-2 h-2 rounded-full bg-teal-400" />}
                    </div>
                    <span className="text-[10px] text-gray-600">{t.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{t.lastMessage}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <AdminBadge label={t.priority} variant={priorityVariant(t.priority)} size="sm" />
                    <AdminBadge label={t.status} variant={statusVariant(t.status)} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </AdminGlass>
        </div>

        {/* Thread Detail */}
        <div className="lg:col-span-3">
          <AdminGlass padding="p-0">
            {activeThread ? (
              <div>
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {channelIcon(activeThread.channel)}
                    <span className="text-sm font-semibold text-white">{activeThread.clientName}</span>
                    <AdminBadge label={activeThread.priority} variant={priorityVariant(activeThread.priority)} size="sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => showToast('Ticket created from thread', 'success')} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="px-5 py-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {THREAD_MESSAGES.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                        m.sender === 'agent'
                          ? 'bg-teal-500/15 border border-teal-500/20 text-teal-100'
                          : 'bg-white/[0.06] border border-white/[0.08] text-gray-300'
                      }`}>
                        <p className="text-xs">{m.message}</p>
                        <p className="text-[10px] text-gray-600 mt-1">{m.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type a reply..."
                      className="flex-1 px-4 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/40"
                    />
                    <button
                      onClick={() => showToast('Message sent', 'success')}
                      className="p-2 rounded-xl bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Select a conversation to view details</p>
              </div>
            )}
          </AdminGlass>
        </div>
      </div>
    </div>
  )
}

// ── 3. Ticket Management ─────────────────────────────────────
function TicketManagement({ showToast }: Pick<CSCenterModuleProps, 'showToast'>) {
  const [statusTab, setStatusTab] = useState<string>('all')
  const [selectedTicket, setSelectedTicket] = useState<typeof TICKETS_DATA[0] | null>(null)

  const statusTabs = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'awaiting', label: 'Awaiting' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
  ]

  const filteredTickets = useMemo(() => {
    if (statusTab === 'all') return TICKETS_DATA
    if (statusTab === 'awaiting') return TICKETS_DATA.filter(t => t.status.startsWith('awaiting'))
    return TICKETS_DATA.filter(t => t.status === statusTab)
  }, [statusTab])

  const columns: Column<typeof TICKETS_DATA[0]>[] = [
    { key: 'id', label: 'ID', width: '90px', render: (row) => <span className="text-teal-400 font-mono text-xs">{row.id}</span> },
    { key: 'clientName', label: 'Client', render: (row) => <span className="text-white font-medium">{row.clientName}</span> },
    { key: 'subject', label: 'Subject', render: (row) => <span className="text-gray-300 truncate block max-w-[200px]">{row.subject}</span> },
    { key: 'category', label: 'Category', render: (row) => <AdminBadge label={row.category} variant="info" size="sm" /> },
    { key: 'priority', label: 'Priority', render: (row) => <AdminBadge label={row.priority} variant={priorityVariant(row.priority)} size="sm" dot /> },
    { key: 'status', label: 'Status', render: (row) => <AdminBadge label={row.status.replace(/-/g, ' ')} variant={statusVariant(row.status)} size="sm" /> },
    { key: 'assignedTo', label: 'Assigned To' },
    { key: 'age', label: 'Age', width: '60px' },
  ]

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {statusTabs.map(s => {
          const count = s.key === 'all' ? TICKETS_DATA.length
            : s.key === 'awaiting' ? TICKETS_DATA.filter(t => t.status.startsWith('awaiting')).length
            : TICKETS_DATA.filter(t => t.status === s.key).length
          return (
            <button
              key={s.key}
              onClick={() => setStatusTab(s.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                statusTab === s.key
                  ? 'bg-teal-500/20 border-teal-500/30 text-teal-400'
                  : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:bg-white/[0.06]'
              }`}
            >
              {s.label}
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      <AdminGlass padding="p-0">
        <AdminDataTable
          columns={columns}
          data={filteredTickets}
          searchable
          searchPlaceholder="Search tickets..."
          searchKeys={['id', 'clientName', 'subject', 'assignedTo']}
          onRowClick={(row) => setSelectedTicket(row)}
          exportable
          title="Support Tickets"
        />
      </AdminGlass>

      {/* Ticket Detail Modal */}
      <AdminModal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket?.id ?? ''}
        subtitle={selectedTicket?.subject}
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Client</p>
                <p className="text-sm text-white">{selectedTicket.clientName}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Category</p>
                <AdminBadge label={selectedTicket.category} variant="info" size="md" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Priority</p>
                <AdminBadge label={selectedTicket.priority} variant={priorityVariant(selectedTicket.priority)} size="md" dot />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Status</p>
                <AdminBadge label={selectedTicket.status.replace(/-/g, ' ')} variant={statusVariant(selectedTicket.status)} size="md" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Assigned To</p>
                <p className="text-sm text-white">{selectedTicket.assignedTo}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Age</p>
                <p className="text-sm text-white">{selectedTicket.age}</p>
              </div>
            </div>
            <div className="border-t border-white/[0.06] pt-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Actions</p>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => { showToast('Ticket status updated', 'success'); setSelectedTicket(null) }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 transition-colors">
                  Update Status
                </button>
                <button onClick={() => { showToast('Ticket reassigned', 'info'); setSelectedTicket(null) }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] text-gray-300 border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
                  Reassign
                </button>
                <button onClick={() => { showToast('Ticket escalated', 'warning'); setSelectedTicket(null) }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors">
                  Escalate
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  )
}

// ── 4. Calls ─────────────────────────────────────────────────
function CallsView({ showToast }: Pick<CSCenterModuleProps, 'showToast'>) {
  const [activeCall, setActiveCall] = useState(false)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Call Queue */}
        <AdminGlass padding="p-0">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">Pending Calls</h3>
              <span className="text-[10px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full font-medium">{PENDING_CALLS.length}</span>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {PENDING_CALLS.map(c => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">{c.clientName}</p>
                  <p className="text-xs text-gray-500">{c.reason}</p>
                  <p className="text-[10px] text-gray-600 font-mono mt-0.5">{c.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <AdminBadge label={c.priority} variant={priorityVariant(c.priority)} size="sm" dot />
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {c.waitTime}
                  </div>
                  <button
                    onClick={() => { setActiveCall(true); showToast(`Connecting to ${c.clientName}...`, 'info') }}
                    className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AdminGlass>

        {/* Active Call Interface */}
        <AdminGlass padding="p-0">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-semibold text-white">Active Call</h3>
            </div>
          </div>
          {activeCall ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-teal-500/20 border-2 border-teal-500/40 flex items-center justify-center mx-auto mb-3 animate-pulse">
                <Phone className="w-7 h-7 text-teal-400" />
              </div>
              <p className="text-white font-semibold">Meena Iyer</p>
              <p className="text-xs text-gray-500 mt-1">+91 98765 43210</p>
              <p className="text-sm text-teal-400 font-mono mt-2">05:32</p>
              <div className="flex items-center justify-center gap-3 mt-5">
                {[
                  { icon: <Headphones className="w-4 h-4" />, label: 'Mute', color: 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.1]' },
                  { icon: <Clock className="w-4 h-4" />, label: 'Hold', color: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' },
                  { icon: <ArrowRight className="w-4 h-4" />, label: 'Transfer', color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' },
                  { icon: <Shield className="w-4 h-4" />, label: 'Record', color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30' },
                  { icon: <Edit3 className="w-4 h-4" />, label: 'Notes', color: 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.1]' },
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={() => showToast(`${btn.label} toggled`, 'info')}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border border-white/[0.08] transition-colors ${btn.color}`}
                  >
                    {btn.icon}
                    <span className="text-[10px]">{btn.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setActiveCall(false); showToast('Call ended', 'info') }}
                className="mt-5 px-6 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
              >
                End Call
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Phone className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No active call</p>
              <p className="text-xs mt-1">Pick up a call from the queue</p>
            </div>
          )}
        </AdminGlass>
      </div>

      {/* Recent Calls */}
      <AdminGlass padding="p-0">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Recent Calls</h3>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {RECENT_CALLS.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-3">
              <div className={`p-2 rounded-lg ${c.direction === 'inbound' ? 'bg-teal-500/10' : 'bg-violet-500/10'}`}>
                {c.direction === 'inbound'
                  ? <ArrowDownRight className="w-4 h-4 text-teal-400" />
                  : <ArrowUpRight className="w-4 h-4 text-violet-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{c.clientName}</p>
                <p className="text-xs text-gray-500">{c.direction} &middot; {c.duration}</p>
              </div>
              <AdminBadge
                label={c.outcome}
                variant={c.outcome === 'Resolved' ? 'success' : c.outcome === 'Escalated' ? 'warning' : 'info'}
                size="sm"
              />
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                c.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                c.sentiment === 'negative' ? 'bg-red-500/10 text-red-400' :
                'bg-gray-500/10 text-gray-400'
              }`}>{c.sentiment}</span>
              <span className="text-xs text-gray-600">{c.time}</span>
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ── 5. Video ─────────────────────────────────────────────────
function VideoView({ showToast }: Pick<CSCenterModuleProps, 'showToast'>) {
  const [videoAvailable, setVideoAvailable] = useState(true)

  return (
    <div className="space-y-4">
      {/* Availability Toggle */}
      <AdminGlass padding="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-pink-400" />
            <div>
              <p className="text-sm font-semibold text-white">Video Call Availability</p>
              <p className="text-xs text-gray-500">Toggle to accept incoming video call requests</p>
            </div>
          </div>
          <button
            onClick={() => { setVideoAvailable(!videoAvailable); showToast(videoAvailable ? 'Video calls disabled' : 'Video calls enabled', 'info') }}
            className={`relative w-12 h-6 rounded-full transition-colors ${videoAvailable ? 'bg-teal-500' : 'bg-gray-600'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${videoAvailable ? 'left-[26px]' : 'left-0.5'}`} />
          </button>
        </div>
      </AdminGlass>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Video Requests */}
        <AdminGlass padding="p-0">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
            <Clock className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-semibold text-white">Pending Video Requests</h3>
            <span className="text-[10px] bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full font-medium">{VIDEO_REQUESTS.length}</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {VIDEO_REQUESTS.map(vr => (
              <div key={vr.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white font-medium">{vr.clientName}</p>
                  <span className="text-xs text-gray-500">{vr.scheduledAt}</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{vr.purpose}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast(`Joining video call with ${vr.clientName}...`, 'success')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Join
                  </button>
                  <button
                    onClick={() => showToast('Rescheduling request sent', 'info')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] text-gray-400 border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AdminGlass>

        {/* Recent Sessions */}
        <AdminGlass padding="p-0">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Recent Video Sessions</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {VIDEO_SESSIONS.map(vs => (
              <div key={vs.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">{vs.clientName}</p>
                  <p className="text-xs text-gray-500">{vs.purpose}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{vs.date} &middot; {vs.duration}</p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < vs.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AdminGlass>
      </div>
    </div>
  )
}

// ── 6. Chat ──────────────────────────────────────────────────
/** ChatView — Real-time chat interface for CS agents.
 *  Cross-portal wire: Website ChatWidget → chat_sessions → here.
 *  Also surfaces RM requests from Client Dashboard. */
function ChatView({ showToast }: Pick<CSCenterModuleProps, 'showToast'>) {
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [showCanned, setShowCanned] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [rmRequests, setRmRequests] = useState<RMRequest[]>([])
  const [replyText, setReplyText] = useState('')
  const [loadingSessions, setLoadingSessions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load active chat sessions from Supabase + poll every 5s as Realtime fallback
  useEffect(() => {
    let mounted = true
    async function load() {
      const sessions = await getActiveChatSessions()
      if (!mounted) return
      setChatSessions(prev => {
        // Merge: keep new sessions, update existing ones
        const ids = new Set(sessions.map(s => s.id))
        const merged = [...sessions]
        // Keep any locally-added sessions that Supabase hasn't returned yet
        prev.forEach(p => { if (!ids.has(p.id)) merged.push(p) })
        return merged
      })
      if (sessions.length > 0) {
        setSelectedChat(prev => prev || sessions[0].id)
      }
      setLoadingSessions(false)
    }
    load()
    // Poll every 5 seconds as a fallback for Realtime
    const interval = setInterval(load, 5000)
    return () => { mounted = false; clearInterval(interval) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Play alert sound helper
  const playAlertSound = useCallback(() => {
    try {
      // Short beep notification sound
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3
      oscillator.start()
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      oscillator.stop(ctx.currentTime + 0.5)
    } catch {}
  }, [])

  // Send browser notification helper
  const sendBrowserNotification = useCallback((title: string, body: string) => {
    // Play sound regardless of notification permission
    playAlertSound()

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(title, {
        body,
        icon: '/icon.svg',
        tag: 'ghl-cs-chat', // Prevents stacking duplicate notifications
      })
      // Auto-close after 5 seconds
      setTimeout(() => notif.close(), 5000)
      // Focus window on click
      notif.onclick = () => {
        window.focus()
        notif.close()
      }
    }
  }, [playAlertSound])

  // Subscribe to new chat sessions in real time
  useEffect(() => {
    const unsub = onNewChatSession((payload) => {
      const newSession = payload.new as ChatSession
      setChatSessions(prev => {
        // Add to top if not already present
        if (prev.find(s => s.id === newSession.id)) return prev
        return [newSession, ...prev]
      })
      showToast(`New chat from ${newSession.visitor_name}`, 'info')
      sendBrowserNotification(
        'New Chat Incoming',
        `${newSession.visitor_name} is waiting for assistance`
      )
    })
    return () => { unsub?.() }
  }, [showToast, sendBrowserNotification])

  // Load messages when a chat is selected + poll every 3s as Realtime fallback
  useEffect(() => {
    if (!selectedChat) return
    let mounted = true
    async function loadMessages() {
      const msgs = await getChatMessages(selectedChat!)
      if (!mounted) return
      setChatMessages(msgs)
    }
    loadMessages()
    const interval = setInterval(loadMessages, 3000)
    return () => { mounted = false; clearInterval(interval) }
  }, [selectedChat])

  // Subscribe to new messages in the selected chat
  useEffect(() => {
    if (!selectedChat) return
    const unsub = onChatMessage(selectedChat, (payload) => {
      const msg = payload.new as ChatMsg
      setChatMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      // Notify when a visitor sends a message
      if (msg.sender_type === 'visitor') {
        sendBrowserNotification(
          'New Message',
          `${msg.sender_name || 'Visitor'}: ${msg.message.slice(0, 80)}`
        )
      }
    })
    return () => { unsub?.() }
  }, [selectedChat, sendBrowserNotification])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Send a reply as agent
  const handleSendReply = useCallback(async (text?: string) => {
    const content = text || replyText.trim()
    if (!content || !selectedChat) return
    await sendChatMessage({
      sessionId: selectedChat,
      senderType: 'agent',
      senderName: 'CS Agent',
      message: content,
    })
    setReplyText('')
    showToast('Message sent', 'success')
  }, [replyText, selectedChat, showToast])

  const selectedSession = chatSessions.find(s => s.id === selectedChat)

  // Display real Supabase sessions (no mock fallback)
  const displaySessions = chatSessions

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Active Chats Panel — sorted by priority then recency */}
      <AdminGlass padding="p-0">
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-semibold text-white">Active Chats</h3>
            {chatSessions.length > 0 && (
              <span className="text-[10px] bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full font-medium">
                {chatSessions.filter(s => s.status === 'waiting' || s.status === 'queued').length} waiting
              </span>
            )}
          </div>
        </div>
        <div className="divide-y divide-white/[0.04] max-h-[500px] overflow-y-auto">
          {loadingSessions ? (
            <div className="px-4 py-8 text-center text-xs text-gray-500">Loading chats...</div>
          ) : displaySessions.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-gray-500">No active chats</div>
          ) : (
            displaySessions.map(ch => (
              <div
                key={ch.id}
                onClick={() => setSelectedChat(ch.id)}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  selectedChat === ch.id ? 'bg-teal-500/[0.08]' : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white font-medium">{ch.visitor_name}</span>
                  {(ch.status === 'waiting' || ch.status === 'queued') && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Waiting for agent" />
                  )}
                  {ch.status === 'active' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Active" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 truncate">{ch.channel}</p>
                  <p className="text-[10px] text-gray-600">
                    {new Date(ch.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </AdminGlass>

      {/* Chat Interface */}
      <div className="lg:col-span-2">
        <AdminGlass padding="p-0">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${selectedSession?.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span className="text-sm font-semibold text-white">
                {selectedSession?.visitor_name ?? 'Select a chat'}
              </span>
              {selectedSession?.visitor_email && (
                <span className="text-[10px] text-gray-500">{selectedSession.visitor_email}</span>
              )}
            </div>
            <button
              onClick={() => setShowCanned(!showCanned)}
              className="px-3 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] transition-colors"
            >
              Canned Responses
            </button>
          </div>
          <div className="px-5 py-4 space-y-3 min-h-[350px] max-h-[400px] overflow-y-auto">
            {chatMessages.length === 0 && selectedChat ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-500 py-20">
                No messages yet. The visitor is waiting for a response.
              </div>
            ) : !selectedChat ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-500 py-20">
                Select a chat from the panel to start responding.
              </div>
            ) : (
              chatMessages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_type === 'agent' ? 'justify-end' : m.sender_type === 'system' ? 'justify-center' : 'justify-start'}`}>
                  {m.sender_type === 'system' ? (
                    <span className="px-3 py-1 rounded-full text-[10px] text-gray-500 bg-white/5">{m.message}</span>
                  ) : (
                    <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                      m.sender_type === 'agent'
                        ? 'bg-teal-500/15 border border-teal-500/20 text-teal-100'
                        : 'bg-white/[0.06] border border-white/[0.08] text-gray-300'
                    }`}>
                      {m.sender_name && m.sender_type === 'visitor' && (
                        <p className="text-[10px] text-teal-400 font-medium mb-0.5">{m.sender_name}</p>
                      )}
                      <p className="text-xs">{m.message}</p>
                      <p className="text-[10px] text-gray-600 mt-1">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="px-5 py-3 border-t border-white/[0.06]">
            <form onSubmit={(e) => { e.preventDefault(); handleSendReply() }} className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={selectedChat ? 'Type a reply...' : 'Select a chat first'}
                disabled={!selectedChat}
                className="flex-1 px-4 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/40 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || !selectedChat}
                className="p-2 rounded-xl bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </AdminGlass>
      </div>

      {/* Canned Responses Panel */}
      <AdminGlass padding="p-0" className={showCanned ? '' : 'hidden lg:block'}>
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Quick Replies</h3>
          </div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {CANNED_RESPONSES.map(cr => (
            <div
              key={cr.id}
              onClick={() => { setReplyText(cr.text); showToast(`Quick reply "${cr.label}" inserted`, 'info') }}
              className="px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <p className="text-xs text-teal-400 font-medium mb-1">{cr.label}</p>
              <p className="text-[11px] text-gray-500 line-clamp-2">{cr.text}</p>
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ── 7. WhatsApp ──────────────────────────────────────────────
function WhatsAppView({ showToast }: Pick<CSCenterModuleProps, 'showToast'>) {
  const [selectedWA, setSelectedWA] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conversations */}
        <div className="lg:col-span-2">
          <AdminGlass padding="p-0">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">WhatsApp Conversations</h3>
              </div>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
              >
                <Send className="w-3 h-3" />
                Templates
              </button>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {WHATSAPP_THREADS.map(wa => (
                <div
                  key={wa.id}
                  onClick={() => setSelectedWA(wa.id)}
                  className={`px-5 py-3 cursor-pointer transition-colors ${
                    selectedWA === wa.id ? 'bg-emerald-500/[0.08]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-sm text-white font-medium">{wa.clientName}</span>
                      {wa.unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">{wa.unread}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-600">{wa.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{wa.lastMsg}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-600 font-mono">{wa.phone}</span>
                    <AdminBadge label={wa.status} variant={wa.status === 'active' ? 'success' : 'neutral'} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </AdminGlass>
        </div>

        {/* Template Selector */}
        <AdminGlass padding="p-0">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Message Templates</h3>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {WA_TEMPLATES.map(tpl => (
              <div
                key={tpl.id}
                onClick={() => showToast(`Template "${tpl.name}" selected`, 'info')}
                className="px-5 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <p className="text-xs text-emerald-400 font-medium mb-1">{tpl.name}</p>
                <p className="text-[11px] text-gray-500 line-clamp-2">{tpl.preview}</p>
              </div>
            ))}
          </div>
        </AdminGlass>
      </div>
    </div>
  )
}

// ── 8. Escalations ───────────────────────────────────────────
function EscalationsView({ showToast }: Pick<CSCenterModuleProps, 'showToast'>) {
  return (
    <div className="space-y-4">
      <AdminGlass padding="p-0">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Escalation Queue</h3>
            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">{ESCALATION_ITEMS.length} active</span>
          </div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {ESCALATION_ITEMS.map(esc => (
            <div key={esc.id} className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-teal-400 font-mono">{esc.ticketId}</span>
                  <span className="text-sm text-white font-medium">{esc.clientName}</span>
                  <AdminBadge label={esc.priority} variant={priorityVariant(esc.priority)} size="sm" dot />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    esc.level >= 3 ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                    esc.level >= 2 ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                    'bg-blue-500/15 text-blue-400 border-blue-500/20'
                  }`}>
                    Level {esc.level}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-2">{esc.subject}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Assigned: <span className="text-gray-300">{esc.assignedTo}</span></span>
                  <span>Escalated: <span className="text-gray-400">{esc.escalatedAt}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    esc.slaRemaining.startsWith('0') ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    <Clock className="w-3 h-3" />
                    SLA: {esc.slaRemaining}
                  </div>
                  <button
                    onClick={() => showToast(`Taking over ${esc.ticketId}`, 'success')}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 transition-colors"
                  >
                    Take Over
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ── 9. CSAT Dashboard ────────────────────────────────────────
function CSATDashboard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CSAT Trend */}
        <AdminGlass padding="p-0">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-semibold text-white">CSAT Score Trend</h3>
            </div>
          </div>
          <div className="px-5 py-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={CSAT_TREND}>
                <defs>
                  <linearGradient id="csatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[3.5, 5]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 } as any}
                  formatter={((v: number) => [v.toFixed(1), 'Score']) as any}
                />
                <Area type="monotone" dataKey="score" stroke={ACCENT} fill="url(#csatGrad)" strokeWidth={2} dot={{ r: 4, fill: ACCENT }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminGlass>

        {/* Per-Channel Satisfaction */}
        <AdminGlass padding="p-0">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-semibold text-white">Satisfaction by Channel</h3>
            </div>
          </div>
          <div className="px-5 py-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CHANNEL_SATISFACTION} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" domain={[0, 5]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="channel" type="category" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 } as any}
                  formatter={((v: number) => [v.toFixed(1), 'Score']) as any}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
                  {CHANNEL_SATISFACTION.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminGlass>
      </div>

      {/* Client Feedback Verbatims */}
      <AdminGlass padding="p-0">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Client Feedback</h3>
          </div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {CLIENT_FEEDBACK.map(fb => (
            <div key={fb.id} className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{fb.clientName}</span>
                  {channelIcon(fb.channel)}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < fb.score ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-600">{fb.date}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 italic leading-relaxed">&ldquo;{fb.comment}&rdquo;</p>
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ── Generic Placeholder ──────────────────────────────────────
function SubTabPlaceholder({ name, navigate }: { name: string; navigate: (path: string) => void }) {
  return (
    <AdminGlass>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
          <Headphones className="w-8 h-8 text-teal-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 capitalize">{name.replace(/-/g, ' ')}</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md">
          The {name.replace(/-/g, ' ')} module is being configured. This feature will be available shortly.
        </p>
        <button
          onClick={() => navigate('cs')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          Back to Dashboard
        </button>
      </div>
    </AdminGlass>
  )
}

// ── Lead Alerts View (Real-time form submissions) ──────────────
function LeadAlertsView({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [newLeadFlash, setNewLeadFlash] = useState<string | null>(null)

  const loadLeads = useCallback(async () => {
    setLoading(true)
    const data = await fetchLeads({ limit: 50 })
    setLeads(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadLeads() }, [loadLeads])

  // Realtime: new lead alarm
  useEffect(() => {
    const unsub = onNewLead((payload) => {
      const row = payload.new as any
      const name = [row?.first_name, row?.last_name].filter(Boolean).join(' ') || 'New Lead'
      const source = row?.source || 'website'

      // Play alarm sound (925 Hz beep)
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 925
        gain.gain.value = 0.3
        osc.start()
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.stop(ctx.currentTime + 0.5)
      } catch {}

      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification('New Lead!', {
          body: `${name} via ${source}`,
          icon: '/icons/icon-192.png',
          tag: 'ghl-new-lead',
        })
      }

      showToast(`New lead: ${name} (${source})`, 'info')
      setNewLeadFlash(row?.id || name)
      setTimeout(() => setNewLeadFlash(null), 3000)
      loadLeads()
    })

    // Also listen for contact form submissions
    const unsub2 = onNewContactSubmission((payload) => {
      const row = payload.new as any
      const name = row?.full_name || 'Unknown'
      const formType = row?.form_type || 'contact'

      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 800
        gain.gain.value = 0.2
        osc.start()
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
        osc.stop(ctx.currentTime + 0.4)
      } catch {}

      if (Notification.permission === 'granted') {
        new Notification('New Form Submission!', {
          body: `${name} — ${formType}`,
          icon: '/icons/icon-192.png',
          tag: 'ghl-new-form',
        })
      }

      showToast(`Form submission: ${name} (${formType})`, 'info')
    })

    // Request notification permission
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => { unsub?.(); unsub2?.() }
  }, [loadLeads, showToast])

  const SOURCE_COLORS: Record<string, string> = {
    website: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    referral: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    'cold-outreach': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    event: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    'social-media': 'bg-pink-500/15 text-pink-400 border-pink-500/20',
    whatsapp: 'bg-green-500/15 text-green-400 border-green-500/20',
  }

  const STAGE_COLORS: Record<string, string> = {
    new: 'bg-blue-500/15 text-blue-400',
    contacted: 'bg-cyan-500/15 text-cyan-400',
    qualified: 'bg-amber-500/15 text-amber-400',
    proposal: 'bg-purple-500/15 text-purple-400',
    negotiation: 'bg-orange-500/15 text-orange-400',
    won: 'bg-emerald-500/15 text-emerald-400',
    lost: 'bg-red-500/15 text-red-400',
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <AdminGlass padding="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BellRing className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Lead Alerts — Live Feed</h3>
              <p className="text-[11px] text-gray-500">Real-time website form submissions &middot; {leads.length} total leads</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {newLeadFlash && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                NEW LEAD
              </span>
            )}
            <button
              onClick={loadLeads}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
              Refresh
            </button>
          </div>
        </div>
      </AdminGlass>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminKPICard title="Total Leads" value={leads.length} icon={Users} color={ACCENT} delay={0} />
        <AdminKPICard title="New" value={leads.filter(l => l.stage === 'new').length} subtitle="Uncontacted" icon={Plus} color="#3b82f6" delay={50} />
        <AdminKPICard title="In Pipeline" value={leads.filter(l => !['won', 'lost', 'new'].includes(l.stage)).length} icon={TrendingUp} color="#8b5cf6" delay={100} />
        <AdminKPICard title="Won" value={leads.filter(l => l.stage === 'won').length} icon={CheckCircle2} color="#10b981" delay={150} />
      </div>

      {/* Lead List */}
      <AdminGlass padding="p-0">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Leads</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Users className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">No leads yet</p>
            <p className="text-xs text-gray-600 mt-1">Leads from website forms will appear here in real-time</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {leads.map(lead => (
              <div
                key={lead.id}
                className={`flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-all cursor-pointer ${
                  newLeadFlash === lead.id ? 'bg-teal-500/[0.06] border-l-2 border-teal-400' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">{lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{lead.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${SOURCE_COLORS[lead.source] || 'bg-gray-500/15 text-gray-400 border-gray-500/20'}`}>
                      {lead.source.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {lead.email && <span className="text-[11px] text-gray-500 truncate">{lead.email}</span>}
                    {lead.phone && <span className="text-[11px] text-gray-500">{lead.phone}</span>}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[lead.stage] || 'bg-gray-500/15 text-gray-400'}`}>
                  {lead.stage}
                </span>
                <span className="text-[10px] text-gray-600 w-20 text-right">{lead.createdDate}</span>
              </div>
            ))}
          </div>
        )}
      </AdminGlass>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ════════════════════════════════════════════════════════════════
export default function CSCenterModule({ subTab, navigate, showToast, role }: CSCenterModuleProps) {
  // Sub-tab navigation
  const SUB_TABS = [
    { key: null, label: 'Dashboard', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { key: 'leads', label: 'Leads', icon: <BellRing className="w-3.5 h-3.5" /> },
    { key: 'inbox', label: 'Inbox', icon: <Mail className="w-3.5 h-3.5" /> },
    { key: 'tickets', label: 'Tickets', icon: <Hash className="w-3.5 h-3.5" /> },
    { key: 'calls', label: 'Calls', icon: <Phone className="w-3.5 h-3.5" /> },
    { key: 'video', label: 'Video', icon: <Video className="w-3.5 h-3.5" /> },
    { key: 'chat', label: 'Chat', icon: <MessageCircle className="w-3.5 h-3.5" /> },
    { key: 'whatsapp', label: 'WhatsApp', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { key: 'escalations', label: 'Escalations', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    { key: 'csat', label: 'CSAT', icon: <Star className="w-3.5 h-3.5" /> },
  ]

  const PLACEHOLDER_TABS = ['telegram', 'email', 'social', 'knowledge-base', 'scripts', 'quality']

  function renderContent() {
    if (subTab === null) return <CSDashboard navigate={navigate} showToast={showToast} />
    if (subTab === 'leads') return <LeadAlertsView showToast={showToast} />
    if (subTab === 'inbox') return <UnifiedInbox showToast={showToast} />
    if (subTab === 'tickets') return <TicketManagement showToast={showToast} />
    if (subTab === 'calls') return <CallsView showToast={showToast} />
    if (subTab === 'video') return <VideoView showToast={showToast} />
    if (subTab === 'chat') return <ChatView showToast={showToast} />
    if (subTab === 'whatsapp') return <WhatsAppView showToast={showToast} />
    if (subTab === 'escalations') return <EscalationsView showToast={showToast} />
    if (subTab === 'csat') return <CSATDashboard />
    if (PLACEHOLDER_TABS.includes(subTab)) return <SubTabPlaceholder name={subTab} navigate={navigate} />
    return <SubTabPlaceholder name={subTab} navigate={navigate} />
  }

  return (
    <div className="space-y-5">
      {/* Module Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <Headphones className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Customer Service Center</h2>
            <p className="text-xs text-gray-500">Omnichannel support &middot; {role.replace(/-/g, ' ')}</p>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {SUB_TABS.map(tab => (
          <button
            key={tab.key ?? 'dashboard'}
            onClick={() => navigate(tab.key ? `cs/${tab.key}` : 'cs')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all ${
              subTab === tab.key
                ? 'bg-teal-500/20 border-teal-500/30 text-teal-400 shadow-sm shadow-teal-500/10'
                : 'bg-white/[0.02] border-white/[0.06] text-gray-500 hover:bg-white/[0.06] hover:text-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {renderContent()}
    </div>
  )
}
