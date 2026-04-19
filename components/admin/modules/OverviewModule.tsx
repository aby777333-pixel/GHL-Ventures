'use client'

import { useState, useEffect, useCallback } from 'react'
import { getOperationalStats } from '@/lib/supabase/adminDataService'
import { formatINR } from '@/lib/admin/adminHooks'

interface OverviewModuleProps {
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

// ── Stat Card (glassy / glossy / foggy tech card) ──
// `accent` is an "r, g, b" triple that feeds the --kpi-accent-rgb CSS var
// on .admin-kpi-glass so each tile gets its own tech hue.
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
  const card = (
    <div
      className="admin-kpi-glass rounded-xl mt-4 cursor-pointer"
      style={{ ['--kpi-accent-rgb' as any]: accentRgb }}
    >
      <div className="p-5">
        <h5 className="text-white text-sm font-medium opacity-90">{title}</h5>
        <div className="flex items-center justify-between mt-3">
          <i
            className={`${icon} text-2xl`}
            style={{
              color: `rgb(${accentRgb})`,
              filter: `drop-shadow(0 0 8px rgba(${accentRgb}, 0.55))`,
            }}
          />
          <h2 className="text-white text-2xl font-bold">{isCurrency && '₹'}{display}</h2>
        </div>
      </div>
    </div>
  )

  if (href && navigate) {
    return <div onClick={() => navigate(href)}>{card}</div>
  }
  return card
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

  return (
    <div>
      {/* Users Section */}
      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="inline-block w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, rgb(34, 211, 238), rgb(168, 85, 247))' }} />
        Users
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon="las la-user" href="clients" navigate={navigate} accent="34, 211, 238" />
        <StatCard title="Invested Users" value={stats.investedUsers} icon="las la-user-check" href="clients" navigate={navigate} accent="16, 185, 129" />
      </div>

      {/* KYC Section */}
      <h4 className="text-lg font-semibold text-white mt-8 flex items-center gap-2">
        <span className="inline-block w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, rgb(168, 85, 247), rgb(239, 68, 68))' }} />
        KYC
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total KYC" value={stats.totalKyc} icon="las la-id-card" href="compliance/kyc-queue" navigate={navigate} accent="168, 85, 247" />
        <StatCard title="Pending" value={stats.pendingKyc} icon="las la-clock" href="compliance/kyc-queue" navigate={navigate} accent="245, 158, 11" />
        <StatCard title="Approved" value={stats.approvedKyc} icon="las la-check-circle" href="compliance/kyc-queue" navigate={navigate} accent="16, 185, 129" />
        <StatCard title="Rejected" value={stats.rejectedKyc} icon="las la-times-circle" href="compliance/kyc-queue" navigate={navigate} accent="239, 68, 68" />
      </div>

      {/* Investment Section */}
      <h4 className="text-lg font-semibold text-white mt-8 flex items-center gap-2">
        <span className="inline-block w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, rgb(34, 211, 238), rgb(16, 185, 129))' }} />
        Investment
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Investment" value={stats.totalInvestment} icon="las la-wallet" href="financial" navigate={navigate} isCurrency accent="34, 211, 238" />
        <StatCard title="AIF" value={stats.aifInvestment} icon="las la-chart-line" href="financial" navigate={navigate} isCurrency accent="168, 85, 247" />
        <StatCard title="Debenture" value={stats.debentureInvestment} icon="las la-file-invoice-dollar" href="financial" navigate={navigate} isCurrency accent="244, 114, 182" />
        <StatCard title="This Month" value={stats.monthInvestment} icon="las la-calendar-day" href="financial" navigate={navigate} isCurrency accent="16, 185, 129" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Payout" value={stats.totalPayout} icon="las la-money-bill-wave" href="payouts" navigate={navigate} isCurrency accent="16, 185, 129" />
        <StatCard title="This Month Payout" value={stats.monthPayout} icon="las la-calendar-check" href="payouts" navigate={navigate} isCurrency accent="34, 211, 238" />
        <StatCard title="Total TDS" value={stats.totalTds} icon="las la-percentage" href="payouts" navigate={navigate} isCurrency accent="245, 158, 11" />
        <StatCard title="This Month TDS" value={stats.monthTds} icon="las la-receipt" href="payouts" navigate={navigate} isCurrency accent="168, 85, 247" />
      </div>

      {/* Support Ticket Section */}
      <h4 className="text-lg font-semibold text-white mt-8 flex items-center gap-2">
        <span className="inline-block w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, rgb(245, 158, 11), rgb(168, 85, 247))' }} />
        Support Ticket
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Tickets" value={stats.totalTickets} icon="las la-ticket-alt" href="content/tickets" navigate={navigate} accent="34, 211, 238" />
        <StatCard title="Pending" value={stats.pendingTickets} icon="las la-hourglass-half" href="content/tickets" navigate={navigate} accent="245, 158, 11" />
        <StatCard title="Opened" value={stats.openTickets} icon="las la-envelope-open" href="content/tickets" navigate={navigate} accent="168, 85, 247" />
        <StatCard title="Closed" value={stats.closedTickets} icon="las la-check-circle" href="content/tickets" navigate={navigate} accent="16, 185, 129" />
      </div>

      {/* Footer spacer */}
      <div className="mt-8" />
    </div>
  )
}
