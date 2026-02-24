'use client'

import { useState, useMemo, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, FileText, BarChart3, MessageCircle,
  User, Settings, LogOut, ChevronRight, TrendingUp, TrendingDown,
  Download, Upload, Eye, IndianRupee, Calendar, Clock, Bell,
  PieChart, Shield, FileCheck, ArrowUpRight, ArrowDownRight,
  Menu, X, Search, Filter, Star, ChevronDown,
} from 'lucide-react'
import { pickAndUploadFiles, saveBlobAs, formatFileSize } from '@/lib/supabase/storageService'

// ── Types ──────────────────────────────────────────────────────
type InvestorTab = 'overview' | 'portfolio' | 'documents' | 'reports' | 'communications' | 'profile' | 'settings'

const TABS: { id: InvestorTab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'communications', label: 'Messages', icon: MessageCircle },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
]

// ── Mock Investor Data ─────────────────────────────────────────
const MOCK_INVESTOR = {
  id: 'INV-001',
  name: 'Rajesh Sharma',
  email: 'rajesh.sharma@email.com',
  phone: '+91 98765 43210',
  kycStatus: 'Approved' as const,
  investorType: 'HNI',
  totalInvested: 15000000,
  currentValue: 18750000,
  returns: 25.0,
  unrealizedGain: 3750000,
  xirr: 18.7,
}

const MOCK_PORTFOLIO = [
  { id: 'F001', name: 'GHL Growth Fund I', invested: 5000000, currentNav: 6250000, units: 5000, navPerUnit: 1250, returnPct: 25, status: 'Active' },
  { id: 'F002', name: 'GHL Real Estate AIF II', invested: 3000000, currentNav: 3450000, units: 3000, navPerUnit: 1150, returnPct: 15, status: 'Active' },
  { id: 'F003', name: 'GHL Balanced Opportunities', invested: 4000000, currentNav: 5200000, units: 4000, navPerUnit: 1300, returnPct: 30, status: 'Active' },
  { id: 'F004', name: 'GHL Fixed Income Plus', invested: 3000000, currentNav: 3850000, units: 3000, navPerUnit: 1283, returnPct: 28.3, status: 'Active' },
]

const MOCK_DOCUMENTS = [
  { id: 'D001', name: 'Investment Agreement - GHL Growth Fund I.pdf', type: 'Agreement', date: '2024-06-15', size: 2400000, category: 'Legal' },
  { id: 'D002', name: 'KYC Verification Certificate.pdf', type: 'KYC', date: '2024-06-10', size: 540000, category: 'Compliance' },
  { id: 'D003', name: 'NAV Report - March 2025.pdf', type: 'Report', date: '2025-04-01', size: 1200000, category: 'Reports' },
  { id: 'D004', name: 'Capital Call Notice #3.pdf', type: 'Notice', date: '2025-02-15', size: 340000, category: 'Notices' },
  { id: 'D005', name: 'Distribution Statement Q4 2024.pdf', type: 'Statement', date: '2025-01-15', size: 890000, category: 'Statements' },
  { id: 'D006', name: 'Tax Certificate FY 2024-25.pdf', type: 'Tax', date: '2025-03-31', size: 450000, category: 'Tax' },
  { id: 'D007', name: 'Annual Report FY 2024-25.pdf', type: 'Report', date: '2025-06-30', size: 5600000, category: 'Reports' },
  { id: 'D008', name: 'PPM - GHL Real Estate AIF II.pdf', type: 'PPM', date: '2024-05-01', size: 8900000, category: 'Legal' },
]

const MOCK_REPORTS = [
  { id: 'R001', name: 'Monthly Portfolio Statement - Feb 2026', date: '2026-03-01', type: 'Portfolio' },
  { id: 'R002', name: 'NAV Report - January 2026', date: '2026-02-01', type: 'NAV' },
  { id: 'R003', name: 'Capital Account Statement Q4 2025', date: '2026-01-15', type: 'Capital' },
  { id: 'R004', name: 'Tax Computation FY 2025-26 (Provisional)', date: '2026-02-20', type: 'Tax' },
]

const MOCK_MESSAGES = [
  { id: 'M001', from: 'GHL Fund Management', subject: 'NAV Update: GHL Growth Fund I', date: '2026-02-20', read: false },
  { id: 'M002', from: 'Compliance Team', subject: 'KYC Renewal Reminder', date: '2026-02-18', read: true },
  { id: 'M003', from: 'Investor Relations', subject: 'Q4 Distribution Notice', date: '2026-02-15', read: true },
  { id: 'M004', from: 'GHL Fund Management', subject: 'Annual Meeting Invitation', date: '2026-02-10', read: true },
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

// ── Format Helpers ─────────────────────────────────────────────
function formatINR(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`
  return `₹${val.toLocaleString('en-IN')}`
}

// ── Main Component ─────────────────────────────────────────────
export default function InvestorClient() {
  const pathname = usePathname()
  const { toast, showToast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const activeTab = useMemo<InvestorTab>(() => {
    const segments = pathname.split('/').filter(Boolean)
    const tab = segments[1] || 'overview'
    return (TABS.some(t => t.id === tab) ? tab : 'overview') as InvestorTab
  }, [pathname])

  const navigate = useCallback((tab: string) => {
    window.history.pushState(null, '', `/investor/${tab}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
    setSidebarOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-bold text-sm">
              GHL
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Investor Portal</h2>
              <p className="text-xs text-gray-500">GHL India Ventures</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{MOCK_INVESTOR.name}</p>
              <p className="text-xs text-gray-500">{MOCK_INVESTOR.investorType}</p>
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
                    ? 'bg-red-50 text-red-700 border border-red-200/60'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-gray-400'}`} />
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
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab showToast={showToast} />}
          {activeTab === 'portfolio' && <PortfolioTab showToast={showToast} />}
          {activeTab === 'documents' && <DocumentsTab showToast={showToast} />}
          {activeTab === 'reports' && <ReportsTab showToast={showToast} />}
          {activeTab === 'communications' && <MessagesTab showToast={showToast} />}
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
          { label: 'Total Invested', value: formatINR(MOCK_INVESTOR.totalInvested), icon: IndianRupee, color: 'blue', trend: null },
          { label: 'Current Value', value: formatINR(MOCK_INVESTOR.currentValue), icon: TrendingUp, color: 'green', trend: `+${MOCK_INVESTOR.returns}%` },
          { label: 'Unrealised Gain', value: formatINR(MOCK_INVESTOR.unrealizedGain), icon: ArrowUpRight, color: 'emerald', trend: null },
          { label: 'XIRR', value: `${MOCK_INVESTOR.xirr}%`, icon: PieChart, color: 'purple', trend: null },
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
              {kpi.trend && <p className="text-xs text-green-600 font-medium mt-1">{kpi.trend}</p>}
            </div>
          )
        })}
      </div>

      {/* Portfolio Summary */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Portfolio Allocation</h3>
        <div className="space-y-3">
          {MOCK_PORTFOLIO.map(fund => (
            <div key={fund.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-900">{fund.name}</p>
                <p className="text-xs text-gray-500">{fund.units.toLocaleString()} units @ {formatINR(fund.navPerUnit)}/unit</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{formatINR(fund.currentNav)}</p>
                <p className={`text-xs font-medium ${fund.returnPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fund.returnPct >= 0 ? '+' : ''}{fund.returnPct}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Recent Notifications</h3>
        <div className="space-y-3">
          {MOCK_MESSAGES.slice(0, 3).map(msg => (
            <div key={msg.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className={`w-2 h-2 rounded-full ${msg.read ? 'bg-gray-300' : 'bg-red-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{msg.subject}</p>
                <p className="text-xs text-gray-500">{msg.from} • {msg.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Portfolio Tab ───────────────────────────────────────────────
function PortfolioTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{MOCK_PORTFOLIO.length} active investments</p>
        <button
          onClick={async () => {
            const rows = ['Fund,Invested,Current Value,Units,NAV/Unit,Return %,Status']
            MOCK_PORTFOLIO.forEach(f => rows.push(`${f.name},${f.invested},${f.currentNav},${f.units},${f.navPerUnit},${f.returnPct},${f.status}`))
            const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
            await saveBlobAs(blob, 'GHL_Portfolio_Statement.csv', showToast)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-700 bg-red-50 border border-red-200/60 hover:bg-red-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Portfolio
        </button>
      </div>

      {MOCK_PORTFOLIO.map(fund => (
        <div key={fund.id} className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">{fund.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Fund ID: {fund.id} • Status: {fund.status}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              fund.returnPct >= 20 ? 'bg-green-100 text-green-700' : fund.returnPct >= 10 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {fund.returnPct >= 0 ? '+' : ''}{fund.returnPct}% return
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Invested', value: formatINR(fund.invested) },
              { label: 'Current Value', value: formatINR(fund.currentNav) },
              { label: 'Units Held', value: fund.units.toLocaleString() },
              { label: 'NAV/Unit', value: formatINR(fund.navPerUnit) },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                <p className="text-sm font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Documents Tab ──────────────────────────────────────────────
function DocumentsTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

  const categories = ['All', 'Legal', 'Compliance', 'Reports', 'Notices', 'Statements', 'Tax']

  const filtered = useMemo(() => {
    return MOCK_DOCUMENTS.filter(doc => {
      if (filterCategory !== 'All' && doc.category !== filterCategory) return false
      if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [searchQuery, filterCategory])

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
          />
        </div>
        <button
          onClick={async () => {
            const results = await pickAndUploadFiles('investor/documents', {
              accept: '.pdf,.jpg,.jpeg,.png,.docx',
              portal: 'investor',
              entityType: 'investor',
              entityId: MOCK_INVESTOR.id,
              category: 'investor-upload',
            })
            const count = results.filter(r => r.success).length
            if (count > 0) showToast(`Uploaded ${count} document(s)`, 'success')
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterCategory === cat
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {filtered.map(doc => (
          <div key={doc.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200/60 hover:border-gray-300 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
              <p className="text-xs text-gray-500">{doc.category} • {doc.date} • {formatFileSize(doc.size)}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => showToast(`Previewing ${doc.name}`, 'info')}
                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={async () => {
                  showToast(`Downloading ${doc.name}...`, 'info')
                  const blob = new Blob([`Document: ${doc.name}\nType: ${doc.type}\nDate: ${doc.date}\nCategory: ${doc.category}`], { type: 'application/pdf' })
                  await saveBlobAs(blob, doc.name, showToast)
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No documents found</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Reports Tab ────────────────────────────────────────────────
function ReportsTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{MOCK_REPORTS.length} reports available</p>
        <button
          onClick={async () => {
            const rows = ['Report,Date,Type']
            MOCK_REPORTS.forEach(r => rows.push(`${r.name},${r.date},${r.type}`))
            const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
            await saveBlobAs(blob, 'GHL_Investor_Reports_Index.csv', showToast)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-700 bg-red-50 border border-red-200/60 hover:bg-red-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download All
        </button>
      </div>

      <div className="space-y-3">
        {MOCK_REPORTS.map(report => (
          <div key={report.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200/60 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{report.name}</p>
                <p className="text-xs text-gray-500">{report.date} • {report.type}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                const blob = new Blob([`Report: ${report.name}\nDate: ${report.date}\nType: ${report.type}\n\n[Full report content would be generated from live data]`], { type: 'application/pdf' })
                await saveBlobAs(blob, `${report.name.replace(/\s+/g, '_')}.pdf`, showToast)
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Messages Tab ───────────────────────────────────────────────
function MessagesTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  return (
    <div className="space-y-4">
      {MOCK_MESSAGES.map(msg => (
        <div key={msg.id} className={`p-4 bg-white rounded-xl border ${msg.read ? 'border-gray-200/60' : 'border-red-200 bg-red-50/30'} hover:shadow-sm transition-all cursor-pointer`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {!msg.read && <div className="w-2 h-2 rounded-full bg-red-500" />}
              <p className="text-sm font-bold text-gray-900">{msg.subject}</p>
            </div>
            <p className="text-xs text-gray-500">{msg.date}</p>
          </div>
          <p className="text-xs text-gray-500">From: {msg.from}</p>
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
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
            {MOCK_INVESTOR.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{MOCK_INVESTOR.name}</h3>
            <p className="text-sm text-gray-500">{MOCK_INVESTOR.investorType} Investor</p>
          </div>
          <div className="ml-auto">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
              <Shield className="w-3 h-3" /> KYC {MOCK_INVESTOR.kycStatus}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Email', value: MOCK_INVESTOR.email },
            { label: 'Phone', value: MOCK_INVESTOR.phone },
            { label: 'Investor ID', value: MOCK_INVESTOR.id },
            { label: 'Type', value: MOCK_INVESTOR.investorType },
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
          const results = await pickAndUploadFiles('investor/kyc', {
            accept: '.pdf,.jpg,.jpeg,.png',
            portal: 'investor',
            entityType: 'investor',
            entityId: MOCK_INVESTOR.id,
            category: 'kyc',
          })
          const count = results.filter(r => r.success).length
          if (count > 0) showToast(`Uploaded ${count} KYC document(s)`, 'success')
        }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-700 bg-red-50 border border-red-200/60 hover:bg-red-100 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Upload KYC Documents
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
          {['NAV Updates', 'Distribution Notices', 'Capital Calls', 'Report Generation', 'KYC Reminders'].map(pref => (
            <div key={pref} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <p className="text-sm text-gray-700">{pref}</p>
              <button onClick={() => showToast(`${pref} notification updated`, 'success')}
                className="w-10 h-6 bg-green-500 rounded-full relative">
                <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
