/* ─────────────────────────────────────────────────────────────
   Admin Auth Service — Supabase auth with mock fallback

   Uses the new schema: profiles table has role field directly.
   No separate admin_profiles table needed.
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

// ── Map DB role to admin role ──────────────────────────────
function mapDbRoleToAdminRole(dbRole: string): string {
  const roleMap: Record<string, string> = {
    super_admin: 'super-admin',
    admin: 'admin',
    staff: 'viewer',
    client: 'viewer',
    viewer: 'viewer',
  }
  return roleMap[dbRole] || 'viewer'
}

// ── Auth Functions ──────────────────────────────────────────

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<AdminSession | null> {
  if (!isSupabaseConfigured()) {
    return mockAuth(email, password)
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      // User doesn't exist in Supabase yet — fall back to mock/demo auth
      console.info('[adminAuth] Supabase auth failed, falling back to demo credentials')
      return mockAuth(email, password)
    }

    // Fetch profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      await supabase.auth.signOut()
      return null
    }

    const p = profile as any

    // Only allow admin-level roles
    if (!['super_admin', 'admin'].includes(p.role)) {
      await supabase.auth.signOut()
      return null
    }

    const session: AdminSession = {
      user: {
        name: p.full_name || data.user.email || '',
        email: p.id ? data.user.email || '' : '',
        role: mapDbRoleToAdminRole(p.role) as any,
        department: p.department || undefined,
        phone: p.phone || undefined,
      },
      loginAt: Date.now(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    }

    await logAuditEvent(session.user.name, 'login', 'auth', `Admin login: ${email}`)
    return session
  } catch (err) {
    console.warn('[adminAuth] Supabase auth error, falling back to mock:', err)
    return mockAuth(email, password)
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!isSupabaseConfigured()) {
    return mockGetSession()
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!profile) return null

    const p = profile as any

    if (!['super_admin', 'admin'].includes(p.role)) return null

    return {
      user: {
        name: p.full_name || session.user.email || '',
        email: session.user.email || '',
        role: mapDbRoleToAdminRole(p.role) as any,
        department: p.department || undefined,
        phone: p.phone || undefined,
      },
      loginAt: Date.now(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    }
  } catch {
    return mockGetSession()
  }
}

export async function logoutAdmin(): Promise<void> {
  if (!isSupabaseConfigured()) {
    mockLogout()
    return
  }

  try {
    const session = await getAdminSession()
    if (session) {
      await logAuditEvent(session.user.name, 'logout', 'auth', 'Admin logout')
    }
    await supabase.auth.signOut()
  } catch {
    mockLogout()
  }
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
    await (supabase.from('audit_logs') as any).insert({
      user_id: session?.user?.id || null,
      action: `${action}:${module}`,
      entity_type: module,
      new_data: { user_name: userName, details: details || null },
    })
  } catch {
    console.warn('[audit] Failed to log event:', action)
  }
}
