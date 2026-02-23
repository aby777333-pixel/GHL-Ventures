/* ─────────────────────────────────────────────────────────────
   Admin Auth Service — Supabase auth with mock fallback

   Re-uses AdminSession / AdminUser types from adminTypes.ts
   so the mock and live auth return the same shape.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'
import type { AdminSession } from '../admin/adminTypes'

// ── Fallback to mock auth when Supabase not configured ──────
import {
  authenticateAdmin as mockAuth,
  getAdminSession as mockGetSession,
  logoutAdmin as mockLogout,
  logAuditEvent as mockAudit,
} from '../admin/adminAuth'

// Re-export types for convenience
export type { AdminSession } from '../admin/adminTypes'
export type { AdminUser, AdminRole } from '../admin/adminTypes'

// ── Auth Functions ──────────────────────────────────────────

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<AdminSession | null> {
  if (!isSupabaseConfigured()) {
    return mockAuth(email, password)
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) return null

  // Fetch admin profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  const { data: adminProfileData } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  const profile = profileData as any
  const adminProfile = adminProfileData as any

  if (!profile || !adminProfile) {
    await supabase.auth.signOut()
    return null
  }

  const session: AdminSession = {
    user: {
      name: profile.name,
      email: profile.email,
      role: adminProfile.role,
      department: adminProfile.department || undefined,
      avatar: profile.avatar_url || undefined,
    },
    loginAt: Date.now(),
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  }

  await logAuditEvent(session.user.name, 'login', 'auth', `Admin login: ${email}`)
  return session
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!isSupabaseConfigured()) {
    return mockGetSession()
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const { data: adminProfileData } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const profile = profileData as any
  const adminProfile = adminProfileData as any

  if (!profile || !adminProfile) return null

  return {
    user: {
      name: profile.name,
      email: profile.email,
      role: adminProfile.role,
      department: adminProfile.department || undefined,
      avatar: profile.avatar_url || undefined,
    },
    loginAt: Date.now(),
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  }
}

export async function logoutAdmin(): Promise<void> {
  if (!isSupabaseConfigured()) {
    mockLogout()
    return
  }

  const session = await getAdminSession()
  if (session) {
    await logAuditEvent(session.user.name, 'logout', 'auth', 'Admin logout')
  }
  await supabase.auth.signOut()
}

export async function logAuditEvent(
  userName: string,
  action: string,
  module: string,
  details?: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    mockAudit(userName, action, module, details || '')
    return
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    await (supabase.from('audit_log') as any).insert({
      user_id: session?.user?.id || undefined,
      user_name: userName,
      action,
      module,
      details: details || null,
    })
  } catch {
    console.warn('[audit] Failed to log event:', action)
  }
}
