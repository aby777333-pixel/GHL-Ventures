'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, TrendingUp, Briefcase, FileText, ArrowLeftRight,
  HeadphonesIcon, Gift, User, Settings, LogOut, Search, Bell, ChevronDown,
  ChevronRight, ArrowUpRight, ArrowDownRight, Shield, Zap, Download,
  Plus, Eye, Calendar, Clock, Star, Award, Target, PieChart as PieIcon,
  BarChart3, Wallet, IndianRupee, Percent, Building2, Rocket,
  Menu, X, ExternalLink, Copy, CheckCircle, AlertCircle, Info,
  Upload, Camera, MessageSquare, Ticket, Phone, Video, Globe,
  Sun, Moon, Lock, CreditCard, Users, MapPin, Landmark, FileCheck,
  Send, Paperclip, ChevronUp, HelpCircle, RefreshCw, Fingerprint,
  BookOpen, Languages, Sparkles, CircleDot, Filter, MoreHorizontal,
  Home, Mail, BellRing, Archive, Trash2, ImageIcon, Flag,
  Activity, Gauge, Timer, Newspaper, AlarmClock, TrendingDown,
  Flame, DollarSign, Megaphone, Trophy, Heart, Banknote,
  Calculator, FolderOpen, FileUp, Sliders, ScrollText
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart,
  BarChart, Bar,
} from 'recharts'
import Logo from '@/components/Logo'

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
type Theme = 'dark' | 'light'
type TabId = 'dashboard' | 'investments' | 'invest-onboard' | 'portfolio' | 'kyc' | 'transactions' | 'messages' | 'support' | 'referrals' | 'calculators' | 'profile' | 'settings'

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════ */
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
  { name: 'Early-Stage', value: 25, color: '#10B981' },
  { name: 'Co-Invest', value: 20, color: '#3B82F6' },
  { name: 'Cash/Liquid', value: 10, color: '#F59E0B' },
]

const PORTFOLIO_ASSETS = [
  { name: 'Phoenix Towers - NCLT Recovery', type: 'Stressed Real Estate', invested: 2500000, current: 3125000, returnPct: 25.0, status: 'active', milestone: 75 },
  { name: 'Meridian Heights - Chennai', type: 'Stressed Real Estate', invested: 1800000, current: 2340000, returnPct: 30.0, status: 'active', milestone: 60 },
  { name: 'TechStar AI Solutions', type: 'Early-Stage Startup', invested: 1000000, current: 1450000, returnPct: 45.0, status: 'active', milestone: 40 },
  { name: 'GHL Co-Invest Series A', type: 'Co-Invest Instrument', invested: 1500000, current: 1627500, returnPct: 8.5, status: 'active', milestone: 85 },
]

const RECENT_TRANSACTIONS = [
  { id: 'T001', date: '15 Mar 2025', type: 'Investment', amount: 1500000, fund: 'GHL Co-Invest Series A', status: 'completed' },
  { id: 'T002', date: '01 Mar 2025', type: 'Dividend', amount: 125000, fund: 'Phoenix Towers', status: 'completed' },
  { id: 'T003', date: '15 Feb 2025', type: 'Investment', amount: 1000000, fund: 'TechStar AI', status: 'completed' },
  { id: 'T004', date: '01 Feb 2025', type: 'NAV Update', amount: 0, fund: 'All Funds', status: 'info' },
  { id: 'T005', date: '15 Jan 2025', type: 'Investment', amount: 2500000, fund: 'Phoenix Towers', status: 'completed' },
  { id: 'T006', date: '01 Jan 2025', type: 'Dividend', amount: 95000, fund: 'Meridian Heights', status: 'completed' },
  { id: 'T007', date: '15 Dec 2024', type: 'Investment', amount: 1800000, fund: 'Meridian Heights', status: 'completed' },
]

const MARKET_DATA = [
  { name: 'SENSEX', value: '73,842', change: '+1.24%', up: true },
  { name: 'NIFTY 50', value: '22,456', change: '+0.98%', up: true },
  { name: 'GOLD', value: '71,230', change: '-0.32%', up: false },
  { name: 'USD/INR', value: '83.12', change: '+0.15%', up: true },
]

const KYC_STEPS = [
  { id: 'personal', label: 'Personal Details', status: 'completed' as const, icon: User },
  { id: 'business', label: 'Business Details', status: 'completed' as const, icon: Building2 },
  { id: 'bank', label: 'Bank Details', status: 'completed' as const, icon: Landmark },
  { id: 'demat', label: 'Demat Account', status: 'pending' as const, icon: CreditCard },
  { id: 'nominee', label: 'Nominee Details', status: 'pending' as const, icon: Users },
  { id: 'documents', label: 'Document Upload', status: 'in-review' as const, icon: FileCheck },
]

const MESSAGES_DATA = [
  { id: 1, from: 'Relationship Manager', subject: 'Q4 Portfolio Review Summary', preview: 'Dear Rajesh, Your Q4 2024 portfolio has shown exceptional performance...', time: '2h ago', read: false, avatar: 'RM' },
  { id: 2, from: 'GHL Compliance', subject: 'Annual KYC Re-verification', preview: 'As per SEBI regulations, please update your KYC documents by March 31...', time: '1d ago', read: false, avatar: 'GC' },
  { id: 3, from: 'Investment Team', subject: 'New Opportunity: Bengaluru Stressed Asset', preview: 'We are excited to share a new stressed real estate opportunity in Bengaluru...', time: '3d ago', read: true, avatar: 'IT' },
  { id: 4, from: 'Support Team', subject: 'Re: Tax Certificate Query', preview: 'Your TDS certificate for FY2024 has been uploaded to your documents section...', time: '5d ago', read: true, avatar: 'ST' },
]

const SUPPORT_TICKETS = [
  { id: 'TKT-001', subject: 'Tax Certificate for FY2024', status: 'resolved', date: '10 Mar 2025', priority: 'medium' },
  { id: 'TKT-002', subject: 'NAV Statement Download Issue', status: 'open', date: '15 Mar 2025', priority: 'low' },
]

const NOTIFICATIONS_DATA = [
  { id: 1, title: 'Q4 NAV Report Published', desc: 'Latest quarterly NAV report is ready for download.', time: '2h ago', type: 'report', read: false },
  { id: 2, title: 'New Investment Opportunity', desc: 'Stressed asset in Bengaluru at 40% discount.', time: '1d ago', type: 'opportunity', read: false },
  { id: 3, title: 'KYC Re-verification Due', desc: 'Annual KYC update required by 31 March 2025.', time: '3d ago', type: 'alert', read: false },
  { id: 4, title: 'Dividend Credited', desc: 'Dividend of \u20B91,25,000 from Phoenix Towers.', time: '5d ago', type: 'payment', read: true },
  { id: 5, title: 'Portfolio Milestone', desc: 'Your portfolio has crossed \u20B985 Lakh mark!', time: '7d ago', type: 'milestone', read: true },
]

const TOUR_STEPS = [
  { target: 'dashboard', title: 'Welcome to Your Dashboard', desc: 'Get a bird\u2019s-eye view of your portfolio, performance, and recent activity all in one place.' },
  { target: 'investments', title: 'Explore Investments', desc: 'Browse available investment opportunities, express interest, and modify your allocations.' },
  { target: 'portfolio', title: 'Track Performance', desc: 'View NAV trends, asset allocation, and milestone progress for each investment.' },
  { target: 'kyc', title: 'KYC & Documents', desc: 'Upload documents, track your KYC status, and manage compliance requirements.' },
  { target: 'messages', title: 'Secure Messages', desc: 'Communicate directly with your relationship manager and support team.' },
  { target: 'support', title: 'Get Help Anytime', desc: 'Raise tickets, access FAQs, or connect via live chat and video call.' },
]

const GLOBAL_MARKETS = [
  { name: 'S&P 500', value: '5,218.19', change: '+0.82%', up: true, region: 'US' },
  { name: 'FTSE 100', value: '7,930.41', change: '+0.34%', up: true, region: 'UK' },
  { name: 'Nikkei 225', value: '38,487.90', change: '-0.56%', up: false, region: 'JP' },
  { name: 'DAX', value: '18,001.60', change: '+0.91%', up: true, region: 'DE' },
  { name: 'Hang Seng', value: '17,108.71', change: '-1.23%', up: false, region: 'HK' },
  { name: 'ASX 200', value: '7,896.90', change: '+0.45%', up: true, region: 'AU' },
]

const INDIA_INDICATORS = [
  { label: 'GDP Growth', value: '7.6%', trend: 'up', icon: TrendingUp },
  { label: 'Repo Rate', value: '6.50%', trend: 'stable', icon: Landmark },
  { label: 'CPI Inflation', value: '5.09%', trend: 'down', icon: Banknote },
  { label: 'FII Flows', value: '+\u20B92,840 Cr', trend: 'up', icon: DollarSign },
]

const ECONOMIC_CALENDAR = [
  { date: '25 Mar', event: 'RBI MPC Meeting', region: 'India', impact: 'high', icon: Landmark },
  { date: '28 Mar', event: 'US GDP Q4 Final', region: 'Global', impact: 'high', icon: Globe },
  { date: '01 Apr', event: 'GST Revenue Data', region: 'India', impact: 'medium', icon: IndianRupee },
  { date: '02 Apr', event: 'US Non-Farm Payrolls', region: 'Global', impact: 'high', icon: Globe },
  { date: '10 Apr', event: 'RBI Policy Decision', region: 'India', impact: 'high', icon: Landmark },
  { date: '15 Apr', event: 'GHL Q4 NAV Update', region: 'GHL', impact: 'high', icon: Star },
  { date: '22 Apr', event: 'India PMI Manufacturing', region: 'India', impact: 'medium', icon: Activity },
  { date: '30 Apr', event: 'ECB Rate Decision', region: 'Global', impact: 'high', icon: Globe },
]

const ADMIN_NEWS = [
  { id: 1, title: 'GHL Fund Manager Commentary - Q4 2024', excerpt: 'Our stressed real estate portfolio delivered 32.4% returns driven by NCLT resolution of Phoenix Towers and Meridian Heights projects in Chennai.', date: '18 Mar 2025', pinned: true, category: 'Fund Update' },
  { id: 2, title: 'New Investment: Bengaluru Stressed Asset at 40% Discount', excerpt: 'We have identified a premium residential project through IBC resolution at 40% below market value in Whitefield, Bengaluru.', date: '15 Mar 2025', pinned: true, category: 'Opportunity' },
  { id: 3, title: 'Annual Investor Meet - Save the Date', excerpt: 'Join us for the Annual Investor Meet on 15 May 2025 at The Leela Palace, Chennai. RSVP required.', date: '10 Mar 2025', pinned: false, category: 'Event' },
  { id: 4, title: 'Tax Planning: Section 10(38) Benefits for AIF Investors', excerpt: 'Our compliance team has prepared a comprehensive guide on tax benefits available to Category II AIF investors.', date: '05 Mar 2025', pinned: false, category: 'Advisory' },
]

const SENSEX_INTRADAY = [
  { t: '9:15', v: 73200 }, { t: '9:45', v: 73380 }, { t: '10:15', v: 73520 },
  { t: '10:45', v: 73450 }, { t: '11:15', v: 73610 }, { t: '11:45', v: 73580 },
  { t: '12:15', v: 73720 }, { t: '12:45', v: 73690 }, { t: '1:15', v: 73750 },
  { t: '1:45', v: 73800 }, { t: '2:15', v: 73770 }, { t: '2:45', v: 73842 },
]

const NIFTY_INTRADAY = [
  { t: '9:15', v: 22200 }, { t: '9:45', v: 22280 }, { t: '10:15', v: 22350 },
  { t: '10:45', v: 22310 }, { t: '11:15', v: 22380 }, { t: '11:45', v: 22360 },
  { t: '12:15', v: 22410 }, { t: '12:45', v: 22390 }, { t: '1:15', v: 22430 },
  { t: '1:45', v: 22440 }, { t: '2:15', v: 22420 }, { t: '2:45', v: 22456 },
]

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR ITEMS
   ═══════════════════════════════════════════════════════════════ */
const SIDEBAR_ITEMS: { id: TabId; label: string; icon: any; badge?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'investments', label: 'Investments', icon: TrendingUp },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'kyc', label: 'KYC & Documents', icon: FileCheck },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'messages', label: 'Messages', icon: MessageSquare, badge: '2' },
  { id: 'support', label: 'Support', icon: HeadphonesIcon },
  { id: 'calculators', label: 'Calculators', icon: BarChart3 },
  { id: 'referrals', label: 'Referrals', icon: Gift, badge: 'NEW' },
]
const SIDEBAR_BOTTOM: { id: TabId; label: string; icon: any }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
]

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
function formatINR(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `${(n / 100000).toFixed(2)} L`
  return new Intl.NumberFormat('en-IN').format(n)
}

function useAnimatedCounter(end: number, duration = 2000) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setVal(Math.floor(end * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [end, duration])
  return val
}

/* ═══════════════════════════════════════════════════════════════
   GLASS CARD — theme-aware
   ═══════════════════════════════════════════════════════════════ */
function Glass({ children, className = '', hover = true, glow = false, theme = 'dark' as Theme }: {
  children: React.ReactNode; className?: string; hover?: boolean; glow?: boolean; theme?: Theme
}) {
  const isDark = theme === 'dark'
  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all duration-500
        ${isDark ? 'border-white/[0.08]' : 'border-gray-200/50 shadow-sm shadow-gray-200/30'}
        ${hover ? 'dash-glass-hover' : ''} ${glow ? 'dash-glow' : ''} ${className}`}
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
          : 'linear-gradient(135deg, rgba(228,225,220,0.92) 0%, rgba(222,219,214,0.96) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ background: isDark ? 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)' : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 50%)' }} />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CHART TOOLTIP
   ═══════════════════════════════════════════════════════════════ */
function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-4 py-3 border border-white/10 shadow-2xl"
      style={{ background: 'rgba(26,26,26,0.95)', backdropFilter: 'blur(20px)' }}>
      <p className="text-xs text-gray-400 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>{p.name}: {p.value.toFixed(2)}</p>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function DashboardClient() {
  // ─── State ────────────────────────────────────────────────
  const [theme, setTheme] = useState<Theme>('dark')
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [greeting, setGreeting] = useState('')
  const [tourActive, setTourActive] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [ticketForm, setTicketForm] = useState(false)
  const [messageCompose, setMessageCompose] = useState(false)
  const [bankConnectOpen, setBankConnectOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsScrolled, setTermsScrolled] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [privacyScrolled, setPrivacyScrolled] = useState(false)
  const [docName, setDocName] = useState('')
  const [docCategory, setDocCategory] = useState('')
  const [investAmount, setInvestAmount] = useState(2500000)
  const [investVehicle, setInvestVehicle] = useState('AIF Direct')
  const [activeCalc, setActiveCalc] = useState('sip')
  const [calcInputs, setCalcInputs] = useState({ amount: 100000, rate: 15, years: 5 })
  const [notifPrefs, setNotifPrefs] = useState({ email: true, nav: true, invest: true, dividend: true })
  const [dashLang, setDashLang] = useState('English')
  const [taskReminders] = useState([
    { id: 1, task: 'Complete KYC re-verification', due: '31 Mar 2025', urgent: true },
    { id: 2, task: 'Review Q4 NAV report', due: '20 Mar 2025', urgent: false },
  ])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const termsRef = useRef<HTMLDivElement>(null)
  const privacyRef = useRef<HTMLDivElement>(null)

  const isDark = theme === 'dark'
  const t = (dark: string, light: string) => isDark ? dark : light

  // Animated counters
  const portfolioValue = useAnimatedCounter(8542500)
  const aifInvestment = useAnimatedCounter(6300000)
  const coInvestValue = useAnimatedCounter(1627500)
  const currentNAV = useAnimatedCounter(13242)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
      const hour = now.getHours()
      setGreeting(hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening')
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

  // ═══════════════════════════════════════════════════════════
  // SIDEBAR
  // ═══════════════════════════════════════════════════════════
  const renderSidebar = () => (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full z-50 w-[260px] flex flex-col transition-transform duration-500 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: isDark ? 'linear-gradient(180deg, rgba(10,10,10,0.98) 0%, rgba(15,5,5,0.98) 100%)' : 'linear-gradient(180deg, rgba(214,211,206,0.98) 0%, rgba(210,207,202,0.98) 100%)',
          borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          backdropFilter: 'blur(40px)',
        }}>
        {/* Logo */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <Link href="/" target="_blank" className="flex items-center gap-3 group">
            <Logo size={36} />
            <div>
              <p className={`text-sm font-bold tracking-tight ${t('text-white','text-gray-900')}`}>GHL India</p>
              <p className="text-[10px] text-brand-red font-medium tracking-widest uppercase">Ventures</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className={`lg:hidden ${t('text-gray-500 hover:text-white','text-gray-400 hover:text-gray-900')} transition-colors`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Investor badge */}
        <div className="px-6 mb-4">
          <div className={`px-3 py-2.5 rounded-xl ${t('bg-white/[0.04] border border-white/[0.06]','bg-gray-100/60 border border-gray-200/40')}`}>
            <p className={`text-[10px] uppercase tracking-widest mb-0.5 ${t('text-gray-500','text-gray-400')}`}>Investor</p>
            <p className={`text-sm font-semibold ${t('text-white','text-gray-900')}`}>Rajesh Krishnan</p>
            <p className={`text-[10px] mt-0.5 ${t('text-gray-500','text-gray-500')}`}>ID: GHL-INV-2024-0847</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative
                  ${isActive
                    ? isDark ? 'text-white bg-brand-red/15 border border-brand-red/20' : 'text-brand-red bg-red-50 border border-red-200'
                    : isDark ? 'text-gray-400 hover:text-white hover:bg-white/[0.04]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/35'
                  }`}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-brand-red" />}
                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-brand-red' : isDark ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {item.label}
                {item.badge && (
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold ${item.badge === 'NEW' ? 'bg-brand-red/20 text-brand-red' : 'bg-blue-500/20 text-blue-400'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
          <div className={`my-4 border-t ${t('border-white/[0.06]','border-gray-200/50')}`} />
          {SIDEBAR_BOTTOM.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group
                ${activeTab === item.id
                  ? isDark ? 'text-white bg-white/[0.06]' : 'text-gray-900 bg-gray-100/50'
                  : isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/30'
                }`}>
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Theme toggle + Logout */}
        <div className="px-3 pb-4 pt-2 space-y-1">
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              ${isDark ? 'text-gray-400 hover:text-amber-400 hover:bg-amber-500/[0.06]' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'}`}>
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={() => setTourActive(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              ${isDark ? 'text-gray-400 hover:text-purple-400 hover:bg-purple-500/[0.06]' : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'}`}>
            <Sparkles className="w-[18px] h-[18px]" />
            Virtual Tour
          </button>
          <Link href="/login"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              ${isDark ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/[0.06]' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}>
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </Link>
        </div>
      </aside>
    </>
  )

  // ═══════════════════════════════════════════════════════════
  // TOP BAR
  // ═══════════════════════════════════════════════════════════
  const renderTopBar = () => (
    <header className={`sticky top-0 z-30 border-b ${t('border-white/[0.06]','border-gray-200/50')}`}
      style={{ background: isDark ? 'rgba(10,10,10,0.8)' : 'rgba(214,211,206,0.92)', backdropFilter: 'blur(40px) saturate(180%)' }}>
      {/* Market Ticker */}
      <div className={`border-b ${t('border-white/[0.04]','border-gray-200/40')} px-4 py-1.5 overflow-hidden`}>
        <div className="flex items-center gap-6 text-xs animate-marquee whitespace-nowrap">
          {[...MARKET_DATA, ...MARKET_DATA].map((m, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <span className={`font-medium ${t('text-gray-500','text-gray-400')}`}>{m.name}</span>
              <span className={`font-semibold ${t('text-white','text-gray-900')}`}>{m.value}</span>
              <span className={`font-semibold ${m.up ? 'text-emerald-400' : 'text-red-400'}`}>{m.change}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main bar */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className={`lg:hidden ${t('text-gray-400 hover:text-white','text-gray-500 hover:text-gray-900')} transition-colors p-1`}>
            <Menu className="w-5 h-5" />
          </button>
          <div className={`hidden sm:flex items-center gap-2 text-xs ${t('text-gray-500','text-gray-400')}`}>
            <Home className="w-3 h-3" /> <ChevronRight className="w-3 h-3" />
            <span className={`capitalize ${t('text-white','text-gray-900')}`}>{activeTab === 'kyc' ? 'KYC & Documents' : activeTab}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl w-56 transition-colors
            ${t('bg-white/[0.04] border border-white/[0.06] focus-within:border-brand-red/30','bg-gray-100/50 border border-gray-200/40 focus-within:border-brand-red/40')}`}>
            <Search className={`w-3.5 h-3.5 ${t('text-gray-500','text-gray-400')}`} />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className={`bg-transparent border-none outline-none text-xs w-full ${t('text-white placeholder-gray-600','text-gray-900 placeholder-gray-400')}`} />
          </div>

          {/* Task reminders */}
          {taskReminders.some(r => r.urgent) && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/20">
              <BellRing className="w-3 h-3 text-amber-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-amber-400">{taskReminders.filter(r => r.urgent).length} urgent</span>
            </div>
          )}

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)} className={`relative p-2 rounded-xl transition-colors ${t('text-gray-400 hover:text-white hover:bg-white/[0.04]','text-gray-500 hover:text-gray-900 hover:bg-gray-200/35')}`}>
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-red text-[9px] font-bold text-white flex items-center justify-center">
                {NOTIFICATIONS_DATA.filter(n => !n.read).length}
              </span>
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div className={`absolute right-0 top-12 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden
                ${t('bg-[#111] border-white/[0.08]','bg-[#F2F0ED] border-gray-200/60')}`}>
                <div className={`px-4 py-3 flex items-center justify-between border-b ${t('border-white/[0.06]','border-gray-200/40')}`}>
                  <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Notifications</h4>
                  <button className="text-[10px] text-brand-red font-semibold">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {NOTIFICATIONS_DATA.map(n => (
                    <div key={n.id} className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors ${!n.read ? (isDark ? 'bg-white/[0.02]' : 'bg-blue-50/50') : ''} ${t('hover:bg-white/[0.04]','hover:bg-gray-200/40')}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                        ${n.type === 'report' ? 'bg-blue-500/15' : n.type === 'opportunity' ? 'bg-emerald-500/15' : n.type === 'alert' ? 'bg-amber-500/15' : n.type === 'payment' ? 'bg-emerald-500/15' : 'bg-purple-500/15'}`}>
                        {n.type === 'report' ? <FileText className="w-4 h-4 text-blue-400" /> :
                         n.type === 'opportunity' ? <Star className="w-4 h-4 text-emerald-400" /> :
                         n.type === 'alert' ? <AlertCircle className="w-4 h-4 text-amber-400" /> :
                         n.type === 'payment' ? <IndianRupee className="w-4 h-4 text-emerald-400" /> :
                         <Award className="w-4 h-4 text-purple-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${t('text-white','text-gray-900')} ${!n.read ? '' : 'opacity-60'}`}>{n.title}</p>
                        <p className={`text-[11px] mt-0.5 ${t('text-gray-500','text-gray-500')}`}>{n.desc}</p>
                        <p className={`text-[10px] mt-1 ${t('text-gray-600','text-gray-400')}`}>{n.time}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-brand-red shrink-0 mt-1.5" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Time */}
          <span className={`hidden lg:block text-[11px] ml-2 ${t('text-gray-500','text-gray-400')}`}>{currentTime}</span>

          {/* Theme toggle (compact) */}
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`p-2 rounded-xl transition-all duration-300 ${t('text-gray-400 hover:text-amber-400 hover:bg-amber-500/[0.06]','text-gray-500 hover:text-indigo-600 hover:bg-indigo-50')}`}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Avatar */}
          <div className={`flex items-center gap-2 ml-2 pl-3 border-l ${t('border-white/[0.06]','border-gray-200/50')}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/[0.08]">RK</div>
          </div>
        </div>
      </div>
    </header>
  )

  // ═══════════════════════════════════════════════════════════
  // VIRTUAL TOUR OVERLAY
  // ═══════════════════════════════════════════════════════════
  const renderTourOverlay = () => {
    if (!tourActive) return null
    const step = TOUR_STEPS[tourStep]
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className={`max-w-md w-full mx-4 rounded-2xl border p-8 text-center ${t('bg-[#111] border-white/10','bg-white border-gray-200 shadow-2xl')}`}>
          <div className="w-16 h-16 rounded-2xl bg-brand-red/15 flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-8 h-8 text-brand-red" />
          </div>
          <h3 className={`text-lg font-bold mb-2 ${t('text-white','text-gray-900')}`}>{step.title}</h3>
          <p className={`text-sm mb-6 leading-relaxed ${t('text-gray-400','text-gray-500')}`}>{step.desc}</p>
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === tourStep ? 'w-6 bg-brand-red' : 'w-1.5 bg-gray-600'}`} />
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setTourActive(false); setTourStep(0) }}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${t('text-gray-400 hover:text-white','text-gray-500 hover:text-gray-900')}`}>Skip</button>
            <button onClick={() => {
              if (tourStep < TOUR_STEPS.length - 1) {
                setActiveTab(TOUR_STEPS[tourStep + 1].target as TabId)
                setTourStep(tourStep + 1)
              } else {
                setTourActive(false); setTourStep(0)
              }
            }} className="px-6 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
              {tourStep < TOUR_STEPS.length - 1 ? 'Next' : 'Finish'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // HERO METRICS
  // ═══════════════════════════════════════════════════════════
  const renderHeroMetrics = () => {
    const metrics = [
      { label: 'Total Portfolio', value: `\u20B9${formatINR(portfolioValue)}`, change: `+${totalReturn}%`, up: true, icon: Wallet, gradient: 'from-brand-red/20 to-red-900/20', iconColor: '#D0021B' },
      { label: 'AIF Investment', value: `\u20B9${formatINR(aifInvestment)}`, change: '+32.4%', up: true, icon: Building2, gradient: 'from-emerald-500/20 to-emerald-900/20', iconColor: '#10B981' },
      { label: 'Co-Invest Value', value: `\u20B9${formatINR(coInvestValue)}`, change: '+8.5%', up: true, icon: FileText, gradient: 'from-blue-500/20 to-blue-900/20', iconColor: '#3B82F6' },
      { label: 'Current NAV', value: `\u20B9${(currentNAV / 100).toFixed(2)}`, change: '+32.4%', up: true, icon: TrendingUp, gradient: 'from-amber-500/20 to-amber-900/20', iconColor: '#F59E0B' },
    ]
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Glass key={i} className="p-5" hover glow theme={theme}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center`}>
                <m.icon className="w-5 h-5" style={{ color: m.iconColor }} />
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.up ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                {m.up ? <ArrowUpRight className="w-3 h-3 inline mr-0.5" /> : <ArrowDownRight className="w-3 h-3 inline mr-0.5" />}{m.change}
              </span>
            </div>
            <p className={`text-2xl font-extrabold tracking-tight mb-0.5 ${t('text-white','text-gray-900')}`}>{m.value}</p>
            <p className={`text-xs ${t('text-gray-500','text-gray-500')}`}>{m.label}</p>
          </Glass>
        ))}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // NAV CHART
  // ═══════════════════════════════════════════════════════════
  const renderNAVChart = () => (
    <Glass className="p-5 lg:p-6" hover theme={theme}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className={`text-base font-bold mb-0.5 ${t('text-white','text-gray-900')}`}>NAV Performance</h3>
          <p className={`text-xs ${t('text-gray-500','text-gray-500')}`}>Fund NAV vs NIFTY 50 Benchmark</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-red" /><span className={t('text-gray-400','text-gray-500')}>Fund NAV</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-500" /><span className={t('text-gray-400','text-gray-500')}>Benchmark</span></span>
        </div>
      </div>
      <div className="h-[280px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={NAV_HISTORY}>
            <defs><linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D0021B" stopOpacity={0.3} /><stop offset="100%" stopColor="#D0021B" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'} />
            <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }} tickLine={false} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
            <Tooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="nav" name="Fund NAV" stroke="#D0021B" strokeWidth={2.5} fill="url(#navGrad)" dot={false} activeDot={{ r: 5, fill: '#D0021B', stroke: '#fff', strokeWidth: 2 }} />
            <Line type="monotone" dataKey="benchmark" name="Benchmark" stroke="#4B5563" strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Glass>
  )

  // ═══════════════════════════════════════════════════════════
  // ALLOCATION CHART
  // ═══════════════════════════════════════════════════════════
  const renderAllocationChart = () => (
    <Glass className="p-5 lg:p-6" hover theme={theme}>
      <h3 className={`text-base font-bold mb-5 ${t('text-white','text-gray-900')}`}>Allocation</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={ALLOCATION_DATA} innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {ALLOCATION_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 mt-4">
        {ALLOCATION_DATA.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} /><span className={t('text-gray-400','text-gray-600')}>{d.name}</span></span>
            <span className={`font-semibold ${t('text-white','text-gray-900')}`}>{d.value}%</span>
          </div>
        ))}
      </div>
    </Glass>
  )

  // ═══════════════════════════════════════════════════════════
  // PORTFOLIO ASSETS with milestone bars
  // ═══════════════════════════════════════════════════════════
  const renderPortfolioAssets = () => (
    <Glass className="p-5 lg:p-6" hover theme={theme}>
      <div className="flex items-center justify-between mb-5">
        <h3 className={`text-base font-bold ${t('text-white','text-gray-900')}`}>Portfolio Assets</h3>
        <button className="text-xs text-brand-red font-semibold flex items-center gap-1">View All <ChevronRight className="w-3 h-3" /></button>
      </div>
      <div className="space-y-3">
        {PORTFOLIO_ASSETS.map((asset, i) => (
          <div key={i} className={`p-3 rounded-xl transition-all duration-300 group cursor-pointer ${t('bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08]','bg-gray-100/35 border border-gray-200/30 hover:border-gray-300/40')}`}>
            <div className="flex items-center gap-4 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t('bg-white/[0.04]','bg-gray-200/40')}`}>
                {asset.type.includes('Real Estate') ? <Building2 className="w-5 h-5 text-brand-red" /> : asset.type.includes('Startup') ? <Rocket className="w-5 h-5 text-amber-400" /> : <FileText className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${t('text-white','text-gray-900')}`}>{asset.name}</p>
                <p className={`text-xs ${t('text-gray-500','text-gray-500')}`}>{asset.type}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>{'\u20B9'}{formatINR(asset.current)}</p>
                <p className={`text-xs font-semibold ${asset.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>+{asset.returnPct}%</p>
              </div>
            </div>
            {/* Milestone progress bar */}
            <div className="flex items-center gap-2">
              <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${t('bg-white/[0.06]','bg-gray-200')}`}>
                <div className="h-full rounded-full bg-gradient-to-r from-brand-red to-red-400 transition-all duration-1000" style={{ width: `${asset.milestone}%` }} />
              </div>
              <span className={`text-[10px] font-medium ${t('text-gray-500','text-gray-400')}`}>{asset.milestone}%</span>
            </div>
          </div>
        ))}
      </div>
    </Glass>
  )

  // ═══════════════════════════════════════════════════════════
  // QUICK ACTIONS
  // ═══════════════════════════════════════════════════════════
  const renderQuickActions = () => (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {[
        { icon: Plus, label: 'New Investment', desc: 'Explore opportunities', color: '#D0021B', action: () => setActiveTab('investments') },
        { icon: Download, label: 'Statements', desc: 'Download reports', color: '#3B82F6', action: () => setActiveTab('kyc') },
        { icon: Ticket, label: 'Raise Ticket', desc: 'Get support', color: '#F59E0B', action: () => { setActiveTab('support'); setTicketForm(true) } },
        { icon: Video, label: 'Video Call', desc: 'Talk to advisor', color: '#8B5CF6', action: () => window.dispatchEvent(new CustomEvent('ghl-open-video-call')) },
        { icon: Phone, label: 'Call Us', desc: 'Direct call support', color: '#10B981', action: () => window.dispatchEvent(new CustomEvent('ghl-open-direct-call')) },
        { icon: MessageSquare, label: 'Chat with ARIA', desc: 'AI assistant', color: '#D0021B', action: () => window.dispatchEvent(new CustomEvent('ghl-open-chat')) },
      ].map((item, i) => (
        <button key={i} onClick={item.action} className="group text-left w-full">
          <Glass className="p-4 h-full" hover theme={theme}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110" style={{ background: `${item.color}20` }}>
              <item.icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <p className={`text-sm font-semibold mb-0.5 ${t('text-white','text-gray-900')}`}>{item.label}</p>
            <p className={`text-xs leading-relaxed ${t('text-gray-500','text-gray-500')}`}>{item.desc}</p>
          </Glass>
        </button>
      ))}
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // RECENT ACTIVITY
  // ═══════════════════════════════════════════════════════════
  const renderRecentActivity = () => (
    <Glass className="p-5 lg:p-6" hover theme={theme}>
      <h3 className={`text-base font-bold mb-5 ${t('text-white','text-gray-900')}`}>Recent Activity</h3>
      <div className="space-y-2.5">
        {RECENT_TRANSACTIONS.slice(0, 5).map((tx, i) => (
          <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${t('hover:bg-white/[0.02]','hover:bg-gray-200/40')}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.type === 'Investment' ? 'bg-blue-500/15' : tx.type === 'Dividend' ? 'bg-emerald-500/15' : 'bg-gray-500/15'}`}>
              {tx.type === 'Investment' ? <ArrowUpRight className="w-4 h-4 text-blue-400" /> : tx.type === 'Dividend' ? <IndianRupee className="w-4 h-4 text-emerald-400" /> : <Info className="w-4 h-4 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${t('text-white','text-gray-900')}`}>{tx.type}</p>
              <p className={`text-[11px] truncate ${t('text-gray-500','text-gray-500')}`}>{tx.fund}</p>
            </div>
            <div className="text-right shrink-0">
              {tx.amount > 0 && <p className={`text-xs font-bold ${tx.type === 'Dividend' ? 'text-emerald-400' : t('text-white','text-gray-900')}`}>{tx.type === 'Dividend' ? '+' : ''}{'\u20B9'}{formatINR(tx.amount)}</p>}
              <p className={`text-[10px] ${t('text-gray-600','text-gray-400')}`}>{tx.date}</p>
            </div>
          </div>
        ))}
      </div>
    </Glass>
  )

  // ═══════════════════════════════════════════════════════════
  // PORTFOLIO HEALTH SCORE (Animated Gauge)
  // ═══════════════════════════════════════════════════════════
  const renderHealthScore = () => {
    const score = 87
    const circumference = 2 * Math.PI * 45
    const offset = circumference - (score / 100) * circumference
    return (
      <Glass className="p-5" hover glow theme={theme}>
        <div className="flex items-center justify-between mb-3">
          <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Portfolio Health</h4>
          <Gauge className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#healthGrad)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-2000" />
              <defs><linearGradient id="healthGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#34D399" /></linearGradient></defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-black ${t('text-white','text-gray-900')}`}>{score}</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            {[{ l: 'Diversification', v: 'Strong', c: 'text-emerald-400' },{ l: 'Risk Level', v: 'Moderate', c: 'text-amber-400' },{ l: 'Growth Trend', v: 'Positive', c: 'text-emerald-400' }].map((r,i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <span className={t('text-gray-500','text-gray-500')}>{r.l}</span>
                <span className={`font-semibold ${r.c}`}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </Glass>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // COUNTDOWN TO NEXT NAV UPDATE
  // ═══════════════════════════════════════════════════════════
  const renderCountdown = () => {
    const navDate = new Date('2025-04-15T00:00:00+05:30')
    const now = new Date()
    const diff = Math.max(0, navDate.getTime() - now.getTime())
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    return (
      <Glass className="p-5" hover glow theme={theme}>
        <div className="flex items-center gap-2 mb-3">
          <Timer className="w-4 h-4 text-brand-red" />
          <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Next NAV Update</h4>
        </div>
        <div className="flex items-center gap-3 mb-2">
          {[{ v: days, l: 'Days' },{ v: hours, l: 'Hrs' }].map((u,i) => (
            <div key={i} className={`flex-1 text-center p-2.5 rounded-xl ${t('bg-white/[0.04] border border-white/[0.06]','bg-gray-100/60 border border-gray-200/40')}`}>
              <p className={`text-2xl font-black tracking-tight ${t('text-white','text-gray-900')}`}>{u.v}</p>
              <p className={`text-[9px] uppercase tracking-widest ${t('text-gray-600','text-gray-500')}`}>{u.l}</p>
            </div>
          ))}
        </div>
        <p className={`text-[11px] text-center ${t('text-gray-600','text-gray-500')}`}>Q4 2024 &bull; 15 April 2025</p>
      </Glass>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // MARKET SENTIMENT GAUGE
  // ═══════════════════════════════════════════════════════════
  const renderSentiment = () => (
    <Glass className="p-5" hover theme={theme}>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-blue-400" />
        <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Market Sentiment</h4>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-2.5 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 relative">
          <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 shadow-lg transition-all" style={{ left: '72%', transform: 'translate(-50%, -50%)' }} />
        </div>
      </div>
      <div className="flex justify-between text-[9px] uppercase tracking-widest mb-3">
        <span className="text-red-400">Fear</span><span className={t('text-gray-500','text-gray-500')}>Neutral</span><span className="text-emerald-400">Greed</span>
      </div>
      <div className={`text-center p-2 rounded-lg ${t('bg-emerald-500/10 border border-emerald-500/15','bg-emerald-100/60 border border-emerald-300/50')}`}>
        <span className="text-emerald-400 text-sm font-bold">72 &bull; Greed</span>
        <p className={`text-[10px] mt-0.5 ${t('text-gray-500','text-gray-500')}`}>India VIX: 13.42 (-2.1%)</p>
      </div>
    </Glass>
  )

  // ═══════════════════════════════════════════════════════════
  // INDIA LIVE CHARTS (SENSEX + NIFTY Mini)
  // ═══════════════════════════════════════════════════════════
  const renderLiveCharts = () => (
    <Glass className="p-5" hover theme={theme}>
      <div className="flex items-center justify-between mb-4">
        <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>India Live Markets</h4>
        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[{ label: 'SENSEX', val: '73,842', chg: '+1.24%', data: SENSEX_INTRADAY, color: '#D0021B' },
          { label: 'NIFTY 50', val: '22,456', chg: '+0.98%', data: NIFTY_INTRADAY, color: '#3B82F6' }].map((chart,i) => (
          <div key={i} className={`p-3 rounded-xl ${t('bg-white/[0.03] border border-white/[0.04]','bg-gray-100/50 border border-gray-200/30')}`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-semibold ${t('text-gray-400','text-gray-500')}`}>{chart.label}</span>
              <span className="text-[10px] font-bold text-emerald-400">{chart.chg}</span>
            </div>
            <p className={`text-base font-black mb-2 ${t('text-white','text-gray-900')}`}>{chart.val}</p>
            <div className="h-[50px] -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart.data}>
                  <defs><linearGradient id={`mc${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chart.color} stopOpacity={0.3} /><stop offset="100%" stopColor={chart.color} stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="v" stroke={chart.color} strokeWidth={1.5} fill={`url(#mc${i})`} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </Glass>
  )

  // ═══════════════════════════════════════════════════════════
  // GLOBAL MARKETS WIDGET
  // ═══════════════════════════════════════════════════════════
  const renderGlobalMarkets = () => (
    <Glass className="p-5" hover theme={theme}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-purple-400" />
          <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Global Markets</h4>
        </div>
      </div>
      <div className="space-y-2">
        {GLOBAL_MARKETS.map((m,i) => (
          <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${t('hover:bg-white/[0.02]','hover:bg-gray-200/40')} transition-colors`}>
            <div className="flex items-center gap-2">
              <span className={`w-6 h-4 rounded text-[8px] font-bold flex items-center justify-center text-white ${m.up ? 'bg-emerald-500/80' : 'bg-red-500/80'}`}>{m.region}</span>
              <span className={`text-xs font-medium ${t('text-gray-300','text-gray-700')}`}>{m.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold ${t('text-white','text-gray-900')}`}>{m.value}</span>
              <span className={`text-[10px] font-bold w-14 text-right ${m.up ? 'text-emerald-400' : 'text-red-400'}`}>{m.change}</span>
            </div>
          </div>
        ))}
      </div>
    </Glass>
  )

  // ═══════════════════════════════════════════════════════════
  // INDIA ECONOMIC INDICATORS
  // ═══════════════════════════════════════════════════════════
  const renderIndiaIndicators = () => (
    <Glass className="p-5" hover theme={theme}>
      <div className="flex items-center gap-2 mb-4">
        <Flag className="w-4 h-4 text-amber-500" />
        <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>India Economy</h4>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {INDIA_INDICATORS.map((ind,i) => (
          <div key={i} className={`p-3 rounded-xl text-center ${t('bg-white/[0.03] border border-white/[0.04]','bg-gray-100/50 border border-gray-200/30')}`}>
            <ind.icon className={`w-4 h-4 mx-auto mb-1.5 ${ind.trend === 'up' ? 'text-emerald-400' : ind.trend === 'down' ? 'text-red-400' : 'text-blue-400'}`} />
            <p className={`text-sm font-black ${t('text-white','text-gray-900')}`}>{ind.value}</p>
            <p className={`text-[9px] mt-0.5 ${t('text-gray-500','text-gray-500')}`}>{ind.label}</p>
          </div>
        ))}
      </div>
    </Glass>
  )

  // ═══════════════════════════════════════════════════════════
  // ECONOMIC CALENDAR
  // ═══════════════════════════════════════════════════════════
  const renderEconomicCalendar = () => (
    <Glass className="p-5" hover theme={theme}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Economic Calendar</h4>
        </div>
        <div className="flex gap-1.5">
          {['India','Global','GHL'].map(f => (
            <span key={f} className={`text-[9px] px-2 py-0.5 rounded-full cursor-pointer font-semibold ${t('bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white','bg-gray-100/40 text-gray-500 hover:bg-gray-200/40 hover:text-gray-900')} transition-all`}>{f}</span>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        {ECONOMIC_CALENDAR.slice(0, 6).map((ev,i) => (
          <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${t('hover:bg-white/[0.02]','hover:bg-gray-200/40')} transition-colors`}>
            <div className={`w-10 text-center shrink-0 ${t('text-gray-500','text-gray-500')}`}>
              <p className="text-[10px] font-bold leading-tight">{ev.date.split(' ')[0]}</p>
              <p className="text-[8px] uppercase">{ev.date.split(' ')[1]}</p>
            </div>
            <div className={`w-px h-6 ${t('bg-white/[0.06]','bg-gray-200')}`} />
            <ev.icon className={`w-3.5 h-3.5 shrink-0 ${ev.region === 'GHL' ? 'text-brand-red' : ev.region === 'India' ? 'text-amber-400' : 'text-blue-400'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium truncate ${t('text-gray-300','text-gray-700')}`}>{ev.event}</p>
            </div>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ev.impact === 'high' ? 'bg-red-400' : 'bg-amber-400'}`} />
          </div>
        ))}
      </div>
    </Glass>
  )

  // ═══════════════════════════════════════════════════════════
  // ADMIN / GHL NEWS CARD
  // ═══════════════════════════════════════════════════════════
  const renderAdminNews = () => (
    <Glass className="p-5" hover theme={theme}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-brand-red" />
          <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>GHL News & Updates</h4>
        </div>
        <span className={`text-[10px] font-semibold ${t('text-gray-500','text-gray-500')}`}>{ADMIN_NEWS.length} updates</span>
      </div>
      <div className="space-y-2.5">
        {ADMIN_NEWS.map(news => (
          <div key={news.id} className={`p-3 rounded-xl cursor-pointer transition-all group ${news.pinned ? (isDark ? 'bg-brand-red/[0.06] border border-brand-red/15 hover:border-brand-red/30' : 'bg-red-50/60 border border-red-200/40 hover:border-red-300/60') : t('bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08]','bg-gray-100/50 border border-gray-200/30 hover:border-gray-300/40')}`}>
            <div className="flex items-start gap-2 mb-1">
              {news.pinned && <Flame className="w-3 h-3 text-brand-red shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${t('text-white','text-gray-900')}`}>{news.title}</p>
                <p className={`text-[11px] mt-0.5 line-clamp-2 leading-relaxed ${t('text-gray-500','text-gray-500')}`}>{news.excerpt}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${news.category === 'Opportunity' ? 'bg-emerald-500/15 text-emerald-400' : news.category === 'Fund Update' ? 'bg-blue-500/15 text-blue-400' : news.category === 'Event' ? 'bg-purple-500/15 text-purple-400' : 'bg-amber-500/15 text-amber-400'}`}>{news.category}</span>
              <span className={`text-[10px] ${t('text-gray-600','text-gray-400')}`}>{news.date}</span>
            </div>
          </div>
        ))}
      </div>
    </Glass>
  )

  // ═══════════════════════════════════════════════════════════
  // AI INSIGHTS CARD
  // ═══════════════════════════════════════════════════════════
  const renderAIInsights = () => (
    <Glass className="p-5 relative overflow-hidden" hover glow theme={theme}>
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-[40px]" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Smart Insights</h4>
        </div>
        <div className="space-y-2.5">
          {[
            { icon: TrendingUp, text: 'Your portfolio outperformed the NIFTY 50 benchmark by 21.3% this year.', color: 'text-emerald-400' },
            { icon: Shield, text: 'Diversification score is strong. Real estate exposure provides stability.', color: 'text-blue-400' },
            { icon: Target, text: 'Phoenix Towers NCLT resolution at 75% milestone \u2014 ahead of schedule.', color: 'text-amber-400' },
          ].map((insight,i) => (
            <div key={i} className={`flex items-start gap-2.5 p-2 rounded-lg ${t('bg-white/[0.02]','bg-gray-100/30')}`}>
              <insight.icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${insight.color}`} />
              <p className={`text-[11px] leading-relaxed ${t('text-gray-400','text-gray-600')}`}>{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </Glass>
  )

  // ═══════════════════════════════════════════════════════════
  // WEALTH MILESTONES
  // ═══════════════════════════════════════════════════════════
  const renderMilestones = () => (
    <Glass className="p-5" hover theme={theme}>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Wealth Milestones</h4>
      </div>
      <div className="space-y-3">
        {[
          { label: '\u20B950 Lakh Portfolio', achieved: true, date: 'Mar 2024' },
          { label: '\u20B975 Lakh Portfolio', achieved: true, date: 'Sep 2024' },
          { label: '\u20B985 Lakh Portfolio', achieved: true, date: 'Feb 2025' },
          { label: '\u20B91 Crore Portfolio', achieved: false, progress: 85 },
        ].map((m,i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.achieved ? 'bg-amber-500/20' : t('bg-white/[0.04]','bg-gray-200/40')}`}>
              {m.achieved ? <CheckCircle className="w-4 h-4 text-amber-400" /> : <CircleDot className={`w-4 h-4 ${t('text-gray-600','text-gray-400')}`} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${m.achieved ? t('text-white','text-gray-900') : t('text-gray-500','text-gray-500')}`}>{m.label}</p>
              {m.achieved ? (
                <p className={`text-[10px] ${t('text-gray-600','text-gray-400')}`}>{m.date}</p>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <div className={`flex-1 h-1 rounded-full overflow-hidden ${t('bg-white/[0.06]','bg-gray-200/40')}`}>
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-red to-amber-400" style={{ width: `${m.progress}%` }} />
                  </div>
                  <span className="text-[9px] text-brand-red font-semibold">{m.progress}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Glass>
  )

  // ═══════════════════════════════════════════════════════════
  // DASHBOARD HOME
  // ═══════════════════════════════════════════════════════════
  const renderDashboardHome = () => (
    <div className="space-y-6">
      {/* Welcome + Task reminders */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className={`text-xl font-bold mb-0.5 ${t('text-white','text-gray-900')}`}>{greeting}, <span className="text-brand-red">Rajesh</span></h2>
          <p className={`text-sm flex items-center gap-2 ${t('text-gray-500','text-gray-500')}`}>
            Welcome to your investor portal
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <Shield className="w-3 h-3" /> KYC Verified
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('investments')} className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
            <Plus className="w-3.5 h-3.5 inline mr-1.5" /> New Investment
          </button>
        </div>
      </div>

      {/* Task reminders bar */}
      {taskReminders.length > 0 && (
        <Glass className="p-4" theme={theme}>
          <div className="flex items-center gap-3 flex-wrap">
            <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
            <span className={`text-xs font-semibold ${t('text-white','text-gray-900')}`}>Reminders:</span>
            {taskReminders.map(r => (
              <span key={r.id} className={`text-xs px-2.5 py-1 rounded-lg ${r.urgent ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : t('bg-white/[0.04] text-gray-400','bg-gray-100/40 text-gray-600')}`}>
                {r.task} &bull; {r.due}
              </span>
            ))}
          </div>
        </Glass>
      )}

      {renderHeroMetrics()}

      {/* Portfolio Health + Countdown + Sentiment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderHealthScore()}
        {renderCountdown()}
        {renderSentiment()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">{renderNAVChart()}</div>
        <div>{renderAllocationChart()}</div>
      </div>

      {renderQuickActions()}

      {/* Live Charts + Global Markets + India Economy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {renderLiveCharts()}
        {renderGlobalMarkets()}
        {renderIndiaIndicators()}
      </div>

      {/* GHL Admin News + AI Insights + Economic Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {renderAdminNews()}
        <div className="space-y-4">
          {renderAIInsights()}
          {renderMilestones()}
        </div>
        {renderEconomicCalendar()}
      </div>

      {/* Portfolio Assets + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderPortfolioAssets()}
        {renderRecentActivity()}
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // INVESTMENTS TAB
  // ═══════════════════════════════════════════════════════════
  const renderInvestmentsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className={`text-xl font-bold mb-1 ${t('text-white','text-gray-900')}`}>Investment Opportunities</h2>
        <p className={`text-sm ${t('text-gray-500','text-gray-500')}`}>Browse, select, and manage your allocations</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Category II AIF - Direct', desc: 'Invest in SEBI-registered AIF with stressed RE and startup exposure.', min: 'As per SEBI AIF Regulations', target: '18-22% IRR', tenure: '5-7 Years', risk: 'High', color: '#D0021B', icon: Building2 },
          { title: 'SEBI Co-Invest Framework', desc: 'Regulated co-invest structure with fixed returns and same asset pool.', min: 'Contact for details', target: '12-15% p.a.', tenure: '3-5 Years', risk: 'Moderate', color: '#3B82F6', icon: FileText },
          { title: 'NCLT Recovery Assets', desc: 'Stressed properties at 40-60% discount through IBC resolution.', min: '\u20B950 Lakhs', target: '25-35% IRR', tenure: '2-4 Years', risk: 'High', color: '#10B981', icon: Target },
          { title: 'Early-Stage Startups', desc: 'Pre-Series A in high-growth Indian tech startups.', min: '\u20B925 Lakhs', target: '30-50% IRR', tenure: '5-8 Years', risk: 'Very High', color: '#F59E0B', icon: Rocket },
        ].map((opp, i) => (
          <Glass key={i} className="p-6" hover glow theme={theme}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${opp.color}15` }}>
                <opp.icon className="w-6 h-6" style={{ color: opp.color }} />
              </div>
              <div>
                <h4 className={`text-sm font-bold mb-1 ${t('text-white','text-gray-900')}`}>{opp.title}</h4>
                <p className={`text-xs leading-relaxed ${t('text-gray-500','text-gray-500')}`}>{opp.desc}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Min Investment', val: opp.min },
                { label: 'Target Return', val: opp.target, green: true },
                { label: 'Tenure', val: opp.tenure },
                { label: 'Risk Level', val: opp.risk, risk: true },
              ].map((f, j) => (
                <div key={j} className={`p-2.5 rounded-lg ${t('bg-white/[0.02]','bg-gray-100/35')}`}>
                  <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-600','text-gray-400')}`}>{f.label}</p>
                  <p className={`text-sm font-bold ${f.green ? 'text-emerald-400' : f.risk ? (opp.risk === 'Very High' ? 'text-red-400' : opp.risk === 'High' ? 'text-amber-400' : 'text-blue-400') : t('text-white','text-gray-900')}`}>{f.val}</p>
                </div>
              ))}
            </div>
            <button className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>Express Interest</button>
            <button onClick={() => setActiveTab('invest-onboard')} className="w-full py-2.5 rounded-xl text-xs font-bold mt-2 transition-all duration-300 hover:scale-[1.02] text-white"
              style={{ background: 'linear-gradient(135deg, #228B22, #1B6B1B)' }}>
              Proceed to Invest &rarr;</button>
          </Glass>
        ))}
      </div>

      {/* Modify Allocation Section */}
      <Glass className="p-6" hover theme={theme}>
        <h3 className={`text-base font-bold mb-4 ${t('text-white','text-gray-900')}`}>Modify Allocation</h3>
        <p className={`text-xs mb-4 ${t('text-gray-500','text-gray-500')}`}>Request changes to your current investment allocation. Our advisory team will review and process your request.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {ALLOCATION_DATA.map((a, i) => (
            <div key={i} className={`p-3 rounded-xl ${t('bg-white/[0.03] border border-white/[0.06]','bg-gray-100/60 border border-gray-200/40')}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ background: a.color }} />
                <span className={`text-xs font-semibold ${t('text-white','text-gray-900')}`}>{a.name}</span>
              </div>
              <p className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>{a.value}%</p>
            </div>
          ))}
        </div>
        <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
          Request Reallocation
        </button>
      </Glass>
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // KYC & DOCUMENTS TAB
  // ═══════════════════════════════════════════════════════════
  const renderKYCTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold mb-1 ${t('text-white','text-gray-900')}`}>KYC & Documents</h2>
          <p className={`text-sm ${t('text-gray-500','text-gray-500')}`}>Upload, track, and manage your compliance documents</p>
        </div>
        <button onClick={() => setUploadModalOpen(true)} className="px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
          <Upload className="w-3.5 h-3.5" /> Upload Document
        </button>
      </div>

      {/* KYC Progress */}
      <Glass className="p-6" hover theme={theme}>
        <h3 className={`text-base font-bold mb-1 ${t('text-white','text-gray-900')}`}>KYC Verification Progress</h3>
        <p className={`text-xs mb-5 ${t('text-gray-500','text-gray-500')}`}>As required by SEBI, complete your KYC before investing.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {KYC_STEPS.map((step, i) => (
            <div key={i} className={`p-4 rounded-xl text-center transition-all cursor-pointer
              ${step.status === 'completed' ? (isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200') :
                step.status === 'in-review' ? (isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200') :
                t('bg-white/[0.03] border border-white/[0.06]','bg-gray-100/60 border border-gray-200/40')}`}>
              <step.icon className={`w-6 h-6 mx-auto mb-2 ${step.status === 'completed' ? 'text-emerald-400' : step.status === 'in-review' ? 'text-amber-400' : t('text-gray-500','text-gray-400')}`} />
              <p className={`text-[11px] font-medium ${t('text-white','text-gray-900')}`}>{step.label}</p>
              <span className={`text-[9px] font-semibold uppercase mt-1 inline-block px-1.5 py-0.5 rounded-full
                ${step.status === 'completed' ? 'text-emerald-400 bg-emerald-500/20' : step.status === 'in-review' ? 'text-amber-400 bg-amber-500/20' : 'text-gray-500 bg-gray-500/20'}`}>
                {step.status === 'in-review' ? 'In Review' : step.status}
              </span>
            </div>
          ))}
        </div>
      </Glass>

      {/* Document uploads */}
      <Glass className="p-6" hover theme={theme}>
        <h3 className={`text-base font-bold mb-4 ${t('text-white','text-gray-900')}`}>Your Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'PAN Card', status: 'verified', date: '15 Nov 2023', type: 'Identity' },
            { name: 'Aadhaar Card', status: 'verified', date: '15 Nov 2023', type: 'Identity' },
            { name: 'Bank Statement', status: 'verified', date: '20 Dec 2023', type: 'Financial' },
            { name: 'Photo (Passport Size)', status: 'verified', date: '15 Nov 2023', type: 'Identity' },
            { name: 'Cancelled Cheque', status: 'pending', date: '10 Mar 2025', type: 'Financial' },
            { name: 'Address Proof', status: 'verified', date: '15 Nov 2023', type: 'Identity' },
            { name: 'Q4 NAV Report', status: 'available', date: '10 Mar 2025', type: 'Reports' },
            { name: 'Annual Statement FY24', status: 'available', date: '15 Apr 2024', type: 'Statements' },
            { name: 'TDS Certificate', status: 'available', date: '30 Jun 2024', type: 'Tax' },
          ].map((doc, i) => (
            <div key={i} className={`flex items-center gap-3 p-4 rounded-xl transition-all cursor-pointer group
              ${t('bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08]','bg-gray-100/35 border border-gray-200/30 hover:border-gray-300/40')}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                ${doc.status === 'verified' ? 'bg-emerald-500/15' : doc.status === 'pending' ? 'bg-amber-500/15' : 'bg-blue-500/15'}`}>
                {doc.status === 'verified' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                 doc.status === 'pending' ? <Clock className="w-5 h-5 text-amber-400" /> :
                 <FileText className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${t('text-white','text-gray-900')}`}>{doc.name}</p>
                <p className={`text-[11px] ${t('text-gray-500','text-gray-500')}`}>{doc.type} &bull; {doc.date}</p>
              </div>
              {doc.status === 'available' && <Download className={`w-4 h-4 shrink-0 ${t('text-gray-600','text-gray-400')} group-hover:text-brand-red transition-colors`} />}
            </div>
          ))}
        </div>
      </Glass>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className={`max-w-lg w-full mx-4 rounded-2xl border p-6 ${t('bg-[#111] border-white/10','bg-[#F0EDE9] border-gray-200/50 shadow-2xl')}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>Upload Document</h3>
              <button onClick={() => setUploadModalOpen(false)} className={t('text-gray-500 hover:text-white','text-gray-400 hover:text-gray-900')}><X className="w-5 h-5" /></button>
            </div>
            {/* Document Name */}
            <div className="mb-3">
              <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Document Name</label>
              <input type="text" placeholder="e.g. Rajesh_PAN_2025" value={docName} onChange={e => setDocName(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/60 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
            </div>
            {/* Folder / Category */}
            <div className="mb-3">
              <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>File To Folder</label>
              <select value={docCategory} onChange={e => setDocCategory(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100/60 border border-gray-200/40 text-gray-900')}`}>
                <option value="">Select folder...</option>
                <option value="pan">PAN Card</option><option value="aadhaar">Aadhaar Card</option>
                <option value="bank">Bank Statements</option><option value="cheque">Cancelled Cheque</option>
                <option value="photo">Photo (Passport Size)</option><option value="address">Address Proof</option>
                <option value="demat">Demat Statement</option><option value="business">Business Registration</option>
                <option value="tax">Tax Documents</option><option value="other">Other</option>
              </select>
            </div>
            {/* Folder Preview */}
            {docCategory && (
              <div className={`flex items-center gap-2 mb-3 p-2 rounded-lg text-xs ${t('bg-white/[0.03]','bg-gray-100/40')}`}>
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span className={t('text-gray-400','text-gray-600')}>Will be saved to:</span>
                <span className={`font-semibold ${t('text-white','text-gray-900')}`}>/{docCategory}/{docName || 'untitled'}</span>
              </div>
            )}
            {/* Drop zone */}
            <div className={`border-2 border-dashed rounded-xl p-6 text-center mb-4 cursor-pointer transition-colors ${t('border-white/10 hover:border-brand-red/30','border-gray-300 hover:border-brand-red/40')}`}
              onClick={() => fileInputRef.current?.click()}>
              <Upload className={`w-8 h-8 mx-auto mb-2 ${t('text-gray-500','text-gray-400')}`} />
              <p className={`text-sm font-medium mb-1 ${t('text-white','text-gray-900')}`}>Click to upload or drag & drop</p>
              <p className={`text-xs ${t('text-gray-500','text-gray-500')}`}>PDF, JPG, PNG up to 10MB</p>
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" multiple />
            </div>
            <button className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
              Upload & Submit
            </button>
          </div>
        </div>
      )}
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // TRANSACTIONS TAB
  // ═══════════════════════════════════════════════════════════
  const renderTransactionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold mb-1 ${t('text-white','text-gray-900')}`}>Transactions</h2>
          <p className={`text-sm ${t('text-gray-500','text-gray-500')}`}>Complete transaction history</p>
        </div>
        <button className="flex items-center gap-2 text-xs text-brand-red font-semibold"><Download className="w-3.5 h-3.5" /> Export CSV</button>
      </div>
      <Glass className="overflow-hidden" hover={false} theme={theme}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${t('border-white/[0.06]','border-gray-200/50')}`}>
                {['Date', 'Type', 'Fund', 'Amount', 'Status'].map(h => (
                  <th key={h} className={`text-${h === 'Amount' || h === 'Status' ? 'right' : 'left'} text-xs font-medium py-3 px-5 ${t('text-gray-500','text-gray-400')}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_TRANSACTIONS.map((tx, i) => (
                <tr key={i} className={`border-b transition-colors ${t('border-white/[0.03] hover:bg-white/[0.02]','border-gray-100 hover:bg-gray-200/30')}`}>
                  <td className={`py-3 px-5 text-xs ${t('text-gray-400','text-gray-500')}`}>{tx.date}</td>
                  <td className="py-3 px-5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tx.type === 'Investment' ? 'bg-blue-500/15 text-blue-400' : tx.type === 'Dividend' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-400'}`}>{tx.type}</span>
                  </td>
                  <td className={`py-3 px-5 text-xs font-medium ${t('text-white','text-gray-900')}`}>{tx.fund}</td>
                  <td className={`py-3 px-5 text-right text-xs font-semibold ${t('text-white','text-gray-900')}`}>{tx.amount > 0 ? `\u20B9${formatINR(tx.amount)}` : '-'}</td>
                  <td className="py-3 px-5 text-right">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${tx.status === 'completed' ? 'text-emerald-400' : 'text-gray-500'}`}>
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

  // ═══════════════════════════════════════════════════════════
  // MESSAGES TAB (Secure Messaging Center)
  // ═══════════════════════════════════════════════════════════
  const renderMessagesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold mb-1 ${t('text-white','text-gray-900')}`}>Secure Messages</h2>
          <p className={`text-sm ${t('text-gray-500','text-gray-500')}`}>Communicate with your advisory team</p>
        </div>
        <button onClick={() => setMessageCompose(!messageCompose)} className="px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
          <Send className="w-3.5 h-3.5" /> Compose
        </button>
      </div>

      {messageCompose && (
        <Glass className="p-6" theme={theme}>
          <h4 className={`text-sm font-bold mb-4 ${t('text-white','text-gray-900')}`}>New Message</h4>
          <div className="space-y-3">
            <select className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100/60 border border-gray-200/40 text-gray-900')}`}>
              <option>Relationship Manager</option><option>Compliance Team</option><option>Investment Team</option><option>Support Team</option>
            </select>
            <input type="text" placeholder="Subject" className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
            <textarea rows={4} placeholder="Write your message..." className={`w-full px-4 py-2.5 rounded-xl text-sm resize-none ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
            <div className="flex items-center gap-3">
              <button className={`p-2 rounded-lg ${t('hover:bg-white/[0.04]','hover:bg-gray-200/40')}`}><Paperclip className={`w-4 h-4 ${t('text-gray-500','text-gray-400')}`} /></button>
              <div className="flex-1" />
              <button onClick={() => setMessageCompose(false)} className={`px-4 py-2 rounded-xl text-sm font-medium ${t('text-gray-400','text-gray-500')}`}>Cancel</button>
              <button className="px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>Send</button>
            </div>
          </div>
        </Glass>
      )}

      <div className="space-y-2">
        {MESSAGES_DATA.map(msg => (
          <Glass key={msg.id} className={`p-4 cursor-pointer ${!msg.read ? (isDark ? 'border-l-2 border-l-brand-red' : 'border-l-2 border-l-brand-red') : ''}`} hover theme={theme}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-red/20 to-red-900/20 flex items-center justify-center text-xs font-bold text-brand-red shrink-0">{msg.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={`text-sm font-semibold ${t('text-white','text-gray-900')} ${!msg.read ? '' : 'opacity-70'}`}>{msg.from}</p>
                  <span className={`text-[10px] ${t('text-gray-600','text-gray-400')}`}>{msg.time}</span>
                </div>
                <p className={`text-xs font-medium mb-0.5 ${t('text-gray-300','text-gray-700')} ${!msg.read ? '' : 'opacity-70'}`}>{msg.subject}</p>
                <p className={`text-xs truncate ${t('text-gray-500','text-gray-500')}`}>{msg.preview}</p>
              </div>
              {!msg.read && <div className="w-2 h-2 rounded-full bg-brand-red shrink-0 mt-2" />}
            </div>
          </Glass>
        ))}
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // SUPPORT TAB (Raise Ticket, FAQ, Chat, Call)
  // ═══════════════════════════════════════════════════════════
  const renderSupportTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className={`text-xl font-bold mb-1 ${t('text-white','text-gray-900')}`}>Support Center</h2>
        <p className={`text-sm ${t('text-gray-500','text-gray-500')}`}>Get help from our team</p>
      </div>

      {/* Quick connect */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Live Chat', desc: 'Chat with ARIA or a live advisor.', icon: MessageSquare, color: '#D0021B', action: () => window.dispatchEvent(new CustomEvent('ghl-open-chat')) },
          { title: 'Video Call', desc: 'Face-to-face consultation.', icon: Video, color: '#3B82F6', action: () => window.dispatchEvent(new CustomEvent('ghl-open-video-call')) },
          { title: 'Call Us', desc: '+91 7200 255 252', icon: Phone, color: '#10B981', action: () => window.dispatchEvent(new CustomEvent('ghl-open-direct-call')) },
        ].map((item, i) => (
          <button key={i} onClick={item.action} className="text-left w-full">
            <Glass className="p-5" hover glow theme={theme}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: `${item.color}15` }}>
                <item.icon className="w-6 h-6" style={{ color: item.color }} />
              </div>
              <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>{item.title}</h4>
              <p className={`text-xs mt-1 ${t('text-gray-500','text-gray-500')}`}>{item.desc}</p>
            </Glass>
          </button>
        ))}
      </div>

      {/* Raise Ticket */}
      <Glass className="p-6" hover theme={theme}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-base font-bold ${t('text-white','text-gray-900')}`}>Raise a Ticket</h3>
          <button onClick={() => setTicketForm(!ticketForm)} className="text-xs text-brand-red font-semibold flex items-center gap-1">
            {ticketForm ? 'Cancel' : <><Plus className="w-3 h-3" /> New Ticket</>}
          </button>
        </div>
        {ticketForm && (
          <div className="space-y-3 mb-6">
            <input type="text" placeholder="Subject" className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
            <select className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100/60 border border-gray-200/40 text-gray-900')}`}>
              <option>General Inquiry</option><option>Investment Query</option><option>KYC Issue</option><option>Technical Issue</option><option>Document Request</option>
            </select>
            <textarea rows={3} placeholder="Describe your issue..." className={`w-full px-4 py-2.5 rounded-xl text-sm resize-none ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
            <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>Submit Ticket</button>
          </div>
        )}
        {/* Existing tickets */}
        <div className="space-y-2">
          {SUPPORT_TICKETS.map(tk => (
            <div key={tk.id} className={`flex items-center gap-3 p-3 rounded-xl ${t('bg-white/[0.02] border border-white/[0.04]','bg-gray-100/60 border border-gray-200/40')}`}>
              <Ticket className={`w-5 h-5 shrink-0 ${tk.status === 'resolved' ? 'text-emerald-400' : 'text-amber-400'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${t('text-white','text-gray-900')}`}>{tk.subject}</p>
                <p className={`text-[11px] ${t('text-gray-500','text-gray-500')}`}>{tk.id} &bull; {tk.date}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tk.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{tk.status}</span>
            </div>
          ))}
        </div>
      </Glass>

      {/* FAQ */}
      <Glass className="p-6" hover theme={theme}>
        <h3 className={`text-base font-bold mb-4 ${t('text-white','text-gray-900')}`}>Frequently Asked Questions</h3>
        <div className="space-y-3">
          {[
            { q: 'How do I track my investment performance?', a: 'Navigate to the Portfolio tab for real-time NAV updates, allocation breakdown, and asset-level milestone progress.' },
            { q: 'When is the next NAV update?', a: 'NAV is updated quarterly. The next update will be available by 15 April 2025.' },
            { q: 'How do I increase my investment?', a: 'Go to the Investments tab and click "Express Interest" on your preferred vehicle.' },
            { q: 'How can I download my tax certificate?', a: 'Visit KYC & Documents tab and look for TDS Certificate under the available documents.' },
            { q: 'What are the exit options?', a: 'Exit options depend on the fund strategy. Contact your relationship manager for details.' },
          ].map((faq, i) => (
            <div key={i} className={`p-4 rounded-xl ${t('bg-white/[0.02] border border-white/[0.04]','bg-gray-100/60 border border-gray-200/40')}`}>
              <p className={`text-sm font-semibold mb-1.5 ${t('text-white','text-gray-900')}`}>{faq.q}</p>
              <p className={`text-xs leading-relaxed ${t('text-gray-500','text-gray-500')}`}>{faq.a}</p>
            </div>
          ))}
        </div>
      </Glass>
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // REFERRALS TAB
  // ═══════════════════════════════════════════════════════════
  const renderReferralsTab = () => (
    <div className="space-y-6">
      <h2 className={`text-xl font-bold ${t('text-white','text-gray-900')}`}>Referral Program</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Glass className="p-6 relative overflow-hidden" hover glow theme={theme}>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand-red/10 rounded-full blur-[60px]" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red/20 to-red-900/20 flex items-center justify-center"><Gift className="w-5 h-5 text-brand-red" /></div>
                <div><h3 className={`text-base font-bold ${t('text-white','text-gray-900')}`}>Refer & Earn</h3><p className={`text-xs ${t('text-gray-500','text-gray-500')}`}>Invite investors, earn rewards</p></div>
              </div>
              <div className={`flex items-center gap-2 p-2.5 rounded-xl mb-4 ${t('bg-white/[0.03] border border-white/[0.06]','bg-gray-100/60 border border-gray-200/40')}`}>
                <code className={`flex-1 text-xs font-mono truncate ${t('text-gray-300','text-gray-600')}`}>https://ghlindiaventures.com/ref/RK2024</code>
                <button className={`p-1.5 rounded-lg ${t('hover:bg-white/[0.06] text-gray-400','hover:bg-gray-200 text-gray-500')}`}><Copy className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex items-center gap-6 text-xs">
                <div><p className={t('text-gray-500','text-gray-500')}>Referred</p><p className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>3</p></div>
                <div className={`w-px h-8 ${t('bg-white/[0.06]','bg-gray-200')}`} />
                <div><p className={t('text-gray-500','text-gray-500')}>Earned</p><p className="text-lg font-bold text-emerald-400">{'\u20B9'}75K</p></div>
              </div>
            </div>
          </Glass>
        </div>
        <Glass className="p-6" hover theme={theme}>
          <h4 className={`text-sm font-bold mb-4 ${t('text-white','text-gray-900')}`}>How It Works</h4>
          {[{ step: '1', t: 'Share Link', d: 'Share your unique referral link' },{ step: '2', t: 'They Invest', d: 'Your referral completes investment' },{ step: '3', t: 'You Earn', d: 'Receive referral bonus' }].map((s, i) => (
            <div key={i} className="flex items-start gap-3 mb-3">
              <span className="w-7 h-7 rounded-full bg-brand-red/15 flex items-center justify-center text-xs font-bold text-brand-red shrink-0">{s.step}</span>
              <div><p className={`text-xs font-semibold ${t('text-white','text-gray-900')}`}>{s.t}</p><p className={`text-[11px] ${t('text-gray-500','text-gray-500')}`}>{s.d}</p></div>
            </div>
          ))}
        </Glass>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // PROFILE TAB (Personal, Nominee, Bank)
  // ═══════════════════════════════════════════════════════════
  const renderProfileTab = () => (
    <div className="space-y-6">
      <h2 className={`text-xl font-bold ${t('text-white','text-gray-900')}`}>Your Profile</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Glass className="p-6 text-center" hover glow theme={theme}>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 ring-4 ring-white/[0.08]">RK</div>
          <h3 className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>Rajesh Krishnan</h3>
          <p className={`text-xs mb-3 ${t('text-gray-500','text-gray-500')}`}>rajesh.k@email.com</p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"><Shield className="w-3 h-3" /> KYC Verified</span>
          <div className={`mt-4 pt-4 border-t text-left space-y-2.5 ${t('border-white/[0.06]','border-gray-200/50')}`}>
            {[['Investor ID','GHL-INV-2024-0847'],['PAN','ABCPK****F'],['Mobile','+91 98XXX XXXXX'],['Joined','December 2023']].map(([l,v],i) => (
              <div key={i} className="flex justify-between text-xs"><span className={t('text-gray-500','text-gray-500')}>{l}</span><span className={`font-medium ${t('text-white','text-gray-900')}`}>{v}</span></div>
            ))}
          </div>
        </Glass>

        <div className="lg:col-span-2 space-y-4">
          {/* Personal Details */}
          <Glass className="p-6" hover theme={theme}>
            <h4 className={`text-sm font-bold mb-4 ${t('text-white','text-gray-900')}`}>Personal Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[['Full Name','Rajesh Krishnan'],['Email','rajesh.k@email.com'],['Phone','+91 98765 43210'],['City','Chennai, Tamil Nadu'],['Date of Birth','15 Aug 1978'],['Occupation','Business Owner']].map(([l,v],i) => (
                <div key={i}><p className={`text-[10px] uppercase tracking-wider mb-1 ${t('text-gray-600','text-gray-400')}`}>{l}</p><p className={`text-sm font-medium ${t('text-white','text-gray-900')}`}>{v}</p></div>
              ))}
            </div>
          </Glass>

          {/* Nominee Details */}
          <Glass className="p-6" hover theme={theme}>
            <h4 className={`text-sm font-bold mb-4 ${t('text-white','text-gray-900')}`}>Nominee Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[['Nominee Name','Lakshmi Krishnan'],['Relationship','Spouse'],['Nominee PAN','ABCPL****G'],['Share','100%']].map(([l,v],i) => (
                <div key={i}><p className={`text-[10px] uppercase tracking-wider mb-1 ${t('text-gray-600','text-gray-400')}`}>{l}</p><p className={`text-sm font-medium ${t('text-white','text-gray-900')}`}>{v}</p></div>
              ))}
            </div>
          </Glass>

          {/* Bank Details */}
          <Glass className="p-6" hover theme={theme}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Bank Details</h4>
              <button onClick={() => setBankConnectOpen(true)} className="text-xs text-brand-red font-semibold flex items-center gap-1"><Landmark className="w-3 h-3" /> Bank Connect</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[['Bank Name','HDFC Bank'],['Account No','XXXX XXXX 4521'],['IFSC','HDFC0001234'],['Account Type','Savings']].map(([l,v],i) => (
                <div key={i}><p className={`text-[10px] uppercase tracking-wider mb-1 ${t('text-gray-600','text-gray-400')}`}>{l}</p><p className={`text-sm font-medium ${t('text-white','text-gray-900')}`}>{v}</p></div>
              ))}
            </div>
          </Glass>
        </div>
      </div>

      {/* Bank Connect Modal */}
      {bankConnectOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className={`max-w-md w-full mx-4 rounded-2xl border p-6 ${t('bg-[#111] border-white/10','bg-white border-gray-200 shadow-2xl')}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>Bank Connect</h3>
              <button onClick={() => setBankConnectOpen(false)} className={t('text-gray-500 hover:text-white','text-gray-400 hover:text-gray-900')}><X className="w-5 h-5" /></button>
            </div>
            <div className={`p-4 rounded-xl mb-4 ${t('bg-emerald-500/10 border border-emerald-500/20','bg-emerald-50 border border-emerald-200')}`}>
              <div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-emerald-400" /><span className={`text-sm font-semibold ${t('text-emerald-400','text-emerald-600')}`}>Secure Connection</span></div>
              <p className={`text-xs ${t('text-gray-400','text-gray-500')}`}>Your bank details are encrypted and secured with 256-bit SSL.</p>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Account Holder Name" className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
              <input type="text" placeholder="Account Number" className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
              <input type="text" placeholder="IFSC Code" className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
              <select className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100/60 border border-gray-200/40 text-gray-900')}`}>
                <option>Savings Account</option><option>Current Account</option><option>NRO Account</option>
              </select>
              <button className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>Verify & Connect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // SETTINGS TAB
  // ═══════════════════════════════════════════════════════════
  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h2 className={`text-xl font-bold ${t('text-white','text-gray-900')}`}>Settings</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Appearance */}
        <Glass className="p-6" hover theme={theme}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t('bg-white/[0.04]','bg-gray-200/40')}`}>
              {isDark ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div><h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Appearance</h4><p className={`text-xs ${t('text-gray-500','text-gray-500')}`}>Theme and display preferences</p></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setTheme('dark')} className={`flex-1 p-3 rounded-xl text-center text-sm font-medium transition-all ${theme === 'dark' ? 'bg-brand-red/15 text-white border border-brand-red/20' : t('bg-white/[0.03] text-gray-400','bg-gray-100/40 text-gray-500')}`}>
              <Moon className="w-5 h-5 mx-auto mb-1" /> Dark
            </button>
            <button onClick={() => setTheme('light')} className={`flex-1 p-3 rounded-xl text-center text-sm font-medium transition-all ${theme === 'light' ? 'bg-brand-red/15 text-brand-red border border-brand-red/20' : t('bg-white/[0.03] text-gray-400','bg-gray-100/40 text-gray-500')}`}>
              <Sun className="w-5 h-5 mx-auto mb-1" /> Light
            </button>
          </div>
        </Glass>

        {/* Language */}
        <Glass className="p-6" hover theme={theme}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t('bg-white/[0.04]','bg-gray-200/40')}`}><Languages className="w-5 h-5 text-blue-400" /></div>
            <div><h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Language</h4><p className={`text-xs ${t('text-gray-500','text-gray-500')}`}>Dashboard language preference</p></div>
          </div>
          <select
            value={dashLang}
            onChange={(e) => setDashLang(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl text-sm cursor-pointer ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100/60 border border-gray-200/40 text-gray-900')}`}
          >
            <option value="English">English</option><option value="Hindi">हिन्दी (Hindi)</option><option value="Tamil">தமிழ் (Tamil)</option><option value="Telugu">తెలుగు (Telugu)</option><option value="Kannada">ಕನ್ನಡ (Kannada)</option><option value="Malayalam">മലയാളം (Malayalam)</option><option value="Marathi">मराठी (Marathi)</option><option value="Bengali">বাংলা (Bengali)</option><option value="Gujarati">ગુજરાતી (Gujarati)</option>
          </select>
          {dashLang !== 'English' && (
            <p className={`text-[10px] mt-2 ${t('text-gray-500','text-gray-500')}`}>
              <Info className="w-3 h-3 inline mr-1" />
              Translation to {dashLang} will be available in a future update. Currently displaying in English.
            </p>
          )}
        </Glass>

        {/* Notifications */}
        <Glass className="p-6" hover theme={theme}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t('bg-white/[0.04]','bg-gray-200/40')}`}><Bell className="w-5 h-5 text-amber-400" /></div>
            <div><h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Notifications</h4><p className={`text-xs ${t('text-gray-500','text-gray-500')}`}>Email and push preferences</p></div>
          </div>
          {([
            { key: 'email' as const, label: 'Email Alerts' },
            { key: 'nav' as const, label: 'NAV Updates' },
            { key: 'invest' as const, label: 'Investment Opportunities' },
            { key: 'dividend' as const, label: 'Dividend Notifications' },
          ]).map((opt) => {
            const isOn = notifPrefs[opt.key]
            return (
              <div key={opt.key} className={`flex items-center justify-between p-2.5 rounded-lg ${t('hover:bg-white/[0.02]','hover:bg-gray-200/40')} transition-colors`}>
                <span className={`text-xs ${t('text-gray-400','text-gray-600')}`}>{opt.label}</span>
                <button onClick={() => setNotifPrefs(p => ({ ...p, [opt.key]: !p[opt.key] }))}
                  className={`w-10 h-[22px] rounded-full relative cursor-pointer transition-all duration-300 ${isOn ? 'bg-brand-red' : t('bg-white/[0.08]','bg-gray-300')}`}>
                  <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${isOn ? 'left-[22px]' : 'left-[3px]'}`} />
                </button>
              </div>
            )
          })}
        </Glass>

        {/* Security */}
        <Glass className="p-6" hover theme={theme}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t('bg-white/[0.04]','bg-gray-200/40')}`}><Lock className="w-5 h-5 text-emerald-400" /></div>
            <div><h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Security</h4><p className={`text-xs ${t('text-gray-500','text-gray-500')}`}>Password and authentication</p></div>
          </div>
          {['Change Password','Enable 2FA','Active Sessions','Login History'].map((opt,j) => (
            <div key={j} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer group ${t('hover:bg-white/[0.02]','hover:bg-gray-200/40')} transition-colors`}>
              <span className={`text-xs ${t('text-gray-400 group-hover:text-white','text-gray-600 group-hover:text-gray-900')} transition-colors`}>{opt}</span>
              <ChevronRight className={`w-3.5 h-3.5 ${t('text-gray-600','text-gray-400')}`} />
            </div>
          ))}
        </Glass>

        {/* Legal & Policies */}
        <Glass className="p-6" hover theme={theme}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t('bg-white/[0.04]','bg-gray-200/40')}`}><ScrollText className="w-5 h-5 text-brand-red" /></div>
            <div><h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Legal & Policies</h4><p className={`text-xs ${t('text-gray-500','text-gray-500')}`}>Terms, conditions, and compliance</p></div>
          </div>
          <button onClick={() => { setTermsOpen(true); setTermsScrolled(false) }}
            className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all mb-2 ${t('bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04]','bg-gray-100/40 hover:bg-gray-200/35 border border-gray-200/30')}`}>
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-brand-red" />
              <div className="text-left">
                <span className={`text-xs font-semibold block ${t('text-white','text-gray-900')}`}>Terms & Conditions</span>
                <span className={`text-[10px] ${t('text-gray-500','text-gray-400')}`}>Dashboard usage policy</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {termsAccepted && <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Accepted</span>}
              <ChevronRight className={`w-3.5 h-3.5 ${t('text-gray-600','text-gray-400')}`} />
            </div>
          </button>
          <button onClick={() => { setPrivacyOpen(true); setPrivacyScrolled(false) }}
            className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all mb-2 ${t('bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04]','bg-gray-100/40 hover:bg-gray-200/35 border border-gray-200/30')}`}>
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-blue-400" />
              <div className="text-left">
                <span className={`text-xs font-semibold block ${t('text-white','text-gray-900')}`}>Privacy Policy</span>
                <span className={`text-[10px] ${t('text-gray-500','text-gray-400')}`}>How we protect your data</span>
              </div>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 ${t('text-gray-600','text-gray-400')}`} />
          </button>
          <button onClick={() => window.open('https://www.sebi.gov.in/', '_blank')}
            className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all ${t('bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04]','bg-gray-100/40 hover:bg-gray-200/35 border border-gray-200/30')}`}>
            <div className="flex items-center gap-2.5">
              <Landmark className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <span className={`text-xs font-semibold block ${t('text-white','text-gray-900')}`}>SEBI Compliance</span>
                <span className={`text-[10px] ${t('text-gray-500','text-gray-400')}`}>Reg: IN/AIF2/2425/1517</span>
              </div>
            </div>
            <ExternalLink className={`w-3.5 h-3.5 ${t('text-gray-600','text-gray-400')}`} />
          </button>
        </Glass>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // PORTFOLIO TAB
  // ═══════════════════════════════════════════════════════════
  const renderPortfolioTab = () => (
    <div className="space-y-6">
      <h2 className={`text-xl font-bold ${t('text-white','text-gray-900')}`}>Your Portfolio</h2>
      {renderHeroMetrics()}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">{renderNAVChart()}</div>
        <div>{renderAllocationChart()}</div>
      </div>
      {renderPortfolioAssets()}
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // INVESTMENT ONBOARDING TAB
  // ═══════════════════════════════════════════════════════════
  const renderInvestOnboard = () => (
    <div className="space-y-6">
      <div>
        <h2 className={`text-xl font-bold mb-1 ${t('text-white','text-gray-900')}`}>Complete Your Investment</h2>
        <p className={`text-sm ${t('text-gray-500','text-gray-500')}`}>Select your investment, set the amount, and provide bank details</p>
      </div>

      {/* Step 1: Vehicle + Amount */}
      <Glass className="p-6" hover glow theme={theme}>
        <h3 className={`text-base font-bold mb-4 ${t('text-white','text-gray-900')}`}>1. Investment Selection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className={`text-xs font-medium mb-1.5 block ${t('text-gray-400','text-gray-600')}`}>Investment Vehicle</label>
            <select value={investVehicle} onChange={e => setInvestVehicle(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100/60 border border-gray-200/40 text-gray-900')}`}>
              <option>AIF Direct - Category II</option>
              <option>SEBI Co-Invest Framework</option>
              <option>NCLT Recovery Assets</option>
              <option>Early-Stage Startups</option>
            </select>
          </div>
          <div>
            <label className={`text-xs font-medium mb-1.5 block ${t('text-gray-400','text-gray-600')}`}>Tenure Preference</label>
            <select className={`w-full px-4 py-3 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100/60 border border-gray-200/40 text-gray-900')}`}>
              <option>3 Years</option><option>5 Years</option><option>7 Years</option>
            </select>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`text-xs font-medium ${t('text-gray-400','text-gray-600')}`}>Investment Amount</label>
            <span className={`text-lg font-black text-brand-red`}>{'\u20B9'}{formatINR(investAmount)}</span>
          </div>
          <input type="range" min={500000} max={50000000} step={100000} value={investAmount}
            onChange={e => setInvestAmount(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-red"
            style={{ background: `linear-gradient(to right, #D0021B ${((investAmount - 500000) / 49500000) * 100}%, ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)'} 0%)` }} />
          <div className={`flex justify-between text-[10px] mt-1 ${t('text-gray-600','text-gray-400')}`}>
            <span>{'\u20B9'}5L</span><span>{'\u20B9'}1Cr</span><span>{'\u20B9'}2.5Cr</span><span>{'\u20B9'}5Cr</span>
          </div>
        </div>
      </Glass>

      {/* Step 2: Bank Details */}
      <Glass className="p-6" hover theme={theme}>
        <h3 className={`text-base font-bold mb-4 ${t('text-white','text-gray-900')}`}>2. Bank Account Details</h3>
        <p className={`text-xs mb-4 ${t('text-gray-500','text-gray-500')}`}>Add one or more bank accounts for fund transfer. Primary account will be used for dividends.</p>
        {[1].map(idx => (
          <div key={idx} className={`p-4 rounded-xl mb-3 ${t('bg-white/[0.02] border border-white/[0.04]','bg-gray-100/50 border border-gray-200/30')}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold ${t('text-white','text-gray-900')}`}>Bank Account {idx}</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-red/15 text-brand-red font-bold">Primary</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Account Holder Name" className={`px-3 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/60 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
              <input placeholder="Account Number" className={`px-3 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/60 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
              <input placeholder="IFSC Code" className={`px-3 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/60 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
              <select className={`px-3 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100/60 border border-gray-200/40 text-gray-900')}`}>
                <option>Savings</option><option>Current</option><option>NRO</option><option>NRE</option>
              </select>
            </div>
            <div className={`mt-3 p-3 rounded-lg border-2 border-dashed cursor-pointer text-center ${t('border-white/[0.08] hover:border-brand-red/20','border-gray-300 hover:border-brand-red/30')}`}>
              <FileUp className={`w-5 h-5 mx-auto mb-1 ${t('text-gray-500','text-gray-400')}`} />
              <p className={`text-[11px] ${t('text-gray-500','text-gray-500')}`}>Upload cancelled cheque / bank statement</p>
            </div>
          </div>
        ))}
        <button className={`flex items-center gap-2 text-xs font-semibold ${t('text-blue-400 hover:text-blue-300','text-blue-600 hover:text-blue-500')} transition-colors`}>
          <Plus className="w-3.5 h-3.5" /> Add Another Bank Account
        </button>
      </Glass>

      {/* Step 3: Confirm */}
      <Glass className="p-6" hover glow theme={theme}>
        <h3 className={`text-base font-bold mb-4 ${t('text-white','text-gray-900')}`}>3. Review & Submit</h3>
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 mb-4`}>
          {[{ l: 'Vehicle', v: investVehicle },{ l: 'Amount', v: `\u20B9${formatINR(investAmount)}` },{ l: 'Tenure', v: '5 Years' },{ l: 'Bank', v: 'HDFC ****4521' }].map((r,i) => (
            <div key={i} className={`p-3 rounded-xl ${t('bg-white/[0.03] border border-white/[0.04]','bg-gray-100/50 border border-gray-200/30')}`}>
              <p className={`text-[9px] uppercase tracking-wider ${t('text-gray-600','text-gray-400')}`}>{r.l}</p>
              <p className={`text-sm font-bold mt-0.5 ${t('text-white','text-gray-900')}`}>{r.v}</p>
            </div>
          ))}
        </div>
        <label className="flex items-start gap-2 mb-4 cursor-pointer">
          <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red" />
          <span className={`text-xs ${t('text-gray-400','text-gray-600')}`}>I confirm the details above and agree to the investment terms. I understand that AIF investments involve risk and are subject to SEBI regulations.</span>
        </label>
        <button className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01]"
          style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>Submit Investment Application</button>
      </Glass>
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // CALCULATORS TAB
  // ═══════════════════════════════════════════════════════════
  const renderCalculatorsTab = () => {
    const future = calcInputs.amount * Math.pow(1 + calcInputs.rate / 100, calcInputs.years)
    const sipFuture = calcInputs.amount * (((Math.pow(1 + calcInputs.rate / 1200, calcInputs.years * 12) - 1) / (calcInputs.rate / 1200)) * (1 + calcInputs.rate / 1200))

    // IRR calculation: given investment, final value, years → find rate
    const irrFinalValue = calcInputs.amount * (1 + calcInputs.rate / 100) * Math.pow(1 + calcInputs.rate / 200, calcInputs.years)
    const irrRate = calcInputs.years > 0 ? (Math.pow(irrFinalValue / calcInputs.amount, 1 / calcInputs.years) - 1) * 100 : 0

    const calcs = [
      { id: 'sip', label: 'SIP', icon: TrendingUp },
      { id: 'lumpsum', label: 'Lumpsum', icon: Wallet },
      { id: 'irr', label: 'IRR', icon: Activity },
      { id: 'swp', label: 'SWP', icon: ArrowLeftRight },
      { id: 'goal', label: 'Goal Planner', icon: Target },
      { id: 'inflation', label: 'Inflation', icon: Flame },
      { id: 'tax', label: 'Tax Benefit', icon: Percent },
      { id: 'fd', label: 'FD vs AIF', icon: BarChart3 },
      { id: 'emi', label: 'EMI', icon: Calculator },
    ]

    return (
      <div className="space-y-6">
        <div>
          <h2 className={`text-xl font-bold mb-1 ${t('text-white','text-gray-900')}`}>Investment Calculators</h2>
          <p className={`text-sm ${t('text-gray-500','text-gray-500')}`}>Plan, compare, and project your investments</p>
        </div>

        {/* Calculator tabs */}
        <div className="flex flex-wrap gap-2">
          {calcs.map(c => (
            <button key={c.id} onClick={() => setActiveCalc(c.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all
                ${activeCalc === c.id ? 'text-white bg-brand-red' : t('text-gray-400 bg-white/[0.04] hover:bg-white/[0.06]','text-gray-600 bg-gray-100/50 hover:bg-gray-200/40')}`}>
              <c.icon className="w-3.5 h-3.5" /> {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input panel */}
          <Glass className="p-6" hover theme={theme}>
            <h3 className={`text-base font-bold mb-5 ${t('text-white','text-gray-900')}`}>
              {calcs.find(c => c.id === activeCalc)?.label} Calculator
            </h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <label className={`text-xs font-medium ${t('text-gray-400','text-gray-600')}`}>
                    {activeCalc === 'sip' ? 'Monthly Investment' : activeCalc === 'irr' ? 'Initial Investment' : 'Investment Amount'}
                  </label>
                  <span className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>{'\u20B9'}{formatINR(calcInputs.amount)}</span>
                </div>
                <input type="range" min={activeCalc === 'sip' ? 5000 : 100000} max={activeCalc === 'sip' ? 500000 : 50000000} step={activeCalc === 'sip' ? 5000 : 100000}
                  value={calcInputs.amount} onChange={e => setCalcInputs(p => ({ ...p, amount: +e.target.value }))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-red" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className={`text-xs font-medium ${t('text-gray-400','text-gray-600')}`}>Expected Return (%)</label>
                  <span className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>{calcInputs.rate}%</span>
                </div>
                <input type="range" min={5} max={35} step={0.5} value={calcInputs.rate}
                  onChange={e => setCalcInputs(p => ({ ...p, rate: +e.target.value }))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-500" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className={`text-xs font-medium ${t('text-gray-400','text-gray-600')}`}>Time Period (Years)</label>
                  <span className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>{calcInputs.years} Yrs</span>
                </div>
                <input type="range" min={1} max={30} step={1} value={calcInputs.years}
                  onChange={e => setCalcInputs(p => ({ ...p, years: +e.target.value }))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500" />
              </div>
            </div>
          </Glass>

          {/* Results panel */}
          <Glass className="p-6" hover glow theme={theme}>
            <h3 className={`text-base font-bold mb-5 ${t('text-white','text-gray-900')}`}>
              {activeCalc === 'irr' ? 'IRR Analysis' : 'Projected Returns'}
            </h3>

            {activeCalc === 'irr' ? (
              <>
                {/* IRR-specific results */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className={`p-4 rounded-xl text-center ${t('bg-white/[0.03] border border-white/[0.04]','bg-gray-100/50 border border-gray-200/30')}`}>
                    <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-500','text-gray-400')}`}>Initial Investment</p>
                    <p className={`text-lg font-black mt-1 ${t('text-white','text-gray-900')}`}>{'\u20B9'}{formatINR(calcInputs.amount)}</p>
                  </div>
                  <div className={`p-4 rounded-xl text-center ${t('bg-emerald-500/[0.06] border border-emerald-500/[0.1]','bg-emerald-50/60 border border-emerald-200/50')}`}>
                    <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-500','text-gray-400')}`}>Final Value</p>
                    <p className="text-lg font-black mt-1 text-emerald-400">{'\u20B9'}{formatINR(Math.round(irrFinalValue))}</p>
                  </div>
                  <div className={`p-4 rounded-xl text-center col-span-2 ${t('bg-brand-red/[0.06] border border-brand-red/[0.1]','bg-red-50/60 border border-red-200/50')}`}>
                    <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-500','text-gray-400')}`}>Internal Rate of Return (IRR)</p>
                    <p className="text-3xl font-black mt-1 text-brand-red">{irrRate.toFixed(2)}%</p>
                    <p className={`text-[10px] mt-1 ${t('text-gray-500','text-gray-400')}`}>Annualized over {calcInputs.years} year{calcInputs.years > 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* IRR comparison across products */}
                <h4 className={`text-xs font-bold mb-3 ${t('text-gray-400','text-gray-600')}`}>IRR Comparison: Investment Products</h4>
                <div className="space-y-2">
                  {[
                    { name: 'GHL AIF', irr: irrRate, color: '#D0021B' },
                    { name: 'Real Estate', irr: 12.5, color: '#8B5CF6' },
                    { name: 'NIFTY 50', irr: 13.2, color: '#3B82F6' },
                    { name: 'Gold', irr: 10.8, color: '#EAB308' },
                    { name: 'Fixed Deposit', irr: 7.5, color: '#6B7280' },
                    { name: 'PPF', irr: 7.1, color: '#F59E0B' },
                    { name: 'Savings A/c', irr: 3.5, color: '#94A3B8' },
                  ].map((p, i) => {
                    const maxIrr = Math.max(irrRate, 25)
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className={`w-20 text-[10px] font-medium text-right ${t('text-gray-400','text-gray-600')}`}>{p.name}</span>
                        <div className={`flex-1 h-4 rounded-full overflow-hidden ${t('bg-white/[0.04]','bg-gray-200/30')}`}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((p.irr / maxIrr) * 100, 100)}%`, background: p.color }} />
                        </div>
                        <span className={`w-12 text-[10px] font-bold text-right ${p.irr === irrRate ? 'text-brand-red' : t('text-white','text-gray-900')}`}>{p.irr.toFixed(1)}%</span>
                      </div>
                    )
                  })}
                </div>

                {/* IRR insight */}
                <div className={`mt-4 p-3 rounded-xl ${t('bg-white/[0.03] border border-white/[0.04]','bg-gray-100/50 border border-gray-200/30')}`}>
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-brand-red mt-0.5 shrink-0" />
                    <p className={`text-[11px] leading-relaxed ${t('text-gray-400','text-gray-600')}`}>
                      {irrRate > 15 ? `Your projected IRR of ${irrRate.toFixed(1)}% significantly outperforms traditional investments. GHL AIF's stressed real estate strategy targets above-market returns through NCLT-resolved assets.` :
                       irrRate > 10 ? `An IRR of ${irrRate.toFixed(1)}% is competitive with equity markets. Consider increasing your holding period or allocation to maximize compounding benefits.` :
                       `At ${irrRate.toFixed(1)}% IRR, explore GHL's higher-yield stressed asset opportunities for potentially better risk-adjusted returns.`}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Standard results for other calculators */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className={`p-4 rounded-xl text-center ${t('bg-white/[0.03] border border-white/[0.04]','bg-gray-100/50 border border-gray-200/30')}`}>
                    <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-500','text-gray-400')}`}>Total Invested</p>
                    <p className={`text-lg font-black mt-1 ${t('text-white','text-gray-900')}`}>{'\u20B9'}{formatINR(activeCalc === 'sip' ? calcInputs.amount * calcInputs.years * 12 : calcInputs.amount)}</p>
                  </div>
                  <div className={`p-4 rounded-xl text-center ${t('bg-emerald-500/[0.06] border border-emerald-500/[0.1]','bg-emerald-50/60 border border-emerald-200/50')}`}>
                    <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-500','text-gray-400')}`}>Future Value</p>
                    <p className="text-lg font-black mt-1 text-emerald-400">{'\u20B9'}{formatINR(Math.round(activeCalc === 'sip' ? sipFuture : future))}</p>
                  </div>
                  <div className={`p-4 rounded-xl text-center ${t('bg-white/[0.03] border border-white/[0.04]','bg-gray-100/50 border border-gray-200/30')}`}>
                    <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-500','text-gray-400')}`}>Wealth Gain</p>
                    <p className={`text-lg font-black mt-1 text-emerald-400`}>{'\u20B9'}{formatINR(Math.round((activeCalc === 'sip' ? sipFuture : future) - (activeCalc === 'sip' ? calcInputs.amount * calcInputs.years * 12 : calcInputs.amount)))}</p>
                  </div>
                  <div className={`p-4 rounded-xl text-center ${t('bg-white/[0.03] border border-white/[0.04]','bg-gray-100/50 border border-gray-200/30')}`}>
                    <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-500','text-gray-400')}`}>CAGR</p>
                    <p className={`text-lg font-black mt-1 text-brand-red`}>{calcInputs.rate}%</p>
                  </div>
                </div>

                {/* Comparison bar chart */}
                <h4 className={`text-xs font-bold mb-3 ${t('text-gray-400','text-gray-600')}`}>Comparison: Same Amount Across Products</h4>
                <div className="space-y-2">
                  {[
                    { name: 'GHL AIF', rate: calcInputs.rate, color: '#D0021B' },
                    { name: 'Fixed Deposit', rate: 7.5, color: '#6B7280' },
                    { name: 'PPF', rate: 7.1, color: '#F59E0B' },
                    { name: 'Gold', rate: 10, color: '#EAB308' },
                    { name: 'NIFTY 50', rate: 12, color: '#3B82F6' },
                  ].map((p, i) => {
                    const pv = calcInputs.amount * Math.pow(1 + p.rate / 100, calcInputs.years)
                    const maxVal = calcInputs.amount * Math.pow(1 + calcInputs.rate / 100, calcInputs.years)
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className={`w-20 text-[10px] font-medium text-right ${t('text-gray-400','text-gray-600')}`}>{p.name}</span>
                        <div className={`flex-1 h-4 rounded-full overflow-hidden ${t('bg-white/[0.04]','bg-gray-200/30')}`}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((pv / maxVal) * 100, 100)}%`, background: p.color }} />
                        </div>
                        <span className={`w-16 text-[10px] font-bold text-right ${t('text-white','text-gray-900')}`}>{'\u20B9'}{formatINR(Math.round(pv))}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </Glass>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // TERMS & CONDITIONS POPUP
  // ═══════════════════════════════════════════════════════════
  const renderTermsPopup = () => {
    if (!termsOpen) return null
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className={`max-w-2xl w-full mx-4 rounded-2xl border overflow-hidden flex flex-col max-h-[85vh]
          ${t('bg-[#111] border-white/10','bg-[#F0EDE9] border-gray-200/50 shadow-2xl')}`}>
          <div className={`px-6 py-4 flex items-center justify-between border-b shrink-0 ${t('border-white/[0.06]','border-gray-200/45')}`}>
            <div className="flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-brand-red" />
              <h3 className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>Terms & Conditions</h3>
            </div>
            <button onClick={() => setTermsOpen(false)} className={t('text-gray-500 hover:text-white','text-gray-400 hover:text-gray-900')}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div ref={termsRef} className="flex-1 overflow-y-auto px-6 py-4"
            onScroll={() => {
              if (!termsRef.current) return
              const { scrollTop, scrollHeight, clientHeight } = termsRef.current
              if (scrollTop + clientHeight >= scrollHeight - 20) setTermsScrolled(true)
            }}>
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              <h4 className={`text-sm font-bold mb-2 ${t('text-white','text-gray-900')}`}>GHL India Ventures - Dashboard Usage Policy</h4>
              <p className={`text-xs leading-relaxed mb-3 ${t('text-gray-400','text-gray-600')}`}>Last Updated: 1 March 2025</p>
              {[
                { title: '1. Acceptance of Terms', body: 'By accessing and using the GHL India Ventures Investor Dashboard, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please do not use this platform.' },
                { title: '2. Dashboard Access', body: 'Access to this dashboard is restricted to registered investors of GHL India Ventures. Your login credentials are confidential and must not be shared. You are responsible for all activity under your account.' },
                { title: '3. Investment Information', body: 'All investment data, NAV figures, returns, and projections displayed on this dashboard are for informational purposes only. Past performance does not guarantee future results. All investments in Alternative Investment Funds are subject to market risks.' },
                { title: '4. SEBI Compliance', body: 'GHL India Ventures is a SEBI-registered Category II AIF (Reg: IN/AIF2/2425/1517). All investment activities are conducted in compliance with SEBI (Alternative Investment Funds) Regulations, 2012 and subsequent amendments.' },
                { title: '5. Data Privacy & Security', body: 'Your personal and financial data is encrypted using 256-bit SSL encryption. We do not share your data with third parties except as required by law or regulation. KYC documents are stored securely and accessed only by authorized personnel.' },
                { title: '6. Document Uploads', body: 'Documents uploaded through this dashboard must be authentic and unaltered. Uploading forged or fraudulent documents is a criminal offense. GHL reserves the right to verify all submitted documents.' },
                { title: '7. Communication', body: 'Messages sent through the secure messaging center are confidential. GHL India Ventures will never ask for passwords, OTPs, or sensitive credentials through any communication channel.' },
                { title: '8. Limitation of Liability', body: 'GHL India Ventures shall not be liable for any losses arising from technical failures, market conditions, or unauthorized access to your account due to negligence in safeguarding credentials.' },
                { title: '9. Dispute Resolution', body: 'Any disputes shall be subject to the exclusive jurisdiction of courts in Chennai, Tamil Nadu, India. Disputes may also be resolved through SEBI SCORES portal or arbitration as per SEBI guidelines.' },
                { title: '10. Amendments', body: 'GHL reserves the right to modify these terms at any time. Continued use of the dashboard after modifications constitutes acceptance of the revised terms.' },
              ].map((s,i) => (
                <div key={i} className="mb-4">
                  <h5 className={`text-xs font-bold mb-1 ${t('text-white','text-gray-900')}`}>{s.title}</h5>
                  <p className={`text-[11px] leading-relaxed ${t('text-gray-400','text-gray-600')}`}>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`px-6 py-4 flex items-center justify-between border-t shrink-0 ${t('border-white/[0.06]','border-gray-200/45')}`}>
            <p className={`text-[10px] ${t('text-gray-600','text-gray-400')}`}>
              {termsScrolled ? <span className="text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Document read</span> : 'Scroll to bottom to accept'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setTermsOpen(false)} className={`px-4 py-2 rounded-xl text-sm font-medium ${t('text-gray-400 hover:text-white','text-gray-500 hover:text-gray-900')}`}>Close</button>
              <button disabled={!termsScrolled} onClick={() => { setTermsAccepted(true); setTermsOpen(false) }}
                className={`px-5 py-2 rounded-xl text-sm font-bold text-white transition-all ${termsScrolled ? 'hover:scale-105' : 'opacity-40 cursor-not-allowed'}`}
                style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
                Accept Terms
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // PRIVACY POLICY POPUP
  // ═══════════════════════════════════════════════════════════
  const renderPrivacyPopup = () => {
    if (!privacyOpen) return null
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className={`max-w-2xl w-full mx-4 rounded-2xl border overflow-hidden flex flex-col max-h-[85vh]
          ${t('bg-[#111] border-white/10','bg-[#F0EDE9] border-gray-200/50 shadow-2xl')}`}>
          <div className={`px-6 py-4 flex items-center justify-between border-b shrink-0 ${t('border-white/[0.06]','border-gray-200/45')}`}>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>Privacy Policy</h3>
            </div>
            <button onClick={() => setPrivacyOpen(false)} className={t('text-gray-500 hover:text-white','text-gray-400 hover:text-gray-900')}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div ref={privacyRef} className="flex-1 overflow-y-auto px-6 py-4"
            onScroll={() => {
              if (!privacyRef.current) return
              const { scrollTop, scrollHeight, clientHeight } = privacyRef.current
              if (scrollTop + clientHeight >= scrollHeight - 20) setPrivacyScrolled(true)
            }}>
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              <h4 className={`text-sm font-bold mb-2 ${t('text-white','text-gray-900')}`}>GHL India Ventures - Privacy Policy</h4>
              <p className={`text-xs leading-relaxed mb-3 ${t('text-gray-400','text-gray-600')}`}>Effective Date: 1 January 2025 | Last Updated: 1 March 2025</p>
              {[
                { title: '1. Introduction', body: 'GHL India Ventures Private Limited ("Company", "we", "us") is committed to protecting your privacy and personal data. This Privacy Policy describes how we collect, use, store, disclose, and protect your information when you use our Investor Dashboard, website, and services. We are a SEBI-registered Category II Alternative Investment Fund (Reg: IN/AIF2/2425/1517) and comply with all applicable Indian data protection laws including the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.' },
                { title: '2. Information We Collect', body: 'We collect the following categories of information: (a) Personal Identification Data: Full name, date of birth, gender, PAN number, Aadhaar number, passport details, photographs. (b) Contact Information: Email address, phone number, postal address. (c) Financial Data: Bank account details, investment history, portfolio data, NAV records, transaction history, tax documents. (d) KYC Documents: PAN card, Aadhaar card, address proof, bank statements, cancelled cheques, DEMAT account details. (e) Technical Data: IP address, browser type, device information, login timestamps, session data, cookies. (f) Communication Data: Messages sent through our secure messaging portal, support tickets, feedback.' },
                { title: '3. How We Use Your Information', body: 'Your data is used for: (a) Account management and investor onboarding. (b) KYC verification as mandated by SEBI AIF Regulations, 2012. (c) Processing investments, dividends, and redemptions. (d) Generating portfolio reports, NAV statements, and tax certificates. (e) Regulatory compliance and reporting to SEBI, RBI, and tax authorities. (f) Risk assessment and fraud prevention. (g) Communicating investment opportunities, fund updates, and account notifications. (h) Improving our dashboard, services, and investor experience.' },
                { title: '4. Data Storage & Security', body: 'All personal and financial data is stored on encrypted servers within India. We employ: (a) 256-bit SSL/TLS encryption for all data in transit. (b) AES-256 encryption for data at rest. (c) Multi-factor authentication for all investor accounts. (d) Role-based access controls limiting data access to authorized personnel only. (e) Regular security audits and penetration testing by certified third-party firms. (f) Firewall protection, intrusion detection systems, and real-time monitoring. (g) Automatic session timeout and secure token management.' },
                { title: '5. Data Sharing & Disclosure', body: 'We do not sell, trade, or rent your personal data. We may share your information with: (a) SEBI and other regulatory authorities as required by law. (b) Third-party custodians (as mandated for Category II AIFs) for fund administration. (c) Chartered accountants and auditors for statutory audits. (d) Tax authorities (Income Tax Department) for TDS compliance. (e) Banking partners for processing transactions. (f) Legal authorities pursuant to valid legal orders or subpoenas. All third parties are bound by strict confidentiality agreements and data processing terms.' },
                { title: '6. Data Retention', body: 'We retain your personal data for the duration of your investment with GHL India Ventures plus a minimum of 8 years after exit, as required under: (a) SEBI AIF Regulations, 2012 (fund documentation retention). (b) Income Tax Act, 1961 (financial records retention). (c) Prevention of Money Laundering Act, 2002 (KYC records retention). (d) Companies Act, 2013 (corporate record keeping). After the retention period, data is securely destroyed using industry-standard data destruction methods.' },
                { title: '7. Your Rights', body: 'Under applicable Indian data protection laws, you have the right to: (a) Access your personal data held by us. (b) Request correction of inaccurate or incomplete data. (c) Request deletion of your data (subject to regulatory retention requirements). (d) Withdraw consent for marketing communications. (e) Receive your data in a portable format. (f) Lodge a complaint with the Data Protection Board of India. To exercise these rights, contact our Data Protection Officer at privacy@ghlindiaventures.com.' },
                { title: '8. Cookies & Tracking', body: 'Our dashboard uses essential cookies for: (a) Session management and authentication. (b) Theme preferences (dark/light mode). (c) Language settings. (d) Security tokens and CSRF protection. We do not use advertising cookies or third-party tracking pixels. Analytics data is anonymized and used solely for improving our platform.' },
                { title: '9. Third-Party Links', body: 'Our dashboard may contain links to third-party websites (e.g., SEBI, NSE, BSE). We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies independently.' },
                { title: '10. Children\'s Privacy', body: 'Our services are designed for adults above the age of 18. We do not knowingly collect personal data from minors. If we become aware that we have collected data from a minor, we will delete it promptly.' },
                { title: '11. International Data Transfers', body: 'We primarily store and process all data within India. In the event data needs to be transferred internationally (for NRI investors or global service providers), we ensure adequate safeguards including Standard Contractual Clauses and compliance with the Digital Personal Data Protection Act, 2023.' },
                { title: '12. Changes to This Policy', body: 'We may update this Privacy Policy periodically. Changes will be posted on this dashboard with an updated "Last Updated" date. Continued use of our services after changes constitutes acceptance of the revised policy.' },
                { title: '13. Contact Information', body: 'Data Protection Officer: privacy@ghlindiaventures.com. Registered Office: 2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai 600008, Tamil Nadu, India. Phone: +91 44 2843 1043 | +91 7200 255 252. SEBI Registration: IN/AIF2/2425/1517. For grievances related to data handling, you may also contact SEBI through the SCORES portal at scores.gov.in.' },
              ].map((s,i) => (
                <div key={i} className="mb-4">
                  <h5 className={`text-xs font-bold mb-1 ${t('text-white','text-gray-900')}`}>{s.title}</h5>
                  <p className={`text-[11px] leading-relaxed ${t('text-gray-400','text-gray-600')}`}>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`px-6 py-4 flex items-center justify-between border-t shrink-0 ${t('border-white/[0.06]','border-gray-200/45')}`}>
            <p className={`text-[10px] ${t('text-gray-600','text-gray-400')}`}>
              {privacyScrolled ? <span className="text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Policy reviewed</span> : 'Scroll to read the full policy'}
            </p>
            <button onClick={() => setPrivacyOpen(false)} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${t('text-gray-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.1]','text-gray-600 hover:text-gray-900 bg-gray-200/50 hover:bg-gray-300/50')}`}>
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // TAB ROUTER
  // ═══════════════════════════════════════════════════════════
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboardHome()
      case 'investments': return renderInvestmentsTab()
      case 'invest-onboard': return renderInvestOnboard()
      case 'portfolio': return renderPortfolioTab()
      case 'kyc': return renderKYCTab()
      case 'transactions': return renderTransactionsTab()
      case 'messages': return renderMessagesTab()
      case 'support': return renderSupportTab()
      case 'calculators': return renderCalculatorsTab()
      case 'referrals': return renderReferralsTab()
      case 'profile': return renderProfileTab()
      case 'settings': return renderSettingsTab()
      default: return renderDashboardHome()
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className={`min-h-screen relative transition-colors duration-500 ${isDark ? 'bg-brand-black' : 'bg-[#D5D1CC]'}`}>
      {/* Background ambient effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {isDark && (
          <>
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-red/[0.03] rounded-full blur-[200px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-red/[0.02] rounded-full blur-[180px]" />
            <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </>
        )}
      </div>

      {renderSidebar()}
      {renderTourOverlay()}
      {renderTermsPopup()}
      {renderPrivacyPopup()}

      <div className="lg:ml-[260px] relative z-10 min-h-screen flex flex-col">
        {renderTopBar()}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">{renderContent()}</div>
        <footer className={`border-t px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]
          ${t('border-white/[0.04] text-gray-600','border-gray-200/40 text-gray-500')}`}>
          <p>&copy; 2025 GHL India Ventures. SEBI Reg: IN/AIF2/2425/1517</p>
          <div className="flex items-center gap-3">
            <button onClick={() => { setTermsOpen(true); setTermsScrolled(false) }} className={`hover:underline ${t('hover:text-white','hover:text-gray-700')} transition-colors`}>Terms & Conditions</button>
            <span>&bull;</span>
            <p className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> 256-bit SSL Encrypted &bull; SEBI Compliant</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
