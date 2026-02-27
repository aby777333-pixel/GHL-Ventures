/* ================================================================
   ADMIN COMMAND CENTER — Role config & display labels
   Auth handled by lib/supabase/adminAuthService.ts
   ================================================================ */

import type { AdminRole } from './adminTypes'

// ── Role Display Labels ───────────────────────────────────────────
export const ROLE_LABELS: Record<AdminRole, string> = {
  'super-admin': 'Super Admin',
  'admin': 'Admin',
  'compliance-officer': 'Compliance Officer',
  'fund-manager': 'Fund Manager',
  'manager': 'Manager',
  'marketing-manager': 'Marketing Manager',
  'marketing-executive': 'Marketing Executive',
  'sales': 'Sales',
  'operations': 'Operations',
  'hr': 'HR',
  'viewer': 'Read-only Viewer',
}

export const ROLE_COLORS: Record<AdminRole, string> = {
  'super-admin': '#DC2626',
  'admin': '#F59E0B',
  'compliance-officer': '#8B5CF6',
  'fund-manager': '#3B82F6',
  'manager': '#10B981',
  'marketing-manager': '#F472B6',
  'marketing-executive': '#FB923C',
  'sales': '#F97316',
  'operations': '#06B6D4',
  'hr': '#EC4899',
  'viewer': '#6B7280',
}
