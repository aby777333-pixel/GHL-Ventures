'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CheckCircle, Clock, Users, TrendingUp, Ticket,
  BarChart3, MapPin, UserCheck, CircleDollarSign,
  ClipboardList, GraduationCap, User, ListTodo,
  Sparkles, BookOpen, CalendarDays, MessageSquare,
  Pin, Megaphone, ArrowRight, Star, Quote,
} from 'lucide-react'
import AdminGlass from '../../admin/shared/AdminGlass'
import AdminBadge from '../../admin/shared/AdminBadge'
import { getGreeting } from '@/lib/staff/staffHooks'
import {
  fetchTasks, fetchAnnouncements, getCSKPIs, fetchTickets,
} from '@/lib/supabase/staffDataService'
import type { StaffRole, TaskPriority } from '@/lib/staff/staffTypes'
import { isCSRole, isFieldRole } from '@/lib/staff/staffRBAC'

interface HomeModuleProps {
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  userName: string
  role: StaffRole
}

// ── Priority Helpers ──────────────────────────────────────────────
const PRIORITY_ORDER: Record<TaskPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 }

function getPriorityBadgeVariant(p: TaskPriority) {
  switch (p) {
    case 'urgent': return 'error' as const
    case 'high': return 'warning' as const
    case 'normal': return 'info' as const
    case 'low': return 'neutral' as const
  }
}

function getStatusBadgeVariant(s: string) {
  switch (s) {
    case 'done': return 'success' as const
    case 'in-progress': return 'info' as const
    case 'blocked': return 'error' as const
    default: return 'neutral' as const
  }
}

function getAnnouncementIcon(type: string) {
  switch (type) {
    case 'policy-update': return '📋'
    case 'process-change': return '🔄'
    case 'event': return '🎉'
    case 'achievement': return '🏆'
    default: return '📢'
  }
}

const DAILY_QUOTES = [
  'Excellence is not a destination but a continuous journey.',
  'Every client interaction is an opportunity to build trust.',
  'The best way to predict the future is to create it.',
  'Small improvements every day lead to stunning results.',
  'Success is the sum of small efforts repeated day in and day out.',
]

// ── Component ─────────────────────────────────────────────────────
export default function HomeModule({ navigate, showToast, userName, role }: HomeModuleProps) {
  const firstName = userName.split(' ')[0]
  const greeting = getGreeting()
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const [tasks, setTasks] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [csKpis, setCsKpis] = useState(getCSKPIs())
  const [tickets, setTickets] = useState<any[]>([])

  const loadData = useCallback(async () => {
    const [t, a, tk] = await Promise.all([
      fetchTasks(), fetchAnnouncements(), fetchTickets(),
    ])
    setTasks(t)
    setAnnouncements(a)
    setTickets(tk)
    setCsKpis(getCSKPIs())
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const dailyQuote = useMemo(() => {
    const idx = new Date().getDate() % DAILY_QUOTES.length
    return DAILY_QUOTES[idx]
  }, [])

  // ── Role-based KPI stats ────────────────────────────────────────
  const openTicketCount = useMemo(() =>
    tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length,
    [tickets]
  )

  const kpiCards = useMemo(() => {
    if (isCSRole(role)) {
      return [
        { label: 'Tickets Resolved', value: csKpis.resolvedToday.toString(), icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
        { label: 'Avg Response Time', value: `${csKpis.avgResponseTime}`, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/15' },
        { label: 'CSAT Score', value: `${csKpis.satisfaction}`, icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/15' },
        { label: 'Active Tickets', value: openTicketCount.toString(), icon: Ticket, color: 'text-teal-400', bg: 'bg-teal-500/15' },
      ]
    }
    if (isFieldRole(role)) {
      return [
        { label: 'Site Visits', value: '—', icon: MapPin, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
        { label: 'Prospects', value: '—', icon: UserCheck, color: 'text-blue-400', bg: 'bg-blue-500/15' },
        { label: 'Pipeline Value', value: '—', icon: CircleDollarSign, color: 'text-amber-400', bg: 'bg-amber-500/15' },
        { label: 'Check-ins', value: '—', icon: BarChart3, color: 'text-teal-400', bg: 'bg-teal-500/15' },
      ]
    }
    const doneTasks = tasks.filter(t => t.status === 'done').length
    const pendingTasks = tasks.filter(t => t.status !== 'done').length
    return [
      { label: 'Tasks Done', value: doneTasks.toString(), icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
      { label: 'Pending Tasks', value: pendingTasks.toString(), icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-500/15' },
      { label: 'Team Size', value: '—', icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/15' },
      { label: 'Training Progress', value: '—', icon: GraduationCap, color: 'text-teal-400', bg: 'bg-teal-500/15' },
    ]
  }, [role, csKpis, tickets, tasks])

  // ── Top 5 tasks sorted by priority ──────────────────────────────
  const topTasks = useMemo(() =>
    [...tasks]
      .sort((a, b) => (PRIORITY_ORDER[a.priority as TaskPriority] ?? 99) - (PRIORITY_ORDER[b.priority as TaskPriority] ?? 99))
      .slice(0, 5),
    [tasks]
  )

  // ── Latest 3 announcements, pinned first ────────────────────────
  const latestAnnouncements = useMemo(() =>
    [...announcements]
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
      })
      .slice(0, 3),
    [announcements]
  )

  // ── Quick Access items ──────────────────────────────────────────
  const quickAccess = [
    { label: 'My Profile', icon: User, path: 'me', color: 'text-teal-400' },
    { label: 'Tasks', icon: ListTodo, path: 'tasks', color: 'text-blue-400' },
    { label: 'AI Tools', icon: Sparkles, path: 'ai', color: 'text-purple-400' },
    { label: 'Team Directory', icon: Users, path: 'team', color: 'text-emerald-400' },
    { label: 'Knowledge Base', icon: BookOpen, path: 'internal/kb', color: 'text-amber-400' },
    { label: 'Leave', icon: CalendarDays, path: 'me/leave', color: 'text-pink-400' },
    { label: 'Training', icon: GraduationCap, path: 'internal/training', color: 'text-cyan-400' },
    { label: 'Internal Chat', icon: MessageSquare, path: 'internal/chat', color: 'text-indigo-400' },
  ]

  return (
    <div className="space-y-6 admin-section-enter">
      {/* ── Greeting Section ──────────────────────────────────────── */}
      <AdminGlass>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {greeting}, {firstName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{today}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-500/10 border border-teal-500/30 max-w-md">
            <Quote className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <p className="text-[11px] text-teal-400 italic leading-relaxed">{dailyQuote}</p>
          </div>
        </div>
      </AdminGlass>

      {/* ── Quick Stats Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((kpi) => (
          <AdminGlass key={kpi.label}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{kpi.value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">{kpi.label}</p>
              </div>
            </div>
          </AdminGlass>
        ))}
      </div>

      {/* ── Quick Access Grid ─────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal-400" />
          Quick Access
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickAccess.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                navigate(item.path)
                showToast(`Opening ${item.label}`, 'info')
              }}
              className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-teal-500/10 hover:border-teal-500/30 transition-all group text-left"
            >
              <item.icon className={`w-5 h-5 ${item.color} mb-2 group-hover:text-teal-400 transition-colors`} />
              <p className="text-xs font-semibold text-white">{item.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Task Queue + Announcements ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task Queue */}
        <AdminGlass>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-teal-400" />
              Task Queue
            </h3>
            <button
              onClick={() => navigate('tasks')}
              className="text-[10px] text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5 max-h-72 overflow-y-auto admin-scrollbar">
            {topTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => {
                  navigate('tasks')
                  showToast(`Viewing: ${task.title}`, 'info')
                }}
                className="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-teal-500/20 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <AdminBadge label={task.priority} variant={getPriorityBadgeVariant(task.priority)} />
                      <AdminBadge label={task.status} variant={getStatusBadgeVariant(task.status)} />
                      <span className="text-[10px] text-gray-600">
                        Due {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </AdminGlass>

        {/* Announcements */}
        <AdminGlass>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-teal-400" />
              Announcements
            </h3>
            <span className="text-[10px] text-gray-500">{announcements.length} total</span>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto admin-scrollbar">
            {latestAnnouncements.map((ann) => (
              <button
                key={ann.id}
                onClick={() => {
                  navigate('internal')
                  showToast(`Reading: ${ann.title}`, 'info')
                }}
                className="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-teal-500/20 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-base flex-shrink-0 mt-0.5">{getAnnouncementIcon(ann.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-semibold text-white truncate">{ann.title}</p>
                      {ann.pinned && <Pin className="w-3 h-3 text-teal-400 flex-shrink-0" />}
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2">{ann.content}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-gray-600">{ann.postedBy}</span>
                      <span className="text-[10px] text-gray-700">·</span>
                      <span className="text-[10px] text-gray-600">
                        {new Date(ann.postedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </AdminGlass>
      </div>
    </div>
  )
}
