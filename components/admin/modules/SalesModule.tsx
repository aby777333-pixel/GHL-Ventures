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
  const amount = Number(app.investment_amount) || 0
  const amountWords = amount >= 10000000 ? `${(amount / 10000000).toFixed(2)} Crore` : amount >= 100000 ? `${(amount / 100000).toFixed(2)} Lakh` : amount.toLocaleString('en-IN')
  const fund = app.fund_vehicle || 'GHL India Ventures AIF'
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const refNo = `GHL/${(app.id || '').slice(0, 8).toUpperCase()}/${new Date().getFullYear()}`
  const tenure = app.tenure_preference || '5 Years'

  const letterhead = `
    <div style="text-align:center;border-bottom:3px solid #D0021B;padding-bottom:16px;margin-bottom:24px;">
      <h1 style="color:#D0021B;margin:0;font-size:28px;font-weight:800;letter-spacing:1px;">GHL INDIA VENTURES</h1>
      <p style="color:#666;margin:4px 0 0;font-size:11px;letter-spacing:2px;">SEBI Registered Category II AIF &bull; Reg: IN/AIF2/24-25/1517</p>
      <p style="color:#888;margin:2px 0 0;font-size:10px;">Queens Court, Egmore, Chennai 600008 &bull; +91 7200 255 252 &bull; info@ghlindiaventures.com</p>
    </div>`

  const footer = `
    <div style="margin-top:48px;border-top:1px solid #ddd;padding-top:16px;text-align:center;">
      <p style="color:#999;font-size:9px;margin:0;">GHL India Ventures Private Limited &bull; CIN: U67190TN2024PTC172000</p>
      <p style="color:#999;font-size:9px;margin:2px 0 0;">Queens Court, Egmore, Chennai 600008 &bull; www.ghlindiaventures.com</p>
    </div>`

  const css = `<style>@page{size:A4;margin:20mm;}body{font-family:Georgia,'Times New Roman',serif;color:#222;line-height:1.7;font-size:13px;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style>`

  const templates: Record<string, string> = {
    acknowledgement: `${css}<body>${letterhead}
      <p style="text-align:right;color:#666;font-size:12px;">Date: ${date}<br/>Ref: ${refNo}</p>
      <p>To,<br/><strong>${clientName}</strong></p>
      <h2 style="text-align:center;color:#D0021B;margin:24px 0;">ACKNOWLEDGEMENT LETTER</h2>
      <p>Dear <strong>${clientName}</strong>,</p>
      <p>We hereby acknowledge the receipt of your investment application for <strong>${fund}</strong> for an amount of <strong>₹${amount.toLocaleString('en-IN')}</strong> (Rupees ${amountWords} Only).</p>
      <p>Your application has been registered under reference number <strong>${refNo}</strong> and is currently under review by our investment committee.</p>
      <p>Upon successful verification and approval, we shall issue the relevant allotment letter and debenture certificate.</p>
      <p>Should you have any queries, please do not hesitate to contact your designated Relationship Manager or reach us at the details mentioned above.</p>
      <p style="margin-top:32px;">Warm Regards,</p>
      <p><strong>For GHL India Ventures Private Limited</strong><br/><br/><br/>Authorised Signatory</p>
      ${footer}</body>`,

    allotment: `${css}<body>${letterhead}
      <p style="text-align:right;color:#666;font-size:12px;">Date: ${date}<br/>Ref: ${refNo}/ALLOT</p>
      <p>To,<br/><strong>${clientName}</strong></p>
      <h2 style="text-align:center;color:#D0021B;margin:24px 0;">ALLOTMENT LETTER</h2>
      <p>Dear <strong>${clientName}</strong>,</p>
      <p>Pursuant to your investment application dated ${app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN') : date}, we are pleased to inform you that the Board of Directors has approved the allotment in your favour.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr style="border-bottom:1px solid #ddd;"><td style="padding:8px;color:#666;">Fund / Vehicle</td><td style="padding:8px;font-weight:600;">${fund}</td></tr>
        <tr style="border-bottom:1px solid #ddd;"><td style="padding:8px;color:#666;">Investment Amount</td><td style="padding:8px;font-weight:600;">₹${amount.toLocaleString('en-IN')}</td></tr>
        <tr style="border-bottom:1px solid #ddd;"><td style="padding:8px;color:#666;">Tenure</td><td style="padding:8px;font-weight:600;">${tenure}</td></tr>
        <tr style="border-bottom:1px solid #ddd;"><td style="padding:8px;color:#666;">Allotment Date</td><td style="padding:8px;font-weight:600;">${date}</td></tr>
        <tr><td style="padding:8px;color:#666;">Reference</td><td style="padding:8px;font-weight:600;">${refNo}</td></tr>
      </table>
      <p>Please find the Debenture Certificate enclosed herewith. Kindly sign and return the Debenture Agreement at your earliest convenience.</p>
      <p style="margin-top:32px;">For <strong>GHL India Ventures Private Limited</strong><br/><br/><br/>Authorised Signatory</p>
      ${footer}</body>`,

    certificate: `${css}<body>${letterhead}
      <h2 style="text-align:center;color:#D0021B;margin:24px 0;font-size:22px;">DEBENTURE CERTIFICATE</h2>
      <p style="text-align:center;color:#666;font-size:12px;">Certificate No: ${refNo}/DC</p>
      <div style="border:2px solid #D0021B;border-radius:8px;padding:24px;margin:24px 0;">
        <p>This is to certify that <strong>${clientName}</strong> is the registered holder of debentures of <strong>GHL India Ventures Private Limited</strong> as per the details below:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="border-bottom:1px solid #eee;"><td style="padding:10px;color:#666;width:40%;">Face Value</td><td style="padding:10px;font-weight:700;font-size:16px;">₹${amount.toLocaleString('en-IN')}</td></tr>
          <tr style="border-bottom:1px solid #eee;"><td style="padding:10px;color:#666;">Fund / Vehicle</td><td style="padding:10px;font-weight:600;">${fund}</td></tr>
          <tr style="border-bottom:1px solid #eee;"><td style="padding:10px;color:#666;">Tenure</td><td style="padding:10px;font-weight:600;">${tenure}</td></tr>
          <tr style="border-bottom:1px solid #eee;"><td style="padding:10px;color:#666;">Issue Date</td><td style="padding:10px;font-weight:600;">${date}</td></tr>
          <tr><td style="padding:10px;color:#666;">Certificate No</td><td style="padding:10px;font-weight:600;">${refNo}/DC</td></tr>
        </table>
      </div>
      <p>This certificate is issued subject to the terms and conditions of the Debenture Agreement.</p>
      <div style="display:flex;justify-content:space-between;margin-top:48px;">
        <div><p style="border-top:1px solid #333;padding-top:4px;font-size:11px;">Authorised Signatory</p></div>
        <div style="text-align:center;"><p style="font-size:10px;color:#999;">Company Seal</p></div>
        <div style="text-align:right;"><p style="border-top:1px solid #333;padding-top:4px;font-size:11px;">Director</p></div>
      </div>
      ${footer}</body>`,

    agreement: `${css}<body>${letterhead}
      <h2 style="text-align:center;color:#D0021B;margin:24px 0;">DEBENTURE AGREEMENT</h2>
      <p style="text-align:center;color:#666;font-size:12px;">Agreement Ref: ${refNo}/DA</p>
      <p>This Debenture Agreement ("Agreement") is entered into on this <strong>${date}</strong> between:</p>
      <p><strong>Party A (Issuer):</strong> GHL India Ventures Private Limited, a company incorporated under the Companies Act, 2013, having its registered office at Queens Court, Egmore, Chennai 600008, SEBI Reg: IN/AIF2/24-25/1517 (hereinafter referred to as "the Company").</p>
      <p><strong>Party B (Investor):</strong> <strong>${clientName}</strong> (hereinafter referred to as "the Debenture Holder").</p>
      <h3 style="color:#D0021B;margin-top:24px;">1. INVESTMENT DETAILS</h3>
      <table style="width:100%;border-collapse:collapse;margin:12px 0;">
        <tr style="border-bottom:1px solid #ddd;"><td style="padding:8px;color:#666;">Investment Amount</td><td style="padding:8px;font-weight:600;">₹${amount.toLocaleString('en-IN')}</td></tr>
        <tr style="border-bottom:1px solid #ddd;"><td style="padding:8px;color:#666;">Fund / Vehicle</td><td style="padding:8px;font-weight:600;">${fund}</td></tr>
        <tr><td style="padding:8px;color:#666;">Tenure</td><td style="padding:8px;font-weight:600;">${tenure}</td></tr>
      </table>
      <h3 style="color:#D0021B;">2. TERMS & CONDITIONS</h3>
      <p>2.1 The Company agrees to issue debentures to the Debenture Holder for the investment amount stated above.</p>
      <p>2.2 Interest shall be paid as per the agreed schedule and rate communicated at the time of investment.</p>
      <p>2.3 The principal amount shall be redeemed at the end of the tenure period unless renewed by mutual agreement.</p>
      <p>2.4 All investments are subject to market risks and the terms outlined in the Private Placement Memorandum (PPM).</p>
      <h3 style="color:#D0021B;">3. GOVERNING LAW</h3>
      <p>This Agreement shall be governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Chennai.</p>
      <div style="display:flex;justify-content:space-between;margin-top:48px;">
        <div><p style="margin-bottom:48px;">For <strong>GHL India Ventures Pvt Ltd</strong></p><p style="border-top:1px solid #333;padding-top:4px;font-size:11px;">Authorised Signatory</p></div>
        <div style="text-align:right;"><p style="margin-bottom:48px;"><strong>Debenture Holder</strong></p><p style="border-top:1px solid #333;padding-top:4px;font-size:11px;">${clientName}</p></div>
      </div>
      ${footer}</body>`,
  }

  const html = templates[type]
  if (!html) return
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 600)
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
