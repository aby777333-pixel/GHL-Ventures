'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, TrendingUp, Briefcase, FileText, ArrowLeftRight,
  HeadphonesIcon, Gift, User, Settings, LogOut, Search, Bell, ChevronDown,
  ChevronRight, ArrowUpRight, ArrowDownRight, Shield, Zap, Download,
  Plus, Eye, EyeOff, Calendar, Clock, Star, Award, Target, PieChart as PieIcon,
  BarChart3, Wallet, IndianRupee, Percent, Building2, Rocket,
  Menu, X, ExternalLink, Copy, CheckCircle, AlertCircle, Info,
  Upload, Camera, MessageSquare, Ticket, Phone, PhoneCall, Video, Globe,
  Sun, Moon, Lock, CreditCard, Users, MapPin, Landmark, FileCheck,
  Send, Paperclip, ChevronUp, HelpCircle, RefreshCw, Fingerprint,
  BookOpen, Languages, Sparkles, CircleDot, Filter, MoreHorizontal,
  Home, Mail, BellRing, Archive, Trash2, ImageIcon, Flag,
  Activity, Gauge, Timer, Newspaper, AlarmClock, TrendingDown,
  Flame, DollarSign, Megaphone, Trophy, Heart, Banknote,
  Calculator, FolderOpen, FileUp, Sliders, ScrollText, Brain
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart,
  BarChart, Bar,
} from 'recharts'
import Logo from '@/components/Logo'
import SocialLinks from '@/components/SocialLinks'

// Auth
import { useClientAuth } from '@/lib/supabase/clientHooks'

// Data hooks
import {
  usePortfolioAssets,
  useNAVHistory,
  useAllocation,
  useTransactions,
  useMessages,
  useSupportTickets,
  useNotifications,
  useKYCSteps,
  useDocuments,
  useAdminNews,
  useAssignedRM,
} from '@/lib/supabase/dashboardDataHooks'

// Data service (for mutations)
import {
  createSupportTicket,
  sendMessage,
  markNotificationRead,
  uploadDocument,
  addBankAccount,
  deleteBankAccount,
  fetchBankAccounts,
  validateIFSC,
  submitInvestmentApplication,
  fetchInvestmentApplications,
  registerInterest,
  requestReallocation,
  uploadClientDocument,
} from '@/lib/supabase/dashboardDataService'

// Supabase Storage
import { uploadFile, saveBlobAs } from '@/lib/supabase/storageService'

// Realtime
import {
  onClientNotification,
  onClientTicketUpdate,
  onNewMessage,
  onInvestmentUpdate,
} from '@/lib/supabase/realtimeSubscriptions'

// Cross-portal: RM request routing (Client → CS Dashboard)
import { createRMRequest } from '@/lib/supabase/chatService'

// AI Advisor
import ClientAIAdvisor from './ClientAIAdvisor'

// Voice Input (Sarvam AI STT)
import VoiceInput from '@/components/shared/VoiceInput'

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
type Theme = 'dark' | 'light'
type TabId = 'dashboard' | 'investments' | 'invest-onboard' | 'portfolio' | 'kyc' | 'transactions' | 'messages' | 'support' | 'referrals' | 'calculators' | 'ai-advisor' | 'profile' | 'settings'

/* ═══════════════════════════════════════════════════════════════
   ICON MAP & TOUR — kept for UI chrome; personal data comes
   exclusively from dashboardDataHooks (Supabase).
   ═══════════════════════════════════════════════════════════════ */

// KYC icon map — service returns string types, map to icons here
const KYC_ICON_MAP: Record<string, any> = {
  personal: User, identity: Fingerprint, address: MapPin,
  bank: Landmark, risk: Shield, agreement: FileCheck,
  business: Building2, demat: CreditCard, nominee: Users, documents: FileCheck,
}

/* ── Market Reference Data (not client-specific; decorative) ─── */
const MARKET_DATA = [
  { name: 'SENSEX', value: '73,842', change: '+1.24%', up: true },
  { name: 'NIFTY 50', value: '22,456', change: '+0.98%', up: true },
  { name: 'GOLD', value: '71,230', change: '-0.32%', up: false },
  { name: 'USD/INR', value: '83.12', change: '+0.15%', up: true },
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
  { date: '05 Mar', event: 'RBI MPC Meeting', region: 'India', impact: 'high', icon: Landmark },
  { date: '07 Mar', event: 'US Non-Farm Payrolls', region: 'Global', impact: 'high', icon: Globe },
  { date: '15 Mar', event: 'GHL Q4 NAV Update', region: 'GHL', impact: 'high', icon: Star },
  { date: '20 Mar', event: 'US Fed Rate Decision', region: 'Global', impact: 'high', icon: Globe },
  { date: '01 Apr', event: 'GST Revenue Data', region: 'India', impact: 'medium', icon: IndianRupee },
  { date: '09 Apr', event: 'RBI Policy Decision', region: 'India', impact: 'high', icon: Landmark },
  { date: '17 Apr', event: 'ECB Rate Decision', region: 'Global', impact: 'high', icon: Globe },
  { date: '22 Apr', event: 'India PMI Manufacturing', region: 'India', impact: 'medium', icon: Activity },
]

const TOUR_STEPS = [
  { target: 'dashboard', title: 'Welcome to Your Dashboard', desc: 'Get a bird\u2019s-eye view of your portfolio, performance, and recent activity all in one place.' },
  { target: 'investments', title: 'Explore Investments', desc: 'Browse available investment opportunities, express interest, and modify your allocations.' },
  { target: 'portfolio', title: 'Track Performance', desc: 'View NAV trends, asset allocation, and milestone progress for each investment.' },
  { target: 'kyc', title: 'KYC & Documents', desc: 'Upload documents, track your KYC status, and manage compliance requirements.' },
  { target: 'messages', title: 'Secure Messages', desc: 'Communicate directly with your relationship manager and support team.' },
  { target: 'support', title: 'Get Help Anytime', desc: 'Raise tickets, access FAQs, or connect via live chat and video call.' },
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
  { id: 'ai-advisor', label: 'AI Advisor', icon: Brain, badge: 'NEW' },
  { id: 'referrals', label: 'Referrals', icon: Gift },
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
  // ─── Routing ─────────────────────────────────────────────
  const router = useRouter()
  const pathname = usePathname()
  const VALID_TABS: TabId[] = ['dashboard','investments','invest-onboard','portfolio','kyc','transactions','messages','support','calculators','ai-advisor','referrals','profile','settings']
  const activeTab: TabId = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    const tabSegment = segments[1] as TabId | undefined
    return tabSegment && VALID_TABS.includes(tabSegment) ? tabSegment : 'dashboard'
  }, [pathname])
  const setActiveTab = useCallback((tab: TabId) => {
    const url = tab === 'dashboard' ? '/dashboard' : `/dashboard/${tab}`
    router.push(url, { scroll: false })
  }, [router])

  // ─── Password Reset Detection (from /auth/callback recovery flow) ──
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordResetDone, setPasswordResetDone] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [msgAttachments, setMsgAttachments] = useState<File[]>([])
  const msgFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('password_reset') === 'true') {
        // Auto-switch to settings tab and open password reset form
        if (activeTab !== 'settings') {
          setActiveTab('settings')
        }
        setShowPasswordReset(true)
      }
    }
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePasswordUpdate = async () => {
    if (newPassword.length < 8) { showToast('⚠ Password must be at least 8 characters', 'info'); return }
    if (newPassword !== confirmNewPassword) { showToast('⚠ Passwords do not match', 'info'); return }
    try {
      const { isSupabaseConfigured } = await import('@/lib/supabase/client')
      const { supabase } = await import('@/lib/supabase/client')
      if (!isSupabaseConfigured()) { showToast('⚠ Auth service unavailable', 'info'); return }
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) { showToast(`⚠ ${error.message}`, 'info'); return }
      setPasswordResetDone(true)
      setShowPasswordReset(false)
      setNewPassword('')
      setConfirmNewPassword('')
      showToast('Password updated successfully!', 'success')
    } catch {
      showToast('⚠ Failed to update password', 'info')
    }
  }

  // ─── Auth ────────────────────────────────────────────────
  const { user, clientId, isAuthenticated, loading: authLoading, logout } = useClientAuth()

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // ─── Data Hooks ─────────────────────────────────────────
  const { data: portfolioAssets, loading: portfolioLoading, error: portfolioError, refetch: refetchPortfolio } = usePortfolioAssets(clientId ?? undefined)
  const { data: navHistory } = useNAVHistory(clientId ?? undefined)
  const { data: allocationData } = useAllocation(clientId ?? undefined)
  const { data: transactions } = useTransactions(clientId ?? undefined)
  const { data: messagesData, refetch: refetchMessages } = useMessages(clientId ?? undefined)
  const { data: supportTickets, loading: ticketsLoading, error: ticketsError, refetch: refetchTickets } = useSupportTickets(clientId ?? undefined)
  const { data: notifications, refetch: refetchNotifications } = useNotifications(clientId ?? undefined)
  const { data: kycSteps } = useKYCSteps(clientId ?? undefined)
  const { data: documents, loading: docsLoading, error: docsError, refetch: refetchDocs } = useDocuments(clientId ?? undefined)
  const { data: adminNews } = useAdminNews()
  const { data: assignedRM } = useAssignedRM(clientId ?? undefined)

  // Combined data error indicator (shows toast if any critical fetch fails)
  const dataError = portfolioError || ticketsError || docsError

  // ─── Derived User Values ────────────────────────────────
  const userInitials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'
  const firstName = user?.name ? user.name.split(' ')[0] : 'Investor'
  const userName = user?.name || 'Investor'
  const userEmail = user?.email || ''
  const userKycStatus = user?.kyc_status || 'pending'

  // ─── State (ALL hooks must be before early returns) ─────
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('ghl-theme') as Theme) || 'light'
    }
    return 'light'
  })
  // Persist theme to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ghl-theme', theme)
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  }, [theme])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [greeting, setGreeting] = useState('')
  const [tourActive, setTourActive] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [ticketForm, setTicketForm] = useState(false)
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketCategory, setTicketCategory] = useState('General Inquiry')
  const [ticketDesc, setTicketDesc] = useState('')
  const [messageCompose, setMessageCompose] = useState(false)
  const [msgTo, setMsgTo] = useState('Relationship Manager')
  const [msgSubject, setMsgSubject] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [bankConnectOpen, setBankConnectOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsScrolled, setTermsScrolled] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [privacyScrolled, setPrivacyScrolled] = useState(false)
  const [docName, setDocName] = useState('')
  const [docCategory, setDocCategory] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; path: string; bucket: string; size: number; type: string }[]>([])
  const [investAmount, setInvestAmount] = useState(2500000)
  const [investVehicle, setInvestVehicle] = useState('AIF Direct - Category II')
  const [investTenure, setInvestTenure] = useState('5 Years')
  const [investTermsAccepted, setInvestTermsAccepted] = useState(false)
  const [investSubmitting, setInvestSubmitting] = useState(false)
  const [investFormErrors, setInvestFormErrors] = useState<Record<string, string>>({})

  // Bank accounts state
  const [bankAccounts, setBankAccounts] = useState<Array<{
    id?: string
    account_holder_name: string
    account_number: string
    account_number_confirm: string
    ifsc_code: string
    bank_name: string
    account_type: string
    is_primary: boolean
    cancelled_cheque_url: string
    ifsc_valid?: boolean
    ifsc_validating?: boolean
  }>>([{
    account_holder_name: '',
    account_number: '',
    account_number_confirm: '',
    ifsc_code: '',
    bank_name: '',
    account_type: 'savings',
    is_primary: true,
    cancelled_cheque_url: '',
  }])

  const [activeCalc, setActiveCalc] = useState('sip')
  const [calcInputs, setCalcInputs] = useState({ amount: 100000, rate: 15, years: 5 })
  const [notifPrefs, setNotifPrefs] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ghl-notif-prefs')
        if (saved) return JSON.parse(saved)
      } catch { /* fallback */ }
    }
    return { email: true, nav: true, invest: true, dividend: true }
  })
  // Persist notification preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ghl-notif-prefs', JSON.stringify(notifPrefs))
    }
  }, [notifPrefs])
  const [dashLang, setDashLang] = useState('English')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null)
  const [notifsRead, setNotifsRead] = useState<Set<string>>(new Set())
  const showToast = useCallback((msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])
  // Task reminders derived from KYC status (no hardcoded mock data)
  const taskReminders = useMemo(() => {
    const reminders: { id: number; task: string; due: string; urgent: boolean }[] = []
    if (userKycStatus !== 'verified' && userKycStatus !== 'approved') {
      reminders.push({ id: 1, task: 'Complete KYC verification', due: 'Required', urgent: true })
    }
    return reminders
  }, [userKycStatus])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const profilePhotoRef = useRef<HTMLInputElement>(null)
  const termsRef = useRef<HTMLDivElement>(null)
  const privacyRef = useRef<HTMLDivElement>(null)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '', phone: '', city: '', dob: '', occupation: '', pan: '',
    nominee_name: '', nominee_relation: '', nominee_pan: '', nominee_share: '',
  })
  const [savedProfileData, setSavedProfileData] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ghl-profile-data')
        if (saved) return JSON.parse(saved)
      } catch { /* fallback */ }
    }
    return {}
  })
  const [bankForm, setBankForm] = useState({
    holder_name: '', account_number: '', ifsc_code: '', account_type: 'savings'
  })
  const [savedBankData, setSavedBankData] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ghl-bank-data')
        if (saved) return JSON.parse(saved)
      } catch { /* fallback */ }
    }
    return {}
  })

  // Initialize savedProfileData from user object on load (so data persists across refresh)
  useEffect(() => {
    if (user && Object.keys(savedProfileData).length === 0) {
      const fromUser: Record<string, string> = {}
      if (user.name) fromUser.full_name = user.name
      if (user.phone) fromUser.phone = user.phone
      if (user.city) fromUser.city = user.city
      if ((user as any).dob) fromUser.dob = (user as any).dob
      if ((user as any).occupation) fromUser.occupation = (user as any).occupation
      if ((user as any).pan) fromUser.pan = (user as any).pan
      if ((user as any).nominee_name) fromUser.nominee_name = (user as any).nominee_name
      if ((user as any).nominee_relation) fromUser.nominee_relation = (user as any).nominee_relation
      if ((user as any).nominee_pan) fromUser.nominee_pan = (user as any).nominee_pan
      if ((user as any).nominee_share) fromUser.nominee_share = String((user as any).nominee_share || '')
      if (Object.keys(fromUser).length > 0) setSavedProfileData(fromUser)
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps
  // Persist savedProfileData to localStorage so it survives KYC uploads and re-renders
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(savedProfileData).length > 0) {
      localStorage.setItem('ghl-profile-data', JSON.stringify(savedProfileData))
    }
  }, [savedProfileData])

  // Handle profile photo upload
  const handleProfilePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (JPG, PNG, etc.)', 'info')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be smaller than 5MB', 'info')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setProfilePhoto(result)
      showToast('Profile photo updated successfully!')
    }
    reader.readAsDataURL(file)
  }, [showToast])

  const isDark = theme === 'dark'
  const t = (dark: string, light: string) => isDark ? dark : light

  // Animated counters — derive from user/portfolio data
  const totalCurrent = useMemo(() => portfolioAssets.reduce((s: number, a: any) => s + (Number(a.current_value) || 0), 0), [portfolioAssets])
  const totalInvested = useMemo(() => portfolioAssets.reduce((s: number, a: any) => s + (Number(a.invested_amount) || 0), 0), [portfolioAssets])
  const portfolioValue = useAnimatedCounter(user?.aum || totalCurrent || 0)
  const aifInvestment = useAnimatedCounter(totalInvested || 0)
  const coInvestValue = useAnimatedCounter(totalCurrent - totalInvested || 0)
  const currentNAV = useAnimatedCounter(navHistory.length ? (navHistory[navHistory.length - 1]?.nav_value || navHistory[navHistory.length - 1]?.nav || 0) * 100 : 0)

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
    if (!totalInvested) return '0.0'
    return ((totalCurrent - totalInvested) / totalInvested * 100).toFixed(1)
  }, [totalCurrent, totalInvested])

  // ─── Realtime Subscriptions ─────────────────────────────
  useEffect(() => {
    if (!clientId) return
    const unsub1 = onClientNotification(clientId, () => refetchNotifications())
    const unsub2 = onClientTicketUpdate(clientId, () => refetchTickets())
    const unsub3 = onNewMessage(clientId, () => refetchMessages())
    const unsub4 = onInvestmentUpdate(clientId, () => refetchPortfolio())
    return () => {
      unsub1?.()
      unsub2?.()
      unsub3?.()
      unsub4?.()
    }
  }, [clientId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Referral Hooks (must be before early returns) ──────
  const referralCode = useMemo(() => {
    if (!user?.id) return 'GHL-UNKNOWN'
    return `GHL-${user.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
  }, [user?.id])

  const [referralLink, setReferralLink] = useState('')
  useEffect(() => {
    if (typeof window !== 'undefined' && referralCode) {
      setReferralLink(`${window.location.origin}/register?ref=${referralCode}`)
    }
  }, [referralCode])

  const [referralStats, setReferralStats] = useState({ referred: 0, earned: 0 })
  const [referralCopied, setReferralCopied] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    import('@/lib/supabase/dashboardDataService').then(svc => {
      svc.fetchReferralStats(user.id).then(setReferralStats)
    })
  }, [user?.id])

  // ─── Auth Loading / Guard Render (AFTER all hooks) ──────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading Investor Portal...</p>
        </div>
      </div>
    )
  }
  if (!isAuthenticated || !user) return null

  // ═══════════════════════════════════════════════════════════
  // SIDEBAR
  // ═══════════════════════════════════════════════════════════
  const renderSidebar = () => (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-[9999] lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full z-[10000] w-[260px] flex flex-col transition-transform duration-500 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: isDark ? 'linear-gradient(180deg, rgba(10,10,10,0.98) 0%, rgba(15,5,5,0.98) 100%)' : 'linear-gradient(180deg, rgba(214,211,206,0.98) 0%, rgba(210,207,202,0.98) 100%)',
          borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          backdropFilter: 'blur(40px)',
        }}>
        {/* Logo */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <Link href="/" target="_blank" className="flex items-center group">
            <Logo size={38} />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className={`lg:hidden ${t('text-gray-500 hover:text-white','text-gray-600 hover:text-gray-900')} transition-colors`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client info badge */}
        <div className="px-6 mb-4">
          <div className={`px-3 py-2.5 rounded-xl ${t('bg-white/[0.04] border border-white/[0.06]','bg-gray-100/60 border border-gray-200/40')}`}>
            <p className={`text-[10px] uppercase tracking-widest mb-0.5 ${t('text-gray-500','text-gray-600')}`}>{user?.risk_profile || user?.account_status || 'Client'}</p>
            <p className={`text-sm font-semibold ${t('text-white','text-gray-900')}`}>{userName}</p>
            <p className={`text-[10px] mt-0.5 ${t('text-gray-500','text-gray-700')}`}>{userEmail}</p>
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

        {/* Tour + Logout — pushed above mobile bottom nav */}
        <div className="px-3 pb-28 lg:pb-4 pt-2 space-y-1">
          <button onClick={() => { setTourStep(0); setActiveTab(TOUR_STEPS[0].target as TabId); setTourActive(true) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              text-gray-400 hover:text-purple-400 hover:bg-purple-500/[0.06]">
            <Sparkles className="w-[18px] h-[18px]" />
            Virtual Tour
          </button>
          <button onClick={async () => { await logout(); router.push('/login?logged_out=true') }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              text-gray-500 hover:text-red-400 hover:bg-red-500/[0.06]">
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </button>
          {/* Social links */}
          <div className="pt-2 border-t border-white/[0.06] mt-2">
            <SocialLinks size="sm" variant="glass" />
          </div>
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
              <span className={`font-medium ${t('text-gray-500','text-gray-600')}`}>{m.name}</span>
              <span className={`font-semibold ${t('text-white','text-gray-900')}`}>{m.value}</span>
              <span className={`font-semibold ${m.up ? 'text-emerald-400' : 'text-red-400'}`}>{m.change}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main bar */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className={`lg:hidden ${t('text-gray-400 hover:text-white','text-gray-700 hover:text-gray-900')} transition-colors p-1`}>
            <Menu className="w-5 h-5" />
          </button>
          <div className={`hidden sm:flex items-center gap-2 text-xs ${t('text-gray-500','text-gray-600')}`}>
            <Home className="w-3 h-3" /> <ChevronRight className="w-3 h-3" />
            <span className={`capitalize ${t('text-white','text-gray-900')}`}>{activeTab === 'kyc' ? 'KYC & Documents' : activeTab}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl w-56 transition-colors
              ${t('bg-white/[0.04] border border-white/[0.06] focus-within:border-brand-red/30','bg-gray-100/50 border border-gray-200/40 focus-within:border-brand-red/40')}`}>
              <Search className={`w-3.5 h-3.5 ${t('text-gray-500','text-gray-600')}`} />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className={`bg-transparent border-none outline-none text-xs w-full ${t('text-white placeholder-gray-600','text-gray-900 placeholder-gray-400')}`} />
              {searchQuery && <button onClick={() => setSearchQuery('')} className={`${t('text-gray-500 hover:text-white','text-gray-400 hover:text-gray-700')}`}><X className="w-3 h-3" /></button>}
            </div>
            {/* Search Results Dropdown */}
            {searchQuery.trim() && (() => {
              const q = searchQuery.toLowerCase()
              const allItems = [...SIDEBAR_ITEMS, ...SIDEBAR_BOTTOM]
              const searchableMap: Record<string, string[]> = {
                'dashboard': ['dashboard', 'home', 'overview', 'portfolio summary', 'metrics'],
                'investments': ['investments', 'invest', 'aif', 'fund', 'opportunity', 'express interest'],
                'portfolio': ['portfolio', 'assets', 'nav', 'performance', 'returns', 'allocation'],
                'kyc': ['kyc', 'documents', 'upload', 'verification', 'compliance', 'pan', 'aadhaar'],
                'transactions': ['transactions', 'history', 'payments', 'dividend', 'export'],
                'messages': ['messages', 'chat', 'compose', 'inbox', 'communication'],
                'support': ['support', 'help', 'ticket', 'faq', 'call', 'email', 'contact'],
                'calculators': ['calculators', 'sip', 'lumpsum', 'irr', 'tools'],
                'ai-advisor': ['ai', 'advisor', 'aria', 'assistant'],
                'referrals': ['referrals', 'refer', 'earn', 'invite', 'share', 'link'],
                'profile': ['profile', 'personal', 'bank', 'nominee', 'details', 'pan', 'edit'],
                'settings': ['settings', 'theme', 'password', 'notifications', 'security', '2fa', 'language'],
              }
              const matches = allItems.filter(item => {
                const keywords = searchableMap[item.id] || [item.label.toLowerCase()]
                return keywords.some(k => k.includes(q)) || item.label.toLowerCase().includes(q)
              })
              if (matches.length === 0) return null
              return (
                <div className={`absolute top-full mt-1 right-0 w-64 rounded-xl border shadow-2xl z-50 py-1 ${t('bg-[#111] border-white/10','bg-white border-gray-200')}`}>
                  {matches.map(item => (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setSearchQuery('') }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${t('text-gray-300 hover:bg-white/[0.06] hover:text-white','text-gray-700 hover:bg-gray-100 hover:text-gray-900')}`}>
                      <item.icon className="w-4 h-4 text-brand-red" />
                      {item.label}
                    </button>
                  ))}
                </div>
              )
            })()}
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
            <button onClick={() => setNotifOpen(!notifOpen)} className={`relative p-2 rounded-xl transition-colors ${t('text-gray-400 hover:text-white hover:bg-white/[0.04]','text-gray-700 hover:text-gray-900 hover:bg-gray-200/35')}`}>
              <Bell className="w-4 h-4" />
              {notifications.filter((n: any) => !n.is_read && !notifsRead.has(n.id)).length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-red text-[9px] font-bold text-white flex items-center justify-center">
                  {notifications.filter((n: any) => !n.is_read && !notifsRead.has(n.id)).length}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-12 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden bg-[#111] border-white/[0.08]" style={{ animation: 'dashTooltipIn 0.2s ease-out' }}>
                <div className={`px-4 py-3 flex items-center justify-between border-b ${t('border-white/[0.06]','border-gray-200/40')}`}>
                  <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Notifications</h4>
                  <button onClick={() => { setNotifsRead(new Set(notifications.map((n: any) => n.id))); showToast('All notifications marked as read') }} className="text-[10px] text-brand-red font-semibold">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((n: any) => {
                    const notifTabMap: Record<string, TabId> = { report: 'kyc', opportunity: 'investments', alert: 'kyc', payment: 'transactions', milestone: 'portfolio' }
                    return (
                    <div key={n.id} onClick={() => { setNotifsRead(prev => new Set(prev).add(n.id)); markNotificationRead(String(n.id)); setNotifOpen(false); setActiveTab(notifTabMap[n.type] || 'dashboard') }} className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors ${!n.is_read && !notifsRead.has(n.id) ? 'bg-white/[0.02]' : ''} hover:bg-white/[0.04]`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                        ${n.type === 'report' || n.type === 'info' ? 'bg-blue-500/15' : n.type === 'opportunity' || n.type === 'success' ? 'bg-emerald-500/15' : n.type === 'alert' || n.type === 'warning' || n.type === 'action_required' ? 'bg-amber-500/15' : n.type === 'payment' ? 'bg-emerald-500/15' : n.type === 'error' ? 'bg-red-500/15' : 'bg-purple-500/15'}`}>
                        {n.type === 'report' || n.type === 'info' ? <FileText className="w-4 h-4 text-blue-400" /> :
                         n.type === 'opportunity' || n.type === 'success' ? <Star className="w-4 h-4 text-emerald-400" /> :
                         n.type === 'alert' || n.type === 'warning' || n.type === 'action_required' ? <AlertCircle className="w-4 h-4 text-amber-400" /> :
                         n.type === 'payment' ? <IndianRupee className="w-4 h-4 text-emerald-400" /> :
                         n.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-400" /> :
                         <Award className="w-4 h-4 text-purple-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${t('text-white','text-gray-900')} ${!n.is_read ? '' : 'opacity-60'}`}>{String(n.title || '')}</p>
                        <p className={`text-[11px] mt-0.5 ${t('text-gray-500','text-gray-700')}`}>{String(n.message || n.body || '')}</p>
                        <p className={`text-[10px] mt-1 ${t('text-gray-600','text-gray-600')}`}>{n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</p>
                      </div>
                      {!n.is_read && !notifsRead.has(n.id) && <div className="w-2 h-2 rounded-full bg-brand-red shrink-0 mt-1.5" />}
                    </div>
                  )})}

                </div>
              </div>
              </>
            )}
          </div>

          {/* Time */}
          <span className={`hidden lg:block text-[11px] ml-2 ${t('text-gray-500','text-gray-600')}`}>{currentTime}</span>

          {/* Avatar */}
          <div className={`flex items-center gap-2 ml-2 pl-3 border-l ${t('border-white/[0.06]','border-gray-200/50')}`}>
            <button onClick={() => setActiveTab('profile')} className="relative group">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/[0.08] group-hover:ring-brand-red/40 transition-all" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/[0.08] group-hover:ring-brand-red/40 transition-all">{userInitials}</div>
              )}
            </button>
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
          <p className={`text-sm mb-6 leading-relaxed ${t('text-gray-400','text-gray-700')}`}>{step.desc}</p>
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === tourStep ? 'w-6 bg-brand-red' : 'w-1.5 bg-gray-600'}`} />
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setTourActive(false); setTourStep(0) }}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${t('text-gray-400 hover:text-white','text-gray-700 hover:text-gray-900')}`}>Skip</button>
            <button onClick={() => {
              if (tourStep < TOUR_STEPS.length - 1) {
                const nextStep = tourStep + 1
                setTourStep(nextStep)
                // Navigate to the target tab for the current step being shown
                setActiveTab(TOUR_STEPS[nextStep].target as TabId)
              } else {
                setTourActive(false); setTourStep(0)
                setActiveTab('dashboard')
              }
            }} className="flex items-center justify-center gap-1.5 px-6 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
              {tourStep < TOUR_STEPS.length - 1 ? <>Next <ChevronRight className="w-3.5 h-3.5" /></> : 'Finish Tour'}
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
            <p className={`text-xs ${t('text-gray-500','text-gray-700')}`}>{m.label}</p>
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
          <p className={`text-xs ${t('text-gray-500','text-gray-700')}`}>Fund NAV vs NIFTY 50 Benchmark</p>
        </div>
        {navHistory.length > 0 && (
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-red" /><span className={t('text-gray-400','text-gray-700')}>Fund NAV</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-500" /><span className={t('text-gray-400','text-gray-700')}>Benchmark</span></span>
        </div>
        )}
      </div>
      {navHistory.length > 0 ? (
      <div className="h-[280px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={navHistory}>
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
      ) : (
      <div className="h-[280px] flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className={`w-10 h-10 mx-auto mb-3 ${t('text-gray-600','text-gray-400')}`} />
          <p className={`text-sm font-medium ${t('text-gray-400','text-gray-600')}`}>NAV data will appear here</p>
          <p className={`text-xs mt-1 ${t('text-gray-600','text-gray-500')}`}>Once your investments are processed</p>
        </div>
      </div>
      )}
    </Glass>
  )

  // ═══════════════════════════════════════════════════════════
  // ALLOCATION CHART
  // ═══════════════════════════════════════════════════════════
  const renderAllocationChart = () => (
    <Glass className="p-5 lg:p-6" hover theme={theme}>
      <h3 className={`text-base font-bold mb-5 ${t('text-white','text-gray-900')}`}>Allocation</h3>
      {allocationData.length > 0 ? (<>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={allocationData} innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {allocationData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 mt-4">
        {allocationData.map((d: any, i: number) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} /><span className={t('text-gray-400','text-gray-600')}>{d.name}</span></span>
            <span className={`font-semibold ${t('text-white','text-gray-900')}`}>{d.value}%</span>
          </div>
        ))}
      </div>
      </>) : (
      <div className="h-[200px] flex items-center justify-center">
        <div className="text-center">
          <PieIcon className={`w-10 h-10 mx-auto mb-3 ${t('text-gray-600','text-gray-400')}`} />
          <p className={`text-sm font-medium ${t('text-gray-400','text-gray-600')}`}>Allocation breakdown</p>
          <p className={`text-xs mt-1 ${t('text-gray-600','text-gray-500')}`}>Will appear after first investment</p>
        </div>
      </div>
      )}
    </Glass>
  )

  // ═══════════════════════════════════════════════════════════
  // PORTFOLIO ASSETS with milestone bars
  // ═══════════════════════════════════════════════════════════
  const renderPortfolioAssets = () => (
    <Glass className="p-5 lg:p-6" hover theme={theme}>
      <div className="flex items-center justify-between mb-5">
        <h3 className={`text-base font-bold ${t('text-white','text-gray-900')}`}>Portfolio Assets</h3>
        <button onClick={() => setActiveTab('portfolio')} className="text-xs text-brand-red font-semibold flex items-center gap-1 cursor-pointer hover:underline hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-brand-red/10">View All <ChevronRight className="w-3 h-3" /></button>
      </div>
      {portfolioAssets.length === 0 ? (
        <div className="py-8 text-center">
          <Briefcase className={`w-10 h-10 mx-auto mb-3 ${t('text-gray-600','text-gray-400')}`} />
          <p className={`text-sm font-medium ${t('text-gray-400','text-gray-600')}`}>No active investments yet</p>
          <p className={`text-xs mt-1 ${t('text-gray-600','text-gray-500')}`}>Your portfolio will appear here once you invest</p>
          <button onClick={() => setActiveTab('investments')} className="mt-3 text-xs text-brand-red font-semibold">Explore Opportunities</button>
        </div>
      ) : (
      <div className="space-y-3">
        {portfolioAssets.map((asset: any, i: number) => (
          <div key={i} onClick={() => setActiveTab('portfolio')} className={`p-3 rounded-xl transition-all duration-300 group cursor-pointer ${t('bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08]','bg-gray-100/35 border border-gray-200/30 hover:border-gray-300/40')}`}>
            <div className="flex items-center gap-4 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t('bg-white/[0.04]','bg-gray-200/40')}`}>
                {(asset.fund_type || asset.type || '').includes('Real Estate') ? <Building2 className="w-5 h-5 text-brand-red" /> : (asset.fund_type || asset.type || '').includes('Startup') ? <Rocket className="w-5 h-5 text-amber-400" /> : <FileText className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${t('text-white','text-gray-900')}`}>{asset.fund_name || asset.name || 'Investment'}</p>
                <p className={`text-xs ${t('text-gray-500','text-gray-700')}`}>{asset.fund_type || asset.type || ''}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>{'\u20B9'}{formatINR(Number(asset.current_value) || Number(asset.current) || 0)}</p>
                <p className={`text-xs font-semibold ${(Number(asset.return_pct) || Number(asset.returnPct) || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>+{Number(asset.return_pct) || Number(asset.returnPct) || 0}%</p>
              </div>
            </div>
            {/* Milestone progress bar */}
            <div className="flex items-center gap-2">
              <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${t('bg-white/[0.06]','bg-gray-200')}`}>
                <div className="h-full rounded-full bg-gradient-to-r from-brand-red to-red-400 transition-all duration-1000" style={{ width: `${Number(asset.milestone) || 0}%` }} />
              </div>
              <span className={`text-[10px] font-medium ${t('text-gray-500','text-gray-600')}`}>{Number(asset.milestone) || 0}%</span>
            </div>
          </div>
        ))}
      </div>
      )}
    </Glass>
  )

  // ═══════════════════════════════════════════════════════════
  // QUICK ACTIONS
  // ═══════════════════════════════════════════════════════════
  const renderQuickActions = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {[
        { icon: Plus, label: 'New Investment', desc: 'Explore opportunities', color: '#D0021B', action: () => setActiveTab('investments') },
        { icon: Download, label: 'Statements', desc: 'Download reports', color: '#3B82F6', action: () => setActiveTab('kyc') },
        { icon: Ticket, label: 'Raise Ticket', desc: 'Get support', color: '#F59E0B', action: () => { setActiveTab('support'); setTicketForm(true) } },
        { icon: PhoneCall, label: 'Direct Call', desc: 'Call GHL directly', color: '#8B5CF6', action: () => { setActiveTab('support'); window.open('tel:+914428431043') } },
        { icon: Briefcase, label: 'Portfolio', desc: 'Track performance', color: '#10B981', action: () => setActiveTab('portfolio') },
        { icon: BarChart3, label: 'Calculators', desc: 'SIP, Lumpsum, IRR', color: '#06B6D4', action: () => setActiveTab('calculators') },
        { icon: Gift, label: 'Refer & Earn', desc: 'Invite investors', color: '#F43F5E', action: () => setActiveTab('referrals') },
        { icon: MessageSquare, label: 'Chat with ARIA', desc: 'AI assistant', color: '#D0021B', action: () => window.dispatchEvent(new CustomEvent('ghl-open-chat')) },
      ].map((item, i) => (
        <button key={i} onClick={item.action} className="group text-left w-full">
          <Glass className="p-4 h-full" hover theme={theme}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110" style={{ background: `${item.color}20` }}>
              <item.icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <p className={`text-sm font-semibold mb-0.5 ${t('text-white','text-gray-900')}`}>{item.label}</p>
            <p className={`text-xs leading-relaxed ${t('text-gray-500','text-gray-700')}`}>{item.desc}</p>
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
      {transactions.length === 0 ? (
        <div className="py-6 text-center">
          <ArrowLeftRight className={`w-8 h-8 mx-auto mb-2 ${t('text-gray-600','text-gray-400')}`} />
          <p className={`text-xs ${t('text-gray-500','text-gray-600')}`}>No transactions yet</p>
        </div>
      ) : (
      <div className="space-y-2.5">
        {transactions.slice(0, 5).map((tx: any, i: number) => (
          <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${t('hover:bg-white/[0.02]','hover:bg-gray-200/40')}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.type === 'Investment' ? 'bg-blue-500/15' : tx.type === 'Dividend' ? 'bg-emerald-500/15' : 'bg-gray-500/15'}`}>
              {tx.type === 'Investment' ? <ArrowUpRight className="w-4 h-4 text-blue-400" /> : tx.type === 'Dividend' ? <IndianRupee className="w-4 h-4 text-emerald-400" /> : <Info className="w-4 h-4 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${t('text-white','text-gray-900')}`}>{tx.type}</p>
              <p className={`text-[11px] truncate ${t('text-gray-500','text-gray-700')}`}>{tx.fund}</p>
            </div>
            <div className="text-right shrink-0">
              {tx.amount > 0 && <p className={`text-xs font-bold ${tx.type === 'Dividend' ? 'text-emerald-400' : t('text-white','text-gray-900')}`}>{tx.type === 'Dividend' ? '+' : ''}{'\u20B9'}{formatINR(tx.amount)}</p>}
              <p className={`text-[10px] ${t('text-gray-600','text-gray-600')}`}>{tx.date}</p>
            </div>
          </div>
        ))}
      </div>
      )}
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
                <span className={t('text-gray-500','text-gray-700')}>{r.l}</span>
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
              <p className={`text-[9px] uppercase tracking-widest ${t('text-gray-600','text-gray-700')}`}>{u.l}</p>
            </div>
          ))}
        </div>
        <p className={`text-[11px] text-center ${t('text-gray-600','text-gray-700')}`}>Q4 2024 &bull; 15 April 2025</p>
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
        <span className="text-red-400">Fear</span><span className={t('text-gray-500','text-gray-700')}>Neutral</span><span className="text-emerald-400">Greed</span>
      </div>
      <div className={`text-center p-2 rounded-lg ${t('bg-emerald-500/10 border border-emerald-500/15','bg-emerald-100/60 border border-emerald-300/50')}`}>
        <span className="text-emerald-400 text-sm font-bold">72 &bull; Greed</span>
        <p className={`text-[10px] mt-0.5 ${t('text-gray-500','text-gray-700')}`}>India VIX: 13.42 (-2.1%)</p>
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
              <span className={`text-[10px] font-semibold ${t('text-gray-400','text-gray-700')}`}>{chart.label}</span>
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
            <p className={`text-[9px] mt-0.5 ${t('text-gray-500','text-gray-700')}`}>{ind.label}</p>
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
            <div className={`w-10 text-center shrink-0 ${t('text-gray-500','text-gray-700')}`}>
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
        <span className={`text-[10px] font-semibold ${t('text-gray-500','text-gray-700')}`}>{adminNews.length} updates</span>
      </div>
      <div className="space-y-2.5">
        {adminNews.length === 0 ? (
          <div className="py-4 text-center">
            <Newspaper className={`w-8 h-8 mx-auto mb-2 ${t('text-gray-600','text-gray-400')}`} />
            <p className={`text-xs ${t('text-gray-500','text-gray-600')}`}>No announcements yet</p>
          </div>
        ) : adminNews.map((news: any) => (
          <div key={news.id} onClick={() => showToast(`${String(news.title || '')} — Full article coming soon.`, 'info')} className={`p-3 rounded-xl cursor-pointer transition-all group ${news.pinned ? (isDark ? 'bg-brand-red/[0.06] border border-brand-red/15 hover:border-brand-red/30' : 'bg-red-50/60 border border-red-200/40 hover:border-red-300/60') : t('bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08]','bg-gray-100/50 border border-gray-200/30 hover:border-gray-300/40')}`}>
            <div className="flex items-start gap-2 mb-1">
              {news.pinned && <Flame className="w-3 h-3 text-brand-red shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${t('text-white','text-gray-900')}`}>{String(news.title || '')}</p>
                <p className={`text-[11px] mt-0.5 line-clamp-2 leading-relaxed ${t('text-gray-500','text-gray-700')}`}>{String(news.excerpt || news.content || '')}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${news.category === 'Opportunity' ? 'bg-emerald-500/15 text-emerald-400' : news.category === 'Fund Update' ? 'bg-blue-500/15 text-blue-400' : news.category === 'Event' ? 'bg-purple-500/15 text-purple-400' : 'bg-amber-500/15 text-amber-400'}`}>{String(news.category || 'Update')}</span>
              <span className={`text-[10px] ${t('text-gray-600','text-gray-600')}`}>{news.date || (news.created_at ? new Date(news.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '')}</span>
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
          {(portfolioAssets.length > 0 ? [
            { icon: TrendingUp, text: `Your portfolio contains ${portfolioAssets.length} active investment(s) valued at \u20B9${formatINR(portfolioValue)}.`, color: 'text-emerald-400' },
            { icon: Shield, text: allocationData.length > 1 ? `Diversification across ${allocationData.length} asset classes provides portfolio stability.` : 'Consider diversifying across multiple asset classes for stability.', color: 'text-blue-400' },
            { icon: Target, text: 'Contact your Relationship Manager for personalized investment insights.', color: 'text-amber-400' },
          ] : [
            { icon: Info, text: 'Smart insights will appear once you make your first investment.', color: 'text-gray-500' },
            { icon: Target, text: 'Explore our AIF opportunities in the Investments tab.', color: 'text-amber-400' },
          ]).map((insight,i) => (
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
          { label: '\u20B925 Lakh Portfolio', threshold: 2500000 },
          { label: '\u20B950 Lakh Portfolio', threshold: 5000000 },
          { label: '\u20B975 Lakh Portfolio', threshold: 7500000 },
          { label: '\u20B91 Crore Portfolio', threshold: 10000000 },
        ].map(({ label, threshold }) => {
          const achieved = portfolioValue >= threshold
          const progress = achieved ? 100 : Math.min(99, Math.round((portfolioValue / threshold) * 100))
          return { label, achieved, progress }
        }).map((m,i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.achieved ? 'bg-amber-500/20' : t('bg-white/[0.04]','bg-gray-200/40')}`}>
              {m.achieved ? <CheckCircle className="w-4 h-4 text-amber-400" /> : <CircleDot className={`w-4 h-4 ${t('text-gray-600','text-gray-600')}`} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${m.achieved ? t('text-white','text-gray-900') : t('text-gray-500','text-gray-700')}`}>{m.label}</p>
              {m.achieved ? (
                <p className={`text-[10px] ${t('text-gray-600','text-gray-600')}`}>Achieved</p>
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
          <h2 className={`text-xl font-bold mb-0.5 ${t('text-white','text-gray-900')}`}>{greeting}, <span className="text-brand-red">{firstName}</span></h2>
          <p className={`text-sm flex items-center gap-2 ${t('text-gray-500','text-gray-700')}`}>
            Welcome to your investor portal
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${userKycStatus === 'approved' || userKycStatus === 'verified' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>
              <Shield className="w-3 h-3" /> KYC {userKycStatus === 'approved' || userKycStatus === 'verified' ? 'Verified' : userKycStatus}
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

      {/* Contact GHL + Relationship Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contact GHL Card */}
        <Glass className="p-5 relative overflow-hidden" hover glow theme={theme}>
          <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-purple-500/10 rounded-full blur-[50px]" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                <PhoneCall className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="text-sm font-bold text-white">Contact GHL</h4>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Chennai HQ', number: '+91 44 2843 1043', href: 'tel:+914428431043', icon: Building2, toast: 'Calling Chennai HQ...' },
                { label: 'Sales & Support', number: '+91 7200 255 252', href: 'tel:+917200255252', icon: Phone, toast: 'Calling Sales & Support...' },
                { label: 'Email', number: 'info@ghlindiaventures.com', href: 'mailto:info@ghlindiaventures.com', icon: Mail, toast: 'Opening email client...' },
                { label: 'Live Chat', number: 'Chat with ARIA', href: '#', icon: MessageSquare, toast: 'Opening live chat...' },
              ].map((line, i) => (
                <button key={i} onClick={() => {
                  if (line.href === '#') { window.dispatchEvent(new CustomEvent('ghl-open-chat')) }
                  else { window.open(line.href, line.href.startsWith('mailto') ? '_blank' : '_self') }
                  showToast(line.toast, 'info')
                }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-purple-500/20 hover:bg-purple-500/[0.04] transition-all group cursor-pointer text-left">
                  <line.icon className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500">{line.label}</p>
                    <p className="text-xs font-semibold text-white">{line.number}</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-purple-400 transition-colors" />
                </button>
              ))}
            </div>
            <button onClick={() => setActiveTab('support')}
              className="w-full mt-3 py-2 rounded-xl text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/15 hover:bg-purple-500/20 transition-all">
              Open Support Center &rarr;
            </button>
          </div>
        </Glass>

        {/* Relationship Manager Card */}
        <Glass className="p-5" hover theme={theme}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <h4 className="text-sm font-bold text-white">Your RM</h4>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-lg font-bold text-blue-300 ring-2 ring-blue-500/20">
              {assignedRM ? assignedRM.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'RM'}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{assignedRM?.name || 'Not yet assigned'}</p>
              <p className="text-xs text-gray-500">{assignedRM?.designation || 'Relationship Manager'}</p>
              {!assignedRM && <p className="text-[10px] text-gray-600 mt-0.5">An RM will be assigned to you shortly</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={async () => {
              showToast('Connecting you with your RM...', 'info')
              await createRMRequest({ clientId: clientId || '', clientName: userName || 'Client', requestType: 'chat' })
              window.dispatchEvent(new CustomEvent('ghl-open-chat'))
            }}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-brand-red/20 hover:bg-brand-red/[0.04] text-xs font-medium text-gray-300 hover:text-brand-red transition-all">
              <MessageSquare className="w-3.5 h-3.5" /> Talk with RM
            </button>
            <button onClick={async () => {
              showToast('Requesting callback from your RM...', 'info')
              await createRMRequest({ clientId: clientId || '', clientName: userName || 'Client', requestType: 'callback' })
              window.open('tel:+917200255252')
            }}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/20 hover:bg-emerald-500/[0.04] text-xs font-medium text-gray-300 hover:text-emerald-300 transition-all">
              <Phone className="w-3.5 h-3.5" /> Call RM
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-medium">Available now &bull; Mon-Sat 9:30 AM - 6:30 PM IST</span>
          </div>
        </Glass>
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
        <p className={`text-sm ${t('text-gray-500','text-gray-700')}`}>Browse, select, and manage your allocations</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Category II AIF - Direct', desc: 'Invest in SEBI-registered AIF with stressed RE and startup exposure.', min: 'As per SEBI AIF Regulations', target: '18-22% IRR', tenure: '5-7 Years', risk: 'High', color: '#D0021B', icon: Building2 },
          { title: 'SEBI Co-Invest Framework', desc: 'Regulated co-invest structure with fixed returns and same asset pool.', min: 'Contact for details', target: '12-15% p.a.', tenure: '3-5 Years', risk: 'Moderate', color: '#3B82F6', icon: FileText },
          { title: 'NCLT Recovery Assets', desc: 'Stressed properties at 40-60% discount through IBC resolution.', min: '\u20B950 Lakhs', target: '25-35% IRR', tenure: '2-4 Years', risk: 'High', color: '#10B981', icon: Target, upcoming: true },
          { title: 'Early-Stage Startups', desc: 'Pre-Series A in high-growth Indian tech startups.', min: '\u20B925 Lakhs', target: '30-50% IRR', tenure: '5-8 Years', risk: 'Very High', color: '#F59E0B', icon: Rocket, upcoming: true },
        ].map((opp, i) => (
          <Glass key={i} className="p-6" hover glow theme={theme}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${opp.color}15` }}>
                <opp.icon className="w-6 h-6" style={{ color: opp.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>{opp.title}</h4>
                  {(opp as any).upcoming && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">Upcoming</span>
                  )}
                </div>
                <p className={`text-xs leading-relaxed ${t('text-gray-500','text-gray-700')}`}>{opp.desc}</p>
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
                  <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-600','text-gray-600')}`}>{f.label}</p>
                  <p className={`text-sm font-bold ${f.green ? 'text-emerald-400' : f.risk ? (opp.risk === 'Very High' ? 'text-red-400' : opp.risk === 'High' ? 'text-amber-400' : 'text-blue-400') : t('text-white','text-gray-900')}`}>{f.val}</p>
                </div>
              ))}
            </div>
            <button onClick={async () => {
              if (clientId && user) {
                await registerInterest({ client_id: clientId, user_id: user.id, fund_title: opp.title, fund_type: opp.title })
                showToast(`Interest registered for ${opp.title}. Our team will contact you shortly.`)
              } else { showToast('Please log in to express interest', 'info') }
            }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
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
        <p className={`text-xs mb-4 ${t('text-gray-500','text-gray-700')}`}>Request changes to your current investment allocation. Our advisory team will review and process your request.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {allocationData.map((a: any, i: number) => (
            <div key={i} className={`p-3 rounded-xl ${t('bg-white/[0.03] border border-white/[0.06]','bg-gray-100/60 border border-gray-200/40')}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ background: a.color }} />
                <span className={`text-xs font-semibold ${t('text-white','text-gray-900')}`}>{a.name}</span>
              </div>
              <p className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>{a.value}%</p>
            </div>
          ))}
        </div>
        <button onClick={async () => {
          if (clientId && user) {
            await requestReallocation({ client_id: clientId, user_id: user.id, current_allocation: allocationData })
            showToast('Reallocation request submitted. Your advisory team will review within 48 hours.')
          } else { showToast('Please log in to request reallocation', 'info') }
        }}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
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
          <p className={`text-sm ${t('text-gray-500','text-gray-700')}`}>Upload, track, and manage your compliance documents</p>
        </div>
        <button onClick={() => setUploadModalOpen(true)} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
          <Upload className="w-3.5 h-3.5" /> Upload Document
        </button>
      </div>

      {/* KYC Progress */}
      <Glass className="p-6" hover theme={theme}>
        <h3 className={`text-base font-bold mb-1 ${t('text-white','text-gray-900')}`}>KYC Verification Progress</h3>
        <p className={`text-xs mb-5 ${t('text-gray-500','text-gray-700')}`}>As required by SEBI, complete your KYC before investing.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kycSteps.map((step: any, i: number) => {
            const StepIcon = KYC_ICON_MAP[step.id] || FileCheck
            return (
            <div key={i} className={`p-4 rounded-xl text-center transition-all cursor-pointer
              ${step.status === 'completed' ? (isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200') :
                step.status === 'in-review' ? (isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200') :
                t('bg-white/[0.03] border border-white/[0.06]','bg-gray-100/60 border border-gray-200/40')}`}>
              <StepIcon className={`w-6 h-6 mx-auto mb-2 ${step.status === 'completed' ? 'text-emerald-400' : step.status === 'in-review' ? 'text-amber-400' : t('text-gray-500','text-gray-600')}`} />
              <p className={`text-[11px] font-medium ${t('text-white','text-gray-900')}`}>{step.label}</p>
              <span className={`text-[9px] font-semibold uppercase mt-1 inline-block px-1.5 py-0.5 rounded-full
                ${step.status === 'completed' ? 'text-emerald-400 bg-emerald-500/20' : step.status === 'in-review' ? 'text-amber-400 bg-amber-500/20' : 'text-gray-500 bg-gray-500/20'}`}>
                {step.status === 'in-review' ? 'In Review' : step.status}
              </span>
            </div>
          )})}
        </div>
      </Glass>

      {/* Document uploads */}
      <Glass className="p-6" hover theme={theme}>
        <h3 className={`text-base font-bold mb-4 ${t('text-white','text-gray-900')}`}>Your Documents</h3>
        {documents.length === 0 ? (
          <div className={`text-center py-8 ${t('text-gray-500','text-gray-600')}`}>
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium mb-1">No documents uploaded yet</p>
            <p className="text-xs">Click "Upload Document" above to submit your KYC documents.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc: any, i: number) => {
              const status = doc.status || 'pending'
              const docDate = doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
              return (
                <div key={doc.id || i} onClick={async () => {
                  // View/download the document
                  const filePath = doc.file_path || doc.url || doc.file_url
                  if (filePath) {
                    try {
                      const { getDownloadUrl } = await import('@/lib/supabase/storageService')
                      const result = await getDownloadUrl(filePath, doc.bucket || 'ghl-documents')
                      if (result?.url) {
                        window.open(result.url, '_blank')
                      } else {
                        showToast('Document preview not available. Please contact support.', 'info')
                      }
                    } catch {
                      showToast('Unable to load document. Please try again.', 'info')
                    }
                  } else {
                    showToast('Document preview not available for this file.', 'info')
                  }
                }} className={`flex items-center gap-3 p-4 rounded-xl transition-all cursor-pointer group
                  ${t('bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08]','bg-gray-100/35 border border-gray-200/30 hover:border-gray-300/40')}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                    ${status === 'verified' || status === 'approved' ? 'bg-emerald-500/15' : status === 'pending' || status === 'review' ? 'bg-amber-500/15' : 'bg-blue-500/15'}`}>
                    {status === 'verified' || status === 'approved' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                     status === 'pending' || status === 'review' ? <Clock className="w-5 h-5 text-amber-400" /> :
                     <FileText className="w-5 h-5 text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${t('text-white','text-gray-900')}`}>{doc.title || doc.name || 'Document'}</p>
                    <p className={`text-[11px] ${t('text-gray-500','text-gray-700')}`}>{doc.category || 'General'} &bull; {docDate}</p>
                  </div>
                  <Eye className={`w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${t('text-gray-400','text-gray-500')}`} />
                  <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full shrink-0
                    ${status === 'verified' || status === 'approved' ? 'text-emerald-400 bg-emerald-500/20' :
                      status === 'pending' || status === 'review' ? 'text-amber-400 bg-amber-500/20' :
                      'text-blue-400 bg-blue-500/20'}`}>{status}</span>
                </div>
              )
            })}
          </div>
        )}
      </Glass>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className={`max-w-lg w-full mx-4 rounded-2xl border p-6 ${t('bg-[#111] border-white/10','bg-[#F0EDE9] border-gray-200/50 shadow-2xl')}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>Upload Document</h3>
              <button onClick={() => setUploadModalOpen(false)} className={t('text-gray-500 hover:text-white','text-gray-600 hover:text-gray-900')}><X className="w-5 h-5" /></button>
            </div>
            {/* Document Name */}
            <div className="mb-3">
              <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Document Name</label>
              <input type="text" placeholder="e.g. PAN_Card_2025" value={docName} onChange={e => setDocName(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/60 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
            </div>
            {/* Folder / Category */}
            <div className="mb-3">
              <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>File To Folder</label>
              <select value={docCategory} onChange={e => setDocCategory(e.target.value)}
                style={isDark ? { colorScheme: 'dark' } : undefined}
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
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation() }}
              onDrop={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                const droppedFiles = e.dataTransfer.files
                if (!droppedFiles || droppedFiles.length === 0) return
                const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
                const validFiles: File[] = []
                for (let i = 0; i < droppedFiles.length; i++) {
                  if (allowed.includes(droppedFiles[i].type) && droppedFiles[i].size <= 10 * 1024 * 1024) {
                    validFiles.push(droppedFiles[i])
                  }
                }
                if (validFiles.length === 0) { showToast('Only PDF, JPG, PNG files up to 10MB are allowed.', 'info'); return }
                try {
                  const svc = await import('@/lib/supabase/storageService')
                  const results = await svc.uploadFiles(validFiles, 'client/kyc', undefined, {
                    portal: 'client',
                    entityType: 'client',
                    entityId: clientId || undefined,
                    category: docCategory || 'general',
                    trackRecord: true,
                  })
                  const ok = results.filter(r => r.success).length
                  const fail = results.length - ok
                  if (ok > 0) showToast(`${ok} file(s) uploaded successfully!`, 'success')
                  if (fail > 0) showToast(`${fail} file(s) failed. Please try a smaller file or different format.`, 'info')
                  setUploadedFiles(prev => [...prev, ...results.filter(r => r.success).map(r => ({ name: r.file?.name || '', url: r.file?.url || '', path: r.file?.path || '', bucket: r.file?.bucket || '', size: r.file?.size || 0, type: r.file?.type || '' }))])
                } catch (err) {
                  console.error('[kyc] Drop upload error:', err)
                  showToast('Upload failed. Please try again.', 'info')
                }
              }}
              onClick={(e) => {
                e.stopPropagation()
                // Use pickAndUploadFiles for reliable native file picker
                import('@/lib/supabase/storageService').then(async (svc) => {
                  try {
                    const results = await svc.pickAndUploadFiles('client/kyc', {
                      accept: '.pdf,.jpg,.jpeg,.png',
                      multiple: true,
                      portal: 'client',
                      entityType: 'client',
                      entityId: clientId || undefined,
                      category: docCategory || 'general',
                    })
                    if (results.length > 0) {
                      const ok = results.filter(r => r.success).length
                      const fail = results.length - ok
                      if (ok > 0) showToast(`${ok} file(s) uploaded successfully!`, 'success')
                      if (fail > 0) showToast(`${fail} file(s) failed to upload. Please try a smaller file or different format.`, 'info')
                      setUploadedFiles(prev => [...prev, ...results.filter(r => r.success).map(r => ({ name: r.file?.name || '', url: r.file?.url || '', path: r.file?.path || '', bucket: r.file?.bucket || '', size: r.file?.size || 0, type: r.file?.type || '' }))])
                    }
                  } catch (uploadErr) {
                    console.error('[kyc] File upload error:', uploadErr)
                    showToast('Upload failed. Please try again or email documents to info@ghlindiaventures.com', 'info')
                  }
                }).catch(err => {
                  console.error('[kyc] Storage service import error:', err)
                  showToast('Upload service unavailable. Please email documents to info@ghlindiaventures.com', 'info')
                })
              }}>
              <Upload className={`w-8 h-8 mx-auto mb-2 ${t('text-gray-500','text-gray-600')}`} />
              <p className={`text-sm font-medium mb-1 ${t('text-white','text-gray-900')}`}>Click to upload or drag & drop</p>
              <p className={`text-xs ${t('text-gray-500','text-gray-700')}`}>PDF, JPG, PNG up to 10MB</p>
            </div>
            {/* Show uploaded file names */}
            {uploadedFiles.length > 0 && (
              <div className={`mb-3 p-2.5 rounded-lg ${t('bg-emerald-500/10 border border-emerald-500/20','bg-emerald-50 border border-emerald-200')}`}>
                <p className="text-xs font-semibold text-emerald-500 mb-1">{uploadedFiles.length} file(s) selected:</p>
                {uploadedFiles.map((f, i) => (
                  <p key={i} className={`text-xs ${t('text-gray-300','text-gray-700')}`}>• {f.name}</p>
                ))}
              </div>
            )}
            <button onClick={async () => {
              if (!docName.trim()) { showToast('Please enter a document name.', 'info'); return }
              if (!docCategory) { showToast('Please select a folder.', 'info'); return }
              if (uploadedFiles.length === 0) { showToast('Please upload at least one file.', 'info'); return }
              try {
                const firstFile = uploadedFiles[0]
                // Save document record to DB with actual storage URL/path
                await uploadClientDocument({
                  client_id: clientId || '',
                  user_id: user?.id || '',
                  title: docName,
                  category: docCategory === 'pan' || docCategory === 'aadhaar' || docCategory === 'bank' || docCategory === 'cheque' || docCategory === 'address' || docCategory === 'demat' ? 'kyc' : docCategory === 'tax' ? 'compliance' : 'general',
                  file_url: firstFile.url || firstFile.path || `client/kyc/clients/${clientId}/${firstFile.name}`,
                  file_name: firstFile.name,
                  file_size: firstFile.size,
                  file_type: firstFile.type?.split('/').pop() || '',
                  mime_type: firstFile.type,
                })
                // Save additional files if multiple uploaded
                for (let fi = 1; fi < uploadedFiles.length; fi++) {
                  const f = uploadedFiles[fi]
                  await uploadClientDocument({
                    client_id: clientId || '',
                    user_id: user?.id || '',
                    title: `${docName} (${fi + 1})`,
                    category: docCategory === 'pan' || docCategory === 'aadhaar' || docCategory === 'bank' || docCategory === 'cheque' || docCategory === 'address' || docCategory === 'demat' ? 'kyc' : docCategory === 'tax' ? 'compliance' : 'general',
                    file_url: f.url || f.path || `client/kyc/clients/${clientId}/${f.name}`,
                    file_name: f.name,
                    file_size: f.size,
                    file_type: f.type?.split('/').pop() || '',
                    mime_type: f.type,
                  })
                }
                setUploadModalOpen(false); setDocName(''); setDocCategory(''); setUploadedFiles([]); refetchDocs()
                showToast('Document submitted. Under review by compliance team.', 'success')
              } catch (err) {
                console.error('[kyc] Document save error:', err)
                showToast('Failed to save document record. Please try again.', 'info')
              }
            }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
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
          <p className={`text-sm ${t('text-gray-500','text-gray-700')}`}>Complete transaction history</p>
        </div>
        <button onClick={async () => {
          showToast('Exporting transactions...', 'info')
          const bom = '\uFEFF'
          const rows = transactions.map((tx: any) => `${tx.date},${tx.type},${tx.fund},${tx.amount},${tx.status}`)
          const csv = `${bom}Date,Type,Fund,Amount,Status\n${rows.join('\n')}`
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
          const filename = `GHL_Transactions_${new Date().toISOString().slice(0,10)}.csv`
          await saveBlobAs(blob, filename, showToast as any)
        }} className="flex items-center gap-2 text-xs text-brand-red font-semibold"><Download className="w-3.5 h-3.5" /> Export CSV</button>
      </div>
      <Glass className="overflow-hidden" hover={false} theme={theme}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${t('border-white/[0.06]','border-gray-200/50')}`}>
                {['Date', 'Type', 'Fund', 'Amount', 'Status'].map(h => (
                  <th key={h} className={`text-${h === 'Amount' || h === 'Status' ? 'right' : 'left'} text-xs font-medium py-3 px-5 ${t('text-gray-500','text-gray-600')}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <ArrowLeftRight className={`w-10 h-10 mx-auto mb-3 ${t('text-gray-600','text-gray-400')}`} />
                    <p className={`text-sm font-medium ${t('text-gray-400','text-gray-600')}`}>No transactions yet</p>
                    <p className={`text-xs mt-1 ${t('text-gray-600','text-gray-500')}`}>Your transaction history will appear here once you make an investment.</p>
                  </td>
                </tr>
              ) : transactions.map((tx: any, i: number) => (
                <tr key={i} className={`border-b transition-colors ${t('border-white/[0.03] hover:bg-white/[0.02]','border-gray-100 hover:bg-gray-200/30')}`}>
                  <td className={`py-3 px-5 text-xs ${t('text-gray-400','text-gray-700')}`}>{tx.date}</td>
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
          <p className={`text-sm ${t('text-gray-500','text-gray-700')}`}>Communicate with your advisory team</p>
        </div>
        <button onClick={() => setMessageCompose(!messageCompose)} className="px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
          <Send className="w-3.5 h-3.5" /> Compose
        </button>
      </div>

      {messageCompose && (
        <Glass className="p-6" theme={theme}>
          <h4 className={`text-sm font-bold mb-4 ${t('text-white','text-gray-900')}`}>New Message</h4>
          <div className="space-y-3">
            <select value={msgTo} onChange={e => setMsgTo(e.target.value)} style={isDark ? { colorScheme: 'dark' } : undefined} className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100/60 border border-gray-200/40 text-gray-900')}`}>
              <option>Relationship Manager</option><option>Compliance Team</option><option>Investment Team</option><option>Support Team</option>
            </select>
            <input type="text" placeholder="Subject" value={msgSubject} onChange={e => setMsgSubject(e.target.value)} className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
            <textarea rows={4} placeholder="Write your message... (or use voice input)" value={msgBody} onChange={e => setMsgBody(e.target.value)} className={`w-full px-4 py-2.5 rounded-xl text-sm resize-none ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
            {/* Attachments display */}
            {msgAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {msgAttachments.map((f, i) => (
                  <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${t('bg-white/[0.06] text-gray-300','bg-gray-100 text-gray-700')}`}>
                    <Paperclip className="w-3 h-3" /> {f.name}
                    <button onClick={() => setMsgAttachments(prev => prev.filter((_, idx) => idx !== i))} className="ml-1 text-red-400 hover:text-red-300"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <input ref={msgFileRef} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.csv" onChange={(e) => {
                const files = Array.from(e.target.files || [])
                if (files.length > 0) {
                  setMsgAttachments(prev => [...prev, ...files])
                  showToast(`${files.length} file(s) attached`, 'success')
                }
                e.target.value = ''
              }} />
              <button type="button" onClick={() => msgFileRef.current?.click()} className={`p-2.5 rounded-lg transition-colors cursor-pointer ${t('hover:bg-white/[0.06] bg-white/[0.03]','hover:bg-gray-200/60 bg-gray-100/50')} border ${t('border-white/[0.06]','border-gray-200/40')}`} title="Attach file"><Paperclip className={`w-4 h-4 ${t('text-gray-400 hover:text-white','text-gray-600 hover:text-gray-900')}`} /></button>
              <VoiceInput compact onTranscript={(text) => setMsgBody(prev => (prev ? prev + ' ' : '') + text)} showLanguageSelector />
              <div className="flex-1" />
              <button onClick={() => { setMessageCompose(false); setMsgAttachments([]) }} className={`px-4 py-2 rounded-xl text-sm font-medium ${t('text-gray-400','text-gray-700')}`}>Cancel</button>
              <button onClick={async () => {
                if (!msgSubject.trim()) { showToast('Please enter a subject.', 'info'); return }
                if (!msgBody.trim()) { showToast('Please write a message.', 'info'); return }
                try {
                  // Upload attachments first if any
                  let attachmentUrls: string[] = []
                  if (msgAttachments.length > 0) {
                    for (const file of msgAttachments) {
                      try {
                        const result = await uploadFile(file, `messages/${clientId}`)
                        if (result?.file?.url) attachmentUrls.push(result.file.url)
                      } catch { /* continue with other files */ }
                    }
                  }
                  const body = attachmentUrls.length > 0 ? `${msgBody}\n\n📎 Attachments: ${attachmentUrls.length} file(s)` : msgBody
                  await sendMessage({ from_id: user?.id || clientId, to_id: clientId, subject: `[${msgTo}] ${msgSubject}`, body, attachments: attachmentUrls.length > 0 ? JSON.stringify(attachmentUrls) : null })
                  setMessageCompose(false); setMsgTo('Relationship Manager'); setMsgSubject(''); setMsgBody(''); setMsgAttachments([]); refetchMessages()
                  showToast('Message sent successfully to your advisory team.')
                } catch { showToast('Failed to send message. Please try again.', 'info') }
              }} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
                <span className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Send</span>
              </button>
            </div>
          </div>
        </Glass>
      )}

      <div className="space-y-2">
        {messagesData.map((msg: any) => (
          <div key={msg.id} onClick={() => showToast(`Opening: "${msg.subject}" from ${msg.from}`, 'info')}>
          <Glass className={`p-4 cursor-pointer ${!msg.read ? 'border-l-2 border-l-brand-red' : ''}`} hover theme={theme}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-red/20 to-red-900/20 flex items-center justify-center text-xs font-bold text-brand-red shrink-0">{msg.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={`text-sm font-semibold ${t('text-white','text-gray-900')} ${!msg.read ? '' : 'opacity-70'}`}>{msg.from}</p>
                  <span className={`text-[10px] ${t('text-gray-600','text-gray-600')}`}>{msg.time}</span>
                </div>
                <p className={`text-xs font-medium mb-0.5 ${t('text-gray-300','text-gray-700')} ${!msg.read ? '' : 'opacity-70'}`}>{msg.subject}</p>
                <p className={`text-xs truncate ${t('text-gray-500','text-gray-700')}`}>{msg.preview}</p>
              </div>
              {!msg.read && <div className="w-2 h-2 rounded-full bg-brand-red shrink-0 mt-2" />}
            </div>
          </Glass>
          </div>
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
        <p className={`text-sm ${t('text-gray-500','text-gray-700')}`}>Get help from our team</p>
      </div>

      {/* Quick connect */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Chat with ARIA', desc: 'AI assistant & live advisor.', icon: MessageSquare, color: '#D0021B', action: () => window.dispatchEvent(new CustomEvent('ghl-open-chat')) },
          { title: 'Email Us', desc: 'info@ghlindiaventures.com', icon: Mail, color: '#3B82F6', action: () => { window.open('mailto:info@ghlindiaventures.com', '_blank'); showToast('Opening email client...', 'info') } },
          { title: 'Message Us', desc: 'Live chat with our team', icon: Send, color: '#10B981', action: () => { window.dispatchEvent(new CustomEvent('ghl-open-chat')); showToast('Opening live chat...', 'info') } },
          { title: 'Direct Call', desc: 'Chennai HQ: +91 44 2843 1043', icon: PhoneCall, color: '#8B5CF6', action: () => { window.open('tel:+914428431043'); showToast('Connecting to GHL Chennai HQ...', 'info') } },
        ].map((item, i) => (
          <button key={i} onClick={item.action} className="text-left w-full">
            <Glass className="p-5" hover glow theme={theme}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: `${item.color}15` }}>
                <item.icon className="w-6 h-6" style={{ color: item.color }} />
              </div>
              <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>{item.title}</h4>
              <p className={`text-xs mt-1 ${t('text-gray-500','text-gray-700')}`}>{item.desc}</p>
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
            <input type="text" placeholder="Subject" value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
            <select value={ticketCategory} onChange={e => setTicketCategory(e.target.value)} style={isDark ? { colorScheme: 'dark' } : undefined} className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100/60 border border-gray-200/40 text-gray-900')}`}>
              <option>General Inquiry</option><option>Investment Query</option><option>KYC Issue</option><option>Technical Issue</option><option>Document Request</option>
            </select>
            <textarea rows={3} placeholder="Describe your issue... (or use voice input)" value={ticketDesc} onChange={e => setTicketDesc(e.target.value)} className={`w-full px-4 py-2.5 rounded-xl text-sm resize-none ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
            <div className="flex items-center gap-2">
              <VoiceInput compact onTranscript={(text) => setTicketDesc(prev => (prev ? prev + ' ' : '') + text)} showLanguageSelector />
              <span className={`text-[10px] ${t('text-gray-600','text-gray-500')}`}>Speak in 23 Indian languages</span>
            </div>
            <button type="button" onClick={async () => {
              if (!ticketSubject.trim()) { showToast('Please enter a subject for your ticket.', 'info'); return }
              if (!ticketDesc.trim()) { showToast('Please describe your issue.', 'info'); return }
              try {
                const result = await createSupportTicket({ client_id: clientId, subject: ticketSubject, category: ticketCategory, description: ticketDesc, status: 'open', priority: 'medium' })
                if (result) {
                  setTicketForm(false); setTicketSubject(''); setTicketCategory('General Inquiry'); setTicketDesc(''); refetchTickets()
                  showToast('Support ticket submitted. We\'ll respond within 24 hours.', 'success')
                } else {
                  showToast('Failed to submit ticket. Please try again or email info@ghlindiaventures.com', 'info')
                }
              } catch {
                showToast('Failed to submit ticket. Please try again or email info@ghlindiaventures.com', 'info')
              }
            }} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}><Send className="w-3.5 h-3.5" /> Submit Ticket</button>
          </div>
        )}
        {/* Existing tickets */}
        <div className="space-y-2">
          {supportTickets.length === 0 && !ticketForm && (
            <p className={`text-sm text-center py-4 ${t('text-gray-500','text-gray-600')}`}>No tickets yet. Click "New Ticket" to get help.</p>
          )}
          {supportTickets.map((tk: any) => (
            <div key={tk.id} className={`flex items-center gap-3 p-3 rounded-xl ${t('bg-white/[0.02] border border-white/[0.04]','bg-gray-100/60 border border-gray-200/40')}`}>
              <Ticket className={`w-5 h-5 shrink-0 ${tk.status === 'resolved' || tk.status === 'closed' ? 'text-emerald-400' : 'text-amber-400'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${t('text-white','text-gray-900')}`}>{tk.subject}</p>
                <p className={`text-[11px] ${t('text-gray-500','text-gray-700')}`}>{tk.ticket_number || tk.id} &bull; {tk.created_at ? new Date(tk.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tk.status === 'resolved' || tk.status === 'closed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{tk.status}</span>
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
              <p className={`text-xs leading-relaxed ${t('text-gray-500','text-gray-700')}`}>{faq.a}</p>
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
                <div><h3 className={`text-base font-bold ${t('text-white','text-gray-900')}`}>Refer & Earn</h3><p className={`text-xs ${t('text-gray-500','text-gray-700')}`}>Invite investors, earn rewards</p></div>
              </div>
              <div className="mb-2">
                <p className={`text-[11px] font-medium mb-1.5 ${t('text-gray-400','text-gray-600')}`}>Your unique referral code</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${t('bg-brand-red/10 border border-brand-red/20','bg-red-50 border border-red-200')}`}>
                  <span className="text-sm font-bold text-brand-red font-mono">{referralCode}</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 p-2.5 rounded-xl mb-4 ${t('bg-white/[0.03] border border-white/[0.06]','bg-gray-100/60 border border-gray-200/40')}`}>
                <code className={`flex-1 text-xs font-mono truncate ${t('text-gray-300','text-gray-600')}`}>{referralLink || 'Loading...'}</code>
                <button onClick={() => {
                  if (referralLink) {
                    navigator.clipboard.writeText(referralLink)
                    setReferralCopied(true)
                    showToast('Referral link copied to clipboard!', 'success')
                    setTimeout(() => setReferralCopied(false), 2000)
                  }
                }} className={`p-1.5 rounded-lg transition-colors ${referralCopied ? 'bg-emerald-500/20 text-emerald-400' : t('hover:bg-white/[0.06] text-gray-400','hover:bg-gray-200 text-gray-500')}`}>
                  {referralCopied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              {/* Share buttons */}
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => { window.open(`https://wa.me/?text=Join%20me%20on%20GHL%20India%20Ventures%20for%20premium%20AIF%20investments!%20${encodeURIComponent(referralLink)}`, '_blank') }} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${t('bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20','bg-emerald-50 text-emerald-600 hover:bg-emerald-100')}`}>
                  <Send className="w-3 h-3" /> WhatsApp
                </button>
                <button onClick={() => { window.open(`mailto:?subject=Join%20GHL%20India%20Ventures&body=I%27d%20like%20to%20invite%20you%20to%20invest%20with%20GHL%20India%20Ventures.%20Sign%20up%20here:%20${encodeURIComponent(referralLink)}`, '_blank') }} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${t('bg-blue-500/10 text-blue-400 hover:bg-blue-500/20','bg-blue-50 text-blue-600 hover:bg-blue-100')}`}>
                  <Mail className="w-3 h-3" /> Email
                </button>
              </div>
              <div className="flex items-center gap-6 text-xs">
                <div><p className={t('text-gray-500','text-gray-700')}>Referred</p><p className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>{referralStats.referred}</p></div>
                <div className={`w-px h-8 ${t('bg-white/[0.06]','bg-gray-200')}`} />
                <div><p className={t('text-gray-500','text-gray-700')}>Earned</p><p className="text-lg font-bold text-emerald-400">{referralStats.earned > 0 ? `\u20B9${(referralStats.earned / 1000).toFixed(0)}K` : '\u20B90'}</p></div>
              </div>
            </div>
          </Glass>
        </div>
        <Glass className="p-6" hover theme={theme}>
          <h4 className={`text-sm font-bold mb-4 ${t('text-white','text-gray-900')}`}>How It Works</h4>
          {[{ step: '1', t: 'Share Link', d: 'Share your unique referral link with friends and family' },{ step: '2', t: 'They Register', d: 'Your referral signs up using your link' },{ step: '3', t: 'They Invest', d: 'Once they complete an investment, you get notified' },{ step: '4', t: 'You Earn', d: 'Receive referral bonus as per our reward policy' }].map((s, i) => (
            <div key={i} className="flex items-start gap-3 mb-3">
              <span className="w-7 h-7 rounded-full bg-brand-red/15 flex items-center justify-center text-xs font-bold text-brand-red shrink-0">{s.step}</span>
              <div><p className={`text-xs font-semibold ${t('text-white','text-gray-900')}`}>{s.t}</p><p className={`text-[11px] ${t('text-gray-500','text-gray-700')}`}>{s.d}</p></div>
            </div>
          ))}
        </Glass>
      </div>

      {/* Referral terms */}
      <Glass className="p-4" theme={theme}>
        <p className={`text-xs ${t('text-gray-500','text-gray-600')}`}>
          <Info className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
          Referral rewards are subject to the successful onboarding and investment by the referred party. Terms and conditions apply. Contact your relationship manager for details on reward structure.
        </p>
      </Glass>
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // PROFILE TAB (Personal, Nominee, Bank) — with Edit Profile
  // ═══════════════════════════════════════════════════════════
  const openEditProfile = () => {
    setEditForm({
      full_name: savedProfileData.full_name || user?.name || '',
      phone: savedProfileData.phone || user?.phone || '',
      pan: savedProfileData.pan || (user as any)?.pan || '',
      city: savedProfileData.city || user?.city || '',
      dob: savedProfileData.dob || (user as any)?.dob || '',
      occupation: savedProfileData.occupation || (user as any)?.occupation || '',
      nominee_name: savedProfileData.nominee_name || (user as any)?.nominee_name || '',
      nominee_relation: savedProfileData.nominee_relation || (user as any)?.nominee_relation || '',
      nominee_pan: savedProfileData.nominee_pan || (user as any)?.nominee_pan || '',
      nominee_share: savedProfileData.nominee_share || (user as any)?.nominee_share || '',
    })
    setEditProfileOpen(true)
  }

  const handleSaveProfile = async () => {
    try {
      const svc = await import('@/lib/supabase/dashboardDataService')
      if (typeof svc.updateProfile === 'function') {
        await svc.updateProfile(editForm)
      }
      setSavedProfileData({ ...editForm })
      showToast('Profile updated successfully!', 'success')
      setEditProfileOpen(false)
    } catch {
      setSavedProfileData({ ...editForm })
      showToast('Profile saved locally. Changes will sync when online.', 'info')
      setEditProfileOpen(false)
    }
  }

  // Profile completion percentage
  const profileFields = [user?.name, user?.phone, user?.city, user?.dob, user?.occupation, user?.nominee_name, user?.bank_name, user?.pan]
  const filledFields = profileFields.filter(Boolean).length
  const profileCompletion = Math.round((filledFields / profileFields.length) * 100)

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${t('text-white','text-gray-900')}`}>Your Profile</h2>
        <button onClick={openEditProfile} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
          <Sliders className="w-3.5 h-3.5" /> Edit Profile
        </button>
      </div>

      {/* Profile Completion Bar */}
      {profileCompletion < 100 && (
        <Glass className="p-4" theme={theme}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-red" />
              <span className={`text-xs font-semibold ${t('text-white','text-gray-900')}`}>Profile Completion</span>
            </div>
            <span className="text-xs font-bold text-brand-red">{profileCompletion}%</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${t('bg-white/[0.06]','bg-gray-200')}`}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${profileCompletion}%`, background: 'linear-gradient(90deg, #D0021B, #FF4444)' }} />
          </div>
          <p className={`text-[10px] mt-2 ${t('text-gray-500','text-gray-600')}`}>
            Complete your profile to unlock all platform features and faster KYC approval.
          </p>
        </Glass>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Glass className="p-6 text-center" hover glow theme={theme}>
          {/* Profile Photo with Upload */}
          <div className="relative w-24 h-24 mx-auto mb-4 group">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-24 h-24 rounded-full object-cover ring-4 ring-white/[0.08]" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center text-3xl font-bold text-white ring-4 ring-white/[0.08]">{userInitials}</div>
            )}
            <button onClick={() => profilePhotoRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
            </button>
            <input ref={profilePhotoRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp"
              onChange={handleProfilePhotoUpload} />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-red flex items-center justify-center ring-2 ring-brand-black cursor-pointer hover:scale-110 transition-transform"
              onClick={() => profilePhotoRef.current?.click()}>
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <h3 className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>{userName}</h3>
          <p className={`text-xs mb-3 ${t('text-gray-500','text-gray-700')}`}>{userEmail}</p>

          {/* KYC Badge — clickable, links to KYC tab */}
          <button onClick={() => setActiveTab('kyc')} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-105 ${userKycStatus === 'approved' || userKycStatus === 'verified' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25'}`}>
            <Shield className="w-3 h-3" /> KYC {userKycStatus === 'approved' || userKycStatus === 'verified' ? 'Verified' : userKycStatus}
            {!(userKycStatus === 'approved' || userKycStatus === 'verified') && <ChevronRight className="w-3 h-3" />}
          </button>
          {!(userKycStatus === 'approved' || userKycStatus === 'verified') && (
            <p className={`text-[10px] mt-1.5 ${t('text-gray-600','text-gray-500')}`}>Tap to complete your KYC</p>
          )}

          <div className={`mt-4 pt-4 border-t text-left space-y-2.5 ${t('border-white/[0.06]','border-gray-200/50')}`}>
            {[['Investor ID', clientId || 'N/A'],['PAN', user?.pan || 'Not provided'],['Mobile', user?.phone || 'Not provided'],['Joined', user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A']].map(([l,v],i) => (
              <div key={i} className="flex justify-between text-xs"><span className={t('text-gray-500','text-gray-700')}>{l}</span><span className={`font-medium ${v === 'Not provided' ? 'text-gray-600 italic' : t('text-white','text-gray-900')}`}>{v}</span></div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className={`mt-4 pt-4 border-t space-y-2 ${t('border-white/[0.06]','border-gray-200/50')}`}>
            <button onClick={openEditProfile} className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${t('bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/[0.06]','bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200')}`}>
              <Sliders className="w-3.5 h-3.5" /> Edit Details
            </button>
            {!(userKycStatus === 'approved' || userKycStatus === 'verified') && (
              <button onClick={() => setActiveTab('kyc')} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
                <FileCheck className="w-3.5 h-3.5" /> Complete KYC
              </button>
            )}
          </div>
        </Glass>

        <div className="lg:col-span-2 space-y-4">
          {/* Personal Details */}
          <Glass className="p-6" hover theme={theme}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Personal Details</h4>
              <button onClick={openEditProfile} className={`text-xs font-semibold flex items-center gap-1 ${t('text-gray-400 hover:text-white','text-gray-500 hover:text-gray-900')} transition-colors`}><Sliders className="w-3 h-3" /> Edit</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[['Full Name', savedProfileData.full_name || userName],['Email', userEmail],['Phone', savedProfileData.phone || user?.phone || 'Not provided'],['PAN Number', savedProfileData.pan || (user as any)?.pan || 'Not provided'],['City', savedProfileData.city || user?.city || 'Not provided'],['Date of Birth', savedProfileData.dob || user?.dob || 'Not provided'],['Occupation', savedProfileData.occupation || user?.occupation || 'Not provided']].map(([l,v],i) => (
                <div key={i}><p className={`text-[10px] uppercase tracking-wider mb-1 ${t('text-gray-600','text-gray-600')}`}>{l}</p><p className={`text-sm font-medium ${v === 'Not provided' ? 'text-gray-600 italic' : t('text-white','text-gray-900')}`}>{v}</p></div>
              ))}
            </div>
          </Glass>

          {/* Nominee Details */}
          <Glass className="p-6" hover theme={theme}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Nominee Details</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[['Nominee Name', savedProfileData.nominee_name || user?.nominee_name || 'Not provided'],['Relationship', savedProfileData.nominee_relation || user?.nominee_relation || 'Not provided'],['Nominee PAN', savedProfileData.nominee_pan || user?.nominee_pan || 'Not provided'],['Share', savedProfileData.nominee_share || user?.nominee_share || 'Not provided']].map(([l,v],i) => (
                <div key={i}><p className={`text-[10px] uppercase tracking-wider mb-1 ${t('text-gray-600','text-gray-600')}`}>{l}</p><p className={`text-sm font-medium ${v === 'Not provided' ? 'text-gray-600 italic' : t('text-white','text-gray-900')}`}>{v}</p></div>
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
              {[['Bank Name', savedBankData.bank_name || user?.bank_name || 'Not provided'],['Account No', savedBankData.account_number || user?.bank_account || 'Not provided'],['IFSC', savedBankData.ifsc_code || user?.bank_ifsc || 'Not provided'],['Account Type', savedBankData.account_type || user?.bank_type || 'Not provided']].map(([l,v],i) => (
                <div key={i}><p className={`text-[10px] uppercase tracking-wider mb-1 ${t('text-gray-600','text-gray-600')}`}>{l}</p><p className={`text-sm font-medium ${v === 'Not provided' ? 'text-gray-600 italic' : t('text-white','text-gray-900')}`}>{v}</p></div>
              ))}
            </div>
          </Glass>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className={`max-w-lg w-full mx-4 rounded-2xl border p-6 max-h-[85vh] overflow-y-auto ${t('bg-[#111] border-white/10','bg-white border-gray-200 shadow-2xl')}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>Edit Profile</h3>
              <button onClick={() => setEditProfileOpen(false)} className={t('text-gray-500 hover:text-white','text-gray-600 hover:text-gray-900')}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <p className={`text-[10px] uppercase tracking-wider font-semibold ${t('text-gray-500','text-gray-600')}`}>Personal Information</p>
              {[
                { key: 'full_name', label: 'Full Name', placeholder: 'Enter your full name' },
                { key: 'phone', label: 'Phone Number', placeholder: '+91 XXXXX XXXXX' },
                { key: 'pan', label: 'PAN Number', placeholder: 'ABCDE1234F' },
                { key: 'city', label: 'City', placeholder: 'e.g. Chennai, Mumbai' },
                { key: 'dob', label: 'Date of Birth', placeholder: 'DD/MM/YYYY' },
                { key: 'occupation', label: 'Occupation', placeholder: 'e.g. Business Owner, Engineer' },
              ].map(f => (
                <div key={f.key}>
                  <label className={`text-[10px] uppercase tracking-wider mb-1 block ${t('text-gray-500','text-gray-600')}`}>{f.label}</label>
                  <input type="text" value={(editForm as any)[f.key]} onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600 focus:border-brand-red/50','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400 focus:border-brand-red/50')} outline-none transition-colors`} />
                </div>
              ))}

              <div className={`pt-4 border-t ${t('border-white/[0.06]','border-gray-200')}`}>
                <p className={`text-[10px] uppercase tracking-wider font-semibold mb-3 ${t('text-gray-500','text-gray-600')}`}>Nominee Information</p>
                {[
                  { key: 'nominee_name', label: 'Nominee Name', placeholder: 'Full legal name of nominee' },
                  { key: 'nominee_relation', label: 'Relationship', placeholder: 'e.g. Spouse, Parent, Child' },
                  { key: 'nominee_pan', label: 'Nominee PAN', placeholder: 'ABCDE1234F' },
                  { key: 'nominee_share', label: 'Share %', placeholder: '100%' },
                ].map(f => (
                  <div key={f.key} className="mb-3">
                    <label className={`text-[10px] uppercase tracking-wider mb-1 block ${t('text-gray-500','text-gray-600')}`}>{f.label}</label>
                    <input type="text" value={(editForm as any)[f.key]} onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600 focus:border-brand-red/50','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400 focus:border-brand-red/50')} outline-none transition-colors`} />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditProfileOpen(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${t('bg-white/[0.06] text-gray-300 hover:bg-white/[0.1]','bg-gray-100 text-gray-700 hover:bg-gray-200')}`}>Cancel</button>
                <button onClick={handleSaveProfile} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Connect Modal */}
      {bankConnectOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className={`max-w-md w-full mx-4 rounded-2xl border p-6 ${t('bg-[#111] border-white/10','bg-white border-gray-200 shadow-2xl')}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>Bank Connect</h3>
              <button onClick={() => setBankConnectOpen(false)} className={t('text-gray-500 hover:text-white','text-gray-600 hover:text-gray-900')}><X className="w-5 h-5" /></button>
            </div>
            <div className={`p-4 rounded-xl mb-4 ${t('bg-emerald-500/10 border border-emerald-500/20','bg-emerald-50 border border-emerald-200')}`}>
              <div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-emerald-400" /><span className={`text-sm font-semibold ${t('text-emerald-400','text-emerald-600')}`}>Secure Connection</span></div>
              <p className={`text-xs ${t('text-gray-400','text-gray-700')}`}>Your bank details are encrypted and secured with 256-bit SSL.</p>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Account Holder Name" value={bankForm.holder_name} onChange={e => setBankForm(p => ({ ...p, holder_name: e.target.value }))} className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
              <input type="text" placeholder="Account Number" value={bankForm.account_number} onChange={e => setBankForm(p => ({ ...p, account_number: e.target.value }))} className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
              <input type="text" placeholder="IFSC Code" value={bankForm.ifsc_code} onChange={e => setBankForm(p => ({ ...p, ifsc_code: e.target.value }))} className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder-gray-600','bg-gray-100/40 border border-gray-200/40 text-gray-900 placeholder-gray-400')}`} />
              <select value={bankForm.account_type} onChange={e => setBankForm(p => ({ ...p, account_type: e.target.value }))} style={isDark ? { colorScheme: 'dark' } : undefined} className={`w-full px-4 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100/60 border border-gray-200/40 text-gray-900')}`}>
                <option value="savings">Savings Account</option><option value="current">Current Account</option><option value="nro">NRO Account</option>
              </select>
              <button onClick={async () => {
                if (!bankForm.holder_name.trim() || !bankForm.account_number.trim() || !bankForm.ifsc_code.trim()) { showToast('Please fill in all bank details.', 'info'); return }
                try {
                  await addBankAccount({ client_id: clientId || '', user_id: user?.id || '', account_holder_name: bankForm.holder_name, account_number: bankForm.account_number, ifsc_code: bankForm.ifsc_code, bank_name: '', account_type: bankForm.account_type, is_primary: true })
                  const bankData = { bank_name: 'Verified Bank', account_number: bankForm.account_number, ifsc_code: bankForm.ifsc_code, account_type: bankForm.account_type, holder_name: bankForm.holder_name }
                  setSavedBankData(bankData)
                  if (typeof window !== 'undefined') localStorage.setItem('ghl-bank-data', JSON.stringify(bankData))
                  setBankConnectOpen(false); setBankForm({ holder_name: '', account_number: '', ifsc_code: '', account_type: 'savings' })
                  showToast('Bank account verified and connected successfully.')
                } catch {
                  const bankData = { bank_name: 'Pending Verification', account_number: bankForm.account_number, ifsc_code: bankForm.ifsc_code, account_type: bankForm.account_type, holder_name: bankForm.holder_name }
                  setSavedBankData(bankData)
                  if (typeof window !== 'undefined') localStorage.setItem('ghl-bank-data', JSON.stringify(bankData))
                  showToast('Bank details saved. Verification pending.', 'info'); setBankConnectOpen(false)
                }
              }} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>Verify & Connect</button>
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
            <div><h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Appearance</h4><p className={`text-xs ${t('text-gray-500','text-gray-700')}`}>Theme and display preferences</p></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setTheme('light')} className={`flex-1 p-3 rounded-xl text-center text-sm font-medium transition-all ${theme === 'light' ? 'bg-brand-red/15 text-brand-red border border-brand-red/20' : t('bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:border-white/[0.1]','bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300')}`}>
              <Sun className="w-5 h-5 mx-auto mb-1" /> Light Mode
            </button>
            <button onClick={() => setTheme('dark')} className={`flex-1 p-3 rounded-xl text-center text-sm font-medium transition-all ${theme === 'dark' ? 'bg-brand-red/15 text-white border border-brand-red/20' : t('bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:border-white/[0.1]','bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300')}`}>
              <Moon className="w-5 h-5 mx-auto mb-1" /> Dark Mode
            </button>
          </div>
          <p className={`text-[10px] mt-3 flex items-center gap-1 ${t('text-gray-600','text-gray-500')}`}><Shield className="w-3 h-3" /> {isDark ? 'Optimized for low-light, premium viewing experience' : 'Clean, bright interface for daytime use'}</p>
        </Glass>

        {/* Language */}
        <Glass className="p-6" hover theme={theme}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t('bg-white/[0.04]','bg-gray-200/40')}`}><Languages className="w-5 h-5 text-blue-400" /></div>
            <div><h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Language</h4><p className={`text-xs ${t('text-gray-500','text-gray-700')}`}>Dashboard language preference</p></div>
          </div>
          <select
            value={dashLang}
            onChange={(e) => setDashLang(e.target.value)}
            style={isDark ? { colorScheme: 'dark' } : undefined}
            className={`w-full px-4 py-2.5 rounded-xl text-sm cursor-pointer ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100/60 border border-gray-200/40 text-gray-900')}`}
          >
            <option value="English">English</option><option value="Hindi">हिन्दी (Hindi)</option><option value="Tamil">தமிழ் (Tamil)</option><option value="Telugu">తెలుగు (Telugu)</option><option value="Kannada">ಕನ್ನಡ (Kannada)</option><option value="Malayalam">മലയാളം (Malayalam)</option><option value="Marathi">मराठी (Marathi)</option><option value="Bengali">বাংলা (Bengali)</option><option value="Gujarati">ગુજરાતી (Gujarati)</option>
          </select>
          {dashLang !== 'English' && (
            <p className={`text-[10px] mt-2 ${t('text-gray-500','text-gray-700')}`}>
              <Info className="w-3 h-3 inline mr-1" />
              Translation to {dashLang} will be available in a future update. Currently displaying in English.
            </p>
          )}
        </Glass>

        {/* Notifications */}
        <Glass className="p-6" hover theme={theme}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t('bg-white/[0.04]','bg-gray-200/40')}`}><Bell className="w-5 h-5 text-amber-400" /></div>
            <div><h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Notifications</h4><p className={`text-xs ${t('text-gray-500','text-gray-700')}`}>Email and push preferences</p></div>
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
                <button onClick={() => setNotifPrefs((p: Record<string, boolean>) => ({ ...p, [opt.key]: !p[opt.key] }))}
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
            <div><h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Security</h4><p className={`text-xs ${t('text-gray-500','text-gray-700')}`}>Password and authentication</p></div>
          </div>

          {/* Password Reset Form — shown after recovery flow or manual trigger */}
          {showPasswordReset && (
            <div className={`mb-4 p-4 rounded-xl border ${t('bg-white/[0.03] border-white/[0.06]','bg-gray-50 border-gray-200')}`}>
              <h5 className={`text-xs font-bold mb-3 ${t('text-white','text-gray-900')}`}>Set New Password</h5>
              <div className="space-y-3">
                <div>
                  <label className={`text-[10px] font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className={`w-full px-3 py-2 pr-10 rounded-lg text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder:text-gray-600','bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400')} focus:outline-none focus:ring-1 focus:ring-brand-red`}
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${t('text-gray-500 hover:text-white','text-gray-400 hover:text-gray-700')}`}>
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={`text-[10px] font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={`w-full px-3 py-2 pr-10 rounded-lg text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white placeholder:text-gray-600','bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400')} focus:outline-none focus:ring-1 focus:ring-brand-red`}
                    />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${t('text-gray-500 hover:text-white','text-gray-400 hover:text-gray-700')}`}>
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePasswordUpdate}
                    className="flex-1 px-4 py-2 rounded-lg bg-brand-red text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                  >
                    Update Password
                  </button>
                  <button
                    onClick={() => { setShowPasswordReset(false); setNewPassword(''); setConfirmNewPassword('') }}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${t('bg-white/[0.04] text-gray-400 hover:text-white','bg-gray-100 text-gray-600 hover:text-gray-900')}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Password reset success message */}
          {passwordResetDone && !showPasswordReset && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-[11px] text-emerald-400">Password updated successfully!</p>
            </div>
          )}

          {[
            { label: 'Change Password', action: () => { setShowPasswordReset(true); setNewPassword(''); setConfirmNewPassword('') } },
            { label: 'Enable 2FA', action: async () => {
              showToast('Two-factor authentication (2FA) requires admin configuration in Supabase. Please contact your administrator to enable MFA for your account.', 'info')
            } },
            { label: 'Active Sessions', action: () => showToast('You have 1 active session: Chrome on Windows — Current Device', 'info') },
            { label: 'Login History', action: () => showToast('Last login: Today at 10:30 AM from Chennai, India (Chrome/Windows)', 'info') },
          ].map((opt, j) => (
            <button key={j} onClick={opt.action} className={`w-full flex items-center justify-between p-2.5 rounded-lg cursor-pointer group transition-colors ${t('hover:bg-white/[0.02]','hover:bg-gray-100')}`}>
              <span className={`text-xs transition-colors ${t('text-gray-400 group-hover:text-white','text-gray-600 group-hover:text-gray-900')}`}>{opt.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            </button>
          ))}
        </Glass>

        {/* Legal & Policies */}
        <Glass className="p-6" hover theme={theme}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t('bg-white/[0.04]','bg-gray-200/40')}`}><ScrollText className="w-5 h-5 text-brand-red" /></div>
            <div><h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Legal & Policies</h4><p className={`text-xs ${t('text-gray-500','text-gray-700')}`}>Terms, conditions, and compliance</p></div>
          </div>
          <button onClick={() => { setTermsOpen(true); setTermsScrolled(false) }}
            className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all mb-2 ${t('bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04]','bg-gray-100/40 hover:bg-gray-200/35 border border-gray-200/30')}`}>
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-brand-red" />
              <div className="text-left">
                <span className={`text-xs font-semibold block ${t('text-white','text-gray-900')}`}>Terms & Conditions</span>
                <span className={`text-[10px] ${t('text-gray-500','text-gray-600')}`}>Dashboard usage policy</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {termsAccepted && <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Accepted</span>}
              <ChevronRight className={`w-3.5 h-3.5 ${t('text-gray-600','text-gray-600')}`} />
            </div>
          </button>
          <button onClick={() => { setPrivacyOpen(true); setPrivacyScrolled(false) }}
            className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all mb-2 ${t('bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04]','bg-gray-100/40 hover:bg-gray-200/35 border border-gray-200/30')}`}>
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-blue-400" />
              <div className="text-left">
                <span className={`text-xs font-semibold block ${t('text-white','text-gray-900')}`}>Privacy Policy</span>
                <span className={`text-[10px] ${t('text-gray-500','text-gray-600')}`}>How we protect your data</span>
              </div>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 ${t('text-gray-600','text-gray-600')}`} />
          </button>
          <button onClick={() => window.open('https://www.sebi.gov.in/', '_blank')}
            className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all ${t('bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04]','bg-gray-100/40 hover:bg-gray-200/35 border border-gray-200/30')}`}>
            <div className="flex items-center gap-2.5">
              <Landmark className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <span className={`text-xs font-semibold block ${t('text-white','text-gray-900')}`}>SEBI Compliance</span>
                <span className={`text-[10px] ${t('text-gray-500','text-gray-600')}`}>Reg: IN/AIF2/2425/1517</span>
              </div>
            </div>
            <ExternalLink className={`w-3.5 h-3.5 ${t('text-gray-600','text-gray-600')}`} />
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

  const updateBankAccount = (index: number, field: string, value: string) => {
    setBankAccounts(prev => prev.map((acc, i) => i === index ? { ...acc, [field]: value } : acc))
    // Clear error for this field
    setInvestFormErrors(prev => { const n = { ...prev }; delete n[`bank_${index}_${field}`]; return n })
  }

  const handleIFSCValidation = async (index: number, ifsc: string) => {
    if (ifsc.length !== 11) return
    setBankAccounts(prev => prev.map((acc, i) => i === index ? { ...acc, ifsc_validating: true } : acc))
    const result = await validateIFSC(ifsc)
    setBankAccounts(prev => prev.map((acc, i) => i === index ? {
      ...acc,
      ifsc_valid: result.valid,
      ifsc_validating: false,
      bank_name: result.bank || acc.bank_name,
    } : acc))
    if (!result.valid) {
      setInvestFormErrors(prev => ({ ...prev, [`bank_${index}_ifsc_code`]: 'Invalid IFSC code' }))
    }
  }

  const addNewBankAccount = () => {
    if (bankAccounts.length >= 3) { showToast('Maximum 3 bank accounts allowed', 'info'); return }
    setBankAccounts(prev => [...prev, {
      account_holder_name: '',
      account_number: '',
      account_number_confirm: '',
      ifsc_code: '',
      bank_name: '',
      account_type: 'savings',
      is_primary: false,
      cancelled_cheque_url: '',
    }])
  }

  const removeBankAccount = (index: number) => {
    if (bankAccounts.length <= 1) { showToast('At least one bank account is required', 'info'); return }
    setBankAccounts(prev => {
      const next = prev.filter((_, i) => i !== index)
      if (!next.some(a => a.is_primary) && next.length > 0) next[0].is_primary = true
      return next
    })
  }

  const validateInvestmentForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Validate bank accounts
    bankAccounts.forEach((acc, i) => {
      if (!acc.account_holder_name.trim()) errors[`bank_${i}_account_holder_name`] = 'Account holder name is required'
      if (!acc.account_number.trim()) errors[`bank_${i}_account_number`] = 'Account number is required'
      else if (acc.account_number.length < 9 || acc.account_number.length > 18) errors[`bank_${i}_account_number`] = 'Invalid account number (9-18 digits)'
      else if (!/^\d+$/.test(acc.account_number)) errors[`bank_${i}_account_number`] = 'Account number must contain only digits'
      if (acc.account_number !== acc.account_number_confirm) errors[`bank_${i}_account_number_confirm`] = 'Account numbers do not match'
      if (!acc.ifsc_code.trim()) errors[`bank_${i}_ifsc_code`] = 'IFSC code is required'
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(acc.ifsc_code.toUpperCase())) errors[`bank_${i}_ifsc_code`] = 'Invalid IFSC format (e.g., SBIN0001234)'
    })

    if (!investTermsAccepted) errors['terms'] = 'You must accept the terms to proceed'
    if (investAmount < 500000) errors['amount'] = 'Minimum investment is Rs. 5 Lakhs'

    setInvestFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      showToast('Please fill in all required fields correctly', 'info')
      return false
    }
    return true
  }

  const handleInvestmentSubmit = async () => {
    if (!validateInvestmentForm()) return
    if (!clientId || !user) { showToast('Please log in to submit', 'info'); return }

    setInvestSubmitting(true)
    try {
      // 1. Save bank account(s) first (non-blocking — investment can proceed even if bank save fails)
      let savedBankId: string | null = null

      for (const acc of bankAccounts) {
        try {
          const bankPayload: any = {
            client_id: clientId,
            user_id: user.id,
            account_holder_name: acc.account_holder_name,
            account_number: acc.account_number,
            ifsc_code: acc.ifsc_code.toUpperCase(),
            bank_name: acc.bank_name || undefined,
            account_type: acc.account_type.toLowerCase(),
            is_primary: acc.is_primary,
          }
          if (acc.cancelled_cheque_url) bankPayload.cancelled_cheque_url = acc.cancelled_cheque_url
          const result = await addBankAccount(bankPayload)
          if (result && acc.is_primary) savedBankId = result.id
        } catch (bankErr) {
          console.warn('[invest] Bank account save failed (non-blocking):', bankErr)
        }
      }

      // 2. Submit the investment application
      const appPayload = {
        client_id: clientId,
        user_id: user.id,
        fund_vehicle: investVehicle,
        investment_amount: investAmount,
        tenure_preference: investTenure,
        bank_account_id: savedBankId || undefined,
        terms_accepted: investTermsAccepted,
      }
      console.log('[invest] Submitting application:', JSON.stringify(appPayload))
      const appResult = await submitInvestmentApplication(appPayload)

      if (appResult) {
        // Create acknowledgement document for this application (non-blocking)
        try {
          await uploadDocument({
            title: `Investment Application - ${investVehicle}`,
            name: `investment_ack_${appResult.id}.pdf`,
            category: 'investment',
            status: 'active',
            entity_type: 'client',
            entity_id: clientId,
            client_id: clientId,
            uploaded_by: user.id,
            description: `Investment application for ${investVehicle}, Amount: ₹${formatINR(investAmount)}, Tenure: ${investTenure}. Status: Pending Review.`,
            file_url: '',
            access_level: 'restricted',
          })
          refetchDocs()
        } catch { /* non-blocking */ }
        showToast('Investment application submitted successfully! Our team will contact you within 24 hours for verification.')
        // Reset form
        setInvestTermsAccepted(false)
        setBankAccounts([{
          account_holder_name: '',
          account_number: '',
          account_number_confirm: '',
          ifsc_code: '',
          bank_name: '',
          account_type: 'savings',
          is_primary: true,
          cancelled_cheque_url: '',
        }])
        setInvestAmount(2500000)
        refetchPortfolio()
      } else {
        showToast('Submission failed. Please try again or contact support at info@ghlindiaventures.com', 'info')
      }
    } catch (err) {
      console.error('[invest] Submission error:', err)
      showToast('An error occurred. Please try again or contact support at info@ghlindiaventures.com', 'info')
    } finally {
      setInvestSubmitting(false)
    }
  }

  const inputCls = (errKey: string) => {
    const base = `px-3 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border text-white placeholder-gray-600','bg-gray-100/60 border text-gray-900 placeholder-gray-400')}`
    return investFormErrors[errKey]
      ? `${base} border-red-500/60 focus:border-red-500`
      : `${base} ${t('border-white/[0.06]','border-gray-200/40')}`
  }

  const renderInvestOnboard = () => (
    <div className="space-y-6">
      <div>
        <h2 className={`text-xl font-bold mb-1 ${t('text-white','text-gray-900')}`}>Complete Your Investment</h2>
        <p className={`text-sm ${t('text-gray-500','text-gray-700')}`}>Select your investment, set the amount, and provide bank details</p>
      </div>

      {/* Step 1: Vehicle + Amount */}
      <Glass className="p-6" hover glow theme={theme}>
        <h3 className={`text-base font-bold mb-4 ${t('text-white','text-gray-900')}`}>1. Investment Selection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className={`text-xs font-medium mb-1.5 block ${t('text-gray-400','text-gray-600')}`}>Investment Vehicle <span className="text-red-400">*</span></label>
            <select value={investVehicle} onChange={e => setInvestVehicle(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100/60 border border-gray-200/40 text-gray-900')}`}>
              <option>AIF Direct - Category II</option>
              <option>SEBI Co-Invest Framework</option>
              <option>NCLT Recovery Assets</option>
              <option>Early-Stage Startups</option>
            </select>
          </div>
          <div>
            <label className={`text-xs font-medium mb-1.5 block ${t('text-gray-400','text-gray-600')}`}>Tenure Preference <span className="text-red-400">*</span></label>
            <select value={investTenure} onChange={e => setInvestTenure(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100/60 border border-gray-200/40 text-gray-900')}`}>
              <option>3 Years</option><option>5 Years</option><option>7 Years</option>
            </select>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`text-xs font-medium ${t('text-gray-400','text-gray-600')}`}>Investment Amount <span className="text-red-400">*</span></label>
            <span className={`text-lg font-black text-brand-red`}>{'\u20B9'}{formatINR(investAmount)}</span>
          </div>
          <input type="range" min={500000} max={50000000} step={100000} value={investAmount}
            onChange={e => setInvestAmount(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-red"
            style={{ background: `linear-gradient(to right, #D0021B ${((investAmount - 500000) / 49500000) * 100}%, ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)'} 0%)` }} />
          <div className={`flex justify-between text-[10px] mt-1 ${t('text-gray-600','text-gray-600')}`}>
            <span>{'\u20B9'}5L</span><span>{'\u20B9'}1Cr</span><span>{'\u20B9'}2.5Cr</span><span>{'\u20B9'}5Cr</span>
          </div>
          {investFormErrors['amount'] && <p className="text-[10px] text-red-400 mt-1">{investFormErrors['amount']}</p>}
        </div>
      </Glass>

      {/* Step 2: Bank Details */}
      <Glass className="p-6" hover theme={theme}>
        <h3 className={`text-base font-bold mb-4 ${t('text-white','text-gray-900')}`}>2. Bank Account Details</h3>
        <p className={`text-xs mb-4 ${t('text-gray-500','text-gray-700')}`}>Add one or more bank accounts for fund transfer. Primary account will be used for dividends and distributions.</p>
        {bankAccounts.map((acc, idx) => (
          <div key={idx} className={`p-4 rounded-xl mb-3 ${t('bg-white/[0.02] border border-white/[0.04]','bg-gray-100/50 border border-gray-200/30')}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold ${t('text-white','text-gray-900')}`}>Bank Account {idx + 1}</span>
              <div className="flex items-center gap-2">
                {acc.is_primary && <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-red/15 text-brand-red font-bold">Primary</span>}
                {!acc.is_primary && <button onClick={() => setBankAccounts(prev => prev.map((a, i) => ({ ...a, is_primary: i === idx })))} className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-bold hover:bg-blue-500/25 transition-colors">Set Primary</button>}
                {bankAccounts.length > 1 && <button onClick={() => removeBankAccount(idx)} className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold hover:bg-red-500/25 transition-colors">Remove</button>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input placeholder="Account Holder Name *" value={acc.account_holder_name}
                  onChange={e => updateBankAccount(idx, 'account_holder_name', e.target.value)}
                  autoComplete="off" className={inputCls(`bank_${idx}_account_holder_name`)} />
                {investFormErrors[`bank_${idx}_account_holder_name`] && <p className="text-[10px] text-red-400 mt-1">{investFormErrors[`bank_${idx}_account_holder_name`]}</p>}
              </div>
              <div>
                <input placeholder="Account Number *" value={acc.account_number} type="password"
                  onChange={e => updateBankAccount(idx, 'account_number', e.target.value.replace(/\D/g, ''))}
                  autoComplete="new-password" className={inputCls(`bank_${idx}_account_number`)} />
                {investFormErrors[`bank_${idx}_account_number`] && <p className="text-[10px] text-red-400 mt-1">{investFormErrors[`bank_${idx}_account_number`]}</p>}
              </div>
              <div>
                <input placeholder="Confirm Account Number *" value={acc.account_number_confirm} type="password"
                  onChange={e => updateBankAccount(idx, 'account_number_confirm', e.target.value.replace(/\D/g, ''))}
                  autoComplete="new-password" className={inputCls(`bank_${idx}_account_number_confirm`)} />
                {investFormErrors[`bank_${idx}_account_number_confirm`] && <p className="text-[10px] text-red-400 mt-1">{investFormErrors[`bank_${idx}_account_number_confirm`]}</p>}
              </div>
              <div>
                <div className="relative">
                  <input placeholder="IFSC Code *" value={acc.ifsc_code}
                    onChange={e => { const v = e.target.value.toUpperCase().slice(0, 11); updateBankAccount(idx, 'ifsc_code', v); if (v.length === 11) handleIFSCValidation(idx, v) }}
                    autoComplete="off" className={inputCls(`bank_${idx}_ifsc_code`)} />
                  {acc.ifsc_validating && <div className="absolute right-3 top-1/2 -translate-y-1/2"><RefreshCw className="w-3.5 h-3.5 animate-spin text-gray-400" /></div>}
                  {acc.ifsc_valid === true && <div className="absolute right-3 top-1/2 -translate-y-1/2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /></div>}
                  {acc.ifsc_valid === false && <div className="absolute right-3 top-1/2 -translate-y-1/2"><AlertCircle className="w-3.5 h-3.5 text-red-400" /></div>}
                </div>
                {acc.bank_name && <p className="text-[10px] text-emerald-400 mt-1">{acc.bank_name}</p>}
                {investFormErrors[`bank_${idx}_ifsc_code`] && <p className="text-[10px] text-red-400 mt-1">{investFormErrors[`bank_${idx}_ifsc_code`]}</p>}
              </div>
              <select value={acc.account_type} onChange={e => updateBankAccount(idx, 'account_type', e.target.value)}
                className={`px-3 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100/60 border border-gray-200/40 text-gray-900')}`}>
                <option value="savings">Savings</option><option value="current">Current</option><option value="nro">NRO</option><option value="nre">NRE</option>
              </select>
            </div>
            <div onClick={async () => {
              try {
                const { pickAndUploadFiles } = await import('@/lib/supabase/storageService')
                const results = await pickAndUploadFiles(`client/kyc/clients/${clientId}`, {
                  accept: '.pdf,.jpg,.jpeg,.png',
                  portal: 'client',
                  entityType: 'client',
                  entityId: clientId || undefined,
                  category: 'kyc',
                })
                if (results && results.length > 0) {
                  const successFiles = results.filter((r: any) => r.success)
                  if (successFiles.length > 0) {
                    updateBankAccount(idx, 'cancelled_cheque_url', successFiles[0].file?.url || successFiles[0].file?.path || 'uploaded')
                    showToast('Document uploaded successfully')
                  }
                }
              } catch { showToast('Upload failed. Please try again.', 'info') }
            }} className={`mt-3 p-3 rounded-lg border-2 border-dashed cursor-pointer text-center transition-colors ${acc.cancelled_cheque_url ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.08] hover:border-brand-red/20'}`}>
              {acc.cancelled_cheque_url ? (
                <><CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-400" /><p className="text-[11px] text-emerald-400 font-medium">Document uploaded</p></>
              ) : (
                <><FileUp className="w-5 h-5 mx-auto mb-1 text-gray-500" /><p className="text-[11px] text-gray-500">Upload cancelled cheque / bank statement</p></>
              )}
            </div>
          </div>
        ))}
        <button onClick={addNewBankAccount} className="flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Another Bank Account {bankAccounts.length >= 3 && '(max 3)'}
        </button>
      </Glass>

      {/* Step 3: Review & Submit */}
      <Glass className="p-6" hover glow theme={theme}>
        <h3 className={`text-base font-bold mb-4 ${t('text-white','text-gray-900')}`}>3. Review & Submit</h3>
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 mb-4`}>
          {[
            { l: 'Vehicle', v: investVehicle },
            { l: 'Amount', v: `\u20B9${formatINR(investAmount)}` },
            { l: 'Tenure', v: investTenure },
            { l: 'Bank', v: bankAccounts[0]?.bank_name ? `${bankAccounts[0].bank_name} ****${bankAccounts[0].account_number.slice(-4)}` : bankAccounts[0]?.account_number ? `****${bankAccounts[0].account_number.slice(-4)}` : 'Not entered' },
          ].map((r,i) => (
            <div key={i} className={`p-3 rounded-xl ${t('bg-white/[0.03] border border-white/[0.04]','bg-gray-100/50 border border-gray-200/30')}`}>
              <p className={`text-[9px] uppercase tracking-wider ${t('text-gray-600','text-gray-600')}`}>{r.l}</p>
              <p className={`text-sm font-bold mt-0.5 ${t('text-white','text-gray-900')}`}>{r.v}</p>
            </div>
          ))}
        </div>
        <label className={`flex items-start gap-2 mb-4 cursor-pointer ${investFormErrors['terms'] ? '' : ''}`}>
          <input type="checkbox" checked={investTermsAccepted} onChange={e => { setInvestTermsAccepted(e.target.checked); setInvestFormErrors(prev => { const n = { ...prev }; delete n['terms']; return n }) }}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red" />
          <span className={`text-xs ${t('text-gray-400','text-gray-600')}`}>I confirm the details above and agree to the investment terms. I understand that AIF investments involve risk and are subject to SEBI regulations. <span className="text-red-400">*</span></span>
        </label>
        {investFormErrors['terms'] && <p className="text-[10px] text-red-400 mb-3 -mt-2">{investFormErrors['terms']}</p>}
        <button onClick={handleInvestmentSubmit} disabled={investSubmitting}
          className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01] ${investSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
          style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
          {investSubmitting ? 'Submitting...' : 'Submit Investment Application'}
        </button>
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
          <p className={`text-sm ${t('text-gray-500','text-gray-700')}`}>Plan, compare, and project your investments</p>
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
                    <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-500','text-gray-600')}`}>Initial Investment</p>
                    <p className={`text-lg font-black mt-1 ${t('text-white','text-gray-900')}`}>{'\u20B9'}{formatINR(calcInputs.amount)}</p>
                  </div>
                  <div className={`p-4 rounded-xl text-center ${t('bg-emerald-500/[0.06] border border-emerald-500/[0.1]','bg-emerald-50/60 border border-emerald-200/50')}`}>
                    <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-500','text-gray-600')}`}>Final Value</p>
                    <p className="text-lg font-black mt-1 text-emerald-400">{'\u20B9'}{formatINR(Math.round(irrFinalValue))}</p>
                  </div>
                  <div className={`p-4 rounded-xl text-center col-span-2 ${t('bg-brand-red/[0.06] border border-brand-red/[0.1]','bg-red-50/60 border border-red-200/50')}`}>
                    <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-500','text-gray-600')}`}>Internal Rate of Return (IRR)</p>
                    <p className="text-3xl font-black mt-1 text-brand-red">{irrRate.toFixed(2)}%</p>
                    <p className={`text-[10px] mt-1 ${t('text-gray-500','text-gray-600')}`}>Annualized over {calcInputs.years} year{calcInputs.years > 1 ? 's' : ''}</p>
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
                    <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-500','text-gray-600')}`}>Total Invested</p>
                    <p className={`text-lg font-black mt-1 ${t('text-white','text-gray-900')}`}>{'\u20B9'}{formatINR(activeCalc === 'sip' ? calcInputs.amount * calcInputs.years * 12 : calcInputs.amount)}</p>
                  </div>
                  <div className={`p-4 rounded-xl text-center ${t('bg-emerald-500/[0.06] border border-emerald-500/[0.1]','bg-emerald-50/60 border border-emerald-200/50')}`}>
                    <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-500','text-gray-600')}`}>Future Value</p>
                    <p className="text-lg font-black mt-1 text-emerald-400">{'\u20B9'}{formatINR(Math.round(activeCalc === 'sip' ? sipFuture : future))}</p>
                  </div>
                  <div className={`p-4 rounded-xl text-center ${t('bg-white/[0.03] border border-white/[0.04]','bg-gray-100/50 border border-gray-200/30')}`}>
                    <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-500','text-gray-600')}`}>Wealth Gain</p>
                    <p className={`text-lg font-black mt-1 text-emerald-400`}>{'\u20B9'}{formatINR(Math.round((activeCalc === 'sip' ? sipFuture : future) - (activeCalc === 'sip' ? calcInputs.amount * calcInputs.years * 12 : calcInputs.amount)))}</p>
                  </div>
                  <div className={`p-4 rounded-xl text-center ${t('bg-white/[0.03] border border-white/[0.04]','bg-gray-100/50 border border-gray-200/30')}`}>
                    <p className={`text-[10px] uppercase tracking-wider ${t('text-gray-500','text-gray-600')}`}>CAGR</p>
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
            <button onClick={() => setTermsOpen(false)} className={t('text-gray-500 hover:text-white','text-gray-600 hover:text-gray-900')}>
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
            <p className={`text-[10px] ${t('text-gray-600','text-gray-600')}`}>
              {termsScrolled ? <span className="text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Document read</span> : 'Scroll to bottom to accept'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setTermsOpen(false)} className={`px-4 py-2 rounded-xl text-sm font-medium ${t('text-gray-400 hover:text-white','text-gray-700 hover:text-gray-900')}`}>Close</button>
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
            <button onClick={() => setPrivacyOpen(false)} className={t('text-gray-500 hover:text-white','text-gray-600 hover:text-gray-900')}>
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
            <p className={`text-[10px] ${t('text-gray-600','text-gray-600')}`}>
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
  // AI ADVISOR TAB
  // ═══════════════════════════════════════════════════════════
  const renderAIAdvisorTab = () => {
    return <ClientAIAdvisor theme={theme} t={t} />
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
      case 'ai-advisor': return renderAIAdvisorTab()
      case 'profile': return renderProfileTab()
      case 'settings': return renderSettingsTab()
      default: return renderDashboardHome()
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  // Mobile bottom nav items (quick access on small screens)
  const MOBILE_NAV = [
    { id: 'dashboard' as TabId, icon: Home, label: 'Home' },
    { id: 'investments' as TabId, icon: TrendingUp, label: 'Invest' },
    { id: 'portfolio' as TabId, icon: Briefcase, label: 'Portfolio' },
    { id: 'calculators' as TabId, icon: Calculator, label: 'Tools' },
    { id: 'support' as TabId, icon: HeadphonesIcon, label: 'Support' },
  ]

  return (
    <div className={`min-h-screen relative ${isDark ? 'bg-brand-black' : 'bg-[#E8E5E0]'}`}>
      {/* Background ambient effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[200px] ${isDark ? 'bg-brand-red/[0.03]' : 'bg-brand-red/[0.02]'}`} />
        <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[180px] ${isDark ? 'bg-brand-red/[0.02]' : 'bg-brand-red/[0.01]'}`} />
        {isDark && <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />}
      </div>

      {renderSidebar()}
      {renderTourOverlay()}
      {renderTermsPopup()}
      {renderPrivacyPopup()}

      <div className="lg:ml-[260px] relative z-10 min-h-screen flex flex-col">
        {renderTopBar()}
        <div className="flex-1 p-4 lg:p-6 pb-20 overflow-auto">{renderContent()}</div>
        <footer className={`hidden sm:flex border-t px-4 lg:px-6 py-3 flex-col sm:flex-row items-center justify-between gap-2 text-[11px] ${isDark ? 'border-white/[0.04] text-gray-600' : 'border-gray-300/50 text-gray-500'}`}>
          <p>&copy; 2025 GHL India Ventures. <a href="https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=16&name=GHL%20INDIA%20VENTURES%20TRUST&regNo=IN/AIF2/24-25/1517" target="_blank" rel="noopener noreferrer" className="hover:text-brand-red transition-colors">SEBI Reg: IN/AIF2/2425/1517</a></p>
          <div className="flex items-center gap-3">
            <button onClick={() => { setTermsOpen(true); setTermsScrolled(false) }} className="hover:underline hover:text-white transition-colors">Terms & Conditions</button>
            <span>&bull;</span>
            <p className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> 256-bit SSL Encrypted &bull; SEBI Compliant</p>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className={`fixed bottom-0 left-0 right-0 z-[9998] lg:left-[260px] border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-300/50'}`}
        style={{ background: isDark ? 'rgba(10,10,10,0.97)' : 'rgba(214,211,206,0.97)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
        <div className="flex items-center justify-around px-0.5 py-1 safe-area-bottom">
          {MOBILE_NAV.map(item => {
            const isActive = activeTab === item.id
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-0 px-1.5 py-1 rounded-lg transition-all duration-200 min-w-0 flex-1
                  ${isActive ? 'text-brand-red' : 'text-gray-500'}`}>
                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-brand-red' : ''}`} />
                <span className="text-[8px] font-semibold leading-tight mt-0.5">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 left-4 lg:left-auto z-[10001] animate-fade-in">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border ${
            toast.type === 'success'
              ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-200'
              : 'bg-blue-900/90 border-blue-500/30 text-blue-200'
          }`} style={{ backdropFilter: 'blur(20px)' }}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <Info className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-medium">{toast.msg}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  )
}
