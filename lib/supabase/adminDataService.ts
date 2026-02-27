/* ─────────────────────────────────────────────────────────────
   Admin Data Service — Supabase queries (production)

   All data fetched from real Supabase tables.
   Returns empty arrays/defaults when queries fail.

   TABLE NAME MAP (TypeScript type → actual Supabase table):
   ─────────────────────────────────────────────────────────
   clients                              → "clients"
   leads                                → "leads"
   staff_profiles                       → "staff_profiles"
   expenses                             → "expenses"
   campaigns                            → "campaigns"
   audit_logs                           → "audit_logs"
   notifications                        → "notifications"
   documents                            → "documents"
   kyc_documents                        → "kyc_documents"
   approvals                            → "approvals"
   risk_flags                           → "risk_flags"
   invoices                             → "invoices"
   commissions                          → "commissions"
   assets                               → "assets"
   realty_brokers                       → "realty_brokers"
   broker_inquiries                     → "broker_inquiries"
   blog_posts                           → "blog_posts"
   tickets                              → "tickets"
   tasks                                → "tasks"
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'
import type { BlogPost } from './types'

// ── Generic query helper ────────────────────────────────────
async function queryTable<T>(table: string, orderBy = 'created_at'): Promise<T[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await supabase.from(table as any).select('*').order(orderBy, { ascending: false }) as any
    if (error) {
      console.warn(`[adminData] Error fetching ${table}:`, error.message)
      return []
    }
    return (data as T[]) || []
  } catch (err) {
    console.warn(`[adminData] Exception fetching ${table}:`, err)
    return []
  }
}

// ── Overview (computed from real data) ──────────────────────
export async function getOverviewKPIs() {
  if (!isSupabaseConfigured()) return { totalAUM: 0, activeClients: 0, monthlyRevenue: 0, activeFunds: 0 }
  try {
    const { data: clients } = await (supabase.from('clients').select('total_invested, kyc_status') as any)
    const list = (clients || []) as any[]
    const totalAUM = list.reduce((sum: number, c: any) => sum + (Number(c.total_invested) || 0), 0)
    const activeClients = list.filter((c: any) => c.kyc_status === 'verified' || c.kyc_status === 'approved').length
    return { totalAUM, activeClients, monthlyRevenue: 0, activeFunds: 0, totalClients: list.length }
  } catch { return { totalAUM: 0, activeClients: 0, monthlyRevenue: 0, activeFunds: 0 } }
}

export function getAUMGrowth() { return [] }
export function getRevenueBreakdown() { return [] }
export function getSystemHealth() { return { uptime: '—', lastBackup: '—', apiLatency: '—' } }

// ── Clients ─────────────────────────────────────────────────
export async function fetchClients() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await (supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false }) as any)
    if (error || !data) return []
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
  } catch { return [] }
}

export async function fetchKYCDocuments() {
  return queryTable('kyc_documents')
}

// ── Leads ───────────────────────────────────────────────────
export async function fetchLeads() {
  return queryTable<any>('leads')
}

// ── Employees ───────────────────────────────────────────────
export async function fetchEmployees() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await (supabase
      .from('staff_profiles')
      .select('*')
      .order('created_at', { ascending: false }) as any)
    if (error || !data) return []
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
  } catch { return [] }
}

// ── Compliance ──────────────────────────────────────────────
export async function fetchApprovals() {
  return queryTable<any>('approvals')
}

export async function fetchRiskFlags() {
  return queryTable<any>('risk_flags')
}

export async function fetchAuditLog() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await (supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100) as any)
    if (error || !data) return []
    return data
  } catch { return [] }
}

// ── Finance ─────────────────────────────────────────────────
export async function fetchInvoices() {
  return queryTable<any>('invoices')
}

export async function fetchExpenses() {
  return queryTable<any>('expenses')
}

export async function fetchCommissions() {
  return queryTable<any>('commissions')
}

// ── Assets ──────────────────────────────────────────────────
export async function fetchAssets() {
  return queryTable<any>('assets')
}

// ── Realty Brokers ──────────────────────────────────────────
export async function fetchRealtyBrokers() {
  return queryTable<any>('realty_brokers')
}

export async function fetchBrokerInquiries() {
  return queryTable<any>('broker_inquiries')
}

// ── Notifications ───────────────────────────────────────────
export async function fetchNotifications() {
  return queryTable<any>('notifications')
}

// ── AI Tools (static config — not mock data) ────────────────
export function getAITools() {
  return [
    { id: 'ai-draft', name: 'Draft Email', icon: 'Mail', category: 'communication' },
    { id: 'ai-summary', name: 'Summarize', icon: 'FileText', category: 'analysis' },
    { id: 'ai-translate', name: 'Translate', icon: 'Languages', category: 'communication' },
  ]
}

// ── Marketing ───────────────────────────────────────────────
export async function fetchMarketingCampaigns() {
  return queryTable<any>('campaigns')
}
export function getMarketingContent() { return [] }
export function getMarketingAudiences() { return [] }
export function getMarketingSequences() { return [] }
export function getMarketingChannels() { return [] }
export function getMarketingAITools() { return [] }
export function getMarketingIntegrations() { return [] }

// ── Blog (CMS) ──────────────────────────────────────────────
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
