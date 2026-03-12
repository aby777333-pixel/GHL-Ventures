'use client'

import { useState } from 'react'
import AdminGlass from '@/components/admin/shared/AdminGlass'
import AdminBadge from '@/components/admin/shared/AdminBadge'
import {
  User, Clock, Calendar, FileText, GraduationCap, Target, Receipt,
  AlertTriangle, LogOut, Download, Upload, ChevronRight, Phone, Mail,
  MapPin, Shield, Award, BookOpen, TrendingUp, IndianRupee, Folder,
  CheckCircle2, XCircle, Timer, Coffee, Star, Send, Plus, Eye,
  Briefcase, Heart, BarChart3, MessageSquare, Play, FileCheck,
} from 'lucide-react'
import { saveBlobAs, pickAndUploadFiles } from '@/lib/supabase/storageService'
import { insertRow } from '@/lib/supabase/adminDataService'

// ── Props ──────────────────────────────────────────────────────
interface SelfServiceModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

// ── Main Component ─────────────────────────────────────────────
export default function SelfServiceModule({ subTab, navigate, showToast }: SelfServiceModuleProps) {
  const tab = subTab || 'profile'

  switch (tab) {
    case 'profile':     return <ProfileOverview showToast={showToast} />
    case 'attendance':  return <AttendanceView showToast={showToast} />
    case 'leave':       return <LeaveView showToast={showToast} />
    case 'payslips':    return <PayslipsView showToast={showToast} />
    case 'documents':   return <DocumentsView showToast={showToast} />
    case 'training':    return <TrainingView showToast={showToast} />
    case 'performance': return <PerformanceView showToast={showToast} />
    case 'expenses':    return <ExpensesView showToast={showToast} />
    case 'grievance':   return <PlaceholderView title="Grievance Portal" icon={AlertTriangle} description="File and track workplace grievances confidentially. This module is under development." />
    case 'exit':        return <PlaceholderView title="Exit Management" icon={LogOut} description="Resignation, clearance, and full-and-final settlement tracking. This module is under development." />
    default:            return <ProfileOverview showToast={showToast} />
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
//  1. PROFILE OVERVIEW
// ================================================================
function ProfileOverview({ showToast }: { showToast: SelfServiceModuleProps['showToast'] }) {
  const profile = {
    name: '—', code: '—', designation: '—',
    status: 'Active', department: '—', reportingTo: '—',
    shift: '—', pfNumber: '—', uan: '—',
    dob: '—', gender: '—', bloodGroup: '—', phone: '—',
    email: '—', address: '—',
    emergencyContact: '—',
  }
  const skills: { name: string; level: string }[] = []
  const documents: { name: string; type: string; uploaded: string; status: string }[] = []
  const personalFields = [
    { label: 'Date of Birth', value: profile.dob }, { label: 'Gender', value: profile.gender },
    { label: 'Blood Group', value: profile.bloodGroup }, { label: 'Phone', value: profile.phone },
    { label: 'Email', value: profile.email }, { label: 'Address', value: profile.address },
    { label: 'Emergency Contact', value: profile.emergencyContact },
  ]
  const professionalFields = [
    { label: 'Department', value: profile.department }, { label: 'Reporting To', value: profile.reportingTo },
    { label: 'Shift', value: profile.shift }, { label: 'PF Number', value: profile.pfNumber },
    { label: 'UAN', value: profile.uan },
  ]

  return (
    <div className="space-y-5">
      {/* Profile Header */}
      <AdminGlass>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/30 to-blue-500/30 border-2 border-teal-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-teal-300">PN</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-white">{profile.name}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{profile.code} &middot; {profile.designation}</p>
            <div className="mt-2">
              <AdminBadge label={profile.status} variant="success" dot size="md" />
            </div>
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
              <p className="text-sm text-white mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>
      </AdminGlass>

      {/* Professional Info */}
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
      </AdminGlass>

      {/* Skills */}
      <AdminGlass>
        <SectionHeader title="Skills & Languages" icon={Award} />
        <div className="flex flex-wrap gap-2">
          {skills.map(s => (
            <span key={s.name} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-teal-500/10 text-teal-300 border-teal-500/20">
              {s.name}
              <span className="text-[9px] text-teal-500/70">({s.level})</span>
            </span>
          ))}
        </div>
      </AdminGlass>

      {/* Documents */}
      <AdminGlass>
        <SectionHeader title="Uploaded Documents" icon={FileText} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {documents.map(d => (
            <div key={d.name} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <FileCheck className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{d.name}</p>
                <p className="text-[10px] text-gray-500">{d.type} &middot; {d.uploaded}</p>
              </div>
              <AdminBadge label={d.status} variant={d.status === 'Verified' ? 'success' : 'warning'} />
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ================================================================
//  2. ATTENDANCE
// ================================================================
function AttendanceView({ showToast }: { showToast: SelfServiceModuleProps['showToast'] }) {
  const [clockedIn, setClockedIn] = useState(false)
  const clockInTime = '—'
  const hoursWorked = 0
  const totalHoursTarget = 9

  const summary = { present: 0, leave: 0, holiday: 0, late: 0, avgHours: 0, totalDays: 0 }
  const attendanceDays: { day: number; status: string }[] = []

  const statusColors: Record<string, string> = {
    present: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20', absent: 'bg-red-500/20 text-red-400 border-red-500/20',
    leave: 'bg-blue-500/20 text-blue-400 border-blue-500/20', holiday: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
    weekend: 'bg-white/[0.04] text-gray-600 border-white/[0.04]',
  }
  const progress = Math.min((hoursWorked / totalHoursTarget) * 100, 100)
  const circumference = 2 * Math.PI * 52

  const handleClockToggle = () => {
    setClockedIn(!clockedIn)
    showToast(clockedIn ? 'Clocked out successfully' : 'Clocked in successfully', 'success')
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
          <button onClick={handleClockToggle}
            className={`mt-3 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              clockedIn
                ? 'bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25'
                : 'bg-teal-500/15 text-teal-400 border border-teal-500/25 hover:bg-teal-500/25'
            }`}
          >
            {clockedIn ? 'Clock Out' : 'Clock In'}
          </button>
        </AdminGlass>

        {/* Summary Cards */}
        <AdminGlass className="lg:col-span-2">
          <SectionHeader title="February 2026 Summary" icon={BarChart3} />
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
          {/* Feb 2026 starts on Sunday — offset 6 blanks */}
          {Array.from({ length: 6 }).map((_, i) => <div key={`blank-${i}`} />)}
          {attendanceDays.map(d => (
            <div key={d.day} className={`text-center py-2 rounded-lg text-xs font-medium border ${statusColors[d.status]}`}>
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
  const balances: { type: string; total: number; used: number; available: number }[] = []
  const history: { id: string; type: string; from: string; to: string; days: number; reason: string; status: string }[] = []
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
          <button onClick={async () => {
            if (!leaveForm.type || !leaveForm.fromDate || !leaveForm.reason.trim()) { showToast('Please fill in leave type, dates, and reason', 'warning'); return }
            const row = await insertRow('tickets', { title: `Leave Request: ${leaveForm.type}`, description: leaveForm.reason, type: 'leave_request', category: leaveForm.type, status: 'open', priority: 'normal', metadata: { from_date: leaveForm.fromDate, to_date: leaveForm.toDate || leaveForm.fromDate, half_day: leaveForm.halfDay } })
            if (row) { showToast('Leave application submitted', 'success') } else { showToast('Failed to submit leave application', 'error') }
            setLeaveForm({ type: '', fromDate: '', toDate: '', halfDay: 'Full Day', reason: '' })
          }}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/25 hover:bg-teal-500/25 transition-colors">
            Submit Application
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
function PayslipsView({ showToast }: { showToast: SelfServiceModuleProps['showToast'] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const base = { basic: 0, hra: 0, special: 0, conveyance: 0, medical: 0, pf: 0, esi: 0, pt: 0 }
  const payslips: { id: string; month: string; payDate: string; basic: number; hra: number; special: number; conveyance: number; medical: number; pf: number; esi: number; pt: number; tds: number; gross: number; deductions: number; net: number }[] = []
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`

  return (
    <div className="space-y-5">
      <SectionHeader title="Salary Payslips" icon={IndianRupee} />
      {payslips.map(p => (
        <AdminGlass key={p.id}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{p.month}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Paid on {p.payDate} &middot; {p.id}</p>
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
                showToast(`Downloading ${p.month} payslip...`, 'info')
                const content = `GHL India Ventures — Payslip\n\nEmployee: Staff Member\nMonth: ${p.month}\nPay Date: ${p.payDate}\n\nGross Salary: ${fmt(p.gross)}\nDeductions: ${fmt(p.deductions)}\nTDS: ${fmt(p.tds)}\nNet Salary: ${fmt(p.net)}`
                const blob = new Blob([content], { type: 'application/pdf' })
                const filename = `GHL_Payslip_${p.month.replace(' ', '_')}.pdf`
                await saveBlobAs(blob, filename, showToast as any)
              }}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
                <Download className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {expanded === p.id && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Earnings */}
                <div>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold mb-2">Earnings</p>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Basic Salary', value: p.basic },
                      { label: 'House Rent Allowance', value: p.hra },
                      { label: 'Special Allowance', value: p.special },
                      { label: 'Conveyance', value: p.conveyance },
                      { label: 'Medical Allowance', value: p.medical },
                    ].map(e => (
                      <div key={e.label} className="flex justify-between text-xs">
                        <span className="text-gray-400">{e.label}</span>
                        <span className="text-white font-medium">{fmt(e.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs pt-1.5 border-t border-white/[0.06] font-semibold">
                      <span className="text-gray-300">Gross Earnings</span>
                      <span className="text-emerald-400">{fmt(p.gross)}</span>
                    </div>
                  </div>
                </div>
                {/* Deductions */}
                <div>
                  <p className="text-[10px] text-red-400 uppercase tracking-wider font-semibold mb-2">Deductions</p>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Provident Fund (PF)', value: p.pf },
                      { label: 'ESI', value: p.esi },
                      { label: 'Professional Tax', value: p.pt },
                      { label: 'TDS (Income Tax)', value: p.tds },
                    ].map(d => (
                      <div key={d.label} className="flex justify-between text-xs">
                        <span className="text-gray-400">{d.label}</span>
                        <span className="text-white font-medium">{fmt(d.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs pt-1.5 border-t border-white/[0.06] font-semibold">
                      <span className="text-gray-300">Total Deductions</span>
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
  const documents: { name: string; folder: string; date: string; size: string; status: 'Verified' | 'Pending' }[] = []
  const requestLetters = ['Employment Verification', 'Salary Certificate', 'Experience Letter', 'Bonafide Certificate']

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
              <button className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                <Download className="w-3.5 h-3.5 text-gray-500" />
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
            if (successCount > 0) showToast(`Uploaded ${successCount} document(s) successfully`, 'success')
            else if (results.length > 0) showToast('Upload failed — please try again', 'info')
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
function ExpensesView({ showToast }: { showToast: SelfServiceModuleProps['showToast'] }) {
  const recentClaims: { id: string; date: string; category: string; description: string; amount: number; status: 'Pending' | 'Approved' | 'Reimbursed' | 'Rejected' }[] = []
  const monthlySummary = { submitted: 0, approved: 0, reimbursed: 0, pending: 0, totalAmount: 0 }

  const statusVariant = (s: string) => s === 'Approved' ? 'success' : s === 'Pending' ? 'warning' : s === 'Reimbursed' ? 'info' : 'error'

  return (
    <div className="space-y-5">
      {/* Monthly Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Claims', value: monthlySummary.submitted, icon: Receipt, color: 'text-white' },
          { label: 'Approved', value: monthlySummary.approved, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Reimbursed', value: monthlySummary.reimbursed, icon: IndianRupee, color: 'text-teal-400' },
          { label: 'Pending', value: monthlySummary.pending, icon: Timer, color: 'text-amber-400' },
          { label: 'Total Amount', value: `₹${monthlySummary.totalAmount.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-teal-400' },
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
            <select className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40">
              <option value="">Select</option>
              <option>Travel</option><option>Meals</option><option>Supplies</option>
              <option>Phone</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Date</label>
            <input type="date" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Amount (₹)</label>
            <input type="number" placeholder="0" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Receipt</label>
            <button onClick={async () => {
              const results = await pickAndUploadFiles('staff/expenses', {
                accept: '.pdf,.jpg,.jpeg,.png',
                multiple: false,
                portal: 'staff',
                category: 'expense-receipt',
              })
              if (results.length > 0 && results[0].success) showToast(`Receipt "${results[0].file?.name}" attached`, 'success')
              else if (results.length > 0) showToast('Upload failed', 'info')
            }}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-gray-500 hover:border-teal-500/40 transition-colors text-left flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Attach receipt
            </button>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Description</label>
          <input type="text" placeholder="Brief description of expense..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40" />
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={() => showToast('Expense claim submitted for approval', 'success')}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/25 hover:bg-teal-500/25 transition-colors">
            Submit Claim
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
              </tr>
            </thead>
            <tbody>
              {recentClaims.map(c => (
                <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-2.5 px-2 text-gray-400 font-mono">{c.id}</td>
                  <td className="py-2.5 px-2 text-gray-300">{c.date}</td>
                  <td className="py-2.5 px-2 text-white">{c.category}</td>
                  <td className="py-2.5 px-2 text-gray-400 max-w-[200px] truncate">{c.description}</td>
                  <td className="py-2.5 px-2 text-right text-white font-medium">₹{c.amount.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-2 text-center"><AdminBadge label={c.status} variant={statusVariant(c.status)} /></td>
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
