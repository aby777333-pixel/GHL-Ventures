/* ─────────────────────────────────────────────────────────────
   Dashboard Data Service — Client portal data (production)

   Fetches real data scoped to the logged-in client from Supabase.
   Returns empty arrays/defaults when no data available.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'

// Untyped reference for queries
const sb = supabase as any

// ── Safe query helper (catches network/SSL/HTML errors) ─────
async function safeFetch<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallback: T,
  label: string,
): Promise<T> {
  try {
    const { data, error } = await queryFn()
    if (error) {
      console.warn(`[dashboard] ${label}:`, error.message)
      return fallback
    }
    return data ?? fallback
  } catch (err) {
    console.warn(`[dashboard] ${label} exception:`, err)
    return fallback
  }
}

// ── Service Functions ───────────────────────────────────────

export async function fetchPortfolioAssets(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  return safeFetch(
    () => sb.from('investments').select('*').eq('client_id', clientId),
    [], 'fetchPortfolioAssets',
  )
}

export async function fetchNAVHistory(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  const rows = await safeFetch(
    () => sb.from('nav_history').select('*').eq('client_id', clientId).order('month', { ascending: true }),
    [], 'fetchNAVHistory',
  )
  // Normalize: DB has nav_value, chart expects nav
  return (rows as any[]).map((r: any) => ({
    ...r,
    nav: r.nav_value ?? r.nav ?? 0,
    month: r.month ? new Date(r.month).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : r.month,
  }))
}

export async function getAllocation(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  // Compute allocation from investments
  try {
    const { data } = await sb.from('investments').select('fund_type, current_value').eq('client_id', clientId)
    if (!data || data.length === 0) return []
    const totals: Record<string, number> = {}
    let total = 0
    for (const inv of data as any[]) {
      const type = inv.fund_type || 'Other'
      totals[type] = (totals[type] || 0) + (Number(inv.current_value) || 0)
      total += Number(inv.current_value) || 0
    }
    const colors: Record<string, string> = { 'Stressed RE': '#D0021B', 'Startups': '#F59E0B', 'Fixed Income': '#3B82F6', 'Direct RE': '#10B981' }
    return Object.entries(totals).map(([name, value]) => ({
      name,
      value: total > 0 ? Math.round((value / total) * 100) : 0,
      color: colors[name] || '#6B7280',
    }))
  } catch { return [] }
}

export async function fetchTransactions(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  const rows = await safeFetch(
    () => sb.from('transactions').select('*').eq('client_id', clientId).order('date', { ascending: false }),
    [], 'fetchTransactions',
  )
  // Normalize: ensure date is formatted for display
  return (rows as any[]).map((r: any) => ({
    ...r,
    date: r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : r.date,
  }))
}

export async function fetchPayoutHistory(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  return safeFetch(
    () => sb.from('transactions').select('*').eq('client_id', clientId).eq('type', 'Dividend').order('date', { ascending: false }),
    [], 'fetchPayoutHistory',
  )
}

export async function fetchMessages(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  // Messages use auth user IDs for from_id/to_id, not client record IDs.
  // Resolve the auth user_id from the clients table first.
  let userId = clientId
  try {
    const { data: clientRow } = await sb.from('clients').select('user_id').eq('id', clientId).maybeSingle()
    if (clientRow?.user_id) userId = clientRow.user_id
  } catch { /* use clientId as fallback */ }
  const rows = await safeFetch(
    () => sb.from('messages').select('*').or(`to_id.eq.${userId},from_id.eq.${userId}`).order('created_at', { ascending: false }),
    [], 'fetchMessages',
  )
  // Normalize field names for display
  return (rows as any[]).map((r: any) => ({
    ...r,
    from: r.from_name || 'Advisory Team',
    avatar: (r.from_name || 'A')[0]?.toUpperCase() || 'A',
    time: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
    preview: r.body?.substring(0, 80) || '',
  }))
}

export async function fetchSupportTickets(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  return safeFetch(
    () => sb.from('tickets').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    [], 'fetchSupportTickets',
  )
}

export async function fetchNotifications(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  const rows = await safeFetch(
    () => sb.from('notifications').select('*').eq('user_id', clientId).order('created_at', { ascending: false }).limit(20),
    [], 'fetchNotifications',
  )
  // Sanitize: ensure no JSONB objects are rendered as React children (prevents React #310)
  return (rows as any[]).map((r: any) => ({
    ...r,
    title: typeof r.title === 'object' ? JSON.stringify(r.title) : r.title,
    message: typeof r.message === 'object' ? JSON.stringify(r.message) : r.message,
    metadata: r.metadata, // keep as object but never render directly
  }))
}

export async function getKYCSteps(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  try {
    // Check each structured KYC table for completion
    const steps = [
      { id: 'basic', label: 'Basic Details', table: 'kyc_basic_details' },
      { id: 'identity', label: 'Identity Details', table: 'kyc_identity_details' },
      { id: 'bank', label: 'Bank Details', table: 'kyc_bank_details' },
      { id: 'demat', label: 'Demat Account', table: 'kyc_demat_details' },
      { id: 'nominee', label: 'Nominee Details', table: 'nominees' },
    ]
    const results = []
    for (const step of steps) {
      if (step.id === 'nominee') {
        const { data } = await sb.from(step.table).select('id, status').eq('client_id', clientId).eq('status', 'active')
        results.push({ id: step.id, label: step.label, status: data && data.length > 0 ? 'submitted' : 'pending' })
      } else {
        const { data } = await sb.from(step.table).select('status').eq('client_id', clientId).maybeSingle()
        results.push({ id: step.id, label: step.label, status: data?.status || 'pending' })
      }
    }
    return results
  } catch { return [] }
}

// ── Structured KYC CRUD ─────────────────────────────────────

export async function fetchKYCBasicDetails(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return null
  return safeFetch(() => sb.from('kyc_basic_details').select('*').eq('client_id', clientId).maybeSingle(), null, 'fetchKYCBasic')
}

export async function upsertKYCBasicDetails(clientId: string, userId: string, data: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const row = { ...data, client_id: clientId, user_id: userId, status: 'submitted' }
  const { data: result, error } = await sb.from('kyc_basic_details').upsert(row, { onConflict: 'client_id' }).select().single()
  if (error) { console.warn('[kyc] upsert basic error:', error.message); return null }
  await sb.from('clients').update({ kyc_step: Math.max(1, data.kyc_step || 1) }).eq('id', clientId)
  return result
}

export async function fetchKYCIdentityDetails(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return null
  return safeFetch(() => sb.from('kyc_identity_details').select('*').eq('client_id', clientId).maybeSingle(), null, 'fetchKYCIdentity')
}

export async function upsertKYCIdentityDetails(clientId: string, userId: string, data: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const row = { ...data, client_id: clientId, user_id: userId, status: 'submitted' }
  const { data: result, error } = await sb.from('kyc_identity_details').upsert(row, { onConflict: 'client_id' }).select().single()
  if (error) { console.warn('[kyc] upsert identity error:', error.message); return null }
  await sb.from('clients').update({ kyc_step: Math.max(2, data.kyc_step || 2) }).eq('id', clientId)
  return result
}

export async function fetchKYCBankDetails(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return null
  return safeFetch(() => sb.from('kyc_bank_details').select('*').eq('client_id', clientId).maybeSingle(), null, 'fetchKYCBank')
}

export async function upsertKYCBankDetails(clientId: string, userId: string, data: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const row = { ...data, client_id: clientId, user_id: userId, status: 'submitted' }
  const { data: result, error } = await sb.from('kyc_bank_details').upsert(row, { onConflict: 'client_id' }).select().single()
  if (error) { console.warn('[kyc] upsert bank error:', error.message); return null }
  await sb.from('clients').update({ kyc_step: Math.max(3, data.kyc_step || 3) }).eq('id', clientId)
  return result
}

export async function fetchKYCDematDetails(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return null
  return safeFetch(() => sb.from('kyc_demat_details').select('*').eq('client_id', clientId).maybeSingle(), null, 'fetchKYCDemat')
}

export async function upsertKYCDematDetails(clientId: string, userId: string, data: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const row = { ...data, client_id: clientId, user_id: userId, status: data.skipped ? 'skipped' : 'submitted' }
  const { data: result, error } = await sb.from('kyc_demat_details').upsert(row, { onConflict: 'client_id' }).select().single()
  if (error) { console.warn('[kyc] upsert demat error:', error.message); return null }
  await sb.from('clients').update({ kyc_step: Math.max(4, data.kyc_step || 4) }).eq('id', clientId)
  return result
}

export async function fetchNominees(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  return safeFetch(() => sb.from('nominees').select('*').eq('client_id', clientId).eq('status', 'active').order('created_at'), [], 'fetchNominees')
}

export async function addNominee(clientId: string, userId: string, data: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const row = { ...data, client_id: clientId, user_id: userId, status: 'active' }
  const { data: result, error } = await sb.from('nominees').insert(row).select().single()
  if (error) { console.warn('[kyc] add nominee error:', error.message); return null }
  return result
}

export async function updateNominee(nomineeId: string, data: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const { data: result, error } = await sb.from('nominees').update(data).eq('id', nomineeId).select().single()
  if (error) { console.warn('[kyc] update nominee error:', error.message); return null }
  return result
}

export async function deleteNominee(nomineeId: string) {
  if (!isSupabaseConfigured()) return false
  const { error } = await sb.from('nominees').update({ status: 'inactive' }).eq('id', nomineeId)
  return !error
}

export async function submitKYCForReview(clientId: string) {
  if (!isSupabaseConfigured()) return false
  try {
    // Update all step statuses to submitted
    await Promise.all([
      sb.from('kyc_basic_details').update({ status: 'submitted' }).eq('client_id', clientId),
      sb.from('kyc_identity_details').update({ status: 'submitted' }).eq('client_id', clientId),
      sb.from('kyc_bank_details').update({ status: 'submitted' }).eq('client_id', clientId),
    ])
    // Update client kyc_status
    await sb.from('clients').update({ kyc_status: 'submitted', kyc_step: 5 }).eq('id', clientId)
    // Notify admins
    try {
      const { data: admins } = await sb.from('profiles').select('id').in('role', ['admin', 'super_admin'])
      const { data: clientData } = await sb.from('clients').select('full_name').eq('id', clientId).single()
      if (admins && admins.length > 0) {
        const notifs = admins.map((a: any) => ({
          user_id: a.id,
          title: 'New KYC Submission',
          message: `${clientData?.full_name || 'A client'} has submitted KYC for review.`,
          type: 'info',
          link: '/admin?tab=kyc-queue',
          metadata: { client_id: clientId },
        }))
        await sb.from('notifications').insert(notifs)
      }
    } catch { /* non-blocking */ }
    return true
  } catch { return false }
}

export async function fetchKYCOverallStatus(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return { step: 0, status: 'pending' }
  try {
    const { data: client } = await sb.from('clients').select('kyc_step, kyc_status').eq('id', clientId).maybeSingle()
    return { step: client?.kyc_step || 0, status: client?.kyc_status || 'pending' }
  } catch { return { step: 0, status: 'pending' } }
}

export async function fetchDocuments(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  return safeFetch(
    () => sb.from('documents').select('*').or(`client_id.eq.${clientId},entity_id.eq.${clientId}`).order('uploaded_at', { ascending: false }),
    [], 'fetchDocuments',
  )
}

export async function getAdminNews() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data } = await sb.from('announcements').select('*').order('created_at', { ascending: false }).limit(10)
    return data || []
  } catch { return [] }
}

// ── CRUD ────────────────────────────────────────────────────

export async function createSupportTicket(ticket: Record<string, any>) {
  if (!isSupabaseConfigured()) return null

  // Auto-generate ticket_number (required NOT NULL field)
  const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  // Resolve client_name from clients table (client_id = clients.id, NOT profiles.id)
  let clientName = ticket.client_name || 'Client'
  if (!ticket.client_name && ticket.client_id) {
    try {
      const { data: clientRow } = await sb.from('clients').select('full_name').eq('id', ticket.client_id).maybeSingle()
      if (clientRow?.full_name) clientName = clientRow.full_name
    } catch { /* use default */ }
  }

  const row = {
    ...ticket,
    ticket_number: ticketNumber,
    client_name: clientName,
  }

  const { data, error } = await sb.from('tickets').insert(row).select().single()
  if (error) { console.warn('[dashboard] Create ticket error:', error.message); return null }

  // Create notification for admins about new ticket
  try {
    const { data: admins } = await sb.from('profiles').select('id').eq('role', 'admin')
    if (admins && admins.length > 0) {
      const notifs = admins.map((a: any) => ({
        user_id: a.id,
        title: `New Support Ticket: ${ticket.subject || 'No subject'}`,
        message: `${clientName} raised a ${ticket.category || 'General'} ticket. Priority: ${ticket.priority || 'medium'}`,
        type: 'info',
        link: '/admin?tab=support',
        metadata: { ticket_id: data?.id, ticket_number: ticketNumber },
      }))
      await sb.from('notifications').insert(notifs)
    }
  } catch { /* non-blocking */ }

  return data
}

export async function sendMessage(message: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await sb.from('messages').insert(message).select().single()
  if (error) { console.warn('[dashboard] Send message error:', error.message); return null }
  return data
}

export async function markNotificationRead(notificationId: string) {
  if (!isSupabaseConfigured()) return false
  const { error } = await sb.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', notificationId)
  if (error) return false
  return true
}

export async function uploadDocument(doc: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await sb.from('documents').insert(doc).select().single()
  if (error) { console.warn('[dashboard] Upload doc error:', error.message); return null }
  return data
}

// ── Update Profile ─────────────────────────────────────────
export async function updateProfile(fields: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null

  // Update profiles table
  const profileUpdate: Record<string, any> = {}
  if ('full_name' in fields && fields.full_name) profileUpdate.full_name = fields.full_name
  if ('phone' in fields && fields.phone) profileUpdate.phone = fields.phone
  if ('city' in fields && fields.city) profileUpdate.city = fields.city

  if (Object.keys(profileUpdate).length > 0) {
    const { error: pErr } = await sb.from('profiles').update(profileUpdate).eq('id', user.id)
    if (pErr) console.warn('[dashboard] Profile update error:', pErr.message)
  }

  // Update clients table (nominee, dob, occupation stored here)
  // Use 'in' check so empty strings don't prevent fields from being saved
  const clientFields = ['dob', 'occupation', 'nominee_name', 'nominee_relation', 'nominee_pan', 'nominee_share']
  const clientUpdate: Record<string, any> = {}
  for (const key of clientFields) {
    if (key in fields && fields[key] !== undefined && fields[key] !== '') {
      clientUpdate[key] = fields[key]
    }
  }

  if (Object.keys(clientUpdate).length > 0) {
    clientUpdate.updated_at = new Date().toISOString()
    const { error: cErr } = await sb.from('clients').update(clientUpdate).eq('user_id', user.id)
    if (cErr) {
      console.warn('[dashboard] Client update error:', cErr.message)
      // Fallback: try upsert via insert if no row exists
      const { error: iErr } = await sb.from('clients').upsert({
        user_id: user.id,
        email: user.email || '',
        full_name: fields.full_name || '',
        ...clientUpdate,
      }, { onConflict: 'user_id' })
      if (iErr) console.warn('[dashboard] Client upsert fallback error:', iErr.message)
    }
  }

  return true
}

// ── Assigned RM ────────────────────────────────────────────
export async function fetchAssignedRM(clientId?: string): Promise<{ name: string; designation: string; department: string } | null> {
  if (!isSupabaseConfigured() || !clientId) return null

  try {
    // Get the client's assigned_rm (which is a staff_profiles.id)
    const { data: clientData } = await sb
      .from('clients')
      .select('assigned_rm')
      .eq('id', clientId)
      .single()

    if (!clientData?.assigned_rm) return null

    // Get staff_profile to get user_id and designation
    const { data: staffProfile } = await sb
      .from('staff_profiles')
      .select('user_id, designation, department')
      .eq('id', clientData.assigned_rm)
      .single()

    if (!staffProfile?.user_id) return null

    // Get the profile name
    const { data: profile } = await sb
      .from('profiles')
      .select('full_name')
      .eq('id', staffProfile.user_id)
      .single()

    return {
      name: profile?.full_name || 'Your Relationship Manager',
      designation: staffProfile.designation || 'Relationship Manager',
      department: staffProfile.department || '',
    }
  } catch (err) {
    console.warn('[dashboard] fetchAssignedRM exception:', err)
    return null
  }
}

// ── Referral System ──────────────────────────────────────────

/**
 * Generate a unique, deterministic referral code from a user ID.
 * Format: GHL-XXXXXXXX (first 8 chars of user UUID uppercased)
 */
export function generateReferralCode(userId: string): string {
  if (!userId) return 'GHL-UNKNOWN'
  return `GHL-${userId.replace(/-/g, '').substring(0, 8).toUpperCase()}`
}

/**
 * Fetch referral stats for a user (how many referred, any rewards).
 * Uses clients.referred_by or leads with source='referral' and metadata.
 */
export async function fetchReferralStats(userId?: string): Promise<{ referred: number; earned: number }> {
  if (!isSupabaseConfigured() || !userId) return { referred: 0, earned: 0 }

  const code = generateReferralCode(userId)

  try {
    // Count leads that came in with this referral code
    const { data: referredLeads, error } = await sb
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('source', 'referral')
      .like('metadata->>referral_code', code)

    const count = referredLeads?.length || 0
    return { referred: count, earned: 0 } // Earnings TBD by admin
  } catch {
    return { referred: 0, earned: 0 }
  }
}

/**
 * Record a referral when a new user signs up with a referral code.
 * Creates a lead entry + sends notifications.
 */
export async function recordReferral(referralCode: string, referredName: string, referredEmail: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !referralCode) return false

  try {
    // Create lead with referral source
    await sb.from('leads').insert({
      name: referredName,
      email: referredEmail,
      source: 'referral',
      status: 'new',
      metadata: { referral_code: referralCode, referred_at: new Date().toISOString() },
    })

    // Find the referrer by matching code to user ID
    const codePrefix = referralCode.replace('GHL-', '').toLowerCase()
    const { data: allUsers } = await sb.from('profiles').select('id, full_name').eq('role', 'viewer')

    let referrerId: string | null = null
    let referrerName = 'A user'
    if (allUsers) {
      for (const u of allUsers) {
        if (u.id.replace(/-/g, '').substring(0, 8).toLowerCase() === codePrefix) {
          referrerId = u.id
          referrerName = u.full_name || 'A user'
          break
        }
      }
    }

    // Notify the referrer
    if (referrerId) {
      await sb.from('notifications').insert({
        user_id: referrerId,
        title: 'New Referral!',
        message: `${referredName || referredEmail} signed up using your referral link.`,
        type: 'success',
        link: '/dashboard?tab=referrals',
        metadata: { referred_email: referredEmail, referral_code: referralCode },
      })
    }

    // Notify admins
    const { data: admins } = await sb.from('profiles').select('id').eq('role', 'admin')
    if (admins && admins.length > 0) {
      const notifs = admins.map((a: any) => ({
        user_id: a.id,
        title: 'New Referral Registration',
        message: `${referredName || referredEmail} signed up via referral from ${referrerName}. Code: ${referralCode}`,
        type: 'info',
        link: '/admin?tab=leads',
        metadata: { referral_code: referralCode, referred_email: referredEmail, referrer_id: referrerId },
      }))
      await sb.from('notifications').insert(notifs)
    }

    return true
  } catch (err) {
    console.warn('[dashboard] recordReferral exception:', err)
    return false
  }
}

// ── Bank Accounts ──────────────────────────────────────────

export interface BankAccountInput {
  client_id: string
  user_id: string
  account_holder_name: string
  account_number: string
  ifsc_code: string
  bank_name?: string
  account_type: string
  is_primary: boolean
  cancelled_cheque_url?: string
}

export async function fetchBankAccounts(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  return safeFetch(
    () => sb.from('bank_accounts').select('*').eq('client_id', clientId).order('is_primary', { ascending: false }),
    [], 'fetchBankAccounts',
  )
}

export async function addBankAccount(account: BankAccountInput) {
  if (!isSupabaseConfigured()) return null

  // If this is marked as primary, unset other primaries first
  if (account.is_primary) {
    await sb.from('bank_accounts').update({ is_primary: false }).eq('client_id', account.client_id)
  }

  const { data, error } = await sb.from('bank_accounts').insert(account).select().single()
  if (error) { console.error('[dashboard] Add bank account error:', error.message, error.details, error.hint); return null }
  return data
}

export async function deleteBankAccount(accountId: string) {
  if (!isSupabaseConfigured()) return false
  const { error } = await sb.from('bank_accounts').delete().eq('id', accountId)
  return !error
}

// ── IFSC Validation (via public RBI API) ───────────────────

export async function validateIFSC(ifsc: string): Promise<{ valid: boolean; bank?: string; branch?: string }> {
  try {
    const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`)
    if (!res.ok) return { valid: false }
    const data = await res.json()
    return { valid: true, bank: data.BANK, branch: data.BRANCH }
  } catch {
    return { valid: false }
  }
}

// ── Investment Applications ────────────────────────────────

export interface InvestmentApplicationInput {
  client_id: string
  user_id: string
  fund_vehicle: string
  investment_amount: number
  tenure_preference: string
  bank_account_id?: string
  terms_accepted: boolean
  document_urls?: string[]
}

export async function submitInvestmentApplication(app: InvestmentApplicationInput) {
  if (!isSupabaseConfigured()) return null

  // Get the client's assigned RM
  let assignedRM: string | null = null
  try {
    const { data: clientData } = await sb.from('clients').select('assigned_rm').eq('id', app.client_id).single()
    assignedRM = clientData?.assigned_rm || null
  } catch { /* non-blocking */ }

  const row = {
    ...app,
    assigned_rm: assignedRM,
    status: 'pending',
  }

  const { data, error } = await sb.from('investment_applications').insert(row).select().single()
  if (error) { console.error('[dashboard] Submit investment error:', error.message, error.details, error.hint, JSON.stringify(row)); return null }

  // Update client total_invested (pending amount tracked)
  try {
    const { data: client } = await sb.from('clients').select('total_invested').eq('id', app.client_id).single()
    const currentTotal = Number(client?.total_invested) || 0
    await sb.from('clients').update({ total_invested: currentTotal + app.investment_amount }).eq('id', app.client_id)
  } catch { /* non-blocking */ }

  return data
}

export async function fetchInvestmentApplications(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  return safeFetch(
    () => sb.from('investment_applications').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    [], 'fetchInvestmentApplications',
  )
}

// ── Interest Registration ──────────────────────────────────

export async function registerInterest(data: {
  client_id: string
  user_id: string
  fund_title: string
  fund_type?: string
}) {
  if (!isSupabaseConfigured()) return null

  const { data: result, error } = await sb.from('interest_registrations').insert({
    ...data,
    status: 'new',
  }).select().single()

  if (error) { console.warn('[dashboard] Register interest error:', error.message); return null }

  // Notify admins
  try {
    const { data: clientData } = await sb.from('clients').select('full_name, assigned_rm').eq('id', data.client_id).single()
    const clientName = clientData?.full_name || 'A client'
    const { data: admins } = await sb.from('profiles').select('id').in('role', ['admin', 'super_admin'])
    if (admins && admins.length > 0) {
      const notifs = admins.map((a: any) => ({
        user_id: a.id,
        title: `Interest Registered: ${data.fund_title}`,
        message: `${clientName} expressed interest in ${data.fund_title}. Follow up required.`,
        type: 'info',
        link: '/admin?tab=clients',
        metadata: { interest_id: result?.id, client_id: data.client_id, fund_title: data.fund_title },
      }))
      await sb.from('notifications').insert(notifs)
    }

    // Notify assigned RM
    if (clientData?.assigned_rm) {
      const { data: rmProfile } = await sb.from('staff_profiles').select('user_id').eq('id', clientData.assigned_rm).single()
      if (rmProfile?.user_id) {
        await sb.from('notifications').insert({
          user_id: rmProfile.user_id,
          title: `Client Interest: ${data.fund_title}`,
          message: `${clientName} expressed interest in ${data.fund_title}.`,
          type: 'info',
          link: '/staff?tab=clients',
          metadata: { interest_id: result?.id, client_id: data.client_id },
        })
      }
    }
  } catch { /* non-blocking */ }

  return result
}

// ── Reallocation Request ───────────────────────────────────

export async function requestReallocation(data: {
  client_id: string
  user_id: string
  current_allocation: any[]
  notes?: string
}) {
  if (!isSupabaseConfigured()) return null

  // Create a support ticket for reallocation
  const ticketNumber = `REALLOC-${Date.now().toString(36).toUpperCase()}`
  const { data: ticket, error } = await sb.from('tickets').insert({
    ticket_number: ticketNumber,
    client_id: data.user_id,
    client_name: 'Client',
    subject: 'Portfolio Reallocation Request',
    description: `Reallocation request. Current allocation: ${JSON.stringify(data.current_allocation)}. Notes: ${data.notes || 'None'}`,
    category: 'Investment',
    priority: 'medium',
    status: 'open',
    metadata: { type: 'reallocation', allocation: data.current_allocation },
  }).select().single()

  if (error) { console.warn('[dashboard] Reallocation request error:', error.message); return null }
  return ticket
}

// ── Upload Document to Client Folder ──────────────────────

export async function uploadClientDocument(doc: {
  client_id: string
  user_id: string
  title: string
  category: string
  file_url: string
  file_name: string
  file_size?: number
  file_type?: string
  mime_type?: string
}) {
  if (!isSupabaseConfigured()) return null

  // KYC and compliance docs get 'submitted' status so admin can review them
  const isKYC = doc.category === 'kyc' || doc.category === 'compliance'

  const { data, error } = await sb.from('documents').insert({
    title: doc.title,
    file_url: doc.file_url,
    file_name: doc.file_name,
    file_size: doc.file_size || 0,
    file_type: doc.file_type || '',
    mime_type: doc.mime_type || '',
    category: doc.category,
    entity_type: 'client',
    entity_id: doc.client_id,
    client_id: doc.client_id,
    uploaded_by: doc.user_id,
    access_level: 'restricted',
    status: isKYC ? 'submitted' : 'active',
  }).select().single()

  if (error) { console.warn('[dashboard] Upload client doc error:', error.message); return null }
  return data
}
