'use client'

import { useState, useEffect, useCallback } from 'react'
import { getOperationalStats } from '@/lib/supabase/adminDataService'
import { formatINR } from '@/lib/admin/adminHooks'

interface OverviewModuleProps {
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

// ── Stat Card (restrained, corporate look) ──
// `accent` is an "r, g, b" triple fed to the --kpi-accent-rgb CSS var,
// which drives the thin top accent bar and the muted icon badge only.
function StatCard({ title, value, icon, href, navigate, isCurrency, accent }: {
  title: string
  value: number
  icon: string
  href?: string
  navigate?: (path: string) => void
  isCurrency?: boolean
  accent?: string
}) {
  const display = isCurrency ? formatINR(value) : value.toLocaleString('en-IN')
  const accentRgb = accent || '208, 2, 27'
  const interactive = !!(href && navigate)
  const card = (
    <div
      className={`admin-kpi-glass rounded-lg ${interactive ? 'cursor-pointer' : ''}`}
      style={{ ['--kpi-accent-rgb' as any]: accentRgb }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-[10.5px] tracking-[0.14em] uppercase font-semibold text-white/55">
            {title}
          </p>
          <span className="admin-kpi-icon shrink-0">
            <i className={`${icon} text-base`} />
          </span>
        </div>
        <p
          className="mt-4 text-[1.65rem] font-semibold text-white leading-none"
          style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}
        >
          {isCurrency && <span className="text-white/70 mr-0.5 text-[1.3rem]">₹</span>}
          {display}
        </p>
      </div>
    </div>
  )

  if (interactive) {
    return <div onClick={() => navigate!(href!)}>{card}</div>
  }
  return card
}

// ── Section Eyebrow ──
// Quiet uppercase label + trailing hairline. Replaces the prior
// colourful pill so the dashboard reads like a report, not a toy.
function SectionEyebrow({ label }: { label: string }) {
  return (
    <div className="admin-section-eyebrow">
      <span className="admin-section-eyebrow__label">{label}</span>
      <span className="admin-section-eyebrow__rule" />
    </div>
  )
}

export default function OverviewModule({ navigate, showToast }: OverviewModuleProps) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const ops = await getOperationalStats()
    if (ops) setStats(ops)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-red-700" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Unable to load dashboard data. Please try refreshing.</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: '#ac0d0d' }}>
          Retry
        </button>
      </div>
    )
  }

  // Accent palette — kept to three restrained tones so the whole
  // dashboard reads as one cohesive surface instead of a rainbow.
  // Neutral = cool slate (primary metrics), Emerald = positive,
  // Amber = pending, Brand red = escalation / rejection.
  const NEUTRAL = '148, 163, 184'   // slate-400
  const EMERALD = '16, 185, 129'
  const AMBER = '245, 158, 11'
  const BRAND = '208, 2, 27'

  return (
    <div>
      {/* Users Section */}
      <SectionEyebrow label="Users" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total Users" value={stats.totalUsers} icon="las la-user" href="clients" navigate={navigate} accent={NEUTRAL} />
        <StatCard title="Invested Users" value={stats.investedUsers} icon="las la-user-check" href="clients" navigate={navigate} accent={EMERALD} />
      </div>

      {/* KYC Section */}
      <SectionEyebrow label="KYC" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total KYC" value={stats.totalKyc} icon="las la-id-card" href="compliance/kyc-queue" navigate={navigate} accent={NEUTRAL} />
        <StatCard title="Pending" value={stats.pendingKyc} icon="las la-clock" href="compliance/kyc-queue" navigate={navigate} accent={AMBER} />
        <StatCard title="Approved" value={stats.approvedKyc} icon="las la-check-circle" href="compliance/kyc-queue" navigate={navigate} accent={EMERALD} />
        <StatCard title="Rejected" value={stats.rejectedKyc} icon="las la-times-circle" href="compliance/kyc-queue" navigate={navigate} accent={BRAND} />
      </div>

      {/* Investment Section */}
      <SectionEyebrow label="Investment" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total Investment" value={stats.totalInvestment} icon="las la-wallet" href="financial" navigate={navigate} isCurrency accent={NEUTRAL} />
        <StatCard title="AIF" value={stats.aifInvestment} icon="las la-chart-line" href="financial" navigate={navigate} isCurrency accent={NEUTRAL} />
        <StatCard title="Debenture" value={stats.debentureInvestment} icon="las la-file-invoice-dollar" href="financial" navigate={navigate} isCurrency accent={NEUTRAL} />
        <StatCard title="This Month" value={stats.monthInvestment} icon="las la-calendar-day" href="financial" navigate={navigate} isCurrency accent={EMERALD} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        <StatCard title="Total Payout" value={stats.totalPayout} icon="las la-money-bill-wave" href="payouts" navigate={navigate} isCurrency accent={EMERALD} />
        <StatCard title="This Month Payout" value={stats.monthPayout} icon="las la-calendar-check" href="payouts" navigate={navigate} isCurrency accent={NEUTRAL} />
        <StatCard title="Total TDS" value={stats.totalTds} icon="las la-percentage" href="payouts" navigate={navigate} isCurrency accent={AMBER} />
        <StatCard title="This Month TDS" value={stats.monthTds} icon="las la-receipt" href="payouts" navigate={navigate} isCurrency accent={NEUTRAL} />
      </div>

      {/* Support Ticket Section */}
      <SectionEyebrow label="Support Tickets" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total Tickets" value={stats.totalTickets} icon="las la-ticket-alt" href="content/tickets" navigate={navigate} accent={NEUTRAL} />
        <StatCard title="Pending" value={stats.pendingTickets} icon="las la-hourglass-half" href="content/tickets" navigate={navigate} accent={AMBER} />
        <StatCard title="Opened" value={stats.openTickets} icon="las la-envelope-open" href="content/tickets" navigate={navigate} accent={NEUTRAL} />
        <StatCard title="Closed" value={stats.closedTickets} icon="las la-check-circle" href="content/tickets" navigate={navigate} accent={EMERALD} />
      </div>

      {/* Footer spacer */}
      <div className="mt-8" />
    </div>
  )
}
