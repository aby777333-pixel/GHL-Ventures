'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import AdminTopBar from './AdminTopBar'
import AdminToast from './shared/AdminToast'
import AdminGlass from './shared/AdminGlass'
import OverviewModule from './modules/OverviewModule'
import ClientModule from './modules/ClientModule'
import SalesModule from './modules/SalesModule'
import FinancialModule from './modules/FinancialModule'
import EmployeeModule from './modules/EmployeeModule'
import ComplianceModule from './modules/ComplianceModule'
import AssetDocModule from './modules/AssetDocModule'
import AIOperationsModule from './modules/AIOperationsModule'
import AnalyticsModule from './modules/AnalyticsModule'
import CommsModule from './modules/CommsModule'
import SettingsModule from './modules/SettingsModule'
import RealtyBrokersModule from './modules/RealtyBrokersModule'
import MarketingModule from './modules/MarketingModule'
import ReportsModule from './modules/ReportsModule'
import { useAdminAuth, useAdminToast } from '@/lib/admin/adminHooks'
import { getAdminSession } from '@/lib/admin/adminAuth'
import type { AdminModule } from '@/lib/admin/adminTypes'
import { MODULE_LABELS } from '@/lib/admin/adminConstants'
import { hasModuleAccess } from '@/lib/admin/adminRBAC'
import {
  LayoutDashboard, Users, TrendingUp, UserCheck, FolderOpen, Sparkles,
  Shield, IndianRupee, BarChart3, MessageSquare, Settings, Construction,
  Lock, Building2, Megaphone, FileBarChart,
} from 'lucide-react'

// ── Valid Modules ──────────────────────────────────────────────────
const VALID_MODULES: AdminModule[] = [
  'overview', 'clients', 'sales', 'realty-brokers', 'employees', 'assets',
  'ai-ops', 'compliance', 'financial', 'analytics', 'comms', 'marketing', 'reports', 'settings',
]

const MODULE_ICONS: Record<AdminModule, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  clients: Users,
  sales: TrendingUp,
  'realty-brokers': Building2,
  employees: UserCheck,
  assets: FolderOpen,
  'ai-ops': Sparkles,
  compliance: Shield,
  financial: IndianRupee,
  analytics: BarChart3,
  comms: MessageSquare,
  marketing: Megaphone,
  reports: FileBarChart,
  settings: Settings,
}

// ── Placeholder Module ────────────────────────────────────────────
function ModulePlaceholder({ moduleId, subTab, navigate, showToast }: {
  moduleId: AdminModule
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  const Icon = MODULE_ICONS[moduleId] || Construction
  const label = MODULE_LABELS[moduleId] || moduleId

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{label}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {subTab ? `${subTab.charAt(0).toUpperCase() + subTab.slice(1).replace(/-/g, ' ')} — ` : ''}
          Module coming in Phase 5
        </p>
      </div>

      <AdminGlass className="flex flex-col items-center justify-center py-16">
        <div className="p-4 rounded-2xl bg-white/[0.04] mb-4">
          <Icon className="w-10 h-10 text-brand-red" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">{label}</h2>
        <p className="text-sm text-gray-400 text-center max-w-md mb-6">
          This module is under active development. The full {label.toLowerCase()} system
          with interactive data tables, forms, and analytics will be available soon.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('overview')}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors"
          >
            Back to Overview
          </button>
          <button
            onClick={() => showToast(`${label} module will be available in the next update`, 'info')}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
          >
            Notify Me
          </button>
        </div>
      </AdminGlass>
    </div>
  )
}

// ── Main AdminClient Component ────────────────────────────────────
export default function AdminClient() {
  const router = useRouter()
  const pathname = usePathname()
  const { session, user, role, isAuthenticated, loading, logout } = useAdminAuth()
  const { toast, showToast, dismissToast } = useAdminToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ── Routing Logic ───────────────────────────────────────────────
  const { activeModule, activeSubTab } = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    // segments: ['admin'] or ['admin', 'module'] or ['admin', 'module', 'subtab']
    const mod = segments[1] || 'overview'
    const sub = segments[2] || null
    return {
      activeModule: (VALID_MODULES.includes(mod as AdminModule) ? mod : 'overview') as AdminModule,
      activeSubTab: sub,
    }
  }, [pathname])

  const navigate = useCallback((path: string) => {
    const url = path === 'overview' || path === '' ? '/admin' : `/admin/${path}`
    router.push(url, { scroll: false })
  }, [router])

  // ── Auth Guard ──────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [loading, isAuthenticated, router])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading Admin Panel...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <AdminGlass className="text-center p-8 max-w-sm">
          <Lock className="w-8 h-8 text-brand-red mx-auto mb-3" />
          <p className="text-sm text-gray-400">Redirecting to login...</p>
        </AdminGlass>
      </div>
    )
  }

  // ── Permission Check ────────────────────────────────────────────
  const hasAccess = hasModuleAccess(role, activeModule)

  // ── Render Module Content ───────────────────────────────────────
  const renderModule = () => {
    // Permission denied
    if (!hasAccess) {
      return (
        <AdminGlass className="flex flex-col items-center justify-center py-16">
          <Shield className="w-10 h-10 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-400 text-center max-w-md mb-4">
            Your role ({role}) does not have permission to access the {MODULE_LABELS[activeModule]} module.
            Contact your administrator for access.
          </p>
          <button
            onClick={() => navigate('overview')}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors"
          >
            Back to Overview
          </button>
        </AdminGlass>
      )
    }

    // Render active module
    switch (activeModule) {
      case 'overview':
        return <OverviewModule navigate={navigate} showToast={showToast} />
      case 'clients':
        return <ClientModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'sales':
        return <SalesModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'realty-brokers':
        return <RealtyBrokersModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'financial':
        return <FinancialModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'employees':
        return <EmployeeModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'compliance':
        return <ComplianceModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'assets':
        return <AssetDocModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'ai-ops':
        return <AIOperationsModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'analytics':
        return <AnalyticsModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'comms':
        return <CommsModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'marketing':
        return <MarketingModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'reports':
        return <ReportsModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      case 'settings':
        return <SettingsModule subTab={activeSubTab} navigate={navigate} showToast={showToast} />
      default:
        return (
          <ModulePlaceholder
            moduleId={activeModule}
            subTab={activeSubTab}
            navigate={navigate}
            showToast={showToast}
          />
        )
    }
  }

  // ── Handle Logout ───────────────────────────────────────────────
  const handleLogout = () => {
    logout()
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen relative bg-brand-black">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-brand-red/[0.03] rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/[0.02] rounded-full blur-[200px]" />
      </div>

      {/* Sidebar */}
      <AdminSidebar
        activeModule={activeModule}
        activeSubTab={activeSubTab}
        navigate={navigate}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userRole={role}
        userName={user?.name || 'Admin'}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="lg:ml-[280px] relative z-10 min-h-screen flex flex-col">
        {/* Top Bar */}
        <AdminTopBar
          activeModule={activeModule}
          activeSubTab={activeSubTab}
          onMenuToggle={() => setSidebarOpen(true)}
          navigate={navigate}
        />

        {/* Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderModule()}
        </div>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-600">
          <span>GHL India Ventures Admin Command Center v2.0</span>
          <span>SEBI Registered: IN/AIF2/2425/1517 | Powered by AI</span>
        </footer>
      </div>

      {/* Toast */}
      {toast && (
        <AdminToast msg={toast.msg} type={toast.type} onDismiss={dismissToast} />
      )}
    </div>
  )
}
