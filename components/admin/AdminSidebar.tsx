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

// ── Per-module accent glow palette (UI Aesthetic 2026-05-14) ─────
// Each top-level sidebar item gets its own subtle accent color so a
// hover/active state lights the row up with the matching hue. Keyed by
// SidebarItem.id (not module) so Investment / Referral / Leads — which
// all share module='sales' — still feel distinct. Colors are picked to
// read well against the dark-red gradient background of the sidebar.
const MODULE_ACCENTS: Record<string, string> = {
  overview: '#FBBF24',          // amber  — Dashboard
  users: '#7DD3FC',             // sky    — Users
  investment: '#A78BFA',        // violet — Investment
  kyc: '#34D399',               // emerald — KYC
  documents: '#F472B6',         // pink   — Documents
  'finance-payout': '#FCD34D',  // gold   — Finance payout
  referral: '#22D3EE',          // cyan   — Referral
  contact: '#60A5FA',           // blue   — Contact
  'support-ticket': '#FCA5A5',  // coral  — Support Ticket
  cms: '#5EEAD4',               // teal   — CMS
  employee: '#C4B5FD',          // lavender — Employee
  leads: '#FB923C',             // orange — Leads
  notification: '#E879F9',      // fuchsia — Notification
  setting: '#94A3B8',           // slate  — Setting
}
const DEFAULT_ACCENT = '#F5C2C2'

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

      {/* UI Aesthetic 2026-05-14: per-module glow styles. color-mix() is
          supported in all evergreen browsers (Chrome/Edge ≥111, Firefox
          ≥113, Safari ≥16.2) and degrades gracefully — older engines
          simply fall back to the underlying solid colors. */}
      <style>{`
        .ghl-nav-btn {
          transition: background-color 200ms ease, border-color 220ms ease, box-shadow 280ms ease, color 200ms ease;
        }
        .ghl-nav-btn:hover {
          background-color: color-mix(in srgb, var(--ac, #fff) 9%, transparent);
          border-color: color-mix(in srgb, var(--ac, #fff) 22%, transparent);
          box-shadow: 0 0 14px color-mix(in srgb, var(--ac, #fff) 26%, transparent);
        }
        .ghl-nav-btn[data-active="true"] {
          background-color: color-mix(in srgb, var(--ac, #fff) 14%, transparent);
          border-color: color-mix(in srgb, var(--ac, #fff) 48%, transparent);
          box-shadow:
            0 0 22px color-mix(in srgb, var(--ac, #fff) 42%, transparent),
            inset 0 0 12px color-mix(in srgb, var(--ac, #fff) 16%, transparent);
        }
        .ghl-nav-icon {
          transition: color 200ms ease, filter 250ms ease;
        }
        .ghl-nav-btn:hover .ghl-nav-icon {
          color: var(--ac, #fff);
          filter: drop-shadow(0 0 6px color-mix(in srgb, var(--ac, #fff) 55%, transparent));
        }
        .ghl-nav-btn[data-active="true"] .ghl-nav-icon {
          color: var(--ac, #fff);
          filter: drop-shadow(0 0 8px color-mix(in srgb, var(--ac, #fff) 70%, transparent));
        }
        .ghl-nav-bar {
          background: linear-gradient(180deg, var(--ac, #fff), color-mix(in srgb, var(--ac, #fff) 55%, transparent));
          box-shadow: 0 0 10px color-mix(in srgb, var(--ac, #fff) 80%, transparent);
        }
        .ghl-sub-btn {
          transition: background-color 200ms ease, color 200ms ease, box-shadow 220ms ease;
        }
        .ghl-sub-btn:hover {
          background-color: color-mix(in srgb, var(--ac, #fff) 8%, transparent);
        }
        .ghl-sub-btn[data-active="true"] {
          background-color: color-mix(in srgb, var(--ac, #fff) 13%, transparent);
          color: #fff;
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ac, #fff) 30%, transparent);
        }
        .ghl-foot-btn {
          transition: background-color 200ms ease, color 200ms ease, box-shadow 250ms ease;
        }
        .ghl-foot-btn:hover {
          background-color: color-mix(in srgb, var(--ac, #fff) 10%, transparent);
          box-shadow: 0 0 12px color-mix(in srgb, var(--ac, #fff) 22%, transparent);
          color: #fff;
        }
        .ghl-foot-btn:hover .ghl-nav-icon {
          color: var(--ac, #fff);
          filter: drop-shadow(0 0 5px color-mix(in srgb, var(--ac, #fff) 55%, transparent));
        }
      `}</style>

      {/* Sidebar — UI Aesthetic 2026-05-14: glossy-black carbon finish.
          Four stacked layers compose the look:
            1. top-left specular highlight (soft white sheen),
            2. + 3. crossing 45° / -45° micro-stripes for a carbon-weave feel,
            4. base near-black vertical gradient with a subtle mid-lift.
          A 1px right edge keeps the sidebar separated from the page bg,
          and an inset shadow adds depth without dimming the accent glows. */}
      <aside
        className={`fixed top-0 left-0 h-full z-[10000] w-[280px] flex flex-col transition-transform duration-500 ease-out
          lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: [
            'radial-gradient(140% 60% at 0% 0%, rgba(255,255,255,0.07), transparent 55%)',
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.018) 0 2px, transparent 2px 4px)',
            'repeating-linear-gradient(-45deg, rgba(0,0,0,0.32) 0 2px, transparent 2px 4px)',
            'linear-gradient(180deg, #0b0b0d 0%, #141418 48%, #0a0a0c 100%)',
          ].join(', '),
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.04), 6px 0 24px rgba(0,0,0,0.45)',
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
            const accent = MODULE_ACCENTS[item.id] || DEFAULT_ACCENT

            return (
              <div key={item.id} style={{ ['--ac' as any]: accent }}>
                {/* Main module button */}
                <button
                  data-active={isActive ? 'true' : 'false'}
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
                  className={`ghl-nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium group relative border border-transparent
                    ${isActive ? 'text-white' : 'text-white/80 hover:text-white'}`}
                >
                  {isActive && (
                    <div className="ghl-nav-bar absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" />
                  )}
                  <Icon className={`ghl-nav-icon w-[18px] h-[18px] flex-shrink-0 ${isActive ? '' : 'text-white/60'}`} />
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
                    as the parent module buttons (no indent / no border rail).
                    Sub-items inherit the parent's --ac so the tint feels cohesive. */}
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
                          data-active={isSubActive ? 'true' : 'false'}
                          onClick={() => handleNavClick(sub.id)}
                          className={`ghl-sub-btn w-full flex items-center justify-start text-left px-3 py-1.5 rounded-lg text-[13px]
                            ${isSubActive ? 'text-white font-semibold' : 'text-white/60 hover:text-white'}`}
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

        {/* Bottom section — each footer link carries its own --ac so the
            hover glow stays distinct from the nav above. */}
        <div className="px-3 pb-4 pt-2 space-y-1 border-t border-white/20">
          <Link
            href="/dashboard"
            target="_blank"
            style={{ ['--ac' as any]: '#7DD3FC' /* sky — Client Dashboard */ }}
            className="ghl-foot-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70"
          >
            <ExternalLink className="ghl-nav-icon w-[18px] h-[18px] text-white/60" />
            Client Dashboard
          </Link>
          <Link
            href="/staff/login"
            target="_blank"
            style={{ ['--ac' as any]: '#C4B5FD' /* lavender — Staff Portal */ }}
            className="ghl-foot-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70"
          >
            <BadgeCheck className="ghl-nav-icon w-[18px] h-[18px] text-white/60" />
            Staff Portal
          </Link>
          <button
            onClick={onLogout}
            style={{ ['--ac' as any]: '#FCA5A5' /* coral — destructive but soft */ }}
            className="ghl-foot-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70"
          >
            <LogOut className="ghl-nav-icon w-[18px] h-[18px] text-white/60" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
