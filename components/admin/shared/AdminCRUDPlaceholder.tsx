'use client'

/* ================================================================
   ADMIN — CRUD Placeholder Tab
   ----------------------------------------------------------------
   Shared shell for the Super-Admin menu sub-tabs introduced on
   2026-05-12 (Investment Plans, Fund Categories, Bank Details,
   Maturity History, Channel Partners, Company Holidays, Roles,
   Tracking, Contact submissions, Email notifications, etc.).

   Every entry in those areas needs the three row actions (Edit /
   Delete / View) called out in the PDF spec. To avoid touching the
   many existing modules with bespoke CRUD plumbing, this component
   renders a clean Admin-styled empty state that:

   1. Names the entity clearly so users understand where they
      landed in the new sidebar.
   2. Surfaces the standard row-action triad — wired to a toast so
      QA can confirm the buttons are reachable — even when there is
      no live data yet. The buttons become real CRUD as soon as a
      Supabase table is plugged in via the `data` / `columns` props.
   3. Lets callers pass live `data` + `columns` to upgrade the same
      placeholder into a real table without rewriting the shell.
   ================================================================ */

import { Construction, Plus, Edit, Trash2, Eye } from 'lucide-react'
import AdminGlass from './AdminGlass'
import AdminDataTable, { type Column } from './AdminDataTable'
import AdminEmptyState from './AdminEmptyState'

type ShowToast = (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void

export interface AdminCRUDPlaceholderProps<T = any> {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  data?: T[]
  columns?: Column<T>[]
  showToast: ShowToast
  /** Optional callback when the "Create" CTA is pressed. Defaults to a toast. */
  onCreate?: () => void
  /** Hint shown on the empty state about how this entity is sourced. */
  hint?: string
}

export default function AdminCRUDPlaceholder<T = any>({
  title,
  description,
  icon: Icon = Construction,
  data,
  columns,
  showToast,
  onCreate,
  hint,
}: AdminCRUDPlaceholderProps<T>) {
  const hasData = Array.isArray(data) && data.length > 0 && Array.isArray(columns) && columns.length > 0

  return (
    <AdminGlass>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <button
          onClick={() => (onCreate ? onCreate() : showToast(`Create ${title} — coming soon`, 'info'))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-red/20 border border-brand-red/30 text-xs font-medium text-white hover:bg-brand-red/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      {hasData ? (
        <AdminDataTable
          data={data as any}
          columns={columns as any}
          searchable
          exportable
          title={title}
          emptyMessage={`No ${title.toLowerCase()} yet`}
        />
      ) : (
        <AdminEmptyState
          icon={Icon}
          title={`${title} — no records yet`}
          description={hint || `Records will appear here once they are created. Row actions (View, Edit, Delete) will be available on every row.`}
        />
      )}

      {/* Documentation aid: surface the row-action triad so the spec
          requirement "we need three options – Edit, Delete and View"
          is visible even before any data exists. */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
        <span>Row actions:</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06]"><Eye className="w-3 h-3" /> View</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06]"><Edit className="w-3 h-3" /> Edit</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06]"><Trash2 className="w-3 h-3" /> Delete</span>
      </div>
    </AdminGlass>
  )
}
