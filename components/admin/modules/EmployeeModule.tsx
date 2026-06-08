'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  UserCheck, Users, CalendarDays, Clock, Award, Eye,
  Mail, Phone, Building2, CheckCircle2, XCircle, Coffee,
  Laptop, Sun, Moon, AlertTriangle, BarChart3, Plus,
  Star, TrendingUp, UserPlus, Briefcase, Upload,
  FileText, Download, ExternalLink, Linkedin,
  Megaphone, Pin, Trash2, Edit3, BookOpen, MessageSquare, KeyRound,
  IndianRupee, Receipt,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import AdminCRUDPlaceholder from '../shared/AdminCRUDPlaceholder'
import { createEmployee, updateEmployee, getEmployeeDirectory, type EmployeeRecord } from '@/lib/supabase/employeeService'
import { fetchCareerApplications, updateCareerApplicationStatus, getResumeSignedUrl, deleteEmployeeSafe, fetchCustomRoles, type CareerApplication, type AdminRoleRow } from '@/lib/supabase/adminDataService'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import {
  fetchAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type AdminAnnouncement,
  type AnnouncementType,
} from '@/lib/supabase/announcementService'
import {
  fetchAllPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
  type StaffPolicy,
  type PolicyInput,
} from '@/lib/supabase/policyService'
import { formatDate } from '@/lib/admin/adminHooks'
import type { Employee, EmployeeStatus, LeaveRequest, AttendanceRecord } from '@/lib/admin/adminTypes'
import UploadWithFolderPicker from '@/components/shared/UploadWithFolderPicker'
import PasswordResetModal, { type PasswordResetTarget } from '../shared/PasswordResetModal'

// ── Sub-tabs ─────────────────────────────────────────────────────
// 2026-05-12: Super-Admin menu spec adds Employee → Employee's Asset
// (asset directory scoped to assigned employee) and Company Holidays.
const EMPLOYEE_TABS = [
  { id: 'directory', label: 'Directory', icon: Users },
  { id: 'assets', label: "Employee's Asset", icon: Briefcase },
  { id: 'holidays', label: 'Company Holidays', icon: CalendarDays },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'policies', label: 'Policies', icon: BookOpen },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'applications', label: 'Applications', icon: Briefcase },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'leave', label: 'Leave Requests', icon: CalendarDays },
  { id: 'payslips', label: 'Payslips', icon: Receipt },
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
  // 08-06-2026: custom roles defined in Settings → Roles (admin_roles) must
  // also appear in the Add/Edit Employee "Role / Designation" picker, so a
  // newly-created role is immediately selectable here.
  const [customRoles, setCustomRoles] = useState<AdminRoleRow[]>([])

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
      userId: e.user_id || null,
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

  // Load custom roles once so they're available in the role dropdown. Refreshed
  // whenever the Add/Edit modal opens so roles created in another tab show up.
  useEffect(() => { fetchCustomRoles().then(setCustomRoles).catch(() => {}) }, [])

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [folderPickerOpen, setFolderPickerOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [resetTarget, setResetTarget] = useState<PasswordResetTarget | null>(null)
  const [empForm, setEmpForm] = useState({
    name: '', email: '', phone: '', password: '', department: 'Operations', role: 'cs-agent',
    employeeType: 'full-time' as 'full-time' | 'contract' | 'intern',
    reportingTo: '', joiningDate: '', status: 'active' as EmployeeStatus
  })

  useEffect(() => {
    if (addEmployeeOpen) fetchCustomRoles().then(setCustomRoles).catch(() => {})
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
        email: empForm.email || undefined,
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

  // ── Delete Employee — blocks when assigned to any lead as assignee.
  const handleDeleteEmployee = useCallback(async (emp: any) => {
    const raw = emp?._raw as EmployeeRecord | undefined
    const staffProfileId = raw?.id || emp.id
    const userId = raw?.user_id || ''
    if (!window.confirm(`Delete employee "${emp.name}"? This permanently removes their account.`)) return
    const res = await deleteEmployeeSafe(staffProfileId, userId)
    if (res.ok) {
      showToast(`Employee "${emp.name}" deleted`, 'success')
      if (selectedEmployee?.id === emp.id) setSelectedEmployee(null)
      loadData()
    } else {
      showToast(res.error || 'Failed to delete employee', 'error')
    }
  }, [selectedEmployee, showToast, loadData])

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
        {activeTab === 'directory' && (
          <DirectoryTab
            employees={employees}
            onView={(e) => setSelectedEmployee(e)}
            onDelete={handleDeleteEmployee}
            onResetPassword={(e: any) => {
              if (!e.email) { showToast('Employee has no email on file', 'error'); return }
              setResetTarget({ userId: e.userId || null, email: e.email, name: e.name })
            }}
            showToast={showToast}
          />
        )}
        {activeTab === 'announcements' && <AnnouncementsTab showToast={showToast} />}
        {activeTab === 'policies' && <PoliciesTab showToast={showToast} />}
        {activeTab === 'feedback' && <FeedbackTab showToast={showToast} />}
        {activeTab === 'applications' && <ApplicationsTab showToast={showToast} />}
        {activeTab === 'attendance' && <AttendanceTab />}
        {activeTab === 'leave' && <LeaveTab showToast={showToast} />}
        {activeTab === 'payslips' && <PayslipsTab showToast={showToast} />}
        {activeTab === 'performance' && <PerformanceTab />}
        {/* 2026-05-12: Employee → Asset directory and Company Holidays
            placeholders. The Asset row mirrors the canonical "/admin/assets"
            module but scoped to employee-assigned items; Holidays surfaces
            the calendar fed by HR. Both use the shared placeholder shell
            so the View / Edit / Delete triad is visible. */}
        {activeTab === 'assets' && (
          <AdminCRUDPlaceholder
            title="Employee Assets"
            description="Laptops, phones, peripherals, and access keys assigned to staff."
            icon={Briefcase}
            showToast={showToast}
            hint="Use /admin/assets to manage the full inventory. This view will narrow the canonical list to assets with a non-null `assignedTo`."
          />
        )}
        {activeTab === 'holidays' && (
          <AdminCRUDPlaceholder
            title="Company Holidays"
            description="Public holidays and company-wide off-days for attendance, leave, and payroll calendars."
            icon={CalendarDays}
            showToast={showToast}
            hint="HR can add, edit, or remove holidays from this list. Each row supports View / Edit / Delete; the canonical Supabase table is `company_holidays`."
          />
        )}
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
                {customRoles.filter(r => r.is_active).length > 0 && (
                  <optgroup label="Custom Roles" className="bg-neutral-900">
                    {customRoles.filter(r => r.is_active).map(r => (
                      <option key={r.id} value={r.key} className="bg-neutral-900">{r.name}</option>
                    ))}
                  </optgroup>
                )}
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

      {/* Password Reset Modal — admin chooses email-link or temp-password flow */}
      <PasswordResetModal
        isOpen={!!resetTarget}
        target={resetTarget}
        onClose={() => setResetTarget(null)}
        showToast={showToast}
      />
    </div>
  )
}

// ── Directory Tab ───────────────────────────────────────────────
function DirectoryTab({ employees, onView, onDelete, onResetPassword, showToast }: { employees: any[]; onView: (e: Employee) => void; onDelete: (e: any) => void; onResetPassword: (e: any) => void; showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
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
      width: '130px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onView(row) }} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors" title="View">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onResetPassword(row) }} className="p-1.5 rounded-lg hover:bg-amber-500/10 text-gray-500 hover:text-amber-400 transition-colors" title="Reset password">
            <KeyRound className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(row) }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors" title="Delete employee">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
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
interface AttendanceSummaryRow {
  staffId: string
  name: string
  present: number
  absent: number
  halfDay: number
  wfh: number
  total: number
}

function AttendanceTab() {
  const [rows, setRows] = useState<AttendanceSummaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [monthLabel, setMonthLabel] = useState('')

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) { setLoading(false); return }
      setLoading(true)
      try {
        const sb = supabase as any
        const now = new Date()
        setMonthLabel(now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }))
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

        const { data: attRows } = await sb
          .from('attendance')
          .select('staff_id, status, date')
          .gte('date', start)
          .lte('date', end)

        const ids = Array.from(new Set((attRows || []).map((r: any) => r.staff_id).filter(Boolean)))
        const profilesById: Record<string, string> = {}
        if (ids.length > 0) {
          const { data: profs } = await sb.from('profiles').select('id, full_name').in('id', ids)
          ;(profs || []).forEach((p: any) => { profilesById[p.id] = p.full_name || '' })
        }
        const byStaff = new Map<string, AttendanceSummaryRow>()
        for (const r of (attRows || [])) {
          const id = r.staff_id
          if (!id) continue
          const row = byStaff.get(id) || {
            staffId: id,
            name: profilesById[id] || 'Unnamed staff',
            present: 0, absent: 0, halfDay: 0, wfh: 0, total: 0,
          }
          const s = (r.status || '').toLowerCase()
          if (s === 'present') row.present++
          else if (s === 'absent') row.absent++
          else if (s === 'half-day') row.halfDay++
          else if (s === 'wfh' || s === 'work-from-home') row.wfh++
          else row.absent++
          row.total++
          byStaff.set(id, row)
        }
        setRows(Array.from(byStaff.values()).sort((a, b) => a.name.localeCompare(b.name)))
      } catch { /* silent */ }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <AdminGlass>
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-brand-red" />
        {monthLabel || 'Monthly'} Attendance Summary
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
            {loading ? (
              <tr><td colSpan={6} className="text-center py-6 text-gray-500">Loading attendance…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-gray-500">No attendance records yet this month</td></tr>
            ) : rows.map(row => {
              const pct = row.total > 0 ? Math.round(((row.present + row.wfh) / row.total) * 100) : 0
              return (
                <tr key={row.staffId} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
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
  const [loading, setLoading] = useState(true)

  // Fallback direct-query path — used if the SECURITY DEFINER RPC is
  // missing, throws, or returns zero rows (we've seen admin sessions where
  // the RPC's internal auth.uid() check silently drops results). The
  // "Admins manage leave" RLS on leave_requests still gates access.
  const loadRowsDirect = useCallback(async (): Promise<AdminLeaveRow[]> => {
    try {
      const sb = supabase as any
      const { data: lrRows, error } = await sb
        .from('leave_requests')
        .select('id, staff_id, leave_type, start_date, end_date, reason, status, half_day, created_at, approved_by')
        .order('created_at', { ascending: false })
        .limit(500)
      if (error || !lrRows) return []
      const staffIds = Array.from(new Set((lrRows as any[]).map(r => r.staff_id).filter(Boolean)))
      const staffById: Record<string, { user_id: string | null; staff_code: string | null }> = {}
      if (staffIds.length > 0) {
        const { data: spRows } = await sb
          .from('staff_profiles')
          .select('id, user_id, staff_code')
          .in('id', staffIds)
        ;(spRows || []).forEach((s: any) => { staffById[s.id] = { user_id: s.user_id, staff_code: s.staff_code || null } })
      }
      const userIds = Object.values(staffById).map(s => s.user_id).filter(Boolean) as string[]
      const nameById: Record<string, string> = {}
      if (userIds.length > 0) {
        const { data: profs } = await sb.from('profiles').select('id, full_name').in('id', userIds)
        ;(profs || []).forEach((p: any) => { nameById[p.id] = p.full_name || '' })
      }
      return (lrRows as any[]).map((r: any): AdminLeaveRow => ({
        id: r.id,
        staff_id: r.staff_id,
        staff_name: staffById[r.staff_id]?.user_id ? (nameById[staffById[r.staff_id]!.user_id!] || null) : null,
        staff_code: staffById[r.staff_id]?.staff_code || null,
        leave_type: r.leave_type,
        start_date: r.start_date,
        end_date: r.end_date,
        reason: r.reason,
        status: r.status,
        half_day: r.half_day,
        created_at: r.created_at,
      }))
    } catch {
      return []
    }
  }, [])

  const loadRows = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    setLoading(true)
    try {
      const sb = supabase as any
      const { data, error } = await sb.rpc('list_leave_requests_for_admin')
      if (!error && Array.isArray(data) && data.length > 0) {
        setRows(data as AdminLeaveRow[])
      } else {
        if (error) console.warn('[leave] RPC failed, using direct query:', error.message)
        const fallback = await loadRowsDirect()
        setRows(fallback)
      }
    } catch (err) {
      console.warn('[leave] RPC threw, using direct query:', err)
      const fallback = await loadRowsDirect()
      setRows(fallback)
    } finally {
      setLoading(false)
    }
  }, [loadRowsDirect])

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
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading leave requests…</div>
      ) : (
        <AdminDataTable<LeaveRequest & { _id: string }>
          columns={columns}
          data={tableRows}
          searchKeys={['employeeName', 'type', 'reason']}
          searchPlaceholder="Search leave requests..."
          title="Leave Requests"
          emptyMessage="No leave requests yet"
        />
      )}
    </AdminGlass>
  )
}

// ── Performance Tab ─────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════
//  Payslips Tab — admin uploads salary payslips per staff member.
//  Storage: file lives in the staff-documents bucket (private, signed
//  URL on download). Metadata + earnings breakdown is persisted in the
//  payslips table; staff portal's PayslipsView picks it up via RLS
//  (staff_id IN (SELECT id FROM staff_profiles WHERE user_id = auth.uid())).
// ════════════════════════════════════════════════════════════════════
function PayslipsTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [staff, setStaff] = useState<{ id: string; name: string; email: string }[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    staff_id: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    basic: '',
    allowances: '',
    deductions: '',
    net_pay: '',
    file_url: '',
    file_name: '',
  })

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured()) { setLoading(false); return }
    setLoading(true)
    const sb = supabase as any
    // staff_profiles.user_id FKs to auth.users(id), not public.profiles(id)
    // — PostgREST can't auto-embed across that relationship, so we issue
    // two queries and join in JS.
    const [{ data: staffRows }, { data: payslipRows }] = await Promise.all([
      sb.from('staff_profiles')
        .select('id, user_id, designation, department, status')
        .eq('status', 'active'),
      sb.from('payslips')
        .select('id, staff_id, month, basic, allowances, deductions, net_pay, file_url, status, created_at')
        .order('month', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200),
    ])
    const userIds = (staffRows as any[] || []).map((s: any) => s.user_id).filter(Boolean)
    let profileMap = new Map<string, { full_name: string; email: string }>()
    if (userIds.length > 0) {
      const { data: profileRows } = await sb.from('profiles')
        .select('id, full_name, email')
        .in('id', userIds)
      for (const p of (profileRows as any[]) || []) {
        profileMap.set(p.id, { full_name: p.full_name || '', email: p.email || '' })
      }
    }
    setStaff((staffRows as any[] || []).map((s: any) => {
      const prof = profileMap.get(s.user_id) || { full_name: '', email: '' }
      const name = prof.full_name || prof.email || s.designation || 'Staff'
      return { id: s.id, name, email: prof.email }
    }).sort((a, b) => a.name.localeCompare(b.name)))
    setRows((payslipRows as any[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  const staffNameById = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>()
    for (const s of staff) map.set(s.id, { name: s.name, email: s.email })
    return map
  }, [staff])

  const fmtMonth = (m: string) => {
    if (!m) return '—'
    try { return new Date(m).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) } catch { return m }
  }
  const fmtINR = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN')}`

  const handlePickFile = async () => {
    try {
      const { pickAndUploadFiles } = await import('@/lib/supabase/storageService')
      const results = await pickAndUploadFiles('staff-documents', {
        accept: '.pdf,.png,.jpg,.jpeg',
        multiple: false,
        portal: 'admin',
        entityType: 'staff',
        entityId: form.staff_id || undefined,
        category: 'payslip',
      })
      if (results?.[0]?.success && results[0].file) {
        setForm(p => ({ ...p, file_url: results[0].file!.url || '', file_name: results[0].file!.name || '' }))
        showToast('Payslip file uploaded', 'success')
      } else {
        showToast(`Upload failed${results?.[0]?.error ? ': ' + results[0].error : ''}`, 'error')
      }
    } catch (e: any) {
      showToast(`Upload failed: ${e?.message || 'unknown'}`, 'error')
    }
  }

  const handleSave = async () => {
    if (!form.staff_id) { showToast('Select an employee', 'error'); return }
    if (!form.month) { showToast('Select a month', 'error'); return }
    if (!form.file_url && !form.basic && !form.net_pay) {
      showToast('Upload a file or enter at least basic / net pay', 'error'); return
    }
    setSaving(true)
    try {
      const sb = supabase as any
      // The month column is a date — store as the first day of the month.
      const monthDate = `${form.month}-01`
      const basic = Number(form.basic || 0)
      const allowances = Number(form.allowances || 0)
      const deductions = Number(form.deductions || 0)
      const netInferred = Math.max(0, basic + allowances - deductions)
      const netPay = form.net_pay !== '' ? Number(form.net_pay) : netInferred
      const { error } = await sb.from('payslips').insert({
        staff_id: form.staff_id,
        month: monthDate,
        basic,
        allowances,
        deductions,
        net_pay: netPay,
        file_url: form.file_url || null,
        status: 'paid',
      })
      if (error) throw error
      showToast('Payslip published successfully', 'success')
      setUploadOpen(false)
      setForm({ staff_id: '', month: new Date().toISOString().slice(0, 7), basic: '', allowances: '', deductions: '', net_pay: '', file_url: '', file_name: '' })
      reload()
    } catch (err: any) {
      showToast(`Failed to publish: ${err?.message || 'unknown'}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: any) => {
    if (!confirm(`Delete the ${fmtMonth(row.month)} payslip for ${staffNameById.get(row.staff_id)?.name || 'this staff member'}?`)) return
    const sb = supabase as any
    const { error } = await sb.from('payslips').delete().eq('id', row.id)
    if (error) { showToast(`Delete failed: ${error.message}`, 'error'); return }
    showToast('Payslip deleted', 'success')
    reload()
  }

  return (
    <AdminGlass>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Payslips</h3>
          <span className="text-[11px] text-gray-500">{rows.length} on file</span>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-500/80 hover:bg-emerald-500 transition-colors flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" /> Upload Payslip
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-gray-500 text-center py-6">Loading payslips…</p>
      ) : rows.length === 0 ? (
        <AdminEmptyState
          icon={Receipt}
          title="No payslips published yet"
          description="Use Upload Payslip to publish a salary payslip to a staff member's portal."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-white/[0.06]">
                <th className="text-left py-2 px-3 font-medium">Employee</th>
                <th className="text-left py-2 px-3 font-medium">Month</th>
                <th className="text-right py-2 px-3 font-medium">Basic</th>
                <th className="text-right py-2 px-3 font-medium">Allowances</th>
                <th className="text-right py-2 px-3 font-medium">Deductions</th>
                <th className="text-right py-2 px-3 font-medium">Net Pay</th>
                <th className="text-left py-2 px-3 font-medium">File</th>
                <th className="text-right py-2 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const emp = staffNameById.get(r.staff_id)
                return (
                  <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-2 px-3 text-white">{emp?.name || '—'}<br /><span className="text-[10px] text-gray-500">{emp?.email || ''}</span></td>
                    <td className="py-2 px-3 text-gray-300">{fmtMonth(r.month)}</td>
                    <td className="py-2 px-3 text-right text-gray-300">{fmtINR(r.basic)}</td>
                    <td className="py-2 px-3 text-right text-gray-300">{fmtINR(r.allowances)}</td>
                    <td className="py-2 px-3 text-right text-red-300">{fmtINR(r.deductions)}</td>
                    <td className="py-2 px-3 text-right font-semibold text-emerald-400">{fmtINR(r.net_pay)}</td>
                    <td className="py-2 px-3">
                      {r.file_url ? (
                        <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-400 hover:underline">
                          <Eye className="w-3 h-3" /> View
                        </a>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button onClick={() => handleDelete(r)} className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-white/[0.06] transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Payslip"
        subtitle="File is stored in the staff-documents bucket; the staff member sees it under My Profile › Payslips"
        maxWidth="max-w-xl"
        footer={
          <>
            <ModalButton onClick={() => setUploadOpen(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Publishing…' : 'Publish Payslip'}
            </ModalButton>
          </>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Employee *</label>
            <select value={form.staff_id} onChange={e => setForm(p => ({ ...p, staff_id: e.target.value }))}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/40">
              <option value="">— Select employee —</option>
              {staff.map(s => (
                <option key={s.id} value={s.id} className="bg-neutral-900">{s.name} ({s.email})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Month *</label>
              <input type="month" value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/40" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Net Pay (₹)</label>
              <input type="number" inputMode="decimal" min="0" step="1" value={form.net_pay} onChange={e => setForm(p => ({ ...p, net_pay: e.target.value }))} placeholder="Auto-computed if blank"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/40 placeholder-gray-600" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Basic (₹)</label>
              <input type="number" inputMode="decimal" min="0" step="1" value={form.basic} onChange={e => setForm(p => ({ ...p, basic: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/40" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Allowances (₹)</label>
              <input type="number" inputMode="decimal" min="0" step="1" value={form.allowances} onChange={e => setForm(p => ({ ...p, allowances: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/40" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Deductions (₹)</label>
              <input type="number" inputMode="decimal" min="0" step="1" value={form.deductions} onChange={e => setForm(p => ({ ...p, deductions: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/40" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Payslip File (PDF / image)</label>
            <button onClick={handlePickFile} type="button"
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs border border-dashed transition-colors border-white/[0.12] bg-white/[0.04] text-gray-400 hover:border-white/[0.2] hover:bg-white/[0.06]">
              <Upload className="w-4 h-4" />
              {form.file_url ? `Uploaded: ${form.file_name || 'payslip'}` : 'Choose payslip file'}
            </button>
            <p className="text-[10px] text-gray-600 mt-1">Optional — you can publish a numeric breakdown without a file, or attach a PDF / image of the payslip.</p>
          </div>
        </div>
      </AdminModal>
    </AdminGlass>
  )
}

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

// ── Announcements Tab ──────────────────────────────────────────
const ANNOUNCEMENT_TYPE_OPTIONS: { value: AnnouncementType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'policy-update', label: 'Policy Update' },
  { value: 'process-change', label: 'Process Change' },
  { value: 'event', label: 'Event' },
  { value: 'achievement', label: 'Achievement' },
]

function AnnouncementsTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [list, setList] = useState<AdminAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<AdminAnnouncement | null>(null)
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'general' as AnnouncementType,
    department: '',
    pinned: false,
    active: true,
  })

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchAllAnnouncements()
    setList(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (editing && open) {
      setForm({
        title: editing.title,
        content: editing.content,
        type: editing.type,
        department: editing.department || '',
        pinned: editing.pinned,
        active: editing.active,
      })
    } else if (!editing && open) {
      setForm({ title: '', content: '', type: 'general', department: '', pinned: false, active: true })
    }
  }, [editing, open])

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      showToast('Title and content are required', 'error')
      return
    }
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      type: form.type,
      department: form.department.trim() || null,
      pinned: form.pinned,
      active: form.active,
    }
    const result = editing
      ? await updateAnnouncement(editing.id, payload)
      : await createAnnouncement(payload)
    setSaving(false)
    if (result.success) {
      showToast(editing ? 'Announcement updated' : 'Announcement posted', 'success')
      setOpen(false)
      setEditing(null)
      load()
    } else {
      showToast(result.error || 'Save failed', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement? This cannot be undone.')) return
    const result = await deleteAnnouncement(id)
    if (result.success) {
      showToast('Announcement deleted', 'success')
      load()
    } else {
      showToast(result.error || 'Delete failed', 'error')
    }
  }

  const handleTogglePin = async (a: AdminAnnouncement) => {
    const result = await updateAnnouncement(a.id, { pinned: !a.pinned })
    if (result.success) load()
    else showToast(result.error || 'Pin toggle failed', 'error')
  }

  const handleToggleActive = async (a: AdminAnnouncement) => {
    const result = await updateAnnouncement(a.id, { active: !a.active })
    if (result.success) {
      showToast(a.active ? 'Hidden from staff' : 'Now visible to staff', 'success')
      load()
    } else {
      showToast(result.error || 'Toggle failed', 'error')
    }
  }

  const typeVariant = (t: AnnouncementType): 'error' | 'warning' | 'info' | 'success' | 'purple' | 'neutral' => {
    switch (t) {
      case 'policy-update': return 'error'
      case 'process-change': return 'warning'
      case 'event': return 'info'
      case 'achievement': return 'success'
      default: return 'neutral'
    }
  }

  const typeLabel = (t: AnnouncementType) => ANNOUNCEMENT_TYPE_OPTIONS.find(o => o.value === t)?.label || t

  return (
    <AdminGlass padding="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-brand-red" />
          <h3 className="text-sm font-semibold text-white">Staff Announcements</h3>
          <span className="text-[11px] text-gray-500">({list.length})</span>
        </div>
        <button
          onClick={() => { setEditing(null); setOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading announcements…</div>
      ) : list.length === 0 ? (
        <AdminEmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Post company updates, policy changes, or achievements for the staff portal."
        />
      ) : (
        <div className="space-y-3">
          {list.map(a => (
            <div key={a.id} className={`p-4 rounded-xl border transition-colors ${a.active ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white/[0.01] border-white/[0.03] opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <AdminBadge label={typeLabel(a.type)} variant={typeVariant(a.type)} size="sm" />
                    {a.pinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    {!a.active && <AdminBadge label="Hidden" variant="neutral" size="sm" />}
                    {a.department && <span className="text-[10px] text-gray-500">{a.department}</span>}
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{a.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2 line-clamp-3">{a.content}</p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-600">
                    <span>{a.posted_by_name || 'GHL Admin'}</span>
                    <span>·</span>
                    <span>{formatDate(a.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleTogglePin(a)}
                    title={a.pinned ? 'Unpin' : 'Pin to top'}
                    className={`p-1.5 rounded-lg transition-colors ${a.pinned ? 'text-amber-400 bg-amber-500/10' : 'text-gray-500 hover:text-amber-400 hover:bg-white/[0.06]'}`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(a)}
                    title={a.active ? 'Hide from staff' : 'Show to staff'}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    {a.active ? <Eye className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setEditing(a); setOpen(true) }}
                    title="Edit"
                    className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal
        isOpen={open}
        onClose={() => { setOpen(false); setEditing(null) }}
        title={editing ? 'Edit Announcement' : 'New Announcement'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. New SEBI compliance guidelines"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Content</label>
              <textarea
                required
                rows={5}
                value={form.content}
                onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Full announcement body. Staff portal will show a preview."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 resize-y"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm(f => ({ ...f, type: e.target.value as AnnouncementType }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
                >
                  {ANNOUNCEMENT_TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value} className="bg-neutral-900">{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Department (optional)</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="All departments if empty"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => setForm(f => ({ ...f, pinned: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.04] text-brand-red focus:ring-brand-red/40"
                />
                Pin to top
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.04] text-brand-red focus:ring-brand-red/40"
                />
                Visible to staff
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
            <button type="button" onClick={() => { setOpen(false); setEditing(null) }} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-brand-red hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Saving…' : editing ? 'Update' : 'Post Announcement'}
            </button>
          </div>
        </form>
      </AdminModal>
    </AdminGlass>
  )
}

// ── Policies Tab ──────────────────────────────────────────────
const POLICY_ICON_CHOICES = ['FileText', 'Calendar', 'ShieldCheck', 'Lightbulb', 'Heart']

function PoliciesTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [list, setList] = useState<StaffPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<StaffPolicy | null>(null)
  const [form, setForm] = useState<PolicyInput>({
    title: '',
    description: '',
    body: '',
    version: '',
    category: '',
    icon: 'FileText',
    bucket: 'ghl-documents',
    file_path: '',
    external_url: '',
    last_updated: '',
    active: true,
    sort_order: 0,
  })

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchAllPolicies()
    setList(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (editing && open) {
      setForm({
        title: editing.title,
        description: editing.description || '',
        body: editing.body || '',
        version: editing.version || '',
        category: editing.category || '',
        icon: editing.icon || 'FileText',
        bucket: editing.bucket || 'ghl-documents',
        file_path: editing.file_path || '',
        external_url: editing.external_url || '',
        last_updated: editing.last_updated || '',
        active: editing.active,
        sort_order: editing.sort_order,
      })
    } else if (!editing && open) {
      setForm({ title: '', description: '', body: '', version: '', category: '', icon: 'FileText', bucket: 'ghl-documents', file_path: '', external_url: '', last_updated: '', active: true, sort_order: (list[list.length - 1]?.sort_order ?? 0) + 1 })
    }
  }, [editing, open, list])

  const handleSubmit = async () => {
    if (!form.title?.trim()) { showToast('Title is required', 'error'); return }
    setSaving(true)
    const payload: PolicyInput = {
      ...form,
      title: form.title.trim(),
      description: (form.description || '').trim(),
      body: (form.body || '').trim() || null,
      version: (form.version || '').trim(),
      category: (form.category || '').trim(),
      icon: form.icon || 'FileText',
      bucket: (form.bucket || '').trim() || null,
      file_path: (form.file_path || '').trim() || null,
      external_url: (form.external_url || '').trim() || null,
      last_updated: form.last_updated || null,
    }
    const result = editing
      ? await updatePolicy(editing.id, payload)
      : await createPolicy(payload)
    setSaving(false)
    if (result.success) {
      showToast(editing ? 'Policy updated' : 'Policy created', 'success')
      setOpen(false)
      setEditing(null)
      load()
    } else {
      showToast(result.error || 'Save failed', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this policy? Staff will immediately lose access.')) return
    const result = await deletePolicy(id)
    if (result.success) { showToast('Policy deleted', 'success'); load() }
    else showToast(result.error || 'Delete failed', 'error')
  }

  const handleToggleActive = async (p: StaffPolicy) => {
    const result = await updatePolicy(p.id, { active: !p.active })
    if (result.success) load()
    else showToast(result.error || 'Toggle failed', 'error')
  }

  return (
    <AdminGlass padding="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-red" />
          <h3 className="text-sm font-semibold text-white">Company Policies</h3>
          <span className="text-[11px] text-gray-500">({list.length})</span>
        </div>
        <button
          onClick={() => { setEditing(null); setOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Policy
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading policies…</div>
      ) : list.length === 0 ? (
        <AdminEmptyState icon={BookOpen} title="No policies yet" description="Publish HR, compliance, and operational policies for staff to access." />
      ) : (
        <div className="space-y-2">
          {list.map(p => (
            <div key={p.id} className={`p-4 rounded-xl border transition-colors ${p.active ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white/[0.01] border-white/[0.03] opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-sm font-semibold text-white">{p.title}</h4>
                    {p.version && <span className="text-[10px] text-gray-500">{p.version}</span>}
                    {!p.active && <AdminBadge label="Hidden" variant="neutral" size="sm" />}
                    {p.category && <AdminBadge label={p.category} variant="info" size="sm" />}
                  </div>
                  {p.description && <p className="text-xs text-gray-400 mb-1.5 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center gap-3 text-[10px] text-gray-600 flex-wrap">
                    {p.last_updated && <span>Last updated: {p.last_updated}</span>}
                    {p.external_url && <span className="text-blue-400 truncate max-w-[240px]">{p.external_url}</span>}
                    {p.bucket && p.file_path && <span className="text-teal-400 truncate max-w-[240px]">{p.bucket}/{p.file_path}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggleActive(p)} title={p.active ? 'Hide from staff' : 'Show to staff'} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06]">
                    {p.active ? <Eye className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { setEditing(p); setOpen(true) }} title="Edit" className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06]">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} title="Delete" className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal
        isOpen={open}
        onClose={() => { setOpen(false); setEditing(null) }}
        title={editing ? 'Edit Policy' : 'New Policy'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Title</label>
              <input type="text" required value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Leave Policy" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Short description</label>
              <textarea rows={2} value={form.description || ''} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 resize-y" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Policy body (staff reads this inline)</label>
              <textarea
                rows={10}
                value={form.body || ''}
                onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder={'## Purpose\nWhat this policy covers...\n\n## Rules\n- Rule one\n- Rule two\n\nSupports **bold**, _italic_, headings (##), and bullet lists.'}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 resize-y"
              />
              <p className="text-[10px] text-gray-600 mt-1">Use an external URL or storage file if you'd rather link a PDF. Body is the fallback when neither is set.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Version</label>
              <input type="text" value={form.version || ''} onChange={(e) => setForm(f => ({ ...f, version: e.target.value }))} placeholder="v1.0" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
              <input type="text" value={form.category || ''} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} placeholder="HR / Compliance / Security" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Icon</label>
              <select value={form.icon || 'FileText'} onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40">
                {POLICY_ICON_CHOICES.map(ic => <option key={ic} value={ic} className="bg-neutral-900">{ic}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Last updated</label>
              <input type="date" value={form.last_updated || ''} onChange={(e) => setForm(f => ({ ...f, last_updated: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Storage bucket</label>
              <input type="text" value={form.bucket || ''} onChange={(e) => setForm(f => ({ ...f, bucket: e.target.value }))} placeholder="ghl-documents" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Storage file path</label>
              <input type="text" value={form.file_path || ''} onChange={(e) => setForm(f => ({ ...f, file_path: e.target.value }))} placeholder="policies/leave-policy.pdf" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">External URL (optional, overrides storage)</label>
              <input type="url" value={form.external_url || ''} onChange={(e) => setForm(f => ({ ...f, external_url: e.target.value }))} placeholder="https://..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Display order</label>
              <input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer mt-5">
              <input type="checkbox" checked={form.active !== false} onChange={(e) => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 rounded border-white/20 bg-white/[0.04] text-brand-red focus:ring-brand-red/40" />
              Visible to staff
            </label>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
            <button type="button" onClick={() => { setOpen(false); setEditing(null) }} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-brand-red hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Saving…' : editing ? 'Update Policy' : 'Create Policy'}
            </button>
          </div>
        </form>
      </AdminModal>
    </AdminGlass>
  )
}

// ── Feedback Tab (staff submissions) ──────────────────────────
interface AdminFeedbackRow {
  id: string
  staff_id: string | null
  staff_name?: string
  category: string
  subject: string
  description: string
  is_anonymous: boolean
  status: string
  admin_response: string | null
  created_at: string
  updated_at: string
}

function FeedbackTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [rows, setRows] = useState<AdminFeedbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AdminFeedbackRow | null>(null)
  const [responseDraft, setResponseDraft] = useState('')
  const [statusDraft, setStatusDraft] = useState('submitted')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) { setRows([]); setLoading(false); return }
    setLoading(true)
    try {
      const sb = supabase as any
      const { data, error } = await sb
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
      if (error || !data) { setRows([]); setLoading(false); return }
      const staffIds = Array.from(new Set((data as any[]).map(r => r.staff_id).filter(Boolean)))
      const nameMap: Record<string, string> = {}
      if (staffIds.length > 0) {
        const { data: profs } = await sb.from('profiles').select('id, full_name').in('id', staffIds)
        ;(profs || []).forEach((p: any) => { nameMap[p.id] = p.full_name || '' })
      }
      setRows((data as any[]).map((r: any) => ({
        ...r,
        staff_name: r.is_anonymous ? 'Anonymous' : (nameMap[r.staff_id] || 'Staff Member'),
      })))
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (selected) {
      setResponseDraft(selected.admin_response || '')
      setStatusDraft(selected.status || 'submitted')
    }
  }, [selected])

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const sb = supabase as any
      const { error } = await sb
        .from('feedback')
        .update({
          admin_response: responseDraft || null,
          status: statusDraft,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selected.id)
      if (error) { showToast(error.message, 'error'); setSaving(false); return }
      showToast('Feedback updated', 'success')
      setSelected(null)
      load()
    } catch (err: any) {
      showToast(err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const kpis = useMemo(() => {
    const total = rows.length
    const submitted = rows.filter(r => r.status === 'submitted').length
    const ack = rows.filter(r => r.status === 'acknowledged').length
    const resolved = rows.filter(r => r.status === 'resolved').length
    return { total, submitted, ack, resolved }
  }, [rows])

  const statusVariant = (s: string): 'success' | 'warning' | 'info' | 'neutral' => {
    if (s === 'resolved') return 'success'
    if (s === 'acknowledged') return 'warning'
    if (s === 'submitted') return 'info'
    return 'neutral'
  }

  const columns: Column<AdminFeedbackRow>[] = [
    {
      key: 'subject',
      label: 'Feedback',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.subject}</p>
          <p className="text-[11px] text-gray-500 truncate max-w-[320px]">{row.description}</p>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (row) => <AdminBadge label={row.category} variant="info" size="sm" /> },
    { key: 'staff_name', label: 'From', render: (row) => <span className="text-xs text-gray-300">{row.staff_name}</span> },
    { key: 'status', label: 'Status', render: (row) => <AdminBadge label={row.status} variant={statusVariant(row.status)} dot /> },
    { key: 'created_at', label: 'Submitted', render: (row) => <span className="text-xs text-gray-400">{formatDate(row.created_at)}</span> },
    {
      key: 'actions',
      label: '',
      sortable: false,
      width: '80px',
      render: (row) => (
        <button onClick={(e) => { e.stopPropagation(); setSelected(row) }} className="text-xs text-brand-red hover:underline font-medium inline-flex items-center gap-1">
          <Eye className="w-3 h-3" /> View
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Total Feedback" value={kpis.total} icon={MessageSquare} color="#3B82F6" delay={0} />
        <AdminKPICard title="New" value={kpis.submitted} icon={Clock} color="#F59E0B" delay={50} />
        <AdminKPICard title="Acknowledged" value={kpis.ack} icon={AlertTriangle} color="#8B5CF6" delay={100} />
        <AdminKPICard title="Resolved" value={kpis.resolved} icon={CheckCircle2} color="#10B981" delay={150} />
      </div>

      <AdminGlass padding="p-4">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading feedback…</div>
        ) : (
          <AdminDataTable<AdminFeedbackRow>
            columns={columns}
            data={rows}
            searchKeys={['subject', 'description', 'category', 'staff_name']}
            searchPlaceholder="Search feedback..."
            onRowClick={(row) => setSelected(row)}
            emptyMessage="No staff feedback submitted yet"
            title="Staff Feedback"
          />
        )}
      </AdminGlass>

      {selected && (
        <AdminModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.subject}
          subtitle={`${selected.category} • ${selected.staff_name} • ${formatDate(selected.created_at)}`}
          maxWidth="max-w-2xl"
          footer={
            <>
              <ModalButton onClick={() => setSelected(null)}>Close</ModalButton>
              <ModalButton variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</ModalButton>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-200 whitespace-pre-wrap">{selected.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
                <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40">
                  <option value="submitted" className="bg-neutral-900">Submitted</option>
                  <option value="acknowledged" className="bg-neutral-900">Acknowledged</option>
                  <option value="resolved" className="bg-neutral-900">Resolved</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-5">
                <AdminBadge label={selected.is_anonymous ? 'Anonymous' : 'Attributed'} variant={selected.is_anonymous ? 'warning' : 'info'} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Admin response (visible to staff)</label>
              <textarea rows={4} value={responseDraft} onChange={(e) => setResponseDraft(e.target.value)} placeholder="Your response will appear on the staff's feedback list." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 resize-y" />
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  )
}
