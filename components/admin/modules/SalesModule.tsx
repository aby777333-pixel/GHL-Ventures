'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  TrendingUp, Users, Target, IndianRupee, Phone, Mail,
  Calendar, ArrowUpRight, ArrowDownRight, Eye, MoreHorizontal,
  Trophy, Zap, Filter, Plus, Clock, CheckCircle2, XCircle,
  Star, BarChart3, Percent, DollarSign, UserPlus, Upload,
  ArrowRightLeft, Loader2, RefreshCw, Trash2, Check, Square, CheckSquare, X, ChevronDown,
  Truck, Pencil, Hash, Search, Download,
} from 'lucide-react'
import DocumentTrackingModal from './DocumentTrackingModal'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import AdminCRUDPlaceholder from '../shared/AdminCRUDPlaceholder'
import LeadManagementModule from '../../shared/LeadManagementModule'
import ReferralsTab from './ReferralsTab'
import StartupApplicationsTab from './StartupApplicationsTab'
import NRIConsultationsTab from './NRIConsultationsTab'
import CreateAccountTab from './CreateAccountTab'

// Wrapper to render LeadManagementModule for specific sub-tabs within Sales
function LeadMgmtWrapper({ subTab, navigate, showToast }: { subTab: string; navigate: (p: string) => void; showToast: (m: string, t?: any) => void }) {
  return <LeadManagementModule subTab={subTab} navigate={navigate} showToast={showToast} scope="admin" basePath="/admin/sales" />
}
import { formatINR, formatDate } from '@/lib/admin/adminHooks'
import type { Lead, LeadStage, LeadSource, Commission } from '@/lib/admin/adminTypes'
import UploadWithFolderPicker from '@/components/shared/UploadWithFolderPicker'
import { createLead, updateLead, fetchLeads, deleteLead, updateLeadStatus } from '@/lib/supabase/leadService'
import { onNewLead } from '@/lib/supabase/realtimeSubscriptions'
import { fetchAllInvestmentApplications, fetchAllBankAccounts, createBankAccount, deleteBankAccount, fetchClients, type AdminBankAccountRow, fetchFundCategories, createFundCategory, deleteFundCategory, fetchFundPlans, createFundPlan, updateFundPlan, deleteFundPlan, uploadFundPlanAsset, type FundCategoryRow, type FundPlanRow, type FundPlanBankRow } from '@/lib/supabase/adminDataService'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

// ── Sub-tabs ─────────────────────────────────────────────────────
// 2026-05-12: Super-Admin menu spec maps several new sidebar entries
// onto this module — Investment Plans, Bank Details, Fund Categories,
// status-scoped Investments (Pending / Rejected), Maturity History,
// Channel-Partner Referrals, and a Lead-Search shortcut. Each new tab
// reuses an existing tab (with a pre-applied filter) or renders a
// dedicated stub that adopts the AdminDataTable patterns so row-level
// Edit / Delete / View actions remain consistent with the rest of the
// admin.
const SALES_TABS = [
  { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
  { id: 'create-account', label: 'Create Account', icon: UserPlus },
  { id: 'leads', label: 'Lead List', icon: Users },
  { id: 'lead-search', label: 'Lead Search', icon: Users },
  { id: 'referrals', label: 'Referrals', icon: Users },
  { id: 'cp-referrals', label: 'CP Referrals', icon: Users },
  { id: 'startup-applications', label: 'Startup Apps', icon: Target },
  { id: 'nri-consultations', label: 'NRI Consult', icon: Zap },
  { id: 'commissions', label: 'Commissions', icon: IndianRupee },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'investments', label: 'Investments', icon: BarChart3 },
  { id: 'investments-pending', label: 'Pending Investments', icon: BarChart3 },
  { id: 'investments-rejected', label: 'Rejected Investments', icon: BarChart3 },
  { id: 'maturity-history', label: 'Maturity History', icon: BarChart3 },
  { id: 'investment-plans', label: 'Investment Plans', icon: Target },
  { id: 'fund-categories', label: 'Fund Categories', icon: Target },
  { id: 'bank-details', label: 'Bank Details', icon: IndianRupee },
  // Pending 30-04-2026 #3: Reference number management — separate
  // listing of every investment + its reference number (manual or auto).
  { id: 'reference-numbers', label: 'Reference Nos.', icon: Hash },
  { id: 'lead-statuses', label: 'Lead Statuses', icon: CheckCircle2 },
  { id: 'lead-sources', label: 'Lead Sources', icon: Zap },
  { id: 'lead-companies', label: 'Companies', icon: Target },
  { id: 'bulk-upload', label: 'Bulk Upload', icon: Upload },
] as const

type SalesTab = typeof SALES_TABS[number]['id']

const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; bgColor: string }> = {
  new: { label: 'New', color: 'text-blue-400', bgColor: 'bg-blue-500/15 border-blue-500/20' },
  contacted: { label: 'Contacted', color: 'text-cyan-400', bgColor: 'bg-cyan-500/15 border-cyan-500/20' },
  qualified: { label: 'Qualified', color: 'text-amber-400', bgColor: 'bg-amber-500/15 border-amber-500/20' },
  proposal: { label: 'Proposal', color: 'text-purple-400', bgColor: 'bg-purple-500/15 border-purple-500/20' },
  negotiation: { label: 'Negotiation', color: 'text-orange-400', bgColor: 'bg-orange-500/15 border-orange-500/20' },
  won: { label: 'Won', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15 border-emerald-500/20' },
  lost: { label: 'Lost', color: 'text-red-400', bgColor: 'bg-red-500/15 border-red-500/20' },
}

interface SalesModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function SalesModule({ subTab, navigate, showToast }: SalesModuleProps) {
  const activeTab = (SALES_TABS.some(t => t.id === subTab) ? subTab : 'pipeline') as SalesTab
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [addLeadOpen, setAddLeadOpen] = useState(false)
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null)
  const [folderPickerOpen, setFolderPickerOpen] = useState(false)
  const [savingLead, setSavingLead] = useState(false)
  const [mondaySyncing, setMondaySyncing] = useState(false)
  const [mondayAvailable, setMondayAvailable] = useState(false)

  // ── Real leads from Supabase ─────────────────────────────────
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadsLoading, setLeadsLoading] = useState(true)

  const loadLeads = useCallback(async () => {
    setLeadsLoading(true)
    const data = await fetchLeads()
    setLeads(data)
    setLeadsLoading(false)
  }, [])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  // Realtime: auto-refresh when new lead arrives
  useEffect(() => {
    const unsub = onNewLead((payload) => {
      loadLeads()
      const newRow = payload.new as any
      const name = [newRow?.first_name, newRow?.last_name].filter(Boolean).join(' ') || 'Unknown'
      showToast(`New lead: ${name} (${newRow?.source || 'website'})`, 'info')
    })
    return () => { unsub?.() }
  }, [loadLeads, showToast])

  // Check if Monday.com is configured on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const { isMondayConfigured } = require('@/lib/mondayService')
      setMondayAvailable(isMondayConfigured())
    } catch {}
  }, [])

  const handleSyncToMonday = async () => {
    setMondaySyncing(true)
    try {
      const { pushLeadsToMonday, getSavedMappings } = await import('@/lib/mondayService')
      const mappings = getSavedMappings()
      if (mappings.length === 0) {
        showToast('No board mapping configured — go to Settings > Integrations first', 'warning')
        return
      }
      const m = mappings[0]
      const result = await pushLeadsToMonday(leads, m.boardId, m.columnMappings, m.groupId)
      if (result.success) {
        showToast(`${result.synced} leads synced to Monday.com`, 'success')
      } else {
        showToast(`Synced ${result.synced}, failed ${result.failed} — check Settings > Integrations for details`, 'warning')
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Monday.com sync failed', 'error')
    } finally {
      setMondaySyncing(false)
    }
  }

  // ── Add Lead form state ─────────────────────────────────────
  const [leadForm, setLeadForm] = useState({
    name: '', email: '', phone: '', source: 'website' as LeadSource,
    stage: 'new' as LeadStage, value: '', probability: '50',
    assignedTo: '', notes: '',
  })
  const resetLeadForm = () => setLeadForm({ name: '', email: '', phone: '', source: 'website', stage: 'new', value: '', probability: '50', assignedTo: '', notes: '' })

  const handleSaveLead = async () => {
    if (!leadForm.name.trim()) { showToast('Lead name is required', 'error'); return }
    setSavingLead(true)
    try {
      const payload = {
        name: leadForm.name.trim(),
        email: leadForm.email.trim() || undefined,
        phone: leadForm.phone.trim() || undefined,
        source: leadForm.source,
        stage: leadForm.stage,
        value: leadForm.value ? Number(leadForm.value) : 0,
        probability: leadForm.probability ? Number(leadForm.probability) : 50,
        assignedTo: undefined, // assigned_to is UUID column — use undefined for unassigned; RM assignment handled separately
        notes: leadForm.notes.trim() || undefined,
      }

      if (editingLeadId) {
        // ── UPDATE existing lead ──
        const result = await updateLead(editingLeadId, payload)
        if (result.success) {
          showToast(`Lead "${leadForm.name}" updated`, 'success')
          resetLeadForm(); setEditingLeadId(null); setAddLeadOpen(false)
          loadLeads()
        } else {
          showToast(result.error || 'Failed to update lead', 'error')
        }
      } else {
        // ── CREATE new lead ──
        const result = await createLead(payload)
        if (result.success) {
          showToast(`Lead "${leadForm.name}" created — folder auto-created in Sales & Reports`, 'success')
          resetLeadForm(); setAddLeadOpen(false)
          loadLeads()
        } else {
          showToast(result.error || 'Failed to create lead', 'error')
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving lead', 'error')
    } finally {
      setSavingLead(false)
    }
  }

  // ── Delete Lead ────────────────────────────────────────────────
  const handleDeleteLead = useCallback(async (lead: Lead) => {
    if (!window.confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) return
    const ok = await deleteLead(lead.id)
    if (ok) {
      showToast(`Lead "${lead.name}" deleted`, 'success')
      if (selectedLead?.id === lead.id) { setLeadModalOpen(false); setSelectedLead(null) }
      loadLeads()
    } else {
      showToast('Failed to delete lead', 'error')
    }
  }, [showToast, selectedLead, loadLeads])

  // ── Bulk operations on the pipeline ───────────────────────────
  // The pipeline tab lifts its selection state up here so the actual
  // mutations reuse the same `deleteLead` / `updateLeadStatus` paths
  // as single-row operations — keeps audit logs + activity rows in
  // sync with the existing flow.
  const [pipelineSelected, setPipelineSelected] = useState<string[]>([])
  const [pipelineSelectMode, setPipelineSelectMode] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)

  const handleBulkDeleteLeads = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return
    if (!window.confirm(`Delete ${ids.length} lead(s)? This cannot be undone.`)) return
    setBulkBusy(true)
    const results = await Promise.all(ids.map(id => deleteLead(id)))
    const okCount = results.filter(Boolean).length
    const failCount = results.length - okCount
    if (okCount > 0) showToast(`Deleted ${okCount} lead${okCount === 1 ? '' : 's'}`, 'success')
    if (failCount > 0) showToast(`${failCount} delete${failCount === 1 ? '' : 's'} failed`, 'error')
    if (selectedLead && ids.includes(selectedLead.id)) { setLeadModalOpen(false); setSelectedLead(null) }
    setPipelineSelected([])
    setPipelineSelectMode(false)
    setBulkBusy(false)
    loadLeads()
  }, [showToast, selectedLead, loadLeads])

  const handleBulkMoveStage = useCallback(async (ids: string[], stage: LeadStage) => {
    if (ids.length === 0) return
    setBulkBusy(true)
    const results = await Promise.all(ids.map(id => updateLeadStatus(id, stage)))
    const okCount = results.filter(r => r.success).length
    const failCount = results.length - okCount
    if (okCount > 0) showToast(`Moved ${okCount} lead${okCount === 1 ? '' : 's'} → ${STAGE_CONFIG[stage].label}`, 'success')
    if (failCount > 0) showToast(`${failCount} move${failCount === 1 ? '' : 's'} failed`, 'error')
    setPipelineSelected([])
    setPipelineSelectMode(false)
    setBulkBusy(false)
    loadLeads()
  }, [showToast, loadLeads])

  // ── KPIs ──────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const pipeline = leads.filter(l => l.stage !== 'won' && l.stage !== 'lost')
    const pipelineValue = pipeline.reduce((s, l) => s + l.value, 0)
    const weightedValue = pipeline.reduce((s, l) => s + (l.value * l.probability / 100), 0)
    const won = leads.filter(l => l.stage === 'won')
    const wonValue = won.reduce((s, l) => s + l.value, 0)
    const avgAIScore = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.aiScore, 0) / leads.length) : 0
    const conversionRate = leads.length > 0 ? Math.round((won.length / leads.length) * 100) : 0
    return { total: leads.length, pipelineValue, weightedValue, wonValue, avgAIScore, conversionRate, pipelineCount: pipeline.length }
  }, [leads])

  const handleTabClick = (tabId: string) => {
    navigate(tabId === 'pipeline' ? 'sales' : `sales/${tabId}`)
  }

  return (
    <div className="space-y-6 admin-section-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Manage leads, pipeline, commissions, and sales performance</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={loadLeads}
            disabled={leadsLoading}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors disabled:opacity-40 admin-btn-press"
            title="Refresh leads"
          >
            <RefreshCw className={`w-4 h-4 ${leadsLoading ? 'animate-spin' : ''}`} />
          </button>
          {mondayAvailable && (
            <button
              onClick={handleSyncToMonday}
              disabled={mondaySyncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors disabled:opacity-40 disabled:cursor-not-allowed admin-btn-press"
            >
              {mondaySyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
              {mondaySyncing ? 'Syncing…' : 'Sync to Monday'}
            </button>
          )}
          <button
            onClick={() => { resetLeadForm(); setEditingLeadId(null); setAddLeadOpen(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors admin-btn-press"
          >
            <UserPlus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Pipeline Value" value={formatINR(kpis.pipelineValue)} icon={TrendingUp} color="#3B82F6" delay={0} />
        <AdminKPICard title="Weighted Pipeline" value={formatINR(kpis.weightedValue)} icon={Target} color="#8B5CF6" delay={50} />
        <AdminKPICard title="Won Deals" value={formatINR(kpis.wonValue)} icon={IndianRupee} color="#10B981" delay={100} />
        <AdminKPICard title="Conversion Rate" value={`${kpis.conversionRate}%`} subtitle={`AI Score Avg: ${kpis.avgAIScore}`} icon={Percent} color="#DC2626" delay={150} />
      </div>

      {/* Sub-tab Nav */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
        {SALES_TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                isActive ? 'bg-brand-red/20 text-white border border-brand-red/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
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
        {activeTab === 'pipeline' && (
          <PipelineTab
            leads={leads}
            onViewLead={(l) => { setSelectedLead(l); setLeadModalOpen(true) }}
            onDeleteLead={handleDeleteLead}
            showToast={showToast}
            selected={pipelineSelected}
            setSelected={setPipelineSelected}
            selectMode={pipelineSelectMode}
            setSelectMode={setPipelineSelectMode}
            onBulkDelete={handleBulkDeleteLeads}
            onBulkMoveStage={handleBulkMoveStage}
            bulkBusy={bulkBusy}
          />
        )}
        {activeTab === 'create-account' && <CreateAccountTab showToast={showToast} />}
        {activeTab === 'leads' && <LeadListTab leads={leads} onViewLead={(l) => { setSelectedLead(l); setLeadModalOpen(true) }} onDeleteLead={handleDeleteLead} showToast={showToast} />}
        {/* 2026-05-12: Lead Search routes to the same list — the table
            ships with a built-in search box, so this is a labelled
            shortcut rather than a separate component. */}
        {activeTab === 'lead-search' && <LeadListTab leads={leads} onViewLead={(l) => { setSelectedLead(l); setLeadModalOpen(true) }} onDeleteLead={handleDeleteLead} showToast={showToast} />}
        {activeTab === 'referrals' && <ReferralsTab showToast={showToast} />}
        {/* 2026-05-12: CP (Channel Partner) Referrals filters the
            existing referrals list to channel-partner sourced rows. */}
        {activeTab === 'cp-referrals' && <ReferralsTab showToast={showToast} channelPartnerOnly />}
        {activeTab === 'startup-applications' && <StartupApplicationsTab showToast={showToast} />}
        {activeTab === 'nri-consultations' && <NRIConsultationsTab showToast={showToast} />}
        {activeTab === 'commissions' && <CommissionsTab showToast={showToast} />}
        {activeTab === 'leaderboard' && <LeaderboardTab leads={leads} />}
        {activeTab === 'investments' && <InvestmentsTab showToast={showToast} />}
        {/* 2026-05-12: status-scoped Investments variants. */}
        {activeTab === 'investments-pending' && <InvestmentsTab showToast={showToast} statusFilter="pending" />}
        {activeTab === 'investments-rejected' && <InvestmentsTab showToast={showToast} statusFilter="rejected" />}
        {activeTab === 'maturity-history' && <InvestmentsTab showToast={showToast} statusFilter="matured" />}
        {/* 2026-05-12: New CRUD shells for Investment Plans, Fund
            Categories, and a Bank Details directory. Each is a thin
            AdminDataTable + AdminEmptyState combo backed by Supabase
            tables created in supabase_migration.sql; they expose the
            full row-action triad (View / Edit / Delete). */}
        {activeTab === 'investment-plans' && <InvestmentPlansTab showToast={showToast} />}
        {activeTab === 'fund-categories' && <FundCategoriesTab showToast={showToast} />}
        {activeTab === 'bank-details' && <BankDetailsDirectoryTab showToast={showToast} />}
        {activeTab === 'reference-numbers' && <ReferenceNumbersTab showToast={showToast} />}
        {activeTab === 'lead-statuses' && <LeadMgmtWrapper subTab="lead-statuses" navigate={navigate} showToast={showToast} />}
        {activeTab === 'lead-sources' && <LeadMgmtWrapper subTab="lead-sources" navigate={navigate} showToast={showToast} />}
        {activeTab === 'lead-companies' && <LeadMgmtWrapper subTab="lead-companies" navigate={navigate} showToast={showToast} />}
        {activeTab === 'bulk-upload' && <LeadMgmtWrapper subTab="bulk-upload" navigate={navigate} showToast={showToast} />}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <AdminModal
          isOpen={leadModalOpen}
          onClose={() => { setLeadModalOpen(false); setSelectedLead(null) }}
          title={selectedLead.name}
          subtitle={`${selectedLead.id} • ${STAGE_CONFIG[selectedLead.stage].label} • AI Score: ${selectedLead.aiScore}`}
          footer={
            <div className="flex items-center w-full">
              <ModalButton variant="danger" onClick={() => handleDeleteLead(selectedLead)}>
                <span className="flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete</span>
              </ModalButton>
              <div className="ml-auto flex items-center gap-2">
                <ModalButton onClick={() => { setLeadModalOpen(false); setSelectedLead(null) }}>Close</ModalButton>
                <ModalButton variant="primary" onClick={() => {
                  // Pre-populate form from selected lead
                  setLeadForm({
                    name: selectedLead.name || '',
                    email: selectedLead.email || '',
                    phone: selectedLead.phone || '',
                    source: selectedLead.source || 'website',
                    stage: selectedLead.stage || 'new',
                    value: selectedLead.value ? String(selectedLead.value) : '',
                    probability: selectedLead.aiScore ? String(selectedLead.aiScore) : '50',
                    assignedTo: selectedLead.assignedTo || '',
                    notes: selectedLead.notes || '',
                  })
                  setEditingLeadId(selectedLead.id)
                  setLeadModalOpen(false)
                  setSelectedLead(null)
                  setAddLeadOpen(true)
                }}>Edit Lead</ModalButton>
              </div>
            </div>
          }
        >
          <LeadDetailContent lead={selectedLead} />
        </AdminModal>
      )}

      {/* Add / Edit Lead Modal */}
      {addLeadOpen && (
        <AdminModal
          isOpen={addLeadOpen}
          onClose={() => setAddLeadOpen(false)}
          title={editingLeadId ? 'Edit Lead' : 'New Lead'}
          subtitle={editingLeadId ? 'Update lead details' : 'Register a new sales lead'}
          maxWidth="max-w-xl"
          footer={
            <>
              <ModalButton onClick={() => { resetLeadForm(); setEditingLeadId(null); setAddLeadOpen(false) }}>Cancel</ModalButton>
              <ModalButton variant="primary" onClick={handleSaveLead} disabled={savingLead}>{savingLead ? 'Saving…' : editingLeadId ? 'Update Lead' : 'Save Lead'}</ModalButton>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name *</label>
                <input type="text" placeholder="Enter full name" value={leadForm.name} onChange={e => setLeadForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email *</label>
                <input type="email" placeholder="email@example.com" value={leadForm.email} onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone *</label>
                <input type="tel" placeholder="+91 98765 43210" value={leadForm.phone} onChange={e => setLeadForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Lead Source</label>
                <select value={leadForm.source} onChange={e => setLeadForm(f => ({ ...f, source: e.target.value as LeadSource }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20">
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="cold-outreach">Cold Outreach</option>
                  <option value="event">Event</option>
                  <option value="social-media">Social Media</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Deal Value (₹)</label>
                <input type="number" placeholder="0" value={leadForm.value} onChange={e => setLeadForm(f => ({ ...f, value: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Probability (%)</label>
                <input type="number" placeholder="50" min="0" max="100" value={leadForm.probability} onChange={e => setLeadForm(f => ({ ...f, probability: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Stage</label>
              <select value={leadForm.stage} onChange={e => setLeadForm(f => ({ ...f, stage: e.target.value as LeadStage }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20">
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Assigned To</label>
              <input type="text" placeholder="Sales rep name" value={leadForm.assignedTo} onChange={e => setLeadForm(f => ({ ...f, assignedTo: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
              <textarea rows={3} placeholder="Any additional notes about this lead..." value={leadForm.notes} onChange={e => setLeadForm(f => ({ ...f, notes: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Attach Documents</label>
              <button
                type="button"
                onClick={() => setFolderPickerOpen(true)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] border border-dashed border-white/[0.12] hover:bg-white/[0.08] hover:border-white/[0.2] transition-colors w-full justify-center"
              >
                <Upload className="w-4 h-4" />
                Upload Documents & Images
              </button>
              <p className="text-[10px] text-gray-600 mt-1">PDF, DOCX, XLSX, JPG, PNG — stored in File Repository &gt; Sales &amp; CRM</p>
            </div>
          </div>
        </AdminModal>
      )}

      <UploadWithFolderPicker
        open={folderPickerOpen}
        onClose={() => setFolderPickerOpen(false)}
        defaultRoute="admin/sales"
        showToast={showToast as any}
        onUploadComplete={(results) => {
          const ok = results.filter(r => r.success).length
          if (ok > 0) showToast(`${ok} file(s) uploaded to Sales & CRM`, 'success')
        }}
        theme="dark"
        portal="admin"
      />
    </div>
  )
}

// ── Pipeline (Kanban-style) ─────────────────────────────────────
function PipelineTab({
  leads,
  onViewLead,
  onDeleteLead,
  showToast,
  selected,
  setSelected,
  selectMode,
  setSelectMode,
  onBulkDelete,
  onBulkMoveStage,
  bulkBusy,
}: {
  leads: Lead[]
  onViewLead: (l: Lead) => void
  onDeleteLead: (l: Lead) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  selected: string[]
  setSelected: React.Dispatch<React.SetStateAction<string[]>>
  selectMode: boolean
  setSelectMode: React.Dispatch<React.SetStateAction<boolean>>
  onBulkDelete: (ids: string[]) => void
  onBulkMoveStage: (ids: string[], stage: LeadStage) => void
  bulkBusy: boolean
}) {
  const stages: LeadStage[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
  const [moveOpen, setMoveOpen] = useState(false)

  const grouped = useMemo(() => {
    const map: Record<LeadStage, Lead[]> = { new: [], contacted: [], qualified: [], proposal: [], negotiation: [], won: [], lost: [] }
    leads.forEach(l => map[l.stage].push(l))
    return map
  }, [leads])

  // Always work from a Set for O(1) lookups even when toggling many cards.
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const allIds = useMemo(() => leads.map(l => l.id), [leads])
  const allSelected = leads.length > 0 && selected.length === leads.length
  const someSelected = selected.length > 0 && !allSelected

  const toggleOne = useCallback((id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }, [setSelected])

  const selectAllStage = useCallback((stage: LeadStage) => {
    const stageIds = grouped[stage].map(l => l.id)
    if (stageIds.length === 0) return
    const stageAllPicked = stageIds.every(id => selectedSet.has(id))
    setSelected(prev => {
      if (stageAllPicked) return prev.filter(id => !stageIds.includes(id))
      const merged = new Set(prev)
      stageIds.forEach(id => merged.add(id))
      return Array.from(merged)
    })
  }, [grouped, selectedSet, setSelected])

  const selectAll = useCallback(() => setSelected(allIds), [allIds, setSelected])
  const clearSelection = useCallback(() => setSelected([]), [setSelected])
  const exitSelectMode = useCallback(() => { setSelectMode(false); setSelected([]); setMoveOpen(false) }, [setSelectMode, setSelected])

  return (
    <div className="space-y-3">
      {/* ── Bulk-action toolbar ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center gap-2">
          {!selectMode ? (
            <button
              onClick={() => setSelectMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors"
              title="Enter multi-select mode"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Select
            </button>
          ) : (
            <>
              <button
                onClick={allSelected ? clearSelection : selectAll}
                disabled={bulkBusy || leads.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-200 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-colors disabled:opacity-50"
                title={allSelected ? 'Deselect all' : 'Select all'}
              >
                {allSelected ? <CheckSquare className="w-3.5 h-3.5 text-brand-red" /> : <Square className="w-3.5 h-3.5" />}
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={clearSelection}
                disabled={bulkBusy || selected.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors disabled:opacity-40"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
              <span className="text-xs text-gray-500 ml-1">
                {selected.length} of {leads.length} selected
                {someSelected && <span className="ml-1 text-gray-600">(partial)</span>}
              </span>
            </>
          )}
        </div>

        {selectMode && (
          <div className="flex items-center gap-2">
            {/* Move-to-stage dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoveOpen(o => !o)}
                disabled={bulkBusy || selected.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-200 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors disabled:opacity-40"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Move to stage
                <ChevronDown className="w-3 h-3" />
              </button>
              {moveOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded-xl bg-[#141414] border border-white/[0.08] shadow-xl z-20 overflow-hidden">
                  {stages.map(s => {
                    const cfg = STAGE_CONFIG[s]
                    return (
                      <button
                        key={s}
                        onClick={() => { setMoveOpen(false); onBulkMoveStage(selected, s) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-white/[0.06] transition-colors"
                      >
                        <span className={`w-2 h-2 rounded-full ${cfg.bgColor.split(' ')[0]}`} />
                        <span className={cfg.color}>{cfg.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Bulk delete */}
            <button
              onClick={() => onBulkDelete(selected)}
              disabled={bulkBusy || selected.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-40"
            >
              {bulkBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </button>

            <button
              onClick={exitSelectMode}
              disabled={bulkBusy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40"
              title="Exit select mode"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Pipeline columns ─────────────────────────────────────── */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-[900px]">
          {stages.map(stage => {
            const config = STAGE_CONFIG[stage]
            const stageLeads = grouped[stage]
            const stageValue = stageLeads.reduce((s, l) => s + l.value, 0)
            const stageIds = stageLeads.map(l => l.id)
            const stageAllPicked = stageIds.length > 0 && stageIds.every(id => selectedSet.has(id))
            const stageSomePicked = stageIds.some(id => selectedSet.has(id))

            return (
              <div key={stage} className="flex-1 min-w-[180px]">
                {/* Column Header */}
                <div className={`p-3 rounded-t-xl border ${config.bgColor}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {selectMode && stageLeads.length > 0 && (
                        <button
                          onClick={() => selectAllStage(stage)}
                          disabled={bulkBusy}
                          className="p-0.5 rounded hover:bg-white/[0.1] transition-colors disabled:opacity-50"
                          title={stageAllPicked ? 'Deselect column' : 'Select column'}
                        >
                          {stageAllPicked
                            ? <CheckSquare className="w-3.5 h-3.5 text-brand-red" />
                            : stageSomePicked
                              ? <CheckSquare className="w-3.5 h-3.5 text-brand-red/40" />
                              : <Square className="w-3.5 h-3.5 text-gray-500" />}
                        </button>
                      )}
                      <span className={`text-xs font-semibold ${config.color} truncate`}>{config.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 bg-white/[0.06] px-1.5 py-0.5 rounded-full">{stageLeads.length}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">{formatINR(stageValue)}</p>
                </div>

                {/* Cards */}
                <div className="space-y-2 mt-2">
                  {stageLeads.map(lead => {
                    const picked = selectedSet.has(lead.id)
                    return (
                      <div
                        key={lead.id}
                        onClick={() => {
                          if (selectMode) toggleOne(lead.id)
                          else onViewLead(lead)
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all group ${
                          picked
                            ? 'bg-brand-red/10 border-brand-red/40'
                            : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            {selectMode && (
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleOne(lead.id) }}
                                className="mt-0.5 p-0.5 rounded hover:bg-white/[0.08] transition-colors"
                                title={picked ? 'Deselect' : 'Select'}
                                aria-label={picked ? 'Deselect lead' : 'Select lead'}
                              >
                                {picked
                                  ? <CheckSquare className="w-3.5 h-3.5 text-brand-red" />
                                  : <Square className="w-3.5 h-3.5 text-gray-500" />}
                              </button>
                            )}
                            <p className="text-xs font-medium text-white truncate">{lead.name}</p>
                          </div>
                          <div className={`flex items-center gap-1.5 transition-opacity ${selectMode ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}>
                            <Eye className="w-3 h-3 text-gray-500" />
                            <button onClick={(e) => { e.stopPropagation(); onDeleteLead(lead) }} className="p-0.5 rounded-md hover:bg-red-500/20 transition-colors" title="Delete lead">
                              <Trash2 className="w-3 h-3 text-red-400/60 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-white">{formatINR(lead.value)}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-gray-500 capitalize">{lead.source.replace('-', ' ')}</span>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span className={`text-[10px] font-semibold ${
                              lead.aiScore >= 80 ? 'text-emerald-400' : lead.aiScore >= 50 ? 'text-amber-400' : 'text-red-400'
                            }`}>{lead.aiScore}</span>
                          </div>
                        </div>
                        {lead.notes && (
                          <p className="text-[10px] text-gray-500 mt-1.5 line-clamp-2 italic">&ldquo;{lead.notes}&rdquo;</p>
                        )}
                        {lead.probability > 0 && (
                          <div className="mt-2 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                            <div className="h-full bg-brand-red/60 rounded-full" style={{ width: `${lead.probability}%` }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {stageLeads.length === 0 && (
                    <div className="p-4 rounded-xl border border-dashed border-white/[0.06] text-center">
                      <p className="text-[10px] text-gray-600">No leads</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Lead List ───────────────────────────────────────────────────
function LeadListTab({ leads, onViewLead, onDeleteLead, showToast }: { leads: Lead[]; onViewLead: (l: Lead) => void; onDeleteLead: (l: Lead) => void; showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const columns: Column<Lead>[] = [
    {
      key: 'name',
      label: 'Lead',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.name}</p>
          <p className="text-[11px] text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'stage',
      label: 'Stage',
      render: (row) => {
        const config = STAGE_CONFIG[row.stage]
        return <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
      },
    },
    {
      key: 'value',
      label: 'Deal Value',
      render: (row) => <span className="text-white font-medium">{formatINR(row.value)}</span>,
    },
    {
      key: 'probability',
      label: 'Probability',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-12 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-brand-red/60 rounded-full" style={{ width: `${row.probability}%` }} />
          </div>
          <span className="text-xs text-gray-400">{row.probability}%</span>
        </div>
      ),
    },
    {
      key: 'aiScore',
      label: 'AI Score',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className={`text-xs font-bold ${
            row.aiScore >= 80 ? 'text-emerald-400' : row.aiScore >= 50 ? 'text-amber-400' : 'text-red-400'
          }`}>{row.aiScore}</span>
        </div>
      ),
    },
    {
      key: 'source',
      label: 'Source',
      render: (row) => <span className="text-xs text-gray-400 capitalize">{row.source.replace('-', ' ')}</span>,
    },
    {
      key: 'notes',
      label: 'Message',
      render: (row) => row.notes
        ? <span className="text-xs text-gray-400 line-clamp-2 max-w-[200px]" title={row.notes}>{row.notes}</span>
        : <span className="text-xs text-gray-600">—</span>,
    },
    {
      key: 'lastTouched',
      label: 'Last Contact',
      render: (row) => <span className="text-xs text-gray-400">{formatDate(row.lastTouched)}</span>,
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      width: '90px',
      render: (row) => (
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onViewLead(row) }}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"
            title="View lead"
          >
            <Eye className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/[0.06]" />
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteLead(row) }}
            className="p-1.5 rounded-lg hover:bg-red-500/15 text-gray-600 hover:text-red-400 transition-colors"
            title="Delete lead"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminGlass padding="p-4">
      <AdminDataTable<Lead>
        columns={columns}
        data={leads}
        searchKeys={['name', 'email', 'source', 'stage']}
        searchPlaceholder="Search leads..."
        onRowClick={onViewLead}
        exportable
        title="All Leads"
      />
    </AdminGlass>
  )
}

// ── Commissions Tab ─────────────────────────────────────────────
interface CommissionRow {
  id: string
  sales_rep: string | null
  deal_id: string | null
  client_name: string | null
  deal_value: number | null
  commission_rate: number | null
  commission_amount: number | null
  status: string | null
  period: string | null
  created_at: string | null
}

function CommissionsTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [rows, setRows] = useState<CommissionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      if (!isSupabaseConfigured()) { setLoading(false); return }
      try {
        const sb = supabase as any
        const { data } = await sb.from('commissions').select('*').order('created_at', { ascending: false }).limit(500)
        if (!active) return
        setRows((data as CommissionRow[]) || [])
      } catch { /* silent */ }
      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  const summary = useMemo(() => {
    const total = rows.reduce((s, r) => s + Number(r.commission_amount || 0), 0)
    const paid = rows.filter(r => (r.status || '').toLowerCase() === 'paid').reduce((s, r) => s + Number(r.commission_amount || 0), 0)
    const pending = rows.filter(r => {
      const v = (r.status || '').toLowerCase()
      return v === 'pending' || v === 'approved' || v === 'submitted' || !v
    }).reduce((s, r) => s + Number(r.commission_amount || 0), 0)
    return { total, paid, pending }
  }, [rows])

  const statusVariant = (s: string | null): 'success' | 'warning' | 'info' | 'neutral' => {
    const v = (s || '').toLowerCase()
    if (v === 'paid') return 'success'
    if (v === 'pending' || v === 'submitted') return 'warning'
    if (v === 'approved') return 'info'
    return 'neutral'
  }

  const columns: Column<CommissionRow>[] = [
    { key: 'period', label: 'Period', render: (row) => <span className="text-xs text-gray-300">{row.period || '—'}</span> },
    { key: 'sales_rep', label: 'Sales Rep', render: (row) => <span className="text-sm text-white font-medium">{row.sales_rep || '—'}</span> },
    { key: 'client_name', label: 'Client', render: (row) => <span className="text-xs text-gray-300">{row.client_name || '—'}</span> },
    { key: 'deal_value', label: 'Deal Value', render: (row) => <span className="text-xs text-gray-300">{formatINR(Number(row.deal_value || 0))}</span> },
    { key: 'commission_rate', label: 'Rate', render: (row) => <span className="text-xs text-gray-400">{row.commission_rate != null ? `${Number(row.commission_rate)}%` : '—'}</span> },
    { key: 'commission_amount', label: 'Commission', render: (row) => <span className="text-sm text-emerald-400 font-semibold">{formatINR(Number(row.commission_amount || 0))}</span> },
    { key: 'status', label: 'Status', render: (row) => <AdminBadge label={row.status || 'pending'} variant={statusVariant(row.status)} dot /> },
    { key: 'created_at', label: 'Recorded', render: (row) => <span className="text-xs text-gray-500">{formatDate(row.created_at)}</span> },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Total Commissions</p>
          <p className="text-xl font-bold text-white mt-1">{formatINR(summary.total)}</p>
        </AdminGlass>
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Paid</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{formatINR(summary.paid)}</p>
        </AdminGlass>
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Pending</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{formatINR(summary.pending)}</p>
        </AdminGlass>
      </div>

      <AdminGlass padding="p-4">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500">Loading commissions…</div>
        ) : rows.length === 0 ? (
          <AdminEmptyState title="No commissions yet" description="Commissions will appear here as deals are closed and payouts are processed." />
        ) : (
          <AdminDataTable<CommissionRow>
            columns={columns}
            data={rows}
            searchKeys={['sales_rep', 'client_name', 'period', 'status']}
            searchPlaceholder="Search commissions..."
            exportable
            title="Commissions Ledger"
          />
        )}
      </AdminGlass>
    </div>
  )
}

// ── Leaderboard Tab ─────────────────────────────────────────────
function LeaderboardTab({ leads }: { leads: Lead[] }) {
  const leaderboard = useMemo(() => {
    const reps: Record<string, { deals: number; value: number; avgScore: number; won: number }> = {}
    leads.forEach(l => {
      if (!reps[l.assignedTo]) reps[l.assignedTo] = { deals: 0, value: 0, avgScore: 0, won: 0 }
      reps[l.assignedTo].deals++
      reps[l.assignedTo].value += l.value
      reps[l.assignedTo].avgScore += l.aiScore
      if (l.stage === 'won') reps[l.assignedTo].won++
    })
    return Object.entries(reps).map(([name, data]) => ({
      name,
      deals: data.deals,
      value: data.value,
      avgScore: Math.round(data.avgScore / Math.max(data.deals, 1)),
      won: data.won,
      winRate: data.deals > 0 ? Math.round((data.won / data.deals) * 100) : 0,
    })).sort((a, b) => b.value - a.value)
  }, [leads])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <AdminGlass>
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-400" />
        Sales Leaderboard — Current Quarter
      </h3>
      <div className="space-y-3">
        {leaderboard.map((rep, i) => (
          <div key={rep.name} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/[0.04]">
            <span className="text-xl w-8 text-center">{medals[i] || `#${i + 1}`}</span>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-red/30 to-amber-500/30 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {rep.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{rep.name}</p>
              <div className="flex items-center gap-4 mt-1 text-[11px] text-gray-500">
                <span>{rep.deals} deals</span>
                <span>{rep.won} won</span>
                <span>{rep.winRate}% win rate</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">{formatINR(rep.value)}</p>
              <p className="text-[10px] text-gray-500">Total Pipeline</p>
            </div>
          </div>
        ))}
        {leaderboard.length === 0 && (
          <AdminEmptyState title="No sales data" description="Sales leaderboard will populate as leads are assigned." />
        )}
      </div>
    </AdminGlass>
  )
}

// ── Lead Detail Content ─────────────────────────────────────────
function LeadDetailContent({ lead }: { lead: Lead }) {
  const config = STAGE_CONFIG[lead.stage]

  return (
    <div className="space-y-5">
      {/* Stage & Score */}
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${config.bgColor} ${config.color}`}>
          {config.label}
        </span>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-bold text-amber-400">AI Score: {lead.aiScore}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <Target className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-300">{lead.probability}% probability</span>
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
          <Mail className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-300">{lead.email}</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
          <Phone className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-300">{lead.phone}</span>
        </div>
      </div>

      {/* Deal Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Deal Value', value: formatINR(lead.value) },
          { label: 'Source', value: lead.source.replace('-', ' ') },
          { label: 'Assigned To', value: lead.assignedTo || 'Unassigned' },
          { label: 'Created', value: formatDate(lead.createdDate) },
        ].map(item => (
          <div key={item.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">{item.label}</p>
            <p className="text-sm font-medium text-white mt-1 capitalize">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div>
        <h4 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Activity</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-xs">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-gray-400">Last contacted: {formatDate(lead.lastTouched)}</span>
          </div>
          {lead.nextFollowUp && (
            <div className="flex items-center gap-3 text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400">Next follow-up: {formatDate(lead.nextFollowUp)}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-gray-400">Created: {formatDate(lead.createdDate)}</span>
          </div>
        </div>
      </div>

      {lead.notes && (
        <div>
          <h4 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Notes</h4>
          <p className="text-sm text-gray-300 bg-white/[0.03] p-3 rounded-xl border border-white/[0.04]">{lead.notes}</p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// INVESTMENTS TAB
// ═══════════════════════════════════════════════════════════════

async function generateInvestmentDocument(
  type: 'acknowledgement' | 'allotment' | 'certificate' | 'agreement',
  app: any
) {
  // Tests 28-04-2026 #10: pull every investor field straight from KYC so
  // documents are ready to download without admin edits. We hydrate from
  // kyc_basic_details, kyc_identity_details, kyc_bank_details and the
  // clients table before opening the print preview.
  let clientName = app._client?.full_name || 'Investor'
  let clientEmail = app._client?.email || ''
  let clientPhone: string = app._client?.phone || ''
  let clientAddress = ''
  let clientPan = ''
  try {
    if (app.client_id) {
      const { supabase: sb } = await import('@/lib/supabase/client')
      const sbAny: any = sb
      const [basicRes, identityRes, clientRes] = await Promise.all([
        sbAny.from('kyc_basic_details').select('investor_name, email, phone, address').eq('client_id', app.client_id).maybeSingle(),
        sbAny.from('kyc_identity_details').select('pan_number, address, city, state, pincode, dob').eq('client_id', app.client_id).maybeSingle(),
        sbAny.from('clients').select('full_name, email, phone, pan, city').eq('id', app.client_id).maybeSingle(),
      ])
      const basic: any = basicRes?.data || {}
      const identity: any = identityRes?.data || {}
      const c: any = clientRes?.data || {}
      clientName = basic.investor_name || c.full_name || clientName
      clientEmail = basic.email || c.email || clientEmail
      clientPhone = basic.phone || c.phone || clientPhone
      clientPan = identity.pan_number || c.pan || ''
      const addressParts = [
        basic.address,
        identity.address,
        identity.city || c.city,
        identity.state,
        identity.pincode,
      ].filter((part: any) => part && String(part).trim().length > 0)
      clientAddress = Array.from(new Set(addressParts.map((s: any) => String(s).trim()))).join(', ')
    }
  } catch { /* fall back to whatever the application row already had */ }

  const amount = Number(app.final_investment_amount) || Number(app.investment_amount) || 0
  const numDebentures = Math.floor(amount / 10)
  const amountWords = numberToWords(amount)
  const fund = app.fund_vehicle || 'Alternate route to Invest in AIF via Debenture'
  const investmentDate = app.final_investment_date || app.investment_date || app.created_at || new Date().toISOString()
  const dateStr = new Date(investmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const longDateStr = new Date(investmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  // Tests 28-04-2026 #5: prefer the persisted reference_number (GHLVEN/100/2526
  // format generated server-side on approval); fall back to a freshly built
  // FY-aware reference for previews of un-approved applications.
  const refNo = app.reference_number || (() => {
    const d = new Date(investmentDate)
    const month = d.getUTCMonth()
    const year = d.getUTCFullYear()
    const startYear = month >= 3 ? year : year - 1
    const fyCode = `${String(startYear).slice(-2)}${String(startYear + 1).slice(-2)}`
    return `GHLVEN/100/${fyCode}`
  })()
  const folioNo = `D${(app.id || '').replace(/-/g,'').slice(0,4).toUpperCase()}`
  const certNo = `${(app.id || '').replace(/-/g,'').slice(0, 3).toUpperCase()}`
  const tenure = app.tenure_preference || '3 years'

  const css = `<style>
    /* 2026-05-16: bumped top print margin to 32mm so the first line of the
       document body sits well below the browser-injected print header
       (date / URL) and the page feels less crowded at the top. Side and
       bottom margins unchanged. */
    @page{size:A4;margin:32mm 20mm 20mm 20mm;}
    *{box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#222;line-height:1.6;font-size:12px;margin:0;padding:0;max-width:210mm;margin-left:auto;margin-right:auto;padding:20mm;overflow-wrap:break-word;word-wrap:break-word;}
    table{width:100%;border-collapse:collapse;table-layout:fixed;}
    th,td{border:1px solid #333;padding:6px 10px;text-align:left;font-size:11px;overflow-wrap:break-word;word-wrap:break-word;}
    th{background:#f5f5f5;font-weight:700;}
    .header{text-align:center;padding:16px 0 12px;border-bottom:3px solid #D0021B;margin-bottom:20px;}
    .header h1{color:#D0021B;margin:0;font-size:26px;font-weight:800;letter-spacing:2px;}
    .header .sub{color:#555;font-size:10px;margin:4px 0 0;}
    .footer{margin-top:40px;border-top:2px solid #D0021B;padding:12px 0;text-align:center;font-size:9px;color:#666;}
    .footer h2{color:#D0021B;font-size:16px;margin:0 0 4px;}
    .bold{font-weight:700;}
    .right{text-align:right;}
    .center{text-align:center;}
    .mt{margin-top:16px;} .mb{margin-bottom:16px;}
    .note{font-size:10px;color:#666;font-style:italic;}
    .e{border-bottom:1.5px dashed #D0021B;padding:1px 4px;min-width:60px;display:inline-block;outline:none;background:rgba(208,2,27,0.03);}
    .e:focus{background:rgba(208,2,27,0.08);border-bottom-color:#D0021B;border-bottom-style:solid;}
    td .e{display:inline;min-width:auto;}
    .toolbar{position:fixed;top:0;left:0;right:0;background:#1a1a2e;padding:8px 20px;display:flex;align-items:center;justify-content:space-between;z-index:9999;box-shadow:0 2px 12px rgba(0,0,0,0.3);}
    .toolbar span{color:#ccc;font-size:13px;}
    .toolbar button{padding:8px 20px;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;margin-left:8px;}
    .btn-print{background:#D0021B;color:#fff;}
    .btn-print:hover{background:#b00218;}
    .btn-close{background:#333;color:#ccc;}
    .btn-close:hover{background:#444;}
    @media print{.toolbar{display:none!important;}.e{border-bottom:none!important;background:transparent!important;}body{padding:0!important;max-width:none;}-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    @media screen{body{padding-top:50px;background:#f5f5f5;}#docContent{background:#fff;padding:20mm;max-width:210mm;margin:0 auto;box-shadow:0 2px 20px rgba(0,0,0,0.1);}}
  </style>`

  /** Helper: wraps a value in a contenteditable span */
  const ed = (val: string | number) => '<span class="e" contenteditable="true">' + val + '</span>'

  const toolbar = `<div class="toolbar">
    <span>&#9998; Click any <span style="border-bottom:1.5px dashed #D0021B;color:#fff;padding:0 4px;">highlighted field</span> to edit before printing</span>
    <div>
      <button class="btn-close" onclick="window.close()">Close</button>
      <button class="btn-print" onclick="window.print()">&#128438; Print / Save PDF</button>
    </div>
  </div>`

  const numberToWordsJS = `function numberToWords(n){if(n===0)return'Zero';var ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];var tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];function tw(x){if(x<20)return ones[x];return tens[Math.floor(x/10)]+(x%10?' '+ones[x%10]:'');}function th(x){if(x>=100)return ones[Math.floor(x/100)]+' Hundred'+(x%100?' '+tw(x%100):'');return tw(x);}var cr=Math.floor(n/10000000),lk=Math.floor((n%10000000)/100000),tk=Math.floor((n%100000)/1000),r=n%1000,w='';if(cr)w+=th(cr)+' Crore ';if(lk)w+=tw(lk)+' Lakh ';if(tk)w+=tw(tk)+' Thousand ';if(r)w+=th(r);return w.trim();}`

  const logo = `<div style="text-align:center;margin-bottom:8px;">
    <div style="font-size:32px;font-weight:900;color:#2d6a2e;letter-spacing:4px;font-family:Arial,sans-serif;">LANDMA<span style="color:#E8A317;">X</span>O</div>
    <div style="font-size:10px;color:#666;letter-spacing:3px;margin-top:-2px;">Invest&bull; Earn&bull; Repeat</div>
  </div>`

  const header = `${logo}`

  const footer = `<div class="footer" style="background:#fffde8;padding:16px;margin-top:40px;border-top:3px solid #2d6a2e;">
    <h2 style="color:#2d6a2e;font-size:16px;margin:0 0 4px;">LANDMAXO PROPERTIES PRIVATE LIMITED</h2>
    <div>CIN: U70109TN2022PTC151180</div>
    <div>Email: info@landmaxo.com</div>
    <div>Desk No 12, 2D, Queens Court, Montieth Road, Egmore, Chennai-600008.</div>
  </div>`

  // 2026-05-16: per request, the Acknowledgement Letter, Allotment Letter,
  // and Debenture Agreement render the centred dynamic body only — no
  // top Landmaxo logo and no green footer band. The Debenture Certificate
  // is intentionally left untouched since the seal/border layout depends
  // on the logo + footer staying in place.
  const templates: Record<string, string> = {
    acknowledgement: `${css}
      <style>
        /* 2026-05-19: no logo — header/footer reserved bands removed per
           handwritten review. Body text justified, header tightened so the
           Ref / Date and the addressee block sit immediately under each
           other, and the receipt table is given 30px of vertical breathing
           room above and below. */
        .ack-body{padding:30px;}
        .ack-body p{text-align:justify;}
        .ack-body p,.ack-body table{break-inside:avoid;page-break-inside:avoid;}
        .ack-head{margin:0 0 4px;}
        .ack-addr{margin:0 0 18px;}
        .ack-receipt{margin:30px 0;}
      </style>
      <body>
      <div class="ack-body">
      <p class="ack-head" style="text-align:left;">Ref: [REF] <span style="float:right;">Date: [DATE]</span></p>
      <p class="ack-addr" style="text-align:left;">[NAME],<br/>[ADDRESS]<br/>[PHONE]</p>
      <p style="text-align:left;"><strong>Subject: Acknowledgement of investment receipt</strong></p>
      <p style="text-align:left;">Dear [NAME],</p>
      <p style="text-align:left;"><strong>Landmaxo Properties welcomes you to the new Dawn of Wealth Creation and prosperity</strong></p>
      <p>We are delighted to welcome you to <strong>Landmaxo Properties</strong>, where your financial aspirations take shape and transform into lasting success. By joining us, you have become an integral part of our <strong>prestigious family of visionary investors</strong> &mdash; individuals who believe in creating wealth with wisdom and foresight.</p>
      <p>Your decision to partner with Landmaxo Properties marks a <strong>powerful first step toward true financial freedom</strong>. Together, let us shape a future defined by prosperity, stability, and enduring success.</p>
      <p>Welcome once again to Landmaxo Properties &mdash; <strong>where your prosperity is our purpose</strong>.</p>
      <p>We acknowledge receipt of your investment towards the <strong>subscription of debentures in Landmaxo Properties Private Limited</strong>, as detailed below:</p>
      <table class="ack-receipt">
        <tr><th>S.No</th><th>Date of Receipt</th><th>Amount (&#8377;)</th><th>Amount in Words</th></tr>
        <tr><td>1</td><td>[DATE]</td><td>[AMOUNT]</td><td>[AMOUNT_WORDS] Rupees Only</td></tr>
      </table>
      <p>The debentures carry an <strong>interest rate of 1% per month</strong> along with an <strong>annual appreciation of 12%</strong>, for a <strong>minimum tenure of three (3) years</strong> from the date of investment. Interest will be paid on or before the <strong>10th of each month</strong>, after deduction of applicable <strong>TDS (currently 10%)</strong> under the Income Tax Act, 1961.</p>
      <p>Debentures may be <strong>redeemed at the investor&rsquo;s option</strong> after completion of the 3-year tenure. <strong>TDS credits</strong> will be reflected in the investor&rsquo;s PAN account on a <strong>quarterly basis</strong>.</p>
      <p class="note" style="text-align:left;">* This is system generated document. Signature authentication is not required. *</p>
      </div>
      </body>`,

    allotment: `${css}<body>
      <p>To <span style="float:right;">Date: [DATE]</span></p>
      <p><strong>[NAME]</strong>,<br/>[ADDRESS]</p>
      <p class="center bold">Subject: Allotment of [FUND]</p>
      <p>Dear [NAME],</p>
      <p>This is with reference to your Investment, I am directed by the Board of Directors to inform you that you have been allotted <strong>[NUM_DEB] [FUND]</strong> of Rs.10/- each. The tenure of debentures is for [TENURE].</p>
      <p>These debentures are allotted to you as per the resolution passed at the Board meeting held on [DATE] and as per the terms and conditions of Articles of Association of the company.</p>
      <p>Details of allotment are as follows:</p>
      <table style="font-size:10px;">
        <tr>
          <th rowspan="2">Folio No</th>
          <th rowspan="2">No Of Debentures</th>
          <th colspan="2">Distinctive Nos.</th>
          <th rowspan="2">Amount Received in Rs</th>
          <th rowspan="2">Fund Type</th>
          <th rowspan="2">Rate Of Interest</th>
          <th rowspan="2">Tenure</th>
        </tr>
        <tr><th>From</th><th>To</th></tr>
        <tr>
          <td>[FOLIO]</td>
          <td>[NUM_DEB]</td>
          <td>1010001</td>
          <td>[NUM_DEB_RAW]</td>
          <td>[AMOUNT]</td>
          <td style="font-size:9px;">[FUND]</td>
          <td>1% (per month)</td>
          <td>[TENURE]</td>
        </tr>
      </table>
      <p class="mt">Duly signed and executed debenture certificate will be sent to you.</p>
      <p class="mt center"><em>* This is a computer generated document and does not require signature. *</em></p>
      </body>`,

    certificate: `${css}
      <style>
        /* 2026-05-19: handwritten review — no logo (text mark removed),
           30px padding on the certificate body, dynamic distinctive range
           and folio/cert numbers, justified prose block. The double-gold
           border and company seal placeholder are retained because they
           define the certificate look. */
        .cert-border{border:4px double #C8A951;padding:30px;margin:10px;background:#fff;}
        .cert-title{text-align:center;font-size:24px;font-weight:800;letter-spacing:3px;margin-bottom:8px;color:#333;}
        .cert-company{text-align:center;font-size:18px;font-weight:700;margin-bottom:4px;}
        .cert-sub{text-align:center;font-size:10px;color:#555;margin-bottom:30px;}
        .cert-body{line-height:1.8;font-size:12px;}
        .cert-body p{text-align:justify;}
        .cert-highlight{text-align:center;background:#f8f8f0;border:1px solid #C8A951;padding:12px;margin:18px 0;font-weight:700;font-size:13px;}
        .cert-fields td{padding:8px 14px;font-size:12px;border:none;vertical-align:top;}
        .cert-fields td:first-child{color:#666;width:220px;}
      </style>
      <body>
      <div class="cert-border">
        <div class="cert-title">DEBENTURE CERTIFICATE</div>
        <div class="cert-company">LANDMAXO PROPERTIES PRIVATE LIMITED</div>
        <div class="cert-sub">(CIN: U70109TN2022PTC151180) &nbsp;|&nbsp; (Incorporated under the Companies Act, 2013)<br/>Reg. Office: 2D, 2nd Floor, Queens Court, No. 6 Montieth Road, Egmore, Chennai - 600008, Tamil Nadu, India</div>
        <div class="cert-body">
          <p>This is to certify that <strong>[NAME]</strong> is the Registered/Beneficial Holder of the within mentioned debenture(s) bearing the distinctive number(s) herein specified in the above-named Company subject to the Memorandum and Articles of Association of the Company and that the amount endorsed herein has been paid up on each such debenture.</p>
          <div class="cert-highlight">
            DEBENTURE FACE VALUE: RUPEES 10/- EACH (Nominal Value)<br/>
            AMOUNT PAID UP PER DEBENTURE: RUPEES 10/- (Rupees Ten Only)
          </div>
          <table class="cert-fields" style="width:100%;">
            <tr><td>Regd. Folio No. <strong>[FOLIO]</strong></td><td class="right">Certificate No. <strong>[CERT_NO]</strong></td></tr>
          </table>
          <table class="cert-fields" style="width:100%;margin-top:12px;">
            <tr><td>Name of the Registered<br/>Debenture Holder</td><td class="bold">[NAME]</td></tr>
            <tr><td>No. of Debenture(s) held</td><td class="bold">[NUM_DEB] ([NUM_DEB_WORDS] Only)</td></tr>
            <tr><td>Distinctive No.(s)</td><td class="bold">[DISTINCTIVE_FROM] to [DISTINCTIVE_TO] (Both inclusive)</td></tr>
            <tr><td>Total Value of Debenture(s)</td><td class="bold">Rs. [AMOUNT]/- ([AMOUNT_WORDS] Rupees Only)</td></tr>
            <tr><td>Rate of Interest</td><td class="bold">12% per annum (1% per month)</td></tr>
            <tr><td>Date of Issue</td><td class="bold">[LONG_DATE_ORDINAL]</td></tr>
          </table>
          <p class="mt">GIVEN under the common seal of the Company this <strong>[LONG_DATE_ORDINAL]</strong>.</p>
          <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:60px;">
            <div style="text-align:center;width:160px;"><div style="padding-top:4px;font-weight:700;">Director</div></div>
            <div style="text-align:center;"><div style="width:80px;height:80px;border:2px solid #C8A951;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;color:#999;">Company<br/>Seal</div></div>
            <div style="text-align:center;width:180px;"><div style="padding-top:4px;font-weight:700;">Authorised Signatory<br/>V. Rajkumar</div></div>
          </div>
        </div>
      </div>
      </body>`,

    // 2026-05-16: Debenture Agreement re-templated to match the
    // Landmaxo reference (no logo, no footer; top half of page 1
    // intentionally blank so a physical Rs.100 non-judicial stamp
    // paper can be affixed; agreement body starts mid-page-1).
    // Dynamic fields: [LONG_DATE_ORDINAL] ("27th of February, 2026"),
    // [SHORT_DATE] ("27-02-2026"), [NAME], [NAME_CAPS], [ADDRESS],
    // [EMAIL], [NUM_DEB], [AMOUNT]. All other field names from the
    // prior template are still supported by the populator but
    // unused in this body.
    agreement: `${css}
      <style>
        /* 2026-05-19: handwritten review — justify body pages, remove the
           signature dashes (bare names only), 30px breathing room around
           paragraphs/tables, bold cover & signature roles, drop the bold
           from the centred "BETWEEN", and force a clean page break before
           each of the three sections the reviewer marked (Page-2: "IT IS
           NOW AGREED AS UNDER", Page-3: "7. Representations and Warranties",
           Page-5: "12. Miscellaneous"). */
        p,li{orphans:3;widows:3;}
        .agreement-body p,.agreement-body li{text-align:justify;}
        .agreement-body{padding:30px;}
        .clause{margin-bottom:10px;line-height:1.6;break-inside:avoid;page-break-inside:avoid;}
        .clause-title{font-weight:700;margin-top:18px;margin-bottom:8px;font-size:13px;break-after:avoid;page-break-after:avoid;}
        .schedule-table{break-inside:avoid;page-break-inside:avoid;margin-top:30px;}
        .schedule-table td,.schedule-table th{border:1px solid #999;padding:10px 12px;font-size:11px;}
        .schedule-table tr{break-inside:avoid;page-break-inside:avoid;}
        .page-break{page-break-after:always;break-after:page;}
        .stamp-spacer{height:135mm;}
        .agreement-cover{min-height:220mm;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;font-size:14px;line-height:2.2;break-inside:avoid;page-break-inside:avoid;font-weight:700;}
        .agreement-cover p{font-weight:700;}
        .notices-table{width:100%;border-collapse:collapse;font-size:11px;margin:8px 0 30px;break-inside:avoid;page-break-inside:avoid;}
        .notices-table thead{display:table-header-group;}
        .notices-table tr{break-inside:avoid;page-break-inside:avoid;}
        .notices-table th,.notices-table td{border:1px solid #999;padding:8px 12px;vertical-align:top;}
        .sig-row{display:flex;justify-content:space-between;align-items:flex-start;break-inside:avoid;page-break-inside:avoid;}
        .sig-block{width:45%;break-inside:avoid;page-break-inside:avoid;}
        /* No underline beneath signatures — names sit on their own,
           with 30px of space above where the dash used to be. */
        .sig-line{padding-top:0;font-size:11px;margin-top:30px;font-weight:700;}
        ol.whereas{padding-left:22px;}
        ol.whereas li{margin-bottom:12px;line-height:1.6;break-inside:avoid;page-break-inside:avoid;}
        h2,h3{break-after:avoid;page-break-after:avoid;}
      </style>
      <body>
      <div class="agreement-body">

      <!-- ── Page 1 — Stamp paper preamble ─────────────
           Top half is left blank intentionally so a physical
           Rs. 100 non-judicial stamp paper can be affixed by
           the company. The agreement preamble + signatures
           sit in the lower half. -->
      <div class="stamp-spacer"></div>
      <p style="line-height:1.7;">This Stamp paper form part of Debenture Investment Agreement dated <strong>[LONG_DATE_ORDINAL]</strong>, entered between <strong>LANDMAXO PROPERTIES PRIVATE LIMITED</strong> and <strong>[NAME]</strong>.</p>

      <div class="sig-row" style="margin-top:32mm;">
        <div class="sig-block">
          <p class="bold">For Landmaxo Properties Pvt Ltd</p>
          <p class="sig-line">V. Rajkumar<br/>(Authorised Signatory)</p>
        </div>
        <div class="sig-block" style="text-align:left;">
          <p class="bold">Investor</p>
          <p class="sig-line">[NAME]<br/>(Investor)</p>
        </div>
      </div>

      <div class="page-break"></div>

      <!-- ── Page 2 — Title / Cover (fully bold per review) ──────── -->
      <div class="agreement-cover">
        <p style="font-size:16px;font-weight:700;letter-spacing:1px;margin:0 0 24px;">DEBENTURE INVESTMENT AGREEMENT</p>
        <p style="margin:0 0 24px;font-weight:700;">EXECUTED BETWEEN</p>
        <p style="font-weight:700;margin:0 0 4px;">LANDMAXO PROPERTIES PRIVATE LIMITED</p>
        <p style="margin:0 0 24px;font-weight:700;">(&ldquo;COMPANY&rdquo;)</p>
        <p style="margin:0 0 24px;font-weight:700;">AND</p>
        <p style="font-weight:700;margin:0 0 4px;">[NAME_CAPS]</p>
        <p style="margin:0;font-weight:700;">(&ldquo;INVESTOR&rdquo;)</p>
      </div>

      <div class="page-break"></div>

      <!-- ── Page 3 (Page-1 in review) — Title, parties intro, WHEREAS ── -->
      <h2 class="center">DEBENTURE INVESTMENT AGREEMENT</h2>
      <p class="mt">This <strong>DEBENTURE INVESTMENT AGREEMENT</strong> is made on this <strong>[LONG_DATE_ORDINAL]</strong>,</p>
      <p class="center">BETWEEN</p>
      <p class="clause"><strong>M/s. Landmaxo Properties Private Limited</strong> (CIN: U70109TN2022PTC151180) a private limited Company incorporated under the Companies Act, 2013 and having Registered office at 2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai - 600008 (hereinafter referred to as the &ldquo;<strong>Company</strong>&rdquo;), represented through its Authorised Signatory Mr. V.Rajkumar of the <strong>FIRST PART</strong>; and</p>
      <p class="clause"><strong>[NAME]</strong>, Residing At [ADDRESS] (hereinafter referred to as the &ldquo;<strong>Investor</strong>&rdquo;) and shall unless it be repugnant to the context or meaning thereof be deemed to mean and include him/herself and his/her nominees to the extent specified herein and their respective heirs, executors, administrators and assigns of the <strong>SECOND PART</strong>;</p>

      <p class="mt"><strong>WHEREAS:</strong></p>
      <ol class="whereas">
        <li>The Company is engaged in the business of Flipping of Stressed Real Estate Asset, by investing its fund into the units of various AIF registered with the Securities and Exchange Board of India.</li>
        <li>The Investor has accepted the offer made by the Company for the subscription of <strong>12% Redeemable, Secured, Non-Convertible Debentures</strong> with premium for redemption @12% per Annum <strong>(total 24%)</strong> (hereinafter referred to as the &ldquo;<strong>Debentures</strong>&rdquo;) for a minimum term of <strong>three (3) years</strong> and maximum term of <strong>ten (10) years</strong>, and the Company has agreed to issue and allot the said Debentures to the Investor.</li>
        <li>The Parties now wish to record the terms and conditions of their mutual understanding in respect of this Transaction.</li>
      </ol>

      <div class="page-break"></div>

      <!-- ── Page 4 (Page-2 in review) — Clauses 1 through 6 ── -->
      <p><strong>IT IS NOW AGREED AS UNDER:</strong></p>

      <div class="clause-title">1. Subscription for Debenture</div>
      <p class="clause">Investor agrees to subscribe for, and the Company agrees to issue and allot to Investor, such number of Debentures at such price as is set out against their name in <strong>&ldquo;Schedule I&rdquo;</strong>.</p>

      <div class="clause-title">2. Interest</div>
      <p class="clause">The Interest for the Debenture is fixed at 12 % per annum (payable @ 1%/month). TDS shall be deductible as per the rate specified in Income Tax act, 1961. The total sum of interest payable per annum inclusive of TDS is Rs. [INTEREST_AMOUNT]/Annum ([INTEREST_AMOUNT_WORDS] only)</p>

      <div class="clause-title">3. Appreciation</div>
      <p class="clause">The Debenture Value shall accrue appreciation at the rate of twelve percent <strong>(12%) per annum</strong>, calculated on a simple interest basis and not on a compounding basis. Such appreciation shall be added to the principal Debenture Value as premium and at the time of redemption which shall be treated as premium payable upon redemption. The applicable appreciation rates, accrual methodology, and the corresponding redemption values shall be as published and updated from time to time in the Investor Dashboard section of the GHL India Ventures website, and such published information shall be deemed to form an integral and binding part of this Agreement.</p>

      <div class="clause-title">4. Tenure</div>
      <p class="clause">Total tenure is 10 years with option to redeem at any time after 3 years at the option of the investor.</p>

      <div class="clause-title">5. Redemption</div>
      <p class="clause">The Debentures will be redeemed at a premium @ 12% per Annum by the Company at the end of the tenure. Upon full and final payment towards redemption of debentures, the Company shall file a Satisfaction of charge with the Registrar of Companies.</p>

      <div class="clause-title">6. Security Creation</div>
      <p class="clause">The Company shall, for securing the due repayment of the Debentures together with interest, appoint a Debenture Trustee in accordance with applicable laws. Upon completion of the issue and allotment of the Debentures, the Company shall execute a Mortgage Deed - Pledge Agreement in respect of the identified asset (Property, Units of AIF) in favour of the Debenture Trustee, who shall hold the same for the benefit of and in trust for the Debenture-holders.</p>

      <div class="page-break"></div>

      <!-- ── Page 5 (Page-3 in review) — Clauses 7 through 11 ── -->
      <div class="clause-title">7. Representations and Warranties</div>
      <p class="clause">The Company represents to the Investor that:</p>
      <p class="clause">The Company is a duly incorporated and validly existing Company under the laws of India, and has full power and authority to enter into this Agreement and to perform its obligations under this Agreement;</p>
      <p class="clause">The execution and delivery of this Agreement by the Company and the performance of its obligations under this Agreement have been duly and validly authorized by all necessary corporate action. This Agreement constitutes a legal, valid, and binding obligation of the Company, enforceable against the Company in accordance with the terms contained herein.</p>
      <p class="clause">The Company has the power and authority to issue Debentures to the Investor.</p>

      <div class="clause-title">8. Termination</div>
      <p class="clause"><strong>8.1</strong> This Agreement shall terminate in the manner stated below:</p>
      <p class="clause" style="padding-left:18px;"><strong>8.1.1</strong> With respect to any Party, upon transfer of a Debenture, such Party ceases to hold any Debenture or</p>
      <p class="clause" style="padding-left:18px;"><strong>8.1.2</strong> With respect to any Party, upon redemption of a Debenture, such Party ceases to hold any Debenture or</p>
      <p class="clause"><strong>8.2</strong> The rights and obligations of the Parties under this Agreement, which either expressly or by their nature survive the termination of this Agreement, shall not be extinguished by the termination of this Agreement.</p>
      <p class="clause"><strong>8.3</strong> The termination of this Agreement in any of the circumstances aforesaid shall not in any way affect or prejudice any right accrued to any Party against the other Parties, prior to such termination</p>

      <div class="clause-title">9. Notices</div>
      <p class="clause"><strong>9.1</strong> All notices which are required to be given hereunder shall be in writing and shall be sent to the address of the recipient set out in the Agreement or such other address as the recipient may designate by notice given in writing to all the Parties. Any such notice may be delivered personally or by registered post, with acknowledgement of delivery due, e-mail, or facsimile transmission (receipt confirmed).</p>
      <p class="clause">Unless otherwise changed by notice delivered in the manner provided above, the addresses to which notices and other communications shall be sent shall be as follows:</p>

      <table class="notices-table">
        <thead>
          <tr>
            <th>If to the Company:</th>
            <th>If to the Investor:</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Kind Attn:</strong> Mr. V. Rajkumar</td>
            <td><strong>Kind Attn:</strong> [NAME]</td>
          </tr>
          <tr>
            <td><strong>Address:</strong> Landmaxo Properties Private Limited, 2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai - 600008</td>
            <td><strong>Address:</strong> [ADDRESS]</td>
          </tr>
          <tr>
            <td><strong>e-mail ID:</strong> sales@ghlindiaventures.com</td>
            <td><strong>e-mail ID:</strong> [EMAIL]</td>
          </tr>
        </tbody>
      </table>

      <div class="clause-title">10. Dispute Resolution:</div>
      <p class="clause"><strong>10.1</strong> If any dispute arises between any of the Parties hereto during the subsistence or thereafter, in connection with the validity, interpretation, implementation or alleged breach of any provision of this Agreement or regarding any question, including the question as to whether the termination of this Agreement by any Party hereto has been legitimate, the Parties hereto shall endeavour to settle such dispute amicably. The attempt to bring about an amicable settlement is considered to have failed as soon as one of the Parties hereto, after reasonable attempts, which attempt shall continue for not less than 15 (fifteen) days, gives 15 (fifteen) days notice thereof to the other Party in writing.</p>
      <p class="clause"><strong>10.2</strong> In case of such failure, the dispute shall be referred to a sole arbitrator. The arbitration proceedings shall be governed by the provisions of the Arbitration and Conciliation Act, 1996. In the event of a failure to agree upon a sole arbitrator within a period of 15 (fifteen) days of receipt of notice, 1 (one) arbitrator each shall be appointed by the Company, on the one hand, and the Investor, on the other hand. The two arbitrators so appointed shall together appoint a third arbitrator, who shall be the chairperson of the arbitral panel. It is expressly clarified that these dispute resolution provisions apply to claims or disputes concerning any and all Parties to this Agreement and not just to disputes between the Company and the Investor.</p>
      <p class="clause"><strong>10.3</strong> The arbitration proceedings shall be held at Chennai. The arbitration proceedings shall be in English language. The award shall be substantiated in writing. The court of arbitration shall also decide on the costs of the arbitration proceedings. The award shall be binding on the disputing Parties subject to applicable laws and the award shall be enforceable in any competent court of law. The provisions of this survive the termination of this Agreement for any reason whatsoever. Clause 9 shall The courts at Chennai shall have exclusive jurisdiction.</p>

      <div class="clause-title">11. Governing Jurisdiction:</div>
      <p class="clause">This Agreement shall be governed by the laws of the Republic of India. Incase dispute araised between the parties to the agreement is not resolved through Court of Arbitration, then the parties shall approach the High Courts in Chennai, India which has exclusive jurisdiction in respect of all disputes arising out of this Agreement.</p>

      <div class="page-break"></div>

      <!-- ── Page 6 (Page-5 in review) — Miscellaneous + signatures ── -->
      <div class="clause-title">12. Miscellaneous</div>
      <p class="clause"><strong>12.1 Amendment:</strong> No variation of this Agreement shall be valid unless it is in writing and signed by the Company and by the Investor.</p>
      <p class="clause"><strong>12.2 Non-disclosure:</strong> Each of the parties agrees to keep secret and confidential and not to use, disclose or divulge to any third party or to enable or cause any person to become aware of (except for the purposes of the Company&rsquo;s business) any confidential information relating to the Company including but not limited to IP Rights (whether owned or licensed by the Company), lists of customers, reports, notes, memoranda and all other documentary records pertaining to the Company or its business affairs, finances, suppliers, customers or contractual or other arrangements but excluding any information which is in the public domain (otherwise than through the wrongful disclosure of any party) or which a party is required to disclose by law or by the rules of any regulatory body to it or the Company is subject.</p>
      <p class="clause"><strong>12.3</strong> The Company shall bear the costs and disbursements incurred in negotiating and closing this Agreement and of matters incidental to this Agreement.</p>
      <p class="clause"><strong>12.4</strong> The Company shall not be considered in breach of this Agreement to the extent that performance of their respective obligations is prevented by an Event of Force Majeure.</p>
      <p class="clause"><strong>12.5</strong> This Agreement shall be binding on and endure for the benefit of each party&rsquo;s personal representatives and successors in title. This includes any successor to any Debenture in the Company transferred in accordance with this Agreement.</p>
      <p class="clause"><strong>12.6</strong> Nothing in this Agreement establishes a partnership between the parties.</p>
      <p class="clause"><strong>12.7</strong> This Agreement may be executed in any number of counterparts each of which when executed by one or more of the parties hereto shall constitute an original but all of which shall constitute one and the same instrument.</p>
      <p class="clause"><strong>12.8</strong> This Agreement has been executed and delivered on the Execution Date.</p>

      <p class="mt"><strong>Signature:</strong></p>

      <div class="sig-row" style="margin-top:16px;">
        <div class="sig-block">
          <p class="bold">For Landmaxo Properties Pvt Ltd</p>
          <p class="sig-line">V. Rajkumar<br/>(Authorised Signatory)</p>
        </div>
        <div class="sig-block" style="text-align:left;">
          <p class="bold">Investor</p>
          <p class="sig-line">[NAME]<br/>(Investor)</p>
        </div>
      </div>

      <div class="page-break"></div>

      <!-- ── Schedule I (Page-6 in review) ────────────── -->
      <h3 class="center" style="margin-top:0;">Schedule - I</h3>
      <table class="schedule-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Date</th>
            <th>Name</th>
            <th>No. of Debentures</th>
            <th>Nominal Value (in Rs.)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1.</td>
            <td>[SHORT_DATE]</td>
            <td>[NAME]</td>
            <td>[NUM_DEB]</td>
            <td>[AMOUNT]</td>
          </tr>
          <tr>
            <td colspan="3" class="right bold">Total</td>
            <td class="bold">[NUM_DEB]</td>
            <td class="bold">[AMOUNT]</td>
          </tr>
        </tbody>
      </table>
      </div>
      </body>`,
  }

  // Tests 28-04-2026 #10: render the document directly with KYC data
  // already substituted in. The admin doesn't need to fill anything in;
  // the toolbar still allows printing or saving as PDF.
  const titles: Record<string, string> = { acknowledgement: 'Acknowledgement Letter', allotment: 'Allotment Letter', certificate: 'Debenture Certificate', agreement: 'Debenture Agreement' }

  const escapeHtml = (s: string) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  const safeName = escapeHtml(clientName || 'Investor')
  const safeEmail = escapeHtml(clientEmail || '—')
  const safePhone = escapeHtml(clientPhone || '—')
  const safeAddress = escapeHtml(clientAddress || '—').replace(/\n/g, '<br/>')
  const safePan = escapeHtml(clientPan || '—')
  const safeFund = escapeHtml(fund)
  const safeRef = escapeHtml(refNo)
  const safeFolio = escapeHtml(folioNo)
  const safeCert = escapeHtml(certNo)
  const safeTenure = escapeHtml(tenure)
  const safeAmt = amount.toLocaleString('en-IN')
  const safeAmtWords = escapeHtml(amountWords || '')
  const safeNumDeb = numDebentures.toLocaleString('en-IN')
  const safeNumDebRaw = String(numDebentures)
  // 2026-05-16: new fields for the re-templated Debenture Agreement.
  // [LONG_DATE_ORDINAL]: "27th of February, 2026" — legal-prose date
  //   with English ordinal suffix.
  // [SHORT_DATE]: "27-02-2026" — Schedule I cell, dash-separated.
  // [NAME_CAPS]: ALL-CAPS variant for the cover page.
  const ordinalSuffix = (n: number): string => {
    const v = n % 100
    if (v >= 11 && v <= 13) return n + 'th'
    switch (n % 10) {
      case 1: return n + 'st'
      case 2: return n + 'nd'
      case 3: return n + 'rd'
      default: return n + 'th'
    }
  }
  const dateObj = new Date(investmentDate)
  const longDateOrdinal = isFinite(dateObj.getTime())
    ? `${ordinalSuffix(dateObj.getDate())} of ${dateObj.toLocaleDateString('en-IN', { month: 'long' })}, ${dateObj.getFullYear()}`
    : longDateStr
  const shortDateDash = isFinite(dateObj.getTime())
    ? `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`
    : dateStr
  const safeNameCaps = escapeHtml((clientName || 'Investor').toUpperCase())

  // 2026-05-19: handwritten review — make the previously hard-coded
  // "Rs. 1,20,000 (One Lakh Twenty Thousand)" interest line and the
  // certificate distinctive-number range fully dynamic. Interest =
  // 12% of the principal investment, distinctive range walks
  // (1010001..1010000+NUM_DEB) so each certificate stays unique.
  const interestAmount = Math.round(amount * 0.12)
  const safeInterestAmount = interestAmount.toLocaleString('en-IN')
  const safeInterestWords = escapeHtml(numberToWords(interestAmount))
  const distinctiveFrom = 1010001
  const distinctiveTo = numDebentures > 0 ? distinctiveFrom + numDebentures - 1 : distinctiveFrom
  const safeDistinctiveFrom = distinctiveFrom.toLocaleString('en-IN')
  const safeDistinctiveTo = distinctiveTo.toLocaleString('en-IN')
  const safeNumDebWords = escapeHtml(numberToWords(numDebentures))

  const populated = templates[type]
    // Order matters: replace the more specific placeholders BEFORE
    // the bare ones (NAME_CAPS before NAME) so the bare regex
    // doesn't eat the prefix of the specific name.
    .replace(/\[LONG_DATE_ORDINAL\]/g, escapeHtml(longDateOrdinal))
    .replace(/\[SHORT_DATE\]/g, escapeHtml(shortDateDash))
    .replace(/\[NAME_CAPS\]/g, safeNameCaps)
    .replace(/\[NAME\]/g, safeName)
    .replace(/\[EMAIL\]/g, safeEmail)
    .replace(/\[PHONE\]/g, safePhone)
    .replace(/\[DATE\]/g, escapeHtml(longDateStr || dateStr))
    .replace(/\[ADDRESS\]/g, safeAddress)
    .replace(/\[AMOUNT\]/g, safeAmt)
    .replace(/\[AMOUNT_WORDS\]/g, safeAmtWords)
    .replace(/\[TENURE\]/g, safeTenure)
    .replace(/\[REF\]/g, safeRef)
    .replace(/\[FOLIO\]/g, safeFolio)
    .replace(/\[RATE\]/g, '1% per month')
    .replace(/\[FUND\]/g, safeFund)
    .replace(/\[NUM_DEB_WORDS\]/g, safeNumDebWords)
    .replace(/\[NUM_DEB\]/g, safeNumDeb)
    .replace(/\[NUM_DEB_RAW\]/g, safeNumDebRaw)
    .replace(/\[CERT_NO\]/g, safeCert)
    .replace(/\[PAN\]/g, safePan)
    .replace(/\[INTEREST_AMOUNT_WORDS\]/g, safeInterestWords)
    .replace(/\[INTEREST_AMOUNT\]/g, safeInterestAmount)
    .replace(/\[DISTINCTIVE_FROM\]/g, safeDistinctiveFrom)
    .replace(/\[DISTINCTIVE_TO\]/g, safeDistinctiveTo)

  const fullPage = `<!DOCTYPE html><html><head><title>${escapeHtml(titles[type])} - ${safeName}</title>${css}
  <style>#docContent{max-width:210mm;margin:0 auto;background:#fff;padding:20mm;box-shadow:0 2px 20px rgba(0,0,0,0.1);}@media print{#docContent{max-width:none;padding:0;box-shadow:none;}body{padding-top:0!important;}}</style>
  </head><body style="background:#f5f5f5;margin:0;padding:60px 0 20px;">
  ${toolbar}
  <div id="docContent">${populated.replace(css, '').replace(/\$\{toolbar\}/g, '')}</div>
  </body></html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(fullPage)
  win.document.close()
}

/** Convert number to Indian words (Lakh/Crore system) */
function numberToWords(n: number): string {
  if (n === 0) return 'Zero'
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  function twoDigit(x: number): string {
    if (x < 20) return ones[x]
    return tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : '')
  }
  function threeDigit(x: number): string {
    if (x >= 100) return ones[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' + twoDigit(x % 100) : '')
    return twoDigit(x)
  }
  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const rest = n % 1000
  let words = ''
  if (crore) words += threeDigit(crore) + ' Crore '
  if (lakh) words += twoDigit(lakh) + ' Lakh '
  if (thousand) words += twoDigit(thousand) + ' Thousand '
  if (rest) words += threeDigit(rest)
  return words.trim()
}

const INV_STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'error' | 'purple' }> = {
  pending: { label: 'Pending', variant: 'info' },
  under_review: { label: 'Under Review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  credited: { label: 'Credited', variant: 'purple' },
  rejected: { label: 'Rejected', variant: 'error' },
  completed: { label: 'Completed', variant: 'purple' },
}

function InvestmentsTab({ showToast, statusFilter }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void; statusFilter?: 'pending' | 'rejected' | 'matured' | null }) {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<any | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  // Bug #12, #15, #17: transactions + docs for the selected app
  const [appTxns, setAppTxns] = useState<any[]>([])
  const [appDocs, setAppDocs] = useState<any[]>([])
  const [docUploading, setDocUploading] = useState(false)
  // Bug #5/#6: proper modal for rejecting a transaction (replaces window.prompt
  // which was blocked by some browsers and the tester thought "not asking")
  const [rejectTxn, setRejectTxn] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  // Bug #7: Give Credit confirmation modal — editable investment amount + date
  const [creditApp, setCreditApp] = useState<any | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditDate, setCreditDate] = useState('')
  // Tests 28-04-2026 #3: confirmation modal for hard-deleting an investment
  // application along with its payout schedule and documents.
  const [deleteApp, setDeleteApp] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)
  // Pending 30-04-2026 #10: Document tracking modal anchor
  const [trackingApp, setTrackingApp] = useState<any | null>(null)
  // Pending 30-04-2026 #1: force-delete confirmation for approved investments
  const [forceDeleteApp, setForceDeleteApp] = useState<any | null>(null)
  const [forceDeleteAck, setForceDeleteAck] = useState('')
  // Pending 30-04-2026 #3: editable reference number inside detail modal
  const [refNumberDraft, setRefNumberDraft] = useState('')
  const [savingRefNumber, setSavingRefNumber] = useState(false)
  // Pending 30-04-2026 #2: Admin Investment Creation modal
  const [createOpen, setCreateOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const data = await fetchAllInvestmentApplications()
    setApplications(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Load txns + docs whenever an application is selected
  useEffect(() => {
    if (!selectedApp?.id) { setAppTxns([]); setAppDocs([]); return }
    let cancelled = false
    ;(async () => {
      try {
        const { fetchInvestmentTransactionsForApp } = await import('@/lib/supabase/adminDataService')
        const { supabase } = await import('@/lib/supabase/client')
        const [txns, docsRes] = await Promise.all([
          fetchInvestmentTransactionsForApp(selectedApp.id),
          (supabase as any).from('investment_documents').select('*').eq('investment_app_id', selectedApp.id).order('created_at', { ascending: false }),
        ])
        if (!cancelled) {
          setAppTxns(txns || [])
          setAppDocs(docsRes?.data || [])
        }
      } catch { if (!cancelled) { setAppTxns([]); setAppDocs([]) } }
    })()
    return () => { cancelled = true }
  }, [selectedApp])

  // Include 'credited' in money-in / approved counts so KPIs stay correct after
  // admin hits Give Credit (status flips from 'approved' to 'credited').
  const totalAUM = useMemo(() => applications.filter(a => ['approved', 'completed', 'credited'].includes(a.status)).reduce((s, a) => s + (Number(a.investment_amount) || 0), 0), [applications])
  const pendingCount = useMemo(() => applications.filter(a => a.status === 'pending' || a.status === 'under_review').length, [applications])
  const approvedCount = useMemo(() => applications.filter(a => ['approved', 'completed', 'credited'].includes(a.status)).length, [applications])

  const columns: Column<any>[] = [
    { key: 'client', label: 'Client', render: (row) => <span className="text-white font-medium">{row._client?.full_name || row._client?.email || '—'}</span> },
    // Bug #13: Show GHL ID, Email and Phone in the investment list.
    { key: 'client_code', label: 'GHL ID', render: (row) => <span className="font-mono text-xs text-gray-300">{row._client?.client_code || '—'}</span> },
    { key: 'email', label: 'Email', render: (row) => <span className="text-gray-300 text-xs">{row._client?.email || '—'}</span> },
    { key: 'phone', label: 'Phone', render: (row) => <span className="text-gray-300 text-xs">{row._client?.phone || '—'}</span> },
    { key: 'fund_vehicle', label: 'Fund / Vehicle', render: (row) => <span className="text-gray-300 text-xs">{row.fund_vehicle || '—'}</span> },
    { key: 'investment_amount', label: 'Amount', sortable: true, render: (row) => <span className="text-white font-semibold">{formatINR(row.investment_amount)}</span> },
    { key: 'tenure_preference', label: 'Tenure', render: (row) => <span className="text-gray-400 text-xs">{row.tenure_preference || '—'}</span> },
    { key: 'status', label: 'Status', render: (row) => {
      const s = INV_STATUS_MAP[row.status] || { label: row.status, variant: 'info' as const }
      return <AdminBadge label={s.label} variant={s.variant} size="sm" dot />
    }},
    { key: 'created_at', label: 'Date', sortable: true, render: (row) => <span className="text-gray-500 text-xs">{formatDate(row.created_at)}</span> },
    { key: 'actions', label: '', width: '230px', render: (row) => {
      const isApproved = ['approved', 'credited', 'completed'].includes(row.status)
      return (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setSelectedApp(row); setDetailOpen(true) }}
            title="View details"
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </button>
          {/* Pending 30-04-2026 #10: per-row Tracking button. Available
              for any investment so admin can also pre-stage tracking
              before the row is approved. */}
          <button onClick={(e) => { e.stopPropagation(); setTrackingApp(row) }}
            title="Document tracking"
            className="px-2 py-1 rounded-lg text-[10px] font-semibold text-white bg-brand-red hover:bg-brand-red/80 transition-colors inline-flex items-center gap-1">
            <Truck className="w-3 h-3" />
            Tracking
          </button>
          {/* Bug #18: Quick "Give Credit" action on approved rows so the admin
              doesn't need to open the modal to find the button. Hidden once
              already credited. */}
          {row.status === 'approved' && !row.credit_given && (
            <button onClick={(e) => { e.stopPropagation(); openCreditModal(row) }}
              title="Give Credit — records funds as credited for this investment"
              className="px-2 py-1 rounded-lg text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors">
              Give Credit
            </button>
          )}
          {row.credit_given && (
            <span className="px-2 py-1 rounded-lg text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              Credited
            </span>
          )}
          {isApproved ? (
            // Pending 30-04-2026 #1: allow force-delete for mistaken
            // approvals. Two-step confirmation (modal + typed phrase)
            // prevents accidental wipes.
            <button
              onClick={(e) => { e.stopPropagation(); setForceDeleteApp(row); setForceDeleteAck('') }}
              title="Force delete — wipes all linked records (payouts, docs, transactions, allotment, tracking)"
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteApp(row) }}
              title="Delete investment application"
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }},
  ]

  // Tests 28-04-2026 #3 — uses the upstream `deleteInvestmentSafe` which
  // already blocks approved/credited/completed rows and cascades through
  // investment_documents and investment_transactions. We stage the row in
  // `deleteApp` to keep a real confirmation modal (not window.confirm).
  const confirmDeleteInvestment = async () => {
    if (!deleteApp) return
    if (['approved', 'credited', 'completed'].includes(deleteApp.status)) {
      showToast('Approved investments cannot be deleted.', 'warning')
      setDeleteApp(null)
      return
    }
    setDeleting(true)
    try {
      const { deleteInvestmentSafe } = await import('@/lib/supabase/adminDataService')
      const res = await deleteInvestmentSafe(deleteApp.id)
      if (res.ok) {
        showToast('Investment application deleted', 'success')
        setApplications(prev => prev.filter(a => a.id !== deleteApp.id))
        if (selectedApp?.id === deleteApp.id) { setDetailOpen(false); setSelectedApp(null) }
        setDeleteApp(null)
      } else {
        showToast(res.error || 'Failed to delete investment', 'error')
      }
    } catch (e: any) {
      showToast(`Error deleting investment: ${e?.message || 'unknown'}`, 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Pending 30-04-2026 #1: Force-delete for approved/credited investments,
  // with full cascade. Triggered from the modal below after the admin
  // types DELETE to confirm.
  const confirmForceDelete = async () => {
    if (!forceDeleteApp) return
    if (forceDeleteAck.trim().toUpperCase() !== 'DELETE') {
      showToast('Type DELETE to confirm', 'warning'); return
    }
    setUpdating(true)
    try {
      const { deleteInvestmentSafe } = await import('@/lib/supabase/adminDataService')
      const res = await deleteInvestmentSafe(forceDeleteApp.id, { force: true })
      if (res.ok) {
        showToast('Investment fully deleted (all linked records cleared)', 'success')
        loadData()
        if (selectedApp?.id === forceDeleteApp.id) { setDetailOpen(false); setSelectedApp(null) }
        setForceDeleteApp(null); setForceDeleteAck('')
      } else {
        showToast(res.error || 'Failed to force-delete investment', 'error')
      }
    } catch (e: any) {
      showToast(e?.message || 'Error force-deleting investment', 'error')
    } finally { setUpdating(false) }
  }

  // Pending 30-04-2026 #3: keep the editable reference-number input in
  // sync whenever a different application is opened in the detail modal.
  useEffect(() => {
    setRefNumberDraft(selectedApp?.reference_number || '')
  }, [selectedApp?.id, selectedApp?.reference_number])

  const handleSaveReferenceNumber = async () => {
    if (!selectedApp) return
    const trimmed = refNumberDraft.trim()
    if (!trimmed) { showToast('Reference number cannot be empty', 'warning'); return }
    setSavingRefNumber(true)
    try {
      const { updateInvestmentReferenceNumber } = await import('@/lib/supabase/adminDataService')
      const res = await updateInvestmentReferenceNumber(selectedApp.id, trimmed)
      if (res.ok) {
        showToast('Reference number updated', 'success')
        setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, reference_number: trimmed } : a))
        setSelectedApp((s: any) => s ? { ...s, reference_number: trimmed } : s)
      } else {
        showToast(res.error || 'Save failed', 'error')
      }
    } finally { setSavingRefNumber(false) }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedApp) return
    setUpdating(true)
    try {
      const { updateRow, approveInvestmentApplication } = await import('@/lib/supabase/adminDataService')
      const { supabase } = await import('@/lib/supabase/client')
      const { data: { user } } = await (supabase as any).auth.getUser()
      const adminId = user?.id || null

      let ok = false
      if (newStatus === 'approved') {
        // Bugs #14, #18, #19: populate investment_date/rates/maturity/commitment
        // and insert an Acknowledgement Letter document so the investor's
        // Documents tab and Payment Schedule work immediately.
        ok = await approveInvestmentApplication(selectedApp, adminId || '')
      } else {
        const result = await updateRow('investment_applications', selectedApp.id, {
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
        })
        ok = !!result
        // Pending 30-04-2026 #12.e: WhatsApp the investor on rejection.
        if (ok && newStatus === 'rejected') {
          try {
            const phone = selectedApp._client?.phone
            if (phone) {
              const { notifyInvestmentDecisionInvestor } = await import('@/lib/notifications/notify')
              await notifyInvestmentDecisionInvestor({
                investorPhone: phone,
                investorName: selectedApp._client?.full_name || 'Investor',
                decision: 'rejected',
                fund: selectedApp.fund_vehicle || 'Investment',
                amount: Number(selectedApp.investment_amount) || 0,
              })
            }
          } catch (_e) { /* non-blocking */ }
        }
      }
      if (ok) {
        showToast(`Application ${newStatus}`, 'success')
        // Refresh the full list so side-effect fields (investment_date, rates, etc.) are picked up.
        loadData()
        setDetailOpen(false)
        setSelectedApp(null)
      } else { showToast('Failed to update', 'error') }
    } catch (_e) { showToast('Error updating application', 'error') }
    finally { setUpdating(false) }
  }

  // Bug #7: Open a Give Credit confirmation modal — admin can edit the
  // final investment amount (e.g. 10.00 L vs what the investor applied for)
  // and set the credit date before the investment moves to `credited` and
  // the payout schedule is generated.
  const openCreditModal = (app: any) => {
    setCreditApp(app)
    setCreditAmount(String(app?.investment_amount ?? ''))
    setCreditDate(new Date().toISOString().split('T')[0])
  }

  const confirmGiveCredit = async () => {
    if (!creditApp) return
    const amt = parseFloat(creditAmount)
    if (!Number.isFinite(amt) || amt <= 0) { showToast('Enter a valid investment amount', 'warning'); return }
    if (!creditDate) { showToast('Please select a credit date', 'warning'); return }
    setUpdating(true)
    try {
      const { markInvestmentCreditGiven } = await import('@/lib/supabase/adminDataService')
      const { supabase } = await import('@/lib/supabase/client')
      const { data: { user } } = await (supabase as any).auth.getUser()
      // First persist the admin's edits (final_investment_amount + investment_date)
      // so the downstream payout-schedule generator uses the right values.
      // Issue 28-04-2026: also re-derive maturity_date from the credit date so
      // the payout schedule covers the full tenure starting from the credit
      // date (not whatever placeholder was set at approval time).
      const tenureYears = Number(String(creditApp?.tenure_preference || '').replace(/[^0-9]/g, '')) || 3
      const matRef = new Date(creditDate)
      matRef.setFullYear(matRef.getFullYear() + tenureYears)
      const maturityDate = Number.isNaN(matRef.getTime())
        ? null
        : matRef.toISOString().split('T')[0]
      const updatePayload: Record<string, any> = {
        final_investment_amount: amt,
        final_investment_date: creditDate,
        investment_date: creditDate,
      }
      if (maturityDate) updatePayload.maturity_date = maturityDate
      const { error: updErr } = await (supabase as any).from('investment_applications').update(updatePayload).eq('id', creditApp.id)
      if (updErr) {
        showToast(`Failed to save credit details: ${updErr.message}`, 'error')
        setUpdating(false)
        return
      }
      const result = await markInvestmentCreditGiven(creditApp.id, user?.id || '')
      if (result === true) {
        showToast(`Credit given: ₹${amt.toLocaleString('en-IN')} — payout schedule generated`, 'success')
        loadData()
        setCreditApp(null)
        setDetailOpen(false)
        setSelectedApp(null)
      } else {
        showToast(`Failed to mark credit: ${result}`, 'error')
      }
    } catch (e: any) { showToast(`Error marking credit: ${e?.message || 'unknown'}`, 'error') }
    finally { setUpdating(false) }
  }

  // Bug #15: Approve a single transaction
  const handleApproveTxn = async (txnId: string) => {
    try {
      const { approveInvestmentTransaction } = await import('@/lib/supabase/adminDataService')
      const { supabase } = await import('@/lib/supabase/client')
      const { data: { user } } = await (supabase as any).auth.getUser()
      const ok = await approveInvestmentTransaction(txnId, user?.id || '')
      if (ok) {
        showToast('Transaction approved', 'success')
        setAppTxns(prev => prev.map(t => t.id === txnId ? { ...t, status: 'approved' } : t))
        // Refetch from DB to guarantee UI state matches (bug #6)
        try {
          const { fetchInvestmentTransactionsForApp } = await import('@/lib/supabase/adminDataService')
          if (selectedApp?.id) {
            const fresh = await fetchInvestmentTransactionsForApp(selectedApp.id)
            setAppTxns(fresh || [])
          }
        } catch { /* non-fatal */ }
      } else { showToast('Failed to approve transaction', 'error') }
    } catch { showToast('Error approving transaction', 'error') }
  }

  // Bug #5: open a proper modal for rejection reason instead of window.prompt
  const openRejectTxnModal = (txn: any) => {
    setRejectTxn(txn)
    setRejectReason('')
  }

  const confirmRejectTxn = async () => {
    if (!rejectTxn) return
    const reason = rejectReason.trim()
    if (!reason) { showToast('Please provide a rejection reason', 'warning'); return }
    try {
      const { rejectInvestmentTransaction } = await import('@/lib/supabase/adminDataService')
      const { supabase } = await import('@/lib/supabase/client')
      const { data: { user } } = await (supabase as any).auth.getUser()
      const ok = await rejectInvestmentTransaction(rejectTxn.id, user?.id || '', reason)
      if (ok) {
        showToast('Transaction rejected', 'info')
        // Bug #6: make absolutely sure the UI flips to rejected. We update the
        // local row by id and also refetch from the DB as a safety net.
        setAppTxns(prev => prev.map(t => t.id === rejectTxn.id ? { ...t, status: 'rejected', admin_notes: reason } : t))
        try {
          const { fetchInvestmentTransactionsForApp } = await import('@/lib/supabase/adminDataService')
          if (selectedApp?.id) {
            const fresh = await fetchInvestmentTransactionsForApp(selectedApp.id)
            setAppTxns(fresh || [])
          }
        } catch { /* non-fatal */ }
        setRejectTxn(null)
        setRejectReason('')
      } else { showToast('Failed to reject transaction', 'error') }
    } catch (e: any) { showToast(`Error rejecting transaction: ${e?.message || 'unknown'}`, 'error') }
  }

  // Bug #17: Upload investment document (admin)
  const handleAdminDocUpload = async (documentType: string, title: string) => {
    if (!selectedApp) return
    setDocUploading(true)
    try {
      const { pickAndUploadFiles } = await import('@/lib/supabase/storageService')
      const { uploadAdminInvestmentDocument } = await import('@/lib/supabase/adminDataService')
      const { supabase } = await import('@/lib/supabase/client')
      const { data: { user } } = await (supabase as any).auth.getUser()
      // Route key 'general' → public `uploads` bucket so investors can view
       // admin-uploaded investment docs via the stored public URL without
       // signed URLs. entityId scopes file_records per-investment.
       const results = await pickAndUploadFiles('general', {
         accept: '.pdf,.jpg,.jpeg,.png',
         multiple: false,
         entityType: 'investment',
         entityId: selectedApp.id,
         category: 'investment-document',
       })
      if (results?.[0]?.success && results[0].file) {
        const f = results[0].file
        const row = await uploadAdminInvestmentDocument({
          investment_app_id: selectedApp.id,
          client_id: selectedApp.client_id,
          document_type: documentType,
          title,
          file_url: f.url,
          file_name: f.name || title,
          uploaded_by: user?.id || '',
        })
        if (row) {
          showToast(`${title} uploaded`, 'success')
          setAppDocs(prev => [row, ...prev])
        } else { showToast('Failed to save document', 'error') }
      }
    } catch { showToast('Upload failed', 'error') }
    finally { setDocUploading(false) }
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard title="Total Applications" value={applications.length} icon={BarChart3} color="#3B82F6" />
        <AdminKPICard title="Total AUM" value={formatINR(totalAUM)} icon={IndianRupee} color="#10B981" />
        <AdminKPICard title="Pending Review" value={pendingCount} icon={Clock} color="#F59E0B" />
        <AdminKPICard title="Approved" value={approvedCount} icon={CheckCircle2} color="#8B5CF6" />
      </div>

      {/* Table */}
      <AdminGlass padding="p-0">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">All Investment Applications</h3>
          <div className="flex items-center gap-2">
            {/* Pending 30-04-2026 #2: admin creates investment for an investor. */}
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-red hover:bg-brand-red/80 transition-colors"
              title="Create an investment on behalf of an investor"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Investment
            </button>
            <button onClick={loadData} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-brand-red animate-spin" /></div>
        ) : (() => {
          // 2026-05-12: Super-Admin menu spec routes "Pending Investment",
          // "Rejected", and "Maturity history" through this tab with a
          // pre-applied status filter so each cohort gets its own view
          // without forking the rich row interactions below.
          const scoped = (() => {
            if (statusFilter === 'pending') return applications.filter(a => a.status === 'pending' || a.status === 'under_review')
            if (statusFilter === 'rejected') return applications.filter(a => a.status === 'rejected')
            if (statusFilter === 'matured') return applications.filter(a => a.status === 'matured' || a.status === 'completed' || (a.maturity_date && new Date(a.maturity_date) <= new Date()))
            return applications
          })()
          if (scoped.length === 0) {
            const emptyLabel = statusFilter === 'pending' ? 'No pending investments'
              : statusFilter === 'rejected' ? 'No rejected investments'
              : statusFilter === 'matured' ? 'No matured investments'
              : 'No investment applications'
            return <AdminEmptyState icon={BarChart3} title={emptyLabel} description="Investment applications from clients will appear here." />
          }
          return <AdminDataTable columns={columns} data={scoped} onRowClick={(row) => { setSelectedApp(row); setDetailOpen(true) }} />
        })()}
      </AdminGlass>

      {/* Detail Modal */}
      {selectedApp && (
        <AdminModal isOpen={detailOpen} onClose={() => { setDetailOpen(false); setSelectedApp(null) }} title="Investment Application" subtitle={`Ref: ${selectedApp.id?.slice(0, 8).toUpperCase()}`} maxWidth="max-w-3xl" footer={
          <>
            <ModalButton onClick={() => { setDetailOpen(false); setSelectedApp(null) }}>Close</ModalButton>
            {selectedApp.status === 'pending' || selectedApp.status === 'under_review' ? (
              <>
                <ModalButton variant="danger" onClick={() => handleStatusUpdate('rejected')} disabled={updating}>Reject</ModalButton>
                <ModalButton variant="primary" onClick={() => handleStatusUpdate('approved')} disabled={updating}>{updating ? 'Updating...' : 'Approve'}</ModalButton>
              </>
            ) : null}
            {/* Bug #16: allow admin to mark credit given after approval */}
            {selectedApp.status === 'approved' && !selectedApp.credit_given ? (
              <ModalButton variant="primary" onClick={() => openCreditModal(selectedApp)} disabled={updating}>{updating ? 'Updating...' : 'Give Credit'}</ModalButton>
            ) : null}
            {/* Tests 28-04-2026 follow-up: manual schedule rebuild for
                cases where the credit date was edited later or the auto-
                regen on credit-given was interrupted. Only meaningful
                once credit has been given. */}
            {selectedApp.credit_given ? (
              <ModalButton onClick={async () => {
                if (!window.confirm('Regenerate the payout schedule for this investment? Pending payouts will be rebuilt against the latest credit date. Paid rows will be preserved.')) return
                try {
                  setUpdating(true)
                  const { regenerateInvestmentSchedule } = await import('@/lib/supabase/adminDataService')
                  const res = await regenerateInvestmentSchedule(selectedApp.id)
                  if (res.ok) {
                    showToast(`Schedule rebuilt — ${res.rows ?? 0} payouts re-anchored to credit date`, 'success')
                    loadData()
                  } else {
                    showToast(res.error || 'Failed to regenerate schedule', 'error')
                  }
                } catch (e: any) {
                  showToast(`Error: ${e?.message || 'unknown'}`, 'error')
                } finally { setUpdating(false) }
              }} disabled={updating}>{updating ? 'Working…' : 'Regenerate Schedule'}</ModalButton>
            ) : null}
          </>
        }>
          <div className="space-y-5">
            {/* Application Details */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Client', val: selectedApp._client?.full_name || '—' },
                // Bug #13: include GHL ID and phone in detail view.
                { label: 'GHL ID', val: selectedApp._client?.client_code || '—' },
                { label: 'Email', val: selectedApp._client?.email || '—' },
                { label: 'Phone', val: selectedApp._client?.phone || '—' },
                { label: 'Fund / Vehicle', val: selectedApp.fund_vehicle || '—' },
                { label: 'Amount', val: formatINR(selectedApp.investment_amount) },
                { label: 'Tenure', val: selectedApp.tenure_preference || '—' },
                { label: 'Status', val: (INV_STATUS_MAP[selectedApp.status] || { label: selectedApp.status }).label },
                { label: 'Applied On', val: formatDate(selectedApp.created_at) },
                // Tests 28-04-2026 follow-up: surface every date that drives
                // the schedule so the admin can see what the calc anchored
                // to. Approval Date is investment_date, Credit Date is
                // final_investment_date, Effective Start is what the
                // schedule generator actually used (priority order).
                { label: 'Approval Date', val: selectedApp.investment_date ? formatDate(selectedApp.investment_date) : '—' },
                { label: 'Credit Date', val: selectedApp.final_investment_date ? formatDate(selectedApp.final_investment_date) : (selectedApp.credit_given_at ? formatDate(selectedApp.credit_given_at) : '—') },
                { label: 'Effective Start', val: formatDate(selectedApp.final_investment_date || selectedApp.credit_given_at || selectedApp.investment_date || selectedApp.created_at) },
                { label: 'Terms Accepted', val: selectedApp.terms_accepted ? 'Yes' : 'No' },
              ].map((f, i) => (
                <div key={i}>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{f.label}</p>
                  <p className="text-sm text-white font-medium">{f.val}</p>
                </div>
              ))}
            </div>

            {selectedApp.admin_notes && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Admin Notes</p>
                <p className="text-sm text-gray-300 bg-white/[0.03] p-3 rounded-xl border border-white/[0.04]">{selectedApp.admin_notes}</p>
              </div>
            )}

            {/* Pending 30-04-2026 #3: editable reference number. Auto-
                generation still runs on approval, but admin can override
                here if the investor came in with a pre-existing ref. */}
            <div className="border-t border-white/[0.06] pt-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Investment Reference Number</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={refNumberDraft}
                  onChange={e => setRefNumberDraft(e.target.value)}
                  placeholder="GHLVEN/001/2526"
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-brand-red/40"
                />
                <button
                  disabled={savingRefNumber || refNumberDraft.trim() === (selectedApp.reference_number || '')}
                  onClick={handleSaveReferenceNumber}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-brand-red hover:bg-brand-red/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {savingRefNumber ? 'Saving…' : 'Save'}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Manually override the auto-generated reference number — useful when migrating existing investors.</p>
            </div>

            {/* Bug #12, #15: Investment Transactions submitted by the investor */}
            <div className="border-t border-white/[0.06] pt-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Investment Transactions ({appTxns.length})</h4>
              {appTxns.length === 0 ? (
                <p className="text-xs text-gray-500">No transactions submitted yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b border-white/[0.06]">
                        <th className="text-left py-2 pr-3">Date</th>
                        <th className="text-left py-2 pr-3">Txn Amount</th>
                        <th className="text-left py-2 pr-3">Txn ID</th>
                        <th className="text-left py-2 pr-3">Status</th>
                        <th className="text-left py-2 pr-3">Proof</th>
                        <th className="text-right py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appTxns.map((txn: any) => (
                        <tr key={txn.id} className="border-b border-white/[0.04]">
                          <td className="py-2 pr-3 text-gray-400">{formatDate(txn.created_at)}</td>
                          <td className="py-2 pr-3 text-white font-semibold">{formatINR(Number(txn.transaction_amount) || 0)}</td>
                          <td className="py-2 pr-3 text-gray-300 font-mono">{txn.transaction_id || '—'}</td>
                          <td className="py-2 pr-3">
                            <AdminBadge
                              label={txn.status || 'pending'}
                              variant={txn.status === 'approved' ? 'success' : txn.status === 'rejected' ? 'error' : 'warning'}
                              size="sm"
                              dot
                            />
                          </td>
                          <td className="py-2 pr-3">
                            {txn.transaction_proof_url ? (
                              <a href={txn.transaction_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
                                <Eye className="w-3 h-3" /> View
                              </a>
                            ) : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="py-2 text-right">
                            {txn.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleApproveTxn(txn.id)}
                                  title="Approve this transaction"
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => openRejectTxnModal(txn)}
                                  title="Reject this transaction"
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-red-300 bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 transition-colors"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Reject
                                </button>
                              </div>
                            ) : <span className="text-[10px] text-gray-500 italic">{txn.admin_notes || (txn.status === 'approved' ? 'Approved' : 'Rejected')}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bug #17: Admin-uploaded investment documents */}
            <div className="border-t border-white/[0.06] pt-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Investment Documents ({appDocs.length})</h4>
              {appDocs.length > 0 && (
                <div className="space-y-2 mb-3">
                  {appDocs.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs text-white font-medium truncate">{doc.title || doc.document_type}</p>
                        <p className="text-[10px] text-gray-500 truncate">{doc.file_name || '—'} · {formatDate(doc.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {doc.file_url ? (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Original
                          </a>
                        ) : <span className="text-[10px] text-gray-500">Placeholder</span>}
                        {doc.signed_copy_url ? (
                          <a href={doc.signed_copy_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1" title={doc.signed_at ? `Signed ${formatDate(doc.signed_at)}` : 'Signed copy'}>
                            <CheckCircle2 className="w-3 h-3" /> Signed
                          </a>
                        ) : (doc.document_type === 'debenture_agreement' || doc.document_type === 'agreement') ? (
                          <span className="text-[10px] text-amber-500" title="Waiting for investor to upload signed copy">Unsigned</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* ADMIN-4 (25-04-2026): hide an Upload <type> button once a real
                  file (file_url present) has been uploaded for that type.
                  Placeholder rows (file_url='') still allow upload. The TDS
                  button below intentionally has no such guard — admin can
                  upload many TDS certificates. */}
              {(() => {
                const hasReal = (t: string) => appDocs.some((d: any) => d.document_type === t && d.file_url)
                const slots = [
                  { type: 'acknowledgement', label: 'Upload Acknowledgement' },
                  { type: 'agreement', label: 'Upload Debenture Agreement' },
                  { type: 'allotment', label: 'Upload Allotment Letter' },
                  { type: 'certificate', label: 'Upload Debenture Certificate' },
                ].filter(d => !hasReal(d.type))
                return (
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map(d => (
                      <button
                        key={d.type}
                        onClick={() => handleAdminDocUpload(d.type, d.label.replace(/^Upload /, ''))}
                        disabled={docUploading}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-300 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5 text-brand-red" />
                        {docUploading ? 'Uploading...' : d.label}
                      </button>
                    ))}
                    {/* TDS-6 (25-04-2026): TDS docs can be uploaded multiple times.
                        Each upload is added to the investor's TDS section. */}
                    <button
                      // Testing Report 2 (2026-04-25 #7): keep the title
                      // simple — just "TDS Certificate". The created_at
                      // column on investment_documents already records when
                      // each one was uploaded.
                      onClick={() => handleAdminDocUpload('tds', 'TDS Certificate')}
                      disabled={docUploading}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors disabled:opacity-50 col-span-2"
                      title="Upload a TDS certificate. Multiple uploads allowed — each appears in the investor's TDS section."
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {docUploading ? 'Uploading…' : 'Upload TDS Certificate (multiple allowed)'}
                    </button>
                  </div>
                )
              })()}
            </div>

            {/* Document Generation */}
            <div className="border-t border-white/[0.06] pt-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Generate Documents</h4>
              {/* ADMIN-5 (25-04-2026): once a doc of a given type has been
                  uploaded, hide the matching Generate button so admin doesn't
                  produce a duplicate. Generators map to upload types as:
                  acknowledgement→acknowledgement, allotment→allotment,
                  certificate→certificate, agreement→agreement. */}
              {(() => {
                const hasReal = (t: string) => appDocs.some((d: any) => d.document_type === t && d.file_url)
                const genSlots = [
                  { type: 'acknowledgement' as const, label: 'Acknowledgement Letter' },
                  { type: 'allotment' as const, label: 'Allotment Letter' },
                  { type: 'certificate' as const, label: 'Debenture Certificate' },
                  { type: 'agreement' as const, label: 'Debenture Agreement' },
                ].filter(d => !hasReal(d.type))
                if (genSlots.length === 0) {
                  return (
                    <p className="text-[11px] text-gray-500 italic">All documents have been uploaded. Generation is hidden to prevent duplicates.</p>
                  )
                }
                return (
                  <div className="grid grid-cols-2 gap-2">
                    {genSlots.map(doc => (
                      <button
                        key={doc.type}
                        onClick={async () => {
                          showToast(`Generating ${doc.label}...`, 'info')
                          try {
                            await generateInvestmentDocument(doc.type, selectedApp)
                          } catch (e: any) {
                            showToast(`Failed to generate ${doc.label}: ${e?.message || 'unknown'}`, 'error')
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-300 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-brand-red" />
                        {doc.label}
                      </button>
                    ))}
                  </div>
                )
              })()}
              <p className="text-[10px] text-gray-600 mt-2">Documents open in a new window for printing to PDF. Please allow popups if prompted.</p>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Bug #5/#6: Transaction rejection modal */}
      <AdminModal
        isOpen={!!rejectTxn}
        onClose={() => { setRejectTxn(null); setRejectReason('') }}
        title="Reject Transaction"
        subtitle={rejectTxn ? `Txn ID: ${rejectTxn.transaction_id || rejectTxn.id?.slice(0, 8)}` : ''}
        maxWidth="max-w-md"
      >
        {rejectTxn && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Amount</span>
                <span className="text-white font-semibold">{formatINR(Number(rejectTxn.transaction_amount) || 0)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">Date</span>
                <span className="text-white">{formatDate(rejectTxn.created_at)}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Reason for rejection *</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Amount mismatch with bank statement, proof unclear…"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 resize-none"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <button onClick={() => { setRejectTxn(null); setRejectReason('') }} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">Cancel</button>
              <button
                disabled={!rejectReason.trim()}
                onClick={confirmRejectTxn}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Bug #7: Give Credit confirmation modal — editable amount + credit date */}
      <AdminModal
        isOpen={!!creditApp}
        onClose={() => { if (!updating) setCreditApp(null) }}
        title="Confirm Give Credit"
        subtitle={creditApp?._client?.full_name ? `Investor: ${creditApp._client.full_name}` : ''}
        maxWidth="max-w-md"
      >
        {creditApp && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">
              Confirm the final credited investment amount and credit date. These
              values drive the payout schedule generated for this investor.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Investment Amount (₹) *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={creditAmount}
                onChange={e => setCreditAmount(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
                autoFocus
              />
              <p className="text-[10px] text-gray-500 mt-1">Original application: {formatINR(Number(creditApp?.investment_amount) || 0)}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Credit Date *</label>
              <input
                type="date"
                value={creditDate}
                onChange={e => setCreditDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <button disabled={updating} onClick={() => setCreditApp(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50">Cancel</button>
              <button
                disabled={updating}
                onClick={confirmGiveCredit}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {updating ? 'Processing…' : 'Confirm & Give Credit'}
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Tests 28-04-2026 #3: Delete investment confirmation modal */}
      <AdminModal
        isOpen={!!deleteApp}
        onClose={() => { if (!deleting) setDeleteApp(null) }}
        title="Delete Investment"
        subtitle={deleteApp?._client?.full_name ? `Investor: ${deleteApp._client.full_name}` : ''}
        maxWidth="max-w-md"
      >
        {deleteApp && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              This will permanently remove the investment application
              <strong className="text-white"> {formatINR(Number(deleteApp.investment_amount) || 0)}</strong>
              {' '}({deleteApp.fund_vehicle || 'investment'}) along with its
              payout schedule, transactions and admin-uploaded documents.
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <button disabled={deleting} onClick={() => setDeleteApp(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50">Cancel</button>
              <button
                disabled={deleting}
                onClick={confirmDeleteInvestment}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete Investment'}
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Pending 30-04-2026 #10: Document Tracking modal */}
      <DocumentTrackingModal
        isOpen={!!trackingApp}
        onClose={() => setTrackingApp(null)}
        investmentAppId={trackingApp?.id || null}
        investorName={trackingApp?._client?.full_name || trackingApp?._client?.email}
        showToast={showToast}
      />

      {/* Pending 30-04-2026 #1: Force Delete modal — wipes all linked records */}
      <AdminModal
        isOpen={!!forceDeleteApp}
        onClose={() => { if (!updating) { setForceDeleteApp(null); setForceDeleteAck('') } }}
        title="Force Delete Investment"
        subtitle={forceDeleteApp ? `${forceDeleteApp._client?.full_name || 'Investor'} — ${formatINR(Number(forceDeleteApp.investment_amount) || 0)}` : ''}
        maxWidth="max-w-md"
      >
        {forceDeleteApp && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              <p className="font-semibold mb-1">This will permanently wipe ALL linked records:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Payout schedule (monthly_payouts)</li>
                <li>Investment documents</li>
                <li>Investment transactions</li>
                <li>Allotment rows</li>
                <li>Document tracking</li>
              </ul>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Type <span className="font-mono text-red-400">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={forceDeleteAck}
                onChange={e => setForceDeleteAck(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <button disabled={updating} onClick={() => { setForceDeleteApp(null); setForceDeleteAck('') }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button
                disabled={updating || forceDeleteAck.trim().toUpperCase() !== 'DELETE'}
                onClick={confirmForceDelete}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-40"
              >
                {updating ? 'Deleting…' : 'Force Delete'}
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Pending 30-04-2026 #2: Admin Investment Creation modal */}
      <AdminCreateInvestmentModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        showToast={showToast}
        onCreated={() => { setCreateOpen(false); loadData() }}
      />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// Pending 30-04-2026 #2 — AdminCreateInvestmentModal
//
// Lets admin create a fresh investment_applications row for any
// existing client. Mirrors the essential fields of the investor flow:
// fund vehicle, amount, tenure, optional reference number override,
// and an optional transaction record (txn id, amount, date, mode).
// ════════════════════════════════════════════════════════════════
function AdminCreateInvestmentModal({
  isOpen, onClose, showToast, onCreated,
}: {
  isOpen: boolean
  onClose: () => void
  showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void
  onCreated: () => void
}) {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Re-Testing 30-04-2026 #2: transaction proof upload inside the
  // Create Investment flow (admin had to upload it separately before).
  const [proofUploading, setProofUploading] = useState(false)
  const [form, setForm] = useState({
    client_id: '',
    fund_vehicle: 'Alternate route to Invest in AIF via Debenture',
    investment_amount: '',
    tenure_preference: '3 years',
    reference_number: '',
    notes: '',
    txn_id: '',
    txn_amount: '',
    txn_date: new Date().toISOString().split('T')[0],
    payment_mode: 'NEFT',
    bank_name: '',
    proof_url: '',
    proof_name: '',
  })

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        if (!isSupabaseConfigured()) return
        const { data } = await (supabase as any)
          .from('clients')
          .select('id, full_name, email, phone, client_code')
          .order('full_name', { ascending: true })
          .limit(500)
        if (!cancelled) setClients((data as any[]) || [])
      } finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [isOpen])

  const reset = () => setForm({
    client_id: '', fund_vehicle: 'Alternate route to Invest in AIF via Debenture',
    investment_amount: '', tenure_preference: '3 years', reference_number: '', notes: '',
    txn_id: '', txn_amount: '', txn_date: new Date().toISOString().split('T')[0],
    payment_mode: 'NEFT', bank_name: '',
    proof_url: '', proof_name: '',
  })

  // Re-Testing 30-04-2026 #2: pick + upload the transaction proof
  // (bank slip / wire confirmation) inline. Stores the file in the
  // public `uploads` bucket (route key 'general') and returns a
  // public URL we save on the investment_transactions row.
  const handlePickProof = async () => {
    setProofUploading(true)
    try {
      const { pickAndUploadFiles } = await import('@/lib/supabase/storageService')
      const results = await pickAndUploadFiles('general', {
        accept: '.pdf,.jpg,.jpeg,.png',
        multiple: false,
        entityType: 'investment',
        category: 'transaction-proof',
      })
      const f = results?.[0]
      if (f?.success && f.file?.url) {
        setForm(prev => ({ ...prev, proof_url: f.file!.url, proof_name: f.file!.name || 'proof' }))
        showToast('Transaction proof uploaded', 'success')
      } else if (f && !f.success) {
        showToast(f.error || 'Upload failed', 'error')
      }
    } catch (e: any) {
      showToast(e?.message || 'Upload failed', 'error')
    } finally { setProofUploading(false) }
  }

  const handleSubmit = async () => {
    if (!form.client_id) { showToast('Select an investor', 'warning'); return }
    const amt = parseFloat(form.investment_amount)
    if (!Number.isFinite(amt) || amt <= 0) { showToast('Enter a valid amount', 'warning'); return }
    setSubmitting(true)
    try {
      const { adminCreateInvestmentForClient } = await import('@/lib/supabase/adminDataService')
      const { data: { user } } = await (supabase as any).auth.getUser()
      const txnAmt = parseFloat(form.txn_amount)
      // Build transaction payload if any payment field is filled OR
      // the admin already uploaded a proof — proof alone is enough to
      // count as a recorded transaction.
      const hasTxn = form.txn_id || form.txn_amount || form.proof_url
      const res = await adminCreateInvestmentForClient({
        client_id: form.client_id,
        fund_vehicle: form.fund_vehicle,
        investment_amount: amt,
        tenure_preference: form.tenure_preference,
        reference_number: form.reference_number,
        notes: form.notes,
        transaction: hasTxn ? {
          transaction_id: form.txn_id || undefined,
          transaction_amount: Number.isFinite(txnAmt) ? txnAmt : amt,
          transaction_date: form.txn_date,
          payment_mode: form.payment_mode,
          bank_name: form.bank_name || null,
          transaction_proof_url: form.proof_url || null,
        } : null,
      }, user?.id || '')
      if (res.ok) {
        showToast('Investment created — review on the list and approve when ready', 'success')
        reset()
        onCreated()
      } else {
        showToast(res.error || 'Failed to create investment', 'error')
      }
    } finally { setSubmitting(false) }
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={() => { if (!submitting) { reset(); onClose() } }}
      title="Create Investment for Investor"
      subtitle="Mirrors the investor flow — fund, amount, tenure, optional transaction"
      maxWidth="max-w-2xl"
      footer={
        <>
          <ModalButton onClick={() => { if (!submitting) { reset(); onClose() } }}>Cancel</ModalButton>
          <ModalButton variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Investment'}
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Investor */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Investor *</label>
          <select
            value={form.client_id}
            onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40"
          >
            <option value="">{loading ? 'Loading clients…' : 'Select investor'}</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.full_name || c.email || c.id} {c.client_code ? `(${c.client_code})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Fund / amount / tenure */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Fund / Vehicle *</label>
            <select
              value={form.fund_vehicle}
              onChange={e => setForm(f => ({ ...f, fund_vehicle: e.target.value }))}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40"
            >
              <option>Alternate route to Invest in AIF via Debenture</option>
              <option>Direct AIF Route</option>
              <option>Alternate route to Invest in AIF via LLP</option>
              <option>Co-Investment Route</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tenure *</label>
            <select
              value={form.tenure_preference}
              onChange={e => setForm(f => ({ ...f, tenure_preference: e.target.value }))}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40"
            >
              <option>3 years</option><option>5 years</option><option>7 years</option><option>10 years</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Investment Amount (₹) *</label>
            <input
              type="number" min="0" step="1000"
              value={form.investment_amount}
              onChange={e => setForm(f => ({ ...f, investment_amount: e.target.value }))}
              placeholder="e.g. 1000000"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Reference Number (optional)</label>
            <input
              type="text"
              value={form.reference_number}
              onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))}
              placeholder="Auto-generated if blank"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-brand-red/40"
            />
          </div>
        </div>

        {/* Transaction (optional) */}
        <div className="border-t border-white/[0.06] pt-4">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-3">Payment Details (optional)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Transaction ID</label>
              <input
                type="text"
                value={form.txn_id}
                onChange={e => setForm(f => ({ ...f, txn_id: e.target.value }))}
                placeholder="UTR / RRN / Cheque #"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Txn Amount (₹)</label>
              <input
                type="number" min="0"
                value={form.txn_amount}
                onChange={e => setForm(f => ({ ...f, txn_amount: e.target.value }))}
                placeholder="Defaults to investment amount"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Transaction Date</label>
              <input
                type="date"
                value={form.txn_date}
                onChange={e => setForm(f => ({ ...f, txn_date: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Payment Mode</label>
              <select
                value={form.payment_mode}
                onChange={e => setForm(f => ({ ...f, payment_mode: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40"
              >
                <option>NEFT</option><option>RTGS</option><option>IMPS</option>
                <option>UPI</option><option>Cheque</option><option>Demand Draft</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Bank Name</label>
              <input
                type="text"
                value={form.bank_name}
                onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
                placeholder="e.g. HDFC Bank"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40"
              />
            </div>
            {/* Re-Testing 30-04-2026 #2: transaction proof upload inline. */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Transaction Proof</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePickProof}
                  disabled={proofUploading || submitting}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    form.proof_url
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-white/[0.08] bg-white/[0.04] text-gray-300 hover:bg-white/[0.06]'
                  }`}
                >
                  {form.proof_url ? (
                    <><CheckCircle2 className="w-4 h-4" /> {form.proof_name || 'Uploaded'}</>
                  ) : (
                    <><Upload className="w-4 h-4" /> {proofUploading ? 'Uploading…' : 'Choose proof file'}</>
                  )}
                </button>
                {form.proof_url ? (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, proof_url: '', proof_name: '' }))}
                    className="px-3 py-2.5 rounded-lg text-xs font-medium text-gray-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-colors"
                    title="Remove uploaded proof"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">PDF / JPG / PNG. Stored under the public uploads bucket and linked to the new transaction row.</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Admin Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Why is admin creating this investment? (e.g. legacy migration)"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 resize-none"
          />
        </div>

        <p className="text-[10px] text-gray-500">
          New investments start in <span className="font-semibold text-amber-400">pending</span>. Review and approve them from the list to trigger the auto-generated documents and payout schedule.
        </p>
      </div>
    </AdminModal>
  )
}

// ════════════════════════════════════════════════════════════════
// Pending 30-04-2026 #3 — ReferenceNumbersTab
//
// Listing of every investment + its reference number with inline
// edit. Useful when migrating older investors whose ref numbers
// don't match the auto-generated GHLVEN/seq/FY format.
// ════════════════════════════════════════════════════════════════
function ReferenceNumbersTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { fetchInvestmentReferenceList } = await import('@/lib/supabase/adminDataService')
      setRows(await fetchInvestmentReferenceList())
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r: any) => {
      return (r.reference_number || '').toLowerCase().includes(q)
        || (r._client?.full_name || '').toLowerCase().includes(q)
        || (r._client?.email || '').toLowerCase().includes(q)
        || (r._client?.client_code || '').toLowerCase().includes(q)
        || (r.fund_vehicle || '').toLowerCase().includes(q)
        || (r.id || '').toLowerCase().includes(q)
    })
  }, [rows, search])

  const startEdit = (r: any) => { setEditingId(r.id); setDraft(r.reference_number || '') }
  const cancelEdit = () => { setEditingId(null); setDraft('') }

  const saveEdit = async () => {
    if (!editingId) return
    const trimmed = draft.trim()
    if (!trimmed) { showToast('Reference number cannot be empty', 'warning'); return }
    setSaving(true)
    try {
      const { updateInvestmentReferenceNumber } = await import('@/lib/supabase/adminDataService')
      const res = await updateInvestmentReferenceNumber(editingId, trimmed)
      if (res.ok) {
        setRows(prev => prev.map(r => r.id === editingId ? { ...r, reference_number: trimmed } : r))
        showToast('Reference number updated', 'success')
        cancelEdit()
      } else {
        showToast(res.error || 'Save failed', 'error')
      }
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <AdminGlass padding="p-0">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Investment Reference Numbers</h3>
            <p className="text-[11px] text-gray-500">
              Manual override of auto-generated reference numbers — useful for migrated/legacy investors.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ref / investor / fund…"
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white w-64 focus:outline-none focus:border-brand-red/40"
            />
            <button onClick={load} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-brand-red animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <AdminEmptyState icon={Hash} title="No reference numbers" description="Approved or admin-created investments will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left py-3 px-4 font-bold uppercase tracking-wider">Reference Number</th>
                  <th className="text-left py-3 px-4 font-bold uppercase tracking-wider">Investment ID</th>
                  <th className="text-left py-3 px-4 font-bold uppercase tracking-wider">Investor</th>
                  <th className="text-left py-3 px-4 font-bold uppercase tracking-wider">GHL ID</th>
                  <th className="text-left py-3 px-4 font-bold uppercase tracking-wider">Fund</th>
                  <th className="text-right py-3 px-4 font-bold uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-4 font-bold uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any) => (
                  <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      {editingId === r.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            className="bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-xs font-mono text-white w-44 focus:outline-none focus:border-brand-red/40"
                            autoFocus
                          />
                          <button disabled={saving} onClick={saveEdit} className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10"><Check className="w-3 h-3" /></button>
                          <button disabled={saving} onClick={cancelEdit} className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/[0.06]"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <span className="font-mono text-white">{r.reference_number || <span className="text-gray-600 italic">— not set —</span>}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-400 text-[11px]">{(r.id || '').slice(0, 8).toUpperCase()}…</td>
                    <td className="py-3 px-4 text-white">{r._client?.full_name || '—'}<br /><span className="text-gray-500 text-[10px]">{r._client?.email || ''}</span></td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-400">{r._client?.client_code || '—'}</td>
                    <td className="py-3 px-4 text-gray-400">{r.fund_vehicle || '—'}</td>
                    <td className="py-3 px-4 text-right font-semibold text-white">{formatINR(Number(r.investment_amount) || 0)}</td>
                    <td className="py-3 px-4">
                      <AdminBadge label={r.status} variant={INV_STATUS_MAP[r.status]?.variant || 'info'} size="sm" dot />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {editingId === r.id ? null : (
                        <button
                          onClick={() => startEdit(r)}
                          className="px-2 py-1 rounded text-[10px] font-semibold text-gray-300 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-colors inline-flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminGlass>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// 2026-05-12 Super-Admin menu spec — new tab shells. Each tab uses
// AdminCRUDPlaceholder so the layout matches the rest of the admin
// (Glass container, KPI strip optional, row-action triad visible).
// When the corresponding Supabase table is wired in, replace the
// empty-data render with real `fetch...` + columns and the shell
// transitions from placeholder to live CRUD without UI churn.
// ────────────────────────────────────────────────────────────────────
function InvestmentPlansTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [plans, setPlans] = useState<FundPlanRow[]>([])
  const [categories, setCategories] = useState<FundCategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  // 2026-05-16: when set, the Add modal becomes an Edit modal and Save
  // patches the existing row instead of inserting a new one. State is kept
  // separate from `createOpen` so the same modal body / form serves both.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<FundPlanRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<'image' | 'pdf' | null>(null)
  const [strategyDraft, setStrategyDraft] = useState('')
  const [minRangeDraft, setMinRangeDraft] = useState('')
  // 08-06-2026: client-side search across the plan cards (name / type / country).
  const [planSearch, setPlanSearch] = useState('')

  const emptyForm = useMemo(() => ({
    fund_name: '',
    fund_type_id: '',
    tenure: '',
    yearly_return: '',
    yearly_appreciation: '',
    yearly_tds: '',
    tax: '',
    capital_gain: '',
    tds_of_tax: '',
    locking_period: '',
    investment_strategy: [] as string[],
    minimum_investment_range: [] as string[],
    status: 'active',
    country: '',
    image_url: '' as string | null,
    pdf_url: '' as string | null,
  }), [])
  const [form, setForm] = useState(emptyForm)
  const [banks, setBanks] = useState<FundPlanBankRow[]>([
    { account_holder_name: '', account_number: '', ifsc_code: '', branch_name: '', bank_name: '', swift_iban_code: '', is_primary: true },
  ])

  const load = useCallback(async () => {
    setLoading(true)
    const [p, c] = await Promise.all([fetchFundPlans(), fetchFundCategories()])
    setPlans(p)
    setCategories(c)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const resetForm = () => {
    setForm(emptyForm)
    setBanks([{ account_holder_name: '', account_number: '', ifsc_code: '', branch_name: '', bank_name: '', swift_iban_code: '', is_primary: true }])
    setStrategyDraft(''); setMinRangeDraft('')
  }

  const handleUpload = async (kind: 'image' | 'pdf', file: File) => {
    setUploading(kind)
    try {
      const res = await uploadFundPlanAsset(file, kind)
      if (res.ok && res.url) {
        setForm(p => ({ ...p, [kind === 'image' ? 'image_url' : 'pdf_url']: res.url || null }))
        showToast(`${kind === 'image' ? 'Image' : 'PDF'} uploaded`, 'success')
      } else {
        showToast(res.error || 'Upload failed', 'error')
      }
    } finally { setUploading(null) }
  }

  const addStrategy = () => {
    const v = strategyDraft.trim()
    if (!v) return
    setForm(p => ({ ...p, investment_strategy: [...p.investment_strategy, v] }))
    setStrategyDraft('')
  }
  const removeStrategy = (i: number) => setForm(p => ({ ...p, investment_strategy: p.investment_strategy.filter((_, j) => j !== i) }))

  const addMinRange = () => {
    const v = minRangeDraft.trim()
    if (!v) return
    setForm(p => ({ ...p, minimum_investment_range: [...p.minimum_investment_range, v] }))
    setMinRangeDraft('')
  }
  const removeMinRange = (i: number) => setForm(p => ({ ...p, minimum_investment_range: p.minimum_investment_range.filter((_, j) => j !== i) }))

  const addBank = () => setBanks(b => [...b, { account_holder_name: '', account_number: '', ifsc_code: '', branch_name: '', bank_name: '', swift_iban_code: '', is_primary: false }])
  const removeBank = (i: number) => setBanks(b => b.filter((_, j) => j !== i))
  const setBankField = (i: number, key: keyof FundPlanBankRow, value: any) => setBanks(b => b.map((row, j) => j === i ? { ...row, [key]: value } : row))

  const handleCreate = async () => {
    if (!form.fund_name.trim()) { showToast('Fund name is required', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        fund_type_id: form.fund_type_id || null,
        banks: banks.filter(b => b.account_holder_name.trim() && b.account_number.trim() && b.ifsc_code.trim()),
      }
      const res = editingId
        ? await updateFundPlan(editingId, payload)
        : await createFundPlan(payload)
      if (res.ok) {
        if (res.error) showToast(res.error, 'warning')
        else showToast(editingId ? 'Investment plan updated' : 'Investment plan created', 'success')
        setCreateOpen(false)
        setEditingId(null)
        resetForm()
        load()
      } else {
        showToast(res.error || (editingId ? 'Failed to update plan' : 'Failed to create plan'), 'error')
      }
    } finally { setSaving(false) }
  }

  // 2026-05-16: hydrate the create form from an existing plan row + open the
  // modal in edit mode. Bank list is cloned (same shape as create flow) so
  // adds/removes inside the modal don't mutate the in-memory plans state.
  const startEdit = (row: FundPlanRow) => {
    setEditingId(row.id)
    setForm({
      fund_name: row.fund_name || '',
      fund_type_id: row.fund_type_id || '',
      tenure: row.tenure || '',
      yearly_return: row.yearly_return || '',
      yearly_appreciation: row.yearly_appreciation || '',
      yearly_tds: row.yearly_tds || '',
      tax: row.tax || '',
      capital_gain: row.capital_gain || '',
      tds_of_tax: row.tds_of_tax || '',
      locking_period: row.locking_period || '',
      investment_strategy: Array.isArray(row.investment_strategy) ? [...row.investment_strategy] : [],
      minimum_investment_range: Array.isArray(row.minimum_investment_range) ? [...row.minimum_investment_range] : [],
      status: row.status || 'active',
      country: row.country || '',
      image_url: row.image_url || null,
      pdf_url: row.pdf_url || null,
    })
    const editBanks: FundPlanBankRow[] = (row.banks && row.banks.length > 0)
      ? row.banks.map(b => ({
          account_holder_name: b.account_holder_name || '',
          account_number: b.account_number || '',
          ifsc_code: b.ifsc_code || '',
          branch_name: b.branch_name || '',
          bank_name: b.bank_name || '',
          swift_iban_code: b.swift_iban_code || '',
          is_primary: !!b.is_primary,
        }))
      : [{ account_holder_name: '', account_number: '', ifsc_code: '', branch_name: '', bank_name: '', swift_iban_code: '', is_primary: true }]
    setBanks(editBanks)
    setStrategyDraft(''); setMinRangeDraft('')
    setCreateOpen(true)
  }

  const handleDelete = async (row: FundPlanRow) => {
    if (!window.confirm(`Delete plan "${row.fund_name}"? This cannot be undone.`)) return
    const res = await deleteFundPlan(row.id)
    if (res.ok) { showToast('Plan deleted', 'success'); load() }
    else showToast(res.error || 'Delete failed', 'error')
  }

  const q = planSearch.trim().toLowerCase()
  const filteredPlans = q
    ? plans.filter(p => [p.fund_name, p.fund_type_name, p.country, p.status]
        .some(v => String(v || '').toLowerCase().includes(q)))
    : plans

  const handleExportPlans = async () => {
    const headers = ['Fund Name', 'Type', 'Country', 'Status', 'Tenure', 'Yearly Return', 'Lock-in', 'Tax', 'Bank Accounts']
    const esc = (v: any) => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s }
    const rows = filteredPlans.map(p => [p.fund_name, p.fund_type_name || '', p.country || '', p.status, p.tenure || '', p.yearly_return || '', p.locking_period || '', p.tax || '', p.banks.length].map(esc).join(','))
    const blob = new Blob([`﻿${headers.join(',')}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const { saveBlobAs } = await import('@/lib/supabase/storageService')
    await saveBlobAs(blob, 'investment-plans.csv')
  }

  return (
    <AdminGlass>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-base font-semibold text-white">Investment Plans</h2>
          <p className="text-xs text-gray-500 mt-0.5">Pre-defined plans (tenure, returns, locking period) admins can attach to investments. Each row supports View / Edit / Delete.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={planSearch}
              onChange={e => setPlanSearch(e.target.value)}
              placeholder="Search plans…"
              className="pl-8 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 w-44"
            />
          </div>
          <button
            onClick={handleExportPlans}
            disabled={plans.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-red/20 border border-brand-red/30 text-xs font-medium text-white hover:bg-brand-red/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Plan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-xs text-gray-500"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…</div>
      ) : plans.length === 0 ? (
        <AdminEmptyState
          icon={Target}
          title="No investment plans yet"
          description="Plans configured here become selectable when admins approve an investment application."
        />
      ) : filteredPlans.length === 0 ? (
        <div className="py-10 text-center text-xs text-gray-500">No plans match “{planSearch}”.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredPlans.map(p => (
            <div key={p.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.fund_name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{p.fund_type_name || 'Uncategorised'} · {p.country || '—'}</p>
                </div>
                <AdminBadge label={p.status} variant={p.status === 'active' ? 'success' : 'neutral'} />
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-gray-400">
                {p.tenure && <div><span className="text-gray-500">Tenure</span><p className="text-white">{p.tenure}</p></div>}
                {p.yearly_return && <div><span className="text-gray-500">Yearly Return</span><p className="text-white">{p.yearly_return}</p></div>}
                {p.locking_period && <div><span className="text-gray-500">Lock-in</span><p className="text-white">{p.locking_period}</p></div>}
                {p.tax && <div><span className="text-gray-500">Tax</span><p className="text-white">{p.tax}</p></div>}
              </div>
              {p.banks.length > 0 && (
                <p className="text-[10px] text-gray-500 mt-2">{p.banks.length} bank account{p.banks.length === 1 ? '' : 's'}</p>
              )}
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                <button onClick={() => setViewing(p)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-blue-300 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors">
                  <Eye className="w-3 h-3" /> View
                </button>
                <button onClick={() => startEdit(p)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => handleDelete(p)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-red-300 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setEditingId(null); resetForm() }}
        title={editingId ? 'Edit Investment Plan' : 'Add Investment Plan'}
        subtitle={editingId
          ? 'Update fields below. Bank rows are replaced on save — leave them as-is to keep current accounts.'
          : 'All fields are optional except Fund Name. Add bank accounts at the bottom — each requires Holder, Account #, and IFSC.'}
        maxWidth="max-w-3xl"
        footer={
          <>
            <ModalButton onClick={() => { setCreateOpen(false); setEditingId(null); resetForm() }} disabled={saving}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handleCreate} disabled={saving}>
              {saving ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Saving…</span> : (editingId ? 'Save Changes' : 'Submit')}
            </ModalButton>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <PlanField label="Fund Name *" value={form.fund_name} onChange={v => setForm(p => ({ ...p, fund_name: v }))} />
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Fund Type</label>
              <select value={form.fund_type_id} onChange={e => setForm(p => ({ ...p, fund_type_id: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20">
                <option value="">— Select —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.type}</option>)}
              </select>
            </div>
            <PlanField label="Tenure" value={form.tenure} onChange={v => setForm(p => ({ ...p, tenure: v }))} placeholder="e.g. 3 years" />
            <PlanField label="Yearly Return" value={form.yearly_return} onChange={v => setForm(p => ({ ...p, yearly_return: v }))} placeholder="e.g. 12%" />
            <PlanField label="Yearly Appreciation" value={form.yearly_appreciation} onChange={v => setForm(p => ({ ...p, yearly_appreciation: v }))} placeholder="e.g. 12%" />
            <PlanField label="Yearly TDS" value={form.yearly_tds} onChange={v => setForm(p => ({ ...p, yearly_tds: v }))} placeholder="e.g. 10%" />
            <PlanField label="Tax" value={form.tax} onChange={v => setForm(p => ({ ...p, tax: v }))} />
            <PlanField label="Capital Gain" value={form.capital_gain} onChange={v => setForm(p => ({ ...p, capital_gain: v }))} />
            <PlanField label="TDS of Tax" value={form.tds_of_tax} onChange={v => setForm(p => ({ ...p, tds_of_tax: v }))} />
            <PlanField label="Locking Period" value={form.locking_period} onChange={v => setForm(p => ({ ...p, locking_period: v }))} placeholder="e.g. 3 years" />
            <PlanField label="Country" value={form.country} onChange={v => setForm(p => ({ ...p, country: v }))} placeholder="e.g. India" />
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Investment Strategy (list) */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Investment Strategy</label>
            <div className="flex gap-2 mb-2">
              <input value={strategyDraft} onChange={e => setStrategyDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStrategy() } }} placeholder="Add a strategy line" className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
              <button onClick={addStrategy} className="px-3 py-2 rounded-xl text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors">Add</button>
            </div>
            {form.investment_strategy.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.investment_strategy.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-gray-300">
                    {s}
                    <button onClick={() => removeStrategy(i)} className="text-gray-500 hover:text-red-400" title="Remove"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Minimum Investment Range (list) */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Minimum Investment Range</label>
            <div className="flex gap-2 mb-2">
              <input value={minRangeDraft} onChange={e => setMinRangeDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMinRange() } }} placeholder="e.g. 10,00,000" className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
              <button onClick={addMinRange} className="px-3 py-2 rounded-xl text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors">Add</button>
            </div>
            {form.minimum_investment_range.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.minimum_investment_range.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-gray-300">
                    {s}
                    <button onClick={() => removeMinRange(i)} className="text-gray-500 hover:text-red-400" title="Remove"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Uploads */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Upload Image</label>
              {form.image_url ? (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <img src={form.image_url} alt="" className="h-10 w-10 object-cover rounded bg-white" />
                  <p className="text-[11px] text-gray-300 flex-1 truncate">Uploaded</p>
                  <button onClick={() => setForm(p => ({ ...p, image_url: null }))} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 bg-white/[0.04] border border-dashed border-white/[0.14] hover:bg-white/[0.06] cursor-pointer">
                  {uploading === 'image' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Choose image
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload('image', f); e.target.value = '' }} />
                </label>
              )}
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Upload PDF</label>
              {form.pdf_url ? (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="h-10 w-10 rounded bg-red-500/15 text-red-300 flex items-center justify-center text-[10px] font-bold">PDF</div>
                  <a href={form.pdf_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-300 flex-1 truncate hover:underline">View PDF</a>
                  <button onClick={() => setForm(p => ({ ...p, pdf_url: null }))} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 bg-white/[0.04] border border-dashed border-white/[0.14] hover:bg-white/[0.06] cursor-pointer">
                  {uploading === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Choose PDF
                  <input type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload('pdf', f); e.target.value = '' }} />
                </label>
              )}
            </div>
          </div>

          {/* Bank details — multi-row */}
          <div className="pt-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Bank Details</p>
              <button onClick={addBank} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
                <Plus className="w-3 h-3" /> Add Bank Row
              </button>
            </div>
            <div className="space-y-2">
              {banks.map((b, i) => (
                <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">Bank #{i + 1}</span>
                    {banks.length > 1 && (
                      <button onClick={() => removeBank(i)} className="p-1 text-gray-500 hover:text-red-400" title="Remove row"><Trash2 className="w-3 h-3" /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <PlanField label="Account Holder Name" value={b.account_holder_name} onChange={v => setBankField(i, 'account_holder_name', v)} compact />
                    <PlanField label="Account Number" value={b.account_number} onChange={v => setBankField(i, 'account_number', v.replace(/\D/g, '').slice(0, 18))} compact />
                    <PlanField label="IFSC Code" value={b.ifsc_code} onChange={v => setBankField(i, 'ifsc_code', v.toUpperCase().slice(0, 11))} compact />
                    <PlanField label="Branch Name" value={b.branch_name || ''} onChange={v => setBankField(i, 'branch_name', v)} compact />
                    <PlanField label="Bank Name" value={b.bank_name || ''} onChange={v => setBankField(i, 'bank_name', v)} compact />
                    <PlanField label="Swift/IBAN Code" value={b.swift_iban_code || ''} onChange={v => setBankField(i, 'swift_iban_code', v)} compact />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminModal>

      {/* View modal */}
      <AdminModal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.fund_name || 'Plan'}
        subtitle={viewing ? `${viewing.fund_type_name || 'Uncategorised'} · ${viewing.country || '—'}` : ''}
        maxWidth="max-w-2xl"
        footer={<ModalButton onClick={() => setViewing(null)}>Close</ModalButton>}
      >
        {viewing && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <Kv k="Tenure" v={viewing.tenure} />
              <Kv k="Yearly Return" v={viewing.yearly_return} />
              <Kv k="Yearly Appreciation" v={viewing.yearly_appreciation} />
              <Kv k="Yearly TDS" v={viewing.yearly_tds} />
              <Kv k="Tax" v={viewing.tax} />
              <Kv k="Capital Gain" v={viewing.capital_gain} />
              <Kv k="TDS of Tax" v={viewing.tds_of_tax} />
              <Kv k="Locking Period" v={viewing.locking_period} />
              <Kv k="Status" v={viewing.status} />
              <Kv k="Country" v={viewing.country} />
            </div>
            {viewing.investment_strategy.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Investment Strategy</p>
                <ul className="text-[12px] text-gray-300 list-disc pl-5">{viewing.investment_strategy.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
            {viewing.minimum_investment_range.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Minimum Investment Range</p>
                <ul className="text-[12px] text-gray-300 list-disc pl-5">{viewing.minimum_investment_range.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
            {(viewing.image_url || viewing.pdf_url) && (
              <div className="flex flex-wrap gap-2">
                {viewing.image_url && <a href={viewing.image_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-300 hover:underline">View image</a>}
                {viewing.pdf_url && <a href={viewing.pdf_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-300 hover:underline">View PDF</a>}
              </div>
            )}
            {viewing.banks.length > 0 && (
              <div className="pt-2 border-t border-white/[0.06]">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Bank Accounts</p>
                <div className="space-y-1.5">
                  {viewing.banks.map((b, i) => (
                    <div key={i} className="text-[11px] text-gray-300 p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                      <p className="font-medium text-white">{b.account_holder_name}</p>
                      <p className="text-gray-500">{b.bank_name || '—'} · {b.branch_name || '—'}</p>
                      <p className="text-gray-400 font-mono">{b.account_number} · {b.ifsc_code}{b.swift_iban_code ? ` · SWIFT ${b.swift_iban_code}` : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AdminModal>
    </AdminGlass>
  )
}

function PlanField({ label, value, onChange, placeholder, compact }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; compact?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 ${compact ? 'py-1.5 text-[12px]' : 'py-2 text-sm'} text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20`}
      />
    </div>
  )
}

function Kv({ k, v }: { k: string; v: any }) {
  return (
    <div>
      <span className="text-gray-500">{k}</span>
      <p className="text-white">{v == null || v === '' ? '—' : String(v)}</p>
    </div>
  )
}

function FundCategoriesTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [rows, setRows] = useState<FundCategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [type, setType] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchFundCategories({ activeOnly: false })
    setRows(data)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!type.trim()) { showToast('Type is required', 'error'); return }
    setSaving(true)
    try {
      const res = await createFundCategory({ type })
      if (res.ok) {
        showToast('Fund type added', 'success')
        setType('')
        setCreateOpen(false)
        load()
      } else {
        showToast(res.error || 'Create failed', 'error')
      }
    } finally { setSaving(false) }
  }

  const handleDelete = async (row: FundCategoryRow) => {
    if (!window.confirm(`Deactivate "${row.type}"? Existing fund plans will keep their reference; future ones won't see this category in the picker.`)) return
    const res = await deleteFundCategory(row.id)
    if (res.ok) { showToast('Fund type deactivated', 'success'); load() }
    else showToast(res.error || 'Delete failed', 'error')
  }

  return (
    <AdminGlass>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-[180px]">
          <h2 className="text-base font-semibold text-white">Fund Categories</h2>
          <p className="text-xs text-gray-500 mt-0.5">Categorise the fund vehicles offered (e.g. Direct AIF, SEBI Co-Invest, Debenture). Used by the Investment Plan picker.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-red/20 border border-brand-red/30 text-xs font-medium text-white hover:bg-brand-red/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Fund Type
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-xs text-gray-500"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…</div>
      ) : rows.length === 0 ? (
        <AdminEmptyState icon={Target} title="No fund categories" description="Use Add Fund Type to create the first category." />
      ) : (
        <div className="space-y-2">
          {rows.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.type}</p>
                  <p className="text-[10px] text-gray-500 truncate">{c.slug || '—'}{c.description ? ` · ${c.description}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AdminBadge label={c.is_active ? 'Active' : 'Inactive'} variant={c.is_active ? 'success' : 'neutral'} />
                {c.is_active && (
                  <button onClick={() => handleDelete(c)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors" title="Deactivate"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setType('') }}
        title="Add Fund Type"
        subtitle="The Type is what admins will see in the Investment Plan picker."
        maxWidth="max-w-md"
        footer={
          <>
            <ModalButton onClick={() => { setCreateOpen(false); setType('') }} disabled={saving}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handleCreate} disabled={saving}>
              {saving ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Saving…</span> : 'Submit'}
            </ModalButton>
          </>
        }
      >
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Type *</label>
          <input
            value={type}
            onChange={e => setType(e.target.value)}
            placeholder="e.g. Debenture, Direct AIF, SEBI Co-Invest"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
          />
        </div>
      </AdminModal>
    </AdminGlass>
  )
}

function BankDetailsDirectoryTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [rows, setRows] = useState<AdminBankAccountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [clientOptions, setClientOptions] = useState<Array<{ id: string; full_name: string; email: string | null }>>([])
  const [form, setForm] = useState({
    client_id: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    branch_name: '',
    account_type: 'savings' as 'savings' | 'current' | 'nro' | 'nre',
    is_primary: false,
  })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [accounts, clientList] = await Promise.all([
      fetchAllBankAccounts(),
      fetchClients(),
    ])
    setRows(accounts)
    setClientOptions(((clientList as any[]) || []).map(c => ({
      id: c.id,
      full_name: c.full_name || c.name || 'Unknown',
      email: c.email || null,
    })))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(r =>
      r.clientName.toLowerCase().includes(q) ||
      (r.clientEmail || '').toLowerCase().includes(q) ||
      r.account_number.toLowerCase().includes(q) ||
      r.ifsc_code.toLowerCase().includes(q) ||
      (r.bank_name || '').toLowerCase().includes(q)
    )
  }, [rows, search])

  const handleCreate = async () => {
    if (!form.client_id) { showToast('Pick a client', 'error'); return }
    if (!form.account_holder_name.trim()) { showToast('Account holder name is required', 'error'); return }
    if (!/^\d{6,18}$/.test(form.account_number.trim())) { showToast('Account number must be 6–18 digits', 'error'); return }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc_code.trim().toUpperCase())) { showToast('Invalid IFSC code', 'error'); return }
    setSaving(true)
    try {
      const res = await createBankAccount({
        client_id: form.client_id,
        account_holder_name: form.account_holder_name.trim(),
        account_number: form.account_number.trim(),
        ifsc_code: form.ifsc_code.trim().toUpperCase(),
        bank_name: form.bank_name.trim() || undefined,
        branch_name: form.branch_name.trim() || undefined,
        account_type: form.account_type,
        is_primary: form.is_primary,
      })
      if (res.ok) {
        showToast('Bank account added', 'success')
        setCreateOpen(false)
        setForm({ client_id: '', account_holder_name: '', account_number: '', ifsc_code: '', bank_name: '', branch_name: '', account_type: 'savings', is_primary: false })
        load()
      } else {
        showToast(res.error || 'Failed to add bank account', 'error')
      }
    } finally { setSaving(false) }
  }

  const handleDelete = async (row: AdminBankAccountRow) => {
    if (row.source !== 'bank_accounts') {
      showToast('KYC-sourced accounts can only be deleted via the KYC tab.', 'warning')
      return
    }
    if (!window.confirm(`Delete bank account ending ${row.account_number.slice(-4)}?`)) return
    const res = await deleteBankAccount(row.id)
    if (res.ok) { showToast('Bank account deleted', 'success'); load() }
    else showToast(res.error || 'Failed to delete', 'error')
  }

  return (
    <AdminGlass>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-[180px]">
          <h2 className="text-base font-semibold text-white">Bank Details</h2>
          <p className="text-xs text-gray-500 mt-0.5">Master list of investor bank accounts (sourced from KYC plus additional accounts added by the admin).</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, account, IFSC…"
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 w-56"
          />
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-red/20 border border-brand-red/30 text-xs font-medium text-white hover:bg-brand-red/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Bank Details
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-xs text-gray-500"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…</div>
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          icon={IndianRupee}
          title="No bank accounts"
          description={search ? 'No accounts match your search.' : 'No bank details yet. Use Add Bank Details to create the first record.'}
        />
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-gray-500 uppercase tracking-wider text-[10px]">
                <th className="text-left px-2 py-2 font-medium">Investor</th>
                <th className="text-left px-2 py-2 font-medium">Bank</th>
                <th className="text-left px-2 py-2 font-medium">Account #</th>
                <th className="text-left px-2 py-2 font-medium">IFSC</th>
                <th className="text-left px-2 py-2 font-medium">Type</th>
                <th className="text-left px-2 py-2 font-medium">Source</th>
                <th className="text-right px-2 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-2 py-2.5">
                    <p className="text-white font-medium">{r.clientName}</p>
                    <p className="text-[10px] text-gray-500">{r.clientEmail || '—'}</p>
                  </td>
                  <td className="px-2 py-2.5 text-gray-300">{r.bank_name || '—'}<p className="text-[10px] text-gray-500">{r.account_holder_name}</p></td>
                  <td className="px-2 py-2.5 text-gray-300 font-mono tracking-wider">{r.account_number || '—'}</td>
                  <td className="px-2 py-2.5 text-gray-300 font-mono">{r.ifsc_code || '—'}</td>
                  <td className="px-2 py-2.5 text-gray-400 capitalize">{r.account_type}</td>
                  <td className="px-2 py-2.5">
                    <AdminBadge label={r.source === 'bank_accounts' ? 'Admin' : 'KYC'} variant={r.source === 'bank_accounts' ? 'success' : 'info'} />
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(r)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                      title={r.source === 'bank_accounts' ? 'Delete bank account' : 'KYC-sourced — manage via KYC'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Bank Details"
        subtitle="Add a new bank account for an investor. The account is stored in `bank_accounts` and aggregated with KYC-sourced entries."
        maxWidth="max-w-lg"
        footer={
          <>
            <ModalButton onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handleCreate} disabled={saving}>
              {saving ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Saving…</span> : 'Add Account'}
            </ModalButton>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Client *</label>
            <select
              value={form.client_id}
              onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            >
              <option value="">Choose investor…</option>
              {clientOptions.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}{c.email ? ` — ${c.email}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Account Holder Name *</label>
            <input
              value={form.account_holder_name}
              onChange={e => setForm(p => ({ ...p, account_holder_name: e.target.value }))}
              placeholder="As printed on the cancelled cheque"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Account Number *</label>
              <input
                inputMode="numeric"
                value={form.account_number}
                onChange={e => setForm(p => ({ ...p, account_number: e.target.value.replace(/\D/g, '').slice(0, 18) }))}
                placeholder="6–18 digits"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 font-mono tracking-wider"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">IFSC *</label>
              <input
                value={form.ifsc_code}
                onChange={e => setForm(p => ({ ...p, ifsc_code: e.target.value.toUpperCase().slice(0, 11) }))}
                placeholder="HDFC0001234"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Bank Name</label>
              <input
                value={form.bank_name}
                onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))}
                placeholder="HDFC Bank"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Branch</label>
              <input
                value={form.branch_name}
                onChange={e => setForm(p => ({ ...p, branch_name: e.target.value }))}
                placeholder="Branch name"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Account Type</label>
              <select
                value={form.account_type}
                onChange={e => setForm(p => ({ ...p, account_type: e.target.value as any }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              >
                <option value="savings">Savings</option>
                <option value="current">Current</option>
                <option value="nro">NRO</option>
                <option value="nre">NRE</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-300 pb-2">
              <input
                type="checkbox"
                checked={form.is_primary}
                onChange={e => setForm(p => ({ ...p, is_primary: e.target.checked }))}
                className="accent-brand-red"
              />
              Mark as primary
            </label>
          </div>
        </div>
      </AdminModal>
    </AdminGlass>
  )
}

