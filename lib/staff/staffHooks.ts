/* ================================================================
   STAFF PORTAL — SHARED HOOKS
   ================================================================ */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { StaffSession, StaffRole, AgentStatus } from './staffTypes'
import { getStaffSession, logoutStaff } from './staffAuth'

// ── useStaffAuth ────────────────────────────────────────────────
export function useStaffAuth() {
  const [session, setSession] = useState<StaffSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = getStaffSession()
    setSession(s)
    setLoading(false)
  }, [])

  const logout = useCallback(() => {
    logoutStaff()
    setSession(null)
  }, [])

  const refreshSession = useCallback(() => {
    setSession(getStaffSession())
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

// ── useStaffToast ───────────────────────────────────────────────
export function useStaffToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  return { toast, showToast, dismissToast }
}

// ── useAgentStatus ──────────────────────────────────────────────
export function useAgentStatus() {
  const [status, setStatus] = useState<AgentStatus>('offline')

  useEffect(() => {
    const saved = localStorage.getItem('ghl_agent_status')
    if (saved) setStatus(saved as AgentStatus)
  }, [])

  const updateStatus = useCallback((newStatus: AgentStatus) => {
    setStatus(newStatus)
    localStorage.setItem('ghl_agent_status', newStatus)
  }, [])

  return { status, updateStatus }
}

// ── useClock ────────────────────────────────────────────────────
export function useClock() {
  const [clockedIn, setClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [onBreak, setOnBreak] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('ghl_clock_in')
    if (saved) {
      const time = new Date(saved)
      setClockedIn(true)
      setClockInTime(time)
    }
  }, [])

  useEffect(() => {
    if (!clockedIn || !clockInTime || onBreak) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - clockInTime.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [clockedIn, clockInTime, onBreak])

  const clockIn = useCallback(() => {
    const now = new Date()
    setClockedIn(true)
    setClockInTime(now)
    localStorage.setItem('ghl_clock_in', now.toISOString())
  }, [])

  const clockOut = useCallback(() => {
    setClockedIn(false)
    setClockInTime(null)
    setElapsed(0)
    localStorage.removeItem('ghl_clock_in')
  }, [])

  const toggleBreak = useCallback(() => {
    setOnBreak(prev => !prev)
  }, [])

  return { clockedIn, clockInTime, elapsed, onBreak, clockIn, clockOut, toggleBreak }
}

// ── Format Helpers ──────────────────────────────────────────────
export function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`
  return `₹${new Intl.NumberFormat('en-IN').format(n)}`
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
