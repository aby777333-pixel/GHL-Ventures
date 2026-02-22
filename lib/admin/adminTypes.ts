/* ================================================================
   ADMIN COMMAND CENTER — TYPE DEFINITIONS
   ================================================================ */

// ── Roles & Auth ──────────────────────────────────────────────────
export type AdminRole =
  | 'super-admin'
  | 'admin'
  | 'compliance-officer'
  | 'fund-manager'
  | 'manager'
  | 'sales'
  | 'operations'
  | 'hr'
  | 'viewer'

export interface AdminUser {
  email: string
  name: string
  role: AdminRole
  avatar?: string
  department?: string
  phone?: string
}

export interface AdminSession {
  user: AdminUser
  loginAt: number
  expiresAt: number
  ip?: string
  device?: string
}

// ── Permissions ───────────────────────────────────────────────────
export type PermissionAction = 'view' | 'create' | 'edit' | 'approve' | 'delete' | 'export' | 'configure'
export type PermissionModule = 'overview' | 'clients' | 'sales' | 'employees' | 'assets' | 'ai-ops' | 'compliance' | 'financial' | 'analytics' | 'comms' | 'settings'
export type Permission = `${PermissionAction}:${PermissionModule}` | '*'

// ── Navigation ────────────────────────────────────────────────────
export type AdminModule =
  | 'overview'
  | 'clients'
  | 'sales'
  | 'employees'
  | 'assets'
  | 'ai-ops'
  | 'compliance'
  | 'financial'
  | 'analytics'
  | 'comms'
  | 'settings'

export interface AdminNavItem {
  id: AdminModule
  label: string
  icon: string
  badge?: number | string
  permission: Permission
  subItems?: { id: string; label: string; permission?: Permission }[]
}

// ── Client Data ───────────────────────────────────────────────────
export type KYCStatus = 'pending' | 'under-review' | 'approved' | 'rejected' | 'expired'
export type AccountStatus = 'active' | 'frozen' | 'suspended' | 'closed'
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive' | 'speculative'

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  pan: string
  kycStatus: KYCStatus
  accountStatus: AccountStatus
  riskProfile: RiskProfile
  aum: number
  investedAmount: number
  currentValue: number
  joinDate: string
  lastActive: string
  assignedRM: string
  avatar?: string
}

export interface KYCDocument {
  id: string
  clientId: string
  clientName: string
  type: string
  fileName: string
  uploadDate: string
  status: KYCStatus
  reviewer?: string
  notes?: string
}

// ── Sales / CRM ───────────────────────────────────────────────────
export type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type LeadSource = 'website' | 'referral' | 'cold-outreach' | 'event' | 'social-media' | 'whatsapp'

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  source: LeadSource
  stage: LeadStage
  value: number
  probability: number
  aiScore: number
  assignedTo: string
  createdDate: string
  lastTouched: string
  nextFollowUp?: string
  notes?: string
}

export interface Commission {
  id: string
  salesRep: string
  dealId: string
  clientName: string
  dealValue: number
  commissionRate: number
  commissionAmount: number
  status: 'pending' | 'approved' | 'paid'
  period: string
}

// ── Employee ──────────────────────────────────────────────────────
export type EmployeeStatus = 'active' | 'on-leave' | 'inactive'
export type LeaveType = 'casual' | 'sick' | 'earned' | 'comp-off'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  role: string
  department: string
  status: EmployeeStatus
  joinDate: string
  avatar?: string
  reportingTo?: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  type: LeaveType
  from: string
  to: string
  days: number
  reason: string
  status: LeaveStatus
  appliedDate: string
}

export interface AttendanceRecord {
  date: string
  status: 'present' | 'absent' | 'half-day' | 'wfh' | 'weekend' | 'holiday'
  loginTime?: string
  logoutTime?: string
  totalHours?: number
}

// ── Assets & Documents ────────────────────────────────────────────
export type AssetStatus = 'active' | 'expired' | 'maintenance' | 'decommissioned'
export type AssetCategory = 'digital' | 'physical' | 'license' | 'certificate'

export interface Asset {
  id: string
  name: string
  category: AssetCategory
  serialNumber?: string
  assignedTo?: string
  status: AssetStatus
  purchaseDate: string
  expiryDate?: string
  value: number
}

export interface Document {
  id: string
  name: string
  type: string
  category: string
  uploadedBy: string
  uploadDate: string
  size: string
  version: number
  tags: string[]
  accessLevel: AdminRole[]
}

// ── Compliance ────────────────────────────────────────────────────
export type ApprovalType = 'kyc' | 'investment' | 'document' | 'access' | 'payout'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated'
export type FlagSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface Approval {
  id: string
  type: ApprovalType
  requestedBy: string
  description: string
  date: string
  priority: FlagSeverity
  assignedReviewer?: string
  status: ApprovalStatus
}

export interface AuditEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: string
  module: string
  details: string
  ip?: string
}

export interface RiskFlag {
  id: string
  severity: FlagSeverity
  title: string
  description: string
  affectedEntity: string
  createdDate: string
  status: 'open' | 'investigating' | 'resolved' | 'escalated'
  assignedTo?: string
}

// ── Financial ─────────────────────────────────────────────────────
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'
export type ExpenseCategory = 'operations' | 'marketing' | 'technology' | 'legal' | 'travel' | 'hr'

export interface Invoice {
  id: string
  clientName: string
  amount: number
  gst: number
  total: number
  date: string
  dueDate: string
  status: InvoiceStatus
  type: string
}

export interface Expense {
  id: string
  description: string
  category: ExpenseCategory
  amount: number
  submittedBy: string
  date: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  receipt?: string
}

// ── Notifications ─────────────────────────────────────────────────
export type NotificationType = 'info' | 'success' | 'warning' | 'critical'

export interface AdminNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  module: AdminModule
  timestamp: string
  read: boolean
  actionUrl?: string
}

// ── Activity ──────────────────────────────────────────────────────
export interface ActivityItem {
  id: string
  user: string
  action: string
  target: string
  module: AdminModule
  timestamp: string
  icon?: string
}

// ── AI Operations ─────────────────────────────────────────────────
export interface AITool {
  id: string
  name: string
  description: string
  icon: string
  category: 'analysis' | 'generation' | 'prediction' | 'monitoring' | 'automation'
  status: 'active' | 'beta' | 'coming-soon'
}

export interface AIResult {
  id: string
  toolId: string
  input: string
  output: string
  timestamp: string
  userId: string
  confidence?: number
}
