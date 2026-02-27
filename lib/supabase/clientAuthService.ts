/* ─────────────────────────────────────────────────────────────
   Client Auth Service — Supabase auth with mock fallback

   Client portal uses its own session type since there's no
   pre-existing mock auth module (unlike admin/staff).
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'

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
}

export interface ClientSession {
  user: ClientUser
  loginAt: number
  expiresAt: number
}

// ── Auth Functions ──────────────────────────────────────────

export async function loginClient(email: string, password: string): Promise<ClientSession | null> {
  if (!isSupabaseConfigured()) {
    const mockSession: ClientSession = {
      user: {
        id: 'demo-client-001',
        name: 'Rajesh Krishnan',
        email,
        kyc_status: 'approved',
        account_status: 'active',
        aum: 8542000,
        city: 'Chennai',
      },
      loginAt: Date.now(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('ghl-client-session', JSON.stringify(mockSession))
    }
    return mockSession
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) return null

    // profiles table has: full_name, avatar_url, phone, city (no email/portal column)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // clients table stores KYC, AUM, risk_profile — linked via user_id
    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', data.user.id)
      .single()

    const profile = profileData as any
    const client = clientData as any

    // Don't reject OAuth users who haven't had their profile created yet
    // (the auth callback page creates it, but in case of race conditions)
    const meta = data.user.user_metadata ?? {}

    const safeName = String(profile?.full_name || meta.full_name || meta.name || data.user.email?.split('@')[0] || 'Investor')

    return {
      user: {
        id: String(data.user.id),
        name: safeName,
        email: String(data.user.email || ''),
        phone: profile?.phone || client?.phone || meta.phone || null,
        avatar_url: profile?.avatar_url || meta.avatar_url || meta.picture || null,
        kyc_status: String(client?.kyc_status || 'pending'),
        account_status: client ? 'active' : 'pending',
        risk_profile: client?.risk_profile ? String(client.risk_profile) : null,
        aum: Number(client?.total_invested) || 0,
        city: profile?.city || client?.city || null,
      },
      loginAt: Date.now(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    }
  } catch (err) {
    console.warn('[clientAuth] loginClient exception:', err)
    return null
  }
}

export async function signupClient(
  name: string,
  email: string,
  password: string,
  phone?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true }
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

    return { success: true }
  } catch (err) {
    console.warn('[clientAuth] signupClient exception:', err)
    return { success: false, error: 'Connection error. Please try again.' }
  }
}

export async function getClientSession(): Promise<ClientSession | null> {
  if (!isSupabaseConfigured()) {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('ghl-client-session')
    if (!stored) return null
    try {
      const session = JSON.parse(stored) as ClientSession
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem('ghl-client-session')
        return null
      }
      return session
    } catch {
      return null
    }
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    const profile = profileData as any
    const client = clientData as any

    // Don't reject OAuth users who haven't had their profile created yet
    const meta = session.user.user_metadata ?? {}

    // Safety: coerce all values to primitives (prevents React #310 if a field is an object)
    const safeName = String(profile?.full_name || meta.full_name || meta.name || session.user.email?.split('@')[0] || 'Investor')

    return {
      user: {
        id: String(session.user.id),
        name: safeName,
        email: String(session.user.email || ''),
        phone: profile?.phone || client?.phone || meta.phone || null,
        avatar_url: profile?.avatar_url || meta.avatar_url || meta.picture || null,
        kyc_status: String(client?.kyc_status || 'pending'),
        account_status: client ? 'active' : 'pending',
        risk_profile: client?.risk_profile ? String(client.risk_profile) : null,
        aum: Number(client?.total_invested) || 0,
        city: profile?.city || client?.city || null,
      },
      loginAt: Date.now(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    }
  } catch (err) {
    console.warn('[clientAuth] getClientSession exception:', err)
    return null
  }
}

export async function logoutClient(): Promise<void> {
  if (!isSupabaseConfigured()) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ghl-client-session')
    }
    return
  }
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
    return { success: true }
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
