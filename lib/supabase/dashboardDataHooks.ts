/* ─────────────────────────────────────────────────────────────
   Dashboard Data Hooks — React hooks wrapping dashboardDataService

   Each hook provides { data, loading, error, refetch }
   Scoped to the logged-in client via clientId parameter.
   ───────────────────────────────────────────────────────────── */

'use client'

import { useState, useEffect, useCallback } from 'react'
import * as svc from './dashboardDataService'

// ── Generic async-data hook ─────────────────────────────────
interface UseQueryResult<T> {
  data: T
  loading: boolean
  error: string | null
  refetch: () => void
}

function useQuery<T>(fetcher: () => Promise<T>, fallback: T): UseQueryResult<T> {
  const [data, setData] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger(n => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetcher()
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err => {
        if (!cancelled) {
          setError(err?.message || 'Unknown error')
          setData(fallback)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [trigger]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch }
}

// ── Portfolio ───────────────────────────────────────────────
export function usePortfolioAssets(clientId?: string) {
  return useQuery<any[]>(() => svc.fetchPortfolioAssets(clientId), [])
}

export function useNAVHistory(clientId?: string) {
  return useQuery<any[]>(() => svc.fetchNAVHistory(clientId), [])
}

export function useAllocation(clientId?: string) {
  return useQuery<any[]>(() => svc.getAllocation(clientId), [])
}

// ── Transactions ────────────────────────────────────────────
export function useTransactions(clientId?: string) {
  return useQuery<any[]>(() => svc.fetchTransactions(clientId), [])
}

// ── Messages ────────────────────────────────────────────────
export function useMessages(clientId?: string) {
  return useQuery<any[]>(() => svc.fetchMessages(clientId), [])
}

// ── Support ─────────────────────────────────────────────────
export function useSupportTickets(clientId?: string) {
  return useQuery<any[]>(() => svc.fetchSupportTickets(clientId), [])
}

// ── Notifications ───────────────────────────────────────────
export function useNotifications(clientId?: string) {
  return useQuery<any[]>(() => svc.fetchNotifications(clientId), [])
}

// ── KYC ─────────────────────────────────────────────────────
export function useKYCSteps(clientId?: string) {
  return useQuery<any[]>(() => svc.getKYCSteps(clientId), [])
}

// ── Documents ───────────────────────────────────────────────
export function useDocuments(clientId?: string) {
  return useQuery<any[]>(() => svc.fetchDocuments(clientId), [])
}

// ── News ────────────────────────────────────────────────────
export function useAdminNews() {
  return useQuery<any[]>(() => svc.getAdminNews(), [])
}
