'use client'

import { useState } from 'react'
import {
  Home, User, Headphones, MapPin, Users, CheckSquare, Sparkles,
  UsersRound, MessageCircle, ChevronDown, LogOut, X, ArrowLeft,
  Shield,
} from 'lucide-react'
import type { StaffModule, StaffRole } from '@/lib/staff/staffTypes'
import { STAFF_SIDEBAR_ITEMS } from '@/lib/staff/staffConstants'
import { isFieldRole, isCSRole } from '@/lib/staff/staffRBAC'
import { STAFF_ROLE_LABELS } from '@/lib/staff/staffAuth'
import Logo from '@/components/Logo'
import SocialLinks from '@/components/SocialLinks'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, User, Headphones, MapPin, Users, CheckSquare, Sparkles,
  UsersRound, MessageCircle,
}

interface StaffSidebarProps {
  activeModule: StaffModule
  activeSubTab: string | null
  navigate: (path: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  userRole: StaffRole
  userName: string
  onLogout: () => void
}

export default function StaffSidebar({
  activeModule, activeSubTab, navigate, sidebarOpen, setSidebarOpen,
  userRole, userName, onLogout,
}: StaffSidebarProps) {
  const [expanded, setExpanded] = useState<string | null>(activeModule)

  const filteredItems = STAFF_SIDEBAR_ITEMS.filter(item => {
    if (item.fieldOnly && !isFieldRole(userRole)) return false
    if (item.csOnly && !isCSRole(userRole)) return false
    return true
  })

  const toggleExpand = (id: string) => {
    setExpanded(prev => prev === id ? null : id)
  }

  const handleNav = (href: string) => {
    const path = href.replace('/staff/', '').replace('/staff', 'home') || 'home'
    navigate(path)
    setSidebarOpen(false)
  }

  return (
    <>
      {/* Backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[200] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[260px] z-[201] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(10,12,16,0.98) 0%, rgba(8,10,14,0.99) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-white/[0.04]">
          <div className="flex items-center">
            <Logo size={22} />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 admin-scroll">
          {filteredItems.map(item => {
            const Icon = ICON_MAP[item.iconName] || Home
            const isActive = activeModule === item.id
            const isExpanded = expanded === item.id
            const hasChildren = item.subItems && item.subItems.length > 0

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      toggleExpand(item.id)
                      if (!isActive) handleNav(item.href)
                    } else {
                      handleNav(item.href)
                    }
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/15'
                      : 'text-gray-500 hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-gray-600'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      typeof item.badge === 'string'
                        ? item.badge === 'LIVE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-teal-500/15 text-teal-400'
                        : 'bg-brand-red/15 text-brand-red'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {hasChildren && (
                    <ChevronDown className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {/* Sub-items */}
                {hasChildren && isExpanded && (
                  <div className="ml-4 pl-3 border-l border-white/[0.04] mt-0.5 space-y-0.5">
                    {item.subItems!.map(sub => {
                      const subPath = sub.href.replace('/staff/', '')
                      const isSubActive = isActive && (
                        activeSubTab === sub.id ||
                        activeSubTab === subPath.split('/').pop() ||
                        (!activeSubTab && sub.href === item.href)
                      )
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleNav(sub.href)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 ${
                            isSubActive
                              ? 'text-teal-400 bg-teal-500/[0.08]'
                              : 'text-gray-600 hover:text-gray-300 hover:bg-white/[0.03]'
                          }`}
                        >
                          {sub.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.04] p-3 space-y-2">
          <button
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] text-gray-600 hover:text-gray-400 hover:bg-white/[0.03] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Website
          </button>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500/30 to-blue-500/30 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-bold text-white">{userName.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white font-medium truncate">{userName}</p>
              <p className="text-[9px] text-gray-600 truncate">{STAFF_ROLE_LABELS[userRole]}</p>
            </div>
            <button onClick={onLogout} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Social links */}
          <div className="pt-2 border-t border-white/[0.04]">
            <SocialLinks size="sm" variant="glass" />
          </div>
        </div>
      </aside>
    </>
  )
}
