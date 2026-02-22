/* ================================================================
   STAFF PORTAL — ROLE-BASED ACCESS CONTROL
   ================================================================ */

import type { StaffRole, StaffModule, StaffPermission } from './staffTypes'

// ── Role Hierarchy (lower = more access) ────────────────────────
export const STAFF_ROLE_HIERARCHY: Record<StaffRole, number> = {
  'cs-lead': 1,
  'field-sales-manager': 2,
  'senior-cs-agent': 3,
  'relationship-manager': 3,
  'hr-executive': 4,
  'cs-agent': 5,
  'field-sales-executive': 5,
  'site-inspector': 5,
  'kyc-officer': 5,
  'operations-executive': 5,
  'general-employee': 6,
  'intern': 7,
}

// ── Field Roles (can see Field module) ──────────────────────────
const FIELD_ROLES: StaffRole[] = ['field-sales-manager', 'field-sales-executive', 'site-inspector']

// ── CS Roles (can see CS module) ────────────────────────────────
const CS_ROLES: StaffRole[] = ['cs-lead', 'senior-cs-agent', 'cs-agent', 'relationship-manager', 'kyc-officer', 'operations-executive']

// ── Module Permissions ──────────────────────────────────────────
const MODULE_PERMISSIONS: Record<StaffModule, Record<StaffRole, StaffPermission[]>> = {
  home: {
    'cs-lead': ['view'], 'senior-cs-agent': ['view'], 'cs-agent': ['view'],
    'relationship-manager': ['view'], 'field-sales-manager': ['view'],
    'field-sales-executive': ['view'], 'site-inspector': ['view'],
    'kyc-officer': ['view'], 'operations-executive': ['view'],
    'hr-executive': ['view'], 'general-employee': ['view'], 'intern': ['view'],
  },
  me: {
    'cs-lead': ['view', 'create', 'edit'], 'senior-cs-agent': ['view', 'create', 'edit'],
    'cs-agent': ['view', 'create', 'edit'], 'relationship-manager': ['view', 'create', 'edit'],
    'field-sales-manager': ['view', 'create', 'edit'], 'field-sales-executive': ['view', 'create', 'edit'],
    'site-inspector': ['view', 'create', 'edit'], 'kyc-officer': ['view', 'create', 'edit'],
    'operations-executive': ['view', 'create', 'edit'], 'hr-executive': ['view', 'create', 'edit'],
    'general-employee': ['view', 'create', 'edit'], 'intern': ['view'],
  },
  cs: {
    'cs-lead': ['view', 'create', 'edit', 'escalate', 'close', 'export', 'manage'],
    'senior-cs-agent': ['view', 'create', 'edit', 'escalate', 'close', 'export'],
    'cs-agent': ['view', 'create', 'edit', 'escalate'],
    'relationship-manager': ['view', 'create', 'edit', 'escalate'],
    'field-sales-manager': [], 'field-sales-executive': [], 'site-inspector': [],
    'kyc-officer': ['view', 'create'], 'operations-executive': ['view', 'create'],
    'hr-executive': [], 'general-employee': [], 'intern': [],
  },
  clients: {
    'cs-lead': ['view', 'export'], 'senior-cs-agent': ['view'],
    'cs-agent': ['view'], 'relationship-manager': ['view'],
    'field-sales-manager': ['view'], 'field-sales-executive': ['view'],
    'site-inspector': [], 'kyc-officer': ['view'],
    'operations-executive': ['view'], 'hr-executive': [],
    'general-employee': [], 'intern': [],
  },
  tasks: {
    'cs-lead': ['view', 'create', 'edit', 'manage'], 'senior-cs-agent': ['view', 'create', 'edit'],
    'cs-agent': ['view', 'create', 'edit'], 'relationship-manager': ['view', 'create', 'edit'],
    'field-sales-manager': ['view', 'create', 'edit', 'manage'],
    'field-sales-executive': ['view', 'create', 'edit'],
    'site-inspector': ['view', 'create', 'edit'],
    'kyc-officer': ['view', 'create', 'edit'], 'operations-executive': ['view', 'create', 'edit'],
    'hr-executive': ['view', 'create', 'edit'], 'general-employee': ['view'],
    'intern': ['view'],
  },
  team: {
    'cs-lead': ['view', 'manage'], 'senior-cs-agent': ['view'],
    'cs-agent': ['view'], 'relationship-manager': ['view'],
    'field-sales-manager': ['view', 'manage'], 'field-sales-executive': ['view'],
    'site-inspector': ['view'], 'kyc-officer': ['view'],
    'operations-executive': ['view'], 'hr-executive': ['view', 'manage'],
    'general-employee': ['view'], 'intern': ['view'],
  },
  ai: {
    'cs-lead': ['view', 'create'], 'senior-cs-agent': ['view', 'create'],
    'cs-agent': ['view', 'create'], 'relationship-manager': ['view', 'create'],
    'field-sales-manager': ['view', 'create'], 'field-sales-executive': ['view', 'create'],
    'site-inspector': ['view', 'create'], 'kyc-officer': ['view', 'create'],
    'operations-executive': ['view', 'create'], 'hr-executive': ['view'],
    'general-employee': ['view'], 'intern': ['view'],
  },
  internal: {
    'cs-lead': ['view', 'create'], 'senior-cs-agent': ['view', 'create'],
    'cs-agent': ['view', 'create'], 'relationship-manager': ['view', 'create'],
    'field-sales-manager': ['view', 'create'], 'field-sales-executive': ['view', 'create'],
    'site-inspector': ['view', 'create'], 'kyc-officer': ['view', 'create'],
    'operations-executive': ['view', 'create'], 'hr-executive': ['view', 'create'],
    'general-employee': ['view', 'create'], 'intern': ['view'],
  },
  field: {
    'cs-lead': [], 'senior-cs-agent': [], 'cs-agent': [],
    'relationship-manager': [],
    'field-sales-manager': ['view', 'create', 'edit', 'manage', 'export'],
    'field-sales-executive': ['view', 'create', 'edit', 'export'],
    'site-inspector': ['view', 'create', 'edit'],
    'kyc-officer': [], 'operations-executive': [],
    'hr-executive': [], 'general-employee': [], 'intern': [],
  },
}

// ── Access Check Functions ──────────────────────────────────────
export function hasStaffModuleAccess(role: StaffRole, module: StaffModule): boolean {
  const perms = MODULE_PERMISSIONS[module]?.[role]
  return perms != null && perms.length > 0
}

export function hasStaffPermission(role: StaffRole, module: StaffModule, permission: StaffPermission): boolean {
  const perms = MODULE_PERMISSIONS[module]?.[role]
  return perms != null && perms.includes(permission)
}

export function isFieldRole(role: StaffRole): boolean {
  return FIELD_ROLES.includes(role)
}

export function isCSRole(role: StaffRole): boolean {
  return CS_ROLES.includes(role)
}

export function isLeadRole(role: StaffRole): boolean {
  return STAFF_ROLE_HIERARCHY[role] <= 2
}

// ── Get Visible Modules ─────────────────────────────────────────
export function getStaffVisibleModules(role: StaffRole): StaffModule[] {
  const allModules: StaffModule[] = ['home', 'me', 'cs', 'clients', 'tasks', 'team', 'ai', 'internal', 'field']
  return allModules.filter(m => hasStaffModuleAccess(role, m))
}
