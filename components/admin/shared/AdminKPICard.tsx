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

// Convert a hex colour ("#RRGGBB" or "#RGB") to a "r, g, b" triple the
// .admin-kpi-glass CSS variable expects. Falls back to brand red.
function hexToRgbTriple(hex: string): string {
  const clean = (hex || '').replace('#', '').trim()
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    const r = parseInt(clean[0] + clean[0], 16)
    const g = parseInt(clean[1] + clean[1], 16)
    const b = parseInt(clean[2] + clean[2], 16)
    return `${r}, ${g}, ${b}`
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    return `${r}, ${g}, ${b}`
  }
  return '208, 2, 27'
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
  const accentRgb = hexToRgbTriple(color)
  return (
    <div
      className="admin-kpi-glass rounded-xl p-5 admin-card-enter"
      style={{
        animationDelay: `${delay}ms`,
        ['--kpi-accent-rgb' as any]: accentRgb,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/80 font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1.5 truncate">{value}</p>
          {subtitle && <p className="text-xs text-white/60 mt-1">{subtitle}</p>}
        </div>
        <div
          className="flex-shrink-0 p-2.5 rounded-xl ml-3"
          style={{
            background: `linear-gradient(135deg, rgba(${accentRgb}, 0.25), rgba(255,255,255,0.08))`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px -2px rgba(${accentRgb}, 0.35)`,
          }}
        >
          <Icon className="w-5 h-5 text-white" style={{ filter: `drop-shadow(0 0 6px rgba(${accentRgb}, 0.6))` }} />
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
