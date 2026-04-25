/* ─────────────────────────────────────────────────────────────
   Force Password Reset — shared helper used by all three portal
   auth services (client, staff, admin).

   When an admin sets a temporary password via the
   admin-password-reset Netlify function, we stamp
   `user_metadata.force_password_reset = true` on the auth.users
   row. This helper detects the flag right after sign-in and
   primes the session-storage signal that DashboardClient (and the
   staff / admin shells) already watch, so the user is parked on
   the password-reset screen until they pick a new password.

   The flag itself is cleared inside the password-update handler
   that calls `supabase.auth.updateUser({ password, data: {...} })`.
   ───────────────────────────────────────────────────────────── */

const FLAG_KEY = 'ghl_password_reset_mandatory'

/**
 * Returns true if the auth user_metadata says a password reset is required.
 * Accepts either a fresh user object or a user_metadata bag.
 */
export function userRequiresPasswordReset(
  userOrMetadata: { user_metadata?: Record<string, any> } | Record<string, any> | null | undefined
): boolean {
  if (!userOrMetadata) return false
  const meta = (userOrMetadata as any).user_metadata ?? userOrMetadata
  if (!meta || typeof meta !== 'object') return false
  return meta.force_password_reset === true
}

/**
 * Set the session-storage flag the dashboard watches. Safe to call from any
 * portal's login handler — `DashboardClient` reads this on mount and forces
 * the user to the password-reset screen until they change their password.
 */
export function markForcePasswordReset(): void {
  if (typeof window === 'undefined') return
  try { sessionStorage.setItem(FLAG_KEY, '1') } catch { /* ignore */ }
}

export function clearForcePasswordResetFlag(): void {
  if (typeof window === 'undefined') return
  try { sessionStorage.removeItem(FLAG_KEY) } catch { /* ignore */ }
}

/**
 * If the freshly-signed-in user requires a reset, set the session-storage flag.
 * Returns true when a reset is required so callers can route accordingly.
 */
export function primeForcePasswordResetIfNeeded(
  user: { user_metadata?: Record<string, any> } | null | undefined
): boolean {
  if (userRequiresPasswordReset(user)) {
    markForcePasswordReset()
    return true
  }
  return false
}
