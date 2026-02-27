/* ─────────────────────────────────────────────────────────────
   Admin Auth Service — Supabase authentication (production)

   Uses the new schema: profiles table has role field directly.
   No separate admin_profiles table needed.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'
import type { AdminSession } from '../admin/adminTypes'

// Re-export types for convenience
export type { AdminSession } from '../admin/adminTypes'
export type { AdminUser, AdminRole } from '../admin/adminTypes'

// ── Map DB role to admin role ──────────────────────────────
function mapDbRoleToAdminRole(dbRole: string): string {
  const roleMap: Record<string, string> = {
    super_admin: 'super-admin',
    admin: 'admin',
    compliance_officer: 'compliance-officer',
    fund_manager: 'fund-manager',
    manager: 'manager',
    marketing_manager: 'marketing-manager',
    marketing_executive: 'marketing-executive',
    sales: 'sales',
    operations: 'operations',
    hr: 'hr',
    viewer: 'viewer',
  }
  return roleMap[dbRole] || 'viewer'
}

// ── Admin role whitelist (roles allowed in admin portal) ────
const ADMIN_ROLES = ['super_admin', 'admin', 'compliance_officer', 'fund_manager', 'manager', 'marketing_manager', 'marketing_executive', 'sales', 'operations', 'hr']

// ── Auth Functions ──────────────────────────────────────────

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<AdminSession | null> {
  if (!isSupabaseConfigured()) {
    console.warn('[adminAuth] Supabase not configured — cannot authenticate')
    return null
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      console.warn('[adminAuth] Authentication failed:', error?.message)
      return null
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
    if (!ADMIN_ROLES.includes(p.role)) {
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
    console.error('[adminAuth] Authentication error:', err)
    return null
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!isSupabaseConfigured()) return null

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

    if (!ADMIN_ROLES.includes(p.role)) return null

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
    return null
  }
}

export async function logoutAdmin(): Promise<void> {
  if (!isSupabaseConfigured()) return

  try {
    const session = await getAdminSession()
    if (session) {
      await logAuditEvent(session.user.name, 'logout', 'auth', 'Admin logout')
    }
    await supabase.auth.signOut()
  } catch {
    // Best-effort signout
    try { await supabase.auth.signOut() } catch { /* ignore */ }
  }
}

export async function logAuditEvent(
  userName: string,
  action: string,
  module: string,
  details?: string
): Promise<void> {
  if (!isSupabaseConfigured()) return

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
