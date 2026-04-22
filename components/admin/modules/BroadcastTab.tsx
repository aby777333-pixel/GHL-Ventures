'use client'

/* ================================================================
   BROADCAST TAB — Content & Support → Broadcast

   Three views:
     1. Leads         — CRUD + CSV import (name, mobile, email, location, remarks)
     2. Compose       — pick recipients + channel + content, hit Send
     3. History       — past campaigns + per-recipient delivery status

   Sends via /.netlify/functions/broadcast-send which orchestrates
   Resend (email) + Wati (WhatsApp) and writes audit rows into
   broadcast_campaigns / broadcast_deliveries.
   ================================================================ */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Users as UsersIcon, Plus, Upload, Edit, Trash2, Send,
  FileSpreadsheet, Mail, MessageCircle, CheckCircle2, XCircle,
  Loader2, Radio, Image as ImageIcon, Video, FileText as FileTextIcon,
  Link2, Newspaper, Download, AlertCircle, Filter,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminKPICard from '../shared/AdminKPICard'
import AdminModal from '../shared/AdminModal'
import AdminEmptyState from '../shared/AdminEmptyState'
import { supabase as _supabase, isSupabaseConfigured } from '@/lib/supabase/client'
const supabase = _supabase as any

// ── Netlify function host (same pattern as other admin tabs) ──────
const NETLIFY_FUNCTIONS_HOST = 'https://ghl-india-ventures-2025.netlify.app'
function getFunctionBase(): string {
  if (typeof window === 'undefined') return ''
  const origin = window.location.origin
  if (origin.includes('localhost')) return 'http://localhost:8888'
  if (origin.endsWith('.netlify.app')) return origin
  return NETLIFY_FUNCTIONS_HOST
}

// ── Types ─────────────────────────────────────────────────────────
interface BroadcastLead {
  id: string
  name: string
  email: string | null
  mobile: string | null
  phone: string | null
  location: string | null
  remarks: string | null
  source: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

interface BroadcastCampaign {
  id: string
  name: string
  subject: string | null
  body: string
  content_type: 'text' | 'image' | 'video' | 'pdf' | 'link' | 'blog' | 'html'
  attachment_url: string | null
  channel: 'email' | 'whatsapp' | 'both'
  status: 'draft' | 'sending' | 'sent' | 'partial' | 'failed'
  recipient_count: number
  sent_count: number
  failed_count: number
  created_at: string
  sent_at: string | null
}

interface BroadcastDelivery {
  id: string
  campaign_id: string
  lead_id: string | null
  recipient_name: string | null
  email: string | null
  mobile: string | null
  channel: 'email' | 'whatsapp'
  status: 'pending' | 'sent' | 'failed' | 'skipped'
  error: string | null
  sent_at: string | null
}

// ── Props ─────────────────────────────────────────────────────────
interface BroadcastTabProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

const VIEWS = [
  { id: 'leads',   label: 'Leads',   icon: UsersIcon },
  { id: 'compose', label: 'Compose', icon: Send },
  { id: 'history', label: 'History', icon: Radio },
] as const
type ViewId = typeof VIEWS[number]['id']

const CONTENT_TYPE_OPTIONS: { id: BroadcastCampaign['content_type']; label: string; icon: any }[] = [
  { id: 'text',  label: 'Plain Text',    icon: FileTextIcon },
  { id: 'html',  label: 'Rich HTML',     icon: FileTextIcon },
  { id: 'image', label: 'Image',         icon: ImageIcon },
  { id: 'video', label: 'Video Link',    icon: Video },
  { id: 'pdf',   label: 'PDF Link',      icon: FileTextIcon },
  { id: 'link',  label: 'External Link', icon: Link2 },
  { id: 'blog',  label: 'Blog / Article',icon: Newspaper },
]

const CHANNEL_OPTIONS: { id: BroadcastCampaign['channel']; label: string }[] = [
  { id: 'both',     label: 'Email + WhatsApp' },
  { id: 'email',    label: 'Email Only' },
  { id: 'whatsapp', label: 'WhatsApp Only' },
]

// Parse a CSV file into { name, email, mobile, phone, location, remarks } rows.
// Accepts common header aliases (case-insensitive). Robust against quoted fields
// with embedded commas — uses a small state-machine parser rather than split(',').
function parseCSV(text: string): Array<Record<string, string>> {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') { inQuotes = false }
      else { field += c }
    } else {
      if (c === '"') { inQuotes = true }
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else if (c === '\r') { /* skip — handled by \n */ }
      else { field += c }
    }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row) }
  if (rows.length === 0) return []

  const header = rows[0].map(h => h.trim().toLowerCase())
  const aliasMap: Record<string, string> = {
    name: 'name', 'full name': 'name', fullname: 'name',
    email: 'email', 'email address': 'email',
    mobile: 'mobile', whatsapp: 'mobile', 'mobile number': 'mobile', 'whatsapp number': 'mobile', cell: 'mobile',
    phone: 'phone', telephone: 'phone',
    location: 'location', city: 'location', place: 'location',
    remarks: 'remarks', notes: 'remarks', comment: 'remarks', comments: 'remarks',
  }
  const cols = header.map(h => aliasMap[h] || '')

  const out: Array<Record<string, string>> = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (r.every(v => v.trim() === '')) continue
    const obj: Record<string, string> = {}
    for (let j = 0; j < cols.length; j++) {
      const key = cols[j]
      if (!key) continue
      obj[key] = (r[j] || '').trim()
    }
    if ((obj.name || obj.email || obj.mobile)) out.push(obj)
  }
  return out
}

export default function BroadcastTab({ showToast }: BroadcastTabProps) {
  const [view, setView] = useState<ViewId>('leads')
  const [leads, setLeads] = useState<BroadcastLead[]>([])
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([])
  const [loading, setLoading] = useState(false)

  // ── Leads CRUD state ────────────────────────────────────────────
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<BroadcastLead | null>(null)
  const [leadForm, setLeadForm] = useState({
    name: '', email: '', mobile: '', phone: '', location: '', remarks: '', tags: '',
  })
  const [savingLead, setSavingLead] = useState(false)
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null)

  // CSV upload
  const [csvUploading, setCsvUploading] = useState(false)
  const [csvPreview, setCsvPreview] = useState<Array<Record<string, string>> | null>(null)

  // ── Compose state ───────────────────────────────────────────────
  const [composeName, setComposeName] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [composeContentType, setComposeContentType] = useState<BroadcastCampaign['content_type']>('text')
  const [composeAttachment, setComposeAttachment] = useState('')
  const [composeChannel, setComposeChannel] = useState<BroadcastCampaign['channel']>('both')
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
  const [filterLocation, setFilterLocation] = useState('')
  const [sending, setSending] = useState(false)

  // ── History state ───────────────────────────────────────────────
  const [openCampaign, setOpenCampaign] = useState<BroadcastCampaign | null>(null)
  const [campaignDeliveries, setCampaignDeliveries] = useState<BroadcastDelivery[]>([])
  const [loadingDeliveries, setLoadingDeliveries] = useState(false)

  // ── Fetchers ────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    const { data, error } = await supabase.from('broadcast_leads')
      .select('*').order('created_at', { ascending: false })
    if (error) { showToast(`Failed to load leads: ${error.message}`, 'error'); return }
    setLeads((data || []) as BroadcastLead[])
  }, [showToast])

  const fetchCampaigns = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    const { data, error } = await supabase.from('broadcast_campaigns')
      .select('*').order('created_at', { ascending: false }).limit(100)
    if (error) { showToast(`Failed to load campaigns: ${error.message}`, 'error'); return }
    setCampaigns((data || []) as BroadcastCampaign[])
  }, [showToast])

  const fetchDeliveries = useCallback(async (campaignId: string) => {
    if (!isSupabaseConfigured()) return
    setLoadingDeliveries(true)
    const { data, error } = await supabase.from('broadcast_deliveries')
      .select('*').eq('campaign_id', campaignId).order('created_at', { ascending: true })
    setLoadingDeliveries(false)
    if (error) { showToast(`Failed to load deliveries: ${error.message}`, 'error'); return }
    setCampaignDeliveries((data || []) as BroadcastDelivery[])
  }, [showToast])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchLeads(), fetchCampaigns()]).finally(() => setLoading(false))
  }, [fetchLeads, fetchCampaigns])

  useEffect(() => {
    if (openCampaign) fetchDeliveries(openCampaign.id)
  }, [openCampaign, fetchDeliveries])

  // ── Lead CRUD ────────────────────────────────────────────────────
  const openLeadEditor = (lead?: BroadcastLead) => {
    if (lead) {
      setEditingLead(lead)
      setLeadForm({
        name: lead.name || '',
        email: lead.email || '',
        mobile: lead.mobile || '',
        phone: lead.phone || '',
        location: lead.location || '',
        remarks: lead.remarks || '',
        tags: (lead.tags || []).join(', '),
      })
    } else {
      setEditingLead(null)
      setLeadForm({ name: '', email: '', mobile: '', phone: '', location: '', remarks: '', tags: '' })
    }
    setLeadModalOpen(true)
  }

  const saveLead = async () => {
    if (!leadForm.name.trim()) { showToast('Name is required', 'error'); return }
    if (!leadForm.email.trim() && !leadForm.mobile.trim()) {
      showToast('Either email or mobile is required', 'error'); return
    }
    if (!isSupabaseConfigured()) { showToast('Database not configured', 'error'); return }

    const tags = leadForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    const payload = {
      name: leadForm.name.trim(),
      email: leadForm.email.trim() || null,
      mobile: leadForm.mobile.trim() || null,
      phone: leadForm.phone.trim() || null,
      location: leadForm.location.trim() || null,
      remarks: leadForm.remarks.trim() || null,
      tags,
    }

    setSavingLead(true)
    try {
      if (editingLead) {
        const { error } = await supabase.from('broadcast_leads').update(payload).eq('id', editingLead.id)
        if (error) throw error
        showToast('Lead updated', 'success')
      } else {
        const { error } = await supabase.from('broadcast_leads').insert({ ...payload, source: 'manual' })
        if (error) throw error
        showToast('Lead added', 'success')
      }
      setLeadModalOpen(false)
      fetchLeads()
    } catch (err: any) {
      showToast(err?.message || 'Failed to save lead', 'error')
    } finally {
      setSavingLead(false)
    }
  }

  const deleteLead = async () => {
    if (!deleteLeadId) return
    if (!isSupabaseConfigured()) { showToast('Database not configured', 'error'); return }
    const { error } = await supabase.from('broadcast_leads').delete().eq('id', deleteLeadId)
    if (error) { showToast(`Delete failed: ${error.message}`, 'error'); return }
    showToast('Lead deleted', 'success')
    setDeleteLeadId(null)
    fetchLeads()
  }

  // ── CSV upload ───────────────────────────────────────────────────
  const handleCSVFile = async (file: File) => {
    if (!file.name.match(/\.csv$/i)) { showToast('Please pick a .csv file', 'error'); return }
    if (file.size > 5 * 1024 * 1024) { showToast('CSV must be under 5 MB', 'error'); return }
    const text = await file.text()
    const rows = parseCSV(text)
    if (rows.length === 0) { showToast('No valid rows found in CSV', 'warning'); return }
    setCsvPreview(rows)
  }

  const commitCSVImport = async () => {
    if (!csvPreview || csvPreview.length === 0) return
    if (!isSupabaseConfigured()) { showToast('Database not configured', 'error'); return }
    setCsvUploading(true)
    try {
      const payload = csvPreview.map(r => ({
        name: (r.name || '').trim() || (r.email || r.mobile || 'Unnamed').trim(),
        email: r.email?.trim() || null,
        mobile: r.mobile?.trim() || null,
        phone: r.phone?.trim() || null,
        location: r.location?.trim() || null,
        remarks: r.remarks?.trim() || null,
        source: 'csv',
      }))
      // Supabase has a ~1000-row per-insert limit in practice; chunk to 500.
      const CHUNK = 500
      let inserted = 0
      for (let i = 0; i < payload.length; i += CHUNK) {
        const batch = payload.slice(i, i + CHUNK)
        const { error } = await supabase.from('broadcast_leads').insert(batch)
        if (error) { showToast(`Import failed at batch ${i + 1}: ${error.message}`, 'error'); break }
        inserted += batch.length
      }
      showToast(`${inserted} lead(s) imported`, 'success')
      setCsvPreview(null)
      fetchLeads()
    } catch (err: any) {
      showToast(err?.message || 'CSV import failed', 'error')
    } finally {
      setCsvUploading(false)
    }
  }

  // ── Compose / Send ───────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    const loc = filterLocation.trim().toLowerCase()
    if (!loc) return leads
    return leads.filter(l => (l.location || '').toLowerCase().includes(loc))
  }, [leads, filterLocation])

  const toggleLead = (id: string) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectAllFiltered = () => setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)))
  const clearSelection = () => setSelectedLeadIds(new Set())

  const sendBroadcast = async () => {
    if (!composeName.trim()) { showToast('Campaign name is required', 'error'); return }
    if (!composeBody.trim()) { showToast('Message body is required', 'error'); return }
    if ((composeChannel === 'email' || composeChannel === 'both') && !composeSubject.trim()) {
      showToast('Email subject is required', 'error'); return
    }
    if (selectedLeadIds.size === 0) { showToast('Select at least one recipient', 'error'); return }

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const res = await fetch(`${getFunctionBase()}/.netlify/functions/broadcast-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: composeName.trim(),
          subject: composeSubject.trim() || composeName.trim(),
          body: composeBody.trim(),
          content_type: composeContentType,
          attachment_url: composeAttachment.trim() || undefined,
          channel: composeChannel,
          lead_ids: Array.from(selectedLeadIds),
          created_by: user?.id || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) {
        showToast(`Broadcast sent — ${data.sent}/${data.total_deliveries} delivered`,
          data.failed > 0 ? 'warning' : 'success')
        // Reset compose
        setComposeName(''); setComposeSubject(''); setComposeBody('')
        setComposeAttachment(''); setComposeContentType('text')
        clearSelection()
        fetchCampaigns()
        setView('history')
      } else {
        showToast(data?.error || `Broadcast failed (HTTP ${res.status})`, 'error')
      }
    } catch (err: any) {
      showToast(err?.message || 'Network error', 'error')
    } finally {
      setSending(false)
    }
  }

  // ── KPIs ─────────────────────────────────────────────────────────
  const kpiTotalLeads = leads.length
  const kpiWithEmail = leads.filter(l => l.email).length
  const kpiWithMobile = leads.filter(l => l.mobile).length
  const kpiRecentCampaigns = campaigns.filter(c => {
    const d = new Date(c.created_at).getTime()
    return Date.now() - d < 7 * 24 * 60 * 60 * 1000
  }).length

  // ── Column defs ─────────────────────────────────────────────────
  const leadColumns: Column<BroadcastLead>[] = [
    {
      key: 'name', label: 'Name', sortable: true, render: (r) => (
        <div className="max-w-[220px]">
          <p className="text-sm text-white font-medium truncate">{r.name}</p>
          {r.remarks && <p className="text-[11px] text-gray-500 truncate">{r.remarks}</p>}
        </div>
      ),
    },
    {
      key: 'email', label: 'Email', sortable: true, render: (r) => (
        <span className="text-xs text-gray-300">{r.email || <span className="text-gray-600">—</span>}</span>
      ),
    },
    {
      key: 'mobile', label: 'Mobile', sortable: true, render: (r) => (
        <span className="text-xs text-gray-300">{r.mobile || <span className="text-gray-600">—</span>}</span>
      ),
    },
    {
      key: 'location', label: 'Location', sortable: true, render: (r) => (
        <span className="text-xs text-gray-300">{r.location || <span className="text-gray-600">—</span>}</span>
      ),
    },
    {
      key: 'source', label: 'Source', sortable: true, render: (r) => (
        <AdminBadge label={r.source || 'manual'} variant={r.source === 'csv' ? 'purple' : 'neutral'} />
      ),
    },
    {
      key: 'actions', label: '', width: '120px', render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openLeadEditor(r) }}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"
            title="Edit"
          ><Edit className="w-3.5 h-3.5" /></button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteLeadId(r.id) }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
            title="Delete"
          ><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ]

  const campaignColumns: Column<BroadcastCampaign>[] = [
    {
      key: 'name', label: 'Campaign', sortable: true, render: (r) => (
        <div className="max-w-[260px]">
          <p className="text-sm text-white font-medium truncate">{r.name}</p>
          <p className="text-[11px] text-gray-500 truncate">{r.subject || r.body.slice(0, 60)}</p>
        </div>
      ),
    },
    {
      key: 'channel', label: 'Channel', sortable: true, render: (r) => (
        <div className="flex items-center gap-1.5">
          {(r.channel === 'email' || r.channel === 'both') && <Mail className="w-3.5 h-3.5 text-blue-400" />}
          {(r.channel === 'whatsapp' || r.channel === 'both') && <MessageCircle className="w-3.5 h-3.5 text-green-400" />}
          <span className="text-xs text-gray-300 capitalize">{r.channel}</span>
        </div>
      ),
    },
    {
      key: 'content_type', label: 'Type', sortable: true, render: (r) => (
        <span className="text-xs text-gray-400 capitalize">{r.content_type}</span>
      ),
    },
    {
      key: 'recipient_count', label: 'Recipients', sortable: true, render: (r) => (
        <span className="text-xs text-gray-300">
          <span className="text-green-400">{r.sent_count}</span> / {r.recipient_count}
          {r.failed_count > 0 && <span className="text-red-400 ml-1">({r.failed_count} failed)</span>}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status', sortable: true, render: (r) => {
        const variant = r.status === 'sent' ? 'success'
          : r.status === 'partial' ? 'warning'
          : r.status === 'failed' ? 'error'
          : r.status === 'sending' ? 'info'
          : 'neutral'
        return <AdminBadge label={r.status} variant={variant as any} dot />
      },
    },
    {
      key: 'created_at', label: 'Sent', sortable: true, render: (r) => (
        <span className="text-xs text-gray-400">{new Date(r.sent_at || r.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
      ),
    },
    {
      key: 'actions', label: '', width: '60px', render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); setOpenCampaign(r) }}
          className="text-[11px] px-2 py-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >Details</button>
      ),
    },
  ]

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Total Leads" value={kpiTotalLeads} icon={UsersIcon} color="#3B82F6" />
        <AdminKPICard title="With Email" value={kpiWithEmail} icon={Mail} color="#10B981" />
        <AdminKPICard title="With WhatsApp" value={kpiWithMobile} icon={MessageCircle} color="#22C55E" />
        <AdminKPICard title="Campaigns (7d)" value={kpiRecentCampaigns} icon={Radio} color="#D0021B" />
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {VIEWS.map(v => {
          const Icon = v.icon
          const isActive = view === v.id
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-red/20 text-brand-red border border-brand-red/30'
                  : 'text-gray-500 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {v.label}
            </button>
          )
        })}
      </div>

      {/* ── Leads View ──────────────────────────────────────────── */}
      {view === 'leads' && (
        <AdminGlass>
          {leads.length === 0 && !loading ? (
            <AdminEmptyState
              icon={UsersIcon}
              title="No broadcast leads yet"
              description="Add leads manually or import them from a CSV file to start broadcasting."
              action={{ label: 'Add Your First Lead', onClick: () => openLeadEditor() }}
            />
          ) : (
            <AdminDataTable
              columns={leadColumns}
              data={leads}
              searchable
              searchPlaceholder="Search leads by name, email, mobile, location…"
              searchKeys={['name', 'email', 'mobile', 'location', 'remarks']}
              title="Broadcast Leads"
              pageSize={20}
              exportable
              actions={
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Import CSV
                    <input
                      type="file" accept=".csv,text/csv" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSVFile(f); e.currentTarget.value = '' }}
                    />
                  </label>
                  <button
                    onClick={() => openLeadEditor()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-red/20 text-brand-red border border-brand-red/30 hover:bg-brand-red/30 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Lead
                  </button>
                </div>
              }
            />
          )}
        </AdminGlass>
      )}

      {/* ── Compose View ───────────────────────────────────────── */}
      {view === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message pane */}
          <AdminGlass>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Broadcast Message</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Compose the content and pick a channel.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Campaign Name *</label>
                <input
                  value={composeName} onChange={(e) => setComposeName(e.target.value)}
                  placeholder="Internal label (e.g. April Launch)"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Channel *</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {CHANNEL_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setComposeChannel(opt.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        composeChannel === opt.id
                          ? 'bg-brand-red/20 text-brand-red border border-brand-red/30'
                          : 'text-gray-400 bg-white/[0.04] border border-white/[0.06] hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Content Type</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {CONTENT_TYPE_OPTIONS.map(opt => {
                    const Icon = opt.icon
                    const active = composeContentType === opt.id
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setComposeContentType(opt.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          active
                            ? 'bg-brand-red/20 text-brand-red border border-brand-red/30'
                            : 'text-gray-400 bg-white/[0.04] border border-white/[0.06] hover:text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" /> {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {(composeContentType !== 'text' && composeContentType !== 'html') && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    {composeContentType === 'image' ? 'Image URL' :
                     composeContentType === 'video' ? 'Video URL' :
                     composeContentType === 'pdf' ? 'PDF URL' :
                     composeContentType === 'blog' ? 'Blog URL' : 'Link URL'}
                  </label>
                  <input
                    value={composeAttachment} onChange={(e) => setComposeAttachment(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
                  />
                </div>
              )}

              {(composeChannel === 'email' || composeChannel === 'both') && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Subject *</label>
                  <input
                    value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Subject line shown in inbox"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Message Body * <span className="text-gray-600 font-normal">({composeContentType === 'html' ? 'raw HTML allowed' : 'plain text — line breaks preserved'})</span>
                </label>
                <textarea
                  value={composeBody} onChange={(e) => setComposeBody(e.target.value)}
                  rows={10} placeholder="Hi {name}, we wanted to share…"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 resize-none font-mono"
                />
                <p className="text-[10px] text-gray-600 mt-1">
                  Emails go via Resend from noreply@ghlindiaventures.com. WhatsApp goes via Wati —
                  delivery to contacts outside the 24-hour session window requires a pre-approved
                  Wati template (set <code>WATI_TEMPLATE_NAME</code> in Netlify env vars).
                </p>
              </div>

              <button
                onClick={sendBroadcast}
                disabled={sending || selectedLeadIds.size === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-red hover:bg-red-600 disabled:bg-red-900 disabled:text-gray-500 text-white text-sm font-semibold transition-colors disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending…' : `Send to ${selectedLeadIds.size} recipient${selectedLeadIds.size === 1 ? '' : 's'}`}
              </button>
            </div>
          </AdminGlass>

          {/* Recipients pane */}
          <AdminGlass>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Recipients</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">{selectedLeadIds.size} selected · {filteredLeads.length} shown · {leads.length} total</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={selectAllFiltered} className="text-[11px] px-2 py-1 rounded-lg text-gray-300 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors">Select all</button>
                  <button onClick={clearSelection} className="text-[11px] px-2 py-1 rounded-lg text-gray-300 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors">Clear</button>
                </div>
              </div>

              <div className="relative">
                <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}
                  placeholder="Filter by location…"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40"
                />
              </div>

              <div className="max-h-[520px] overflow-y-auto border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
                {filteredLeads.length === 0 && (
                  <div className="p-6 text-center text-xs text-gray-500">
                    {leads.length === 0 ? 'No leads yet — add some first.' : 'No leads match this filter.'}
                  </div>
                )}
                {filteredLeads.map(l => {
                  const selected = selectedLeadIds.has(l.id)
                  return (
                    <label
                      key={l.id}
                      className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors ${selected ? 'bg-brand-red/10' : 'hover:bg-white/[0.03]'}`}
                    >
                      <input
                        type="checkbox" checked={selected} onChange={() => toggleLead(l.id)}
                        className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-red-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{l.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {[l.email, l.mobile, l.location].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </AdminGlass>
        </div>
      )}

      {/* ── History View ───────────────────────────────────────── */}
      {view === 'history' && (
        <AdminGlass>
          {campaigns.length === 0 && !loading ? (
            <AdminEmptyState
              icon={Radio}
              title="No campaigns yet"
              description="Your sent broadcasts will appear here with delivery stats."
            />
          ) : (
            <AdminDataTable
              columns={campaignColumns}
              data={campaigns}
              searchable
              searchPlaceholder="Search campaigns…"
              searchKeys={['name', 'subject', 'body']}
              title="Campaign History"
              pageSize={15}
            />
          )}
        </AdminGlass>
      )}

      {/* ── Lead Editor Modal ──────────────────────────────────── */}
      <AdminModal
        isOpen={leadModalOpen} onClose={() => setLeadModalOpen(false)}
        title={editingLead ? 'Edit Lead' : 'Add Lead'}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setLeadModalOpen(false)} disabled={savingLead}
              className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50">Cancel</button>
            <button onClick={saveLead} disabled={savingLead}
              className="px-5 py-2 rounded-xl text-sm text-white bg-brand-red hover:bg-red-600 transition-colors disabled:opacity-50">
              {savingLead ? 'Saving…' : 'Save Lead'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Name *</label>
            <input value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
            <input type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Mobile (WhatsApp) </label>
            <input type="tel" value={leadForm.mobile} onChange={(e) => setLeadForm({ ...leadForm, mobile: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone (landline)</label>
            <input type="tel" value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Location</label>
            <input value={leadForm.location} onChange={(e) => setLeadForm({ ...leadForm, location: e.target.value })}
              placeholder="City / State"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Remarks</label>
            <textarea value={leadForm.remarks} onChange={(e) => setLeadForm({ ...leadForm, remarks: e.target.value })}
              rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tags (comma separated)</label>
            <input value={leadForm.tags} onChange={(e) => setLeadForm({ ...leadForm, tags: e.target.value })}
              placeholder="e.g. investor, nri, aif-interested"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
        </div>
      </AdminModal>

      {/* ── Delete Lead Confirm ──────────────────────────────── */}
      <AdminModal
        isOpen={!!deleteLeadId} onClose={() => setDeleteLeadId(null)}
        title="Delete lead?" maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteLeadId(null)}
              className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">Cancel</button>
            <button onClick={deleteLead}
              className="px-5 py-2 rounded-xl text-sm text-white bg-red-600 hover:bg-red-700 transition-colors">Delete</button>
          </div>
        }
      >
        <p className="text-sm text-gray-300">This will remove the lead from your broadcast list. Past campaign delivery records are preserved.</p>
      </AdminModal>

      {/* ── CSV Preview Modal ──────────────────────────────────── */}
      <AdminModal
        isOpen={!!csvPreview} onClose={() => setCsvPreview(null)}
        title="Import CSV" subtitle={csvPreview ? `${csvPreview.length} row(s) detected` : undefined}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-between items-center gap-3">
            <p className="text-[11px] text-gray-500">
              Recognised columns: <code>name</code>, <code>email</code>, <code>mobile</code>, <code>phone</code>, <code>location</code>, <code>remarks</code>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCsvPreview(null)} disabled={csvUploading}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={commitCSVImport} disabled={csvUploading || !csvPreview?.length}
                className="px-5 py-2 rounded-xl text-sm text-white bg-brand-red hover:bg-red-600 transition-colors disabled:opacity-50 inline-flex items-center gap-2">
                {csvUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {csvUploading ? 'Importing…' : `Import ${csvPreview?.length ?? 0} leads`}
              </button>
            </div>
          </div>
        }
      >
        {csvPreview && csvPreview.length > 0 && (
          <div className="space-y-3">
            <div className="overflow-x-auto border border-white/[0.06] rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-white/[0.04]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 uppercase tracking-wider">Mobile</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 uppercase tracking-wider">Location</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {csvPreview.slice(0, 10).map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-white">{r.name || '—'}</td>
                      <td className="px-3 py-2 text-gray-300">{r.email || '—'}</td>
                      <td className="px-3 py-2 text-gray-300">{r.mobile || '—'}</td>
                      <td className="px-3 py-2 text-gray-300">{r.location || '—'}</td>
                      <td className="px-3 py-2 text-gray-500 truncate max-w-[180px]">{r.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvPreview.length > 10 && (
              <p className="text-[11px] text-gray-500">…and {csvPreview.length - 10} more row(s). All will be imported.</p>
            )}
          </div>
        )}
      </AdminModal>

      {/* ── Campaign Detail Modal ──────────────────────────────── */}
      <AdminModal
        isOpen={!!openCampaign} onClose={() => setOpenCampaign(null)}
        title={openCampaign?.name || 'Campaign'}
        subtitle={openCampaign ? `${openCampaign.sent_count}/${openCampaign.recipient_count} delivered · ${openCampaign.failed_count} failed` : undefined}
        maxWidth="max-w-3xl"
      >
        {openCampaign && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Channel</p>
                <p className="text-sm text-white capitalize mt-0.5">{openCampaign.channel}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Type</p>
                <p className="text-sm text-white capitalize mt-0.5">{openCampaign.content_type}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Status</p>
                <p className="text-sm text-white capitalize mt-0.5">{openCampaign.status}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Sent</p>
                <p className="text-sm text-white mt-0.5">{new Date(openCampaign.sent_at || openCampaign.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            {openCampaign.subject && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Subject</p>
                <p className="text-sm text-white">{openCampaign.subject}</p>
              </div>
            )}

            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Body</p>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {openCampaign.body}
              </div>
              {openCampaign.attachment_url && (
                <a href={openCampaign.attachment_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs text-brand-red hover:underline">
                  <Download className="w-3 h-3" /> {openCampaign.attachment_url}
                </a>
              )}
            </div>

            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Deliveries {loadingDeliveries && <Loader2 className="w-3 h-3 inline animate-spin ml-1" />}
              </p>
              <div className="max-h-[260px] overflow-y-auto border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
                {campaignDeliveries.length === 0 && !loadingDeliveries && (
                  <p className="p-4 text-xs text-gray-500 text-center">No delivery records.</p>
                )}
                {campaignDeliveries.map(d => {
                  const Icon = d.status === 'sent' ? CheckCircle2
                    : d.status === 'failed' ? XCircle
                    : AlertCircle
                  const color = d.status === 'sent' ? 'text-green-400'
                    : d.status === 'failed' ? 'text-red-400'
                    : 'text-amber-400'
                  return (
                    <div key={d.id} className="flex items-start gap-2 p-2.5 text-xs">
                      <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate">{d.recipient_name || d.email || d.mobile || '—'}</p>
                        <p className="text-gray-500 text-[10px] truncate">
                          {d.channel} · {d.channel === 'email' ? (d.email || '—') : (d.mobile || '—')}
                          {d.error && <span className="text-red-400 ml-2">{d.error}</span>}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  )
}
