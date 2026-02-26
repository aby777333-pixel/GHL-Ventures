'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Users, TrendingUp, UserCheck, FolderOpen, Sparkles,
  Shield, IndianRupee, BarChart3, MessageSquare, Settings, ChevronDown,
  ChevronRight, LogOut, HelpCircle, ExternalLink, X, Menu,
  Building2, Megaphone, BadgeCheck,
} from 'lucide-react'
import Logo from '@/components/Logo'
import { ADMIN_SIDEBAR_ITEMS, MODULE_LABELS } from '@/lib/admin/adminConstants'
import type { AdminModule } from '@/lib/admin/adminTypes'
import { hasModuleAccess } from '@/lib/admin/adminRBAC'
import type { AdminRole } from '@/lib/admin/adminTypes'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/admin/adminAuth'

// ── Icon Map ──────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, TrendingUp, UserCheck, FolderOpen, Sparkles,
  Shield, IndianRupee, BarChart3, MessageSquare, Settings,
  Building2, Megaphone,
}

interface AdminSidebarProps {
  activeModule: AdminModule
  activeSubTab: string | null
  navigate: (path: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  userRole: AdminRole
  userName: string
  onLogout: () => void
}

export default function AdminSidebar({
  activeModule,
  activeSubTab,
  navigate,
  sidebarOpen,
  setSidebarOpen,
  userRole,
  userName,
  onLogout,
}: AdminSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set([activeModule]))

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  const handleNavClick = (path: string) => {
    navigate(path)
    setSidebarOpen(false)
  }

  const roleColor = ROLE_COLORS[userRole] || '#6B7280'

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[9999] lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-[10000] w-[280px] flex flex-col transition-transform duration-500 ease-out
          lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'linear-gradient(180deg, rgba(10,10,15,0.98) 0%, rgba(15,5,8,0.98) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(40px)',
        }}
      >
        {/* Logo */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <Link href="/" target="_blank" className="flex items-center group">
            <Logo size={36} />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin badge */}
        <div className="px-5 mb-3">
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest mb-0.5 text-gray-500">Command Center</p>
            <p className="text-sm font-semibold text-white">{userName}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: roleColor }}
              />
              <p className="text-[10px]" style={{ color: roleColor }}>
                {ROLE_LABELS[userRole]}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-0.5 admin-scrollbar">
          {ADMIN_SIDEBAR_ITEMS.map(item => {
            // Check role access
            if (!hasModuleAccess(userRole, item.id)) return null

            const Icon = ICON_MAP[item.iconName] || LayoutDashboard
            const isActive = activeModule === item.id
            const isExpanded = expandedModules.has(item.id)
            const hasSubItems = item.subItems && item.subItems.length > 0

            return (
              <div key={item.id}>
                {/* Main module button */}
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      toggleModule(item.id)
                      if (!isActive) handleNavClick(item.subItems![0].id)
                    } else {
                      handleNavClick(item.id)
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative
                    ${isActive
                      ? 'text-white bg-brand-red/15 border border-brand-red/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                    }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-brand-red" />
                  )}
                  <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-brand-red' : 'text-gray-500 group-hover:text-gray-300'}`} />
                  <span className="flex-1 text-left">{item.label}</span>

                  {/* Badge */}
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      typeof item.badge === 'number' ? 'bg-brand-red/20 text-brand-red' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}

                  {/* Expand arrow */}
                  {hasSubItems && (
                    <span className="text-gray-600">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  )}
                </button>

                {/* Sub-items */}
                {hasSubItems && isExpanded && (
                  <div className="ml-8 mt-0.5 space-y-0.5 mb-1">
                    {item.subItems!.map(sub => {
                      const subModule = sub.id.split('/')[0]
                      const subTab = sub.id.includes('/') ? sub.id.split('/')[1] : null
                      const isSubActive = activeModule === subModule && (
                        (!subTab && !activeSubTab) || (subTab === activeSubTab)
                      )
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleNavClick(sub.id)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] transition-all duration-200
                            ${isSubActive
                              ? 'text-brand-red font-semibold bg-brand-red/10'
                              : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
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

          <div className="my-4 border-t border-white/[0.06]" />
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 pt-2 space-y-1">
          <Link
            href="/dashboard"
            target="_blank"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              text-gray-500 hover:text-blue-400 hover:bg-blue-500/[0.06]"
          >
            <ExternalLink className="w-[18px] h-[18px]" />
            Client Dashboard
          </Link>
          <Link
            href="/staff/login"
            target="_blank"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              text-gray-500 hover:text-teal-400 hover:bg-teal-500/[0.06]"
          >
            <BadgeCheck className="w-[18px] h-[18px]" />
            Staff Portal
          </Link>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              text-gray-500 hover:text-red-400 hover:bg-red-500/[0.06]"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
