/* ─────────────────────────────────────────────────────────────
   Supabase Database Types — GHL India Ventures
   Auto-generate later via: npx supabase gen types typescript
   For now, hand-crafted to match our schema.
   ───────────────────────────────────────────────────────────── */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ── Enums ──────────────────────────────────────────────────
export type Portal = 'admin' | 'staff' | 'client'

export type AdminRole =
  | 'super-admin' | 'admin' | 'compliance-officer' | 'fund-manager'
  | 'manager' | 'marketing-manager' | 'marketing-executive'
  | 'sales' | 'operations' | 'hr' | 'viewer'

export type StaffRole =
  | 'cs-lead' | 'senior-cs-agent' | 'cs-agent' | 'relationship-manager'
  | 'field-sales-manager' | 'field-sales-executive' | 'site-inspector'
  | 'kyc-officer' | 'operations-executive' | 'hr-executive'
  | 'general-employee' | 'intern'

export type KYCStatus = 'pending' | 'under-review' | 'approved' | 'rejected' | 'expired'
export type AccountStatus = 'active' | 'frozen' | 'suspended' | 'closed'
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive' | 'speculative'
export type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type LeadSource = 'website' | 'referral' | 'cold-outreach' | 'event' | 'social-media' | 'whatsapp'
export type TicketStatus = 'open' | 'in-progress' | 'awaiting-client' | 'awaiting-internal' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'
export type ApprovalType = 'kyc' | 'investment' | 'document' | 'access' | 'payout'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated'
export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'
export type ExpenseCategory = 'operations' | 'marketing' | 'technology' | 'legal' | 'travel' | 'hr' | 'fuel' | 'meals' | 'site-entry' | 'parking' | 'accommodation' | 'materials' | 'phone' | 'other'
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'reimbursed'
export type AssetCategory = 'digital' | 'physical' | 'license' | 'certificate'
export type BrokerSpecialization = 'residential' | 'commercial' | 'land' | 'industrial' | 'mixed-use'
export type ContentStatus = 'idea' | 'draft' | 'review' | 'approved' | 'scheduled' | 'published'

// ── Table Row Types ────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  name: string
  phone?: string | null
  avatar_url?: string | null
  portal: Portal
  created_at: string
  updated_at: string
}

export interface AdminProfile {
  id: string
  role: AdminRole
  department?: string | null
  permissions?: Json
}

export interface StaffProfile {
  id: string
  role: StaffRole
  staff_code: string
  department: string
  designation: string
  reporting_to?: string | null
  join_date: string
  status: 'active' | 'probation' | 'notice-period' | 'contract'
}

export interface ClientProfile {
  id: string
  pan?: string | null
  kyc_status: KYCStatus
  account_status: AccountStatus
  risk_profile?: RiskProfile | null
  aum: number
  invested_amount: number
  current_value: number
  assigned_rm?: string | null
  city?: string | null
  accredited: boolean
}

export interface Lead {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  source?: LeadSource | null
  stage: LeadStage
  value: number
  probability: number
  ai_score: number
  assigned_to?: string | null
  next_follow_up?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface KYCDocument {
  id: string
  client_id: string
  type: string
  file_name: string
  file_url?: string | null
  status: KYCStatus
  reviewer_id?: string | null
  notes?: string | null
  uploaded_at: string
  reviewed_at?: string | null
}

export interface Employee {
  id: string
  profile_id?: string | null
  name: string
  email: string
  phone?: string | null
  role_title: string
  department: string
  status: 'active' | 'on-leave' | 'inactive'
  join_date: string
  reporting_to?: string | null
}

export interface Approval {
  id: string
  type: ApprovalType
  requested_by: string
  description: string
  priority: TicketPriority
  assigned_reviewer?: string | null
  status: ApprovalStatus
  created_at: string
  resolved_at?: string | null
}

export interface RiskFlag {
  id: string
  severity: RiskSeverity
  title: string
  description?: string | null
  affected_entity?: string | null
  status: 'open' | 'investigating' | 'resolved' | 'escalated'
  assigned_to?: string | null
  created_at: string
  resolved_at?: string | null
}

export interface Invoice {
  id: string
  client_id?: string | null
  client_name: string
  amount: number
  gst: number
  total: number
  date: string
  due_date: string
  status: InvoiceStatus
  type: string
}

export interface Expense {
  id: string
  description: string
  category: ExpenseCategory
  amount: number
  submitted_by?: string | null
  date: string
  status: ExpenseStatus
  receipt_url?: string | null
  linked_visit?: string | null
}

export interface Commission {
  id: string
  sales_rep: string
  deal_id?: string | null
  client_name: string
  deal_value: number
  commission_rate: number
  commission_amount: number
  status: 'pending' | 'approved' | 'paid'
  period: string
}

export interface Asset {
  id: string
  name: string
  category: AssetCategory
  serial_number?: string | null
  assigned_to?: string | null
  status: 'active' | 'expired' | 'maintenance' | 'decommissioned'
  purchase_date: string
  expiry_date?: string | null
  value: number
}

export interface Ticket {
  id: string
  ticket_number: string
  client_id?: string | null
  client_name: string
  subject: string
  description?: string | null
  category?: string | null
  priority: TicketPriority
  status: TicketStatus
  assigned_to?: string | null
  channel?: string | null
  escalation_level: number
  csat_score?: number | null
  created_at: string
  updated_at: string
  resolved_at?: string | null
}

export interface Task {
  id: string
  title: string
  description?: string | null
  priority: 'urgent' | 'high' | 'normal' | 'low'
  status: 'todo' | 'in-progress' | 'blocked' | 'done'
  assigned_to?: string | null
  assigned_by?: string | null
  due_date?: string | null
  linked_client?: string | null
  linked_ticket?: string | null
  source: 'manual' | 'auto' | 'escalation' | 'admin'
  tags: string[]
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'info' | 'success' | 'warning' | 'critical'
  title: string
  message?: string | null
  module?: string | null
  read: boolean
  action_url?: string | null
  created_at: string
}

export interface AuditLogEntry {
  id: string
  user_id?: string | null
  user_name: string
  action: string
  module: string
  details?: string | null
  ip_address?: string | null
  created_at: string
}

export interface Investment {
  id: string
  client_id: string
  fund_name: string
  fund_type: string
  invested_amount: number
  current_value: number
  return_pct: number
  status: 'active' | 'matured' | 'exited'
  milestone: number
  invested_at: string
}

export interface Transaction {
  id: string
  client_id: string
  date: string
  type: string
  amount: number
  fund?: string | null
  status: 'completed' | 'pending' | 'info'
  created_at: string
}

export interface Message {
  id: string
  from_id: string
  to_id: string
  subject: string
  body: string
  read: boolean
  attachments: string[]
  created_at: string
}

export interface RealtyBroker {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  rera_id?: string | null
  specialization?: BrokerSpecialization | null
  city: string
  status: 'active' | 'inactive' | 'pending-verification' | 'suspended'
  total_deals: number
  total_value: number
  commission: number
  rating: number
  join_date: string
  last_active?: string | null
  assigned_rm?: string | null
  tags: string[]
}

export interface BrokerInquiry {
  id: string
  broker_id?: string | null
  broker_name: string
  source?: 'website' | 'referral' | 'direct' | 'event' | null
  type?: 'land' | 'realty' | 'partnership' | 'listing' | null
  subject: string
  message?: string | null
  status: 'new' | 'contacted' | 'in-progress' | 'closed' | 'converted'
  priority: TicketPriority
  assigned_to?: string | null
  property_type?: string | null
  location?: string | null
  estimated_value?: number | null
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt?: string | null
  content?: string | null
  category?: string | null
  image_url?: string | null
  author: string
  read_time?: string | null
  published: boolean
  published_at?: string | null
  created_at: string
  updated_at: string
}

export interface SiteSetting {
  key: string
  value: Json
  updated_by?: string | null
  updated_at: string
}

export interface Document {
  id: string
  name: string
  type: string
  category: string
  file_url?: string | null
  uploaded_by?: string | null
  size?: string | null
  version: number
  tags: string[]
  access_roles: string[]
  uploaded_at: string
}

export interface MarketingCampaign {
  id: string
  name: string
  type: string
  channels: string[]
  status: 'draft' | 'scheduled' | 'live' | 'paused' | 'completed' | 'archived'
  start_date?: string | null
  end_date?: string | null
  budget: number
  spend: number
  leads: number
  roi: number
  owner?: string | null
  description?: string | null
  created_at: string
}

export interface KBArticle {
  id: string
  title: string
  category: string
  content: string
  author?: string | null
  helpful: number
  not_helpful: number
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  type?: 'policy-update' | 'process-change' | 'event' | 'achievement' | 'general' | null
  posted_by?: string | null
  pinned: boolean
  department?: string | null
  created_at: string
}

export interface AIResult {
  id: string
  tool_id: string
  user_id?: string | null
  input?: Json | null
  output?: Json | null
  confidence?: number | null
  created_at: string
}

// ── Database Interface ─────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & Pick<Profile, 'id' | 'email' | 'name' | 'portal'>; Update: Partial<Profile> }
      admin_profiles: { Row: AdminProfile; Insert: Partial<AdminProfile> & Pick<AdminProfile, 'id' | 'role'>; Update: Partial<AdminProfile> }
      staff_profiles: { Row: StaffProfile; Insert: Partial<StaffProfile> & Pick<StaffProfile, 'id' | 'role' | 'staff_code' | 'department' | 'designation' | 'join_date'>; Update: Partial<StaffProfile> }
      client_profiles: { Row: ClientProfile; Insert: Partial<ClientProfile> & Pick<ClientProfile, 'id'>; Update: Partial<ClientProfile> }
      leads: { Row: Lead; Insert: Partial<Lead> & Pick<Lead, 'name'>; Update: Partial<Lead> }
      kyc_documents: { Row: KYCDocument; Insert: Partial<KYCDocument> & Pick<KYCDocument, 'client_id' | 'type' | 'file_name'>; Update: Partial<KYCDocument> }
      employees: { Row: Employee; Insert: Partial<Employee> & Pick<Employee, 'name' | 'email' | 'role_title' | 'department' | 'join_date'>; Update: Partial<Employee> }
      approvals: { Row: Approval; Insert: Partial<Approval> & Pick<Approval, 'type' | 'requested_by' | 'description'>; Update: Partial<Approval> }
      risk_flags: { Row: RiskFlag; Insert: Partial<RiskFlag> & Pick<RiskFlag, 'severity' | 'title'>; Update: Partial<RiskFlag> }
      invoices: { Row: Invoice; Insert: Partial<Invoice> & Pick<Invoice, 'id' | 'client_name' | 'amount' | 'total' | 'date' | 'due_date' | 'type'>; Update: Partial<Invoice> }
      expenses: { Row: Expense; Insert: Partial<Expense> & Pick<Expense, 'description' | 'category' | 'amount' | 'date'>; Update: Partial<Expense> }
      commissions: { Row: Commission; Insert: Partial<Commission> & Pick<Commission, 'sales_rep' | 'client_name' | 'deal_value' | 'commission_rate' | 'commission_amount' | 'period'>; Update: Partial<Commission> }
      assets: { Row: Asset; Insert: Partial<Asset> & Pick<Asset, 'name' | 'category' | 'purchase_date'>; Update: Partial<Asset> }
      tickets: { Row: Ticket; Insert: Partial<Ticket> & Pick<Ticket, 'ticket_number' | 'client_name' | 'subject'>; Update: Partial<Ticket> }
      tasks: { Row: Task; Insert: Partial<Task> & Pick<Task, 'title'>; Update: Partial<Task> }
      notifications: { Row: Notification; Insert: Partial<Notification> & Pick<Notification, 'user_id' | 'title'>; Update: Partial<Notification> }
      audit_log: { Row: AuditLogEntry; Insert: Partial<AuditLogEntry> & Pick<AuditLogEntry, 'user_name' | 'action' | 'module'>; Update: Partial<AuditLogEntry> }
      investments: { Row: Investment; Insert: Partial<Investment> & Pick<Investment, 'client_id' | 'fund_name' | 'fund_type' | 'invested_amount' | 'current_value'>; Update: Partial<Investment> }
      transactions: { Row: Transaction; Insert: Partial<Transaction> & Pick<Transaction, 'client_id' | 'date' | 'type' | 'amount'>; Update: Partial<Transaction> }
      messages: { Row: Message; Insert: Partial<Message> & Pick<Message, 'from_id' | 'to_id' | 'subject' | 'body'>; Update: Partial<Message> }
      realty_brokers: { Row: RealtyBroker; Insert: Partial<RealtyBroker> & Pick<RealtyBroker, 'name' | 'city' | 'join_date'>; Update: Partial<RealtyBroker> }
      broker_inquiries: { Row: BrokerInquiry; Insert: Partial<BrokerInquiry> & Pick<BrokerInquiry, 'broker_name' | 'subject'>; Update: Partial<BrokerInquiry> }
      blog_posts: { Row: BlogPost; Insert: Partial<BlogPost> & Pick<BlogPost, 'slug' | 'title'>; Update: Partial<BlogPost> }
      site_settings: { Row: SiteSetting; Insert: SiteSetting; Update: Partial<SiteSetting> }
      documents: { Row: Document; Insert: Partial<Document> & Pick<Document, 'name' | 'type' | 'category'>; Update: Partial<Document> }
      marketing_campaigns: { Row: MarketingCampaign; Insert: Partial<MarketingCampaign> & Pick<MarketingCampaign, 'name' | 'type'>; Update: Partial<MarketingCampaign> }
      kb_articles: { Row: KBArticle; Insert: Partial<KBArticle> & Pick<KBArticle, 'title' | 'category' | 'content'>; Update: Partial<KBArticle> }
      announcements: { Row: Announcement; Insert: Partial<Announcement> & Pick<Announcement, 'title' | 'content'>; Update: Partial<Announcement> }
      ai_results: { Row: AIResult; Insert: Partial<AIResult> & Pick<AIResult, 'tool_id'>; Update: Partial<AIResult> }
    }
  }
}
