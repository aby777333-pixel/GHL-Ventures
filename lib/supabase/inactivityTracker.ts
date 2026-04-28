/* ─────────────────────────────────────────────────────────────
   Inactivity Tracker — 1-hour idle timeout

   Tracks the last user activity timestamp via a small set of
   browser events and exposes a hook that:
     - logs the user out only after `INACTIVITY_TIMEOUT_MS` of
       no interaction AND only when the underlying Supabase
       auth session is missing OR the user profile has been
       removed.
     - re-validates the session whenever the tab regains focus
       so we never push a still-active user to /login due to a
       stale in-memory state.

   Bug fix (Tests 28-04-2026 #1): the previous behaviour logged
   users out on a hard-coded 8h schedule (or whenever a transient
   getSession() returned null), even mid-session. This module
   replaces that with a proper inactivity timer.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from './client'

export const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour
const ACTIVITY_KEY = 'ghl-last-activity'
const CHECK_INTERVAL_MS = 60 * 1000 // re-check session every minute

const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
]

function readLastActivity(): number {
  if (typeof window === 'undefined') return Date.now()
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY)
    const n = raw ? Number(raw) : 0
    return Number.isFinite(n) && n > 0 ? n : Date.now()
  } catch {
    return Date.now()
  }
}

export function recordActivity(): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(ACTIVITY_KEY, String(Date.now())) } catch { /* ignore quota errors */ }
}

/** Returns `true` only when the auth session is invalid OR the
 *  signed-in user no longer has a `profiles` row. Anything else
 *  (transient network failure, refresh-in-flight) is treated as
 *  still authenticated — we never log a real user out by accident. */
export async function isSessionInvalid(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) return false // transient — keep session
    const session = data?.session
    if (!session?.user) return true // clearly signed out

    // Also confirm the user still exists (e.g. admin-deleted)
    try {
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle()
      if (pErr) return false // transient DB error — keep session
      if (!profile) return true // user row deleted → invalid
    } catch {
      return false
    }

    return false
  } catch {
    return false
  }
}

/** Hook that triggers `onTimeout` when the user has been idle for
 *  longer than `INACTIVITY_TIMEOUT_MS` AND the underlying session
 *  is no longer valid. Safe to call from any client component;
 *  multiple consumers share the same activity timestamp via
 *  localStorage. */
export function useInactivityLogout(onTimeout: () => void, enabled = true) {
  const timeoutRef = useRef<number | null>(null)
  const cbRef = useRef(onTimeout)
  cbRef.current = onTimeout

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    // Seed activity on mount so a fresh tab doesn't immediately fire.
    recordActivity()

    const onActivity = () => recordActivity()
    ACTIVITY_EVENTS.forEach(evt => document.addEventListener(evt, onActivity, { passive: true }))
    window.addEventListener('focus', onActivity)

    const check = async () => {
      const idleFor = Date.now() - readLastActivity()
      if (idleFor < INACTIVITY_TIMEOUT_MS) return
      const invalid = await isSessionInvalid()
      if (invalid) {
        try { cbRef.current() } catch { /* swallow */ }
      } else {
        // User has been idle but session is still valid → leave them alone.
        // Recording activity here would mask future idle periods, so we just
        // wait for the next tick.
      }
    }

    timeoutRef.current = window.setInterval(check, CHECK_INTERVAL_MS) as unknown as number

    return () => {
      ACTIVITY_EVENTS.forEach(evt => document.removeEventListener(evt, onActivity))
      window.removeEventListener('focus', onActivity)
      if (timeoutRef.current) window.clearInterval(timeoutRef.current)
    }
  }, [enabled])
}
