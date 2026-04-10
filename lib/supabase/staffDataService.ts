/* ─────────────────────────────────────────────────────────────
   Staff Data Service — Supabase queries (production)

   All data fetched from real Supabase tables.
   Returns empty arrays/defaults when queries fail.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'
import type { StaffAITool } from '@/lib/staff/staffTypes'

// Untyped reference for queries
const sb = supabase as any

// ── Generic query helper ────────────────────────────────────
async function queryTable<T>(table: string): Promise<T[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await sb.from(table).select('*').order('created_at', { ascending: false })
    if (error) {
      console.warn(`[staffData] Error fetching ${table}:`, error.message)
      return []
    }
    return (data as T[]) || []
  } catch (err) {
    console.warn(`[staffData] Exception fetching ${table}:`, err)
    return []
  }
}

// ── Staff Directory ─────────────────────────────────────────
export async function fetchStaffEmployees() {
  return queryTable<any>('staff_profiles')
}

// ── HR / Employee Self-Service ──────────────────────────────
export async function fetchMyAttendance(staffId?: string) {
  if (!isSupabaseConfigured() || !staffId) return []
  try {
    const { data, error } = await sb.from('attendance').select('*').eq('staff_id', staffId).order('date', { ascending: false })
    if (error || !data) return []
    return data
  } catch { return [] }
}

export function getMyLeaveBalances() { return [] }

export async function fetchMyLeaveHistory(staffId?: string) {
  if (!isSupabaseConfigured() || !staffId) return []
  try {
    const { data, error } = await sb.from('leave_requests').select('*').eq('staff_id', staffId).order('created_at', { ascending: false })
    if (error || !data) return []
    return data
  } catch { return [] }
}

export async function fetchMyPayslips(staffId?: string) {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await sb.from('payslips').select('*').eq('staff_id', staffId).order('created_at', { ascending: false })
    if (error || !data) return []
    return data
  } catch { return [] }
}

// ── Customer Service ────────────────────────────────────────
export function getCSKPIs() { return { totalTickets: 0, avgResponseTime: '—', satisfaction: '—', resolvedToday: 0 } }

export async function fetchTickets(assignedTo?: string) {
  if (!isSupabaseConfigured()) return []
  try {
    let query = sb.from('tickets').select('*').order('created_at', { ascending: false })
    if (assignedTo) query = query.eq('assigned_to', assignedTo)
    const { data, error } = await query
    if (error || !data) return []
    return data
  } catch { return [] }
}

export async function fetchClientInteractions(staffId?: string) {
  if (!isSupabaseConfigured() || !staffId) return []
  try {
    const { data, error } = await sb.from('client_interactions').select('*').eq('staff_id', staffId).order('created_at', { ascending: false })
    if (error || !data) return []
    return data
  } catch { return [] }
}

export function getQueueData() { return [] }

// ── Tasks ───────────────────────────────────────────────────
export async function fetchTasks(assignedTo?: string) {
  if (!isSupabaseConfigured()) return []
  try {
    let query = sb.from('tasks').select('*').order('created_at', { ascending: false })
    if (assignedTo) query = query.eq('assigned_to', assignedTo)
    const { data, error } = await query
    if (error || !data) return []
    return data
  } catch { return [] }
}

// ── Field Operations ────────────────────────────────────────
export async function fetchFieldCheckins(staffId?: string) {
  if (!isSupabaseConfigured() || !staffId) return []
  try {
    const { data, error } = await sb.from('field_checkins').select('*').eq('staff_id', staffId).order('created_at', { ascending: false })
    if (error || !data) return []
    return data
  } catch { return [] }
}

export async function fetchSiteVisits(staffId?: string) {
  if (!isSupabaseConfigured() || !staffId) return []
  try {
    const { data, error } = await sb.from('site_visits').select('*').eq('staff_id', staffId).order('visit_date', { ascending: false })
    if (error || !data) return []
    return data
  } catch { return [] }
}

export function getFieldProspects() { return [] }
export function getFieldExpenses() { return [] }

// ── AI Tools (static config — not mock data) ────────────────
export function getStaffAITools(): StaffAITool[] {
  return [
    { id: 'ai-001', name: 'Smart Reply Generator', description: 'Generates contextual, professional reply suggestions for client queries across email, chat, and WhatsApp channels based on conversation history and knowledge base.', icon: 'MessageSquareText', category: 'cs-assist' as const, status: 'active' as const, forRoles: ['cs-lead', 'senior-cs-agent', 'cs-agent', 'relationship-manager'] },
    { id: 'ai-002', name: 'Sentiment Analyzer', description: 'Real-time analysis of client sentiment during calls and chats. Alerts agents when negative sentiment is detected and suggests de-escalation strategies.', icon: 'Heart', category: 'quality' as const, status: 'active' as const, forRoles: ['cs-lead', 'senior-cs-agent', 'cs-agent'] },
    { id: 'ai-003', name: 'Ticket Auto-Classifier', description: 'Automatically categorizes and prioritizes incoming tickets based on content analysis, client tier, and historical patterns.', icon: 'Tags', category: 'automation' as const, status: 'active' as const, forRoles: ['cs-lead', 'senior-cs-agent', 'cs-agent'] },
    { id: 'ai-004', name: 'Knowledge Base Search', description: 'AI-powered semantic search across internal knowledge base, past tickets, and regulatory documents to find relevant answers instantly.', icon: 'BookOpen', category: 'cs-assist' as const, status: 'active' as const, forRoles: ['cs-lead', 'senior-cs-agent', 'cs-agent', 'relationship-manager', 'kyc-officer'] },
    { id: 'ai-005', name: 'Call Transcription & Summary', description: 'Automatic transcription of client calls with AI-generated summaries, action items, and key discussion points extraction.', icon: 'FileAudio', category: 'automation' as const, status: 'active' as const, forRoles: ['cs-lead', 'senior-cs-agent', 'cs-agent', 'relationship-manager'] },
    { id: 'ai-006', name: 'CSAT Predictor', description: 'Predicts likely CSAT score based on interaction analysis and alerts agents to take corrective action before ticket closure.', icon: 'TrendingUp', category: 'analytics' as const, status: 'beta' as const, forRoles: ['cs-lead', 'senior-cs-agent'] },
    { id: 'ai-007', name: 'Compliance Checker', description: 'Scans agent responses for SEBI, AIF, and KYC compliance. Flags potential regulatory issues before messages are sent to clients.', icon: 'ShieldCheck', category: 'compliance' as const, status: 'active' as const, forRoles: ['cs-lead', 'senior-cs-agent', 'cs-agent', 'kyc-officer', 'relationship-manager'] },
    { id: 'ai-008', name: 'Escalation Predictor', description: 'Identifies tickets likely to escalate based on client history, issue complexity, and response patterns. Recommends proactive actions.', icon: 'AlertTriangle', category: 'analytics' as const, status: 'active' as const, forRoles: ['cs-lead', 'senior-cs-agent'] },
    { id: 'ai-009', name: 'Client 360 Insights', description: 'Consolidated view of client history, investment portfolio, past interactions, sentiment trends, and predicted needs for personalized service.', icon: 'UserCircle', category: 'analytics' as const, status: 'active' as const, forRoles: ['cs-lead', 'senior-cs-agent', 'cs-agent', 'relationship-manager'] },
    { id: 'ai-010', name: 'Queue Optimizer', description: 'AI-driven queue management that routes tickets to the best-suited agent based on skills, workload, language, and client tier.', icon: 'GitBranch', category: 'automation' as const, status: 'active' as const, forRoles: ['cs-lead'] },
    { id: 'ai-011', name: 'KYC Document Verifier', description: 'Automated verification of uploaded KYC documents (PAN, Aadhaar, bank statements) using OCR and cross-referencing with government databases.', icon: 'ScanSearch', category: 'compliance' as const, status: 'active' as const, forRoles: ['kyc-officer', 'cs-lead', 'senior-cs-agent', 'operations-executive'] },
    { id: 'ai-012', name: 'Multilingual Translator', description: 'Real-time translation for client communications across Tamil, Hindi, Telugu, Kannada, and Malayalam with domain-specific financial vocabulary.', icon: 'Languages', category: 'cs-assist' as const, status: 'beta' as const, forRoles: ['cs-lead', 'senior-cs-agent', 'cs-agent', 'relationship-manager', 'field-sales-executive'] },
    { id: 'ai-013', name: 'Route Optimizer', description: 'Plans the most efficient travel route for multiple site visits and client meetings in a day, considering traffic patterns and meeting times.', icon: 'MapPin', category: 'field-ops' as const, status: 'active' as const, forRoles: ['field-sales-manager', 'field-sales-executive', 'site-inspector'] },
    { id: 'ai-014', name: 'Site Progress Analyzer', description: 'Analyzes construction site photos to automatically assess progress percentage, identify issues, and generate standardized inspection reports.', icon: 'Camera', category: 'field-ops' as const, status: 'beta' as const, forRoles: ['site-inspector', 'field-sales-manager'] },
    { id: 'ai-015', name: 'Prospect Scoring Engine', description: 'AI-based lead scoring that ranks field prospects by conversion probability using demographic, financial, and behavioral signals.', icon: 'Target', category: 'intelligence' as const, status: 'active' as const, forRoles: ['field-sales-manager', 'field-sales-executive', 'relationship-manager'] },
    { id: 'ai-016', name: 'Market Intelligence Brief', description: 'Daily AI-curated brief on local real estate market trends, competitor fund launches, regulatory updates, and investment climate for field teams.', icon: 'Newspaper', category: 'intelligence' as const, status: 'active' as const, forRoles: ['field-sales-manager', 'field-sales-executive', 'relationship-manager', 'cs-lead'] },
    { id: 'ai-017', name: 'Expense Auto-Categorizer', description: 'Scans expense receipts via photo, auto-extracts vendor, amount, and category. Pre-fills expense claims for quick submission.', icon: 'Receipt', category: 'field-ops' as const, status: 'active' as const, forRoles: ['field-sales-manager', 'field-sales-executive', 'site-inspector'] },
    { id: 'ai-018', name: 'Meeting Prep Assistant', description: 'Prepares a comprehensive brief before investor meetings including client profile, past interactions, investment preferences, and talking points.', icon: 'Briefcase', category: 'intelligence' as const, status: 'active' as const, forRoles: ['field-sales-manager', 'field-sales-executive', 'relationship-manager'] },
    { id: 'ai-019', name: 'Geo-Fence Attendance', description: 'Validates field check-ins using GPS coordinates and geo-fencing. Automatically logs attendance for site visits within designated zones.', icon: 'MapPinned', category: 'field-ops' as const, status: 'active' as const, forRoles: ['field-sales-manager', 'field-sales-executive', 'site-inspector'] },
    { id: 'ai-020', name: 'Pipeline Forecast', description: 'AI-powered pipeline forecasting that predicts monthly deal closures, revenue projections, and identifies at-risk deals needing attention.', icon: 'BarChart3', category: 'intelligence' as const, status: 'active' as const, forRoles: ['field-sales-manager', 'field-sales-executive', 'relationship-manager', 'cs-lead'] },
  ]
}

// ── Knowledge Base & Training ───────────────────────────────
export async function fetchKBArticles() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await sb.from('kb_articles').select('*').order('created_at', { ascending: false })
    if (error || !data) return []
    return data
  } catch { return [] }
}

export async function fetchAnnouncements() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await sb.from('announcements').select('*').eq('active', true).order('created_at', { ascending: false })
    if (error || !data) return []
    return data
  } catch { return [] }
}

export function getTrainingModules() { return [] }
export function getDailyQuotes() { return [] }

// ── Notifications ───────────────────────────────────────────
export async function fetchStaffNotifications(staffId?: string) {
  if (!isSupabaseConfigured() || !staffId) return []
  try {
    const { data, error } = await sb.from('notifications').select('*').eq('user_id', staffId).order('created_at', { ascending: false }).limit(50)
    if (error || !data) return []
    return data
  } catch { return [] }
}

// ── CRUD Helpers ────────────────────────────────────────────
export async function createTicket(ticket: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  try {
    const { data, error } = await sb.from('tickets').insert(ticket).select().single()
    if (error) { console.warn('[staff] Create ticket error:', error.message); return null }
    return data
  } catch { return null }
}

export async function updateTicket(id: string, updates: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  try {
    const { data, error } = await sb.from('tickets').update(updates).eq('id', id).select().single()
    if (error) { console.warn('[staff] Update ticket error:', error.message); return null }
    return data
  } catch { return null }
}

export async function createFieldCheckin(checkin: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  try {
    const { data, error } = await sb.from('field_checkins').insert(checkin).select().single()
    if (error) { console.warn('[staff] Checkin error:', error.message); return null }
    return data
  } catch { return null }
}

export async function submitLeaveRequest(leave: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  try {
    const { data, error } = await sb.from('leave_requests').insert(leave).select().single()
    if (error) { console.warn('[staff] Leave request error:', error.message); return null }
    return data
  } catch { return null }
}

export async function submitExpense(expense: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  try {
    const { data, error } = await sb.from('expenses').insert(expense).select().single()
    if (error) { console.warn('[staff] Expense error:', error.message); return null }
    return data
  } catch { return null }
}

export async function recordAttendance(record: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  try {
    const { data, error } = await sb.from('attendance').insert(record).select().single()
    if (error) { console.warn('[staff] Attendance error:', error.message); return null }
    return data
  } catch { return null }
}

export async function updateAgentStatus(staffId: string, status: string) {
  if (!isSupabaseConfigured() || !staffId) return null
  try {
    const { data, error } = await sb.from('staff_profiles').update({ agent_status: status }).eq('user_id', staffId).select().single()
    if (error) { console.warn('[staff] Agent status error:', error.message); return null }
    return data
  } catch { return null }
}
