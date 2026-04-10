'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Menu, Search, Bell, ChevronRight, Clock, X,
  AlertCircle, CheckCircle, Info, AlertTriangle,
} from 'lucide-react'
import { MODULE_LABELS } from '@/lib/admin/adminConstants'
import { fetchNotifications, updateRow, insertRow } from '@/lib/supabase/adminDataService'
import { onNewChatSession, onNewLead, onNewContactSubmission } from '@/lib/supabase/realtimeSubscriptions'
import type { AdminModule, NotificationType } from '@/lib/admin/adminTypes'
import { formatTimeAgo } from '@/lib/admin/adminHooks'

interface AdminTopBarProps {
  activeModule: AdminModule
  activeSubTab: string | null
  onMenuToggle: () => void
  navigate: (path: string) => void
}

const NOTIF_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
}

const NOTIF_COLORS: Record<NotificationType, string> = {
  critical: 'text-red-400',
  warning: 'text-amber-400',
  success: 'text-emerald-400',
  info: 'text-blue-400',
}

export default function AdminTopBar({ activeModule, activeSubTab, onMenuToggle, navigate }: AdminTopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [readNotifs, setReadNotifs] = useState<Set<string>>(new Set())
  const notifRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    fetchNotifications().then(data => setNotifications(data))
  }, [])

  // Play ring sound for incoming chats (two-tone ascending ring)
  const playRingSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const now = ctx.currentTime
      const tones = [
        { freq: 800, start: 0, dur: 0.15 },
        { freq: 1000, start: 0.18, dur: 0.15 },
        { freq: 800, start: 0.5, dur: 0.15 },
        { freq: 1000, start: 0.68, dur: 0.15 },
      ]
      tones.forEach(t => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = t.freq
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.25, now + t.start)
        gain.gain.exponentialRampToValueAtTime(0.001, now + t.start + t.dur)
        osc.start(now + t.start)
        osc.stop(now + t.start + t.dur + 0.05)
      })
    } catch {}
  }, [])

  // Send browser notification for admin
  const sendAdminBrowserNotification = useCallback((title: string, body: string) => {
    playRingSound()
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') Notification.requestPermission()
      if (Notification.permission === 'granted') {
        const notif = new Notification(title, { body, icon: '/icon.svg', tag: 'ghl-admin-chat' })
        setTimeout(() => notif.close(), 5000)
        notif.onclick = () => { window.focus(); notif.close() }
      }
    }
  }, [playRingSound])

  // Subscribe to new visitor chat sessions — ring + inject notification
  useEffect(() => {
    const unsub = onNewChatSession((payload) => {
      const session = payload.new as any
      const visitorName = session.visitor_name || 'Visitor'

      // Inject into local notification state immediately
      const liveNotif = {
        id: `chat-${session.id || Date.now()}`,
        title: '🔔 New Live Chat',
        message: `${visitorName} is waiting for assistance`,
        type: 'info',
        severity: 'high',
        is_read: false,
        created_at: new Date().toISOString(),
        metadata: { module: 'comms' },
      }
      setNotifications(prev => [liveNotif, ...prev])

      // Play ring + browser notification
      sendAdminBrowserNotification('New Live Chat', `${visitorName} is waiting for assistance`)

      // Persist to Supabase (non-blocking)
      insertRow('notifications', {
        title: 'New Live Chat',
        message: `${visitorName} started a chat from the website`,
        type: 'info',
        severity: 'high',
        is_read: false,
        metadata: { module: 'comms', chat_session_id: session.id },
      }).catch(() => {}) // silent if table doesn't exist
    })
    return () => { unsub?.() }
  }, [sendAdminBrowserNotification])

  // Subscribe to new leads — alert admin
  useEffect(() => {
    const unsub = onNewLead((payload) => {
      const lead = payload.new as any
      const name = lead.full_name || lead.name || 'New Lead'
      const liveNotif = {
        id: `lead-${lead.id || Date.now()}`,
        title: 'New Lead Captured',
        message: `${name} — ${lead.source || 'website'}`,
        type: 'success',
        severity: 'medium',
        is_read: false,
        created_at: new Date().toISOString(),
        metadata: { module: 'sales' },
      }
      setNotifications(prev => [liveNotif, ...prev])
      sendAdminBrowserNotification('New Lead', `${name} submitted via ${lead.source || 'website'}`)
    })
    return () => { unsub?.() }
  }, [sendAdminBrowserNotification])

  // Subscribe to new contact form submissions — alert admin
  useEffect(() => {
    const unsub = onNewContactSubmission((payload) => {
      const sub = payload.new as any
      const name = sub.name || sub.full_name || 'Website Visitor'
      const liveNotif = {
        id: `contact-${sub.id || Date.now()}`,
        title: 'New Form Submission',
        message: `${name} — ${sub.form_type || sub.subject || 'contact form'}`,
        type: 'info',
        severity: 'medium',
        is_read: false,
        created_at: new Date().toISOString(),
        metadata: { module: 'sales' },
      }
      setNotifications(prev => [liveNotif, ...prev])
      sendAdminBrowserNotification('New Form Submission', `${name} submitted a ${sub.form_type || 'contact'} form`)
    })
    return () => { unsub?.() }
  }, [sendAdminBrowserNotification])

  const unreadCount = notifications.filter(n => !n.is_read && !readNotifs.has(n.id)).length

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

  const markAsRead = (id: string) => {
    setReadNotifs(prev => new Set(prev).add(id))
    // Persist to Supabase (non-blocking)
    updateRow('notifications', id, { is_read: true, read_at: new Date().toISOString() })
  }

  // Current time
  const [time, setTime] = useState('')
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }))
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  // Breadcrumb
  const moduleLabel = MODULE_LABELS[activeModule] || 'Overview'
  const subTabLabel = activeSubTab
    ? activeSubTab.charAt(0).toUpperCase() + activeSubTab.slice(1).replace(/-/g, ' ')
    : null

  return (
    <header
      className="sticky top-0 z-30 border-b border-white/[0.06]"
      style={{
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">
        {/* Left: menu + breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-500 hidden sm:inline">Admin</span>
            <ChevronRight className="w-3 h-3 text-gray-600 hidden sm:inline" />
            <span className="text-white font-medium">{moduleLabel}</span>
            {subTabLabel && (
              <>
                <ChevronRight className="w-3 h-3 text-gray-600" />
                <span className="text-gray-400">{subTabLabel}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: search + time + notifications */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
            searchFocused ? 'border-brand-red/40 bg-white/[0.06]' : 'border-white/[0.06] bg-white/[0.03]'
          }`}>
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search... (Ctrl+K)"
              className="bg-transparent text-sm text-white placeholder-gray-600 outline-none w-40 lg:w-56"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <kbd className="hidden lg:inline text-[9px] text-gray-600 px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.03]">
              ⌘K
            </kbd>
          </div>

          {/* Time */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{time}</span>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-brand-red text-[9px] text-white font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {notifOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden"
                style={{ background: 'rgba(18,18,26,0.98)', backdropFilter: 'blur(40px)' }}
              >
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  <button
                    onClick={() => {
                      notifications.forEach(n => markAsRead(n.id))
                    }}
                    className="text-[11px] text-brand-red hover:text-red-300 transition-colors"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 && (
                    <div className="py-8 text-center">
                      <Bell className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No notifications yet</p>
                    </div>
                  )}
                  {notifications.map(notif => {
                    // Map DB types to admin display types (error → critical)
                    const displayType = notif.type === 'error' ? 'critical' : notif.type === 'action_required' ? 'warning' : notif.type
                    const NIcon = NOTIF_ICONS[displayType as NotificationType] || Info
                    const isRead = notif.is_read || readNotifs.has(notif.id)
                    const targetModule = notif.metadata?.module || notif.link || 'overview'
                    return (
                      <button
                        key={notif.id}
                        onClick={() => {
                          markAsRead(notif.id)
                          navigate(targetModule)
                          setNotifOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors ${
                          isRead ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <NIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${NOTIF_COLORS[displayType as NotificationType] || 'text-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{notif.title}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-gray-600 mt-1">{formatTimeAgo(notif.created_at)}</p>
                          </div>
                          {!isRead && <span className="w-2 h-2 rounded-full bg-brand-red flex-shrink-0 mt-1" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
