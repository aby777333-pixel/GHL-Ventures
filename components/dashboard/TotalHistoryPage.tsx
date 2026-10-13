'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ChevronLeft,
  Search,
  Download,
  Eye,
  X,
} from 'lucide-react'
import { ReferralMember } from '@/lib/supabase/partnerDashboardService'

interface TotalHistoryPageProps {
  partnerDisplayName: string
  referrals: ReferralMember[]
  onBack: () => void
  showToast?: (msg: string, type?: 'success' | 'info') => void
  theme?: 'light' | 'dark'
  isDark?: boolean
}

const GHL_2_TIER_SLABS = [
  {
    tier: 'Tier 1',
    rateDisplay: '3%',
    rangeDisplay: '1 Cr – 5 Cr',
    bgClass: 'bg-gradient-to-r from-amber-500 to-amber-600',
  },
  {
    tier: 'Tier 2',
    rateDisplay: '4%',
    rangeDisplay: '5 Cr and Above',
    bgClass: 'bg-gradient-to-r from-red-600 to-red-700',
  },
]

function getGrossRateForAmount(amount: number): number {
  if (amount >= 50000000) return 4.0
  if (amount >= 10000000) return 3.0
  return 3.0
}

function formatIndianNumber(n: number): string {
  if (!n || isNaN(n)) return '0'
  return new Intl.NumberFormat('en-IN').format(Math.round(n))
}

function formatDateHyphen(d?: string | null): string {
  if (!d) return '—'
  const dateObj = new Date(d)
  if (isNaN(dateObj.getTime())) {
    return d.replace(/\//g, '-')
  }
  const day = String(dateObj.getDate()).padStart(2, '0')
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const year = dateObj.getFullYear()
  return `${day}-${month}-${year}`
}

export default function TotalHistoryPage({
  partnerDisplayName,
  referrals,
  onBack,
  showToast,
  isDark = true,
}: TotalHistoryPageProps) {
  // Theme helper
  const t = useCallback(
    (darkCls: string, lightCls: string) => (isDark ? darkCls : lightCls),
    [isDark]
  )

  // State
  const [historyYear, setHistoryYear] = useState<number>(new Date().getFullYear())
  const [historyCohort, setHistoryCohort] = useState<'general_investor' | 'channel_partner'>('general_investor')
  const [selectedMonthHistory, setSelectedMonthHistory] = useState<{
    monthIndex: number
    monthName: string
    year: number
    totalAmount: number
    referrals: ReferralMember[]
  } | null>(null)

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    years.add(new Date().getFullYear())
    for (const r of referrals) {
      const dStr = r.createdAt || r.date
      if (dStr) {
        const yr = new Date(dStr).getFullYear()
        if (!isNaN(yr)) years.add(yr)
      }
    }
    return Array.from(years).sort((a, b) => b - a)
  }, [referrals])

  // Monthly breakdown calculation
  const monthlyIncomeHistory = useMemo(() => {
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthsFull = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ]

    return monthsShort.map((mShort, idx) => {
      // Filter referrals for this month, year, and active cohort
      const matchingRefs = referrals.filter((r) => {
        const dStr = r.createdAt || r.date
        if (!dStr) return false
        const d = new Date(dStr)
        if (isNaN(d.getTime())) return false
        const yr = d.getFullYear()
        const m = d.getMonth()
        if (yr !== historyYear || m !== idx) return false

        if (historyCohort === 'general_investor') {
          return r.memberType !== 'Channel Partner'
        } else {
          return r.memberType === 'Channel Partner'
        }
      })

      const totalInsAmount = matchingRefs.reduce((acc, r) => acc + (Number(r.investmentAmount) || 0), 0)
      const grossRate = getGrossRateForAmount(totalInsAmount)
      const grossRateDisplay = totalInsAmount > 0 ? `${grossRate}%` : '0%'
      const grossRefIncome = Math.round((totalInsAmount * grossRate) / 100)
      const tds = Math.round(grossRefIncome * 0.02)
      const netRefIncome = grossRefIncome - tds

      let paidStatus: 'Paid' | 'Unpaid' | '—' = '—'
      let paidDate = '—'

      if (totalInsAmount > 0) {
        const paidRefs = matchingRefs.filter((r) => r.commissionStatus === 'paid')
        if (paidRefs.length > 0) {
          paidStatus = 'Paid'
          const latestPaid = paidRefs.reduce((prev, curr) => {
            const prevT = new Date(prev.updatedAt || prev.createdAt || '').getTime() || 0
            const currT = new Date(curr.updatedAt || curr.createdAt || '').getTime() || 0
            return currT >= prevT ? curr : prev
          }, paidRefs[0])
          paidDate = formatDateHyphen(latestPaid.updatedAt || latestPaid.createdAt)
        } else {
          paidStatus = 'Unpaid'
          paidDate = '—'
        }
      }

      return {
        sno: idx + 1,
        monthShort: mShort,
        monthFull: monthsFull[idx],
        totalInsAmount,
        grossRate,
        grossRateDisplay,
        grossRefIncome,
        tds,
        netRefIncome,
        paidStatus,
        paidDate,
        referrals: matchingRefs,
      }
    })
  }, [referrals, historyYear, historyCohort])

  // Handle ESC key for drilldown modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedMonthHistory) {
        setSelectedMonthHistory(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedMonthHistory])

  // Export CSV
  const handleExportHistoryCSV = () => {
    const cohortLabel = historyCohort === 'general_investor' ? 'General_Investor' : 'Channel_Partner'
    const headers = [
      'SNO',
      'MONTH',
      'TOTAL INS AMOUNT',
      'GROSS %',
      'GROSS REF INCOME',
      'TDS (2%)',
      'NET REF INCOME',
      'PAID STATUS',
      'PAID DATE',
    ]
    const rows = monthlyIncomeHistory.map((row) => [
      row.sno,
      row.monthShort,
      row.totalInsAmount,
      row.grossRateDisplay,
      row.grossRefIncome,
      row.tds,
      row.netRefIncome,
      row.paidStatus,
      row.paidDate,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((val) => (typeof val === 'string' && val.includes(',') ? `"${val}"` : val)).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `referral-income-history-${cohortLabel}-${historyYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    if (showToast) showToast('Referral income history CSV exported successfully!', 'success')
  }

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. WELCOME HEADER (Matches Reference)
          ───────────────────────────────────────────────────────────── */}
      <div>
        <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${t('text-white', 'text-gray-900')}`}>
          Welcome, <span className="text-[#C8102E] font-extrabold italic">{partnerDisplayName}</span>
        </h1>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CRIMSON / BURGUNDY GRADIENT BANNER
          ───────────────────────────────────────────────────────────── */}
      <div
        className="w-full rounded-2xl bg-gradient-to-r from-[#1c0205] via-[#850012] to-[#db081f] p-6 sm:p-7 text-white shadow-xl relative overflow-hidden"
      >
        <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/85 mb-1.5">
          MONTH-BY-MONTH INVESTMENT TOTALS, REFERRAL INCOME SLABS, AND PAYOUT STATUS
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Referral Income History
        </h2>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SLAB REFERENCE BOX (GHL India Ventures 2-Tier Slab)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center my-6">
        <div className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${t('text-gray-400', 'text-gray-500')}`}>
          REFERRAL GROSS % SLAB (REFERENCE)
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {GHL_2_TIER_SLABS.map((slab) => (
            <div
              key={slab.tier}
              className={`px-8 py-3.5 rounded-2xl text-white shadow-md text-center min-w-[150px] ${slab.bgClass}`}
            >
              <div className="text-xl font-black tracking-tight">{slab.rateDisplay}</div>
              <div className="text-xs font-semibold opacity-95 tracking-wide mt-0.5">
                {slab.rangeDisplay}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. CONTROLS ROW: Back Button (Left) + Cohort Pill Toggle (Right)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistoryCohort('general_investor')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
              historyCohort === 'general_investor'
                ? 'bg-[#C8102E] text-white shadow-red-500/20'
                : t(
                    'bg-white/5 text-gray-300 border border-white/15 hover:bg-white/10',
                    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  )
            }`}
          >
            General Investor
          </button>
          <button
            onClick={() => setHistoryCohort('channel_partner')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
              historyCohort === 'channel_partner'
                ? 'bg-[#C8102E] text-white shadow-red-500/20'
                : t(
                    'bg-white/5 text-gray-300 border border-white/15 hover:bg-white/10',
                    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  )
            }`}
          >
            Channel Partner
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. MAIN 12-MONTH TABLE CARD
          ───────────────────────────────────────────────────────────── */}
      <div
        className={`w-full rounded-2xl border border-t-4 border-t-[#C8102E] shadow-xl overflow-hidden ${t(
          'bg-[#140606] border-white/10 text-white',
          'bg-white border-gray-200 text-gray-900'
        )}`}
      >
        {/* Card Header */}
        <div
          className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b ${t(
            'border-white/10 bg-[#1a0808]/50',
            'border-gray-100 bg-gray-50/70'
          )}`}
        >
          <h2 className="text-base sm:text-lg font-black tracking-tight">
            {historyCohort === 'general_investor' ? 'General Investor' : 'Channel Partner'} — Monthly Investment ({historyYear})
          </h2>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Year select */}
            <select
              value={historyYear}
              onChange={(e) => setHistoryYear(Number(e.target.value))}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 ${t(
                'bg-[#140606] border-white/15 text-white',
                'bg-white border-gray-300 text-gray-800 shadow-sm'
              )}`}
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            {/* Export CSV button */}
            <button
              onClick={handleExportHistoryCSV}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${t(
                'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-950/60 border border-emerald-800/60',
                'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
              )}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 12-Month Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr
                className={`border-b text-[10px] font-bold uppercase tracking-wider select-none ${t(
                  'bg-[#1a0808] border-white/10 text-gray-400',
                  'bg-gray-50 border-gray-200 text-gray-600'
                )}`}
              >
                <th className="py-3.5 px-4">SNO</th>
                <th className="py-3.5 px-4">MONTH</th>
                <th className="py-3.5 px-4">TOTAL INS AMOUNT</th>
                <th className="py-3.5 px-4">GROSS %</th>
                <th className="py-3.5 px-4">GROSS REF INCOME</th>
                <th className="py-3.5 px-4">TDS (2%)</th>
                <th className="py-3.5 px-4">NET REF INCOME</th>
                <th className="py-3.5 px-4 text-center">PAID STATUS</th>
                <th className="py-3.5 px-4">PAID DATE</th>
                <th className="py-3.5 px-4 text-center">VIEW HISTORY</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${t('divide-white/[0.04]', 'divide-gray-100')}`}>
              {monthlyIncomeHistory.map((row) => (
                <tr
                  key={row.sno}
                  className={`transition-colors ${t(
                    'hover:bg-white/[0.02]',
                    'hover:bg-gray-50/80'
                  )}`}
                >
                  <td className={`py-3 px-4 font-mono ${t('text-gray-400', 'text-gray-500')}`}>
                    {row.sno}
                  </td>
                  <td className={`py-3 px-4 font-semibold ${t('text-white', 'text-gray-900')}`}>
                    {row.monthShort}
                  </td>
                  <td className={`py-3 px-4 font-bold ${t('text-white', 'text-gray-900')}`}>
                    ₹{formatIndianNumber(row.totalInsAmount)}
                  </td>
                  <td className={`py-3 px-4 ${t('text-gray-300', 'text-gray-700')}`}>
                    {row.grossRateDisplay}
                  </td>
                  <td className={`py-3 px-4 font-bold ${t('text-white', 'text-gray-900')}`}>
                    ₹{formatIndianNumber(row.grossRefIncome)}
                  </td>
                  <td className={`py-3 px-4 ${t('text-gray-400', 'text-gray-500')}`}>
                    ₹{formatIndianNumber(row.tds)}
                  </td>
                  <td className={`py-3 px-4 font-bold ${t('text-white', 'text-gray-900')}`}>
                    ₹{formatIndianNumber(row.netRefIncome)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.paidStatus === 'Paid' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Paid
                      </span>
                    ) : row.paidStatus === 'Unpaid' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Unpaid
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className={`py-3 px-4 font-mono text-xs ${t('text-gray-400', 'text-gray-600')}`}>
                    {row.paidDate}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() =>
                        setSelectedMonthHistory({
                          monthIndex: row.sno - 1,
                          monthName: row.monthShort,
                          year: historyYear,
                          totalAmount: row.totalInsAmount,
                          referrals: row.referrals,
                        })
                      }
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/15 dark:hover:bg-red-500/25 text-[#C8102E] transition-colors inline-flex items-center justify-center shadow-sm"
                      title={`View history for ${row.monthShort} ${historyYear}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. VIEW HISTORY DRILLDOWN MODAL
          ───────────────────────────────────────────────────────────── */}
      {selectedMonthHistory && (
        <div
          className="fixed inset-0 z-[10020] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedMonthHistory(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border animate-scale-in ${t(
              'bg-[#140606] border-white/10 text-white',
              'bg-white border-gray-200 text-gray-900'
            )}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-[#1c0205] via-[#850012] to-[#db081f] px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                  <Eye className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {selectedMonthHistory.monthName} {selectedMonthHistory.year} — {historyCohort === 'general_investor' ? 'General Investor' : 'Channel Partner'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMonthHistory(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Table Body */}
            <div className="p-5">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${t('border-white/10 text-gray-400', 'border-gray-200 text-gray-500')}`}>
                    <th className="pb-3 font-bold">NAME</th>
                    <th className="pb-3 font-bold">DATE</th>
                    <th className="pb-3 text-right font-bold">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${t('divide-white/[0.04]', 'divide-gray-100')}`}>
                  {selectedMonthHistory.referrals.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500 italic">
                        No referral transactions for {selectedMonthHistory.monthName} {selectedMonthHistory.year}.
                      </td>
                    </tr>
                  ) : (
                    selectedMonthHistory.referrals.map((r, i) => (
                      <tr key={r.id || i} className={`transition-colors ${t('hover:bg-white/[0.02]', 'hover:bg-gray-50')}`}>
                        <td className={`py-3 font-semibold ${t('text-white', 'text-gray-900')}`}>
                          {r.refereeName || 'Referral Contact'}
                        </td>
                        <td className={`py-3 ${t('text-gray-400', 'text-gray-500')}`}>
                          {r.joinedOnDate || formatDateHyphen(r.createdAt || r.date)}
                        </td>
                        <td className={`py-3 text-right font-bold ${t('text-white', 'text-gray-900')}`}>
                          ₹{formatIndianNumber(r.investmentAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className={`border-t ${t('border-white/10', 'border-gray-200')}`}>
                    <td colSpan={2} className={`pt-4 font-bold text-sm ${t('text-white', 'text-gray-900')}`}>
                      Total
                    </td>
                    <td className="pt-4 text-right font-black text-sm text-[#C8102E]">
                      ₹{formatIndianNumber(selectedMonthHistory.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
