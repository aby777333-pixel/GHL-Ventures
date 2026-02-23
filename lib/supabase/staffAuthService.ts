/* ─────────────────────────────────────────────────────────────
   Staff Auth Service — Supabase auth with mock fallback

   Re-uses StaffSession / StaffUser types from staffTypes.ts
   so the mock and live auth return the same shape.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'
import type { StaffSession, StaffRole } from '../staff/staffTypes'

// ── Fallback to mock auth ───────────────────────────────────
import {
  loginStaff as mockLogin,
  getStaffSession as mockGetSession,
  logoutStaff as mockLogout,
} from '../staff/staffAuth'

// Re-export types for convenience
export type { StaffSession, StaffUser, StaffRole } from '../staff/staffTypes'

// ── Auth Functions ──────────────────────────────────────────

export async function loginStaff(
  email: string,
  password: string,
  staffCode: string
): Promise<StaffSession | null> {
  if (!isSupabaseConfigured()) {
    return mockLogin(email, password, staffCode)
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) return null

  // Fetch staff profile and verify staff code
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  const { data: staffProfileData } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  const profile = profileData as any
  const staffProfile = staffProfileData as any

  if (!profile || !staffProfile || staffProfile.staff_code !== staffCode) {
    await supabase.auth.signOut()
    return null
  }

  const SESSION_DURATION = 8 * 60 * 60 * 1000

  return {
    user: {
      id: data.user.id,
      name: profile.name,
      email: profile.email,
      role: staffProfile.role as StaffRole,
      staffCode: staffProfile.staff_code,
      department: staffProfile.department || '',
      designation: staffProfile.designation || '',
      phone: profile.phone || '',
      reportingTo: staffProfile.reporting_to || undefined,
      joinDate: profile.created_at?.split('T')[0] || '',
      status: staffProfile.status || 'active',
    },
    token: `staff_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    loginAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
  }
}

export async function getStaffSession(): Promise<StaffSession | null> {
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

  const { data: staffProfileData } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const profile = profileData as any
  const staffProfile = staffProfileData as any

  if (!profile || !staffProfile) return null

  const SESSION_DURATION = 8 * 60 * 60 * 1000

  return {
    user: {
      id: session.user.id,
      name: profile.name,
      email: profile.email,
      role: staffProfile.role as StaffRole,
      staffCode: staffProfile.staff_code,
      department: staffProfile.department || '',
      designation: staffProfile.designation || '',
      phone: profile.phone || '',
      reportingTo: staffProfile.reporting_to || undefined,
      joinDate: profile.created_at?.split('T')[0] || '',
      status: staffProfile.status || 'active',
    },
    token: `staff_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    loginAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
  }
}

export async function logoutStaff(): Promise<void> {
  if (!isSupabaseConfigured()) {
    mockLogout()
    return
  }
  await supabase.auth.signOut()
}
