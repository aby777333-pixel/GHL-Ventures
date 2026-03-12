'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  IndianRupee, Users, TrendingUp, ClipboardCheck, Shield, Target,
  FileText, CheckSquare, ArrowUpRight, ArrowDownRight, Clock,
  Activity, AlertCircle, AlertTriangle, Info, CheckCircle,
  Zap, Server, HardDrive, Wifi, Newspaper, Calendar, Globe,
  ExternalLink, Building2, Megaphone, Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'
import AdminGlass from '../shared/AdminGlass'
import AdminKPICard from '../shared/AdminKPICard'
import AdminBadge, { getSeverityBadgeVariant } from '../shared/AdminBadge'
import {
  getOverviewKPIs, getAUMGrowth, getRevenueBreakdown,
  fetchActivityFeed, fetchRiskFlags, getSystemHealth, getUpcomingDeadlines,
  fetchNotifications,
} from '@/lib/supabase/adminDataService'
import { useAnimatedCounter, formatINR, formatTimeAgo } from '@/lib/admin/adminHooks'

interface OverviewModuleProps {
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

// ── Chart Tooltip ─────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-4 py-3 border border-white/10 shadow-2xl"
      style={{ background: 'rgba(18,18,26,0.95)', backdropFilter: 'blur(20px)' }}>
      <p className="text-xs text-gray-400 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? `₹${p.value} Cr` : p.value}
        </p>
      ))}
    </div>
  )
}

export default function OverviewModule({ navigate, showToast }: OverviewModuleProps) {
  // ── Live data ─────────────────────────────────────────────────
  const [overviewKpis, setOverviewKpis] = useState({
    totalAUM: 0, activeClients: 0, monthlyRevenue: 0, activeFunds: 0,
    aumChange: 0, clientGrowth: 0, revenueChange: 0, pendingApprovals: 0,
    complianceScore: 0, activeLeads: 0, leadConversion: 0,
    documentsProcessed: 0, tasksCompleted: 0,
  })
  const [aumGrowthData, setAumGrowthData] = useState<any[]>([])
  const [revenueBreakdown, setRevenueBreakdown] = useState<any[]>([])
  const [activityFeed, setActivityFeed] = useState<any[]>([])
  const [riskFlags, setRiskFlags] = useState<any[]>([])
  const [systemHealth, setSystemHealth] = useState(getSystemHealth())
  const [deadlines, setDeadlines] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])

  const loadData = useCallback(async () => {
    const [kpis, aum, rev, feed, flags, notifs] = await Promise.all([
      getOverviewKPIs(),
      getAUMGrowth(),
      getRevenueBreakdown(),
      fetchActivityFeed(),
      fetchRiskFlags(),
      fetchNotifications(),
    ])
    setOverviewKpis(prev => ({ ...prev, ...kpis }))
    setAumGrowthData(aum)
    setRevenueBreakdown(rev)
    setActivityFeed(feed)
    setRiskFlags(flags)
    setDeadlines(getUpcomingDeadlines())
    setNotifications(notifs)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const aumValue = useAnimatedCounter(overviewKpis.totalAUM)
  const clientCount = useAnimatedCounter(overviewKpis.activeClients, 1500)
  const revenueValue = useAnimatedCounter(overviewKpis.monthlyRevenue)
  const leadsCount = useAnimatedCounter(overviewKpis.activeLeads, 1200)

  const activeAlerts = useMemo(() =>
    riskFlags.filter(f => f.status === 'open' || f.status === 'investigating'),
    [riskFlags]
  )

  const criticalNotifs = useMemo(() =>
    notifications.filter(n => n.type === 'critical' || n.type === 'warning'),
    [notifications]
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Command Center</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time operational overview of GHL India Ventures</p>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <AdminKPICard
          title="Total AUM"
          value={formatINR(aumValue)}
          icon={IndianRupee}
          color="#DC2626"
          trend="up"
          trendValue={`+${overviewKpis.aumChange}%`}
          delay={0}
        />
        <AdminKPICard
          title="Active Clients"
          value={clientCount.toString()}
          icon={Users}
          color="#3B82F6"
          trend="up"
          trendValue={`+${overviewKpis.clientGrowth}%`}
          delay={50}
        />
        <AdminKPICard
          title="Monthly Revenue"
          value={formatINR(revenueValue)}
          icon={TrendingUp}
          color="#10B981"
          trend="up"
          trendValue={`+${overviewKpis.revenueChange}%`}
          delay={100}
        />
        <AdminKPICard
          title="Pending Approvals"
          value={overviewKpis.pendingApprovals.toString()}
          icon={ClipboardCheck}
          color="#F59E0B"
          subtitle="Action required"
          delay={150}
        />
        <AdminKPICard
          title="Compliance Score"
          value={`${overviewKpis.complianceScore}/100`}
          icon={Shield}
          color="#8B5CF6"
          delay={200}
        />
        <AdminKPICard
          title="Active Leads"
          value={leadsCount.toString()}
          icon={Target}
          color="#F97316"
          subtitle={`${overviewKpis.leadConversion}% conv.`}
          delay={250}
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AUM Growth Chart */}
        <AdminGlass padding="p-0">
          <div className="p-5 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">AUM Growth</h3>
                <p className="text-xs text-gray-500 mt-0.5">12-month trailing performance</p>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-red" /> Actual</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-500" /> Target</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={aumGrowthData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="aumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#666" fontSize={10} tickLine={false} />
              <YAxis stroke="#666" fontSize={10} tickLine={false} tickFormatter={v => `₹${v}Cr`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="aum" name="Actual AUM" stroke="#DC2626" fill="url(#aumGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="target" name="Target" stroke="#6B7280" fill="transparent" strokeWidth={1} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </AdminGlass>

        {/* Revenue Breakdown Chart */}
        <AdminGlass padding="p-0">
          <div className="p-5 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Revenue Breakdown</h3>
                <p className="text-xs text-gray-500 mt-0.5">Monthly revenue by source (₹ Lakhs)</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-red" /> Mgmt</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Perf</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Place</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Adv</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueBreakdown} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#666" fontSize={10} tickLine={false} />
              <YAxis stroke="#666" fontSize={10} tickLine={false} tickFormatter={v => `₹${v}L`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="management" name="Management" stackId="a" fill="#DC2626" radius={[0,0,0,0]} />
              <Bar dataKey="performance" name="Performance" stackId="a" fill="#10B981" />
              <Bar dataKey="placement" name="Placement" stackId="a" fill="#3B82F6" />
              <Bar dataKey="advisory" name="Advisory" stackId="a" fill="#F59E0B" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </AdminGlass>
      </div>

      {/* Row 3: Activity Feed + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity Feed */}
        <AdminGlass>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-red" />
              Live Activity Feed
            </h3>
            <span className="text-[10px] text-gray-500">{activityFeed.length} recent</span>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto admin-scrollbar">
            {activityFeed.map(item => (
              <div key={item.id} className="flex items-start gap-3 group">
                <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-brand-red">
                    {item.user.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300">
                    <span className="font-semibold text-white">{item.user}</span>
                    {' '}{item.action}{' '}
                    <span className="font-medium text-brand-red">{item.target}</span>
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{formatTimeAgo(item.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </AdminGlass>

        {/* Alert Center */}
        <AdminGlass>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Alert Center
            </h3>
            <span className="text-[10px] text-gray-500">{activeAlerts.length} active</span>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto admin-scrollbar">
            {riskFlags.map(flag => {
              const FlagIcon = flag.severity === 'critical' ? AlertCircle : flag.severity === 'high' ? AlertTriangle : Info
              const iconColor = flag.severity === 'critical' ? 'text-red-400' : flag.severity === 'high' ? 'text-amber-400' : 'text-blue-400'
              return (
                <button
                  key={flag.id}
                  onClick={() => {
                    navigate('compliance/risk-flags')
                    showToast(`Viewing: ${flag.title}`, 'info')
                  }}
                  className="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <FlagIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-semibold text-white truncate">{flag.title}</p>
                        <AdminBadge label={flag.severity} variant={getSeverityBadgeVariant(flag.severity)} />
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-1">{flag.description}</p>
                      <p className="text-[10px] text-gray-600 mt-1">
                        {flag.assignedTo ? `Assigned: ${flag.assignedTo}` : 'Unassigned'}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </AdminGlass>
      </div>

      {/* Row 4: Market News + Economic Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Market News */}
        <AdminGlass>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-blue-400" />
              Market News
            </h3>
            <span className="text-[10px] text-gray-500">India & Global</span>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Globe className="w-8 h-8 text-gray-700 mb-2" />
            <p className="text-xs text-gray-500">No market news available</p>
            <p className="text-[10px] text-gray-600 mt-1">News feed will appear here when connected</p>
          </div>
        </AdminGlass>

        {/* Economic Calendar */}
        <AdminGlass>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Economic Calendar
            </h3>
            <span className="text-[10px] text-gray-500">Upcoming events</span>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="w-8 h-8 text-gray-700 mb-2" />
            <p className="text-xs text-gray-500">No upcoming events</p>
            <p className="text-[10px] text-gray-600 mt-1">Economic calendar events will appear here</p>
          </div>
        </AdminGlass>
      </div>

      {/* Row 5: Quick Navigation Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button onClick={() => navigate('realty-brokers')} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-brand-red/20 transition-all group text-left">
          <Building2 className="w-5 h-5 text-amber-400 mb-2 group-hover:text-brand-red transition-colors" />
          <p className="text-xs font-semibold text-white">Realty Brokers</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Manage broker network</p>
        </button>
        <button onClick={() => navigate('marketing')} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-brand-red/20 transition-all group text-left">
          <Megaphone className="w-5 h-5 text-pink-400 mb-2 group-hover:text-brand-red transition-colors" />
          <p className="text-xs font-semibold text-white">Marketing Hub</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Campaigns & outreach</p>
        </button>
        <button onClick={() => navigate('ai-ops')} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-brand-red/20 transition-all group text-left">
          <Sparkles className="w-5 h-5 text-purple-400 mb-2 group-hover:text-brand-red transition-colors" />
          <p className="text-xs font-semibold text-white">AI Operations</p>
          <p className="text-[10px] text-gray-500 mt-0.5">AI-powered tools</p>
        </button>
        <button onClick={() => navigate('compliance')} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-brand-red/20 transition-all group text-left">
          <Shield className="w-5 h-5 text-emerald-400 mb-2 group-hover:text-brand-red transition-colors" />
          <p className="text-xs font-semibold text-white">Compliance</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Regulatory & risk management</p>
        </button>
      </div>

      {/* Row 6: System Health + Deadlines + Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* System Health */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-emerald-400" />
            System Health
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 flex items-center gap-2">
                <Wifi className="w-3 h-3" /> Uptime
              </span>
              <span className="text-xs font-semibold text-emerald-400">{systemHealth.uptime}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Response Time
              </span>
              <span className="text-xs font-semibold text-white">{systemHealth.responseTime}ms</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400 flex items-center gap-2">
                  <HardDrive className="w-3 h-3" /> Storage
                </span>
                <span className="text-xs text-gray-500">{systemHealth.storageUsed}/{systemHealth.storageTotal} GB</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-red transition-all duration-1000"
                  style={{ width: `${(systemHealth.storageUsed / systemHealth.storageTotal) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Active Users</span>
              <span className="text-xs font-semibold text-white">{systemHealth.activeUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">API Calls (24h)</span>
              <span className="text-xs font-semibold text-white">{systemHealth.apiCalls24h.toLocaleString()}</span>
            </div>
          </div>
        </AdminGlass>

        {/* Upcoming Deadlines */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-400" />
            Upcoming Deadlines
          </h3>
          <div className="space-y-3">
            {deadlines.map(dl => {
              const daysLeft = Math.ceil((new Date(dl.date).getTime() - Date.now()) / 86400000)
              const urgencyColor = daysLeft <= 7 ? 'text-red-400' : daysLeft <= 30 ? 'text-amber-400' : 'text-gray-400'
              return (
                <button
                  key={dl.id}
                  onClick={() => {
                    navigate(dl.module)
                    showToast(`Navigating to ${dl.title}`, 'info')
                  }}
                  className="w-full text-left flex items-start gap-3 group hover:bg-white/[0.03] rounded-lg p-1.5 -mx-1.5 transition-colors"
                >
                  <div className={`text-[10px] font-bold ${urgencyColor} min-w-[40px] text-center`}>
                    {daysLeft > 0 ? `${daysLeft}d` : 'TODAY'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate group-hover:text-brand-red transition-colors">{dl.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {new Date(dl.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <AdminBadge label={dl.priority} variant={getSeverityBadgeVariant(dl.priority)} />
                </button>
              )
            })}
          </div>
        </AdminGlass>

        {/* Quick Stats */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-brand-red" />
            Today&apos;s Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/15">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{overviewKpis.documentsProcessed}</p>
                  <p className="text-[10px] text-gray-500">Docs Processed</p>
                </div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/15">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{overviewKpis.tasksCompleted}</p>
                  <p className="text-[10px] text-gray-500">Tasks Completed</p>
                </div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/15">
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{overviewKpis.pendingApprovals}</p>
                  <p className="text-[10px] text-gray-500">Pending Approvals</p>
                </div>
              </div>
              <button
                onClick={() => navigate('compliance/approvals')}
                className="text-[10px] text-brand-red hover:text-red-300 font-medium transition-colors"
              >
                View
              </button>
            </div>
          </div>
        </AdminGlass>
      </div>
    </div>
  )
}
