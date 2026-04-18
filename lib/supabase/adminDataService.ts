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

// ── Operational Stats (matches PHP admin.php reference) ─────
// Laravel uses: users table (kyc_status int 0-3), investments (fund_id 10=AIF, 11=Debenture, status 2=approved),
// paymentschedules (net_interest, tds, status 1=paid), supports (status 0/1/2)
// Supabase maps: clients, kyc_basic_details, investment_applications, monthly_payouts, tickets
export async function getOperationalStats() {
  if (!isSupabaseConfigured()) return null
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [
      clientsResult, investedClientsResult,
      kycAllResult, kycPendingResult, kycApprovedResult, kycRejectedResult,
      investmentsResult, payoutsResult, monthPayoutsResult,
      ticketsResult, ticketsOpenResult, ticketsClosedResult,
    ] = await Promise.all([
      // Users — count all clients
      sb.from('clients').select('*', { count: 'exact', head: true }),
      // Invested users — those with total_invested > 0
      sb.from('clients').select('*', { count: 'exact', head: true }).gt('total_invested', 0),
      // KYC — total submissions (maps to Laravel: users where kyc_status != 0)
      sb.from('kyc_basic_details').select('*', { count: 'exact', head: true }),
      // KYC Pending — Supabase uses 'submitted' (Laravel status=1)
      sb.from('kyc_basic_details').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
      // KYC Approved (Laravel status=2)
      sb.from('kyc_basic_details').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      // KYC Rejected (Laravel status=3)
      sb.from('kyc_basic_details').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      // All investment applications — fetch all to compute totals client-side
      // Laravel: Investment::where('status',2)->sum('amount') — Supabase approved status = 'approved'
      sb.from('investment_applications').select('investment_amount, fund_vehicle, status, created_at'),
      // Payouts — maps to Laravel paymentschedules (net_interest, tds, status=1 paid)
      sb.from('monthly_payouts').select('gross_amount, tds_amount, net_interest, payment_status, created_at'),
      sb.from('monthly_payouts').select('gross_amount, tds_amount, net_interest, payment_status, created_at').gte('created_at', startOfMonth),
      // Tickets — maps to Laravel supports table
      sb.from('tickets').select('*', { count: 'exact', head: true }),
      // Open tickets (Laravel status=1)
      sb.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      // Closed tickets (Laravel status=2)
      sb.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
    ])

    const allInvRows = (investmentsResult.data || []) as any[]
    // Include all non-rejected investments for totals (pending + approved + active)
    const activeInvRows = allInvRows.filter((r: any) => r.status !== 'rejected')
    const payRows = (payoutsResult.data || []) as any[]
    const monthPayRows = (monthPayoutsResult.data || []) as any[]

    // AIF classification: fund_vehicle contains "AIF Direct" or "Direct AIF Route" (maps to Laravel fund_id=10)
    const isAIF = (fv: string) => fv && (fv.includes('AIF Direct') || fv === 'Direct AIF Route' || (fv.includes('AIF') && !fv.toLowerCase().includes('debenture') && !fv.toLowerCase().includes('llp')))
    // Debenture classification: fund_vehicle contains "Debenture" (maps to Laravel fund_id=11)
    const isDebenture = (fv: string) => fv && fv.toLowerCase().includes('debenture')

    // Pending tickets = total - open - closed (Laravel status=0)
    const totalTix = ticketsResult.count ?? 0
    const openTix = ticketsOpenResult.count ?? 0
    const closedTix = ticketsClosedResult.count ?? 0
    const pendingTix = Math.max(0, totalTix - openTix - closedTix)

    return {
      totalUsers: clientsResult.count ?? 0,
      investedUsers: investedClientsResult.count ?? 0,
      totalKyc: kycAllResult.count ?? 0,
      pendingKyc: kycPendingResult.count ?? 0,
      approvedKyc: kycApprovedResult.count ?? 0,
      rejectedKyc: kycRejectedResult.count ?? 0,
      // Investment totals — all non-rejected applications (matching Laravel: Investment::where('status','!=',3))
      totalInvestment: activeInvRows.reduce((s: number, r: any) => s + (Number(r.investment_amount) || 0), 0),
      // AIF total amount (Laravel: fund_id=10)
      aifInvestment: activeInvRows.filter((r: any) => isAIF(r.fund_vehicle)).reduce((s: number, r: any) => s + (Number(r.investment_amount) || 0), 0),
      // Debenture total amount (Laravel: fund_id=11)
      debentureInvestment: activeInvRows.filter((r: any) => isDebenture(r.fund_vehicle)).reduce((s: number, r: any) => s + (Number(r.investment_amount) || 0), 0),
      // This month investment
      monthInvestment: activeInvRows.filter((r: any) => r.created_at >= startOfMonth).reduce((s: number, r: any) => s + (Number(r.investment_amount) || 0), 0),
      // Payout totals
      totalPayout: payRows.reduce((s: number, r: any) => s + (Number(r.net_interest) || 0), 0),
      monthPayout: monthPayRows.reduce((s: number, r: any) => s + (Number(r.net_interest) || 0), 0),
      totalTds: payRows.reduce((s: number, r: any) => s + (Number(r.tds_amount) || 0), 0),
      monthTds: monthPayRows.reduce((s: number, r: any) => s + (Number(r.tds_amount) || 0), 0),
      totalTickets: totalTix,
      pendingTickets: pendingTix,
      openTickets: openTix,
      closedTickets: closedTix,
    }
  } catch (err) {
    console.warn('[adminData] getOperationalStats error:', err)
    return null
  }
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
        ghlId: c.ghl_id || '',
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
        referralCode: c.referral_code || '',
        joinDate: c.created_at?.split('T')[0] || '',
        lastActive: c.updated_at?.split('T')[0] || '',
        assignedRM: c.assigned_rm ? 'Assigned' : 'Not assigned',
        assignedRMId: c.assigned_rm || null,
      }))
    }
    return (data as any[]).map((c: any) => ({
      id: c.id,
      ghlId: c.ghl_id || '',
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
      referralCode: c.referral_code || '',
      joinDate: c.created_at?.split('T')[0] || '',
      lastActive: c.updated_at?.split('T')[0] || '',
      assignedRM: c.staff_profiles?.profiles?.full_name || 'Not assigned',
      assignedRMId: c.assigned_rm || null,
    }))
  } catch { return [] }
}

export async function fetchKYCDocuments() {
  // Fetch structured KYC submissions — batched queries for performance (Bug #11 fix).
  // Bug #8: order by most recently updated first so newest KYCs surface at the top.
  try {
    const { data: clients } = await sb.from('clients')
      .select('id, full_name, email, phone, kyc_status, kyc_step, kyc_rejection_reason, kyc_rejected_at, updated_at, created_at')
      .in('kyc_status', ['submitted', 'pending', 'rejected', 'verified', 'approved'])
      .order('updated_at', { ascending: false })
    if (!clients || clients.length === 0) return []
    const clientIds = clients.map((c: any) => c.id)
    const clientMap = new Map(clients.map((c: any) => [c.id, c.full_name]))
    const clientEmailMap = new Map(clients.map((c: any) => [c.id, c.email || '']))
    const clientRejectionMap = new Map(clients.map((c: any) => [c.id, { reason: c.kyc_rejection_reason, at: c.kyc_rejected_at }]))
    // Bug #1: also expose client.updated_at so the UI-side group sort can
    // fall back to the client record's last-modified time (when kyc_status
    // changed) if the per-KYC sub-row dates are older.
    const clientUpdatedAtMap = new Map(clients.map((c: any) => [c.id, c.updated_at]))

    // Batch fetch all KYC data in parallel instead of per-client loops
    const [basicRes, identityRes, bankRes, dematRes, nomineesRes] = await Promise.all([
      sb.from('kyc_basic_details').select('*').in('client_id', clientIds),
      sb.from('kyc_identity_details').select('*').in('client_id', clientIds),
      sb.from('kyc_bank_details').select('*').in('client_id', clientIds),
      sb.from('kyc_demat_details').select('*').in('client_id', clientIds),
      sb.from('nominees').select('*').in('client_id', clientIds).eq('status', 'active'),
    ])

    const kycItems: any[] = []
    const tableData: { table: string; type: string; rows: any[] }[] = [
      { table: 'kyc_basic_details', type: 'Basic Details', rows: basicRes.data || [] },
      { table: 'kyc_identity_details', type: 'Identity Details', rows: identityRes.data || [] },
      { table: 'kyc_bank_details', type: 'Bank Details', rows: bankRes.data || [] },
      { table: 'kyc_demat_details', type: 'Demat Account', rows: dematRes.data || [] },
    ]

    for (const t of tableData) {
      for (const row of t.rows) {
        kycItems.push({
          id: row.id,
          clientId: row.client_id,
          clientName: clientMap.get(row.client_id) || 'Unknown',
          clientEmail: clientEmailMap.get(row.client_id) || '',
          clientUpdatedAt: clientUpdatedAtMap.get(row.client_id),
          type: t.type,
          table: t.table,
          fileName: t.type,
          uploadDate: row.updated_at || row.created_at,
          status: row.status || 'pending',
          reviewer: row.reviewed_by || null,
          notes: row.admin_notes || '',
          // Include full data for detail view (Bug #10 fix)
          data: row,
        })
      }
    }

    // Group nominees by client
    const nomineesByClient: Record<string, any[]> = {}
    for (const n of (nomineesRes.data || [])) {
      if (!nomineesByClient[n.client_id]) nomineesByClient[n.client_id] = []
      nomineesByClient[n.client_id].push(n)
    }
    for (const cid of Object.keys(nomineesByClient)) {
      const nominees = nomineesByClient[cid]
      kycItems.push({
        id: `nominee-${cid}`,
        clientId: cid,
        clientName: clientMap.get(cid) || 'Unknown',
        type: 'Nominee Details',
        table: 'nominees',
        fileName: `${nominees.length} nominee(s)`,
        uploadDate: nominees[0]?.created_at || '',
        status: 'submitted',
        reviewer: null,
        notes: '',
        data: nominees,
      })
    }
    return kycItems
  } catch (err) {
    console.warn('[admin] fetchKYCDocuments error:', err)
    return []
  }
}

// Fetch KYC documents grouped by client for consolidated view (Bug #7 fix)
export async function fetchKYCByClient() {
  try {
    const docs = await fetchKYCDocuments()
    // Also fetch client-level kyc_status for accurate filtering
    const { data: allClients } = await sb.from('clients')
      .select('id, kyc_status, kyc_rejection_reason, kyc_rejected_at')
      .in('kyc_status', ['submitted', 'pending', 'rejected', 'verified', 'approved'])
    const clientStatusMap = new Map((allClients || []).map((c: any) => [c.id, c.kyc_status]))
    const rejectionMap = new Map((allClients || []).map((c: any) => [c.id, { reason: c.kyc_rejection_reason, at: c.kyc_rejected_at }]))

    const grouped: Record<string, { clientId: string; clientName: string; docs: any[]; overallStatus: string; kyc_rejection_reason?: string | null; kyc_rejected_at?: string | null }> = {}
    for (const doc of docs) {
      if (!grouped[doc.clientId]) {
        const rej: any = rejectionMap.get(doc.clientId) || {}
        grouped[doc.clientId] = {
          clientId: doc.clientId,
          clientName: doc.clientName,
          docs: [],
          overallStatus: 'pending',
          kyc_rejection_reason: rej.reason || null,
          kyc_rejected_at: rej.at || null,
        }
      }
      grouped[doc.clientId].docs.push(doc)
    }
    // Use client's kyc_status as the source of truth, with doc-level fallback
    for (const cid of Object.keys(grouped)) {
      const clientKYC = clientStatusMap.get(cid)
      if (clientKYC === 'verified' || clientKYC === 'approved') {
        grouped[cid].overallStatus = 'approved'
      } else if (clientKYC === 'rejected') {
        grouped[cid].overallStatus = 'rejected'
      } else {
        const statuses = grouped[cid].docs.map(d => d.status)
        if (statuses.every(s => s === 'approved')) grouped[cid].overallStatus = 'approved'
        else if (statuses.some(s => s === 'rejected')) grouped[cid].overallStatus = 'rejected'
        else if (statuses.some(s => s === 'submitted')) grouped[cid].overallStatus = 'submitted'
        else grouped[cid].overallStatus = (clientKYC as string) || 'pending'
      }
    }
    return Object.values(grouped)
  } catch (_e) { return [] }
}

// Fetch detailed KYC data for a specific client (Bug #10 fix)
export async function fetchClientKYCDetails(clientId: string) {
  try {
    const [basic, identity, bank, demat, nominees] = await Promise.all([
      sb.from('kyc_basic_details').select('*').eq('client_id', clientId).maybeSingle(),
      sb.from('kyc_identity_details').select('*').eq('client_id', clientId).maybeSingle(),
      sb.from('kyc_bank_details').select('*').eq('client_id', clientId).maybeSingle(),
      sb.from('kyc_demat_details').select('*').eq('client_id', clientId).maybeSingle(),
      sb.from('nominees').select('*').eq('client_id', clientId).eq('status', 'active'),
    ])
    return {
      basic: basic.data || null,
      identity: identity.data || null,
      bank: bank.data || null,
      demat: demat.data || null,
      nominees: nominees.data || [],
    }
  } catch { return null }
}

// Delete user completely (auth + all data) — Bug #9 fix
export async function deleteUserComplete(userId: string) {
  try {
    // Audit the deletion before executing
    try {
      // Columns must match public.audit_logs schema:
      //   id, user_id, action, entity_type, entity_id, old_data, new_data,
      //   ip_address, user_agent, created_at, user_name, actor_id, module, details
      await sb.from('audit_logs').insert({
        action: 'delete_user_complete',
        entity_type: 'user',
        entity_id: userId,
        module: 'admin',
        details: { reason: 'permanent_user_deletion' },
      })
    } catch (e) {
      console.error('Failed to log user deletion audit:', e)
    }

    const { data, error } = await sb.rpc('delete_user_complete', { target_user_id: userId })
    if (error) { console.warn('[admin] deleteUserComplete error:', error.message); return false }
    return data === true
  } catch { return false }
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
    await sb.from('kyc_basic_details').update({ status: 'approved', reviewed_by: adminUserId, reviewed_at: new Date().toISOString() }).eq('client_id', clientId)
    await sb.from('kyc_identity_details').update({ status: 'approved', reviewed_by: adminUserId, reviewed_at: new Date().toISOString() }).eq('client_id', clientId)
    await sb.from('kyc_bank_details').update({ status: 'approved', reviewed_by: adminUserId, reviewed_at: new Date().toISOString() }).eq('client_id', clientId)
    await sb.from('kyc_demat_details').update({ status: 'approved', reviewed_by: adminUserId, reviewed_at: new Date().toISOString() }).eq('client_id', clientId)
    await sb.from('clients').update({ kyc_status: 'verified' }).eq('id', clientId)
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
    // Persist reason in dedicated columns (kyc_rejection_reason /
    // kyc_rejected_at / kyc_rejected_by) so both admin and investor surfaces
    // can render it without parsing prose out of a generic notes blob.
    const patch: any = {
      kyc_status: 'rejected',
      kyc_rejection_reason: reason || null,
      kyc_rejected_at: new Date().toISOString(),
    }
    if (adminUserId && /^[0-9a-f-]{36}$/i.test(adminUserId)) patch.kyc_rejected_by = adminUserId

    await sb.from('clients').update(patch).eq('id', clientId)
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

// Clear rejection fields (called on admin re-approval or investor re-submit).
export async function clearKYCRejection(clientId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    await sb.from('clients').update({
      kyc_rejection_reason: null,
      kyc_rejected_at: null,
      kyc_rejected_by: null,
    }).eq('id', clientId)
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
  const raw = await queryTable<any>('assets')
  // Map snake_case DB columns to camelCase expected by UI components
  return raw.map((a: any) => ({
    ...a,
    serialNumber: a.serial_number || a.serialNumber || '',
    assignedTo: a.assigned_to || a.assignedTo || '',
    expiryDate: a.expiry_date || a.expiryDate || '',
    purchaseDate: a.purchase_date || a.purchaseDate || '',
    value: Number(a.value) || 0,
  }))
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
export async function getMarketingContent() {
  try {
    const { data } = await supabase.from('marketing_content').select('*').order('created_at', { ascending: false })
    return data || []
  } catch { return [] }
}
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

// ── Investment Transactions for a single application (bug #12, #15) ──
export async function fetchInvestmentTransactionsForApp(investmentAppId: string) {
  if (!isSupabaseConfigured() || !investmentAppId) return []
  try {
    const { data } = await (supabase
      .from('investment_transactions')
      .select('*')
      .eq('investment_app_id', investmentAppId)
      .order('created_at', { ascending: false }) as any)
    return (data as any[]) || []
  } catch { return [] }
}

// ── Approve a single investment transaction (bug #15) ─────────
export async function approveInvestmentTransaction(txnId: string, adminId: string, notes?: string) {
  if (!isSupabaseConfigured() || !txnId) return false
  try {
    const sb: any = supabase
    const { error } = await sb
      .from('investment_transactions')
      .update({ status: 'approved', admin_notes: notes || null, reviewed_by: adminId, reviewed_at: new Date().toISOString() })
      .eq('id', txnId)
    return !error
  } catch { return false }
}

export async function rejectInvestmentTransaction(txnId: string, adminId: string, notes: string) {
  if (!isSupabaseConfigured() || !txnId) return false
  try {
    const sb: any = supabase
    const { error } = await sb
      .from('investment_transactions')
      .update({ status: 'rejected', admin_notes: notes, reviewed_by: adminId, reviewed_at: new Date().toISOString() })
      .eq('id', txnId)
    return !error
  } catch { return false }
}

// ── Upload an investment document (bug #17) ───────────────────
export async function uploadAdminInvestmentDocument(params: {
  investment_app_id: string
  client_id: string
  document_type: string
  title: string
  file_url: string
  file_name: string
  uploaded_by: string
}) {
  if (!isSupabaseConfigured()) return null
  try {
    const sb: any = supabase
    const { data, error } = await sb
      .from('investment_documents')
      .insert({ ...params, status: 'issued' })
      .select()
      .single()
    if (error) { console.warn('[admin] upload investment doc error:', error.message); return null }
    return data
  } catch { return null }
}

// ── Mark credit given on an investment application (bug #16) ──
// Returns true on success, or a string error message to surface in the UI.
export async function markInvestmentCreditGiven(appId: string, adminId: string): Promise<true | string> {
  if (!isSupabaseConfigured()) return 'Supabase not configured'
  try {
    const sb: any = supabase
    const { error } = await sb
      .from('investment_applications')
      .update({
        credit_given: true,
        credit_given_at: new Date().toISOString(),
        credit_given_by: adminId,
        status: 'credited',
      })
      .eq('id', appId)
    if (error) {
      console.warn('[admin] markInvestmentCreditGiven error:', error.message)
      return error.message || 'Database rejected the update'
    }
    // Once credited, the full payout schedule becomes visible so the accounts
    // team can process payouts. Safe to run repeatedly — duplicates are skipped.
    try {
      const { data: app } = await sb.from('investment_applications').select('*').eq('id', appId).single()
      if (app) await generateFullPayoutSchedule(app)
    } catch (e) { console.warn('[admin] auto-generate payouts non-fatal:', e) }
    return true
  } catch (e: any) {
    console.warn('[admin] markInvestmentCreditGiven exception:', e?.message)
    return e?.message || 'Unknown error'
  }
}

// ── Generate full payout schedule for a single investment ──────
// AIF funds pay yearly; Debenture / LLP pay monthly. The schedule runs from
// investment_date to maturity_date. Idempotent — looks up existing rows
// keyed by (investment_id, due_date) and only inserts missing ones.
export async function generateFullPayoutSchedule(app: any) {
  if (!isSupabaseConfigured() || !app?.id) return 0
  const sb: any = supabase
  try {
    // Skip if required fields missing — caller should approve first.
    if (!app.investment_date) return 0
    const fv: string = app.fund_vehicle || ''
    // AIF = yearly, Debenture/LLP (and anything else) = monthly
    const isAIF = fv.includes('AIF Direct') || fv === 'Direct AIF Route' || (fv.includes('AIF') && !fv.toLowerCase().includes('debenture') && !fv.toLowerCase().includes('llp'))
    const frequencyMonths = isAIF ? 12 : 1

    const amount = Number(app.final_investment_amount) || Number(app.investment_amount) || 0
    if (amount <= 0) return 0
    const interestRate = Number(app.interest_rate) || 12
    const tdsPercent = Number(app.tds_rate) || 10
    const startDate = new Date(app.investment_date)
    const maturity = app.maturity_date
      ? new Date(app.maturity_date)
      : (() => {
          const tenureYears = Number(String(app.tenure_preference || '').replace(/[^0-9]/g, '')) || 3
          const d = new Date(startDate); d.setFullYear(d.getFullYear() + tenureYears); return d
        })()

    // Per-period amounts
    const grossPerPeriod = isAIF
      ? +(amount * (interestRate / 100)).toFixed(2)            // yearly gross
      : +(amount * (interestRate / 100) / 12).toFixed(2)       // monthly gross
    const tdsPerPeriod = +(grossPerPeriod * (tdsPercent / 100)).toFixed(2)
    const netPerPeriod = +(grossPerPeriod - tdsPerPeriod).toFixed(2)

    // Tests 2026-04-18 #4: first-month payout must be prorated from the
    // investment date. Monthly debenture/LLP gross accrues daily from the
    // invest date to the end of the start month; AIF yearly keeps the full
    // amount (it already aligns to an anniversary date).
    const startDay = startDate.getDate()
    const daysInStartMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate()
    const remainingDays = daysInStartMonth - startDay + 1
    const proratePct = remainingDays / daysInStartMonth
    const needsProrate = !isAIF && startDay > 1
    const firstGross = needsProrate ? +(grossPerPeriod * proratePct).toFixed(2) : grossPerPeriod
    const firstTds = +(firstGross * (tdsPercent / 100)).toFixed(2)
    const firstNet = +(firstGross - firstTds).toFixed(2)

    // Build all due_dates until maturity.
    // Testing 2026-04-18 #4: monthly payouts fall on the 5th of each month.
    // AIF yearly payouts keep their anniversary date (matches redemption ops).
    const dueDates: string[] = []
    const cursor = new Date(startDate)
    cursor.setMonth(cursor.getMonth() + frequencyMonths)
    if (!isAIF) cursor.setDate(5)
    while (cursor <= maturity) {
      dueDates.push(cursor.toISOString().split('T')[0])
      cursor.setMonth(cursor.getMonth() + frequencyMonths)
      if (!isAIF) cursor.setDate(5)
    }
    if (dueDates.length === 0) return 0

    // Skip dates that already have a payout row for this investment
    const { data: existing } = await sb
      .from('monthly_payouts')
      .select('due_date')
      .eq('investment_id', app.id)
    const alreadyThere = new Set((existing || []).map((r: any) => r.due_date))
    const missingDates = dueDates.filter(d => !alreadyThere.has(d))
    if (missingDates.length === 0) return 0

    // Enrich with client + bank details
    const { data: client } = await sb.from('clients').select('client_code, full_name').eq('id', app.client_id).maybeSingle()
    const { data: bank } = await sb.from('kyc_bank_details').select('account_number, account_holder_name, bank_name, ifsc_code').eq('client_id', app.client_id).maybeSingle()

    const firstDueDate = dueDates[0]
    const rows = missingDates.map(due_date => {
      const isFirst = due_date === firstDueDate
      return {
        client_id: app.client_id,
        investment_id: app.id,
        ghl_id: client?.client_code || '',
        fund_type: app.fund_vehicle || '',
        investment_amount: amount,
        investment_date: app.investment_date,
        due_date,
        gross_amount: isFirst ? firstGross : grossPerPeriod,
        tds_percentage: tdsPercent,
        tds_amount: isFirst ? firstTds : tdsPerPeriod,
        net_interest: isFirst ? firstNet : netPerPeriod,
        payment_status: 'pending',
        account_number: bank?.account_number || null,
        account_holder_name: bank?.account_holder_name || client?.full_name || null,
        bank_name: bank?.bank_name || null,
        ifsc_code: bank?.ifsc_code || null,
      }
    })

    const { error: insErr } = await sb.from('monthly_payouts').insert(rows)
    if (insErr) { console.warn('[admin] generateFullPayoutSchedule insert error:', insErr.message); return 0 }
    return rows.length
  } catch (e: any) {
    console.warn('[admin] generateFullPayoutSchedule error:', e?.message)
    return 0
  }
}

// ── Approve investment application with full side-effects (bugs #14, #18, #19) ──
// On approve we populate investment_date, interest_rate, appreciation_rate,
// tds_rate, maturity_date, commitment_id, reference_number (if missing), and
// insert an Acknowledgement document row so the investor's Documents tab shows it.
export async function approveInvestmentApplication(app: any, adminId: string) {
  if (!isSupabaseConfigured() || !app?.id) return false
  try {
    // Fund rate lookup — keep in sync with FUNDS constant in InvestmentFlowTab.tsx
    const rateMap: Record<string, { interest: number; appreciation: number; tenureYears?: number }> = {
      'Direct AIF Route': { interest: 18, appreciation: 15 },
      'Alternate route to Invest in AIF via Debenture': { interest: 12, appreciation: 12 },
      'Alternate route to Invest in AIF via LLP': { interest: 12, appreciation: 12 },
    }
    const rates = rateMap[app.fund_vehicle] || { interest: Number(app.interest_rate) || 12, appreciation: Number(app.appreciation_rate) || 12 }
    const today = new Date()
    const investmentDate = app.investment_date || today.toISOString().split('T')[0]
    const tenureYears = Number(String(app.tenure_preference || '').replace(/[^0-9]/g, '')) || 3
    const maturity = new Date(investmentDate)
    maturity.setFullYear(maturity.getFullYear() + tenureYears)
    const maturityDate = maturity.toISOString().split('T')[0]
    const commitmentId = app.commitment_id || `GHL-CMT-${String(app.id).slice(0, 8).toUpperCase()}`
    const referenceNumber = app.reference_number || `GHL-REF-${Date.now().toString(36).toUpperCase()}`

    const update: Record<string, any> = {
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      investment_date: investmentDate,
      interest_rate: Number(app.interest_rate) || rates.interest,
      appreciation_rate: Number(app.appreciation_rate) || rates.appreciation,
      tds_rate: Number(app.tds_rate) || 10,
      maturity_date: maturityDate,
      commitment_id: commitmentId,
      reference_number: referenceNumber,
    }
    const sb: any = supabase
    const { error: updErr } = await sb.from('investment_applications').update(update).eq('id', app.id)
    if (updErr) { console.warn('[admin] approve investment update error:', updErr.message); return false }

    // Insert an Acknowledgement document so the investor's Documents tab has it.
    try {
      // Avoid duplicates if approval is clicked twice
      const { data: existingDoc } = await sb
        .from('investment_documents')
        .select('id')
        .eq('investment_app_id', app.id)
        .eq('document_type', 'acknowledgement')
        .maybeSingle()
      if (!existingDoc) {
        await sb.from('investment_documents').insert({
          investment_app_id: app.id,
          client_id: app.client_id,
          document_type: 'acknowledgement',
          title: 'Acknowledgement Letter',
          file_name: `Acknowledgement-${commitmentId}.pdf`,
          file_url: '',
          uploaded_by: adminId,
          status: 'issued',
        })
      }
    } catch (e) { console.warn('[admin] ack doc insert non-fatal:', e) }

    // Notify the investor
    try {
      if (app.user_id) {
        await sb.from('notifications').insert({
          user_id: app.user_id,
          title: 'Investment Approved',
          message: `Your investment application (${commitmentId}) has been approved. View your payment schedule in the dashboard.`,
          type: 'success',
          link: '/dashboard/investments',
          metadata: { investment_app_id: app.id },
        })
      }
    } catch { /* non-blocking */ }

    // Auto-generate the payout schedule (AIF=yearly, Debenture=monthly) so
    // both investor and accounts team see upcoming payouts immediately.
    try {
      const mergedApp = { ...app, ...update }
      await generateFullPayoutSchedule(mergedApp)
    } catch (e) { console.warn('[admin] auto-generate payouts on approval non-fatal:', e) }

    return true
  } catch (e: any) {
    console.warn('[admin] approveInvestmentApplication error:', e?.message)
    return false
  }
}

// ── Investment Applications (admin view — all) ──────────────
export async function fetchAllInvestmentApplications() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await (supabase
      .from('investment_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500) as any)
    if (error || !data) return []
    // Enrich with client names
    const clientIds = Array.from(new Set((data as any[]).map((d: any) => d.client_id).filter(Boolean)))
    if (clientIds.length > 0) {
      // Bug #13: include phone and client_code (GHL ID) for admin investment list.
      const { data: clients } = await (supabase.from('clients').select('id, full_name, email, phone, client_code').in('id', clientIds) as any)
      const clientMap = new Map((clients || []).map((c: any) => [c.id, c]))
      return (data as any[]).map((app: any) => ({ ...app, _client: clientMap.get(app.client_id) || null }))
    }
    return data as any[]
  } catch (_e) { return [] }
}

// ── Messages (admin view — all client messages) ────────────
export async function fetchAllMessages() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await (supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100) as any)
    if (error || !data) return []
    return data
  } catch { return [] }
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
const ALLOWED_TABLES = [
  'profiles', 'clients', 'staff_profiles', 'portfolio_assets', 'transactions',
  'documents', 'notifications', 'tickets', 'messages', 'nav_history',
  'audit_logs', 'expenses', 'payouts', 'assets', 'leads', 'tasks',
  'compliance_items', 'reports', 'roles', 'funds', 'bank_accounts',
  'investment_applications', 'kyc_documents', 'leave_requests',
  'invoices', 'commissions', 'approvals', 'campaigns', 'staff_checkins', 'marketing_content',
]

export async function insertRow(table: string, row: Record<string, any>) {
  if (!ALLOWED_TABLES.includes(table)) {
    console.error(`[AdminData] Blocked access to unauthorized table: ${table}`)
    return null
  }
  if (!isSupabaseConfigured()) return null
  try {
    const sb = supabase as any
    const { data, error } = await sb.from(table).insert(row).select().single()
    if (error) { console.warn(`[insert] ${table}:`, error.message); return null }
    return data
  } catch { return null }
}

export async function updateRow(table: string, id: string, updates: Record<string, any>) {
  if (!ALLOWED_TABLES.includes(table)) {
    console.error(`[AdminData] Blocked access to unauthorized table: ${table}`)
    return null
  }
  if (!isSupabaseConfigured()) return null
  try {
    const sb = supabase as any
    const { data, error } = await sb.from(table).update(updates).eq('id', id).select().single()
    if (error) { console.warn(`[update] ${table}:`, error.message); return null }
    return data
  } catch { return null }
}

export async function deleteRow(table: string, id: string) {
  if (!ALLOWED_TABLES.includes(table)) {
    console.error(`[AdminData] Blocked access to unauthorized table: ${table}`)
    return false
  }
  if (!isSupabaseConfigured()) return false
  try {
    const sb = supabase as any
    const { error } = await sb.from(table).delete().eq('id', id)
    if (error) { console.warn(`[delete] ${table}:`, error.message); return false }
    return true
  } catch { return false }
}

// ── Career Applications ─────────────────────────────────────
// Career applications are stored in contact_submissions with form_type='career_application'.
// The message column holds a JSON blob with role/experience/coverLetter/resumePath, etc.

export type CareerApplication = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  subject: string | null
  status: string | null
  is_processed: boolean | null
  processed_at: string | null
  notes: string | null
  created_at: string
  // Parsed from message JSON
  position?: string
  experience?: string
  currentCompany?: string
  currentCTC?: string
  linkedin?: string
  portfolio?: string
  coverLetter?: string
  resumePath?: string | null
  resumeName?: string | null
  resumeSize?: number | null
  raw_message?: string
}

// reportsDataService.submitContactForm runs submissions through an HTML-entity
// sanitiser (&quot; etc) before insert. That broke JSON.parse on the message
// column for older career rows. Decode common entities before parsing so both
// legacy and new rows read cleanly.
function decodeHtmlEntities(s: string): string {
  if (!s) return s
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export async function fetchCareerApplications(): Promise<CareerApplication[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await supabase
      .from('contact_submissions' as any)
      .select('id, full_name, email, phone, subject, status, is_processed, processed_at, notes, message, created_at')
      .eq('form_type', 'career_application')
      .order('created_at', { ascending: false }) as any
    if (error) { console.warn('[fetchCareerApplications]', error.message); return [] }
    return (data || []).map((r: any) => {
      let parsed: any = {}
      if (r.message) {
        // Try raw first (in case a future submit path skips sanitisation),
        // then fall back to decoding HTML entities.
        try { parsed = JSON.parse(r.message) } catch {
          try { parsed = JSON.parse(decodeHtmlEntities(r.message)) } catch { parsed = {} }
        }
      }
      return {
        id: r.id,
        full_name: r.full_name || '',
        email: r.email,
        phone: r.phone,
        subject: r.subject,
        status: r.status,
        is_processed: r.is_processed,
        processed_at: r.processed_at,
        notes: r.notes,
        created_at: r.created_at,
        position: parsed.position,
        experience: parsed.experience,
        currentCompany: parsed.currentCompany,
        currentCTC: parsed.currentCTC,
        linkedin: parsed.linkedin,
        portfolio: parsed.portfolio,
        coverLetter: parsed.coverLetter,
        resumePath: parsed.resumePath || null,
        resumeName: parsed.resumeName || null,
        resumeSize: parsed.resumeSize || null,
        raw_message: r.message || '',
      }
    })
  } catch (err) {
    console.warn('[fetchCareerApplications] exception:', err)
    return []
  }
}

export async function updateCareerApplicationStatus(id: string, updates: { status?: string; is_processed?: boolean; notes?: string | null }): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const patch: any = { ...updates }
    if (updates.is_processed) patch.processed_at = new Date().toISOString()
    const { error } = await (supabase as any).from('contact_submissions').update(patch).eq('id', id)
    if (error) { console.warn('[updateCareerApplicationStatus]', error.message); return false }
    return true
  } catch { return false }
}

export async function getResumeSignedUrl(path: string, expiresIn = 300): Promise<string | null> {
  if (!isSupabaseConfigured() || !path) return null
  try {
    const { data, error } = await supabase.storage.from('resumes').createSignedUrl(path, expiresIn)
    if (error) { console.warn('[getResumeSignedUrl]', error.message); return null }
    return data?.signedUrl || null
  } catch (err) {
    console.warn('[getResumeSignedUrl] exception:', err)
    return null
  }
}

// ── Grievances ──────────────────────────────────────────────
// Public /contact/grievance form stores complaints in public.grievances.
// Admin Compliance → Grievances sub-tab reads + updates from here.

export type Grievance = {
  id: string
  ticket_number: string | null
  full_name: string
  email: string
  phone: string | null
  folio_number: string | null
  complaint_type: string | null
  incident_date: string | null
  description: string
  desired_resolution: string | null
  contacted_before: boolean | null
  previous_reference: string | null
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected' | 'escalated'
  escalation_level: number
  assigned_to: string | null
  admin_notes: string | null
  resolution_summary: string | null
  resolved_at: string | null
  page_url: string | null
  created_at: string
  updated_at: string
}

export async function fetchGrievances(): Promise<Grievance[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await (supabase as any)
      .from('grievances')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { console.warn('[fetchGrievances]', error.message); return [] }
    return (data || []) as Grievance[]
  } catch (err) {
    console.warn('[fetchGrievances] exception:', err)
    return []
  }
}

export async function updateGrievance(
  id: string,
  updates: Partial<Pick<Grievance, 'status' | 'escalation_level' | 'admin_notes' | 'resolution_summary'>>,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const patch: any = { ...updates }
    if (updates.status === 'resolved') patch.resolved_at = new Date().toISOString()
    const { error } = await (supabase as any).from('grievances').update(patch).eq('id', id)
    if (error) { console.warn('[updateGrievance]', error.message); return false }
    return true
  } catch { return false }
}

// ── Referrals ───────────────────────────────────────────────
export type Referral = {
  id: string
  referrer_name: string
  referrer_email: string
  referrer_phone: string | null
  relationship: string | null
  referee_name: string
  referee_email: string | null
  referee_phone: string | null
  referee_city: string | null
  investable_surplus: string | null
  message: string | null
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected'
  assigned_to: string | null
  admin_notes: string | null
  lead_id: string | null
  created_at: string
  updated_at: string
}

export async function fetchReferrals(): Promise<Referral[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await (supabase as any)
      .from('referrals').select('*').order('created_at', { ascending: false })
    if (error) { console.warn('[fetchReferrals]', error.message); return [] }
    return (data || []) as Referral[]
  } catch { return [] }
}

export async function updateReferral(id: string, updates: Partial<Pick<Referral, 'status' | 'admin_notes'>>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const { error } = await (supabase as any).from('referrals').update(updates).eq('id', id)
    if (error) { console.warn('[updateReferral]', error.message); return false }
    return true
  } catch { return false }
}

// ── Startup Applications ────────────────────────────────────
export type StartupApplication = {
  id: string
  application_number: string | null
  founder_name: string
  email: string
  phone: string | null
  linkedin: string | null
  company_name: string
  founding_year: number | null
  website: string | null
  stage: string | null
  sector: string | null
  city: string | null
  mrr: string | null
  mau: string | null
  metrics: string | null
  amount_seeking: string | null
  use_of_funds: string | null
  pitch: string | null
  pitch_deck_url: string | null
  status: 'new' | 'reviewing' | 'shortlisted' | 'passed' | 'meeting_scheduled' | 'in_diligence' | 'funded' | 'rejected'
  assigned_to: string | null
  admin_notes: string | null
  review_score: number | null
  created_at: string
  updated_at: string
}

export async function fetchStartupApplications(): Promise<StartupApplication[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await (supabase as any)
      .from('startup_applications').select('*').order('created_at', { ascending: false })
    if (error) { console.warn('[fetchStartupApplications]', error.message); return [] }
    return (data || []) as StartupApplication[]
  } catch { return [] }
}

export async function updateStartupApplication(id: string, updates: Partial<Pick<StartupApplication, 'status' | 'admin_notes' | 'review_score'>>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const { error } = await (supabase as any).from('startup_applications').update(updates).eq('id', id)
    if (error) { console.warn('[updateStartupApplication]', error.message); return false }
    return true
  } catch { return false }
}

// ── NRI Consultations ───────────────────────────────────────
export type NRIConsultation = {
  id: string
  full_name: string
  email: string
  phone: string | null
  country: string | null
  investment_range: string | null
  preferred_route: string | null
  message: string | null
  status: 'new' | 'contacted' | 'scheduled' | 'completed' | 'converted' | 'rejected'
  scheduled_at: string | null
  assigned_to: string | null
  admin_notes: string | null
  lead_id: string | null
  created_at: string
  updated_at: string
}

export async function fetchNRIConsultations(): Promise<NRIConsultation[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await (supabase as any)
      .from('nri_consultations').select('*').order('created_at', { ascending: false })
    if (error) { console.warn('[fetchNRIConsultations]', error.message); return [] }
    return (data || []) as NRIConsultation[]
  } catch { return [] }
}

export async function updateNRIConsultation(id: string, updates: Partial<Pick<NRIConsultation, 'status' | 'admin_notes' | 'scheduled_at'>>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const { error } = await (supabase as any).from('nri_consultations').update(updates).eq('id', id)
    if (error) { console.warn('[updateNRIConsultation]', error.message); return false }
    return true
  } catch { return false }
}
