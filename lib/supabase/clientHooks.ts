/* ─────────────────────────────────────────────────────────────
   Client Auth Hook — useClientAuth()

   Follows the same pattern as adminHooks.ts / staffHooks.ts.
   Wraps clientAuthService for React component consumption.
   ───────────────────────────────────────────────────────────── */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ClientSession, ClientUser } from './clientAuthService'
import { getClientSession, logoutClient } from './clientAuthService'

export function useClientAuth() {
  const [session, setSession] = useState<ClientSession | null>(null)
  const [loading, setLoading] = useState(true)

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
