/* ─────────────────────────────────────────────────────────────
   Client Auth Hook — useClientAuth()

   Wraps clientAuthService for React component consumption.
   Includes onAuthStateChange listener for session sync.
   ───────────────────────────────────────────────────────────── */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ClientSession, ClientUser } from './clientAuthService'
import { getClientSession, logoutClient } from './clientAuthService'
import { supabase, isSupabaseConfigured } from './client'

export function useClientAuth() {
  const [session, setSession] = useState<ClientSession | null>(null)
  const [loading, setLoading] = useState(true)

  // Initial session fetch
  useEffect(() => {
    let cancelled = false
    getClientSession().then(s => {
      if (!cancelled) {
        setSession(s)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  // Listen for auth state changes (handles session refresh, cross-tab sync, OAuth)
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Re-fetch full client session when auth state changes
          const s = await getClientSession()
          setSession(s)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setLoading(false)
        }
      }
    )
    return () => { subscription.unsubscribe() }
  }, [])

  const logout = useCallback(async () => {
    await logoutClient()
    setSession(null)
  }, [])

  const refreshSession = useCallback(async () => {
    const s = await getClientSession()
    setSession(s)
  }, [])

  return {
    session,
    user: session?.user ?? null,
    clientId: session?.user?.id ?? null,
    isAuthenticated: !!session,
    loading,
    logout,
    refreshSession,
  }
}
