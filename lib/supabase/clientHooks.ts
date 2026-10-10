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
  // Investor Dashboard Correction #8: admins need to open a live investor's
  // dashboard to debug their issues. `?as=<clientId>` switches the data
  // context to that client, but ONLY after the signed-in user is confirmed
  // to hold an admin role in `profiles`. Everyone else is ignored outright.
  const [impersonating, setImpersonating] = useState<{ clientId: string; name: string } | null>(null)

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

      // ── Admin view-as override ──────────────────────────────
      try {
        // The ?as= param only appears on the first page the admin opens.
        // Persist it for the tab so every dashboard route (Portfolio, KYC,
        // Profile, …) keeps the same investor context; closing the tab ends
        // the view-as session.
        const AS_KEY = 'ghl_admin_view_as'
        let asId: string | null = null
        if (typeof window !== 'undefined') {
          const fromUrl = new URLSearchParams(window.location.search).get('as')
          if (fromUrl) {
            try { sessionStorage.setItem(AS_KEY, fromUrl) } catch { /* ignore */ }
            asId = fromUrl
          } else {
            try { asId = sessionStorage.getItem(AS_KEY) } catch { asId = null }
          }
        }
        if (asId) {
          const { data: prof } = await supabase
            .from('profiles').select('role').eq('id', s.user.id).maybeSingle() as { data: { role?: string } | null }
          const role = (prof?.role || '').toLowerCase()
          if (['admin', 'super_admin', 'superadmin'].includes(role)) {
            const { data: target } = await supabase
              .from('clients').select('id, ghl_id, full_name, email, phone, created_at, kyc_status, kyc_rejection_reason, kyc_rejected_at, risk_profile').eq('id', asId).maybeSingle() as { data: any }
            if (target?.id && !cancelledRef?.cancelled) {
              setClientId(target.id)
              setGhlId(target.ghl_id ?? null)
              setImpersonating({ clientId: target.id, name: target.full_name || target.ghl_id || 'Investor' })
              // Overlay the viewed investor's identity onto the session user so
              // the greeting, GHL ID and contact details show THEM, not the
              // admin who opened the view.
              setSession(prev => (prev ? {
                ...prev,
                user: {
                  ...prev.user,
                  name: target.full_name || prev.user.name,
                  full_name: target.full_name || (prev.user as any).full_name,
                  email: target.email || prev.user.email,
                  phone: target.phone ?? (prev.user as any).phone,
                  created_at: target.created_at ?? (prev.user as any).created_at,
                  kyc_status: String(target.kyc_status || 'pending'),
                  kyc_rejection_reason: target.kyc_rejection_reason || null,
                  kyc_rejected_at: target.kyc_rejected_at || null,
                  account_status: 'active',
                  risk_profile: target.risk_profile ? String(target.risk_profile) : null,
                } as any,
              } : prev))
            }
          } else if (!cancelledRef?.cancelled) {
            try { sessionStorage.removeItem(AS_KEY) } catch { /* ignore */ }
            setImpersonating(null)
          }
        } else if (!cancelledRef?.cancelled) {
          setImpersonating(null)
        }
      } catch { if (!cancelledRef?.cancelled) setImpersonating(null) }
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
          setImpersonating(null)
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
    setImpersonating(null)
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
    /** Non-null when an admin is viewing another client's dashboard. */
    impersonating,
    loading,
    logout,
    refreshSession,
    /** Imperative helper exposed for explicit checks (e.g. tab focus). */
    revalidate: async () => isSessionInvalid(),
  }
}
