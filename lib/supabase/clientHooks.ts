/* ─────────────────────────────────────────────────────────────
   Client Auth Hook — useClientAuth()

   Wraps clientAuthService for React component consumption.
   - Subscribes to onAuthStateChange so the hook stays in sync
     with token refreshes (avoids the spurious sign-out we used
     to see when a refresh-in-flight briefly returned null).
   - Hooks into useInactivityLogout so the user is only logged
     out after 1h of true inactivity AND only when the session
     is genuinely invalid.
   ───────────────────────────────────────────────────────────── */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ClientSession } from './clientAuthService'
import { getClientSession, logoutClient } from './clientAuthService'
import { supabase } from './client'
import { useSessionGuard, sessionInvalidationMessage, type SessionInvalidationReason } from './sessionGuard'
import { useInactivityLogout, isSessionInvalid } from './inactivityTracker'

export function useClientAuth() {
  const [session, setSession] = useState<ClientSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState<string | null>(null)
  const [ghlId, setGhlId] = useState<string | null>(null)
  const [emailVerified, setEmailVerified] = useState(false)

  const hydrate = useCallback(async (cancelledRef?: { cancelled: boolean }) => {
    const s = await getClientSession()
    if (cancelledRef?.cancelled) return
    setSession(s)
    if (s?.user?.id) {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession()
        if (!cancelledRef?.cancelled) {
          setEmailVerified(!!authSession?.user?.email_confirmed_at)
        }
      } catch {
        if (!cancelledRef?.cancelled) setEmailVerified(false)
      }
      try {
        const { data } = await supabase.from('clients').select('id, ghl_id').eq('user_id', s.user.id).single() as { data: { id: string; ghl_id?: string } | null }
        if (!cancelledRef?.cancelled) {
          setClientId(data?.id ?? null)
          setGhlId(data?.ghl_id ?? null)
        }
      } catch {
        if (!cancelledRef?.cancelled) { setClientId(null); setGhlId(null) }
      }
    } else {
      if (!cancelledRef?.cancelled) {
        setClientId(null)
        setGhlId(null)
        setEmailVerified(false)
      }
    }
  }, [])

  useEffect(() => {
    const cancelledRef = { cancelled: false }
    hydrate(cancelledRef).finally(() => {
      if (!cancelledRef.cancelled) setLoading(false)
    })

    // Tests 28-04-2026 #1: Stay subscribed to Supabase auth events so a
    // background token refresh (or sign-in from another tab) doesn't leave
    // us with a stale `session` and prematurely flush the user to /login.
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        if (!cancelledRef.cancelled) {
          setSession(null)
          setClientId(null)
          setGhlId(null)
          setEmailVerified(false)
        }
        return
      }
      // For SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED rebuild from server.
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        hydrate(cancelledRef)
      }
    })

    return () => {
      cancelledRef.cancelled = true
      subscription.subscription?.unsubscribe()
    }
  }, [hydrate])

  const logout = useCallback(async () => {
    await logoutClient()
    setSession(null)
    setClientId(null)
    setGhlId(null)
    setEmailVerified(false)
  }, [])

  // Tests 28-04-2026 #1: log the user out only after 1h of true inactivity
  // AND when the underlying session has actually gone invalid.
  useInactivityLogout(() => { logout() }, !!session)

  const refreshSession = useCallback(async () => {
    const cancelledRef = { cancelled: false }
    await hydrate(cancelledRef)
    return await getClientSession()
  }, [hydrate])

  const handleInvalidated = useCallback((reason: SessionInvalidationReason) => {
    try {
      if (typeof window !== 'undefined') {
        try { sessionStorage.setItem('ghl_client_logout_msg', sessionInvalidationMessage(reason)) } catch { /* ignore */ }
      }
    } finally {
      logoutClient().finally(() => {
        setSession(null)
        setClientId(null)
        setGhlId(null)
        setEmailVerified(false)
        if (typeof window !== 'undefined') {
          const path = window.location?.pathname || ''
          if (!path.startsWith('/login') && !path.startsWith('/register')) window.location.href = '/login'
        }
      })
    }
  }, [])
  const extraCheck = useCallback(async () => (await getClientSession()) !== null, [])
  useSessionGuard({ isAuthenticated: !!session, onInvalidated: handleInvalidated, extraCheck })

  return {
    session,
    user: session?.user ?? null,
    clientId,
    ghlId,
    isAuthenticated: !!session,
    emailVerified,
    loading,
    logout,
    refreshSession,
    /** Imperative helper exposed for explicit checks (e.g. tab focus). */
    revalidate: async () => isSessionInvalid(),
  }
}
