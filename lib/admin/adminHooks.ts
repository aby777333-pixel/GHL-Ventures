/* ================================================================
   ADMIN COMMAND CENTER — SHARED HOOKS
   ================================================================ */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { AdminSession, AdminRole, Permission } from './adminTypes'
import { getAdminSession, logoutAdmin } from '@/lib/supabase/adminAuthService'
import { hasPermission, hasModuleAccess } from './adminRBAC'
import { useInactivityLogout } from '@/lib/supabase/inactivityTracker'
import { supabase } from '@/lib/supabase/client'
import type { PermissionModule } from './adminTypes'
import { useSessionGuard, sessionInvalidationMessage, type SessionInvalidationReason } from '@/lib/supabase/sessionGuard'

// ── useAdminAuth ──────────────────────────────────────────────────
export function useAdminAuth() {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getAdminSession().then(s => {
      if (cancelled) return
      setSession(s)
      setLoading(false)
    })

    // Tests 28-04-2026 #1: keep the admin session aligned with token
    // refresh / cross-tab sign-in events so a transient auth-state flip
    // never drops the active admin to /admin/login.
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        if (!cancelled) setSession(null)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        getAdminSession().then(s => { if (!cancelled) setSession(s) })
      }
    })

    return () => {
      cancelled = true
      subscription.subscription?.unsubscribe()
    }
  }, [])

  const logout = useCallback(() => {
    logoutAdmin().then(() => setSession(null))
  }, [])

  // Tests 28-04-2026 #1: idle-only logout. The tracker re-validates the
  // Supabase session before pulling the trigger, so an active admin is
  // never logged out simply because a timer fired.
  useInactivityLogout(() => { logout() }, !!session)

  const refreshSession = useCallback(() => {
    getAdminSession().then(s => setSession(s))
  }, [])

  // Guard the session: auto-logout + redirect when the user no longer
  // exists, the session is revoked, or the portal has been idle > 30min.
  const handleInvalidated = useCallback((reason: SessionInvalidationReason) => {
    try {
      if (typeof window !== 'undefined') {
        try { sessionStorage.setItem('ghl_admin_logout_msg', sessionInvalidationMessage(reason)) } catch { /* ignore */ }
      }
    } finally {
      logoutAdmin().finally(() => {
        setSession(null)
        if (typeof window !== 'undefined') {
          const path = window.location?.pathname || ''
          if (!path.startsWith('/admin/login')) window.location.href = '/admin/login'
        }
      })
    }
  }, [])
  const extraCheck = useCallback(async () => (await getAdminSession()) !== null, [])
  useSessionGuard({ isAuthenticated: !!session, onInvalidated: handleInvalidated, extraCheck })

  return {
    session,
    user: session?.user ?? null,
    role: session?.user?.role ?? null,
    isAuthenticated: !!session,
    loading,
    logout,
    refreshSession,
  }
}

// ── usePermission ─────────────────────────────────────────────────
export function usePermission(permission: Permission): boolean {
  const { role } = useAdminAuth()
  if (!role) return false
  return hasPermission(role, permission)
}

// ── useModuleAccess ───────────────────────────────────────────────
export function useModuleAccess(module: PermissionModule): boolean {
  const { role } = useAdminAuth()
  if (!role) return false
  return hasModuleAccess(role, module)
}

// ── useAdminToast ─────────────────────────────────────────────────
export interface ToastData {
  msg: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export function useAdminToast() {
  const [toast, setToast] = useState<ToastData | null>(null)

  const showToast = useCallback((msg: string, type: ToastData['type'] = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  return { toast, showToast, dismissToast }
}

// ── useAnimatedCounter ────────────────────────────────────────────
export function useAnimatedCounter(end: number, duration = 2000) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setVal(Math.floor(end * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [end, duration])
  return val
}

// ── useCommandPalette ─────────────────────────────────────────────
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return { isOpen, setIsOpen }
}

// ── formatINR ─────────────────────────────────────────────────────
export function formatINR(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '0'
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `${(n / 100000).toFixed(2)} L`
  return new Intl.NumberFormat('en-IN').format(n)
}

// ── formatDate ────────────────────────────────────────────────────
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ── formatTime ────────────────────────────────────────────────────
export function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}
