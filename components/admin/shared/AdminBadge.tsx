'use client'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple'

const BADGE_STYLES: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/15 text-red-400 border-red-500/20',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  neutral: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
}

interface AdminBadgeProps {
  label: string
  variant?: BadgeVariant
  dot?: boolean
  size?: 'sm' | 'md'
}

export default function AdminBadge({ label, variant = 'neutral', dot = false, size = 'sm' }: AdminBadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-2 py-0.5'
    : 'text-xs px-2.5 py-1'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold border ${BADGE_STYLES[variant]} ${sizeClasses}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === 'success' ? 'bg-emerald-400' : variant === 'error' ? 'bg-red-400' : variant === 'warning' ? 'bg-amber-400' : 'bg-gray-400'}`} />}
      {label}
    </span>
  )
}

// ── Status Helpers ────────────────────────────────────────────────
export function getKYCBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'approved': return 'success'
    case 'under-review': return 'warning'
    case 'pending': return 'info'
    case 'rejected': return 'error'
    case 'expired': return 'error'
    default: return 'neutral'
  }
}

export function getAccountBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'active': return 'success'
    case 'frozen': return 'warning'
    case 'suspended': return 'error'
    case 'closed': return 'neutral'
    default: return 'neutral'
  }
}

export function getSeverityBadgeVariant(severity: string): BadgeVariant {
  switch (severity) {
    case 'critical': return 'error'
    case 'high': return 'warning'
    case 'medium': return 'info'
    case 'low': return 'neutral'
    default: return 'neutral'
  }
}
