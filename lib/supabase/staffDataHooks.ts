/* ─────────────────────────────────────────────────────────────
   Staff Data Hooks — React hooks wrapping staffDataService

   Each hook provides { data, loading, error, refetch }

   FIX: useQuery now accepts a `deps` array so it refetches when
   staffId / assignedTo changes (same stale-closure fix as dashboard).
   ───────────────────────────────────────────────────────────── */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import * as svc from './staffDataService'

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
  deps: unknown[] = [],
): UseQueryResult<T> {
  const [data, setData] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const refetch = useCallback(() => setTrigger(n => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetcherRef.current()
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err?.message || 'Unknown error'); setLoading(false) } })

    return () => { cancelled = true }
  }, [trigger, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch }
}

// ── Staff Directory ─────────────────────────────────────────
export function useStaffEmployees() {
  return useQuery(() => svc.fetchStaffEmployees(), [])
}

// ── HR / Employee Self-Service ──────────────────────────────
export function useMyAttendance(staffId?: string) {
  return useQuery(() => svc.fetchMyAttendance(staffId), [], [staffId])
}
export function useMyLeaveBalances() {
  return { data: svc.getMyLeaveBalances(), loading: false, error: null, refetch: () => {} }
}
export function useMyLeaveHistory(staffId?: string) {
  return useQuery(() => svc.fetchMyLeaveHistory(staffId), [], [staffId])
}
export function useMyPayslips(staffId?: string) {
  return useQuery(() => svc.fetchMyPayslips(staffId), [], [staffId])
}

// ── Customer Service ────────────────────────────────────────
export function useCSKPIs() {
  return { data: svc.getCSKPIs(), loading: false, error: null, refetch: () => {} }
}
export function useTickets(assignedTo?: string) {
  return useQuery(() => svc.fetchTickets(assignedTo), [], [assignedTo])
}
export function useClientInteractions(staffId?: string) {
  return useQuery(() => svc.fetchClientInteractions(staffId), [], [staffId])
}
export function useQueueData() {
  return { data: svc.getQueueData(), loading: false, error: null, refetch: () => {} }
}

// ── Tasks ───────────────────────────────────────────────────
export function useTasks(assignedTo?: string) {
  return useQuery(() => svc.fetchTasks(assignedTo), [], [assignedTo])
}

// ── Field Operations ────────────────────────────────────────
export function useFieldCheckins(staffId?: string) {
  return useQuery(() => svc.fetchFieldCheckins(staffId), [], [staffId])
}
export function useSiteVisits(staffId?: string) {
  return useQuery(() => svc.fetchSiteVisits(staffId), [], [staffId])
}
export function useFieldProspects() {
  return { data: svc.getFieldProspects(), loading: false, error: null, refetch: () => {} }
}
export function useFieldExpenses() {
  return { data: svc.getFieldExpenses(), loading: false, error: null, refetch: () => {} }
}

// ── AI Tools ────────────────────────────────────────────────
export function useStaffAITools() {
  return { data: svc.getStaffAITools(), loading: false, error: null, refetch: () => {} }
}

// ── Knowledge Base & Training ───────────────────────────────
export function useKBArticles() {
  return useQuery(() => svc.fetchKBArticles(), [])
}
export function useAnnouncements() {
  return useQuery(() => svc.fetchAnnouncements(), [])
}
export function useTrainingModules() {
  return { data: svc.getTrainingModules(), loading: false, error: null, refetch: () => {} }
}
export function useDailyQuotes() {
  return { data: svc.getDailyQuotes(), loading: false, error: null, refetch: () => {} }
}

// ── Notifications ───────────────────────────────────────────
export function useStaffNotifications(staffId?: string) {
  return useQuery(() => svc.fetchStaffNotifications(staffId), [], [staffId])
}
