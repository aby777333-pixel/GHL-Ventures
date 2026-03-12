'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
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
import AdminEmptyState from '../shared/AdminEmptyState'
import { getOverviewKPIs, fetchClients, fetchLeads } from '@/lib/supabase/adminDataService'
import { formatINR } from '@/lib/admin/adminHooks'
import { saveBlobAs } from '@/lib/supabase/storageService'

// ── Sub-tabs ─────────────────────────────────────────────────────
const ANALYTICS_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'reports', label: 'Report Builder', icon: FileBarChart },
  { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
] as const

type AnalyticsTab = typeof ANALYTICS_TABS[number]['id']

// ── Data arrays (populated from Supabase when available) ─────────
const MONTHLY_METRICS: any[] = []
const FORECAST_DATA: any[] = []
const AUM_WITH_FORECAST: any[] = []

interface AnalyticsModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function AnalyticsModule({ subTab, navigate, showToast }: AnalyticsModuleProps) {
  const activeTab = (ANALYTICS_TABS.some(t => t.id === subTab) ? subTab : 'dashboard') as AnalyticsTab

  const [overviewKpis, setOverviewKpis] = useState({
    totalAUM: 0, activeClients: 0, monthlyRevenue: 0, activeFunds: 0,
    aumChange: 0, revenueChange: 0, clientGrowth: 0, leadConversion: 0,
    complianceScore: 0, tasksCompleted: 0,
  })

  useEffect(() => {
    getOverviewKPIs().then(k => setOverviewKpis(prev => ({ ...prev, ...k })))
  }, [])

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
            await saveBlobAs(blob, `GHL_Analytics_Report_${new Date().toISOString().slice(0,10)}.csv`, showToast as any)
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
        {activeTab === 'dashboard' && <AnalyticsDashboard overviewKpis={overviewKpis} />}
        {activeTab === 'reports' && <ReportBuilder showToast={showToast} />}
        {activeTab === 'forecasting' && <ForecastingTab />}
      </div>
    </div>
  )
}

// ── Analytics Dashboard ─────────────────────────────────────────
function AnalyticsDashboard({ overviewKpis }: { overviewKpis: Record<string, any> }) {
  const kpis = useMemo(() => {
    const clientGrowthRate = MONTHLY_METRICS.length >= 2
      ? ((MONTHLY_METRICS[MONTHLY_METRICS.length - 1].clients - MONTHLY_METRICS[0].clients) / MONTHLY_METRICS[0].clients * 100).toFixed(1)
      : '0'
    const avgConversion = MONTHLY_METRICS.length > 0
      ? Math.round(MONTHLY_METRICS.reduce((s, m) => s + m.conversions, 0) / MONTHLY_METRICS.length)
      : 0
    const totalLeads = MONTHLY_METRICS.reduce((s, m) => s + m.leads, 0)
    return { clientGrowthRate, avgConversion, totalLeads }
  }, [])

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Total AUM" value={formatINR(overviewKpis.totalAUM || 0)} trend="up" trendValue={`+${overviewKpis.aumChange || 0}%`} icon={IndianRupee} color="#DC2626" delay={0} />
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
            { label: 'AUM Growth', value: `+${overviewKpis.aumChange || 0}%`, color: 'text-emerald-400' },
            { label: 'Revenue Growth', value: `+${overviewKpis.revenueChange || 0}%`, color: 'text-emerald-400' },
            { label: 'Client Growth', value: `+${overviewKpis.clientGrowth || 0}%`, color: 'text-emerald-400' },
            { label: 'Lead Conversion', value: `${overviewKpis.leadConversion || 0}%`, color: 'text-blue-400' },
            { label: 'Compliance Score', value: `${overviewKpis.complianceScore || 0}%`, color: 'text-emerald-400' },
            { label: 'Tasks Done', value: `${overviewKpis.tasksCompleted || 0}%`, color: 'text-blue-400' },
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
  return (
    <div className="space-y-4">
      <AdminGlass>
        <AdminEmptyState title="No reports configured" description="Reports will appear here once the reporting engine is set up." />
      </AdminGlass>
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
      <AdminGlass>
        <AdminEmptyState title="No forecast data" description="AI forecasting metrics will appear here when sufficient historical data is available." />
      </AdminGlass>
    </div>
  )
}
