/* ─────────────────────────────────────────────────────────────
   Admin Data Hooks — React hooks wrapping adminDataService

   Each hook provides { data, loading, error, refetch } so modules
   can swap from direct mock-data imports to reactive queries.
   ───────────────────────────────────────────────────────────── */

'use client'

import { useState, useEffect, useCallback } from 'react'
import * as svc from './adminDataService'

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
      .then(result => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err?.message || 'Unknown error')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [trigger]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch }
}

// ── Overview (synchronous — no loading state needed) ────────
export function useOverviewKPIs() {
  return { data: svc.getOverviewKPIs(), loading: false, error: null, refetch: () => {} }
}
export function useAUMGrowth() {
  return { data: svc.getAUMGrowth(), loading: false, error: null, refetch: () => {} }
}
export function useRevenueBreakdown() {
  return { data: svc.getRevenueBreakdown(), loading: false, error: null, refetch: () => {} }
}
export function useSystemHealth() {
  return { data: svc.getSystemHealth(), loading: false, error: null, refetch: () => {} }
}

// ── Clients ─────────────────────────────────────────────────
export function useClients() {
  return useQuery(() => svc.fetchClients(), [])
}
export function useKYCDocuments() {
  return useQuery(() => svc.fetchKYCDocuments(), [])
}

// ── Leads ───────────────────────────────────────────────────
export function useLeads() {
  return useQuery(() => svc.fetchLeads(), [])
}

// ── Employees ───────────────────────────────────────────────
export function useEmployees() {
  return useQuery(() => svc.fetchEmployees(), [])
}

// ── Compliance ──────────────────────────────────────────────
export function useApprovals() {
  return useQuery(() => svc.fetchApprovals(), [])
}
export function useRiskFlags() {
  return useQuery(() => svc.fetchRiskFlags(), [])
}
export function useAuditLog() {
  return useQuery(() => svc.fetchAuditLog(), [])
}

// ── Finance ─────────────────────────────────────────────────
export function useInvoices() {
  return useQuery(() => svc.fetchInvoices(), [])
}
export function useExpenses() {
  return useQuery(() => svc.fetchExpenses(), [])
}
export function useCommissions() {
  return useQuery(() => svc.fetchCommissions(), [])
}

// ── Assets ──────────────────────────────────────────────────
export function useAssets() {
  return useQuery(() => svc.fetchAssets(), [])
}

// ── Realty Brokers ──────────────────────────────────────────
export function useRealtyBrokers() {
  return useQuery(() => svc.fetchRealtyBrokers(), [])
}
export function useBrokerInquiries() {
  return useQuery(() => svc.fetchBrokerInquiries(), [])
}

// ── Notifications ───────────────────────────────────────────
export function useNotifications() {
  return useQuery(() => svc.fetchNotifications(), [])
}

// ── AI Tools (synchronous) ─────────────────────────────────
export function useAITools() {
  return { data: svc.getAITools(), loading: false, error: null, refetch: () => {} }
}

// ── Marketing ───────────────────────────────────────────────
export function useMarketingCampaigns() {
  return useQuery(() => svc.fetchMarketingCampaigns(), [])
}
export function useMarketingContent() {
  return { data: svc.getMarketingContent(), loading: false, error: null, refetch: () => {} }
}
export function useMarketingAudiences() {
  return { data: svc.getMarketingAudiences(), loading: false, error: null, refetch: () => {} }
}
export function useMarketingSequences() {
  return { data: svc.getMarketingSequences(), loading: false, error: null, refetch: () => {} }
}
export function useMarketingChannels() {
  return { data: svc.getMarketingChannels(), loading: false, error: null, refetch: () => {} }
}
export function useMarketingAITools() {
  return { data: svc.getMarketingAITools(), loading: false, error: null, refetch: () => {} }
}
export function useMarketingIntegrations() {
  return { data: svc.getMarketingIntegrations(), loading: false, error: null, refetch: () => {} }
}

// ── Blog ────────────────────────────────────────────────────
export function useBlogPosts(publishedOnly = false) {
  return useQuery(() => svc.fetchBlogPosts(publishedOnly), [])
}

// ── Tickets ─────────────────────────────────────────────────
export function useTickets() {
  return useQuery(() => svc.fetchTickets(), [])
}

// ── Tasks ───────────────────────────────────────────────────
export function useTasks() {
  return useQuery(() => svc.fetchTasks(), [])
}

// ── Documents ───────────────────────────────────────────────
export function useDocuments() {
  return useQuery(() => svc.fetchDocuments(), [])
}

// ── Mutation hooks ──────────────────────────────────────────
export function useMutation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const insert = useCallback(async (table: string, row: Record<string, any>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await svc.insertRow(table, row)
      return result
    } catch (e: any) {
      setError(e?.message || 'Insert failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const update = useCallback(async (table: string, id: string, updates: Record<string, any>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await svc.updateRow(table, id, updates)
      return result
    } catch (e: any) {
      setError(e?.message || 'Update failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const remove = useCallback(async (table: string, id: string) => {
    setLoading(true)
    setError(null)
    try {
      return await svc.deleteRow(table, id)
    } catch (e: any) {
      setError(e?.message || 'Delete failed')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { insert, update, remove, loading, error }
}
