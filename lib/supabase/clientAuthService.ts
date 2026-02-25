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

  if (!profile && !client) {
    await supabase.auth.signOut()
    return null
  }

  return {
    user: {
      id: data.user.id,
      name: profile?.full_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '',
      email: data.user.email || '',
      phone: profile?.phone || client?.phone || null,
      avatar_url: profile?.avatar_url || null,
      kyc_status: client?.kyc_status || 'pending',
      account_status: client ? 'active' : 'pending',
      risk_profile: client?.risk_profile || null,
      aum: client?.total_invested || 0,
      city: profile?.city || client?.city || null,
    },
    loginAt: Date.now(),
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
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

  if (!profile && !client) return null

  return {
    user: {
      id: session.user.id,
      name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
      email: session.user.email || '',
      phone: profile?.phone || client?.phone || null,
      avatar_url: profile?.avatar_url || null,
      kyc_status: client?.kyc_status || 'pending',
      account_status: client ? 'active' : 'pending',
      risk_profile: client?.risk_profile || null,
      aum: client?.total_invested || 0,
      city: profile?.city || client?.city || null,
    },
    loginAt: Date.now(),
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  }
}

export async function logoutClient(): Promise<void> {
  if (!isSupabaseConfigured()) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ghl-client-session')
    }
    return
  }
  await supabase.auth.signOut()
}

export async function loginWithOAuth(provider: 'google'): Promise<void> {
  if (!isSupabaseConfigured()) return
  await supabase.auth.signInWithOAuth({ provider })
}

export async function loginWithOTP(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true }
  }
  const { error } = await supabase.auth.signInWithOtp({ email })
  if (error) return { success: false, error: error.message }
  return { success: true }
}
