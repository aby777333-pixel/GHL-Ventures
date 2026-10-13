'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  Share2,
  TrendingUp,
  Users,
  FileText,
  Filter,
  RotateCcw,
  Download,
  Search,
  Copy,
  CheckCircle,
  ExternalLink,
  Send,
  Mail,
  ChevronLeft,
  ChevronRight,
  Shield,
  Info,
  Calendar,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Building2,
  Check,
  Percent,
  AlertCircle,
} from 'lucide-react'
import {
  PartnerDashboardResponse,
  ReferralMember,
  PartnerRole,
} from '@/lib/supabase/partnerDashboardService'

// Helper for Indian Rupee Currency Formatting
function formatINR(val?: number | string | null): string {
  if (val === null || val === undefined) return '₹0.00'
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (isNaN(num)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num)
}

interface InvestorReferralDashboardProps {
  theme?: 'dark' | 'light'
  isDark?: boolean
  effectiveId: string
  partnerName?: string
  partnerEmail?: string
  partnerPhone?: string
  data: PartnerDashboardResponse | null
  loading: boolean
  error?: string | null
  filterYear: number
  filterMonth: string
  onYearChange: (year: number) => void
  onMonthChange: (month: string) => void
  onRefresh: () => void
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void
  onNavigateTab?: (tab: string) => void
}

type InvestorSubTab = 'referral' | 'income' | 'list' | 'tds'

export default function InvestorReferralDashboard({
  theme = 'dark',
  isDark = true,
  effectiveId,
  partnerName = 'Investor',
  partnerEmail = '',
  partnerPhone = '',
  data,
  loading,
  error,
  filterYear,
  filterMonth,
  onYearChange,
  onMonthChange,
  onRefresh,
  showToast,
  onNavigateTab,
}: InvestorReferralDashboardProps) {
  // Theme utility matching reference role-based dashboard
  const isDarkMode = isDark !== undefined ? isDark : theme === 'dark'
  const t = (darkClass: string, lightClass: string) => (isDarkMode ? darkClass : lightClass)

  // Active subnav tab — default to 'income' matching user screenshot
  const [activeTab, setActiveTab] = useState<InvestorSubTab>('income')

  // Search input for New Income table
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // Local filter states for year & month dropdowns
  const [selectedYear, setSelectedYear] = useState<number>(filterYear || 2026)
  const [selectedMonth, setSelectedMonth] = useState<string>(filterMonth || 'Oct')

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)
  const rowsPerPage = 10

  // Referral link
  const referralLink = useMemo(() => {
    return `https://ghlindiaventures.com/register/?ref=${encodeURIComponent(effectiveId)}&type=investor`
  }, [effectiveId])

  const copyReferralLink = useCallback(() => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(referralLink)
      setCopiedLink(true)
      showToast('Referral link copied to clipboard!', 'success')
      setTimeout(() => setCopiedLink(false), 3000)
    }
  }, [referralLink, showToast])

  const copyReferralCode = useCallback(() => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(effectiveId)
      setCopiedCode(true)
      showToast(`Referral Code ${effectiveId} copied!`, 'success')
      setTimeout(() => setCopiedCode(false), 3000)
    }
  }, [effectiveId, showToast])

  // Filtered referrals from API data
  const rawReferrals: ReferralMember[] = useMemo(() => {
    return data?.referrals || []
  }, [data?.referrals])

  // Apply search query to referrals
  const filteredReferrals = useMemo(() => {
    return rawReferrals.filter((r) => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      return (
        r.refereeName?.toLowerCase().includes(q) ||
        r.refereeEmail?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q) ||
        r.notes?.toLowerCase().includes(q)
      )
    })
  }, [rawReferrals, searchQuery])

  // Aggregate KPI calculations for Investor
  const metrics = useMemo(() => {
    const totalInvestment = rawReferrals.reduce((acc, r) => acc + (Number(r.investmentAmount) || 0), 0)
    const grossIncome = rawReferrals.reduce((acc, r) => acc + (Number(r.commissionAmount) || 0), 0)
    const tdsDeducted = grossIncome * 0.02 // Statutory 2% Section 194H TDS
    const netIncome = Math.max(0, grossIncome - tdsDeducted)
    const totalReferrals = data?.kpis?.totalReferrals || rawReferrals.length

    return {
      totalInvestment,
      grossIncome,
      tdsDeducted,
      netIncome,
      totalReferrals,
    }
  }, [rawReferrals, data?.kpis?.totalReferrals])

  // Apply filters handler
  const handleApplyFilter = () => {
    onYearChange(selectedYear)
    onMonthChange(selectedMonth)
    showToast(`Filtered for ${selectedMonth} ${selectedYear}`, 'info')
  }

  // Reset filters handler
  const handleResetFilter = () => {
    setSelectedYear(2026)
    setSelectedMonth('Oct')
    onYearChange(2026)
    onMonthChange('Oct')
    setSearchQuery('')
    showToast('Filters reset to default', 'info')
  }

  // CSV Export Function
  const handleExportCSV = () => {
    if (filteredReferrals.length === 0) {
      showToast('No records available to export', 'info')
      return
    }

    const headers = ['#', 'User ID', 'Investor', 'Plan', 'Invest Date', 'Amount', 'Slab %', 'Gross', 'TDS (2%)', 'Net Income', 'Status']
    const csvRows = [
      headers.join(','),
      ...filteredReferrals.map((r, i) => {
        const gross = Number(r.commissionAmount) || 0
        const tds = gross * 0.02
        const net = gross - tds
        return [
          i + 1,
          `"${r.id || `INV-${1000 + i}`}"`,
          `"${r.refereeName || 'Investor'}"`,
          `"GHL Growth Fund AIF"`,
          `"${r.date || '—'}"`,
          Number(r.investmentAmount) || 0,
          `"${r.commissionRate || 2.0}%"`,
          gross.toFixed(2),
          tds.toFixed(2),
          net.toFixed(2),
          `"${r.commissionStatus || 'accrued'}"`,
        ].join(',')
      }),
    ]

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `ghl-referral-income-${selectedMonth}-${selectedYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Referral income CSV exported successfully!', 'success')
  }

  // PDF Export Function
  const handleExportPDF = () => {
    showToast('Opening print preview for PDF generation...', 'info')
    window.print()
  }

  return (
    <div className={`space-y-6 animate-fade-in pb-12 font-sans ${t('text-white', 'text-gray-900')}`}>
      {/* ─────────────────────────────────────────────────────────────
          LOCKED INVESTOR STATUS & REFRESH BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${t('text-gray-400', 'text-gray-600')}`}>
            Investor Account:
          </span>
          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl border shadow-sm ${t(
            'bg-white/[0.04] border-white/10 text-white',
            'bg-white border-gray-200 text-gray-900'
          )}`}>
            {effectiveId}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${t(
            'bg-red-500/10 border-red-500/20 text-brand-red',
            'bg-red-50 border-red-200 text-brand-red'
          )}`}>
            Live Profile
          </span>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${t(
            'bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 border-white/10',
            'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
          )}`}
          title="Refresh Referral Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-red' : t('text-gray-400', 'text-gray-600')}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error state notification if API failure */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold transition-all active:scale-95 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. TOP CRIMSON BANNER (Matches Reference Header)
          ───────────────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8 text-white shadow-xl transition-all"
        style={{
          background: 'linear-gradient(135deg, #8B0000 0%, #D0021B 55%, #7A0000 100%)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        {/* Ambient background blur circles */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/[0.08] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-black/20 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Title and description */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
              Referral Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-white/80 font-medium mt-1.5 flex items-center gap-1.5">
              <span>Share your link</span>
              <span className="opacity-50">·</span>
              <span>Track income</span>
              <span className="opacity-50">·</span>
              <span>View TDS</span>
            </p>
          </div>

          {/* Metric Card: TOTAL REFERRALS (Clickable to switch to Referral List) */}
          <div
            onClick={() => setActiveTab('list')}
            className="cursor-pointer group bg-black/25 hover:bg-black/35 hover:scale-[1.02] backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 text-center min-w-[170px] shadow-xl transition-all"
            title="Click to view Referral List"
          >
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/80 block mb-1 group-hover:text-white">
              TOTAL REFERRALS
            </span>
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
              {loading ? '—' : metrics.totalReferrals}
            </span>
            <span className="text-[10px] font-semibold text-emerald-300 mt-1 block group-hover:underline">
              View Referral List →
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SUBNAV TABS ROW
          - 🔗 Referral
          - 📈 New Income
          - 👥 Referral List
          - 📄 Referral TDS
          ───────────────────────────────────────────────────────────── */}
      <div className={`flex flex-wrap items-center gap-2 p-1.5 rounded-2xl border transition-all ${t(
        'bg-[#150606] border-white/10 shadow-lg',
        'bg-white border-gray-200 shadow-sm'
      )}`}>
        <button
          onClick={() => setActiveTab('referral')}
          style={{
            background: activeTab === 'referral' ? 'linear-gradient(135deg, #D0021B, #8B0000)' : undefined,
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${activeTab === 'referral'
            ? 'text-white shadow-md'
            : t('text-gray-400 hover:text-white hover:bg-white/[0.05]', 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
            }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Referral</span>
        </button>

        <button
          onClick={() => setActiveTab('income')}
          style={{
            background: activeTab === 'income' ? 'linear-gradient(135deg, #D0021B, #8B0000)' : undefined,
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${activeTab === 'income'
            ? 'text-white shadow-md'
            : t('text-gray-400 hover:text-white hover:bg-white/[0.05]', 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
            }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>New Income</span>
        </button>

        <button
          onClick={() => setActiveTab('list')}
          style={{
            background: activeTab === 'list' ? 'linear-gradient(135deg, #D0021B, #8B0000)' : undefined,
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${activeTab === 'list'
            ? 'text-white shadow-md'
            : t('text-gray-400 hover:text-white hover:bg-white/[0.05]', 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
            }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Referral List</span>
        </button>

        <button
          onClick={() => setActiveTab('tds')}
          style={{
            background: activeTab === 'tds' ? 'linear-gradient(135deg, #D0021B, #8B0000)' : undefined,
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${activeTab === 'tds'
            ? 'text-white shadow-md'
            : t('text-gray-400 hover:text-white hover:bg-white/[0.05]', 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
            }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Referral TDS</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT 1: NEW INCOME
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'income' && (
        <div className="space-y-4 animate-fade-in">
          {/* 1. Income Slabs Card */}
          <div className={`rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-3 border transition-all ${t(
            'bg-[#150606] border-white/10 shadow-lg',
            'bg-white border-gray-200 shadow-sm'
          )}`}>
            <span className={`text-xs sm:text-sm font-bold mr-1 ${t('text-white', 'text-gray-900')}`}>
              Income Slabs:
            </span>

            <span className={`font-bold px-3 py-1 rounded-full text-xs border ${t(
              'bg-blue-500/10 border-blue-500/30 text-blue-400',
              'bg-blue-50 border-blue-200 text-blue-700'
            )}`}>
              3.00% — ₹1 Cr to ₹5 Cr
            </span>

            <span className={`font-bold px-3 py-1 rounded-full text-xs border ${t(
              'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
              'bg-[#e8f5e9] border-[#a5d6a7] text-[#1b5e20]'
            )}`}>
              4.00% — ₹5 Cr &amp; Above
            </span>

            <span className={`font-bold px-3 py-1 rounded-full text-xs border ${t(
              'bg-amber-500/10 border-amber-500/30 text-amber-400',
              'bg-amber-50 border-amber-200 text-amber-700'
            )}`}>
              0.50% — Master CP (Any Investment)
            </span>

            <span className={`text-xs font-medium ml-1 ${t('text-gray-400', 'text-gray-500')}`}>
              · TDS 2% deducted
            </span>
          </div>

          {/* 2. Filter Bar Card */}
          <div className={`rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-4 border transition-all ${t(
            'bg-[#150606] border-white/10 shadow-lg',
            'bg-white border-gray-200 shadow-sm'
          )}`}>
            <div className="flex items-center gap-2">
              <label className={`text-xs font-semibold ${t('text-gray-400', 'text-gray-600')}`}>Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer border shadow-sm ${t(
                  'bg-[#140606] border-white/10 text-white',
                  'bg-white border-gray-300 text-gray-900'
                )}`}
              >
                <option value={2026} className={t('bg-[#1a0a0a] text-white', 'bg-white text-gray-900')}>2026</option>
                <option value={2025} className={t('bg-[#1a0a0a] text-white', 'bg-white text-gray-900')}>2025</option>
                <option value={2024} className={t('bg-[#1a0a0a] text-white', 'bg-white text-gray-900')}>2024</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className={`text-xs font-semibold ${t('text-gray-400', 'text-gray-600')}`}>Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer min-w-[70px] border shadow-sm ${t(
                  'bg-[#140606] border-white/10 text-white',
                  'bg-white border-gray-300 text-gray-900'
                )}`}
              >
                {['Oct', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Nov', 'Dec'].map((m) => (
                  <option key={m} value={m} className={t('bg-[#1a0a0a] text-white', 'bg-white text-gray-900')}>{m}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleApplyFilter}
              style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}
              className="hover:brightness-110 text-white font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>

            <button
              onClick={handleResetFilter}
              className={`border font-medium px-4 py-1.5 rounded-xl text-xs transition-all active:scale-95 ${t(
                'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-gray-300',
                'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'
              )}`}
            >
              Reset
            </button>
          </div>

          {/* 3. Four Metric Cards Row (Clickable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: TOTAL INVESTMENT */}
            <div
              onClick={() => setActiveTab('income')}
              className={`border rounded-2xl p-5 transition-all hover:scale-[1.01] cursor-pointer group ${t(
                'bg-[#150606] border-white/10 shadow-lg hover:border-red-500/40',
                'bg-white border-gray-200 shadow-sm hover:border-red-300'
              )}`}
              title="Click to view all investment records"
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${t('text-gray-400', 'text-gray-500')}`}>
                  TOTAL INVESTMENT
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  View →
                </span>
              </div>
              <h3 className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${t('text-white', 'text-gray-900')}`}>
                {formatINR(metrics.totalInvestment)}
              </h3>
            </div>

            {/* Card 2: GROSS INCOME */}
            <div
              onClick={() => setActiveTab('income')}
              className={`border rounded-2xl p-5 transition-all hover:scale-[1.01] cursor-pointer group ${t(
                'bg-[#150606] border-white/10 shadow-lg hover:border-red-500/40',
                'bg-white border-gray-200 shadow-sm hover:border-red-300'
              )}`}
              title="Click to view income details"
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${t('text-gray-400', 'text-gray-500')}`}>
                  GROSS INCOME
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  View →
                </span>
              </div>
              <h3 className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${t('text-white', 'text-gray-900')}`}>
                {formatINR(metrics.grossIncome)}
              </h3>
            </div>

            {/* Card 3: TDS DEDUCTED (2%) - Switches to TDS Tab */}
            <div
              onClick={() => setActiveTab('tds')}
              className={`border rounded-2xl p-5 transition-all hover:scale-[1.01] cursor-pointer group ${t(
                'bg-[#150606] border-white/10 shadow-lg hover:border-red-500/40',
                'bg-white border-gray-200 shadow-sm hover:border-red-300'
              )}`}
              title="Click to view TDS compliance ledger"
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${t('text-gray-400', 'text-gray-500')}`}>
                  TDS DEDUCTED (2%)
                </span>
                <span className="text-[10px] font-semibold text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  View TDS →
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-red-500 font-mono tracking-tight">
                {formatINR(metrics.tdsDeducted)}
              </h3>
            </div>

            {/* Card 4: NET INCOME */}
            <div
              onClick={() => setActiveTab('income')}
              className={`border rounded-2xl p-5 transition-all hover:scale-[1.01] cursor-pointer group ${t(
                'bg-[#150606] border-white/10 shadow-lg hover:border-red-500/40',
                'bg-white border-gray-200 shadow-sm hover:border-red-300'
              )}`}
              title="Click to view net payout ledger"
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${t('text-gray-400', 'text-gray-500')}`}>
                  NET INCOME
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  View →
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-500 font-mono tracking-tight">
                {formatINR(metrics.netIncome)}
              </h3>
            </div>
          </div>

          {/* 4. Table Section */}
          <div className={`rounded-2xl overflow-hidden border transition-all ${t(
            'bg-[#150606] border-white/10 shadow-lg',
            'bg-white border-gray-200 shadow-sm'
          )}`}>
            {/* Table Header Action Bar */}
            <div className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ${t('border-white/10', 'border-gray-200')}`}>
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-brand-red" />
                <h3 className={`text-sm font-bold ${t('text-white', 'text-gray-900')}`}>New Referral Income</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${t(
                  'bg-red-500/20 text-brand-red border-red-500/30',
                  'bg-red-50 text-brand-red border-red-200'
                )}`}>
                  {filteredReferrals.length} records
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleExportPDF}
                  style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}
                  className="hover:brightness-110 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export PDF</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className={`border text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${t(
                    'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-emerald-400',
                    'bg-white hover:bg-gray-100 border-gray-300 text-emerald-600'
                  )}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <div className="relative">
                  <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${t('text-gray-400', 'text-gray-400')}`} />
                  <input
                    type="text"
                    placeholder="Search name, plan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`text-xs pl-8 pr-3 py-1.5 rounded-xl outline-none border w-48 sm:w-56 shadow-sm transition-all ${t(
                      'bg-[#140606] border-white/10 text-white placeholder-gray-500 focus:border-red-500/50',
                      'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-red'
                    )}`}
                  />
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                {/* Red Banner Table Header */}
                <thead>
                  <tr
                    className="text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider"
                    style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}
                  >
                    <th className="py-3 px-3.5 font-black">#</th>
                    <th className="py-3 px-3.5 font-black">USER ID</th>
                    <th className="py-3 px-3.5 font-black">INVESTOR</th>
                    <th className="py-3 px-3.5 font-black">PLAN</th>
                    <th className="py-3 px-3.5 font-black">INVEST DATE</th>
                    <th className="py-3 px-3.5 font-black">AMOUNT</th>
                    <th className="py-3 px-3.5 font-black">SLAB %</th>
                    <th className="py-3 px-3.5 font-black">GROSS</th>
                    <th className="py-3 px-3.5 font-black">TDS (2%)</th>
                    <th className="py-3 px-3.5 font-black">NET INCOME</th>
                    <th className="py-3 px-3.5 font-black text-right">STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReferrals.length === 0 ? (
                    <tr>
                      <td colSpan={11} className={`py-16 text-center text-xs italic ${t('text-gray-400', 'text-gray-500')}`}>
                        No new income data for selected period
                      </td>
                    </tr>
                  ) : (
                    filteredReferrals.map((r, i) => {
                      const amount = Number(r.investmentAmount) || 0
                      const slabRate = r.commissionRate || (amount >= 50000000 ? 4.00 : 3.00)
                      const gross = Number(r.commissionAmount) || (amount * slabRate) / 100
                      const tds = gross * 0.02
                      const net = gross - tds

                      return (
                        <tr
                          key={r.id || i}
                          className={`border-b transition-colors text-xs ${t(
                            'border-white/[0.05] hover:bg-white/[0.02]',
                            'border-gray-100 hover:bg-gray-50/80'
                          )}`}
                        >
                          <td className={`py-3.5 px-3.5 font-mono ${t('text-gray-400', 'text-gray-500')}`}>{i + 1}</td>
                          <td className={`py-3.5 px-3.5 font-mono ${t('text-gray-300', 'text-gray-700')}`}>
                            {r.id || `GHL-${1000 + i}`}
                          </td>
                          <td className={`py-3.5 px-3.5 font-bold ${t('text-white', 'text-gray-900')}`}>
                            {r.refereeName || 'Investor'}
                          </td>
                          <td className={`py-3.5 px-3.5 ${t('text-gray-300', 'text-gray-600')}`}>
                            {r.notes || 'GHL Growth Fund AIF'}
                          </td>
                          <td className={`py-3.5 px-3.5 ${t('text-gray-400', 'text-gray-500')}`}>
                            {r.date || '—'}
                          </td>
                          <td className={`py-3.5 px-3.5 font-mono font-semibold ${t('text-white', 'text-gray-900')}`}>
                            {formatINR(amount)}
                          </td>
                          <td className="py-3.5 px-3.5 font-bold text-brand-red">
                            {slabRate}%
                          </td>
                          <td className={`py-3.5 px-3.5 font-mono ${t('text-white', 'text-gray-900')}`}>
                            {formatINR(gross)}
                          </td>
                          <td className="py-3.5 px-3.5 font-mono text-red-500">
                            {formatINR(tds)}
                          </td>
                          <td className="py-3.5 px-3.5 font-mono font-bold text-emerald-500">
                            {formatINR(net)}
                          </td>
                          <td className="py-3.5 px-3.5 text-right">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.commissionStatus === 'paid'
                              ? t('bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                              : t('bg-amber-500/15 text-amber-400 border border-amber-500/30', 'bg-amber-50 text-amber-700 border border-amber-200')
                              }`}>
                              {r.commissionStatus || 'accrued'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className={`p-4 flex items-center justify-between text-xs border-t ${t(
              'border-white/10 text-gray-400',
              'border-gray-200 text-gray-600'
            )}`}>
              <span>
                Showing {filteredReferrals.length === 0 ? '0 – 0 of 0' : `1 – ${filteredReferrals.length} of ${filteredReferrals.length}`} records
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  className={`w-7 h-7 rounded-lg border disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all ${t(
                    'bg-white/[0.04] border-white/10 text-gray-400 hover:text-white',
                    'bg-white border-gray-300 text-gray-600 hover:text-gray-900'
                  )}`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}
                  className="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-sm"
                >
                  1
                </button>

                <button
                  disabled
                  className={`w-7 h-7 rounded-lg border disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all ${t(
                    'bg-white/[0.04] border-white/10 text-gray-400 hover:text-white',
                    'bg-white border-gray-300 text-gray-600 hover:text-gray-900'
                  )}`}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT 2: REFERRAL (Link sharing & How It Works)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'referral' && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Referral Sharing Box */}
          <div className={`rounded-2xl p-6 sm:p-8 border transition-all ${t(
            'bg-[#150606] border-white/10 shadow-lg',
            'bg-white border-gray-200 shadow-sm'
          )}`}>
            <div className="max-w-2xl">
              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] block mb-1 ${t('text-gray-400', 'text-gray-500')}`}>
                YOUR UNIQUE INVITATION LINK
              </span>
              <h2 className={`text-xl sm:text-2xl font-black tracking-tight mb-2 ${t('text-white', 'text-gray-900')}`}>
                Invite fellow investors to GHL India Ventures
              </h2>
              <p className={`text-xs sm:text-sm mb-6 leading-relaxed ${t('text-gray-300/80', 'text-gray-600')}`}>
                Share your referral link with high-net-worth contacts. When they register and invest in our Category II Alternative Investment Funds, you automatically earn generous referral bonuses credited directly to your account.
              </p>

              {/* Link Input & Copy Button */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5 mb-5">
                <div className={`flex-1 rounded-xl px-4 py-3 flex items-center gap-3 border shadow-inner ${t(
                  'bg-[#140606] border-white/10',
                  'bg-gray-50 border-gray-200'
                )}`}>
                  <Share2 className="w-4 h-4 text-brand-red shrink-0" />
                  <span className={`text-xs sm:text-sm font-mono truncate select-all ${t('text-gray-200', 'text-gray-900')}`}>
                    {referralLink}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={copyReferralLink}
                    style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}
                    className="hover:brightness-110 text-white font-bold px-5 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copied Link' : 'Copy Link'}</span>
                  </button>
                  <button
                    onClick={() => {
                      const win = window.open(referralLink, '_blank', 'noopener,noreferrer')
                      if (!win || win.closed || typeof win.closed === 'undefined') {
                        window.location.href = referralLink
                      }
                    }}
                    className={`hover:brightness-110 font-bold px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 border ${t(
                      'bg-white/10 hover:bg-white/15 text-white border-white/20',
                      'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
                    )}`}
                    title="Open live registration page"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Link</span>
                  </button>
                </div>
              </div>

              {/* Quick Actions (WhatsApp & Email Share + Referral Code) */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const text = encodeURIComponent(
                      `Discover premium private market & real estate AIF opportunities on GHL India Ventures. Register with my exclusive referral link:\n${referralLink}`
                    )
                    window.open(`https://wa.me/?text=${text}`, '_blank')
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm border ${t(
                    'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20',
                    'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  )}`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Share via WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    const subject = encodeURIComponent('Exclusive Invitation to GHL India Ventures AIF Portal')
                    const body = encodeURIComponent(
                      `Hi,\n\nI would like to invite you to join GHL India Ventures, a leading SEBI-registered Category II Alternative Investment Fund.\n\nSign up using my referral link:\n${referralLink}\n\nBest regards,\n${partnerName}`
                    )
                    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm border ${t(
                    'bg-blue-500/10 border-blue-500/25 text-blue-400 hover:bg-blue-500/20',
                    'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                  )}`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Share via Email</span>
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <span className={`text-xs font-semibold ${t('text-gray-400', 'text-gray-600')}`}>Your Code:</span>
                  <button
                    onClick={copyReferralCode}
                    className={`font-mono text-xs font-bold px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 shadow-sm border ${t(
                      'text-white bg-white/[0.05] hover:bg-white/[0.1] border-white/10',
                      'text-gray-900 bg-gray-100 hover:bg-gray-200 border-gray-300'
                    )}`}
                    title="Click to copy code"
                  >
                    <span>{effectiveId}</span>
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className={`w-3 h-3 ${t('text-gray-400', 'text-gray-500')}`} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works (4 Steps) */}
          <div className={`rounded-2xl p-6 sm:p-8 border transition-all ${t(
            'bg-[#150606] border-white/10 shadow-lg',
            'bg-white border-gray-200 shadow-sm'
          )}`}>
            <h3 className={`text-base font-bold mb-6 flex items-center gap-2 ${t('text-white', 'text-gray-900')}`}>
              <Sparkles className="w-4 h-4 text-brand-red" />
              <span>How The Referral Program Works</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: '01',
                  title: 'Share Link',
                  desc: 'Send your customized referral invitation link to prospective investors.',
                },
                {
                  step: '02',
                  title: 'They Register',
                  desc: 'Your referral completes digital signup and verified KYC onboarding.',
                },
                {
                  step: '03',
                  title: 'They Invest',
                  desc: 'Once their capital is deployed into a GHL fund, rewards trigger automatically.',
                },
                {
                  step: '04',
                  title: 'You Earn',
                  desc: 'Direct payout calculated on the tiered slab, deposited after 2% TDS.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-4 relative overflow-hidden border transition-all ${t(
                    'bg-[#140606] border-white/10',
                    'bg-gray-50 border-gray-200'
                  )}`}
                >
                  <span className={`text-2xl font-black absolute top-3 right-3 font-mono ${t(
                    'text-white/10',
                    'text-gray-300/40'
                  )}`}>
                    {item.step}
                  </span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs mb-3 border ${t(
                    'bg-red-500/15 border-red-500/30 text-brand-red',
                    'bg-red-50 border-red-200 text-brand-red'
                  )}`}>
                    {idx + 1}
                  </div>
                  <h4 className={`text-sm font-bold mb-1 ${t('text-white', 'text-gray-900')}`}>{item.title}</h4>
                  <p className={`text-xs leading-relaxed ${t('text-gray-400', 'text-gray-600')}`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT 3: REFERRAL LIST (Detailed Member Roster)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'list' && (
        <div className={`rounded-2xl overflow-hidden border shadow-sm animate-fade-in ${t(
          'bg-[#150606] border-white/10 shadow-lg',
          'bg-white border-gray-200 shadow-sm'
        )}`}>
          <div className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ${t('border-white/10', 'border-gray-200')}`}>
            <div>
              <h3 className={`text-sm font-bold ${t('text-white', 'text-gray-900')}`}>Referred Investors Directory</h3>
              <p className={`text-xs mt-0.5 ${t('text-gray-400', 'text-gray-600')}`}>
                Overview of all accounts registered through your referral link
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className={`border text-xs font-semibold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-auto shadow-sm ${t(
                'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-gray-200',
                'bg-white hover:bg-gray-100 border-gray-300 text-gray-700'
              )}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`text-[10px] uppercase tracking-wider font-bold border-b ${t(
                  'bg-white/[0.04] text-gray-300 border-white/10',
                  'bg-gray-100 text-gray-700 border-gray-200'
                )}`}>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">INVESTOR NAME</th>
                  <th className="py-3 px-4">EMAIL</th>
                  <th className="py-3 px-4">PHONE</th>
                  <th className="py-3 px-4">DATE JOINED</th>
                  <th className="py-3 px-4">KYC STATUS</th>
                  <th className="py-3 px-4">INVESTMENT</th>
                  <th className="py-3 px-4 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={`py-16 text-center text-xs italic ${t('text-gray-400', 'text-gray-500')}`}>
                      No referred investors registered yet. Share your referral link above!
                    </td>
                  </tr>
                ) : (
                  filteredReferrals.map((r, i) => (
                    <tr
                      key={r.id || i}
                      className={`border-b transition-colors ${t(
                        'border-white/[0.05] hover:bg-white/[0.02]',
                        'border-gray-100 hover:bg-gray-50/80'
                      )}`}
                    >
                      <td className={`py-3.5 px-4 font-mono ${t('text-gray-500', 'text-gray-400')}`}>{i + 1}</td>
                      <td className={`py-3.5 px-4 font-bold ${t('text-white', 'text-gray-900')}`}>{r.refereeName || 'Investor'}</td>
                      <td className={`py-3.5 px-4 font-mono ${t('text-gray-300', 'text-gray-700')}`}>{r.refereeEmail || '—'}</td>
                      <td className={`py-3.5 px-4 font-mono ${t('text-gray-400', 'text-gray-500')}`}>{r.refereePhone || '—'}</td>
                      <td className={`py-3.5 px-4 ${t('text-gray-400', 'text-gray-500')}`}>{r.date || '—'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${r.kycStatus === 'Verified'
                          ? t('bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                          : t('bg-amber-500/15 text-amber-400 border border-amber-500/30', 'bg-amber-50 text-amber-700 border border-amber-200')
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${r.kycStatus === 'Verified' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {r.kycStatus || 'Verified'}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 font-mono font-bold ${t('text-white', 'text-gray-900')}`}>
                        {formatINR(r.investmentAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg border ${t(
                          'text-gray-200 bg-white/[0.05] border-white/10',
                          'text-gray-700 bg-gray-100 border-gray-200'
                        )}`}>
                          {r.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT 4: REFERRAL TDS (Tax Deducted at Source Ledger)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'tds' && (
        <div className="space-y-6 animate-fade-in">
          {/* Statutory TDS Notice Card */}
          <div className={`rounded-2xl p-6 border transition-all ${t(
            'bg-[#150606] border-white/10 shadow-lg',
            'bg-white border-gray-200 shadow-sm'
          )}`}>
            <div className="flex items-start gap-3.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${t(
                'bg-amber-500/15 text-amber-400 border-amber-500/30',
                'bg-amber-50 text-amber-700 border-amber-200'
              )}`}>
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${t('text-white', 'text-gray-900')}`}>
                  Section 194H — Statutory 2% TDS Compliance
                </h3>
                <p className={`text-xs mt-1 leading-relaxed ${t('text-gray-400', 'text-gray-600')}`}>
                  In compliance with the Income Tax Act of India, Tax Deducted at Source (TDS) at the rate of 2% is deducted from all commission/brokerage payouts. TDS certificates (Form 16A) are issued quarterly and reflected in your AIS/26AS statement.
                </p>
              </div>
            </div>
          </div>

          {/* TDS Metrics 4 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`rounded-2xl p-5 border transition-all ${t(
              'bg-[#150606] border-white/10 shadow-lg',
              'bg-white border-gray-200 shadow-sm'
            )}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${t('text-gray-400', 'text-gray-500')}`}>
                GROSS PAYOUTS
              </span>
              <h4 className={`text-xl font-black font-mono ${t('text-white', 'text-gray-900')}`}>
                {formatINR(metrics.grossIncome)}
              </h4>
            </div>

            <div className={`rounded-2xl p-5 border transition-all ${t(
              'bg-[#150606] border-white/10 shadow-lg',
              'bg-white border-gray-200 shadow-sm'
            )}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${t('text-gray-400', 'text-gray-500')}`}>
                TOTAL TDS DEDUCTED (2%)
              </span>
              <h4 className="text-xl font-black text-red-500 font-mono">
                {formatINR(metrics.tdsDeducted)}
              </h4>
            </div>

            <div className={`rounded-2xl p-5 border transition-all ${t(
              'bg-[#150606] border-white/10 shadow-lg',
              'bg-white border-gray-200 shadow-sm'
            )}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${t('text-gray-400', 'text-gray-500')}`}>
                NET DISBURSED
              </span>
              <h4 className="text-xl font-black text-emerald-500 font-mono">
                {formatINR(metrics.netIncome)}
              </h4>
            </div>

            <div className={`rounded-2xl p-5 border transition-all ${t(
              'bg-[#150606] border-white/10 shadow-lg',
              'bg-white border-gray-200 shadow-sm'
            )}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${t('text-gray-400', 'text-gray-500')}`}>
                FINANCIAL YEAR
              </span>
              <h4 className={`text-xl font-black font-mono ${t('text-white', 'text-gray-900')}`}>
                FY 2026-27
              </h4>
            </div>
          </div>

          {/* TDS Deduction Ledger */}
          <div className={`rounded-2xl overflow-hidden border shadow-sm ${t(
            'bg-[#150606] border-white/10 shadow-lg',
            'bg-white border-gray-200 shadow-sm'
          )}`}>
            <div className={`p-4 sm:p-5 flex items-center justify-between border-b ${t('border-white/10', 'border-gray-200')}`}>
              <h3 className={`text-sm font-bold ${t('text-white', 'text-gray-900')}`}>TDS Certificate &amp; Deduction Ledger</h3>
              <span className={`text-xs ${t('text-gray-400', 'text-gray-600')}`}>Quarterly Form 16A Schedule</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`text-[10px] uppercase tracking-wider font-bold border-b ${t(
                    'bg-white/[0.04] text-gray-300 border-white/10',
                    'bg-gray-100 text-gray-700 border-gray-200'
                  )}`}>
                    <th className="py-3 px-4">QUARTER</th>
                    <th className="py-3 px-4">GROSS AMOUNT</th>
                    <th className="py-3 px-4">TDS RATE</th>
                    <th className="py-3 px-4">TDS DEDUCTED</th>
                    <th className="py-3 px-4">NET PAYOUT</th>
                    <th className="py-3 px-4 text-right">FORM 16A</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={`border-b ${t('border-white/[0.05]', 'border-gray-100')}`}>
                    <td className={`py-3.5 px-4 font-bold ${t('text-white', 'text-gray-900')}`}>Q1 (Apr – Jun 2026)</td>
                    <td className={`py-3.5 px-4 font-mono ${t('text-gray-300', 'text-gray-700')}`}>₹0.00</td>
                    <td className="py-3.5 px-4 text-red-500 font-bold">2.0%</td>
                    <td className="py-3.5 px-4 font-mono text-red-500">₹0.00</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-500">₹0.00</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${t(
                        'text-gray-400 bg-white/[0.04] border-white/10',
                        'text-gray-600 bg-gray-100 border-gray-200'
                      )}`}>
                        Pending Quarter End
                      </span>
                    </td>
                  </tr>
                  <tr className={`border-b ${t('border-white/[0.05]', 'border-gray-100')}`}>
                    <td className={`py-3.5 px-4 font-bold ${t('text-white', 'text-gray-900')}`}>Q2 (Jul – Sep 2026)</td>
                    <td className={`py-3.5 px-4 font-mono ${t('text-gray-300', 'text-gray-700')}`}>₹0.00</td>
                    <td className="py-3.5 px-4 text-red-500 font-bold">2.0%</td>
                    <td className="py-3.5 px-4 font-mono text-red-500">₹0.00</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-500">₹0.00</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${t(
                        'text-gray-400 bg-white/[0.04] border-white/10',
                        'text-gray-600 bg-gray-100 border-gray-200'
                      )}`}>
                        Upcoming
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className={`py-3.5 px-4 font-bold ${t('text-white', 'text-gray-900')}`}>Q3 (Oct – Dec 2026)</td>
                    <td className={`py-3.5 px-4 font-mono ${t('text-gray-300', 'text-gray-700')}`}>₹0.00</td>
                    <td className="py-3.5 px-4 text-red-500 font-bold">2.0%</td>
                    <td className="py-3.5 px-4 font-mono text-red-500">₹0.00</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-500">₹0.00</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${t(
                        'text-gray-400 bg-white/[0.04] border-white/10',
                        'text-gray-600 bg-gray-100 border-gray-200'
                      )}`}>
                        Upcoming
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
