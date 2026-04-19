'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminGlass from '@/components/admin/shared/AdminGlass'
import AdminBadge from '@/components/admin/shared/AdminBadge'
import {
  User, Clock, Calendar, FileText, GraduationCap, Target, Receipt,
  AlertTriangle, LogOut, Download, Upload, ChevronRight, Phone, Mail,
  MapPin, Shield, Award, BookOpen, TrendingUp, IndianRupee, Folder,
  CheckCircle2, XCircle, Timer, Coffee, Star, Send, Plus, Eye,
  Briefcase, Heart, BarChart3, MessageSquare, Play, FileCheck, Edit3, Save, X,
} from 'lucide-react'
import { saveBlobAs, pickAndUploadFiles } from '@/lib/supabase/storageService'
import { insertRow } from '@/lib/supabase/adminDataService'
import { recordAttendance } from '@/lib/supabase/staffDataService'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import AdminModal from '@/components/admin/shared/AdminModal'

// ── Props ──────────────────────────────────────────────────────
interface SelfServiceModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  userId?: string
  userName?: string
  userEmail?: string
  userPhone?: string
  userRole?: string
  userDepartment?: string
  userDesignation?: string
  userStaffCode?: string
  userJoinDate?: string
  userStatus?: string
}

// ── Main Component ─────────────────────────────────────────────
export default function SelfServiceModule({ subTab, navigate, showToast, ...userProps }: SelfServiceModuleProps) {
  const tab = subTab || 'profile'

  switch (tab) {
    case 'profile':     return <ProfileOverview showToast={showToast} {...userProps} />
    case 'attendance':  return <AttendanceView showToast={showToast} />
    case 'leave':       return <LeaveView showToast={showToast} />
    case 'payslips':    return <PayslipsView showToast={showToast} />
    case 'documents':   return <DocumentsView showToast={showToast} />
    case 'training':    return <TrainingView showToast={showToast} />
    case 'performance': return <PerformanceView showToast={showToast} />
    case 'expenses':    return <ExpensesView showToast={showToast} />
    case 'grievance':   return <PlaceholderView title="Grievance Portal" icon={AlertTriangle} description="File and track workplace grievances confidentially. This module is under development." />
    case 'exit':        return <PlaceholderView title="Exit Management" icon={LogOut} description="Resignation, clearance, and full-and-final settlement tracking. This module is under development." />
    default:            return <ProfileOverview showToast={showToast} {...userProps} />
  }
}

// ── Helper: Section Header ─────────────────────────────────────
function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-teal-400" />
      <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
    </div>
  )
}

// ================================================================
//  1. PROFILE OVERVIEW (with Edit Profile)
// ================================================================
interface ProfileProps {
  showToast: SelfServiceModuleProps['showToast']
  userId?: string
  userName?: string
  userEmail?: string
  userPhone?: string
  userRole?: string
  userDepartment?: string
  userDesignation?: string
  userStaffCode?: string
  userJoinDate?: string
  userStatus?: string
}

function ProfileOverview({ showToast, userId, userName, userEmail, userPhone, userRole, userDepartment, userDesignation, userStaffCode, userJoinDate, userStatus }: ProfileProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  // Persisted values (reflect what's currently in DB)
  const [profile, setProfile] = useState({
    full_name: userName || '',
    phone: userPhone || '',
    city: '',
    address: '',
    emergency_contact: '',
    blood_group: '',
    gender: '',
    dob: '',
  })
  // Editable form state — synced from `profile` when entering edit mode
  const [form, setForm] = useState(profile)

  // Load the current profile row once on mount so personal fields populate
  useEffect(() => {
    async function load() {
      if (!userId || !isSupabaseConfigured()) return
      try {
        const sb = supabase as any
        const { data, error } = await sb
          .from('profiles')
          .select('full_name, phone, city, metadata')
          .eq('id', userId)
          .maybeSingle()
        if (error || !data) return
        const meta = (data.metadata && typeof data.metadata === 'object') ? data.metadata : {}
        const loaded = {
          full_name: data.full_name || userName || '',
          phone: data.phone || userPhone || '',
          city: data.city || '',
          address: meta.address || '',
          emergency_contact: meta.emergency_contact || '',
          blood_group: meta.blood_group || '',
          gender: meta.gender || '',
          dob: meta.dob || '',
        }
        setProfile(loaded)
        setForm(loaded)
      } catch { /* silent */ }
    }
    load()
  }, [userId, userName, userPhone])

  const initials = (profile.full_name || userName || '?').split(' ').map(n => n[0]).join('').toUpperCase()
  const statusLabel = (userStatus || 'active').replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())
  const statusVariant = userStatus === 'active' ? 'success' as const : 'warning' as const

  const handleEditToggle = () => {
    if (!editing) setForm(profile)
    setEditing(!editing)
  }

  const handleSave = async () => {
    if (!userId || !isSupabaseConfigured()) {
      showToast('Unable to save — not connected', 'error')
      return
    }
    setSaving(true)
    try {
      const sb = supabase as any
      // Columns that live directly on profiles
      const profileUpdates: Record<string, any> = {}
      if (form.full_name !== profile.full_name) profileUpdates.full_name = form.full_name
      if (form.phone !== profile.phone) profileUpdates.phone = form.phone
      if (form.city !== profile.city) profileUpdates.city = form.city

      // Extended fields go in profiles.metadata (preserve existing keys)
      const { data: existing } = await sb.from('profiles').select('metadata').eq('id', userId).maybeSingle()
      const baseMeta = (existing?.metadata && typeof existing.metadata === 'object') ? existing.metadata : {}
      const extMeta: Record<string, any> = { ...baseMeta }
      ;(['address', 'emergency_contact', 'blood_group', 'gender', 'dob'] as const).forEach(k => {
        if (form[k] !== profile[k]) extMeta[k] = form[k] || null
      })
      if (JSON.stringify(extMeta) !== JSON.stringify(baseMeta)) profileUpdates.metadata = extMeta

      if (Object.keys(profileUpdates).length === 0) {
        showToast('No changes to save', 'info')
        setEditing(false)
        return
      }

      const { error } = await sb.from('profiles').update(profileUpdates).eq('id', userId)
      if (error) throw error

      setProfile(form)
      showToast('Profile updated successfully!', 'success')
      setEditing(false)
    } catch (err: any) {
      showToast(`Save failed: ${err?.message || 'Unknown error'}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const personalFields = [
    { label: 'Phone', value: profile.phone || '—', key: 'phone', editable: true },
    { label: 'Email', value: userEmail || '—', key: 'email', editable: false },
    { label: 'City', value: profile.city || '—', key: 'city', editable: true },
    { label: 'Date of Birth', value: profile.dob || '—', key: 'dob', editable: true },
    { label: 'Gender', value: profile.gender || '—', key: 'gender', editable: true },
    { label: 'Blood Group', value: profile.blood_group || '—', key: 'blood_group', editable: true },
    { label: 'Address', value: profile.address || '—', key: 'address', editable: true },
    { label: 'Emergency Contact', value: profile.emergency_contact || '—', key: 'emergency_contact', editable: true },
  ]

  const professionalFields = [
    { label: 'Employee Code', value: userStaffCode || '—' },
    { label: 'Department', value: userDepartment || '—' },
    { label: 'Designation', value: (userDesignation || '—').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
    { label: 'Role', value: (userRole || '—').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
    { label: 'Joined', value: userJoinDate ? new Date(userJoinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
  ]

  return (
    <div className="space-y-5">
      {/* Profile Header */}
      <AdminGlass>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/30 to-blue-500/30 border-2 border-teal-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-teal-300">{initials}</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            {editing ? (
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                className="text-xl font-bold text-white bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-1.5 w-full max-w-xs focus:outline-none focus:border-teal-500/50"
              />
            ) : (
              <h2 className="text-xl font-bold text-white">{profile.full_name || userName || '—'}</h2>
            )}
            <p className="text-sm text-gray-400 mt-0.5">{userStaffCode || '—'} &middot; {(userDesignation || '—').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
            <div className="mt-2 flex items-center gap-3 justify-center sm:justify-start">
              <AdminBadge label={statusLabel} variant={statusVariant} dot size="md" />
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-500/20 border border-teal-500/30 hover:bg-teal-500/30 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleEditToggle}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-teal-300 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </AdminGlass>

      {/* Personal Info */}
      <AdminGlass>
        <SectionHeader title="Personal Information" icon={User} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {personalFields.map(f => (
            <div key={f.label} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{f.label}</p>
              {editing && f.editable ? (
                <input
                  type={f.key === 'dob' ? 'date' : 'text'}
                  value={(form as any)[f.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.label}
                  className="w-full text-sm text-white mt-0.5 bg-white/[0.06] border border-white/[0.1] rounded-lg px-2 py-1 focus:outline-none focus:border-teal-500/50"
                />
              ) : (
                <p className="text-sm text-white mt-0.5">{f.value}</p>
              )}
            </div>
          ))}
        </div>
      </AdminGlass>

      {/* Professional Info (read-only) */}
      <AdminGlass>
        <SectionHeader title="Professional Details" icon={Briefcase} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {professionalFields.map(f => (
            <div key={f.label} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{f.label}</p>
              <p className="text-sm text-white mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>
        {editing && (
          <p className="text-[10px] text-gray-600 mt-3 italic">Professional details can only be updated by HR or your manager.</p>
        )}
      </AdminGlass>

      {/* Quick Actions */}
      <AdminGlass>
        <SectionHeader title="Quick Actions" icon={Shield} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => setEmailModalOpen(true)} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors text-left">
            <Mail className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs font-medium text-white">Change Email</p>
              <p className="text-[10px] text-gray-500">Update login email</p>
            </div>
          </button>
          <button onClick={() => setPasswordModalOpen(true)} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors text-left">
            <Shield className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-xs font-medium text-white">Change Password</p>
              <p className="text-[10px] text-gray-500">Update your password</p>
            </div>
          </button>
          <button onClick={async () => {
            const cardContent = `
╔══════════════════════════════════════╗
║     GHL INDIA VENTURES PVT. LTD.    ║
║          EMPLOYEE ID CARD            ║
╠══════════════════════════════════════╣
║                                      ║
║  Name:        ${userName || '—'}
║  Code:        ${userStaffCode || '—'}
║  Designation: ${(userDesignation || '—').replace(/-/g, ' ').replace(/\\b\\w/g, (c: string) => c.toUpperCase())}
║  Department:  ${userDepartment || '—'}
║  Email:       ${userEmail || '—'}
║  Phone:       ${userPhone || '—'}
║  Joined:      ${userJoinDate ? new Date(userJoinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
║                                      ║
╚══════════════════════════════════════╝
`
            const blob = new Blob([cardContent], { type: 'text/plain' })
            const filename = `GHL_ID_Card_${(userStaffCode || 'staff').replace(/\s/g, '_')}.txt`
            await saveBlobAs(blob, filename, showToast as any)
            showToast('ID Card downloaded', 'success')
          }} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors text-left">
            <Download className="w-4 h-4 text-teal-400" />
            <div>
              <p className="text-xs font-medium text-white">Download ID Card</p>
              <p className="text-[10px] text-gray-500">Get digital ID card</p>
            </div>
          </button>
        </div>
      </AdminGlass>

      {/* Change Email Modal */}
      <AdminModal isOpen={emailModalOpen} onClose={() => { setEmailModalOpen(false); setNewEmail('') }} title="Change Email Address">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Current Email</label>
            <p className="text-sm text-white bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5">{userEmail || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">New Email Address</label>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Enter new email" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setEmailModalOpen(false); setNewEmail('') }} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">Cancel</button>
            <button onClick={async () => {
              if (!newEmail.trim() || !newEmail.includes('@')) { showToast('Please enter a valid email address', 'error'); return }
              try {
                const sb = supabase as any
                const { error } = await sb.auth.updateUser({ email: newEmail.trim() })
                if (error) throw error
                showToast('Confirmation email sent to your new address. Please verify to complete the change.', 'success')
                setEmailModalOpen(false); setNewEmail('')
              } catch (err: any) {
                showToast(`Failed to update email: ${err?.message || 'Unknown error'}`, 'error')
              }
            }} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors">Update Email</button>
          </div>
        </div>
      </AdminModal>

      {/* Change Password Modal */}
      <AdminModal isOpen={passwordModalOpen} onClose={() => { setPasswordModalOpen(false); setNewPassword(''); setConfirmPassword('') }} title="Change Password">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setPasswordModalOpen(false); setNewPassword(''); setConfirmPassword('') }} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">Cancel</button>
            <button onClick={async () => {
              if (!newPassword || newPassword.length < 6) { showToast('Password must be at least 6 characters', 'error'); return }
              if (newPassword !== confirmPassword) { showToast('Passwords do not match', 'error'); return }
              try {
                const sb = supabase as any
                const { error } = await sb.auth.updateUser({ password: newPassword })
                if (error) throw error
                showToast('Password updated successfully!', 'success')
                setPasswordModalOpen(false); setNewPassword(''); setConfirmPassword('')
              } catch (err: any) {
                showToast(`Failed to update password: ${err?.message || 'Unknown error'}`, 'error')
              }
            }} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors">Update Password</button>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

// ================================================================
//  2. ATTENDANCE
// ================================================================
function AttendanceView({ showToast }: { showToast: SelfServiceModuleProps['showToast'] }) {
  const [clockedIn, setClockedIn] = useState(false)
  const [clockLoading, setClockLoading] = useState(false)
  const [clockInTime, setClockInTime] = useState('—')
  const [clockInTimestamp, setClockInTimestamp] = useState<Date | null>(null)
  const [hoursWorked, setHoursWorked] = useState(0)
  const totalHoursTarget = 9

  const [monthRows, setMonthRows] = useState<{ date: string; status: string; check_in: string | null; check_out: string | null }[]>([])
  const [monthLabel, setMonthLabel] = useState('')
  const [firstOffset, setFirstOffset] = useState(0)
  const [daysInMonth, setDaysInMonth] = useState(30)

  // Load this-month attendance rows for current user
  useEffect(() => {
    async function loadMonth() {
      if (!isSupabaseConfigured()) return
      try {
        const sb = supabase as any
        const { data: { user } } = await sb.auth.getUser()
        if (!user?.id) return
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        setDaysInMonth(end.getDate())
        // Calendar offset: week starts Mon -> convert Sun (0) to 6, else day-1
        const startDay = start.getDay()
        setFirstOffset(startDay === 0 ? 6 : startDay - 1)
        setMonthLabel(now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) + ' Summary')

        const { data } = await sb
          .from('attendance')
          .select('date, status, check_in, check_out')
          .eq('staff_id', user.id)
          .gte('date', start.toISOString().split('T')[0])
          .lte('date', end.toISOString().split('T')[0])
          .order('date', { ascending: true })
        setMonthRows((data as any[]) || [])
      } catch { /* silent */ }
    }
    loadMonth()
  }, [clockedIn])

  const summary = (() => {
    const s = { present: 0, leave: 0, holiday: 0, late: 0, avgHours: 0, totalDays: 0 }
    let hoursSum = 0, hoursCount = 0
    for (const r of monthRows) {
      const status = (r.status || '').toLowerCase()
      if (status === 'present' || status === 'wfh') s.present++
      else if (status === 'leave' || status === 'half-day') s.leave++
      else if (status === 'holiday') s.holiday++
      if (r.check_in) {
        const d = new Date(r.check_in)
        // late if clock-in after 09:30
        if (d.getHours() > 9 || (d.getHours() === 9 && d.getMinutes() > 30)) s.late++
        if (r.check_out) {
          const mins = (new Date(r.check_out).getTime() - d.getTime()) / 60000
          if (mins > 0) { hoursSum += mins / 60; hoursCount++ }
        }
      }
    }
    s.totalDays = monthRows.length
    s.avgHours = hoursCount > 0 ? Math.round((hoursSum / hoursCount) * 10) / 10 : 0
    return s
  })()

  const attendanceDays = (() => {
    const byDay = new Map<number, string>()
    for (const r of monthRows) {
      const day = new Date(r.date).getDate()
      const status = (r.status || 'present').toLowerCase().replace('wfh', 'present')
      byDay.set(day, status)
    }
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const dow = new Date(new Date().getFullYear(), new Date().getMonth(), day).getDay()
      const isWeekend = dow === 0 || dow === 6
      return { day, status: byDay.get(day) || (isWeekend ? 'weekend' : 'absent') }
    })
  })()

  // Check if already clocked in today on mount
  useEffect(() => {
    async function checkExisting() {
      if (!isSupabaseConfigured()) return
      try {
        const sb = supabase as any
        const today = new Date().toISOString().split('T')[0]
        const { data } = await sb.from('attendance').select('*').eq('date', today).is('check_out', null).order('created_at', { ascending: false }).limit(1)
        if (data && data.length > 0 && data[0].check_in) {
          const clockIn = new Date(data[0].check_in)
          setClockedIn(true)
          setClockInTime(clockIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
          setClockInTimestamp(clockIn)
        }
      } catch { /* silent */ }
    }
    checkExisting()
  }, [])

  // Update hours worked every minute when clocked in
  useEffect(() => {
    if (!clockedIn || !clockInTimestamp) return
    const updateHours = () => {
      const diff = (Date.now() - clockInTimestamp.getTime()) / (1000 * 60 * 60)
      setHoursWorked(Math.round(diff * 10) / 10)
    }
    updateHours()
    const interval = setInterval(updateHours, 60000)
    return () => clearInterval(interval)
  }, [clockedIn, clockInTimestamp])

  const statusColors: Record<string, string> = {
    present: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20', absent: 'bg-red-500/20 text-red-400 border-red-500/20',
    leave: 'bg-blue-500/20 text-blue-400 border-blue-500/20', holiday: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
    weekend: 'bg-white/[0.04] text-gray-600 border-white/[0.04]',
  }
  const progress = Math.min((hoursWorked / totalHoursTarget) * 100, 100)
  const circumference = 2 * Math.PI * 52

  const handleClockToggle = async () => {
    setClockLoading(true)
    try {
      // Get current user id for staff_id
      let staffId: string | null = null
      try {
        const sb = supabase as any
        const { data: { user } } = await sb.auth.getUser()
        staffId = user?.id || null
      } catch { /* continue */ }

      const now = new Date()
      if (!clockedIn) {
        // Clock In
        const record = await recordAttendance({
          staff_id: staffId,
          date: now.toISOString().split('T')[0],
          check_in: now.toISOString(),
          status: 'present',
        })
        if (record) {
          setClockedIn(true)
          setClockInTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
          setClockInTimestamp(now)
          showToast('Clocked in successfully', 'success')
        } else {
          showToast('Failed to record clock-in. Please try again.', 'error')
        }
      } else {
        // Clock Out — update the attendance record with clock_out time
        const sb = supabase as any
        const today = now.toISOString().split('T')[0]
        const { error } = await sb.from('attendance')
          .update({ check_out: now.toISOString() })
          .eq('date', today)
          .is('check_out', null)
          .order('created_at', { ascending: false })
          .limit(1)
        if (error) {
          showToast(`Clock-out failed: ${error.message}`, 'error')
        } else {
          // Calculate total hours worked before resetting
          const totalHrs = clockInTimestamp
            ? Math.round(((now.getTime() - clockInTimestamp.getTime()) / (1000 * 60 * 60)) * 10) / 10
            : 0
          setClockedIn(false)
          setClockInTime('—')
          setClockInTimestamp(null)
          setHoursWorked(totalHrs)
          showToast(`Clocked out successfully. Hours worked: ${totalHrs}h`, 'success')
        }
      }
    } catch (err: any) {
      showToast(`Attendance error: ${err?.message || 'Unknown error'}`, 'error')
    } finally {
      setClockLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Clock In/Out Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <AdminGlass className="lg:col-span-1 flex flex-col items-center justify-center py-6">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="#14b8a6" strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={circumference - (progress / 100) * circumference}
                strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-white">{hoursWorked}h</span>
              <span className="text-[10px] text-gray-500">of {totalHoursTarget}h</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-1">Clocked in at <span className="text-white font-medium">{clockInTime}</span></p>
          <button onClick={handleClockToggle} disabled={clockLoading}
            className={`mt-3 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
              clockedIn
                ? 'bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25'
                : 'bg-teal-500/15 text-teal-400 border border-teal-500/25 hover:bg-teal-500/25'
            }`}
          >
            {clockLoading ? 'Processing...' : clockedIn ? 'Clock Out' : 'Clock In'}
          </button>
        </AdminGlass>

        {/* Summary Cards */}
        <AdminGlass className="lg:col-span-2">
          <SectionHeader title={monthLabel || 'Attendance Summary'} icon={BarChart3} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Present', value: summary.present, icon: CheckCircle2, color: 'text-emerald-400' },
              { label: 'On Leave', value: summary.leave, icon: Calendar, color: 'text-blue-400' },
              { label: 'Holidays', value: summary.holiday, icon: Star, color: 'text-gray-400' },
              { label: 'Late Arrivals', value: summary.late, icon: Timer, color: 'text-amber-400' },
              { label: 'Avg Hours', value: `${summary.avgHours}h`, icon: Clock, color: 'text-teal-400' },
              { label: 'Working Days', value: summary.totalDays, icon: Calendar, color: 'text-purple-400' },
            ].map(item => (
              <div key={item.label} className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                <item.icon className={`w-4 h-4 mx-auto mb-1.5 ${item.color}`} />
                <p className="text-lg font-bold text-white">{item.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </AdminGlass>
      </div>

      {/* Calendar Grid */}
      <AdminGlass>
        <SectionHeader title="Attendance Calendar" icon={Calendar} />
        <div className="grid grid-cols-7 gap-1.5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-[10px] text-gray-600 font-semibold pb-1">{d}</div>
          ))}
          {Array.from({ length: firstOffset }).map((_, i) => <div key={`blank-${i}`} />)}
          {attendanceDays.map(d => (
            <div key={d.day} className={`text-center py-2 rounded-lg text-xs font-medium border ${statusColors[d.status] || statusColors.weekend}`}>
              {d.day}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          {[
            { label: 'Present', color: 'bg-emerald-400' }, { label: 'Absent', color: 'bg-red-400' },
            { label: 'Leave', color: 'bg-blue-400' }, { label: 'Holiday', color: 'bg-gray-400' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className={`w-2 h-2 rounded-full ${l.color}`} /> {l.label}
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ================================================================
//  3. LEAVE
// ================================================================
function LeaveView({ showToast }: { showToast: SelfServiceModuleProps['showToast'] }) {
  const [leaveForm, setLeaveForm] = useState({ type: '', fromDate: '', toDate: '', halfDay: 'Full Day', reason: '' })
  const [submitting, setSubmitting] = useState(false)
  type LeaveRow = { id: string; leave_type: string; start_date: string; end_date: string; reason: string | null; status: string; half_day?: boolean; created_at?: string }
  const [leaveRows, setLeaveRows] = useState<LeaveRow[]>([])

  const daysBetween = (from: string, to: string) => {
    const a = new Date(from), b = new Date(to)
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return 1
    return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1)
  }

  const loadHistory = async () => {
    if (!isSupabaseConfigured()) return
    try {
      const sb = supabase as any
      const { data, error } = await sb.rpc('get_my_leave_history')
      if (!error && Array.isArray(data)) setLeaveRows(data as LeaveRow[])
    } catch { /* ignore */ }
  }

  useEffect(() => { loadHistory() }, [])

  const ENTITLEMENTS: Record<string, number> = { 'Casual Leave': 12, 'Sick Leave': 12, 'Earned Leave': 18, 'Comp-off': 6 }
  const balances = (Object.keys(ENTITLEMENTS) as (keyof typeof ENTITLEMENTS)[]).map(type => {
    const used = leaveRows
      .filter(r => r.leave_type === type && r.status !== 'rejected' && r.status !== 'cancelled')
      .reduce((sum, r) => sum + (r.half_day ? 0.5 : daysBetween(r.start_date, r.end_date)), 0)
    const total = ENTITLEMENTS[type]
    return { type, total, used, available: Math.max(0, total - used) }
  })

  const history = leaveRows.map(r => ({
    id: r.id.slice(0, 8).toUpperCase(),
    type: r.leave_type,
    from: r.start_date,
    to: r.end_date,
    days: r.half_day ? 0.5 : daysBetween(r.start_date, r.end_date),
    reason: r.reason || '',
    status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
  }))
  const holidays = [
    { date: '14 Mar 2026', name: 'Holi', day: 'Saturday' },
    { date: '02 Apr 2026', name: 'Ram Navami', day: 'Thursday' },
    { date: '14 Apr 2026', name: 'Ambedkar Jayanti / Tamil New Year', day: 'Tuesday' },
    { date: '01 May 2026', name: 'May Day', day: 'Friday' },
    { date: '15 Aug 2026', name: 'Independence Day', day: 'Saturday' },
    { date: '02 Oct 2026', name: 'Gandhi Jayanti', day: 'Friday' },
    { date: '20 Oct 2026', name: 'Diwali', day: 'Tuesday' },
    { date: '25 Dec 2026', name: 'Christmas', day: 'Friday' },
  ]

  const statusVariant = (s: string) => s === 'Approved' ? 'success' : s === 'Pending' ? 'warning' : 'error'

  return (
    <div className="space-y-5">
      {/* Leave Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map(b => (
          <AdminGlass key={b.type}>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">{b.type}</p>
            <p className="text-2xl font-bold text-white">{b.available}</p>
            <p className="text-[10px] text-gray-500 mt-1">of {b.total} total &middot; {b.used} used</p>
            <div className="mt-2 w-full h-1.5 rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-teal-500/60 transition-all" style={{ width: `${(b.available / b.total) * 100}%` }} />
            </div>
          </AdminGlass>
        ))}
      </div>

      {/* Apply Leave Form */}
      <AdminGlass>
        <SectionHeader title="Apply for Leave" icon={Send} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Leave Type</label>
            <select value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40">
              <option value="">Select type</option>
              <option>Casual Leave</option><option>Sick Leave</option>
              <option>Earned Leave</option><option>Comp-off</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">From Date</label>
            <input type="date" value={leaveForm.fromDate} onChange={e => setLeaveForm({ ...leaveForm, fromDate: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">To Date</label>
            <input type="date" value={leaveForm.toDate} onChange={e => setLeaveForm({ ...leaveForm, toDate: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Half Day?</label>
            <select value={leaveForm.halfDay} onChange={e => setLeaveForm({ ...leaveForm, halfDay: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40">
              <option>Full Day</option><option>First Half</option><option>Second Half</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Reason</label>
          <textarea rows={2} value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Enter reason for leave..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40 resize-none" />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            disabled={submitting}
            onClick={async () => {
            if (!leaveForm.type) { showToast('Please select a leave type', 'error'); return }
            if (!leaveForm.fromDate) { showToast('Please select a start date', 'error'); return }
            if (!leaveForm.reason.trim()) { showToast('Please provide a reason for leave', 'error'); return }
            if (!isSupabaseConfigured()) { showToast('Database is not configured', 'error'); return }
            setSubmitting(true)
            try {
              // The server-side RPC resolves auth.uid() → staff_profiles.id and runs
              // the insert under SECURITY DEFINER. Going through the RPC avoids the
              // FK mismatch (staff_id must be staff_profiles.id) and the RLS
              // RETURNING trap that breaks `.insert().select().single()` for staff.
              const sb = supabase as any
              const { data, error } = await sb.rpc('submit_my_leave_request', {
                p_leave_type: leaveForm.type,
                p_start_date: leaveForm.fromDate,
                p_end_date: leaveForm.toDate || leaveForm.fromDate,
                p_half_day: leaveForm.halfDay !== 'Full Day',
                p_reason: leaveForm.reason.trim(),
              })
              if (error) throw error
              if (!data) throw new Error('No response from server')
              showToast('Leave application submitted successfully', 'success')
              setLeaveForm({ type: '', fromDate: '', toDate: '', halfDay: 'Full Day', reason: '' })
              loadHistory()
            } catch (err: any) {
              const msg = err?.message || 'Unknown error'
              if (msg === 'no_staff_profile') {
                showToast('Your staff profile is not set up yet. Please contact an admin.', 'error')
              } else if (msg === 'not_authenticated') {
                showToast('Please sign in again to apply for leave.', 'error')
              } else {
                showToast(`Leave submission error: ${msg}`, 'error')
              }
            } finally {
              setSubmitting(false)
            }
          }}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/25 hover:bg-teal-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </AdminGlass>

      {/* Leave History */}
      <AdminGlass>
        <SectionHeader title="Leave History" icon={Calendar} />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-white/[0.06]">
                <th className="text-left py-2 px-2 font-medium">ID</th>
                <th className="text-left py-2 px-2 font-medium">Type</th>
                <th className="text-left py-2 px-2 font-medium">From</th>
                <th className="text-left py-2 px-2 font-medium">To</th>
                <th className="text-center py-2 px-2 font-medium">Days</th>
                <th className="text-left py-2 px-2 font-medium">Reason</th>
                <th className="text-center py-2 px-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-2.5 px-2 text-gray-400 font-mono">{h.id}</td>
                  <td className="py-2.5 px-2 text-white">{h.type}</td>
                  <td className="py-2.5 px-2 text-gray-300">{h.from}</td>
                  <td className="py-2.5 px-2 text-gray-300">{h.to}</td>
                  <td className="py-2.5 px-2 text-center text-white font-medium">{h.days}</td>
                  <td className="py-2.5 px-2 text-gray-400 max-w-[180px] truncate">{h.reason}</td>
                  <td className="py-2.5 px-2 text-center"><AdminBadge label={h.status} variant={statusVariant(h.status)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminGlass>

      {/* Holiday Calendar */}
      <AdminGlass>
        <SectionHeader title="Upcoming Holidays" icon={Star} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {holidays.map(h => (
            <div key={h.date} className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <p className="text-xs font-semibold text-white">{h.name}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{h.date} &middot; {h.day}</p>
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ================================================================
//  4. PAYSLIPS
// ================================================================
interface PayslipRow {
  id: string
  month: string
  payDate: string
  basic: number
  allowances: number
  deductions: number
  gross: number
  net: number
  status: string
  fileUrl: string | null
}

function PayslipsView({ showToast }: { showToast: SelfServiceModuleProps['showToast'] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [payslips, setPayslips] = useState<PayslipRow[]>([])
  const [loading, setLoading] = useState(true)
  const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`

  useEffect(() => {
    let active = true
    async function load() {
      if (!isSupabaseConfigured()) { setLoading(false); return }
      try {
        const sb = supabase as any
        const { data: { user } } = await sb.auth.getUser()
        if (!user?.id) { setLoading(false); return }
        // payslips.staff_id refers to staff_profiles.id; resolve it first
        const { data: sp } = await sb.from('staff_profiles').select('id').eq('user_id', user.id).maybeSingle()
        if (!sp?.id) { if (active) setLoading(false); return }
        const { data } = await sb
          .from('payslips')
          .select('id, month, basic, allowances, deductions, net_pay, file_url, status, created_at')
          .eq('staff_id', sp.id)
          .order('month', { ascending: false })
        if (!active) return
        setPayslips((data as any[] || []).map(p => {
          const basic = Number(p.basic || 0)
          const allowances = Number(p.allowances || 0)
          const deductions = Number(p.deductions || 0)
          const net = Number(p.net_pay || 0)
          const monthDate = p.month ? new Date(p.month) : null
          return {
            id: p.id,
            month: monthDate ? monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—',
            payDate: p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—',
            basic,
            allowances,
            deductions,
            gross: basic + allowances,
            net,
            status: p.status || 'paid',
            fileUrl: p.file_url || null,
          }
        }))
      } catch { /* silent */ }
      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  return (
    <div className="space-y-5">
      <SectionHeader title="Salary Payslips" icon={IndianRupee} />
      {loading ? (
        <AdminGlass><p className="text-xs text-gray-500 text-center py-6">Loading payslips…</p></AdminGlass>
      ) : payslips.length === 0 ? (
        <AdminGlass><p className="text-xs text-gray-500 text-center py-6">No payslips available yet. HR will publish them here each month.</p></AdminGlass>
      ) : payslips.map(p => (
        <AdminGlass key={p.id}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{p.month}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Paid on {p.payDate} &middot; {p.status}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-gray-500">Net Salary</p>
                <p className="text-lg font-bold text-teal-400">{fmt(p.net)}</p>
              </div>
              <button onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
                <Eye className="w-4 h-4 text-gray-400" />
              </button>
              <button onClick={async () => {
                if (p.fileUrl) {
                  window.open(p.fileUrl, '_blank', 'noopener,noreferrer')
                  return
                }
                showToast('Payslip file not yet uploaded by HR', 'warning')
              }}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
                <Download className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {expanded === p.id && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold mb-2">Earnings</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-gray-400">Basic Salary</span><span className="text-white font-medium">{fmt(p.basic)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-400">Allowances</span><span className="text-white font-medium">{fmt(p.allowances)}</span></div>
                    <div className="flex justify-between text-xs pt-1.5 border-t border-white/[0.06] font-semibold">
                      <span className="text-gray-300">Gross Earnings</span>
                      <span className="text-emerald-400">{fmt(p.gross)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-red-400 uppercase tracking-wider font-semibold mb-2">Deductions</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-gray-400">Total Deductions</span><span className="text-white font-medium">{fmt(p.deductions)}</span></div>
                    <div className="flex justify-between text-xs pt-1.5 border-t border-white/[0.06] font-semibold">
                      <span className="text-gray-300">After Deductions</span>
                      <span className="text-red-400">{fmt(p.deductions)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-300">Net Pay</span>
                <span className="text-xl font-bold text-teal-400">{fmt(p.net)}</span>
              </div>
            </div>
          )}
        </AdminGlass>
      ))}
    </div>
  )
}

// ================================================================
//  5. DOCUMENTS
// ================================================================
function DocumentsView({ showToast }: { showToast: SelfServiceModuleProps['showToast'] }) {
  const folders: { name: string; icon: any; count: number }[] = []
  const [documents, setDocuments] = useState<{ name: string; folder: string; date: string; size: string; status: 'Verified' | 'Pending' }[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const requestLetters = ['Employment Verification', 'Salary Certificate', 'Experience Letter', 'Bonafide Certificate']

  // Fetch documents from storage on mount and after uploads
  useEffect(() => {
    async function loadDocs() {
      if (!isSupabaseConfigured()) return
      try {
        const sb = supabase as any
        const { data, error } = await sb.storage.from('ghl-documents').list('staff/documents', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
        if (!error && data) {
          setDocuments(data.map((f: any) => ({
            name: f.name,
            folder: 'Staff Documents',
            date: f.created_at ? new Date(f.created_at).toLocaleDateString('en-IN') : '—',
            size: f.metadata?.size ? `${(f.metadata.size / 1024).toFixed(1)} KB` : '—',
            status: 'Pending' as const,
          })))
        }
      } catch { /* silent */ }
    }
    loadDocs()
  }, [refreshKey])

  return (
    <div className="space-y-5">
      {/* Folders */}
      <AdminGlass>
        <SectionHeader title="Document Folders" icon={Folder} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {folders.map(f => (
            <div key={f.name} className="flex flex-col items-center gap-2 px-3 py-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-teal-500/20 transition-colors cursor-pointer">
              <f.icon className="w-6 h-6 text-teal-400" />
              <p className="text-xs text-white font-medium text-center">{f.name}</p>
              <p className="text-[10px] text-gray-500">{f.count} file(s)</p>
            </div>
          ))}
        </div>
      </AdminGlass>

      {/* Document List */}
      <AdminGlass>
        <SectionHeader title="All Documents" icon={FileCheck} />
        <div className="space-y-2">
          {documents.map(d => (
            <div key={d.name} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
              <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{d.name}</p>
                <p className="text-[10px] text-gray-500">{d.folder} &middot; {d.date} &middot; {d.size}</p>
              </div>
              <AdminBadge label={d.status} variant={d.status === 'Verified' ? 'success' : 'warning'} />
              <button onClick={async () => {
                try {
                  const sb = supabase as any
                  const { data, error } = await sb.storage.from('ghl-documents').download(`staff/documents/${d.name}`)
                  if (error || !data) { showToast('Failed to download file', 'error'); return }
                  await saveBlobAs(data, d.name, showToast as any)
                } catch { showToast('Download failed', 'error') }
              }} className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors" title="Download">
                <Download className="w-3.5 h-3.5 text-gray-500 hover:text-teal-400" />
              </button>
            </div>
          ))}
        </div>
      </AdminGlass>

      {/* Upload Area */}
      <AdminGlass>
        <SectionHeader title="Upload Document" icon={Upload} />
        <div className="border-2 border-dashed border-white/[0.08] rounded-xl p-8 text-center hover:border-teal-500/30 transition-colors cursor-pointer"
          onClick={async () => {
            const results = await pickAndUploadFiles('staff/documents', {
              accept: '.pdf,.jpg,.jpeg,.png',
              portal: 'staff',
              category: 'employee-document',
            })
            const successCount = results.filter(r => r.success).length
            if (successCount > 0) {
              showToast(`Uploaded ${successCount} document(s) successfully`, 'success')
              // Small delay to allow storage to propagate, then refresh
              await new Promise(r => setTimeout(r, 500))
              setRefreshKey(prev => prev + 1)
            }
            else if (results.length > 0) showToast('Upload failed — please try again', 'error')
          }}>
          <Upload className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Drag and drop files here or <span className="text-teal-400 font-medium">browse</span></p>
          <p className="text-[10px] text-gray-600 mt-1">PDF, JPG, PNG up to 5 MB</p>
        </div>
      </AdminGlass>

      {/* Request Letters */}
      <AdminGlass>
        <SectionHeader title="Request Letter Generation" icon={Send} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {requestLetters.map(l => (
            <button key={l} onClick={() => showToast(`Request for ${l} submitted`, 'success')}
              className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-teal-500/20 hover:bg-teal-500/[0.05] transition-all text-left">
              <p className="text-xs font-medium text-white">{l}</p>
              <p className="text-[10px] text-teal-400 mt-1 flex items-center gap-1">Request <ChevronRight className="w-3 h-3" /></p>
            </button>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ================================================================
//  6. TRAINING
// ================================================================
function TrainingView({ showToast }: { showToast: SelfServiceModuleProps['showToast'] }) {
  const modules: { id: string; name: string; category: string; type: string; progress: number; status: string; score: number | undefined; mandatory: boolean; duration: string }[] = []
  const certifications: { name: string; issuer: string; date: string; valid: string }[] = []
  const statusVariant = (s: string) => s === 'Completed' ? 'success' : s === 'In Progress' ? 'info' : 'neutral'

  return (
    <div className="space-y-5">
      {/* Training Modules */}
      <AdminGlass>
        <SectionHeader title="Training Modules" icon={BookOpen} />
        <div className="space-y-3">
          {modules.map(m => (
            <div key={m.id} className="px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-white">{m.name}</p>
                    {m.mandatory && <AdminBadge label="Mandatory" variant="error" />}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">{m.category} &middot; {m.type} &middot; {m.duration}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {m.score !== undefined && <span className="text-xs font-bold text-teal-400">{m.score}%</span>}
                  <AdminBadge label={m.status} variant={statusVariant(m.status)} />
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                  <div className={`h-full rounded-full transition-all ${m.progress === 100 ? 'bg-emerald-500' : 'bg-teal-500'}`}
                    style={{ width: `${m.progress}%` }} />
                </div>
                <span className="text-[10px] text-gray-500 w-8 text-right">{m.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </AdminGlass>

      {/* Certifications */}
      <AdminGlass>
        <SectionHeader title="Certifications Earned" icon={Award} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {certifications.map(c => (
            <div key={c.name} className="px-4 py-4 rounded-xl bg-gradient-to-br from-teal-500/[0.06] to-blue-500/[0.04] border border-teal-500/15">
              <Award className="w-5 h-5 text-teal-400 mb-2" />
              <p className="text-xs font-semibold text-white">{c.name}</p>
              <p className="text-[10px] text-gray-500 mt-1">{c.issuer} &middot; Issued {c.date}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">Valid until {c.valid}</p>
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ================================================================
//  7. PERFORMANCE
// ================================================================
function PerformanceView({ showToast }: { showToast: SelfServiceModuleProps['showToast'] }) {
  const kras: { goal: string; target: string; actual: string; weight: number; selfRating: number }[] = []
  const csMetrics: { label: string; value: string; icon: any; color: string }[] = []
  const feedbacks: { from: string; date: string; text: string }[] = []

  return (
    <div className="space-y-5">
      {/* KRA Table */}
      <AdminGlass>
        <SectionHeader title="Current Period KRAs (Q4 FY26)" icon={Target} />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-white/[0.06]">
                <th className="text-left py-2 px-2 font-medium">Goal / KRA</th>
                <th className="text-center py-2 px-2 font-medium">Target</th>
                <th className="text-center py-2 px-2 font-medium">Actual</th>
                <th className="text-center py-2 px-2 font-medium">Weight</th>
                <th className="text-center py-2 px-2 font-medium">Self Rating</th>
              </tr>
            </thead>
            <tbody>
              {kras.map(k => (
                <tr key={k.goal} className="border-b border-white/[0.03]">
                  <td className="py-2.5 px-2 text-white font-medium">{k.goal}</td>
                  <td className="py-2.5 px-2 text-center text-gray-400">{k.target}</td>
                  <td className="py-2.5 px-2 text-center text-teal-400 font-semibold">{k.actual}</td>
                  <td className="py-2.5 px-2 text-center text-gray-400">{k.weight}%</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="inline-flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" /> {k.selfRating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminGlass>

      {/* Performance Score Trend */}
      <AdminGlass>
        <SectionHeader title="Performance Score Trend" icon={TrendingUp} />
        <div className="flex items-end gap-3 h-32 px-2">
          {([] as { quarter: string; score: number }[]).map(q => (
            <div key={q.quarter} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-teal-400 font-semibold">{q.score}</span>
              <div className="w-full rounded-t-lg bg-teal-500/20 border border-teal-500/15 transition-all"
                style={{ height: `${(q.score / 5) * 100}%` }} />
              <span className="text-[10px] text-gray-500">{q.quarter}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-600 mt-2 text-right">* Q4 projected based on current metrics</p>
      </AdminGlass>

      {/* CS Metrics */}
      <AdminGlass>
        <SectionHeader title="CS-Specific Metrics" icon={BarChart3} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {csMetrics.map(m => (
            <div key={m.label} className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
              <m.icon className={`w-4 h-4 mx-auto mb-1.5 ${m.color}`} />
              <p className="text-lg font-bold text-white">{m.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </AdminGlass>

      {/* Feedback */}
      <AdminGlass>
        <SectionHeader title="Feedback & Reviews" icon={MessageSquare} />
        <div className="space-y-3">
          {feedbacks.map((f, i) => (
            <div key={i} className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-white">{f.from}</p>
                <p className="text-[10px] text-gray-600">{f.date}</p>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ================================================================
//  8. EXPENSES
// ================================================================
interface ExpenseRow {
  id: string
  date: string
  category: string
  description: string
  amount: number
  status: string
  receipt_url: string | null
}

function ExpensesView({ showToast }: { showToast: SelfServiceModuleProps['showToast'] }) {
  const [claims, setClaims] = useState<ExpenseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ category: '', date: '', amount: '', description: '' })
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [receiptName, setReceiptName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [staffProfileId, setStaffProfileId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const loadClaims = useCallback(async () => {
    if (!isSupabaseConfigured()) { setLoading(false); return }
    setLoading(true)
    try {
      const sb = supabase as any
      const { data: { user } } = await sb.auth.getUser()
      if (!user?.id) { setLoading(false); return }
      setUserId(user.id)
      const { data: sp } = await sb.from('staff_profiles').select('id').eq('user_id', user.id).maybeSingle()
      if (sp?.id) setStaffProfileId(sp.id)

      // Show both self-submitted (created_by) and linked to staff profile
      let query = sb.from('expenses').select('*').order('date', { ascending: false }).limit(50)
      if (sp?.id) query = query.or(`created_by.eq.${user.id},staff_id.eq.${sp.id}`)
      else query = query.eq('created_by', user.id)
      const { data } = await query
      setClaims((data as any[] || []).map(e => ({
        id: e.id,
        date: e.date || (e.created_at ? e.created_at.split('T')[0] : ''),
        category: e.category || 'Other',
        description: e.description || '',
        amount: Number(e.amount || 0),
        status: (e.status || 'pending').toString(),
        receipt_url: e.receipt_url || null,
      })))
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadClaims() }, [loadClaims])

  const handleSubmit = async () => {
    if (!form.category) { showToast('Select a category', 'error'); return }
    const amount = Number(form.amount)
    if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return }
    if (!userId) { showToast('Session expired — please sign in again', 'error'); return }
    setSubmitting(true)
    try {
      const sb = supabase as any
      const payload: Record<string, any> = {
        category: form.category,
        description: form.description || null,
        amount,
        currency: 'INR',
        date: form.date || new Date().toISOString().split('T')[0],
        status: 'pending',
        created_by: userId,
      }
      if (staffProfileId) payload.staff_id = staffProfileId
      if (receiptUrl) payload.receipt_url = receiptUrl
      const { error } = await sb.from('expenses').insert(payload)
      if (error) throw error
      showToast('Expense claim submitted for approval', 'success')
      setForm({ category: '', date: '', amount: '', description: '' })
      setReceiptUrl(null); setReceiptName(null)
      loadClaims()
    } catch (err: any) {
      showToast(`Submit failed: ${err?.message || 'error'}`, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const summary = (() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const thisMonth = claims.filter(c => c.date >= monthStart)
    const approved = thisMonth.filter(c => c.status === 'approved').length
    const reimbursed = thisMonth.filter(c => c.status === 'reimbursed' || c.status === 'paid').length
    const pending = thisMonth.filter(c => c.status === 'pending' || c.status === 'submitted').length
    const totalAmount = thisMonth.reduce((s, c) => s + c.amount, 0)
    return { submitted: thisMonth.length, approved, reimbursed, pending, totalAmount }
  })()

  const statusVariant = (s: string) => {
    const v = s.toLowerCase()
    if (v === 'approved') return 'success' as const
    if (v === 'pending' || v === 'submitted') return 'warning' as const
    if (v === 'reimbursed' || v === 'paid') return 'info' as const
    if (v === 'rejected') return 'error' as const
    return 'neutral' as const
  }

  return (
    <div className="space-y-5">
      {/* Monthly Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Claims', value: summary.submitted, icon: Receipt, color: 'text-white' },
          { label: 'Approved', value: summary.approved, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Reimbursed', value: summary.reimbursed, icon: IndianRupee, color: 'text-teal-400' },
          { label: 'Pending', value: summary.pending, icon: Timer, color: 'text-amber-400' },
          { label: 'Total Amount', value: `₹${summary.totalAmount.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-teal-400' },
        ].map(s => (
          <AdminGlass key={s.label}>
            <div className="text-center">
              <s.icon className={`w-4 h-4 mx-auto mb-1.5 ${s.color}`} />
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-gray-500">{s.label}</p>
            </div>
          </AdminGlass>
        ))}
      </div>

      {/* Submit Expense Form */}
      <AdminGlass>
        <SectionHeader title="Submit Expense Claim" icon={Plus} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40">
              <option value="" className="bg-neutral-900">Select</option>
              <option value="travel" className="bg-neutral-900">Travel</option>
              <option value="meals" className="bg-neutral-900">Meals</option>
              <option value="supplies" className="bg-neutral-900">Supplies</option>
              <option value="phone" className="bg-neutral-900">Phone</option>
              <option value="fuel" className="bg-neutral-900">Fuel</option>
              <option value="accommodation" className="bg-neutral-900">Accommodation</option>
              <option value="other" className="bg-neutral-900">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Amount (₹)</label>
            <input type="number" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Receipt</label>
            <button type="button" onClick={async () => {
              const results = await pickAndUploadFiles('staff/expenses', {
                accept: '.pdf,.jpg,.jpeg,.png',
                multiple: false,
                portal: 'staff',
                category: 'expense-receipt',
              })
              const first = results[0]
              const uploadedUrl = first?.file?.url
              if (first?.success && uploadedUrl) {
                setReceiptUrl(uploadedUrl)
                setReceiptName(first.file?.name || 'receipt')
                showToast(`Receipt attached`, 'success')
              } else if (first) {
                showToast('Upload failed', 'error')
              }
            }}
              className={`w-full bg-white/[0.04] border rounded-xl px-3 py-2 text-xs hover:border-teal-500/40 transition-colors text-left flex items-center gap-1.5 truncate ${receiptUrl ? 'text-teal-400 border-teal-500/30' : 'text-gray-500 border-white/[0.08]'}`}>
              <Upload className="w-3.5 h-3.5" />
              <span className="truncate">{receiptName || 'Attach receipt'}</span>
            </button>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Description</label>
          <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of expense..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40" />
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={handleSubmit} disabled={submitting}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/25 hover:bg-teal-500/25 transition-colors disabled:opacity-50">
            {submitting ? 'Submitting…' : 'Submit Claim'}
          </button>
        </div>
      </AdminGlass>

      {/* Recent Claims */}
      <AdminGlass>
        <SectionHeader title="Recent Expense Claims" icon={Receipt} />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-white/[0.06]">
                <th className="text-left py-2 px-2 font-medium">ID</th>
                <th className="text-left py-2 px-2 font-medium">Date</th>
                <th className="text-left py-2 px-2 font-medium">Category</th>
                <th className="text-left py-2 px-2 font-medium">Description</th>
                <th className="text-right py-2 px-2 font-medium">Amount</th>
                <th className="text-center py-2 px-2 font-medium">Status</th>
                <th className="text-center py-2 px-2 font-medium">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-500">Loading…</td></tr>
              ) : claims.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-500">No expense claims yet</td></tr>
              ) : claims.map(c => (
                <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-2.5 px-2 text-gray-400 font-mono">{c.id.slice(0, 8)}</td>
                  <td className="py-2.5 px-2 text-gray-300">{c.date}</td>
                  <td className="py-2.5 px-2 text-white capitalize">{c.category}</td>
                  <td className="py-2.5 px-2 text-gray-400 max-w-[220px] truncate">{c.description || '—'}</td>
                  <td className="py-2.5 px-2 text-right text-white font-medium">₹{c.amount.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-2 text-center"><AdminBadge label={c.status} variant={statusVariant(c.status)} /></td>
                  <td className="py-2.5 px-2 text-center">
                    {c.receipt_url ? (
                      <a href={c.receipt_url} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline inline-flex items-center gap-1"><Eye className="w-3 h-3" />View</a>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminGlass>
    </div>
  )
}

// ================================================================
//  PLACEHOLDER VIEW (Grievance / Exit)
// ================================================================
function PlaceholderView({ title, icon: Icon, description }: { title: string; icon: React.ComponentType<{ className?: string }>; description: string }) {
  return (
    <AdminGlass className="flex flex-col items-center justify-center py-16">
      <Icon className="w-10 h-10 text-teal-500/50 mb-4" />
      <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
      <p className="text-sm text-gray-500 text-center max-w-md">{description}</p>
      <AdminBadge label="In Development" variant="info" size="md" />
    </AdminGlass>
  )
}
