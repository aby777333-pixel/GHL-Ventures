/* ================================================================
   STAFF PORTAL — TYPE DEFINITIONS
   ================================================================ */

// ── Staff Roles ─────────────────────────────────────────────────
export type StaffRole =
  | 'cs-lead'
  | 'senior-cs-agent'
  | 'cs-agent'
  | 'relationship-manager'
  | 'field-sales-manager'
  | 'field-sales-executive'
  | 'site-inspector'
  | 'kyc-officer'
  | 'operations-executive'
  | 'hr-executive'
  | 'general-employee'
  | 'intern'

// ── Staff Modules ───────────────────────────────────────────────
export type StaffModule =
  | 'home'
  | 'me'
  | 'cs'
  | 'clients'
  | 'tasks'
  | 'team'
  | 'ai'
  | 'internal'
  | 'field'

// ── Permission Types ────────────────────────────────────────────
export type StaffPermission = 'view' | 'create' | 'edit' | 'escalate' | 'close' | 'export' | 'manage'

// ── Agent Status ────────────────────────────────────────────────
export type AgentStatus = 'available' | 'busy' | 'away' | 'break' | 'offline'

// ── Staff Session ───────────────────────────────────────────────
export interface StaffSession {
  user: StaffUser
  token: string
  loginAt: string
  expiresAt: string
}

export interface StaffUser {
  id: string
  email: string
  name: string
  role: StaffRole
  staffCode: string
  department: string
  designation: string
  avatar?: string
  phone: string
  reportingTo?: string
  joinDate: string
  status: 'active' | 'probation' | 'notice-period' | 'contract'
}

// ── Attendance ──────────────────────────────────────────────────
export interface AttendanceRecord {
  date: string
  clockIn?: string
  clockOut?: string
  totalHours?: number
  breakDuration?: number
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'holiday' | 'weekend' | 'wfh'
  lateArrival?: boolean
  overtime?: number
  location?: string
}

// ── Leave ───────────────────────────────────────────────────────
export type LeaveType = 'casual' | 'sick' | 'earned' | 'comp-off' | 'loss-of-pay'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface LeaveBalance {
  type: LeaveType
  total: number
  used: number
  pending: number
  available: number
}

export interface LeaveApplication {
  id: string
  type: LeaveType
  fromDate: string
  toDate: string
  days: number
  halfDay?: boolean
  reason: string
  status: LeaveStatus
  appliedDate: string
  approvedBy?: string
  attachment?: string
}

// ── Payslip ─────────────────────────────────────────────────────
export interface Payslip {
  id: string
  month: string
  year: number
  basic: number
  hra: number
  specialAllowance: number
  conveyance: number
  medical: number
  pfEmployee: number
  pfEmployer: number
  esi: number
  professionalTax: number
  tds: number
  grossEarnings: number
  totalDeductions: number
  netSalary: number
  paymentDate: string
}

// ── Ticket ──────────────────────────────────────────────────────
export type TicketStatus = 'open' | 'in-progress' | 'awaiting-client' | 'awaiting-internal' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'
export type TicketCategory = 'account' | 'kyc' | 'investment' | 'nav' | 'documents' | 'technical' | 'complaint' | 'general'

export interface Ticket {
  id: string
  clientId: string
  clientName: string
  subject: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  assignedTo: string
  assignedToName: string
  createdDate: string
  updatedDate: string
  resolvedDate?: string
  channel: string
  escalationLevel?: number
  csatScore?: number
  messages: TicketMessage[]
}

export interface TicketMessage {
  id: string
  sender: string
  senderType: 'client' | 'agent' | 'system'
  message: string
  timestamp: string
  attachments?: string[]
}

// ── Communication Channel ───────────────────────────────────────
export type CommChannel = 'call' | 'video' | 'chat' | 'whatsapp' | 'telegram' | 'email' | 'social' | 'sms'

export interface ClientInteraction {
  id: string
  clientId: string
  clientName: string
  channel: CommChannel
  direction: 'inbound' | 'outbound'
  subject: string
  summary: string
  agentId: string
  agentName: string
  startTime: string
  endTime?: string
  duration?: number
  status: 'active' | 'completed' | 'missed' | 'transferred'
  sentiment?: 'positive' | 'neutral' | 'negative'
  csatScore?: number
  ticketId?: string
  recordingUrl?: string
  transcript?: string
}

// ── Queue Item ──────────────────────────────────────────────────
export interface QueueItem {
  id: string
  clientId?: string
  clientName: string
  channel: CommChannel
  waitTime: number
  priority: TicketPriority
  query?: string
  assignedAgent?: string
}

// ── CS KPIs ─────────────────────────────────────────────────────
export interface CSKPIs {
  ticketsResolved: number
  avgResponseTime: number
  csatScore: number
  callsHandled: number
  chatsHandled: number
  firstCallResolution: number
  queueWaitTime: number
  activeTickets: number
  escalations: number
  totalInteractions: number
}

// ── Task ────────────────────────────────────────────────────────
export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done'
export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low'

export interface StaffTask {
  id: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  assignedTo: string
  assignedBy: string
  dueDate: string
  createdDate: string
  linkedClient?: string
  linkedTicket?: string
  source: 'manual' | 'auto' | 'escalation' | 'admin'
  tags?: string[]
}

// ── Employee (for directory/team views) ─────────────────────────
export interface StaffEmployee {
  id: string
  staffCode: string
  name: string
  email: string
  phone: string
  designation: string
  department: string
  role: StaffRole
  reportingTo: string
  joinDate: string
  status: 'active' | 'probation' | 'notice-period' | 'contract'
  avatar?: string
  skills?: string[]
  location: string
  shift: string
  isOnline?: boolean
}

// ── Field Operations ────────────────────────────────────────────
export interface FieldCheckIn {
  id: string
  staffId: string
  staffName: string
  location: string
  coordinates: { lat: number; lng: number }
  type: 'site' | 'developer-office' | 'client-meeting' | 'investor-event' | 'branch' | 'other'
  linkedEntity?: string
  checkInTime: string
  checkOutTime?: string
  duration?: number
  selfieUrl?: string
  note?: string
  outcome?: string
}

export interface SiteVisit {
  id: string
  staffId: string
  staffName: string
  siteName: string
  address: string
  coordinates: { lat: number; lng: number }
  purpose: 'construction-inspection' | 'investor-tour' | 'prospect-meeting' | 'developer-meeting' | 'due-diligence' | 'photography'
  scheduledDate: string
  scheduledTime: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'overdue'
  duration?: number
  mediaCount?: number
  reportStatus?: 'draft' | 'submitted' | 'reviewed'
  notes?: string
  linkedClient?: string
  progressPercent?: number
}

export interface FieldProspect {
  id: string
  name: string
  company?: string
  phone: string
  email?: string
  designation?: string
  investmentInterest: string
  meetingDate: string
  outcome: 'hot' | 'warm' | 'cold' | 'not-interested' | 'follow-up'
  dealPotential: number
  probability: number
  stage: 'initial-contact' | 'site-visit-done' | 'proposal-sent' | 'negotiation' | 'documents-pending' | 'confirmed'
  nextAction: string
  nextActionDate: string
  assignedTo: string
  notes?: string
  location: string
}

export interface FieldExpense {
  id: string
  staffId: string
  staffName: string
  date: string
  category: 'fuel' | 'meals' | 'site-entry' | 'parking' | 'accommodation' | 'materials' | 'phone' | 'other'
  amount: number
  description: string
  vendor?: string
  receiptUrl?: string
  linkedVisit?: string
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed'
  approvedBy?: string
}

// ── AI Tool ─────────────────────────────────────────────────────
export interface StaffAITool {
  id: string
  name: string
  description: string
  icon: string
  category: 'cs-assist' | 'quality' | 'analytics' | 'compliance' | 'automation' | 'field-ops' | 'intelligence'
  status: 'active' | 'beta'
  forRoles: StaffRole[]
}

// ── Knowledge Base ──────────────────────────────────────────────
export interface KBArticle {
  id: string
  title: string
  category: string
  content: string
  author: string
  lastUpdated: string
  helpful: number
  notHelpful: number
  tags: string[]
}

// ── Announcement ────────────────────────────────────────────────
export interface Announcement {
  id: string
  title: string
  content: string
  type: 'policy-update' | 'process-change' | 'event' | 'achievement' | 'general'
  postedBy: string
  postedDate: string
  pinned: boolean
  readBy: string[]
  department?: string
}

// ── Training ────────────────────────────────────────────────────
export interface TrainingModule {
  id: string
  name: string
  category: string
  type: 'video' | 'document' | 'quiz' | 'live-session'
  duration: string
  mandatory: boolean
  completionStatus: 'not-started' | 'in-progress' | 'completed'
  progress: number
  score?: number
  deadline?: string
}
