/* ─────────────────────────────────────────────────────────────
   Dashboard Data Hooks — React hooks wrapping dashboardDataService

   Each hook provides { data, loading, error, refetch }
   Scoped to the logged-in client via clientId parameter.

   FIX: useQuery now accepts a `deps` array so it refetches when
   clientId changes (previously it only depended on `trigger`,
   meaning it fetched once with undefined clientId and never again).
   ───────────────────────────────────────────────────────────── */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import * as svc from './dashboardDataService'

// ── Generic async-data hook ─────────────────────────────────
interface UseQueryResult<T> {
  data: T
  loading: boolean
  error: string | null
  refetch: () => void
}

function useQuery<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  dep?: unknown,
): UseQueryResult<T> {
  const [data, setData] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  // Keep fetcher ref up-to-date so the effect always calls the latest closure
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  // Keep fallback ref stable to avoid stale closures
  const fallbackRef = useRef(fallback)
  fallbackRef.current = fallback

  const refetch = useCallback(() => setTrigger(n => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetcherRef.current()
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err => {
        if (!cancelled) {
          setError(err?.message || 'Unknown error')
          setData(fallbackRef.current)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [trigger, dep]) // fixed-length dependency array

  return { data, loading, error, refetch }
}

// ── Portfolio ───────────────────────────────────────────────
export function usePortfolioAssets(clientId?: string) {
  return useQuery<any[]>(() => svc.fetchPortfolioAssets(clientId), [], clientId)
}

export function useNAVHistory(clientId?: string) {
  return useQuery<any[]>(() => svc.fetchNAVHistory(clientId), [], clientId)
}

export function useAllocation(clientId?: string) {
  return useQuery<any[]>(() => svc.getAllocation(clientId), [], clientId)
}

// ── Transactions ────────────────────────────────────────────
export function useTransactions(clientId?: string) {
  return useQuery<any[]>(() => svc.fetchTransactions(clientId), [], clientId)
}

// ── Messages ────────────────────────────────────────────────
export function useMessages(clientId?: string) {
  return useQuery<any[]>(() => svc.fetchMessages(clientId), [], clientId)
}

// ── Support ─────────────────────────────────────────────────
export function useSupportTickets(clientId?: string) {
  return useQuery<any[]>(() => svc.fetchSupportTickets(clientId), [], clientId)
}

// ── Notifications ───────────────────────────────────────────
export function useNotifications(clientId?: string) {
  return useQuery<any[]>(() => svc.fetchNotifications(clientId), [], clientId)
}

// ── KYC ─────────────────────────────────────────────────────
export function useKYCSteps(clientId?: string) {
  return useQuery<any[]>(() => svc.getKYCSteps(clientId), [], clientId)
}

// ── Documents ───────────────────────────────────────────────
export function useDocuments(clientId?: string) {
  return useQuery<any[]>(() => svc.fetchDocuments(clientId), [], clientId)
}

// ── News ────────────────────────────────────────────────────
export function useAdminNews() {
  return useQuery<any[]>(() => svc.getAdminNews(), [])
}

// ── Assigned RM ─────────────────────────────────────────────
export function useAssignedRM(clientId?: string) {
  return useQuery<{ name: string; designation: string; department: string } | null>(
    () => svc.fetchAssignedRM(clientId),
    null,
    clientId,
  )
}
