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
  return safeFetch(
    () => sb.from('nav_history').select('*').eq('client_id', clientId).order('month', { ascending: true }),
    [], 'fetchNAVHistory',
  )
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
  return safeFetch(
    () => sb.from('transactions').select('*').eq('client_id', clientId).order('date', { ascending: false }),
    [], 'fetchTransactions',
  )
}

export async function fetchMessages(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  return safeFetch(
    () => sb.from('messages').select('*').eq('to_id', clientId).order('created_at', { ascending: false }),
    [], 'fetchMessages',
  )
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
  return safeFetch(
    () => sb.from('notifications').select('*').eq('user_id', clientId).order('created_at', { ascending: false }).limit(20),
    [], 'fetchNotifications',
  )
}

export async function getKYCSteps(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  try {
    const { data } = await sb.from('kyc_documents').select('type, status').eq('client_id', clientId)
    if (!data || data.length === 0) return []
    return (data as any[]).map((d: any) => ({
      id: d.type,
      label: d.type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      status: d.status,
    }))
  } catch { return [] }
}

export async function fetchDocuments(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return []
  return safeFetch(
    () => sb.from('documents').select('*').eq('client_id', clientId).order('uploaded_at', { ascending: false }),
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

  // Resolve client_name from profiles if not provided
  let clientName = ticket.client_name || 'Client'
  if (!ticket.client_name && ticket.client_id) {
    try {
      const { data: profile } = await sb.from('profiles').select('full_name').eq('id', ticket.client_id).single()
      if (profile?.full_name) clientName = profile.full_name
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
        body: `${clientName} raised a ${ticket.category || 'General'} ticket. Priority: ${ticket.priority || 'medium'}`,
        type: 'support',
        priority: ticket.priority || 'medium',
        action_url: '/admin?tab=support',
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
  const { error } = await sb.from('notifications').update({ read: true }).eq('id', notificationId)
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
  if (fields.full_name) profileUpdate.full_name = fields.full_name
  if (fields.phone) profileUpdate.phone = fields.phone
  if (fields.city) profileUpdate.city = fields.city

  if (Object.keys(profileUpdate).length > 0) {
    await sb.from('profiles').update(profileUpdate).eq('id', user.id)
  }

  // Update clients table (nominee, dob, occupation stored here)
  const clientUpdate: Record<string, any> = {}
  if (fields.dob) clientUpdate.dob = fields.dob
  if (fields.occupation) clientUpdate.occupation = fields.occupation
  if (fields.nominee_name) clientUpdate.nominee_name = fields.nominee_name
  if (fields.nominee_relation) clientUpdate.nominee_relation = fields.nominee_relation
  if (fields.nominee_pan) clientUpdate.nominee_pan = fields.nominee_pan
  if (fields.nominee_share) clientUpdate.nominee_share = fields.nominee_share

  if (Object.keys(clientUpdate).length > 0) {
    await sb.from('clients').update(clientUpdate).eq('user_id', user.id)
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
        body: `${referredName || referredEmail} signed up using your referral link.`,
        type: 'referral',
        priority: 'low',
        action_url: '/dashboard?tab=referrals',
        metadata: { referred_email: referredEmail, referral_code: referralCode },
      })
    }

    // Notify admins
    const { data: admins } = await sb.from('profiles').select('id').eq('role', 'admin')
    if (admins && admins.length > 0) {
      const notifs = admins.map((a: any) => ({
        user_id: a.id,
        title: 'New Referral Registration',
        body: `${referredName || referredEmail} signed up via referral from ${referrerName}. Code: ${referralCode}`,
        type: 'referral',
        priority: 'low',
        action_url: '/admin?tab=leads',
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
