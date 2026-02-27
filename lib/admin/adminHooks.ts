/* ================================================================
   ADMIN COMMAND CENTER — SHARED HOOKS
   ================================================================ */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { AdminSession, AdminRole, Permission } from './adminTypes'
import { getAdminSession, logoutAdmin } from '@/lib/supabase/adminAuthService'
import { hasPermission, hasModuleAccess } from './adminRBAC'
import type { PermissionModule } from './adminTypes'

// ── useAdminAuth ──────────────────────────────────────────────────
export function useAdminAuth() {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminSession().then(s => {
      setSession(s)
      setLoading(false)
    })
  }, [])

  const logout = useCallback(() => {
    logoutAdmin().then(() => setSession(null))
  }, [])

  const refreshSession = useCallback(() => {
    getAdminSession().then(s => setSession(s))
  }, [])

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
export function formatINR(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `${(n / 100000).toFixed(2)} L`
  return new Intl.NumberFormat('en-IN').format(n)
}

// ── formatDate ────────────────────────────────────────────────────
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
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
