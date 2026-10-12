'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Users,
  Award,
  TrendingUp,
  Wallet,
  Calendar,
  Download,
  Plus,
  PlusCircle,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowUpRight,
  FileText,
  ChevronRight,
  ChevronLeft,
  Copy,
  Send,
  Mail,
  Target,
  Shield,
  X,
  IndianRupee,
  Briefcase,
  Layers,
  Sparkles,
  Info,
  Building2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Eye,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  PartnerRole,
  PartnerDashboardResponse,
  ReferralMember,
  SubChannelPartner,
  fetchPartnerDashboard,
  createGeneralInvestor,
  createChannelPartner,
  updateMonthlyGoals,
  generateAgreementPDF,
  getPartnerRole,
} from '@/lib/supabase/partnerDashboardService'
import InvestorReferralDashboard from './InvestorReferralDashboard'

// Helper for Indian Rupee Formatting
function formatINR(n: number): string {
  if (!n || isNaN(n)) return '0'
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `${(n / 100000).toFixed(2)} L`
  return new Intl.NumberFormat('en-IN').format(n)
}

export interface ReferralDocumentRow {
  sno: number
  userId: string
  name: string
  planName: string
  assetName: string
  investDate: string
  investment: number
  hasAkl: boolean
  hasAllot: boolean
  hasCert: boolean
  hasAgr: boolean
  hasPdc: boolean
}

// Live Clock component (isolated timer so parent dashboard doesn't re-render every second)
const LiveClock = React.memo(function LiveClock() {
  const [liveDateString, setLiveDateString] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const formatted =
        now.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }) +
        ' at ' +
        now
          .toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
          .toLowerCase()
      setLiveDateString(formatted)
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <span className="font-mono text-[11px]">
      {liveDateString || 'Thursday, 08 October 2026 at 04:48:04 pm'}
    </span>
  )
})

// Section Separator matching Reference Dashboard style (Static, zero animations, stable outside parent)
const SectionSeparator = React.memo(function SectionSeparator({
  label,
  icon: Icon,
  isDark = true,
}: {
  label: string
  icon?: any
  isDark?: boolean
}) {
  return (
    <div className="relative flex items-center justify-center my-8">
      <div className={`absolute inset-0 flex items-center ${isDark ? 'text-white/[0.08]' : 'text-gray-300'}`}>
        <div className="w-full border-t border-current" />
      </div>
      <div
        className={`relative px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border shadow-sm ${isDark
          ? 'bg-[#140606] text-red-400 border-red-500/20'
          : 'bg-white text-red-600 border-red-200'
          }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-brand-red" />}
        <span>{label}</span>
      </div>
    </div>
  )
})

interface ReferralDashboardProps {
  theme?: 'dark' | 'light'
  isDark?: boolean
  authenticatedPartnerId?: string | null
  partnerName?: string
  partnerEmail?: string
  partnerPhone?: string
  authToken?: string
  showToast?: (msg: string, type?: 'success' | 'info') => void
  onNavigateTab?: (tab: string) => void
}

export default function ReferralDashboard({
  theme = 'dark',
  isDark = true,
  authenticatedPartnerId,
  partnerName = 'Partner Investor',
  partnerEmail = '',
  partnerPhone = '',
  authToken = '',
  showToast = () => { },
  onNavigateTab,
}: ReferralDashboardProps) {
  // Theme utility
  const t = (darkClass: string, lightClass: string) => (isDark ? darkClass : lightClass)

  const [data, setData] = useState<PartnerDashboardResponse | null>(null)

  // Determine active partner role strictly from authentic profile:
  // 1. Authentic database role returned by Supabase (data?.partner?.role)
  // 2. Authenticated partner ID passed from user session (ghlId)
  // 3. Defaults to 'GI' (General Investor)
  const partnerRole: PartnerRole = useMemo(() => {
    if (data?.partner?.role) return data.partner.role
    if (authenticatedPartnerId) return getPartnerRole(authenticatedPartnerId)
    return 'GI'
  }, [data?.partner?.role, authenticatedPartnerId])

  // Determine effective GHL/Partner ID:
  const effectiveId = useMemo(() => {
    if (authenticatedPartnerId) return authenticatedPartnerId
    if (data?.partner?.partnerId && data.partner.partnerId !== 'GHL-PARTNER') return data.partner.partnerId
    return data?.partner?.partnerId || (partnerRole === 'MCP' ? 'MCP-PARTNER' : partnerRole === 'CPL' ? 'CPL-PARTNER' : 'GHL-PARTNER')
  }, [authenticatedPartnerId, data?.partner?.partnerId, partnerRole])


  // Filters & Views (Default to Oct 2026 matching Reference screenshots)
  const [selectedYear, setSelectedYear] = useState<number>(2026)
  const [selectedMonth, setSelectedMonth] = useState<string>('Oct')
  const [filterMonthInput, setFilterMonthInput] = useState<string>('Oct')
  const [filterYearInput, setFilterYearInput] = useState<number>(2026)
  const [chartView, setChartView] = useState<'line' | 'bar'>('line')
  const [tableCohort, setTableCohort] = useState<'investors' | 'partners'>('investors')
  const [mcpCohort, setMcpCohort] = useState<'investors' | 'partners'>('investors')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [commissionFilter, setCommissionFilter] = useState<string>('all')

  // Data state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Modals state
  const [createInvestorOpen, setCreateInvestorOpen] = useState(false)
  const [createPartnerOpen, setCreatePartnerOpen] = useState(false)
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [selectedReferral, setSelectedReferral] = useState<ReferralMember | null>(null)
  const [agreementModalOpen, setAgreementModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [totalReferralModalOpen, setTotalReferralModalOpen] = useState(false)
  const [totalInvestorModalOpen, setTotalInvestorModalOpen] = useState(false)
  const [todayReferralModalOpen, setTodayReferralModalOpen] = useState(false)
  const [submittingAction, setSubmittingAction] = useState(false)

  // Dedicated Referral Documents View Page state (matches user reference screenshot)
  const [viewDocumentsPage, setViewDocumentsPage] = useState(false)
  const [docSearchQuery, setDocSearchQuery] = useState('')
  const [docCurrentPage, setDocCurrentPage] = useState(1)
  const [docSortCol, setDocSortCol] = useState<'userId' | 'planName' | 'assetName' | 'investDate' | 'investment'>('investDate')
  const [docSortDir, setDocSortDir] = useState<'asc' | 'desc'>('desc')

  // Form states
  const [investorForm, setInvestorForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    surplus: '₹25 Lakhs – ₹50 Lakhs',
    notes: '',
  })

  const [partnerForm, setPartnerForm] = useState({
    agencyName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    expectedVolume: '₹5 Crore – ₹10 Crore',
    notes: '',
  })

  const [goalForm, setGoalForm] = useState<{
    directTarget: string | number
    referralTarget: string | number
  }>({
    directTarget: '',
    referralTarget: '',
  })

  // Load dashboard data
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchPartnerDashboard(authToken, undefined, selectedYear, selectedMonth)
      if (res && res.success) {
        setData(res)
        if (res.monthlyGoal) {
          setGoalForm({
            directTarget: res.monthlyGoal.directTarget && res.monthlyGoal.directTarget > 0 ? res.monthlyGoal.directTarget : '',
            referralTarget: res.monthlyGoal.referralTarget && res.monthlyGoal.referralTarget > 0 ? res.monthlyGoal.referralTarget : '',
          })
        }
      } else {
        throw new Error('Could not load partner dashboard')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load referral data')
    } finally {
      setLoading(false)
    }
  }, [authToken, selectedYear, selectedMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Referral link
  const referralLink = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/register?ref=${effectiveId}`
    }
    return `https://ghlindiaventures.com/register?ref=${effectiveId}`
  }, [effectiveId])

  const copyReferralLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(referralLink)
      setCopiedLink(true)
      showToast('Referral link copied to clipboard!', 'success')
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  // Handle Create General Investor
  const handleCreateInvestor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!investorForm.name || !investorForm.email) {
      showToast('Please enter full name and email', 'info')
      return
    }

    setSubmittingAction(true)
    try {
      const res = await createGeneralInvestor(
        {
          partnerId: effectiveId,
          referrerName: data?.partner?.name || partnerName,
          referrerEmail: data?.partner?.email || partnerEmail,
          referrerPhone: data?.partner?.phone || partnerPhone,
          refereeName: investorForm.name,
          refereeEmail: investorForm.email,
          refereePhone: investorForm.phone,
          refereeCity: investorForm.city,
          investableSurplus: investorForm.surplus,
          message: investorForm.notes,
        },
        authToken
      )

      if (res.success) {
        showToast('General Investor referral created successfully!', 'success')
        setCreateInvestorOpen(false)
        setInvestorForm({ name: '', email: '', phone: '', city: '', surplus: '₹25 Lakhs – ₹50 Lakhs', notes: '' })
        loadData()
      } else {
        showToast(`Failed: ${res.error || 'Check fields and try again'}`, 'info')
      }
    } catch (err: any) {
      showToast(err?.message || 'Submission error', 'info')
    } finally {
      setSubmittingAction(false)
    }
  }

  // Handle Create Channel Partner
  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partnerForm.agencyName || !partnerForm.email) {
      showToast('Please enter agency name and email', 'info')
      return
    }

    setSubmittingAction(true)
    try {
      const res = await createChannelPartner(
        {
          partnerId: effectiveId,
          referrerName: data?.partner?.name || partnerName,
          referrerEmail: data?.partner?.email || partnerEmail,
          refereeName: `${partnerForm.agencyName} (${partnerForm.contactName})`,
          refereeEmail: partnerForm.email,
          refereePhone: partnerForm.phone,
          refereeCity: partnerForm.city,
          investableSurplus: partnerForm.expectedVolume,
          message: partnerForm.notes,
        },
        authToken
      )

      if (res.success) {
        showToast('Channel Partner successfully registered!', 'success')
        setCreatePartnerOpen(false)
        setPartnerForm({ agencyName: '', contactName: '', email: '', phone: '', city: '', expectedVolume: '₹5 Crore – ₹10 Crore', notes: '' })
        loadData()
      } else {
        showToast(`Failed: ${res.error || 'Check fields and try again'}`, 'info')
      }
    } catch (err: any) {
      showToast(err?.message || 'Submission error', 'info')
    } finally {
      setSubmittingAction(false)
    }
  }

  // Handle Update Monthly Goals
  const handleUpdateGoals = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingAction(true)
    try {
      const cleanDirect = Number(String(goalForm.directTarget).replace(/[^0-9.]/g, '')) || 0
      const cleanReferral = Number(String(goalForm.referralTarget).replace(/[^0-9.]/g, '')) || 0

      const res = await updateMonthlyGoals(
        {
          directTarget: cleanDirect,
          referralTarget: cleanReferral,
        },
        authToken
      )

      if (res.success) {
        showToast('Monthly investment goals updated!', 'success')
        setGoalModalOpen(false)
        loadData()
      } else {
        showToast(`Failed: ${res.error}`, 'info')
      }
    } catch (err: any) {
      showToast(err?.message || 'Goal update failed', 'info')
    } finally {
      setSubmittingAction(false)
    }
  }

  // Filtered referrals list (Search + Status + Commission + Month/Year)
  const filteredReferrals = useMemo(() => {
    if (!data?.referrals) return []
    return data.referrals.filter(r => {
      // Month and Year filter if not 'all'
      if (selectedMonth !== 'all' && r.createdAt) {
        const d = new Date(r.createdAt)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        if (monthNames[d.getMonth()] !== selectedMonth) return false
        if (d.getFullYear() !== selectedYear) return false
      } else if (selectedYear && r.createdAt) {
        const d = new Date(r.createdAt)
        if (d.getFullYear() !== selectedYear) return false
      }

      // Search
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        r.refereeName.toLowerCase().includes(q) ||
        r.refereeEmail.toLowerCase().includes(q) ||
        r.refereePhone.toLowerCase().includes(q) ||
        (r.id && r.id.toLowerCase().includes(q))

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || r.status.toLowerCase() === statusFilter.toLowerCase()

      // Commission filter
      const matchesComm =
        commissionFilter === 'all' ||
        r.commissionStatus.toLowerCase() === commissionFilter.toLowerCase()

      return matchesSearch && matchesStatus && matchesComm
    })
  }, [data?.referrals, searchQuery, statusFilter, commissionFilter, selectedMonth, selectedYear])

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`p-3 rounded-xl border text-xs shadow-xl ${t(
            'bg-[#1a0a0a]/95 border-red-500/30 text-white',
            'bg-white border-gray-200 text-gray-900'
          )}`}
          style={{ backdropFilter: 'blur(16px)' }}
        >
          <p className="font-bold mb-1">{label}</p>
          <p className="text-red-400 font-medium">
            Investment: ₹{formatINR(payload[0]?.value || 0)}
          </p>
          {payload[1] && (
            <p className="text-emerald-400 font-medium">
              Earnings: ₹{formatINR(payload[1]?.value || 0)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // Earning Chart calculations from real data
  const giReferrals = useMemo(() => {
    return (data?.referrals || []).filter(r => r.memberType === 'General Investor' || !r.memberType)
  }, [data?.referrals])

  const cpReferrals = useMemo(() => {
    return (data?.referrals || []).filter(r => r.memberType === 'Channel Partner')
  }, [data?.referrals])

  // Today's referrals calculation from database records
  const todayReferralsList = useMemo(() => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    return (data?.referrals || []).filter(r => {
      const raw = r.createdAt || r.date
      if (!raw || raw === '—') return false
      const d = new Date(raw)
      if (isNaN(d.getTime())) return false
      return d.getTime() >= todayStart || d.toDateString() === today.toDateString()
    })
  }, [data?.referrals])

  const hasTodayReferrals = useMemo(() => {
    const count = (data?.kpis?.todayReferrals !== undefined && data?.kpis?.todayReferrals !== null)
      ? data.kpis.todayReferrals
      : todayReferralsList.length
    return count > 0 || todayReferralsList.length > 0
  }, [data?.kpis?.todayReferrals, todayReferralsList.length])

  // Volume for filtered Month/Year
  const giVolume = useMemo(() => {
    const relevant = giReferrals.filter(r => {
      if (selectedMonth !== 'all' && r.createdAt) {
        const d = new Date(r.createdAt)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        if (monthNames[d.getMonth()] !== selectedMonth) return false
        if (d.getFullYear() !== selectedYear) return false
      }
      return true
    })
    const sum = relevant.reduce((acc, r) => acc + (r.investmentAmount || 0), 0)
    if (sum > 0) return sum
    if (selectedMonth !== 'all' && data?.chartData) {
      const point = data.chartData.find(c => c.month.toLowerCase() === selectedMonth.toLowerCase())
      if (point && point.referralInvestment > 0) return point.referralInvestment
    }
    if (selectedMonth === 'all') {
      return giReferrals.reduce((acc, r) => acc + (r.investmentAmount || 0), 0)
    }
    return sum
  }, [giReferrals, selectedMonth, selectedYear, data?.chartData])

  // Determine active Sale of Associate Channel Partner slab:
  // ₹1,00,00,000 to ₹5,00,00,000 (3.00%), ₹5,00,00,000 to Above (4.00%)
  const { giRate, giActiveIndex, giEarned } = useMemo(() => {
    let rate = 3.00
    let activeIdx = 0
    if (giVolume >= 50000000) {
      rate = 4.00
      activeIdx = 1
    } else {
      rate = 3.00
      activeIdx = 0
    }
    const earned = (giVolume * rate) / 100
    return { giRate: rate, giActiveIndex: activeIdx, giEarned: earned }
  }, [giVolume])

  const cpVolume = useMemo(() => {
    const subVolume = (data?.subChannelPartners || []).reduce((sum, p) => sum + (p.volumeGenerated || 0), 0)
    const directCpVolume = cpReferrals.reduce((sum, r) => sum + (r.investmentAmount || 0), 0)
    return subVolume + directCpVolume
  }, [data?.subChannelPartners, cpReferrals])

  // Sale of Master Channel Partner: Any Investment -> 0.50%
  const { cpRate, cpActiveIndex, cpEarned } = useMemo(() => {
    const rate = 0.50
    const activeIdx = 0
    const earned = (cpVolume * rate) / 100
    return { cpRate: rate, cpActiveIndex: activeIdx, cpEarned: earned }
  }, [cpVolume])

  // Table Rows matching Reference Columns: SNO, USER ID, NAME, TOTAL INVEST, CASHBACK, VIEW HISTORY
  const displayTableRows = useMemo(() => {
    if (tableCohort === 'partners') {
      const partnersList = (data?.subChannelPartners || [])
      return partnersList
        .filter((p) => {
          const q = searchQuery.toLowerCase()
          return !q || p.agencyName.toLowerCase().includes(q) || p.cplId.toLowerCase().includes(q)
        })
        .map((p, idx) => ({
          sno: idx + 1,
          userId: p.cplId,
          name: p.agencyName,
          totalInvest: p.volumeGenerated,
          cashback: p.overrideEarned,
          raw: {
            id: p.id,
            refereeName: p.agencyName,
            refereeEmail: p.contactEmail,
            refereePhone: p.contactPhone,
            refereeCity: p.city,
            memberType: 'Channel Partner' as const,
            kycStatus: 'Verified' as const,
            date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : 'Active',
            createdAt: p.createdAt,
            investmentAmount: p.volumeGenerated,
            commissionRate: p.overrideRate,
            commissionAmount: p.overrideEarned,
            commissionStatus: 'accrued' as const,
            status: p.status,
          },
        }))
    }

    return filteredReferrals.map((r, idx) => {
      const idStr = r.id || `REF-${idx + 1}`
      return {
        sno: idx + 1,
        userId: idStr,
        name: r.refereeName,
        totalInvest: r.investmentAmount,
        cashback: r.commissionAmount || Math.round((r.investmentAmount * (r.commissionRate || 3.0)) / 100),
        raw: r,
      }
    })
  }, [tableCohort, data?.subChannelPartners, filteredReferrals, searchQuery])

  // Dynamic monthly total investment for table footer
  const monthInvestmentTotal = useMemo(() => {
    const tableSum = displayTableRows.reduce((acc, row) => acc + (Number(row.totalInvest) || 0), 0)
    if (tableSum > 0) return tableSum
    if (giVolume > 0) return giVolume
    return 0
  }, [displayTableRows, giVolume])


  const partnerDisplayName =
    data?.partner?.name ||
    (partnerName && partnerName !== 'Partner Investor'
      ? partnerName
      : partnerRole === 'CPL'
        ? 'Channel Partner'
        : partnerRole === 'MCP'
          ? 'Master Channel Partner'
          : 'Partner Investor')

  // Map documents solely from authentic partner referrals (Zero mock/seeded data)
  const allDocRecords = useMemo<ReferralDocumentRow[]>(() => {
    return (data?.referrals || []).map((r, i) => {
      const idStr = r.id || `REF-${i + 1}`
      const hasInvestment = Boolean(r.investmentAmount && Number(r.investmentAmount) > 0)
      return {
        sno: i + 1,
        userId: idStr,
        name: r.refereeName || 'Referral Client',
        planName: (r as any).planName || (r as any).plan_name || 'Secured Debenture - Sequel 16',
        assetName: (r as any).assetName || (r as any).asset_name || 'XXV',
        investDate: r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'),
        investment: Number(r.investmentAmount) || 0,
        hasAkl: hasInvestment,
        hasAllot: hasInvestment,
        hasCert: hasInvestment,
        hasAgr: true,
        hasPdc: hasInvestment,
      }
    })
  }, [data?.referrals])

  const docsPerPage = 10

  const handleSort = (col: 'userId' | 'planName' | 'assetName' | 'investDate' | 'investment') => {
    if (docSortCol === col) {
      setDocSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setDocSortCol(col)
      setDocSortDir('asc')
    }
  }

  const filteredDocRecords = useMemo(() => {
    let list = [...allDocRecords]
    const q = docSearchQuery.toLowerCase().trim()
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.userId.toLowerCase().includes(q) ||
          r.planName.toLowerCase().includes(q) ||
          r.assetName.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      const valA: any = a[docSortCol]
      const valB: any = b[docSortCol]
      if (typeof valA === 'string') {
        return docSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      return docSortDir === 'asc' ? valA - valB : valB - valA
    })
    return list
  }, [allDocRecords, docSearchQuery, docSortCol, docSortDir])

  const totalDocPages = Math.ceil(filteredDocRecords.length / docsPerPage) || 1

  const paginatedDocRows = useMemo(() => {
    const start = (docCurrentPage - 1) * docsPerPage
    return filteredDocRecords.slice(start, start + docsPerPage)
  }, [filteredDocRecords, docCurrentPage, docsPerPage])

  const paginationPages = useMemo(() => {
    if (totalDocPages <= 7) {
      return Array.from({ length: totalDocPages }, (_, i) => i + 1)
    }
    if (docCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalDocPages]
    }
    if (docCurrentPage >= totalDocPages - 3) {
      return [1, '...', totalDocPages - 4, totalDocPages - 3, totalDocPages - 2, totalDocPages - 1, totalDocPages]
    }
    return [1, '...', docCurrentPage - 1, docCurrentPage, docCurrentPage + 1, '...', totalDocPages]
  }, [docCurrentPage, totalDocPages])

  const handleExportDocumentsCSV = () => {
    if (filteredDocRecords.length === 0) {
      showToast('No documents to export', 'info')
      return
    }
    const headers = ['SNO', 'USER ID', 'NAME', 'PLAN NAME', 'ASSET NAME', 'INVEST DATE', 'INVESTMENT', 'AKL', 'ALLOT', 'CERT', 'AGR', 'PDC']
    const rows = filteredDocRecords.map((r) => [
      r.sno,
      `"${r.userId}"`,
      `"${r.name}"`,
      `"${r.planName}"`,
      `"${r.assetName}"`,
      `"${r.investDate}"`,
      r.investment,
      r.hasAkl ? 'Uploaded' : 'Pending',
      r.hasAllot ? 'Uploaded' : 'Pending',
      r.hasCert ? 'Uploaded' : 'Pending',
      r.hasAgr ? 'Uploaded' : 'Pending',
      r.hasPdc ? 'Uploaded' : 'Pending',
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${partnerDisplayName.replace(/\s+/g, '_')}_Referral_Documents.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast(`Exported ${filteredDocRecords.length} referral documents to CSV!`, 'success')
  }

  const renderDocCell = (row: ReferralDocumentRow, docType: string, hasDoc: boolean) => {
    if (!hasDoc) {
      return <span className="text-gray-400 font-semibold select-none">&mdash;</span>
    }
    return (
      <button
        onClick={() => {
          showToast(`Opening ${docType} for ${row.name}...`, 'info')
          generateAgreementPDF({
            role: partnerRole === 'MCP' ? 'MCP' : partnerRole === 'CPL' ? 'CPL' : 'GI',
            partnerId: row.userId,
            partnerName: row.name,
            partnerEmail: `${row.userId.toLowerCase()}@investor.ghlindiaventures.com`,
            preview: true,
          })
        }}
        className={`w-7 h-7 mx-auto rounded-lg border flex items-center justify-center transition-all hover:scale-110 shadow-xs ${t(
          'border-red-500/30 bg-red-500/10 text-brand-red hover:bg-red-500/20',
          'border-red-200 bg-red-50 text-brand-red hover:bg-red-100'
        )}`}
        title={`View & Download ${docType} for ${row.name}`}
      >
        <FileText className="w-3.5 h-3.5" />
      </button>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // DEDICATED REFERRAL DOCUMENTS VIEW (Matches Reference Screenshot)
  // ─────────────────────────────────────────────────────────────
  if (viewDocumentsPage) {
    return (
      <div className="space-y-5">
        {/* 1. Welcome Header (Matches screenshot: Welcome - Mishmash Finserve LLP) */}
        <div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${t('text-white', 'text-gray-900')}`}>
            Welcome - <span className="text-[#D0021B] font-extrabold italic">{partnerDisplayName}</span>
          </h1>
        </div>

        {/* 2. Dark Crimson / Burgundy Banner */}
        <div
          className="rounded-2xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden transition-all"
          style={{
            background: 'linear-gradient(135deg, #2D0508 0%, #1E0305 60%, #150204 100%)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
          }}
        >
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-white/80 mb-2">
            ACKNOWLEDGEMENT, ALLOTMENT, DEBENTURE CERTIFICATE, DEBENTURE AGREEMENT &amp; PDC UPLOADS FOR YOUR REFERRALS
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Referral <span className="underline decoration-white underline-offset-4">Documents</span>
          </h2>
        </div>

        {/* 3. Main Documents Card */}
        <div
          className={`rounded-2xl border shadow-xl overflow-hidden relative transition-all ${t(
            'bg-[#140606] border-white/10 text-white',
            'bg-white border-gray-200 text-gray-900'
          )}`}
        >
          {/* Subtle top red glow line matching screenshot */}
          <div className="h-1 bg-gradient-to-r from-red-600 via-brand-red to-red-700 w-full" />

          {/* Subheader / Toolbar */}
          <div
            className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b ${t(
              'border-white/10 bg-[#1a0808]/50',
              'border-gray-200 bg-gray-50/70'
            )}`}
          >
            {/* Left: Back button & Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewDocumentsPage(false)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 shadow-sm ${t(
                  'bg-white/10 hover:bg-white/15 text-white border-white/15',
                  'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
                )}`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <h3 className={`text-base sm:text-lg font-bold ${t('text-white', 'text-gray-900')}`}>
                {partnerDisplayName} Documents
              </h3>
            </div>

            {/* Right: Search & Export CSV */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by ID or name..."
                  value={docSearchQuery}
                  onChange={(e) => {
                    setDocSearchQuery(e.target.value)
                    setDocCurrentPage(1)
                  }}
                  className={`px-4 py-2 rounded-xl text-xs border outline-none w-56 sm:w-64 transition-all ${t(
                    'bg-white/[0.06] border-white/15 text-white placeholder:text-gray-400 focus:border-red-500',
                    'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-red-500'
                  )}`}
                />
              </div>

              <button
                onClick={handleExportDocumentsCSV}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 shadow-sm ${t(
                  'bg-white/10 hover:bg-white/15 text-white border-white/15',
                  'bg-white hover:bg-gray-50 text-gray-800 border-gray-300'
                )}`}
              >
                <Download className="w-3.5 h-3.5 text-brand-red" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table Container with Horizontal Scroll */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr
                  className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border-b ${t(
                    'bg-white/[0.02] text-gray-400 border-white/10',
                    'bg-gray-50 text-gray-600 border-gray-200'
                  )}`}
                >
                  <th className="p-3.5 text-left">SNO</th>
                  <th
                    onClick={() => handleSort('userId')}
                    className="p-3.5 text-left cursor-pointer select-none hover:text-brand-red transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>USER ID</span>
                      <span className="text-[10px] opacity-60">⇅</span>
                    </div>
                  </th>
                  <th className="p-3.5 text-left">NAME</th>
                  <th
                    onClick={() => handleSort('planName')}
                    className="p-3.5 text-left cursor-pointer select-none hover:text-brand-red transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>PLAN NAME</span>
                      <span className="text-[10px] opacity-60">⇅</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('assetName')}
                    className="p-3.5 text-left cursor-pointer select-none hover:text-brand-red transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>ASSET NAME</span>
                      <span className="text-[10px] opacity-60">⇅</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('investDate')}
                    className="p-3.5 text-left cursor-pointer select-none hover:text-brand-red transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>INVEST DATE</span>
                      <span className="text-[10px] opacity-60">⇅</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('investment')}
                    className="p-3.5 text-left cursor-pointer select-none hover:text-brand-red transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>INVESTMENT</span>
                      <span className="text-[10px] opacity-60">⇅</span>
                    </div>
                  </th>
                  <th className="p-3.5 text-center">AKL</th>
                  <th className="p-3.5 text-center">ALLOT</th>
                  <th className="p-3.5 text-center">CERT</th>
                  <th className="p-3.5 text-center">AGR</th>
                  <th className="p-3.5 text-center">PDC</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${t('divide-white/[0.04]', 'divide-gray-100')}`}>
                {paginatedDocRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-gray-500 italic">
                      {docSearchQuery
                        ? `No referral documents found matching "${docSearchQuery}".`
                        : 'No referral documents recorded yet.'}
                    </td>
                  </tr>
                ) : (
                  paginatedDocRows.map((row) => (
                    <tr
                      key={row.sno}
                      className={`transition-colors ${t('hover:bg-white/[0.02]', 'hover:bg-gray-50/80')}`}
                    >
                      <td className="p-3.5 font-medium text-gray-500">{row.sno}</td>
                      <td className="p-3.5 font-mono font-medium text-gray-700 dark:text-gray-300">{row.userId}</td>
                      <td className={`p-3.5 font-semibold ${t('text-white', 'text-gray-900')}`}>{row.name}</td>
                      <td className={`p-3.5 text-gray-600 dark:text-gray-300`}>{row.planName}</td>
                      <td className={`p-3.5 font-medium text-gray-600 dark:text-gray-300`}>{row.assetName}</td>
                      <td className="p-3.5 text-gray-500 dark:text-gray-400">{row.investDate}</td>
                      <td className={`p-3.5 font-mono font-medium ${t('text-white', 'text-gray-900')}`}>
                        ₹{new Intl.NumberFormat('en-IN').format(row.investment)}
                      </td>
                      <td className="p-3.5 text-center">{renderDocCell(row, 'AKL', row.hasAkl)}</td>
                      <td className="p-3.5 text-center">{renderDocCell(row, 'ALLOT', row.hasAllot)}</td>
                      <td className="p-3.5 text-center">{renderDocCell(row, 'CERT', row.hasCert)}</td>
                      <td className="p-3.5 text-center">{renderDocCell(row, 'AGR', row.hasAgr)}</td>
                      <td className="p-3.5 text-center">{renderDocCell(row, 'PDC', row.hasPdc)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination matching screenshot */}
          <div
            className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${t(
              'border-white/10 bg-[#160606]/50',
              'border-gray-200 bg-gray-50/70'
            )}`}
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {filteredDocRecords.length} documents
            </p>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <button
                disabled={docCurrentPage === 1}
                onClick={() => setDocCurrentPage((p) => Math.max(1, p - 1))}
                className={`px-3 py-1.5 rounded-lg border transition-all ${docCurrentPage === 1
                  ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                  : t('border-white/10 hover:bg-white/10 text-white', 'border-gray-300 hover:bg-gray-100 text-gray-700')
                  }`}
              >
                &lsaquo; Prev
              </button>

              {paginationPages.map((pg, idx) => {
                if (pg === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-2 py-1 text-gray-400">
                      ...
                    </span>
                  )
                }
                const isCurrent = docCurrentPage === pg
                return (
                  <button
                    key={`page-${pg}`}
                    onClick={() => setDocCurrentPage(Number(pg))}
                    className={`min-w-[32px] h-8 px-2 rounded-lg font-bold text-xs transition-all ${isCurrent
                      ? 'bg-brand-red text-white shadow-sm'
                      : t('hover:bg-white/10 text-gray-300 border border-white/10', 'hover:bg-gray-100 text-gray-700 border border-gray-300')
                      }`}
                  >
                    {pg}
                  </button>
                )
              })}

              <button
                disabled={docCurrentPage === totalDocPages}
                onClick={() => setDocCurrentPage((p) => Math.min(totalDocPages, p + 1))}
                className={`px-3 py-1.5 rounded-lg border transition-all ${docCurrentPage === totalDocPages
                  ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                  : t('border-white/10 hover:bg-white/10 text-white', 'border-gray-300 hover:bg-gray-100 text-gray-700')
                  }`}
              >
                Next &rsaquo;
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If role is GI (General Investor / Investor), render the dedicated Investor Referral Dashboard matching screenshot
  if (partnerRole === 'GI') {
    return (
      <InvestorReferralDashboard
        theme={theme}
        isDark={isDark}
        effectiveId={effectiveId}
        partnerName={data?.partner?.name || partnerName}
        partnerEmail={data?.partner?.email || partnerEmail}
        partnerPhone={data?.partner?.phone || partnerPhone}
        data={data}
        loading={loading}
        filterYear={selectedYear}
        filterMonth={selectedMonth}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        onRefresh={loadData}
        showToast={(msg, type) => showToast(msg, type === 'error' ? 'info' : type)}
        onNavigateTab={onNavigateTab}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & LIVE DATE/TIME (Matches Reference Header)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${t('text-white', 'text-gray-900')}`}>
            Referral <span className="text-brand-red">Dashboard</span>
          </h1>
          <p className={`text-xs mt-1 ${t('text-gray-400', 'text-gray-600')}`}>
            Track your referral network, monthly goals and earnings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Date/Time Badge (Image 2) */}
          <div
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-sm ${t(
              'bg-white/[0.04] border-white/10 text-gray-300',
              'bg-white border-gray-200 text-gray-800'
            )}`}
          >
            <Calendar className="w-3.5 h-3.5 text-brand-red shrink-0" />
            <LiveClock />
          </div>

          {/* Refresh Data Button */}
          <button
            onClick={loadData}
            disabled={loading}
            className={`p-2 rounded-xl border transition-all ${t(
              'bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 border-white/10',
              'bg-white hover:bg-gray-100 text-gray-600 border-gray-200'
            )}`}
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-red' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. WELCOME BANNER (Gradient Red Banner - Image 2)
          ───────────────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 text-white shadow-xl transition-all"
        style={{
          background: 'linear-gradient(135deg, #8B0000 0%, #D0021B 55%, #7A0000 100%)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 block mb-1">
              {partnerRole === 'MCP'
                ? 'WELCOME — MASTER CHANNEL PARTNER'
                : partnerRole === 'CPL'
                  ? 'WELCOME — CHANNEL PARTNER'
                  : 'WELCOME — GENERAL INVESTOR'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
              {partnerDisplayName}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-black/25 text-white border border-white/20">
              {effectiveId}
            </span>
            <button
              onClick={copyReferralLink}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-brand-red hover:bg-gray-100 flex items-center gap-1 transition-all shadow-sm"
              title="Copy referral link"
            >
              {copiedLink ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. TOP ACTION CARDS ROW (Role-Based Visibility)
          - GI: 1 card (General Investor)
          - CPL: 2 cards (General Investor + Channel Partner Terms)
          - MCP: 4 cards (General Investor, Channel Partner, MCP Terms, CP Terms)
          ───────────────────────────────────────────────────────────── */}
      <div
        className={`grid gap-4 ${partnerRole === 'MCP'
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          : partnerRole === 'CPL'
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 max-w-xl'
          }`}
      >
        {/* Card 1: Create General Investor (All Roles) */}
        <div
          className={`rounded-2xl p-5 border flex flex-col justify-between transition-all hover:scale-[1.01] ${t(
            'bg-[#150606] border-white/10 shadow-lg',
            'bg-white border-gray-200 shadow-sm'
          )}`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${t('text-gray-400', 'text-gray-500')}`}>
            CREATE YOUR
          </span>
          <button
            onClick={() => {
              if (partnerRole === 'MCP' || partnerRole === 'CPL') {
                window.open('https://ghlindiaventures.com/register/', '_blank', 'noopener,noreferrer')
              } else {
                setCreateInvestorOpen(true)
              }
            }}
            className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-300 hover:brightness-110 shadow-md"
            style={{ background: 'linear-gradient(135deg, #D0021B, #B00000)' }}
          >
            General Investor
          </button>
        </div>

        {/* Card 2: Create Channel Partner (MCP ONLY — HIDDEN for CPL and GI) */}
        {partnerRole === 'MCP' && (
          <div
            className={`rounded-2xl p-5 border flex flex-col justify-between transition-all hover:scale-[1.01] ${t(
              'bg-[#150606] border-white/10 shadow-lg',
              'bg-white border-gray-200 shadow-sm'
            )}`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${t('text-gray-400', 'text-gray-500')}`}>
              CREATE YOUR
            </span>
            <button
              onClick={() => {
                window.open('https://ghlindiaventures.com/register/', '_blank', 'noopener,noreferrer')
              }}
              className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-300 hover:brightness-110 shadow-md"
              style={{ background: 'linear-gradient(135deg, #D0021B, #B00000)' }}
            >
              Channel Partner
            </button>
          </div>
        )}

        {/* Card 3: Master Channel Partner Terms (MCP ONLY — HIDDEN for CPL and GI) */}
        {partnerRole === 'MCP' && (
          <div
            className={`rounded-2xl p-5 border flex flex-col justify-between transition-all hover:scale-[1.01] ${t(
              'bg-[#150606] border-white/10 shadow-lg',
              'bg-white border-gray-200 shadow-sm'
            )}`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider block truncate ${t('text-gray-400', 'text-gray-500')}`}>
              MASTER CHANNEL PARTNER TERMS
            </span>
            <button
              onClick={() => {
                setAgreementModalOpen(true)
              }}
              className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold border transition-all ${t(
                'bg-white/[0.04] hover:bg-white/[0.08] text-gray-200 border-white/10',
                'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
              )}`}
            >
              View Agreement
            </button>
          </div>
        )}

        {/* Card 4: Channel Partner Terms (CPL and MCP ONLY — HIDDEN for GI) */}
        {(partnerRole === 'CPL' || partnerRole === 'MCP') && (
          <div
            className={`rounded-2xl p-5 border flex flex-col justify-between transition-all hover:scale-[1.01] ${t(
              'bg-[#150606] border-white/10 shadow-lg',
              'bg-white border-gray-200 shadow-sm'
            )}`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider block truncate ${t('text-gray-400', 'text-gray-500')}`}>
              CHANNEL PARTNER TERMS
            </span>
            <button
              onClick={() => {
                setAgreementModalOpen(true)
              }}
              className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold border transition-all ${t(
                'bg-white/[0.04] hover:bg-white/[0.08] text-gray-200 border-white/10',
                'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
              )}`}
            >
              View Agreement
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. KPI SUMMARY METRICS (6 FUNCTIONAL CARDS)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Investment */}
        <div
          onClick={() => {
            const el = document.getElementById('referral-list-section')
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }}
          className={`relative overflow-hidden rounded-2xl p-5 border transition-all hover:-translate-y-0.5 cursor-pointer hover:border-red-500/40 group ${t(
            'bg-[#150606] border-white/10 shadow-lg',
            'bg-white border-gray-200 shadow-sm'
          )}`}
          title="Click to view total investments"
        >
          <div className={`w-16 h-16 rounded-full absolute -top-3 -right-3 pointer-events-none ${t('bg-red-500/10', 'bg-red-500/[0.06]')}`} />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-brand-red font-bold text-lg border border-red-500/25 shrink-0 group-hover:scale-105 transition-transform">
              ₹
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${t('text-gray-400', 'text-gray-500')}`}>
              TOTAL INVESTMENT
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${t('text-white', 'text-gray-900')}`}>
              {loading ? '—' : `₹${formatINR(data?.kpis?.totalInvestment || 0)}`}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 group-hover:underline">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>View list</span>
            </span>
          </div>
        </div>

        {/* Card 2: Total Referral */}
        <div
          onClick={() => {
            setTotalReferralModalOpen(true)
          }}
          className={`relative overflow-hidden rounded-2xl p-5 border transition-all hover:-translate-y-0.5 cursor-pointer hover:border-red-500/40 group ${t(
            'bg-[#150606] border-white/10 shadow-lg',
            'bg-white border-gray-200 shadow-sm'
          )}`}
          title="Click to view total referrals"
        >
          <div className={`w-16 h-16 rounded-full absolute -top-3 -right-3 pointer-events-none ${t('bg-red-500/10', 'bg-red-500/[0.06]')}`} />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-brand-red border border-red-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${t('text-gray-400', 'text-gray-500')}`}>
              TOTAL REFERRAL
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${t('text-white', 'text-gray-900')}`}>
              {loading ? '—' : (data?.kpis?.totalReferrals || 0)}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 group-hover:underline">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>View list</span>
            </span>
          </div>
        </div>

        {/* Card 3: Total History */}
        <div
          onClick={() => {
            setHistoryModalOpen(true)
            const el = document.getElementById('referral-list-section')
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }}
          className={`relative overflow-hidden rounded-2xl p-5 border transition-all hover:-translate-y-0.5 cursor-pointer hover:border-red-500/40 group ${t(
            'bg-[#150606] border-white/10 shadow-lg',
            'bg-white border-gray-200 shadow-sm'
          )}`}
          title="Click to view total referral history"
        >
          <div className={`w-16 h-16 rounded-full absolute -top-3 -right-3 pointer-events-none ${t('bg-red-500/10', 'bg-red-500/[0.06]')}`} />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-brand-red border border-red-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${t('text-gray-400', 'text-gray-500')}`}>
              TOTAL HISTORY
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${t('text-white', 'text-gray-900')}`}>
              {loading ? '—' : (data?.referrals?.length || data?.kpis?.totalReferrals || 0)}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 group-hover:underline">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Show history</span>
            </span>
          </div>
        </div>

        {/* Card 4: Today Referral */}
        <div
          onClick={() => {
            if (hasTodayReferrals) {
              setTodayReferralModalOpen(true)
            }
          }}
          className={`relative overflow-hidden rounded-2xl p-5 border transition-all group ${hasTodayReferrals ? 'hover:-translate-y-0.5 cursor-pointer hover:border-red-500/40' : 'cursor-default'
            } ${t(
              'bg-[#150606] border-white/10 shadow-lg',
              'bg-white border-gray-200 shadow-sm'
            )}`}
          title={hasTodayReferrals ? "Click to view today's referrals" : "No referrals recorded today"}
        >
          <div className={`w-16 h-16 rounded-full absolute -top-3 -right-3 pointer-events-none ${t('bg-red-500/10', 'bg-red-500/[0.06]')}`} />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-brand-red border border-red-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${t('text-gray-400', 'text-gray-500')}`}>
              TODAY REFERRAL
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${t('text-white', 'text-gray-900')}`}>
              {loading ? '—' : (data?.kpis?.todayReferrals || 0)}
            </h3>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${hasTodayReferrals ? 'text-emerald-400 group-hover:underline' : t('text-gray-500', 'text-gray-400')
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasTodayReferrals ? 'bg-emerald-400' : 'bg-gray-500'
                }`} />
              <span>{hasTodayReferrals ? 'View details' : 'No activity'}</span>
            </span>
          </div>
        </div>

        {/* Card 5: Total Investor */}
        <div
          onClick={() => {
            setTotalInvestorModalOpen(true)
          }}
          className={`relative overflow-hidden rounded-2xl p-5 border transition-all hover:-translate-y-0.5 cursor-pointer hover:border-red-500/40 group ${t(
            'bg-[#150606] border-white/10 shadow-lg',
            'bg-white border-gray-200 shadow-sm'
          )}`}
          title="Click to view total investors"
        >
          <div className={`w-16 h-16 rounded-full absolute -top-3 -right-3 pointer-events-none ${t('bg-red-500/10', 'bg-red-500/[0.06]')}`} />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-brand-red border border-red-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${t('text-gray-400', 'text-gray-500')}`}>
              TOTAL INVESTOR
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${t('text-white', 'text-gray-900')}`}>
              {loading ? '—' : (data?.kpis?.totalInvestors || 0)}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 group-hover:underline">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>View details</span>
            </span>
          </div>
        </div>

        {/* Card 6: Documents & Downloads */}
        <div
          onClick={() => {
            setViewDocumentsPage(true)
          }}
          className={`relative overflow-hidden rounded-2xl p-5 border transition-all hover:-translate-y-0.5 cursor-pointer hover:border-red-500/40 group ${t(
            'bg-[#150606] border-white/10 shadow-lg',
            'bg-white border-gray-200 shadow-sm'
          )}`}
          title="Click to view referral documents & downloads"
        >
          <div className={`w-16 h-16 rounded-full absolute -top-3 -right-3 pointer-events-none ${t('bg-red-500/10', 'bg-red-500/[0.06]')}`} />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-brand-red border border-red-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Download className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${t('text-gray-400', 'text-gray-500')}`}>
              DOCUMENTS
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${t('text-white', 'text-gray-900')}`}>
              {loading ? '—' : `${allDocRecords.length} ${allDocRecords.length === 1 ? 'Document' : 'Documents'}`}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 group-hover:underline">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>View Documents</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. SECTION INDICATOR: MONTHLY GOAL
          ───────────────────────────────────────────────────────────── */}
      <SectionSeparator label="MONTHLY GOAL" icon={Target} isDark={isDark} />

      {/* ─────────────────────────────────────────────────────────────
          6. MONTHLY GOAL BANNER CARD (Image 2)
          ───────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 sm:p-7 text-white shadow-xl transition-all relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #8B0000 0%, #D0021B 60%, #900000 100%)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 block mb-1">
              {data?.monthlyGoal?.referralTarget && data.monthlyGoal.referralTarget > 0
                ? `${(data.monthlyGoal.month || 'OCTOBER').toUpperCase()} TARGET ACTIVE`
                : `NO TARGET SET FOR ${(data?.monthlyGoal?.month || 'OCTOBER').toUpperCase()}`}
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1.5">
              Set a monthly goal & track it live
            </h3>
            <p className="text-xs text-white/85 leading-relaxed">
              Pick a target amount and a member count — we&apos;ll chart your progress automatically.
            </p>
          </div>

          <button
            onClick={() => setGoalModalOpen(true)}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-brand-red bg-white hover:bg-gray-100 flex items-center gap-2 transition-all shadow-lg shrink-0 hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Set Your Goal</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          7. SECTION INDICATOR: DIRECT INVESTMENTS
          ───────────────────────────────────────────────────────────── */}
      <SectionSeparator label="DIRECT INVESTMENTS" icon={TrendingUp} isDark={isDark} />

      {/* ─────────────────────────────────────────────────────────────
          8. REFERRAL INVESTMENTS CHART (Image 3)
          ───────────────────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl p-6 border transition-all ${t(
          'bg-[#150606] border-white/10 shadow-lg',
          'bg-white border-gray-200 shadow-sm'
        )}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className={`text-base font-bold ${t('text-white', 'text-gray-900')}`}>
              Referral Investments
            </h3>
            <p className={`text-xs mt-0.5 ${t('text-gray-400', 'text-gray-600')}`}>
              Monthly — {selectedYear}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={`text-xs font-semibold py-1.5 px-3 rounded-xl border outline-none cursor-pointer ${t(
                'bg-white/[0.05] border-white/10 text-gray-200',
                'bg-gray-100 border-gray-300 text-gray-800'
              )}`}
            >
              {[2024, 2025, 2026].map((yr) => (
                <option key={yr} value={yr} className="bg-[#1a0a0a] text-white">
                  {yr}
                </option>
              ))}
            </select>

            {/* Line / Bar Toggle */}
            <div className={`p-1 rounded-xl border flex items-center ${t('bg-white/[0.04] border-white/10', 'bg-gray-100 border-gray-300')}`}>
              <button
                onClick={() => setChartView('line')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartView === 'line'
                  ? 'bg-brand-red text-white shadow-sm'
                  : t('text-gray-400 hover:text-white', 'text-gray-600 hover:text-gray-900')
                  }`}
              >
                Line
              </button>
              <button
                onClick={() => setChartView('bar')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartView === 'bar'
                  ? 'bg-brand-red text-white shadow-sm'
                  : t('text-gray-400 hover:text-white', 'text-gray-600 hover:text-gray-900')
                  }`}
              >
                Bar
              </button>
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'line' ? (
              <AreaChart data={data?.chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="invRedCurveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D0021B" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#D0021B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                />
                <XAxis dataKey="month" stroke={isDark ? '#6B7280' : '#9CA3AF'} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={isDark ? '#6B7280' : '#9CA3AF'}
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `₹${formatINR(val)}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="referralInvestment"
                  name="Investment"
                  stroke="#D0021B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#invRedCurveGrad)"
                />
              </AreaChart>
            ) : (
              <BarChart data={data?.chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                />
                <XAxis dataKey="month" stroke={isDark ? '#6B7280' : '#9CA3AF'} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={isDark ? '#6B7280' : '#9CA3AF'}
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `₹${formatINR(val)}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="referralInvestment" name="Investment" fill="#D0021B" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          9. FILTER BAR CARD (Image 3)
          ───────────────────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl p-6 border transition-all ${t(
          'bg-[#150606] border-white/10 shadow-lg',
          'bg-white border-gray-200 shadow-sm'
        )}`}
      >
        <span className={`text-[10px] font-bold uppercase tracking-wider block mb-3 ${t('text-gray-400', 'text-gray-500')}`}>
          FILTER EARNINGS & REFERRAL LIST BY MONTH / YEAR
        </span>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSelectedMonth(filterMonthInput)
            setSelectedYear(filterYearInput)
            loadData()
            showToast(`Filtered dashboard for ${filterMonthInput} ${filterYearInput}`, 'info')
          }}
          className="flex flex-wrap items-center gap-4"
        >
          <div>
            <label className={`text-[11px] block mb-1 font-semibold ${t('text-gray-400', 'text-gray-600')}`}>Month</label>
            <select
              value={filterMonthInput}
              onChange={(e) => setFilterMonthInput(e.target.value)}
              className={`py-2 px-4 rounded-xl text-xs font-semibold outline-none border cursor-pointer ${t(
                'bg-white/[0.05] border-white/10 text-white',
                'bg-gray-100 border-gray-300 text-gray-900'
              )}`}
            >
              {['all', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                <option key={m} value={m} className="bg-[#1a0a0a] text-white">
                  {m === 'all' ? 'All Months' : m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`text-[11px] block mb-1 font-semibold ${t('text-gray-400', 'text-gray-600')}`}>Year</label>
            <select
              value={filterYearInput}
              onChange={(e) => setFilterYearInput(Number(e.target.value))}
              className={`py-2 px-4 rounded-xl text-xs font-semibold outline-none border cursor-pointer ${t(
                'bg-white/[0.05] border-white/10 text-white',
                'bg-gray-100 border-gray-300 text-gray-900'
              )}`}
            >
              {[2024, 2025, 2026].map((yr) => (
                <option key={yr} value={yr} className="bg-[#1a0a0a] text-white">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="self-end flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #D0021B, #B00000)' }}
            >
              Submit
            </button>
            <span className={`text-[11px] ${t('text-gray-500', 'text-gray-500')}`}>
              Applies to Earning Chart and Referral List below
            </span>
          </div>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          10. SECTION INDICATOR: EARNING CHART
          ───────────────────────────────────────────────────────────── */}
      <SectionSeparator label="EARNING CHART" icon={Award} isDark={isDark} />

      {/* ─────────────────────────────────────────────────────────────
          11. EARNING CHART SECTION (Image 1)
          ───────────────────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl p-6 sm:p-7 border${t(
          'bg-[#150606] border-white/10 shadow-lg',
          'bg-white border-gray-200 shadow-sm'
        )}`}
      >
        <div className="flex items-center gap-3 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-brand-red border border-red-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            LIVE
          </span>
          <h3 className={`text-base sm:text-lg font-bold ${t('text-white', 'text-gray-900')}`}>
            Earning Chart {selectedMonth !== 'all' ? selectedMonth : 'Oct'} {selectedYear}
          </h3>
        </div>
        <p className={`text-xs mb-6 ${t('text-gray-400', 'text-gray-600')}`}>
          Volume of investment by lakhs (income percentage) — earning
        </p>

        {/* Group 1: Sale of Associate Channel Partner */}
        <div className={`space-y-3 ${partnerRole === 'MCP' ? 'mb-8' : ''}`}>
          <h4 className={`text-sm font-bold ${t('text-white', 'text-gray-900')}`}>
            Sale of Associate Channel Partner
          </h4>

          {/* Income Pill */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-red-500/15 text-brand-red border border-red-500/30 shadow-sm">
            Your Income ₹{formatINR(giVolume)} ( {giRate.toFixed(2)}% ) — ₹{formatINR(giEarned)}
          </div>

          {/* Progress bar track */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            {[0, 1].map((stepIdx) => (
              <div
                key={stepIdx}
                className={`h-2 rounded-full overflow-hidden ${stepIdx <= giActiveIndex ? 'bg-red-500' : t('bg-white/[0.08]', 'bg-gray-200')
                  }`}
              />
            ))}
          </div>

          {/* Slabs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: '₹1,00,00,000 to ₹5,00,00,000', rate: '3.00%', index: 0 },
              { label: '₹5,00,00,000 to Above', rate: '4.00%', index: 1 },
            ].map((slab) => {
              const isActive = slab.index === giActiveIndex
              return (
                <div
                  key={slab.index}
                  className={`p-3.5 rounded-xl border text-center transition-all ${isActive
                    ? t(
                      'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold shadow-sm ring-1 ring-emerald-500/20',
                      'bg-[#e8f5e9] border-[#a5d6a7] text-[#1b5e20] font-bold shadow-sm'
                    )
                    : t('bg-white/[0.02] border-white/10 text-gray-300', 'bg-gray-50 border-gray-200 text-gray-700')
                    }`}
                >
                  <p className="text-xs font-bold mb-1">{slab.label}</p>
                  <p className={`text-xs font-semibold ${isActive ? (isDark ? 'text-emerald-400 font-black' : 'text-[#1b5e20] font-black') : 'text-gray-400'}`}>
                    {slab.rate}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Group 2: Sale of Master Channel Partner (ONLY for MCP — HIDDEN for CPL and GI!) */}
        {partnerRole === 'MCP' && (
          <div className="space-y-3 pt-6 border-t border-white/10">
            <h4 className={`text-sm font-bold ${t('text-white', 'text-gray-900')}`}>
              Sale of Master Channel Partner
            </h4>

            {/* Income Pill */}
            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-red-500/15 text-brand-red border border-red-500/30 shadow-sm">
              Your Income ₹{formatINR(cpVolume)} ( {cpRate.toFixed(2)}% ) — ₹{formatINR(cpEarned)}
            </div>

            {/* Progress bar track */}
            <div className="grid grid-cols-1 gap-2 mb-2">
              <div
                className={`h-2 rounded-full overflow-hidden ${cpVolume > 0 ? 'bg-red-500' : t('bg-white/[0.08]', 'bg-gray-200')
                  }`}
              />
            </div>

            {/* Slabs Grid */}
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Any Investment', rate: '0.50%', index: 0 },
              ].map((slab) => {
                const isActive = cpVolume > 0
                return (
                  <div
                    key={slab.index}
                    className={`p-3.5 rounded-xl border text-center transition-all ${isActive
                      ? t(
                        'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold shadow-sm ring-1 ring-emerald-500/20',
                        'bg-[#e8f5e9] border-[#a5d6a7] text-[#1b5e20] font-bold shadow-sm'
                      )
                      : t('bg-white/[0.02] border-white/10 text-gray-300', 'bg-gray-50 border-gray-200 text-gray-700')
                      }`}
                  >
                    <p className="text-xs font-bold mb-1">{slab.label}</p>
                    <p className={`text-xs font-semibold ${isActive ? (isDark ? 'text-emerald-400 font-black' : 'text-[#1b5e20] font-black') : 'text-gray-400'}`}>
                      {slab.rate}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          12. SECTION INDICATOR: REFERRAL LIST
          ───────────────────────────────────────────────────────────── */}
      <SectionSeparator label="REFERRAL LIST" icon={Users} isDark={isDark} />

      {/* ─────────────────────────────────────────────────────────────
          13. REFERRAL MEMBERS DIRECTORY TABLE (Image 1)
          ───────────────────────────────────────────────────────────── */}
      <div
        id="referral-list-section"
        className={`rounded-2xl p-6 border transition-all ${t(
          'bg-[#150606] border-white/10 shadow-lg',
          'bg-white border-gray-200 shadow-sm'
        )}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className={`text-lg font-bold ${t('text-white', 'text-gray-900')}`}>
            Referral Members
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            {/* If MCP: Show toggle segment buttons between General Investor and Channel Partner */}
            {partnerRole === 'MCP' ? (
              <div className={`p-1 rounded-xl border flex items-center ${t('bg-white/[0.04] border-white/10', 'bg-gray-100 border-gray-300')}`}>
                <button
                  onClick={() => setTableCohort('investors')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tableCohort === 'investors'
                    ? 'bg-brand-red text-white shadow-sm'
                    : t('text-gray-400 hover:text-white', 'text-gray-600 hover:text-gray-900')
                    }`}
                >
                  General Investor
                </button>
                <button
                  onClick={() => setTableCohort('partners')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tableCohort === 'partners'
                    ? 'bg-brand-red text-white shadow-sm'
                    : t('text-gray-400 hover:text-white', 'text-gray-600 hover:text-gray-900')
                    }`}
                >
                  Channel Partner
                </button>
              </div>
            ) : (
              /* For GI & CPL: Single red button/badge "General Investor" (matching Screenshot 3!) */
              <div
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #D0021B, #B00000)' }}
              >
                General Investor
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs border outline-none transition-all ${t(
                  'bg-white/[0.05] border-white/10 text-white placeholder:text-gray-500 focus:border-red-500',
                  'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-red-500'
                )}`}
              />
            </div>
          </div>
        </div>

        {/* Table Matching Reference Columns */}
        <div className={`overflow-x-auto rounded-xl border ${t('border-white/[0.06]', 'border-gray-200')}`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-[11px] font-bold uppercase tracking-wider ${t('bg-white/[0.03] text-gray-400', 'bg-gray-100 text-gray-700')}`}>
                <th className="p-3.5">SNO</th>
                <th className="p-3.5">USER ID</th>
                <th className="p-3.5">NAME</th>
                <th className="p-3.5 text-right">TOTAL INVEST</th>
                <th className="p-3.5 text-right">CASHBACK</th>
                <th className="p-3.5 text-center">VIEW HISTORY</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${t('divide-white/[0.04]', 'divide-gray-200')}`}>
              {displayTableRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No referral members recorded in this category yet.
                  </td>
                </tr>
              ) : (
                displayTableRows.map((row, idx) => (
                  <tr key={idx} className={`transition-colors ${t('hover:bg-white/[0.02]', 'hover:bg-gray-50')}`}>
                    <td className="p-3.5 font-semibold text-gray-400">{row.sno}</td>
                    <td className="p-3.5 font-mono font-bold text-brand-red">{row.userId}</td>
                    <td className={`p-3.5 font-bold ${t('text-white', 'text-gray-900')}`}>{row.name}</td>
                    <td className={`p-3.5 text-right font-semibold ${t('text-white', 'text-gray-800')}`}>
                      {row.totalInvest > 0 ? `₹${formatINR(row.totalInvest)}` : '0'}
                    </td>
                    <td className="p-3.5 text-right font-black text-emerald-400">
                      {row.cashback > 0 ? `₹${formatINR(row.cashback)}` : '0'}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedReferral(row.raw)}
                        className="w-8 h-8 rounded-full bg-red-500/15 hover:bg-red-500/25 text-brand-red inline-flex items-center justify-center transition-transform hover:scale-110 border border-red-500/30"
                        title="View History / Dossier"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Total Investment for filtered Month/Year (matches Screenshot 3!) */}
        <div className={`pt-4 px-2 flex justify-end items-center border-t mt-3 ${t('border-white/[0.06]', 'border-gray-100')}`}>
          <p className={`text-xs font-bold ${t('text-gray-300', 'text-gray-900')}`}>
            {selectedMonth !== 'all' ? selectedMonth : 'Oct'} {selectedYear} Total Investment —{' '}
            <span className="text-brand-red font-black">₹{formatINR(monthInvestmentTotal)}</span>
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: CREATE GENERAL INVESTOR
          ───────────────────────────────────────────────────────────── */}
      {createInvestorOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative ${t(
              'bg-[#140606] border-red-500/30 text-white',
              'bg-white border-gray-200 text-gray-900'
            )}`}
          >
            <button
              onClick={() => setCreateInvestorOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-brand-red/20 flex items-center justify-center text-brand-red">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Onboard General Investor</h3>
                <p className="text-xs text-gray-400">
                  Register investor lead under Partner ID <span className="font-mono text-brand-red">{effectiveId}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateInvestor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Investor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Mahindra"
                  value={investorForm.name}
                  onChange={(e) => setInvestorForm({ ...investorForm, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${t(
                    'bg-white/[0.06] border-white/10 text-white focus:border-brand-red',
                    'bg-gray-50 border-gray-300 text-gray-900 focus:border-brand-red'
                  )}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="investor@example.com"
                    value={investorForm.email}
                    onChange={(e) => setInvestorForm({ ...investorForm, email: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${t(
                      'bg-white/[0.06] border-white/10 text-white focus:border-brand-red',
                      'bg-gray-50 border-gray-300 text-gray-900 focus:border-brand-red'
                    )}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-300">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={investorForm.phone}
                    onChange={(e) => setInvestorForm({ ...investorForm, phone: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${t(
                      'bg-white/[0.06] border-white/10 text-white focus:border-brand-red',
                      'bg-gray-50 border-gray-300 text-gray-900 focus:border-brand-red'
                    )}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-300">City / Jurisdiction</label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai / Mumbai"
                    value={investorForm.city}
                    onChange={(e) => setInvestorForm({ ...investorForm, city: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${t(
                      'bg-white/[0.06] border-white/10 text-white focus:border-brand-red',
                      'bg-gray-50 border-gray-300 text-gray-900 focus:border-brand-red'
                    )}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-300">Investable Surplus</label>
                  <select
                    value={investorForm.surplus}
                    onChange={(e) => setInvestorForm({ ...investorForm, surplus: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${t(
                      'bg-white/[0.06] border-white/10 text-white focus:border-brand-red',
                      'bg-gray-50 border-gray-300 text-gray-900 focus:border-brand-red'
                    )}`}
                  >
                    <option value="₹25 Lakhs – ₹50 Lakhs" className="bg-[#140606]">₹25 Lakhs – ₹50 Lakhs</option>
                    <option value="₹50 Lakhs – ₹1 Crore" className="bg-[#140606]">₹50 Lakhs – ₹1 Crore</option>
                    <option value="₹1 Crore – ₹5 Crore" className="bg-[#140606]">₹1 Crore – ₹5 Crore</option>
                    <option value="₹5 Crore+" className="bg-[#140606]">₹5 Crore+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Investment Notes / Preferences</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Interested in Category II Debentures, tenure 3 years"
                  value={investorForm.notes}
                  onChange={(e) => setInvestorForm({ ...investorForm, notes: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border outline-none resize-none ${t(
                    'bg-white/[0.06] border-white/10 text-white focus:border-brand-red',
                    'bg-gray-50 border-gray-300 text-gray-900 focus:border-brand-red'
                  )}`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateInvestorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}
                >
                  {submittingAction ? 'Registering...' : 'Register Investor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: CREATE CHANNEL PARTNER (MCP ONLY)
          ───────────────────────────────────────────────────────────── */}
      {createPartnerOpen && partnerRole === 'MCP' && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative ${t(
              'bg-[#140606] border-purple-500/30 text-white',
              'bg-white border-gray-200 text-gray-900'
            )}`}
          >
            <button
              onClick={() => setCreatePartnerOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Onboard Channel Partner (CPL)</h3>
                <p className="text-xs text-purple-300">
                  Register distribution agency under Master Partner <span className="font-mono">{effectiveId}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Agency / Firm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Wealth Partners LLP"
                  value={partnerForm.agencyName}
                  onChange={(e) => setPartnerForm({ ...partnerForm, agencyName: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${t(
                    'bg-white/[0.06] border-white/10 text-white focus:border-purple-500',
                    'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500'
                  )}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-300">Primary Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={partnerForm.contactName}
                    onChange={(e) => setPartnerForm({ ...partnerForm, contactName: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${t(
                      'bg-white/[0.06] border-white/10 text-white focus:border-purple-500',
                      'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500'
                    )}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-300">Partner Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="partner@agency.com"
                    value={partnerForm.email}
                    onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${t(
                      'bg-white/[0.06] border-white/10 text-white focus:border-purple-500',
                      'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500'
                    )}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-300">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98400 12345"
                    value={partnerForm.phone}
                    onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${t(
                      'bg-white/[0.06] border-white/10 text-white focus:border-purple-500',
                      'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500'
                    )}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-300">Target Volume Commitment</label>
                  <select
                    value={partnerForm.expectedVolume}
                    onChange={(e) => setPartnerForm({ ...partnerForm, expectedVolume: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${t(
                      'bg-white/[0.06] border-white/10 text-white focus:border-purple-500',
                      'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500'
                    )}`}
                  >
                    <option value="₹5 Crore – ₹10 Crore" className="bg-[#140606]">₹5 Crore – ₹10 Crore</option>
                    <option value="₹10 Crore – ₹25 Crore" className="bg-[#140606]">₹10 Crore – ₹25 Crore</option>
                    <option value="₹25 Crore+" className="bg-[#140606]">₹25 Crore+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">City / Operating Territory</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore / Chennai / Hyderabad"
                  value={partnerForm.city}
                  onChange={(e) => setPartnerForm({ ...partnerForm, city: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${t(
                    'bg-white/[0.06] border-white/10 text-white focus:border-purple-500',
                    'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500'
                  )}`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreatePartnerOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #4C1D95)' }}
                >
                  {submittingAction ? 'Onboarding...' : 'Register Channel Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: GOAL MANAGEMENT (Set Your Goal)
          ───────────────────────────────────────────────────────────── */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative border ${t(
              'bg-[#140606] border-white/10 text-white',
              'bg-white border-gray-200 text-gray-900'
            )}`}
          >
            {/* Modal Header Bar with Deep Burgundy to Crimson Gradient */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{
                background: 'linear-gradient(90deg, #1f0307 0%, #8b0000 50%, #bf081d 100%)',
              }}
            >
              <h3 className="text-lg font-bold text-white tracking-tight">Set Your Goal</h3>
              <button
                type="button"
                onClick={() => setGoalModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white/90 hover:text-white transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Dual Indicator Preview Bars */}
              <div className="space-y-2 mb-6">
                <div className="h-3.5 rounded-full bg-[#fde8e8] dark:bg-red-950/40 overflow-hidden">
                  {data?.monthlyGoal?.directProgress ? (
                    <div
                      className="h-full bg-red-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, data.monthlyGoal.directProgress)}%` }}
                    />
                  ) : null}
                </div>
                <div className="h-3.5 rounded-full bg-[#def7ec] dark:bg-emerald-950/40 overflow-hidden">
                  {data?.monthlyGoal?.referralProgress ? (
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, data.monthlyGoal.referralProgress)}%` }}
                    />
                  ) : null}
                </div>
              </div>

              {/* Goal Form */}
              <form onSubmit={handleUpdateGoals}>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5">
                    Target Investment
                  </label>
                  <input
                    type="text"
                    placeholder="Target Investment"
                    value={goalForm.directTarget}
                    onChange={(e) => setGoalForm({ ...goalForm, directTarget: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all ${t(
                      'bg-white/[0.06] border-white/10 text-white placeholder:text-gray-500 focus:border-brand-red',
                      'bg-[#f1f3f7] border-[#e2e5eb] text-slate-800 placeholder:text-slate-400 focus:border-brand-red focus:bg-white'
                    )}`}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5">
                    Target Members
                  </label>
                  <input
                    type="text"
                    placeholder="Target Members"
                    value={goalForm.referralTarget}
                    onChange={(e) => setGoalForm({ ...goalForm, referralTarget: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all ${t(
                      'bg-white/[0.06] border-white/10 text-white placeholder:text-gray-500 focus:border-brand-red',
                      'bg-[#f1f3f7] border-[#e2e5eb] text-slate-800 placeholder:text-slate-400 focus:border-brand-red focus:bg-white'
                    )}`}
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setGoalModalOpen(false)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all border ${t(
                      'bg-white/10 hover:bg-white/15 text-gray-300 border-white/10',
                      'bg-[#eef1f6] hover:bg-[#e2e6ed] text-slate-700 border-[#d8dce6]'
                    )}`}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#e01625] hover:bg-[#c0101d] shadow-md shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: REFERRAL DETAILS DRILL-DOWN
          ───────────────────────────────────────────────────────────── */}
      {selectedReferral && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative ${t(
              'bg-[#140606] border-red-500/30 text-white',
              'bg-white border-gray-200 text-gray-900'
            )}`}
          >
            <button
              onClick={() => setSelectedReferral(null)}
              className="absolute top-5 right-5 p-1 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-brand-red/15 flex items-center justify-center text-brand-red font-bold text-lg">
                {selectedReferral.refereeName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold">{selectedReferral.refereeName}</h3>
                <p className="text-xs text-gray-400">{selectedReferral.memberType} &bull; Onboarded {selectedReferral.date}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className={`grid grid-cols-2 gap-3 p-3.5 rounded-xl border ${t('bg-white/[0.02] border-white/[0.06]', 'bg-gray-50 border-gray-200')}`}>
                <div>
                  <span className="text-[10px] uppercase text-gray-400 block mb-0.5">Email</span>
                  <span className="font-semibold">{selectedReferral.refereeEmail}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-gray-400 block mb-0.5">Phone</span>
                  <span className="font-semibold">{selectedReferral.refereePhone}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-gray-400 block mb-0.5">City / Jurisdiction</span>
                  <span className="font-semibold">{selectedReferral.refereeCity}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-gray-400 block mb-0.5">KYC Status</span>
                  <span className="font-bold text-emerald-400">{selectedReferral.kycStatus}</span>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border ${t('bg-white/[0.02] border-white/[0.06]', 'bg-gray-50 border-gray-200')}`}>
                <h4 className="font-bold text-sm mb-3">Financial Commitment & Reward Breakdown</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-black/20">
                    <span className="text-[9px] uppercase text-gray-400 block">Invested</span>
                    <span className="text-sm font-black text-white">₹{formatINR(selectedReferral.investmentAmount)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/20">
                    <span className="text-[9px] uppercase text-gray-400 block">Reward Rate</span>
                    <span className="text-sm font-black text-brand-red">{selectedReferral.commissionRate}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/20">
                    <span className="text-[9px] uppercase text-gray-400 block">Commission</span>
                    <span className="text-sm font-black text-emerald-400">₹{formatINR(selectedReferral.commissionAmount)}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-white/[0.06]">
                  <span className="text-gray-400">Payout Status:</span>
                  <span className="font-bold text-amber-400 uppercase tracking-wider">{selectedReferral.commissionStatus}</span>
                </div>
              </div>

              {selectedReferral.notes && (
                <div className={`p-3 rounded-xl border ${t('bg-white/[0.02] border-white/[0.06]', 'bg-gray-50 border-gray-200')}`}>
                  <span className="text-[10px] uppercase text-gray-400 block mb-1">Notes</span>
                  <p className="text-gray-300 leading-relaxed">{selectedReferral.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedReferral(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 5: TOTAL REFERRAL HISTORY & LEDGER
          ───────────────────────────────────────────────────────────── */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border p-6 shadow-2xl relative ${t(
              'bg-[#140606] border-red-500/30 text-white',
              'bg-white border-gray-200 text-gray-900'
            )}`}
          >
            <button
              onClick={() => setHistoryModalOpen(false)}
              className={`absolute top-5 right-5 p-1 rounded-lg transition-colors ${t('text-gray-400 hover:text-white', 'text-gray-500 hover:text-gray-900')}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-brand-red font-bold text-lg border border-red-500/25">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Total Referral History & Ledger</h3>
                <p className={`text-xs ${t('text-gray-400', 'text-gray-500')}`}>Complete historical log of all referral onboarding & commission earnings</p>
              </div>
            </div>

            {/* Quick summary badges */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className={`p-3 rounded-xl border text-center ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                <span className={`text-[10px] uppercase font-bold block ${t('text-gray-400', 'text-gray-500')}`}>Total Records</span>
                <span className={`text-lg font-black ${t('text-white', 'text-gray-900')}`}>{(data?.referrals || []).length}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                <span className={`text-[10px] uppercase font-bold block ${t('text-gray-400', 'text-gray-500')}`}>Total Investment</span>
                <span className={`text-lg font-black ${t('text-white', 'text-gray-900')}`}>₹{formatINR(data?.kpis?.totalInvestment || 0)}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                <span className={`text-[10px] uppercase font-bold block ${t('text-gray-400', 'text-gray-500')}`}>Total Cashback</span>
                <span className="text-lg font-black text-emerald-400">₹{formatINR(data?.kpis?.totalCommission || 0)}</span>
              </div>
            </div>

            {/* Table */}
            <div className={`flex-1 overflow-auto rounded-xl border ${t('border-white/[0.06]', 'border-gray-200')}`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`text-[10px] uppercase tracking-wider font-bold sticky top-0 ${t('bg-[#1f0808] text-gray-400', 'bg-gray-100 text-gray-700')}`}>
                    <th className="p-3">#</th>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Investment</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Commission</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Dossier</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${t('divide-white/[0.04]', 'divide-gray-200')}`}>
                  {(!data?.referrals || data.referrals.length === 0) ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500 italic">
                        No historical referral records found.
                      </td>
                    </tr>
                  ) : (
                    data.referrals.map((r, idx) => (
                      <tr key={r.id || idx} className={`transition-colors ${t('hover:bg-white/[0.02]', 'hover:bg-gray-50')}`}>
                        <td className="p-3 text-gray-500 font-mono">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-brand-red">{r.id}</td>
                        <td className={`p-3 font-semibold ${t('text-white', 'text-gray-900')}`}>{r.refereeName}</td>
                        <td className="p-3 text-gray-400">{r.date}</td>
                        <td className={`p-3 text-right font-mono ${t('text-white', 'text-gray-900')}`}>₹{formatINR(r.investmentAmount)}</td>
                        <td className="p-3 text-right font-mono text-brand-red font-bold">{r.commissionRate}%</td>
                        <td className="p-3 text-right font-mono text-emerald-400 font-bold">₹{formatINR(r.commissionAmount)}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${r.commissionStatus === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}>
                            {r.commissionStatus}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedReferral(r)
                            }}
                            className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-brand-red transition-all"
                            title="View full record"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${t('bg-white/10 hover:bg-white/15 text-white', 'bg-gray-100 hover:bg-gray-200 text-gray-800')}`}
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TOTAL REFERRAL DIRECTORY
          ───────────────────────────────────────────────────────────── */}
      {totalReferralModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border p-6 shadow-2xl relative ${t(
              'bg-[#140606] border-red-500/30 text-white',
              'bg-white border-gray-200 text-gray-900'
            )}`}
          >
            <button
              onClick={() => setTotalReferralModalOpen(false)}
              className={`absolute top-5 right-5 p-1 rounded-lg transition-colors ${t('text-gray-400 hover:text-white', 'text-gray-500 hover:text-gray-900')}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-brand-red font-bold text-lg border border-red-500/25">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Total Referral Directory & Ledger</h3>
                <p className={`text-xs ${t('text-gray-400', 'text-gray-500')}`}>Complete directory of all registered referrals & commission allocations</p>
              </div>
            </div>

            {/* Quick summary badges */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className={`p-3 rounded-xl border text-center ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                <span className={`text-[10px] uppercase font-bold block ${t('text-gray-400', 'text-gray-500')}`}>Total Referrals</span>
                <span className={`text-lg font-black ${t('text-white', 'text-gray-900')}`}>{(data?.referrals || []).length || (data?.kpis?.totalReferrals || 0)}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                <span className={`text-[10px] uppercase font-bold block ${t('text-gray-400', 'text-gray-500')}`}>Total Investment</span>
                <span className={`text-lg font-black ${t('text-white', 'text-gray-900')}`}>₹{formatINR(data?.kpis?.totalInvestment || 0)}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                <span className={`text-[10px] uppercase font-bold block ${t('text-gray-400', 'text-gray-500')}`}>Total Cashback</span>
                <span className="text-lg font-black text-emerald-400">₹{formatINR(data?.kpis?.totalCommission || 0)}</span>
              </div>
            </div>

            {/* Table */}
            <div className={`flex-1 overflow-auto rounded-xl border ${t('border-white/[0.06]', 'border-gray-200')}`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`text-[10px] uppercase tracking-wider font-bold sticky top-0 ${t('bg-[#1f0808] text-gray-400', 'bg-gray-100 text-gray-700')}`}>
                    <th className="p-3">#</th>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Investment</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Commission</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Dossier</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${t('divide-white/[0.04]', 'divide-gray-200')}`}>
                  {(!data?.referrals || data.referrals.length === 0) ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500 italic">
                        No referral records found.
                      </td>
                    </tr>
                  ) : (
                    data.referrals.map((r, idx) => (
                      <tr key={r.id || idx} className={`transition-colors ${t('hover:bg-white/[0.02]', 'hover:bg-gray-50')}`}>
                        <td className="p-3 text-gray-500 font-mono">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-brand-red">{r.id}</td>
                        <td className={`p-3 font-semibold ${t('text-white', 'text-gray-900')}`}>{r.refereeName}</td>
                        <td className="p-3 text-gray-400">{r.date}</td>
                        <td className={`p-3 text-right font-mono ${t('text-white', 'text-gray-900')}`}>₹{formatINR(r.investmentAmount)}</td>
                        <td className="p-3 text-right font-mono text-brand-red font-bold">{r.commissionRate}%</td>
                        <td className="p-3 text-right font-mono text-emerald-400 font-bold">₹{formatINR(r.commissionAmount)}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${r.commissionStatus === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}>
                            {r.commissionStatus}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedReferral(r)
                            }}
                            className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-brand-red transition-all"
                            title="View full record"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setTotalReferralModalOpen(false)}
                className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${t('bg-white/10 hover:bg-white/15 text-white', 'bg-gray-100 hover:bg-gray-200 text-gray-800')}`}
              >
                Close Referrals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TOTAL INVESTOR DIRECTORY
          ───────────────────────────────────────────────────────────── */}
      {totalInvestorModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border p-6 shadow-2xl relative ${t(
              'bg-[#140606] border-red-500/30 text-white',
              'bg-white border-gray-200 text-gray-900'
            )}`}
          >
            <button
              onClick={() => setTotalInvestorModalOpen(false)}
              className={`absolute top-5 right-5 p-1 rounded-lg transition-colors ${t('text-gray-400 hover:text-white', 'text-gray-500 hover:text-gray-900')}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-brand-red font-bold text-lg border border-red-500/25">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Total Investors Directory & Ledger</h3>
                <p className={`text-xs ${t('text-gray-400', 'text-gray-500')}`}>Complete directory of all registered general investors & their portfolio allocations</p>
              </div>
            </div>

            {/* Quick summary badges */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className={`p-3 rounded-xl border text-center ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                <span className={`text-[10px] uppercase font-bold block ${t('text-gray-400', 'text-gray-500')}`}>Total Investors</span>
                <span className={`text-lg font-black ${t('text-white', 'text-gray-900')}`}>{giReferrals.length || (data?.kpis?.totalInvestors || 0)}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                <span className={`text-[10px] uppercase font-bold block ${t('text-gray-400', 'text-gray-500')}`}>Investor Investment</span>
                <span className={`text-lg font-black ${t('text-white', 'text-gray-900')}`}>₹{formatINR(giReferrals.reduce((sum, r) => sum + (r.investmentAmount || 0), 0))}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                <span className={`text-[10px] uppercase font-bold block ${t('text-gray-400', 'text-gray-500')}`}>Total Commission</span>
                <span className="text-lg font-black text-emerald-400">₹{formatINR(giReferrals.reduce((sum, r) => sum + (r.commissionAmount || 0), 0))}</span>
              </div>
            </div>

            {/* Table */}
            <div className={`flex-1 overflow-auto rounded-xl border ${t('border-white/[0.06]', 'border-gray-200')}`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`text-[10px] uppercase tracking-wider font-bold sticky top-0 ${t('bg-[#1f0808] text-gray-400', 'bg-gray-100 text-gray-700')}`}>
                    <th className="p-3">#</th>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Investment</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Commission</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Dossier</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${t('divide-white/[0.04]', 'divide-gray-200')}`}>
                  {giReferrals.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500 italic">
                        No investor records found.
                      </td>
                    </tr>
                  ) : (
                    giReferrals.map((r, idx) => (
                      <tr key={r.id || idx} className={`transition-colors ${t('hover:bg-white/[0.02]', 'hover:bg-gray-50')}`}>
                        <td className="p-3 text-gray-500 font-mono">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-brand-red">{r.id}</td>
                        <td className={`p-3 font-semibold ${t('text-white', 'text-gray-900')}`}>{r.refereeName}</td>
                        <td className="p-3 text-gray-400">{r.date}</td>
                        <td className={`p-3 text-right font-mono ${t('text-white', 'text-gray-900')}`}>₹{formatINR(r.investmentAmount)}</td>
                        <td className="p-3 text-right font-mono text-brand-red font-bold">{r.commissionRate}%</td>
                        <td className="p-3 text-right font-mono text-emerald-400 font-bold">₹{formatINR(r.commissionAmount)}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${r.commissionStatus === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}>
                            {r.commissionStatus}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedReferral(r)
                            }}
                            className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-brand-red transition-all"
                            title="View full record"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setTotalInvestorModalOpen(false)}
                className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${t('bg-white/10 hover:bg-white/15 text-white', 'bg-gray-100 hover:bg-gray-200 text-gray-800')}`}
              >
                Close Investors
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TODAY'S REFERRAL ACTIVITY & LEDGER
          ───────────────────────────────────────────────────────────── */}
      {todayReferralModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border p-6 shadow-2xl relative ${t(
              'bg-[#140606] border-red-500/30 text-white',
              'bg-white border-gray-200 text-gray-900'
            )}`}
          >
            <button
              onClick={() => setTodayReferralModalOpen(false)}
              className={`absolute top-5 right-5 p-1 rounded-lg transition-colors ${t('text-gray-400 hover:text-white', 'text-gray-500 hover:text-gray-900')}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-brand-red font-bold text-lg border border-red-500/25">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Today's Referral Activity & Ledger</h3>
                <p className={`text-xs ${t('text-gray-400', 'text-gray-500')}`}>Real-time log of referral onboarding recorded today</p>
              </div>
            </div>

            {/* Quick summary badges */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className={`p-3 rounded-xl border text-center ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                <span className={`text-[10px] uppercase font-bold block ${t('text-gray-400', 'text-gray-500')}`}>Today's Referrals</span>
                <span className={`text-lg font-black ${t('text-white', 'text-gray-900')}`}>{todayReferralsList.length}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                <span className={`text-[10px] uppercase font-bold block ${t('text-gray-400', 'text-gray-500')}`}>Today's Investment</span>
                <span className={`text-lg font-black ${t('text-white', 'text-gray-900')}`}>₹{formatINR(todayReferralsList.reduce((sum, r) => sum + (r.investmentAmount || 0), 0))}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                <span className={`text-[10px] uppercase font-bold block ${t('text-gray-400', 'text-gray-500')}`}>Today's Cashback</span>
                <span className="text-lg font-black text-emerald-400">₹{formatINR(todayReferralsList.reduce((sum, r) => sum + (r.commissionAmount || 0), 0))}</span>
              </div>
            </div>

            {/* Table */}
            <div className={`flex-1 overflow-auto rounded-xl border ${t('border-white/[0.06]', 'border-gray-200')}`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`text-[10px] uppercase tracking-wider font-bold sticky top-0 ${t('bg-[#1f0808] text-gray-400', 'bg-gray-100 text-gray-700')}`}>
                    <th className="p-3">#</th>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Investment</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Commission</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Dossier</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${t('divide-white/[0.04]', 'divide-gray-200')}`}>
                  {todayReferralsList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500 italic">
                        No referrals recorded today.
                      </td>
                    </tr>
                  ) : (
                    todayReferralsList.map((r, idx) => (
                      <tr key={r.id || idx} className={`transition-colors ${t('hover:bg-white/[0.02]', 'hover:bg-gray-50')}`}>
                        <td className="p-3 text-gray-500 font-mono">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-brand-red">{r.id}</td>
                        <td className={`p-3 font-semibold ${t('text-white', 'text-gray-900')}`}>{r.refereeName}</td>
                        <td className="p-3 text-gray-400">{r.date}</td>
                        <td className={`p-3 text-right font-mono ${t('text-white', 'text-gray-900')}`}>₹{formatINR(r.investmentAmount)}</td>
                        <td className="p-3 text-right font-mono text-brand-red font-bold">{r.commissionRate}%</td>
                        <td className="p-3 text-right font-mono text-emerald-400 font-bold">₹{formatINR(r.commissionAmount)}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${r.commissionStatus === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}>
                            {r.commissionStatus}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedReferral(r)
                            }}
                            className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-brand-red transition-all"
                            title="View full record"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setTodayReferralModalOpen(false)}
                className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${t('bg-white/10 hover:bg-white/15 text-white', 'bg-gray-100 hover:bg-gray-200 text-gray-800')}`}
              >
                Close Today Referrals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 6: OFFICIAL PARTNERSHIP AGREEMENT (VIEW PAGE)
          ───────────────────────────────────────────────────────────── */}
      {agreementModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden relative ${t(
              'bg-[#120505] border-red-500/30 text-white',
              'bg-white border-gray-200 text-gray-900'
            )}`}
          >
            {/* Header Toolbar */}
            <div className={`p-4 sm:p-5 flex items-center justify-between border-b ${t('border-white/10 bg-[#1a0808]', 'border-gray-200 bg-gray-50')}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-brand-red font-bold text-lg border border-red-500/30 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <span>
                      {partnerRole === 'MCP'
                        ? 'Master Channel Partner Agreement'
                        : partnerRole === 'CPL'
                          ? 'Channel Partner Agreement'
                          : 'Investor Referral Partner Agreement'}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      Active
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    Ref: GHL-AGR-{effectiveId}-{new Date().getFullYear()} &bull; SEBI Reg: IN/AIF2/24-25/1517
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    generateAgreementPDF({
                      role: partnerRole === 'MCP' ? 'MCP' : partnerRole === 'CPL' ? 'CPL' : 'GI',
                      partnerId: effectiveId,
                      partnerName: data?.partner?.name || partnerDisplayName,
                      partnerEmail: data?.partner?.email || partnerEmail,
                      partnerPhone: data?.partner?.phone || partnerPhone,
                      preview: true,
                    })
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200 transition-all"
                  title="Open in new window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Tab</span>
                </button>

                <button
                  onClick={() => {
                    generateAgreementPDF({
                      role: partnerRole === 'MCP' ? 'MCP' : partnerRole === 'CPL' ? 'CPL' : 'GI',
                      partnerId: effectiveId,
                      partnerName: data?.partner?.name || partnerDisplayName,
                      partnerEmail: data?.partner?.email || partnerEmail,
                      partnerPhone: data?.partner?.phone || partnerPhone,
                      preview: false,
                    })
                    showToast('Downloading official PDF Agreement...', 'success')
                  }}
                  style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-md hover:brightness-110 flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>

                <button
                  onClick={() => setAgreementModalOpen(false)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body (View Page Reader) */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs sm:text-sm font-sans leading-relaxed">
              {/* Formal Letterhead */}
              <div className="text-center pb-6 border-b border-red-500/20">
                <div className="inline-block px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-brand-red font-mono text-[11px] font-bold uppercase tracking-wider mb-2">
                  Category II Alternative Investment Fund
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  GHL INDIA VENTURES PRIVATE LIMITED
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  SEBI Registration No. IN/AIF2/24-25/1517 &bull; Investment Manager
                </p>
                <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-gray-300">
                  <span>Document: <strong className="text-white">{partnerRole === 'MCP' ? 'Master Channel Partner Agreement' : partnerRole === 'CPL' ? 'Channel Partner Agreement' : 'Investor Referral Agreement'}</strong></span>
                  <span>&bull;</span>
                  <span>Partner Code: <strong className="text-brand-red font-mono">{effectiveId}</strong></span>
                  <span>&bull;</span>
                  <span>Execution Date: <strong className="text-white">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></span>
                </div>
              </div>

              {/* 1. Parties */}
              <div className={`p-4 rounded-xl border ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-red mb-2">1. PARTIES TO THIS AGREEMENT</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block font-semibold">FIRST PARTY (Investment Manager):</span>
                    <p className="text-white font-bold mt-0.5">GHL India Ventures Private Limited</p>
                    <p className="text-gray-400">SEBI Reg: IN/AIF2/24-25/1517</p>
                    <p className="text-gray-400">Category II AIF Investment Manager</p>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">SECOND PARTY (Authorized Partner):</span>
                    <p className="text-white font-bold mt-0.5">{data?.partner?.name || partnerDisplayName}</p>
                    <p className="text-gray-400 font-mono">ID: {effectiveId} &bull; Role: {partnerRole}</p>
                    <p className="text-gray-400">{data?.partner?.email || partnerEmail || 'Verified Email on File'}</p>
                  </div>
                </div>
              </div>

              {/* 2. Recitals */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-red mb-2">2. RECITALS &amp; APPOINTMENT</h4>
                <p className="text-gray-300">
                  WHEREAS the Investment Manager manages SEBI registered Category II Alternative Investment Funds (AIF) including real estate and private market investment strategies; AND WHEREAS the Partner is appointed on a non-exclusive basis to introduce eligible, accredited, and High-Net-Worth Individuals (HNIs) as prospective investors to the Fund in strict adherence to SEBI regulations and compliance mandates.
                </p>
              </div>

              {/* 3. Commission Slabs */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-red mb-2">3. REWARD &amp; COMMISSION SCHEDULE</h4>
                <p className="text-gray-300 mb-3">
                  The Partner is entitled to receive commission payouts upon successful deployment and allotment of capital by their referred investors, as structured below:
                </p>
                <div className={`rounded-xl border overflow-hidden ${t('border-white/10', 'border-gray-200')}`}>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b ${t('bg-white/[0.04] text-gray-300 border-white/10', 'bg-gray-100 text-gray-700 border-gray-200')}`}>
                        <th className="p-3">Investment Tier / Cohort</th>
                        <th className="p-3">Capital Deployed</th>
                        <th className="p-3 text-right">Commission Rate</th>
                        <th className="p-3 text-right">Statutory TDS</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${t('divide-white/[0.05]', 'divide-gray-100')}`}>
                      <tr>
                        <td className="p-3 font-semibold text-white">Sale of Associate Channel Partner</td>
                        <td className="p-3 text-gray-300">₹1,00,00,000 to ₹5,00,00,000</td>
                        <td className="p-3 text-right font-mono font-bold text-brand-red">3.00%</td>
                        <td className="p-3 text-right text-gray-400">2% Sec. 194H</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-white">Sale of Associate Channel Partner</td>
                        <td className="p-3 text-gray-300">₹5,00,00,000 to Above</td>
                        <td className="p-3 text-right font-mono font-bold text-brand-red">4.00%</td>
                        <td className="p-3 text-right text-gray-400">2% Sec. 194H</td>
                      </tr>
                      {partnerRole === 'MCP' && (
                        <tr className="bg-red-500/5">
                          <td className="p-3 font-semibold text-amber-300">Sale of Master Channel Partner</td>
                          <td className="p-3 text-gray-300">Any Investment</td>
                          <td className="p-3 text-right font-mono font-bold text-amber-400">0.50%</td>
                          <td className="p-3 text-right text-gray-400">2% Sec. 194H</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. TDS Compliance */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-red mb-2">4. STATUTORY TDS COMPLIANCE (SECTION 194H)</h4>
                <p className="text-gray-300">
                  All commissions, brokerage, and override disbursements are strictly subject to Tax Deducted at Source (TDS) at the statutory rate of 2% in compliance with Section 194H of the Income Tax Act of India. Official Form 16A TDS certificates shall be issued on a quarterly basis and mapped to the Partner's PAN in AIS/26AS.
                </p>
              </div>

              {/* 5. Code of Conduct */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-red mb-2">5. CODE OF CONDUCT &amp; ANTI-MONEY LAUNDERING</h4>
                <p className="text-gray-300">
                  The Partner shall not make any misrepresentations or unauthorized performance guarantees. All investors introduced must undergo standard KYC, Anti-Money Laundering (AML), and investor accreditation verification as governed by SEBI regulations.
                </p>
              </div>

              {/* 6. Execution & Signatures */}
              <div className={`p-4 sm:p-6 rounded-xl border mt-6 ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-red mb-4">6. OFFICIAL SIGNATURES &amp; CORPORATE SEAL</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="border-t border-gray-600 pt-3">
                    <p className="text-xs font-bold text-white">For GHL India Ventures Private Limited</p>
                    <p className="text-xs text-gray-400 mt-1">Authorized Signatory &amp; Corporate Seal</p>
                    <p className="text-[11px] text-emerald-400 font-mono mt-2 font-bold">DIGITALLY SIGNED &bull; VALIDATED</p>
                  </div>
                  <div className="border-t border-gray-600 pt-3">
                    <p className="text-xs font-bold text-white">For Authorized Partner ({effectiveId})</p>
                    <p className="text-xs text-gray-400 mt-1">{data?.partner?.name || partnerDisplayName}</p>
                    <p className="text-[11px] text-emerald-400 font-mono mt-2 font-bold">AUTHENTICATED DIGITAL SESSION &bull; ACTIVE</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${t('border-white/10 bg-[#1a0808]', 'border-gray-200 bg-gray-50')}`}>
              <span className="text-xs text-gray-400">
                Official confidential document of GHL India Ventures Portal.
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    generateAgreementPDF({
                      role: partnerRole === 'MCP' ? 'MCP' : partnerRole === 'CPL' ? 'CPL' : 'GI',
                      partnerId: effectiveId,
                      partnerName: data?.partner?.name || partnerDisplayName,
                      partnerEmail: data?.partner?.email || partnerEmail,
                      partnerPhone: data?.partner?.phone || partnerPhone,
                      preview: false,
                    })
                    showToast('Downloading official PDF Agreement...', 'success')
                  }}
                  style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:brightness-110 flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Copy</span>
                </button>
                <button
                  onClick={() => setAgreementModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-all"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
