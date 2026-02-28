'use client'

import { useState, useMemo, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Handshake, IndianRupee, FileText, Users,
  User, Settings, LogOut, TrendingUp, Download, Upload,
  Eye, Calendar, Clock, Bell, Star, Menu, X, Search,
  Target, Award, Building2, MapPin, Phone, Mail, CheckCircle2,
  AlertCircle, ArrowUpRight, Filter, BarChart3, Inbox,
} from 'lucide-react'
import { pickAndUploadFiles, saveBlobAs, formatFileSize } from '@/lib/supabase/storageService'

// ── Types ──────────────────────────────────────────────────────
type AgentTab = 'overview' | 'deals' | 'commissions' | 'documents' | 'leads' | 'profile' | 'settings'

const TABS: { id: AgentTab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'deals', label: 'Deals', icon: Handshake },
  { id: 'commissions', label: 'Commissions', icon: IndianRupee },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
]

// ── Toast System ───────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null)
  const showToast = useCallback((message: string, type: string = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])
  return { toast, showToast }
}

// ── Empty State Component ──────────────────────────────────────
function EmptyState({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-amber-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{subtitle}</p>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
export default function AgentClient() {
  const pathname = usePathname()
  const { toast, showToast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const activeTab = useMemo<AgentTab>(() => {
    const segments = pathname.split('/').filter(Boolean)
    const tab = segments[1] || 'overview'
    return (TABS.some(t => t.id === tab) ? tab : 'overview') as AgentTab
  }, [pathname])

  const navigate = useCallback((tab: string) => {
    window.history.pushState(null, '', `/agent/${tab}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
    setSidebarOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/20">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
              GHL
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Agent Portal</h2>
              <p className="text-xs text-gray-500">GHL India Ventures</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <User className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Agent</p>
              <p className="text-xs text-gray-500">Logged In</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <button
            onClick={() => { window.location.href = '/' }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">
                {TABS.find(t => t.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab showToast={showToast} />}
          {activeTab === 'deals' && <DealsTab showToast={showToast} />}
          {activeTab === 'commissions' && <CommissionsTab showToast={showToast} />}
          {activeTab === 'documents' && <DocumentsTab showToast={showToast} />}
          {activeTab === 'leads' && <LeadsTab showToast={showToast} />}
          {activeTab === 'profile' && <ProfileTab showToast={showToast} />}
          {activeTab === 'settings' && <SettingsTab showToast={showToast} />}
        </div>
      </main>
    </div>
  )
}

// ── Overview Tab ────────────────────────────────────────────────
function OverviewTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Deals', value: '0', sub: '0 active', icon: Handshake, color: 'amber' },
          { label: 'Total Commission', value: '₹0', sub: 'Lifetime', icon: IndianRupee, color: 'green' },
          { label: 'Pending Payout', value: '₹0', sub: 'Awaiting', icon: Clock, color: 'orange' },
          { label: 'Closing Rate', value: '—', sub: 'Conversion', icon: Target, color: 'blue' },
        ].map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-lg bg-${kpi.color}-50 flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 text-${kpi.color}-600`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-1">{kpi.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Active Deals */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Active Deals Pipeline</h3>
        <EmptyState icon={Handshake} title="No active deals" subtitle="Your deals will appear here once they are created by the admin." />
      </div>

      {/* Recent Leads */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Recent Leads</h3>
        <EmptyState icon={Users} title="No leads yet" subtitle="New leads assigned to you will appear here." />
      </div>
    </div>
  )
}

// ── Deals Tab ──────────────────────────────────────────────────
function DealsTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">0 deals total</p>
      </div>
      <EmptyState icon={Handshake} title="No deals found" subtitle="Your deal history will appear here once transactions are recorded." />
    </div>
  )
}

// ── Commissions Tab ────────────────────────────────────────────
function CommissionsTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/60 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Paid</p>
          <p className="text-xl font-bold text-green-700">₹0</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/60 p-5">
          <p className="text-xs text-gray-500 mb-1">Pending / Processing</p>
          <p className="text-xl font-bold text-amber-700">₹0</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/60 p-5 flex items-center justify-center">
          <p className="text-xs text-gray-400">No commissions yet</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Commission History</h3>
        </div>
        <EmptyState icon={IndianRupee} title="No commission records" subtitle="Your commission payments will be listed here." />
      </div>
    </div>
  )
}

// ── Documents Tab ──────────────────────────────────────────────
function DocumentsTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">0 documents</p>
        <button
          onClick={async () => {
            const results = await pickAndUploadFiles('agent/documents', {
              accept: '.pdf,.jpg,.jpeg,.png,.docx',
              portal: 'agent',
              entityType: 'agent',
              entityId: 'self',
              category: 'agent-upload',
            })
            const count = results.filter(r => r.success).length
            if (count > 0) showToast(`Uploaded ${count} document(s)`, 'success')
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      <EmptyState icon={FileText} title="No documents uploaded" subtitle="Upload your documents here. They will be reviewed by the admin team." />
    </div>
  )
}

// ── Leads Tab ──────────────────────────────────────────────────
function LeadsTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">0 leads</p>
      </div>
      <EmptyState icon={Users} title="No leads assigned" subtitle="Leads will appear here once they are assigned to you." />
    </div>
  )
}

// ── Profile Tab ────────────────────────────────────────────────
function ProfileTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-xl font-bold">
            A
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Agent Profile</h3>
            <p className="text-sm text-gray-500">Your details will be populated by admin</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Email', value: 'Not set' },
            { label: 'Phone', value: 'Not set' },
            { label: 'License', value: 'Not set' },
            { label: 'Region', value: 'Not set' },
            { label: 'Agent ID', value: 'Not set' },
            { label: 'Closing Rate', value: '—' },
          ].map((field, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-0.5">{field.label}</p>
              <p className="text-sm font-medium text-gray-900">{field.value}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={async () => {
          const results = await pickAndUploadFiles('agent/documents', {
            accept: '.pdf,.jpg,.jpeg,.png',
            portal: 'agent',
            entityType: 'agent',
            entityId: 'self',
            category: 'identity',
          })
          const count = results.filter(r => r.success).length
          if (count > 0) showToast(`Uploaded ${count} document(s)`, 'success')
        }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200/60 hover:bg-amber-100 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Upload ID / License Documents
      </button>
    </div>
  )
}

// ── Settings Tab ───────────────────────────────────────────────
function SettingsTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          {['New Leads', 'Deal Updates', 'Commission Payments', 'Document Uploads', 'Meeting Reminders'].map(pref => (
            <div key={pref} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <p className="text-sm text-gray-700">{pref}</p>
              <button onClick={() => showToast(`${pref} notification updated`, 'success')}
                className="w-10 h-6 bg-amber-500 rounded-full relative">
                <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
