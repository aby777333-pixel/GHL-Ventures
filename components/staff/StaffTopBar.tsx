'use client'

import { Search, Bell, Menu, ChevronRight } from 'lucide-react'
import type { StaffModule, AgentStatus } from '@/lib/staff/staffTypes'
import { STAFF_MODULE_LABELS } from '@/lib/staff/staffConstants'

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

export default function StaffTopBar({
  activeModule, activeSubTab, onMenuToggle, navigate, agentStatus, onStatusChange, userName,
}: StaffTopBarProps) {
  const statusCfg = STATUS_CONFIG[agentStatus]

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
          <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-red rounded-full" />
          </button>

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
