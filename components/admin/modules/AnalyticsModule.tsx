'use client'

import { useState, useMemo } from 'react'
import {
  BarChart3, TrendingUp, PieChart, FileBarChart, Download,
  Calendar, Filter, Eye, ArrowUpRight, ArrowDownRight,
  IndianRupee, Users, Target, Clock, Activity, Layers,
  Zap, Brain, Star, Globe,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts'
import AdminGlass from '../shared/AdminGlass'
import AdminBadge from '../shared/AdminBadge'
import AdminKPICard from '../shared/AdminKPICard'
import { OVERVIEW_KPIS, AUM_GROWTH_DATA, REVENUE_BREAKDOWN, CLIENTS_DATA, LEADS_DATA } from '@/lib/admin/adminMockData'
import { formatINR } from '@/lib/admin/adminHooks'

// ── Sub-tabs ─────────────────────────────────────────────────────
const ANALYTICS_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'reports', label: 'Report Builder', icon: FileBarChart },
  { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
] as const

type AnalyticsTab = typeof ANALYTICS_TABS[number]['id']

// ── Mock data for analytics ──────────────────────────────────────
const MONTHLY_METRICS = [
  { month: 'Oct 24', clients: 310, leads: 38, conversions: 8, churn: 2 },
  { month: 'Nov 24', clients: 318, leads: 42, conversions: 10, churn: 1 },
  { month: 'Dec 24', clients: 326, leads: 35, conversions: 9, churn: 3 },
  { month: 'Jan 25', clients: 332, leads: 44, conversions: 7, churn: 1 },
  { month: 'Feb 25', clients: 338, leads: 40, conversions: 8, churn: 2 },
  { month: 'Mar 25', clients: 342, leads: 47, conversions: 6, churn: 0 },
]

const FORECAST_DATA = [
  { month: 'Apr 25', actual: null, forecast: 255, lower: 248, upper: 262 },
  { month: 'May 25', actual: null, forecast: 263, lower: 253, upper: 273 },
  { month: 'Jun 25', actual: null, forecast: 271, lower: 258, upper: 284 },
  { month: 'Jul 25', actual: null, forecast: 280, lower: 264, upper: 296 },
  { month: 'Aug 25', actual: null, forecast: 289, lower: 270, upper: 308 },
  { month: 'Sep 25', actual: null, forecast: 298, lower: 276, upper: 320 },
]

const AUM_WITH_FORECAST = [
  ...AUM_GROWTH_DATA.map(d => ({ ...d, forecast: null as number | null, lower: null as number | null, upper: null as number | null })),
  ...FORECAST_DATA.map(d => ({ aum: null as number | null, target: null as number | null, ...d })),
]

interface AnalyticsModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function AnalyticsModule({ subTab, navigate, showToast }: AnalyticsModuleProps) {
  const activeTab = (ANALYTICS_TABS.some(t => t.id === subTab) ? subTab : 'dashboard') as AnalyticsTab

  const handleTabClick = (tabId: string) => {
    navigate(tabId === 'dashboard' ? 'analytics' : `analytics/${tabId}`)
  }

  return (
    <div className="space-y-6 admin-section-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Reporting</h1>
          <p className="text-sm text-gray-500 mt-1">Business intelligence, reports, and AI forecasting</p>
        </div>
        <button
          onClick={async () => {
            showToast('Generating analytics export...', 'info')
            const bom = '\uFEFF'
            const rows = MONTHLY_METRICS.map(m => `${m.month},${m.clients},${m.leads},${m.conversions},${m.churn}`)
            const csv = `${bom}Month,Clients,Leads,Conversions,Churn\n${rows.join('\n')}`
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
            const filename = `GHL_Analytics_Report_${new Date().toISOString().slice(0,10)}.csv`
            if ('showSaveFilePicker' in window) {
              try {
                const handle = await (window as any).showSaveFilePicker({ suggestedName: filename, types: [{ description: 'CSV File', accept: { 'text/csv': ['.csv'] } }] })
                const writable = await handle.createWritable()
                await writable.write(blob)
                await writable.close()
                showToast('Report exported', 'success')
                return
              } catch (err: any) { if (err?.name === 'AbortError') return }
            }
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = filename
            document.body.appendChild(a); a.click()
            document.body.removeChild(a); URL.revokeObjectURL(url)
            showToast('Report exported', 'success')
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors self-start admin-btn-press"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
        {ANALYTICS_TABS.map(tab => {
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

      <div className="admin-tab-switch">
        {activeTab === 'dashboard' && <AnalyticsDashboard />}
        {activeTab === 'reports' && <ReportBuilder showToast={showToast} />}
        {activeTab === 'forecasting' && <ForecastingTab />}
      </div>
    </div>
  )
}

// ── Analytics Dashboard ─────────────────────────────────────────
function AnalyticsDashboard() {
  const kpis = useMemo(() => {
    const clientGrowthRate = MONTHLY_METRICS.length >= 2
      ? ((MONTHLY_METRICS[MONTHLY_METRICS.length - 1].clients - MONTHLY_METRICS[0].clients) / MONTHLY_METRICS[0].clients * 100).toFixed(1)
      : '0'
    const avgConversion = Math.round(MONTHLY_METRICS.reduce((s, m) => s + m.conversions, 0) / MONTHLY_METRICS.length)
    const totalLeads = MONTHLY_METRICS.reduce((s, m) => s + m.leads, 0)
    return { clientGrowthRate, avgConversion, totalLeads }
  }, [])

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Total AUM" value={formatINR(OVERVIEW_KPIS.totalAUM)} trend="up" trendValue={`+${OVERVIEW_KPIS.aumChange}%`} icon={IndianRupee} color="#DC2626" delay={0} />
        <AdminKPICard title="Client Growth" value={`${kpis.clientGrowthRate}%`} trend="up" trendValue="6 months" icon={Users} color="#3B82F6" delay={50} />
        <AdminKPICard title="Avg Conversions/Mo" value={kpis.avgConversion} icon={Target} color="#10B981" delay={100} />
        <AdminKPICard title="Total Leads (6mo)" value={kpis.totalLeads} icon={Activity} color="#8B5CF6" delay={150} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Client Growth Trend */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-red" />
            Client Growth Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_METRICS}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="clients" stroke="#DC2626" fill="url(#clientGrad)" strokeWidth={2} />
                <defs>
                  <linearGradient id="clientGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#DC2626" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminGlass>

        {/* Lead Pipeline */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-red" />
            Leads vs Conversions
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_METRICS}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="leads" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Leads" />
                <Bar dataKey="conversions" fill="#10B981" radius={[4, 4, 0, 0]} name="Conversions" />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminGlass>
      </div>

      {/* Key Metrics Grid */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-red" />
          Key Business Metrics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'AUM Growth', value: `+${OVERVIEW_KPIS.aumChange}%`, color: 'text-emerald-400' },
            { label: 'Revenue Growth', value: `+${OVERVIEW_KPIS.revenueChange}%`, color: 'text-emerald-400' },
            { label: 'Client Growth', value: `+${OVERVIEW_KPIS.clientGrowth}%`, color: 'text-emerald-400' },
            { label: 'Lead Conversion', value: `${OVERVIEW_KPIS.leadConversion}%`, color: 'text-blue-400' },
            { label: 'Compliance Score', value: `${OVERVIEW_KPIS.complianceScore}%`, color: 'text-emerald-400' },
            { label: 'Tasks Done', value: `${OVERVIEW_KPIS.tasksCompleted}%`, color: 'text-blue-400' },
          ].map(m => (
            <div key={m.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
              <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{m.label}</p>
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ── Report Builder ──────────────────────────────────────────────
function ReportBuilder({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const reports = [
    { id: 'RPT-001', name: 'Monthly Investor Report', type: 'Scheduled', frequency: 'Monthly', lastRun: '2025-03-01', status: 'ready' },
    { id: 'RPT-002', name: 'Quarterly Performance Summary', type: 'Scheduled', frequency: 'Quarterly', lastRun: '2025-01-15', status: 'ready' },
    { id: 'RPT-003', name: 'Client Portfolio Analysis', type: 'On-Demand', frequency: '—', lastRun: '2025-03-18', status: 'ready' },
    { id: 'RPT-004', name: 'Compliance Audit Report', type: 'Scheduled', frequency: 'Quarterly', lastRun: '2025-01-20', status: 'ready' },
    { id: 'RPT-005', name: 'Sales Pipeline Report', type: 'On-Demand', frequency: '—', lastRun: '2025-03-15', status: 'ready' },
    { id: 'RPT-006', name: 'Employee Attendance Summary', type: 'Scheduled', frequency: 'Monthly', lastRun: '2025-03-01', status: 'ready' },
    { id: 'RPT-007', name: 'Risk Assessment Report', type: 'On-Demand', frequency: '—', lastRun: '2025-03-10', status: 'generating' },
    { id: 'RPT-008', name: 'Revenue Forecast Model', type: 'AI-Generated', frequency: 'Weekly', lastRun: '2025-03-17', status: 'ready' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {reports.map(report => (
          <AdminGlass key={report.id} padding="p-4" className="group cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-brand-red/10">
                <FileBarChart className="w-4 h-4 text-brand-red" />
              </div>
              <AdminBadge
                label={report.status === 'ready' ? 'Ready' : 'Generating'}
                variant={report.status === 'ready' ? 'success' : 'warning'}
                dot
              />
            </div>
            <h4 className="text-sm font-medium text-white group-hover:text-brand-red transition-colors">{report.name}</h4>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500">
              <AdminBadge label={report.type} variant={report.type === 'AI-Generated' ? 'purple' : report.type === 'Scheduled' ? 'info' : 'neutral'} />
              {report.frequency !== '—' && <span>{report.frequency}</span>}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
              <span className="text-[10px] text-gray-600">Last: {report.lastRun}</span>
              <button
                onClick={() => showToast(`Downloading ${report.name}...`, 'success')}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </AdminGlass>
        ))}
      </div>
    </div>
  )
}

// ── Forecasting Tab ─────────────────────────────────────────────
function ForecastingTab() {
  return (
    <div className="space-y-4">
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Brain className="w-4 h-4 text-brand-red" />
          AUM Growth Forecast (AI-Powered)
        </h3>
        <p className="text-xs text-gray-500 mb-4">Historical data + 6-month AI forecast with confidence intervals</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={AUM_WITH_FORECAST}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} Cr`} />
              <Tooltip contentStyle={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
              {/* Confidence interval */}
              <Area type="monotone" dataKey="upper" stroke="none" fill="rgba(139,92,246,0.1)" />
              <Area type="monotone" dataKey="lower" stroke="none" fill="rgba(10,10,10,1)" />
              {/* Historical */}
              <Area type="monotone" dataKey="aum" stroke="#DC2626" fill="url(#aumGrad)" strokeWidth={2} name="Actual AUM" connectNulls={false} />
              <Area type="monotone" dataKey="target" stroke="#3B82F6" fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="Target" connectNulls={false} />
              {/* Forecast */}
              <Area type="monotone" dataKey="forecast" stroke="#8B5CF6" fill="url(#forecastGrad)" strokeWidth={2} strokeDasharray="6 3" name="AI Forecast" connectNulls={false} />
              <defs>
                <linearGradient id="aumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DC2626" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </AdminGlass>

      {/* Forecast Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Projected AUM (Sep 25)</p>
          <p className="text-xl font-bold text-purple-400 mt-1">₹298 Cr</p>
          <p className="text-[11px] text-gray-500 mt-1">Range: ₹276 – ₹320 Cr</p>
        </AdminGlass>
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Growth Rate</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">+20.6%</p>
          <p className="text-[11px] text-gray-500 mt-1">Next 6 months projected</p>
        </AdminGlass>
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Model Confidence</p>
          <p className="text-xl font-bold text-amber-400 mt-1">92.4%</p>
          <p className="text-[11px] text-gray-500 mt-1">ARIMA + ML ensemble</p>
        </AdminGlass>
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Target Achievement</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">On Track</p>
          <p className="text-[11px] text-gray-500 mt-1">₹300 Cr FY26 target</p>
        </AdminGlass>
      </div>
    </div>
  )
}
