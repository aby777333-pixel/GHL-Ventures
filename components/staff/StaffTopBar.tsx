'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Bell, Menu, ChevronRight, Info, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import type { StaffModule, AgentStatus } from '@/lib/staff/staffTypes'
import { STAFF_MODULE_LABELS } from '@/lib/staff/staffConstants'
import { fetchNotifications } from '@/lib/supabase/reportsDataService'
import { updateRow } from '@/lib/supabase/adminDataService'

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; bg: string }> = {
  available: { label: 'Available', color: 'bg-emerald-400', bg: 'bg-emerald-500/15 text-emerald-400' },
  busy: { label: 'Busy', color: 'bg-amber-400', bg: 'bg-amber-500/15 text-amber-400' },
  away: { label: 'Away', color: 'bg-red-400', bg: 'bg-red-500/15 text-red-400' },
  break: { label: 'Break', color: 'bg-purple-400', bg: 'bg-purple-500/15 text-purple-400' },
  offline: { label: 'Offline', color: 'bg-gray-500', bg: 'bg-gray-500/15 text-gray-400' },
}

interface StaffTopBarProps {
  activeModule: StaffModule
  activeSubTab: string | null
  onMenuToggle: () => void
  navigate: (path: string) => void
  agentStatus: AgentStatus
  onStatusChange: (s: AgentStatus) => void
  userName: string
}

const NOTIF_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
  action_required: AlertTriangle,
  critical: AlertCircle,
}

const NOTIF_COLORS: Record<string, string> = {
  error: 'text-red-400',
  critical: 'text-red-400',
  warning: 'text-amber-400',
  action_required: 'text-amber-400',
  success: 'text-emerald-400',
  info: 'text-blue-400',
}

function formatNotifTime(ts: string): string {
  if (!ts) return ''
  const d = new Date(ts)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function StaffTopBar({
  activeModule, activeSubTab, onMenuToggle, navigate, agentStatus, onStatusChange, userName,
}: StaffTopBarProps) {
  const statusCfg = STATUS_CONFIG[agentStatus]
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [readNotifs, setReadNotifs] = useState<Set<string>>(new Set())
  const notifRef = useRef<HTMLDivElement>(null)

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications().then(data => setNotifications(data || []))
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

  const unreadCount = notifications.filter(n => !n.is_read && !readNotifs.has(n.id)).length

  const markAsRead = (id: string) => {
    setReadNotifs(prev => new Set(prev).add(id))
    updateRow('notifications', id, { is_read: true, read_at: new Date().toISOString() })
  }

  return (
    <header className="sticky top-0 z-[100] border-b border-white/[0.04]"
      style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-sm">
            <button onClick={() => navigate('home')} className="text-gray-500 hover:text-white transition-colors">
              Staff Portal
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-gray-700" />
            <span className="text-white font-medium">{STAFF_MODULE_LABELS[activeModule]}</span>
            {activeSubTab && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-700" />
                <span className="text-gray-400 capitalize">{activeSubTab.replace(/-/g, ' ')}</span>
              </>
            )}
          </div>
        </div>

        {/* Center — Search */}
        <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input
              type="text"
              placeholder="Search clients, tickets, KB... (⌘K)"
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/30 transition-colors"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Agent Status */}
          <div className="relative group">
            <button className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${statusCfg.bg} border-current/20`}>
              <span className={`w-2 h-2 rounded-full ${statusCfg.color} ${agentStatus === 'available' ? 'animate-pulse' : ''}`} />
              {statusCfg.label}
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50">
              <div className="rounded-xl bg-[#111]/95 border border-white/[0.08] shadow-2xl py-1 min-w-[120px]" style={{ backdropFilter: 'blur(20px)' }}>
                {(Object.keys(STATUS_CONFIG) as AgentStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => onStatusChange(s)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-white/[0.06] transition-colors ${agentStatus === s ? 'text-white' : 'text-gray-400'}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].color}`} />
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-red text-[9px] text-white font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden z-[200]"
                style={{ background: 'rgba(18,18,26,0.98)', backdropFilter: 'blur(40px)' }}
              >
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => notifications.forEach(n => markAsRead(n.id))}
                      className="text-[11px] text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 && (
                    <div className="py-8 text-center">
                      <Bell className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No notifications yet</p>
                    </div>
                  )}
                  {notifications.slice(0, 20).map(notif => {
                    const NIcon = NOTIF_ICONS[notif.type] || Info
                    const isRead = notif.is_read || readNotifs.has(notif.id)
                    return (
                      <button
                        key={notif.id}
                        onClick={() => {
                          markAsRead(notif.id)
                          if (notif.metadata?.module) navigate(notif.metadata.module)
                          setNotifOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors ${isRead ? 'opacity-60' : ''}`}
                      >
                        <div className="flex gap-3">
                          <NIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${NOTIF_COLORS[notif.type] || 'text-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{notif.title}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-gray-600 mt-1">{formatNotifTime(notif.created_at)}</p>
                          </div>
                          {!isRead && <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 mt-1" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/[0.06]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500/30 to-blue-500/30 border border-white/[0.08] flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{userName.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <span className="text-xs text-gray-400 hidden lg:block">{userName.split(' ')[0]}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
