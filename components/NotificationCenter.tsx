'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bell, X, TrendingUp, FileText, Calendar, Check } from 'lucide-react'
import { NOTIFICATIONS, type Notification } from '@/lib/notifications'

type TabFilter = 'all' | 'fund' | 'blog' | 'event'

interface NotificationCenterProps {
  scrolled: boolean
}

export default function NotificationCenter({ scrolled }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const panelRef = useRef<HTMLDivElement>(null)

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
            ? 'text-brand-black/60 hover:text-brand-red hover:bg-red-50'
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
          className="absolute right-0 top-full mt-2 w-[340px] rounded-xl shadow-2xl border overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(0,0,0,0.08)',
            zIndex: 9997,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h4 className="text-sm font-bold text-brand-black">Notifications</h4>
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
                className="text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === tab.key
                    ? 'text-brand-red border-b-2 border-brand-red'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="max-h-[320px] overflow-y-auto">
            {filteredNotifs.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                No notifications
              </div>
            ) : (
              filteredNotifs.map(n => (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => { markAsRead(n.id); setIsOpen(false) }}
                  className={`block px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    !isRead(n) ? 'bg-red-50/30' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mt-0.5">
                      {typeIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-semibold truncate ${
                          !isRead(n) ? 'text-brand-black' : 'text-gray-500'
                        }`}>
                          {n.title}
                        </p>
                        {!isRead(n) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-red shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.description}
                      </p>
                      <p className="text-[10px] text-gray-300 mt-1">
                        {new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 text-center">
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
