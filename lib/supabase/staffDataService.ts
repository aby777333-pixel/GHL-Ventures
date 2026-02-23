/* ─────────────────────────────────────────────────────────────
   Staff Data Service — Supabase queries with mock fallback

   Mirrors all exports from staffMockData.ts so modules
   can swap imports incrementally.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'

// Mock data fallback
import {
  STAFF_EMPLOYEES, MY_ATTENDANCE_DATA, MY_LEAVE_BALANCES,
  MY_LEAVE_HISTORY, MY_PAYSLIPS, CS_KPIS_DATA,
  TICKETS_DATA, CLIENT_INTERACTIONS_DATA, QUEUE_DATA,
  TASKS_DATA, FIELD_CHECKINS_DATA, SITE_VISITS_DATA,
  FIELD_PROSPECTS_DATA, FIELD_EXPENSES_DATA,
  STAFF_AI_TOOLS, KB_ARTICLES_DATA, ANNOUNCEMENTS_DATA,
  TRAINING_MODULES_DATA, STAFF_DAILY_QUOTES,
} from '../staff/staffMockData'

// Untyped reference for queries
const sb = supabase as any

// ── Generic query helper ────────────────────────────────────
async function queryTable<T>(table: string, mockData: T[]): Promise<T[]> {
  if (!isSupabaseConfigured()) return mockData
  const { data, error } = await sb.from(table).select('*').order('created_at', { ascending: false })
  if (error) {
    console.warn(`[staffData] Error fetching ${table}:`, error.message)
    return mockData
  }
  return (data as T[]) || mockData
}

// ── Staff Directory ─────────────────────────────────────────
export async function fetchStaffEmployees() {
  return queryTable<any>('staff_profiles', STAFF_EMPLOYEES)
}

// ── HR / Employee Self-Service ──────────────────────────────
export async function fetchMyAttendance(staffId?: string) {
  if (!isSupabaseConfigured()) return MY_ATTENDANCE_DATA
  if (!staffId) return MY_ATTENDANCE_DATA
  const { data, error } = await sb.from('attendance').select('*').eq('staff_id', staffId).order('date', { ascending: false })
  if (error || !data) return MY_ATTENDANCE_DATA
  return data
}

export function getMyLeaveBalances() { return MY_LEAVE_BALANCES }

export async function fetchMyLeaveHistory(staffId?: string) {
  if (!isSupabaseConfigured()) return MY_LEAVE_HISTORY
  if (!staffId) return MY_LEAVE_HISTORY
  const { data, error } = await sb.from('leave_requests').select('*').eq('staff_id', staffId).order('created_at', { ascending: false })
  if (error || !data) return MY_LEAVE_HISTORY
  return data
}

export async function fetchMyPayslips(staffId?: string) {
  if (!isSupabaseConfigured()) return MY_PAYSLIPS
  // Payslips would come from a payslips table — for now, mock
  return MY_PAYSLIPS
}

// ── Customer Service ────────────────────────────────────────
export function getCSKPIs() { return CS_KPIS_DATA }

export async function fetchTickets(assignedTo?: string) {
  if (!isSupabaseConfigured()) return TICKETS_DATA
  let query = sb.from('tickets').select('*').order('created_at', { ascending: false })
  if (assignedTo) query = query.eq('assigned_to', assignedTo)
  const { data, error } = await query
  if (error || !data) return TICKETS_DATA
  return data
}

export async function fetchClientInteractions(staffId?: string) {
  if (!isSupabaseConfigured()) return CLIENT_INTERACTIONS_DATA
  // Would come from a client_interactions table — for now, mock
  return CLIENT_INTERACTIONS_DATA
}

export function getQueueData() { return QUEUE_DATA }

// ── Tasks ───────────────────────────────────────────────────
export async function fetchTasks(assignedTo?: string) {
  if (!isSupabaseConfigured()) return TASKS_DATA
  let query = sb.from('tasks').select('*').order('created_at', { ascending: false })
  if (assignedTo) query = query.eq('assigned_to', assignedTo)
  const { data, error } = await query
  if (error || !data) return TASKS_DATA
  return data
}

// ── Field Operations ────────────────────────────────────────
export async function fetchFieldCheckins(staffId?: string) {
  if (!isSupabaseConfigured()) return FIELD_CHECKINS_DATA
  if (!staffId) return FIELD_CHECKINS_DATA
  const { data, error } = await sb.from('field_checkins').select('*').eq('staff_id', staffId).order('created_at', { ascending: false })
  if (error || !data) return FIELD_CHECKINS_DATA
  return data
}

export async function fetchSiteVisits(staffId?: string) {
  if (!isSupabaseConfigured()) return SITE_VISITS_DATA
  if (!staffId) return SITE_VISITS_DATA
  const { data, error } = await sb.from('site_visits').select('*').eq('staff_id', staffId).order('visit_date', { ascending: false })
  if (error || !data) return SITE_VISITS_DATA
  return data
}

export function getFieldProspects() { return FIELD_PROSPECTS_DATA }
export function getFieldExpenses() { return FIELD_EXPENSES_DATA }

// ── AI Tools ────────────────────────────────────────────────
export function getStaffAITools() { return STAFF_AI_TOOLS }

// ── Knowledge Base & Training ───────────────────────────────
export async function fetchKBArticles() {
  if (!isSupabaseConfigured()) return KB_ARTICLES_DATA
  const { data, error } = await sb.from('kb_articles').select('*').order('created_at', { ascending: false })
  if (error || !data) return KB_ARTICLES_DATA
  return data
}

export async function fetchAnnouncements() {
  if (!isSupabaseConfigured()) return ANNOUNCEMENTS_DATA
  const { data, error } = await sb.from('announcements').select('*').eq('active', true).order('created_at', { ascending: false })
  if (error || !data) return ANNOUNCEMENTS_DATA
  return data
}

export function getTrainingModules() { return TRAINING_MODULES_DATA }
export function getDailyQuotes() { return STAFF_DAILY_QUOTES }

// ── Notifications ───────────────────────────────────────────
export async function fetchStaffNotifications(staffId?: string) {
  if (!isSupabaseConfigured()) return []
  if (!staffId) return []
  const { data, error } = await sb.from('notifications').select('*').eq('user_id', staffId).order('created_at', { ascending: false }).limit(50)
  if (error || !data) return []
  return data
}

// ── CRUD Helpers ────────────────────────────────────────────
export async function createTicket(ticket: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await sb.from('tickets').insert(ticket).select().single()
  if (error) { console.warn('[staff] Create ticket error:', error.message); return null }
  return data
}

export async function updateTicket(id: string, updates: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await sb.from('tickets').update(updates).eq('id', id).select().single()
  if (error) { console.warn('[staff] Update ticket error:', error.message); return null }
  return data
}

export async function createFieldCheckin(checkin: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await sb.from('field_checkins').insert(checkin).select().single()
  if (error) { console.warn('[staff] Checkin error:', error.message); return null }
  return data
}

export async function submitLeaveRequest(leave: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await sb.from('leave_requests').insert(leave).select().single()
  if (error) { console.warn('[staff] Leave request error:', error.message); return null }
  return data
}

export async function submitExpense(expense: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await sb.from('expenses').insert(expense).select().single()
  if (error) { console.warn('[staff] Expense error:', error.message); return null }
  return data
}
