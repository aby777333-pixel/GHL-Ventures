'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Users, UserPlus, Eye, Phone, Mail, Calendar, IndianRupee,
  ShieldCheck, AlertTriangle, FileText, Filter, CheckCircle2,
  XCircle, Clock, MoreHorizontal, ArrowUpRight, ChevronRight,
  Search, UserCircle, FileSearch, PieChart, Activity, Building2, Upload,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge, { getKYCBadgeVariant, getAccountBadgeVariant } from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminEmptyState from '../shared/AdminEmptyState'
import AdminKPICard from '../shared/AdminKPICard'
import { fetchClients, fetchKYCDocuments, fetchKYCByClient, fetchClientKYCDetails, approveKYCStep, rejectKYCStep, approveClientKYC, rejectClientKYC, deleteUserComplete } from '@/lib/supabase/adminDataService'
import { getActiveRMs, assignRMToClient, type ActiveRM } from '@/lib/supabase/employeeService'
import { formatINR, formatDate } from '@/lib/admin/adminHooks'
import type { Client, KYCDocument, KYCStatus } from '@/lib/admin/adminTypes'
import UploadWithFolderPicker from '@/components/shared/UploadWithFolderPicker'

// ── Sub-tabs ─────────────────────────────────────────────────────
const CLIENT_TABS = [
  { id: 'list', label: 'Client List', icon: Users },
  { id: 'kyc-queue', label: 'KYC Queue', icon: ShieldCheck },
  { id: 'analytics', label: 'Client Analytics', icon: PieChart },
] as const

type ClientTab = typeof CLIENT_TABS[number]['id']

interface ClientModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function ClientModule({ subTab, navigate, showToast }: ClientModuleProps) {
  const activeTab = (CLIENT_TABS.some(t => t.id === subTab) ? subTab : 'list') as ClientTab
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [kycFilter, setKycFilter] = useState<KYCStatus | 'all'>('all')
  const [addClientOpen, setAddClientOpen] = useState(false)
  const [folderPickerOpen, setFolderPickerOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clientForm, setClientForm] = useState({ full_name: '', email: '', phone: '', pan: '', risk_profile: 'moderate', assigned_rm: '', total_invested: '' })

  const [clients, setClients] = useState<any[]>([])
  const [kycDocs, setKycDocs] = useState<any[]>([])
  const [kycByClient, setKycByClient] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRMs, setActiveRMs] = useState<ActiveRM[]>([])
  const [assigningRM, setAssigningRM] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [c, k, byClient, rms] = await Promise.all([fetchClients(), fetchKYCDocuments(), fetchKYCByClient(), getActiveRMs()])
    setClients(c)
    setKycDocs(k)
    setKycByClient(byClient)
    setActiveRMs(rms)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleAssignRM = async (clientId: string, rmStaffId: string) => {
    setAssigningRM(true)
    const result = await assignRMToClient(clientId, rmStaffId)
    setAssigningRM(false)
    if (result.success) {
      showToast('Relationship Manager assigned successfully', 'success')
      loadData() // Refresh client data
    } else {
      showToast(result.error || 'Failed to assign RM', 'error')
    }
  }

  // ── KPIs ──────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const active = clients.filter(c => c.accountStatus === 'active').length
    const totalAUM = clients.reduce((s, c) => s + c.aum, 0)
    const pendingKYC = kycDocs.filter(d => d.status === 'pending' || d.status === 'under-review' || d.status === 'submitted').length
    const avgAUM = active > 0 ? totalAUM / active : 0
    return { total: clients.length, active, totalAUM, pendingKYC, avgAUM }
  }, [clients, kycDocs])

  // ── Tab Navigation ────────────────────────────────────────────
  const handleTabClick = (tabId: string) => {
    navigate(tabId === 'list' ? 'clients' : `clients/${tabId}`)
  }

  return (
    <div className="space-y-6 admin-section-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Client Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage investors, KYC verification, and client relationships</p>
        </div>
        <button
          onClick={() => { setEditingClient(null); setClientForm({ full_name: '', email: '', phone: '', pan: '', risk_profile: 'moderate', assigned_rm: '', total_invested: '' }); setAddClientOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors self-start admin-btn-press"
        >
          <UserPlus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <AdminKPICard title="Total Clients" value={kpis.total} icon={Users} color="#3B82F6" delay={0} />
        <AdminKPICard title="Active Clients" value={kpis.active} icon={CheckCircle2} color="#10B981" delay={50} />
        <AdminKPICard title="Total AUM" value={formatINR(kpis.totalAUM)} icon={IndianRupee} color="#DC2626" delay={100} />
        <AdminKPICard title="Avg AUM / Client" value={formatINR(kpis.avgAUM)} icon={ArrowUpRight} color="#8B5CF6" delay={150} />
        <AdminKPICard title="Pending KYC" value={kpis.pendingKYC} icon={AlertTriangle} color="#F59E0B" delay={200} />
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
        {CLIENT_TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-brand-red/20 text-white border border-brand-red/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="admin-tab-switch">
        {activeTab === 'list' && (
          <ClientListTab
            clients={clients}
            onViewClient={(c) => { setSelectedClient(c); setProfileModalOpen(true) }}
            showToast={showToast}
          />
        )}
        {activeTab === 'kyc-queue' && (
          <KYCQueueTab
            kycDocs={kycDocs}
            kycByClient={kycByClient}
            filter={kycFilter}
            setFilter={setKycFilter}
            showToast={showToast}
            onRefresh={loadData}
          />
        )}
        {activeTab === 'analytics' && <ClientAnalyticsTab clients={clients} />}
      </div>

      {/* Client Profile Modal */}
      {selectedClient && (
        <AdminModal
          isOpen={profileModalOpen}
          onClose={() => { setProfileModalOpen(false); setSelectedClient(null) }}
          title={selectedClient.name}
          subtitle={`${selectedClient.id} • Joined ${formatDate(selectedClient.joinDate)}`}
          maxWidth="max-w-3xl"
          footer={
            <>
              <ModalButton onClick={() => { setProfileModalOpen(false); setSelectedClient(null) }}>Close</ModalButton>
              <ModalButton variant="primary" onClick={() => {
                const c = selectedClient!
                setEditingClient(c)
                setClientForm({
                  full_name: c.name || '',
                  email: c.email || '',
                  phone: c.phone || '',
                  pan: (c as any).pan || '',
                  risk_profile: c.riskProfile || 'moderate',
                  assigned_rm: (c as any).assignedRMId || '',
                  total_invested: String(c.aum || ''),
                })
                setProfileModalOpen(false)
                setSelectedClient(null)
                setAddClientOpen(true)
              }}>Edit Client</ModalButton>
            </>
          }
        >
          <ClientProfileContent client={selectedClient} activeRMs={activeRMs} onAssignRM={handleAssignRM} />
        </AdminModal>
      )}

      {/* Add / Edit Client Modal */}
      {addClientOpen && (
        <AdminModal
          isOpen={addClientOpen}
          onClose={() => { setAddClientOpen(false); setEditingClient(null) }}
          title={editingClient ? 'Edit Client' : 'New Client'}
          subtitle={editingClient ? `Update ${editingClient.name}` : 'Register a new investment client'}
          maxWidth="max-w-xl"
          footer={
            <>
              <ModalButton onClick={() => setAddClientOpen(false)}>Cancel</ModalButton>
              <ModalButton variant="primary" onClick={async () => {
                if (!clientForm.full_name.trim() || !clientForm.email.trim()) { showToast('Name and email are required', 'info'); return }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                if (!emailRegex.test(clientForm.email.trim())) { showToast('Please enter a valid email address', 'error'); return }
                // Sanitize assigned_rm: send null if empty or non-UUID string like "Unassigned"
                const sanitizedRM = clientForm.assigned_rm && clientForm.assigned_rm !== 'Unassigned' && clientForm.assigned_rm !== 'Not assigned' ? clientForm.assigned_rm : null
                try {
                  if (editingClient) {
                    // Update existing client
                    const { supabase } = await import('@/lib/supabase/client')
                    const sb = supabase as any
                    const { error } = await sb.from('clients').update({
                      full_name: clientForm.full_name,
                      email: clientForm.email,
                      phone: clientForm.phone || null,
                      pan: clientForm.pan || null,
                      risk_profile: clientForm.risk_profile || 'moderate',
                      assigned_rm: sanitizedRM,
                      total_invested: parseFloat(clientForm.total_invested) || 0,
                    }).eq('id', editingClient.id)
                    if (error) throw error
                    setAddClientOpen(false)
                    setEditingClient(null)
                    setClientForm({ full_name: '', email: '', phone: '', pan: '', risk_profile: 'moderate', assigned_rm: '', total_invested: '' })
                    showToast(`Client ${clientForm.full_name} updated successfully`, 'success')
                    loadData()
                  } else {
                    // Create new client
                    const { insertRow } = await import('@/lib/supabase/adminDataService')
                    const clientCode = `GHL-C-${Date.now().toString(36).toUpperCase()}`
                    const result = await insertRow('clients', {
                      full_name: clientForm.full_name,
                      email: clientForm.email,
                      phone: clientForm.phone || null,
                      pan: clientForm.pan || null,
                      risk_profile: clientForm.risk_profile || 'moderate',
                      assigned_rm: sanitizedRM,
                      total_invested: parseFloat(clientForm.total_invested) || 0,
                      client_code: clientCode,
                      kyc_status: 'pending',
                      is_active: true,
                    })
                    if (result) {
                      setAddClientOpen(false)
                      setClientForm({ full_name: '', email: '', phone: '', pan: '', risk_profile: 'moderate', assigned_rm: '', total_invested: '' })
                      showToast(`Client ${clientForm.full_name} registered (${clientCode})`, 'success')
                      loadData()
                    } else {
                      showToast('Database error — check if email already exists or contact support.', 'error')
                    }
                  }
                } catch (err: any) {
                  console.error('[admin] Save client error:', err)
                  showToast(err?.message || 'Failed to save client', 'error')
                }
              }}>{editingClient ? 'Update Client' : 'Save Client'}</ModalButton>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name *</label>
                <input type="text" placeholder="Enter full name" value={clientForm.full_name} onChange={e => setClientForm(f => ({ ...f, full_name: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email *</label>
                <input type="email" placeholder="email@example.com" value={clientForm.email} onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone *</label>
                <input type="tel" placeholder="+91 98765 43210" value={clientForm.phone} onChange={e => setClientForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">PAN Number *</label>
                <input type="text" placeholder="ABCDE1234F" maxLength={10} value={clientForm.pan} onChange={e => setClientForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 uppercase" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Risk Profile</label>
                <select value={clientForm.risk_profile} onChange={e => setClientForm(f => ({ ...f, risk_profile: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20">
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                  <option value="speculative">Speculative</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Assigned RM</label>
                <select value={clientForm.assigned_rm} onChange={e => setClientForm(f => ({ ...f, assigned_rm: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20">
                  <option value="" className="bg-neutral-900">Auto-assign (least loaded)</option>
                  {activeRMs.map(rm => (
                    <option key={rm.staff_id} value={rm.staff_id} className="bg-neutral-900">
                      {rm.full_name} — {rm.designation} ({rm.client_count} clients)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Initial Investment Amount (₹)</label>
              <input type="number" placeholder="0" value={clientForm.total_invested} onChange={e => setClientForm(f => ({ ...f, total_invested: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Attach KYC / Documents</label>
              <button
                type="button"
                onClick={() => setFolderPickerOpen(true)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] border border-dashed border-white/[0.12] hover:bg-white/[0.08] hover:border-white/[0.2] transition-colors w-full justify-center"
              >
                <Upload className="w-4 h-4" />
                Upload KYC Documents & Images
              </button>
              <p className="text-[10px] text-gray-600 mt-1">PAN, Aadhaar, agreements — stored in File Repository &gt; Client Documents</p>
            </div>
          </div>
        </AdminModal>
      )}

      <UploadWithFolderPicker
        open={folderPickerOpen}
        onClose={() => setFolderPickerOpen(false)}
        defaultRoute="admin/clients"
        showToast={showToast as any}
        onUploadComplete={(results) => {
          const ok = results.filter(r => r.success).length
          if (ok > 0) showToast(`${ok} file(s) uploaded to Client Documents`, 'success')
        }}
        theme="dark"
        portal="admin"
      />
    </div>
  )
}

// ── Client List Tab ─────────────────────────────────────────────
function ClientListTab({
  clients,
  onViewClient,
  showToast,
}: {
  clients: any[]
  onViewClient: (c: Client) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  const columns: Column<Client>[] = [
    {
      key: 'name',
      label: 'Client',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-white">
            {row.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{row.name}</p>
            <p className="text-[11px] text-gray-500">{row.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'kycStatus',
      label: 'KYC',
      render: (row) => <AdminBadge label={row.kycStatus.replace('-', ' ')} variant={getKYCBadgeVariant(row.kycStatus)} dot />,
    },
    {
      key: 'accountStatus',
      label: 'Account',
      render: (row) => <AdminBadge label={row.accountStatus} variant={getAccountBadgeVariant(row.accountStatus)} />,
    },
    {
      key: 'aum',
      label: 'AUM',
      render: (row) => <span className="text-white font-medium">{formatINR(row.aum)}</span>,
    },
    {
      key: 'riskProfile',
      label: 'Risk Profile',
      render: (row) => (
        <span className={`text-xs font-medium capitalize ${
          row.riskProfile === 'conservative' ? 'text-emerald-400' :
          row.riskProfile === 'moderate' ? 'text-blue-400' :
          row.riskProfile === 'aggressive' ? 'text-amber-400' : 'text-red-400'
        }`}>
          {row.riskProfile}
        </span>
      ),
    },
    {
      key: 'assignedRM',
      label: 'Relationship Manager',
      render: (row) => <span className="text-xs text-gray-400">{row.assignedRM}</span>,
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      width: '60px',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); onViewClient(row) }}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <AdminGlass padding="p-4">
      <AdminDataTable<Client>
        columns={columns}
        data={clients}
        searchKeys={['name', 'email', 'id', 'pan', 'assignedRM']}
        searchPlaceholder="Search clients by name, ID, PAN..."
        onRowClick={onViewClient}
        exportable
        title="All Clients"
        emptyMessage="No clients found"
      />
    </AdminGlass>
  )
}

// ── KYC Queue Tab ───────────────────────────────────────────────
function KYCQueueTab({
  kycDocs,
  kycByClient,
  filter,
  setFilter,
  showToast,
  onRefresh,
}: {
  kycDocs: any[]
  kycByClient: any[]
  filter: KYCStatus | 'all'
  setFilter: (f: KYCStatus | 'all') => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  onRefresh?: () => void
}) {
  const [previewDoc, setPreviewDoc] = useState<any | null>(null)
  const [selectedClientKYC, setSelectedClientKYC] = useState<any | null>(null)
  const [clientKYCDetails, setClientKYCDetails] = useState<any | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // View detailed KYC for a client
  const handleViewClient = async (clientGroup: any) => {
    setSelectedClientKYC(clientGroup)
    setLoadingDetails(true)
    const details = await fetchClientKYCDetails(clientGroup.clientId)
    setClientKYCDetails(details)
    setLoadingDetails(false)
  }

  // Filter consolidated client rows
  const filteredClients = useMemo(() => {
    if (filter === 'all') return kycByClient
    if (filter === 'pending') return kycByClient.filter(g => g.overallStatus === 'pending' || g.overallStatus === 'submitted')
    return kycByClient.filter(g => g.overallStatus === filter)
  }, [filter, kycByClient])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: kycByClient.length }
    kycByClient.forEach(g => { counts[g.overallStatus] = (counts[g.overallStatus] || 0) + 1 })
    return counts
  }, [kycByClient])

  // Consolidated per-client columns (Bug #8 fix)
  const columns: Column<any>[] = [
    {
      key: 'clientName',
      label: 'Client',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.clientName}</p>
          <p className="text-[11px] text-gray-500 font-mono">{row.clientId?.slice(0, 8)}</p>
        </div>
      ),
    },
    {
      key: 'docs',
      label: 'KYC Steps',
      render: (row) => {
        const steps = row.docs?.length || 0
        const approved = row.docs?.filter((d: any) => d.status === 'approved').length || 0
        return <span className="text-xs text-gray-400">{approved}/{steps} steps completed</span>
      },
    },
    {
      key: 'overallStatus',
      label: 'Status',
      render: (row) => {
        const variant = row.overallStatus === 'submitted' ? 'warning' as const : getKYCBadgeVariant(row.overallStatus)
        return <AdminBadge label={row.overallStatus} variant={variant} dot />
      },
    },
    {
      key: 'uploadDate',
      label: 'Submitted',
      render: (row) => {
        const latestDate = row.docs?.map((d: any) => d.uploadDate).filter(Boolean).sort().pop()
        return <span className="text-xs text-gray-400">{formatDate(latestDate)}</span>
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      width: '180px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleViewClient(row) }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 hover:text-white text-xs transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          {(row.overallStatus === 'submitted' || row.overallStatus === 'pending') && (
            <>
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  const ok = await approveClientKYC(row.clientId, 'admin')
                  if (ok) { showToast(`KYC approved for ${row.clientName}`, 'success'); onRefresh?.() }
                  else showToast('Approval failed', 'error')
                }}
                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400 transition-colors"
                title="Approve All"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  const ok = await rejectClientKYC(row.clientId, 'admin')
                  if (ok) { showToast(`KYC rejected for ${row.clientName}`, 'success'); onRefresh?.() }
                  else showToast('Rejection failed', 'error')
                }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  const filters: { id: KYCStatus | 'all'; label: string }[] = [
    { id: 'all', label: `All (${statusCounts.all || 0})` },
    { id: 'pending', label: `Pending (${(statusCounts.pending || 0) + (statusCounts.submitted || 0)})` },
    { id: 'approved', label: `Approved (${statusCounts.approved || 0})` },
    { id: 'rejected', label: `Rejected (${statusCounts.rejected || 0})` },
  ]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === f.id
                ? 'bg-brand-red/20 text-white border-brand-red/30'
                : 'bg-white/[0.03] text-gray-500 border-white/[0.06] hover:bg-white/[0.06] hover:text-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Consolidated client list — one row per client */}
      <AdminGlass padding="p-4">
        <AdminDataTable<any>
          columns={columns}
          data={filteredClients}
          searchKeys={['clientName']}
          searchPlaceholder="Search clients..."
          emptyMessage="No KYC submissions match the selected filter"
        />
      </AdminGlass>

      {/* Detailed KYC View Modal — opens when "View" is clicked */}
      {selectedClientKYC && (
        <AdminModal
          isOpen={true}
          onClose={() => { setSelectedClientKYC(null); setClientKYCDetails(null) }}
          title={`KYC Details — ${selectedClientKYC.clientName}`}
          maxWidth="max-w-4xl"
          footer={
            <>
              {(selectedClientKYC.overallStatus === 'submitted' || selectedClientKYC.overallStatus === 'pending') && (
                <>
                  <ModalButton variant="primary" onClick={async () => {
                    const ok = await approveClientKYC(selectedClientKYC.clientId, 'admin')
                    if (ok) { showToast('KYC approved', 'success'); onRefresh?.() }
                    else showToast('Approval failed', 'error')
                    setSelectedClientKYC(null); setClientKYCDetails(null)
                  }}>Approve All</ModalButton>
                  <ModalButton variant="danger" onClick={async () => {
                    const ok = await rejectClientKYC(selectedClientKYC.clientId, 'admin')
                    if (ok) { showToast('KYC rejected', 'info'); onRefresh?.() }
                    else showToast('Rejection failed', 'error')
                    setSelectedClientKYC(null); setClientKYCDetails(null)
                  }}>Reject</ModalButton>
                </>
              )}
              <ModalButton onClick={() => { setSelectedClientKYC(null); setClientKYCDetails(null) }}>Close</ModalButton>
            </>
          }
        >
          {loadingDetails ? (
            <div className="text-center py-12 text-gray-400"><Clock className="w-8 h-8 mx-auto mb-2 animate-spin" /> Loading KYC details...</div>
          ) : clientKYCDetails ? (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Basic Details */}
              {clientKYCDetails.basic && (
                <div className="border border-white/[0.08] rounded-xl p-4 bg-black/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-white">Basic Details</h4>
                    <AdminBadge label={clientKYCDetails.basic.status || 'pending'} variant={clientKYCDetails.basic.status === 'submitted' ? 'warning' : getKYCBadgeVariant(clientKYCDetails.basic.status)} dot />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div><span className="text-gray-500">Name:</span> <span className="text-white ml-1">{clientKYCDetails.basic.investor_name}</span></div>
                    <div><span className="text-gray-500">Phone:</span> <span className="text-white ml-1">{clientKYCDetails.basic.phone}</span></div>
                    <div><span className="text-gray-500">Email:</span> <span className="text-white ml-1">{clientKYCDetails.basic.email}</span></div>
                    <div><span className="text-gray-500">Gender:</span> <span className="text-white ml-1">{clientKYCDetails.basic.gender}</span></div>
                    <div><span className="text-gray-500">Type:</span> <span className="text-white ml-1">{clientKYCDetails.basic.investor_type}</span></div>
                    <div><span className="text-gray-500">Resident:</span> <span className="text-white ml-1">{clientKYCDetails.basic.resident_type}</span></div>
                  </div>
                </div>
              )}
              {/* Identity Details */}
              {clientKYCDetails.identity && (
                <div className="border border-white/[0.08] rounded-xl p-4 bg-black/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-white">Identity Details</h4>
                    <AdminBadge label={clientKYCDetails.identity.status || 'pending'} variant={clientKYCDetails.identity.status === 'submitted' ? 'warning' : getKYCBadgeVariant(clientKYCDetails.identity.status)} dot />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div><span className="text-gray-500">PAN:</span> <span className="text-white ml-1">{clientKYCDetails.identity.pan_number || '-'}</span></div>
                    <div><span className="text-gray-500">Aadhaar:</span> <span className="text-white ml-1">{clientKYCDetails.identity.aadhar_number || '-'}</span></div>
                    <div><span className="text-gray-500">Name:</span> <span className="text-white ml-1">{clientKYCDetails.identity.name_on_document}</span></div>
                    <div><span className="text-gray-500">Father:</span> <span className="text-white ml-1">{clientKYCDetails.identity.father_name}</span></div>
                    <div><span className="text-gray-500">DOB:</span> <span className="text-white ml-1">{clientKYCDetails.identity.dob}</span></div>
                    <div><span className="text-gray-500">City:</span> <span className="text-white ml-1">{clientKYCDetails.identity.city}</span></div>
                    <div><span className="text-gray-500">State:</span> <span className="text-white ml-1">{clientKYCDetails.identity.state}</span></div>
                    <div><span className="text-gray-500">Pincode:</span> <span className="text-white ml-1">{clientKYCDetails.identity.pincode}</span></div>
                    <div className="col-span-2"><span className="text-gray-500">Address:</span> <span className="text-white ml-1">{clientKYCDetails.identity.address}</span></div>
                  </div>
                  <div className="flex gap-3 mt-3">
                    {clientKYCDetails.identity.aadhar_doc_url && <a href={clientKYCDetails.identity.aadhar_doc_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-red hover:underline inline-flex items-center gap-1"><Eye className="w-3 h-3" /> Aadhaar Doc</a>}
                    {clientKYCDetails.identity.pan_doc_url && <a href={clientKYCDetails.identity.pan_doc_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-red hover:underline inline-flex items-center gap-1"><Eye className="w-3 h-3" /> PAN Doc</a>}
                    {clientKYCDetails.identity.passport_doc_url && <a href={clientKYCDetails.identity.passport_doc_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-red hover:underline inline-flex items-center gap-1"><Eye className="w-3 h-3" /> Passport Doc</a>}
                  </div>
                </div>
              )}
              {/* Bank Details */}
              {clientKYCDetails.bank && (
                <div className="border border-white/[0.08] rounded-xl p-4 bg-black/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-white">Bank Details</h4>
                    <AdminBadge label={clientKYCDetails.bank.status || 'pending'} variant={clientKYCDetails.bank.status === 'submitted' ? 'warning' : getKYCBadgeVariant(clientKYCDetails.bank.status)} dot />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div><span className="text-gray-500">Holder:</span> <span className="text-white ml-1">{clientKYCDetails.bank.account_holder_name}</span></div>
                    <div><span className="text-gray-500">Bank:</span> <span className="text-white ml-1">{clientKYCDetails.bank.bank_name}</span></div>
                    <div><span className="text-gray-500">A/C No:</span> <span className="text-white ml-1">{clientKYCDetails.bank.account_number}</span></div>
                    <div><span className="text-gray-500">Type:</span> <span className="text-white ml-1">{clientKYCDetails.bank.account_type}</span></div>
                    <div><span className="text-gray-500">IFSC:</span> <span className="text-white ml-1">{clientKYCDetails.bank.ifsc_code || '-'}</span></div>
                    <div><span className="text-gray-500">Branch:</span> <span className="text-white ml-1">{clientKYCDetails.bank.branch_name || '-'}</span></div>
                  </div>
                  {clientKYCDetails.bank.bank_doc_url && <a href={clientKYCDetails.bank.bank_doc_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-red hover:underline inline-flex items-center gap-1 mt-3"><Eye className="w-3 h-3" /> Bank Proof</a>}
                </div>
              )}
              {/* Demat Details */}
              {clientKYCDetails.demat && (
                <div className="border border-white/[0.08] rounded-xl p-4 bg-black/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-white">Demat Account</h4>
                    <AdminBadge label={clientKYCDetails.demat.status || 'pending'} variant={clientKYCDetails.demat.status === 'skipped' ? 'info' : clientKYCDetails.demat.status === 'submitted' ? 'warning' : getKYCBadgeVariant(clientKYCDetails.demat.status)} dot />
                  </div>
                  <div className="text-xs">
                    {clientKYCDetails.demat.skipped ? <span className="text-gray-400">Skipped — No demat account</span> :
                      <div><span className="text-gray-500">Demat No:</span> <span className="text-white ml-1">{clientKYCDetails.demat.demat_account_number}</span></div>}
                  </div>
                  {clientKYCDetails.demat.demat_doc_url && <a href={clientKYCDetails.demat.demat_doc_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-red hover:underline inline-flex items-center gap-1 mt-2"><Eye className="w-3 h-3" /> Demat Statement</a>}
                </div>
              )}
              {/* Nominees */}
              {clientKYCDetails.nominees && clientKYCDetails.nominees.length > 0 && (
                <div className="border border-white/[0.08] rounded-xl p-4 bg-black/20">
                  <h4 className="text-sm font-semibold text-white mb-3">Nominees ({clientKYCDetails.nominees.length})</h4>
                  <div className="space-y-2">
                    {clientKYCDetails.nominees.map((n: any, i: number) => (
                      <div key={n.id || i} className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs border-b border-white/5 pb-2 last:border-0">
                        <div><span className="text-gray-500">Name:</span> <span className="text-white ml-1">{n.name}</span></div>
                        <div><span className="text-gray-500">DOB:</span> <span className="text-white ml-1">{n.dob || '-'}</span></div>
                        <div><span className="text-gray-500">Phone:</span> <span className="text-white ml-1">{n.phone || '-'}</span></div>
                        <div><span className="text-gray-500">Relation:</span> <span className="text-white ml-1">{n.relationship}</span></div>
                        <div><span className="text-gray-500">Share:</span> <span className="text-white ml-1">{n.percentage}%</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No KYC data found</div>
          )}
        </AdminModal>
      )}

      {/* Old preview modal removed — replaced by consolidated per-client detail view above */}
    </div>
  )
}

// ── Client Analytics Tab ────────────────────────────────────────
function ClientAnalyticsTab({ clients }: { clients: any[] }) {
  const riskBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    clients.forEach(c => { counts[c.riskProfile] = (counts[c.riskProfile] || 0) + 1 })
    return counts
  }, [clients])

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    clients.forEach(c => { counts[c.accountStatus] = (counts[c.accountStatus] || 0) + 1 })
    return counts
  }, [clients])

  const topClients = useMemo(() =>
    [...clients].sort((a, b) => b.aum - a.aum).slice(0, 5),
  [clients])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Risk Profile Distribution */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-red" />
          Risk Profile Distribution
        </h3>
        <div className="space-y-3">
          {Object.entries(riskBreakdown).map(([profile, count]) => {
            const pct = Math.round((count / (clients.length || 1)) * 100)
            const color = profile === 'conservative' ? '#10B981' : profile === 'moderate' ? '#3B82F6' : profile === 'aggressive' ? '#F59E0B' : '#EF4444'
            return (
              <div key={profile}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400 capitalize">{profile}</span>
                  <span className="text-white font-medium">{count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            )
          })}
        </div>
      </AdminGlass>

      {/* Account Status */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <UserCircle className="w-4 h-4 text-brand-red" />
          Account Status
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(statusBreakdown).map(([status, count]) => (
            <div key={status} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <AdminBadge label={status} variant={getAccountBadgeVariant(status)} />
              <p className="text-xl font-bold text-white mt-2">{count}</p>
              <p className="text-[11px] text-gray-500">{Math.round((count / (clients.length || 1)) * 100)}% of total</p>
            </div>
          ))}
        </div>
      </AdminGlass>

      {/* Top Clients by AUM */}
      <AdminGlass className="lg:col-span-2">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-brand-red" />
          Top Clients by AUM
        </h3>
        <div className="space-y-2">
          {topClients.map((c, i) => {
            const maxAUM = topClients[0]?.aum || 1
            const pct = Math.round((c.aum / maxAUM) * 100)
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <span className="text-xs font-bold text-gray-600 w-6">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red/30 to-purple-500/30 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                  {c.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white truncate">{c.name}</span>
                    <span className="text-sm font-bold text-white ml-2">{formatINR(c.aum)}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-red to-red-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </AdminGlass>
    </div>
  )
}

// ── Client Profile Modal Content ────────────────────────────────
function ClientProfileContent({ client, activeRMs, onAssignRM }: { client: Client; activeRMs: ActiveRM[]; onAssignRM: (clientId: string, rmStaffId: string) => void }) {
  const returns = client.investedAmount > 0
    ? ((client.currentValue - client.investedAmount) / client.investedAmount * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-red/40 to-purple-500/40 flex items-center justify-center text-lg font-bold text-white">
          {client.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <AdminBadge label={client.kycStatus.replace('-', ' ')} variant={getKYCBadgeVariant(client.kycStatus)} dot />
            <AdminBadge label={client.accountStatus} variant={getAccountBadgeVariant(client.accountStatus)} />
            <AdminBadge label={client.riskProfile} variant={
              client.riskProfile === 'conservative' ? 'success' :
              client.riskProfile === 'moderate' ? 'info' :
              client.riskProfile === 'aggressive' ? 'warning' : 'error'
            } />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
          <Mail className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-300 truncate">{client.email}</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
          <Phone className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-300">{client.phone}</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-300">PAN: {client.pan}</span>
        </div>
      </div>

      {/* Financial Summary */}
      <div>
        <h4 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Financial Summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total AUM', value: formatINR(client.aum), color: 'text-white' },
            { label: 'Invested', value: formatINR(client.investedAmount), color: 'text-gray-300' },
            { label: 'Current Value', value: formatINR(client.currentValue), color: 'text-white' },
            { label: 'Returns', value: `${Number(returns) >= 0 ? '+' : ''}${returns}%`, color: Number(returns) >= 0 ? 'text-emerald-400' : 'text-red-400' },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">{item.label}</p>
              <p className={`text-lg font-bold mt-1 ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="col-span-2">
          <span className="text-gray-500">Relationship Manager</span>
          <p className="text-gray-300 mt-0.5 mb-1.5">{client.assignedRM || 'Not assigned'}</p>
          <select
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-brand-red/40"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value && client.id) {
                onAssignRM(client.id, e.target.value)
              }
            }}
          >
            <option value="" className="bg-neutral-900">— Reassign RM —</option>
            {activeRMs.map((rm: ActiveRM) => (
              <option key={rm.staff_id} value={rm.staff_id} className="bg-neutral-900">
                {rm.full_name} — {rm.designation} ({rm.client_count} clients)
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="text-gray-500">Joined</span>
          <p className="text-gray-300 mt-0.5">{formatDate(client.joinDate)}</p>
        </div>
        <div>
          <span className="text-gray-500">Last Active</span>
          <p className="text-gray-300 mt-0.5">{formatDate(client.lastActive)}</p>
        </div>
        <div>
          <span className="text-gray-500">Risk Profile</span>
          <p className="text-gray-300 mt-0.5 capitalize">{client.riskProfile}</p>
        </div>
      </div>
    </div>
  )
}
