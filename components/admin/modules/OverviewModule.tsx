'use client'

import { useState, useEffect, useCallback } from 'react'
import { getOperationalStats } from '@/lib/supabase/adminDataService'
import { formatINR } from '@/lib/admin/adminHooks'

interface OverviewModuleProps {
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

// ── Stat Card (matches admin.php: card bg-gradient-primary) ──
function StatCard({ title, value, icon, href, navigate, isCurrency }: {
  title: string
  value: number
  icon: string
  href?: string
  navigate?: (path: string) => void
  isCurrency?: boolean
}) {
  const display = isCurrency ? formatINR(value) : value.toLocaleString('en-IN')
  const card = (
    <div className="rounded-lg mt-4 shadow-md transition-transform hover:scale-[1.02] cursor-pointer"
      style={{ background: 'linear-gradient(135deg, #ac0d0d 0%, #d41919 100%)' }}>
      <div className="p-5">
        <h5 className="text-white text-sm font-medium opacity-90">{title}</h5>
        <div className="flex items-center justify-between mt-3">
          <i className={`${icon} text-white text-2xl opacity-80`} />
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
      <h4 className="text-lg font-semibold text-white">Users</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon="las la-user" href="clients" navigate={navigate} />
        <StatCard title="Invested Users" value={stats.investedUsers} icon="las la-user" href="clients" navigate={navigate} />
      </div>

      {/* KYC Section */}
      <h4 className="text-lg font-semibold text-white mt-8">KYC</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total KYC" value={stats.totalKyc} icon="las la-user" href="compliance/kyc-queue" navigate={navigate} />
        <StatCard title="Pending" value={stats.pendingKyc} icon="las la-user" href="compliance/kyc-queue" navigate={navigate} />
        <StatCard title="Approved" value={stats.approvedKyc} icon="las la-user" href="compliance/kyc-queue" navigate={navigate} />
        <StatCard title="Rejected" value={stats.rejectedKyc} icon="las la-user" href="compliance/kyc-queue" navigate={navigate} />
      </div>

      {/* Investment Section */}
      <h4 className="text-lg font-semibold text-white mt-8">Investment</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Investment" value={stats.totalInvestment} icon="las la-wallet" href="finance" navigate={navigate} isCurrency />
        <StatCard title="AIF" value={stats.aifInvestment} icon="las la-wallet" href="finance" navigate={navigate} isCurrency />
        <StatCard title="Debenture" value={stats.debentureInvestment} icon="las la-wallet" href="finance" navigate={navigate} isCurrency />
        <StatCard title="This Month" value={stats.monthInvestment} icon="las la-wallet" href="finance" navigate={navigate} isCurrency />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Payout" value={stats.totalPayout} icon="las la-wallet" isCurrency />
        <StatCard title="This Month Payout" value={stats.monthPayout} icon="las la-wallet" isCurrency />
        <StatCard title="Total TDS" value={stats.totalTds} icon="las la-wallet" isCurrency />
        <StatCard title="This Month TDS" value={stats.monthTds} icon="las la-wallet" isCurrency />
      </div>

      {/* Support Ticket Section */}
      <h4 className="text-lg font-semibold text-white mt-8">Support Ticket</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Tickets" value={stats.totalTickets} icon="las la-ticket-alt" href="content/tickets" navigate={navigate} />
        <StatCard title="Pending" value={stats.pendingTickets} icon="las la-ticket-alt" href="content/tickets" navigate={navigate} />
        <StatCard title="Opened" value={stats.openTickets} icon="las la-ticket-alt" href="content/tickets" navigate={navigate} />
        <StatCard title="Closed" value={stats.closedTickets} icon="las la-ticket-alt" href="content/tickets" navigate={navigate} />
      </div>

      {/* Footer spacer */}
      <div className="mt-8" />
    </div>
  )
}
