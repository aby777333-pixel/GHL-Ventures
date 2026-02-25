/* ─────────────────────────────────────────────────────────────
   Admin Data Service — Supabase queries with mock fallback

   Every export mirrors one from adminMockData.ts, so modules
   can swap imports incrementally.

   TABLE NAME MAP (TypeScript type → actual Supabase table):
   ─────────────────────────────────────────────────────────
   clients (was client_profiles) → EXISTS as "clients"
   leads                         → EXISTS as "leads"
   staff_profiles (was employees) → EXISTS as "staff_profiles"
   expenses                       → EXISTS as "expenses"
   campaigns (was marketing_campaigns) → EXISTS as "campaigns"
   audit_logs (was audit_log)     → EXISTS as "audit_logs"
   notifications                  → EXISTS as "notifications"
   documents                      → EXISTS as "documents"
   ─────────────────────────────────────────────────────────
   Tables NOT yet created in DB (use mock fallback):
   kyc_documents, approvals, risk_flags, invoices,
   commissions, assets, realty_brokers, broker_inquiries,
   blog_posts, tickets, tasks
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'
import type {
  Lead, Employee, Approval, RiskFlag, Invoice, Expense,
  Commission, Asset, RealtyBroker, BrokerInquiry, Notification,
  AuditLogEntry, BlogPost, MarketingCampaign, Ticket, Task, Document,
} from './types'

// Mock data fallback (used when Supabase is not configured)
import {
  CLIENTS_DATA, LEADS_DATA, EMPLOYEES_DATA, KYC_DOCUMENTS,
  INVOICES_DATA, EXPENSES_DATA, APPROVALS_DATA, RISK_FLAGS_DATA,
  COMMISSIONS_DATA, ASSETS_DATA, REALTY_BROKERS_DATA,
  BROKER_INQUIRIES_DATA, ADMIN_NOTIFICATIONS, ACTIVITY_FEED,
  AI_TOOLS, OVERVIEW_KPIS, AUM_GROWTH_DATA, REVENUE_BREAKDOWN,
  SYSTEM_HEALTH, MARKETING_CAMPAIGNS_DATA, MARKETING_CONTENT_DATA,
  AUDIENCE_SEGMENTS_DATA, OUTREACH_SEQUENCES_DATA, CHANNEL_PERFORMANCE_DATA,
  MARKETING_AI_TOOLS, INTEGRATION_SERVICES_DATA,
} from '../admin/adminMockData'

// ── Generic query helper ────────────────────────────────────
async function queryTable<T>(table: string, mockData: T[], orderBy = 'created_at'): Promise<T[]> {
  if (!isSupabaseConfigured()) return mockData

  try {
    const { data, error } = await supabase.from(table as any).select('*').order(orderBy, { ascending: false }) as any
    if (error) {
      console.warn(`[adminData] Error fetching ${table}:`, error.message)
      return mockData
    }
    return (data as T[]) || mockData
  } catch (err) {
    console.warn(`[adminData] Exception fetching ${table}:`, err)
    return mockData
  }
}

// ── Overview ────────────────────────────────────────────────
export function getOverviewKPIs() { return OVERVIEW_KPIS }
export function getAUMGrowth() { return AUM_GROWTH_DATA }
export function getRevenueBreakdown() { return REVENUE_BREAKDOWN }
export function getSystemHealth() { return SYSTEM_HEALTH }

// ── Clients ─────────────────────────────────────────────────
// Actual table: "clients" (not "client_profiles")
// clients.user_id → profiles.id for the user's profile data
export async function fetchClients() {
  if (!isSupabaseConfigured()) return CLIENTS_DATA
  try {
    const { data, error } = await (supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false }) as any)
    if (error || !data) return CLIENTS_DATA
    return (data as any[]).map((c: any) => ({
      id: c.id,
      name: c.full_name || '',
      email: c.email || '',
      phone: c.phone || '',
      kycStatus: c.kyc_status,
      accountStatus: c.kyc_status === 'verified' ? 'active' : 'pending',
      aum: c.total_invested || 0,
      riskProfile: c.risk_profile,
      city: c.city,
      joinDate: c.created_at?.split('T')[0] || '',
    }))
  } catch { return CLIENTS_DATA }
}

// Table not yet created — uses mock fallback
export async function fetchKYCDocuments() {
  return queryTable('kyc_documents', KYC_DOCUMENTS)
}

// ── Leads ───────────────────────────────────────────────────
// Actual table: "leads" — EXISTS
export async function fetchLeads() {
  return queryTable<any>('leads', LEADS_DATA)
}

// ── Employees ───────────────────────────────────────────────
// Actual table: "staff_profiles" (not "employees")
export async function fetchEmployees() {
  if (!isSupabaseConfigured()) return EMPLOYEES_DATA
  try {
    const { data, error } = await (supabase
      .from('staff_profiles')
      .select('*')
      .order('created_at', { ascending: false }) as any)
    if (error || !data) return EMPLOYEES_DATA
    return (data as any[]).map((s: any) => ({
      id: s.id,
      name: s.full_name || s.designation || '',
      email: '',
      phone: '',
      role_title: s.designation || s.role || '',
      department: s.department || '',
      status: s.status === 'active' ? 'active' : 'inactive',
      join_date: s.join_date || s.created_at?.split('T')[0] || '',
      reporting_to: s.reporting_to || null,
    }))
  } catch { return EMPLOYEES_DATA }
}

// ── Compliance ──────────────────────────────────────────────
// Tables not yet created — use mock fallback
export async function fetchApprovals() {
  return queryTable<any>('approvals', APPROVALS_DATA)
}

export async function fetchRiskFlags() {
  return queryTable<any>('risk_flags', RISK_FLAGS_DATA)
}

// Actual table: "audit_logs" (not "audit_log")
export async function fetchAuditLog() {
  if (!isSupabaseConfigured()) return ACTIVITY_FEED
  try {
    const { data, error } = await (supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100) as any)
    if (error || !data) return ACTIVITY_FEED
    return data
  } catch { return ACTIVITY_FEED }
}

// ── Finance ─────────────────────────────────────────────────
// Tables not yet created — use mock fallback
export async function fetchInvoices() {
  return queryTable<any>('invoices', INVOICES_DATA)
}

// Actual table: "expenses" — EXISTS
export async function fetchExpenses() {
  return queryTable<any>('expenses', EXPENSES_DATA)
}

// Table not yet created — uses mock fallback
export async function fetchCommissions() {
  return queryTable<any>('commissions', COMMISSIONS_DATA)
}

// ── Assets ──────────────────────────────────────────────────
// Table not yet created — uses mock fallback
export async function fetchAssets() {
  return queryTable<any>('assets', ASSETS_DATA)
}

// ── Realty Brokers ──────────────────────────────────────────
// Tables not yet created — use mock fallback
export async function fetchRealtyBrokers() {
  return queryTable<any>('realty_brokers', REALTY_BROKERS_DATA)
}

export async function fetchBrokerInquiries() {
  return queryTable<any>('broker_inquiries', BROKER_INQUIRIES_DATA)
}

// ── Notifications ───────────────────────────────────────────
// Actual table: "notifications" — EXISTS
export async function fetchNotifications() {
  return queryTable<any>('notifications', ADMIN_NOTIFICATIONS)
}

// ── AI Tools ────────────────────────────────────────────────
export function getAITools() { return AI_TOOLS }

// ── Marketing ───────────────────────────────────────────────
// Actual table: "campaigns" (not "marketing_campaigns")
export async function fetchMarketingCampaigns() {
  return queryTable<any>('campaigns', MARKETING_CAMPAIGNS_DATA)
}
export function getMarketingContent() { return MARKETING_CONTENT_DATA }
export function getMarketingAudiences() { return AUDIENCE_SEGMENTS_DATA }
export function getMarketingSequences() { return OUTREACH_SEQUENCES_DATA }
export function getMarketingChannels() { return CHANNEL_PERFORMANCE_DATA }
export function getMarketingAITools() { return MARKETING_AI_TOOLS }
export function getMarketingIntegrations() { return INTEGRATION_SERVICES_DATA }

// ── Blog (CMS) ──────────────────────────────────────────────
// Table may not yet exist — graceful fallback
export async function fetchBlogPosts(publishedOnly = false) {
  if (!isSupabaseConfigured()) return []
  try {
    let query = supabase.from('blog_posts').select('*').order('created_at', { ascending: false }) as any
    if (publishedOnly) query = query.eq('published', true)
    const { data, error } = await query
    if (error || !data) return []
    return data
  } catch { return [] }
}

export async function fetchBlogPostBySlug(slug: string) {
  if (!isSupabaseConfigured()) return null
  try {
    const { data, error } = await (supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single() as any)
    if (error || !data) return null
    return data
  } catch { return null }
}

export async function upsertBlogPost(post: Partial<BlogPost> & { slug: string; title: string }) {
  if (!isSupabaseConfigured()) return null
  try {
    const { data, error } = await (supabase
      .from('blog_posts')
      .upsert(post as any, { onConflict: 'slug' })
      .select()
      .single() as any)
    if (error) { console.warn('[blog] Upsert error:', error.message); return null }
    return data
  } catch { return null }
}

// ── Tickets ─────────────────────────────────────────────────
export async function fetchTickets() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await (supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false }) as any)
    if (error || !data) return []
    return data
  } catch { return [] }
}

// ── Tasks ───────────────────────────────────────────────────
export async function fetchTasks() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await (supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false }) as any)
    if (error || !data) return []
    return data
  } catch { return [] }
}

// ── Documents ───────────────────────────────────────────────
export async function fetchDocuments() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await (supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false }) as any)
    if (error || !data) return []
    return data
  } catch { return [] }
}

// ── CRUD Helpers ────────────────────────────────────────────
export async function insertRow(table: string, row: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  try {
    const sb = supabase as any
    const { data, error } = await sb.from(table).insert(row).select().single()
    if (error) { console.warn(`[insert] ${table}:`, error.message); return null }
    return data
  } catch { return null }
}

export async function updateRow(table: string, id: string, updates: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  try {
    const sb = supabase as any
    const { data, error } = await sb.from(table).update(updates).eq('id', id).select().single()
    if (error) { console.warn(`[update] ${table}:`, error.message); return null }
    return data
  } catch { return null }
}

export async function deleteRow(table: string, id: string) {
  if (!isSupabaseConfigured()) return false
  try {
    const sb = supabase as any
    const { error } = await sb.from(table).delete().eq('id', id)
    if (error) { console.warn(`[delete] ${table}:`, error.message); return false }
    return true
  } catch { return false }
}
