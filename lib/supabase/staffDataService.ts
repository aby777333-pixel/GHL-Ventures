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

// ── Client View (staff portal) ──────────────────────────────
/**
 * Record consumed by the staff Client View. Combines columns from the
 * real `clients` table with derived ticket/interaction stats so each
 * card can show counts + most-recent status without extra fetches.
 */
export interface StaffClientRecord {
  id: string
  userId: string | null
  clientCode: string
  name: string
  email: string
  phone: string
  city: string
  pan: string
  kycStatus: string
  investorType: string
  riskProfile: string
  totalInvested: number
  currentValue: number
  assignedRm: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  // derived
  ticketCount: number
  openTicketCount: number
  lastTicketStatus: string
  lastInteractionAt: string
}

/** Enrich a clients row with ticket stats from the already-fetched ticket set. */
function enrichClientRow(c: any, ticketsByClient: Map<string, any[]>): StaffClientRecord {
  const bucket = ticketsByClient.get(c.id) || []
  const sorted = [...bucket].sort((a, b) => {
    const av = new Date(a.updated_at || a.created_at || 0).getTime()
    const bv = new Date(b.updated_at || b.created_at || 0).getTime()
    return bv - av
  })
  const latest = sorted[0]
  const openTickets = bucket.filter(t => !['resolved', 'closed'].includes(String(t.status || '').toLowerCase()))
  return {
    id: c.id,
    userId: c.user_id || null,
    clientCode: c.client_code || c.ghl_id || '',
    name: c.full_name || '',
    email: c.email || '',
    phone: c.phone || '',
    city: c.city || '',
    pan: c.pan || '',
    kycStatus: c.kyc_status || 'pending',
    investorType: c.investor_type || '',
    riskProfile: c.risk_profile || '',
    totalInvested: Number(c.total_invested || 0),
    currentValue: Number(c.current_value || c.aum || 0),
    assignedRm: c.assigned_rm || null,
    isActive: c.is_active !== false,
    createdAt: c.created_at || '',
    updatedAt: c.updated_at || '',
    ticketCount: bucket.length,
    openTicketCount: openTickets.length,
    lastTicketStatus: latest?.status || '',
    lastInteractionAt: latest?.updated_at || latest?.created_at || c.updated_at || c.created_at || '',
  }
}

/**
 * Fetch every client the logged-in staff is allowed to see, enriched with
 * ticket/interaction summaries. Visibility is governed by the
 * `clients_select_own` RLS policy, so callers don't need extra filtering.
 */
export async function fetchStaffClients(): Promise<StaffClientRecord[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const [clientsResp, ticketsResp] = await Promise.all([
      sb.from('clients').select('*').order('updated_at', { ascending: false }),
      sb.from('tickets').select('id, client_id, subject, status, priority, updated_at, created_at'),
    ])

    const clientRows = (clientsResp?.data as any[]) || []
    const ticketRows = (ticketsResp?.data as any[]) || []
    if (clientsResp?.error) console.warn('[staffData] fetchStaffClients error:', clientsResp.error.message)

    const byClient = new Map<string, any[]>()
    for (const t of ticketRows) {
      if (!t?.client_id) continue
      const arr = byClient.get(t.client_id) || []
      arr.push(t)
      byClient.set(t.client_id, arr)
    }

    return clientRows.map(c => enrichClientRow(c, byClient))
  } catch (err) {
    console.warn('[staffData] fetchStaffClients failed:', err)
    return []
  }
}

// ── Staff Directory ─────────────────────────────────────────
/**
 * Fetches the full staff directory for the Team module.
 * Prefers the `get_employee_directory` RPC (joins staff_profiles + profiles + auth.users).
 * Falls back to a direct join so the UI still populates if the RPC is missing.
 * Returns a shape matching `StaffEmployee` (name/email/phone/department/role/...).
 */
export async function fetchStaffEmployees() {
  if (!isSupabaseConfigured()) return []

  const mapRow = (r: any) => {
    const designation = r.designation || r.role || ''
    const joinRaw = r.join_date || r.date_of_joining || r.created_at || ''
    return {
      id: r.id,
      user_id: r.user_id,
      staffCode: r.employee_id || r.staff_code || '',
      name: r.name || r.full_name || '',
      email: r.email || '',
      phone: r.phone || '',
      designation,
      department: r.department || '',
      role: designation,
      location: r.city || r.location || '',
      shift: r.shift || '',
      status: r.status || (r.is_active === false ? 'inactive' : 'active'),
      joinDate: joinRaw ? String(joinRaw).split('T')[0] : '',
      isOnline: r.agent_status === 'available' || r.agent_status === 'busy',
      reportingTo: r.reporting_to_name || r.reporting_to || '',
      skills: r.skills || [],
    }
  }

  try {
    const { data, error } = await sb.rpc('get_employee_directory')
    if (!error && Array.isArray(data)) return data.map(mapRow)
    if (error) console.warn('[staffData] get_employee_directory RPC failed:', error.message)
  } catch (err) {
    console.warn('[staffData] get_employee_directory exception:', err)
  }

  try {
    const { data, error } = await sb
      .from('staff_profiles')
      .select('*, profiles!inner(full_name, phone, city, email)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return (data as any[]).map((s: any) => mapRow({
      id: s.id,
      user_id: s.user_id,
      employee_id: s.employee_id,
      department: s.department,
      designation: s.designation,
      date_of_joining: s.date_of_joining,
      created_at: s.created_at,
      status: s.status,
      agent_status: s.agent_status,
      is_active: s.is_active,
      reporting_to: s.reporting_to,
      skills: s.skills,
      name: s.profiles?.full_name,
      email: s.profiles?.email,
      phone: s.profiles?.phone,
      city: s.profiles?.city,
    }))
  } catch (err) {
    console.warn('[staffData] staff_profiles join fallback failed:', err)
    return []
  }
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
export function getCSKPIs() {
  return {
    ticketsResolved: 0,
    avgResponseTime: 0,
    csatScore: 0,
    callsHandled: 0,
    chatsHandled: 0,
    firstCallResolution: 0,
    queueWaitTime: 0,
    activeTickets: 0,
    escalations: 0,
    totalInteractions: 0,
  }
}

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
// DB values for `tasks.priority` (low|medium|high|critical) and `tasks.status`
// (pending|in_progress|completed|cancelled) are mapped back to the UI labels
// (low|normal|high|urgent / todo|in-progress|done) so the existing badge
// helpers and filter chips keep working unchanged.
const TASK_PRIORITY_FROM_DB: Record<string, string> = {
  critical: 'urgent', high: 'high', medium: 'normal', low: 'low',
}
const TASK_STATUS_FROM_DB: Record<string, string> = {
  pending: 'todo', in_progress: 'in-progress', completed: 'done', cancelled: 'blocked',
}
export async function fetchTasks(assignedTo?: string) {
  if (!isSupabaseConfigured()) return []
  try {
    let query = sb.from('tasks').select('*').order('created_at', { ascending: false })
    if (assignedTo) query = query.eq('assigned_to', assignedTo)
    const { data, error } = await query
    if (error || !data) return []
    return (data as any[]).map((row: any) => ({
      ...row,
      priority: TASK_PRIORITY_FROM_DB[row.priority] || row.priority,
      status: TASK_STATUS_FROM_DB[row.status] || row.status,
    }))
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
    const { data, error } = await sb
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (error || !data) return []

    // Resolve posted_by uuids → full_name
    const posterIds = Array.from(new Set((data as any[]).map(a => a.posted_by).filter(Boolean)))
    const posterMap: Record<string, string> = {}
    if (posterIds.length > 0) {
      const { data: posters } = await sb.from('profiles').select('id, full_name').in('id', posterIds)
      ;(posters || []).forEach((p: any) => { posterMap[p.id] = p.full_name || '' })
    }

    return (data as any[]).map((a: any) => ({
      id: a.id,
      title: a.title || 'Untitled',
      content: a.content || '',
      type: a.type || 'general',
      postedBy: posterMap[a.posted_by] || a.posted_by_name || 'GHL Admin',
      postedDate: a.created_at || new Date().toISOString(),
      pinned: !!a.pinned,
      readBy: a.read_by || [],
      department: a.department || '',
      active: a.active !== false,
    }))
  } catch (err) {
    console.warn('[staffData] fetchAnnouncements failed:', err)
    return []
  }
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
