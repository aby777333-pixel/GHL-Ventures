'use client'

import { Inbox } from 'lucide-react'

interface AdminEmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function AdminEmptyState({
  icon: Icon = Inbox,
  title = 'No data yet',
  description = 'Data will appear here once available.',
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-2xl bg-white/[0.04] mb-4">
        <Icon className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-sm font-semibold text-gray-300 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
