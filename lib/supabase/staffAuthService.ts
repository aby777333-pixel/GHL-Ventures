/* ─────────────────────────────────────────────────────────────
   Staff Auth Service — Supabase authentication (production)

   Uses new schema: profiles (role) + staff_profiles (employee_id)
   Includes client-side rate limiting (5 attempts / 15 min lockout)
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'
import type { StaffSession, StaffRole } from '../staff/staffTypes'
import { primeForcePasswordResetIfNeeded } from '../auth/forceReset'

// Re-export types for convenience
export type { StaffSession, StaffUser, StaffRole } from '../staff/staffTypes'

// ── Secure Token Generation ────────────────────────────────
function generateSecureToken(): string {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

// ── Rate Limiting (multi-storage + exponential backoff) ────
const MAX_ATTEMPTS = 5
const BASE_LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const STORAGE_KEY = 'ghl_staff_login_attempts'
const SESSION_STORAGE_KEY = 'ghl_staff_login_attempts_s'

// In-memory fallback (survives localStorage clear within same page session)
let inMemoryAttemptRecord: LoginAttemptRecord | null = null

interface LoginAttemptRecord {
  attempts: number
  firstAttemptAt: number
  lockedUntil: number | null
}

function getAttemptRecord(): LoginAttemptRecord {
  const empty: LoginAttemptRecord = { attempts: 0, firstAttemptAt: 0, lockedUntil: null }
  if (typeof window === 'undefined') return empty

  // Read from all three sources and use the one with the most attempts (hardest to bypass)
  const candidates: LoginAttemptRecord[] = []

  try {
    const rawLS = localStorage.getItem(STORAGE_KEY)
    if (rawLS) candidates.push(JSON.parse(rawLS))
  } catch { /* ignore */ }

  try {
    const rawSS = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (rawSS) candidates.push(JSON.parse(rawSS))
  } catch { /* ignore */ }

  if (inMemoryAttemptRecord) candidates.push(inMemoryAttemptRecord)

  if (candidates.length === 0) return empty

  // Use the record with the highest attempt count (prevents bypassing by clearing one store)
  return candidates.reduce((max, r) => r.attempts > max.attempts ? r : max, empty)
}

function saveAttemptRecord(record: LoginAttemptRecord) {
  if (typeof window === 'undefined') return
  const json = JSON.stringify(record)
  // Persist to all three stores so clearing one doesn't bypass the limit
  try { localStorage.setItem(STORAGE_KEY, json) } catch { /* non-blocking */ }
  try { sessionStorage.setItem(SESSION_STORAGE_KEY, json) } catch { /* non-blocking */ }
  inMemoryAttemptRecord = { ...record }
}

function clearAttemptRecord() {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  try { sessionStorage.removeItem(SESSION_STORAGE_KEY) } catch { /* ignore */ }
  inMemoryAttemptRecord = null
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

  // Exponential backoff: lockout doubles with each subsequent trigger
  if (record.attempts >= MAX_ATTEMPTS) {
    const exponent = Math.min(record.attempts - MAX_ATTEMPTS, 4) // cap at 16x
    record.lockedUntil = now + BASE_LOCKOUT_DURATION * Math.pow(2, exponent)
  }

  saveAttemptRecord(record)
  return record
}

// ── Valid Staff Roles (BUG C8) ─────────────────────────────
const VALID_STAFF_ROLES: string[] = [
  'cs-lead', 'senior-cs-agent', 'cs-agent', 'relationship-manager',
  'field-sales-manager', 'field-sales-executive', 'site-inspector',
  'kyc-officer', 'operations-executive', 'hr-executive',
  'general-employee', 'intern',
]

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

    // If admin set a temporary password, signal the staff portal to force a change.
    primeForcePasswordResetIfNeeded(data.user)

    // Mirror the staff member's current password into the super-admin
    // "User Passwords" console (idempotent RPC — only writes when the value
    // is new). Best-effort; never affects login.
    try { await supabase.rpc('record_user_password', { p_password: password } as any) } catch { /* non-fatal */ }

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

    // Validate designation against known roles (BUG C8)
    const validatedRole = VALID_STAFF_ROLES.includes(sp.designation)
      ? sp.designation as StaffRole
      : 'general-employee' as StaffRole

    return {
      user: {
        id: data.user.id,
        name: p.full_name || data.user.email || '',
        email: data.user.email || '',
        role: validatedRole,
        staffCode: sp.employee_id,
        department: sp.department || '',
        designation: sp.designation || '',
        phone: p.phone || '',
        reportingTo: sp.reporting_to || undefined,
        joinDate: sp.date_of_joining || p.created_at?.split('T')[0] || '',
        status: (sp.is_active ? 'active' : 'contract') as any,
      },
      token: `staff_${generateSecureToken()}`,
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
    // Check for existing stored session and validate expiry (BUG C7)
    const storedRaw = typeof window !== 'undefined'
      ? localStorage.getItem('ghl-staff-session')
      : null
    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw)
        if (parsed.expiresAt && Date.now() > new Date(parsed.expiresAt).getTime()) {
          // Session expired — sign out
          await supabase.auth.signOut()
          try { localStorage.removeItem('ghl-staff-session') } catch { /* ignore */ }
          return null
        }
      } catch { /* ignore parse errors, continue to re-validate */ }
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    // Re-prime force-password-reset flag after a refresh
    primeForcePasswordResetIfNeeded(session.user)

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

    // Reuse stored timestamps if available, else create fresh ones
    let loginAt: string
    let expiresAt: string
    let token: string
    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw)
        loginAt = parsed.loginAt || new Date().toISOString()
        expiresAt = parsed.expiresAt || new Date(Date.now() + SESSION_DURATION).toISOString()
        token = parsed.token || `staff_${generateSecureToken()}`
      } catch {
        loginAt = new Date().toISOString()
        expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString()
        token = `staff_${generateSecureToken()}`
      }
    } else {
      loginAt = new Date().toISOString()
      expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString()
      token = `staff_${generateSecureToken()}`
    }

    // Validate designation against known roles (BUG C8)
    const validatedRole = VALID_STAFF_ROLES.includes(sp.designation)
      ? sp.designation as StaffRole
      : 'general-employee' as StaffRole

    return {
      user: {
        id: session.user.id,
        name: p.full_name || session.user.email || '',
        email: session.user.email || '',
        role: validatedRole,
        staffCode: sp.employee_id,
        department: sp.department || '',
        designation: sp.designation || '',
        phone: p.phone || '',
        reportingTo: sp.reporting_to || undefined,
        joinDate: sp.date_of_joining || p.created_at?.split('T')[0] || '',
        status: (sp.is_active ? 'active' : 'contract') as any,
      },
      token,
      loginAt,
      expiresAt,
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
  } finally {
    // Clear localStorage session to prevent stale data / impersonation
    try {
      localStorage.removeItem('ghl-staff-session')
      localStorage.removeItem('ghl_staff_login_attempts')
      sessionStorage.removeItem('ghl_staff_login_attempts_s')
    } catch { /* ignore */ }
  }
}
