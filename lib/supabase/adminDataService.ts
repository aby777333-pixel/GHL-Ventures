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

const sb = supabase as any

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
export function getSystemHealth() {
  return { uptime: 0, responseTime: 0, storageUsed: 0, storageTotal: 100, activeUsers: 0, apiCalls24h: 0 }
}

// ── Activity Feed (from audit_logs) ─────────────────────────
export async function fetchActivityFeed() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await (supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20) as any)
    if (error || !data) return []
    return (data as any[]).map((a: any) => ({
      id: a.id,
      user: a.new_data?.user_name || 'System',
      action: a.action || '',
      target: a.entity_type || '',
      timestamp: a.created_at,
    }))
  } catch { return [] }
}

// ── Upcoming Deadlines ──────────────────────────────────────
export function getUpcomingDeadlines() { return [] }

// ── Clients ─────────────────────────────────────────────────
export async function fetchClients() {
  if (!isSupabaseConfigured()) return []
  try {
    // Join with staff_profiles + profiles to get the RM's name
    const { data, error } = await (supabase
      .from('clients')
      .select('*, staff_profiles!clients_assigned_rm_fkey(id, designation, profiles!inner(full_name))')
      .order('created_at', { ascending: false }) as any)
    if (error || !data) {
      // Fallback: no join
      const { data: plain } = await (supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false }) as any)
      if (!plain) return []
      return (plain as any[]).map((c: any) => ({
        id: c.id,
        name: c.full_name || '',
        email: c.email || '',
        phone: c.phone || '',
        pan: c.pan || '',
        kycStatus: c.kyc_status,
        accountStatus: c.kyc_status === 'verified' ? 'active' : 'pending',
        aum: c.aum || c.total_invested || 0,
        investedAmount: c.total_invested || 0,
        currentValue: c.current_value || 0,
        riskProfile: c.risk_profile,
        city: c.city,
        referredBy: c.referred_by || '',
        joinDate: c.created_at?.split('T')[0] || '',
        lastActive: c.updated_at?.split('T')[0] || '',
        assignedRM: c.assigned_rm ? 'Assigned' : 'Not assigned',
        assignedRMId: c.assigned_rm || null,
      }))
    }
    return (data as any[]).map((c: any) => ({
      id: c.id,
      name: c.full_name || '',
      email: c.email || '',
      phone: c.phone || '',
      pan: c.pan || '',
      kycStatus: c.kyc_status,
      accountStatus: c.kyc_status === 'verified' ? 'active' : 'pending',
      aum: c.aum || c.total_invested || 0,
      investedAmount: c.total_invested || 0,
      currentValue: c.current_value || 0,
      riskProfile: c.risk_profile,
      city: c.city,
      referredBy: c.referred_by || '',
      joinDate: c.created_at?.split('T')[0] || '',
      lastActive: c.updated_at?.split('T')[0] || '',
      assignedRM: c.staff_profiles?.profiles?.full_name || 'Not assigned',
      assignedRMId: c.assigned_rm || null,
    }))
  } catch { return [] }
}

export async function fetchKYCDocuments() {
  // Fetch structured KYC submissions from new tables + client info
  try {
    const { data: clients } = await sb.from('clients').select('id, full_name, kyc_status, kyc_step').in('kyc_status', ['submitted', 'pending', 'rejected'])
    if (!clients || clients.length === 0) return []
    const kycItems: any[] = []
    for (const c of clients) {
      // Check each KYC step
      const tables = [
        { table: 'kyc_basic_details', type: 'Basic Details' },
        { table: 'kyc_identity_details', type: 'Identity Details' },
        { table: 'kyc_bank_details', type: 'Bank Details' },
        { table: 'kyc_demat_details', type: 'Demat Account' },
      ]
      for (const t of tables) {
        const { data: row } = await sb.from(t.table).select('*').eq('client_id', c.id).maybeSingle()
        if (row) {
          kycItems.push({
            id: row.id,
            clientId: c.id,
            clientName: c.full_name,
            type: t.type,
            table: t.table,
            fileName: t.type,
            uploadDate: row.created_at,
            status: row.status || 'pending',
            reviewer: row.reviewed_by || null,
            notes: row.admin_notes || '',
          })
        }
      }
      // Nominees count
      const { data: nominees } = await sb.from('nominees').select('id').eq('client_id', c.id).eq('status', 'active')
      if (nominees && nominees.length > 0) {
        kycItems.push({
          id: `nominee-${c.id}`,
          clientId: c.id,
          clientName: c.full_name,
          type: 'Nominee Details',
          table: 'nominees',
          fileName: `${nominees.length} nominee(s)`,
          uploadDate: '',
          status: 'submitted',
          reviewer: null,
          notes: '',
        })
      }
    }
    return kycItems
  } catch (err) {
    console.warn('[admin] fetchKYCDocuments error:', err)
    return []
  }
}

// ── KYC Approval/Rejection ────────────────────────────────
export async function approveKYCStep(table: string, rowId: string, adminUserId: string) {
  try {
    const { error } = await sb.from(table).update({
      status: 'approved',
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString(),
    }).eq('id', rowId)
    if (error) { console.warn('[admin] approve KYC error:', error.message); return false }
    return true
  } catch { return false }
}

export async function rejectKYCStep(table: string, rowId: string, adminUserId: string, notes?: string) {
  try {
    const { error } = await sb.from(table).update({
      status: 'rejected',
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString(),
      admin_notes: notes || 'Rejected by admin',
    }).eq('id', rowId)
    if (error) { console.warn('[admin] reject KYC error:', error.message); return false }
    return true
  } catch { return false }
}

export async function approveClientKYC(clientId: string, adminUserId: string) {
  try {
    // Approve all steps
    await sb.from('kyc_basic_details').update({ status: 'approved', reviewed_by: adminUserId, reviewed_at: new Date().toISOString() }).eq('client_id', clientId)
    await sb.from('kyc_identity_details').update({ status: 'approved', reviewed_by: adminUserId, reviewed_at: new Date().toISOString() }).eq('client_id', clientId)
    await sb.from('kyc_bank_details').update({ status: 'approved', reviewed_by: adminUserId, reviewed_at: new Date().toISOString() }).eq('client_id', clientId)
    await sb.from('kyc_demat_details').update({ status: 'approved', reviewed_by: adminUserId, reviewed_at: new Date().toISOString() }).eq('client_id', clientId)
    // Update client status
    await sb.from('clients').update({ kyc_status: 'verified' }).eq('id', clientId)
    // Notify client
    const { data: client } = await sb.from('clients').select('user_id').eq('id', clientId).single()
    if (client?.user_id) {
      await sb.from('notifications').insert({
        user_id: client.user_id,
        title: 'KYC Approved!',
        message: 'Your KYC has been approved. You can now invest.',
        type: 'success',
        link: '/dashboard/investments',
      })
    }
    return true
  } catch { return false }
}

export async function rejectClientKYC(clientId: string, adminUserId: string, reason?: string) {
  try {
    await sb.from('clients').update({ kyc_status: 'rejected' }).eq('id', clientId)
    const { data: client } = await sb.from('clients').select('user_id').eq('id', clientId).single()
    if (client?.user_id) {
      await sb.from('notifications').insert({
        user_id: client.user_id,
        title: 'KYC Rejected',
        message: reason || 'Your KYC has been rejected. Please update your details and resubmit.',
        type: 'info',
        link: '/dashboard/kyc',
      })
    }
    return true
  } catch { return false }
}

// ── Leads ───────────────────────────────────────────────────
export async function fetchLeads() {
  return queryTable<any>('leads')
}

// ── Employees ───────────────────────────────────────────────
// NOTE: EmployeeModule now uses getEmployeeDirectory() from employeeService.ts
// which properly JOINs staff_profiles + profiles. This fallback function
// corrects the column references for any other callers.
export async function fetchEmployees() {
  if (!isSupabaseConfigured()) return []
  try {
    // Try RPC first (properly joins profiles for name/email)
    const db = supabase as any
    const { data: rpcData, error: rpcErr } = await db.rpc('get_employee_directory')
    if (!rpcErr && rpcData && Array.isArray(rpcData)) {
      return rpcData.map((e: any) => ({
        id: e.employee_id || e.id,
        name: e.name || '',
        email: e.email || '',
        phone: e.phone || '',
        role: e.role || '',
        department: e.department || '',
        status: e.status || 'active',
        joinDate: e.join_date || '',
        reportingTo: e.reporting_to_name || '',
      }))
    }

    // Fallback: direct query with correct column names
    const { data, error } = await (supabase
      .from('staff_profiles')
      .select('*, profiles!inner(full_name, phone)')
      .order('created_at', { ascending: false }) as any)
    if (error || !data) return []
    return (data as any[]).map((s: any) => ({
      id: s.employee_id || s.id,
      name: s.profiles?.full_name || s.designation || '',
      email: '',
      phone: s.profiles?.phone || '',
      role: s.designation || '',
      department: s.department || '',
      status: s.is_active ? 'active' : 'inactive',
      joinDate: s.date_of_joining || s.created_at?.split('T')[0] || '',
      reportingTo: s.reporting_to || null,
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
