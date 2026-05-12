'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Users, TrendingUp, UserCheck, FolderOpen, Sparkles,
  Shield, IndianRupee, BarChart3, MessageSquare, Settings, ChevronDown,
  ChevronRight, LogOut, HelpCircle, ExternalLink, X, Menu,
  Building2, Megaphone, BadgeCheck, FileCheck, Banknote, Newspaper,
  FileBarChart, Key,
} from 'lucide-react'
import Logo from '@/components/Logo'
import SocialLinks from '@/components/SocialLinks'
import { ADMIN_SIDEBAR_ITEMS, MODULE_LABELS, FEATURE_FLAGS } from '@/lib/admin/adminConstants'
import type { AdminModule } from '@/lib/admin/adminTypes'
import { hasModuleAccess } from '@/lib/admin/adminRBAC'
import type { AdminRole } from '@/lib/admin/adminTypes'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/admin/adminAuth'

// ── Icon Map ──────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, TrendingUp, UserCheck, FolderOpen, Sparkles,
  Shield, IndianRupee, BarChart3, MessageSquare, Settings,
  Building2, Megaphone, FileCheck, Banknote, Newspaper, FileBarChart, Key,
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
  // Accordion behavior (bug #30): only one module expanded at a time
  const [expandedModule, setExpandedModule] = useState<string | null>(activeModule)

  const toggleModule = (moduleId: string) => {
    setExpandedModule(prev => (prev === moduleId ? null : moduleId))
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
          background: 'linear-gradient(180deg, #2e1515 0%, #4a1a1a 100%)',
        }}
      >
        {/* Logo */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <Link href="/" target="_blank" className="flex items-center group">
            <Logo size={38} />
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
          <div className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/20">
            <p className="text-[10px] uppercase tracking-widest mb-0.5 text-white/60">Welcome Admin!</p>
            <p className="text-sm font-semibold text-white">{userName}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <p className="text-[10px] text-white/70">
                {ROLE_LABELS[userRole]}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 overflow-y-auto space-y-0.5 admin-scrollbar text-left">
          {ADMIN_SIDEBAR_ITEMS.map(item => {
            // AI_SUITE: Hidden per business decision. Re-enable via FEATURE_FLAGS.AI_SUITE_ENABLED
            if (item.module === 'ai-ops' && !FEATURE_FLAGS.AI_SUITE_ENABLED) return null
            // Check role access against the underlying AdminModule (e.g. sales for
            // the Investment / Leads / Referral rows that all map to one module).
            if (!hasModuleAccess(userRole, item.module)) return null

            const Icon = ICON_MAP[item.iconName] || LayoutDashboard
            const isActive = activeModule === item.module
            const isExpanded = expandedModule === item.id
            const hasSubItems = item.subItems && item.subItems.length > 0

            return (
              <div key={item.id}>
                {/* Main module button */}
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      // Bug #15: Parent should ONLY toggle dropdown, not navigate
                      toggleModule(item.id)
                    } else {
                      // 2026-05-12: prefer the explicit navigateTo target
                      // (e.g. Contact → comms/contact). Fall back to the
                      // module slug for legacy entries like Dashboard.
                      handleNavClick(item.navigateTo || item.module)
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative
                    ${isActive
                      ? 'text-white bg-white/20 border border-white/20'
                      : 'text-white/80 hover:text-white hover:bg-white/10 border border-transparent'
                    }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-white" />
                  )}
                  <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                  <span className="flex-1 text-left">{item.label}</span>

                  {/* Badge */}
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      typeof item.badge === 'number' ? 'bg-white/20 text-white' : 'bg-yellow-400/30 text-yellow-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}

                  {/* Expand arrow */}
                  {hasSubItems && (
                    <span className="text-white/50">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  )}
                </button>

                {/* Sub-items — flush-left (bug #36) aligned to the same left edge
                    as the parent module buttons (no indent / no border rail). */}
                {hasSubItems && isExpanded && (
                  <div className="mt-0.5 space-y-0.5 mb-1">
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
                          className={`w-full flex items-center justify-start text-left px-3 py-1.5 rounded-lg text-[13px] transition-all duration-200
                            ${isSubActive
                              ? 'text-white font-semibold bg-white/15'
                              : 'text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                        >
                          <span className="w-[18px] flex-shrink-0" />
                          {sub.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          <div className="my-4 border-t border-white/20" />
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 pt-2 space-y-1 border-t border-white/20">
          <Link
            href="/dashboard"
            target="_blank"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              text-white/70 hover:text-white hover:bg-white/10"
          >
            <ExternalLink className="w-[18px] h-[18px]" />
            Client Dashboard
          </Link>
          <Link
            href="/staff/login"
            target="_blank"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              text-white/70 hover:text-white hover:bg-white/10"
          >
            <BadgeCheck className="w-[18px] h-[18px]" />
            Staff Portal
          </Link>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              text-white/70 hover:text-white hover:bg-white/10"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
