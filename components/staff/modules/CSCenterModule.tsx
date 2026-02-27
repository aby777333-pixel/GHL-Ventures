'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Headphones, Phone, Video, MessageCircle, Mail, Send, Globe,
  BarChart3, AlertTriangle, CheckCircle2, Clock, Users, Eye, Edit3,
  Plus, Filter, Search, ArrowRight, Zap, Star, TrendingUp,
  ArrowUpRight, ArrowDownRight, Smartphone, Hash, Shield, BellRing,
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
} from '@/lib/supabase/realtimeSubscriptions'

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
//  INLINE MOCK DATA
// ════════════════════════════════════════════════════════════════

// -- Queue Items
const QUEUE_ITEMS = [
  { id: 'Q-001', clientName: 'Rajesh Patel', channel: 'chat', waitTime: 12, priority: 'high', query: 'NAV discrepancy for Fund-A' },
  { id: 'Q-002', clientName: 'Meena Iyer', channel: 'call', waitTime: 45, priority: 'critical', query: 'Redemption processing delay' },
  { id: 'Q-003', clientName: 'Arun Nair', channel: 'whatsapp', waitTime: 8, priority: 'medium', query: 'KYC document re-upload' },
  { id: 'Q-004', clientName: 'Priya Sharma', channel: 'email', waitTime: 120, priority: 'low', query: 'Statement request for FY25' },
  { id: 'Q-005', clientName: 'Vikram Singh', channel: 'telegram', waitTime: 22, priority: 'high', query: 'SIP modification request' },
  { id: 'Q-006', clientName: 'Deepa Menon', channel: 'chat', waitTime: 5, priority: 'medium', query: 'Nominee update query' },
]

// -- Active Sessions
const ACTIVE_SESSIONS = [
  { id: 'S-001', clientName: 'Anita Desai', channel: 'chat', duration: '04:32', topic: 'Portfolio rebalancing guidance', sentiment: 'positive' },
  { id: 'S-002', clientName: 'Karthik Reddy', channel: 'call', duration: '12:15', topic: 'Complaint about delayed payout', sentiment: 'negative' },
  { id: 'S-003', clientName: 'Lakshmi Bhat', channel: 'whatsapp', duration: '01:48', topic: 'New investment inquiry', sentiment: 'neutral' },
]

// -- Inbox Threads
const INBOX_THREADS = [
  { id: 'T-001', clientName: 'Rajesh Patel', channel: 'chat', lastMessage: 'I checked my dashboard and the NAV still looks wrong. Can you verify?', time: '2 min ago', priority: 'high', status: 'active', unread: true },
  { id: 'T-002', clientName: 'Meena Iyer', channel: 'call', lastMessage: 'Missed call - Callback requested for redemption issue', time: '5 min ago', priority: 'critical', status: 'pending', unread: true },
  { id: 'T-003', clientName: 'Suresh Kumar', channel: 'whatsapp', lastMessage: 'Thank you for the update! I will upload the documents today.', time: '12 min ago', priority: 'low', status: 'resolved', unread: false },
  { id: 'T-004', clientName: 'Priya Sharma', channel: 'email', lastMessage: 'Please find attached my PAN card copy for the KYC update.', time: '25 min ago', priority: 'medium', status: 'active', unread: true },
  { id: 'T-005', clientName: 'Vikram Singh', channel: 'telegram', lastMessage: 'Can I switch from Growth to Dividend option for my SIP?', time: '35 min ago', priority: 'medium', status: 'active', unread: false },
  { id: 'T-006', clientName: 'Arun Nair', channel: 'whatsapp', lastMessage: 'My KYC is showing as pending since last week. Please check.', time: '1 hr ago', priority: 'high', status: 'active', unread: true },
  { id: 'T-007', clientName: 'Deepa Menon', channel: 'chat', lastMessage: 'What is the process to add a nominee to my account?', time: '1.5 hr ago', priority: 'low', status: 'active', unread: false },
  { id: 'T-008', clientName: 'Nitin Joshi', channel: 'email', lastMessage: 'Requesting updated capital gains statement for tax filing purposes.', time: '2 hr ago', priority: 'medium', status: 'pending', unread: true },
]

// -- Thread Messages (detail view)
const THREAD_MESSAGES = [
  { sender: 'client', message: 'Hi, I noticed my NAV for Fund-A seems off today. It shows 142.5 but the website says 145.2.', time: '10:15 AM' },
  { sender: 'agent', message: 'Hello Rajesh! Let me check this for you right away. Could you confirm which folio number this is under?', time: '10:16 AM' },
  { sender: 'client', message: 'It is folio GHL-2024-1847. I invested Rs 5 lakh last month.', time: '10:17 AM' },
  { sender: 'agent', message: 'Thank you. I can see the folio. The NAV update is reflecting T+1 pricing. Your purchase NAV was correctly applied at 145.2. The display should update by EOD.', time: '10:19 AM' },
  { sender: 'client', message: 'I checked my dashboard and the NAV still looks wrong. Can you verify?', time: '10:22 AM' },
]

// -- Tickets
const TICKETS_DATA = [
  { id: 'TK-1001', clientName: 'Rajesh Patel', subject: 'NAV mismatch in dashboard', category: 'nav', priority: 'high', status: 'open', assignedTo: 'Priya S.', age: '2h', createdDate: '2026-02-22' },
  { id: 'TK-1002', clientName: 'Meena Iyer', subject: 'Redemption payout delayed', category: 'investment', priority: 'critical', status: 'in-progress', assignedTo: 'Amit K.', age: '1d', createdDate: '2026-02-21' },
  { id: 'TK-1003', clientName: 'Suresh Kumar', subject: 'KYC re-verification needed', category: 'kyc', priority: 'medium', status: 'awaiting-client', assignedTo: 'Priya S.', age: '3d', createdDate: '2026-02-19' },
  { id: 'TK-1004', clientName: 'Arun Nair', subject: 'Account access issue after password reset', category: 'account', priority: 'high', status: 'in-progress', assignedTo: 'Deepak R.', age: '6h', createdDate: '2026-02-22' },
  { id: 'TK-1005', clientName: 'Priya Sharma', subject: 'FY25 statement not available', category: 'documents', priority: 'low', status: 'resolved', assignedTo: 'Priya S.', age: '5d', createdDate: '2026-02-17' },
  { id: 'TK-1006', clientName: 'Vikram Singh', subject: 'SIP plan modification request', category: 'investment', priority: 'medium', status: 'open', assignedTo: 'Amit K.', age: '4h', createdDate: '2026-02-22' },
  { id: 'TK-1007', clientName: 'Deepa Menon', subject: 'Nominee addition process query', category: 'general', priority: 'low', status: 'closed', assignedTo: 'Deepak R.', age: '7d', createdDate: '2026-02-15' },
  { id: 'TK-1008', clientName: 'Nitin Joshi', subject: 'Capital gains report discrepancy', category: 'documents', priority: 'high', status: 'awaiting-internal', assignedTo: 'Amit K.', age: '1d', createdDate: '2026-02-21' },
]

// -- Calls
const PENDING_CALLS = [
  { id: 'CL-001', clientName: 'Meena Iyer', phone: '+91 98765 43210', waitTime: '2:15', priority: 'critical', reason: 'Redemption callback' },
  { id: 'CL-002', clientName: 'Arun Nair', phone: '+91 87654 32109', waitTime: '1:03', priority: 'high', reason: 'KYC escalation' },
  { id: 'CL-003', clientName: 'Suresh Kumar', phone: '+91 76543 21098', waitTime: '0:32', priority: 'medium', reason: 'General inquiry' },
]

const RECENT_CALLS = [
  { id: 'RC-001', clientName: 'Rajesh Patel', direction: 'inbound', duration: '08:42', outcome: 'Resolved', time: '9:30 AM', sentiment: 'positive' },
  { id: 'RC-002', clientName: 'Priya Sharma', direction: 'outbound', duration: '05:11', outcome: 'Follow-up', time: '9:15 AM', sentiment: 'neutral' },
  { id: 'RC-003', clientName: 'Vikram Singh', direction: 'inbound', duration: '12:20', outcome: 'Escalated', time: '8:45 AM', sentiment: 'negative' },
  { id: 'RC-004', clientName: 'Anita Desai', direction: 'outbound', duration: '03:05', outcome: 'Resolved', time: '8:20 AM', sentiment: 'positive' },
  { id: 'RC-005', clientName: 'Karthik Reddy', direction: 'inbound', duration: '15:33', outcome: 'Escalated', time: 'Yesterday', sentiment: 'negative' },
  { id: 'RC-006', clientName: 'Lakshmi Bhat', direction: 'outbound', duration: '06:48', outcome: 'Resolved', time: 'Yesterday', sentiment: 'positive' },
]

// -- Video
const VIDEO_REQUESTS = [
  { id: 'VR-001', clientName: 'Rajesh Patel', scheduledAt: '11:00 AM', purpose: 'Portfolio review discussion', status: 'pending' },
  { id: 'VR-002', clientName: 'Anita Desai', scheduledAt: '2:30 PM', purpose: 'KYC video verification', status: 'pending' },
]

const VIDEO_SESSIONS = [
  { id: 'VS-001', clientName: 'Vikram Singh', date: 'Today 9:00 AM', duration: '22 min', purpose: 'Investment consultation', rating: 5 },
  { id: 'VS-002', clientName: 'Meena Iyer', date: 'Yesterday 3:00 PM', duration: '15 min', purpose: 'Complaint resolution', rating: 3 },
  { id: 'VS-003', clientName: 'Suresh Kumar', date: 'Feb 20, 2:00 PM', duration: '30 min', purpose: 'New account onboarding', rating: 4 },
  { id: 'VS-004', clientName: 'Priya Sharma', date: 'Feb 19, 11:30 AM', duration: '18 min', purpose: 'Document verification', rating: 5 },
]

// -- Chat
const ACTIVE_CHATS = [
  { id: 'CH-001', clientName: 'Rajesh Patel', lastMsg: 'Can you verify the NAV?', time: '2 min ago', unread: 2 },
  { id: 'CH-002', clientName: 'Deepa Menon', lastMsg: 'What is the nominee process?', time: '8 min ago', unread: 0 },
  { id: 'CH-003', clientName: 'Lakshmi Bhat', lastMsg: 'Thanks for the info!', time: '12 min ago', unread: 1 },
]

const CANNED_RESPONSES = [
  { id: 'CR-01', label: 'Greeting', text: 'Hello! Thank you for contacting GHL India Ventures. How may I assist you today?' },
  { id: 'CR-02', label: 'KYC Pending', text: 'Your KYC verification is currently in progress. It typically takes 2-3 business days.' },
  { id: 'CR-03', label: 'NAV Info', text: 'NAV is updated on a T+1 basis. The current NAV will reflect by end of business day.' },
  { id: 'CR-04', label: 'Escalation', text: 'I understand your concern. Let me escalate this to our senior team for immediate attention.' },
  { id: 'CR-05', label: 'Closing', text: 'Is there anything else I can help you with? Thank you for choosing GHL India Ventures!' },
]

// -- WhatsApp
const WHATSAPP_THREADS = [
  { id: 'WA-001', clientName: 'Arun Nair', phone: '+91 87654 32109', lastMsg: 'KYC is showing pending since last week', time: '1 hr ago', unread: 2, status: 'active' },
  { id: 'WA-002', clientName: 'Suresh Kumar', phone: '+91 76543 21098', lastMsg: 'Thank you for the update!', time: '3 hr ago', unread: 0, status: 'resolved' },
  { id: 'WA-003', clientName: 'Priya Sharma', phone: '+91 65432 10987', lastMsg: 'Can I get my folio statement on WhatsApp?', time: '4 hr ago', unread: 1, status: 'active' },
  { id: 'WA-004', clientName: 'Nitin Joshi', phone: '+91 54321 09876', lastMsg: 'When will my SIP be processed?', time: '5 hr ago', unread: 0, status: 'active' },
  { id: 'WA-005', clientName: 'Deepa Menon', phone: '+91 43210 98765', lastMsg: 'Please share the nominee form', time: 'Yesterday', unread: 0, status: 'resolved' },
]

const WA_TEMPLATES = [
  { id: 'WT-01', name: 'Welcome Message', preview: 'Welcome to GHL India Ventures! We are delighted to have you...' },
  { id: 'WT-02', name: 'KYC Reminder', preview: 'Dear {{name}}, your KYC documents are pending. Please upload...' },
  { id: 'WT-03', name: 'NAV Update', preview: 'Today\'s NAV for {{fund_name}} is {{nav_value}} as of {{date}}...' },
  { id: 'WT-04', name: 'SIP Confirmation', preview: 'Your SIP of Rs {{amount}} for {{fund}} has been processed...' },
]

// -- Escalations
const ESCALATION_ITEMS = [
  { id: 'ESC-001', ticketId: 'TK-1002', clientName: 'Meena Iyer', subject: 'Redemption payout delayed beyond SLA', level: 2, slaRemaining: '1h 30m', assignedTo: 'CS Lead', priority: 'critical', escalatedAt: '10:00 AM' },
  { id: 'ESC-002', ticketId: 'TK-1008', clientName: 'Nitin Joshi', subject: 'Capital gains report needs finance team input', level: 1, slaRemaining: '4h 15m', assignedTo: 'Amit K.', priority: 'high', escalatedAt: '9:15 AM' },
  { id: 'ESC-003', ticketId: 'TK-1004', clientName: 'Arun Nair', subject: 'Account locked after multiple reset attempts', level: 1, slaRemaining: '2h 45m', assignedTo: 'Deepak R.', priority: 'high', escalatedAt: '8:45 AM' },
  { id: 'ESC-004', ticketId: 'TK-1003', clientName: 'Suresh Kumar', subject: 'KYC documents rejected twice by compliance', level: 3, slaRemaining: '0h 45m', assignedTo: 'CS Lead', priority: 'critical', escalatedAt: 'Yesterday' },
]

// -- CSAT Data
const CSAT_TREND = [
  { month: 'Sep', score: 4.2, responses: 180 },
  { month: 'Oct', score: 4.3, responses: 210 },
  { month: 'Nov', score: 4.1, responses: 195 },
  { month: 'Dec', score: 4.4, responses: 225 },
  { month: 'Jan', score: 4.5, responses: 240 },
  { month: 'Feb', score: 4.6, responses: 198 },
]

const CHANNEL_SATISFACTION = [
  { channel: 'Chat', score: 4.7, color: '#14b8a6' },
  { channel: 'Call', score: 4.3, color: '#8b5cf6' },
  { channel: 'WhatsApp', score: 4.6, color: '#10b981' },
  { channel: 'Email', score: 4.1, color: '#f59e0b' },
  { channel: 'Video', score: 4.8, color: '#ec4899' },
]

const CLIENT_FEEDBACK = [
  { id: 'FB-001', clientName: 'Rajesh Patel', score: 5, channel: 'chat', comment: 'Extremely helpful agent. Resolved my NAV query in minutes. Very professional service.', date: 'Today' },
  { id: 'FB-002', clientName: 'Anita Desai', score: 4, channel: 'call', comment: 'Good support overall. Agent was knowledgeable about portfolio options.', date: 'Today' },
  { id: 'FB-003', clientName: 'Vikram Singh', score: 3, channel: 'whatsapp', comment: 'Response was slightly delayed but the issue was eventually resolved.', date: 'Yesterday' },
  { id: 'FB-004', clientName: 'Meena Iyer', score: 2, channel: 'call', comment: 'Redemption issue still not resolved after multiple follow-ups. Very disappointed.', date: 'Yesterday' },
  { id: 'FB-005', clientName: 'Lakshmi Bhat', score: 5, channel: 'video', comment: 'Video call experience was seamless. The agent walked me through the entire process.', date: 'Feb 20' },
]

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
        <AdminKPICard title="Tickets Resolved" value={23} subtitle="Today" trend="up" trendValue="+12%" icon={CheckCircle2} color={ACCENT} delay={0} />
        <AdminKPICard title="Avg Response Time" value="45s" subtitle="Last 1 hour" trend="down" trendValue="-8s" icon={Clock} color="#8b5cf6" delay={100} />
        <AdminKPICard title="CSAT Score" value="4.6" subtitle="This week" trend="up" trendValue="+0.2" icon={Star} color="#f59e0b" delay={200} />
        <AdminKPICard title="Calls Handled" value={18} subtitle="Today" trend="up" trendValue="+5" icon={Phone} color="#ec4899" delay={300} />
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

  // Load active chat sessions from Supabase
  useEffect(() => {
    async function load() {
      setLoadingSessions(true)
      const sessions = await getActiveChatSessions()
      setChatSessions(sessions)
      if (sessions.length > 0 && !selectedChat) {
        setSelectedChat(sessions[0].id)
      }
      setLoadingSessions(false)
    }
    load()
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

  // Load messages when a chat is selected
  useEffect(() => {
    if (!selectedChat) return
    async function loadMessages() {
      const msgs = await getChatMessages(selectedChat!)
      setChatMessages(msgs)
    }
    loadMessages()
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

  // Fallback to mock data when no Supabase sessions available
  const displaySessions = chatSessions.length > 0 ? chatSessions : ACTIVE_CHATS.map(ch => ({
    id: ch.id,
    visitor_name: ch.clientName,
    status: 'active' as const,
    last_message_at: new Date().toISOString(),
    visitor_id: null, visitor_email: null, client_id: null, assigned_rep_id: null,
    channel: 'web_chat', priority: 0, page_url: null, assigned_at: null,
    first_response_at: null, resolved_at: null, csat_rating: null,
    metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }))

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

// ════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ════════════════════════════════════════════════════════════════
export default function CSCenterModule({ subTab, navigate, showToast, role }: CSCenterModuleProps) {
  // Sub-tab navigation
  const SUB_TABS = [
    { key: null, label: 'Dashboard', icon: <BarChart3 className="w-3.5 h-3.5" /> },
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
