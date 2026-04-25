'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Users, UserPlus, Eye, Phone, Mail, Calendar, IndianRupee,
  ShieldCheck, AlertTriangle, FileText, Filter, CheckCircle2,
  XCircle, Clock, MoreHorizontal, ArrowUpRight, ChevronRight,
  Search, UserCircle, FileSearch, PieChart, Activity, Building2, Upload, Trash2, KeyRound,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge, { getKYCBadgeVariant, getAccountBadgeVariant } from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminEmptyState from '../shared/AdminEmptyState'
import AdminKPICard from '../shared/AdminKPICard'
import { fetchClients, fetchKYCDocuments, fetchKYCByClient, fetchClientKYCDetails, approveKYCStep, rejectKYCStep, approveClientKYC, rejectClientKYC, deleteUserComplete, deleteClientSafe, deleteClientKYCSafe } from '@/lib/supabase/adminDataService'
import { getActiveRMs, assignRMToClient, type ActiveRM } from '@/lib/supabase/employeeService'
import { formatINR, formatDate } from '@/lib/admin/adminHooks'
import type { Client, KYCDocument, KYCStatus } from '@/lib/admin/adminTypes'
import UploadWithFolderPicker from '@/components/shared/UploadWithFolderPicker'
import AdminAddKYCModal from './AdminAddKYCModal'
import PasswordResetModal, { type PasswordResetTarget } from '../shared/PasswordResetModal'
import { supabase } from '@/lib/supabase/client'

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
  // Add KYC on behalf of an existing client created without KYC.
  // addKYCTarget holds the client + resolved user_id (looked up on open).
  const [addKYCTarget, setAddKYCTarget] = useState<{ client: Client; userId: string } | null>(null)
  const [resolvingKYCTarget, setResolvingKYCTarget] = useState(false)

  const [clients, setClients] = useState<any[]>([])
  const [kycDocs, setKycDocs] = useState<any[]>([])
  const [kycByClient, setKycByClient] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRMs, setActiveRMs] = useState<ActiveRM[]>([])
  const [assigningRM, setAssigningRM] = useState(false)
  // Password-reset target. Holds the auth user_id once resolved (clients.user_id),
  // resolved lazily on click so the list query stays untouched.
  const [resetTarget, setResetTarget] = useState<PasswordResetTarget | null>(null)
  const [resolvingResetTarget, setResolvingResetTarget] = useState(false)

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

  // ── Delete client (safe) — blocks approved KYC and approved investments.
  const handleDeleteClient = useCallback(async (client: Client) => {
    if (!window.confirm(`Delete client "${client.name}"? This cannot be undone.`)) return
    const res = await deleteClientSafe(client.id, (client as any).user_id || null)
    if (res.ok) {
      showToast(`Client "${client.name}" deleted`, 'success')
      if (selectedClient?.id === client.id) { setProfileModalOpen(false); setSelectedClient(null) }
      loadData()
    } else {
      showToast(res.error || 'Failed to delete client', 'error')
    }
  }, [selectedClient, showToast, loadData])

  // ── Delete KYC submission — blocks when already approved/verified.
  const handleDeleteKYC = useCallback(async (row: { clientId: string; clientName: string; overallStatus: string }) => {
    if (row.overallStatus === 'approved' || row.overallStatus === 'verified') {
      showToast('KYC is approved and cannot be deleted.', 'warning')
      return
    }
    if (!window.confirm(`Delete KYC submission for "${row.clientName}"? The client will need to resubmit.`)) return
    const res = await deleteClientKYCSafe(row.clientId)
    if (res.ok) {
      showToast(`KYC deleted for ${row.clientName}`, 'success')
      loadData()
    } else {
      showToast(res.error || 'Failed to delete KYC', 'error')
    }
  }, [showToast, loadData])

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

  // ── Open Password Reset modal. Resolve clients.user_id (auth.users.id)
  //    so the Netlify function can target the correct auth user. Falls back
  //    to email if no user_id is linked yet (legacy/imported clients).
  const openResetForClient = useCallback(async (client: Client) => {
    if (!client.email && !(client as any).user_id) {
      showToast('This client has no email or auth link — cannot reset.', 'error')
      return
    }
    setResolvingResetTarget(true)
    try {
      let userId: string | null = (client as any).user_id || null
      if (!userId) {
        const { data } = await (supabase
          .from('clients')
          .select('user_id')
          .eq('id', client.id)
          .maybeSingle() as any)
        userId = data?.user_id || null
      }
      setResetTarget({ userId, email: client.email || '', name: client.name })
    } finally {
      setResolvingResetTarget(false)
    }
  }, [showToast])

  // ── Open Add-KYC modal for a client. Client.id is the clients.id UUID;
  // we need clients.user_id for the KYC rows (RLS uses auth.uid and the
  // KYC services want it to link the KYC back to the investor's auth user).
  const openAddKYCFor = useCallback(async (client: Client) => {
    setResolvingKYCTarget(true)
    try {
      const { data, error } = await (supabase
        .from('clients')
        .select('user_id')
        .eq('id', client.id)
        .maybeSingle() as any)
      if (error || !data?.user_id) {
        showToast('Could not locate the auth user for this client. Ask them to log in once, or contact support.', 'error')
        return
      }
      // Close the profile modal first to avoid stacked-modal backdrop issues,
      // then open the KYC modal on the next tick.
      setProfileModalOpen(false)
      setSelectedClient(null)
      setTimeout(() => setAddKYCTarget({ client, userId: data.user_id }), 60)
    } finally {
      setResolvingKYCTarget(false)
    }
  }, [showToast])

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
            onDeleteClient={handleDeleteClient}
            onResetPassword={openResetForClient}
            resolvingReset={resolvingResetTarget}
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
            onDeleteKYC={handleDeleteKYC}
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
                // Close the profile modal first, then open the edit modal on the
                // next tick so the portal/overflow transitions cleanly. Previously
                // the edit modal was opening behind the profile modal's lingering
                // backdrop (body.overflow=hidden carry-over + same z-index).
                setProfileModalOpen(false)
                setSelectedClient(null)
                setTimeout(() => setAddClientOpen(true), 60)
              }}>Edit Client</ModalButton>
            </>
          }
        >
          <ClientProfileContent client={selectedClient} activeRMs={activeRMs} onAssignRM={handleAssignRM} onAddKYC={openAddKYCFor} addingKYC={resolvingKYCTarget} />
        </AdminModal>
      )}

      {/* Add KYC Modal — opens when admin clicks "Add KYC" on a client
          profile whose kyc_status is still pending. Renders the same
          5-step wizard used during account creation. */}
      {addKYCTarget && (
        <AdminModal
          isOpen={!!addKYCTarget}
          onClose={() => setAddKYCTarget(null)}
          title={`Add KYC — ${addKYCTarget.client.name}`}
          subtitle="Complete Know-Your-Customer on behalf of this client"
          maxWidth="max-w-4xl"
          footer={
            <div className="flex items-center justify-end w-full">
              <ModalButton onClick={() => setAddKYCTarget(null)}>Close</ModalButton>
            </div>
          }
        >
          <AdminAddKYCModal
            clientId={addKYCTarget.client.id}
            userId={addKYCTarget.userId}
            initialName={addKYCTarget.client.name}
            initialEmail={addKYCTarget.client.email}
            initialPhone={addKYCTarget.client.phone}
            showToast={showToast}
            onComplete={() => { loadData() }}
          />
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
                // Clamp risk_profile to the DB CHECK constraint values — anything
                // outside conservative/moderate/aggressive falls back to moderate.
                const allowedRisk = ['conservative', 'moderate', 'aggressive']
                const sanitizedRisk = allowedRisk.includes(clientForm.risk_profile) ? clientForm.risk_profile : 'moderate'
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
                      risk_profile: sanitizedRisk,
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
                      risk_profile: sanitizedRisk,
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
                  {/* Values must match the DB CHECK constraint on clients.risk_profile */}
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
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

      {/* Password Reset Modal — admin chooses email-link or temp-password flow */}
      <PasswordResetModal
        isOpen={!!resetTarget}
        target={resetTarget}
        onClose={() => setResetTarget(null)}
        showToast={showToast}
      />
    </div>
  )
}

// ── Client List Tab ─────────────────────────────────────────────
function ClientListTab({
  clients,
  onViewClient,
  onDeleteClient,
  onResetPassword,
  resolvingReset,
  showToast,
}: {
  clients: any[]
  onViewClient: (c: Client) => void
  onDeleteClient: (c: Client) => void
  onResetPassword: (c: Client) => void
  resolvingReset: boolean
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
      width: '140px',
      render: (row) => {
        const ks = row.kycStatus as string
        const isApproved = ks === 'approved' || ks === 'verified'
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onViewClient(row) }}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"
              title="View"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onResetPassword(row) }}
              disabled={resolvingReset}
              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-gray-500 hover:text-amber-400 transition-colors disabled:opacity-50"
              title="Reset password"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            {isApproved ? (
              <span
                className="px-2 py-1 rounded-lg text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                title="Approved KYC cannot be deleted"
              >
                Approved
              </span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteClient(row) }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                title="Delete client"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      },
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
  onDeleteKYC,
}: {
  kycDocs: any[]
  kycByClient: any[]
  filter: KYCStatus | 'all'
  setFilter: (f: KYCStatus | 'all') => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  onRefresh?: () => void
  onDeleteKYC: (row: { clientId: string; clientName: string; overallStatus: string }) => void
}) {
  const [previewDoc, setPreviewDoc] = useState<any | null>(null)
  const [selectedClientKYC, setSelectedClientKYC] = useState<any | null>(null)
  const [clientKYCDetails, setClientKYCDetails] = useState<any | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  // KYC rejection modal — replaces window.prompt so the admin types a proper
  // manual reason that also renders in the investor dashboard banner.
  const [rejectTarget, setRejectTarget] = useState<{ clientId: string; clientName: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectSaving, setRejectSaving] = useState(false)
  const submitRejection = async () => {
    if (!rejectTarget) return
    const trimmed = rejectReason.trim()
    if (!trimmed) { showToast('Rejection reason is required', 'warning'); return }
    setRejectSaving(true)
    const ok = await rejectClientKYC(rejectTarget.clientId, 'admin', trimmed)
    setRejectSaving(false)
    if (ok) {
      showToast(`KYC rejected for ${rejectTarget.clientName}`, 'success')
      setRejectTarget(null); setRejectReason('')
      setSelectedClientKYC(null); setClientKYCDetails(null)
      onRefresh?.()
    } else {
      showToast('Rejection failed', 'error')
    }
  }

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
        return (
          <div className="flex flex-col gap-1 min-w-0">
            <AdminBadge label={row.overallStatus} variant={variant} dot />
            {row.overallStatus === 'rejected' && row.kyc_rejection_reason && (
              <span
                className="text-[10px] text-red-400 max-w-[220px] truncate cursor-help"
                title={row.kyc_rejection_reason}
              >
                Reason: {row.kyc_rejection_reason}
              </span>
            )}
          </div>
        )
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
      width: '220px',
      render: (row) => {
        const isApproved = row.overallStatus === 'approved' || row.overallStatus === 'verified'
        return (
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
                  onClick={(e) => {
                    e.stopPropagation()
                    setRejectReason('')
                    setRejectTarget({ clientId: row.clientId, clientName: row.clientName })
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                  title="Reject"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}
            {isApproved ? (
              <span
                className="px-2 py-1 rounded-lg text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                title="Approved KYC cannot be deleted"
              >
                Approved
              </span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteKYC(row) }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                title="Delete KYC"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      },
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
                  <ModalButton variant="danger" onClick={() => {
                    setRejectReason('')
                    setRejectTarget({ clientId: selectedClientKYC.clientId, clientName: selectedClientKYC.clientName })
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
              {/* Rejection banner — bug 2026-04-18 */}
              {selectedClientKYC?.kyc_rejection_reason && (
                <div className="border border-red-500/30 rounded-xl p-4 bg-red-500/5">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-red-400 mb-1">
                        Rejected{selectedClientKYC.kyc_rejected_at ? ` · ${formatDate(selectedClientKYC.kyc_rejected_at)}` : ''}
                      </p>
                      <p className="text-sm text-gray-200 whitespace-pre-wrap">{selectedClientKYC.kyc_rejection_reason}</p>
                    </div>
                  </div>
                </div>
              )}
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
                      <div key={n.id || i} className="border-b border-white/5 pb-2 last:border-0">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                          <div><span className="text-gray-500">Name:</span> <span className="text-white ml-1">{n.name}</span></div>
                          <div><span className="text-gray-500">DOB:</span> <span className="text-white ml-1">{n.dob || '-'}</span></div>
                          <div><span className="text-gray-500">Phone:</span> <span className="text-white ml-1">{n.phone || '-'}</span></div>
                          <div><span className="text-gray-500">Relation:</span> <span className="text-white ml-1">{n.relationship}</span></div>
                          <div><span className="text-gray-500">Share:</span> <span className="text-white ml-1">{n.percentage}%</span></div>
                        </div>
                        <div className="mt-1.5 text-xs">
                          <span className="text-gray-500">Proof:</span>{' '}
                          {n.proof_url ? (
                            <a href={n.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                              View document
                            </a>
                          ) : (
                            <span className="text-gray-600 italic ml-1">Not uploaded</span>
                          )}
                        </div>
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

      {/* KYC Rejection Modal — manual reason required.
          Bug 2026-04-18: replaces window.prompt so the admin types a proper
          reason that persists to clients.kyc_rejection_reason and renders
          in both the admin KYC row and the investor dashboard banner. */}
      {rejectTarget && (
        <AdminModal
          isOpen={!!rejectTarget}
          onClose={() => { if (!rejectSaving) { setRejectTarget(null); setRejectReason('') } }}
          title="Reject KYC"
          subtitle={rejectTarget.clientName}
          maxWidth="max-w-lg"
          footer={
            <>
              <ModalButton onClick={() => { setRejectTarget(null); setRejectReason('') }} disabled={rejectSaving}>Cancel</ModalButton>
              <ModalButton variant="danger" onClick={submitRejection} disabled={rejectSaving || !rejectReason.trim()}>
                {rejectSaving ? 'Rejecting…' : 'Reject KYC'}
              </ModalButton>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              The reason is saved on the client record and shown to the investor on their dashboard and in their notification. Be specific so they know exactly what to fix.
            </p>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-gray-500">Rejection reason <span className="text-red-400">*</span></label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              autoFocus
              placeholder="e.g. PAN card image is blurred — please upload a clearer scan. Also bank statement is older than 3 months."
              className="w-full px-3 py-2.5 text-sm text-gray-200 rounded-lg bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-red-500/50"
            />
            <p className="text-[11px] text-gray-500">{rejectReason.trim().length} / 500 characters</p>
          </div>
        </AdminModal>
      )}
    </div>
  )
}

// ── Client Analytics Tab ────────────────────────────────────────
function ClientAnalyticsTab({ clients: _clients }: { clients: any[] }) {
  // Intentionally parked: a proper breakdown (risk profile, status,
  // AUM cohorts, retention) needs backing queries + charts that the
  // product team hasn't signed off yet. Show a clear Coming Soon state
  // instead of an inconsistent half-implementation.
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center mb-5">
        <PieChart className="w-8 h-8 text-brand-red" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Client Analytics — Coming Soon</h3>
      <p className="text-sm text-gray-400 max-w-md">
        Risk-profile breakdown, KYC status mix, AUM cohorts and retention insights
        will land here in the next release.
      </p>
    </div>
  )
}

// ── Client Profile Modal Content ────────────────────────────────
function ClientProfileContent({ client, activeRMs, onAssignRM, onAddKYC, addingKYC }: { client: Client; activeRMs: ActiveRM[]; onAssignRM: (clientId: string, rmStaffId: string) => void; onAddKYC?: (client: Client) => void; addingKYC?: boolean }) {
  const returns = client.investedAmount > 0
    ? ((client.currentValue - client.investedAmount) / client.investedAmount * 100).toFixed(1)
    : '0'

  // KYC status handling (per product spec):
  // - 'pending'     → Not started. Show "Add KYC" button.
  // - 'submitted' / 'under-review' → Show "KYC Submitted" badge, no action.
  // - 'approved' / 'verified-ish' → Show "KYC Completed" badge.
  // - 'rejected'    → Existing reject flow handles it; no "Add KYC" here
  //                   to avoid creating a duplicate entry (business rule:
  //                   "Once KYC is submitted, prevent duplicate creation").
  const kycNotStarted = client.kycStatus === 'pending'
  const kycInReview = client.kycStatus === 'submitted' || client.kycStatus === 'under-review'
  const kycCompleted = client.kycStatus === 'approved'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-red/40 to-purple-500/40 flex items-center justify-center text-lg font-bold text-white">
          {client.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <AdminBadge
              label={kycNotStarted ? 'KYC not started' : kycInReview ? 'KYC Submitted' : kycCompleted ? 'KYC Completed' : client.kycStatus.replace('-', ' ')}
              variant={getKYCBadgeVariant(client.kycStatus)}
              dot
            />
            <AdminBadge label={client.accountStatus} variant={getAccountBadgeVariant(client.accountStatus)} />
            <AdminBadge label={client.riskProfile} variant={
              client.riskProfile === 'conservative' ? 'success' :
              client.riskProfile === 'moderate' ? 'info' :
              client.riskProfile === 'aggressive' ? 'warning' : 'error'
            } />
          </div>
        </div>
        {/* Add KYC — only when KYC has not been started. Once submitted,
            hide the button to prevent duplicate KYC creation per spec. */}
        {kycNotStarted && onAddKYC && (
          <button
            type="button"
            onClick={() => onAddKYC(client)}
            disabled={addingKYC}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-red/20 border border-brand-red/30 text-white hover:bg-brand-red/30 disabled:opacity-50 whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4" />
            {addingKYC ? 'Opening…' : 'Add KYC'}
          </button>
        )}
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
            value=""
            onChange={(e) => {
              if (e.target.value && client.id) {
                onAssignRM(client.id, e.target.value)
                // Reset to placeholder so the same row can be reassigned again
                e.target.value = ''
              }
            }}
          >
            <option value="" className="bg-neutral-900">— Reassign RM —</option>
            {activeRMs.length === 0 && (
              <option value="" disabled className="bg-neutral-900">No active RMs — add one in People & HR</option>
            )}
            {activeRMs.map((rm: ActiveRM) => (
              <option key={rm.staff_id} value={rm.staff_id} className="bg-neutral-900">
                {rm.full_name} — {rm.designation} ({rm.client_count} clients)
              </option>
            ))}
          </select>
          <p className="text-[10px] text-gray-600 mt-1">
            Need a new staff member?{' '}
            <a
              href="/admin/employees"
              className="text-blue-400 hover:text-blue-300 underline"
              onClick={(e) => { e.preventDefault(); window.location.href = '/admin/employees' }}
            >
              Add Employee in People &amp; HR →
            </a>
          </p>
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
