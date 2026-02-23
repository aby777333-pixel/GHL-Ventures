/* ─────────────────────────────────────────────────────────────
   Admin Data Service — Supabase queries with mock fallback

   Every export mirrors one from adminMockData.ts, so modules
   can swap imports incrementally.
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
async function queryTable<T>(table: string, mockData: T[]): Promise<T[]> {
  if (!isSupabaseConfigured()) return mockData

  const { data, error } = await supabase.from(table as any).select('*').order('created_at', { ascending: false }) as any
  if (error) {
    console.warn(`[adminData] Error fetching ${table}:`, error.message)
    return mockData // Fallback to mock on error
  }
  return (data as T[]) || mockData
}

// ── Overview ────────────────────────────────────────────────
export function getOverviewKPIs() { return OVERVIEW_KPIS }
export function getAUMGrowth() { return AUM_GROWTH_DATA }
export function getRevenueBreakdown() { return REVENUE_BREAKDOWN }
export function getSystemHealth() { return SYSTEM_HEALTH }

// ── Clients ─────────────────────────────────────────────────
export async function fetchClients() {
  if (!isSupabaseConfigured()) return CLIENTS_DATA
  const { data, error } = await (supabase
    .from('client_profiles')
    .select('*, profiles(*)') as any)
  if (error || !data) return CLIENTS_DATA
  // Map Supabase shape to existing Client shape
  return (data as any[]).map((c: any) => ({
    id: c.id,
    name: c.profiles?.name || '',
    email: c.profiles?.email || '',
    phone: c.profiles?.phone || '',
    kycStatus: c.kyc_status,
    accountStatus: c.account_status,
    aum: c.aum,
    riskProfile: c.risk_profile,
    city: c.city,
    joinDate: c.profiles?.created_at?.split('T')[0] || '',
  }))
}

export async function fetchKYCDocuments() {
  return queryTable('kyc_documents', KYC_DOCUMENTS)
}

// ── Leads ───────────────────────────────────────────────────
export async function fetchLeads() {
  return queryTable<any>('leads', LEADS_DATA)
}

// ── Employees ───────────────────────────────────────────────
export async function fetchEmployees() {
  return queryTable<any>('employees', EMPLOYEES_DATA)
}

// ── Compliance ──────────────────────────────────────────────
export async function fetchApprovals() {
  return queryTable<any>('approvals', APPROVALS_DATA)
}

export async function fetchRiskFlags() {
  return queryTable<any>('risk_flags', RISK_FLAGS_DATA)
}

export async function fetchAuditLog() {
  if (!isSupabaseConfigured()) return ACTIVITY_FEED
  const { data, error } = await (supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100) as any)
  if (error || !data) return ACTIVITY_FEED
  return data
}

// ── Finance ─────────────────────────────────────────────────
export async function fetchInvoices() {
  return queryTable<any>('invoices', INVOICES_DATA)
}

export async function fetchExpenses() {
  return queryTable<any>('expenses', EXPENSES_DATA)
}

export async function fetchCommissions() {
  return queryTable<any>('commissions', COMMISSIONS_DATA)
}

// ── Assets ──────────────────────────────────────────────────
export async function fetchAssets() {
  return queryTable<any>('assets', ASSETS_DATA)
}

// ── Realty Brokers ──────────────────────────────────────────
export async function fetchRealtyBrokers() {
  return queryTable<any>('realty_brokers', REALTY_BROKERS_DATA)
}

export async function fetchBrokerInquiries() {
  return queryTable<any>('broker_inquiries', BROKER_INQUIRIES_DATA)
}

// ── Notifications ───────────────────────────────────────────
export async function fetchNotifications() {
  return queryTable<any>('notifications', ADMIN_NOTIFICATIONS)
}

// ── AI Tools ────────────────────────────────────────────────
export function getAITools() { return AI_TOOLS }

// ── Marketing ───────────────────────────────────────────────
export async function fetchMarketingCampaigns() {
  return queryTable<any>('marketing_campaigns', MARKETING_CAMPAIGNS_DATA)
}
export function getMarketingContent() { return MARKETING_CONTENT_DATA }
export function getMarketingAudiences() { return AUDIENCE_SEGMENTS_DATA }
export function getMarketingSequences() { return OUTREACH_SEQUENCES_DATA }
export function getMarketingChannels() { return CHANNEL_PERFORMANCE_DATA }
export function getMarketingAITools() { return MARKETING_AI_TOOLS }
export function getMarketingIntegrations() { return INTEGRATION_SERVICES_DATA }

// ── Blog (CMS) ──────────────────────────────────────────────
export async function fetchBlogPosts(publishedOnly = false) {
  if (!isSupabaseConfigured()) return []
  let query = supabase.from('blog_posts').select('*').order('created_at', { ascending: false }) as any
  if (publishedOnly) query = query.eq('published', true)
  const { data, error } = await query
  if (error || !data) return []
  return data
}

export async function fetchBlogPostBySlug(slug: string) {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await (supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single() as any)
  if (error || !data) return null
  return data
}

export async function upsertBlogPost(post: Partial<BlogPost> & { slug: string; title: string }) {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await (supabase
    .from('blog_posts')
    .upsert(post as any, { onConflict: 'slug' })
    .select()
    .single() as any)
  if (error) { console.warn('[blog] Upsert error:', error.message); return null }
  return data
}

// ── Tickets ─────────────────────────────────────────────────
export async function fetchTickets() {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await (supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false }) as any)
  if (error || !data) return []
  return data
}

// ── Tasks ───────────────────────────────────────────────────
export async function fetchTasks() {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await (supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false }) as any)
  if (error || !data) return []
  return data
}

// ── Documents ───────────────────────────────────────────────
export async function fetchDocuments() {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await (supabase
    .from('documents')
    .select('*')
    .order('uploaded_at', { ascending: false }) as any)
  if (error || !data) return []
  return data
}

// ── CRUD Helpers ────────────────────────────────────────────
export async function insertRow(table: string, row: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const sb = supabase as any
  const { data, error } = await sb.from(table).insert(row).select().single()
  if (error) { console.warn(`[insert] ${table}:`, error.message); return null }
  return data
}

export async function updateRow(table: string, id: string, updates: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const sb = supabase as any
  const { data, error } = await sb.from(table).update(updates).eq('id', id).select().single()
  if (error) { console.warn(`[update] ${table}:`, error.message); return null }
  return data
}

export async function deleteRow(table: string, id: string) {
  if (!isSupabaseConfigured()) return false
  const sb = supabase as any
  const { error } = await sb.from(table).delete().eq('id', id)
  if (error) { console.warn(`[delete] ${table}:`, error.message); return false }
  return true
}
