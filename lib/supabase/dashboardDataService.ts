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
  const { data, error } = await sb.from('tickets').insert(ticket).select().single()
  if (error) { console.warn('[dashboard] Create ticket error:', error.message); return null }
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
