'use client'

import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import AdminGlass from './AdminGlass'

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
  color = '#DC2626',
  delay = 0,
}: AdminKPICardProps) {
  return (
    <AdminGlass className="admin-card-enter" hover>
      <div style={{ animationDelay: `${delay}ms` }}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">{title}</p>
            <p className="text-2xl font-bold text-white mt-1.5 truncate">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div
            className="flex-shrink-0 p-2.5 rounded-xl ml-3"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${
            trend === 'up' ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {trend === 'up' ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <span>{trendValue}</span>
            <span className="text-gray-500 font-normal ml-1">vs last month</span>
          </div>
        )}
      </div>
    </AdminGlass>
  )
}
