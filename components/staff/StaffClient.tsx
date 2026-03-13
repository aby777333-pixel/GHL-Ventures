'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
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
import { useStaffAuth, useStaffToast, useAgentStatus, useStaffPresence } from '@/lib/staff/staffHooks'
import { getStaffSession } from '@/lib/supabase/staffAuthService'
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
  // Staff presence management — syncs online/offline status to Supabase
  useStaffPresence(
    session?.user?.id ?? null,
    session?.user?.name ?? session?.user?.email ?? undefined,
    role ?? undefined
  )
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

  // ── Browser Notification Permission ────────────────────────
  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }
    }
  }, [isAuthenticated])

  // ── Incoming Chat/Call/Video Realtime Alerts ───────────────
  const ringAudioRef = useRef<HTMLAudioElement | null>(null)
  const [incomingAlert, setIncomingAlert] = useState<{ type: string; name: string; id: string } | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !session?.user?.id) return

    // Subscribe to new RM requests (call/video/chat) for this staff member
    const { onRMRequest, onNewChatSession, unsubscribeAll } = require('@/lib/supabase/realtimeSubscriptions')
    const staffUserId = session.user.id

    const unsubRM = onRMRequest(staffUserId, (payload: any) => {
      const req = payload.new
      if (!req) return
      const reqType = req.request_type || 'chat'
      const clientName = req.client_name || 'Client'

      // Show incoming alert overlay
      setIncomingAlert({ type: reqType, name: clientName, id: req.id })

      // Play ringtone for calls/video
      if (reqType === 'call' || reqType === 'video' || reqType === 'callback') {
        try {
          const audio = new Audio('/sounds/ring.wav')
          audio.loop = true
          audio.volume = 0.6
          audio.play().catch(() => {})
          ringAudioRef.current = audio
        } catch {}
      } else {
        // Chat notification sound
        try {
          const audio = new Audio('/sounds/new-chat.wav')
          audio.volume = 0.5
          audio.play().catch(() => {})
        } catch {}
      }

      // Browser notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`Incoming ${reqType === 'video' ? 'Video Call' : reqType === 'call' || reqType === 'callback' ? 'Call' : 'Chat'} Request`, {
          body: `${clientName} is requesting a ${reqType}`,
          icon: '/images/brand/ghl-logo-full-red.png',
          requireInteraction: true,
        })
      }

      // Auto-dismiss after 60 seconds
      setTimeout(() => {
        setIncomingAlert(null)
        if (ringAudioRef.current) {
          ringAudioRef.current.pause()
          ringAudioRef.current = null
        }
      }, 60000)
    })

    const unsubChat = onNewChatSession((payload: any) => {
      const sess = payload.new
      if (!sess) return
      // Notification sound
      try {
        const audio = new Audio('/sounds/notification.wav')
        audio.volume = 0.4
        audio.play().catch(() => {})
      } catch {}
      // Browser notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('New Chat Session', {
          body: `${sess.visitor_name || 'Visitor'} started a new chat`,
          icon: '/images/brand/ghl-logo-full-red.png',
        })
      }
    })

    return () => {
      if (typeof unsubRM === 'function') unsubRM()
      if (typeof unsubChat === 'function') unsubChat()
      if (ringAudioRef.current) {
        ringAudioRef.current.pause()
        ringAudioRef.current = null
      }
    }
  }, [isAuthenticated, session?.user?.id])

  // Accept / dismiss incoming alert
  const handleAcceptAlert = useCallback(() => {
    if (ringAudioRef.current) { ringAudioRef.current.pause(); ringAudioRef.current = null }
    setIncomingAlert(null)
    navigate('cs')
    showToast('Navigated to CS Center', 'success')
  }, [navigate, showToast])

  const handleDismissAlert = useCallback(() => {
    if (ringAudioRef.current) { ringAudioRef.current.pause(); ringAudioRef.current = null }
    setIncomingAlert(null)
  }, [])

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
        return <SelfServiceModule subTab={activeSubTab} navigate={navigate} showToast={showToast} userId={session?.user?.id} userName={user?.name || ''} userEmail={user?.email || ''} userPhone={user?.phone || ''} userRole={role} userDepartment={user?.department || ''} userDesignation={user?.designation || ''} userStaffCode={user?.staffCode || ''} userJoinDate={user?.joinDate || ''} userStatus={user?.status || 'active'} />
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
            <h2 className="text-lg font-semibold text-white mb-2">Module Under Development</h2>
            <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">This module is being built and will be available in an upcoming release.</p>
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

      {/* Incoming Call/Chat Alert Overlay */}
      {incomingAlert && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-900 border border-teal-500/30 rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl shadow-teal-500/10 animate-in fade-in zoom-in-95">
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
              incomingAlert.type === 'video' ? 'bg-blue-500/20 animate-pulse' :
              incomingAlert.type === 'call' || incomingAlert.type === 'callback' ? 'bg-green-500/20 animate-pulse' :
              'bg-teal-500/20'
            }`}>
              <Headphones className={`w-10 h-10 ${
                incomingAlert.type === 'video' ? 'text-blue-400' :
                incomingAlert.type === 'call' || incomingAlert.type === 'callback' ? 'text-green-400' :
                'text-teal-400'
              }`} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Incoming {incomingAlert.type === 'video' ? 'Video Call' : incomingAlert.type === 'call' || incomingAlert.type === 'callback' ? 'Call' : 'Chat'} Request
            </h3>
            <p className="text-sm text-gray-400 mb-6">{incomingAlert.name} is waiting...</p>
            <div className="flex gap-3">
              <button
                onClick={handleDismissAlert}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptAlert}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
