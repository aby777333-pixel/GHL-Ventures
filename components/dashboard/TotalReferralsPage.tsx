'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronDown,
  Search,
  X,
  ArrowUpDown,
} from 'lucide-react'
import { ReferralMember } from '@/lib/supabase/partnerDashboardService'

interface TotalReferralsPageProps {
  partnerDisplayName: string
  referrals: ReferralMember[]
  onBack: () => void
  onOpenReferralDetails?: (referral: ReferralMember) => void
  theme?: 'light' | 'dark'
  isDark?: boolean
}

function formatDateDisplay(d?: string | null): string {
  if (!d) return '—'
  const dateObj = new Date(d)
  if (isNaN(dateObj.getTime())) return d
  return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TotalReferralsPage({
  partnerDisplayName,
  referrals,
  onBack,
  isDark = true,
}: TotalReferralsPageProps) {
  // Theme helper
  const t = useCallback(
    (darkCls: string, lightCls: string) => (isDark ? darkCls : lightCls),
    [isDark]
  )

  // Filters & State
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortCol, setSortCol] = useState<'userId' | 'name' | 'email' | 'phone' | 'kycStatus' | 'joinedOn'>('joinedOn')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState<number>(1)
  const PAGE_SIZE = 10

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    for (const r of referrals) {
      const d = r.createdAt || r.date
      if (d) {
        const yr = new Date(d).getFullYear()
        if (!isNaN(yr)) years.add(String(yr))
      }
    }
    years.add(String(new Date().getFullYear()))
    return Array.from(years).sort((a, b) => Number(b) - Number(a))
  }, [referrals])

  // Filtered & Sorted Referrals
  const filteredReferrals = useMemo(() => {
    let list = referrals.slice()

    // 1. Year filter
    if (yearFilter !== 'all') {
      list = list.filter((r) => {
        const d = r.createdAt || r.date
        if (!d) return false
        const yr = new Date(d).getFullYear()
        return String(yr) === yearFilter
      })
    }

    // 2. Search query (search by user ID, name, email, phone or KYC status)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter((r) => {
        const idMatch = (r.userId || r.id || '').toLowerCase().includes(q)
        const nameMatch = (r.refereeName || '').toLowerCase().includes(q)
        const emailMatch = (r.refereeEmail || '').toLowerCase().includes(q)
        const phoneMatch = (r.refereePhone || '').toLowerCase().includes(q)
        const kycMatch = (r.kycStatus || '').toLowerCase().includes(q)
        return idMatch || nameMatch || emailMatch || phoneMatch || kycMatch
      })
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (sortCol === 'userId') {
        const aVal = (a.userId || a.id || '').toLowerCase()
        const bVal = (b.userId || b.id || '').toLowerCase()
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (sortCol === 'name') {
        const aVal = (a.refereeName || '').toLowerCase()
        const bVal = (b.refereeName || '').toLowerCase()
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (sortCol === 'email') {
        const aVal = (a.refereeEmail || '').toLowerCase()
        const bVal = (b.refereeEmail || '').toLowerCase()
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (sortCol === 'phone') {
        const aVal = (a.refereePhone || '').toLowerCase()
        const bVal = (b.refereePhone || '').toLowerCase()
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (sortCol === 'kycStatus') {
        const aVal = (a.kycStatus || 'Pending').toLowerCase()
        const bVal = (b.kycStatus || 'Pending').toLowerCase()
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      // default: joinedOn
      const dateA = new Date(a.createdAt || a.date).getTime() || 0
      const dateB = new Date(b.createdAt || b.date).getTime() || 0
      return sortDir === 'asc' ? dateA - dateB : dateB - dateA
    })

    return list
  }, [referrals, yearFilter, searchQuery, sortCol, sortDir])

  // Pagination calculation
  const totalPages = Math.ceil(filteredReferrals.length / PAGE_SIZE) || 1
  const paginatedReferrals = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredReferrals.slice(start, start + PAGE_SIZE)
  }, [filteredReferrals, page])

  const handleToggleSort = (col: 'userId' | 'name' | 'email' | 'phone' | 'kycStatus' | 'joinedOn') => {
    if (sortCol === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const paginationPills = useMemo(() => {
    const pills: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pills.push(i)
    } else {
      if (page <= 4) {
        for (let i = 1; i <= 5; i++) pills.push(i)
        pills.push('...')
        pills.push(totalPages)
      } else if (page >= totalPages - 3) {
        pills.push(1)
        pills.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) pills.push(i)
      } else {
        pills.push(1)
        pills.push('...')
        pills.push(page - 1)
        pills.push(page)
        pills.push(page + 1)
        pills.push('...')
        pills.push(totalPages)
      }
    }
    return pills
  }, [totalPages, page])

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. WELCOME BANNER (Matches Reference)
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
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-white/85 mb-2">
          EVERYONE {partnerDisplayName.toUpperCase()} HAS PERSONALLY REFERRED
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Referral Users List
        </h2>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN TOTAL REFERRALS CARD
          ───────────────────────────────────────────────────────────── */}
      <div
        className={`w-full rounded-2xl border border-t-4 border-t-[#C8102E] shadow-xl overflow-hidden ${t(
          'bg-[#140606] border-white/10 text-white',
          'bg-white border-gray-200 text-gray-900'
        )}`}
      >
        {/* Header / Filter Toolbar */}
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
                {partnerDisplayName} Referral Users
              </h2>
              <p className={`text-xs ${t('text-gray-400', 'text-gray-500')} font-medium mt-0.5`}>
                {filteredReferrals.length} referrals
              </p>
            </div>
          </div>

          {/* Right: Year Filter & Search */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Year Filter */}
            <div className="relative">
              <select
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value)
                  setPage(1)
                }}
                className={`appearance-none pl-3 pr-8 py-1.5 rounded-xl border text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 cursor-pointer ${t(
                  'bg-[#140606] border-white/15 text-white',
                  'bg-white border-gray-300 text-gray-700'
                )}`}
              >
                <option value="all">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by ID, name, email or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className={`pl-8 pr-8 py-1.5 rounded-xl border text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 w-48 sm:w-60 transition-all ${t(
                  'bg-white/[0.04] border-white/15 text-white placeholder-gray-500',
                  'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                )}`}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setPage(1)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
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
                <th className="py-3.5 px-4 text-left font-bold w-14">SNO</th>
                <th
                  onClick={() => handleToggleSort('userId')}
                  className="py-3.5 px-4 text-left font-bold cursor-pointer hover:text-[#C8102E] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>USER ID</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('name')}
                  className="py-3.5 px-4 text-left font-bold cursor-pointer hover:text-[#C8102E] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>NAME</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('email')}
                  className="py-3.5 px-4 text-left font-bold cursor-pointer hover:text-[#C8102E] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>EMAIL</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('phone')}
                  className="py-3.5 px-4 text-left font-bold cursor-pointer hover:text-[#C8102E] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>PHONE NO</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('kycStatus')}
                  className="py-3.5 px-4 text-left font-bold cursor-pointer hover:text-[#C8102E] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>KYC STATUS</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('joinedOn')}
                  className="py-3.5 px-4 text-left font-bold cursor-pointer hover:text-[#C8102E] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>JOINED ON</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${t('divide-white/[0.04]', 'divide-gray-100')}`}>
              {paginatedReferrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-gray-500 italic">
                    No referrals found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedReferrals.map((r, idx) => {
                  const sno = (page - 1) * PAGE_SIZE + idx + 1
                  const isNew =
                    r.status === 'new' ||
                    (() => {
                      const d = r.createdAt || r.date
                      if (!d) return false
                      const dateObj = new Date(d)
                      return (
                        !isNaN(dateObj.getTime()) &&
                        dateObj.getFullYear() === 2026 &&
                        dateObj.getMonth() === 9
                      )
                    })()

                  const isVerified = (r.kycStatus || '').toLowerCase() === 'verified'
                  const isSubmitted = (r.kycStatus || '').toLowerCase() === 'submitted'

                  return (
                    <tr
                      key={r.id || idx}
                      className={`transition-colors ${t(
                        'hover:bg-white/[0.02]',
                        'hover:bg-gray-50/80'
                      )}`}
                    >
                      <td className={`py-3.5 px-4 font-mono text-xs ${t('text-gray-400', 'text-gray-500')}`}>
                        {sno}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-red">
                        {r.userId || r.id}
                      </td>
                      <td className={`py-3.5 px-4 font-semibold ${t('text-white', 'text-gray-900')}`}>
                        {r.refereeName}
                      </td>
                      <td className={`py-3.5 px-4 font-mono text-xs ${t('text-gray-300', 'text-gray-700')}`}>
                        {r.refereeEmail && r.refereeEmail !== '—' ? (
                          <a
                            href={`mailto:${r.refereeEmail}`}
                            className="hover:text-brand-red hover:underline transition-colors"
                          >
                            {r.refereeEmail}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className={`py-3.5 px-4 font-mono text-xs ${t('text-gray-300', 'text-gray-700')}`}>
                        {r.refereePhone && r.refereePhone !== '—' ? (
                          <a
                            href={`tel:${r.refereePhone}`}
                            className="hover:text-brand-red hover:underline transition-colors"
                          >
                            {r.refereePhone}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isVerified
                              ? t('bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                              : isSubmitted
                              ? t('bg-blue-500/15 text-blue-400 border border-blue-500/30', 'bg-blue-50 text-blue-700 border border-blue-200')
                              : t('bg-amber-500/15 text-amber-400 border border-amber-500/30', 'bg-amber-50 text-amber-700 border border-amber-200')
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isVerified ? 'bg-emerald-400' : isSubmitted ? 'bg-blue-400' : 'bg-amber-400'
                            }`}
                          />
                          {r.kycStatus || 'Pending'}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 ${t('text-gray-400', 'text-gray-600')}`}>
                        <div className="flex items-center gap-2">
                          <span>{formatDateDisplay(r.createdAt || r.date)}</span>
                          {isNew && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40">
                              NEW
                            </span>
                          )}
                        </div>
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
          <span className={`text-xs font-medium ${t('text-gray-400', 'text-gray-500')}`}>
            {filteredReferrals.length} referrals
          </span>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${t(
                'border-white/10 bg-white/5 hover:bg-white/10 text-gray-300',
                'border-gray-200 bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
              )}`}
            >
              ‹ Prev
            </button>

            {paginationPills.map((pill, pIdx) =>
              pill === '...' ? (
                <span key={`dots-${pIdx}`} className="px-2 text-gray-400 text-xs">
                  ...
                </span>
              ) : (
                <button
                  key={`page-${pill}`}
                  onClick={() => setPage(Number(pill))}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all ${page === pill
                    ? 'bg-[#C8102E] text-white shadow-sm'
                    : t(
                      'border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300',
                      'border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
                    )
                    }`}
                >
                  {pill}
                </button>
              )
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
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
