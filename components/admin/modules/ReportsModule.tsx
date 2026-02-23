'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  FileBarChart, BarChart3, TrendingUp, PieChart, Download, Calendar, Filter,
  ArrowUpRight, ArrowDownRight, IndianRupee, Users, Target, Clock, Activity,
  Brain, Star, Globe, Sparkles, Mail, Phone, FolderOpen, Settings, Plus,
  Search, Send, ChevronRight, AlertTriangle, CheckCircle, XCircle, Eye,
  FileText, Layers, Zap, GripVertical, Save, Share2, Play, Pause,
  MessageSquare, PhoneCall, PhoneIncoming, PhoneOutgoing, Upload, File,
  Shield, Bell, Gauge, Mic, type LucideIcon,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RePieChart,
  Pie, Cell, Legend,
} from 'recharts'
import AdminGlass from '../shared/AdminGlass'
import AdminKPICard from '../shared/AdminKPICard'
import {
  formatINRCompact, getClientsByTier,
} from '@/lib/admin/reportsData'
import { callClaudeAPI, type ClaudeMessage } from '@/lib/admin/claudeApi'
import { useReportsLiveData, ReportsDataContext, useReportsDataContext } from '@/lib/admin/useReportsLiveData'

// ── Constants ────────────────────────────────────────────────
const CHART_COLORS = ['#DC2626', '#D4AF37', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']
const TT = { backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }
const TL = { color: '#fff' }

const TABS = [
  { id: 'dashboard', label: 'Command Center', icon: BarChart3 },
  { id: 'builder', label: 'Report Builder', icon: FileBarChart },
  { id: 'financial', label: 'Financial Intel', icon: IndianRupee },
  { id: 'marketing', label: 'Marketing', icon: Target },
  { id: 'ai-advisor', label: 'AI Advisor', icon: Brain },
  { id: 'emailer', label: 'Emailer', icon: Mail },
  { id: 'dialer', label: 'Calls', icon: Phone },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'rpt-settings', label: 'Settings', icon: Settings },
] as const

type TabId = typeof TABS[number]['id']

interface Props {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

// ═══════════════════════════════════════════════════════════════
// MAIN MODULE
// ═══════════════════════════════════════════════════════════════

export default function ReportsModule({ subTab, navigate, showToast }: Props) {
  const activeTab = (TABS.some(t => t.id === subTab) ? subTab : 'dashboard') as TabId
  const liveData = useReportsLiveData()

  const handleTabClick = (tabId: string) => {
    navigate(tabId === 'dashboard' ? 'reports' : `reports/${tabId}`)
  }

  return (
    <ReportsDataContext.Provider value={liveData}>
    <div className="space-y-6 admin-section-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Intelligence OS</h1>
          <p className="text-sm text-gray-500 mt-1">GHL Intelligence Command Center &mdash; AI-powered business analytics{liveData.isLiveData ? ' · Live' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => showToast('Generating dashboard export...', 'info')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors admin-btn-press">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-x-auto scrollbar-hide">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => handleTabClick(tab.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all duration-300 whitespace-nowrap ${isActive ? 'bg-brand-red/20 text-white border border-brand-red/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'}`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="admin-tab-switch">
        {activeTab === 'dashboard' && <DashboardTab navigate={navigate} showToast={showToast} />}
        {activeTab === 'builder' && <BuilderTab showToast={showToast} />}
        {activeTab === 'financial' && <FinancialTab showToast={showToast} />}
        {activeTab === 'marketing' && <MarketingTab showToast={showToast} />}
        {activeTab === 'ai-advisor' && <AIAdvisorTab showToast={showToast} />}
        {activeTab === 'emailer' && <EmailerTab showToast={showToast} />}
        {activeTab === 'dialer' && <DialerTab showToast={showToast} />}
        {activeTab === 'documents' && <DocumentsTab showToast={showToast} />}
        {activeTab === 'rpt-settings' && <SettingsTab showToast={showToast} />}
      </div>
    </div>
    </ReportsDataContext.Provider>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 1: DASHBOARD (Command Center)
// ═══════════════════════════════════════════════════════════════

function DashboardTab({ navigate, showToast }: { navigate: (p: string) => void; showToast: Props['showToast'] }) {
  const { REPORT_KPIS, MONTHLY_REVENUE, REVENUE_BY_TYPE, LEAD_FUNNEL, CAMPAIGN_METRICS, STAFF_ACTIVITY, GENERATED_REPORTS, AI_INSIGHTS } = useReportsDataContext()
  const [clock, setClock] = useState('')
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="space-y-6">
      {/* AI Insight Strip */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-red/10 via-purple-500/10 to-blue-500/10 animate-pulse" />
        <div className="relative bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex items-center gap-4">
          <div className="p-2 rounded-xl bg-brand-red/20"><Brain className="w-5 h-5 text-brand-red" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-brand-red font-semibold uppercase tracking-wider mb-1">AI Insight</p>
            <p className="text-sm text-gray-300 truncate">{AI_INSIGHTS[0].summary}</p>
          </div>
          <button onClick={() => navigate('reports/ai-advisor')} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-red bg-brand-red/10 border border-brand-red/20 hover:bg-brand-red/20 transition-colors">
            View All <ChevronRight className="w-3 h-3 inline" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard title="Total Revenue" value={formatINRCompact(REPORT_KPIS.monthlyRevenue)} subtitle="This month" trend="up" trendValue={`${REPORT_KPIS.revenueChange}%`} icon={IndianRupee} color="#DC2626" delay={0} />
        <AdminKPICard title="Active Clients" value={REPORT_KPIS.activeClients} subtitle={`${REPORT_KPIS.newClientsMonth} new this month`} trend="up" trendValue={`${REPORT_KPIS.retentionRate}% retention`} icon={Users} color="#3B82F6" delay={100} />
        <AdminKPICard title="Staff Productivity" value={`${REPORT_KPIS.staffProductivityScore}/100`} subtitle="Composite index" trend="up" trendValue="+4.2 pts" icon={Activity} color="#10B981" delay={200} />
        <AdminKPICard title="AI Health Score" value={`${REPORT_KPIS.aiHealthScore}/100`} subtitle="System-wide health" trend="up" trendValue="Optimal" icon={Brain} color="#8B5CF6" delay={300} />
      </div>

      {/* Three Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Revenue */}
        <div className="space-y-4">
          <AdminGlass>
            <h3 className="text-sm font-semibold text-white mb-4">Revenue Trend (12M)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={MONTHLY_REVENUE}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickFormatter={v => `${(v / 10000000).toFixed(0)}Cr`} />
                <Tooltip contentStyle={TT} labelStyle={TL} formatter={(v: number | undefined) => formatINRCompact(v ?? 0)} />
                <Area type="monotone" dataKey="revenue" stroke="#DC2626" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </AdminGlass>
          <AdminGlass>
            <h3 className="text-sm font-semibold text-white mb-4">Revenue by Source</h3>
            <ResponsiveContainer width="100%" height={180}>
              <RePieChart>
                <Pie data={REVENUE_BY_TYPE} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="amount">
                  {REVENUE_BY_TYPE.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={TT} labelStyle={TL} formatter={(v: number | undefined) => formatINRCompact(v ?? 0)} />
              </RePieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {REVENUE_BY_TYPE.map((r, i) => (
                <div key={r.type} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} /><span className="text-gray-400">{r.type}</span></div>
                  <span className="text-white font-medium">{r.percentage}%</span>
                </div>
              ))}
            </div>
          </AdminGlass>
        </div>

        {/* Column 2: Leads & Campaigns */}
        <div className="space-y-4">
          <AdminGlass>
            <h3 className="text-sm font-semibold text-white mb-4">Lead Conversion Funnel</h3>
            <div className="space-y-2">
              {LEAD_FUNNEL.map((stage, i) => (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">{stage.stage}</span>
                    <span className="text-white font-medium">{stage.count.toLocaleString()}</span>
                  </div>
                  <div className="h-5 rounded-lg overflow-hidden bg-white/[0.04]" style={{ width: `${Math.max(stage.percentage, 15)}%`, marginLeft: `${(100 - Math.max(stage.percentage, 15)) / 2}%` }}>
                    <div className="h-full rounded-lg" style={{ backgroundColor: CHART_COLORS[i], width: '100%' }} />
                  </div>
                </div>
              ))}
            </div>
          </AdminGlass>
          <AdminGlass>
            <h3 className="text-sm font-semibold text-white mb-3">Top Campaigns</h3>
            <div className="space-y-3">
              {CAMPAIGN_METRICS.slice(0, 4).map(c => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white font-medium truncate">{c.name}</p>
                    <p className="text-[10px] text-gray-500">{c.platform} &middot; {formatINRCompact(c.spend)} spend</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-xs text-emerald-400 font-semibold">{((c.revenueGenerated / c.spend) * 100 / 100).toFixed(1)}x ROI</p>
                    <p className="text-[10px] text-gray-500">{c.conversions} conv.</p>
                  </div>
                </div>
              ))}
            </div>
          </AdminGlass>
        </div>

        {/* Column 3: Activity & Reports */}
        <div className="space-y-4">
          <AdminGlass>
            <h3 className="text-sm font-semibold text-white mb-3">Staff Activity</h3>
            <div className="space-y-3">
              {STAFF_ACTIVITY.slice(0, 6).map(a => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white"><span className="font-medium">{a.staffName}</span> {a.action}</p>
                    <p className="text-[10px] text-gray-500">{a.entity} &middot; {new Date(a.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          </AdminGlass>
          <AdminGlass>
            <h3 className="text-sm font-semibold text-white mb-3">Recent Reports</h3>
            <div className="space-y-2.5">
              {GENERATED_REPORTS.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-white truncate">{r.name}</p>
                      <p className="text-[10px] text-gray-500">{r.size} &middot; {r.format.toUpperCase()}</p>
                    </div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-gray-500 hover:text-white flex-shrink-0" />
                </div>
              ))}
            </div>
          </AdminGlass>
        </div>
      </div>

      {/* Quick Actions + Clock */}
      <AdminGlass padding="p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {[{ label: 'Generate Report', icon: FileBarChart }, { label: 'Send Bulk Email', icon: Mail }, { label: 'Schedule Call', icon: Phone }, { label: 'Export Dashboard', icon: Download }].map(a => (
              <button key={a.label} onClick={() => showToast(`${a.label} initiated`, 'info')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-colors admin-btn-press">
                <a.icon className="w-3 h-3" /> {a.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{clock} IST</span>
          </div>
        </div>
      </AdminGlass>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 2: REPORT BUILDER
// ═══════════════════════════════════════════════════════════════

interface BuilderBlock { id: string; type: string; label: string; icon: LucideIcon; category: string }

const PALETTE_BLOCKS: BuilderBlock[] = [
  { id: 'kpi', type: 'kpi', label: 'KPI Card', icon: Gauge, category: 'Data' },
  { id: 'table', type: 'table', label: 'Data Table', icon: Layers, category: 'Data' },
  { id: 'chart', type: 'chart', label: 'Chart Block', icon: BarChart3, category: 'Data' },
  { id: 'comparison', type: 'comparison', label: 'Comparison', icon: ArrowUpRight, category: 'Data' },
  { id: 'text', type: 'text', label: 'Text / Heading', icon: FileText, category: 'Content' },
  { id: 'divider', type: 'divider', label: 'Divider', icon: GripVertical, category: 'Content' },
  { id: 'logo', type: 'logo', label: 'GHL Logo', icon: Star, category: 'Content' },
  { id: 'ai-summary', type: 'ai-summary', label: 'AI Summary', icon: Brain, category: 'AI' },
  { id: 'ai-forecast', type: 'ai-forecast', label: 'AI Forecast', icon: TrendingUp, category: 'AI' },
  { id: 'ai-recs', type: 'ai-recs', label: 'AI Recommendations', icon: Sparkles, category: 'AI' },
]

const REPORT_TEMPLATES = [
  'Monthly Board Report', 'Quarterly Investor Update', 'Campaign Performance Review',
  'Staff Productivity Report', 'Financial P&L Report', 'Client Portfolio Summary',
  'Compliance Audit Report', 'Annual Review Pack',
]

function BuilderTab({ showToast }: { showToast: Props['showToast'] }) {
  const [canvasBlocks, setCanvasBlocks] = useState<{ id: string; block: BuilderBlock }[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reportTitle, setReportTitle] = useState('Untitled Report')
  const [draggedBlock, setDraggedBlock] = useState<BuilderBlock | null>(null)

  const categories = useMemo(() => {
    const cats = new Map<string, BuilderBlock[]>()
    PALETTE_BLOCKS.forEach(b => { const arr = cats.get(b.category) || []; arr.push(b); cats.set(b.category, arr) })
    return cats
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (draggedBlock) {
      setCanvasBlocks(prev => [...prev, { id: `${draggedBlock.id}-${Date.now()}`, block: draggedBlock }])
      setDraggedBlock(null)
      showToast(`Added ${draggedBlock.label}`, 'success')
    }
  }, [draggedBlock, showToast])

  const removeBlock = (id: string) => {
    setCanvasBlocks(prev => prev.filter(b => b.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <AdminGlass padding="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <input value={reportTitle} onChange={e => setReportTitle(e.target.value)} className="bg-transparent border-none text-white font-semibold text-sm focus:outline-none focus:ring-0 w-48" />
          </div>
          <div className="flex gap-2">
            {[{ label: 'Save', icon: Save }, { label: 'Preview', icon: Eye }, { label: 'Export', icon: Download }, { label: 'Share', icon: Share2 }].map(a => (
              <button key={a.label} onClick={() => showToast(`${a.label}: ${reportTitle}`, 'info')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors admin-btn-press">
                <a.icon className="w-3 h-3" /> {a.label}
              </button>
            ))}
          </div>
        </div>
      </AdminGlass>

      {/* Template Starters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {REPORT_TEMPLATES.map(t => (
          <button key={t} onClick={() => { setReportTitle(t); showToast(`Template loaded: ${t}`, 'success') }} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 bg-white/[0.03] border border-white/[0.06] hover:border-brand-red/30 hover:text-white transition-colors">
            {t}
          </button>
        ))}
      </div>

      {/* Builder Layout */}
      <div className="grid grid-cols-12 gap-4 min-h-[600px]">
        {/* Left: Component Palette */}
        <div className="col-span-12 lg:col-span-2">
          <AdminGlass>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Components</h4>
            {Array.from(categories.entries()).map(([cat, blocks]) => (
              <div key={cat} className="mb-4">
                <p className="text-[10px] text-gray-500 uppercase mb-2">{cat}</p>
                <div className="space-y-1">
                  {blocks.map(b => (
                    <div key={b.id} draggable onDragStart={() => setDraggedBlock(b)} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] transition-colors cursor-grab active:cursor-grabbing border border-transparent hover:border-white/[0.08]">
                      <b.icon className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-300">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </AdminGlass>
        </div>

        {/* Center: Canvas */}
        <div className="col-span-12 lg:col-span-7">
          <div onDragOver={e => e.preventDefault()} onDrop={handleDrop} className="min-h-[600px] rounded-2xl border-2 border-dashed border-white/[0.08] bg-white/[0.01] p-6 transition-colors hover:border-brand-red/20">
            {canvasBlocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="p-4 rounded-2xl bg-white/[0.04] mb-4"><Layers className="w-8 h-8 text-gray-600" /></div>
                <p className="text-sm text-gray-500 mb-1">Drag blocks here to build your report</p>
                <p className="text-xs text-gray-600">Or select a template above to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {canvasBlocks.map(({ id, block }) => (
                  <div key={id} onClick={() => setSelectedId(id)} className={`relative p-4 rounded-xl border transition-all cursor-pointer group ${selectedId === id ? 'border-brand-red/40 bg-brand-red/5' : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-gray-600 cursor-grab" />
                        <block.icon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-white">{block.label}</span>
                        <span className="text-[10px] text-gray-600 uppercase">{block.category}</span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); removeBlock(id) }} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"><XCircle className="w-4 h-4" /></button>
                    </div>
                    <div className="mt-3 h-16 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
                      <span className="text-xs text-gray-600">{block.type === 'chart' ? '📊 Chart Preview' : block.type === 'kpi' ? '📈 KPI Data' : block.type === 'table' ? '📋 Table Data' : `${block.label} content`}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Properties Inspector */}
        <div className="col-span-12 lg:col-span-3">
          <AdminGlass>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Properties</h4>
            {selectedId ? (
              <div className="space-y-4">
                <div><label className="text-[10px] text-gray-500 uppercase">Block Title</label><input className="w-full mt-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-brand-red/40" placeholder="Enter title..." /></div>
                <div><label className="text-[10px] text-gray-500 uppercase">Data Source</label><select className="w-full mt-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 focus:outline-none"><option>Revenue Data</option><option>Client Data</option><option>Campaign Data</option><option>Staff Data</option></select></div>
                <div><label className="text-[10px] text-gray-500 uppercase">Date Range</label><select className="w-full mt-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 focus:outline-none"><option>This Month</option><option>This Quarter</option><option>This Year</option><option>Last 12 Months</option></select></div>
                <div><label className="text-[10px] text-gray-500 uppercase">Chart Type</label><select className="w-full mt-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 focus:outline-none"><option>Area Chart</option><option>Bar Chart</option><option>Line Chart</option><option>Pie Chart</option><option>Donut Chart</option></select></div>
              </div>
            ) : (
              <div className="text-center py-8"><Eye className="w-6 h-6 text-gray-600 mx-auto mb-2" /><p className="text-xs text-gray-500">Select a block on the canvas to edit its properties</p></div>
            )}
          </AdminGlass>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 3: FINANCIAL INTELLIGENCE
// ═══════════════════════════════════════════════════════════════

function FinancialTab({ showToast }: { showToast: Props['showToast'] }) {
  const { REPORT_KPIS, REVENUE_BY_TYPE, REVENUE_BY_CITY, EXPENSE_SUMMARY, REVENUE_FORECAST } = useReportsDataContext()
  const [mktBudget, setMktBudget] = useState(0)
  const [staffDelta, setStaffDelta] = useState(0)

  const tierData = useMemo(() => getClientsByTier(), [])
  const projectedRevenue = REPORT_KPIS.monthlyRevenue * (1 + mktBudget / 200) * (1 + staffDelta / 50)

  return (
    <div className="space-y-6">
      {/* Revenue Command */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Revenue Command</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <AdminKPICard title="Monthly Revenue" value={formatINRCompact(REPORT_KPIS.monthlyRevenue)} trend="up" trendValue={`${REPORT_KPIS.revenueChange}%`} icon={IndianRupee} color="#DC2626" />
          <AdminKPICard title="Net Profit" value={formatINRCompact(REPORT_KPIS.netProfit)} trend="up" trendValue={`${REPORT_KPIS.profitMargin}% margin`} icon={TrendingUp} color="#10B981" />
          <AdminKPICard title="Total AUM" value={formatINRCompact(REPORT_KPIS.totalAUM)} trend="up" trendValue={`${REPORT_KPIS.totalAUMChange}% YoY`} icon={Globe} color="#3B82F6" />
          <AdminKPICard title="Cash Runway" value={`${REPORT_KPIS.cashRunway} months`} subtitle="At current burn rate" icon={Clock} color="#D4AF37" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AdminGlass>
            <h3 className="text-sm font-semibold text-white mb-4">Revenue by Stream</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={REVENUE_BY_TYPE} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={v => formatINRCompact(v)} />
                <YAxis dataKey="type" type="category" tick={{ fill: '#6B7280', fontSize: 9 }} width={120} />
                <Tooltip contentStyle={TT} labelStyle={TL} formatter={(v: number | undefined) => formatINRCompact(v ?? 0)} />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                  {REVENUE_BY_TYPE.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </AdminGlass>
          <AdminGlass>
            <h3 className="text-sm font-semibold text-white mb-4">Revenue by Geography</h3>
            <div className="space-y-3">
              {REVENUE_BY_CITY.map((c, i) => (
                <div key={c.city}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-400">{c.city}</span>
                    <span className="text-white font-medium">{formatINRCompact(c.amount)} ({c.clients} clients)</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(c.amount / 45000000) * 100}%`, backgroundColor: CHART_COLORS[i] }} />
                  </div>
                </div>
              ))}
            </div>
          </AdminGlass>
        </div>
      </div>

      {/* Expenditure */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Expenditure Tracker</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {EXPENSE_SUMMARY.slice(0, 4).map((e, i) => (
            <AdminGlass key={e.category}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{e.category}</p>
              <p className="text-lg font-bold text-white mt-1">{formatINRCompact(e.amount)}</p>
              <div className="mt-2 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(e.amount / e.budget) * 100}%`, backgroundColor: (e.amount / e.budget) > 0.9 ? '#EF4444' : CHART_COLORS[i] }} />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{formatINRCompact(e.budget)} budget &middot; {((e.amount / e.budget) * 100).toFixed(0)}% used</p>
            </AdminGlass>
          ))}
        </div>
      </div>

      {/* Profitability */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Profitability Engine</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminGlass>
            <p className="text-[10px] text-gray-500 uppercase">CAC</p>
            <p className="text-xl font-bold text-white mt-1">{formatINRCompact(REPORT_KPIS.cac)}</p>
            <p className="text-xs text-gray-500 mt-1">Per client acquisition</p>
          </AdminGlass>
          <AdminGlass>
            <p className="text-[10px] text-gray-500 uppercase">LTV</p>
            <p className="text-xl font-bold text-white mt-1">{formatINRCompact(REPORT_KPIS.ltv)}</p>
            <p className="text-xs text-gray-500 mt-1">Lifetime value</p>
          </AdminGlass>
          <AdminGlass>
            <p className="text-[10px] text-gray-500 uppercase">LTV:CAC Ratio</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{REPORT_KPIS.ltvCacRatio}x</p>
            <p className="text-xs text-gray-500 mt-1">Target: &gt;3x</p>
          </AdminGlass>
          <AdminGlass>
            <p className="text-[10px] text-gray-500 uppercase">NPS Score</p>
            <p className="text-xl font-bold text-blue-400 mt-1">{REPORT_KPIS.nps}</p>
            <p className="text-xs text-gray-500 mt-1">Net promoter score</p>
          </AdminGlass>
        </div>
      </div>

      {/* Revenue Forecast */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4">Revenue Forecast (Next 6 Months)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={REVENUE_FORECAST}>
            <defs>
              <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 10 }} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={v => `${(v / 10000000).toFixed(1)}Cr`} />
            <Tooltip contentStyle={TT} labelStyle={TL} formatter={(v: number | undefined) => formatINRCompact(v ?? 0)} />
            <Area type="monotone" dataKey="upper" stroke="transparent" fill="rgba(139,92,246,0.1)" />
            <Area type="monotone" dataKey="projected" stroke="#8B5CF6" fill="url(#fcGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="lower" stroke="transparent" fill="rgba(139,92,246,0.05)" />
          </AreaChart>
        </ResponsiveContainer>
      </AdminGlass>

      {/* What-If Simulator */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-400" /> What-If Simulator</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">Increase marketing budget</span><span className="text-white">{mktBudget > 0 ? '+' : ''}{mktBudget}%</span></div>
              <input type="range" min={-50} max={100} value={mktBudget} onChange={e => setMktBudget(+e.target.value)} className="w-full accent-brand-red" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">Staff count change</span><span className="text-white">{staffDelta > 0 ? '+' : ''}{staffDelta}</span></div>
              <input type="range" min={-5} max={10} value={staffDelta} onChange={e => setStaffDelta(+e.target.value)} className="w-full accent-brand-red" />
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="grid grid-cols-3 gap-3">
              <AdminGlass padding="p-3">
                <p className="text-[10px] text-gray-500">Projected Revenue</p>
                <p className="text-lg font-bold text-white">{formatINRCompact(projectedRevenue)}</p>
                <p className={`text-xs ${projectedRevenue > REPORT_KPIS.monthlyRevenue ? 'text-emerald-400' : 'text-red-400'}`}>
                  {projectedRevenue > REPORT_KPIS.monthlyRevenue ? '↑' : '↓'} {((projectedRevenue / REPORT_KPIS.monthlyRevenue - 1) * 100).toFixed(1)}%
                </p>
              </AdminGlass>
              <AdminGlass padding="p-3">
                <p className="text-[10px] text-gray-500">Projected Expenses</p>
                <p className="text-lg font-bold text-white">{formatINRCompact(REPORT_KPIS.monthlyExpenses * (1 + mktBudget / 300) + staffDelta * 85000)}</p>
              </AdminGlass>
              <AdminGlass padding="p-3">
                <p className="text-[10px] text-gray-500">Projected Margin</p>
                <p className="text-lg font-bold text-emerald-400">{(((projectedRevenue - (REPORT_KPIS.monthlyExpenses * (1 + mktBudget / 300) + staffDelta * 85000)) / projectedRevenue) * 100).toFixed(1)}%</p>
              </AdminGlass>
            </div>
          </div>
        </div>
      </AdminGlass>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 4: MARKETING ANALYTICS
// ═══════════════════════════════════════════════════════════════

function MarketingTab({ showToast }: { showToast: Props['showToast'] }) {
  const { CAMPAIGN_METRICS, REPORT_LEADS, TRAFFIC_SOURCES, TOP_PAGES } = useReportsDataContext()
  const platformAgg = useMemo(() => {
    const map = new Map<string, { spend: number; impressions: number; clicks: number; conversions: number; revenue: number }>()
    CAMPAIGN_METRICS.forEach(c => {
      const p = map.get(c.platform) || { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
      p.spend += c.spend; p.impressions += c.impressions; p.clicks += c.clicks; p.conversions += c.conversions; p.revenue += c.revenueGenerated
      map.set(c.platform, p)
    })
    return Array.from(map.entries()).map(([platform, data]) => ({ platform, ...data, ctr: ((data.clicks / data.impressions) * 100).toFixed(2), roi: (data.revenue / data.spend).toFixed(1) }))
  }, [CAMPAIGN_METRICS])

  const leadsByStatus = useMemo(() => {
    const statuses = ['new', 'contacted', 'qualified', 'pitched', 'negotiating', 'won', 'lost'] as const
    return statuses.map(s => ({ status: s, count: REPORT_LEADS.filter(l => l.status === s).length, leads: REPORT_LEADS.filter(l => l.status === s) }))
  }, [REPORT_LEADS])

  return (
    <div className="space-y-6">
      {/* Campaign Command */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4">Campaign Command Center</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/[0.06]">
              {['Campaign', 'Platform', 'Spend', 'Impressions', 'Clicks', 'CTR', 'Conv.', 'Revenue', 'ROI'].map(h => (
                <th key={h} className="text-left text-gray-500 py-2 px-2 font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {CAMPAIGN_METRICS.map(c => (
                <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-2.5 px-2 text-white font-medium">{c.name}</td>
                  <td className="py-2.5 px-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.platform === 'Google' ? 'bg-blue-500/20 text-blue-300' : c.platform === 'Meta' ? 'bg-pink-500/20 text-pink-300' : c.platform === 'LinkedIn' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-red-500/20 text-red-300'}`}>{c.platform}</span></td>
                  <td className="py-2.5 px-2 text-gray-300">{formatINRCompact(c.spend)}</td>
                  <td className="py-2.5 px-2 text-gray-300">{c.impressions.toLocaleString()}</td>
                  <td className="py-2.5 px-2 text-gray-300">{c.clicks.toLocaleString()}</td>
                  <td className="py-2.5 px-2 text-gray-300">{((c.clicks / c.impressions) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-2 text-white font-medium">{c.conversions}</td>
                  <td className="py-2.5 px-2 text-emerald-400">{formatINRCompact(c.revenueGenerated)}</td>
                  <td className="py-2.5 px-2 text-white font-bold">{(c.revenueGenerated / c.spend).toFixed(1)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminGlass>

      {/* Platform Comparison + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4">Platform Comparison</h3>
          <div className="grid grid-cols-2 gap-3">
            {platformAgg.map(p => (
              <div key={p.platform} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-gray-400 font-medium">{p.platform}</p>
                <p className="text-lg font-bold text-white mt-1">{p.roi}x <span className="text-xs text-gray-500 font-normal">ROI</span></p>
                <div className="mt-2 space-y-1 text-[10px]">
                  <div className="flex justify-between"><span className="text-gray-500">Spend</span><span className="text-gray-300">{formatINRCompact(p.spend)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Conversions</span><span className="text-gray-300">{p.conversions}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">CTR</span><span className="text-gray-300">{p.ctr}%</span></div>
                </div>
              </div>
            ))}
          </div>
        </AdminGlass>

        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4">Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RePieChart>
              <Pie data={TRAFFIC_SOURCES} cx="50%" cy="50%" outerRadius={75} dataKey="visitors" label={(props: any) => `${props.source ?? props.name ?? ''} ${props.percentage ?? ''}%`}>
                {TRAFFIC_SOURCES.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={TT} labelStyle={TL} />
            </RePieChart>
          </ResponsiveContainer>
        </AdminGlass>
      </div>

      {/* Lead Pipeline Kanban */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4">Lead Pipeline</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {leadsByStatus.filter(s => s.count > 0).map(s => (
            <div key={s.status} className="min-w-[180px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${s.status === 'won' ? 'bg-emerald-500/20 text-emerald-300' : s.status === 'lost' ? 'bg-red-500/20 text-red-300' : 'bg-white/[0.06] text-gray-300'}`}>{s.status}</span>
                <span className="text-xs text-gray-500">{s.count}</span>
              </div>
              <div className="space-y-2">
                {s.leads.map(l => (
                  <div key={l.id} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                    <p className="text-xs text-white font-medium">{l.name}</p>
                    <p className="text-[10px] text-gray-500">{l.city} &middot; {formatINRCompact(l.estimatedValue)}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <div className="h-1 flex-1 rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-brand-red" style={{ width: `${l.score}%` }} /></div>
                      <span className="text-[9px] text-gray-500">{l.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AdminGlass>

      {/* Top Pages */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4">Top Website Pages</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/[0.06]">
              {['Page', 'Views', 'Avg Time', 'Bounce Rate'].map(h => <th key={h} className="text-left text-gray-500 py-2 px-2 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {TOP_PAGES.map(p => (
                <tr key={p.page} className="border-b border-white/[0.03]">
                  <td className="py-2 px-2"><span className="text-white">{p.title}</span><br /><span className="text-gray-600">{p.page}</span></td>
                  <td className="py-2 px-2 text-gray-300">{p.views.toLocaleString()}</td>
                  <td className="py-2 px-2 text-gray-300">{p.avgTime}</td>
                  <td className="py-2 px-2"><span className={p.bounceRate > 40 ? 'text-amber-400' : 'text-emerald-400'}>{p.bounceRate}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminGlass>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 5: AI STRATEGIC ADVISOR
// ═══════════════════════════════════════════════════════════════

function AIAdvisorTab({ showToast }: { showToast: Props['showToast'] }) {
  const { REPORT_KPIS, AI_INSIGHTS, SCHEDULED_REPORTS } = useReportsDataContext()
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: 'Welcome to the GHL Intelligence Advisor. I have access to your financial, marketing, and operational data. Ask me anything about your business strategy, or try one of the suggested queries below.' },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [isLive, setIsLive] = useState(false)

  // Check for API key on mount and when returning from settings
  useEffect(() => {
    const checkKey = () => setIsLive(!!sessionStorage.getItem('claude_api_key'))
    checkKey()
    const interval = setInterval(checkKey, 2000) // poll for key changes
    return () => clearInterval(interval)
  }, [])

  const suggestedQueries = ['What\'s our revenue trend this quarter?', 'Which campaigns should we kill?', 'Analyze our client retention', 'Compare CAC across channels', 'Draft a board report for February']

  // Simulated fallback (keyword matching) when no API key
  const getSimulatedResponse = (userMsg: string): string => {
    const kpis = REPORT_KPIS
    const q = userMsg.toLowerCase()
    if (q.includes('revenue') || q.includes('trend')) {
      return `**Revenue Analysis — February 2025**\n\nYour monthly revenue stands at ${formatINRCompact(kpis.monthlyRevenue)}, up ${kpis.revenueChange}% vs last month.\n\n**Key drivers:**\n- Management fees: ₹51L (38.2% of total)\n- Performance fees: ₹32.5L (24.3%)\n- NRI segment contributing 25% of total revenue\n\n**Recommendation:** Double down on LinkedIn campaigns for NRI acquisition — they show 4x conversion rate vs domestic channels.`
    } else if (q.includes('campaign') || q.includes('kill')) {
      return `**Campaign Optimization Analysis**\n\nBased on ROI analysis:\n\n✅ **Keep & Scale:**\n- LinkedIn CXO Campaign (50x ROI)\n- NRI Investment Search (50x ROI)\n\n⚠️ **Optimize:**\n- Instagram HNI Stories (11.1x ROI) — good but CPC rising\n\n❌ **Consider Pausing:**\n- YouTube Explainer Series (12.5x ROI but only 3 conversions)\n- Brand Campaign (10x ROI, low volume)\n\n**Projected savings:** ₹1.7L/month reallocation could yield 5-8 additional conversions.`
    } else if (q.includes('retention') || q.includes('churn')) {
      return `**Client Retention Analysis**\n\nOverall retention: ${kpis.retentionRate}% (industry avg: 88%)\n\n**Concerns:**\n- Tier 1 (₹25L-1Cr) segment showing 12% churn increase\n- 2 clients moved to 'dormant' status this quarter\n\n**Top retention drivers:**\n1. Regular portfolio updates (NPS +15 when consistent)\n2. Dedicated RM assignment\n3. AI-powered market insights\n\n**Action items:**\n- Launch quarterly review calls for Tier 1\n- Implement automated market alerts\n- Consider fee restructuring for competitive positioning`
    }
    return `Great question! Based on the current data:\n\n- **AUM:** ${formatINRCompact(kpis.totalAUM)} across ${kpis.activeClients} active clients\n- **Monthly revenue:** ${formatINRCompact(kpis.monthlyRevenue)} with ${kpis.profitMargin}% margin\n- **Key opportunity:** NRI segment from UAE (4x conversion rate, zero dedicated campaigns)\n- **Key risk:** Tier 1 retention declining, competitors offering lower fees\n\nWould you like me to dive deeper into any of these areas, or generate a detailed report?`
  }

  const handleSend = async () => {
    if (!input.trim() || thinking) return
    const userMsg = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setInput('')
    setThinking(true)

    const apiKey = sessionStorage.getItem('claude_api_key')

    if (apiKey) {
      // ── LIVE MODE: Call Claude API ──
      try {
        // Build conversation history for Claude (map 'ai' → 'assistant')
        const history: ClaudeMessage[] = messages
          .filter(m => m.role === 'user' || m.role === 'ai')
          .map(m => ({ role: m.role === 'ai' ? 'assistant' as const : 'user' as const, content: m.content }))
        // Add current user message
        history.push({ role: 'user', content: userMsg })
        // Remove the initial welcome message from history (it's system-level context)
        if (history.length > 0 && history[0].role === 'assistant') {
          history.shift()
        }

        const response = await callClaudeAPI(history, apiKey)
        setMessages(prev => [...prev, { role: 'ai', content: response }])
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
        showToast(`AI Error: ${errorMsg}`, 'error')
        // Fall back to simulated response on API failure
        const fallback = getSimulatedResponse(userMsg)
        setMessages(prev => [...prev, { role: 'ai', content: `⚠️ *Live AI unavailable — showing cached analysis*\n\n${fallback}` }])
      }
    } else {
      // ── SIMULATED MODE: Keyword matching fallback ──
      await new Promise(resolve => setTimeout(resolve, 1200))
      const response = getSimulatedResponse(userMsg)
      setMessages(prev => [...prev, { role: 'ai', content: response }])
    }

    setThinking(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chat Interface */}
      <div className="lg:col-span-2 flex flex-col" style={{ minHeight: '600px' }}>
        <AdminGlass className="flex flex-col flex-1" padding="p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '500px' }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3.5 ${m.role === 'user' ? 'bg-brand-red/20 border border-brand-red/30' : 'bg-white/[0.04] border border-white/[0.08]'}`}>
                  {m.role === 'ai' && <div className="flex items-center gap-1.5 mb-2"><Brain className="w-3.5 h-3.5 text-purple-400" /><span className="text-[10px] text-purple-400 font-semibold uppercase">GHL AI Advisor{isLive ? ' · Live' : ''}</span></div>}
                  <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{m.content.split('**').map((part, j) => j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part)}</div>
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3.5">
                  <div className="flex items-center gap-2"><Brain className="w-3.5 h-3.5 text-purple-400 animate-pulse" /><span className="text-sm text-gray-400 animate-pulse">{isLive ? 'Querying Claude...' : 'Analyzing your data...'}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Queries */}
          <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide border-t border-white/[0.04]">
            {suggestedQueries.map(q => (
              <button key={q} onClick={() => { setInput(q); }} className="flex-shrink-0 px-3 py-1 rounded-full text-[10px] text-gray-400 bg-white/[0.03] border border-white/[0.06] hover:border-brand-red/30 hover:text-white transition-colors">{q}</button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/[0.06]">
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask about revenue, campaigns, strategy..." className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-red/40" />
              <button onClick={handleSend} disabled={thinking} className="px-4 py-2.5 rounded-xl bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors disabled:opacity-50 admin-btn-press"><Send className="w-4 h-4 text-white" /></button>
            </div>
            <p className="text-[10px] mt-2 text-center">
              {isLive
                ? <span className="text-emerald-400">● Live AI connected — responses powered by Claude</span>
                : <span className="text-gray-600">○ Simulated mode — add your Claude API key in Report Settings for live AI</span>
              }
            </p>
          </div>
        </AdminGlass>
      </div>

      {/* Intelligence Panels */}
      <div className="space-y-4">
        <AdminGlass>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Growth Opportunities</h4>
          <div className="space-y-3">
            {AI_INSIGHTS.filter(i => i.type === 'growth' || i.type === 'opportunity').slice(0, 3).map(ins => (
              <div key={ins.id} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-xs text-gray-300 leading-relaxed">{ins.summary.slice(0, 120)}...</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-emerald-400">{ins.impact || 'High impact'}</span>
                  <span className="text-[10px] text-gray-500">{(ins.confidence * 100).toFixed(0)}% confidence</span>
                </div>
              </div>
            ))}
          </div>
        </AdminGlass>

        <AdminGlass>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Risk Radar</h4>
          <div className="space-y-3">
            {AI_INSIGHTS.filter(i => i.type === 'risk' || i.type === 'anomaly').slice(0, 3).map(ins => (
              <div key={ins.id} className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-300 leading-relaxed">{ins.summary.slice(0, 120)}...</p>
                </div>
                <span className={`text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded ${ins.priority === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>{ins.priority}</span>
              </div>
            ))}
          </div>
        </AdminGlass>

        <AdminGlass>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Report Queue</h4>
          <div className="space-y-2">
            {SCHEDULED_REPORTS.slice(0, 4).map(r => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                <div><p className="text-xs text-white">{r.name}</p><p className="text-[10px] text-gray-500">{r.frequency}</p></div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.status === 'ready' ? 'bg-emerald-500/20 text-emerald-300' : r.status === 'generating' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </AdminGlass>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 6: SMART EMAILER
// ═══════════════════════════════════════════════════════════════

function EmailerTab({ showToast }: { showToast: Props['showToast'] }) {
  const { EMAIL_TEMPLATES } = useReportsDataContext()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Email Analytics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard title="Emails Sent" value="247" subtitle="This month" trend="up" trendValue="+18%" icon={Mail} color="#3B82F6" />
        <AdminKPICard title="Delivery Rate" value="98.2%" trend="up" trendValue="+0.3%" icon={CheckCircle} color="#10B981" />
        <AdminKPICard title="Open Rate" value="45.3%" trend="up" trendValue="+5.2%" icon={Eye} color="#D4AF37" />
        <AdminKPICard title="Click Rate" value="12.1%" trend="up" trendValue="+1.8%" icon={Target} color="#8B5CF6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Composer */}
        <div className="lg:col-span-2 space-y-4">
          <AdminGlass>
            <h3 className="text-sm font-semibold text-white mb-4">Email Composer</h3>
            <div className="space-y-3">
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line..." className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-red/40" />
              <div className="flex gap-1.5 flex-wrap">
                {['{{client_name}}', '{{portfolio_value}}', '{{next_action}}', '{{fund_name}}'].map(f => (
                  <button key={f} onClick={() => setBody(prev => prev + ' ' + f)} className="px-2 py-1 rounded text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors">{f}</button>
                ))}
              </div>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} placeholder="Compose your email..." className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-red/40 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => showToast('Email queued for sending', 'success')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors admin-btn-press"><Send className="w-3.5 h-3.5" /> Send Now</button>
                <button onClick={() => showToast('Email scheduled', 'info')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors admin-btn-press"><Calendar className="w-3.5 h-3.5" /> Schedule</button>
              </div>
            </div>
            <p className="text-[10px] text-gray-600 mt-3">// BACKEND_HOOK: In production, connects to SendGrid/Mailchimp API</p>
          </AdminGlass>
        </div>

        {/* Templates */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4">Template Library</h3>
          <div className="space-y-2">
            {EMAIL_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { setSelectedTemplate(t.id); setSubject(t.subject); showToast(`Template loaded: ${t.name}`, 'info') }} className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedTemplate === t.id ? 'border-brand-red/30 bg-brand-red/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                <p className="text-xs text-white font-medium">{t.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{t.category}</p>
              </button>
            ))}
          </div>
        </AdminGlass>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 7: PHONE DIALER
// ═══════════════════════════════════════════════════════════════

function DialerTab({ showToast }: { showToast: Props['showToast'] }) {
  const { REPORT_CLIENTS, REPORT_LEADS, CALL_LOGS } = useReportsDataContext()
  const [searchTerm, setSearchTerm] = useState('')
  const allContacts = useMemo(() => [
    ...REPORT_CLIENTS.map(c => ({ name: c.name, phone: c.phone, type: 'Client' as const, tier: c.tier })),
    ...REPORT_LEADS.map(l => ({ name: l.name, phone: l.phone, type: 'Lead' as const, tier: 0 })),
  ], [REPORT_CLIENTS, REPORT_LEADS])
  const filtered = useMemo(() => allContacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())), [allContacts, searchTerm])

  return (
    <div className="space-y-6">
      {/* Call Analytics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard title="Total Calls" value="87" subtitle="This month" trend="up" trendValue="+12" icon={Phone} color="#3B82F6" />
        <AdminKPICard title="Avg Duration" value="8.5 min" trend="up" trendValue="+1.2 min" icon={Clock} color="#10B981" />
        <AdminKPICard title="Conversion Rate" value="23%" trend="up" trendValue="+3.5%" icon={Target} color="#D4AF37" />
        <AdminKPICard title="Revenue from Calls" value={formatINRCompact(420000000)} trend="up" trendValue="+18%" icon={IndianRupee} color="#DC2626" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Call Log */}
        <div className="lg:col-span-2">
          <AdminGlass>
            <h3 className="text-sm font-semibold text-white mb-4">Recent Calls</h3>
            <div className="space-y-2">
              {CALL_LOGS.map(call => (
                <div key={call.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className={`p-2 rounded-lg ${call.direction === 'outbound' ? 'bg-blue-500/10' : 'bg-emerald-500/10'}`}>
                    {call.direction === 'outbound' ? <PhoneOutgoing className="w-4 h-4 text-blue-400" /> : <PhoneIncoming className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white font-medium">{call.contactName}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        call.outcome === 'connected' ? 'bg-emerald-500/20 text-emerald-300' :
                        call.outcome === 'deal-progressed' ? 'bg-blue-500/20 text-blue-300' :
                        call.outcome === 'voicemail' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>{call.outcome}</span>
                    </div>
                    <p className="text-xs text-gray-500">{call.contactPhone} &middot; {call.duration > 0 ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : 'No answer'}</p>
                    {call.notes && <p className="text-xs text-gray-400 mt-1 truncate">{call.notes}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-gray-500">{new Date(call.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                    <a href={`tel:${call.contactPhone}`} className="text-brand-red hover:text-red-400"><Phone className="w-3.5 h-3.5 mt-1" /></a>
                  </div>
                </div>
              ))}
            </div>
          </AdminGlass>
        </div>

        {/* Contacts */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-3">Contacts</h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search contacts..." className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-gray-600 focus:outline-none" />
          </div>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {filtered.slice(0, 15).map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                <div><p className="text-xs text-white">{c.name}</p><p className="text-[10px] text-gray-500">{c.type}{c.tier ? ` T${c.tier}` : ''}</p></div>
                <a href={`tel:${c.phone}`} className="p-1.5 rounded-lg bg-brand-red/10 hover:bg-brand-red/20 transition-colors"><Phone className="w-3 h-3 text-brand-red" /></a>
              </div>
            ))}
          </div>
        </AdminGlass>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 8: DOCUMENT VAULT
// ═══════════════════════════════════════════════════════════════

function DocumentsTab({ showToast }: { showToast: Props['showToast'] }) {
  const { DOCUMENT_VAULT } = useReportsDataContext()
  const [activeFolder, setActiveFolder] = useState<string>('fund')
  const [search, setSearch] = useState('')
  const folders = ['fund', 'compliance', 'marketing', 'internal', 'reports'] as const

  const filteredDocs = useMemo(() => {
    let docs = DOCUMENT_VAULT.filter(d => d.folder === activeFolder)
    if (search) docs = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
    return docs
  }, [activeFolder, search])

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="rounded-2xl border-2 border-dashed border-white/[0.08] bg-white/[0.01] p-8 text-center hover:border-brand-red/20 transition-colors">
        <Upload className="w-8 h-8 text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Drag & drop files here to upload</p>
        <p className="text-xs text-gray-600 mt-1">PDF, XLSX, DOCX, images up to 10MB</p>
        <button onClick={() => showToast('File upload simulated', 'success')} className="mt-3 px-4 py-2 rounded-xl text-xs font-medium text-brand-red bg-brand-red/10 border border-brand-red/20 hover:bg-brand-red/20 transition-colors">Browse Files</button>
      </div>

      {/* Folder Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          {folders.map(f => (
            <button key={f} onClick={() => setActiveFolder(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${activeFolder === f ? 'bg-brand-red/20 text-white border border-brand-red/30' : 'text-gray-500 hover:text-gray-300'}`}>{f}</button>
          ))}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-gray-600 focus:outline-none" />
        </div>
      </div>

      {/* Document List */}
      <AdminGlass>
        <div className="space-y-2">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-8"><FolderOpen className="w-8 h-8 text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-500">No documents in this folder</p></div>
          ) : filteredDocs.map(doc => (
            <div key={doc.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
              <div className={`p-2 rounded-lg ${doc.type === 'pdf' ? 'bg-red-500/10' : doc.type === 'xlsx' ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}>
                <File className={`w-4 h-4 ${doc.type === 'pdf' ? 'text-red-400' : doc.type === 'xlsx' ? 'text-emerald-400' : 'text-blue-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-500">{doc.size}</span>
                  <span className="text-[10px] text-gray-600">&middot;</span>
                  <span className="text-[10px] text-gray-500">v{doc.version}</span>
                  <span className="text-[10px] text-gray-600">&middot;</span>
                  <span className="text-[10px] text-gray-500">{doc.uploadedBy}</span>
                  <span className="text-[10px] text-gray-600">&middot;</span>
                  <span className="text-[10px] text-gray-500">{new Date(doc.uploadDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex gap-1 mt-1">{doc.tags.map(t => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-400">{t}</span>)}</div>
              </div>
              <button onClick={() => showToast(`Downloading ${doc.name}`, 'info')} className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-white/[0.06] transition-all"><Download className="w-4 h-4 text-gray-400" /></button>
            </div>
          ))}
        </div>
      </AdminGlass>

      {/* Storage Indicator */}
      <AdminGlass padding="p-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-gray-400">Storage Used</span>
          <span className="text-white">24.6 MB / 500 MB</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
          <div className="h-full rounded-full bg-brand-red" style={{ width: '4.9%' }} />
        </div>
        <p className="text-[10px] text-gray-600 mt-2">// BACKEND_HOOK: In production, files stored in S3/Cloud Storage</p>
      </AdminGlass>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 9: SETTINGS
// ═══════════════════════════════════════════════════════════════

function SettingsTab({ showToast }: { showToast: Props['showToast'] }) {
  const [apiKey, setApiKey] = useState('')

  const rolePermissions = [
    { role: 'Super Admin', reports: 'Full', builder: 'Full', financial: 'Full', ai: 'Full', emailer: 'Full', dialer: 'Full', export: 'All formats' },
    { role: 'Admin', reports: 'View + Create', builder: 'Full', financial: 'View only', ai: 'Chat only', emailer: 'Send', dialer: 'Call', export: 'PDF, Excel' },
    { role: 'Staff', reports: 'Assigned only', builder: 'Templates', financial: 'None', ai: 'None', emailer: 'None', dialer: 'Call', export: 'PDF only' },
    { role: 'Client', reports: 'Own reports', builder: 'None', financial: 'None', ai: 'None', emailer: 'None', dialer: 'None', export: 'PDF only' },
  ]

  return (
    <div className="space-y-6">
      {/* Role Permissions */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4">Role Permissions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/[0.06]">
              {['Role', 'Reports', 'Builder', 'Financial', 'AI Advisor', 'Emailer', 'Dialer', 'Export'].map(h => (
                <th key={h} className="text-left text-gray-500 py-2 px-2 font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rolePermissions.map(r => (
                <tr key={r.role} className="border-b border-white/[0.03]">
                  <td className="py-2.5 px-2 text-white font-medium">{r.role}</td>
                  {[r.reports, r.builder, r.financial, r.ai, r.emailer, r.dialer, r.export].map((v, i) => (
                    <td key={i} className="py-2.5 px-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${v === 'Full' || v === 'All formats' ? 'bg-emerald-500/20 text-emerald-300' : v === 'None' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>{v}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminGlass>

      {/* System Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4">System Configuration</h3>
          <div className="space-y-4">
            <div><label className="text-xs text-gray-400">Date Format</label><select className="w-full mt-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 focus:outline-none"><option>DD/MM/YYYY (India)</option><option>MM/DD/YYYY (US)</option><option>YYYY-MM-DD (ISO)</option></select></div>
            <div><label className="text-xs text-gray-400">Currency</label><select className="w-full mt-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 focus:outline-none"><option>INR (₹) - Indian Rupee</option><option>USD ($) - US Dollar</option></select></div>
            <div><label className="text-xs text-gray-400">Default Report Format</label><select className="w-full mt-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 focus:outline-none"><option>PDF</option><option>Excel (XLSX)</option><option>CSV</option></select></div>
            <div><label className="text-xs text-gray-400">Auto-Report Schedule</label><select className="w-full mt-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 focus:outline-none"><option>Monday 9:00 AM IST</option><option>Friday 5:00 PM IST</option><option>1st of every month</option></select></div>
            <button onClick={() => showToast('Settings saved', 'success')} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors admin-btn-press">Save Settings</button>
          </div>
        </AdminGlass>

        <div className="space-y-4">
          <AdminGlass>
            <h3 className="text-sm font-semibold text-white mb-4">Claude API Configuration</h3>
            <p className="text-xs text-gray-500 mb-3">Enter your Claude API key for live AI responses. Stored in sessionStorage only (never persisted).</p>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-..." className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-red/40 font-mono" />
            <button onClick={() => { if (apiKey) { sessionStorage.setItem('claude_api_key', apiKey); showToast('API key saved to session', 'success') } }} className="mt-3 px-4 py-2 rounded-xl text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors admin-btn-press">Save API Key</button>
          </AdminGlass>

          <AdminGlass>
            <h3 className="text-sm font-semibold text-white mb-4">KPI Alerts</h3>
            <div className="space-y-3">
              {[{ metric: 'Revenue drops below ₹25L/month', active: true }, { metric: 'Client churn exceeds 5%', active: true }, { metric: 'CAC exceeds ₹2L', active: false }, { metric: 'Staff productivity below 70', active: true }].map((a, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02]">
                  <span className="text-xs text-gray-300">{a.metric}</span>
                  <div className={`w-8 h-4 rounded-full cursor-pointer transition-colors ${a.active ? 'bg-brand-red' : 'bg-white/[0.1]'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${a.active ? 'translate-x-4' : 'translate-x-0.5'}`} style={{ marginTop: '1px' }} />
                  </div>
                </div>
              ))}
            </div>
          </AdminGlass>
        </div>
      </div>

      {/* Audit Log */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4">Recent Audit Log</h3>
        <div className="space-y-2">
          {[
            { action: 'Report exported', detail: 'January 2025 Board Report (PDF)', user: 'Abe Thayil', time: '23 Feb, 2:30 PM' },
            { action: 'Email sent', detail: 'Monthly Performance Update to 17 clients', user: 'Kavitha Nair', time: '23 Feb, 11:00 AM' },
            { action: 'Report generated', detail: 'Staff Productivity Week 7', user: 'Priya Krishnan', time: '22 Feb, 8:30 AM' },
            { action: 'Document uploaded', detail: 'Board Meeting Minutes — Jan 2025', user: 'Abe Thayil', time: '21 Feb, 4:00 PM' },
            { action: 'AI query', detail: 'Revenue trend analysis for Q1', user: 'Abe Thayil', time: '21 Feb, 3:15 PM' },
            { action: 'Settings changed', detail: 'Default report format → PDF', user: 'Abe Thayil', time: '20 Feb, 10:00 AM' },
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02]">
              <div className="w-7 h-7 rounded-full bg-white/[0.04] flex items-center justify-center"><Shield className="w-3 h-3 text-gray-500" /></div>
              <div className="flex-1"><p className="text-xs text-white">{log.action}: <span className="text-gray-400">{log.detail}</span></p><p className="text-[10px] text-gray-500">{log.user} &middot; {log.time}</p></div>
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}
