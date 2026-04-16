'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Users, UserPlus, Search, Filter, Download, Upload, Pencil, Trash2,
  Phone, Mail, Calendar, ChevronRight, Plus, X, Check, AlertTriangle,
  FileText, ArrowUpRight, TrendingUp, PhoneCall, Star, RefreshCw,
  Palette, ToggleLeft, ToggleRight, Hash, Building2, Zap,
} from 'lucide-react'
import { supabase as _supabase, isSupabaseConfigured } from '@/lib/supabase/client'

const supabase = _supabase as any

// ── Types ────────────────────────────────────────────────────────
interface LeadManagementModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  scope: 'admin' | 'irm'
  currentUserId?: string
  basePath: string
}

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  income_bracket: string | null
  planning: string | null
  assigned_to: string | null
  lead_status_id: string | null
  lead_source_id: string | null
  lead_company_id: string | null
  lead_status_name: string | null
  company_name: string | null
  source: string | null
  stage: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface LeadStatus {
  id: string
  name: string
  color: string
  sort_order: number
  is_active: boolean
}

interface LeadSource {
  id: string
  name: string
  is_active: boolean
}

interface LeadCompany {
  id: string
  name: string
  is_active: boolean
}

interface StaffProfile {
  id: string
  full_name: string
  email: string
}

// ── Constants ────────────────────────────────────────────────────
const INCOME_BRACKETS = ['Below 5L', '5-10L', '10-25L', '25-50L', '50L-1Cr', '1Cr+']

const LEAD_TABS = [
  { id: 'leads', label: 'All Leads', icon: Users },
  { id: 'lead-statuses', label: 'Lead Statuses', icon: Palette },
  { id: 'lead-sources', label: 'Lead Sources', icon: Zap },
  { id: 'lead-companies', label: 'Lead Companies', icon: Building2 },
  { id: 'bulk-upload', label: 'Bulk Upload', icon: Upload },
  { id: 'create', label: 'New Lead', icon: UserPlus },
] as const

type LeadTab = typeof LEAD_TABS[number]['id']

const GLASS_CARD = 'relative rounded-2xl border border-white/[0.06] p-5 backdrop-blur-sm'
const GLASS_BG = { background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' }

// ── Helpers ──────────────────────────────────────────────────────
function formatDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateShort(d: string | null) {
  if (!d) return ''
  return new Date(d).toISOString().split('T')[0]
}

function isToday(d: string | null) {
  if (!d) return false
  const t = new Date()
  const dt = new Date(d)
  return dt.getFullYear() === t.getFullYear() && dt.getMonth() === t.getMonth() && dt.getDate() === t.getDate()
}

// ── Main Component ───────────────────────────────────────────────
export default function LeadManagementModule({
  subTab, navigate, showToast, scope, currentUserId, basePath,
}: LeadManagementModuleProps) {
  // Use internal state for tab switching (works inside embedded views like CS Center)
  const initialTab = (LEAD_TABS.some(t => t.id === subTab) ? subTab : 'leads') as LeadTab
  const [activeTab, setActiveTab] = useState<LeadTab>(initialTab)
  // Also track editing lead for inline edit
  const [editingLead, setEditingLead] = useState<Lead | null>(null)

  // ── Auto-detect user ID for IRM scope ───────────────────────
  const [resolvedUserId, setResolvedUserId] = useState<string | undefined>(currentUserId)
  useEffect(() => {
    if (currentUserId) { setResolvedUserId(currentUserId); return }
    if (scope === 'irm' && isSupabaseConfigured()) {
      (supabase as any).auth.getUser().then(({ data }: any) => {
        if (data?.user?.id) setResolvedUserId(data.user.id)
      })
    }
  }, [currentUserId, scope])

  // ── Shared state ─────────────────────────────────────────────
  const [leads, setLeads] = useState<Lead[]>([])
  const [statuses, setStatuses] = useState<LeadStatus[]>([])
  const [sources, setSources] = useState<LeadSource[]>([])
  const [companies, setCompanies] = useState<LeadCompany[]>([])
  const [staffList, setStaffList] = useState<StaffProfile[]>([])
  const [loading, setLoading] = useState(true)

  // ── Data fetching ────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    setLoading(true)
    try {
      const [leadsRes, statusRes, sourceRes, companyRes, staffRes] = await Promise.all([
        (() => {
          let q = (supabase as any).from('leads').select('*').order('created_at', { ascending: false })
          if (scope === 'irm' && resolvedUserId) q = q.eq('assigned_to', resolvedUserId)
          return q
        })(),
        (supabase as any).from('lead_statuses').select('*').order('sort_order', { ascending: true }),
        (supabase as any).from('lead_sources').select('*').order('created_at', { ascending: false }),
        (supabase as any).from('lead_companies').select('*').order('created_at', { ascending: false }),
        (supabase as any).from('staff_profiles').select('id, full_name, email'),
      ])
      setLeads(leadsRes.data || [])
      setStatuses(statusRes.data || [])
      setSources(sourceRes.data || [])
      setCompanies(companyRes.data || [])
      setStaffList(staffRes.data || [])
    } catch (e) {
      console.error('Failed to load lead data:', e)
    }
    setLoading(false)
  }, [scope, resolvedUserId])

  useEffect(() => { loadAllData() }, [loadAllData])

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex flex-wrap gap-2">
        {LEAD_TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setEditingLead(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? 'bg-[#D0021B] text-white shadow-lg shadow-red-900/30'
                  : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'leads' && (
        <LeadListingTab
          leads={leads} statuses={statuses} sources={sources} companies={companies}
          staffList={staffList} loading={loading} showToast={showToast}
          navigate={navigate} basePath={basePath} reload={loadAllData}
          scope={scope} currentUserId={resolvedUserId}
          onNewLead={() => { setEditingLead(null); setActiveTab('create') }}
          onEditLead={(lead) => { setEditingLead(lead); setActiveTab('create') }}
        />
      )}
      {activeTab === 'lead-statuses' && (
        <LeadStatusCRUD statuses={statuses} loading={loading} showToast={showToast} reload={loadAllData} />
      )}
      {activeTab === 'lead-sources' && (
        <LeadSourceCRUD sources={sources} loading={loading} showToast={showToast} reload={loadAllData} />
      )}
      {activeTab === 'lead-companies' && (
        <LeadCompanyCRUD companies={companies} loading={loading} showToast={showToast} reload={loadAllData} />
      )}
      {activeTab === 'bulk-upload' && (
        <BulkUploadTab
          statuses={statuses} sources={sources} companies={companies}
          leads={leads} showToast={showToast} reload={loadAllData}
          scope={scope} currentUserId={resolvedUserId}
        />
      )}
      {activeTab === 'create' && (
        <LeadFormTab
          statuses={statuses} sources={sources} companies={companies}
          staffList={staffList} showToast={showToast} reload={loadAllData}
          navigate={navigate} basePath={basePath}
          scope={scope} currentUserId={resolvedUserId}
          editingLead={editingLead}
          onBack={() => { setEditingLead(null); setActiveTab('leads') }}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ── LEAD LISTING TAB ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
function LeadListingTab({
  leads, statuses, sources, companies, staffList, loading, showToast,
  navigate, basePath, reload, scope, currentUserId, onNewLead, onEditLead,
}: {
  leads: Lead[]; statuses: LeadStatus[]; sources: LeadSource[]; companies: LeadCompany[];
  staffList: StaffProfile[]; loading: boolean;
  showToast: (m: string, t?: any) => void; navigate: (p: string) => void;
  basePath: string; reload: () => void; scope: string; currentUserId?: string;
  onNewLead: () => void; onEditLead: (lead: Lead) => void;
}) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterCompany, setFilterCompany] = useState('')
  const [filterAssigned, setFilterAssigned] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // ── Lookups ──────────────────────────────────────────────────
  // Map by name for display (DB stores names, not IDs)
  const statusMap = useMemo(() => {
    const m: Record<string, LeadStatus> = {}
    for (const s of statuses) { m[s.id] = s; m[s.name] = s; m[s.name.toLowerCase().replace(/\s+/g, '-')] = s }
    return m
  }, [statuses])
  const sourceMap = useMemo(() => {
    const m: Record<string, LeadSource> = {}
    for (const s of sources) { m[s.id] = s; m[s.name] = s; m[s.name.toLowerCase().replace(/\s+/g, '-')] = s }
    return m
  }, [sources])
  const companyMap = useMemo(() => {
    const m: Record<string, LeadCompany> = {}
    for (const c of companies) { m[c.id] = c; m[c.name] = c }
    return m
  }, [companies])
  const staffMap = useMemo(() => Object.fromEntries(staffList.map(s => [s.id, s])), [staffList])

  // ── Filtered leads ───────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...leads]
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(l =>
        l.name?.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s) ||
        l.phone?.includes(s) ||
        staffMap[l.assigned_to || '']?.full_name?.toLowerCase().includes(s)
      )
    }
    if (filterStatus) result = result.filter(l => l.lead_status_name === filterStatus || l.stage === filterStatus)
    if (filterSource) result = result.filter(l => l.source === filterSource)
    if (filterCompany) result = result.filter(l => l.company_name === filterCompany)
    if (filterAssigned) result = result.filter(l => l.assigned_to === filterAssigned)
    if (dateFrom) result = result.filter(l => l.created_at >= dateFrom)
    if (dateTo) result = result.filter(l => l.created_at <= dateTo + 'T23:59:59')
    return result
  }, [leads, search, filterStatus, filterSource, filterCompany, filterAssigned, dateFrom, dateTo, staffMap])

  // ── Helper to match lead status ──────────────────────────────
  const matchStatus = (l: Lead, statusName: string) =>
    (l.lead_status_name || '').toLowerCase() === statusName.toLowerCase() ||
    (l.stage || '').toLowerCase() === statusName.toLowerCase().replace(/\s+/g, '-')

  // ── KPIs ─────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = leads.length
    const todayLeads = leads.filter(l => isToday(l.created_at)).length
    const todayCalls = leads.filter(l => matchStatus(l, 'Call Scheduled') && isToday(l.updated_at)).length
    const todayInterested = leads.filter(l => matchStatus(l, 'Interested') && isToday(l.updated_at)).length
    return { total, todayLeads, todayCalls, todayInterested }
  }, [leads])

  // ── Quick nav helpers ────────────────────────────────────────
  const quickNavItems = useMemo(() => {
    return [
      { label: 'All Leads', count: leads.length, action: () => { setFilterStatus(''); setSearch(''); setDateFrom(''); setDateTo('') } },
      { label: "Today's Leads", count: leads.filter(l => isToday(l.created_at)).length, action: () => { const d = new Date().toISOString().split('T')[0]; setDateFrom(d); setDateTo(d); setFilterStatus('') } },
      { label: 'Call Rescheduled', count: leads.filter(l => matchStatus(l, 'Call Rescheduled')).length, action: () => setFilterStatus('Call Rescheduled') },
      { label: 'Interested Today', count: leads.filter(l => matchStatus(l, 'Interested') && isToday(l.updated_at)).length, action: () => setFilterStatus('Interested') },
      { label: 'New Leads', count: leads.filter(l => matchStatus(l, 'New') || (l.stage || '').toLowerCase() === 'new').length, action: () => setFilterStatus('New') },
      { label: 'Won', count: leads.filter(l => matchStatus(l, 'Won')).length, action: () => setFilterStatus('Won') },
      { label: 'Lost', count: leads.filter(l => matchStatus(l, 'Lost')).length, action: () => setFilterStatus('Lost') },
    ]
  }, [leads])

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from('leads').delete().eq('id', id)
    if (error) { showToast('Failed to delete lead', 'error'); return }
    showToast('Lead deleted', 'success')
    setDeleteConfirm(null)
    reload()
  }

  // ── Export helpers ────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Created Date', 'Name', 'Email', 'Phone', 'Income Bracket', 'Planning', 'Assigned To', 'Status', 'Source', 'Company']
    const rows = filtered.map(l => [
      formatDate(l.created_at), l.name, l.email, l.phone, l.income_bracket || '',
      l.planning || '', staffMap[l.assigned_to || '']?.full_name || '',
      (statusMap[l.lead_status_name || ''] || statusMap[l.stage || ''])?.name || l.lead_status_name || l.stage || '',
      (sourceMap[l.source || ''])?.name || l.source || '',
      (companyMap[l.company_name || ''])?.name || l.company_name || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadFile(csv, 'leads-export.csv', 'text/csv')
  }

  const exportExcel = () => {
    const headers = ['Created Date', 'Name', 'Email', 'Phone', 'Income Bracket', 'Planning', 'Assigned To', 'Status', 'Source', 'Company']
    const rows = filtered.map(l => [
      formatDate(l.created_at), l.name, l.email, l.phone, l.income_bracket || '',
      l.planning || '', staffMap[l.assigned_to || '']?.full_name || '',
      (statusMap[l.lead_status_name || ''] || statusMap[l.stage || ''])?.name || l.lead_status_name || l.stage || '',
      (sourceMap[l.source || ''])?.name || l.source || '',
      (companyMap[l.company_name || ''])?.name || l.company_name || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadFile(csv, 'leads-export.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  }

  const exportPDF = () => {
    const headers = ['Date', 'Name', 'Email', 'Phone', 'Status', 'Source']
    const rows = filtered.map(l => [
      formatDate(l.created_at), l.name, l.email, l.phone,
      statusMap[l.lead_status_id || '']?.name || '', sourceMap[l.lead_source_id || '']?.name || '',
    ])
    const html = `<html><head><title>Leads Export</title>
      <style>body{font-family:Arial,sans-serif;padding:20px}h2{color:#D0021B}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}
      th{background:#222;color:#fff}</style></head><body>
      <h2>GHL India Ventures - Leads Report</h2>
      <p>Exported: ${new Date().toLocaleString('en-IN')} | Total: ${rows.length}</p>
      <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`
    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close(); win.print() }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: kpis.total, icon: Users, color: '#D0021B' },
          { label: "Today's Leads", value: kpis.todayLeads, icon: TrendingUp, color: '#10B981' },
          { label: "Today's Call Scheduled", value: kpis.todayCalls, icon: PhoneCall, color: '#F59E0B' },
          { label: "Today's Interested", value: kpis.todayInterested, icon: Star, color: '#8B5CF6' },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className={GLASS_CARD} style={GLASS_BG}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">{kpi.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.color + '20' }}>
                  <Icon size={16} style={{ color: kpi.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
            </div>
          )
        })}
      </div>

      {/* Quick Navigation */}
      <div className="flex flex-wrap gap-2">
        {quickNavItems.map(q => (
          <button key={q.label} onClick={q.action}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.06] rounded-lg text-gray-300 hover:bg-white/[0.08] hover:text-white transition-all">
            {q.label} <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-bold">{q.count}</span>
          </button>
        ))}
      </div>

      {/* Search + Filter + Export Bar */}
      <div className={GLASS_CARD} style={GLASS_BG}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text" placeholder="Search name, email, phone, assigned to..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D0021B]/50"
            />
          </div>

          {/* Filter toggle */}
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all border
              ${showFilters ? 'bg-[#D0021B]/20 border-[#D0021B]/40 text-[#D0021B]' : 'bg-white/[0.04] border-white/[0.06] text-gray-400 hover:text-white'}`}>
            <Filter size={14} /> Filters
          </button>

          {/* Export buttons */}
          <div className="flex gap-2">
            <button onClick={exportExcel} className="flex items-center gap-1 px-3 py-2 bg-emerald-600/20 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 hover:bg-emerald-600/30 transition-all">
              <Download size={12} /> Excel
            </button>
            <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-xs text-blue-400 hover:bg-blue-600/30 transition-all">
              <Download size={12} /> CSV
            </button>
            <button onClick={exportPDF} className="flex items-center gap-1 px-3 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg text-xs text-purple-400 hover:bg-purple-600/30 transition-all">
              <FileText size={12} /> PDF
            </button>
          </div>

          {/* Create button */}
          <button onClick={onNewLead}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#D0021B] text-white rounded-lg text-sm font-medium hover:bg-[#B0011A] transition-all">
            <Plus size={14} /> New Lead
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-white/[0.06]">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D0021B]/50">
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D0021B]/50">
              <option value="">All Sources</option>
              {sources.map(s => <option key={s.id} value={s.name.toLowerCase().replace(/\s+/g, '-')}>{s.name}</option>)}
            </select>
            <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D0021B]/50">
              <option value="">All Companies</option>
              {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <select value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D0021B]/50">
              <option value="">All Assigned</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From"
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D0021B]/50" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To"
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D0021B]/50" />
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className={GLASS_CARD + ' overflow-hidden !p-0'} style={GLASS_BG}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={20} className="animate-spin text-gray-500 mr-2" />
            <span className="text-gray-500 text-sm">Loading leads...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No leads found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] sticky top-0">
                  {['Created', 'Name', 'Email', 'Phone', 'Income', 'Planning', 'Assigned To', 'Status', 'Source', 'Company', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => {
                  const status = statusMap[lead.lead_status_name || ''] || statusMap[lead.stage || '']
                  const source = sourceMap[lead.source || '']
                  const company = companyMap[lead.company_name || '']
                  const staff = staffMap[lead.assigned_to || '']
                  return (
                    <tr key={lead.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(lead.created_at)}</td>
                      <td className="px-4 py-3 text-white font-medium">{lead.name}</td>
                      <td className="px-4 py-3 text-gray-400">{lead.email}</td>
                      <td className="px-4 py-3 text-gray-400">{lead.phone}</td>
                      <td className="px-4 py-3 text-gray-400">{lead.income_bracket || '-'}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-[120px] truncate">{lead.planning || '-'}</td>
                      <td className="px-4 py-3 text-gray-300">{staff?.full_name || '-'}</td>
                      <td className="px-4 py-3">
                        {status ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                            style={{
                              backgroundColor: (status.color || '#6B7280') + '20',
                              borderColor: (status.color || '#6B7280') + '40',
                              color: status.color || '#9CA3AF',
                            }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color || '#6B7280' }} />
                            {status.name}
                          </span>
                        ) : <span className="text-gray-600">-</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{source?.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-400">{company?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditLead(lead)}
                            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-gray-400 hover:text-blue-400 transition-all">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteConfirm(lead.id)}
                            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-gray-400 hover:text-red-400 transition-all">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 border-t border-white/[0.06] text-xs text-gray-500">
          Showing {filtered.length} of {leads.length} leads
        </div>
      </div>

      {/* Edit modal */}
      {editLead && (
        <LeadEditModal
          lead={editLead} statuses={statuses} sources={sources} companies={companies}
          staffList={staffList} onClose={() => setEditLead(null)} showToast={showToast} reload={reload}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Lead"
          message="Are you sure you want to delete this lead? This action cannot be undone."
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ── LEAD EDIT MODAL ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
function LeadEditModal({
  lead, statuses, sources, companies, staffList, onClose, showToast, reload,
}: {
  lead: Lead; statuses: LeadStatus[]; sources: LeadSource[]; companies: LeadCompany[];
  staffList: StaffProfile[]; onClose: () => void;
  showToast: (m: string, t?: any) => void; reload: () => void;
}) {
  // Map DB values to form — use actual column names
  const initStatus = lead.lead_status_name || lead.stage || ''
  const initSource = lead.source || ''
  const initCompany = lead.company_name || ''
  const [form, setForm] = useState({
    name: lead.name || '', email: lead.email || '', phone: lead.phone || '',
    income_bracket: lead.income_bracket || '', planning: lead.planning || '',
    assigned_to: lead.assigned_to || '', status_name: initStatus,
    source_name: initSource, company_name: initCompany,
    notes: lead.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    // Email is optional (Bug #4)
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) e.phone = 'Phone must be exactly 10 digits'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    // Build payload using ACTUAL DB column names
    const payload: any = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      income_bracket: form.income_bracket || null,
      planning: form.planning || null,
      assigned_to: form.assigned_to || null,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    }
    // Map status by name
    if (form.status_name) {
      payload.lead_status_name = form.status_name
      const matched = statuses.find(s => s.name === form.status_name)
      if (matched) payload.stage = matched.name.toLowerCase().replace(/\s+/g, '-')
    } else {
      payload.lead_status_name = null
    }
    // Map source by name
    if (form.source_name) {
      payload.source = form.source_name.toLowerCase().replace(/\s+/g, '-')
    } else {
      payload.source = null
    }
    // Map company by name
    if (form.company_name) {
      payload.company_name = form.company_name
      const matchedCompany = companies.find(c => c.name === form.company_name)
      if (matchedCompany) payload.company_id = matchedCompany.id
    } else {
      payload.company_name = null
      payload.company_id = null
    }
    const { error } = await (supabase as any).from('leads').update(payload).eq('id', lead.id)
    setSaving(false)
    if (error) { showToast('Failed to update lead: ' + error.message, 'error'); return }
    showToast('Lead updated successfully', 'success')
    onClose()
    reload()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#111] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="text-lg font-semibold text-white">Edit Lead</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-gray-400"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Name *" error={errors.name}>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="form-input-dark" placeholder="Full name" />
            </FormField>
            <FormField label="Email *" error={errors.email}>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="form-input-dark" placeholder="email@example.com" type="email" />
            </FormField>
            <FormField label="Phone *" error={errors.phone}>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="form-input-dark" placeholder="10 digit phone" maxLength={10} />
            </FormField>
            <FormField label="Income Bracket">
              <select value={form.income_bracket} onChange={e => setForm({ ...form, income_bracket: e.target.value })} className="form-input-dark">
                <option value="">Select</option>
                {INCOME_BRACKETS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </FormField>
            <FormField label="Planning">
              <input value={form.planning} onChange={e => setForm({ ...form, planning: e.target.value })}
                className="form-input-dark" placeholder="Investment planning notes" />
            </FormField>
            <FormField label="Assigned To">
              <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className="form-input-dark">
                <option value="">Unassigned</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </FormField>
            <FormField label="Lead Status">
              <select value={form.status_name} onChange={e => setForm({ ...form, status_name: e.target.value })} className="form-input-dark">
                <option value="">Select Status</option>
                {statuses.filter(s => s.is_active).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField label="Lead Source">
              <select value={form.source_name} onChange={e => setForm({ ...form, source_name: e.target.value })} className="form-input-dark">
                <option value="">Select Source</option>
                {sources.filter(s => s.is_active).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField label="Company">
              <select value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} className="form-input-dark">
                <option value="">Select Company</option>
                {companies.filter(c => c.is_active).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="form-input-dark min-h-[80px] resize-y" placeholder="Additional notes..." rows={3} />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-[#D0021B] text-white rounded-lg text-sm font-medium hover:bg-[#B0011A] disabled:opacity-50 transition-all">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      <style jsx>{`
        .form-input-dark {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 0.5rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input-dark:focus { border-color: rgba(208,2,27,0.5); }
        .form-input-dark::placeholder { color: #6b7280; }
        .form-input-dark option { background: #1a1a1a; color: white; }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ── LEAD CREATE FORM TAB ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
function LeadFormTab({
  statuses, sources, companies, staffList, showToast, reload, navigate, basePath, scope, currentUserId,
  editingLead, onBack,
}: {
  statuses: LeadStatus[]; sources: LeadSource[]; companies: LeadCompany[];
  staffList: StaffProfile[];
  showToast: (m: string, t?: any) => void; reload: () => void;
  navigate: (p: string) => void; basePath: string; scope: string; currentUserId?: string;
  editingLead?: Lead | null; onBack?: () => void;
}) {
  const isEditing = !!editingLead
  const [form, setForm] = useState({
    name: editingLead?.name || '', email: editingLead?.email || '', phone: editingLead?.phone || '',
    income_bracket: editingLead?.income_bracket || '', planning: editingLead?.planning || '',
    assigned_to: editingLead?.assigned_to || (scope === 'irm' && currentUserId ? currentUserId : ''),
    status_name: editingLead?.lead_status_name || '', source_name: editingLead?.source || '',
    company_name: editingLead?.company_name || '', notes: editingLead?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    else if (!/^\d{10}$/.test(form.phone)) e.phone = 'Phone must be exactly 10 digits'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    const payload: any = { name: form.name, email: form.email, phone: form.phone, updated_at: new Date().toISOString() }
    if (form.income_bracket) payload.income_bracket = form.income_bracket
    if (form.planning) payload.planning = form.planning
    if (form.assigned_to) payload.assigned_to = form.assigned_to
    if (form.notes) payload.notes = form.notes
    // Map status/source/company by name to the DB columns
    if (form.status_name) {
      payload.lead_status_name = form.status_name
      const matchedStatus = statuses.find(s => s.name === form.status_name)
      if (matchedStatus) payload.stage = matchedStatus.name.toLowerCase().replace(/\s+/g, '-')
    }
    if (form.source_name) {
      payload.source = form.source_name.toLowerCase().replace(/\s+/g, '-')
    }
    if (form.company_name) {
      payload.company_name = form.company_name
      const matchedCompany = companies.find(c => c.name === form.company_name)
      if (matchedCompany) payload.company_id = matchedCompany.id
    }

    if (isEditing && editingLead) {
      const { error } = await (supabase as any).from('leads').update(payload).eq('id', editingLead.id)
      setSaving(false)
      if (error) { showToast('Failed to update lead: ' + error.message, 'error'); return }
      showToast('Lead updated successfully', 'success')
    } else {
      payload.created_at = new Date().toISOString()
      const { error } = await (supabase as any).from('leads').insert(payload)
      setSaving(false)
      if (error) { showToast('Failed to create lead: ' + error.message, 'error'); return }
      showToast('Lead created successfully', 'success')
    }
    reload()
    if (onBack) onBack()
  }

  return (
    <div className={GLASS_CARD + ' max-w-3xl'} style={GLASS_BG}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <UserPlus size={20} className="text-[#D0021B]" /> {isEditing ? 'Edit Lead' : 'Create New Lead'}
        </h3>
        {onBack && (
          <button onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors">
            &larr; Back to Leads
          </button>
        )}
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Name *" error={errors.name}>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D0021B]/50"
              placeholder="Full name" />
          </FormField>
          <FormField label="Email *" error={errors.email}>
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D0021B]/50"
              placeholder="email@example.com" type="email" />
          </FormField>
          <FormField label="Phone * (10 digits)" error={errors.phone}>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D0021B]/50"
              placeholder="9876543210" maxLength={10} />
          </FormField>
          <FormField label="Income Bracket">
            <select value={form.income_bracket} onChange={e => setForm({ ...form, income_bracket: e.target.value })}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#D0021B]/50">
              <option value="">Select</option>
              {INCOME_BRACKETS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </FormField>
          <FormField label="Planning">
            <input value={form.planning} onChange={e => setForm({ ...form, planning: e.target.value })}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D0021B]/50"
              placeholder="Investment plans" />
          </FormField>
          <FormField label="Assigned To">
            <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#D0021B]/50"
              disabled={scope === 'irm'}>
              <option value="">Unassigned</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </FormField>
          <FormField label="Lead Status">
            <select value={form.status_name} onChange={e => setForm({ ...form, status_name: e.target.value })}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#D0021B]/50">
              <option value="">Select Status</option>
              {statuses.filter(s => s.is_active).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Lead Source">
            <select value={form.source_name} onChange={e => setForm({ ...form, source_name: e.target.value })}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#D0021B]/50">
              <option value="">Select Source</option>
              {sources.filter(s => s.is_active).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Company">
            <select value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#D0021B]/50">
              <option value="">Select Company</option>
              {companies.filter(c => c.is_active).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Notes">
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D0021B]/50 min-h-[80px] resize-y"
            placeholder="Additional notes..." rows={3} />
        </FormField>
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={() => onBack ? onBack() : navigate(`${basePath}/leads`)}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 bg-[#D0021B] text-white rounded-lg text-sm font-medium hover:bg-[#B0011A] disabled:opacity-50 transition-all flex items-center gap-2">
            {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> {isEditing ? 'Update Lead' : 'Create Lead'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ── LEAD STATUS CRUD TAB ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
function LeadStatusCRUD({
  statuses, loading, showToast, reload,
}: { statuses: LeadStatus[]; loading: boolean; showToast: (m: string, t?: any) => void; reload: () => void }) {
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', color: '#D0021B', sort_order: 0, is_active: true })
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const startEdit = (s: LeadStatus) => {
    setEditId(s.id)
    setForm({ name: s.name, color: s.color, sort_order: s.sort_order, is_active: s.is_active })
    setCreating(false)
  }

  const startCreate = () => {
    setEditId(null)
    setCreating(true)
    setForm({ name: '', color: '#D0021B', sort_order: (statuses.length + 1) * 10, is_active: true })
  }

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Name is required', 'error'); return }
    setSaving(true)
    if (creating) {
      const { error } = await (supabase as any).from('lead_statuses').insert({ ...form })
      if (error) { showToast('Failed to create status: ' + error.message, 'error'); setSaving(false); return }
      showToast('Status created', 'success')
    } else if (editId) {
      const { error } = await (supabase as any).from('lead_statuses').update({ ...form }).eq('id', editId)
      if (error) { showToast('Failed to update status: ' + error.message, 'error'); setSaving(false); return }
      showToast('Status updated', 'success')
    }
    setSaving(false)
    setEditId(null)
    setCreating(false)
    reload()
  }

  const toggleActive = async (s: LeadStatus) => {
    await (supabase as any).from('lead_statuses').update({ is_active: !s.is_active }).eq('id', s.id)
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Palette size={20} className="text-[#D0021B]" /> Lead Statuses
        </h3>
        <button onClick={startCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#D0021B] text-white rounded-lg text-sm font-medium hover:bg-[#B0011A] transition-all">
          <Plus size={14} /> Add Status
        </button>
      </div>

      {/* Create/Edit form */}
      {(creating || editId) && (
        <div className={GLASS_CARD} style={GLASS_BG}>
          <h4 className="text-sm font-semibold text-white mb-4">{creating ? 'Create New Status' : 'Edit Status'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField label="Name *">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D0021B]/50"
                placeholder="Status name" />
            </FormField>
            <FormField label="Color">
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                  className="w-10 h-10 rounded border-0 cursor-pointer bg-transparent" />
                <input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#D0021B]/50"
                  placeholder="#D0021B" />
              </div>
            </FormField>
            <FormField label="Sort Order">
              <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#D0021B]/50" />
            </FormField>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <button onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className="text-gray-400 hover:text-white transition-colors">
                  {form.is_active ? <ToggleRight size={24} className="text-emerald-400" /> : <ToggleLeft size={24} />}
                </button>
                <span className="text-sm text-gray-300">{form.is_active ? 'Active' : 'Inactive'}</span>
              </label>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 bg-[#D0021B] text-white rounded-lg text-sm font-medium hover:bg-[#B0011A] disabled:opacity-50 ml-auto">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => { setEditId(null); setCreating(false) }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Status list */}
      <div className={GLASS_CARD + ' overflow-hidden !p-0'} style={GLASS_BG}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={18} className="animate-spin text-gray-500 mr-2" /><span className="text-gray-500 text-sm">Loading...</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {['Color', 'Name', 'Sort Order', 'Active', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statuses.map(s => (
                <tr key={s.id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: s.color }} />
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-gray-400">{s.sort_order}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(s)}>
                      {s.is_active
                        ? <span className="inline-flex items-center gap-1 text-emerald-400 text-xs"><Check size={12} /> Active</span>
                        : <span className="inline-flex items-center gap-1 text-gray-500 text-xs"><X size={12} /> Inactive</span>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-gray-400 hover:text-blue-400">
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {statuses.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No statuses yet. Click &quot;Add Status&quot; to create one.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ── LEAD SOURCE CRUD TAB ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
function LeadSourceCRUD({
  sources, loading, showToast, reload,
}: { sources: LeadSource[]; loading: boolean; showToast: (m: string, t?: any) => void; reload: () => void }) {
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', is_active: true })
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const startEdit = (s: LeadSource) => { setEditId(s.id); setForm({ name: s.name, is_active: s.is_active }); setCreating(false) }
  const startCreate = () => { setEditId(null); setCreating(true); setForm({ name: '', is_active: true }) }

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Name is required', 'error'); return }
    setSaving(true)
    if (creating) {
      const { error } = await (supabase as any).from('lead_sources').insert({ ...form })
      if (error) { showToast('Failed to create source: ' + error.message, 'error'); setSaving(false); return }
      showToast('Source created', 'success')
    } else if (editId) {
      const { error } = await (supabase as any).from('lead_sources').update({ ...form }).eq('id', editId)
      if (error) { showToast('Failed to update source: ' + error.message, 'error'); setSaving(false); return }
      showToast('Source updated', 'success')
    }
    setSaving(false); setEditId(null); setCreating(false); reload()
  }

  const toggleActive = async (s: LeadSource) => {
    await (supabase as any).from('lead_sources').update({ is_active: !s.is_active }).eq('id', s.id)
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Zap size={20} className="text-[#D0021B]" /> Lead Sources
        </h3>
        <button onClick={startCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#D0021B] text-white rounded-lg text-sm font-medium hover:bg-[#B0011A] transition-all">
          <Plus size={14} /> Add Source
        </button>
      </div>

      {(creating || editId) && (
        <div className={GLASS_CARD} style={GLASS_BG}>
          <h4 className="text-sm font-semibold text-white mb-4">{creating ? 'Create New Source' : 'Edit Source'}</h4>
          <div className="flex flex-wrap items-end gap-4">
            <FormField label="Name *">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D0021B]/50"
                placeholder="Source name" />
            </FormField>
            <label className="flex items-center gap-2 cursor-pointer pb-1">
              <button onClick={() => setForm({ ...form, is_active: !form.is_active })}>
                {form.is_active ? <ToggleRight size={24} className="text-emerald-400" /> : <ToggleLeft size={24} className="text-gray-400" />}
              </button>
              <span className="text-sm text-gray-300">{form.is_active ? 'Active' : 'Inactive'}</span>
            </label>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-[#D0021B] text-white rounded-lg text-sm font-medium hover:bg-[#B0011A] disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setEditId(null); setCreating(false) }} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      <div className={GLASS_CARD + ' overflow-hidden !p-0'} style={GLASS_BG}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={18} className="animate-spin text-gray-500 mr-2" /><span className="text-gray-500 text-sm">Loading...</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {['Name', 'Active', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sources.map(s => (
                <tr key={s.id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(s)}>
                      {s.is_active
                        ? <span className="inline-flex items-center gap-1 text-emerald-400 text-xs"><Check size={12} /> Active</span>
                        : <span className="inline-flex items-center gap-1 text-gray-500 text-xs"><X size={12} /> Inactive</span>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-gray-400 hover:text-blue-400">
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {sources.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-12 text-center text-gray-500">No sources yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ── LEAD COMPANY CRUD TAB ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
function LeadCompanyCRUD({
  companies, loading, showToast, reload,
}: { companies: LeadCompany[]; loading: boolean; showToast: (m: string, t?: any) => void; reload: () => void }) {
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', is_active: true })
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const startEdit = (c: LeadCompany) => { setEditId(c.id); setForm({ name: c.name, is_active: c.is_active }); setCreating(false) }
  const startCreate = () => { setEditId(null); setCreating(true); setForm({ name: '', is_active: true }) }

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Name is required', 'error'); return }
    setSaving(true)
    if (creating) {
      const { error } = await (supabase as any).from('lead_companies').insert({ ...form })
      if (error) { showToast('Failed to create company: ' + error.message, 'error'); setSaving(false); return }
      showToast('Company created', 'success')
    } else if (editId) {
      const { error } = await (supabase as any).from('lead_companies').update({ ...form }).eq('id', editId)
      if (error) { showToast('Failed to update company: ' + error.message, 'error'); setSaving(false); return }
      showToast('Company updated', 'success')
    }
    setSaving(false); setEditId(null); setCreating(false); reload()
  }

  const toggleActive = async (c: LeadCompany) => {
    await (supabase as any).from('lead_companies').update({ is_active: !c.is_active }).eq('id', c.id)
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Building2 size={20} className="text-[#D0021B]" /> Lead Companies
        </h3>
        <button onClick={startCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#D0021B] text-white rounded-lg text-sm font-medium hover:bg-[#B0011A] transition-all">
          <Plus size={14} /> Add Company
        </button>
      </div>

      {(creating || editId) && (
        <div className={GLASS_CARD} style={GLASS_BG}>
          <h4 className="text-sm font-semibold text-white mb-4">{creating ? 'Create New Company' : 'Edit Company'}</h4>
          <div className="flex flex-wrap items-end gap-4">
            <FormField label="Name *">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D0021B]/50"
                placeholder="Company name" />
            </FormField>
            <label className="flex items-center gap-2 cursor-pointer pb-1">
              <button onClick={() => setForm({ ...form, is_active: !form.is_active })}>
                {form.is_active ? <ToggleRight size={24} className="text-emerald-400" /> : <ToggleLeft size={24} className="text-gray-400" />}
              </button>
              <span className="text-sm text-gray-300">{form.is_active ? 'Active' : 'Inactive'}</span>
            </label>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-[#D0021B] text-white rounded-lg text-sm font-medium hover:bg-[#B0011A] disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setEditId(null); setCreating(false) }} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      <div className={GLASS_CARD + ' overflow-hidden !p-0'} style={GLASS_BG}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={18} className="animate-spin text-gray-500 mr-2" /><span className="text-gray-500 text-sm">Loading...</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {['Name', 'Active', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map(c => (
                <tr key={c.id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(c)}>
                      {c.is_active
                        ? <span className="inline-flex items-center gap-1 text-emerald-400 text-xs"><Check size={12} /> Active</span>
                        : <span className="inline-flex items-center gap-1 text-gray-500 text-xs"><X size={12} /> Inactive</span>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-gray-400 hover:text-blue-400">
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-12 text-center text-gray-500">No companies yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ── BULK UPLOAD TAB ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
function BulkUploadTab({
  statuses, sources, companies, leads, showToast, reload, scope, currentUserId,
}: {
  statuses: LeadStatus[]; sources: LeadSource[]; companies: LeadCompany[];
  leads: Lead[];
  showToast: (m: string, t?: any) => void; reload: () => void;
  scope: string; currentUserId?: string;
}) {
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [errors, setErrors] = useState<Record<number, string[]>>({})
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  const expectedCols = ['Name', 'Email', 'Phone', 'Source', 'Status', 'Company', 'Income Bracket', 'Planning', 'Notes']

  const existingPhones = useMemo(() => new Set(leads.map(l => l.phone)), [leads])
  const existingEmails = useMemo(() => new Set(leads.map(l => l.email?.toLowerCase())), [leads])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setUploaded(false)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (!text) return
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      if (lines.length < 2) { showToast('File must have headers and at least one data row', 'error'); return }

      const headers = parseCSVLine(lines[0])
      const dataRows: Record<string, string>[] = []
      const rowErrors: Record<number, string[]> = {}
      const seenPhones = new Set<string>()
      const seenEmails = new Set<string>()

      for (let i = 1; i < lines.length; i++) {
        const vals = parseCSVLine(lines[i])
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => { row[h.trim()] = (vals[idx] || '').trim() })
        dataRows.push(row)

        const errs: string[] = []
        const phone = row['Phone'] || ''
        const email = (row['Email'] || '').toLowerCase()
        const name = row['Name'] || ''

        if (!name) errs.push('Name is required')
        // Email is optional for bulk upload (Bug #4)
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Invalid email format')
        if (!phone) errs.push('Phone is required')
        else if (!/^\d{10}$/.test(phone)) errs.push('Phone must be 10 digits')

        if (phone && existingPhones.has(phone)) errs.push('Phone already exists in DB')
        if (email && existingEmails.has(email)) errs.push('Email already exists in DB')
        if (phone && seenPhones.has(phone)) errs.push('Duplicate phone in file')
        if (email && seenEmails.has(email)) errs.push('Duplicate email in file')

        if (phone) seenPhones.add(phone)
        if (email) seenEmails.add(email)

        if (errs.length > 0) rowErrors[i - 1] = errs
      }

      setRows(dataRows)
      setErrors(rowErrors)
    }
    reader.readAsText(file)
  }

  const validRows = useMemo(() => rows.filter((_, i) => !errors[i]), [rows, errors])

  const handleUpload = async () => {
    if (validRows.length === 0) { showToast('No valid rows to upload', 'error'); return }
    // Bug #5: Confirmation before bulk upload
    if (!window.confirm(`Are you sure you want to upload ${validRows.length} lead(s)? This action cannot be undone.`)) return
    setUploading(true)

    const sourceNameMap = Object.fromEntries(sources.map(s => [s.name.toLowerCase(), s]))
    const statusNameMap = Object.fromEntries(statuses.map(s => [s.name.toLowerCase(), s]))
    const companyNameMap = Object.fromEntries(companies.map(c => [c.name.toLowerCase(), c]))

    const payload = validRows.map(r => {
      const matchedSource = sourceNameMap[(r['Source'] || '').toLowerCase()]
      const matchedStatus = statusNameMap[(r['Status'] || '').toLowerCase()]
      const matchedCompany = companyNameMap[(r['Company'] || '').toLowerCase()]
      return {
        name: r['Name'] || '',
        email: r['Email'] || '',
        phone: r['Phone'] || '',
        source: matchedSource ? matchedSource.name.toLowerCase().replace(/\s+/g, '-') : null,
        stage: matchedStatus ? matchedStatus.name.toLowerCase().replace(/\s+/g, '-') : 'new',
        lead_status_name: matchedStatus?.name || null,
        company_name: matchedCompany?.name || null,
        company_id: matchedCompany?.id || null,
        income_bracket: r['Income Bracket'] || null,
        planning: r['Planning'] || null,
        notes: r['Notes'] || null,
        assigned_to: scope === 'irm' && currentUserId ? currentUserId : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    // Insert in batches of 50
    let successCount = 0
    for (let i = 0; i < payload.length; i += 50) {
      const batch = payload.slice(i, i + 50)
      const { error } = await (supabase as any).from('leads').insert(batch)
      if (error) { showToast(`Batch insert failed: ${error.message}`, 'error'); setUploading(false); return }
      successCount += batch.length
    }

    setUploading(false)
    setUploaded(true)
    showToast(`${successCount} leads uploaded successfully`, 'success')
    reload()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Upload size={20} className="text-[#D0021B]" /> Bulk Upload Leads
      </h3>

      <div className={GLASS_CARD} style={GLASS_BG}>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-2">Upload a CSV file with the following columns:</p>
            <div className="flex flex-wrap gap-2">
              {expectedCols.map(c => (
                <span key={c} className="px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded text-[10px] text-gray-300 font-mono">{c}</span>
              ))}
            </div>
          </div>

          {/* Bug #5: Download template button */}
          <button
            onClick={() => {
              const csv = expectedCols.join(',') + '\nJohn Doe,john@example.com,9876543210,website,new,Company Name,50L-1Cr,Short Term,Notes here'
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'lead_upload_template.csv'; a.click()
              URL.revokeObjectURL(url)
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg text-xs text-gray-300 hover:bg-white/[0.10] transition-all"
          >
            <Download size={14} /> Download Template
          </button>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-sm text-gray-300 hover:bg-white/[0.10] cursor-pointer transition-all">
              <Upload size={14} />
              {fileName || 'Choose CSV file'}
              <input type="file" accept=".csv,.xlsx" onChange={handleFile} className="hidden" />
            </label>
            {rows.length > 0 && (
              <span className="text-xs text-gray-500">
                {rows.length} rows parsed | {validRows.length} valid | {Object.keys(errors).length} with errors
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Preview table */}
      {rows.length > 0 && (
        <div className={GLASS_CARD + ' overflow-hidden !p-0'} style={GLASS_BG}>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] sticky top-0">
                  <th className="px-3 py-2 text-left text-[10px] uppercase text-gray-500 font-semibold">#</th>
                  {expectedCols.map(c => (
                    <th key={c} className="px-3 py-2 text-left text-[10px] uppercase text-gray-500 font-semibold whitespace-nowrap">{c}</th>
                  ))}
                  <th className="px-3 py-2 text-left text-[10px] uppercase text-gray-500 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const hasErr = !!errors[i]
                  return (
                    <tr key={i} className={`border-b border-white/[0.04] ${hasErr ? 'bg-red-500/[0.05]' : 'hover:bg-white/[0.03]'}`}>
                      <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                      {expectedCols.map(c => (
                        <td key={c} className="px-3 py-2 text-gray-300 max-w-[150px] truncate">{row[c] || '-'}</td>
                      ))}
                      <td className="px-3 py-2">
                        {hasErr ? (
                          <div className="flex flex-col gap-0.5">
                            {errors[i].map((e, j) => (
                              <span key={j} className="text-[10px] text-red-400 flex items-center gap-1">
                                <AlertTriangle size={10} /> {e}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1"><Check size={10} /> Valid</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Upload button */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <span className="text-xs text-gray-500">
              {validRows.length} valid rows ready for upload
            </span>
            {uploaded ? (
              <span className="text-sm text-emerald-400 flex items-center gap-1"><Check size={14} /> Upload complete!</span>
            ) : (
              <button onClick={handleUpload} disabled={uploading || validRows.length === 0}
                className="px-5 py-2 bg-[#D0021B] text-white rounded-lg text-sm font-medium hover:bg-[#B0011A] disabled:opacity-50 transition-all flex items-center gap-2">
                {uploading ? <><RefreshCw size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Upload {validRows.length} Leads</>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ── SHARED UTILITY COMPONENTS ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 font-medium">{label}</label>
      {children}
      {error && <p className="text-[10px] text-red-400 mt-0.5">{error}</p>}
    </div>
  )
}

function ConfirmModal({
  title, message, onConfirm, onCancel,
}: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#111] shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-sm text-gray-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CSV Parser ───────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}

// ── Download helper ──────────────────────────────────────────────
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
