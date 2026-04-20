'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bell, X, TrendingUp, FileText, Calendar, Check } from 'lucide-react'
import { NOTIFICATIONS, type Notification } from '@/lib/notifications'
import { useTheme } from '@/lib/ThemeProvider'

type TabFilter = 'all' | 'fund' | 'blog' | 'event'

interface NotificationCenterProps {
  scrolled: boolean
}

export default function NotificationCenter({ scrolled }: NotificationCenterProps) {
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const panelRef = useRef<HTMLDivElement>(null)
  const isLightTheme = theme === 'light'

  // Load read state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ghl-notif-read')
    if (stored) {
      try {
        setReadIds(new Set(JSON.parse(stored)))
      } catch { /* empty */ }
    }
  }, [])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const markAsRead = (id: string) => {
    const newSet = new Set(readIds)
    newSet.add(id)
    setReadIds(newSet)
    localStorage.setItem('ghl-notif-read', JSON.stringify(Array.from(newSet)))
  }

  const markAllRead = () => {
    const allIds = NOTIFICATIONS.map(n => n.id)
    const newSet = new Set(allIds)
    setReadIds(newSet)
    localStorage.setItem('ghl-notif-read', JSON.stringify(allIds))
  }

  const isRead = (n: Notification) => n.read || readIds.has(n.id)
  const unreadCount = NOTIFICATIONS.filter(n => !isRead(n)).length

  const filteredNotifs = activeTab === 'all'
    ? NOTIFICATIONS
    : NOTIFICATIONS.filter(n => n.type === activeTab)

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'fund', label: 'Fund' },
    { key: 'blog', label: 'Blog' },
    { key: 'event', label: 'Events' },
  ]

  const typeIcon = (type: string) => {
    switch (type) {
      case 'fund': return <TrendingUp className="w-4 h-4 text-brand-red" />
      case 'blog': return <FileText className="w-4 h-4 text-blue-500" />
      case 'event': return <Calendar className="w-4 h-4 text-amber-500" />
      default: return <Bell className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
          scrolled
            ? isLightTheme
              ? 'text-black hover:text-brand-red hover:bg-red-50'
              : 'text-white/60 hover:text-brand-red hover:bg-white/10'
            : 'text-white/60 hover:text-brand-red hover:bg-white/10'
        }`}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-3.5 h-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-red rounded-full flex items-center justify-center text-white text-[8px] font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-[340px] rounded-xl shadow-2xl border overflow-hidden ${
            isLightTheme ? 'bg-white/95 border-black/10' : 'bg-[#111]/95 border-white/10'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            zIndex: 9997,
          }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${isLightTheme ? 'border-gray-100' : 'border-white/10'}`}>
            <h4 className={`text-sm font-bold ${isLightTheme ? 'text-brand-black' : 'text-white'}`}>Notifications</h4>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-brand-red font-semibold hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className={`p-0.5 ${isLightTheme ? 'text-gray-400 hover:text-gray-600' : 'text-white/40 hover:text-white/70'}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex border-b px-2 ${isLightTheme ? 'border-gray-100' : 'border-white/10'}`}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === tab.key
                    ? 'text-brand-red border-b-2 border-brand-red'
                    : isLightTheme ? 'text-gray-400 hover:text-gray-600' : 'text-white/45 hover:text-white/75'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="max-h-[320px] overflow-y-auto">
            {filteredNotifs.length === 0 ? (
              <div className={`py-8 text-center text-sm ${isLightTheme ? 'text-gray-400' : 'text-white/45'}`}>
                No notifications
              </div>
            ) : (
              filteredNotifs.map(n => (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => { markAsRead(n.id); setIsOpen(false) }}
                  className={`block px-4 py-3 border-b transition-colors ${
                    isLightTheme
                      ? `border-gray-50 hover:bg-gray-50 ${!isRead(n) ? 'bg-red-50/30' : ''}`
                      : `border-white/5 hover:bg-white/5 ${!isRead(n) ? 'bg-brand-red/10' : ''}`
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${isLightTheme ? 'bg-gray-100' : 'bg-white/5'}`}>
                      {typeIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-semibold truncate ${
                          !isRead(n)
                            ? isLightTheme ? 'text-brand-black' : 'text-white'
                            : isLightTheme ? 'text-gray-500' : 'text-white/65'
                        }`}>
                          {n.title}
                        </p>
                        {!isRead(n) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-red shrink-0" />
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 line-clamp-2 leading-relaxed ${isLightTheme ? 'text-gray-400' : 'text-white/45'}`}>
                        {n.description}
                      </p>
                      <p className={`text-[10px] mt-1 ${isLightTheme ? 'text-gray-300' : 'text-white/30'}`}>
                        {new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className={`px-4 py-2.5 border-t text-center ${isLightTheme ? 'border-gray-100' : 'border-white/10'}`}>
            <Link
              href="/downloads"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-brand-red font-semibold hover:underline"
            >
              View All Documents & Downloads
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
