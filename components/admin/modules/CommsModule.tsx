'use client'

import { useState, useMemo } from 'react'
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

const BROADCASTS: Broadcast[] = [
  { id: 'BC-001', title: 'Q4 2024 Performance Report — All Investors', channel: 'email', recipients: 'All Active Clients (342)', sentBy: 'Karthik Sundaram', sentDate: '2025-03-19T10:00:00', status: 'sent', openRate: 78, clickRate: 42 },
  { id: 'BC-002', title: 'New Fund Launch — Phoenix Real Estate Series C', channel: 'email', recipients: 'Qualified Leads (47)', sentBy: 'Priya Natarajan', sentDate: '2025-03-20T09:00:00', status: 'sent', openRate: 65, clickRate: 35 },
  { id: 'BC-003', title: 'KYC Renewal Reminder', channel: 'sms', recipients: '3 Clients', sentBy: 'Meera Subramaniam', sentDate: '2025-03-18T14:00:00', status: 'sent' },
  { id: 'BC-004', title: 'April Newsletter — Market Outlook', channel: 'email', recipients: 'All Subscribers', sentBy: 'Abe Thayil', sentDate: '2025-04-01T08:00:00', status: 'scheduled' },
  { id: 'BC-005', title: 'Investment Opportunity Alert', channel: 'whatsapp', recipients: 'Premium Investors (50)', sentBy: 'Priya Natarajan', sentDate: '', status: 'draft' },
]

const INTERNAL_MESSAGES: ChatMessage[] = [
  { id: 'MSG-001', sender: 'Meera Subramaniam', channel: '#compliance', message: 'KYC for Vikram Mehta is under review. Need additional docs.', timestamp: '2025-03-20T10:30:00', read: false },
  { id: 'MSG-002', sender: 'Priya Natarajan', channel: '#sales', message: 'Ganesh Iyer deal is almost closed. Final docs expected this week.', timestamp: '2025-03-20T09:45:00', read: false },
  { id: 'MSG-003', sender: 'Venkatesh Raghavan', channel: '#investments', message: 'NAV updated for all funds. Phoenix Towers at 1,247.50.', timestamp: '2025-03-20T09:30:00', read: true },
  { id: 'MSG-004', sender: 'Karthik Sundaram', channel: '#general', message: 'Q4 report has been uploaded to the document repository.', timestamp: '2025-03-19T17:00:00', read: true },
  { id: 'MSG-005', sender: 'Sowmya Rajan', channel: '#legal', message: 'SEBI filing deadline is March 31. Please review the draft.', timestamp: '2025-03-19T15:00:00', read: true },
  { id: 'MSG-006', sender: 'Divya Krishnamurthy', channel: '#client-services', message: 'Portfolio review sent to Sunita Agarwal and Kavitha Raman.', timestamp: '2025-03-19T14:30:00', read: true },
]

const SYSTEM_ALERTS: Alert[] = [
  { id: 'ALT-001', type: 'compliance', title: 'KYC Expiry Warning', message: '3 client KYC documents expiring within 30 days', timestamp: '2025-03-20T09:00:00', severity: 'critical', acknowledged: false },
  { id: 'ALT-002', type: 'security', title: 'Failed Login Attempts', message: '5 failed login attempts detected from unknown IP', timestamp: '2025-03-20T08:15:00', severity: 'high', acknowledged: false },
  { id: 'ALT-003', type: 'finance', title: 'Overdue Invoice', message: 'Invoice INV-2025-003 for Deepak Patel is overdue', timestamp: '2025-03-19T16:00:00', severity: 'medium', acknowledged: true },
  { id: 'ALT-004', type: 'system', title: 'Backup Completed', message: 'Daily backup completed successfully (2.4 GB)', timestamp: '2025-03-18T02:00:00', severity: 'low', acknowledged: true },
  { id: 'ALT-005', type: 'compliance', title: 'Regulatory Update', message: 'New SEBI circular on AIF reporting requirements published', timestamp: '2025-03-17T10:00:00', severity: 'medium', acknowledged: false },
]

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
          onClick={() => showToast('New broadcast composer coming soon', 'info')}
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

// ── Internal Chat Tab ───────────────────────────────────────────
function InternalChatTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const channels = useMemo(() => {
    const chans = new Set(INTERNAL_MESSAGES.map(m => m.channel))
    return Array.from(chans)
  }, [])

  const [activeChannel, setActiveChannel] = useState(channels[0] || '#general')

  const channelMessages = useMemo(() => {
    return INTERNAL_MESSAGES.filter(m => m.channel === activeChannel)
  }, [activeChannel])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Channel List */}
      <AdminGlass padding="p-3" className="lg:col-span-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Channels</h3>
        <div className="space-y-1">
          {channels.map(ch => {
            const unread = INTERNAL_MESSAGES.filter(m => m.channel === ch && !m.read).length
            return (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeChannel === ch
                    ? 'bg-brand-red/15 text-white'
                    : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5" />
                  {ch.replace('#', '')}
                </span>
                {unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-brand-red text-[10px] text-white flex items-center justify-center font-bold">{unread}</span>
                )}
              </button>
            )
          })}
        </div>
      </AdminGlass>

      {/* Messages */}
      <AdminGlass padding="p-4" className="lg:col-span-3">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Hash className="w-4 h-4 text-gray-500" />
          {activeChannel.replace('#', '')}
        </h3>
        <div className="space-y-3 mb-4">
          {channelMessages.map(msg => (
            <div key={msg.id} className={`flex gap-3 p-3 rounded-xl transition-colors ${!msg.read ? 'bg-brand-red/[0.03] border border-brand-red/10' : 'bg-white/[0.02] border border-white/[0.04]'}`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red/30 to-blue-500/30 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                {msg.sender.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{msg.sender}</span>
                  <span className="text-[10px] text-gray-600">{formatTimeAgo(msg.timestamp)}</span>
                  {!msg.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />}
                </div>
                <p className="text-xs text-gray-400 mt-1">{msg.message}</p>
              </div>
            </div>
          ))}
          {channelMessages.length === 0 && (
            <AdminEmptyState title="No messages" description="This channel is empty." />
          )}
        </div>
        {/* Message Input */}
        <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
          <input
            type="text"
            placeholder={`Message ${activeChannel}...`}
            className="flex-1 px-3 py-2 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 admin-input-glow"
            onKeyDown={e => { if (e.key === 'Enter') showToast('Messages are in demo mode', 'info') }}
          />
          <button
            onClick={() => showToast('Messages are in demo mode', 'info')}
            className="p-2.5 rounded-xl bg-brand-red/20 text-brand-red hover:bg-brand-red/30 transition-colors"
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
