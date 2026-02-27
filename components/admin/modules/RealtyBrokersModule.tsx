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
import { formatINR } from '@/lib/admin/adminHooks'
import UploadWithFolderPicker from '@/components/shared/UploadWithFolderPicker'
import type { RealtyBroker, BrokerInquiry } from '@/lib/admin/adminTypes'

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
const DEAL_VALUE_BY_CITY = [
  { city: 'Chennai', value: 253 },
  { city: 'Bangalore', value: 65 },
  { city: 'Coimbatore', value: 32 },
  { city: 'Hosur', value: 22 },
]

const SPECIALIZATION_DIST = [
  { name: 'Residential', value: 35, color: '#3B82F6' },
  { name: 'Commercial', value: 25, color: '#F59E0B' },
  { name: 'Land', value: 20, color: '#10B981' },
  { name: 'Industrial', value: 12, color: '#8B5CF6' },
  { name: 'Mixed-Use', value: 8, color: '#06B6D4' },
]

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

  const handleBrokerFormChange = (field: string, value: string) => {
    setBrokerForm(prev => ({ ...prev, [field]: value }))
  }

  const handleBrokerSubmit = () => {
    if (!brokerForm.name || !brokerForm.email || !brokerForm.phone) {
      showToast('Please fill in all required fields', 'error')
      return
    }
    showToast('Broker registered successfully', 'success')
    setAddBrokerOpen(false)
    setBrokerForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      reraId: '',
      city: 'Chennai',
      specialization: 'residential',
      experience: '',
      commissionRate: '',
      status: 'pending-verification',
    })
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
        <AdminKPICard title="Total Deals" value={kpis.totalDeals} icon={TrendingUp} color="#10B981" trend="up" trendValue="53 this quarter" />
        <AdminKPICard title="Portfolio Value" value={formatINR(kpis.totalValue)} icon={IndianRupee} color="#F59E0B" />
        <AdminKPICard title="New Inquiries" value={kpis.newInquiries} icon={AlertCircle} color="#DC2626" trend="up" trendValue="2 this week" />
      </div>

      {/* Content based on sub-tab */}
      {subTab === null && <BrokerDirectory brokers={brokers} onSelect={setSelectedBroker} showToast={showToast} />}
      {subTab === 'inquiries' && <InquiriesView inquiries={inquiries} brokers={brokers} onSelect={setSelectedInquiry} showToast={showToast} />}
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
              <ModalButton variant="primary" onClick={() => { showToast(`Contacting ${selectedBroker.name}...`, 'info'); setSelectedBroker(null) }}>Contact Broker</ModalButton>
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
              <ModalButton variant="primary" onClick={() => { showToast(`Inquiry ${selectedInquiry.id} assigned`, 'success'); setSelectedInquiry(null) }}>Assign &amp; Respond</ModalButton>
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
            <button onClick={() => setAddBrokerOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">Cancel</button>
            <button onClick={handleBrokerSubmit} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-brand-red hover:bg-red-600 transition-colors">Register Broker</button>
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
    </div>
  )
}

// ── Broker Directory Sub-view ──────────────────────────────────────
function BrokerDirectory({ brokers, onSelect, showToast }: {
  brokers: RealtyBroker[]
  onSelect: (b: RealtyBroker) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
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
            onClick={(e) => { e.stopPropagation(); showToast(`Editing ${row.name}...`, 'info') }}
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
function InquiriesView({ inquiries, brokers, onSelect, showToast }: {
  inquiries: BrokerInquiry[]
  brokers: RealtyBroker[]
  onSelect: (i: BrokerInquiry) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  const [addInquiryOpen, setAddInquiryOpen] = useState(false)
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

  const handleInquirySubmit = () => {
    if (!inquiryForm.clientName) {
      showToast('Please enter the client name', 'error')
      return
    }
    showToast('Inquiry created successfully', 'success')
    setAddInquiryOpen(false)
    setInquiryForm({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      propertyType: 'Residential Apartment',
      preferredLocation: '',
      budgetRange: '',
      priority: 'medium',
      notes: '',
      assignedBroker: '',
    })
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
            <button onClick={() => setAddInquiryOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">Cancel</button>
            <button onClick={handleInquirySubmit} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-brand-red hover:bg-red-600 transition-colors">Create Inquiry</button>
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
