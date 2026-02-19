'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, TrendingUp, Briefcase, FileText, ArrowLeftRight,
  HeadphonesIcon, Gift, User, Settings, LogOut, Search, Bell, ChevronDown,
  ChevronRight, ArrowUpRight, ArrowDownRight, Shield, Zap, Download,
  Plus, Eye, Calendar, Clock, Star, Award, Target, PieChart as PieIcon,
  BarChart3, Wallet, IndianRupee, Percent, Building2, Rocket,
  Menu, X, ExternalLink, Copy, CheckCircle, AlertCircle, Info
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts'
import Logo from '@/components/Logo'

// ─── MOCK DATA ──────────────────────────────────────────────
const NAV_HISTORY = [
  { month: 'Apr 24', nav: 100.0, benchmark: 100.0 },
  { month: 'May 24', nav: 102.3, benchmark: 101.1 },
  { month: 'Jun 24', nav: 105.8, benchmark: 102.5 },
  { month: 'Jul 24', nav: 108.2, benchmark: 103.8 },
  { month: 'Aug 24', nav: 107.1, benchmark: 104.2 },
  { month: 'Sep 24', nav: 111.5, benchmark: 105.9 },
  { month: 'Oct 24', nav: 114.7, benchmark: 106.3 },
  { month: 'Nov 24', nav: 118.3, benchmark: 107.8 },
  { month: 'Dec 24', nav: 121.9, benchmark: 108.5 },
  { month: 'Jan 25', nav: 125.4, benchmark: 109.2 },
  { month: 'Feb 25', nav: 128.7, benchmark: 110.1 },
  { month: 'Mar 25', nav: 132.4, benchmark: 111.3 },
]

const ALLOCATION_DATA = [
  { name: 'Stressed RE', value: 45, color: '#D0021B' },
  { name: 'Early-Stage', value: 25, color: '#FF4444' },
  { name: 'Debentures', value: 20, color: '#FF8888' },
  { name: 'Cash/Liquid', value: 10, color: '#1A1A1A' },
]

const PORTFOLIO_ASSETS = [
  {
    name: 'Phoenix Towers - NCLT Recovery',
    type: 'Stressed Real Estate',
    invested: 2500000,
    current: 3125000,
    returnPct: 25.0,
    status: 'active',
    icon: Building2,
  },
  {
    name: 'Meridian Heights - Chennai',
    type: 'Stressed Real Estate',
    invested: 1800000,
    current: 2340000,
    returnPct: 30.0,
    status: 'active',
    icon: Building2,
  },
  {
    name: 'TechStar AI Solutions',
    type: 'Early-Stage Startup',
    invested: 1000000,
    current: 1450000,
    returnPct: 45.0,
    status: 'active',
    icon: Rocket,
  },
  {
    name: 'GHL NCD Series A',
    type: 'Debenture',
    invested: 1500000,
    current: 1627500,
    returnPct: 8.5,
    status: 'active',
    icon: FileText,
  },
]

const RECENT_TRANSACTIONS = [
  { date: '15 Mar 2025', type: 'Investment', amount: 1500000, fund: 'GHL NCD Series A', status: 'completed' },
  { date: '01 Mar 2025', type: 'Dividend', amount: 125000, fund: 'Phoenix Towers', status: 'completed' },
  { date: '15 Feb 2025', type: 'Investment', amount: 1000000, fund: 'TechStar AI', status: 'completed' },
  { date: '01 Feb 2025', type: 'NAV Update', amount: 0, fund: 'All Funds', status: 'info' },
  { date: '15 Jan 2025', type: 'Investment', amount: 2500000, fund: 'Phoenix Towers', status: 'completed' },
]

const ANNOUNCEMENTS = [
  {
    title: 'Q4 NAV Report Published',
    desc: 'Latest quarterly Net Asset Value report is now available for download.',
    date: '10 Mar 2025',
    type: 'report',
  },
  {
    title: 'New Investment Opportunity',
    desc: 'Stressed real estate asset in Bengaluru with 40% discount from IBC resolution.',
    date: '05 Mar 2025',
    type: 'opportunity',
  },
  {
    title: 'KYC Verification Update',
    desc: 'Annual KYC re-verification due by 31 March 2025.',
    date: '01 Mar 2025',
    type: 'alert',
  },
]

const MARKET_DATA = [
  { name: 'SENSEX', value: '73,842.16', change: '+1.24%', up: true },
  { name: 'NIFTY 50', value: '22,456.80', change: '+0.98%', up: true },
  { name: 'GOLD', value: '71,230', change: '-0.32%', up: false },
  { name: 'USD/INR', value: '83.12', change: '+0.15%', up: true },
]

// ─── SIDEBAR ITEMS ──────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'invest', label: 'Invest', icon: TrendingUp },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'support', label: 'Support', icon: HeadphonesIcon },
  { id: 'referrals', label: 'Referrals', icon: Gift },
]

const SIDEBAR_BOTTOM = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
]

// ─── HELPERS ────────────────────────────────────────────────
function formatINR(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `${(n / 100000).toFixed(2)} L`
  return new Intl.NumberFormat('en-IN').format(n)
}

function useAnimatedCounter(end: number, duration = 2000) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setVal(Math.floor(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [end, duration])
  return val
}

// ─── GLASS CARD ─────────────────────────────────────────────
function Glass({
  children,
  className = '',
  hover = true,
  glow = false,
}: {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
}) {
  return (
    <div
      className={`
        relative rounded-2xl border border-white/[0.08] overflow-hidden
        ${hover ? 'dash-glass-hover' : ''}
        ${glow ? 'dash-glow' : ''}
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }}
    >
      {/* Inner shine */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

// ─── KYC BADGE ──────────────────────────────────────────────
function KYCBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
      <Shield className="w-3 h-3" />
      KYC Verified
    </span>
  )
}

// ─── CHART TOOLTIP ──────────────────────────────────────────
function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-4 py-3 border border-white/10 shadow-2xl"
      style={{
        background: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <p className="text-xs text-gray-400 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(2)}
        </p>
      ))}
    </div>
  )
}

// ─── QUICK ACTION ───────────────────────────────────────────
function QuickAction({
  icon: Icon,
  label,
  desc,
  color,
}: {
  icon: any
  label: string
  desc: string
  color: string
}) {
  return (
    <button className="group text-left w-full">
      <Glass className="p-4 h-full" hover>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
          style={{ background: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <p className="text-sm font-semibold text-white mb-0.5">{label}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
      </Glass>
    </button>
  )
}

// =============================================================
// MAIN DASHBOARD COMPONENT
// =============================================================
export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifications, setNotifications] = useState(3)
  const [currentTime, setCurrentTime] = useState('')
  const [greeting, setGreeting] = useState('')

  // Animated counters
  const portfolioValue = useAnimatedCounter(8542500)
  const aifInvestment = useAnimatedCounter(6300000)
  const debentureValue = useAnimatedCounter(1627500)
  const currentNAV = useAnimatedCounter(13242)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      )
      const hour = now.getHours()
      if (hour < 12) setGreeting('Good Morning')
      else if (hour < 17) setGreeting('Good Afternoon')
      else setGreeting('Good Evening')
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const totalReturn = useMemo(() => {
    const invested = PORTFOLIO_ASSETS.reduce((s, a) => s + a.invested, 0)
    const current = PORTFOLIO_ASSETS.reduce((s, a) => s + a.current, 0)
    return ((current - invested) / invested * 100).toFixed(1)
  }, [])

  // ─── SIDEBAR ────────────────────────────────────────────
  const renderSidebar = () => (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 w-[260px] flex flex-col
          transition-transform duration-500 ease-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'linear-gradient(180deg, rgba(10,10,10,0.98) 0%, rgba(15,5,5,0.98) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(40px)',
        }}
      >
        {/* Logo */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size={36} />
            <div>
              <p className="text-sm font-bold text-white tracking-tight">GHL India</p>
              <p className="text-[10px] text-brand-red font-medium tracking-widest uppercase">Ventures</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Investor badge */}
        <div className="px-6 mb-6">
          <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Investor</p>
            <p className="text-sm text-white font-semibold">Rajesh Krishnan</p>
            <p className="text-[10px] text-gray-500 mt-0.5">ID: GHL-INV-2024-0847</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-300 group relative
                  ${isActive
                    ? 'text-white bg-brand-red/15 border border-brand-red/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-brand-red" />
                )}
                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-brand-red' : 'text-gray-500 group-hover:text-gray-300'}`} />
                {item.label}
                {item.id === 'referrals' && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-brand-red/20 text-brand-red font-bold">
                    NEW
                  </span>
                )}
              </button>
            )
          })}

          <div className="my-4 border-t border-white/[0.06]" />

          {SIDEBAR_BOTTOM.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id)
                setSidebarOpen(false)
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-300 group
                ${activeTab === item.id
                  ? 'text-white bg-white/[0.06]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                }
              `}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6 pt-2">
          <Link
            href="/login"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              text-gray-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-300"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </Link>
        </div>
      </aside>
    </>
  )

  // ─── TOP BAR ────────────────────────────────────────────
  const renderTopBar = () => (
    <header
      className="sticky top-0 z-30 border-b border-white/[0.06]"
      style={{
        background: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }}
    >
      {/* Market Ticker */}
      <div className="border-b border-white/[0.04] px-4 py-1.5 overflow-hidden">
        <div className="flex items-center gap-6 text-xs animate-marquee whitespace-nowrap">
          {[...MARKET_DATA, ...MARKET_DATA].map((m, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <span className="text-gray-500 font-medium">{m.name}</span>
              <span className="text-white font-semibold">{m.value}</span>
              <span className={`font-semibold ${m.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {m.change}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Main bar */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        {/* Left: Hamburger + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors p-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <span>Portal</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white capitalize">{activeTab}</span>
          </div>
          <div className="sm:hidden">
            <p className="text-sm font-semibold text-white capitalize">{activeTab}</p>
          </div>
        </div>

        {/* Right: Search + Notifications + Avatar */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] w-56 focus-within:border-brand-red/30 transition-colors">
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-600 w-full"
            />
            <kbd className="text-[10px] text-gray-600 border border-white/[0.08] rounded px-1">
              /
            </kbd>
          </div>

          {/* Mobile search toggle */}
          <button className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors">
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors">
            <Bell className="w-4 h-4" />
            {notifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-red text-[9px] font-bold text-white flex items-center justify-center dash-pulse-dot">
                {notifications}
              </span>
            )}
          </button>

          {/* Time */}
          <span className="hidden lg:block text-[11px] text-gray-500 ml-2">
            {currentTime}
          </span>

          {/* Avatar */}
          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-white/[0.06]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/[0.08]">
              RK
            </div>
            <ChevronDown className="w-3 h-3 text-gray-500 hidden sm:block" />
          </div>
        </div>
      </div>
    </header>
  )

  // ─── HERO METRICS ───────────────────────────────────────
  const renderHeroMetrics = () => {
    const metrics = [
      {
        label: 'Total Portfolio',
        value: `\u20B9${formatINR(portfolioValue)}`,
        change: `+${totalReturn}%`,
        up: true,
        icon: Wallet,
        gradient: 'from-brand-red/20 to-red-900/20',
        iconColor: '#D0021B',
      },
      {
        label: 'AIF Investment',
        value: `\u20B9${formatINR(aifInvestment)}`,
        change: '+32.4%',
        up: true,
        icon: Building2,
        gradient: 'from-emerald-500/20 to-emerald-900/20',
        iconColor: '#10B981',
      },
      {
        label: 'Debenture Value',
        value: `\u20B9${formatINR(debentureValue)}`,
        change: '+8.5%',
        up: true,
        icon: FileText,
        gradient: 'from-blue-500/20 to-blue-900/20',
        iconColor: '#3B82F6',
      },
      {
        label: 'Current NAV',
        value: `\u20B9${(currentNAV / 100).toFixed(2)}`,
        change: '+32.4%',
        up: true,
        icon: TrendingUp,
        gradient: 'from-amber-500/20 to-amber-900/20',
        iconColor: '#F59E0B',
      },
    ]

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Glass key={i} className="p-5" hover glow>
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center`}
              >
                <m.icon className="w-5 h-5" style={{ color: m.iconColor }} />
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  m.up
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-red-500/15 text-red-400'
                }`}
              >
                {m.up ? <ArrowUpRight className="w-3 h-3 inline mr-0.5" /> : <ArrowDownRight className="w-3 h-3 inline mr-0.5" />}
                {m.change}
              </span>
            </div>
            <p className="text-2xl font-extrabold text-white tracking-tight mb-0.5">
              {m.value}
            </p>
            <p className="text-xs text-gray-500">{m.label}</p>
          </Glass>
        ))}
      </div>
    )
  }

  // ─── NAV CHART ──────────────────────────────────────────
  const renderNAVChart = () => (
    <Glass className="p-5 lg:p-6" hover>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-white mb-0.5">NAV Performance</h3>
          <p className="text-xs text-gray-500">Fund NAV vs NIFTY 50 Benchmark</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-red" />
            <span className="text-gray-400">Fund NAV</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
            <span className="text-gray-400">Benchmark</span>
          </span>
        </div>
      </div>
      <div className="h-[280px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={NAV_HISTORY}>
            <defs>
              <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D0021B" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#D0021B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#6B7280', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="nav"
              name="Fund NAV"
              stroke="#D0021B"
              strokeWidth={2.5}
              fill="url(#navGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#D0021B', stroke: '#fff', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="benchmark"
              name="Benchmark"
              stroke="#4B5563"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Glass>
  )

  // ─── ALLOCATION CHART ─────────────────────────────────────
  const renderAllocationChart = () => (
    <Glass className="p-5 lg:p-6" hover>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-white mb-0.5">Allocation</h3>
          <p className="text-xs text-gray-500">Investment distribution</p>
        </div>
        <PieIcon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={ALLOCATION_DATA}
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {ALLOCATION_DATA.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div
                    className="rounded-lg px-3 py-2 border border-white/10"
                    style={{ background: 'rgba(26,26,26,0.95)', backdropFilter: 'blur(20px)' }}
                  >
                    <p className="text-xs font-semibold text-white">{d.name}: {d.value}%</p>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="space-y-2 mt-4">
        {ALLOCATION_DATA.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
              <span className="text-gray-400">{d.name}</span>
            </span>
            <span className="text-white font-semibold">{d.value}%</span>
          </div>
        ))}
      </div>
    </Glass>
  )

  // ─── QUICK ACTIONS ────────────────────────────────────────
  const renderQuickActions = () => (
    <div>
      <h3 className="text-base font-bold text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickAction icon={Plus} label="New Investment" desc="Explore opportunities" color="#D0021B" />
        <QuickAction icon={Download} label="Statements" desc="Download reports" color="#3B82F6" />
        <QuickAction icon={Eye} label="View NAV" desc="Latest fund NAV" color="#10B981" />
        <QuickAction icon={HeadphonesIcon} label="Get Support" desc="Talk to advisor" color="#F59E0B" />
      </div>
    </div>
  )

  // ─── PORTFOLIO ASSETS ─────────────────────────────────────
  const renderPortfolioAssets = () => (
    <Glass className="p-5 lg:p-6" hover>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-white mb-0.5">Portfolio Assets</h3>
          <p className="text-xs text-gray-500">{PORTFOLIO_ASSETS.length} active investments</p>
        </div>
        <button className="text-xs text-brand-red hover:text-red-300 font-semibold transition-colors flex items-center gap-1">
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-3">
        {PORTFOLIO_ASSETS.map((asset, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
              <asset.icon className="w-5 h-5 text-gray-400 group-hover:text-brand-red transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{asset.name}</p>
              <p className="text-xs text-gray-500">{asset.type}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-white">{'\u20B9'}{formatINR(asset.current)}</p>
              <p className={`text-xs font-semibold ${asset.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {asset.returnPct >= 0 ? '+' : ''}{asset.returnPct}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </Glass>
  )

  // ─── RECENT ACTIVITY ──────────────────────────────────────
  const renderRecentActivity = () => (
    <Glass className="p-5 lg:p-6" hover>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-white mb-0.5">Recent Activity</h3>
          <p className="text-xs text-gray-500">Latest transactions</p>
        </div>
        <button className="text-xs text-brand-red hover:text-red-300 font-semibold transition-colors flex items-center gap-1">
          All <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-2.5">
        {RECENT_TRANSACTIONS.map((tx, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                tx.type === 'Investment'
                  ? 'bg-blue-500/15'
                  : tx.type === 'Dividend'
                  ? 'bg-emerald-500/15'
                  : 'bg-gray-500/15'
              }`}
            >
              {tx.type === 'Investment' ? (
                <ArrowUpRight className="w-4 h-4 text-blue-400" />
              ) : tx.type === 'Dividend' ? (
                <IndianRupee className="w-4 h-4 text-emerald-400" />
              ) : (
                <Info className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white">{tx.type}</p>
              <p className="text-[11px] text-gray-500 truncate">{tx.fund}</p>
            </div>
            <div className="text-right shrink-0">
              {tx.amount > 0 && (
                <p className={`text-xs font-bold ${tx.type === 'Dividend' ? 'text-emerald-400' : 'text-white'}`}>
                  {tx.type === 'Dividend' ? '+' : ''}{'\u20B9'}{formatINR(tx.amount)}
                </p>
              )}
              <p className="text-[10px] text-gray-600">{tx.date}</p>
            </div>
          </div>
        ))}
      </div>
    </Glass>
  )

  // ─── ANNOUNCEMENTS ────────────────────────────────────────
  const renderAnnouncements = () => (
    <Glass className="p-5 lg:p-6" hover>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-white">Announcements</h3>
        <Bell className="w-4 h-4 text-gray-500" />
      </div>
      <div className="space-y-3">
        {ANNOUNCEMENTS.map((a, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  a.type === 'report'
                    ? 'bg-blue-500/15'
                    : a.type === 'opportunity'
                    ? 'bg-emerald-500/15'
                    : 'bg-amber-500/15'
                }`}
              >
                {a.type === 'report' ? (
                  <FileText className="w-4 h-4 text-blue-400" />
                ) : a.type === 'opportunity' ? (
                  <Star className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white group-hover:text-brand-red transition-colors">
                  {a.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{a.desc}</p>
                <p className="text-[10px] text-gray-600 mt-1.5">{a.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Glass>
  )

  // ─── REFERRAL CARD ────────────────────────────────────────
  const renderReferralCard = () => (
    <Glass className="p-5 lg:p-6 relative overflow-hidden" hover glow>
      {/* Decorative background */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand-red/10 rounded-full blur-[60px]" />
      <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-brand-red/5 rounded-full blur-[40px]" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red/20 to-red-900/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-brand-red" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Refer & Earn</h3>
            <p className="text-xs text-gray-500">Invite investors, earn rewards</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          Refer qualified investors to GHL India Ventures and earn referral bonuses on their investments.
        </p>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
          <code className="flex-1 text-xs text-gray-300 font-mono truncate">
            https://ghlindiaventures.com/ref/RK2024
          </code>
          <button className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div>
            <p className="text-gray-500">Referred</p>
            <p className="text-white font-bold text-lg">3</p>
          </div>
          <div className="w-px h-8 bg-white/[0.06]" />
          <div>
            <p className="text-gray-500">Earned</p>
            <p className="text-emerald-400 font-bold text-lg">{'\u20B9'}75K</p>
          </div>
        </div>
      </div>
    </Glass>
  )

  // ─── INVEST TAB ───────────────────────────────────────────
  const renderInvestTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Investment Opportunities</h2>
        <p className="text-sm text-gray-500">Explore current investment options</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            title: 'Category II AIF - Direct Route',
            desc: 'Invest directly in the SEBI-registered AIF with exposure to stressed real estate and early-stage startups.',
            min: '\u20B91 Crore',
            targetReturn: '18-22% IRR',
            tenure: '5-7 Years',
            risk: 'High',
            icon: Building2,
            color: '#D0021B',
          },
          {
            title: 'Debenture Route (NCD)',
            desc: 'Non-Convertible Debenture structure offering fixed returns with exposure to the same asset pool.',
            min: '\u20B910 Lakhs',
            targetReturn: '12-15% p.a.',
            tenure: '3-5 Years',
            risk: 'Moderate',
            icon: FileText,
            color: '#3B82F6',
          },
          {
            title: 'NCLT Recovery Assets',
            desc: 'Stressed real estate properties acquired at 40-60% discount through IBC resolution process.',
            min: '\u20B950 Lakhs',
            targetReturn: '25-35% IRR',
            tenure: '2-4 Years',
            risk: 'High',
            icon: Target,
            color: '#10B981',
          },
          {
            title: 'Early-Stage Startups',
            desc: 'Pre-Series A and Series A investments in high-growth Indian startups across technology sectors.',
            min: '\u20B925 Lakhs',
            targetReturn: '30-50% IRR',
            tenure: '5-8 Years',
            risk: 'Very High',
            icon: Rocket,
            color: '#F59E0B',
          },
        ].map((opp, i) => (
          <Glass key={i} className="p-6" hover glow>
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${opp.color}15` }}
              >
                <opp.icon className="w-6 h-6" style={{ color: opp.color }} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">{opp.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{opp.desc}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-white/[0.02]">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Min Investment</p>
                <p className="text-sm font-bold text-white">{opp.min}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02]">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Target Return</p>
                <p className="text-sm font-bold text-emerald-400">{opp.targetReturn}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02]">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Tenure</p>
                <p className="text-sm font-bold text-white">{opp.tenure}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02]">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Risk Level</p>
                <p className={`text-sm font-bold ${
                  opp.risk === 'Very High' ? 'text-red-400' :
                  opp.risk === 'High' ? 'text-amber-400' : 'text-blue-400'
                }`}>{opp.risk}</p>
              </div>
            </div>
            <button className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
              Express Interest
            </button>
          </Glass>
        ))}
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-600">
          All investments are subject to market risks. Past performance is not indicative of future results. SEBI Reg: IN/AIF2/2425/1517
        </p>
      </div>
    </div>
  )

  // ─── PORTFOLIO TAB ────────────────────────────────────────
  const renderPortfolioTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Your Portfolio</h2>
        <p className="text-sm text-gray-500">Detailed view of all investments</p>
      </div>
      {renderHeroMetrics()}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">{renderNAVChart()}</div>
        <div>{renderAllocationChart()}</div>
      </div>
      {renderPortfolioAssets()}
    </div>
  )

  // ─── DOCUMENTS TAB ────────────────────────────────────────
  const renderDocumentsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Documents</h2>
        <p className="text-sm text-gray-500">Download reports, statements & legal documents</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'Q4 2024 NAV Report', type: 'PDF', size: '2.4 MB', date: '10 Mar 2025', category: 'Reports' },
          { name: 'Annual Statement FY24', type: 'PDF', size: '5.1 MB', date: '15 Apr 2024', category: 'Statements' },
          { name: 'PPM Document', type: 'PDF', size: '12.3 MB', date: '01 Jan 2024', category: 'Legal' },
          { name: 'Tax Certificate (TDS)', type: 'PDF', size: '1.2 MB', date: '30 Jun 2024', category: 'Tax' },
          { name: 'Investment Agreement', type: 'PDF', size: '3.8 MB', date: '15 Dec 2023', category: 'Legal' },
          { name: 'KYC Documents', type: 'ZIP', size: '8.5 MB', date: '01 Nov 2023', category: 'KYC' },
        ].map((doc, i) => (
          <Glass key={i} className="p-5 group cursor-pointer" hover>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white group-hover:text-brand-red transition-colors truncate">{doc.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{doc.category} &bull; {doc.size}</p>
                <p className="text-[10px] text-gray-600 mt-1">{doc.date}</p>
              </div>
              <Download className="w-4 h-4 text-gray-600 group-hover:text-brand-red transition-colors shrink-0 mt-1" />
            </div>
          </Glass>
        ))}
      </div>
    </div>
  )

  // ─── TRANSACTIONS TAB ─────────────────────────────────────
  const renderTransactionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Transactions</h2>
          <p className="text-sm text-gray-500">Complete transaction history</p>
        </div>
        <button className="flex items-center gap-2 text-xs text-brand-red hover:text-red-300 font-semibold transition-colors">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
      <Glass className="overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs text-gray-500 font-medium py-3 px-5">Date</th>
                <th className="text-left text-xs text-gray-500 font-medium py-3 px-5">Type</th>
                <th className="text-left text-xs text-gray-500 font-medium py-3 px-5">Fund</th>
                <th className="text-right text-xs text-gray-500 font-medium py-3 px-5">Amount</th>
                <th className="text-right text-xs text-gray-500 font-medium py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...RECENT_TRANSACTIONS,
                { date: '01 Jan 2025', type: 'Dividend', amount: 95000, fund: 'Meridian Heights', status: 'completed' },
                { date: '15 Dec 2024', type: 'Investment', amount: 1800000, fund: 'Meridian Heights', status: 'completed' },
                { date: '01 Dec 2024', type: 'NAV Update', amount: 0, fund: 'All Funds', status: 'info' },
              ].map((tx, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-5 text-gray-400 text-xs">{tx.date}</td>
                  <td className="py-3 px-5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      tx.type === 'Investment' ? 'bg-blue-500/15 text-blue-400' :
                      tx.type === 'Dividend' ? 'bg-emerald-500/15 text-emerald-400' :
                      'bg-gray-500/15 text-gray-400'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-white text-xs font-medium">{tx.fund}</td>
                  <td className="py-3 px-5 text-right text-white text-xs font-semibold">
                    {tx.amount > 0 ? `\u20B9${formatINR(tx.amount)}` : '-'}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                      tx.status === 'completed' ? 'text-emerald-400' : 'text-gray-500'
                    }`}>
                      {tx.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                      {tx.status === 'completed' ? 'Completed' : 'Info'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Glass>
    </div>
  )

  // ─── SUPPORT TAB ──────────────────────────────────────────
  const renderSupportTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Support</h2>
        <p className="text-sm text-gray-500">Get help from our advisory team</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            title: 'Schedule a Call',
            desc: 'Book a call with your relationship manager for investment guidance.',
            icon: Calendar,
            color: '#D0021B',
            action: 'Book Now',
          },
          {
            title: 'Email Support',
            desc: 'Write to us and our team will respond within 24 hours.',
            icon: ExternalLink,
            color: '#3B82F6',
            action: 'Send Email',
          },
          {
            title: 'WhatsApp',
            desc: 'Quick queries? Message us directly on WhatsApp.',
            icon: HeadphonesIcon,
            color: '#10B981',
            action: 'Chat Now',
          },
        ].map((item, i) => (
          <Glass key={i} className="p-6" hover glow>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${item.color}15` }}>
              <item.icon className="w-6 h-6" style={{ color: item.color }} />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">{item.desc}</p>
            <button className="text-xs font-semibold text-brand-red hover:text-red-300 transition-colors flex items-center gap-1">
              {item.action} <ChevronRight className="w-3 h-3" />
            </button>
          </Glass>
        ))}
      </div>

      {/* FAQ */}
      <Glass className="p-6" hover>
        <h3 className="text-base font-bold text-white mb-4">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {[
            { q: 'How do I track my investment performance?', a: 'Navigate to the Portfolio tab to see real-time NAV updates, allocation breakdown, and detailed asset-level performance.' },
            { q: 'When is the next NAV update?', a: 'NAV is updated quarterly. The next update will be available by 15 April 2025.' },
            { q: 'How do I increase my investment?', a: 'Go to the Invest tab and click "Express Interest" on your preferred investment vehicle. Our team will reach out within 24 hours.' },
          ].map((faq, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-sm font-semibold text-white mb-1.5">{faq.q}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </Glass>
    </div>
  )

  // ─── REFERRALS TAB ────────────────────────────────────────
  const renderReferralsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Referral Program</h2>
        <p className="text-sm text-gray-500">Invite investors and earn rewards</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">{renderReferralCard()}</div>
        <Glass className="p-6" hover>
          <h4 className="text-sm font-bold text-white mb-4">How It Works</h4>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Share Link', desc: 'Share your unique referral link' },
              { step: '2', title: 'They Invest', desc: 'Your referral completes investment' },
              { step: '3', title: 'You Earn', desc: 'Receive referral bonus in your account' },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-brand-red/15 flex items-center justify-center text-xs font-bold text-brand-red shrink-0">
                  {s.step}
                </span>
                <div>
                  <p className="text-xs font-semibold text-white">{s.title}</p>
                  <p className="text-[11px] text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Glass>
      </div>

      {/* Referral history */}
      <Glass className="p-6" hover>
        <h3 className="text-base font-bold text-white mb-4">Referral History</h3>
        <div className="space-y-3">
          {[
            { name: 'Amit Sharma', status: 'Invested', amount: '\u20B950L', date: '15 Feb 2025', bonus: '\u20B925K' },
            { name: 'Priya Nair', status: 'Invested', amount: '\u20B91 Cr', date: '20 Jan 2025', bonus: '\u20B950K' },
            { name: 'Sanjay Mehta', status: 'Onboarding', amount: '-', date: '05 Mar 2025', bonus: 'Pending' },
          ].map((ref, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-red/20 to-red-900/20 flex items-center justify-center text-xs font-bold text-brand-red">
                {ref.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{ref.name}</p>
                <p className="text-[11px] text-gray-500">{ref.date}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-semibold ${ref.status === 'Invested' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {ref.status}
                </p>
                <p className="text-xs text-gray-500">{ref.bonus}</p>
              </div>
            </div>
          ))}
        </div>
      </Glass>
    </div>
  )

  // ─── PROFILE TAB ──────────────────────────────────────────
  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Your Profile</h2>
        <p className="text-sm text-gray-500">Manage your account information</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <Glass className="p-6 text-center" hover glow>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 ring-4 ring-white/[0.08]">
            RK
          </div>
          <h3 className="text-lg font-bold text-white">Rajesh Krishnan</h3>
          <p className="text-xs text-gray-500 mb-3">rajesh.k@email.com</p>
          <KYCBadge />
          <div className="mt-4 pt-4 border-t border-white/[0.06] text-left space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Investor ID</span>
              <span className="text-white font-medium">GHL-INV-2024-0847</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">PAN</span>
              <span className="text-white font-medium">ABCPK****F</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Mobile</span>
              <span className="text-white font-medium">+91 98XXX XXXXX</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Joined</span>
              <span className="text-white font-medium">December 2023</span>
            </div>
          </div>
        </Glass>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          <Glass className="p-6" hover>
            <h4 className="text-sm font-bold text-white mb-4">Personal Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Full Name', value: 'Rajesh Krishnan' },
                { label: 'Email', value: 'rajesh.k@email.com' },
                { label: 'Phone', value: '+91 98765 43210' },
                { label: 'City', value: 'Chennai, Tamil Nadu' },
                { label: 'Date of Birth', value: '15 Aug 1978' },
                { label: 'Occupation', value: 'Business Owner' },
              ].map((d, i) => (
                <div key={i}>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">{d.label}</p>
                  <p className="text-sm text-white font-medium">{d.value}</p>
                </div>
              ))}
            </div>
          </Glass>
          <Glass className="p-6" hover>
            <h4 className="text-sm font-bold text-white mb-4">Investment Summary</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Invested', value: '\u20B968.0L' },
                { label: 'Current Value', value: '\u20B985.4L' },
                { label: 'Total Return', value: `+${totalReturn}%` },
                { label: 'Active Assets', value: '4' },
              ].map((s, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-white/[0.02]">
                  <p className="text-lg font-bold text-white">{s.value}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </Glass>
        </div>
      </div>
    </div>
  )

  // ─── SETTINGS TAB ─────────────────────────────────────────
  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Settings</h2>
        <p className="text-sm text-gray-500">Manage your preferences</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          {
            title: 'Notifications',
            desc: 'Manage email and push notification preferences',
            icon: Bell,
            options: ['Email Alerts', 'NAV Updates', 'Investment Opportunities', 'Dividend Notifications'],
          },
          {
            title: 'Security',
            desc: 'Password, two-factor authentication, and sessions',
            icon: Shield,
            options: ['Change Password', 'Enable 2FA', 'Active Sessions', 'Login History'],
          },
        ].map((section, i) => (
          <Glass key={i} className="p-6" hover>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                <section.icon className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{section.title}</h4>
                <p className="text-xs text-gray-500">{section.desc}</p>
              </div>
            </div>
            <div className="space-y-2">
              {section.options.map((opt, j) => (
                <div key={j} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <span className="text-xs text-gray-400 group-hover:text-white transition-colors">{opt}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </div>
              ))}
            </div>
          </Glass>
        ))}
      </div>
    </div>
  )

  // ─── RENDER ACTIVE TAB ────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'invest':
        return renderInvestTab()
      case 'portfolio':
        return renderPortfolioTab()
      case 'documents':
        return renderDocumentsTab()
      case 'transactions':
        return renderTransactionsTab()
      case 'support':
        return renderSupportTab()
      case 'referrals':
        return renderReferralsTab()
      case 'profile':
        return renderProfileTab()
      case 'settings':
        return renderSettingsTab()
      default:
        return renderDashboardHome()
    }
  }

  // ─── DASHBOARD HOME ───────────────────────────────────────
  const renderDashboardHome = () => (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white mb-0.5">
            {greeting}, <span className="text-brand-red">Rajesh</span>
          </h2>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            Welcome to your investor portal
            <KYCBadge />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
            <Plus className="w-3.5 h-3.5 inline mr-1.5" />
            New Investment
          </button>
        </div>
      </div>

      {/* Hero Metrics */}
      {renderHeroMetrics()}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">{renderNAVChart()}</div>
        <div>{renderAllocationChart()}</div>
      </div>

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">{renderPortfolioAssets()}</div>
        <div className="lg:col-span-1">{renderRecentActivity()}</div>
        <div className="space-y-4">
          {renderAnnouncements()}
          {renderReferralCard()}
        </div>
      </div>
    </div>
  )

  // ─── MAIN RENDER ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-brand-black relative">
      {/* Background ambient effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-red/[0.03] rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-red/[0.02] rounded-full blur-[180px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Sidebar */}
      {renderSidebar()}

      {/* Main content area */}
      <div className="lg:ml-[260px] relative z-10 min-h-screen flex flex-col">
        {renderTopBar()}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderContent()}
        </div>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-600">
          <p>&copy; 2025 GHL India Ventures. SEBI Reg: IN/AIF2/2425/1517</p>
          <p className="flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            256-bit SSL Encrypted &bull; SEBI Compliant
          </p>
        </footer>
      </div>
    </div>
  )
}
