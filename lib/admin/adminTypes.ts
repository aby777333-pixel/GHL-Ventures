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
  | 'marketing-manager'
  | 'marketing-executive'
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
export type PermissionModule = 'overview' | 'clients' | 'sales' | 'realty-brokers' | 'employees' | 'assets' | 'ai-ops' | 'compliance' | 'financial' | 'analytics' | 'comms' | 'marketing' | 'reports' | 'settings'
export type Permission = `${PermissionAction}:${PermissionModule}` | '*'

// ── Navigation ────────────────────────────────────────────────────
export type AdminModule =
  | 'overview'
  | 'clients'
  | 'sales'
  | 'realty-brokers'
  | 'employees'
  | 'assets'
  | 'ai-ops'
  | 'compliance'
  | 'financial'
  | 'analytics'
  | 'comms'
  | 'marketing'
  | 'reports'
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
export type KYCStatus = 'pending' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'expired'
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

// ── Realty Brokers ───────────────────────────────────────────────
export type BrokerStatus = 'active' | 'inactive' | 'pending-verification' | 'suspended'
export type BrokerInquiryStatus = 'new' | 'contacted' | 'in-progress' | 'closed' | 'converted'
export type BrokerSpecialization = 'residential' | 'commercial' | 'land' | 'industrial' | 'mixed-use'

export interface RealtyBroker {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  reraId?: string
  specialization: BrokerSpecialization
  city: string
  status: BrokerStatus
  totalDeals: number
  totalValue: number
  commission: number
  rating: number
  joinDate: string
  lastActive: string
  assignedRM?: string
  tags: string[]
}

export interface BrokerInquiry {
  id: string
  brokerId?: string
  brokerName: string
  source: 'website' | 'referral' | 'direct' | 'event'
  type: 'land' | 'realty' | 'partnership' | 'listing'
  subject: string
  message: string
  status: BrokerInquiryStatus
  priority: 'high' | 'medium' | 'low'
  assignedTo?: string
  createdDate: string
  lastUpdated: string
  propertyType?: string
  location?: string
  estimatedValue?: number
}

// ── Marketing ────────────────────────────────────────────────────
export type CampaignType = 'email' | 'social' | 'google-ads' | 'meta-ads' | 'linkedin-ads' | 'youtube-ads' | 'event' | 'whatsapp' | 'telegram' | 'sms' | 'rcs' | 'push' | 'offline' | 'multi-channel'
export type CampaignStatus = 'draft' | 'scheduled' | 'live' | 'paused' | 'completed' | 'archived'
export type MarketingChannel = 'email' | 'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'google-ads' | 'meta-ads' | 'whatsapp' | 'telegram' | 'sms' | 'rcs' | 'push' | 'events' | 'offline' | 'referral'

export interface MarketingCampaign {
  id: string
  name: string
  type: CampaignType
  channels: MarketingChannel[]
  status: CampaignStatus
  startDate: string
  endDate?: string
  budget: number
  spend: number
  leads: number
  roi: number
  owner: string
  description?: string
}

export interface MarketingKPIs {
  totalLeads: number
  leadsTrend: number
  campaignROI: number
  emailOpenRate: number
  socialEngagement: number
  marketingSpend: number
  marketingBudget: number
  websiteTraffic: number
  trafficTrend: number
}

export interface ContentItem {
  id: string
  title: string
  type: 'blog' | 'social-post' | 'email' | 'infographic' | 'video' | 'brochure' | 'landing-page'
  channel: MarketingChannel
  status: 'idea' | 'draft' | 'review' | 'approved' | 'scheduled' | 'published'
  scheduledDate?: string
  publishedDate?: string
  author: string
  engagement?: number
}

export interface AudienceSegment {
  id: string
  name: string
  description: string
  contactCount: number
  type: 'dynamic' | 'static'
  criteria: string
  lastUsed?: string
  createdBy: string
}

export interface OutreachSequence {
  id: string
  name: string
  channel: 'email' | 'whatsapp' | 'telegram' | 'sms' | 'multi-channel'
  steps: number
  enrolled: number
  completed: number
  responseRate: number
  status: 'active' | 'paused' | 'draft'
}

export interface MarketingAITool {
  id: string
  name: string
  description: string
  icon: string
  category: 'content' | 'analytics' | 'optimization' | 'intelligence' | 'automation'
  status: 'active' | 'beta' | 'coming-soon'
}

export interface IntegrationService {
  id: string
  name: string
  icon: string
  status: 'connected' | 'disconnected' | 'pending'
  lastSync?: string
  dataFlowing?: string
  category: 'advertising' | 'social' | 'messaging' | 'crm' | 'analytics' | 'scheduling' | 'automation'
}

// ── Reports & Intelligence ──────────────────────────────────
export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'once'
export type ReportStatus = 'draft' | 'scheduled' | 'generating' | 'ready' | 'failed' | 'sent'
export type ReportFormat = 'pdf' | 'xlsx' | 'csv' | 'json' | 'google-sheets'

export interface ScheduledReport {
  id: string
  name: string
  description?: string
  type: 'financial' | 'marketing' | 'compliance' | 'board' | 'client' | 'staff' | 'custom'
  frequency: ReportFrequency
  lastRun?: string
  nextRun?: string
  status: ReportStatus
  owner: string
  recipients: string[]
  format: ReportFormat[]
  createdDate: string
}

export interface GeneratedReport {
  id: string
  name: string
  type: string
  format: ReportFormat
  generatedAt: string
  generatedBy: string
  size: string
  status: 'ready' | 'expired' | 'archived'
  downloadCount: number
}

export interface AIInsight {
  id: string
  type: 'growth' | 'risk' | 'anomaly' | 'opportunity' | 'efficiency'
  summary: string
  confidence: number
  priority: 'high' | 'medium' | 'low'
  createdAt: string
  actionable: boolean
  impact?: string
}

export interface RevenueStream {
  id: string
  clientId?: string
  type: 'management_fee' | 'performance_fee' | 'advisory_fee' | 'subscription' | 'referral_commission'
  amount: number
  period: string
  source: string
}

export interface ExpenseRecord {
  id: string
  category: string
  subCategory: string
  department: string
  amount: number
  vendor: string
  month: string
  campaignId?: string
}

export interface CampaignMetric {
  id: string
  platform: string
  name: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenueGenerated: number
  startDate: string
  endDate?: string
  status: 'active' | 'paused' | 'completed'
}

export interface EmailDraft {
  id: string
  subject: string
  body: string
  template?: string
  recipients: string[]
  scheduledDate?: string
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
  sentDate?: string
  openRate?: number
  clickRate?: number
}

export interface CallLog {
  id: string
  contactName: string
  contactPhone: string
  direction: 'inbound' | 'outbound'
  duration: number
  outcome: 'connected' | 'voicemail' | 'no-answer' | 'callback-requested' | 'deal-progressed'
  notes?: string
  staffId: string
  timestamp: string
  followUpDate?: string
}

export interface DocumentVaultItem {
  id: string
  name: string
  folder: 'client' | 'fund' | 'compliance' | 'marketing' | 'internal' | 'reports'
  type: string
  size: string
  uploadedBy: string
  uploadDate: string
  version: number
  tags: string[]
  accessRoles: AdminRole[]
  expiryDate?: string
}

export interface KPIAlert {
  id: string
  metric: string
  condition: 'above' | 'below' | 'change'
  threshold: number
  currentValue: number
  triggered: boolean
  lastChecked: string
  severity: 'critical' | 'warning' | 'info'
}
