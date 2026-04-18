'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  UserCheck, Users, CalendarDays, Clock, Award, Eye,
  Mail, Phone, Building2, CheckCircle2, XCircle, Coffee,
  Laptop, Sun, Moon, AlertTriangle, BarChart3, Plus,
  Star, TrendingUp, UserPlus, Briefcase, Upload,
  FileText, Download, ExternalLink, Linkedin,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import { createEmployee, updateEmployee, getEmployeeDirectory, type EmployeeRecord } from '@/lib/supabase/employeeService'
import { fetchCareerApplications, updateCareerApplicationStatus, getResumeSignedUrl, type CareerApplication } from '@/lib/supabase/adminDataService'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { formatDate } from '@/lib/admin/adminHooks'
import type { Employee, EmployeeStatus, LeaveRequest, AttendanceRecord } from '@/lib/admin/adminTypes'
import UploadWithFolderPicker from '@/components/shared/UploadWithFolderPicker'

const ATTENDANCE_SUMMARY: any[] = []

// ── Sub-tabs ─────────────────────────────────────────────────────
const EMPLOYEE_TABS = [
  { id: 'directory', label: 'Directory', icon: Users },
  { id: 'applications', label: 'Applications', icon: Briefcase },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'leave', label: 'Leave Requests', icon: CalendarDays },
  { id: 'performance', label: 'Performance', icon: Award },
] as const

type EmployeeTab = typeof EMPLOYEE_TABS[number]['id']

interface EmployeeModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function EmployeeModule({ subTab, navigate, showToast }: EmployeeModuleProps) {
  const activeTab = (EMPLOYEE_TABS.some(t => t.id === subTab) ? subTab : 'directory') as EmployeeTab
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    const data = await getEmployeeDirectory()
    setEmployees(data.map((e: EmployeeRecord) => ({
      id: e.employee_id || e.id,
      name: e.name,
      email: e.email,
      phone: e.phone,
      role: e.role,
      department: e.department,
      status: e.status as EmployeeStatus,
      joinDate: e.join_date,
      reportingTo: e.reporting_to_name || e.reporting_to || '',
      _raw: e,
    })))
    setLoading(false)
    // Pending leave count for the KPI strip.
    if (isSupabaseConfigured()) {
      try {
        const sb = supabase as any
        const { count } = await sb.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
        setPendingLeaveCount(count || 0)
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [folderPickerOpen, setFolderPickerOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [empForm, setEmpForm] = useState({
    name: '', email: '', phone: '', password: '', department: 'Operations', role: 'cs-agent',
    employeeType: 'full-time' as 'full-time' | 'contract' | 'intern',
    reportingTo: '', joiningDate: '', status: 'active' as EmployeeStatus
  })

  useEffect(() => {
    if (editEmployee && addEmployeeOpen) {
      setEmpForm({
        name: editEmployee.name, email: editEmployee.email, phone: editEmployee.phone || '',
        password: '', department: editEmployee.department, role: editEmployee.role,
        employeeType: 'full-time', reportingTo: editEmployee.reportingTo || '',
        joiningDate: editEmployee.joinDate || '', status: editEmployee.status
      })
    } else if (!editEmployee && addEmployeeOpen) {
      setEmpForm({ name: '', email: '', phone: '', password: '', department: 'Operations', role: 'cs-agent', employeeType: 'full-time', reportingTo: '', joiningDate: '', status: 'active' })
    }
  }, [editEmployee, addEmployeeOpen])

  const handleEmployeeSubmit = async () => {
    if (editEmployee) {
      setCreating(true)
      const raw = (editEmployee as any)._raw as EmployeeRecord | undefined
      const staffProfileId = raw?.id || editEmployee.id
      const userId = raw?.user_id || ''

      const result = await updateEmployee(staffProfileId, userId, {
        fullName: empForm.name,
        phone: empForm.phone || undefined,
        department: empForm.department,
        designation: empForm.role,
        dateOfJoining: empForm.joiningDate || undefined,
        status: empForm.status,
      })
      setCreating(false)

      if (result.success) {
        showToast(`Employee ${empForm.name} updated successfully`, 'success')
        setAddEmployeeOpen(false)
        setEditEmployee(null)
        loadData()
      } else {
        showToast(result.error || 'Failed to update employee', 'error')
      }
      return
    }

    // Create new employee via Netlify function → Supabase Admin API
    if (!empForm.email || !empForm.password || !empForm.name) {
      showToast('Please fill in name, email, and password', 'error')
      return
    }
    if (empForm.password.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }

    setCreating(true)
    const result = await createEmployee({
      email: empForm.email,
      password: empForm.password,
      fullName: empForm.name,
      phone: empForm.phone || undefined,
      department: empForm.department,
      designation: empForm.role,
      dateOfJoining: empForm.joiningDate || undefined,
    })
    setCreating(false)

    if (result.success) {
      showToast(`Employee ${empForm.name} created with GHL credentials (${empForm.email})`, 'success')
      setAddEmployeeOpen(false)
      setEditEmployee(null)
      setEmpForm({ name: '', email: '', phone: '', password: '', department: 'Operations', role: 'cs-agent', employeeType: 'full-time', reportingTo: '', joiningDate: '', status: 'active' })
      loadData() // Refresh the directory
    } else {
      showToast(result.error || 'Failed to create employee', 'error')
    }
  }

  const kpis = useMemo(() => {
    const active = employees.filter(e => e.status === 'active').length
    const onLeave = employees.filter(e => e.status === 'on-leave').length
    const departments = new Set(employees.map(e => e.department)).size
    return { total: employees.length, active, onLeave, pendingLeaves: pendingLeaveCount, departments }
  }, [employees, pendingLeaveCount])

  const handleTabClick = (tabId: string) => {
    navigate(tabId === 'directory' ? 'employees' : `employees/${tabId}`)
  }

  return (
    <div className="space-y-6 admin-section-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Management</h1>
          <p className="text-sm text-gray-500 mt-1">Directory, attendance, leave tracking, and performance</p>
        </div>
        <button
          onClick={() => { setEditEmployee(null); setAddEmployeeOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors self-start admin-btn-press"
        >
          <UserPlus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <AdminKPICard title="Total Employees" value={kpis.total} icon={Users} color="#3B82F6" delay={0} />
        <AdminKPICard title="Active" value={kpis.active} icon={CheckCircle2} color="#10B981" delay={50} />
        <AdminKPICard title="On Leave" value={kpis.onLeave} icon={Coffee} color="#F59E0B" delay={100} />
        <AdminKPICard title="Pending Leaves" value={kpis.pendingLeaves} icon={CalendarDays} color="#8B5CF6" delay={150} />
        <AdminKPICard title="Departments" value={kpis.departments} icon={Building2} color="#DC2626" delay={200} />
      </div>

      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
        {EMPLOYEE_TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                isActive ? 'bg-brand-red/20 text-white border border-brand-red/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="admin-tab-switch">
        {activeTab === 'directory' && <DirectoryTab employees={employees} onView={(e) => setSelectedEmployee(e)} showToast={showToast} />}
        {activeTab === 'applications' && <ApplicationsTab showToast={showToast} />}
        {activeTab === 'attendance' && <AttendanceTab />}
        {activeTab === 'leave' && <LeaveTab showToast={showToast} />}
        {activeTab === 'performance' && <PerformanceTab />}
      </div>

      {selectedEmployee && (
        <AdminModal
          isOpen={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          title={selectedEmployee.name}
          subtitle={`${selectedEmployee.id} • ${selectedEmployee.role}`}
          footer={
            <>
              <ModalButton onClick={() => setSelectedEmployee(null)}>Close</ModalButton>
              <ModalButton variant="primary" onClick={() => { const emp = selectedEmployee; setSelectedEmployee(null); setEditEmployee(emp); setAddEmployeeOpen(true) }}>Edit</ModalButton>
            </>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-red/40 to-blue-500/40 flex items-center justify-center text-lg font-bold text-white">
                {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <AdminBadge
                    label={selectedEmployee.status}
                    variant={selectedEmployee.status === 'active' ? 'success' : selectedEmployee.status === 'on-leave' ? 'warning' : 'neutral'}
                    dot
                  />
                  <AdminBadge label={selectedEmployee.department} variant="purple" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-300 truncate">{selectedEmployee.email}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-300">{selectedEmployee.phone || (selectedEmployee as any)._raw?.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-300">{selectedEmployee.role}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <CalendarDays className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-300">Joined {formatDate(selectedEmployee.joinDate)}</span>
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Add / Edit Employee Modal */}
      <AdminModal
        isOpen={addEmployeeOpen}
        onClose={() => { setAddEmployeeOpen(false); setEditEmployee(null) }}
        title={editEmployee ? 'Edit Employee' : 'Add New Employee'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleEmployeeSubmit() }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={empForm.name}
                onChange={(e) => setEmpForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Enter full name"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>
            {/* Email (GHL official) */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">GHL Email ID</label>
              <input
                type="email"
                required
                value={empForm.email}
                onChange={(e) => setEmpForm(f => ({ ...f, email: e.target.value }))}
                placeholder="name@ghlindia.com"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>
            {/* Password */}
            {!editEmployee && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Login Password</label>
                <input
                  type="password"
                  required
                  value={empForm.password}
                  onChange={(e) => setEmpForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min 8 characters"
                  minLength={8}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
                />
                <p className="text-[10px] text-gray-600 mt-1">Employee will use this to login at /staff/login</p>
              </div>
            )}
            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone</label>
              <input
                type="tel"
                value={empForm.phone}
                onChange={(e) => setEmpForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>
            {/* Department */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Department</label>
              <select
                value={empForm.department}
                onChange={(e) => setEmpForm(f => ({ ...f, department: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              >
                {['Operations', 'Fund Management', 'Compliance', 'Legal', 'Marketing', 'Technology', 'Sales', 'HR', 'Admin'].map(d => (
                  <option key={d} value={d} className="bg-neutral-900">{d}</option>
                ))}
              </select>
            </div>
            {/* Role / Designation */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Role / Designation</label>
              <select
                value={empForm.role}
                onChange={(e) => setEmpForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              >
                <optgroup label="Customer Service" className="bg-neutral-900">
                  <option value="cs-lead" className="bg-neutral-900">CS Lead</option>
                  <option value="senior-cs-agent" className="bg-neutral-900">Senior CS Agent</option>
                  <option value="cs-agent" className="bg-neutral-900">CS Agent</option>
                </optgroup>
                <optgroup label="Relationship Management" className="bg-neutral-900">
                  <option value="relationship-manager" className="bg-neutral-900">Relationship Manager</option>
                  <option value="team-leader" className="bg-neutral-900">Team Leader</option>
                </optgroup>
                <optgroup label="Sales & Field" className="bg-neutral-900">
                  <option value="field-sales-manager" className="bg-neutral-900">Field Sales Manager</option>
                  <option value="field-sales-executive" className="bg-neutral-900">Field Sales Executive</option>
                  <option value="site-inspector" className="bg-neutral-900">Site Inspector</option>
                </optgroup>
                <optgroup label="Operations" className="bg-neutral-900">
                  <option value="kyc-officer" className="bg-neutral-900">KYC Officer</option>
                  <option value="operations-executive" className="bg-neutral-900">Operations Executive</option>
                  <option value="hr-executive" className="bg-neutral-900">HR Executive</option>
                  <option value="general-employee" className="bg-neutral-900">General Employee</option>
                  <option value="intern" className="bg-neutral-900">Intern / Trainee</option>
                </optgroup>
              </select>
            </div>
            {/* Employee Type */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Employee Type</label>
              <select
                value={empForm.employeeType}
                onChange={(e) => setEmpForm(f => ({ ...f, employeeType: e.target.value as 'full-time' | 'contract' | 'intern' }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              >
                <option value="full-time" className="bg-neutral-900">Full-Time</option>
                <option value="contract" className="bg-neutral-900">Contract</option>
                <option value="intern" className="bg-neutral-900">Intern</option>
              </select>
            </div>
            {/* Reporting To */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Reporting To</label>
              <input
                type="text"
                value={empForm.reportingTo}
                onChange={(e) => setEmpForm(f => ({ ...f, reportingTo: e.target.value }))}
                placeholder="Manager name"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>
            {/* Date of Joining */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Date of Joining</label>
              <input
                type="date"
                value={empForm.joiningDate}
                onChange={(e) => setEmpForm(f => ({ ...f, joiningDate: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
              <select
                value={empForm.status}
                onChange={(e) => setEmpForm(f => ({ ...f, status: e.target.value as EmployeeStatus }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              >
                <option value="active" className="bg-neutral-900">Active</option>
                <option value="on-leave" className="bg-neutral-900">On Leave</option>
                <option value="inactive" className="bg-neutral-900">Inactive</option>
              </select>
            </div>
            {/* Attach Employee Documents */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Attach Employee Documents</label>
              <button
                type="button"
                onClick={() => setFolderPickerOpen(true)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] border border-dashed border-white/[0.12] hover:bg-white/[0.08] hover:border-white/[0.2] transition-colors w-full justify-center"
              >
                <Upload className="w-4 h-4" />
                Upload ID Proofs, Offer Letters & Documents
              </button>
              <p className="text-[10px] text-gray-600 mt-1">Stored in File Repository &gt; Employee Records</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
            <button type="button" onClick={() => { setAddEmployeeOpen(false); setEditEmployee(null) }} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">Cancel</button>
            <button type="submit" disabled={creating} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-brand-red hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {creating && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {creating ? 'Creating Account...' : editEmployee ? 'Update Employee' : 'Create Employee Account'}
            </button>
          </div>
        </form>
      </AdminModal>

      <UploadWithFolderPicker
        open={folderPickerOpen}
        onClose={() => setFolderPickerOpen(false)}
        defaultRoute="admin/employees"
        defaultBucket="ghl-documents"
        showToast={showToast as any}
        onUploadComplete={(results) => {
          const ok = results.filter(r => r.success).length
          if (ok > 0) showToast(`${ok} file(s) uploaded to Employee Records`, 'success')
        }}
        theme="dark"
        portal="admin"
      />
    </div>
  )
}

// ── Directory Tab ───────────────────────────────────────────────
function DirectoryTab({ employees, onView, showToast }: { employees: any[]; onView: (e: Employee) => void; showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const columns: Column<Employee>[] = [
    {
      key: 'name',
      label: 'Employee',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red/30 to-blue-500/30 flex items-center justify-center text-xs font-bold text-white">
            {row.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{row.name}</p>
            <p className="text-[11px] text-gray-500">{row.id}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: (row) => <span className="text-xs text-gray-300">{row.role}</span> },
    { key: 'department', label: 'Department', render: (row) => <AdminBadge label={row.department} variant="purple" /> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <AdminBadge
          label={row.status.replace('-', ' ')}
          variant={row.status === 'active' ? 'success' : row.status === 'on-leave' ? 'warning' : 'neutral'}
          dot
        />
      ),
    },
    { key: 'phone', label: 'Phone', render: (row) => <span className="text-xs text-gray-400">{row.phone || '—'}</span> },
    { key: 'email', label: 'Email', render: (row) => <span className="text-xs text-gray-400 truncate max-w-[180px] block">{row.email}</span> },
    { key: 'joinDate', label: 'Joined', render: (row) => <span className="text-xs text-gray-400">{formatDate(row.joinDate)}</span> },
    {
      key: 'actions',
      label: '',
      sortable: false,
      width: '50px',
      render: (row) => (
        <button onClick={(e) => { e.stopPropagation(); onView(row) }} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors">
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <AdminGlass padding="p-4">
      <AdminDataTable<Employee>
        columns={columns}
        data={employees}
        searchKeys={['name', 'role', 'department', 'email']}
        searchPlaceholder="Search employees..."
        onRowClick={onView}
        exportable
        title="Employee Directory"
      />
    </AdminGlass>
  )
}

// ── Applications Tab (Career Applications from Website) ─────────
function ApplicationsTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [apps, setApps] = useState<CareerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CareerApplication | null>(null)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchCareerApplications()
    setApps(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    setResumeUrl(null)
    setNotesDraft(selected?.notes || '')
    if (selected?.resumePath) {
      setResumeLoading(true)
      getResumeSignedUrl(selected.resumePath, 600).then((url) => {
        setResumeUrl(url)
        setResumeLoading(false)
      })
    }
  }, [selected])

  const kpis = useMemo(() => {
    const total = apps.length
    const pending = apps.filter(a => !a.is_processed && (a.status === 'new' || !a.status)).length
    const processed = apps.filter(a => a.is_processed).length
    const thisWeek = apps.filter(a => {
      if (!a.created_at) return false
      const diff = Date.now() - new Date(a.created_at).getTime()
      return diff < 7 * 24 * 60 * 60 * 1000
    }).length
    return { total, pending, processed, thisWeek }
  }, [apps])

  const statusVariant = (status?: string | null): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch ((status || '').toLowerCase()) {
      case 'hired': case 'accepted': return 'success'
      case 'reviewed': case 'contacted': case 'shortlisted': return 'info'
      case 'rejected': return 'error'
      case 'new': case '': case null: case undefined: return 'warning'
      default: return 'neutral'
    }
  }

  const markStatus = async (newStatus: string) => {
    if (!selected) return
    setSavingStatus(true)
    const ok = await updateCareerApplicationStatus(selected.id, {
      status: newStatus,
      is_processed: newStatus !== 'new',
      notes: notesDraft || null,
    })
    setSavingStatus(false)
    if (ok) {
      showToast(`Marked as ${newStatus}`, 'success')
      setSelected(null)
      load()
    } else {
      showToast('Failed to update status', 'error')
    }
  }

  const columns: Column<CareerApplication>[] = [
    {
      key: 'full_name',
      label: 'Applicant',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.full_name || '—'}</p>
          <p className="text-[11px] text-gray-500">{row.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'position',
      label: 'Position',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm text-gray-200">{row.position || row.subject || 'Not specified'}</p>
          <p className="text-[11px] text-gray-500">{row.experience || '—'}{row.currentCompany ? ` · ${row.currentCompany}` : ''}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (row) => <span className="text-xs text-gray-400">{row.phone || '—'}</span>,
    },
    {
      key: 'resumePath',
      label: 'Resume',
      render: (row) => row.resumePath ? (
        <span className="inline-flex items-center gap-1 text-[11px] text-blue-400"><FileText className="w-3 h-3" /> {row.resumeName || 'file'}</span>
      ) : <span className="text-[11px] text-gray-600">None</span>,
    },
    {
      key: 'created_at',
      label: 'Submitted',
      sortable: true,
      render: (row) => <span className="text-xs text-gray-400">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <AdminBadge label={row.status || 'new'} variant={statusVariant(row.status)} dot />,
    },
    {
      key: 'actions' as any,
      label: '',
      render: (row) => (
        <button
          onClick={() => setSelected(row)}
          className="text-xs text-brand-red hover:underline font-medium inline-flex items-center gap-1"
        >
          <Eye className="w-3 h-3" /> View
        </button>
      ),
    },
  ]

  return (
    <AdminGlass>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <AdminKPICard title="Total Applications" value={kpis.total} icon={Briefcase} color="#3B82F6" delay={0} />
        <AdminKPICard title="New / Pending" value={kpis.pending} icon={Clock} color="#F59E0B" delay={50} />
        <AdminKPICard title="Processed" value={kpis.processed} icon={CheckCircle2} color="#10B981" delay={100} />
        <AdminKPICard title="This Week" value={kpis.thisWeek} icon={TrendingUp} color="#8B5CF6" delay={150} />
      </div>
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading applications…</div>
      ) : (
        <AdminDataTable
          data={apps}
          columns={columns}
          searchable
          exportable
          title="Career Applications"
          emptyMessage="No career applications yet"
        />
      )}

      {selected && (
        <AdminModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.full_name || 'Applicant'}
          subtitle={`${selected.position || selected.subject || 'Position not specified'} • ${formatDate(selected.created_at)}`}
          maxWidth="max-w-3xl"
          footer={
            <>
              <ModalButton onClick={() => setSelected(null)}>Close</ModalButton>
              <ModalButton variant="primary" onClick={() => markStatus('reviewed')} disabled={savingStatus}>Mark Reviewed</ModalButton>
              <ModalButton variant="primary" onClick={() => markStatus('shortlisted')} disabled={savingStatus}>Shortlist</ModalButton>
              <ModalButton variant="danger" onClick={() => markStatus('rejected')} disabled={savingStatus}>Reject</ModalButton>
            </>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <AdminBadge label={selected.status || 'new'} variant={statusVariant(selected.status)} dot />
              {selected.is_processed && <AdminBadge label="Processed" variant="success" />}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                <a href={selected.email ? `mailto:${selected.email}` : undefined} className="text-xs text-gray-300 truncate hover:text-white">{selected.email || '—'}</a>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                <a href={selected.phone ? `tel:${selected.phone}` : undefined} className="text-xs text-gray-300 hover:text-white">{selected.phone || '—'}</a>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <Briefcase className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-xs text-gray-300">{selected.position || selected.subject || '—'}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <Award className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-xs text-gray-300">{selected.experience || '—'} experience</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-xs text-gray-300 truncate">{selected.currentCompany || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <Star className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-xs text-gray-300">CTC: {selected.currentCTC || 'Not provided'}</span>
              </div>
            </div>

            {(selected.linkedin || selected.portfolio) && (
              <div className="flex flex-wrap gap-2">
                {selected.linkedin && (
                  <a href={selected.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 hover:bg-blue-500/20">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {selected.portfolio && (
                  <a href={selected.portfolio} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-gray-300 hover:bg-white/[0.08]">
                    <ExternalLink className="w-3 h-3" /> Portfolio
                  </a>
                )}
              </div>
            )}

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-2">Resume / CV</p>
              {selected.resumePath ? (
                resumeLoading ? (
                  <p className="text-xs text-gray-500">Generating secure link…</p>
                ) : resumeUrl ? (
                  (() => {
                    const name = selected.resumeName || selected.resumePath || ''
                    const isPdf = /\.pdf$/i.test(name)
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        {isPdf ? (
                          <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-red/15 border border-brand-red/30 text-xs text-white hover:bg-brand-red/25">
                            <Eye className="w-3.5 h-3.5" /> Preview in new tab
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs text-gray-500 cursor-help" title="This file isn't a PDF, so browsers can't preview it inline. Use Download.">
                            <Eye className="w-3.5 h-3.5 opacity-50" /> Preview unavailable (legacy {name.split('.').pop()?.toLowerCase() || 'file'})
                          </span>
                        )}
                        <a href={resumeUrl} download={name || 'resume'} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-gray-200 hover:bg-white/[0.08]">
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                        <span className="text-[11px] text-gray-500 truncate max-w-[220px]">{name || 'resume'}{selected.resumeSize ? ` · ${(selected.resumeSize / 1024).toFixed(0)} KB` : ''}</span>
                      </div>
                    )
                  })()
                ) : (
                  <p className="text-xs text-red-400">Could not generate download link. Check storage permissions.</p>
                )
              ) : (
                <p className="text-xs text-gray-500 italic">No resume uploaded with this application.</p>
              )}
            </div>

            {selected.coverLetter && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-2">Why GHL India Ventures?</p>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{selected.coverLetter}</p>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-2">HR Notes</label>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={3}
                placeholder="Interview feedback, next steps, etc."
                className="w-full px-3 py-2 text-xs text-gray-200 rounded-lg bg-white/[0.04] border border-white/[0.06] focus:outline-none focus:border-brand-red/50"
              />
            </div>
          </div>
        </AdminModal>
      )}
    </AdminGlass>
  )
}

// ── Attendance Tab ──────────────────────────────────────────────
function AttendanceTab() {
  return (
    <AdminGlass>
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-brand-red" />
        Monthly Attendance Summary
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Employee', 'Present', 'Absent', 'Half Day', 'WFH', 'Attendance %'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ATTENDANCE_SUMMARY.map(row => {
              const pct = Math.round((row.present / row.total) * 100)
              return (
                <tr key={row.name} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-white">{row.name}</td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">{row.present}</td>
                  <td className="px-4 py-3 text-red-400">{row.absent}</td>
                  <td className="px-4 py-3 text-amber-400">{row.halfDay}</td>
                  <td className="px-4 py-3 text-blue-400">{row.wfh}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct >= 95 ? '#10B981' : pct >= 85 ? '#F59E0B' : '#EF4444',
                          }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${pct >= 95 ? 'text-emerald-400' : pct >= 85 ? 'text-amber-400' : 'text-red-400'}`}>
                        {pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </AdminGlass>
  )
}

// ── Leave Tab ───────────────────────────────────────────────────
interface AdminLeaveRow {
  id: string
  staff_id: string
  staff_name: string | null
  staff_code: string | null
  leave_type: string
  start_date: string
  end_date: string
  reason: string | null
  status: string
  half_day: boolean | null
  created_at: string
}

function LeaveTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [rows, setRows] = useState<AdminLeaveRow[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadRows = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    try {
      const sb = supabase as any
      const { data, error } = await sb.rpc('list_leave_requests_for_admin')
      if (!error && Array.isArray(data)) setRows(data as AdminLeaveRow[])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadRows() }, [loadRows])

  const daysBetween = (from: string, to: string) => {
    const a = new Date(from), b = new Date(to)
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return 1
    return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1)
  }

  const decide = async (id: string, status: 'approved' | 'rejected') => {
    if (!isSupabaseConfigured()) { showToast('Database is not configured', 'error'); return }
    setBusyId(id)
    try {
      const sb = supabase as any
      const { error } = await sb.rpc('set_leave_request_status', { p_leave_id: id, p_status: status, p_note: null })
      if (error) throw error
      showToast(`Leave ${status}`, status === 'approved' ? 'success' : 'info')
      setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } catch (err: any) {
      const msg = err?.message || 'Unknown error'
      showToast(msg === 'not_authorised' ? 'Only admins can decide leave requests.' : `Failed: ${msg}`, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const tableRows: (LeaveRequest & { _id: string })[] = rows.map(r => ({
    _id: r.id,
    id: r.id.slice(0, 8).toUpperCase(),
    employeeId: r.staff_code || '',
    employeeName: r.staff_name || 'Unknown staff',
    type: r.leave_type as LeaveRequest['type'],
    from: r.start_date,
    to: r.end_date,
    days: r.half_day ? 0.5 : daysBetween(r.start_date, r.end_date),
    reason: r.reason || '',
    status: r.status as LeaveRequest['status'],
    appliedDate: r.created_at,
  }))

  const getLeaveVariant = (type: string) => {
    const norm = type.toLowerCase()
    if (norm.includes('casual')) return 'info' as const
    if (norm.includes('sick')) return 'error' as const
    if (norm.includes('earned')) return 'success' as const
    if (norm.includes('comp')) return 'purple' as const
    return 'neutral' as const
  }

  const columns: Column<LeaveRequest & { _id: string }>[] = [
    {
      key: 'employeeName',
      label: 'Employee',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.employeeName}</p>
          <p className="text-[11px] text-gray-500">{row.employeeId || row.id}</p>
        </div>
      ),
    },
    { key: 'type', label: 'Type', render: (row) => <AdminBadge label={row.type} variant={getLeaveVariant(row.type)} /> },
    { key: 'from', label: 'From', render: (row) => <span className="text-xs text-gray-300">{formatDate(row.from)}</span> },
    { key: 'to', label: 'To', render: (row) => <span className="text-xs text-gray-300">{formatDate(row.to)}</span> },
    { key: 'days', label: 'Days', render: (row) => <span className="text-white font-semibold">{row.days}</span> },
    { key: 'reason', label: 'Reason', render: (row) => <span className="text-xs text-gray-400 truncate max-w-[200px] block">{row.reason}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <AdminBadge
          label={row.status}
          variant={row.status === 'approved' ? 'success' : row.status === 'pending' ? 'warning' : 'error'}
          dot
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      width: '120px',
      render: (row) => row.status === 'pending' ? (
        <div className="flex items-center gap-1">
          <button
            disabled={busyId === row._id}
            onClick={(e) => { e.stopPropagation(); decide(row._id, 'approved') }}
            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400 transition-colors disabled:opacity-50"
            title="Approve"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button
            disabled={busyId === row._id}
            onClick={(e) => { e.stopPropagation(); decide(row._id, 'rejected') }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
            title="Reject"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      ) : <span className="text-xs text-gray-600">—</span>,
    },
  ]

  return (
    <AdminGlass padding="p-4">
      <AdminDataTable<LeaveRequest & { _id: string }>
        columns={columns}
        data={tableRows}
        searchKeys={['employeeName', 'type', 'reason']}
        searchPlaceholder="Search leave requests..."
        title="Leave Requests"
      />
    </AdminGlass>
  )
}

// ── Performance Tab ─────────────────────────────────────────────
function PerformanceTab() {
  const PERFORMANCE_DATA = useMemo<{ name: string; role: string; kpiScore: number; goals: number; goalsCompleted: number; rating: number }[]>(() => [], [])

  return (
    <AdminGlass>
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Award className="w-4 h-4 text-amber-400" />
        Performance Review
      </h3>
      <div className="space-y-3">
        {PERFORMANCE_DATA.sort((a, b) => b.kpiScore - a.kpiScore).map((emp, i) => (
          <div key={emp.name} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/[0.04]">
            <span className="text-sm font-bold text-gray-600 w-6">#{i + 1}</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-red/30 to-blue-500/30 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
              {emp.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{emp.name}</p>
              <p className="text-[11px] text-gray-500">{emp.role}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <p className={`font-bold ${emp.kpiScore >= 90 ? 'text-emerald-400' : emp.kpiScore >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                  {emp.kpiScore}
                </p>
                <p className="text-gray-600">KPI</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-300">{emp.goalsCompleted}/{emp.goals}</p>
                <p className="text-gray-600">Goals</p>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, idx) => (
                  <Star
                    key={idx}
                    className={`w-3 h-3 ${idx < Math.floor(emp.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`}
                  />
                ))}
                <span className="text-gray-400 ml-1">{emp.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminGlass>
  )
}
