'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Building2, MapPin, Phone, Mail, Star, IndianRupee, TrendingUp,
  UserCheck, AlertCircle, Plus, Search, Filter, Eye, Edit3,
  Clock, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight,
  Globe, MessageSquare, FileText, ExternalLink, Tag, Users,
  BarChart3, Briefcase, Home, Factory, Layers, Upload,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import AdminGlass from '../shared/AdminGlass'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import {
  fetchRealtyBrokers, fetchBrokerInquiries,
} from '@/lib/supabase/adminDataService'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { formatINR } from '@/lib/admin/adminHooks'
import UploadWithFolderPicker from '@/components/shared/UploadWithFolderPicker'
import type { RealtyBroker, BrokerInquiry } from '@/lib/admin/adminTypes'

// ── Netlify function host (same pattern as CreateAccountTab) ───────
const NETLIFY_FUNCTIONS_HOST = 'https://ghl-india-ventures-2025.netlify.app'
function getFunctionBase(): string {
  if (typeof window === 'undefined') return ''
  const origin = window.location.origin
  if (origin.includes('localhost')) return 'http://localhost:8888'
  if (origin.endsWith('.netlify.app')) return origin
  return NETLIFY_FUNCTIONS_HOST
}

// ── Status Config ──────────────────────────────────────────────────
const BROKER_STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'neutral' },
  'pending-verification': { label: 'Pending', variant: 'warning' },
  suspended: { label: 'Suspended', variant: 'error' },
}

const INQUIRY_STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' }> = {
  new: { label: 'New', variant: 'info' },
  contacted: { label: 'Contacted', variant: 'warning' },
  'in-progress': { label: 'In Progress', variant: 'purple' },
  closed: { label: 'Closed', variant: 'neutral' },
  converted: { label: 'Converted', variant: 'success' },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: 'High', color: 'text-red-400' },
  medium: { label: 'Medium', color: 'text-amber-400' },
  low: { label: 'Low', color: 'text-gray-400' },
}

const SPECIALIZATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  residential: Home,
  commercial: Briefcase,
  land: MapPin,
  industrial: Factory,
  'mixed-use': Layers,
}

// ── Chart Data ─────────────────────────────────────────────────────
const DEAL_VALUE_BY_CITY: { city: string; value: number }[] = []

const SPECIALIZATION_DIST: { name: string; value: number; color: string }[] = []

const CHART_TOOLTIP_STYLE = {
  background: 'rgba(10,10,10,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  fontSize: '12px',
}

// ── Props ──────────────────────────────────────────────────────────
interface RealtyBrokersModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

// ── Sub-tab Components ─────────────────────────────────────────────
const SUB_TABS = [
  { id: null, label: 'Broker Directory' },
  { id: 'inquiries', label: 'Inquiries' },
  { id: 'analytics', label: 'Analytics' },
]

export default function RealtyBrokersModule({ subTab, navigate, showToast }: RealtyBrokersModuleProps) {
  const [brokers, setBrokers] = useState<RealtyBroker[]>([])
  const [inquiries, setInquiries] = useState<BrokerInquiry[]>([])

  const loadData = useCallback(async () => {
    const [b, i] = await Promise.all([fetchRealtyBrokers(), fetchBrokerInquiries()])
    setBrokers(b as RealtyBroker[])
    setInquiries(i as BrokerInquiry[])
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const [selectedBroker, setSelectedBroker] = useState<RealtyBroker | null>(null)
  const [selectedInquiry, setSelectedInquiry] = useState<BrokerInquiry | null>(null)
  const [addBrokerOpen, setAddBrokerOpen] = useState(false)
  const [folderPickerOpen, setFolderPickerOpen] = useState(false)
  const [editBroker, setEditBroker] = useState<RealtyBroker | null>(null)
  const [submittingEdit, setSubmittingEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', company: '', reraId: '',
    city: 'Chennai', specialization: 'residential',
    status: 'pending-verification' as string,
    totalDeals: '0', totalValue: '0', commission: '0', rating: '0',
    tags: '',
  })
  const [composeEmailOpen, setComposeEmailOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  const openEditBroker = (b: RealtyBroker) => {
    setEditForm({
      name: b.name || '',
      email: b.email || '',
      phone: b.phone || '',
      company: b.company || '',
      reraId: b.reraId || '',
      city: b.city || 'Chennai',
      specialization: b.specialization || 'residential',
      status: b.status || 'pending-verification',
      totalDeals: String(b.totalDeals ?? 0),
      totalValue: String(b.totalValue ?? 0),
      commission: String(b.commission ?? 0),
      rating: String(b.rating ?? 0),
      tags: (b.tags || []).join(', '),
    })
    setEditBroker(b)
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const handleEditSubmit = async () => {
    if (!editBroker) return
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
      showToast('Please fill in Name, Email and Phone', 'error')
      return
    }
    if (!isSupabaseConfigured()) {
      showToast('Database is not configured', 'error')
      return
    }

    const toNumber = (v: string, fallback = 0) => {
      const n = parseFloat(v)
      return isNaN(n) ? fallback : n
    }
    const tagsArr = editForm.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    setSubmittingEdit(true)
    try {
      const sb = supabase as any
      const { data, error } = await sb.from('realty_brokers').update({
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        company: editForm.company.trim() || null,
        rera_id: editForm.reraId.trim() || null,
        city: editForm.city,
        specialization: editForm.specialization,
        status: editForm.status,
        total_deals: Math.max(0, Math.round(toNumber(editForm.totalDeals))),
        total_value: Math.max(0, toNumber(editForm.totalValue)),
        commission: Math.max(0, toNumber(editForm.commission)),
        rating: Math.min(5, Math.max(0, toNumber(editForm.rating))),
        tags: tagsArr,
        last_active: new Date().toISOString(),
      }).eq('id', editBroker.id).select().single()

      if (error) {
        showToast(error.message || 'Failed to update broker', 'error')
        return
      }
      showToast(`${data?.name || editForm.name} updated`, 'success')
      setEditBroker(null)
      loadData()
    } catch (err: any) {
      showToast(err?.message || 'Failed to update broker', 'error')
    } finally {
      setSubmittingEdit(false)
    }
  }

  const openComposeEmail = (b: RealtyBroker) => {
    setEmailSubject(`GHL India Ventures — ${b.name}`)
    setEmailBody(
      `Dear ${b.name},\n\n` +
      `We'd like to connect with you regarding an opportunity that may be a strong fit for your portfolio.\n\n` +
      `Please reply to this email at your convenience so we can set up a call.\n\n` +
      `Warm regards,\nGHL India Ventures`
    )
    setComposeEmailOpen(true)
  }

  const handleSendEmailToBroker = async () => {
    if (!selectedBroker) return
    const recipient = (selectedBroker.email || '').trim()
    if (!recipient) {
      showToast('No email on file for this broker', 'error')
      return
    }
    if (!emailSubject.trim()) {
      showToast('Please enter a subject', 'error')
      return
    }
    if (!emailBody.trim()) {
      showToast('Please enter a message', 'error')
      return
    }

    setSendingEmail(true)
    try {
      const res = await fetch(`${getFunctionBase()}/.netlify/functions/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [recipient],
          subject: emailSubject.trim(),
          body: emailBody.trim(),
        }),
      })
      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (res.ok && (data as any).success) {
        showToast(`Email sent to ${selectedBroker.name}`, 'success')
        // Audit the outreach
        if (isSupabaseConfigured()) {
          try {
            const sb = supabase as any
            const { data: { user } } = await sb.auth.getUser()
            if (user?.id) {
              await sb.from('notifications').insert({
                user_id: user.id,
                title: 'Broker emailed',
                message: `Sent "${emailSubject.trim()}" to ${selectedBroker.name} (${recipient}).`,
                type: 'success',
                link: '/admin/realty-brokers',
                metadata: { broker_id: selectedBroker.id, broker_name: selectedBroker.name },
              })
            }
          } catch { /* non-blocking */ }
        }
        setComposeEmailOpen(false)
        setSelectedBroker(null)
      } else {
        const errList = Array.isArray((data as { errors?: unknown }).errors) ? (data as { errors: string[] }).errors : []
        const reason = (data as { error?: string }).error || errList[0] || `Failed to send email (HTTP ${res.status})`
        showToast(reason, 'error')
      }
    } catch (err: any) {
      showToast(err?.message || 'Network error — please try again', 'error')
    } finally {
      setSendingEmail(false)
    }
  }
  const [brokerForm, setBrokerForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    reraId: '',
    city: 'Chennai',
    specialization: 'residential',
    experience: '',
    commissionRate: '',
    status: 'pending-verification' as string,
  })
  const [submittingBroker, setSubmittingBroker] = useState(false)

  const handleBrokerFormChange = (field: string, value: string) => {
    setBrokerForm(prev => ({ ...prev, [field]: value }))
  }

  const resetBrokerForm = () => setBrokerForm({
    name: '', email: '', phone: '', company: '', reraId: '',
    city: 'Chennai', specialization: 'residential',
    experience: '', commissionRate: '',
    status: 'pending-verification',
  })

  const handleBrokerSubmit = async () => {
    if (!brokerForm.name.trim() || !brokerForm.email.trim() || !brokerForm.phone.trim()) {
      showToast('Please fill in Name, Email and Phone', 'error')
      return
    }
    if (!isSupabaseConfigured()) {
      showToast('Database is not configured', 'error')
      return
    }
    // Capture the extras the DB table doesn't have a dedicated column for
    // (experience, commission rate) as tags so they're still retrievable.
    const extraTags: string[] = []
    if (brokerForm.experience.trim()) extraTags.push(`${brokerForm.experience.trim()}y exp`)
    if (brokerForm.commissionRate.trim()) extraTags.push(`${brokerForm.commissionRate.trim()}% commission`)

    setSubmittingBroker(true)
    try {
      const sb = supabase as any
      const { data, error } = await sb.from('realty_brokers').insert({
        name: brokerForm.name.trim(),
        email: brokerForm.email.trim(),
        phone: brokerForm.phone.trim(),
        company: brokerForm.company.trim() || null,
        rera_id: brokerForm.reraId.trim() || null,
        city: brokerForm.city,
        specialization: brokerForm.specialization,
        status: brokerForm.status,
        total_deals: 0,
        total_value: 0,
        commission: 0,
        rating: 0,
        join_date: new Date().toISOString().split('T')[0],
        last_active: new Date().toISOString(),
        tags: extraTags,
      }).select().single()

      if (error) {
        showToast(error.message || 'Failed to register broker', 'error')
        return
      }
      showToast(`Broker ${data?.name || brokerForm.name} registered`, 'success')
      setAddBrokerOpen(false)
      resetBrokerForm()
      loadData() // refresh directory + KPIs
    } catch (err: any) {
      showToast(err?.message || 'Failed to register broker', 'error')
    } finally {
      setSubmittingBroker(false)
    }
  }

  // ── KPIs ────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalBrokers = brokers.length
    const activeBrokers = brokers.filter(b => b.status === 'active').length
    const totalDeals = brokers.reduce((s, b) => s + b.totalDeals, 0)
    const totalValue = brokers.reduce((s, b) => s + b.totalValue, 0)
    const totalCommission = brokers.reduce((s, b) => s + b.commission, 0)
    const avgRating = brokers.reduce((s, b) => s + b.rating, 0) / (totalBrokers || 1)
    const newInquiries = inquiries.filter(i => i.status === 'new').length
    return { totalBrokers, activeBrokers, totalDeals, totalValue, totalCommission, avgRating, newInquiries }
  }, [brokers, inquiries])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Realty Brokers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Broker network management & inquiry tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddBrokerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Broker
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
        {SUB_TABS.map(tab => {
          const isActive = subTab === tab.id
          return (
            <button
              key={tab.id ?? 'main'}
              onClick={() => navigate(tab.id ? `realty-brokers/${tab.id}` : 'realty-brokers')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-white bg-brand-red/20 border border-brand-red/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Total Brokers" value={kpis.totalBrokers} icon={Building2} color="#3B82F6" trend="up" trendValue={`${kpis.activeBrokers} active`} />
        <AdminKPICard title="Total Deals" value={kpis.totalDeals} icon={TrendingUp} color="#10B981" />
        <AdminKPICard title="Portfolio Value" value={formatINR(kpis.totalValue)} icon={IndianRupee} color="#F59E0B" />
        <AdminKPICard title="New Inquiries" value={kpis.newInquiries} icon={AlertCircle} color="#DC2626" />
      </div>

      {/* Content based on sub-tab */}
      {subTab === null && <BrokerDirectory brokers={brokers} onSelect={setSelectedBroker} onEdit={openEditBroker} />}
      {subTab === 'inquiries' && <InquiriesView inquiries={inquiries} brokers={brokers} onSelect={setSelectedInquiry} onCreated={loadData} showToast={showToast} />}
      {subTab === 'analytics' && <AnalyticsView brokers={brokers} inquiries={inquiries} />}

      {/* Broker Detail Modal */}
      {selectedBroker && (
        <AdminModal
          isOpen={!!selectedBroker}
          onClose={() => setSelectedBroker(null)}
          title={selectedBroker.name}
          subtitle={selectedBroker.company || 'Independent Broker'}
          maxWidth="max-w-3xl"
          footer={
            <div className="flex gap-2 justify-end">
              <ModalButton
                variant="primary"
                onClick={() => {
                  const email = (selectedBroker.email || '').trim()
                  if (!email) {
                    showToast('No email on file — check the broker profile', 'warning')
                    return
                  }
                  openComposeEmail(selectedBroker)
                }}
              >Contact Broker</ModalButton>
              <ModalButton onClick={() => setSelectedBroker(null)}>Close</ModalButton>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Broker Header */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center">
                <Building2 className="w-7 h-7 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AdminBadge label={BROKER_STATUS_CONFIG[selectedBroker.status]?.label || selectedBroker.status} variant={BROKER_STATUS_CONFIG[selectedBroker.status]?.variant || 'neutral'} dot />
                  <span className="text-xs text-gray-500 capitalize">{selectedBroker.specialization}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(selectedBroker.rating) ? 'fill-current' : 'opacity-30'}`} />
                  ))}
                  <span className="text-xs text-gray-400 ml-1">{selectedBroker.rating}/5.0</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-300">{selectedBroker.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-300">{selectedBroker.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-300">{selectedBroker.city}</span>
              </div>
              {selectedBroker.reraId && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-300">RERA: {selectedBroker.reraId}</span>
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-center">
                <p className="text-lg font-bold text-white">{selectedBroker.totalDeals}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Deals</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-center">
                <p className="text-lg font-bold text-emerald-400">{formatINR(selectedBroker.totalValue)}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Deal Value</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-center">
                <p className="text-lg font-bold text-amber-400">{formatINR(selectedBroker.commission)}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Commission</p>
              </div>
            </div>

            {/* Tags */}
            {selectedBroker.tags.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBroker.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400 border border-white/[0.08]">
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
              <div>
                <span className="uppercase tracking-wider">Joined:</span>
                <span className="text-gray-300 ml-2">{new Date(selectedBroker.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div>
                <span className="uppercase tracking-wider">Last Active:</span>
                <span className="text-gray-300 ml-2">{new Date(selectedBroker.lastActive).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <AdminModal
          isOpen={!!selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          title={selectedInquiry.subject}
          subtitle={`From: ${selectedInquiry.brokerName}`}
          maxWidth="max-w-2xl"
          footer={
            <div className="flex gap-2 justify-end">
              <ModalButton
                variant="primary"
                onClick={async () => {
                  if (!isSupabaseConfigured()) { showToast('Database is not configured', 'error'); return }
                  try {
                    const sb = supabase as any
                    const { data: { user } } = await sb.auth.getUser()
                    if (!user?.id) { showToast('Please sign in again', 'error'); return }
                    const { error } = await sb.from('broker_inquiries')
                      .update({ status: 'contacted', assigned_to: user.id, updated_at: new Date().toISOString() })
                      .eq('id', selectedInquiry.id)
                    if (error) throw error
                    showToast(`Inquiry assigned to you`, 'success')
                    setSelectedInquiry(null)
                    setInquiries(prev => prev.map(q => q.id === selectedInquiry.id ? { ...q, status: 'contacted' as any, assignedTo: user.id } : q))
                  } catch (err: any) {
                    showToast(`Failed: ${err?.message || 'unknown'}`, 'error')
                  }
                }}
              >Assign &amp; Respond</ModalButton>
              <ModalButton onClick={() => setSelectedInquiry(null)}>Close</ModalButton>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <AdminBadge label={INQUIRY_STATUS_CONFIG[selectedInquiry.status]?.label || selectedInquiry.status} variant={INQUIRY_STATUS_CONFIG[selectedInquiry.status]?.variant || 'neutral'} />
              <span className={`text-xs font-semibold ${PRIORITY_CONFIG[selectedInquiry.priority]?.color || 'text-gray-400'}`}>
                {PRIORITY_CONFIG[selectedInquiry.priority]?.label || selectedInquiry.priority} Priority
              </span>
              <span className="text-xs text-gray-500 capitalize">• {selectedInquiry.type}</span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <p className="text-sm text-gray-300 leading-relaxed">{selectedInquiry.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {selectedInquiry.propertyType && (
                <div className="text-sm">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Property Type</p>
                  <p className="text-gray-300">{selectedInquiry.propertyType}</p>
                </div>
              )}
              {selectedInquiry.location && (
                <div className="text-sm">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Location</p>
                  <p className="text-gray-300">{selectedInquiry.location}</p>
                </div>
              )}
              {selectedInquiry.estimatedValue && (
                <div className="text-sm">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Estimated Value</p>
                  <p className="text-emerald-400 font-semibold">{formatINR(selectedInquiry.estimatedValue)}</p>
                </div>
              )}
              <div className="text-sm">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Source</p>
                <p className="text-gray-300 capitalize">{selectedInquiry.source}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
              <div>
                <span className="uppercase tracking-wider">Created:</span>
                <span className="text-gray-300 ml-2">{new Date(selectedInquiry.createdDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              {selectedInquiry.assignedTo && (
                <div>
                  <span className="uppercase tracking-wider">Assigned To:</span>
                  <span className="text-gray-300 ml-2">{selectedInquiry.assignedTo}</span>
                </div>
              )}
            </div>
          </div>
        </AdminModal>
      )}

      {/* Add Broker Modal */}
      <AdminModal
        isOpen={addBrokerOpen}
        onClose={() => setAddBrokerOpen(false)}
        title="Register New Broker"
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setAddBrokerOpen(false)} disabled={submittingBroker} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50">Cancel</button>
            <button onClick={handleBrokerSubmit} disabled={submittingBroker} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-brand-red hover:bg-red-600 transition-colors disabled:opacity-50">{submittingBroker ? 'Registering…' : 'Register Broker'}</button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Broker Name *</label>
            <input
              type="text"
              value={brokerForm.name}
              onChange={(e) => handleBrokerFormChange('name', e.target.value)}
              placeholder="Full name"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email *</label>
            <input
              type="email"
              value={brokerForm.email}
              onChange={(e) => handleBrokerFormChange('email', e.target.value)}
              placeholder="broker@example.com"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone *</label>
            <input
              type="tel"
              value={brokerForm.phone}
              onChange={(e) => handleBrokerFormChange('phone', e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Company Name</label>
            <input
              type="text"
              value={brokerForm.company}
              onChange={(e) => handleBrokerFormChange('company', e.target.value)}
              placeholder="Brokerage firm name"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">RERA Registration ID</label>
            <input
              type="text"
              value={brokerForm.reraId}
              onChange={(e) => handleBrokerFormChange('reraId', e.target.value)}
              placeholder="TN/REA/..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">City</label>
            <select
              value={brokerForm.city}
              onChange={(e) => handleBrokerFormChange('city', e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            >
              <option value="Chennai">Chennai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Coimbatore">Coimbatore</option>
              <option value="Hosur">Hosur</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Pune">Pune</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Specialization</label>
            <select
              value={brokerForm.specialization}
              onChange={(e) => handleBrokerFormChange('specialization', e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="land">Land</option>
              <option value="industrial">Industrial</option>
              <option value="mixed-use">Mixed-Use</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Experience (years)</label>
            <input
              type="number"
              value={brokerForm.experience}
              onChange={(e) => handleBrokerFormChange('experience', e.target.value)}
              placeholder="e.g. 5"
              min="0"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Commission Rate (%)</label>
            <input
              type="number"
              value={brokerForm.commissionRate}
              onChange={(e) => handleBrokerFormChange('commissionRate', e.target.value)}
              placeholder="e.g. 2.5"
              min="0"
              step="0.1"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
            <select
              value={brokerForm.status}
              onChange={(e) => handleBrokerFormChange('status', e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending-verification">Pending Verification</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Attach RERA Certificate & Documents</label>
            <button
              type="button"
              onClick={() => setFolderPickerOpen(true)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] border border-dashed border-white/[0.12] hover:bg-white/[0.08] hover:border-white/[0.2] transition-colors w-full justify-center"
            >
              <Upload className="w-4 h-4" />
              Upload RERA Certificates & Documents
            </button>
            <p className="text-[10px] text-gray-600 mt-1">Stored in File Repository &gt; Sales &amp; CRM</p>
          </div>
        </div>
      </AdminModal>

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

      {/* Edit Broker Modal */}
      <AdminModal
        isOpen={!!editBroker}
        onClose={() => setEditBroker(null)}
        title="Edit Broker"
        subtitle={editBroker ? editBroker.name : undefined}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setEditBroker(null)} disabled={submittingEdit} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50">Cancel</button>
            <button onClick={handleEditSubmit} disabled={submittingEdit} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-brand-red hover:bg-red-600 transition-colors disabled:opacity-50">{submittingEdit ? 'Saving…' : 'Save Changes'}</button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Broker Name *</label>
            <input type="text" value={editForm.name} onChange={(e) => handleEditFormChange('name', e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email *</label>
            <input type="email" value={editForm.email} onChange={(e) => handleEditFormChange('email', e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone *</label>
            <input type="tel" value={editForm.phone} onChange={(e) => handleEditFormChange('phone', e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Company Name</label>
            <input type="text" value={editForm.company} onChange={(e) => handleEditFormChange('company', e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">RERA Registration ID</label>
            <input type="text" value={editForm.reraId} onChange={(e) => handleEditFormChange('reraId', e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">City</label>
            <select value={editForm.city} onChange={(e) => handleEditFormChange('city', e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20">
              <option value="Chennai">Chennai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Coimbatore">Coimbatore</option>
              <option value="Hosur">Hosur</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Pune">Pune</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Specialization</label>
            <select value={editForm.specialization} onChange={(e) => handleEditFormChange('specialization', e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20">
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="land">Land</option>
              <option value="industrial">Industrial</option>
              <option value="mixed-use">Mixed-Use</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
            <select value={editForm.status} onChange={(e) => handleEditFormChange('status', e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending-verification">Pending Verification</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Total Deals</label>
            <input type="number" min="0" step="1" value={editForm.totalDeals} onChange={(e) => handleEditFormChange('totalDeals', e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Total Deal Value (₹)</label>
            <input type="number" min="0" step="1" value={editForm.totalValue} onChange={(e) => handleEditFormChange('totalValue', e.target.value)} placeholder="e.g. 50000000" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Commission Earned (₹)</label>
            <input type="number" min="0" step="1" value={editForm.commission} onChange={(e) => handleEditFormChange('commission', e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Rating (0–5)</label>
            <input type="number" min="0" max="5" step="0.1" value={editForm.rating} onChange={(e) => handleEditFormChange('rating', e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tags (comma separated)</label>
            <input type="text" value={editForm.tags} onChange={(e) => handleEditFormChange('tags', e.target.value)} placeholder="e.g. 5y exp, 2.5% commission, top-performer" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
        </div>
      </AdminModal>

      {/* Compose Email Modal */}
      <AdminModal
        isOpen={composeEmailOpen}
        onClose={() => setComposeEmailOpen(false)}
        title="Email Broker"
        subtitle={selectedBroker ? `${selectedBroker.name} <${selectedBroker.email}>` : undefined}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setComposeEmailOpen(false)} disabled={sendingEmail} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50">Cancel</button>
            <button onClick={handleSendEmailToBroker} disabled={sendingEmail} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-brand-red hover:bg-red-600 transition-colors disabled:opacity-50">{sendingEmail ? 'Sending…' : 'Send Email'}</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Subject</label>
            <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Message</label>
            <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={10} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 resize-none" />
            <p className="text-[10px] text-gray-600 mt-1">Sent via Resend from noreply@ghlindiaventures.com. Replies go to info@ghlindiaventures.com.</p>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

// ── Broker Directory Sub-view ──────────────────────────────────────
function BrokerDirectory({ brokers, onSelect, onEdit }: {
  brokers: RealtyBroker[]
  onSelect: (b: RealtyBroker) => void
  onEdit: (b: RealtyBroker) => void
}) {
  const columns: Column<RealtyBroker>[] = [
    {
      key: 'name',
      label: 'Broker',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{row.name}</p>
            <p className="text-[11px] text-gray-500">{row.company || 'Independent'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'specialization',
      label: 'Type',
      sortable: true,
      render: (row) => {
        const Icon = SPECIALIZATION_ICONS[row.specialization] || Building2
        return (
          <div className="flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm text-gray-300 capitalize">{row.specialization}</span>
          </div>
        )
      },
    },
    {
      key: 'city',
      label: 'City',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-gray-500" />
          <span className="text-sm text-gray-300">{row.city}</span>
        </div>
      ),
    },
    {
      key: 'totalDeals',
      label: 'Deals',
      sortable: true,
      render: (row) => <span className="text-sm font-medium text-white">{row.totalDeals}</span>,
    },
    {
      key: 'totalValue',
      label: 'Value',
      sortable: true,
      render: (row) => <span className="text-sm font-semibold text-emerald-400">{formatINR(row.totalValue)}</span>,
    },
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
          <span className="text-sm text-gray-300">{row.rating}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <AdminBadge
          label={BROKER_STATUS_CONFIG[row.status]?.label || row.status}
          variant={BROKER_STATUS_CONFIG[row.status]?.variant || 'neutral'}
          dot
        />
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(row) }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(row) }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Edit Broker"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminGlass hover={false}>
      <AdminDataTable<RealtyBroker>
        columns={columns}
        data={brokers}
        searchable
        searchPlaceholder="Search brokers by name, company, city..."
        searchKeys={['name', 'company', 'city', 'specialization']}
        onRowClick={onSelect}
        exportable
        title="Broker Directory"
        pageSize={10}
        actions={
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors">
              <Filter className="w-3 h-3" />
              Filter
            </button>
          </div>
        }
      />
    </AdminGlass>
  )
}

// ── Inquiries Sub-view ─────────────────────────────────────────────
function InquiriesView({ inquiries, brokers, onSelect, onCreated, showToast }: {
  inquiries: BrokerInquiry[]
  brokers: RealtyBroker[]
  onSelect: (i: BrokerInquiry) => void
  onCreated?: () => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  const [addInquiryOpen, setAddInquiryOpen] = useState(false)
  const [submittingInquiry, setSubmittingInquiry] = useState(false)
  const [inquiryForm, setInquiryForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    propertyType: 'Residential Apartment',
    preferredLocation: '',
    budgetRange: '',
    priority: 'medium' as string,
    notes: '',
    assignedBroker: '',
  })

  const handleInquiryFormChange = (field: string, value: string) => {
    setInquiryForm(prev => ({ ...prev, [field]: value }))
  }

  const resetInquiryForm = () => setInquiryForm({
    clientName: '', clientPhone: '', clientEmail: '',
    propertyType: 'Residential Apartment', preferredLocation: '',
    budgetRange: '', priority: 'medium', notes: '', assignedBroker: '',
  })

  // Best-effort parse of budget strings like "50L - 1Cr" / "2.5Cr" into a
  // numeric rupee value (estimated_value column is numeric). Lakh = 1e5,
  // crore = 1e7. Anything unparseable stays null.
  const parseBudgetToRupees = (input: string): number | null => {
    const s = (input || '').trim().toLowerCase()
    if (!s) return null
    // Pick the first number in the string.
    const m = s.match(/([\d.]+)\s*(cr|crore|l|lac|lakh|k)?/i)
    if (!m) return null
    const n = parseFloat(m[1])
    if (isNaN(n)) return null
    const unit = (m[2] || '').toLowerCase()
    if (unit === 'cr' || unit === 'crore') return Math.round(n * 1e7)
    if (unit === 'l' || unit === 'lac' || unit === 'lakh') return Math.round(n * 1e5)
    if (unit === 'k') return Math.round(n * 1e3)
    return Math.round(n)
  }

  const handleInquirySubmit = async () => {
    if (!inquiryForm.clientName.trim()) {
      showToast('Please enter the client name', 'error')
      return
    }
    if (!isSupabaseConfigured()) {
      showToast('Database is not configured', 'error')
      return
    }

    // Pick the broker row that matches the selected name so broker_id is
    // linked for future reporting. Falls back to null if the admin hasn't
    // picked one.
    const assigned = brokers.find(b => b.name === inquiryForm.assignedBroker)
    const brokerName = assigned?.name || inquiryForm.assignedBroker.trim() || 'Unassigned'
    const subject = `Inquiry: ${inquiryForm.clientName.trim()} — ${inquiryForm.propertyType}`
    const messageParts = [
      `Client: ${inquiryForm.clientName.trim()}`,
      inquiryForm.clientPhone.trim() ? `Phone: ${inquiryForm.clientPhone.trim()}` : '',
      inquiryForm.clientEmail.trim() ? `Email: ${inquiryForm.clientEmail.trim()}` : '',
      inquiryForm.budgetRange.trim() ? `Budget: ${inquiryForm.budgetRange.trim()}` : '',
      inquiryForm.notes.trim() ? `Notes: ${inquiryForm.notes.trim()}` : '',
    ].filter(Boolean).join('\n')

    setSubmittingInquiry(true)
    try {
      const sb = supabase as any
      const { error } = await sb.from('broker_inquiries').insert({
        broker_id: assigned?.id || null,
        broker_name: brokerName,
        source: 'direct',
        type: 'realty',
        subject,
        message: messageParts || null,
        status: 'new',
        priority: inquiryForm.priority,
        property_type: inquiryForm.propertyType || null,
        location: inquiryForm.preferredLocation.trim() || null,
        estimated_value: parseBudgetToRupees(inquiryForm.budgetRange),
      })

      if (error) {
        showToast(error.message || 'Failed to create inquiry', 'error')
        return
      }
      showToast('Inquiry created', 'success')
      setAddInquiryOpen(false)
      resetInquiryForm()
      onCreated?.()
    } catch (err: any) {
      showToast(err?.message || 'Failed to create inquiry', 'error')
    } finally {
      setSubmittingInquiry(false)
    }
  }

  const columns: Column<BrokerInquiry>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (row) => <span className="text-xs font-mono text-gray-500">{row.id}</span>,
    },
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white truncate max-w-[200px]">{row.subject}</p>
          <p className="text-[11px] text-gray-500">{row.brokerName}</p>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-300 capitalize">{row.type}</span>,
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (row) => (
        <span className={`text-xs font-semibold ${PRIORITY_CONFIG[row.priority]?.color || 'text-gray-400'}`}>
          {PRIORITY_CONFIG[row.priority]?.label || row.priority}
        </span>
      ),
    },
    {
      key: 'estimatedValue',
      label: 'Est. Value',
      sortable: true,
      render: (row) => (
        <span className="text-sm font-semibold text-emerald-400">
          {row.estimatedValue ? formatINR(row.estimatedValue) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <AdminBadge
          label={INQUIRY_STATUS_CONFIG[row.status]?.label || row.status}
          variant={INQUIRY_STATUS_CONFIG[row.status]?.variant || 'neutral'}
          dot
        />
      ),
    },
    {
      key: 'createdDate',
      label: 'Date',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-gray-400">
          {new Date(row.createdDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(row) }}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.08] transition-colors"
          title="View Inquiry"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ]

  return (
    <>
      <AdminGlass hover={false}>
        <AdminDataTable<BrokerInquiry>
          columns={columns}
          data={inquiries}
          searchable
          searchPlaceholder="Search inquiries..."
          searchKeys={['subject', 'brokerName', 'type', 'location']}
          onRowClick={onSelect}
          exportable
          title="Broker Inquiries"
          pageSize={10}
          actions={
            <button
              onClick={() => setAddInquiryOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors"
            >
              <Plus className="w-3 h-3" />
              New Inquiry
            </button>
          }
        />
      </AdminGlass>

      {/* Add Inquiry Modal */}
      <AdminModal
        isOpen={addInquiryOpen}
        onClose={() => setAddInquiryOpen(false)}
        title="Create New Inquiry"
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setAddInquiryOpen(false)} disabled={submittingInquiry} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50">Cancel</button>
            <button onClick={handleInquirySubmit} disabled={submittingInquiry} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-brand-red hover:bg-red-600 transition-colors disabled:opacity-50">{submittingInquiry ? 'Creating…' : 'Create Inquiry'}</button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Client Name *</label>
            <input
              type="text"
              value={inquiryForm.clientName}
              onChange={(e) => handleInquiryFormChange('clientName', e.target.value)}
              placeholder="Client full name"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Client Phone</label>
            <input
              type="tel"
              value={inquiryForm.clientPhone}
              onChange={(e) => handleInquiryFormChange('clientPhone', e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Client Email</label>
            <input
              type="email"
              value={inquiryForm.clientEmail}
              onChange={(e) => handleInquiryFormChange('clientEmail', e.target.value)}
              placeholder="client@example.com"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Property Type</label>
            <select
              value={inquiryForm.propertyType}
              onChange={(e) => handleInquiryFormChange('propertyType', e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            >
              <option value="Residential Apartment">Residential Apartment</option>
              <option value="Commercial Office">Commercial Office</option>
              <option value="Land Plot">Land Plot</option>
              <option value="Villa">Villa</option>
              <option value="Industrial">Industrial</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Preferred Location</label>
            <input
              type="text"
              value={inquiryForm.preferredLocation}
              onChange={(e) => handleInquiryFormChange('preferredLocation', e.target.value)}
              placeholder="e.g. OMR, Chennai"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Budget Range</label>
            <input
              type="text"
              value={inquiryForm.budgetRange}
              onChange={(e) => handleInquiryFormChange('budgetRange', e.target.value)}
              placeholder="e.g. 50L - 1Cr"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Priority</label>
            <select
              value={inquiryForm.priority}
              onChange={(e) => handleInquiryFormChange('priority', e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Assigned Broker</label>
            <select
              value={inquiryForm.assignedBroker}
              onChange={(e) => handleInquiryFormChange('assignedBroker', e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            >
              <option value="">Select a broker...</option>
              {brokers.map(broker => (
                <option key={broker.id} value={broker.name}>{broker.name} — {broker.city}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
            <textarea
              value={inquiryForm.notes}
              onChange={(e) => handleInquiryFormChange('notes', e.target.value)}
              placeholder="Additional details about the inquiry..."
              rows={3}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 resize-none"
            />
          </div>
        </div>
      </AdminModal>
    </>
  )
}

// ── Analytics Sub-view ──────────────────────────────────────────────
function AnalyticsView({ brokers, inquiries }: { brokers: RealtyBroker[]; inquiries: BrokerInquiry[] }) {
  const totalValue = brokers.reduce((s, b) => s + b.totalValue, 0)
  const totalCommission = brokers.reduce((s, b) => s + b.commission, 0)
  const avgRating = brokers.reduce((s, b) => s + b.rating, 0) / (brokers.length || 1)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Total Portfolio" value={formatINR(totalValue)} icon={IndianRupee} color="#10B981" />
        <AdminKPICard title="Total Commission" value={formatINR(totalCommission)} icon={TrendingUp} color="#F59E0B" />
        <AdminKPICard title="Avg Rating" value={avgRating.toFixed(1)} icon={Star} color="#3B82F6" subtitle="out of 5.0" />
        <AdminKPICard title="Inquiry Pipeline" value={`${formatINR(inquiries.reduce((s, i) => s + (i.estimatedValue || 0), 0))}`} icon={BarChart3} color="#8B5CF6" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deal Value by City */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4">Deal Value by City (₹ Cr)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEAL_VALUE_BY_CITY}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="city" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE as any}
                  formatter={((value: number) => [`₹${value} Cr`, 'Value']) as any}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminGlass>

        {/* Specialization Distribution */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4">Broker Specialization</h3>
          <div className="h-[250px] flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={SPECIALIZATION_DIST}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {SPECIALIZATION_DIST.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE as any} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {SPECIALIZATION_DIST.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-400">{item.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </AdminGlass>
      </div>

      {/* Top Performers */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4">Top Performing Brokers</h3>
        <div className="space-y-2">
          {[...brokers]
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, 5)
            .map((broker, i) => (
              <div key={broker.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                <span className="text-lg font-bold text-gray-600 w-6 text-center">{i + 1}</span>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{broker.name}</p>
                  <p className="text-[11px] text-gray-500">{broker.company || 'Independent'} • {broker.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-400">{formatINR(broker.totalValue)}</p>
                  <p className="text-[11px] text-gray-500">{broker.totalDeals} deals</p>
                </div>
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-current" />
                  <span className="text-xs text-gray-400">{broker.rating}</span>
                </div>
              </div>
            ))}
        </div>
      </AdminGlass>
    </div>
  )
}
