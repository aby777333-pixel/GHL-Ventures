'use client'

import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface AdminKPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down'
  trendValue?: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color?: string
  delay?: number
}

export default function AdminKPICard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon: Icon,
  color = '#ac0d0d',
  delay = 0,
}: AdminKPICardProps) {
  return (
    <div
      className="rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] admin-card-enter"
      style={{
        background: 'linear-gradient(135deg, #ac0d0d 0%, #d41919 100%)',
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/80 font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1.5 truncate">{value}</p>
          {subtitle && <p className="text-xs text-white/60 mt-1">{subtitle}</p>}
        </div>
        <div className="flex-shrink-0 p-2.5 rounded-xl ml-3 bg-white/15">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {trend && trendValue && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${
          trend === 'up' ? 'text-emerald-200' : 'text-red-200'
        }`}>
          {trend === 'up' ? (
            <ArrowUpRight className="w-3.5 h-3.5" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5" />
          )}
          <span>{trendValue}</span>
          <span className="text-white/50 font-normal ml-1">vs last month</span>
        </div>
      )}
    </div>
  )
}
