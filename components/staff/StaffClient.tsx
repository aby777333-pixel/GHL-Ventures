'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import StaffSidebar from './StaffSidebar'
import StaffTopBar from './StaffTopBar'
import HomeModule from './modules/HomeModule'
import SelfServiceModule from './modules/SelfServiceModule'
import CSCenterModule from './modules/CSCenterModule'
import FieldOpsModule from './modules/FieldOpsModule'
import ClientViewModule from './modules/ClientViewModule'
import TasksModule from './modules/TasksModule'
import AIToolsModule from './modules/AIToolsModule'
import TeamModule from './modules/TeamModule'
import InternalModule from './modules/InternalModule'
import AdminGlass from '../admin/shared/AdminGlass'
import AdminToast from '../admin/shared/AdminToast'
import { useStaffAuth, useStaffToast, useAgentStatus } from '@/lib/staff/staffHooks'
import { getStaffSession } from '@/lib/staff/staffAuth'
import { hasStaffModuleAccess } from '@/lib/staff/staffRBAC'
import { STAFF_MODULE_LABELS } from '@/lib/staff/staffConstants'
import type { StaffModule, AgentStatus } from '@/lib/staff/staffTypes'
import {
  Home, User, Headphones, MapPin, Users, CheckSquare, Sparkles,
  UsersRound, MessageCircle, Lock, Construction,
} from 'lucide-react'

// ── Valid Modules ──────────────────────────────────────────────
const VALID_MODULES: StaffModule[] = ['home', 'me', 'cs', 'field', 'clients', 'tasks', 'ai', 'team', 'internal']

const MODULE_ICONS: Record<StaffModule, React.ComponentType<{ className?: string }>> = {
  home: Home, me: User, cs: Headphones, field: MapPin, clients: Users,
  tasks: CheckSquare, ai: Sparkles, team: UsersRound, internal: MessageCircle,
}

export default function StaffClient() {
  const router = useRouter()
  const pathname = usePathname()
  const { session, user, role, isAuthenticated, loading, logout } = useStaffAuth()
  const { toast, showToast, dismissToast } = useStaffToast()
  const { status: agentStatus, updateStatus: setAgentStatus } = useAgentStatus()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ── Routing ─────────────────────────────────────────────────
  const { activeModule, activeSubTab } = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    // segments: ['staff'] or ['staff', 'module'] or ['staff', 'module', 'subtab']
    const mod = segments[1] || 'home'
    const sub = segments[2] || null
    return {
      activeModule: (VALID_MODULES.includes(mod as StaffModule) ? mod : 'home') as StaffModule,
      activeSubTab: sub,
    }
  }, [pathname])

  const navigate = useCallback((path: string) => {
    const url = path === 'home' || path === '' ? '/staff' : `/staff/${path}`
    router.push(url, { scroll: false })
  }, [router])

  // ── Auth Guard ──────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/staff/login')
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading Staff Portal...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <AdminGlass className="text-center p-8 max-w-sm">
          <Lock className="w-8 h-8 text-teal-500 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Redirecting to login...</p>
        </AdminGlass>
      </div>
    )
  }

  // ── Permission Check ────────────────────────────────────────
  const hasAccess = hasStaffModuleAccess(role, activeModule)

  // ── Render Module ───────────────────────────────────────────
  const renderModule = () => {
    if (!hasAccess) {
      const Icon = MODULE_ICONS[activeModule] || Construction
      return (
        <AdminGlass className="flex flex-col items-center justify-center py-16">
          <Icon className="w-10 h-10 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-400 text-center max-w-md mb-4">
            Your role does not have permission to access {STAFF_MODULE_LABELS[activeModule]}.
          </p>
          <button
            onClick={() => navigate('home')}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-teal-500/20 border border-teal-500/30 hover:bg-teal-500/30 transition-colors"
          >
            Back to Home
          </button>
        </AdminGlass>
      )
    }

    switch (activeModule) {
      case 'home':
        return <HomeModule navigate={navigate} showToast={showToast} userName={user?.name || ''} role={role} />
      case 'me':
        return <SelfServiceModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'cs':
        return <CSCenterModule subTab={activeSubTab} navigate={navigate} showToast={showToast} role={role} />
      case 'field':
        return <FieldOpsModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'clients':
        return <ClientViewModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'tasks':
        return <TasksModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'ai':
        return <AIToolsModule subTab={activeSubTab} navigate={navigate} showToast={showToast} role={role} />
      case 'team':
        return <TeamModule subTab={activeSubTab} navigate={navigate} showToast={showToast} role={role} />
      case 'internal':
        return <InternalModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      default:
        return (
          <AdminGlass className="flex flex-col items-center justify-center py-16">
            <Construction className="w-10 h-10 text-teal-500 mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Module Coming Soon</h2>
            <button onClick={() => navigate('home')} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-teal-500/20 border border-teal-500/30 hover:bg-teal-500/30 transition-colors">
              Back to Home
            </button>
          </AdminGlass>
        )
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/staff/login')
  }

  return (
    <div className="min-h-screen relative bg-brand-black">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-teal-500/[0.02] rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/[0.02] rounded-full blur-[200px]" />
      </div>

      {/* Sidebar */}
      <StaffSidebar
        activeModule={activeModule}
        activeSubTab={activeSubTab}
        navigate={navigate}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userRole={role}
        userName={user?.name || 'Staff'}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="lg:ml-[260px] relative z-10 min-h-screen flex flex-col">
        <StaffTopBar
          activeModule={activeModule}
          activeSubTab={activeSubTab}
          onMenuToggle={() => setSidebarOpen(true)}
          navigate={navigate}
          agentStatus={agentStatus}
          onStatusChange={setAgentStatus}
          userName={user?.name || 'Staff'}
        />

        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderModule()}
        </div>

        <footer className="border-t border-white/[0.04] px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-600">
          <span>GHL India Ventures Staff Portal v1.0</span>
          <span>SEBI Registered: IN/AIF2/2425/1517 | Internal Use Only</span>
        </footer>
      </div>

      {toast && <AdminToast msg={toast.msg} type={toast.type} onDismiss={dismissToast} />}
    </div>
  )
}
