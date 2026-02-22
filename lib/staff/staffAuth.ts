/* ================================================================
   STAFF PORTAL — AUTHENTICATION
   ================================================================ */

import type { StaffSession, StaffUser, StaffRole } from './staffTypes'

// ── Demo Users ──────────────────────────────────────────────────
const DEMO_USERS: Record<string, { password: string; staffCode: string; user: StaffUser }> = {
  'cs.lead@ghlindiaventures.com': {
    password: 'GHLCs2025!',
    staffCode: 'GHL001',
    user: {
      id: 'STF-001', email: 'cs.lead@ghlindiaventures.com', name: 'Priya Natarajan',
      role: 'cs-lead', staffCode: 'GHL001', department: 'Customer Service',
      designation: 'Customer Service Lead', phone: '+91 98410 10001',
      reportingTo: 'Abe Thomas', joinDate: '2022-03-15', status: 'active',
    },
  },
  'agent1@ghlindiaventures.com': {
    password: 'GHLAgent2025!',
    staffCode: 'GHL010',
    user: {
      id: 'STF-010', email: 'agent1@ghlindiaventures.com', name: 'Deepa Krishnamurthy',
      role: 'cs-agent', staffCode: 'GHL010', department: 'Customer Service',
      designation: 'CS Agent', phone: '+91 98410 10010',
      reportingTo: 'Priya Natarajan', joinDate: '2023-06-01', status: 'active',
    },
  },
  'rm1@ghlindiaventures.com': {
    password: 'GHLRM2025!',
    staffCode: 'GHL020',
    user: {
      id: 'STF-020', email: 'rm1@ghlindiaventures.com', name: 'Venkatesh Raghavan',
      role: 'relationship-manager', staffCode: 'GHL020', department: 'Client Relations',
      designation: 'Senior Relationship Manager', phone: '+91 98410 10020',
      reportingTo: 'Priya Natarajan', joinDate: '2022-08-10', status: 'active',
    },
  },
  'field.mgr@ghlindiaventures.com': {
    password: 'GHLField2025!',
    staffCode: 'GHL025',
    user: {
      id: 'STF-025', email: 'field.mgr@ghlindiaventures.com', name: 'Arjun Sundaram',
      role: 'field-sales-manager', staffCode: 'GHL025', department: 'Field Sales',
      designation: 'Field Sales Manager', phone: '+91 98410 10025',
      reportingTo: 'Abe Thomas', joinDate: '2023-01-10', status: 'active',
    },
  },
  'field1@ghlindiaventures.com': {
    password: 'GHLSales2025!',
    staffCode: 'GHL026',
    user: {
      id: 'STF-026', email: 'field1@ghlindiaventures.com', name: 'Vikram Selvakumar',
      role: 'field-sales-executive', staffCode: 'GHL026', department: 'Field Sales',
      designation: 'Field Sales Executive', phone: '+91 98410 10026',
      reportingTo: 'Arjun Sundaram', joinDate: '2023-09-01', status: 'active',
    },
  },
  'inspector@ghlindiaventures.com': {
    password: 'GHLSite2025!',
    staffCode: 'GHL027',
    user: {
      id: 'STF-027', email: 'inspector@ghlindiaventures.com', name: 'Karthik Ramachandran',
      role: 'site-inspector', staffCode: 'GHL027', department: 'Field Operations',
      designation: 'Site Inspector', phone: '+91 98410 10027',
      reportingTo: 'Arjun Sundaram', joinDate: '2024-02-15', status: 'active',
    },
  },
  'kyc@ghlindiaventures.com': {
    password: 'GHLKYC2025!',
    staffCode: 'GHL030',
    user: {
      id: 'STF-030', email: 'kyc@ghlindiaventures.com', name: 'Meenakshi Sundari',
      role: 'kyc-officer', staffCode: 'GHL030', department: 'Operations',
      designation: 'KYC Processing Officer', phone: '+91 98410 10030',
      reportingTo: 'Priya Natarajan', joinDate: '2023-11-20', status: 'active',
    },
  },
  'ops@ghlindiaventures.com': {
    password: 'GHLOps2025!',
    staffCode: 'GHL040',
    user: {
      id: 'STF-040', email: 'ops@ghlindiaventures.com', name: 'Rahul Deshpande',
      role: 'operations-executive', staffCode: 'GHL040', department: 'Operations',
      designation: 'Operations Executive', phone: '+91 98410 10040',
      reportingTo: 'Priya Natarajan', joinDate: '2024-01-08', status: 'active',
    },
  },
  'employee@ghlindiaventures.com': {
    password: 'GHLEmp2025!',
    staffCode: 'GHL050',
    user: {
      id: 'STF-050', email: 'employee@ghlindiaventures.com', name: 'Aishwarya Srinivasan',
      role: 'general-employee', staffCode: 'GHL050', department: 'Administration',
      designation: 'Executive Assistant', phone: '+91 98410 10050',
      reportingTo: 'Abe Thomas', joinDate: '2024-04-01', status: 'active',
    },
  },
}

// ── Role Labels & Colors ────────────────────────────────────────
export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  'cs-lead': 'Customer Service Lead',
  'senior-cs-agent': 'Senior CS Agent',
  'cs-agent': 'CS Agent',
  'relationship-manager': 'Relationship Manager',
  'field-sales-manager': 'Field Sales Manager',
  'field-sales-executive': 'Field Sales Executive',
  'site-inspector': 'Site Inspector',
  'kyc-officer': 'KYC Processing Officer',
  'operations-executive': 'Operations Executive',
  'hr-executive': 'HR Executive',
  'general-employee': 'General Employee',
  'intern': 'Intern / Trainee',
}

export const STAFF_ROLE_COLORS: Record<StaffRole, string> = {
  'cs-lead': '#3B82F6',
  'senior-cs-agent': '#6366F1',
  'cs-agent': '#8B5CF6',
  'relationship-manager': '#10B981',
  'field-sales-manager': '#F59E0B',
  'field-sales-executive': '#F97316',
  'site-inspector': '#06B6D4',
  'kyc-officer': '#EC4899',
  'operations-executive': '#64748B',
  'hr-executive': '#14B8A6',
  'general-employee': '#6B7280',
  'intern': '#A78BFA',
}

// ── Auth Functions ──────────────────────────────────────────────
const SESSION_KEY = 'ghl_staff_session'
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours

export function loginStaff(email: string, password: string, staffCode: string): StaffSession | null {
  const entry = DEMO_USERS[email.toLowerCase()]
  if (!entry) return null
  if (entry.password !== password) return null
  if (entry.staffCode !== staffCode) return null

  const session: StaffSession = {
    user: entry.user,
    token: `staff_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    loginAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
  return session
}

export function getStaffSession(): StaffSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session: StaffSession = JSON.parse(raw)
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function logoutStaff(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY)
  }
}
