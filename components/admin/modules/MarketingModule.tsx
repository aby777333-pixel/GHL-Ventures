'use client'

import { useState, useMemo } from 'react'
import {
  Megaphone, Target, Mail, Users, BarChart3, Sparkles, Link2,
  Settings, TrendingUp, Eye, Play, Pause, Copy, Edit3,
  Plus, Search, ArrowRight, Zap, Clock, Calendar,
  Globe, Hash, MessageCircle, Send, Smartphone, Bell,
  PenTool, Image, Video, Layout, Star, Repeat,
  ShieldCheck, PieChart as PieChartIcon, UserCheck, SplitSquareVertical,
  Compass, RefreshCw, MapPin, Code, Facebook, Linkedin,
  Youtube, Twitter, Chrome, Filter, ArrowUpRight, ArrowDownRight,
  CheckCircle2, FileText, Layers, Activity, Brain,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import AdminGlass from '../shared/AdminGlass'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import {
  MARKETING_KPIS, MARKETING_CAMPAIGNS_DATA, MARKETING_CONTENT_DATA,
  AUDIENCE_SEGMENTS_DATA, OUTREACH_SEQUENCES_DATA, MARKETING_AI_TOOLS,
  INTEGRATION_SERVICES_DATA, CHANNEL_PERFORMANCE_DATA,
} from '@/lib/admin/adminMockData'
import { formatINR } from '@/lib/admin/adminHooks'
import type {
  MarketingCampaign, ContentItem, AudienceSegment,
  OutreachSequence, MarketingAITool, IntegrationService,
} from '@/lib/admin/adminTypes'
import { uploadFile, saveBlobAs } from '@/lib/supabase/storageService'

// ── Icon Maps ─────────────────────────────────────────────────────
const AI_ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  PenTool, SplitSquareVertical, UserCheck, Search, ShieldCheck, Eye,
  Target, Hash, Image, PieChart: PieChartIcon, Users, MessageCircle,
  Layout, Star, Clock, Repeat, Video, Globe,
}

const INTEGRATION_ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Chrome, Facebook, Linkedin, Youtube, Twitter, MessageCircle,
  Send, Compass, MapPin, Calendar, RefreshCw, Zap, Code, Mail,
}

// ── Campaign Status Config ────────────────────────────────────────
const CAMPAIGN_STATUS_CONFIG: Record<string, { label: string; variant: 'neutral' | 'info' | 'success' | 'warning' | 'purple' | 'error' }> = {
  draft: { label: 'Draft', variant: 'neutral' },
  scheduled: { label: 'Scheduled', variant: 'info' },
  live: { label: 'Live', variant: 'success' },
  paused: { label: 'Paused', variant: 'warning' },
  completed: { label: 'Completed', variant: 'purple' },
  archived: { label: 'Archived', variant: 'neutral' },
}

// ── Campaign Type Icons ────────────────────────────────────────────
const CAMPAIGN_TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  social: Globe,
  'google-ads': Chrome,
  'meta-ads': Facebook,
  'linkedin-ads': Linkedin,
  'youtube-ads': Youtube,
  event: Calendar,
  whatsapp: MessageCircle,
  telegram: Send,
  sms: Smartphone,
  rcs: Smartphone,
  push: Bell,
  offline: MapPin,
  'multi-channel': Layers,
}

// ── Content Status Config ──────────────────────────────────────────
const CONTENT_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  idea: { label: 'Idea', color: 'text-gray-400', bgColor: 'bg-gray-500/15 border-gray-500/20' },
  draft: { label: 'Draft', color: 'text-blue-400', bgColor: 'bg-blue-500/15 border-blue-500/20' },
  review: { label: 'Review', color: 'text-amber-400', bgColor: 'bg-amber-500/15 border-amber-500/20' },
  approved: { label: 'Approved', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15 border-emerald-500/20' },
  scheduled: { label: 'Scheduled', color: 'text-purple-400', bgColor: 'bg-purple-500/15 border-purple-500/20' },
  published: { label: 'Published', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15 border-emerald-500/20' },
}

// ── AI Category Config ─────────────────────────────────────────────
const AI_CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  content: { label: 'Content', color: 'text-purple-400', bgColor: 'bg-purple-500/15 border-purple-500/20' },
  analytics: { label: 'Analytics', color: 'text-blue-400', bgColor: 'bg-blue-500/15 border-blue-500/20' },
  optimization: { label: 'Optimization', color: 'text-amber-400', bgColor: 'bg-amber-500/15 border-amber-500/20' },
  intelligence: { label: 'Intelligence', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15 border-emerald-500/20' },
  automation: { label: 'Automation', color: 'text-red-400', bgColor: 'bg-red-500/15 border-red-500/20' },
}

// ── Integration Category Config ────────────────────────────────────
const INTEGRATION_CATEGORY_CONFIG: Record<string, string> = {
  advertising: 'Advertising',
  social: 'Social',
  messaging: 'Messaging',
  crm: 'CRM',
  analytics: 'Analytics',
  scheduling: 'Scheduling',
  automation: 'Automation',
}

// ── Chart Mock Data ────────────────────────────────────────────────
const LEAD_TREND_DATA = [
  { month: 'Oct', leads: 142, spend: 320000 },
  { month: 'Nov', leads: 158, spend: 345000 },
  { month: 'Dec', leads: 175, spend: 310000 },
  { month: 'Jan', leads: 198, spend: 380000 },
  { month: 'Feb', leads: 215, spend: 420000 },
  { month: 'Mar', leads: 234, spend: 450000 },
]

const CAMPAIGN_TYPE_DIST = [
  { name: 'Email', value: 35, color: '#3B82F6' },
  { name: 'Google Ads', value: 25, color: '#F59E0B' },
  { name: 'Social', value: 18, color: '#8B5CF6' },
  { name: 'Events', value: 12, color: '#10B981' },
  { name: 'Messaging', value: 10, color: '#06B6D4' },
]

const FUNNEL_DATA = [
  { stage: 'Awareness', count: 24680, pct: 100 },
  { stage: 'Interest', count: 8420, pct: 34.1 },
  { stage: 'Consideration', count: 3150, pct: 12.8 },
  { stage: 'Intent', count: 890, pct: 3.6 },
  { stage: 'Decision', count: 234, pct: 0.95 },
]

const CHANNEL_ROI_DATA = [
  { channel: 'WhatsApp', roi: 450 },
  { channel: 'Telegram', roi: 520 },
  { channel: 'Email', roi: 340 },
  { channel: 'Google Ads', roi: 310 },
  { channel: 'LinkedIn', roi: 220 },
  { channel: 'Meta Ads', roi: 180 },
  { channel: 'Events', roi: 150 },
]

// ── Chart Tooltip Style ────────────────────────────────────────────
const CHART_TOOLTIP_STYLE = {
  background: 'rgba(10,10,10,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  fontSize: '12px',
}

// ── Props ──────────────────────────────────────────────────────────
interface MarketingModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

// ══════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function MarketingModule({ subTab, navigate, showToast }: MarketingModuleProps) {
  return (
    <div className="space-y-6 admin-section-enter">
      {subTab === null && <OverviewTab navigate={navigate} showToast={showToast} />}
      {subTab === 'campaigns' && <CampaignsTab showToast={showToast} />}
      {subTab === 'content' && <ContentTab showToast={showToast} />}
      {subTab === 'audience' && <AudienceTab showToast={showToast} />}
      {subTab === 'outreach' && <OutreachTab showToast={showToast} />}
      {subTab === 'mkt-analytics' && <AnalyticsTab />}
      {subTab === 'ai-tools' && <AIToolsTab navigate={navigate} showToast={showToast} />}
      {subTab === 'integrations' && <IntegrationsTab showToast={showToast} />}
      {subTab === 'mkt-settings' && <SettingsTab showToast={showToast} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  SUB-TAB 1: OVERVIEW
// ══════════════════════════════════════════════════════════════════
function OverviewTab({ navigate, showToast }: { navigate: (p: string) => void; showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const liveCampaigns = MARKETING_CAMPAIGNS_DATA.filter(c => c.status === 'live')
  const spendPct = Math.round((MARKETING_KPIS.marketingSpend / MARKETING_KPIS.marketingBudget) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-brand-red" />
          Marketing Command Center
        </h1>
        <p className="text-sm text-gray-500 mt-1">Full-stack marketing operations, campaigns, and analytics</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <AdminKPICard title="Total Leads" value={MARKETING_KPIS.totalLeads.toLocaleString()} trend="up" trendValue={`+${MARKETING_KPIS.leadsTrend}%`} icon={Users} color="#3B82F6" delay={0} />
        <AdminKPICard title="Campaign ROI" value={`${MARKETING_KPIS.campaignROI}%`} icon={TrendingUp} color="#10B981" delay={50} />
        <AdminKPICard title="Email Open Rate" value={`${MARKETING_KPIS.emailOpenRate}%`} icon={Mail} color="#8B5CF6" delay={100} />
        <AdminKPICard title="Social Engagement" value={`${MARKETING_KPIS.socialEngagement}%`} icon={Globe} color="#F59E0B" delay={150} />
        <AdminKPICard title="Marketing Spend" value={formatINR(MARKETING_KPIS.marketingSpend)} subtitle={`${spendPct}% of ${formatINR(MARKETING_KPIS.marketingBudget)} budget`} icon={Target} color="#DC2626" delay={200} />
        <AdminKPICard title="Website Traffic" value={MARKETING_KPIS.websiteTraffic.toLocaleString()} trend="up" trendValue={`+${MARKETING_KPIS.trafficTrend}%`} icon={Activity} color="#06B6D4" delay={250} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Channel Performance */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-red" />
            Channel Performance
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHANNEL_PERFORMANCE_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="channel" type="category" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="leads" name="Leads" radius={[0, 4, 4, 0]}>
                  {CHANNEL_PERFORMANCE_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminGlass>

        {/* Active Campaigns */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-brand-red" />
            Active Campaigns
          </h3>
          <div className="space-y-3">
            {liveCampaigns.map(c => {
              const TypeIcon = CAMPAIGN_TYPE_ICON[c.type] || Megaphone
              const spendProgress = c.budget > 0 ? Math.round((c.spend / c.budget) * 100) : 0
              return (
                <div key={c.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-medium text-white group-hover:text-brand-red transition-colors">{c.name}</p>
                    </div>
                    <AdminBadge label="Live" variant="success" dot />
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-gray-500">
                    <span>{c.leads} leads</span>
                    <span>ROI: {c.roi}%</span>
                    <span>{formatINR(c.spend)} / {formatINR(c.budget)}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full bg-brand-red/60 rounded-full transition-all" style={{ width: `${spendProgress}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </AdminGlass>
      </div>

      {/* Quick Actions */}
      <AdminGlass padding="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: '+ New Campaign', action: () => navigate('marketing/campaigns') },
            { label: '+ Schedule Post', action: () => navigate('marketing/content') },
            { label: '+ Create Email', action: () => showToast('Email composer launched', 'success') },
            { label: '+ Upload Asset', action: () => {
              const input = document.createElement('input')
              input.type = 'file'
              input.multiple = true
              input.accept = '.pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.zip,.mp4,.mp3'
              input.onchange = async () => {
                if (input.files && input.files.length > 0) {
                  showToast(`Uploading ${input.files.length} asset(s)...`, 'info')
                  let ok = 0
                  for (let i = 0; i < input.files.length; i++) {
                    const result = await uploadFile(input.files[i], 'admin/marketing-assets')
                    if (result.success) ok++
                  }
                  showToast(`Uploaded ${ok} asset(s) to Supabase Storage`, 'success')
                }
              }
              input.click()
            }},
            { label: '+ Import Contacts', action: () => navigate('marketing/audience') },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white bg-brand-red/15 border border-brand-red/25 hover:bg-brand-red/25 transition-colors admin-btn-press"
            >
              {item.label}
            </button>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  SUB-TAB 2: CAMPAIGNS
// ══════════════════════════════════════════════════════════════════
function CampaignsTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return MARKETING_CAMPAIGNS_DATA
    return MARKETING_CAMPAIGNS_DATA.filter(c => c.type === typeFilter)
  }, [typeFilter])

  const typeFilters = ['all', 'email', 'social', 'google-ads', 'meta-ads', 'event', 'whatsapp', 'telegram', 'multi-channel']

  const columns: Column<MarketingCampaign>[] = [
    {
      key: 'name',
      label: 'Campaign',
      render: (row) => {
        const TypeIcon = CAMPAIGN_TYPE_ICON[row.type] || Megaphone
        return (
          <div className="flex items-center gap-2">
            <TypeIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">{row.name}</p>
              <p className="text-[11px] text-gray-500 capitalize">{row.type.replace(/-/g, ' ')}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const cfg = CAMPAIGN_STATUS_CONFIG[row.status]
        return <AdminBadge label={cfg?.label || row.status} variant={cfg?.variant || 'neutral'} dot />
      },
    },
    {
      key: 'budget',
      label: 'Budget / Spend',
      render: (row) => {
        const pct = row.budget > 0 ? Math.round((row.spend / row.budget) * 100) : 0
        return (
          <div>
            <span className="text-xs text-gray-300">{formatINR(row.spend)} / {formatINR(row.budget)}</span>
            <div className="mt-1 h-1 w-20 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-brand-red/60 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      },
    },
    { key: 'leads', label: 'Leads', render: (row) => <span className="text-white font-semibold">{row.leads}</span> },
    { key: 'roi', label: 'ROI', render: (row) => <span className={`font-semibold ${row.roi > 200 ? 'text-emerald-400' : row.roi > 0 ? 'text-amber-400' : 'text-gray-500'}`}>{row.roi}%</span> },
    { key: 'owner', label: 'Owner', render: (row) => <span className="text-xs text-gray-400">{row.owner}</span> },
    {
      key: 'actions',
      label: '',
      sortable: false,
      width: '50px',
      render: (row) => (
        <button onClick={(e) => { e.stopPropagation(); setSelectedCampaign(row); setModalOpen(true) }} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors">
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and monitor all marketing campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/[0.03] rounded-lg border border-white/[0.06] p-0.5">
            {(['cards', 'table'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === mode ? 'bg-brand-red/20 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {mode === 'cards' ? 'Cards' : 'Table'}
              </button>
            ))}
          </div>
          <button onClick={() => showToast('Campaign builder launched', 'success')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors admin-btn-press">
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-1.5">
        {typeFilters.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              typeFilter === t
                ? 'bg-brand-red/20 text-white border-brand-red/30'
                : 'bg-white/[0.03] text-gray-500 border-white/[0.06] hover:bg-white/[0.06]'
            }`}
          >
            {t === 'all' ? 'All' : t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <AdminGlass padding="p-4">
          <AdminDataTable<MarketingCampaign>
            columns={columns}
            data={filtered}
            searchKeys={['name', 'type', 'owner', 'status']}
            searchPlaceholder="Search campaigns..."
            onRowClick={(row) => { setSelectedCampaign(row); setModalOpen(true) }}
            exportable
            title="All Campaigns"
          />
        </AdminGlass>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c, i) => {
            const TypeIcon = CAMPAIGN_TYPE_ICON[c.type] || Megaphone
            const cfg = CAMPAIGN_STATUS_CONFIG[c.status]
            const spendPct = c.budget > 0 ? Math.round((c.spend / c.budget) * 100) : 0
            return (
              <AdminGlass key={c.id} padding="p-4" className="cursor-pointer group admin-card-enter">
                <div style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      <TypeIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <AdminBadge label={cfg?.label || c.status} variant={cfg?.variant || 'neutral'} dot />
                  </div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-brand-red transition-colors">{c.name}</h3>
                  <p className="text-[11px] text-gray-500 mt-1 capitalize">{c.type.replace(/-/g, ' ')} - {c.owner}</p>
                  <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-500">
                    <span>{c.leads} leads</span>
                    <span className={c.roi > 200 ? 'text-emerald-400' : c.roi > 0 ? 'text-amber-400' : ''}>{c.roi}% ROI</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                      <span>{formatINR(c.spend)}</span>
                      <span>{formatINR(c.budget)}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="h-full bg-brand-red/60 rounded-full" style={{ width: `${spendPct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                    {c.status === 'draft' && (
                      <button onClick={(e) => { e.stopPropagation(); showToast(`${c.name} launched`, 'success') }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                        <Play className="w-3 h-3" /> Launch
                      </button>
                    )}
                    {c.status === 'live' && (
                      <button onClick={(e) => { e.stopPropagation(); showToast(`${c.name} paused`, 'warning') }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors">
                        <Pause className="w-3 h-3" /> Pause
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); showToast(`Editing ${c.name}`, 'info') }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-400 bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); showToast(`${c.name} duplicated`, 'success') }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-400 bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
                      <Copy className="w-3 h-3" /> Duplicate
                    </button>
                  </div>
                </div>
              </AdminGlass>
            )
          })}
        </div>
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <AdminModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedCampaign(null) }}
          title={selectedCampaign.name}
          subtitle={`${selectedCampaign.id} - ${selectedCampaign.type.replace(/-/g, ' ')} campaign`}
          footer={
            <>
              <ModalButton onClick={() => { setModalOpen(false); setSelectedCampaign(null) }}>Close</ModalButton>
              <ModalButton variant="primary" onClick={() => showToast('Campaign editor opened', 'info')}>Edit Campaign</ModalButton>
            </>
          }
        >
          <CampaignDetailContent campaign={selectedCampaign} />
        </AdminModal>
      )}
    </div>
  )
}

function CampaignDetailContent({ campaign }: { campaign: MarketingCampaign }) {
  const cfg = CAMPAIGN_STATUS_CONFIG[campaign.status]
  const spendPct = campaign.budget > 0 ? Math.round((campaign.spend / campaign.budget) * 100) : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <AdminBadge label={cfg?.label || campaign.status} variant={cfg?.variant || 'neutral'} dot size="md" />
        <span className="text-xs text-gray-500 capitalize">{campaign.type.replace(/-/g, ' ')}</span>
      </div>
      {campaign.description && (
        <p className="text-sm text-gray-300 bg-white/[0.03] p-3 rounded-xl border border-white/[0.04]">{campaign.description}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Budget', value: formatINR(campaign.budget) },
          { label: 'Spend', value: formatINR(campaign.spend) },
          { label: 'Leads', value: campaign.leads.toString() },
          { label: 'ROI', value: `${campaign.roi}%` },
        ].map(item => (
          <div key={item.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">{item.label}</p>
            <p className="text-sm font-medium text-white mt-1">{item.value}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Budget Utilization</p>
        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
          <div className="h-full bg-brand-red/60 rounded-full" style={{ width: `${spendPct}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1">{spendPct}% utilized</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Start Date', value: campaign.startDate },
          { label: 'End Date', value: campaign.endDate || 'Ongoing' },
          { label: 'Owner', value: campaign.owner },
          { label: 'Channels', value: campaign.channels.join(', ') },
        ].map(item => (
          <div key={item.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">{item.label}</p>
            <p className="text-sm font-medium text-white mt-1 capitalize">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  SUB-TAB 3: CONTENT HUB
// ══════════════════════════════════════════════════════════════════
function ContentTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const contentStatuses = ['idea', 'draft', 'review', 'approved', 'scheduled', 'published'] as const
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const contentTypes = ['all', 'blog', 'social-post', 'email', 'infographic', 'video', 'brochure', 'landing-page']

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return MARKETING_CONTENT_DATA
    return MARKETING_CONTENT_DATA.filter(c => c.type === typeFilter)
  }, [typeFilter])

  const grouped = useMemo(() => {
    const map: Record<string, ContentItem[]> = {}
    contentStatuses.forEach(s => { map[s] = [] })
    filtered.forEach(c => { if (map[c.status]) map[c.status].push(c) })
    return map
  }, [filtered])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Content pipeline from ideation to publication</p>
        </div>
        <button onClick={() => showToast('Content creator launched', 'success')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors self-start admin-btn-press">
          <Plus className="w-4 h-4" />
          Create Content
        </button>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-1.5">
        {contentTypes.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              typeFilter === t
                ? 'bg-brand-red/20 text-white border-brand-red/30'
                : 'bg-white/[0.03] text-gray-500 border-white/[0.06] hover:bg-white/[0.06]'
            }`}
          >
            {t === 'all' ? 'All' : t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Kanban View */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-[1100px]">
          {contentStatuses.map(status => {
            const cfg = CONTENT_STATUS_CONFIG[status]
            const items = grouped[status] || []
            return (
              <div key={status} className="flex-1 min-w-[170px]">
                <div className={`p-3 rounded-t-xl border ${cfg.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-[10px] text-gray-500 bg-white/[0.06] px-1.5 py-0.5 rounded-full">{items.length}</span>
                  </div>
                </div>
                <div className="space-y-2 mt-2">
                  {items.map(item => (
                    <div key={item.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] cursor-pointer transition-all group">
                      <p className="text-xs font-medium text-white group-hover:text-brand-red transition-colors">{item.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <AdminBadge label={item.type.replace(/-/g, ' ')} variant="info" />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
                        <span>{item.author}</span>
                        {item.engagement && <span>{item.engagement.toLocaleString()} views</span>}
                      </div>
                      {item.scheduledDate && (
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-purple-400">
                          <Calendar className="w-3 h-3" />
                          <span>{item.scheduledDate}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="p-4 rounded-xl border border-dashed border-white/[0.06] text-center">
                      <p className="text-[10px] text-gray-600">No content</p>
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

// ══════════════════════════════════════════════════════════════════
//  SUB-TAB 4: AUDIENCE
// ══════════════════════════════════════════════════════════════════
function AudienceTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const totalContacts = AUDIENCE_SEGMENTS_DATA.reduce((s, seg) => s + seg.contactCount, 0)
  const dynamicSegments = AUDIENCE_SEGMENTS_DATA.filter(s => s.type === 'dynamic').length
  const staticSegments = AUDIENCE_SEGMENTS_DATA.filter(s => s.type === 'static').length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Audience Segments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage audience segments and contact lists</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.csv,.xlsx,.xls,.vcf'
            input.onchange = async () => {
              if (input.files && input.files.length > 0) {
                showToast(`Uploading ${input.files[0].name}...`, 'info')
                const result = await uploadFile(input.files[0], 'admin/contacts-import')
                if (result.success) showToast(`Imported contacts from ${input.files[0].name} via Supabase Storage`, 'success')
                else showToast(`Import failed: ${result.error}`, 'error')
              }
            }
            input.click()
          }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors admin-btn-press">
            <ArrowUpRight className="w-4 h-4" />
            Import
          </button>
          <button onClick={async () => {
            showToast('Exporting contacts...', 'info')
            const bom = '\uFEFF'
            const csv = `${bom}Name,Email,Phone,Segment,Status\nSample Contact,sample@email.com,+91 99999 00000,High Value,Active`
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
            const filename = `GHL_Contacts_Export_${new Date().toISOString().slice(0,10)}.csv`
            await saveBlobAs(blob, filename, showToast as any)
          }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors admin-btn-press">
            <ArrowDownRight className="w-4 h-4" />
            Export
          </button>
          <button onClick={() => showToast('Segment builder launched', 'success')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors admin-btn-press">
            <Plus className="w-4 h-4" />
            Create Segment
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Total Contacts" value={totalContacts.toLocaleString()} icon={Users} color="#3B82F6" delay={0} />
        <AdminKPICard title="Segments" value={AUDIENCE_SEGMENTS_DATA.length} icon={Layers} color="#8B5CF6" delay={50} />
        <AdminKPICard title="Dynamic" value={dynamicSegments} icon={Zap} color="#10B981" delay={100} />
        <AdminKPICard title="Static" value={staticSegments} icon={FileText} color="#F59E0B" delay={150} />
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {AUDIENCE_SEGMENTS_DATA.map((seg, i) => (
          <AdminGlass key={seg.id} padding="p-4" className="cursor-pointer group admin-card-enter">
            <div style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <AdminBadge label={seg.type === 'dynamic' ? 'Dynamic' : 'Static'} variant={seg.type === 'dynamic' ? 'info' : 'neutral'} />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-brand-red transition-colors">{seg.name}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{seg.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-white">{seg.contactCount.toLocaleString()}</span>
                <span className="text-[10px] text-gray-500">contacts</span>
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.04]">
                <p className="text-[10px] text-gray-600 font-mono">{seg.criteria}</p>
              </div>
              {seg.lastUsed && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Last used: {seg.lastUsed}</span>
                </div>
              )}
            </div>
          </AdminGlass>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  SUB-TAB 5: OUTREACH
// ══════════════════════════════════════════════════════════════════
function OutreachTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const channelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    email: Mail,
    whatsapp: MessageCircle,
    telegram: Send,
    sms: Smartphone,
    'multi-channel': Layers,
  }

  const channelStats = [
    { channel: 'Email', icon: Mail, sent: 4520, delivered: 4380, opened: 1420, replied: 348, color: '#3B82F6' },
    { channel: 'WhatsApp', icon: MessageCircle, sent: 1890, delivered: 1870, opened: 1650, replied: 892, color: '#25D366' },
    { channel: 'Telegram', icon: Send, sent: 980, delivered: 975, opened: 890, replied: 456, color: '#0088CC' },
    { channel: 'SMS', icon: Smartphone, sent: 2340, delivered: 2290, opened: 2050, replied: 125, color: '#F59E0B' },
    { channel: 'LinkedIn', icon: Linkedin, sent: 560, delivered: 545, opened: 312, replied: 89, color: '#0A66C2' },
    { channel: 'Push', icon: Bell, sent: 3200, delivered: 3100, opened: 1240, replied: 0, color: '#8B5CF6' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Outreach Sequences</h1>
          <p className="text-sm text-gray-500 mt-1">Manage automated outreach sequences across channels</p>
        </div>
        <button onClick={() => showToast('Sequence builder launched', 'success')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors self-start admin-btn-press">
          <Plus className="w-4 h-4" />
          New Sequence
        </button>
      </div>

      {/* Channel Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {channelStats.map(ch => {
          const Icon = ch.icon
          const openRate = ch.delivered > 0 ? Math.round((ch.opened / ch.delivered) * 100) : 0
          return (
            <AdminGlass key={ch.channel} padding="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${ch.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: ch.color }} />
                </div>
                <span className="text-xs font-semibold text-white">{ch.channel}</span>
              </div>
              <p className="text-lg font-bold text-white">{ch.sent.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">sent | {openRate}% opened</p>
            </AdminGlass>
          )
        })}
      </div>

      {/* Active Sequences */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-red" />
          Active Sequences
        </h3>
        <div className="space-y-3">
          {OUTREACH_SEQUENCES_DATA.map(seq => {
            const ChannelIcon = channelIcons[seq.channel] || Mail
            const completionPct = seq.enrolled > 0 ? Math.round((seq.completed / seq.enrolled) * 100) : 0
            return (
              <div key={seq.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <ChannelIcon className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{seq.name}</p>
                      <p className="text-[11px] text-gray-500 capitalize">{seq.channel.replace(/-/g, ' ')} - {seq.steps} steps</p>
                    </div>
                  </div>
                  <AdminBadge
                    label={seq.status === 'active' ? 'Active' : seq.status === 'paused' ? 'Paused' : 'Draft'}
                    variant={seq.status === 'active' ? 'success' : seq.status === 'paused' ? 'warning' : 'neutral'}
                    dot
                  />
                </div>
                <div className="grid grid-cols-4 gap-3 mt-3">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Enrolled</p>
                    <p className="text-sm font-semibold text-white">{seq.enrolled}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Completed</p>
                    <p className="text-sm font-semibold text-white">{seq.completed}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Response Rate</p>
                    <p className={`text-sm font-semibold ${seq.responseRate > 30 ? 'text-emerald-400' : seq.responseRate > 15 ? 'text-amber-400' : 'text-gray-400'}`}>{seq.responseRate}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Completion</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-brand-red/60 rounded-full" style={{ width: `${completionPct}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-500">{completionPct}%</span>
                    </div>
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

// ══════════════════════════════════════════════════════════════════
//  SUB-TAB 6: ANALYTICS
// ══════════════════════════════════════════════════════════════════
function AnalyticsTab() {
  const [attribution, setAttribution] = useState('last-touch')

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketing Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Performance analytics, attribution, and funnel insights</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Attribution:</span>
          {['last-touch', 'first-touch', 'linear', 'time-decay'].map(model => (
            <button
              key={model}
              onClick={() => setAttribution(model)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                attribution === model
                  ? 'bg-brand-red/20 text-white border-brand-red/30'
                  : 'bg-white/[0.03] text-gray-500 border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              {model.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead Generation Trend */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-red" />
            Lead Generation Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={LEAD_TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <defs>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#DC2626" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="leads" stroke="#DC2626" fill="url(#leadGrad)" strokeWidth={2} name="Leads" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminGlass>

        {/* Channel ROI Comparison */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-red" />
            Channel ROI Comparison
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHANNEL_ROI_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="channel" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="roi" name="ROI %" radius={[4, 4, 0, 0]} fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminGlass>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Campaign Type Distribution */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-brand-red" />
            Campaign Type Distribution
          </h3>
          <div className="h-64 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={CAMPAIGN_TYPE_DIST} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {CAMPAIGN_TYPE_DIST.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {CAMPAIGN_TYPE_DIST.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-400 flex-1">{item.name}</span>
                  <span className="text-xs font-semibold text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </AdminGlass>

        {/* Conversion Funnel */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-red" />
            Marketing Funnel
          </h3>
          <div className="space-y-3 py-2">
            {FUNNEL_DATA.map((stage, i) => {
              const width = Math.max(20, stage.pct)
              const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#F97316', '#DC2626']
              return (
                <div key={stage.stage} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-28 text-right flex-shrink-0">{stage.stage}</span>
                  <div className="flex-1 relative">
                    <div
                      className="h-8 rounded-lg flex items-center px-3 transition-all"
                      style={{ width: `${width}%`, backgroundColor: `${colors[i]}20`, borderLeft: `3px solid ${colors[i]}` }}
                    >
                      <span className="text-xs font-semibold text-white">{stage.count.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 w-10 flex-shrink-0">{stage.pct}%</span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
            <span className="text-[11px] text-gray-500">Overall Conversion Rate</span>
            <span className="text-sm font-bold text-emerald-400">0.95%</span>
          </div>
        </AdminGlass>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  SUB-TAB 7: AI TOOLS
// ══════════════════════════════════════════════════════════════════
function AIToolsTab({ navigate, showToast }: { navigate: (p: string) => void; showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTools = useMemo(() => {
    let tools = MARKETING_AI_TOOLS
    if (categoryFilter !== 'all') tools = tools.filter(t => t.category === categoryFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      tools = tools.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    }
    return tools
  }, [categoryFilter, searchQuery])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: MARKETING_AI_TOOLS.length }
    MARKETING_AI_TOOLS.forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1 })
    return counts
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-red" />
          Marketing AI Tools
        </h1>
        <p className="text-sm text-gray-500 mt-1">18 AI-powered tools for marketing intelligence and automation</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Active Tools" value={`${MARKETING_AI_TOOLS.filter(t => t.status === 'active').length}/${MARKETING_AI_TOOLS.length}`} icon={Zap} color="#10B981" delay={0} />
        <AdminKPICard title="Total AI Runs" value="2,340" icon={Activity} color="#3B82F6" delay={50} />
        <AdminKPICard title="Content Generated" value="186" icon={FileText} color="#8B5CF6" delay={100} />
        <AdminKPICard title="Time Saved" value="92 hrs" icon={Clock} color="#DC2626" delay={150} />
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search AI tools..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 admin-input-glow"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...Object.keys(AI_CATEGORY_CONFIG)].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                categoryFilter === cat
                  ? 'bg-brand-red/20 text-white border-brand-red/30'
                  : 'bg-white/[0.03] text-gray-500 border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              {cat === 'all' ? `All (${categoryCounts.all})` : `${AI_CATEGORY_CONFIG[cat]?.label} (${categoryCounts[cat] || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTools.map((tool, i) => {
          const Icon = AI_ICON_MAP[tool.icon] || Sparkles
          const catConfig = AI_CATEGORY_CONFIG[tool.category]
          return (
            <AdminGlass key={tool.id} padding="p-4" className="cursor-pointer group admin-card-enter">
              <div style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl border ${catConfig?.bgColor || 'bg-white/[0.04] border-white/[0.06]'}`}>
                    <Icon className={`w-5 h-5 ${catConfig?.color || 'text-gray-400'}`} />
                  </div>
                  <AdminBadge
                    label={tool.status === 'active' ? 'Active' : tool.status === 'beta' ? 'Beta' : 'Soon'}
                    variant={tool.status === 'active' ? 'success' : tool.status === 'beta' ? 'warning' : 'neutral'}
                    dot
                  />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-brand-red transition-colors">{tool.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tool.description}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${catConfig?.color || 'text-gray-500'}`}>
                    {catConfig?.label || tool.category}
                  </span>
                  <button
                    onClick={() => {
                      if (tool.status === 'coming-soon') {
                        showToast(`${tool.name} will be available soon`, 'info')
                      } else {
                        showToast(`${tool.name} launched`, 'success')
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      tool.status === 'coming-soon'
                        ? 'text-gray-600 bg-white/[0.02] cursor-not-allowed'
                        : 'text-brand-red bg-brand-red/10 hover:bg-brand-red/20'
                    }`}
                  >
                    Launch
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </AdminGlass>
          )
        })}
      </div>

      {filteredTools.length === 0 && (
        <AdminGlass className="text-center py-12">
          <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No tools match your search</p>
        </AdminGlass>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  SUB-TAB 8: INTEGRATIONS
// ══════════════════════════════════════════════════════════════════
function IntegrationsTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return INTEGRATION_SERVICES_DATA
    return INTEGRATION_SERVICES_DATA.filter(s => s.category === categoryFilter)
  }, [categoryFilter])

  const connected = INTEGRATION_SERVICES_DATA.filter(s => s.status === 'connected').length
  const pending = INTEGRATION_SERVICES_DATA.filter(s => s.status === 'pending').length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Link2 className="w-6 h-6 text-brand-red" />
            Integrations
          </h1>
          <p className="text-sm text-gray-500 mt-1">Connected services and data synchronization</p>
        </div>
        <button onClick={() => showToast('Integration marketplace opened', 'success')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors self-start admin-btn-press">
          <Plus className="w-4 h-4" />
          Add Integration
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Total Integrations" value={INTEGRATION_SERVICES_DATA.length} icon={Link2} color="#3B82F6" delay={0} />
        <AdminKPICard title="Connected" value={connected} icon={CheckCircle2} color="#10B981" delay={50} />
        <AdminKPICard title="Pending" value={pending} icon={Clock} color="#F59E0B" delay={100} />
        <AdminKPICard title="Data Sync Rate" value="99.2%" icon={RefreshCw} color="#8B5CF6" delay={150} />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-1.5">
        {['all', ...Object.keys(INTEGRATION_CATEGORY_CONFIG)].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              categoryFilter === cat
                ? 'bg-brand-red/20 text-white border-brand-red/30'
                : 'bg-white/[0.03] text-gray-500 border-white/[0.06] hover:bg-white/[0.06]'
            }`}
          >
            {cat === 'all' ? 'All' : INTEGRATION_CATEGORY_CONFIG[cat]}
          </button>
        ))}
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((svc, i) => {
          const Icon = INTEGRATION_ICON_MAP[svc.icon] || Globe
          const statusColor = svc.status === 'connected' ? '#10B981' : svc.status === 'disconnected' ? '#EF4444' : '#F59E0B'
          const statusLabel = svc.status === 'connected' ? 'Connected' : svc.status === 'disconnected' ? 'Disconnected' : 'Pending'
          const statusVariant = svc.status === 'connected' ? 'success' as const : svc.status === 'disconnected' ? 'error' as const : 'warning' as const
          return (
            <AdminGlass key={svc.id} padding="p-4" className="group admin-card-enter">
              <div style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl border border-white/[0.08]" style={{ backgroundColor: `${statusColor}10` }}>
                    <Icon className="w-5 h-5" style={{ color: statusColor }} />
                  </div>
                  <AdminBadge label={statusLabel} variant={statusVariant} dot />
                </div>
                <h3 className="text-sm font-semibold text-white">{svc.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{svc.dataFlowing}</p>
                {svc.lastSync && (
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>Last sync: {new Date(svc.lastSync).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                  <button onClick={() => showToast(`Configuring ${svc.name}`, 'info')} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-400 bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
                    <Settings className="w-3 h-3" /> Configure
                  </button>
                  {svc.status !== 'connected' && (
                    <button onClick={() => showToast(`Reconnecting ${svc.name}`, 'info')} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                      <RefreshCw className="w-3 h-3" /> Reconnect
                    </button>
                  )}
                  <button onClick={() => showToast(`${svc.name} sync logs opened`, 'info')} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-400 bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
                    <Eye className="w-3 h-3" /> Logs
                  </button>
                </div>
              </div>
            </AdminGlass>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  SUB-TAB 9: SETTINGS
// ══════════════════════════════════════════════════════════════════
function SettingsTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [emailNotif, setEmailNotif] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(true)
  const [autoArchive, setAutoArchive] = useState(false)
  const [utmEnforce, setUtmEnforce] = useState(true)
  const [brandConsistency, setBrandConsistency] = useState(true)
  const [dataRetention, setDataRetention] = useState('12')

  const toggleSwitch = (value: boolean, setter: (v: boolean) => void, label: string) => {
    setter(!value)
    showToast(`${label} ${!value ? 'enabled' : 'disabled'}`, 'success')
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-red" />
          Marketing Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Configure marketing module preferences and defaults</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Company / Brand */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4">Company Details</h3>
          <div className="space-y-3">
            {[
              { label: 'Company Name', value: 'GHL India Ventures Pvt Ltd' },
              { label: 'Brand Name', value: 'GHL India Ventures' },
              { label: 'Primary Domain', value: 'ghlindia.com' },
              { label: 'Support Email', value: 'marketing@ghlindia.com' },
              { label: 'SEBI Reg. No.', value: 'INP000012345' },
            ].map(field => (
              <div key={field.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-xs text-gray-500">{field.label}</span>
                <span className="text-sm font-medium text-white">{field.value}</span>
              </div>
            ))}
          </div>
        </AdminGlass>

        {/* Brand Kit */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4">Brand Kit</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-xs text-gray-500">Primary Color</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#DC2626]" />
                <span className="text-sm font-mono text-white">#DC2626</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-xs text-gray-500">Secondary Color</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#0A0A0A]" />
                <span className="text-sm font-mono text-white">#0A0A0A</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-xs text-gray-500">Font Family</span>
              <span className="text-sm font-medium text-white">Inter + Space Grotesk</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-xs text-gray-500">Logo Variants</span>
              <span className="text-sm font-medium text-white">3 uploaded</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-xs text-gray-500">Tone of Voice</span>
              <span className="text-sm font-medium text-white">Professional, Trustworthy</span>
            </div>
          </div>
        </AdminGlass>

        {/* UTM & Tracking */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4">UTM Conventions</h3>
          <div className="space-y-3">
            {[
              { label: 'Source Format', value: 'ghlindia_{platform}' },
              { label: 'Medium Format', value: '{channel_type}' },
              { label: 'Campaign Format', value: '{year}_{quarter}_{campaign_name}' },
              { label: 'Content Format', value: '{variant}_{placement}' },
            ].map(field => (
              <div key={field.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-xs text-gray-500">{field.label}</span>
                <span className="text-xs font-mono text-gray-300">{field.value}</span>
              </div>
            ))}
          </div>
        </AdminGlass>

        {/* Toggles */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4">Preferences</h3>
          <div className="space-y-3">
            {[
              { label: 'Email Notifications', desc: 'Get notified on campaign events', value: emailNotif, setter: setEmailNotif },
              { label: 'Weekly Performance Report', desc: 'Auto-generate weekly marketing report', value: weeklyReport, setter: setWeeklyReport },
              { label: 'Auto-archive Campaigns', desc: 'Archive completed campaigns after 30 days', value: autoArchive, setter: setAutoArchive },
              { label: 'Enforce UTM Parameters', desc: 'Require UTM tags on all external links', value: utmEnforce, setter: setUtmEnforce },
              { label: 'Brand Consistency Check', desc: 'AI checks all content against brand guidelines', value: brandConsistency, setter: setBrandConsistency },
            ].map(toggle => (
              <div key={toggle.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <p className="text-sm text-white">{toggle.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{toggle.desc}</p>
                </div>
                <button
                  onClick={() => toggleSwitch(toggle.value, toggle.setter, toggle.label)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${toggle.value ? 'bg-brand-red/60' : 'bg-white/[0.1]'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${toggle.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Data Retention</p>
                <p className="text-[11px] text-gray-500 mt-0.5">How long to keep campaign analytics data</p>
              </div>
              <select
                value={dataRetention}
                onChange={e => { setDataRetention(e.target.value); showToast(`Data retention set to ${e.target.value} months`, 'success') }}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red/40"
              >
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
                <option value="36">36 months</option>
              </select>
            </div>
          </div>
        </AdminGlass>

        {/* Compliance Defaults */}
        <AdminGlass className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">Compliance Defaults</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Disclaimer Required', value: 'All investor-facing content', icon: ShieldCheck },
              { label: 'SEBI Compliance', value: 'Auto-append to all communications', icon: FileText },
              { label: 'Unsubscribe Link', value: 'Mandatory on all email campaigns', icon: Mail },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <Icon className="w-5 h-5 text-brand-red mb-2" />
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-[11px] text-gray-500 mt-1">{item.value}</p>
                </div>
              )
            })}
          </div>
        </AdminGlass>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={() => showToast('Marketing settings saved', 'success')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors admin-btn-press"
        >
          <CheckCircle2 className="w-4 h-4" />
          Save Settings
        </button>
      </div>
    </div>
  )
}
