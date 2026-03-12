'use client'

import { useState } from 'react'
import {
  MapPin, Camera, Mic, LogIn, FileText, Receipt, AlertTriangle,
  Clock, Users, TrendingUp, Navigation, CheckCircle2, XCircle,
  Calendar, Image, Upload, Send, Sparkles, Route, Target,
  Trophy, Medal, Flame, Star, Zap, Eye, Phone, Mail,
  Building2, IndianRupee, BarChart3, ChevronRight, Play,
  MapPinned, Timer, Footprints, Shield, Wifi, WifiOff,
  ArrowUpRight, ArrowDownRight, Plus, MoreHorizontal,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import AdminGlass from '@/components/admin/shared/AdminGlass'
import AdminBadge from '@/components/admin/shared/AdminBadge'
import AdminKPICard from '@/components/admin/shared/AdminKPICard'
import AdminDataTable, { type Column } from '@/components/admin/shared/AdminDataTable'
import AdminModal from '@/components/admin/shared/AdminModal'
import AdminEmptyState from '@/components/admin/shared/AdminEmptyState'
import UploadWithFolderPicker from '@/components/shared/UploadWithFolderPicker'
import { insertRow } from '@/lib/supabase/adminDataService'

// ── Props ─────────────────────────────────────────────────────────
interface FieldOpsModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

// ── Data arrays (populated from Supabase when available) ─────────
const CHECKINS: { id: string; location: string; lat: number; lng: number; time: string; date: string; duration: string; status: string }[] = []
const SITE_VISITS: { id: string; date: string; site: string; purpose: string; status: string; duration: string; media: number; report: string }[] = []
const MEDIA_ITEMS: { id: string; name: string; tag: string; site: string; date: string; synced: boolean }[] = []
const REPORTS: { id: string; title: string; type: string; status: string; date: string; pages: number }[] = []
const ROUTE_STOPS: { seq: number; location: string; time: string; eta: string; distance: string; type: string }[] = []
const PROSPECTS: { id: string; name: string; company: string; phone: string; deal: number; probability: number; stage: string; nextAction: string; lastMeet: string }[] = []
const EXPENSES: { id: string; date: string; category: string; description: string; amount: number; status: string; receipt: boolean }[] = []
const LEADERBOARD: { rank: number; name: string; visits: number; prospects: number; pipeline: number; closed: number; score: number; badges: string[] }[] = []

const PIPELINE_STAGES = ['Initial Contact', 'Site Visit', 'Proposal', 'Negotiation', 'Confirmed'] as const

const VISIT_CHART: { day: string; visits: number }[] = []

// ── Helpers ───────────────────────────────────────────────────────
const fmtINR = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  return `₹${n.toLocaleString('en-IN')}`
}

const visitStatusVariant = (s: string) => {
  switch (s) {
    case 'Completed': return 'success'
    case 'Scheduled': return 'info'
    case 'Cancelled': return 'neutral'
    case 'Overdue': return 'error'
    default: return 'neutral' as const
  }
}

// ── SOS Floating Button ───────────────────────────────────────────
function SOSButton({ showToast }: { showToast: FieldOpsModuleProps['showToast'] }) {
  return (
    <button
      onClick={() => showToast('SOS Alert sent to HQ with GPS coordinates!', 'error')}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 flex items-center justify-center transition-all hover:scale-110 animate-pulse"
      title="Emergency SOS"
    >
      <AlertTriangle className="w-6 h-6" />
    </button>
  )
}

// ══════════════════════════════════════════════════════════════════
// 1. FIELD DASHBOARD
// ══════════════════════════════════════════════════════════════════
function FieldDashboard({ navigate, showToast }: FieldOpsModuleProps) {
  const quickActions = [
    { label: 'Quick Capture', icon: Camera, color: 'text-teal-400', bg: 'bg-teal-500/15', action: () => navigate('field/capture') },
    { label: 'Voice Note', icon: Mic, color: 'text-amber-400', bg: 'bg-amber-500/15', action: () => showToast('Recording voice note...', 'info') },
    { label: 'Check In', icon: LogIn, color: 'text-blue-400', bg: 'bg-blue-500/15', action: () => navigate('field/check-in') },
    { label: 'New Report', icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/15', action: () => navigate('field/reports') },
    { label: 'Log Expense', icon: Receipt, color: 'text-emerald-400', bg: 'bg-emerald-500/15', action: () => navigate('field/expenses') },
    { label: 'SOS', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20 border border-red-500/30', action: () => showToast('SOS Alert sent to HQ with GPS!', 'error') },
  ]

  const schedule: { time: string; title: string; status: string }[] = []
  const recentActivity: { time: string; text: string; icon: typeof LogIn }[] = []

  return (
    <div className="space-y-6">
      {/* Location Bar */}
      <AdminGlass padding="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-400" />
            <span className="text-white font-medium">Location unavailable</span>
            <span className="text-xs text-gray-500">Enable GPS to track</span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400">Online</span>
          </div>
        </div>
      </AdminGlass>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {quickActions.map(a => (
          <button key={a.label} onClick={a.action} className="group">
            <AdminGlass padding="p-3" className="text-center">
              <div className={`w-10 h-10 mx-auto rounded-xl ${a.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                <a.icon className={`w-5 h-5 ${a.color}`} />
              </div>
              <p className="text-[11px] text-gray-400 group-hover:text-white transition-colors">{a.label}</p>
            </AdminGlass>
          </button>
        ))}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminKPICard title="Visits Today" value="—" icon={MapPinned} color="#14B8A6" />
        <AdminKPICard title="Prospects Met" value="—" icon={Users} color="#F59E0B" />
        <AdminKPICard title="Pipeline" value="—" icon={TrendingUp} color="#8B5CF6" />
        <AdminKPICard title="Distance" value="—" icon={Navigation} color="#3B82F6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-400" /> Today&apos;s Schedule
          </h3>
          {schedule.length === 0 ? (
            <AdminEmptyState title="No schedule" description="Today's schedule will appear here." />
          ) : (
            <div className="space-y-1">
              {schedule.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <span className="text-xs text-gray-500 w-16 shrink-0">{s.time}</span>
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.status === 'done' ? 'bg-emerald-400' : s.status === 'current' ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'}`} />
                  <span className={`text-sm ${s.status === 'done' ? 'text-gray-500 line-through' : s.status === 'current' ? 'text-white font-medium' : 'text-gray-400'}`}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </AdminGlass>

        {/* Recent Activity */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Recent Activity
          </h3>
          {recentActivity.length === 0 ? (
            <AdminEmptyState title="No recent activity" description="Your field activity will appear here." />
          ) : (
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <a.icon className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300">{a.text}</p>
                    <p className="text-[11px] text-gray-600">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminGlass>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 2. GPS CHECK-IN
// ══════════════════════════════════════════════════════════════════
function GPSCheckIn({ showToast }: FieldOpsModuleProps) {
  const [checkedIn, setCheckedIn] = useState(false)

  return (
    <div className="space-y-6">
      {/* Check In/Out Button */}
      <AdminGlass padding="p-8" className="text-center">
        <button
          onClick={() => { setCheckedIn(!checkedIn); showToast(checkedIn ? 'Checked out successfully' : 'Checked in at current location', 'success') }}
          className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-white text-lg font-bold transition-all hover:scale-105 ${checkedIn ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/30' : 'bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-600/30'}`}
        >
          <div className="text-center">
            <LogIn className="w-8 h-8 mx-auto mb-1" />
            <span className="text-sm">{checkedIn ? 'Check Out' : 'Check In'}</span>
          </div>
        </button>
        <p className="text-gray-400 text-sm mt-4">
          {checkedIn ? 'Currently checked in at your location' : 'Tap to check in at your current location'}
        </p>
      </AdminGlass>

      {/* Map Placeholder */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-teal-400" /> Check-in Map
        </h3>
        <div className="h-48 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPinned className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Interactive map showing check-in points</p>
            <p className="text-[10px] text-gray-600 mt-1">Check-in locations will appear here</p>
          </div>
        </div>
      </AdminGlass>

      {/* Check-in History */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4">Check-in History</h3>
        <div className="space-y-2">
          {CHECKINS.map(ci => (
            <div key={ci.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{ci.location}</p>
                  <p className="text-[11px] text-gray-500">{ci.date} at {ci.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-gray-400">{ci.duration}</span>
                <AdminBadge label={ci.status === 'completed' ? 'Done' : 'Missed'} variant={ci.status === 'completed' ? 'success' : 'error'} dot />
              </div>
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 3. SITE VISITS
// ══════════════════════════════════════════════════════════════════
function SiteVisits({ showToast }: FieldOpsModuleProps) {
  const visitColumns: Column<typeof SITE_VISITS[0]>[] = [
    { key: 'date', label: 'Date', width: '100px' },
    { key: 'site', label: 'Site', render: r => <span className="text-white font-medium">{r.site}</span> },
    { key: 'purpose', label: 'Purpose' },
    { key: 'status', label: 'Status', render: r => <AdminBadge label={r.status} variant={visitStatusVariant(r.status)} dot /> },
    { key: 'duration', label: 'Duration' },
    { key: 'media', label: 'Media', render: r => r.media > 0 ? <span className="flex items-center gap-1"><Image className="w-3.5 h-3.5 text-teal-400" />{r.media}</span> : <span className="text-gray-600">—</span> },
    { key: 'report', label: 'Report', render: r => <AdminBadge label={r.report} variant={r.report === 'Submitted' ? 'success' : r.report === 'Draft' ? 'warning' : r.report === 'Missing' ? 'error' : 'neutral'} /> },
  ]

  return (
    <div className="space-y-6">
      {/* Weekly Calendar Placeholder */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-400" /> This Week
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
            <div key={d} className={`text-center py-3 rounded-lg ${i === 6 ? 'bg-teal-500/10 border border-teal-500/20' : 'bg-white/[0.03]'}`}>
              <p className="text-[10px] text-gray-500 uppercase">{d}</p>
              <p className={`text-lg font-bold mt-1 ${i === 6 ? 'text-teal-400' : 'text-gray-400'}`}>{16 + i}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">—</p>
            </div>
          ))}
        </div>
      </AdminGlass>

      {/* Visit Chart */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-3">Visits This Week</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={VISIT_CHART}>
              <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} {...({} as any)} />
              <Bar dataKey="visits" fill="#14B8A6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AdminGlass>

      {/* Visits Table */}
      <AdminGlass padding="p-0">
        <div className="p-5 pb-0">
          <AdminDataTable
            columns={visitColumns}
            data={SITE_VISITS}
            title="All Site Visits"
            searchable
            searchPlaceholder="Search visits..."
            searchKeys={['site', 'purpose', 'status']}
            exportable
            pageSize={8}
          />
        </div>
      </AdminGlass>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 4. MEDIA CAPTURE
// ══════════════════════════════════════════════════════════════════
function MediaCapture({ showToast }: FieldOpsModuleProps) {
  return (
    <div className="space-y-6">
      {/* Camera Interface Placeholder */}
      <AdminGlass padding="p-0">
        <div className="relative h-56 bg-gradient-to-b from-gray-900 to-black rounded-2xl overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <Camera className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Camera Interface</p>
            <p className="text-[11px] text-gray-600 mt-1">GPS watermark + timestamp overlay</p>
          </div>
          {/* Watermark overlay concept */}
          <div className="absolute bottom-3 left-3 text-[10px] text-teal-400/60 font-mono">
            <p>GPS coordinates</p>
            <p>Timestamp overlay</p>
          </div>
          <div className="absolute bottom-3 right-3">
            <button onClick={() => showToast('Photo captured with GPS watermark!', 'success')} className="w-14 h-14 rounded-full bg-white/20 border-2 border-white flex items-center justify-center hover:bg-white/30 transition-colors">
              <div className="w-10 h-10 rounded-full bg-white" />
            </button>
          </div>
        </div>
      </AdminGlass>

      {/* Upload/Sync Status */}
      <AdminGlass padding="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-white">Sync Status</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{MEDIA_ITEMS.filter(m => m.synced).length}/{MEDIA_ITEMS.length} synced</span>
            <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: MEDIA_ITEMS.length > 0 ? `${Math.round((MEDIA_ITEMS.filter(m => m.synced).length / MEDIA_ITEMS.length) * 100)}%` : '0%' }} />
            </div>
          </div>
        </div>
      </AdminGlass>

      {/* Media Library Grid */}
      <AdminGlass>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Image className="w-4 h-4 text-amber-400" /> Media Library
          </h3>
          <button onClick={() => showToast('Opening send dialog...', 'info')} className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors">
            <Send className="w-3.5 h-3.5" /> Send to...
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {MEDIA_ITEMS.map(m => (
            <div key={m.id} className="group relative rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-teal-500/30 transition-colors">
              <div className="h-24 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <Image className="w-6 h-6 text-gray-600" />
              </div>
              <div className="p-2">
                <p className="text-xs text-white truncate">{m.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-500">{m.tag}</span>
                  {m.synced ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Upload className="w-3 h-3 text-amber-400 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 5. REPORTS
// ══════════════════════════════════════════════════════════════════
function ReportsPanel({ showToast }: FieldOpsModuleProps) {
  const reportStatusVariant = (s: string) => {
    switch (s) {
      case 'Submitted': return 'success'
      case 'Draft': return 'warning'
      case 'Under Review': return 'info'
      case 'Approved': return 'success'
      default: return 'neutral' as const
    }
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => showToast('Creating new report...', 'info')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-600/20 border border-teal-500/30 hover:bg-teal-600/30 transition-colors">
          <Plus className="w-4 h-4" /> New Report
        </button>
        <button onClick={() => showToast('AI is drafting your weekly summary...', 'info')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-amber-600/20 border border-amber-500/30 hover:bg-amber-600/30 transition-colors">
          <Sparkles className="w-4 h-4" /> AI Auto-Draft
        </button>
      </div>

      {/* Report List */}
      <div className="space-y-3">
        {REPORTS.map(r => (
          <AdminGlass key={r.id} padding="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{r.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-gray-500">{r.type}</span>
                    <span className="text-[11px] text-gray-600">|</span>
                    <span className="text-[11px] text-gray-500">{r.date}</span>
                    <span className="text-[11px] text-gray-600">|</span>
                    <span className="text-[11px] text-gray-500">{r.pages} pages</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <AdminBadge label={r.status} variant={reportStatusVariant(r.status)} dot />
                <button className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                  <Eye className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </AdminGlass>
        ))}
      </div>

      {/* Report Builder Placeholder */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-400" /> Report Builder
        </h3>
        <div className="h-36 rounded-xl bg-white/[0.03] border border-white/[0.06] border-dashed flex items-center justify-center">
          <div className="text-center text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Drag sections to build your report</p>
            <p className="text-[10px] text-gray-600 mt-1">Templates: Site Visit | Weekly | Expense | Market Intel</p>
          </div>
        </div>
      </AdminGlass>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 6. ROUTE PLANNER
// ══════════════════════════════════════════════════════════════════
function RoutePlanner({ showToast }: FieldOpsModuleProps) {
  return (
    <div className="space-y-6">
      {/* Route Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminKPICard title="Total Stops" value={ROUTE_STOPS.length.toString() || '—'} icon={MapPin} color="#14B8A6" />
        <AdminKPICard title="Total Distance" value="—" icon={Navigation} color="#3B82F6" />
        <AdminKPICard title="Est. Drive Time" value="—" icon={Timer} color="#F59E0B" />
        <AdminKPICard title="Est. Completion" value="—" icon={Clock} color="#8B5CF6" />
      </div>

      {/* AI Optimize Button */}
      <button onClick={() => showToast('AI optimized your route — saved 12 min & 4.2 km!', 'success')} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-teal-600/20 to-amber-600/20 border border-teal-500/20 hover:border-teal-500/40 transition-colors">
        <Sparkles className="w-4 h-4 text-amber-400" /> AI Route Optimization
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stops List */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Route className="w-4 h-4 text-teal-400" /> Today&apos;s Stops
          </h3>
          <div className="space-y-1">
            {ROUTE_STOPS.map((stop, i) => (
              <div key={stop.seq} className="flex gap-3 py-3">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-teal-500 text-white' : 'bg-white/[0.06] text-gray-400'}`}>
                    {stop.seq}
                  </div>
                  {i < ROUTE_STOPS.length - 1 && <div className="w-px h-8 bg-white/[0.08] mt-1" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{stop.location}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-gray-500">{stop.time}</span>
                    {stop.eta !== '—' && (
                      <span className="text-[10px] text-teal-400 flex items-center gap-1">
                        <Navigation className="w-3 h-3" /> {stop.distance} — {stop.eta}
                      </span>
                    )}
                  </div>
                  <AdminBadge label={stop.type} variant="info" size="sm" />
                </div>
              </div>
            ))}
          </div>
        </AdminGlass>

        {/* Map Placeholder */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <MapPinned className="w-4 h-4 text-amber-400" /> Route Map
          </h3>
          <div className="h-72 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Route className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Route map will appear here</p>
              <p className="text-[10px] text-gray-600 mt-1">Add stops to plan your route</p>
            </div>
          </div>
        </AdminGlass>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 7. PROSPECTS
// ══════════════════════════════════════════════════════════════════
function ProspectsPanel({ showToast }: FieldOpsModuleProps) {
  const stageColor = (s: string) => {
    switch (s) {
      case 'Initial Contact': return 'bg-blue-500/15 text-blue-400 border-blue-500/20'
      case 'Site Visit': return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20'
      case 'Proposal': return 'bg-amber-500/15 text-amber-400 border-amber-500/20'
      case 'Negotiation': return 'bg-orange-500/15 text-orange-400 border-orange-500/20'
      case 'Confirmed': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
      default: return 'bg-gray-500/15 text-gray-400 border-gray-500/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Stages Bar */}
      <AdminGlass padding="p-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {PIPELINE_STAGES.map((stage, i) => {
            const count = PROSPECTS.filter(p => p.stage === stage).length
            return (
              <div key={stage} className="flex items-center gap-1 shrink-0">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${stageColor(stage)}`}>
                  {stage} ({count})
                </div>
                {i < PIPELINE_STAGES.length - 1 && <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />}
              </div>
            )
          })}
        </div>
      </AdminGlass>

      {/* Prospect Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROSPECTS.map(p => (
          <AdminGlass key={p.id} padding="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-white font-semibold">{p.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3" /> {p.company}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${stageColor(p.stage)}`}>{p.stage}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Deal Value</p>
                <p className="text-sm text-white font-bold">{fmtINR(p.deal)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Probability</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.probability >= 70 ? 'bg-emerald-500' : p.probability >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${p.probability}%` }} />
                  </div>
                  <span className="text-xs text-gray-400">{p.probability}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <div>
                <p className="text-[10px] text-gray-500">Next: {p.nextAction}</p>
                {p.lastMeet !== '—' && <p className="text-[10px] text-gray-600">Last met: {p.lastMeet}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => showToast(`Calling ${p.name}...`, 'info')} className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                  <Phone className="w-3.5 h-3.5 text-teal-400" />
                </button>
                <button onClick={() => showToast(`Emailing ${p.name}...`, 'info')} className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            </div>
          </AdminGlass>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 8. PIPELINE (Kanban)
// ══════════════════════════════════════════════════════════════════
function PipelineKanban({ showToast }: FieldOpsModuleProps) {
  const totalPipeline = PROSPECTS.reduce((s, p) => s + p.deal, 0)
  const confirmedValue = PROSPECTS.filter(p => p.stage === 'Confirmed').reduce((s, p) => s + p.deal, 0)
  const monthlyTarget = 50000000

  return (
    <div className="space-y-6">
      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AdminKPICard title="Total Pipeline" value={fmtINR(totalPipeline)} icon={TrendingUp} color="#14B8A6" trend="up" trendValue="18%" />
        <AdminKPICard title="Confirmed" value={fmtINR(confirmedValue)} icon={CheckCircle2} color="#10B981" />
        <AdminKPICard title="Active Deals" value={PROSPECTS.filter(p => p.stage !== 'Confirmed').length} icon={Target} color="#F59E0B" />
      </div>

      {/* Monthly Target Progress */}
      <AdminGlass padding="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white font-medium">Monthly Target</span>
          <span className="text-xs text-gray-400">{fmtINR(confirmedValue)} / {fmtINR(monthlyTarget)}</span>
        </div>
        <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-500 to-amber-500 rounded-full transition-all" style={{ width: `${Math.min(100, (confirmedValue / monthlyTarget) * 100)}%` }} />
        </div>
        <p className="text-[11px] text-gray-500 mt-1.5">{Math.round((confirmedValue / monthlyTarget) * 100)}% achieved</p>
      </AdminGlass>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const stageDeals = PROSPECTS.filter(p => p.stage === stage)
          const stageValue = stageDeals.reduce((s, p) => s + p.deal, 0)
          return (
            <div key={stage} className="min-w-[260px] flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stage}</h4>
                <span className="text-[10px] text-gray-500">{fmtINR(stageValue)}</span>
              </div>
              <div className="space-y-2">
                {stageDeals.length === 0 && (
                  <div className="py-8 text-center text-gray-600 text-xs rounded-xl border border-dashed border-white/[0.06]">No deals</div>
                )}
                {stageDeals.map(deal => (
                  <AdminGlass key={deal.id} padding="p-3" className="cursor-grab">
                    <p className="text-sm text-white font-medium">{deal.name}</p>
                    <p className="text-[11px] text-gray-500">{deal.company}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-teal-400 font-bold">{fmtINR(deal.deal)}</span>
                      <span className="text-[10px] text-gray-500">{deal.probability}%</span>
                    </div>
                  </AdminGlass>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 9. EXPENSES
// ══════════════════════════════════════════════════════════════════
function ExpensesPanel({ showToast }: FieldOpsModuleProps) {
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [folderPickerOpen, setFolderPickerOpen] = useState(false)
  const [expForm, setExpForm] = useState({ type: 'Travel', description: '', amount: '', date: '', notes: '' })
  const totalExpenses = EXPENSES.reduce((s, e) => s + e.amount, 0)
  const approvedExpenses = EXPENSES.filter(e => e.status === 'Approved').reduce((s, e) => s + e.amount, 0)

  const expenseStatusVariant = (s: string) => {
    switch (s) {
      case 'Approved': return 'success'
      case 'Pending': return 'warning'
      case 'Under Review': return 'info'
      case 'Rejected': return 'error'
      default: return 'neutral' as const
    }
  }

  const categoryIcon = (c: string) => {
    switch (c) {
      case 'Travel': return Navigation
      case 'Meals': return Users
      case 'Fuel': return Footprints
      case 'Stay': return Building2
      default: return Receipt
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AdminKPICard title="Total Claimed" value={`₹${totalExpenses.toLocaleString('en-IN')}`} icon={Receipt} color="#F59E0B" />
        <AdminKPICard title="Approved" value={`₹${approvedExpenses.toLocaleString('en-IN')}`} icon={CheckCircle2} color="#10B981" />
        <AdminKPICard title="Pending" value={`₹${(totalExpenses - approvedExpenses).toLocaleString('en-IN')}`} icon={Clock} color="#EF4444" />
      </div>

      {/* Quick Submit */}
      <button onClick={() => setAddExpenseOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white bg-teal-600/20 border border-teal-500/30 hover:bg-teal-600/30 transition-colors">
        <Plus className="w-4 h-4" /> Submit New Expense
      </button>

      {/* Receipt AI Capture */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" /> Receipt AI Capture
        </h3>
        <div className="h-28 rounded-xl bg-white/[0.03] border border-dashed border-white/[0.1] flex items-center justify-center cursor-pointer hover:border-teal-500/30 transition-colors">
          <div className="text-center text-gray-500">
            <Camera className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
            <p className="text-xs">Snap or upload receipt for AI extraction</p>
          </div>
        </div>
      </AdminGlass>

      {/* Expense List */}
      <div className="space-y-2">
        {EXPENSES.map(e => {
          const CatIcon = categoryIcon(e.category)
          return (
            <AdminGlass key={e.id} padding="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                    <CatIcon className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{e.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-500">{e.category}</span>
                      <span className="text-[11px] text-gray-600">|</span>
                      <span className="text-[11px] text-gray-500">{e.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm text-white font-bold">₹{e.amount.toLocaleString('en-IN')}</span>
                  <AdminBadge label={e.status} variant={expenseStatusVariant(e.status)} dot />
                  {e.receipt && <span title="Receipt attached"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /></span>}
                </div>
              </div>
            </AdminGlass>
          )
        })}
      </div>

      {/* Add Expense Modal */}
      <AdminModal isOpen={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} title="Submit New Expense" maxWidth="max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Expense Type</label>
            <select value={expForm.type} onChange={e => setExpForm({ ...expForm, type: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20">
              {['Travel', 'Food', 'Stay', 'Office Supplies', 'Client Entertainment', 'Fuel', 'Phone/Internet', 'Miscellaneous'].map(t => (
                <option key={t} value={t} className="bg-neutral-900">{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Amount (INR) *</label>
            <input type="number" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} placeholder="0" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description *</label>
            <input value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} placeholder="What was this expense for?" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Date *</label>
            <input type="date" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Attach Receipt</label>
            <button onClick={() => setFolderPickerOpen(true)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors w-full">
              <Upload className="w-4 h-4" /> Upload Receipt
            </button>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
            <textarea value={expForm.notes} onChange={e => setExpForm({ ...expForm, notes: e.target.value })} rows={2} placeholder="Additional notes..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
          <button onClick={() => setAddExpenseOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">Cancel</button>
          <button onClick={async () => { if (!expForm.description.trim() || !expForm.amount) { showToast('Description and amount are required', 'error'); return } const row = await insertRow('expenses', { category: expForm.type, description: expForm.description, amount: Number(expForm.amount), date: expForm.date || new Date().toISOString().slice(0, 10), notes: expForm.notes, status: 'pending' }); if (row) { showToast('Expense submitted successfully', 'success') } else { showToast('Failed to submit expense', 'error') } setAddExpenseOpen(false); setExpForm({ type: 'Travel', description: '', amount: '', date: '', notes: '' }) }} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors">Submit Expense</button>
        </div>
      </AdminModal>
      <UploadWithFolderPicker
        open={folderPickerOpen}
        onClose={() => setFolderPickerOpen(false)}
        defaultRoute="staff/expenses"
        showToast={showToast as any}
        onUploadComplete={(results) => {
          const ok = results.filter(r => r.success).length
          if (ok > 0) showToast(`${ok} receipt(s) uploaded`, 'success')
        }}
        theme="teal"
        portal="staff"
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 10. LEADERBOARD
// ══════════════════════════════════════════════════════════════════
function LeaderboardPanel({ showToast }: FieldOpsModuleProps) {
  const BADGE_CONFIG: Record<string, { icon: typeof Trophy; color: string; bg: string }> = {
    'Road Warrior': { icon: Footprints, color: 'text-teal-400', bg: 'bg-teal-500/15' },
    'Sharpshooter': { icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/15' },
    'Closer': { icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    'Explorer': { icon: MapPin, color: 'text-blue-400', bg: 'bg-blue-500/15' },
    'Marathon': { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/15' },
  }

  const rankMedal = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-400" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return <span className="text-sm text-gray-500 w-5 text-center font-bold">{rank}</span>
  }

  return (
    <div className="space-y-6">
      {/* Podium */}
      <div className="grid grid-cols-3 gap-3">
        {LEADERBOARD.slice(0, 3).map((p, i) => (
          <AdminGlass key={p.rank} padding="p-4" className={`text-center ${i === 0 ? 'ring-1 ring-yellow-500/20' : ''}`} glow={i === 0}>
            <div className="mb-2">{rankMedal(p.rank)}</div>
            <p className="text-sm text-white font-bold">{p.name}</p>
            <p className="text-2xl font-bold text-teal-400 mt-1">{p.score}</p>
            <p className="text-[10px] text-gray-500 uppercase mt-0.5">Points</p>
            <div className="flex items-center justify-center gap-1 mt-2 flex-wrap">
              {p.badges.map(b => {
                const bc = BADGE_CONFIG[b]
                if (!bc) return null
                return (
                  <span key={b} className={`text-[9px] px-1.5 py-0.5 rounded-full ${bc.bg} ${bc.color} font-medium`}>{b}</span>
                )
              })}
            </div>
          </AdminGlass>
        ))}
      </div>

      {/* Streak & Level */}
      <AdminGlass padding="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-white font-medium">Current Streak</p>
              <p className="text-xs text-gray-500">Consecutive days in the field</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-400">—</p>
            <p className="text-[10px] text-gray-500">days</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400 flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400" /> Level — —</span>
            <span className="text-[11px] text-gray-500">— / — XP</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-teal-500 rounded-full" style={{ width: '0%' }} />
          </div>
        </div>
      </AdminGlass>

      {/* Full Rankings */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" /> Full Rankings
        </h3>
        <div className="space-y-1">
          {LEADERBOARD.map(p => (
            <div key={p.rank} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
              <div className="w-6 text-center shrink-0">{rankMedal(p.rank)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{p.name}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 shrink-0">
                <span title="Visits">{p.visits} <span className="text-gray-600">vis</span></span>
                <span title="Prospects">{p.prospects} <span className="text-gray-600">pros</span></span>
                <span title="Closed" className="text-emerald-400 font-medium">{fmtINR(p.closed)}</span>
                <span className="text-teal-400 font-bold w-10 text-right">{p.score}</span>
              </div>
            </div>
          ))}
        </div>
      </AdminGlass>

      {/* Badge Glossary */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-3">Badge Glossary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(BADGE_CONFIG).map(([name, cfg]) => (
            <div key={name} className="text-center p-2.5 rounded-xl bg-white/[0.02]">
              <div className={`w-8 h-8 mx-auto rounded-lg ${cfg.bg} flex items-center justify-center mb-1.5`}>
                <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <p className="text-[11px] text-white font-medium">{name}</p>
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// PLACEHOLDER SUB-TAB
// ══════════════════════════════════════════════════════════════════
function PlaceholderSubTab({ name }: { name: string }) {
  return (
    <AdminGlass padding="p-12" className="text-center">
      <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <h3 className="text-lg text-white font-semibold mb-2">{name}</h3>
      <p className="text-sm text-gray-500">This module is under development and will be available soon.</p>
    </AdminGlass>
  )
}

// ══════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════
export default function FieldOpsModule({ subTab, navigate, showToast }: FieldOpsModuleProps) {
  const renderSubTab = () => {
    switch (subTab) {
      case null:
        return <FieldDashboard subTab={subTab} navigate={navigate} showToast={showToast} />
      case 'check-in':
        return <GPSCheckIn subTab={subTab} navigate={navigate} showToast={showToast} />
      case 'visits':
        return <SiteVisits subTab={subTab} navigate={navigate} showToast={showToast} />
      case 'capture':
        return <MediaCapture subTab={subTab} navigate={navigate} showToast={showToast} />
      case 'reports':
        return <ReportsPanel subTab={subTab} navigate={navigate} showToast={showToast} />
      case 'route':
        return <RoutePlanner subTab={subTab} navigate={navigate} showToast={showToast} />
      case 'prospects':
        return <ProspectsPanel subTab={subTab} navigate={navigate} showToast={showToast} />
      case 'pipeline':
        return <PipelineKanban subTab={subTab} navigate={navigate} showToast={showToast} />
      case 'expenses':
        return <ExpensesPanel subTab={subTab} navigate={navigate} showToast={showToast} />
      case 'leaderboard':
        return <LeaderboardPanel subTab={subTab} navigate={navigate} showToast={showToast} />
      case 'safety':
        return <PlaceholderSubTab name="Safety & Compliance" />
      case 'offline':
        return <PlaceholderSubTab name="Offline Mode" />
      default:
        return <PlaceholderSubTab name={subTab ?? 'Unknown'} />
    }
  }

  return (
    <div className="relative">
      {renderSubTab()}
      <SOSButton showToast={showToast} />
    </div>
  )
}
