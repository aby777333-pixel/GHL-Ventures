/* ================================================================
   STAFF PORTAL — CONSTANTS
   ================================================================ */

import type { StaffModule } from './staffTypes'

// ── Sidebar Navigation ──────────────────────────────────────────
export interface StaffNavItem {
  id: StaffModule
  label: string
  iconName: string
  href: string
  badge?: string | number
  subItems?: { id: string; label: string; href: string }[]
  fieldOnly?: boolean
  csOnly?: boolean
}

export const STAFF_SIDEBAR_ITEMS: StaffNavItem[] = [
  {
    id: 'home', label: 'Home', iconName: 'Home', href: '/staff',
  },
  {
    id: 'me', label: 'My Profile', iconName: 'User', href: '/staff/me',
    subItems: [
      { id: 'profile', label: 'Profile', href: '/staff/me/profile' },
      { id: 'attendance', label: 'Attendance', href: '/staff/me/attendance' },
      { id: 'leave', label: 'Leave', href: '/staff/me/leave' },
      { id: 'payslips', label: 'Payslips', href: '/staff/me/payslips' },
      { id: 'documents', label: 'Documents', href: '/staff/me/documents' },
      { id: 'training', label: 'Training', href: '/staff/me/training' },
      { id: 'performance', label: 'Performance', href: '/staff/me/performance' },
      { id: 'expenses', label: 'Expenses', href: '/staff/me/expenses' },
    ],
  },
  {
    id: 'cs', label: 'CS Center', iconName: 'Headphones', href: '/staff/cs',
    badge: 'LIVE',
    csOnly: true,
    subItems: [
      { id: 'cs-dashboard', label: 'Dashboard', href: '/staff/cs' },
      { id: 'inbox', label: 'Inbox', href: '/staff/cs/inbox' },
      { id: 'tickets', label: 'Tickets', href: '/staff/cs/tickets' },
      { id: 'calls', label: 'Calls', href: '/staff/cs/calls' },
      { id: 'video', label: 'Video', href: '/staff/cs/video' },
      { id: 'chat', label: 'Live Chat', href: '/staff/cs/chat' },
      { id: 'whatsapp', label: 'WhatsApp', href: '/staff/cs/whatsapp' },
      { id: 'telegram', label: 'Telegram', href: '/staff/cs/telegram' },
      { id: 'email-support', label: 'Email', href: '/staff/cs/email' },
      { id: 'social', label: 'Social', href: '/staff/cs/social' },
      { id: 'knowledge-base', label: 'Knowledge Base', href: '/staff/cs/knowledge-base' },
      { id: 'escalations', label: 'Escalations', href: '/staff/cs/escalations' },
      { id: 'csat', label: 'CSAT', href: '/staff/cs/csat' },
    ],
  },
  {
    id: 'field', label: 'Field Ops', iconName: 'MapPin', href: '/staff/field',
    badge: 'NEW',
    fieldOnly: true,
    subItems: [
      { id: 'field-dashboard', label: 'Dashboard', href: '/staff/field' },
      { id: 'check-in', label: 'Check In', href: '/staff/field/check-in' },
      { id: 'visits', label: 'Visits', href: '/staff/field/visits' },
      { id: 'capture', label: 'Capture', href: '/staff/field/capture' },
      { id: 'reports', label: 'Reports', href: '/staff/field/reports' },
      { id: 'route', label: 'Route', href: '/staff/field/route' },
      { id: 'prospects', label: 'Prospects', href: '/staff/field/prospects' },
      { id: 'pipeline', label: 'Pipeline', href: '/staff/field/pipeline' },
      { id: 'expenses-field', label: 'Expenses', href: '/staff/field/expenses' },
      { id: 'leaderboard', label: 'Leaderboard', href: '/staff/field/leaderboard' },
    ],
  },
  {
    id: 'clients', label: 'Clients', iconName: 'Users', href: '/staff/clients',
    subItems: [
      { id: 'client-search', label: 'Search', href: '/staff/clients/search' },
      { id: 'client-history', label: 'History', href: '/staff/clients/history' },
    ],
  },
  {
    id: 'tasks', label: 'Tasks', iconName: 'CheckSquare', href: '/staff/tasks',
    badge: 5,
    subItems: [
      { id: 'my-tasks', label: 'My Tasks', href: '/staff/tasks' },
      { id: 'board', label: 'Board', href: '/staff/tasks/board' },
      { id: 'workflows', label: 'Workflows', href: '/staff/tasks/workflows' },
    ],
  },
  {
    id: 'ai', label: 'AI Advisor', iconName: 'Sparkles', href: '/staff/ai',
    subItems: [],
  },
  {
    id: 'team', label: 'Team', iconName: 'UsersRound', href: '/staff/team',
    subItems: [
      { id: 'directory', label: 'Directory', href: '/staff/team/directory' },
      { id: 'roster', label: 'Roster', href: '/staff/team/roster' },
      { id: 'announcements', label: 'Announcements', href: '/staff/team/announcements' },
    ],
  },
  {
    id: 'internal', label: 'Internal', iconName: 'MessageCircle', href: '/staff/internal',
    subItems: [
      { id: 'staff-chat', label: 'Chat', href: '/staff/internal/chat' },
      { id: 'noticeboard', label: 'Noticeboard', href: '/staff/internal/noticeboard' },
      { id: 'policies', label: 'Policies', href: '/staff/internal/policies' },
      { id: 'feedback', label: 'Feedback', href: '/staff/internal/feedback' },
      { id: 'wellness', label: 'Wellness', href: '/staff/internal/wellness' },
    ],
  },
]

// ── Module Labels ───────────────────────────────────────────────
export const STAFF_MODULE_LABELS: Record<StaffModule, string> = {
  home: 'Home',
  me: 'My Profile',
  cs: 'Customer Service Center',
  clients: 'Clients',
  tasks: 'Tasks',
  team: 'Team',
  ai: 'AI Advisor',
  internal: 'Internal',
  field: 'Field Operations',
}

// ── All Tab Params (for Next.js static generation) ──────────────
export const ALL_STAFF_TAB_PARAMS = [
  // Home
  { tab: ['home'] },
  // Self-service
  { tab: ['me'] }, { tab: ['me', 'profile'] }, { tab: ['me', 'attendance'] },
  { tab: ['me', 'leave'] }, { tab: ['me', 'payslips'] }, { tab: ['me', 'documents'] },
  { tab: ['me', 'training'] }, { tab: ['me', 'performance'] }, { tab: ['me', 'expenses'] },
  { tab: ['me', 'grievance'] }, { tab: ['me', 'exit'] },
  // CS Center
  { tab: ['cs'] }, { tab: ['cs', 'inbox'] }, { tab: ['cs', 'tickets'] },
  { tab: ['cs', 'calls'] }, { tab: ['cs', 'video'] }, { tab: ['cs', 'chat'] },
  { tab: ['cs', 'whatsapp'] }, { tab: ['cs', 'telegram'] }, { tab: ['cs', 'email'] },
  { tab: ['cs', 'social'] }, { tab: ['cs', 'knowledge-base'] }, { tab: ['cs', 'scripts'] },
  { tab: ['cs', 'quality'] }, { tab: ['cs', 'escalations'] }, { tab: ['cs', 'csat'] },
  // Field
  { tab: ['field'] }, { tab: ['field', 'check-in'] }, { tab: ['field', 'visits'] },
  { tab: ['field', 'capture'] }, { tab: ['field', 'reports'] }, { tab: ['field', 'route'] },
  { tab: ['field', 'prospects'] }, { tab: ['field', 'expenses'] }, { tab: ['field', 'pipeline'] },
  { tab: ['field', 'leaderboard'] }, { tab: ['field', 'safety'] }, { tab: ['field', 'offline'] },
  // Clients
  { tab: ['clients'] }, { tab: ['clients', 'search'] }, { tab: ['clients', 'history'] },
  // Tasks
  { tab: ['tasks'] }, { tab: ['tasks', 'board'] }, { tab: ['tasks', 'workflows'] },
  // AI Tools
  { tab: ['ai'] }, { tab: ['ai', 'copilot'] }, { tab: ['ai', 'summarizer'] },
  { tab: ['ai', 'response-gen'] }, { tab: ['ai', 'sentiment'] }, { tab: ['ai', 'escalation-predictor'] },
  { tab: ['ai', 'quality-scorer'] }, { tab: ['ai', 'training-coach'] }, { tab: ['ai', 'client-360'] },
  { tab: ['ai', 'language-assist'] }, { tab: ['ai', 'compliance-guard'] },
  { tab: ['ai', 'workload-balancer'] }, { tab: ['ai', 'after-call-work'] },
  { tab: ['ai', 'site-analyzer'] }, { tab: ['ai', 'visit-report-gen'] },
  { tab: ['ai', 'route-optimizer'] }, { tab: ['ai', 'prospect-scorer'] },
  { tab: ['ai', 'construction-monitor'] }, { tab: ['ai', 'voice-note-processor'] },
  { tab: ['ai', 'deal-coach'] }, { tab: ['ai', 'geo-intel'] },
  // Team
  { tab: ['team'] }, { tab: ['team', 'directory'] }, { tab: ['team', 'roster'] },
  { tab: ['team', 'attendance-team'] }, { tab: ['team', 'performance-team'] },
  { tab: ['team', 'announcements'] },
  // Internal
  { tab: ['internal'] }, { tab: ['internal', 'chat'] }, { tab: ['internal', 'noticeboard'] },
  { tab: ['internal', 'policies'] }, { tab: ['internal', 'feedback'] }, { tab: ['internal', 'wellness'] },
]
