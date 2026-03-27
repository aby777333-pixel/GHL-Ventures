'use client'

import { useState, useMemo, useEffect } from 'react'
import AdminGlass from '@/components/admin/shared/AdminGlass'
import AdminBadge from '@/components/admin/shared/AdminBadge'
import AdminDataTable, { type Column } from '@/components/admin/shared/AdminDataTable'
import { STAFF_ROLE_LABELS } from '@/lib/staff/staffAuth'
import { fetchStaffEmployees, fetchAnnouncements } from '@/lib/supabase/staffDataService'
import type { StaffRole, StaffEmployee, Announcement } from '@/lib/staff/staffTypes'
import {
  Users, Search, Phone, Mail, MessageSquare, Filter,
  Pin, Clock, Megaphone, Award, AlertCircle, Settings,
  Calendar, MapPin, Shield, ChevronRight,
} from 'lucide-react'

// ── Props ──────────────────────────────────────────────────────
interface TeamModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  role: StaffRole
}

// ── Helpers ────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-teal-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-blue-500',
  'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500',
]

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'active': return 'success'
    case 'probation': return 'warning'
    case 'notice-period': return 'error'
    case 'contract': return 'info'
    default: return 'neutral'
  }
}

const ANNOUNCEMENT_TYPE_COLORS: Record<string, { variant: 'error' | 'warning' | 'info' | 'success' | 'purple' | 'neutral'; label: string }> = {
  'policy-update': { variant: 'error', label: 'Policy Update' },
  'process-change': { variant: 'warning', label: 'Process Change' },
  'event': { variant: 'info', label: 'Event' },
  'achievement': { variant: 'success', label: 'Achievement' },
  'general': { variant: 'neutral', label: 'General' },
}

// ── Main Component ─────────────────────────────────────────────
export default function TeamModule({ subTab, navigate, showToast, role }: TeamModuleProps) {
  const tab = subTab || 'directory'
  const [employees, setEmployees] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {
    fetchStaffEmployees().then(data => setEmployees(data))
    fetchAnnouncements().then(data => setAnnouncements(data))
  }, [])

  switch (tab) {
    case 'directory':     return <DirectoryView showToast={showToast} employees={employees} />
    case 'roster':        return <RosterView employees={employees} />
    case 'announcements': return <AnnouncementsView announcements={announcements} />
    default:              return <DirectoryView showToast={showToast} employees={employees} />
  }
}

// ================================================================
//  1. DIRECTORY VIEW
// ================================================================
function DirectoryView({ showToast, employees }: { showToast: TeamModuleProps['showToast']; employees: any[] }) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState<string>('all')

  const departments = useMemo(() => Array.from(new Set(employees.map((e: any) => e.department).filter(Boolean))), [employees])

  const filtered = useMemo(() => {
    let list = employees
    if (deptFilter !== 'all') list = list.filter(e => e.department === deptFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        (e.name || '').toLowerCase().includes(q) ||
        (e.designation || '').toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q) ||
        (e.department || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [employees, search, deptFilter])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-400" />
          <h2 className="text-lg font-bold text-white">Team Directory</h2>
          <span className="text-xs text-gray-500 ml-1">({filtered.length} members)</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Department Filter */}
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-teal-400/40 focus:ring-1 focus:ring-teal-400/20 appearance-none cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search team..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-400/40 focus:ring-1 focus:ring-teal-400/20 w-48"
            />
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(emp => (
          <EmployeeCard key={emp.id} employee={emp} showToast={showToast} />
        ))}
      </div>

      {filtered.length === 0 && (
        <AdminGlass hover={false} padding="p-10">
          <div className="text-center text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No team members found matching your criteria.</p>
          </div>
        </AdminGlass>
      )}
    </div>
  )
}

// ── Employee Card ──────────────────────────────────────────────
function EmployeeCard({ employee: emp, showToast }: { employee: StaffEmployee; showToast: TeamModuleProps['showToast'] }) {
  return (
    <AdminGlass padding="p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className={`w-11 h-11 rounded-full ${getAvatarColor(emp.name)} flex items-center justify-center text-white text-sm font-bold`}>
            {getInitials(emp.name)}
          </div>
          {/* Online indicator */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0f] ${
              emp.isOnline ? 'bg-emerald-400' : 'bg-gray-600'
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white truncate">{emp.name}</h4>
          </div>
          <p className="text-[11px] text-gray-400 truncate">{emp.designation}</p>
          <div className="flex items-center gap-2 mt-1">
            <AdminBadge label={emp.department} variant="info" size="sm" />
            <AdminBadge label={STAFF_ROLE_LABELS[emp.role]} variant="purple" size="sm" />
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <Mail className="w-3 h-3 text-gray-600" /><span className="truncate">{emp.email}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <Phone className="w-3 h-3 text-gray-600" /><span>{emp.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <MapPin className="w-3 h-3 text-gray-600" /><span className="truncate">{emp.location}</span>
        </div>
      </div>
      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
        <button
          onClick={() => showToast(`Opening chat with ${emp.name}...`, 'info')}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-lg hover:bg-teal-500/20 transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
          Chat
        </button>
        <button
          onClick={() => showToast(`Calling ${emp.name}...`, 'info')}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-lg hover:bg-teal-500/20 transition-colors"
        >
          <Phone className="w-3 h-3" />
          Call
        </button>
      </div>
    </AdminGlass>
  )
}

// ================================================================
//  2. ROSTER VIEW
// ================================================================
function RosterView({ employees }: { employees: any[] }) {
  const columns: Column<StaffEmployee>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full ${getAvatarColor(row.name)} flex items-center justify-center text-white text-[10px] font-bold`}>
            {getInitials(row.name)}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{row.name}</p>
            <p className="text-[10px] text-gray-500">{row.staffCode}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span className="text-xs text-gray-300">{STAFF_ROLE_LABELS[row.role]}</span>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (row) => (
        <span className="text-xs text-gray-300">{row.department}</span>
      ),
    },
    {
      key: 'shift',
      label: 'Shift',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-gray-600" />
          <span className="text-xs text-gray-400">{row.shift}</span>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-gray-600" />
          <span className="text-xs text-gray-400 truncate max-w-[160px]">{row.location}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <AdminBadge
          label={row.status.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          variant={getStatusBadgeVariant(row.status)}
          dot
        />
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-teal-400" />
          <h2 className="text-lg font-bold text-white">Team Roster</h2>
        </div>
        <p className="text-xs text-gray-500 ml-7">Current shift assignments</p>
      </div>

      {/* Table */}
      <AdminGlass hover={false} padding="p-4">
        <AdminDataTable
          columns={columns}
          data={employees}
          searchable
          searchPlaceholder="Search roster..."
          searchKeys={['name', 'role', 'department', 'location', 'status']}
          pageSize={8}
          emptyMessage="No roster entries found"
        />
      </AdminGlass>
    </div>
  )
}

// ================================================================
//  3. ANNOUNCEMENTS VIEW
// ================================================================
function AnnouncementsView({ announcements }: { announcements: any[] }) {
  const sorted = useMemo(() => {
    return [...announcements].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
    })
  }, [announcements])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Megaphone className="w-5 h-5 text-teal-400" />
          <h2 className="text-lg font-bold text-white">Announcements</h2>
        </div>
        <p className="text-xs text-gray-500 ml-7">Company updates, policy changes, and team achievements</p>
      </div>

      {/* Announcement Cards */}
      <div className="space-y-3">
        {sorted.map(ann => <AnnouncementCard key={ann.id} announcement={ann} />)}
      </div>
      {sorted.length === 0 && (
        <AdminGlass hover={false} padding="p-10">
          <div className="text-center text-gray-500">
            <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No announcements at this time.</p>
          </div>
        </AdminGlass>
      )}
    </div>
  )
}

// ── Announcement Card ──────────────────────────────────────────
function AnnouncementCard({ announcement: ann }: { announcement: Announcement }) {
  const typeInfo = ANNOUNCEMENT_TYPE_COLORS[ann.type] || { variant: 'neutral' as const, label: ann.type }
  const truncatedContent = ann.content.length > 150
    ? ann.content.slice(0, 150) + '...'
    : ann.content

  return (
    <AdminGlass padding="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Top row: badges + pinned */}
          <div className="flex items-center gap-2 mb-2">
            <AdminBadge label={typeInfo.label} variant={typeInfo.variant} size="sm" />
            {ann.pinned && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400">
                <Pin className="w-3 h-3" />
                Pinned
              </span>
            )}
            {ann.department && (
              <span className="text-[10px] text-gray-600 ml-auto">{ann.department}</span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-sm font-semibold text-white mb-1">{ann.title}</h4>

          {/* Content preview */}
          <p className="text-xs text-gray-400 leading-relaxed mb-2">{truncatedContent}</p>

          {/* Footer: posted by + date */}
          <div className="flex items-center gap-3 text-[10px] text-gray-600">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {ann.postedBy}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(ann.postedDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
            <span className="text-gray-700">
              {(ann.readBy?.length ?? 0)} read
            </span>
          </div>
        </div>
      </div>
    </AdminGlass>
  )
}
