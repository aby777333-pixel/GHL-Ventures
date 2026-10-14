'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ChevronLeft,
  Download,
  Search,
  RotateCcw,
  ArrowUpDown,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  fetchMasterPartnerNetworkInvestments,
  NetworkInvestmentRow,
  ReferralMember,
} from '@/lib/supabase/partnerDashboardService'
import { fetchActiveFundPlans } from '@/lib/supabase/dashboardDataService'
import { FUNDS } from './InvestmentFlowTab'

interface TotalInvestorsPageProps {
  partnerDisplayName: string
  partnerId?: string
  partnerEmail?: string
  authToken?: string
  onBack: () => void
  showToast?: (msg: string, type?: 'success' | 'info') => void
  theme?: 'light' | 'dark'
  isDark?: boolean
  initialNetworkInvestments?: NetworkInvestmentRow[]
  referrals?: ReferralMember[]
}

type SortField = 'sno' | 'userId' | 'name' | 'planName' | 'investDate' | 'investAmount' | 'maturityDate' | 'maturityStatus' | 'returnDate'
type SortOrder = 'asc' | 'desc'

function formatINR(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0'
  return Math.round(val).toLocaleString('en-IN')
}

export default function TotalInvestorsPage({
  partnerDisplayName,
  partnerId,
  partnerEmail,
  authToken,
  onBack,
  showToast,
  isDark = true,
  initialNetworkInvestments,
  referrals,
}: TotalInvestorsPageProps) {
  // ── States ─────────────────────────────────────────────────────────────
  const [investments, setInvestments] = useState<NetworkInvestmentRow[]>(
    initialNetworkInvestments || []
  )
  const [loading, setLoading] = useState<boolean>(!initialNetworkInvestments || initialNetworkInvestments.length === 0)
  const [error, setError] = useState<string | null>(null)

  // Dynamic Plans
  const [dbPlans, setDbPlans] = useState<string[]>([])

  // Filters
  const [selectedPlan, setSelectedPlan] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [dateError, setDateError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Sorting
  const [sortField, setSortField] = useState<SortField>('investDate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1)
  const PAGE_SIZE = 10

  // Theme helper
  const t = useCallback(
    (darkCls: string, lightCls: string) => (isDark ? darkCls : lightCls),
    [isDark]
  )

  // ── Data Fetching ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch network investments
      const data = await fetchMasterPartnerNetworkInvestments(partnerId, partnerEmail, authToken)
      let combined = (data || []).slice()

      // Also ensure any referral who is an investor is included
      if (Array.isArray(referrals)) {
        const existingUserIds = new Set(combined.map((c) => (c.userId || '').toLowerCase()))
        referrals.forEach((r, idx) => {
          const isInvestor = r.memberType !== 'Channel Partner' || (Number(r.investmentAmount) || 0) > 0 || r.status === 'converted'
          if (!isInvestor) return

          const invAmt = Number(r.investmentAmount) || 0
          const uId = r.userId || r.id || `GHL${246000 + idx}`
          if (!existingUserIds.has(uId.toLowerCase())) {
            const dRaw = r.createdAt || r.date || new Date().toISOString()
            const mat = new Date(dRaw)
            mat.setFullYear(mat.getFullYear() + 3)
            combined.push({
              id: `ref-inv-${r.id || idx}`,
              sno: combined.length + 1,
              userId: uId,
              name: r.refereeName || 'Network Investor',
              planName: (r.investments?.[0] as any)?.planName || (invAmt >= 10000000 ? 'Direct AIF Route' : 'Alternate route to Invest in AIF via Debenture'),
              investDate: r.date || new Date(dRaw).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              investDateRaw: dRaw,
              investAmount: invAmt,
              maturityDate: mat.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              maturityDateRaw: mat.toISOString(),
              maturityStatus: r.commissionStatus === 'paid' ? 'Paid' : (invAmt > 0 ? 'Unpaid' : 'Pending'),
              returnDate: '—',
            })
            existingUserIds.add(uId.toLowerCase())
          }
        })
      }

      setInvestments(combined)

      // 2. Fetch active fund plans from DB to combine with built-in FUNDS
      try {
        const plans = await fetchActiveFundPlans()
        if (Array.isArray(plans)) {
          setDbPlans(plans.map((p) => p.fund_name).filter(Boolean))
        }
      } catch {
        // Non-blocking fallback
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load network investments'
      setError(msg)
      if (showToast) showToast(msg, 'info')
    } finally {
      setLoading(false)
    }
  }, [partnerId, partnerEmail, authToken, referrals, showToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Dynamic Unique Plan Options ────────────────────────────────────────
  const planOptions = useMemo(() => {
    const plansSet = new Set<string>()

    // Built-in funds
    FUNDS.forEach((f) => {
      if (f.name) plansSet.add(f.name)
    })

    // Admin database plans
    dbPlans.forEach((p) => {
      if (p) plansSet.add(p)
    })

    // Distinct plans present in actual investment records
    investments.forEach((inv) => {
      if (inv.planName) plansSet.add(inv.planName)
    })

    return Array.from(plansSet).sort()
  }, [dbPlans, investments])

  // ── Date Range Validation ──────────────────────────────────────────────
  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setDateFrom(val)
    if (val && dateTo && new Date(val) > new Date(dateTo)) {
      setDateError('From date must be earlier than or equal to To date')
    } else {
      setDateError(null)
    }
    setCurrentPage(1)
  }

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setDateTo(val)
    if (dateFrom && val && new Date(dateFrom) > new Date(val)) {
      setDateError('To date must be later than or equal to From date')
    } else {
      setDateError(null)
    }
    setCurrentPage(1)
  }

  // ── Reset Handler ──────────────────────────────────────────────────────
  const handleReset = () => {
    setSelectedPlan('all')
    setDateFrom('')
    setDateTo('')
    setDateError(null)
    setSearchQuery('')
    setSortField('investDate')
    setSortOrder('desc')
    setCurrentPage(1)
    if (showToast) showToast('Filters reset', 'info')
  }

  // ── Filtered & Sorted Records ──────────────────────────────────────────
  const filteredInvestments = useMemo(() => {
    return investments.filter((item) => {
      // 1. Plan Name filter
      if (selectedPlan !== 'all') {
        if (item.planName.trim().toLowerCase() !== selectedPlan.trim().toLowerCase()) {
          return false
        }
      }

      // 2. Date Range filter (using investDateRaw or parsed investDate)
      if (dateFrom || dateTo) {
        const itemDateStr = item.investDateRaw || item.investDate
        const itemDate = new Date(itemDateStr)
        if (!isNaN(itemDate.getTime())) {
          if (dateFrom) {
            const fromD = new Date(dateFrom)
            fromD.setHours(0, 0, 0, 0)
            if (itemDate < fromD) return false
          }
          if (dateTo) {
            const toD = new Date(dateTo)
            toD.setHours(23, 59, 59, 999)
            if (itemDate > toD) return false
          }
        }
      }

      // 3. Search query (matches User ID or Name)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchesId = item.userId.toLowerCase().includes(q)
        const matchesName = item.name.toLowerCase().includes(q)
        if (!matchesId && !matchesName) return false
      }

      return true
    })
  }, [investments, selectedPlan, dateFrom, dateTo, searchQuery])

  // Sorting
  const sortedInvestments = useMemo(() => {
    const list = [...filteredInvestments]
    list.sort((a, b) => {
      let valA: string | number = ''
      let valB: string | number = ''

      switch (sortField) {
        case 'sno':
          valA = a.sno || 0
          valB = b.sno || 0
          break
        case 'userId':
          valA = a.userId.toLowerCase()
          valB = b.userId.toLowerCase()
          break
        case 'name':
          valA = a.name.toLowerCase()
          valB = b.name.toLowerCase()
          break
        case 'planName':
          valA = a.planName.toLowerCase()
          valB = b.planName.toLowerCase()
          break
        case 'investDate':
          valA = new Date(a.investDateRaw || a.investDate).getTime() || 0
          valB = new Date(b.investDateRaw || b.investDate).getTime() || 0
          break
        case 'investAmount':
          valA = a.investAmount || 0
          valB = b.investAmount || 0
          break
        case 'maturityDate':
          valA = new Date(a.maturityDateRaw || a.maturityDate).getTime() || 0
          valB = new Date(b.maturityDateRaw || b.maturityDate).getTime() || 0
          break
        case 'maturityStatus':
          valA = a.maturityStatus
          valB = b.maturityStatus
          break
        case 'returnDate':
          valA = a.returnDate.toLowerCase()
          valB = b.returnDate.toLowerCase()
          break
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [filteredInvestments, sortField, sortOrder])

  // Total Invested amount of active filtered rows
  const totalInvestedFiltered = useMemo(() => {
    return filteredInvestments.reduce((sum, item) => sum + (item.investAmount || 0), 0)
  }, [filteredInvestments])

  // ── Pagination Calculation ─────────────────────────────────────────────
  const totalPages = Math.ceil(sortedInvestments.length / PAGE_SIZE) || 1
  const paginatedInvestments = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return sortedInvestments.slice(startIndex, startIndex + PAGE_SIZE)
  }, [sortedInvestments, currentPage])

  // Generate pagination items with ellipsis (e.g. 1 2 3 4 5 ... 15)
  const paginationItems = useMemo(() => {
    const items: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i)
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) items.push(i)
        items.push('...')
        items.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        items.push(1)
        items.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) items.push(i)
      } else {
        items.push(1)
        items.push('...')
        items.push(currentPage - 1)
        items.push(currentPage)
        items.push(currentPage + 1)
        items.push('...')
        items.push(totalPages)
      }
    }
    return items
  }, [totalPages, currentPage])

  // Toggle sort helper
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // ── CSV Export ─────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (filteredInvestments.length === 0) {
      if (showToast) showToast('No rows to export', 'info')
      return
    }

    const headers = [
      'SNO',
      'USER ID',
      'NAME',
      'PLAN NAME',
      'INVEST DATE',
      'INVEST AMOUNT',
      'MATURITY DATE',
      'MATURITY STATUS',
      'RETURN DATE',
    ]

    const csvRows = filteredInvestments.map((row, idx) => {
      const cleanName = `"${(row.name || '').replace(/"/g, '""')}"`
      const cleanPlan = `"${(row.planName || '').replace(/"/g, '""')}"`
      return [
        idx + 1,
        row.userId,
        cleanName,
        cleanPlan,
        row.investDate,
        row.investAmount, // raw unformatted number
        row.maturityDate || '—',
        row.maturityStatus,
        row.returnDate || '—',
      ].join(',')
    })

    const csvContent = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const cleanCompany = (partnerDisplayName || 'Partner').replace(/[^a-zA-Z0-9_-]/g, '_')
    link.href = url
    link.setAttribute('download', `${cleanCompany}_Total_Investors_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    if (showToast) showToast('CSV exported successfully!', 'success')
  }

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. WELCOME HEADER (Matches reference: Welcome - Mishmash Finserve LLP)
          ───────────────────────────────────────────────────────────── */}
      <div>
        <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${t('text-white', 'text-gray-900')}`}>
          Welcome - <span className="text-[#C8102E] font-extrabold italic">{partnerDisplayName}</span>
        </h1>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CRIMSON / BURGUNDY GRADIENT BANNER
          ───────────────────────────────────────────────────────────── */}
      <div
        className="w-full rounded-2xl bg-gradient-to-r from-[#1c0205] via-[#850012] to-[#db081f] p-6 sm:p-7 text-white shadow-xl relative overflow-hidden"
      >
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-white/80 mb-2">
          EVERY INVESTMENT MADE ACROSS MASTER CHANNEL PARTNER&apos;S REFERRAL NETWORK
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Total Investor List
        </h2>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN TOTAL INVESTOR CARD
          ───────────────────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl border shadow-xl overflow-hidden relative transition-all ${t(
          'bg-[#140606] border-white/10 text-white',
          'bg-white border-gray-200 text-gray-900'
        )}`}
      >
        {/* Subtle top red glow line matching screenshot */}
        <div className="h-1 bg-gradient-to-r from-red-600 via-[#C8102E] to-red-700 w-full" />

        {/* ── CARD TOOLBAR ─────────────────────────────────────────── */}
        <div
          className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b ${t(
            'border-white/10 bg-[#1a0808]/50',
            'border-gray-100 bg-gray-50/70'
          )}`}
        >
          {/* Left: Back button & Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onBack}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 shadow-sm ${t(
                'bg-white/10 hover:bg-white/15 text-white border-white/15',
                'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
              )}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {partnerDisplayName} Total Investor
              </h2>
              <p className={`text-xs ${t('text-gray-400', 'text-gray-500')} font-medium mt-0.5`}>
                {filteredInvestments.length} investments · ₹{formatINR(totalInvestedFiltered)} total invested
              </p>
            </div>
          </div>

          {/* Right: Export CSV & Debounced Search */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleExportCSV}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 shadow-sm ${t(
                'bg-white/10 hover:bg-white/15 text-white border-white/15',
                'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'
              )}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by ID or name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className={`pl-8 pr-3.5 py-1.5 text-xs rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 w-48 sm:w-60 ${t(
                  'bg-white/[0.04] border-white/15 text-white placeholder-gray-500',
                  'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                )}`}
              />
            </div>
          </div>
        </div>

        {/* ── FILTER BAR (Light Rose/Pink Background per reference) ── */}
        <div
          className={`p-4 sm:p-5 border-b ${t(
            'bg-[#22070a] border-red-500/20',
            'bg-[#FFF0F2] border-rose-100'
          )}`}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 flex-1">
              {/* PLAN NAME Filter */}
              <div className="w-full sm:w-64">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C8102E] mb-1.5">
                  PLAN NAME
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => {
                    setSelectedPlan(e.target.value)
                    setCurrentPage(1)
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-xl border transition-all font-medium focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 ${t(
                    'bg-[#140606] border-white/15 text-white',
                    'bg-white border-gray-300 text-gray-900 shadow-sm'
                  )}`}
                >
                  <option value="all">All Plans</option>
                  {planOptions.map((plan) => (
                    <option key={plan} value={plan}>
                      {plan}
                    </option>
                  ))}
                </select>
              </div>

              {/* INVEST DATE RANGE Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C8102E] mb-1.5">
                  INVEST DATE RANGE
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={handleDateFromChange}
                    className={`px-3 py-2 text-xs rounded-xl border transition-all font-medium focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 ${t(
                      'bg-[#140606] border-white/15 text-white',
                      'bg-white border-gray-300 text-gray-900 shadow-sm'
                    )}`}
                  />
                  <span className={`text-xs font-semibold ${t('text-gray-400', 'text-gray-500')}`}>
                    to
                  </span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={handleDateToChange}
                    className={`px-3 py-2 text-xs rounded-xl border transition-all font-medium focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 ${t(
                      'bg-[#140606] border-white/15 text-white',
                      'bg-white border-gray-300 text-gray-900 shadow-sm'
                    )}`}
                  />
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <div className="self-end">
              <button
                onClick={handleReset}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 shadow-sm ${t(
                  'bg-white/10 hover:bg-white/15 text-white border-white/15',
                  'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
                )}`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Date Validation Alert if invalid */}
          {dateError && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-500 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{dateError}</span>
            </div>
          )}
        </div>

        {/* ── TABLE ────────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr
                className={`border-b text-[10px] font-bold uppercase tracking-wider select-none ${t(
                  'bg-[#1a0808] border-white/10 text-gray-400',
                  'bg-gray-50 border-gray-200 text-gray-600'
                )}`}
              >
                <th className="py-3.5 px-4 w-12 text-center">SNO</th>
                <th
                  onClick={() => toggleSort('userId')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#C8102E] transition-colors"
                >
                  <span className="inline-flex items-center gap-1">
                    USER ID
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </span>
                </th>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#C8102E] transition-colors"
                >
                  <span className="inline-flex items-center gap-1">
                    NAME
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </span>
                </th>
                <th
                  onClick={() => toggleSort('planName')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#C8102E] transition-colors"
                >
                  <span className="inline-flex items-center gap-1">
                    PLAN NAME
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </span>
                </th>
                <th
                  onClick={() => toggleSort('investDate')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#C8102E] transition-colors"
                >
                  <span className="inline-flex items-center gap-1">
                    INVEST DATE
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </span>
                </th>
                <th
                  onClick={() => toggleSort('investAmount')}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-[#C8102E] transition-colors"
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    INVEST AMOUNT
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </span>
                </th>
                <th
                  onClick={() => toggleSort('maturityDate')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#C8102E] transition-colors"
                >
                  <span className="inline-flex items-center gap-1">
                    MATURITY DATE
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </span>
                </th>
                <th
                  onClick={() => toggleSort('maturityStatus')}
                  className="py-3.5 px-4 text-center cursor-pointer hover:text-[#C8102E] transition-colors"
                >
                  <span className="inline-flex items-center gap-1 justify-center">
                    MATURITY STATUS
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </span>
                </th>
                <th
                  onClick={() => toggleSort('returnDate')}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-[#C8102E] transition-colors"
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    RETURN DATE
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </span>
                </th>
              </tr>
            </thead>

            <tbody className={`divide-y ${t('divide-white/[0.04]', 'divide-gray-100')}`}>
              {loading ? (
                // Skeleton loading state
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-4 px-4 text-center text-gray-400 font-mono text-xs">{idx + 1}</td>
                    <td className="py-4 px-4"><div className="h-3 w-20 bg-gray-300 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-3 w-32 bg-gray-300 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-3 w-40 bg-gray-300 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-3 w-24 bg-gray-300 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-3 w-20 bg-gray-300 dark:bg-white/10 rounded ml-auto" /></td>
                    <td className="py-4 px-4"><div className="h-3 w-24 bg-gray-300 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-5 w-16 bg-gray-300 dark:bg-white/10 rounded-full mx-auto" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-3 w-20 bg-gray-300 dark:bg-white/10 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                // Error state with retry
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                      <p className="text-sm font-semibold text-rose-500">{error}</p>
                      <button
                        onClick={loadData}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-[#C8102E] text-white hover:bg-red-700 transition-all shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : paginatedInvestments.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={9} className="py-14 text-center text-gray-500 italic">
                    No investments found matching your filters.
                  </td>
                </tr>
              ) : (
                // Real rows
                paginatedInvestments.map((inv, idx) => {
                  const sequentialNumber = (currentPage - 1) * PAGE_SIZE + idx + 1
                  return (
                    <tr
                      key={inv.id || `inv-${idx}`}
                      className={`transition-colors ${t(
                        'hover:bg-white/[0.02]',
                        'hover:bg-gray-50/80'
                      )}`}
                    >
                      {/* SNO */}
                      <td className={`py-3.5 px-4 text-center font-mono text-xs ${t('text-gray-400', 'text-gray-500')}`}>
                        {sequentialNumber}
                      </td>

                      {/* USER ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-red">
                        {inv.userId}
                      </td>

                      {/* NAME */}
                      <td className={`py-3.5 px-4 font-semibold ${t('text-white', 'text-gray-900')}`}>
                        {inv.name}
                      </td>

                      {/* PLAN NAME */}
                      <td className={`py-3.5 px-4 ${t('text-gray-300', 'text-gray-700')}`}>
                        {inv.planName}
                      </td>

                      {/* INVEST DATE */}
                      <td className={`py-3.5 px-4 ${t('text-gray-400', 'text-gray-600')}`}>
                        {inv.investDate}
                      </td>

                      {/* INVEST AMOUNT */}
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${t('text-white', 'text-gray-900')}`}>
                        ₹{formatINR(inv.investAmount)}
                      </td>

                      {/* MATURITY DATE (Immediately after INVEST AMOUNT) */}
                      <td className={`py-3.5 px-4 ${t('text-gray-400', 'text-gray-600')}`}>
                        {inv.maturityDate || '—'}
                      </td>

                      {/* MATURITY STATUS */}
                      <td className="py-3.5 px-4 text-center">
                        {inv.maturityStatus === 'Paid' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Paid
                          </span>
                        ) : inv.maturityStatus === 'Pending' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Unpaid
                          </span>
                        )}
                      </td>

                      {/* RETURN DATE */}
                      <td className={`py-3.5 px-4 text-right font-mono ${t('text-gray-300', 'text-gray-700')}`}>
                        {inv.returnDate || '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── CARD FOOTER / PAGINATION ─────────────────────────────── */}
        <div
          className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t ${t(
            'border-white/10 bg-[#1a0808]/30',
            'border-gray-100 bg-gray-50/50'
          )}`}
        >
          {/* Summary left */}
          <span className={`text-xs font-medium ${t('text-gray-400', 'text-gray-500')}`}>
            {filteredInvestments.length} investments
          </span>

          {/* Numbered pagination controls */}
          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${t(
                'border-white/10 bg-white/5 hover:bg-white/10 text-gray-300',
                'border-gray-200 bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
              )}`}
            >
              ‹ Prev
            </button>

            {paginationItems.map((item, idx) =>
              item === '...' ? (
                <span key={`dots-${idx}`} className="px-2 text-gray-400 text-xs">
                  ...
                </span>
              ) : (
                <button
                  key={`page-${item}`}
                  onClick={() => setCurrentPage(Number(item))}
                  disabled={loading}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all ${currentPage === item
                      ? 'bg-[#C8102E] text-white shadow-sm'
                      : t(
                        'border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300',
                        'border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
                      )
                    }`}
                >
                  {item}
                </button>
              )
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0 || loading}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${t(
                'border-white/10 bg-white/5 hover:bg-white/10 text-gray-300',
                'border-gray-200 bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
              )}`}
            >
              Next ›
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
