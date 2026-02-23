'use client'

import { ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'

interface QueryWrapperProps {
  loading: boolean
  error: string | null
  children: ReactNode
  refetch?: () => void
  /** Optional custom loading component */
  loadingComponent?: ReactNode
  /** Optional custom error component */
  errorComponent?: ReactNode
  /** Minimum height for the loading/error container */
  minHeight?: string
  /** Show a compact inline version */
  inline?: boolean
}

export default function QueryWrapper({
  loading,
  error,
  children,
  refetch,
  loadingComponent,
  errorComponent,
  minHeight = '200px',
  inline = false,
}: QueryWrapperProps) {
  // ── Loading state ──
  if (loading) {
    if (loadingComponent) return <>{loadingComponent}</>

    if (inline) {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      )
    }

    return (
      <div
        className="flex flex-col items-center justify-center gap-3"
        style={{ minHeight }}
      >
        <div className="relative">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-brand-red rounded-full animate-spin" />
        </div>
        <p className="text-sm text-gray-500 animate-pulse">Loading data…</p>
      </div>
    )
  }

  // ── Error state ──
  if (error) {
    if (errorComponent) return <>{errorComponent}</>

    if (inline) {
      return (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4" />
          {error}
          {refetch && (
            <button
              onClick={refetch}
              className="text-brand-red hover:underline font-medium"
            >
              Retry
            </button>
          )}
        </div>
      )
    }

    return (
      <div
        className="flex flex-col items-center justify-center gap-4"
        style={{ minHeight }}
      >
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Something went wrong</p>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">{error}</p>
        </div>
        {refetch && (
          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-red hover:bg-red-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    )
  }

  // ── Success state ──
  return <>{children}</>
}

// ── Empty state helper ──────────────────────────────────────
interface EmptyStateProps {
  icon?: ReactNode
  title?: string
  description?: string
  action?: ReactNode
  minHeight?: string
}

export function EmptyState({
  icon,
  title = 'No data found',
  description = 'There are no items to display at this time.',
  action,
  minHeight = '200px',
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-8"
      style={{ minHeight }}
    >
      {icon && (
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
          {icon}
        </div>
      )}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">{description}</p>
      </div>
      {action}
    </div>
  )
}
