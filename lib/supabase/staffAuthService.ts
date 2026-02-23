/* ─────────────────────────────────────────────────────────────
   Staff Auth Service — Supabase auth with mock fallback

   Uses new schema: profiles (role) + staff_profiles (employee_id)
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

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      // User doesn't exist in Supabase yet — fall back to mock/demo auth
      console.info('[staffAuth] Supabase auth failed, falling back to demo credentials')
      return mockLogin(email, password, staffCode)
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // Fetch staff profile and verify employee code
    const { data: staffProfile } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single()

    const p = profile as any
    const sp = staffProfile as any

    if (!p || !sp || sp.employee_id !== staffCode) {
      await supabase.auth.signOut()
      return null
    }

    const SESSION_DURATION = 8 * 60 * 60 * 1000

    return {
      user: {
        id: data.user.id,
        name: p.full_name || data.user.email || '',
        email: data.user.email || '',
        role: (sp.designation || 'general-employee') as StaffRole,
        staffCode: sp.employee_id,
        department: sp.department || '',
        designation: sp.designation || '',
        phone: p.phone || '',
        reportingTo: sp.reporting_to || undefined,
        joinDate: sp.date_of_joining || p.created_at?.split('T')[0] || '',
        status: (sp.is_active ? 'active' : 'contract') as any,
      },
      token: `staff_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      loginAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
    }
  } catch (err) {
    console.warn('[staffAuth] Supabase auth error, falling back to mock:', err)
    return mockLogin(email, password, staffCode)
  }
}

export async function getStaffSession(): Promise<StaffSession | null> {
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

    const { data: staffProfile } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    const p = profile as any
    const sp = staffProfile as any

    if (!p || !sp) return null

    const SESSION_DURATION = 8 * 60 * 60 * 1000

    return {
      user: {
        id: session.user.id,
        name: p.full_name || session.user.email || '',
        email: session.user.email || '',
        role: (sp.designation || 'general-employee') as StaffRole,
        staffCode: sp.employee_id,
        department: sp.department || '',
        designation: sp.designation || '',
        phone: p.phone || '',
        reportingTo: sp.reporting_to || undefined,
        joinDate: sp.date_of_joining || p.created_at?.split('T')[0] || '',
        status: (sp.is_active ? 'active' : 'contract') as any,
      },
      token: `staff_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      loginAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
    }
  } catch {
    return mockGetSession()
  }
}

export async function logoutStaff(): Promise<void> {
  if (!isSupabaseConfigured()) {
    mockLogout()
    return
  }
  try {
    await supabase.auth.signOut()
  } catch {
    mockLogout()
  }
}
