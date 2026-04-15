'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  TrendingUp, Users, Target, IndianRupee, Phone, Mail,
  Calendar, ArrowUpRight, ArrowDownRight, Eye, MoreHorizontal,
  Trophy, Zap, Filter, Plus, Clock, CheckCircle2,
  Star, BarChart3, Percent, DollarSign, UserPlus, Upload,
  ArrowRightLeft, Loader2, RefreshCw, Trash2,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import LeadManagementModule from '../../shared/LeadManagementModule'

// Wrapper to render LeadManagementModule for specific sub-tabs within Sales
function LeadMgmtWrapper({ subTab, navigate, showToast }: { subTab: string; navigate: (p: string) => void; showToast: (m: string, t?: any) => void }) {
  return <LeadManagementModule subTab={subTab} navigate={navigate} showToast={showToast} scope="admin" basePath="/admin/sales" />
}
import AdminEmptyState from '../shared/AdminEmptyState'
import { formatINR, formatDate } from '@/lib/admin/adminHooks'
import type { Lead, LeadStage, LeadSource, Commission } from '@/lib/admin/adminTypes'
import UploadWithFolderPicker from '@/components/shared/UploadWithFolderPicker'
import { createLead, updateLead, fetchLeads, deleteLead } from '@/lib/supabase/leadService'
import { onNewLead } from '@/lib/supabase/realtimeSubscriptions'
import { fetchAllInvestmentApplications } from '@/lib/supabase/adminDataService'

// ── Sub-tabs ─────────────────────────────────────────────────────
const SALES_TABS = [
  { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
  { id: 'leads', label: 'Lead List', icon: Users },
  { id: 'commissions', label: 'Commissions', icon: IndianRupee },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'investments', label: 'Investments', icon: BarChart3 },
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
        {activeTab === 'pipeline' && <PipelineTab leads={leads} onViewLead={(l) => { setSelectedLead(l); setLeadModalOpen(true) }} onDeleteLead={handleDeleteLead} showToast={showToast} />}
        {activeTab === 'leads' && <LeadListTab leads={leads} onViewLead={(l) => { setSelectedLead(l); setLeadModalOpen(true) }} onDeleteLead={handleDeleteLead} showToast={showToast} />}
        {activeTab === 'commissions' && <CommissionsTab showToast={showToast} />}
        {activeTab === 'leaderboard' && <LeaderboardTab leads={leads} />}
        {activeTab === 'investments' && <InvestmentsTab showToast={showToast} />}
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
function PipelineTab({ leads, onViewLead, onDeleteLead, showToast }: { leads: Lead[]; onViewLead: (l: Lead) => void; onDeleteLead: (l: Lead) => void; showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const stages: LeadStage[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

  const grouped = useMemo(() => {
    const map: Record<LeadStage, Lead[]> = { new: [], contacted: [], qualified: [], proposal: [], negotiation: [], won: [], lost: [] }
    leads.forEach(l => map[l.stage].push(l))
    return map
  }, [leads])

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-[900px]">
        {stages.map(stage => {
          const config = STAGE_CONFIG[stage]
          const stageLeads = grouped[stage]
          const stageValue = stageLeads.reduce((s, l) => s + l.value, 0)

          return (
            <div key={stage} className="flex-1 min-w-[180px]">
              {/* Column Header */}
              <div className={`p-3 rounded-t-xl border ${config.bgColor}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                  <span className="text-[10px] text-gray-500 bg-white/[0.06] px-1.5 py-0.5 rounded-full">{stageLeads.length}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">{formatINR(stageValue)}</p>
              </div>

              {/* Cards */}
              <div className="space-y-2 mt-2">
                {stageLeads.map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => onViewLead(lead)}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs font-medium text-white">{lead.name}</p>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                ))}
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
function CommissionsTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  // Commissions will be populated from real data once the commissions table is set up
  // For now show empty state
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Total Commissions</p>
          <p className="text-xl font-bold text-white mt-1">{formatINR(0)}</p>
        </AdminGlass>
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Paid</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{formatINR(0)}</p>
        </AdminGlass>
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Pending</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{formatINR(0)}</p>
        </AdminGlass>
      </div>

      <AdminGlass padding="p-4">
        <AdminEmptyState title="No commissions yet" description="Commissions will appear here as deals are closed and payouts are processed." />
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

function generateInvestmentDocument(
  type: 'acknowledgement' | 'allotment' | 'certificate' | 'agreement',
  app: any
) {
  const clientName = app._client?.full_name || 'Investor'
  const clientEmail = app._client?.email || ''
  const amount = Number(app.investment_amount) || 0
  const numDebentures = Math.floor(amount / 10)
  const amountWords = numberToWords(amount)
  const fund = app.fund_vehicle || 'Alternate route to Invest in AIF via Debenture'
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const refNo = `GHLVEN/${(app.id || '').replace(/-/g,'').slice(0, 3).toUpperCase()}/${new Date().getFullYear()}`
  const folioNo = `D${(app.id || '').replace(/-/g,'').slice(0,4).toUpperCase()}`
  const certNo = `${(app.id || '').replace(/-/g,'').slice(0, 3).toUpperCase()}`
  const tenure = app.tenure_preference || '3 years'

  const css = `<style>
    @page{size:A4;margin:18mm 20mm;}
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

  const templates: Record<string, string> = {
    acknowledgement: `${css}<body>${header}
      <p class="right">Date: [DATE]</p>
      <p>Ref: [REF]<br/>[NAME]<br/>[ADDRESS]<br/>[PHONE]<br/>Email: [EMAIL]</p>
      <p><strong>Subject: Acknowledgement of investment receipt</strong></p>
      <p>Dear [NAME],</p>
      <p><strong>GHL India Ventures welcomes you to the new Dawn of Wealth Creation and prosperity</strong></p>
      <p>We are delighted to welcome you to <strong>GHL India Ventures</strong>, where your financial aspirations take shape and transform into lasting success. By joining us, you have become an integral part of our <strong>prestigious family of visionary investors</strong> &mdash; individuals who believe in creating wealth with wisdom and foresight.</p>
      <p>Your decision to partner with GHL India Ventures marks a <strong>powerful first step toward true financial freedom</strong>. Together, let us shape a future defined by prosperity, stability, and enduring success.</p>
      <p>Welcome once again to GHL India Ventures &mdash; <strong>where your prosperity is our purpose</strong>.</p>
      <p>We acknowledge receipt of your investment towards the <strong>subscription of debentures in Landmaxo Properties Private Limited</strong>, as detailed below:</p>
      <table class="mb">
        <tr><th>S.No</th><th>Date of Receipt</th><th>Amount (&#8377;)</th><th>Amount in Words</th></tr>
        <tr><td>1</td><td>[DATE]</td><td>[AMOUNT]</td><td>[AMOUNT_WORDS] Rupees Only</td></tr>
      </table>
      <p>The debentures carry an <strong>interest rate of 1% per month</strong> along with an <strong>annual appreciation of 12%</strong>, for a <strong>minimum tenure of three (3) years</strong> from the date of investment. Interest will be paid on or before the <strong>10th of each month</strong>, after deduction of applicable <strong>TDS (currently 10%)</strong> under the Income Tax Act, 1961.</p>
      <p>Debentures may be <strong>redeemed at the investor's option</strong> after completion of the 3-year tenure. <strong>TDS credits</strong> will be reflected in the investor's PAN account on a <strong>quarterly basis</strong>.</p>
      <p class="note">* This is system generated document. Signature authentication is not required. *</p>
      ${footer}</body>`,

    allotment: `${css}<body>${logo}
      <div class="header" style="border-bottom:none;">
        <h1 style="color:#2d6a2e;">LANDMAXO PROPERTIES PRIVATE LIMITED</h1>
        <div class="sub">{ CIN: U70109TN2022PTC151180 }</div>
        <div class="sub">No.2D, Queens Court, Montieth Road, Egmore, Chennai - 600008</div>
      </div>
      <p class="right">Date: [DATE]</p>
      <p>To<br/><strong>[NAME]</strong><br/>[ADDRESS]<br/>[EMAIL]</p>
      <p class="center bold">Sub: Allotment of Secured, Non &ndash; Convertible Debentures</p>
      <p>Dear Investor,</p>
      <p>This is with reference to your Investment, I am directed by the Board of Directors to inform you that you have been allotted <strong>[NUM_DEB]</strong> Secured, Non-Convertible debentures of Rs.10/- each. The tenure of debentures is for [TENURE].</p>
      <p>These debentures are allotted to you as per the resolution passed at the Board meeting held on [DATE] and as per the terms and conditions of Articles of Association of the company.</p>
      <p>Details of allotment are as follows:</p>
      <table style="font-size:10px;">
        <tr><th>Folio No.</th><th>No. of Debentures</th><th colspan="2">Distinctive Nos.</th><th>Amount (Rs)</th><th>Type</th><th>Rate</th><th>Tenure</th></tr>
        <tr><th></th><th></th><th>From</th><th>To</th><th></th><th></th><th></th><th></th></tr>
        <tr><td>[FOLIO]</td><td>[NUM_DEB]</td><td>1</td><td>[NUM_DEB_RAW]</td><td>[AMOUNT]</td><td style="font-size:9px;">Secured, Non-Convertible</td><td>[RATE]</td><td>[TENURE]</td></tr>
      </table>
      <p class="mt">Duly signed and executed debenture certificate will be sent to you.</p>
      <p class="mt bold">This is a computer generated document and does not require signature</p>
      ${footer}</body>`,

    certificate: `${css}
      <style>.cert-border{border:4px double #C8A951;padding:28px;margin:10px;background:#fff;}.cert-title{text-align:center;font-size:24px;font-weight:800;letter-spacing:3px;margin-bottom:8px;color:#333;}.cert-company{text-align:center;font-size:18px;font-weight:700;margin-bottom:4px;}.cert-sub{text-align:center;font-size:10px;color:#555;margin-bottom:20px;}.cert-body{line-height:1.8;font-size:12px;}.cert-highlight{text-align:center;background:#f8f8f0;border:1px solid #C8A951;padding:10px;margin:16px 0;font-weight:700;font-size:13px;}.cert-fields td{padding:6px 12px;font-size:12px;border:none;}.cert-fields td:first-child{color:#666;width:220px;}</style>
      <body>
      <div class="cert-border">
        <div class="cert-title">DEBENTURE CERTIFICATE</div>
        <div style="text-align:center;margin-bottom:8px;">
          <div style="font-size:28px;font-weight:900;color:#2d6a2e;letter-spacing:3px;">LANDMA<span style="color:#E8A317;">X</span>O</div>
          <div style="font-size:9px;color:#666;letter-spacing:2px;">Invest&bull; Earn&bull; Repeat</div>
        </div>
        <div class="cert-company">LANDMAXO PROPERTIES PRIVATE LIMITED</div>
        <div class="cert-sub">(CIN: U70109TN2022PTC151180) &nbsp;|&nbsp; (Incorporated under the Companies Act, 2013)<br/>Reg. Office: 2D, 2nd Floor, Queens Court, No. 6 Montieth Road, Egmore, Chennai - 600008, Tamil Nadu, India</div>
        <div class="cert-body">
          <p>This is to certify that the person(s) named in this Certificate is/are the Registered/Beneficial Holder(s) of the within mentioned debenture(s) bearing the distinctive number(s) herein specified in the above-named Company subject to the Memorandum and Articles of Association of the Company and that the amount endorsed herein has been paid up on each such share.</p>
          <div class="cert-highlight">
            DEBENTURE EACH OF RUPEES 10/-(Nominal Value)<br/>
            AMOUNT PAID-UPPER DEBENTURE RUPEES 10/-[Rupees Ten Only]
          </div>
          <table class="cert-fields" style="width:100%;">
            <tr><td>Regd. Folio No. [FOLIO]</td><td class="right">Certificate No. [CERT_NO]</td></tr>
          </table>
          <table class="cert-fields" style="width:100%;margin-top:12px;">
            <tr><td>Name(s) of the Registered<br/>Debenture holder(s)</td><td class="bold">[NAME]</td></tr>
            <tr><td>No. of Debenture(s) held</td><td class="bold">[NUM_DEB] ([AMOUNT_WORDS] Only)</td></tr>
            <tr><td>Distinctive No.(s)</td><td class="bold">1 to [NUM_DEB_RAW] (Both inclusive)</td></tr>
            <tr><td>Total Value of debenture(s)</td><td class="bold">[AMOUNT] ([AMOUNT_WORDS] Only)</td></tr>
          </table>
          <p class="mt">GIVEN under the common seal of the Company this [DATE]</p>
          <div style="display:flex;justify-content:space-between;margin-top:48px;">
            <div style="text-align:center;"><div style="border-top:1px solid #333;padding-top:4px;width:120px;">Director</div></div>
            <div style="text-align:center;"><div style="width:80px;height:80px;border:2px solid #C8A951;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;color:#999;">Company<br/>Seal</div></div>
            <div style="text-align:center;"><div style="border-top:1px solid #333;padding-top:4px;width:150px;">Authorised Signatory</div></div>
          </div>
        </div>
      </div>
      ${footer}</body>`,

    agreement: `${css}
      <style>.clause{margin-bottom:8px;}.clause-title{font-weight:700;margin-top:16px;margin-bottom:6px;font-size:13px;}.schedule-table td,.schedule-table th{border:1px solid #999;padding:5px 8px;font-size:10px;}</style>
      <body>
      ${logo}
      <div class="header" style="border-bottom:none;">
        <h1 style="color:#2d6a2e;">LANDMAXO PROPERTIES PRIVATE LIMITED</h1>
        <div class="sub">CIN: U70109TN2022PTC151180 | Queens Court, Egmore, Chennai - 600008</div>
      </div>
      <h2 class="center" style="color:#D0021B;">DEBENTURE SUBSCRIPTION AGREEMENT</h2>
      <p class="right">Date: [DATE]</p>
      <p>This Debenture Subscription Agreement (&ldquo;Agreement&rdquo;) is made and entered into on <strong>[DATE]</strong></p>
      <p><strong>BETWEEN:</strong></p>
      <p class="clause"><strong>Landmaxo Properties Private Limited</strong>, a company incorporated under the Companies Act, 2013, having its registered office at No.2D, Queens Court, Montieth Road, Egmore, Chennai &ndash; 600008, Tamil Nadu (CIN: U70109TN2022PTC151180), hereinafter referred to as the &ldquo;<strong>Company</strong>&rdquo; / &ldquo;<strong>Issuer</strong>&rdquo; (which expression shall include its successors and assigns) of the <strong>FIRST PART</strong>;</p>
      <p><strong>AND</strong></p>
      <p class="clause"><strong>[NAME]</strong>, hereinafter referred to as the &ldquo;<strong>Subscriber</strong>&rdquo; / &ldquo;<strong>Debenture Holder</strong>&rdquo; of the <strong>SECOND PART</strong>.</p>
      <p>(The Company and the Subscriber are hereinafter individually referred to as &ldquo;Party&rdquo; and collectively as &ldquo;Parties&rdquo;.)</p>

      <div class="clause-title">1. DEFINITIONS AND INTERPRETATION</div>
      <p class="clause">1.1 &ldquo;<strong>Debentures</strong>&rdquo; means Secured, Non-Convertible Debentures of face value of Rs. 10/- each issued by the Company.</p>
      <p class="clause">1.2 &ldquo;<strong>Subscription Amount</strong>&rdquo; means Rs. [AMOUNT]/- (Rupees [AMOUNT_WORDS] Only).</p>
      <p class="clause">1.3 &ldquo;<strong>Tenure</strong>&rdquo; means [TENURE] from the date of allotment unless redeemed earlier as per Clause 6.</p>
      <p class="clause">1.4 &ldquo;<strong>Interest Rate</strong>&rdquo; means 1% per month (12% per annum) payable monthly.</p>

      <div class="clause-title">2. SUBSCRIPTION</div>
      <p class="clause">2.1 The Subscriber agrees to subscribe to [NUM_DEB] Secured, Non-Convertible Debentures of Rs. 10/- each, aggregating to Rs. [AMOUNT]/- (Rupees [AMOUNT_WORDS] Only).</p>
      <p class="clause">2.2 The Company agrees to allot the said Debentures to the Subscriber upon receipt of the Subscription Amount.</p>

      <div class="clause-title">3. INTEREST AND PAYMENTS</div>
      <p class="clause">3.1 The Debentures shall carry interest at the rate of <strong>1% per month</strong> on the face value of the Debentures.</p>
      <p class="clause">3.2 Interest shall be paid monthly, on or before the 10th of each calendar month, by way of direct bank transfer to the Subscriber&rsquo;s designated bank account.</p>
      <p class="clause">3.3 An annual appreciation of <strong>12% per annum</strong> shall be applicable on the principal investment amount.</p>
      <p class="clause">3.4 Tax Deducted at Source (TDS) at the rate of 10% (or as applicable under the Income Tax Act, 1961) shall be deducted before disbursement of interest.</p>

      <div class="clause-title">4. SECURITY</div>
      <p class="clause">4.1 The Debentures are secured by a charge on the assets of the Company as determined by the Board of Directors from time to time.</p>
      <p class="clause">4.2 A Debenture Trust Deed shall be executed in favour of the Debenture Trustee for the benefit of the Debenture Holders.</p>

      <div class="clause-title">5. TENURE AND LOCK-IN</div>
      <p class="clause">5.1 The minimum lock-in period for the Debentures shall be [TENURE] from the date of allotment.</p>
      <p class="clause">5.2 The Debentures shall not be transferable during the lock-in period except with the prior written consent of the Company.</p>

      <div class="clause-title">6. REDEMPTION</div>
      <p class="clause">6.1 Upon completion of the tenure, the Subscriber may opt for redemption of the Debentures at face value plus accrued appreciation.</p>
      <p class="clause">6.2 Early redemption may be permitted at the sole discretion of the Company, subject to applicable exit load/charges if any.</p>
      <p class="clause">6.3 The Subscriber may also opt for renewal of the Debentures for a further term on mutually agreed terms.</p>

      <div class="clause-title">7. REPRESENTATIONS AND WARRANTIES</div>
      <p class="clause">7.1 The Subscriber represents that the funds invested are from legitimate sources and are not proceeds of any illegal activity.</p>
      <p class="clause">7.2 The Company represents that it is duly incorporated and authorized to issue the Debentures.</p>

      <div class="clause-title">8. EVENTS OF DEFAULT</div>
      <p class="clause">8.1 Non-payment of interest for a continuous period of 3 months shall constitute an event of default.</p>
      <p class="clause">8.2 Upon occurrence of an event of default, the Subscriber shall have the right to demand immediate redemption of the Debentures.</p>

      <div class="clause-title">9. GOVERNING LAW AND JURISDICTION</div>
      <p class="clause">9.1 This Agreement shall be governed by and construed in accordance with the laws of India.</p>
      <p class="clause">9.2 Any disputes arising under this Agreement shall be subject to the exclusive jurisdiction of the courts in Chennai, Tamil Nadu.</p>

      <div class="clause-title">10. GENERAL</div>
      <p class="clause">10.1 This Agreement constitutes the entire understanding between the Parties with respect to the subject matter hereof.</p>
      <p class="clause">10.2 No amendment or modification of this Agreement shall be valid unless made in writing and signed by both Parties.</p>
      <p class="clause">10.3 All notices under this Agreement shall be in writing and delivered to the registered addresses of the respective Parties.</p>

      <p class="mt"><strong>IN WITNESS WHEREOF</strong>, the Parties have executed this Agreement on the date first written above.</p>

      <div style="display:flex;justify-content:space-between;margin-top:40px;">
        <div style="width:45%;">
          <p class="bold">For Landmaxo Properties Private Limited</p>
          <div style="height:60px;"></div>
          <div style="border-top:1px solid #333;padding-top:4px;font-size:11px;">Authorised Signatory<br/>Director</div>
          <p style="font-size:10px;margin-top:8px;">Name: ___________________<br/>Designation: ___________________<br/>Date: [DATE]</p>
        </div>
        <div style="width:45%;text-align:right;">
          <p class="bold">Subscriber / Debenture Holder</p>
          <div style="height:60px;"></div>
          <div style="border-top:1px solid #333;padding-top:4px;font-size:11px;">[NAME]</div>
          <p style="font-size:10px;margin-top:8px;">PAN: ___________________<br/>Address: ___________________<br/>Date: [DATE]</p>
        </div>
      </div>

      <div class="clause-title mt">WITNESS:</div>
      <div style="display:flex;justify-content:space-between;margin-top:12px;">
        <div style="width:45%;font-size:10px;">1. Name: ___________________<br/>Address: ___________________<br/>Signature: ___________________</div>
        <div style="width:45%;font-size:10px;">2. Name: ___________________<br/>Address: ___________________<br/>Signature: ___________________</div>
      </div>
      ${footer}</body>`,
  }

  // Build the input form that appears first
  const titles: Record<string, string> = { acknowledgement: 'Acknowledgement Letter', allotment: 'Allotment Letter', certificate: 'Debenture Certificate', agreement: 'Debenture Agreement' }
  const inputForm = `
    <div id="inputForm" style="max-width:600px;margin:60px auto 20px;padding:28px;background:#fff;border:1px solid #ddd;border-radius:12px;font-family:Arial,sans-serif;">
      <h2 style="margin:0 0 4px;color:#2d6a2e;font-size:20px;">${titles[type]}</h2>
      <p style="color:#888;font-size:12px;margin:0 0 20px;">Fill in the details below and click Generate</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Full Name *</label><input id="f_name" value="${clientName}" style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;"/></div>
        <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Email</label><input id="f_email" value="${clientEmail}" style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;"/></div>
        <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Phone</label><input id="f_phone" value="" placeholder="+91 98765 43210" style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;"/></div>
        <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Date</label><input id="f_date" value="${dateStr}" style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;"/></div>
        <div style="grid-column:1/-1;"><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Address</label><textarea id="f_address" rows="2" placeholder="Full address..." style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;resize:vertical;"></textarea></div>
        <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Investment Amount (&#8377;)</label><input id="f_amount" type="number" value="${amount}" style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;"/></div>
        <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Tenure</label><input id="f_tenure" value="${tenure}" style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;"/></div>
        <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Reference No</label><input id="f_ref" value="${refNo}" style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;"/></div>
        <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Folio No</label><input id="f_folio" value="${folioNo}" style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;"/></div>
        <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Interest Rate</label><input id="f_rate" value="1% per month" style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;"/></div>
        <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Fund Type</label><input id="f_fund" value="${fund}" style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;"/></div>
      </div>
      <div style="margin-top:20px;text-align:right;">
        <button onclick="window.close()" style="padding:10px 20px;border:1px solid #ccc;border-radius:6px;background:#fff;color:#666;cursor:pointer;margin-right:8px;font-size:13px;">Cancel</button>
        <button onclick="generateDoc()" style="padding:10px 24px;border:none;border-radius:6px;background:#2d6a2e;color:#fff;cursor:pointer;font-weight:600;font-size:13px;">Generate &amp; Print</button>
      </div>
    </div>`

  // Build the full page with form + hidden document
  const fullPage = `<!DOCTYPE html><html><head><title>${titles[type]} - GHL India Ventures</title>${css}
  <style>#docContent{display:none;max-width:210mm;margin:0 auto;background:#fff;padding:20mm;box-shadow:0 2px 20px rgba(0,0,0,0.1);}@media print{#docContent{max-width:none;padding:0;box-shadow:none;}}</style>
  </head><body style="background:#f5f5f5;margin:0;padding:20px 0;">
  ${inputForm}
  <div id="docContent">${templates[type].replace(css, '').replace(/\$\{toolbar\}/g, '')}</div>
  <script>
  ${numberToWordsJS}
  function generateDoc(){
    var n=document.getElementById('f_name').value;
    var em=document.getElementById('f_email').value;
    var ph=document.getElementById('f_phone').value;
    var dt=document.getElementById('f_date').value;
    var addr=document.getElementById('f_address').value;
    var amt=parseInt(document.getElementById('f_amount').value)||0;
    var tn=document.getElementById('f_tenure').value;
    var ref=document.getElementById('f_ref').value;
    var fol=document.getElementById('f_folio').value;
    var rate=document.getElementById('f_rate').value;
    var fund=document.getElementById('f_fund').value;
    var numDeb=Math.floor(amt/10);
    var amtW=numberToWords(amt);
    var doc=document.getElementById('docContent');
    var html=doc.innerHTML;
    html=html.replace(/\\[NAME\\]/g,n).replace(/\\[EMAIL\\]/g,em).replace(/\\[PHONE\\]/g,ph).replace(/\\[DATE\\]/g,dt).replace(/\\[ADDRESS\\]/g,addr).replace(/\\[AMOUNT\\]/g,amt.toLocaleString('en-IN')).replace(/\\[AMOUNT_WORDS\\]/g,amtW).replace(/\\[TENURE\\]/g,tn).replace(/\\[REF\\]/g,ref).replace(/\\[FOLIO\\]/g,fol).replace(/\\[RATE\\]/g,rate).replace(/\\[FUND\\]/g,fund).replace(/\\[NUM_DEB\\]/g,numDeb.toLocaleString('en-IN')).replace(/\\[NUM_DEB_RAW\\]/g,numDeb.toString()).replace(/\\[CERT_NO\\]/g,ref.split('/')[1]||'001');
    document.getElementById('inputForm').style.display='none';
    doc.style.display='block';
    doc.innerHTML=html;
    document.body.style.background='#f5f5f5';
    document.body.style.paddingTop='20px';
    setTimeout(function(){window.print();},400);
  }
  <\/script></body></html>`

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
  rejected: { label: 'Rejected', variant: 'error' },
  completed: { label: 'Completed', variant: 'purple' },
}

function InvestmentsTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<any | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const data = await fetchAllInvestmentApplications()
    setApplications(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const totalAUM = useMemo(() => applications.filter(a => a.status === 'approved' || a.status === 'completed').reduce((s, a) => s + (Number(a.investment_amount) || 0), 0), [applications])
  const pendingCount = useMemo(() => applications.filter(a => a.status === 'pending' || a.status === 'under_review').length, [applications])
  const approvedCount = useMemo(() => applications.filter(a => a.status === 'approved' || a.status === 'completed').length, [applications])

  const columns: Column<any>[] = [
    { key: 'client', label: 'Client', render: (row) => <span className="text-white font-medium">{row._client?.full_name || row._client?.email || '—'}</span> },
    { key: 'fund_vehicle', label: 'Fund / Vehicle', render: (row) => <span className="text-gray-300 text-xs">{row.fund_vehicle || '—'}</span> },
    { key: 'investment_amount', label: 'Amount', sortable: true, render: (row) => <span className="text-white font-semibold">{formatINR(row.investment_amount)}</span> },
    { key: 'tenure_preference', label: 'Tenure', render: (row) => <span className="text-gray-400 text-xs">{row.tenure_preference || '—'}</span> },
    { key: 'status', label: 'Status', render: (row) => {
      const s = INV_STATUS_MAP[row.status] || { label: row.status, variant: 'info' as const }
      return <AdminBadge label={s.label} variant={s.variant} size="sm" dot />
    }},
    { key: 'created_at', label: 'Date', sortable: true, render: (row) => <span className="text-gray-500 text-xs">{formatDate(row.created_at)}</span> },
    { key: 'actions', label: '', width: '48px', render: (row) => (
      <button onClick={() => { setSelectedApp(row); setDetailOpen(true) }} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors">
        <Eye className="w-3.5 h-3.5" />
      </button>
    )},
  ]

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedApp) return
    setUpdating(true)
    try {
      const { updateRow } = await import('@/lib/supabase/adminDataService')
      const result = await updateRow('investment_applications', selectedApp.id, {
        status: newStatus,
        reviewed_at: new Date().toISOString(),
      })
      if (result) {
        showToast(`Application ${newStatus}`, 'success')
        setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status: newStatus } : a))
        setDetailOpen(false)
        setSelectedApp(null)
      } else { showToast('Failed to update', 'error') }
    } catch (_e) { showToast('Error updating application', 'error') }
    finally { setUpdating(false) }
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
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">All Investment Applications</h3>
          <button onClick={loadData} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-brand-red animate-spin" /></div>
        ) : applications.length === 0 ? (
          <AdminEmptyState icon={BarChart3} title="No investment applications" description="Investment applications from clients will appear here." />
        ) : (
          <AdminDataTable columns={columns} data={applications} onRowClick={(row) => { setSelectedApp(row); setDetailOpen(true) }} />
        )}
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
          </>
        }>
          <div className="space-y-5">
            {/* Application Details */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Client', val: selectedApp._client?.full_name || '—' },
                { label: 'Email', val: selectedApp._client?.email || '—' },
                { label: 'Fund / Vehicle', val: selectedApp.fund_vehicle || '—' },
                { label: 'Amount', val: formatINR(selectedApp.investment_amount) },
                { label: 'Tenure', val: selectedApp.tenure_preference || '—' },
                { label: 'Status', val: (INV_STATUS_MAP[selectedApp.status] || { label: selectedApp.status }).label },
                { label: 'Applied On', val: formatDate(selectedApp.created_at) },
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

            {/* Document Generation */}
            <div className="border-t border-white/[0.06] pt-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Generate Documents</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'acknowledgement' as const, label: 'Acknowledgement Letter' },
                  { type: 'allotment' as const, label: 'Allotment Letter' },
                  { type: 'certificate' as const, label: 'Debenture Certificate' },
                  { type: 'agreement' as const, label: 'Debenture Agreement' },
                ].map(doc => (
                  <button
                    key={doc.type}
                    onClick={() => {
                      generateInvestmentDocument(doc.type, selectedApp)
                      showToast(`Generating ${doc.label}...`, 'info')
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-300 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-brand-red" />
                    {doc.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-600 mt-2">Documents open in a new window for printing to PDF. Please allow popups if prompted.</p>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  )
}
