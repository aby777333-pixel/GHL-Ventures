'use client'

/**
 * Admin sidebar activity lights (2026-09-07)
 * ------------------------------------------------------------------
 * Polls the table behind each sidebar entry and reports how many rows
 * arrived since this admin last looked at that menu. AdminSidebar turns
 * a non-zero count into a blinking dot beside the menu label.
 *
 * Deliberately dependency-free and additive:
 *  - No schema change, no RLS change, no new tables. "Last seen" lives in
 *    localStorage per browser, so nothing can break server-side.
 *  - Every query is isolated; a missing table, an RLS denial or a network
 *    blip yields 0 for that one menu and never disturbs the others or the
 *    surrounding UI.
 *  - Counts use head:true so Postgres returns a count with no row payload.
 *  - Polling pauses while the tab is hidden and refreshes on focus, so an
 *    idle dashboard costs nothing.
 *
 * First run seeds every marker to "now" — a fresh admin should see the
 * lights start from the moment the feature landed, not a wall of dots for
 * years of history.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

// sidebar item id → source table. Ids match ADMIN_SIDEBAR_ITEMS in adminConstants.
// Only tables verified to exist with a created_at column are listed; adding a
// new one is a one-line change here.
export const ACTIVITY_SOURCES: Record<string, { table: string; timeColumn: string }> = {
  users: { table: 'clients', timeColumn: 'created_at' },
  investment: { table: 'investment_applications', timeColumn: 'created_at' },
  kyc: { table: 'kyc_documents', timeColumn: 'created_at' },
  documents: { table: 'documents', timeColumn: 'created_at' },
  'finance-payout': { table: 'monthly_payouts', timeColumn: 'created_at' },
  referral: { table: 'referrals', timeColumn: 'created_at' },
  contact: { table: 'contact_submissions', timeColumn: 'created_at' },
  'support-ticket': { table: 'tickets', timeColumn: 'created_at' },
  blog: { table: 'blog_comments', timeColumn: 'created_at' },
  employee: { table: 'leave_requests', timeColumn: 'created_at' },
  leads: { table: 'leads', timeColumn: 'created_at' },
  notification: { table: 'messages', timeColumn: 'created_at' },
}

const STORAGE_PREFIX = 'ghl.admin.activitySeen.v1.'
const POLL_MS = 45_000

function readSeen(id: string): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_PREFIX + id)
    if (existing) return existing
    const now = new Date().toISOString()
    window.localStorage.setItem(STORAGE_PREFIX + id, now)
    return now
  } catch {
    // Private mode / storage disabled — fall back to "now" so we simply
    // never light up rather than flooding the sidebar.
    return new Date().toISOString()
  }
}

function writeSeen(id: string, iso: string) {
  try { window.localStorage.setItem(STORAGE_PREFIX + id, iso) } catch { /* ignore */ }
}

export function useAdminActivity() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured() || typeof window === 'undefined') return

    const ids = Object.keys(ACTIVITY_SOURCES)
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const src = ACTIVITY_SOURCES[id]
        const since = readSeen(id)
        const { count, error } = await (supabase as any)
          .from(src.table)
          .select('id', { count: 'exact', head: true })
          .gt(src.timeColumn, since)
        if (error) throw error
        return { id, count: count || 0 }
      })
    )

    if (!mounted.current) return
    const next: Record<string, number> = {}
    results.forEach((r, i) => {
      // A rejected probe (missing table, RLS denial, offline) simply
      // contributes no light — it must never break the sidebar.
      next[ids[i]] = r.status === 'fulfilled' ? r.value.count : 0
    })
    setCounts(next)
  }, [])

  // Clear one menu's light and remember the moment it was cleared.
  const markSeen = useCallback((id: string) => {
    if (!ACTIVITY_SOURCES[id]) return
    writeSeen(id, new Date().toISOString())
    setCounts(prev => (prev[id] ? { ...prev, [id]: 0 } : prev))
  }, [])

  useEffect(() => {
    mounted.current = true
    let timer: ReturnType<typeof setInterval> | null = null

    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      refresh().catch(() => { /* never surface */ })
    }

    tick()
    timer = setInterval(tick, POLL_MS)

    const onVisible = () => { if (document.visibilityState === 'visible') tick() }
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      mounted.current = false
      if (timer) clearInterval(timer)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  return { activityCounts: counts, markActivitySeen: markSeen, refreshActivity: refresh }
}
