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
//
// 25-04-2026 testing report fixes:
//   DASH-a: KYC counts now read clients.kyc_status (one row per investor)
//           instead of kyc_basic_details, so approved KYCs no longer linger
//           under "Pending".
//   DASH-b: monthInvestment uses the date the credit was actually given
//           (final_investment_date / credit_given_at) instead of when the
//           application was submitted.
//   DASH-c: Total/MTD Payout + Total/MTD TDS only count rows whose
//           payment_status is 'paid'. "This month" filters on payment_date,
//           not created_at, so future-scheduled payouts don't inflate the
//           current-month tile.
export async function getOperationalStats() {
  if (!isSupabaseConfigured()) return null
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfMonthIso = startOfMonth.toISOString()
    const startOfMonthDate = startOfMonthIso.split('T')[0]

    const [
      clientsResult, investedClientsResult,
      kycCountsResult,
      investmentsResult,
      payoutsResult,
      ticketsResult, ticketsOpenResult, ticketsClosedResult,
    ] = await Promise.all([
      sb.from('clients').select('*', { count: 'exact', head: true }),
      sb.from('clients').select('*', { count: 'exact', head: true }).gt('total_invested', 0),
      // DASH-a: count clients by kyc_status — one row per investor.
      sb.from('clients').select('kyc_status'),
      sb.from('investment_applications').select('investment_amount, fund_vehicle, status, created_at, final_investment_date, credit_given_at, credit_given'),
      // DASH-c: pull payout rows with both payment_status and payment_date so
      // we can compute "paid only" totals + "this month" via payment_date.
      sb.from('monthly_payouts').select('gross_amount, tds_amount, net_interest, payment_status, payment_date, due_date, created_at'),
      sb.from('tickets').select('*', { count: 'exact', head: true }),
      sb.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      sb.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
    ])

    // ── KYC counts (per-client) ──
    const kycRows = (kycCountsResult.data || []) as any[]
    const kycStatus = (s: any) => String(s || '').toLowerCase()
    const kycPendingStates = new Set(['pending', 'submitted', 'under-review', 'under_review'])
    const kycApprovedStates = new Set(['approved', 'verified'])
    const totalKyc = kycRows.filter(r => kycStatus(r.kyc_status)).length
    const pendingKyc = kycRows.filter(r => kycPendingStates.has(kycStatus(r.kyc_status))).length
    const approvedKyc = kycRows.filter(r => kycApprovedStates.has(kycStatus(r.kyc_status))).length
    const rejectedKyc = kycRows.filter(r => kycStatus(r.kyc_status) === 'rejected').length

    // ── Investments ──
    const allInvRows = (investmentsResult.data || []) as any[]
    const activeInvRows = allInvRows.filter((r: any) => r.status !== 'rejected')
    const isAIF = (fv: string) => fv && (fv.includes('AIF Direct') || fv === 'Direct AIF Route' || (fv.includes('AIF') && !fv.toLowerCase().includes('debenture') && !fv.toLowerCase().includes('llp')))
    const isDebenture = (fv: string) => fv && fv.toLowerCase().includes('debenture')

    // DASH-b: "this month" should use the date the credit was given, not the
    // application creation date. Prefer final_investment_date (a date string,
    // set on credit-give); fall back to credit_given_at (timestamptz). Skip
    // applications that haven't been credited yet — they didn't really
    // become "investment this month" until money landed.
    const investmentDateOf = (r: any): string | null => {
      if (r.final_investment_date) return String(r.final_investment_date) // YYYY-MM-DD
      if (r.credit_given_at)        return String(r.credit_given_at).split('T')[0]
      return null
    }
    const inThisMonth = (d: string | null) => !!d && d >= startOfMonthDate

    // ── Payouts (DASH-c) ──
    const payRows = (payoutsResult.data || []) as any[]
    const isPaid = (r: any) => String(r.payment_status || '').toLowerCase() === 'paid'
    const paidThisMonth = (r: any) => {
      if (!isPaid(r)) return false
      const d = r.payment_date || r.due_date
      return !!d && String(d) >= startOfMonthDate
    }

    const totalTix = ticketsResult.count ?? 0
    const openTix = ticketsOpenResult.count ?? 0
    const closedTix = ticketsClosedResult.count ?? 0
    const pendingTix = Math.max(0, totalTix - openTix - closedTix)

    return {
      totalUsers: clientsResult.count ?? 0,
      investedUsers: investedClientsResult.count ?? 0,
      totalKyc,
      pendingKyc,
      approvedKyc,
      rejectedKyc,
      // Investment totals — all non-rejected applications.
      totalInvestment: activeInvRows.reduce((s: number, r: any) => s + (Number(r.investment_amount) || 0), 0),
      aifInvestment:        activeInvRows.filter((r: any) => isAIF(r.fund_vehicle)).reduce((s: number, r: any) => s + (Number(r.investment_amount) || 0), 0),
      debentureInvestment:  activeInvRows.filter((r: any) => isDebenture(r.fund_vehicle)).reduce((s: number, r: any) => s + (Number(r.investment_amount) || 0), 0),
      // DASH-b: only count applications whose credit landed this month.
      monthInvestment: activeInvRows.filter((r: any) => inThisMonth(investmentDateOf(r))).reduce((s: number, r: any) => s + (Number(r.investment_amount) || 0), 0),
      // DASH-c: only paid payouts contribute to totals.
      totalPayout: payRows.filter(isPaid).reduce((s: number, r: any) => s + (Number(r.net_interest) || 0), 0),
      monthPayout: payRows.filter(paidThisMonth).reduce((s: number, r: any) => s + (Number(r.net_interest) || 0), 0),
      totalTds:    payRows.filter(isPaid).reduce((s: number, r: any) => s + (Number(r.tds_amount) || 0), 0),
      monthTds:    payRows.filter(paidThisMonth).reduce((s: number, r: any) => s + (Number(r.tds_amount) || 0), 0),
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

    // ADMIN-1 (25-04-2026 testing): clients.pan is rarely populated;
    // the actual PAN lives in kyc_identity_details.pan_number. Fetch it
    // once and merge by client_id so the admin client view always has a
    // value to display.
    const { data: identRows } = await (supabase
      .from('kyc_identity_details')
      .select('client_id, pan_number') as any)
    const panMap = new Map<string, string>()
    for (const r of (identRows || []) as any[]) {
      if (r.client_id && r.pan_number) panMap.set(r.client_id, r.pan_number)
    }
    const panFor = (c: any): string => (c.pan && c.pan.trim()) ? c.pan : (panMap.get(c.id) || '')

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
        pan: panFor(c),
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
      pan: panFor(c),
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
    // ADMIN-1: mirror PAN onto clients.pan so admin lists/exports keep showing it
    // (kyc_identity_details is the source of truth, but consumer code reads clients.pan).
    try {
      const { data: ident } = await sb.from('kyc_identity_details').select('pan_number').eq('client_id', clientId).maybeSingle()
      if (ident?.pan_number) await sb.from('clients').update({ pan: ident.pan_number }).eq('id', clientId)
    } catch { /* non-fatal */ }
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
// invoices / commissions are stored snake_case in Postgres but the
// Financial module UI was written against camelCase shapes (clientName,
// dueDate, commissionAmount, salesRep). Map at this boundary so callers
// don't need to know.
export async function fetchInvoices() {
  const rows = await queryTable<any>('invoices')
  return (rows || []).map((r: any) => ({
    ...r,
    clientName: r.client_name ?? r.clientName ?? '',
    dueDate:    r.due_date    ?? r.dueDate    ?? null,
    amount: Number(r.amount) || 0,
    gst:    Number(r.gst)    || 0,
    total:  Number(r.total)  || 0,
  }))
}

export async function fetchExpenses() {
  return queryTable<any>('expenses')
}

export async function fetchCommissions() {
  const rows = await queryTable<any>('commissions')
  return (rows || []).map((r: any) => ({
    ...r,
    salesRep:         r.sales_rep         ?? r.salesRep         ?? '',
    clientName:       r.client_name       ?? r.clientName       ?? '',
    dealId:           r.deal_id           ?? r.dealId           ?? '',
    dealValue:        Number(r.deal_value)        || 0,
    commissionRate:   Number(r.commission_rate)   || 0,
    commissionAmount: Number(r.commission_amount) || 0,
  }))
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
// DB uses snake_case, the Admin UI / RealtyBroker type uses camelCase.
// Map the columns here so every consumer gets the shape they expect
// (reraId, totalDeals, totalValue, joinDate, lastActive, assignedRM).
export async function fetchRealtyBrokers() {
  const rows = await queryTable<any>('realty_brokers')
  return (rows || []).map((r: any) => ({
    id: r.id,
    name: r.name || '',
    email: r.email || '',
    phone: r.phone || '',
    company: r.company || '',
    reraId: r.rera_id || '',
    specialization: r.specialization || 'residential',
    city: r.city || '',
    status: r.status || 'pending-verification',
    totalDeals: Number(r.total_deals) || 0,
    totalValue: Number(r.total_value) || 0,
    commission: Number(r.commission) || 0,
    rating: Number(r.rating) || 0,
    joinDate: r.join_date || r.created_at || '',
    lastActive: r.last_active || r.updated_at || r.created_at || '',
    assignedRM: r.assigned_rm || undefined,
    tags: Array.isArray(r.tags) ? r.tags : [],
  }))
}

export async function fetchBrokerInquiries() {
  const rows = await queryTable<any>('broker_inquiries')
  return (rows || []).map((r: any) => ({
    id: r.id,
    brokerId: r.broker_id || undefined,
    brokerName: r.broker_name || '',
    source: r.source || 'website',
    type: r.type || 'realty',
    subject: r.subject || '',
    message: r.message || '',
    status: r.status || 'new',
    priority: r.priority || 'medium',
    assignedTo: r.assigned_to || undefined,
    propertyType: r.property_type || undefined,
    location: r.location || undefined,
    estimatedValue: r.estimated_value != null ? Number(r.estimated_value) : undefined,
    createdDate: r.created_at || '',
    lastUpdated: r.updated_at || r.created_at || '',
  }))
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

/**
 * Fetch every investment transaction enriched with client + investment-app
 * context. Used by the admin Financial > Transactions queue so staff don't
 * have to drill into each application to find what's waiting for review.
 */
export interface AdminInvestmentTransaction {
  id: string
  investment_app_id: string | null
  client_id: string
  client_name: string
  client_email: string | null
  fund_vehicle: string | null
  capital_amount: number
  transaction_amount: number
  transaction_id: string | null
  transaction_proof_url: string | null
  bank_account_id: string | null
  status: string
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export async function fetchAllInvestmentTransactions(filter?: 'pending' | 'approved' | 'rejected' | 'all'): Promise<AdminInvestmentTransaction[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const sb: any = supabase
    let query = sb
      .from('investment_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (filter && filter !== 'all') query = query.eq('status', filter)
    const { data: txns, error } = await query
    if (error || !txns) return []

    const clientIds = Array.from(new Set((txns as any[]).map(t => t.client_id).filter(Boolean)))
    const appIds = Array.from(new Set((txns as any[]).map(t => t.investment_app_id).filter(Boolean)))
    const [clientsRes, appsRes] = await Promise.all([
      clientIds.length > 0
        ? sb.from('clients').select('id, full_name, email').in('id', clientIds)
        : Promise.resolve({ data: [] }),
      appIds.length > 0
        ? sb.from('investment_applications').select('id, fund_vehicle').in('id', appIds)
        : Promise.resolve({ data: [] }),
    ])
    const clientById: Record<string, { name: string; email: string }> = {}
    ;(clientsRes.data || []).forEach((c: any) => { clientById[c.id] = { name: c.full_name || '', email: c.email || '' } })
    const appById: Record<string, { fund_vehicle: string | null }> = {}
    ;(appsRes.data || []).forEach((a: any) => { appById[a.id] = { fund_vehicle: a.fund_vehicle || null } })

    return (txns as any[]).map((t: any) => ({
      id: t.id,
      investment_app_id: t.investment_app_id,
      client_id: t.client_id,
      client_name: clientById[t.client_id]?.name || 'Unknown client',
      client_email: clientById[t.client_id]?.email || null,
      fund_vehicle: t.investment_app_id ? (appById[t.investment_app_id]?.fund_vehicle || null) : null,
      capital_amount: Number(t.capital_amount || 0),
      transaction_amount: Number(t.transaction_amount || 0),
      transaction_id: t.transaction_id,
      transaction_proof_url: t.transaction_proof_url,
      bank_account_id: t.bank_account_id,
      status: t.status || 'pending',
      admin_notes: t.admin_notes,
      reviewed_by: t.reviewed_by,
      reviewed_at: t.reviewed_at,
      created_at: t.created_at,
    }))
  } catch {
    return []
  }
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

// ── Reference Number Helper (Tests 28-04-2026 #5) ──────────────
// Builds `GHLVEN/{seq}/{FYcode}`. The Indian financial year runs Apr–Mar,
// so April 2026 belongs to FY 26-27 (code 2627) while March 2026 belongs
// to FY 25-26 (code 2526). The sequential number starts at 100 and counts
// every approved investment application within the same financial year.
export function getFinancialYearCode(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const month = d.getUTCMonth() // 0 = Jan, 3 = Apr
  const year = d.getUTCFullYear()
  const startYear = month >= 3 ? year : year - 1 // Apr–Dec stays, Jan–Mar rolls back
  const endYear = startYear + 1
  return `${String(startYear).slice(-2)}${String(endYear).slice(-2)}`
}

export async function generateGhlVenReference(investmentDate: string): Promise<string> {
  const fyCode = getFinancialYearCode(investmentDate || new Date().toISOString())
  let seq = 100
  if (isSupabaseConfigured()) {
    try {
      // Count all reference numbers issued for the same financial year so we
      // can keep numbering sequential per FY (admin requirement).
      const sb: any = supabase
      const { count } = await sb
        .from('investment_applications')
        .select('id', { count: 'exact', head: true })
        .like('reference_number', `GHLVEN/%/${fyCode}`)
      if (typeof count === 'number') seq = 100 + count
    } catch { /* fall back to 100 */ }
  }
  return `GHLVEN/${seq}/${fyCode}`
}

// ── Mark credit given on an investment application (bug #16) ──
// Returns true on success, or a string error message to surface in the UI.
export async function markInvestmentCreditGiven(appId: string, adminId: string): Promise<true | string> {
  if (!isSupabaseConfigured()) return 'Supabase not configured'
  try {
    const sb: any = supabase
    const nowIso = new Date().toISOString()

    // Preserve any credit/final-investment date the admin already set in the
    // Give-Credit modal (SalesModule.confirmGiveCredit). Only fall back to
    // today when neither field is populated yet — the credit date drives the
    // entire payout schedule, so blindly overwriting it would shift every row.
    const { data: existing } = await sb
      .from('investment_applications')
      .select('investment_date, final_investment_date')
      .eq('id', appId)
      .maybeSingle()

    // The credit date is whichever of these the admin populated first:
    //   1. final_investment_date (modal sets this)
    //   2. investment_date (set by confirmGiveCredit on the same submit)
    //   3. today (last-resort default)
    const creditDate = existing?.final_investment_date
      || existing?.investment_date
      || nowIso.split('T')[0]

    const update: Record<string, any> = {
      credit_given: true,
      credit_given_at: nowIso,
      credit_given_by: adminId,
      status: 'credited',
      // Mirror the credit date into BOTH columns so the schedule generator
      // and the investor UI cannot disagree even if `confirmGiveCredit`
      // failed to update one of them. This is the actual fix for
      // 28-04-2026: "Payout is not calculating as per credit database."
      final_investment_date: creditDate,
      investment_date: creditDate,
    }

    const { error } = await sb
      .from('investment_applications')
      .update(update)
      .eq('id', appId)
    if (error) {
      console.warn('[admin] markInvestmentCreditGiven error:', error.message)
      return error.message || 'Database rejected the update'
    }
    // Tests 28-04-2026 #7: payouts were originally scheduled from the
    // investment-application date. Once the admin issues credit, the
    // schedule must be re-anchored to the credit date — otherwise the
    // first month's pro-ration and every subsequent due date are wrong.
    // We delete every pending payout for this investment and rebuild from
    // scratch using `final_investment_date` (set in confirmGiveCredit) as
    // the new start date. Already-paid rows are preserved.
    try {
      const { data: app } = await sb.from('investment_applications').select('*').eq('id', appId).single()
      if (app) {
        // Issue 28-04-2026: when the credit date differs from the original
        // approval date, the maturity_date set at approval is stale (it was
        // computed from the older investment_date). Re-derive maturity from
        // the EFFECTIVE start date + tenure so the schedule extends to the
        // correct end. Then drop every pending row from the previous (now-
        // incorrect) schedule so the regen rebuilds them with the new dates
        // and prorated amounts. Paid rows are left untouched.
        const tenureYears = Number(String(app.tenure_preference || '').replace(/[^0-9]/g, '')) || 3
        const startStr = effectiveStartDate(app)
        if (startStr) {
          const sd = new Date(`${startStr}T00:00:00`)
          if (!Number.isNaN(sd.getTime())) {
            const md = new Date(sd); md.setFullYear(md.getFullYear() + tenureYears)
            const expectedMaturity = md.toISOString().split('T')[0]
            if (app.maturity_date !== expectedMaturity) {
              await sb.from('investment_applications').update({ maturity_date: expectedMaturity }).eq('id', appId)
              app.maturity_date = expectedMaturity
            }
          }
        }
        try {
          await sb
            .from('monthly_payouts')
            .delete()
            .eq('investment_id', app.id)
            .neq('payment_status', 'paid')
        } catch (cleanupErr) {
          console.warn('[admin] payout cleanup before regen non-fatal:', cleanupErr)
        }
        await generateFullPayoutSchedule(app)
      }
    } catch (e) { console.warn('[admin] auto-generate payouts non-fatal:', e) }
    return true
  } catch (e: any) {
    console.warn('[admin] markInvestmentCreditGiven exception:', e?.message)
    return e?.message || 'Unknown error'
  }
}

// ── Manual schedule regeneration (admin "Regenerate Schedule" button) ──
// Allows the admin to rebuild the payout schedule for a specific
// investment without re-clicking Give Credit. Uses the same logic as
// the auto-regen on credit-given so an out-of-sync schedule (e.g.
// after a back-dated credit edit) can be fixed in one click.
export async function regenerateInvestmentSchedule(appId: string): Promise<{ ok: boolean; rows?: number; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Service unavailable' }
  if (!appId) return { ok: false, error: 'Missing investment id' }
  try {
    const sb: any = supabase
    const { data: app } = await sb.from('investment_applications').select('*').eq('id', appId).single()
    if (!app) return { ok: false, error: 'Investment not found' }
    const startStr = effectiveStartDate(app)
    if (!startStr) return { ok: false, error: 'Investment has no start date — give credit first' }
    // Recompute maturity from the effective start so a backdated credit
    // doesn't truncate the schedule.
    const tenureYears = Number(String(app.tenure_preference || '').replace(/[^0-9]/g, '')) || 3
    const sd = new Date(`${startStr}T00:00:00`)
    if (!Number.isNaN(sd.getTime())) {
      const md = new Date(sd); md.setFullYear(md.getFullYear() + tenureYears)
      const expectedMaturity = md.toISOString().split('T')[0]
      if (app.maturity_date !== expectedMaturity) {
        await sb.from('investment_applications').update({ maturity_date: expectedMaturity }).eq('id', appId)
        app.maturity_date = expectedMaturity
      }
    }
    try {
      await sb
        .from('monthly_payouts')
        .delete()
        .eq('investment_id', app.id)
        .neq('payment_status', 'paid')
    } catch (cleanupErr) {
      console.warn('[admin] regen cleanup non-fatal:', cleanupErr)
    }
    const rows = await generateFullPayoutSchedule(app)
    return { ok: true, rows }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Regeneration failed' }
  }
}

// ── Effective start date for a credited investment ─────────────
// Tests 28-04-2026 (follow-up): the payout schedule + investor UI must
// always anchor to the credit date when the admin has given credit.
// We previously relied on `app.investment_date` being overwritten in
// `confirmGiveCredit`, but if that update was skipped or rolled back the
// schedule silently fell back to the original application date. This
// helper centralises the priority so every consumer agrees on which
// field is "the start of the investment":
//
//   1. final_investment_date  ← set by Give-Credit modal (date string)
//   2. credit_given_at        ← timestamptz when credit-given fired
//   3. investment_date        ← legacy approval-date column
//   4. created_at             ← absolute fallback (application date)
export function effectiveStartDate(app: any): string | null {
  if (!app) return null
  const pickDate = (v: any): string | null => {
    if (!v) return null
    const s = String(v)
    return s.includes('T') ? s.split('T')[0] : s
  }
  return (
    pickDate(app.final_investment_date)
    || pickDate(app.credit_given_at)
    || pickDate(app.investment_date)
    || pickDate(app.created_at)
  )
}

// ── Generate full payout schedule for a single investment ──────
// AIF funds pay yearly; Debenture / LLP pay monthly. The schedule runs from
// the effective start date to maturity_date. Idempotent — looks up existing
// rows keyed by (investment_id, due_date) and only inserts missing ones.
export async function generateFullPayoutSchedule(app: any) {
  if (!isSupabaseConfigured() || !app?.id) return 0
  const sb: any = supabase
  try {
    // Use the credit-aware effective start date so the first-month
    // proration always follows the credit database, never the stale
    // application/approval date.
    const startDateStr = effectiveStartDate(app)
    if (!startDateStr) return 0
    const fv: string = app.fund_vehicle || ''
    // AIF = yearly, Debenture/LLP (and anything else) = monthly
    const isAIF = fv.includes('AIF Direct') || fv === 'Direct AIF Route' || (fv.includes('AIF') && !fv.toLowerCase().includes('debenture') && !fv.toLowerCase().includes('llp'))
    const frequencyMonths = isAIF ? 12 : 1

    const amount = Number(app.final_investment_amount) || Number(app.investment_amount) || 0
    if (amount <= 0) return 0
    const interestRate = Number(app.interest_rate) || 12
    const tdsPercent = Number(app.tds_rate) || 10
    const startDate = new Date(`${startDateStr}T00:00:00`)
    const tenureYears = Number(String(app.tenure_preference || '').replace(/[^0-9]/g, '')) || 3
    // Recompute maturity from the effective start so a back-dated credit
    // doesn't leave a stale maturity that truncates the schedule.
    const expectedMaturity = (() => {
      const d = new Date(startDate)
      d.setFullYear(d.getFullYear() + tenureYears)
      return d
    })()
    const maturity = app.maturity_date
      ? new Date(`${String(app.maturity_date).split('T')[0]}T00:00:00`)
      : expectedMaturity

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

    // Issue 28-04-2026: when the credit/investment date falls mid-month, the
    // first payout only covers the days from start-day to month-end. The
    // (startDay - 1) days at the front of the start month are not lost — they
    // are paid as a 37th-month catch-up one cycle after the last regular
    // payout, so the investor still receives a full tenure's worth of interest.
    const trailingDays = needsProrate ? startDay - 1 : 0
    const trailingPct = needsProrate ? trailingDays / daysInStartMonth : 0
    const trailingGross = needsProrate ? +(grossPerPeriod * trailingPct).toFixed(2) : 0
    const trailingTds = +(trailingGross * (tdsPercent / 100)).toFixed(2)
    const trailingNet = +(trailingGross - trailingTds).toFixed(2)

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

    // Append the 37th-month catch-up payout (one cycle after the last regular
    // due date) to recover the front-of-month days lost to proration.
    let trailingDueDate: string | null = null
    if (needsProrate && trailingGross > 0) {
      const lastRegular = new Date(dueDates[dueDates.length - 1] + 'T00:00:00')
      lastRegular.setMonth(lastRegular.getMonth() + frequencyMonths)
      if (!isAIF) lastRegular.setDate(5)
      trailingDueDate = lastRegular.toISOString().split('T')[0]
      dueDates.push(trailingDueDate)
    }

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
      const isTrailing = trailingDueDate !== null && due_date === trailingDueDate
      let gross = grossPerPeriod
      let tds = tdsPerPeriod
      let net = netPerPeriod
      if (isFirst) { gross = firstGross; tds = firstTds; net = firstNet }
      else if (isTrailing) { gross = trailingGross; tds = trailingTds; net = trailingNet }
      return {
        client_id: app.client_id,
        investment_id: app.id,
        ghl_id: client?.client_code || '',
        fund_type: app.fund_vehicle || '',
        investment_amount: amount,
        // Stamp the row with the same effective start the math used so any
        // future query/diff against monthly_payouts can verify it matches
        // the credit date and not the stale legacy field.
        investment_date: startDateStr,
        due_date,
        gross_amount: gross,
        tds_percentage: tdsPercent,
        tds_amount: tds,
        net_interest: net,
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
    // Tests 28-04-2026 #5 / Testing Report 2 (2026-04-25 #8): reference
    // number must follow `GHLVEN/{seq}/{FY}` where seq starts at 100 and FY
    // uses the Indian financial year (Apr–Mar) encoded as e.g. 2526 / 2627.
    // The next_investment_reference RPC mints the value atomically so
    // concurrent approvals don't collide. If the RPC is unavailable we
    // fall back to a count-based generator that still respects the format.
    let referenceNumber: string = app.reference_number || ''
    if (!referenceNumber) {
      try {
        const sb2: any = supabase
        const { data: refData, error: refErr } = await sb2.rpc('next_investment_reference')
        if (!refErr && typeof refData === 'string' && refData) {
          referenceNumber = refData
        } else {
          referenceNumber = await generateGhlVenReference(investmentDate)
        }
      } catch {
        referenceNumber = await generateGhlVenReference(investmentDate)
      }
    }

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

    // INV-2 (25-04-2026): we no longer create a file_url='' placeholder row
    // on approval. The investor's Documents tab was showing both the
    // placeholder and the admin's actual upload, causing duplication. The
    // admin uploads the real Acknowledgement Letter via the Investment
    // Documents panel; that's the only entry the investor sees.

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

// ── Delete an investment application + cascade related rows ──
// Tests 28-04-2026 #3: admin needs a "Delete Investment" action. The
// `investment_applications` row owns child rows in `monthly_payouts`,
// `investment_documents`, and `investment_transactions` — wipe those
// first so we don't leave orphaned schedules visible to the investor.
export async function deleteInvestmentApplication(appId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Supabase not configured' }
  if (!appId) return { ok: false, error: 'Missing investment id' }
  try {
    const sb: any = supabase
    // Delete dependents first (best-effort — table may not exist in some envs)
    try { await sb.from('monthly_payouts').delete().eq('investment_id', appId) } catch { /* non-fatal */ }
    try { await sb.from('investment_documents').delete().eq('investment_app_id', appId) } catch { /* non-fatal */ }
    try { await sb.from('investment_transactions').delete().eq('investment_app_id', appId) } catch { /* non-fatal */ }
    const { error } = await sb.from('investment_applications').delete().eq('id', appId)
    if (error) return { ok: false, error: error.message || 'Delete failed' }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Unknown error' }
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
      // Bug #13 / ADMIN-3 (25-04-2026): include phone, client_code, AND ghl_id.
      // The GHL ID column actually lives in `clients.ghl_id`; `client_code` is
      // a legacy column that's null for everyone. We surface a unified
      // `client_code` field on the joined record so existing UI keeps working.
      const { data: clients } = await (supabase.from('clients').select('id, full_name, email, phone, client_code, ghl_id').in('id', clientIds) as any)
      const clientMap = new Map((clients || []).map((c: any) => [c.id, { ...c, client_code: c.ghl_id || c.client_code || '' }]))
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
  // Lead taxonomy + KYC step tables — needed for admin-panel delete with
  // dependency checks (Lead Statuses/Sources/Companies and KYC Queue).
  'lead_statuses', 'lead_sources', 'lead_companies',
  'kyc_basic_details', 'kyc_identity_details', 'kyc_bank_details', 'kyc_demat_details',
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

// ═══════════════════════════════════════════════════════════════════
// ── DEPENDENCY-AWARE DELETE HELPERS ──────────────────────────────
// These wrap destructive admin actions with business-rule checks so
// the UI can show a clear "cannot delete" message instead of silently
// orphaning data (e.g. Lead Status still referenced by existing leads,
// Employee assigned to a lead, KYC/Investment already approved).
// ═══════════════════════════════════════════════════════════════════

export type DeleteResult = { ok: boolean; error?: string }

// ── Client delete: full purge of client + KYC + storage + auth.
// Blocks when KYC is approved or any investment_application is in an
// "active" status (approved/credited/completed) so SEBI-retained data
// stays put. When the guards pass, calls the admin_delete_client_full
// RPC which:
//   • collects every storage path (KYC docs + investment docs + avatar)
//     and removes the underlying files via storage.objects DELETE
//   • clears NO ACTION + CASCADE child rows in dependency order
//   • removes profiles, auth.identities, auth.users
// The RPC handles the legacy "no auth user" case automatically.
export async function deleteClientSafe(clientId: string, userId?: string | null): Promise<DeleteResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Service unavailable' }
  try {
    const sb = supabase as any
    const { data: client } = await sb.from('clients').select('kyc_status, full_name, user_id').eq('id', clientId).maybeSingle()
    if (!client) return { ok: false, error: 'Client not found' }
    if (client.kyc_status === 'approved' || client.kyc_status === 'verified') {
      return { ok: false, error: 'Client has approved KYC and cannot be deleted.' }
    }
    const { data: inv } = await sb
      .from('investment_applications')
      .select('id, status')
      .eq('client_id', clientId)
      .in('status', ['approved', 'credited', 'completed'])
      .limit(1)
    if (Array.isArray(inv) && inv.length > 0) {
      return { ok: false, error: 'Client has approved investments and cannot be deleted.' }
    }

    // Audit BEFORE the destructive call so we always have a record.
    try {
      await sb.from('audit_logs').insert({
        action: 'delete_client_full_purge',
        entity_type: 'client',
        entity_id: clientId,
        module: 'admin',
        details: {
          full_name: client.full_name,
          user_id: userId || client.user_id || null,
          reason: 'admin_full_purge_storage_and_db',
        },
      })
    } catch { /* non-blocking */ }

    // Storage objects must be deleted via the Storage REST API
    // (Supabase blocks direct DELETE FROM storage.objects). Route both
    // the storage cleanup and the DB purge through the
    // admin-delete-client Netlify function so they happen in lockstep
    // with proper service-role auth.
    try {
      const { getAuthToken } = await import('./client')
      const token = await getAuthToken()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const NETLIFY_FUNCTIONS_HOST = 'https://ghl-india-ventures-2025.netlify.app'
      const base = origin.includes('localhost')
        ? 'http://localhost:8888'
        : (origin.endsWith('.netlify.app') ? origin : NETLIFY_FUNCTIONS_HOST)
      const res = await fetch(`${base}/.netlify/functions/admin-delete-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        return { ok: false, error: data?.error || `Delete failed (${res.status})` }
      }
      return { ok: true }
    } catch (e: any) {
      // Fallback: pure DB purge via RPC. Storage objects will linger but
      // the DB is consistent.
      const { data: ok2, error } = await sb.rpc('admin_delete_client_full', { p_client_id: clientId })
      if (error) return { ok: false, error: error.message }
      if (ok2 !== true) return { ok: false, error: 'Purge returned false' }
      return { ok: true }
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Delete failed' }
  }
}

// ── KYC delete: remove per-client KYC rows and reset kyc_status to 'pending'
// Blocks when KYC is already approved/verified.
export async function deleteClientKYCSafe(clientId: string): Promise<DeleteResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Service unavailable' }
  try {
    const sb = supabase as any
    const { data: client } = await sb.from('clients').select('kyc_status').eq('id', clientId).maybeSingle()
    if (!client) return { ok: false, error: 'Client not found' }
    if (client.kyc_status === 'approved' || client.kyc_status === 'verified') {
      return { ok: false, error: 'KYC is approved and cannot be deleted.' }
    }
    // Delete per-step KYC rows. Ignore individual errors (table may not
    // have a row for every step) and collect any fatal error.
    const tables = ['kyc_basic_details', 'kyc_identity_details', 'kyc_bank_details', 'kyc_demat_details']
    for (const t of tables) {
      try { await sb.from(t).delete().eq('client_id', clientId) } catch { /* ignore per-table */ }
    }
    // Reset kyc_status back to pending so client can restart KYC.
    try { await sb.from('clients').update({ kyc_status: 'pending' }).eq('id', clientId) } catch { /* ignore */ }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Delete failed' }
  }
}

// ── Investment delete: block when status is approved/credited/completed
export async function deleteInvestmentSafe(investmentId: string): Promise<DeleteResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Service unavailable' }
  try {
    const sb = supabase as any
    const { data: app } = await sb.from('investment_applications').select('status, client_id').eq('id', investmentId).maybeSingle()
    if (!app) return { ok: false, error: 'Investment not found' }
    if (['approved', 'credited', 'completed'].includes(app.status)) {
      return { ok: false, error: 'Investment is approved and cannot be deleted.' }
    }
    // Testing Report 2 (2026-04-25 #4): the parent delete previously
    // surfaced "deleted" in the UI but actually failed because of NO ACTION
    // FKs from investment_documents and investment_transactions. Cascade-
    // clean those first so pending applications can be removed cleanly.
    await sb.from('investment_documents').delete().eq('investment_app_id', investmentId)
    await sb.from('investment_transactions').delete().eq('investment_app_id', investmentId)
    // monthly_payouts.investment_id points at the legacy investments table,
    // not investment_applications, so removing the application doesn't
    // require touching it.
    const { error } = await sb.from('investment_applications').delete().eq('id', investmentId)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Delete failed' }
  }
}

// ── Lead-taxonomy deletes: block when any lead references the record.
// Leads don't have FK columns for status/source — they store the name in
// `lead_status_name` / `source` — so we match by name, not id.
async function countLeadRefsByColumn(column: string, value: string): Promise<number> {
  const sb = supabase as any
  const { count, error } = await sb.from('leads').select('id', { count: 'exact', head: true }).eq(column, value)
  if (error) { console.warn('[admin] countLeadRefsByColumn error:', error.message); return 0 }
  return count || 0
}

export async function deleteLeadStatusSafe(id: string): Promise<DeleteResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Service unavailable' }
  try {
    const sb = supabase as any
    const { data: row } = await sb.from('lead_statuses').select('name').eq('id', id).maybeSingle()
    if (!row) return { ok: false, error: 'Status not found' }
    const name: string = row.name
    const stageValue = name.toLowerCase().replace(/\s+/g, '-')
    const byName = await countLeadRefsByColumn('lead_status_name', name)
    const byStage = await countLeadRefsByColumn('stage', stageValue)
    if (byName + byStage > 0) return { ok: false, error: 'This status is already used in Leads and cannot be deleted.' }
    const { error } = await sb.from('lead_statuses').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Delete failed' } }
}

export async function deleteLeadSourceSafe(id: string): Promise<DeleteResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Service unavailable' }
  try {
    const sb = supabase as any
    const { data: row } = await sb.from('lead_sources').select('name').eq('id', id).maybeSingle()
    if (!row) return { ok: false, error: 'Source not found' }
    const name: string = row.name
    // leads.source is an enum stored as lowercased-hyphen-slug (see Edit Lead form).
    const sourceValue = name.toLowerCase().replace(/\s+/g, '-')
    let used = await countLeadRefsByColumn('source', sourceValue)
    if (used === 0 && sourceValue !== name.toLowerCase()) {
      used = await countLeadRefsByColumn('source', name.toLowerCase())
    }
    if (used > 0) return { ok: false, error: 'This source is already used in Leads and cannot be deleted.' }
    const { error } = await sb.from('lead_sources').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Delete failed' } }
}

export async function deleteLeadCompanySafe(id: string): Promise<DeleteResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Service unavailable' }
  try {
    const sb = supabase as any
    const { data: row } = await sb.from('lead_companies').select('name').eq('id', id).maybeSingle()
    if (!row) return { ok: false, error: 'Company not found' }
    const byId = await countLeadRefsByColumn('company_id', id)
    const byName = await countLeadRefsByColumn('company_name', row.name)
    if (byId + byName > 0) return { ok: false, error: 'This company is already used in Leads and cannot be deleted.' }
    const { error } = await sb.from('lead_companies').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Delete failed' } }
}

// ── Employee delete: block if assigned to any lead (as assignee)
export async function deleteEmployeeSafe(staffProfileId: string, userId: string): Promise<DeleteResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Service unavailable' }
  try {
    const sb = supabase as any
    // Check leads.assigned_to — column accepts the auth user_id
    if (userId) {
      const { count } = await sb.from('leads').select('id', { count: 'exact', head: true }).eq('assigned_to', userId)
      if ((count || 0) > 0) {
        return { ok: false, error: 'This employee is assigned to one or more leads and cannot be deleted.' }
      }
    }
    // Prefer full cleanup via RPC (removes auth + profile + staff rows)
    if (userId) {
      const ok = await deleteUserComplete(userId)
      if (ok) return { ok: true }
    }
    // Fallback: delete the staff_profile row directly
    const { error } = await sb.from('staff_profiles').delete().eq('id', staffProfileId)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Delete failed' } }
}

// ── Asset delete: straightforward — reuses the generic deleteRow helper
export async function deleteAssetSafe(id: string): Promise<DeleteResult> {
  const ok = await deleteRow('assets', id)
  return ok ? { ok: true } : { ok: false, error: 'Failed to delete asset' }
}

// ── Realty broker delete: block when the broker has open inquiries
// (broker_inquiries.broker_id → realty_brokers.id is RESTRICT).
export async function deleteRealtyBrokerSafe(id: string): Promise<DeleteResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Service unavailable' }
  try {
    const sb = supabase as any
    const { count } = await sb
      .from('broker_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('broker_id', id)
    if ((count || 0) > 0) {
      return { ok: false, error: 'Broker has linked inquiries and cannot be deleted. Remove or reassign inquiries first.' }
    }
    const { error } = await sb.from('realty_brokers').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Delete failed' }
  }
}
