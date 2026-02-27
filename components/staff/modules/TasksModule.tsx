'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  ListTodo, Plus, Filter, Eye, Calendar, Tag,
  Columns3, Workflow, Clock, AlertCircle, CheckCircle2,
  Circle, Pause, ChevronRight, Play, Upload,
} from 'lucide-react'
import AdminGlass from '@/components/admin/shared/AdminGlass'
import AdminBadge from '@/components/admin/shared/AdminBadge'
import AdminDataTable, { type Column } from '@/components/admin/shared/AdminDataTable'
import AdminModal from '@/components/admin/shared/AdminModal'
import UploadWithFolderPicker from '@/components/shared/UploadWithFolderPicker'
import { fetchTasks } from '@/lib/supabase/staffDataService'
import type { StaffTask, TaskStatus, TaskPriority } from '@/lib/staff/staffTypes'

// ── Props ──────────────────────────────────────────────────────
interface TasksModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

// ── Constants ──────────────────────────────────────────────────
const STATUS_OPTIONS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To-Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_OPTIONS: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
]

const PRIORITY_BADGE: Record<TaskPriority, 'error' | 'warning' | 'info' | 'neutral'> = {
  urgent: 'error',
  high: 'warning',
  normal: 'info',
  low: 'neutral',
}

const STATUS_BADGE: Record<TaskStatus, 'neutral' | 'info' | 'error' | 'success'> = {
  todo: 'neutral',
  'in-progress': 'info',
  blocked: 'error',
  done: 'success',
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To-Do',
  'in-progress': 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
}

// ── Main Component ─────────────────────────────────────────────
export default function TasksModule({ subTab, navigate, showToast }: TasksModuleProps) {
  const tab = subTab || 'my-tasks'
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    fetchTasks().then(data => setTasks(data))
  }, [])

  return (
    <div className="space-y-6 admin-section-enter">
      {tab === 'my-tasks' && <MyTasksView showToast={showToast} tasks={tasks} />}
      {tab === 'board' && <BoardView showToast={showToast} tasks={tasks} />}
      {tab === 'workflows' && <WorkflowsView showToast={showToast} />}
    </div>
  )
}

// ================================================================
//  1. MY TASKS (default)
// ================================================================
function MyTasksView({ showToast, tasks }: { showToast: TasksModuleProps['showToast']; tasks: any[] }) {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [folderPickerOpen, setFolderPickerOpen] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'normal' as TaskPriority, status: 'todo' as TaskStatus, dueDate: '', assignedTo: '', tags: '' })

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      return true
    })
  }, [tasks, statusFilter, priorityFilter])

  const columns: Column<StaffTask>[] = [
    {
      key: 'title',
      label: 'Title',
      render: (row) => (
        <div className="max-w-xs">
          <p className="text-sm font-medium text-white truncate">{row.title}</p>
          {row.linkedClient && (
            <p className="text-[11px] text-gray-500 mt-0.5">Client: {row.linkedClient}</p>
          )}
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => (
        <AdminBadge label={row.priority} variant={PRIORITY_BADGE[row.priority]} />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <AdminBadge label={STATUS_LABEL[row.status]} variant={STATUS_BADGE[row.status]} dot />
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (row) => {
        const isOverdue = new Date(row.dueDate) < new Date() && row.status !== 'done'
        return (
          <span className={`text-xs ${isOverdue ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
            {formatDate(row.dueDate)}
          </span>
        )
      },
    },
    {
      key: 'source',
      label: 'Source',
      render: (row) => (
        <span className="text-xs text-gray-400 capitalize">{row.source}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      width: '50px',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); showToast(`Opening task: ${row.title}`, 'info') }}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-teal-400" />
            My Tasks
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage your assigned tasks</p>
        </div>
        <button
          onClick={() => setNewTaskOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-500/20 border border-teal-500/30 hover:bg-teal-500/30 transition-colors self-start admin-btn-press"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Filter className="w-3.5 h-3.5" />
          Filters:
        </div>
        <div className="flex gap-1 p-0.5 bg-white/[0.03] rounded-lg border border-white/[0.06]">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                statusFilter === opt.value
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-0.5 bg-white/[0.03] rounded-lg border border-white/[0.06]">
          {PRIORITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPriorityFilter(opt.value)}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                priorityFilter === opt.value
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <AdminGlass padding="p-4">
        <AdminDataTable<StaffTask>
          columns={columns}
          data={filtered}
          searchKeys={['title', 'linkedClient', 'source']}
          searchPlaceholder="Search tasks..."
          onRowClick={(row) => showToast(`Opening task: ${row.title}`, 'info')}
          emptyMessage="No tasks match the current filters"
          title={`Tasks (${filtered.length})`}
        />
      </AdminGlass>

      {/* New Task Modal */}
      <AdminModal isOpen={newTaskOpen} onClose={() => setNewTaskOpen(false)} title="Create New Task" maxWidth="max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Task Title *</label>
            <input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Enter task title" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Priority</label>
            <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20">
              <option value="urgent" className="bg-neutral-900">Urgent</option>
              <option value="high" className="bg-neutral-900">High</option>
              <option value="normal" className="bg-neutral-900">Normal</option>
              <option value="low" className="bg-neutral-900">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
            <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value as TaskStatus })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20">
              <option value="todo" className="bg-neutral-900">To-Do</option>
              <option value="in-progress" className="bg-neutral-900">In Progress</option>
              <option value="blocked" className="bg-neutral-900">Blocked</option>
              <option value="done" className="bg-neutral-900">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Due Date</label>
            <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Assigned To</label>
            <input value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })} placeholder="Team member name" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tags</label>
            <input value={taskForm.tags} onChange={e => setTaskForm({ ...taskForm, tags: e.target.value })} placeholder="e.g. client-onboarding, kyc, urgent" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
            <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} rows={3} placeholder="Describe the task..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Attach Documents</label>
            <button type="button" onClick={() => setFolderPickerOpen(true)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] border border-dashed border-white/[0.12] hover:bg-white/[0.08] hover:border-white/[0.2] transition-colors w-full justify-center">
              <Upload className="w-4 h-4" /> Upload Documents & Images
            </button>
            <p className="text-[10px] text-gray-600 mt-1">Stored in File Repository &gt; Staff Tasks</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
          <button onClick={() => setNewTaskOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">Cancel</button>
          <button onClick={() => { if (!taskForm.title.trim()) { showToast('Task title is required', 'error'); return } showToast('Task created successfully', 'success'); setNewTaskOpen(false); setTaskForm({ title: '', description: '', priority: 'normal', status: 'todo', dueDate: '', assignedTo: '', tags: '' }) }} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors">Create Task</button>
        </div>
      </AdminModal>

      <UploadWithFolderPicker
        open={folderPickerOpen}
        onClose={() => setFolderPickerOpen(false)}
        defaultRoute="staff/tasks"
        showToast={showToast as any}
        onUploadComplete={(results) => {
          const ok = results.filter(r => r.success).length
          if (ok > 0) showToast(`${ok} file(s) uploaded`, 'success')
        }}
        theme="teal"
        portal="staff"
      />
    </>
  )
}

// ================================================================
//  2. BOARD VIEW (Kanban)
// ================================================================
function BoardView({ showToast, tasks }: { showToast: TasksModuleProps['showToast']; tasks: any[] }) {
  const columns: { status: TaskStatus; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { status: 'todo', label: 'To-Do', icon: Circle, color: 'text-gray-400 border-gray-500/20 bg-gray-500/10' },
    { status: 'in-progress', label: 'In Progress', icon: Clock, color: 'text-blue-400 border-blue-500/20 bg-blue-500/10' },
    { status: 'blocked', label: 'Blocked', icon: AlertCircle, color: 'text-red-400 border-red-500/20 bg-red-500/10' },
    { status: 'done', label: 'Done', icon: CheckCircle2, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' },
  ]

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, StaffTask[]> = { todo: [], 'in-progress': [], blocked: [], done: [] }
    tasks.forEach(t => { if (t.status in map) map[t.status as TaskStatus].push(t) })
    return map
  }, [tasks])

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Columns3 className="w-6 h-6 text-teal-400" />
        <h1 className="text-2xl font-bold text-white">Task Board</h1>
      </div>
      <p className="text-sm text-gray-500 -mt-4">Kanban view of all tasks by status</p>

      {/* Board */}
      <div className="overflow-x-auto pb-4">
        <div className="grid grid-cols-4 gap-3 min-w-[800px]">
          {columns.map(col => {
            const Icon = col.icon
            const tasks = grouped[col.status]
            return (
              <div key={col.status} className="flex flex-col">
                {/* Column Header */}
                <div className={`p-3 rounded-t-xl border ${col.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      <Icon className="w-3.5 h-3.5" />
                      {col.label}
                    </span>
                    <span className="text-[10px] text-gray-500 bg-white/[0.06] px-1.5 py-0.5 rounded-full">
                      {tasks.length}
                    </span>
                  </div>
                </div>

                {/* Task Cards */}
                <div className="space-y-2 mt-2">
                  {tasks.map(task => (
                    <AdminGlass key={task.id} padding="p-3" className="cursor-pointer">
                      <div onClick={() => showToast(`Opening task: ${task.title}`, 'info')}>
                        <p className="text-xs font-medium text-white mb-2 line-clamp-2">{task.title}</p>
                        <div className="flex items-center justify-between mb-2">
                          <AdminBadge label={task.priority} variant={PRIORITY_BADGE[task.priority]} />
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(task.dueDate)}
                        </div>
                        {task.linkedClient && (
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-1">
                            <Tag className="w-3 h-3" />
                            {task.linkedClient}
                          </div>
                        )}
                      </div>
                    </AdminGlass>
                  ))}
                  {tasks.length === 0 && (
                    <div className="p-4 rounded-xl border border-dashed border-white/[0.06] text-center">
                      <p className="text-[10px] text-gray-600">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ================================================================
//  3. WORKFLOWS
// ================================================================
interface WorkflowTemplate {
  id: string
  name: string
  steps: number
  status: 'active' | 'paused'
  description: string
}

const MOCK_WORKFLOWS: WorkflowTemplate[] = [
  { id: 'wf-001', name: 'New Client Onboarding', steps: 6, status: 'active', description: 'End-to-end workflow for onboarding new investment clients with KYC, docs, and account setup.' },
  { id: 'wf-002', name: 'KYC Verification', steps: 4, status: 'active', description: 'Automated KYC document collection, verification, and approval pipeline.' },
  { id: 'wf-003', name: 'Complaint Escalation', steps: 5, status: 'active', description: 'Multi-tier escalation workflow for client complaints with SLA tracking.' },
  { id: 'wf-004', name: 'Monthly Report Generation', steps: 3, status: 'paused', description: 'Automated monthly investor report compilation, review, and distribution.' },
  { id: 'wf-005', name: 'Investment Maturity Processing', steps: 7, status: 'active', description: 'Full lifecycle processing for maturing investments including payout calculations and reinvestment options.' },
]

function WorkflowsView({ showToast }: { showToast: TasksModuleProps['showToast'] }) {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Workflow className="w-6 h-6 text-teal-400" />
            Workflows
          </h1>
          <p className="text-sm text-gray-500 mt-1">Automated task workflows and templates</p>
        </div>
      </div>

      {/* Workflow Cards */}
      <div className="space-y-3">
        {MOCK_WORKFLOWS.map(wf => (
          <AdminGlass key={wf.id} padding="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  wf.status === 'active'
                    ? 'bg-teal-500/15 border border-teal-500/20'
                    : 'bg-amber-500/15 border border-amber-500/20'
                }`}>
                  {wf.status === 'active'
                    ? <Play className="w-4 h-4 text-teal-400" />
                    : <Pause className="w-4 h-4 text-amber-400" />
                  }
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{wf.name}</p>
                    <AdminBadge
                      label={wf.status === 'active' ? 'Active' : 'Paused'}
                      variant={wf.status === 'active' ? 'success' : 'warning'}
                      dot
                    />
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{wf.description}</p>
                  <p className="text-[11px] text-gray-600 mt-1">{wf.steps} steps</p>
                </div>
              </div>
              <button
                onClick={() => showToast(`Viewing workflow: ${wf.name}`, 'info')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-teal-300 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-colors self-start admin-btn-press"
              >
                View
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </AdminGlass>
        ))}
      </div>
    </>
  )
}

// ── Helpers ────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
