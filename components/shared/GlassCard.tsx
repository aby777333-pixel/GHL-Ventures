'use client'

import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  /** Glass effect intensity: light, medium, heavy */
  intensity?: 'light' | 'medium' | 'heavy'
  /** Hover effect */
  hover?: boolean
  /** Click handler */
  onClick?: () => void
  /** Card padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const intensityStyles = {
  light: 'bg-white/60 backdrop-blur-sm border-white/30',
  medium: 'bg-white/80 backdrop-blur-md border-white/40',
  heavy: 'bg-white/95 backdrop-blur-lg border-gray-100',
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6 md:p-8',
}

export default function GlassCard({
  children,
  className = '',
  intensity = 'heavy',
  hover = false,
  onClick,
  padding = 'md',
}: GlassCardProps) {
  return (
    <div
      className={`
        rounded-2xl border shadow-sm
        ${intensityStyles[intensity]}
        ${paddingStyles[padding]}
        ${hover ? 'hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `.trim()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}

// ── Stat Card variant ───────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  icon?: ReactNode
  iconBg?: string
  className?: string
}

export function StatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  iconBg = 'bg-gray-100',
  className = '',
}: StatCardProps) {
  const changeColors = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  }

  return (
    <GlassCard className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-xs font-medium mt-1 ${changeColors[changeType]}`}>
              {changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : '·'} {change}
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  )
}
