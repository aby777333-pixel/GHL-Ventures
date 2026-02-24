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
import { saveBlobAs } from '@/lib/supabase/storageService'

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
    name: 'Priya Natarajan', code: 'GHL001', designation: 'Customer Service Lead',
    status: 'Active', department: 'Customer Service', reportingTo: 'Rajesh Iyer (VP Operations)',
    shift: 'General (09:30 - 18:30)', pfNumber: 'TN/CHN/0012345/001', uan: '100987654321',
    dob: '15 March 1994', gender: 'Female', bloodGroup: 'O+', phone: '+91 98765 43210',
    email: 'priya.n@ghlindia.com', address: '42, Lakeview Apartments, Thiruvanmiyur, Chennai 600041',
    emergencyContact: 'Suresh Natarajan (Father) — +91 94432 11234',
  }
  const skills = [
    { name: 'Customer Service', level: 'Expert' }, { name: 'CRM Tools', level: 'Advanced' },
    { name: 'Financial Products', level: 'Advanced' }, { name: 'Conflict Resolution', level: 'Expert' },
    { name: 'Team Leadership', level: 'Intermediate' }, { name: 'Hindi', level: 'Fluent' },
    { name: 'Tamil', level: 'Native' }, { name: 'English', level: 'Fluent' },
  ]
  const documents = [
    { name: 'Aadhaar Card', type: 'ID Proof', uploaded: '12 Jan 2024', status: 'Verified' },
    { name: 'PAN Card', type: 'ID Proof', uploaded: '12 Jan 2024', status: 'Verified' },
    { name: 'B.Com Degree Certificate', type: 'Education', uploaded: '15 Jan 2024', status: 'Verified' },
    { name: 'Previous Experience Letter', type: 'Experience', uploaded: '15 Jan 2024', status: 'Pending' },
  ]
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
  const [clockedIn, setClockedIn] = useState(true)
  const clockInTime = '09:28 AM'
  const hoursWorked = 5.4
  const totalHoursTarget = 9

  const summary = { present: 18, leave: 1, holiday: 1, late: 2, avgHours: 8.2, totalDays: 22 }
  const attendanceDays: { day: number; status: string }[] = [
    { day: 1, status: 'present' }, { day: 2, status: 'present' }, { day: 3, status: 'present' },
    { day: 4, status: 'present' }, { day: 5, status: 'present' }, { day: 6, status: 'present' },
    { day: 7, status: 'holiday' }, { day: 8, status: 'weekend' }, { day: 9, status: 'present' },
    { day: 10, status: 'present' }, { day: 11, status: 'present' }, { day: 12, status: 'leave' },
    { day: 13, status: 'present' }, { day: 14, status: 'present' }, { day: 15, status: 'weekend' },
    { day: 16, status: 'present' }, { day: 17, status: 'present' }, { day: 18, status: 'present' },
    { day: 19, status: 'present' }, { day: 20, status: 'present' },
  ]

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
  const balances = [
    { type: 'Casual Leave', total: 12, used: 4, available: 8 },
    { type: 'Sick Leave', total: 8, used: 2, available: 6 },
    { type: 'Earned Leave', total: 15, used: 5, available: 10 },
    { type: 'Comp-off', total: 3, used: 1, available: 2 },
  ]
  const history = [
    { id: 'LV001', type: 'Casual', from: '10 Feb 2026', to: '10 Feb 2026', days: 1, reason: 'Personal work', status: 'Approved' },
    { id: 'LV002', type: 'Sick', from: '28 Jan 2026', to: '29 Jan 2026', days: 2, reason: 'Fever and cold', status: 'Approved' },
    { id: 'LV003', type: 'Casual', from: '15 Jan 2026', to: '15 Jan 2026', days: 1, reason: 'Family function', status: 'Approved' },
    { id: 'LV004', type: 'Earned', from: '25 Mar 2026', to: '28 Mar 2026', days: 4, reason: 'Planned vacation to Kerala', status: 'Pending' },
    { id: 'LV005', type: 'Comp-off', from: '05 Jan 2026', to: '05 Jan 2026', days: 1, reason: 'Worked on Sunday (28 Dec)', status: 'Approved' },
    { id: 'LV006', type: 'Casual', from: '20 Dec 2025', to: '20 Dec 2025', days: 1, reason: 'Bank visit', status: 'Rejected' },
  ]
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
            <select className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40">
              <option value="">Select type</option>
              <option>Casual Leave</option><option>Sick Leave</option>
              <option>Earned Leave</option><option>Comp-off</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">From Date</label>
            <input type="date" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">To Date</label>
            <input type="date" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Half Day?</label>
            <select className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40">
              <option>Full Day</option><option>First Half</option><option>Second Half</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Reason</label>
          <textarea rows={2} placeholder="Enter reason for leave..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40 resize-none" />
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={() => showToast('Leave application submitted', 'success')}
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

  const base = { basic: 25000, hra: 12500, special: 10000, conveyance: 1600, medical: 1250, pf: 3000, esi: 750, pt: 200 }
  const payslips = [
    { id: 'PS-2026-01', month: 'January 2026', payDate: '01 Feb 2026', ...base, tds: 2500, gross: 50350, deductions: 6450, net: 43900 },
    { id: 'PS-2025-12', month: 'December 2025', payDate: '01 Jan 2026', ...base, tds: 2500, gross: 50350, deductions: 6450, net: 43900 },
    { id: 'PS-2025-11', month: 'November 2025', payDate: '01 Dec 2025', ...base, tds: 2300, gross: 50350, deductions: 6250, net: 44100 },
  ]
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
  const folders = [
    { name: 'Offer Letter', icon: FileText, count: 1 }, { name: 'ID Proofs', icon: Shield, count: 2 },
    { name: 'Education', icon: GraduationCap, count: 2 }, { name: 'Experience', icon: Briefcase, count: 1 },
    { name: 'Certifications', icon: Award, count: 2 },
  ]
  const documents = [
    { name: 'Offer Letter — GHL India', folder: 'Offer Letter', date: '05 Jan 2024', size: '245 KB', status: 'Verified' as const },
    { name: 'Aadhaar Card', folder: 'ID Proofs', date: '12 Jan 2024', size: '1.2 MB', status: 'Verified' as const },
    { name: 'PAN Card', folder: 'ID Proofs', date: '12 Jan 2024', size: '480 KB', status: 'Verified' as const },
    { name: 'B.Com Degree — University of Madras', folder: 'Education', date: '15 Jan 2024', size: '3.1 MB', status: 'Verified' as const },
    { name: 'HSC Marksheet', folder: 'Education', date: '15 Jan 2024', size: '2.4 MB', status: 'Pending' as const },
    { name: 'Experience Letter — Kotak AMC', folder: 'Experience', date: '15 Jan 2024', size: '310 KB', status: 'Pending' as const },
    { name: 'NISM Series V-A Mutual Fund Cert', folder: 'Certifications', date: '20 Feb 2024', size: '180 KB', status: 'Verified' as const },
    { name: 'CRM Professional Certification', folder: 'Certifications', date: '10 Jun 2024', size: '210 KB', status: 'Verified' as const },
  ]
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
          onClick={() => showToast('File picker would open here', 'info')}>
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
  const modules = [
    { id: 'T01', name: 'SEBI AIF Regulations 2024-25', category: 'Compliance', type: 'Document + Quiz', progress: 100, status: 'Completed', score: 92 as number | undefined, mandatory: true, duration: '4 hours' },
    { id: 'T02', name: 'Anti-Money Laundering (AML/KYC)', category: 'Compliance', type: 'Video + Quiz', progress: 100, status: 'Completed', score: 88 as number | undefined, mandatory: true, duration: '3 hours' },
    { id: 'T03', name: 'GHL Product Suite — AIF Cat II', category: 'Product Knowledge', type: 'Live Session', progress: 75, status: 'In Progress', score: undefined, mandatory: true, duration: '6 hours' },
    { id: 'T04', name: 'Advanced Communication Skills', category: 'CS Skills', type: 'Video Series', progress: 60, status: 'In Progress', score: undefined, mandatory: false, duration: '5 hours' },
    { id: 'T05', name: 'CRM Platform — Salesforce Basics', category: 'Technical', type: 'Interactive Module', progress: 40, status: 'In Progress', score: undefined, mandatory: false, duration: '8 hours' },
    { id: 'T06', name: 'Data Privacy & Information Security', category: 'Compliance', type: 'Document + Quiz', progress: 0, status: 'Not Started', score: undefined, mandatory: true, duration: '2 hours' },
  ]
  const certifications = [
    { name: 'NISM Series V-A — Mutual Fund Distributors', issuer: 'NISM', date: 'Feb 2024', valid: 'Feb 2027' },
    { name: 'SEBI AIF Compliance Associate', issuer: 'GHL Academy', date: 'Nov 2024', valid: 'Nov 2025' },
    { name: 'CRM Professional — Salesforce Trailhead', issuer: 'Salesforce', date: 'Jun 2024', valid: 'Jun 2026' },
  ]
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
  const kras = [
    { goal: 'Customer Satisfaction (CSAT)', target: '90%+', actual: '92.5%', weight: 30, selfRating: 4.5 },
    { goal: 'Ticket Resolution Rate', target: '95%+', actual: '96.2%', weight: 25, selfRating: 4.0 },
    { goal: 'Average Handling Time', target: '<8 min', actual: '7.2 min', weight: 20, selfRating: 4.0 },
    { goal: 'Team Mentorship & Training', target: '4 sessions/quarter', actual: '3 done', weight: 25, selfRating: 3.5 },
  ]
  const csMetrics = [
    { label: 'Tickets Resolved (Feb)', value: '142', icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'CSAT Score', value: '92.5%', icon: Star, color: 'text-amber-400' },
    { label: 'Avg Handling Time', value: '7.2 min', icon: Timer, color: 'text-teal-400' },
    { label: 'First Call Resolution', value: '88%', icon: Phone, color: 'text-blue-400' },
    { label: 'Escalation Rate', value: '3.1%', icon: TrendingUp, color: 'text-purple-400' },
    { label: 'Quality Score', value: '4.2/5', icon: Award, color: 'text-teal-400' },
  ]
  const feedbacks = [
    { from: 'Rajesh Iyer (VP Ops)', date: 'Jan 2026', text: 'Priya continues to demonstrate strong leadership in the CS team. Her proactive handling of escalations has improved team morale.' },
    { from: 'Anil Mehta (HR)', date: 'Dec 2025', text: 'Excellent participation in the SEBI compliance training. Scored among the top 5 in the department.' },
    { from: 'Client Feedback', date: 'Feb 2026', text: 'Very professional and patient. Resolved my NAV query within minutes. Highly satisfied.' },
  ]

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
          {[
            { quarter: 'Q1', score: 3.8 }, { quarter: 'Q2', score: 4.0 },
            { quarter: 'Q3', score: 4.2 }, { quarter: 'Q4*', score: 4.3 },
          ].map(q => (
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
  const recentClaims = [
    { id: 'EXP-2026-018', date: '18 Feb 2026', category: 'Travel', description: 'Client visit — Uber to Adyar & back', amount: 680, status: 'Pending' as const },
    { id: 'EXP-2026-012', date: '10 Feb 2026', category: 'Meals', description: 'Team lunch — client escalation meeting', amount: 1250, status: 'Approved' as const },
    { id: 'EXP-2026-005', date: '03 Feb 2026', category: 'Supplies', description: 'Headset replacement for CS desk', amount: 2100, status: 'Approved' as const },
    { id: 'EXP-2026-001', date: '22 Jan 2026', category: 'Travel', description: 'Auto fare — OMR to T. Nagar branch', amount: 450, status: 'Reimbursed' as const },
  ]
  const monthlySummary = { submitted: 4, approved: 2, reimbursed: 1, pending: 1, totalAmount: 4480 }

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
            <button onClick={() => showToast('File picker would open here', 'info')}
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
