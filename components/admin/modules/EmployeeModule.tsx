'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  UserCheck, Users, CalendarDays, Clock, Award, Eye,
  Mail, Phone, Building2, CheckCircle2, XCircle, Coffee,
  Laptop, Sun, Moon, AlertTriangle, BarChart3, Plus,
  Star, TrendingUp, UserPlus, Briefcase, Upload,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import { EMPLOYEES_DATA } from '@/lib/admin/adminMockData'
import { formatDate } from '@/lib/admin/adminHooks'
import type { Employee, EmployeeStatus, LeaveRequest, AttendanceRecord } from '@/lib/admin/adminTypes'
import { uploadFile } from '@/lib/supabase/storageService'

// ── Mock Leave & Attendance Data ─────────────────────────────────
const LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 'LR-001', employeeId: 'EMP-007', employeeName: 'Rahul Menon', type: 'casual', from: '2025-03-17', to: '2025-03-21', days: 5, reason: 'Family event', status: 'approved', appliedDate: '2025-03-10' },
  { id: 'LR-002', employeeId: 'EMP-004', employeeName: 'Priya Natarajan', type: 'sick', from: '2025-03-25', to: '2025-03-26', days: 2, reason: 'Medical appointment', status: 'pending', appliedDate: '2025-03-18' },
  { id: 'LR-003', employeeId: 'EMP-006', employeeName: 'Divya Krishnamurthy', type: 'earned', from: '2025-04-01', to: '2025-04-05', days: 5, reason: 'Vacation', status: 'pending', appliedDate: '2025-03-19' },
  { id: 'LR-004', employeeId: 'EMP-005', employeeName: 'Karthik Sundaram', type: 'comp-off', from: '2025-03-22', to: '2025-03-22', days: 1, reason: 'Worked weekend', status: 'approved', appliedDate: '2025-03-15' },
]

const ATTENDANCE_SUMMARY = [
  { name: 'Abe Thayil', present: 22, absent: 0, halfDay: 0, wfh: 3, total: 22 },
  { name: 'Venkatesh Raghavan', present: 20, absent: 1, halfDay: 1, wfh: 4, total: 22 },
  { name: 'Meera Subramaniam', present: 21, absent: 0, halfDay: 0, wfh: 2, total: 22 },
  { name: 'Priya Natarajan', present: 19, absent: 2, halfDay: 1, wfh: 5, total: 22 },
  { name: 'Karthik Sundaram', present: 21, absent: 1, halfDay: 0, wfh: 3, total: 22 },
  { name: 'Divya Krishnamurthy', present: 20, absent: 1, halfDay: 1, wfh: 2, total: 22 },
  { name: 'Rahul Menon', present: 17, absent: 5, halfDay: 0, wfh: 0, total: 22 },
  { name: 'Sowmya Rajan', present: 22, absent: 0, halfDay: 0, wfh: 4, total: 22 },
  { name: 'Arjun Menon', present: 18, absent: 2, halfDay: 2, wfh: 1, total: 22 },
]

// ── Sub-tabs ─────────────────────────────────────────────────────
const EMPLOYEE_TABS = [
  { id: 'directory', label: 'Directory', icon: Users },
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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [empForm, setEmpForm] = useState({
    name: '', email: '', phone: '', department: 'Operations', role: '',
    employeeType: 'full-time' as 'full-time' | 'contract' | 'intern',
    reportingTo: '', joiningDate: '', status: 'active' as EmployeeStatus
  })

  useEffect(() => {
    if (editEmployee && addEmployeeOpen) {
      setEmpForm({
        name: editEmployee.name, email: editEmployee.email, phone: editEmployee.phone || '',
        department: editEmployee.department, role: editEmployee.role,
        employeeType: 'full-time', reportingTo: editEmployee.reportingTo || '',
        joiningDate: editEmployee.joinDate || '', status: editEmployee.status
      })
    } else if (!editEmployee && addEmployeeOpen) {
      setEmpForm({ name: '', email: '', phone: '', department: 'Operations', role: '', employeeType: 'full-time', reportingTo: '', joiningDate: '', status: 'active' })
    }
  }, [editEmployee, addEmployeeOpen])

  const handleEmployeeSubmit = () => {
    showToast(editEmployee ? 'Employee updated successfully' : 'Employee added successfully', 'success')
    setAddEmployeeOpen(false)
    setEditEmployee(null)
    setEmpForm({ name: '', email: '', phone: '', department: 'Operations', role: '', employeeType: 'full-time', reportingTo: '', joiningDate: '', status: 'active' })
  }

  const kpis = useMemo(() => {
    const active = EMPLOYEES_DATA.filter(e => e.status === 'active').length
    const onLeave = EMPLOYEES_DATA.filter(e => e.status === 'on-leave').length
    const pendingLeaves = LEAVE_REQUESTS.filter(l => l.status === 'pending').length
    const departments = new Set(EMPLOYEES_DATA.map(e => e.department)).size
    return { total: EMPLOYEES_DATA.length, active, onLeave, pendingLeaves, departments }
  }, [])

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
        {activeTab === 'directory' && <DirectoryTab onView={(e) => setSelectedEmployee(e)} showToast={showToast} />}
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
                <span className="text-xs text-gray-300">{selectedEmployee.phone}</span>
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
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={empForm.email}
                onChange={(e) => setEmpForm(f => ({ ...f, email: e.target.value }))}
                placeholder="employee@company.com"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>
            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone</label>
              <input
                type="tel"
                required
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
              <input
                type="text"
                required
                value={empForm.role}
                onChange={(e) => setEmpForm(f => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Senior Fund Analyst"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
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
                onClick={() => {
                  const inp = document.createElement('input')
                  inp.type = 'file'
                  inp.multiple = true
                  inp.accept = '.pdf,.docx,.xlsx,.jpg,.jpeg,.png,.gif,.webp'
                  inp.onchange = async () => {
                    if (inp.files && inp.files.length > 0) {
                      showToast(`Uploading ${inp.files.length} file(s)...`, 'info')
                      let ok = 0, fail = 0
                      for (let i = 0; i < inp.files.length; i++) {
                        const result = await uploadFile(inp.files[i], 'admin/employees')
                        if (result.success) ok++; else fail++
                      }
                      if (ok > 0) showToast(`${ok} file(s) uploaded to Employee Records`, 'success')
                      if (fail > 0) showToast(`${fail} file(s) failed`, 'error')
                    }
                  }
                  inp.click()
                }}
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
            <button type="submit" className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-brand-red hover:bg-red-600 transition-colors">
              {editEmployee ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  )
}

// ── Directory Tab ───────────────────────────────────────────────
function DirectoryTab({ onView, showToast }: { onView: (e: Employee) => void; showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
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
        data={EMPLOYEES_DATA}
        searchKeys={['name', 'role', 'department', 'email']}
        searchPlaceholder="Search employees..."
        onRowClick={onView}
        exportable
        title="Employee Directory"
      />
    </AdminGlass>
  )
}

// ── Attendance Tab ──────────────────────────────────────────────
function AttendanceTab() {
  return (
    <AdminGlass>
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-brand-red" />
        Monthly Attendance Summary — March 2025
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
function LeaveTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const getLeaveVariant = (type: string) => {
    switch (type) {
      case 'casual': return 'info' as const
      case 'sick': return 'error' as const
      case 'earned': return 'success' as const
      case 'comp-off': return 'purple' as const
      default: return 'neutral' as const
    }
  }

  const columns: Column<LeaveRequest>[] = [
    {
      key: 'employeeName',
      label: 'Employee',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.employeeName}</p>
          <p className="text-[11px] text-gray-500">{row.employeeId}</p>
        </div>
      ),
    },
    { key: 'type', label: 'Type', render: (row) => <AdminBadge label={row.type.replace('-', ' ')} variant={getLeaveVariant(row.type)} /> },
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
            onClick={(e) => { e.stopPropagation(); showToast(`Leave ${row.id} approved`, 'success') }}
            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); showToast(`Leave ${row.id} rejected`, 'error') }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      ) : <span className="text-xs text-gray-600">—</span>,
    },
  ]

  return (
    <AdminGlass padding="p-4">
      <AdminDataTable<LeaveRequest>
        columns={columns}
        data={LEAVE_REQUESTS}
        searchKeys={['employeeName', 'type', 'reason']}
        searchPlaceholder="Search leave requests..."
        title="Leave Requests"
      />
    </AdminGlass>
  )
}

// ── Performance Tab ─────────────────────────────────────────────
function PerformanceTab() {
  const PERFORMANCE_DATA = useMemo(() => [
    { name: 'Abe Thayil', role: 'Founder & CEO', kpiScore: 98, goals: 12, goalsCompleted: 12, rating: 5.0 },
    { name: 'Venkatesh Raghavan', role: 'CIO', kpiScore: 95, goals: 10, goalsCompleted: 9, rating: 4.8 },
    { name: 'Meera Subramaniam', role: 'Head of Compliance', kpiScore: 96, goals: 8, goalsCompleted: 8, rating: 4.9 },
    { name: 'Priya Natarajan', role: 'VP Sales', kpiScore: 92, goals: 15, goalsCompleted: 13, rating: 4.7 },
    { name: 'Karthik Sundaram', role: 'Senior Fund Analyst', kpiScore: 88, goals: 8, goalsCompleted: 7, rating: 4.4 },
    { name: 'Divya Krishnamurthy', role: 'Relationship Manager', kpiScore: 85, goals: 10, goalsCompleted: 8, rating: 4.2 },
    { name: 'Rahul Menon', role: 'Operations Manager', kpiScore: 72, goals: 8, goalsCompleted: 5, rating: 3.6 },
    { name: 'Sowmya Rajan', role: 'Legal Counsel', kpiScore: 91, goals: 6, goalsCompleted: 6, rating: 4.6 },
    { name: 'Arjun Menon', role: 'External Auditor', kpiScore: 80, goals: 5, goalsCompleted: 4, rating: 4.0 },
  ], [])

  return (
    <AdminGlass>
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Award className="w-4 h-4 text-amber-400" />
        Q1 2025 Performance Review
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
