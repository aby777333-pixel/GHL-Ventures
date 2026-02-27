/* ================================================================
   STAFF PORTAL — Role config & display labels
   Auth handled by lib/supabase/staffAuthService.ts
   ================================================================ */

import type { StaffRole } from './staffTypes'

// ── Role Labels & Colors ────────────────────────────────────────
export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  'cs-lead': 'Customer Service Lead',
  'senior-cs-agent': 'Senior CS Agent',
  'cs-agent': 'CS Agent',
  'relationship-manager': 'Relationship Manager',
  'field-sales-manager': 'Field Sales Manager',
  'field-sales-executive': 'Field Sales Executive',
  'site-inspector': 'Site Inspector',
  'kyc-officer': 'KYC Processing Officer',
  'operations-executive': 'Operations Executive',
  'hr-executive': 'HR Executive',
  'general-employee': 'General Employee',
  'intern': 'Intern / Trainee',
}

export const STAFF_ROLE_COLORS: Record<StaffRole, string> = {
  'cs-lead': '#3B82F6',
  'senior-cs-agent': '#6366F1',
  'cs-agent': '#8B5CF6',
  'relationship-manager': '#10B981',
  'field-sales-manager': '#F59E0B',
  'field-sales-executive': '#F97316',
  'site-inspector': '#06B6D4',
  'kyc-officer': '#EC4899',
  'operations-executive': '#64748B',
  'hr-executive': '#14B8A6',
  'general-employee': '#6B7280',
  'intern': '#A78BFA',
}
