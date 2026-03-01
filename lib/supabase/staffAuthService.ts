/* ─────────────────────────────────────────────────────────────
   Staff Auth Service — Supabase authentication (production)

   Uses new schema: profiles (role) + staff_profiles (employee_id)
   Includes client-side rate limiting (5 attempts / 15 min lockout)
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'
import type { StaffSession, StaffRole } from '../staff/staffTypes'

// Re-export types for convenience
export type { StaffSession, StaffUser, StaffRole } from '../staff/staffTypes'

// ── Rate Limiting ───────────────────────────────────────────
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const STORAGE_KEY = 'ghl_staff_login_attempts'

interface LoginAttemptRecord {
  attempts: number
  firstAttemptAt: number
  lockedUntil: number | null
}

function getAttemptRecord(): LoginAttemptRecord {
  try {
    if (typeof window === 'undefined') return { attempts: 0, firstAttemptAt: 0, lockedUntil: null }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { attempts: 0, firstAttemptAt: 0, lockedUntil: null }
    return JSON.parse(raw)
  } catch {
    return { attempts: 0, firstAttemptAt: 0, lockedUntil: null }
  }
}

function saveAttemptRecord(record: LoginAttemptRecord) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
    }
  } catch { /* non-blocking */ }
}

function clearAttemptRecord() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch { /* non-blocking */ }
}

/** Check if user is currently rate-limited. Returns remaining lockout ms or 0. */
export function getStaffLoginLockout(): number {
  const record = getAttemptRecord()
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    return record.lockedUntil - Date.now()
  }
  // Clear stale lockout
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    clearAttemptRecord()
  }
  return 0
}

function recordFailedAttempt(): LoginAttemptRecord {
  const now = Date.now()
  let record = getAttemptRecord()

  // Reset if lockout expired or window exceeded
  if (record.lockedUntil && now >= record.lockedUntil) {
    record = { attempts: 0, firstAttemptAt: 0, lockedUntil: null }
  }

  record.attempts += 1
  if (record.attempts === 1) record.firstAttemptAt = now

  // Lock out after MAX_ATTEMPTS
  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION
  }

  saveAttemptRecord(record)
  return record
}

// ── Auth Functions ──────────────────────────────────────────

export async function loginStaff(
  email: string,
  password: string,
  staffCode?: string
): Promise<StaffSession | null> {
  if (!isSupabaseConfigured()) {
    console.warn('[staffAuth] Supabase not configured — cannot authenticate')
    return null
  }

  // ── Rate limit check ──────────────────────────────────────
  const lockout = getStaffLoginLockout()
  if (lockout > 0) {
    const mins = Math.ceil(lockout / 60000)
    console.warn(`[staffAuth] Rate limited — ${mins} min remaining`)
    return null
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      console.warn('[staffAuth] Authentication failed:', error?.message)
      recordFailedAttempt()
      return null
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

    if (!p || !sp) {
      await supabase.auth.signOut()
      recordFailedAttempt()
      return null
    }

    // If staffCode provided, verify employee_id match
    if (staffCode && sp.employee_id !== staffCode) {
      await supabase.auth.signOut()
      recordFailedAttempt()
      return null
    }

    // ── Success — clear rate limit record ────────────────────
    clearAttemptRecord()

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
    console.error('[staffAuth] Authentication error:', err)
    recordFailedAttempt()
    return null
  }
}

export async function getStaffSession(): Promise<StaffSession | null> {
  if (!isSupabaseConfigured()) return null

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
    return null
  }
}

export async function logoutStaff(): Promise<void> {
  if (!isSupabaseConfigured()) return
  try {
    await supabase.auth.signOut()
  } catch {
    // Best-effort signout
    try { await supabase.auth.signOut() } catch { /* ignore */ }
  }
}
