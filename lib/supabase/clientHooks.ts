/* ─────────────────────────────────────────────────────────────
   Client Auth Hook — useClientAuth()

   Wraps clientAuthService for React component consumption.
   Uses single getClientSession() fetch on mount.
   ───────────────────────────────────────────────────────────── */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ClientSession } from './clientAuthService'
import { getClientSession, logoutClient } from './clientAuthService'
import { supabase } from './client'

export function useClientAuth() {
  const [session, setSession] = useState<ClientSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState<string | null>(null)

  // Fetch session on mount + resolve actual clients.id
  useEffect(() => {
    let cancelled = false
    getClientSession().then(async (s) => {
      if (cancelled) return
      setSession(s)
      if (s?.user?.id) {
        // Look up the actual clients table row for this auth user
        try {
          const { data } = await supabase.from('clients').select('id').eq('user_id', s.user.id).single() as { data: { id: string } | null }
          if (!cancelled) setClientId(data?.id ?? null)
        } catch {
          if (!cancelled) setClientId(null)
        }
      }
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const logout = useCallback(async () => {
    await logoutClient()
    setSession(null)
    setClientId(null)
  }, [])

  const refreshSession = useCallback(async () => {
    const s = await getClientSession()
    setSession(s)
    if (s?.user?.id) {
      try {
        const { data } = await supabase.from('clients').select('id').eq('user_id', s.user.id).single() as { data: { id: string } | null }
        setClientId(data?.id ?? null)
      } catch { setClientId(null) }
    }
    return s
  }, [])

  return {
    session,
    user: session?.user ?? null,
    clientId,
    isAuthenticated: !!session,
    loading,
    logout,
    refreshSession,
  }
}
