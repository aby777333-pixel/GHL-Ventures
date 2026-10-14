'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ChevronLeft,
  Download,
  Eye,
  X,
  RefreshCw,
  FileText,
  CheckCircle,
  TrendingUp,
} from 'lucide-react'
import {
  ReferralMember,
  NetworkInvestmentRow,
  PartnerRole,
  SubChannelPartner,
} from '@/lib/supabase/partnerDashboardService'

export interface HistoryInvestorItem {
  id: string
  userId: string
  name: string
  email?: string
  phone?: string
  city?: string
  date: string
  rawDate: string
  amount: number
  planName?: string
  status: string
  commissionRate: number
  commissionAmount: number
  payoutStatus: 'Paid' | 'Unpaid'
  payoutDate?: string
  notes?: string
}

export interface MonthHistoryDetail {
  monthIndex: number
  monthName: string
  year: number
  totalAmount: number
  grossRate: number
  grossRateDisplay: string
  grossRefIncome: number
  tds: number
  netRefIncome: number
  paidStatus: 'Paid' | 'Unpaid' | '—'
  paidDate: string
  investors: HistoryInvestorItem[]
}

interface TotalHistoryPageProps {
  partnerDisplayName: string
  referrals: ReferralMember[]
  networkInvestments?: NetworkInvestmentRow[]
  subChannelPartners?: SubChannelPartner[]
  partnerRole?: PartnerRole
  authenticatedPartnerId?: string
  authToken?: string
  onBack: () => void
  showToast?: (msg: string, type?: 'success' | 'info') => void
  theme?: 'light' | 'dark'
  isDark?: boolean
}

interface SlabItem {
  tier: string
  rateDisplay: string
  rangeDisplay: string
  bgClass: string
}

const MCP_SLABS: SlabItem[] = [
  {
    tier: 'Tier 1',
    rateDisplay: '3%',
    rangeDisplay: '1 Cr – 4.9 Cr',
    bgClass: 'bg-gradient-to-r from-amber-500 to-amber-600',
  },
  {
    tier: 'Tier 2',
    rateDisplay: '4%',
    rangeDisplay: '5 Cr and Above',
    bgClass: 'bg-gradient-to-r from-red-600 to-red-700',
  },
]

const CPL_SLABS: SlabItem[] = [
  {
    tier: 'Tier 1',
    rateDisplay: '0.5%',
    rangeDisplay: 'Any Investment',
    bgClass: 'bg-gradient-to-r from-amber-500 to-amber-600',
  },
]

function getGrossRateForAmount(amount: number, role?: PartnerRole): number {
  if (role === 'MCP') return 4.5
  if (role === 'CPL') return 3.5
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
  networkInvestments = [],
  subChannelPartners = [],
  partnerRole = 'GI',
  authenticatedPartnerId,
  authToken,
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
  const [selectedMonthHistory, setSelectedMonthHistory] = useState<MonthHistoryDetail | null>(null)
  const [selectedInvestorCheckout, setSelectedInvestorCheckout] = useState<HistoryInvestorItem | null>(null)

  const isMcp = useMemo(() => {
    const roleUpper = String(partnerRole || '').toUpperCase()
    const idUpper = String(authenticatedPartnerId || '').toUpperCase()
    return roleUpper === 'MCP' || idUpper.startsWith('MCP')
  }, [partnerRole, authenticatedPartnerId])

  // Ensure non-MCP partner roles (like CPL) always default to and stay on general_investor
  useEffect(() => {
    if (!isMcp && historyCohort !== 'general_investor') {
      setHistoryCohort('general_investor')
    }
  }, [isMcp, historyCohort])

  // Active slabs based on partner role: MCP -> 3% (1 Cr - 4.9 Cr), 4% (5 Cr and Above); CPL -> 0.5% (Any Investment)
  const activeSlabs = useMemo(() => {
    if (isMcp) return MCP_SLABS
    return CPL_SLABS
  }, [isMcp])

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    years.add(new Date().getFullYear())
    for (const r of referrals) {
      const dStr = r.createdAt || r.date || r.joinedOnDate
      if (dStr) {
        const yr = new Date(dStr).getFullYear()
        if (!isNaN(yr)) years.add(yr)
      }
    }
    if (Array.isArray(subChannelPartners)) {
      for (const p of subChannelPartners) {
        if (p.createdAt) {
          const yr = new Date(p.createdAt).getFullYear()
          if (!isNaN(yr)) years.add(yr)
        }
      }
    }
    return Array.from(years).sort((a, b) => b - a)
  }, [referrals, subChannelPartners])

  // Count of leads in the current history cohort matching the index page referrals
  const cohortLeadsCount = useMemo(() => {
    if (historyCohort === 'general_investor') {
      return referrals.filter((r) => r.memberType !== 'Channel Partner').length
    }
    const partnerCount = Array.isArray(subChannelPartners) ? subChannelPartners.length : 0
    const cpRef = referrals.filter((r) => r.memberType === 'Channel Partner' || (r.refereeName && r.refereeName.toLowerCase().includes('mcp'))).length
    return Math.max(partnerCount, cpRef, 1)
  }, [referrals, subChannelPartners, historyCohort])

  // Monthly breakdown calculation: strictly connects to all database records
  const monthlyIncomeHistory = useMemo(() => {
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthsFull = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ]

    return monthsShort.map((mShort, idx) => {
      const investorMap = new Map<string, HistoryInvestorItem>()

      if (historyCohort === 'general_investor') {
        // GENERAL INVESTOR TAB:
        // Strictly show only General Investor referrals that exist in the referrals list
        const giList = referrals.filter((r) => r.memberType !== 'Channel Partner')
        for (const r of giList) {
          const dStr = r.createdAt || r.date || r.joinedOnDate
          if (!dStr) continue
          const d = new Date(dStr)
          if (isNaN(d.getTime())) continue
          if (d.getFullYear() !== historyYear || d.getMonth() !== idx) continue

          const amt = Number(r.investmentAmount) || 0
          const rate = r.commissionRate || (partnerRole === 'MCP' ? 4.5 : partnerRole === 'CPL' ? 3.5 : (amt >= 50000000 ? 4.0 : 3.0))
          const comm = amt > 0 ? (r.commissionAmount || Math.round((amt * rate) / 100)) : 0
          const itemKey = r.userId || r.id

          investorMap.set(itemKey, {
            id: r.id,
            userId: r.userId || r.id,
            name: r.refereeName,
            email: r.refereeEmail,
            phone: r.refereePhone,
            city: r.refereeCity,
            date: r.joinedOnDate || formatDateHyphen(dStr),
            rawDate: dStr,
            amount: amt,
            planName: amt > 0 ? 'Alternate route to Invest in AIF via Debenture' : 'Registration / KYC In Review',
            status: amt > 0 ? 'Approved' : (r.kycStatus === 'Verified' ? 'Verified' : 'New'),
            commissionRate: rate,
            commissionAmount: comm,
            payoutStatus: r.commissionStatus === 'paid' ? 'Paid' : 'Unpaid',
            payoutDate: r.commissionStatus === 'paid' ? formatDateHyphen(r.updatedAt || r.createdAt) : undefined,
            notes: r.notes,
          })
        }
      } else {
        // CHANNEL PARTNER TAB:
        // Strictly show only Channel Partner details based on CPL ID alone
        const partners = Array.isArray(subChannelPartners) ? subChannelPartners : []

        // 1. Ingest from subChannelPartners
        for (let pIdx = 0; pIdx < partners.length; pIdx++) {
          const p = partners[pIdx]
          const dStr = p.createdAt
          let matchesMonth = false
          if (dStr) {
            const d = new Date(dStr)
            if (!isNaN(d.getTime())) {
              matchesMonth = d.getFullYear() === historyYear && d.getMonth() === idx
            }
          } else {
            // Default to October for current 2026 partner cycle
            matchesMonth = idx === 9 && historyYear === 2026
          }
          if (!matchesMonth) continue

          const cplId = p.cplId || `CPLGHL${24000 + pIdx * 100}`
          const vol = Number(p.volumeGenerated) || 0
          const rate = p.overrideRate || 0.5
          const earned = p.overrideEarned || Math.round((vol * rate) / 100)

          investorMap.set(cplId, {
            id: cplId,
            userId: cplId, // Strictly CPL ID alone
            name: p.agencyName,
            email: p.contactEmail,
            phone: p.contactPhone,
            city: p.city || 'India',
            date: formatDateHyphen(dStr || '2026-10-09T00:00:00+00:00'),
            rawDate: dStr || '2026-10-09T00:00:00+00:00',
            amount: vol,
            planName: 'Channel Partner Override Allocation',
            status: p.status || 'Active',
            commissionRate: rate,
            commissionAmount: earned,
            payoutStatus: earned > 0 ? 'Paid' : 'Unpaid',
            payoutDate: earned > 0 ? formatDateHyphen(dStr || new Date().toISOString()) : undefined,
          })
        }

        // 2. Ingest any referral with memberType === 'Channel Partner' or with MCP candidate
        const cpReferrals = referrals.filter((r) => r.memberType === 'Channel Partner' || (r.refereeName && r.refereeName.toLowerCase().includes('mcp')))
        for (let rIdx = 0; rIdx < cpReferrals.length; rIdx++) {
          const r = cpReferrals[rIdx]
          const dStr = r.createdAt || r.date || r.joinedOnDate
          let matchesMonth = false
          if (dStr) {
            const d = new Date(dStr)
            if (!isNaN(d.getTime())) {
              matchesMonth = d.getFullYear() === historyYear && d.getMonth() === idx
            }
          } else {
            matchesMonth = idx === 9 && historyYear === 2026
          }
          if (!matchesMonth) continue

          const matchingSub = partners.find(
            (p) => (p.contactEmail && r.refereeEmail && p.contactEmail.toLowerCase() === r.refereeEmail.toLowerCase()) ||
                   (p.agencyName && r.refereeName && p.agencyName.toLowerCase() === r.refereeName.toLowerCase())
          )
          const cplId = matchingSub?.cplId || (r.userId && r.userId.startsWith('CPL') ? r.userId : `CPLGHL${24000 + (partners.length + rIdx) * 100}`)

          if (!investorMap.has(cplId)) {
            const vol = Number(r.investmentAmount) || 0
            const rate = 0.5
            const earned = r.commissionAmount || Math.round((vol * rate) / 100)

            investorMap.set(cplId, {
              id: cplId,
              userId: cplId, // Strictly CPL ID alone
              name: r.refereeName,
              email: r.refereeEmail,
              phone: r.refereePhone,
              city: r.refereeCity || 'India',
              date: r.joinedOnDate || formatDateHyphen(dStr),
              rawDate: dStr || '',
              amount: vol,
              planName: 'Channel Partner Override Allocation',
              status: r.kycStatus === 'Verified' ? 'Active' : (r.status === 'converted' ? 'Active' : 'Onboarding'),
              commissionRate: rate,
              commissionAmount: earned,
              payoutStatus: r.commissionStatus === 'paid' ? 'Paid' : 'Unpaid',
              payoutDate: r.commissionStatus === 'paid' ? formatDateHyphen(r.updatedAt || r.createdAt) : undefined,
              notes: r.notes,
            })
          }
        }
      }

      const investors = Array.from(investorMap.values())
      const totalInsAmount = investors.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0)
      const grossRate = historyCohort === 'channel_partner' ? 0.5 : getGrossRateForAmount(totalInsAmount, partnerRole)
      const grossRateDisplay = totalInsAmount > 0 ? `${grossRate}%` : '0%'
      const grossRefIncome = Math.round((totalInsAmount * grossRate) / 100)
      const tds = Math.round(grossRefIncome * 0.02)
      const netRefIncome = grossRefIncome - tds

      const hasPaid = investors.some((inv) => inv.payoutStatus === 'Paid')
      const paidStatus: 'Paid' | 'Unpaid' | '—' = hasPaid ? 'Paid' : (totalInsAmount > 0 ? 'Unpaid' : '—')
      const latestPaid = investors.find((inv) => inv.payoutDate && inv.payoutStatus === 'Paid')
      const paidDate = latestPaid?.payoutDate || (hasPaid ? 'Paid' : '—')

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
        investors,
      }
    })
  }, [referrals, subChannelPartners, historyYear, historyCohort, partnerRole])


  // Handle ESC key for drilldown modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedInvestorCheckout) {
          setSelectedInvestorCheckout(null)
        } else if (selectedMonthHistory) {
          setSelectedMonthHistory(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedInvestorCheckout, selectedMonthHistory])

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
          3. SLAB REFERENCE BOX (Role-Based: MCP 2-Tier vs CPL 0.5% Any Investment)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center my-6">
        <div className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${t('text-gray-400', 'text-gray-500')}`}>
          REFERRAL GROSS % SLAB (REFERENCE)
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {activeSlabs.map((slab) => (
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

        {/* If MCP: show both General Investor and Channel Partner tabs. If CPL (channel): hide Channel Partner tab */}
        {isMcp ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistoryCohort('general_investor')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${historyCohort === 'general_investor'
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
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${historyCohort === 'channel_partner'
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
        ) : (
          /* For CPL (Channel Partner role): Channel Partner history is hidden, General Investor only */
          <div className="flex items-center gap-2">
            <div
              className="px-5 py-2 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #D0021B, #B00000)' }}
            >
              General Investor
            </div>
          </div>
        )}
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
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {historyCohort === 'general_investor' ? 'General Investor' : 'Channel Partner'} — Monthly Investment ({historyYear})
            </h2>
            <p className={`text-[11px] font-medium mt-0.5 ${t('text-gray-400', 'text-gray-500')}`}>
              Showing {cohortLeadsCount} {historyCohort === 'general_investor' ? 'General Investor' : 'Channel Partner'} lead{cohortLeadsCount !== 1 ? 's' : ''} in history
            </p>
          </div>

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
                          grossRate: row.grossRate,
                          grossRateDisplay: row.grossRateDisplay,
                          grossRefIncome: row.grossRefIncome,
                          tds: row.tds,
                          netRefIncome: row.netRefIncome,
                          paidStatus: row.paidStatus,
                          paidDate: row.paidDate,
                          investors: row.investors,
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
          - Displays each person, their user id / CPL ID, and details
          ───────────────────────────────────────────────────────────── */}
      {selectedMonthHistory && (
        <div
          className="fixed inset-0 z-[10020] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setSelectedMonthHistory(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border animate-scale-in max-h-[90vh] flex flex-col ${t(
              'bg-[#140606] border-red-500/30 text-white',
              'bg-white border-gray-200 text-gray-900'
            )}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-[#1c0205] via-[#850012] to-[#db081f] px-6 py-4 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/20 shadow-sm">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    {selectedMonthHistory.monthName} {selectedMonthHistory.year} — {historyCohort === 'general_investor' ? 'General Investor' : 'Channel Partner'}
                  </h3>
                  <p className="text-[11px] text-white/80 font-medium">
                    {selectedMonthHistory.investors.length} {historyCohort === 'channel_partner' ? 'Channel Partner(s)' : 'Referred Member(s)'} • Total Volume: ₹{formatIndianNumber(selectedMonthHistory.totalAmount)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMonthHistory(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Cards Row */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b shrink-0 ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
              <div className={`p-2.5 rounded-xl border ${t('bg-black/30 border-white/10', 'bg-white border-gray-200')}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${t('text-gray-400', 'text-gray-500')}`}>
                  {historyCohort === 'channel_partner' ? 'Total Volume' : 'Total Invested'}
                </span>
                <span className="text-sm font-black text-white block mt-0.5">₹{formatIndianNumber(selectedMonthHistory.totalAmount)}</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${t('bg-black/30 border-white/10', 'bg-white border-gray-200')}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${t('text-gray-400', 'text-gray-500')}`}>
                  {historyCohort === 'channel_partner' ? 'Override Income' : 'Gross Income'}
                </span>
                <span className="text-sm font-black text-emerald-400 block mt-0.5">₹{formatIndianNumber(selectedMonthHistory.grossRefIncome)}</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${t('bg-black/30 border-white/10', 'bg-white border-gray-200')}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${t('text-gray-400', 'text-gray-500')}`}>TDS (2%)</span>
                <span className={`text-sm font-bold block mt-0.5 ${t('text-gray-300', 'text-gray-600')}`}>₹{formatIndianNumber(selectedMonthHistory.tds)}</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${t('bg-black/30 border-white/10', 'bg-white border-gray-200')}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${t('text-gray-400', 'text-gray-500')}`}>Net Receivable</span>
                <span className="text-sm font-black text-[#C8102E] block mt-0.5">₹{formatIndianNumber(selectedMonthHistory.netRefIncome)}</span>
              </div>
            </div>

            {/* Table Body (Scrollable) */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b text-[10px] font-bold uppercase tracking-wider select-none ${t('border-white/10 text-gray-400', 'border-gray-200 text-gray-500')}`}>
                    <th className="pb-3 pr-2">SNO</th>
                    <th className="pb-3 px-2">{historyCohort === 'channel_partner' ? 'CPL ID' : 'USER ID'}</th>
                    <th className="pb-3 px-2">{historyCohort === 'channel_partner' ? 'CHANNEL PARTNER / AGENCY' : 'INVESTOR NAME'}</th>
                    <th className="pb-3 px-2">DATE</th>
                    <th className="pb-3 px-2 text-right">{historyCohort === 'channel_partner' ? 'VOLUME GENERATED (₹)' : 'INVESTED AMOUNT (₹)'}</th>
                    <th className="pb-3 px-2 text-right">{historyCohort === 'channel_partner' ? 'OVERRIDE INCOME (₹)' : 'COMMISSION (₹)'}</th>
                    <th className="pb-3 px-2 text-center">STATUS</th>
                    <th className="pb-3 pl-2 text-center">CHECKOUT</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${t('divide-white/[0.04]', 'divide-gray-100')}`}>
                  {selectedMonthHistory.investors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-gray-500 italic">
                        No {historyCohort === 'channel_partner' ? 'channel partner' : 'referral'} transactions recorded for {selectedMonthHistory.monthName} {selectedMonthHistory.year}.
                      </td>
                    </tr>
                  ) : (
                    selectedMonthHistory.investors.map((inv, i) => (
                      <tr key={inv.id || i} className={`transition-colors ${t('hover:bg-white/[0.02]', 'hover:bg-gray-50')}`}>
                        <td className="py-3 pr-2 font-semibold text-gray-400">{i + 1}</td>
                        <td className="py-3 px-2 font-mono font-bold text-brand-red whitespace-nowrap">{inv.userId}</td>
                        <td className="py-3 px-2">
                          <div className={`font-bold ${t('text-white', 'text-gray-900')}`}>{inv.name}</div>
                          {inv.email && <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{inv.email}</div>}
                        </td>
                        <td className={`py-3 px-2 whitespace-nowrap ${t('text-gray-400', 'text-gray-600')}`}>{inv.date}</td>
                        <td className={`py-3 px-2 text-right font-black whitespace-nowrap ${inv.amount > 0 ? 'text-white' : 'text-gray-400'}`}>
                          {inv.amount > 0 ? `₹${formatIndianNumber(inv.amount)}` : '₹0'}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-emerald-400 whitespace-nowrap">
                          {inv.commissionAmount > 0 ? `₹${formatIndianNumber(inv.commissionAmount)}` : '—'}
                        </td>
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            inv.status === 'Approved' || inv.status === 'Paid' || inv.status === 'Converted' || inv.status === 'Active'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}>
                            <span className="w-1 h-1 rounded-full bg-current" />
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 pl-2 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedInvestorCheckout(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[#C8102E] text-[10px] font-bold border border-red-500/20 transition-all active:scale-95 shadow-sm"
                            title="View Checkout & Investment Details"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className={`border-t font-bold ${t('border-white/10 bg-white/[0.02]', 'border-gray-200 bg-gray-50/50')}`}>
                    <td colSpan={4} className={`py-3.5 pr-2 font-black text-xs uppercase tracking-wider ${t('text-white', 'text-gray-900')}`}>
                      Monthly Total ({selectedMonthHistory.investors.length} {historyCohort === 'channel_partner' ? 'Channel Partner' : 'Investor'}{selectedMonthHistory.investors.length !== 1 ? 's' : ''})
                    </td>
                    <td className="py-3.5 px-2 text-right font-black text-sm text-[#C8102E] whitespace-nowrap">
                      ₹{formatIndianNumber(selectedMonthHistory.totalAmount)}
                    </td>
                    <td className="py-3.5 px-2 text-right font-black text-xs text-emerald-400 whitespace-nowrap">
                      ₹{formatIndianNumber(selectedMonthHistory.grossRefIncome)}
                    </td>
                    <td colSpan={2} className="py-3.5 pl-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. INVESTOR / CHANNEL PARTNER CHECKOUT & ANALYSIS MODAL
          ───────────────────────────────────────────────────────────── */}
      {selectedInvestorCheckout && (
        <div
          className="fixed inset-0 z-[10030] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setSelectedInvestorCheckout(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border animate-scale-in max-h-[90vh] flex flex-col ${t(
              'bg-[#140606] border-red-500/40 text-white',
              'bg-white border-gray-200 text-gray-900'
            )}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1c0205] via-[#850012] to-[#db081f] px-6 py-4 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/20 shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    {historyCohort === 'channel_partner' ? 'Channel Partner Details & Override Breakdown' : 'Investor Checkout & Commission Breakdown'}
                  </h3>
                  <p className="text-[11px] text-white/80 font-medium">
                    {selectedInvestorCheckout.name} • {historyCohort === 'channel_partner' ? 'CPL ID' : 'User ID'}: {selectedInvestorCheckout.userId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvestorCheckout(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close checkout modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Highlight Card: Capital Invested / Volume Generated */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${t('bg-gradient-to-br from-red-950/40 via-red-900/20 to-black/40 border-red-500/30', 'bg-red-50/70 border-red-200')}`}>
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${t('text-red-300', 'text-red-700')}`}>
                    {historyCohort === 'channel_partner' ? 'Total Volume Generated by Channel Partner' : 'Total Capital Invested by Candidate'}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-[#C8102E] mt-0.5">
                    ₹{formatIndianNumber(selectedInvestorCheckout.amount)}
                  </div>
                  <span className={`text-xs font-medium block mt-0.5 ${t('text-gray-400', 'text-gray-600')}`}>
                    {historyCohort === 'channel_partner' ? 'Allocation: Channel Partner Override Network' : `Vehicle: ${selectedInvestorCheckout.planName || 'Alternate route to Invest in AIF via Debenture'}`}
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    selectedInvestorCheckout.status === 'Approved' || selectedInvestorCheckout.status === 'Paid' || selectedInvestorCheckout.status === 'Converted' || selectedInvestorCheckout.status === 'Active'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {selectedInvestorCheckout.status}
                  </span>
                  <span className={`text-[11px] font-mono block mt-1 ${t('text-gray-400', 'text-gray-500')}`}>
                    {historyCohort === 'channel_partner' ? 'Enrolled Date' : 'Investment Date'}: {selectedInvestorCheckout.date}
                  </span>
                </div>
              </div>

              {/* Grid: Investor / Partner Details & Commission Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Panel 1: Profile */}
                <div className={`p-4 rounded-xl border space-y-2.5 ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                  <h4 className={`text-xs font-black uppercase tracking-wider ${t('text-gray-300', 'text-gray-700')}`}>
                    {historyCohort === 'channel_partner' ? 'Channel Partner Profile' : 'Candidate Profile'}
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-gray-400">{historyCohort === 'channel_partner' ? 'Agency / Partner Name' : 'Full Name'}</span>
                      <span className="font-bold">{selectedInvestorCheckout.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-gray-400">{historyCohort === 'channel_partner' ? 'CPL ID' : 'Candidate ID'}</span>
                      <span className="font-mono font-bold text-[#C8102E]">{selectedInvestorCheckout.userId}</span>
                    </div>
                    {selectedInvestorCheckout.email && (
                      <div className="flex justify-between py-1 border-b border-white/[0.04]">
                        <span className="text-gray-400">Email Address</span>
                        <span className="font-medium truncate max-w-[180px]">{selectedInvestorCheckout.email}</span>
                      </div>
                    )}
                    {selectedInvestorCheckout.phone && (
                      <div className="flex justify-between py-1 border-b border-white/[0.04]">
                        <span className="text-gray-400">Contact Number</span>
                        <span className="font-medium">{selectedInvestorCheckout.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-gray-400">Location</span>
                      <span className="font-medium">{selectedInvestorCheckout.city || 'India'}</span>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Payout & Settlement Breakdown */}
                <div className={`p-4 rounded-xl border space-y-2.5 ${t('bg-white/[0.02] border-white/10', 'bg-gray-50 border-gray-200')}`}>
                  <h4 className={`text-xs font-black uppercase tracking-wider ${t('text-gray-300', 'text-gray-700')}`}>
                    {historyCohort === 'channel_partner' ? 'Override Income Breakdown' : 'Referral Commission Breakdown'}
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-gray-400">{historyCohort === 'channel_partner' ? 'Override Rate' : 'Commission Rate'}</span>
                      <span className="font-bold text-amber-400">{selectedInvestorCheckout.commissionRate}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-gray-400">{historyCohort === 'channel_partner' ? 'Gross Override' : 'Gross Commission'}</span>
                      <span className="font-bold text-emerald-400">₹{formatIndianNumber(selectedInvestorCheckout.commissionAmount)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-gray-400">TDS Withheld (2%)</span>
                      <span className="font-medium text-gray-400">₹{formatIndianNumber(Math.round(selectedInvestorCheckout.commissionAmount * 0.02))}</span>
                    </div>
                    <div className="flex justify-between py-1.5 font-bold">
                      <span className={t('text-white', 'text-gray-900')}>Net Receivable</span>
                      <span className="text-[#C8102E] font-black">
                        ₹{formatIndianNumber(selectedInvestorCheckout.commissionAmount - Math.round(selectedInvestorCheckout.commissionAmount * 0.02))}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 pt-2 border-t border-white/[0.06] text-[11px]">
                      <span className="text-gray-400">Payout Status</span>
                      <span className={`font-bold ${selectedInvestorCheckout.payoutStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {selectedInvestorCheckout.payoutStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deployment / Verification Notes */}
              <div className={`p-3.5 rounded-xl border text-xs ${t('bg-black/30 border-white/10 text-gray-300', 'bg-gray-50 border-gray-200 text-gray-700')}`}>
                <div className="font-bold mb-1 flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Deployment & Allotment Verification</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Referral incentive is authorized upon fund transfer validation and issuance of allotment confirmation. TDS at 2% is deducted under Section 194H of the Income Tax Act.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex justify-end gap-2 shrink-0 ${t('bg-[#1a0808]/40 border-white/10', 'bg-gray-50 border-gray-200')}`}>
              <button
                onClick={() => setSelectedInvestorCheckout(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${t(
                  'bg-white/10 hover:bg-white/15 text-white border border-white/10',
                  'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
                )}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

