/* ================================================================
   ADMIN COMMAND CENTER — AUTHENTICATION SYSTEM
   Client-side auth with localStorage (demo), API-ready structure
   ================================================================ */

import type { AdminUser, AdminRole, AdminSession } from './adminTypes'

// ── Demo Admin Users ──────────────────────────────────────────────
export const DEMO_ADMIN_USERS: Record<string, { password: string; user: AdminUser }> = {
  'admin@ghlindiaventures.com': {
    password: 'GHL@dmin2025!',
    user: {
      email: 'admin@ghlindiaventures.com',
      name: 'Abe Thayil',
      role: 'super-admin',
      department: 'Executive',
      phone: '+91 7200 255 252',
    },
  },
  'compliance@ghlindiaventures.com': {
    password: 'GHLComply2025!',
    user: {
      email: 'compliance@ghlindiaventures.com',
      name: 'Meera Subramaniam',
      role: 'compliance-officer',
      department: 'Compliance',
      phone: '+91 44 2843 1050',
    },
  },
  'manager@ghlindiaventures.com': {
    password: 'GHLMgr2025!',
    user: {
      email: 'manager@ghlindiaventures.com',
      name: 'Venkatesh Raghavan',
      role: 'fund-manager',
      department: 'Investments',
      phone: '+91 44 2843 1051',
    },
  },
  'sales@ghlindiaventures.com': {
    password: 'GHLSales2025!',
    user: {
      email: 'sales@ghlindiaventures.com',
      name: 'Priya Natarajan',
      role: 'sales',
      department: 'Sales & Distribution',
      phone: '+91 44 2843 1052',
    },
  },
  'viewer@ghlindiaventures.com': {
    password: 'GHLView2025!',
    user: {
      email: 'viewer@ghlindiaventures.com',
      name: 'Arjun Menon',
      role: 'viewer',
      department: 'External Auditor',
      phone: '+91 44 2843 1060',
    },
  },
  'marketing@ghlindiaventures.com': {
    password: 'GHLMktg2025!',
    user: {
      email: 'marketing@ghlindiaventures.com',
      name: 'Kavya Sharma',
      role: 'marketing-manager',
      department: 'Marketing',
      phone: '+91 44 2843 1070',
    },
  },
  'mktexec@ghlindiaventures.com': {
    password: 'GHLMktEx2025!',
    user: {
      email: 'mktexec@ghlindiaventures.com',
      name: 'Arun Selvam',
      role: 'marketing-executive',
      department: 'Marketing',
      phone: '+91 44 2843 1071',
    },
  },
}

// ── Role Display Labels ───────────────────────────────────────────
export const ROLE_LABELS: Record<AdminRole, string> = {
  'super-admin': 'Super Admin',
  'admin': 'Admin',
  'compliance-officer': 'Compliance Officer',
  'fund-manager': 'Fund Manager',
  'manager': 'Manager',
  'marketing-manager': 'Marketing Manager',
  'marketing-executive': 'Marketing Executive',
  'sales': 'Sales',
  'operations': 'Operations',
  'hr': 'HR',
  'viewer': 'Read-only Viewer',
}

export const ROLE_COLORS: Record<AdminRole, string> = {
  'super-admin': '#DC2626',
  'admin': '#F59E0B',
  'compliance-officer': '#8B5CF6',
  'fund-manager': '#3B82F6',
  'manager': '#10B981',
  'marketing-manager': '#F472B6',
  'marketing-executive': '#FB923C',
  'sales': '#F97316',
  'operations': '#06B6D4',
  'hr': '#EC4899',
  'viewer': '#6B7280',
}

// ── Session Key ───────────────────────────────────────────────────
const SESSION_KEY = 'ghl-admin-session'
const AUDIT_KEY = 'ghl-admin-audit-log'

// ── Auth Functions ────────────────────────────────────────────────
export function authenticateAdmin(email: string, password: string): AdminSession | null {
  const entry = DEMO_ADMIN_USERS[email.toLowerCase()]
  if (!entry) return null
  if (entry.password !== password) return null

  const session: AdminSession = {
    user: entry.user,
    loginAt: Date.now(),
    expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
    device: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : 'Unknown',
  }

  // Store session
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  // Log login event
  logAuditEvent(entry.user.name, 'Login', 'auth', `Successful login as ${ROLE_LABELS[entry.user.role]}`)

  return session
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AdminSession
    // Check expiry
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function logoutAdmin(): void {
  if (typeof window === 'undefined') return
  const session = getAdminSession()
  if (session) {
    logAuditEvent(session.user.name, 'Logout', 'auth', 'Admin logged out')
  }
  localStorage.removeItem(SESSION_KEY)
}

export function isAuthenticated(): boolean {
  return getAdminSession() !== null
}

// ── Audit Logging ─────────────────────────────────────────────────
export function logAuditEvent(userName: string, action: string, module: string, details: string): void {
  if (typeof window === 'undefined') return
  try {
    const log = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]')
    log.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName,
      action,
      module,
      details,
    })
    // Keep last 500 entries
    if (log.length > 500) log.length = 500
    localStorage.setItem(AUDIT_KEY, JSON.stringify(log))
  } catch { /* storage full or unavailable */ }
}

export function getAuditLog() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]')
  } catch {
    return []
  }
}
