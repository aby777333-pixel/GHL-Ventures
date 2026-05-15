/* ─────────────────────────────────────────────────────────────
   Admin Auth Service — Supabase authentication (production)

   Uses the new schema: profiles table has role field directly.
   No separate admin_profiles table needed.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'
import type { AdminSession } from '../admin/adminTypes'
import { primeForcePasswordResetIfNeeded } from '../auth/forceReset'

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

    // If a temp password is in force, prime the dashboard signal.
    primeForcePasswordResetIfNeeded(data.user)

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
    // Tests 28-04-2026 #1: previous code force-expired admin sessions after
    // a fixed 8h window even when the underlying Supabase session was still
    // valid, kicking active admins to /login mid-shift. Trust Supabase auth
    // as the source of truth and rely on the inactivity tracker for idle
    // timeouts. We still read the stored timestamps for telemetry/UI but
    // never use them as the sole reason to sign the user out.
    const storedRaw = typeof window !== 'undefined'
      ? (sessionStorage.getItem('ghl_admin_session') || localStorage.getItem('ghl-admin-session'))
      : null

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    // Re-prime force-password-reset flag after a refresh
    primeForcePasswordResetIfNeeded(session.user)

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!profile) return null

    const p = profile as any

    if (!ADMIN_ROLES.includes(p.role)) return null

    // Reuse stored timestamps if available, else create fresh ones
    let loginAt: number
    let expiresAt: number
    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw)
        loginAt = parsed.loginAt || Date.now()
        expiresAt = parsed.expiresAt || Date.now() + 8 * 60 * 60 * 1000
      } catch {
        loginAt = Date.now()
        expiresAt = Date.now() + 8 * 60 * 60 * 1000
      }
    } else {
      loginAt = Date.now()
      expiresAt = Date.now() + 8 * 60 * 60 * 1000
    }

    // 2026-05-15: thread the per-user permission overrides so AdminClient
    // can union them with the role grants when deciding module access.
    const rawOverrides = (p as any).permission_overrides
    const permissionOverrides: string[] = Array.isArray(rawOverrides)
      ? rawOverrides.filter((x: unknown) => typeof x === 'string')
      : []

    return {
      user: {
        name: p.full_name || session.user.email || '',
        email: session.user.email || '',
        role: mapDbRoleToAdminRole(p.role) as any,
        department: p.department || undefined,
        phone: p.phone || undefined,
        permissionOverrides,
      },
      loginAt,
      expiresAt,
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
  } finally {
    // Clear localStorage session to prevent stale data / impersonation
    try { localStorage.removeItem('ghl-admin-session') } catch { /* ignore */ }
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
