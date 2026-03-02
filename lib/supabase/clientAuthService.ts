/* ─────────────────────────────────────────────────────────────
   Client Auth Service — Supabase authentication (production)

   Client portal authentication via Supabase Auth.
   Supports email/password, OAuth (Google), and OTP login.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'

// Lazy import to avoid circular dependencies
async function tryAutoAssignRM(userId: string) {
  try {
    const { autoAssignRMToClient } = await import('./employeeService')
    await autoAssignRMToClient(userId)
  } catch {
    // Non-blocking — RM assignment is best-effort
    console.warn('[clientAuth] RM auto-assignment skipped')
  }
}

// ── Types ───────────────────────────────────────────────────
export interface ClientUser {
  id: string
  name: string
  email: string
  phone?: string | null
  avatar_url?: string | null
  kyc_status: string
  account_status: string
  risk_profile?: string | null
  aum: number
  city?: string | null
  created_at?: string | null
  pan?: string | null
  dob?: string | null
  occupation?: string | null
  nominee_name?: string | null
  nominee_relation?: string | null
  nominee_pan?: string | null
  nominee_share?: string | null
  bank_name?: string | null
  bank_account?: string | null
  bank_ifsc?: string | null
  bank_type?: string | null
}

export interface ClientSession {
  user: ClientUser
  loginAt: number
  expiresAt: number
}

// Login result with proper error differentiation
export interface LoginResult {
  session: ClientSession | null
  error?: 'invalid_credentials' | 'email_not_confirmed' | 'service_unavailable' | 'network_error'
  message?: string
}

// ── Helper: build ClientUser from Supabase auth + optional profile/client rows ──
function buildClientUser(
  authUser: { id: string; email?: string; created_at?: string; user_metadata?: any },
  profile: any | null,
  client: any | null
): ClientUser {
  const meta = authUser.user_metadata ?? {}
  const safeName = String(profile?.full_name || meta.full_name || meta.name || authUser.email?.split('@')[0] || 'Investor')

  return {
    id: String(authUser.id),
    name: safeName,
    email: String(authUser.email || ''),
    phone: profile?.phone || client?.phone || meta.phone || null,
    avatar_url: profile?.avatar_url || meta.avatar_url || meta.picture || null,
    kyc_status: String(client?.kyc_status || 'pending'),
    account_status: client ? 'active' : 'pending',
    risk_profile: client?.risk_profile ? String(client.risk_profile) : null,
    aum: Number(client?.total_invested) || 0,
    city: profile?.city || client?.city || null,
    created_at: authUser.created_at || null,
    pan: client?.pan || null,
    dob: client?.dob || profile?.dob || null,
    occupation: client?.occupation || null,
    nominee_name: client?.nominee_name || null,
    nominee_relation: client?.nominee_relation || null,
    nominee_pan: client?.nominee_pan || null,
    nominee_share: client?.nominee_share || null,
    bank_name: client?.bank_name || null,
    bank_account: client?.bank_account || null,
    bank_ifsc: client?.bank_ifsc || null,
    bank_type: client?.bank_type || null,
  }
}

// ── Helper: safely fetch profile & client rows (uses .maybeSingle() to avoid throw on missing) ──
async function fetchProfileAndClient(userId: string): Promise<{ profile: any | null; client: any | null }> {
  // .maybeSingle() returns null (no error) when row doesn't exist — avoids .single() throwing
  const [profileRes, clientRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('clients').select('*').eq('user_id', userId).maybeSingle(),
  ])
  return {
    profile: profileRes.data ?? null,
    client: clientRes.data ?? null,
  }
}

// ── Auth Functions ──────────────────────────────────────────

export async function loginClient(email: string, password: string): Promise<LoginResult> {
  if (!isSupabaseConfigured()) {
    console.warn('[clientAuth] Supabase not configured — cannot authenticate')
    return { session: null, error: 'service_unavailable', message: 'Authentication service unavailable. Please try again later.' }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    // Differentiate auth errors properly
    if (error) {
      const msg = error.message?.toLowerCase() || ''
      if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
        return { session: null, error: 'email_not_confirmed', message: 'Please verify your email address. Check your inbox for the confirmation link.' }
      }
      return { session: null, error: 'invalid_credentials', message: 'Incorrect email or password. Please try again.' }
    }
    if (!data.user) {
      return { session: null, error: 'invalid_credentials', message: 'Incorrect email or password. Please try again.' }
    }

    // Auth succeeded — now fetch profile/client rows (won't throw on missing)
    const { profile, client } = await fetchProfileAndClient(data.user.id)

    // If profile/client rows are missing, create them on the fly (auto-repair)
    if (!profile) {
      try {
        const meta = data.user.user_metadata ?? {}
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: meta.full_name || meta.name || data.user.email?.split('@')[0] || 'Investor',
          phone: meta.phone || null,
          role: 'client',
        } as any)
      } catch { /* non-blocking auto-repair */ }
    }
    if (!client) {
      try {
        await supabase.from('clients').insert({
          user_id: data.user.id,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Investor',
          email: data.user.email || '',
          phone: data.user.user_metadata?.phone || null,
        } as any)
        // Auto-assign RM for newly created client record
        tryAutoAssignRM(data.user.id)
      } catch { /* non-blocking auto-repair */ }
    }

    return {
      session: {
        user: buildClientUser(data.user, profile, client),
        loginAt: Date.now(),
        expiresAt: Date.now() + 8 * 60 * 60 * 1000,
      },
    }
  } catch (err) {
    console.warn('[clientAuth] loginClient exception:', err)
    return { session: null, error: 'network_error', message: 'Connection error. Please check your internet and try again.' }
  }
}

export async function signupClient(
  name: string,
  email: string,
  password: string,
  phone?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Service unavailable. Please try again later.' }
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { success: false, error: error.message }
    if (!data.user) return { success: false, error: 'Signup failed' }

    // Create profile (full_name — no email/portal column in profiles table)
    await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: name,
      phone: phone || null,
      role: 'client',
    } as any)

    // Create client record linked via user_id
    await supabase.from('clients').insert({
      user_id: data.user.id,
      full_name: name,
      email,
      phone: phone || null,
    } as any)

    // Auto-assign an RM to the new client (non-blocking)
    tryAutoAssignRM(data.user.id)

    return { success: true }
  } catch (err) {
    console.warn('[clientAuth] signupClient exception:', err)
    return { success: false, error: 'Connection error. Please try again.' }
  }
}

export async function getClientSession(): Promise<ClientSession | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    // Use .maybeSingle() to avoid throwing on missing rows
    const { profile, client } = await fetchProfileAndClient(session.user.id)

    // Auto-repair: create missing profile/client rows for authenticated users
    if (!profile) {
      try {
        const meta = session.user.user_metadata ?? {}
        await supabase.from('profiles').insert({
          id: session.user.id,
          full_name: meta.full_name || meta.name || session.user.email?.split('@')[0] || 'Investor',
          phone: meta.phone || null,
          role: 'client',
        } as any)
      } catch { /* non-blocking auto-repair */ }
    }
    if (!client) {
      try {
        const meta = session.user.user_metadata ?? {}
        await supabase.from('clients').insert({
          user_id: session.user.id,
          full_name: meta.full_name || meta.name || session.user.email?.split('@')[0] || 'Investor',
          email: session.user.email || '',
          phone: meta.phone || null,
        } as any)
      } catch { /* non-blocking auto-repair */ }
    }

    return {
      user: buildClientUser(session.user, profile, client),
      loginAt: Date.now(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    }
  } catch (err) {
    console.warn('[clientAuth] getClientSession exception:', err)
    return null
  }
}

export async function logoutClient(): Promise<void> {
  if (!isSupabaseConfigured()) return
  try {
    await supabase.auth.signOut()
  } catch (err) {
    console.warn('[clientAuth] logoutClient exception:', err)
  }
}

export async function loginWithOAuth(provider: 'google'): Promise<void> {
  if (!isSupabaseConfigured()) return
  try {
    const callbackUrl =
      typeof window !== 'undefined'
        ? new URL('/auth/callback', window.location.origin).toString()
        : ''
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl },
    })
  } catch (err) {
    console.warn('[clientAuth] loginWithOAuth exception:', err)
  }
}

export async function loginWithOTP(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Service unavailable. Please try again later.' }
  }
  try {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    console.warn('[clientAuth] loginWithOTP exception:', err)
    return { success: false, error: 'Connection error. Please try again.' }
  }
}
