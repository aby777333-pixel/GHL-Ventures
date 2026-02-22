'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight, Download } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────
export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  render?: (row: T, index: number) => React.ReactNode
}

interface AdminDataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  pageSize?: number
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: string[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  exportable?: boolean
  title?: string
  actions?: React.ReactNode
}

type SortDir = 'asc' | 'desc' | null

// ── Component ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AdminDataTable<T extends Record<string, any>>({
  columns,
  data,
  pageSize = 10,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchKeys = [],
  onRowClick,
  emptyMessage = 'No data found',
  exportable = false,
  title,
  actions,
}: AdminDataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [page, setPage] = useState(0)

  // ── Search ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(row => {
      const keys = searchKeys.length > 0 ? searchKeys : columns.map(c => c.key)
      return keys.some(k => {
        const val = row[k]
        if (val == null) return false
        return String(val).toLowerCase().includes(q)
      })
    })
  }, [data, search, searchKeys, columns])

  // ── Sort ─────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
  }, [filtered, sortKey, sortDir])

  // ── Pagination ───────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc')
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null) }
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  const handleExport = () => {
    const headers = columns.map(c => c.label).join(',')
    const rows = sorted.map(row =>
      columns.map(c => {
        const val = row[c.key]
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val ?? '')
      }).join(',')
    ).join('\n')
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'export'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      {/* Header Row */}
      {(title || searchable || exportable || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
          <div className="flex items-center gap-2 ml-auto">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0) }}
                  placeholder={searchPlaceholder}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 w-48 admin-input-glow"
                />
              </div>
            )}
            {exportable && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            )}
            {actions}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`text-left px-4 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-medium ${
                    col.sortable !== false ? 'cursor-pointer select-none hover:text-gray-300' : ''
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && (
                      sortKey === col.key ? (
                        sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : <ChevronsUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-sm text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-white/[0.04] transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-white/[0.03]' : ''
                  }`}
                >
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-gray-300">
                      {col.render ? col.render(row, page * pageSize + i) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                  page === i
                    ? 'bg-brand-red/20 text-brand-red border border-brand-red/30'
                    : 'hover:bg-white/[0.06] text-gray-500'
                }`}
              >
                {i + 1}
              </button>
            )).slice(Math.max(0, page - 2), page + 3)}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
