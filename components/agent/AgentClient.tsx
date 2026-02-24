'use client'

import { useState, useMemo, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Handshake, IndianRupee, FileText, Users,
  User, Settings, LogOut, TrendingUp, Download, Upload,
  Eye, Calendar, Clock, Bell, Star, Menu, X, Search,
  Target, Award, Building2, MapPin, Phone, Mail, CheckCircle2,
  AlertCircle, ArrowUpRight, Filter, BarChart3,
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

// ── Mock Agent Data ────────────────────────────────────────────
const MOCK_AGENT = {
  id: 'AGT-001',
  name: 'Priya Patel',
  email: 'priya.patel@ghlrealty.com',
  phone: '+91 98765 12345',
  license: 'RERA-MH-2024-001234',
  region: 'Mumbai Metropolitan Region',
  tier: 'Gold',
  totalDeals: 24,
  activeDeals: 5,
  totalCommission: 4850000,
  pendingCommission: 1200000,
  closingRate: 68,
}

const MOCK_DEALS = [
  { id: 'DL-001', property: 'Peninsula Heights - 3BHK', client: 'Arun Mehta', value: 18500000, commission: 555000, status: 'Closed', date: '2026-02-10' },
  { id: 'DL-002', property: 'Skyline Towers - 2BHK', client: 'Neha Reddy', value: 12000000, commission: 360000, status: 'In Progress', date: '2026-02-05' },
  { id: 'DL-003', property: 'Green Valley Villas - Plot', client: 'Suresh Iyer', value: 8500000, commission: 255000, status: 'In Progress', date: '2026-01-28' },
  { id: 'DL-004', property: 'Marina Bay Phase 2 - 4BHK', client: 'Deepak Joshi', value: 32000000, commission: 960000, status: 'Negotiation', date: '2026-01-20' },
  { id: 'DL-005', property: 'Sunset Commercial - Office', client: 'TechVentures Pvt Ltd', value: 45000000, commission: 1350000, status: 'Proposal', date: '2026-01-15' },
]

const MOCK_COMMISSIONS = [
  { id: 'CM-001', deal: 'Peninsula Heights - 3BHK', amount: 555000, status: 'Paid', paidDate: '2026-02-20' },
  { id: 'CM-002', deal: 'Lakeview Apartments - 2BHK', amount: 240000, status: 'Paid', paidDate: '2026-01-15' },
  { id: 'CM-003', deal: 'Skyline Towers - 2BHK', amount: 360000, status: 'Pending', paidDate: null },
  { id: 'CM-004', deal: 'Green Valley Villas - Plot', amount: 255000, status: 'Processing', paidDate: null },
  { id: 'CM-005', deal: 'Heritage Mansion - Penthouse', amount: 680000, status: 'Paid', paidDate: '2025-12-20' },
]

const MOCK_AGENT_DOCS = [
  { id: 'AD-001', name: 'RERA Registration Certificate.pdf', type: 'License', date: '2024-05-15', size: 1200000 },
  { id: 'AD-002', name: 'Commission Agreement 2025-26.pdf', type: 'Agreement', date: '2025-04-01', size: 890000 },
  { id: 'AD-003', name: 'ID Proof - Aadhaar.pdf', type: 'Identity', date: '2024-05-10', size: 540000 },
  { id: 'AD-004', name: 'PAN Card Copy.pdf', type: 'Tax', date: '2024-05-10', size: 320000 },
  { id: 'AD-005', name: 'Bank Details Verification.pdf', type: 'Financial', date: '2024-06-01', size: 450000 },
  { id: 'AD-006', name: 'Deal Memo - Marina Bay Phase 2.pdf', type: 'Deal', date: '2026-01-20', size: 670000 },
]

const MOCK_LEADS = [
  { id: 'LD-001', name: 'Vikram Singh', phone: '+91 98765 00001', interest: 'Commercial Office', budget: '₹3-5 Cr', status: 'Hot', source: 'Referral' },
  { id: 'LD-002', name: 'Anita Desai', phone: '+91 98765 00002', interest: '3BHK Apartment', budget: '₹1.5-2 Cr', status: 'Warm', source: 'Website' },
  { id: 'LD-003', name: 'Rajiv Khanna', phone: '+91 98765 00003', interest: 'Plot / Villa', budget: '₹80L-1.2 Cr', status: 'Warm', source: 'Event' },
  { id: 'LD-004', name: 'Meera Shah', phone: '+91 98765 00004', interest: '2BHK Near Metro', budget: '₹60-80L', status: 'Cold', source: 'Cold Call' },
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

function formatINR(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`
  return `₹${val.toLocaleString('en-IN')}`
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
              <p className="text-xs text-gray-500">GHL Realty Partners</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <User className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{MOCK_AGENT.name}</p>
              <p className="text-xs text-gray-500">{MOCK_AGENT.tier} Agent</p>
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
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
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
          { label: 'Total Deals', value: MOCK_AGENT.totalDeals.toString(), sub: `${MOCK_AGENT.activeDeals} active`, icon: Handshake, color: 'amber' },
          { label: 'Total Commission', value: formatINR(MOCK_AGENT.totalCommission), sub: 'Lifetime', icon: IndianRupee, color: 'green' },
          { label: 'Pending Payout', value: formatINR(MOCK_AGENT.pendingCommission), sub: 'Awaiting', icon: Clock, color: 'orange' },
          { label: 'Closing Rate', value: `${MOCK_AGENT.closingRate}%`, sub: 'Conversion', icon: Target, color: 'blue' },
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
        <div className="space-y-3">
          {MOCK_DEALS.filter(d => d.status !== 'Closed').map(deal => (
            <div key={deal.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-900">{deal.property}</p>
                <p className="text-xs text-gray-500">{deal.client} • {deal.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{formatINR(deal.value)}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  deal.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                  deal.status === 'Negotiation' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{deal.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Recent Leads</h3>
        <div className="space-y-3">
          {MOCK_LEADS.slice(0, 3).map(lead => (
            <div key={lead.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                <p className="text-xs text-gray-500">{lead.interest} • {lead.budget}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                lead.status === 'Hot' ? 'bg-red-100 text-red-700' :
                lead.status === 'Warm' ? 'bg-amber-100 text-amber-700' :
                'bg-blue-100 text-blue-700'
              }`}>{lead.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Deals Tab ──────────────────────────────────────────────────
function DealsTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{MOCK_DEALS.length} deals total</p>
        <button
          onClick={async () => {
            const rows = ['ID,Property,Client,Value,Commission,Status,Date']
            MOCK_DEALS.forEach(d => rows.push(`${d.id},${d.property},${d.client},${d.value},${d.commission},${d.status},${d.date}`))
            const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
            await saveBlobAs(blob, 'GHL_Agent_Deals_Export.csv', showToast)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200/60 hover:bg-amber-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {MOCK_DEALS.map(deal => (
        <div key={deal.id} className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">{deal.property}</h3>
              <p className="text-xs text-gray-500">Client: {deal.client} • {deal.date}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              deal.status === 'Closed' ? 'bg-green-100 text-green-700' :
              deal.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
              deal.status === 'Negotiation' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-700'
            }`}>{deal.status}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Deal Value</p>
              <p className="text-sm font-bold text-gray-900">{formatINR(deal.value)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Commission</p>
              <p className="text-sm font-bold text-green-700">{formatINR(deal.commission)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Commission %</p>
              <p className="text-sm font-bold text-gray-900">{((deal.commission / deal.value) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Commissions Tab ────────────────────────────────────────────
function CommissionsTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  const totalPaid = MOCK_COMMISSIONS.filter(c => c.status === 'Paid').reduce((s, c) => s + c.amount, 0)
  const totalPending = MOCK_COMMISSIONS.filter(c => c.status !== 'Paid').reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/60 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Paid</p>
          <p className="text-xl font-bold text-green-700">{formatINR(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/60 p-5">
          <p className="text-xs text-gray-500 mb-1">Pending / Processing</p>
          <p className="text-xl font-bold text-amber-700">{formatINR(totalPending)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/60 p-5 flex items-center justify-center">
          <button
            onClick={async () => {
              const rows = ['ID,Deal,Amount,Status,Paid Date']
              MOCK_COMMISSIONS.forEach(c => rows.push(`${c.id},${c.deal},${c.amount},${c.status},${c.paidDate || 'N/A'}`))
              const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
              await saveBlobAs(blob, 'GHL_Commission_Statement.csv', showToast)
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200/60 hover:bg-amber-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Statement
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Commission History</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {MOCK_COMMISSIONS.map(comm => (
            <div key={comm.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-900">{comm.deal}</p>
                <p className="text-xs text-gray-500">{comm.id} • {comm.paidDate || 'Pending'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{formatINR(comm.amount)}</p>
                <span className={`text-xs font-medium ${
                  comm.status === 'Paid' ? 'text-green-600' : comm.status === 'Processing' ? 'text-blue-600' : 'text-amber-600'
                }`}>{comm.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Documents Tab ──────────────────────────────────────────────
function DocumentsTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{MOCK_AGENT_DOCS.length} documents</p>
        <button
          onClick={async () => {
            const results = await pickAndUploadFiles('agent/documents', {
              accept: '.pdf,.jpg,.jpeg,.png,.docx',
              portal: 'agent',
              entityType: 'agent',
              entityId: MOCK_AGENT.id,
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

      <div className="space-y-2">
        {MOCK_AGENT_DOCS.map(doc => (
          <div key={doc.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200/60 hover:border-gray-300 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
              <p className="text-xs text-gray-500">{doc.type} • {doc.date} • {formatFileSize(doc.size)}</p>
            </div>
            <button
              onClick={async () => {
                const blob = new Blob([`Document: ${doc.name}\nType: ${doc.type}\nDate: ${doc.date}`], { type: 'application/pdf' })
                await saveBlobAs(blob, doc.name, showToast)
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Leads Tab ──────────────────────────────────────────────────
function LeadsTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{MOCK_LEADS.length} leads</p>
        <button
          onClick={async () => {
            const rows = ['Name,Phone,Interest,Budget,Status,Source']
            MOCK_LEADS.forEach(l => rows.push(`${l.name},${l.phone},${l.interest},${l.budget},${l.status},${l.source}`))
            const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
            await saveBlobAs(blob, 'GHL_Leads_Export.csv', showToast)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200/60 hover:bg-amber-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {MOCK_LEADS.map(lead => (
        <div key={lead.id} className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">{lead.name}</h3>
              <p className="text-xs text-gray-500">{lead.phone} • Source: {lead.source}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              lead.status === 'Hot' ? 'bg-red-100 text-red-700' :
              lead.status === 'Warm' ? 'bg-amber-100 text-amber-700' :
              'bg-blue-100 text-blue-700'
            }`}>{lead.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Interest</p>
              <p className="text-sm font-medium text-gray-900">{lead.interest}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Budget</p>
              <p className="text-sm font-medium text-gray-900">{lead.budget}</p>
            </div>
          </div>
        </div>
      ))}
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
            {MOCK_AGENT.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{MOCK_AGENT.name}</h3>
            <p className="text-sm text-gray-500">{MOCK_AGENT.tier} Tier Agent</p>
          </div>
          <div className="ml-auto">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
              <Award className="w-3 h-3" /> {MOCK_AGENT.tier}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Email', value: MOCK_AGENT.email },
            { label: 'Phone', value: MOCK_AGENT.phone },
            { label: 'RERA License', value: MOCK_AGENT.license },
            { label: 'Region', value: MOCK_AGENT.region },
            { label: 'Agent ID', value: MOCK_AGENT.id },
            { label: 'Closing Rate', value: `${MOCK_AGENT.closingRate}%` },
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
            entityId: MOCK_AGENT.id,
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
