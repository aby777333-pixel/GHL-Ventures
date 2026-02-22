/* ================================================================
   ADMIN COMMAND CENTER — ROLE-BASED ACCESS CONTROL
   ================================================================ */

import type { AdminRole, Permission, PermissionAction, PermissionModule } from './adminTypes'

// ── Role Hierarchy (lower = more powerful) ────────────────────────
export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  'super-admin': 0,
  'admin': 1,
  'compliance-officer': 2,
  'fund-manager': 3,
  'manager': 4,
  'marketing-manager': 4,
  'sales': 5,
  'marketing-executive': 6,
  'operations': 6,
  'hr': 7,
  'viewer': 8,
}

// ── Permission Matrix ─────────────────────────────────────────────
// Each role lists its allowed permissions
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  'super-admin': ['*'],

  'admin': [
    'view:overview', 'view:clients', 'create:clients', 'edit:clients', 'approve:clients', 'export:clients',
    'view:sales', 'create:sales', 'edit:sales', 'export:sales',
    'view:realty-brokers', 'create:realty-brokers', 'edit:realty-brokers', 'export:realty-brokers',
    'view:employees', 'create:employees', 'edit:employees', 'export:employees',
    'view:assets', 'create:assets', 'edit:assets', 'delete:assets', 'export:assets',
    'view:ai-ops', 'create:ai-ops',
    'view:compliance', 'edit:compliance', 'approve:compliance', 'export:compliance',
    'view:financial', 'edit:financial', 'approve:financial', 'export:financial',
    'view:analytics', 'export:analytics',
    'view:comms', 'create:comms',
    'view:marketing', 'create:marketing', 'edit:marketing', 'approve:marketing', 'export:marketing',
    'view:settings',
  ],

  'compliance-officer': [
    'view:overview',
    'view:clients', 'approve:clients', 'export:clients',
    'view:compliance', 'edit:compliance', 'approve:compliance', 'export:compliance',
    'view:financial',
    'view:analytics', 'export:analytics',
    'view:ai-ops',
    'view:realty-brokers',
    'view:marketing',
  ],

  'fund-manager': [
    'view:overview',
    'view:clients', 'edit:clients', 'export:clients',
    'view:sales',
    'view:assets',
    'view:ai-ops', 'create:ai-ops',
    'view:compliance',
    'view:financial', 'export:financial',
    'view:analytics', 'export:analytics',
    'view:realty-brokers',
  ],

  'manager': [
    'view:overview',
    'view:clients', 'export:clients',
    'view:sales', 'edit:sales', 'export:sales',
    'view:employees', 'edit:employees', 'export:employees',
    'view:analytics', 'export:analytics',
    'view:comms', 'create:comms',
    'view:realty-brokers', 'edit:realty-brokers',
    'view:marketing', 'edit:marketing', 'approve:marketing',
  ],

  'marketing-manager': [
    'view:overview',
    'view:clients',
    'view:sales',
    'view:marketing', 'create:marketing', 'edit:marketing', 'approve:marketing', 'delete:marketing', 'export:marketing', 'configure:marketing',
    'view:analytics', 'export:analytics',
    'view:comms', 'create:comms',
    'view:ai-ops', 'create:ai-ops',
    'view:realty-brokers',
  ],

  'marketing-executive': [
    'view:overview',
    'view:clients',
    'view:marketing', 'create:marketing', 'edit:marketing', 'export:marketing',
    'view:analytics',
    'view:comms',
    'view:ai-ops', 'create:ai-ops',
  ],

  'sales': [
    'view:overview',
    'view:clients',
    'view:sales', 'create:sales', 'edit:sales',
    'view:analytics',
    'view:comms',
    'view:realty-brokers', 'create:realty-brokers',
    'view:marketing',
  ],

  'operations': [
    'view:overview',
    'view:clients',
    'view:assets', 'create:assets', 'edit:assets',
    'view:compliance',
    'view:comms',
    'view:realty-brokers',
  ],

  'hr': [
    'view:overview',
    'view:employees', 'create:employees', 'edit:employees', 'export:employees',
    'view:comms',
  ],

  'viewer': [
    'view:overview',
    'view:clients',
    'view:sales',
    'view:analytics',
    'view:marketing',
  ],
}

// ── Permission Check Functions ────────────────────────────────────
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role]
  if (!perms) return false
  if (perms.includes('*')) return true
  return perms.includes(permission)
}

export function hasModuleAccess(role: AdminRole, module: PermissionModule): boolean {
  const perms = ROLE_PERMISSIONS[role]
  if (!perms) return false
  if (perms.includes('*')) return true
  return perms.some(p => p.endsWith(`:${module}`))
}

export function canPerformAction(role: AdminRole, action: PermissionAction, module: PermissionModule): boolean {
  return hasPermission(role, `${action}:${module}`)
}

export function isRoleHigherOrEqual(role: AdminRole, targetRole: AdminRole): boolean {
  return ROLE_HIERARCHY[role] <= ROLE_HIERARCHY[targetRole]
}

// ── Visible Modules for a Role ────────────────────────────────────
export function getVisibleModules(role: AdminRole): PermissionModule[] {
  const all: PermissionModule[] = [
    'overview', 'clients', 'sales', 'realty-brokers', 'employees', 'assets',
    'ai-ops', 'compliance', 'financial', 'analytics', 'comms', 'marketing', 'settings',
  ]
  return all.filter(mod => hasModuleAccess(role, mod))
}
