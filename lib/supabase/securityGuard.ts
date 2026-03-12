/* ─────────────────────────────────────────────────────────────
   Security Guard — Application-level RBAC enforcement

   Sources role from Supabase profile (when configured) or
   localStorage session (mock fallback). Provides guards for
   mutations in data service layers.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'
import { hasPermission, hasModuleAccess, canPerformAction, isRoleHigherOrEqual } from '../admin/adminRBAC'
import { hasStaffModuleAccess, hasStaffPermission } from '../staff/staffRBAC'
import type { AdminRole, Permission, PermissionAction, PermissionModule } from '../admin/adminTypes'
import type { StaffRole, StaffModule, StaffPermission } from '../staff/staffTypes'

// ── Portal Type ─────────────────────────────────────────────
export type Portal = 'admin' | 'staff' | 'client'

// ── User Context ────────────────────────────────────────────
export interface UserContext {
  id: string
  portal: Portal
  role: string
  name: string
  email: string
}

// ── Get User Context from Supabase ──────────────────────────
export async function getUserContext(): Promise<UserContext | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    const p = profile as any
    if (!p) return null

    // Determine portal + role from profiles.role field:
    // super_admin, admin → admin portal
    // staff → staff portal (resolve designation from staff_profiles)
    // client, viewer → client portal
    const profileRole = p.role || 'client'
    let portal: Portal = 'client'
    let role = profileRole

    if (['super_admin', 'admin', 'compliance_officer', 'fund_manager', 'manager',
         'marketing_manager', 'marketing_executive', 'sales', 'operations', 'hr'].includes(profileRole)) {
      portal = 'admin'
      // Map DB role to admin role format (underscores to hyphens)
      role = profileRole.replace(/_/g, '-')
    } else {
      // Check if this user has a staff_profiles row
      const { data: staffProfile } = await supabase
        .from('staff_profiles')
        .select('designation, is_active')
        .eq('user_id', session.user.id)
        .single()

      if (staffProfile) {
        portal = 'staff'
        role = (staffProfile as any)?.designation || 'general-employee'
      } else {
        portal = 'client'
        role = 'client'
      }
    }

    return {
      id: session.user.id,
      portal,
      role,
      name: p.full_name || '',
      email: session.user.email || '',
    }
  } catch {
    return getUserContextFromLocalStorage()
  }
}

// ── Fallback: Read from localStorage sessions ───────────────
function getUserContextFromLocalStorage(): UserContext | null {
  if (typeof window === 'undefined') return null

  // Try admin session
  try {
    const adminRaw = localStorage.getItem('ghl-admin-session')
    if (adminRaw) {
      const session = JSON.parse(adminRaw)
      if (session.expiresAt > Date.now()) {
        return {
          id: session.user.email,
          portal: 'admin',
          role: session.user.role,
          name: session.user.name,
          email: session.user.email,
        }
      }
    }
  } catch { /* ignore */ }

  // Try staff session
  try {
    const staffRaw = localStorage.getItem('ghl-staff-session')
    if (staffRaw) {
      const session = JSON.parse(staffRaw)
      return {
        id: session.user?.email || 'staff',
        portal: 'staff',
        role: session.user?.role || 'general-employee',
        name: session.user?.name || 'Staff',
        email: session.user?.email || '',
      }
    }
  } catch { /* ignore */ }

  // Try client session
  try {
    const clientRaw = localStorage.getItem('ghl-client-session')
    if (clientRaw) {
      const session = JSON.parse(clientRaw)
      return {
        id: session.user?.id || session.user?.email || 'client',
        portal: 'client',
        role: 'client',
        name: session.user?.name || 'Client',
        email: session.user?.email || '',
      }
    }
  } catch { /* ignore */ }

  return null
}

// ── Admin Permission Guards ─────────────────────────────────

/** Check if current admin user has a specific permission */
export async function requireAdminPermission(permission: Permission): Promise<boolean> {
  const ctx = await getUserContext()
  if (!ctx || ctx.portal !== 'admin') return false
  return hasPermission(ctx.role as AdminRole, permission)
}

/** Check if current admin user has module access */
export async function requireAdminModuleAccess(module: PermissionModule): Promise<boolean> {
  const ctx = await getUserContext()
  if (!ctx || ctx.portal !== 'admin') return false
  return hasModuleAccess(ctx.role as AdminRole, module)
}

/** Check if admin can perform action on module */
export async function requireAdminAction(
  action: PermissionAction,
  module: PermissionModule
): Promise<boolean> {
  const ctx = await getUserContext()
  if (!ctx || ctx.portal !== 'admin') return false
  return canPerformAction(ctx.role as AdminRole, action, module)
}

// ── Staff Permission Guards ─────────────────────────────────

/** Check if current staff user has module access */
export async function requireStaffModuleAccess(module: StaffModule): Promise<boolean> {
  const ctx = await getUserContext()
  if (!ctx || ctx.portal !== 'staff') return false
  return hasStaffModuleAccess(ctx.role as StaffRole, module)
}

/** Check if current staff user has specific permission on module */
export async function requireStaffPermission(
  module: StaffModule,
  permission: StaffPermission
): Promise<boolean> {
  const ctx = await getUserContext()
  if (!ctx || ctx.portal !== 'staff') return false
  return hasStaffPermission(ctx.role as StaffRole, module, permission)
}

// ── Client Guards ───────────────────────────────────────────

/** Check if user is authenticated as a client */
export async function requireClient(): Promise<UserContext | null> {
  const ctx = await getUserContext()
  if (!ctx || ctx.portal !== 'client') return null
  return ctx
}

/** Check if client can access their own resource */
export async function requireOwnResource(resourceOwnerId: string): Promise<boolean> {
  const ctx = await getUserContext()
  if (!ctx) return false
  return ctx.id === resourceOwnerId
}

// ── Generic Guards ──────────────────────────────────────────

/** Guard a mutation — returns { allowed, context, error } */
export async function guardMutation(opts: {
  portal: Portal
  action?: string
  module?: string
}): Promise<{ allowed: boolean; context: UserContext | null; error?: string }> {
  const ctx = await getUserContext()
  if (!ctx) {
    return { allowed: false, context: null, error: 'Not authenticated' }
  }

  if (ctx.portal !== opts.portal && ctx.portal !== 'admin') {
    return { allowed: false, context: ctx, error: `Access denied: requires ${opts.portal} portal` }
  }

  // Admin can always access if they have the permission
  if (ctx.portal === 'admin' && opts.action && opts.module) {
    const allowed = canPerformAction(
      ctx.role as AdminRole,
      opts.action as PermissionAction,
      opts.module as PermissionModule
    )
    if (!allowed) {
      return { allowed: false, context: ctx, error: `Permission denied: ${opts.action}:${opts.module}` }
    }
  }

  return { allowed: true, context: ctx }
}

/** Check if current user has at least the specified admin role level */
export async function requireMinimumRole(targetRole: AdminRole): Promise<boolean> {
  const ctx = await getUserContext()
  if (!ctx || ctx.portal !== 'admin') return false
  return isRoleHigherOrEqual(ctx.role as AdminRole, targetRole)
}
