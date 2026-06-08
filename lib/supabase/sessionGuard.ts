/* ─────────────────────────────────────────────────────────────
   Session Guard — shared hook used by the three portal auth
   hooks (admin, staff, investor/client).

   Responsibilities:
   1. Subscribe to supabase.auth.onAuthStateChange → on SIGNED_OUT
      or USER_DELETED, call onInvalidated().
   2. Every 60s re-verify the auth user still exists in the
      database by calling supabase.auth.getUser(). If the user
      was deleted server-side the client still holds a token,
      but getUser() will resolve with an error or null user.
   3. Track idle time (mouse / keyboard / touch activity) and
      trigger onInvalidated('idle') after INACTIVITY_MS.
   ───────────────────────────────────────────────────────────── */

'use client'

import { useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from './client'

const CHECK_INTERVAL_MS = 60_000          // re-verify every minute
// 08-06-2026: admins reported being logged out mid-work (~30 min). The custom
// admin session lasts 8h (adminAuthService), so the idle timeout should not
// kick in earlier — raise it to match an 8-hour working session so nobody is
// signed out while actively using the panel.
const INACTIVITY_MS = 8 * 60 * 60_000      // 8 hours idle → logout (matches session)
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click',
]

export type SessionInvalidationReason = 'signed_out' | 'user_missing' | 'idle' | 'unauthorized'

export function useSessionGuard(params: {
  isAuthenticated: boolean
  onInvalidated: (reason: SessionInvalidationReason) => void
  // Optional per-portal probe. Returns true if the user is still valid in
  // the portal-specific sense (e.g. admin role still present). When omitted
  // only the base auth.getUser() check is performed.
  extraCheck?: () => Promise<boolean>
}) {
  const { isAuthenticated, onInvalidated, extraCheck } = params
  const invokedRef = useRef(false)
  const lastActivityRef = useRef<number>(Date.now())
  // 08-06-2026: tolerate a single failed probe. A backgrounded tab can let the
  // access token lapse a moment before auto-refresh catches up, and getUser()
  // would then return an error — logging the admin out mid-session. Only treat
  // it as a real invalidation after two consecutive failures (and after trying
  // an explicit refresh first).
  const probeFailRef = useRef(0)

  useEffect(() => {
    if (!isAuthenticated || !isSupabaseConfigured()) return
    invokedRef.current = false

    const invalidate = (reason: SessionInvalidationReason) => {
      if (invokedRef.current) return
      invokedRef.current = true
      try { onInvalidated(reason) } catch { /* ignore */ }
    }
    probeFailRef.current = 0

    // 1) auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // Treat both hard sign-outs and user-deleted events as invalidations.
      if (event === 'SIGNED_OUT' || (event as string) === 'USER_DELETED') {
        invalidate('signed_out')
      }
    })

    // 2) periodic user-existence probe
    const probe = async () => {
      if (invokedRef.current) return
      try {
        let { data, error } = await supabase.auth.getUser()
        // Token may have just lapsed (e.g. tab was backgrounded). Try one
        // explicit refresh before deciding the session is gone.
        if (error || !data?.user) {
          await supabase.auth.refreshSession().catch(() => {})
          ;({ data, error } = await supabase.auth.getUser())
        }
        if (error || !data?.user) {
          probeFailRef.current += 1
          // Only log out after two consecutive failures — a single transient
          // failure (network blip / refresh race) must not end the session.
          if (probeFailRef.current >= 2) invalidate('user_missing')
          return
        }
        probeFailRef.current = 0
        if (extraCheck) {
          const ok = await extraCheck()
          if (!ok) {
            probeFailRef.current += 1
            if (probeFailRef.current >= 2) invalidate('user_missing')
            return
          }
          probeFailRef.current = 0
        }
      } catch {
        // network blip → ignore this tick (don't count toward failures)
      }
    }
    const probeTimer = window.setInterval(probe, CHECK_INTERVAL_MS)
    // Run once soon after mount so a deleted user is caught quickly.
    const firstProbe = window.setTimeout(probe, 2_000)

    // 3) idle-timeout tracker
    lastActivityRef.current = Date.now()
    const markActive = () => { lastActivityRef.current = Date.now() }
    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, markActive, { passive: true }))

    const idleTimer = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= INACTIVITY_MS) invalidate('idle')
    }, 60_000)

    return () => {
      sub?.subscription?.unsubscribe?.()
      window.clearInterval(probeTimer)
      window.clearTimeout(firstProbe)
      window.clearInterval(idleTimer)
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, markActive))
    }
  }, [isAuthenticated, onInvalidated, extraCheck])
}

// Compose a user-facing message for the invalidation reason.
export function sessionInvalidationMessage(reason: SessionInvalidationReason): string {
  switch (reason) {
    case 'idle': return 'Session expired due to inactivity. Please log in again.'
    case 'user_missing': return 'Your account is no longer active. Please log in again.'
    case 'unauthorized': return 'Session expired. Please log in again.'
    case 'signed_out':
    default: return 'You have been signed out. Please log in again.'
  }
}
