/* ================================================================
   GHL INTELLIGENCE OS — UNIFIED REPORTS DATA LAYER
   Comprehensive simulated data engine for the Reports module.
   All data stored in LocalStorage, initialized with realistic seed data.
   ================================================================ */

import type {
  AIInsight, RevenueStream, ExpenseRecord, CampaignMetric,
  ScheduledReport, GeneratedReport, EmailDraft, CallLog,
  DocumentVaultItem, KPIAlert,
} from './adminTypes'

// ═══════════════════════════════════════════════════════════════
// USERS & STAFF
// ═══════════════════════════════════════════════════════════════

export interface ReportUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  portal: string
  department?: string
  status: 'active' | 'inactive'
}

export const REPORT_USERS: ReportUser[] = []

// ═══════════════════════════════════════════════════════════════
// CLIENTS (HNI / UHNI Investors)
// ═══════════════════════════════════════════════════════════════

export interface ReportClient {
  id: string
  name: string
  email: string
  phone: string
  tier: 1 | 2 | 3 | 4 | 5
  investmentAmount: number
  currentValue: number
  source: string
  assignedStaff: string
  city: string
  status: 'active' | 'dormant' | 'churned'
  joinedDate: string
  lastActive: string
}

export const REPORT_CLIENTS: ReportClient[] = []

// ═══════════════════════════════════════════════════════════════
// REVENUE STREAMS (12 months)
// ═══════════════════════════════════════════════════════════════

export const REVENUE_STREAMS: RevenueStream[] = []

// Monthly summary for charts
export const MONTHLY_REVENUE: { month: string; revenue: number; expenses: number }[] = []

export const REVENUE_BY_TYPE: { type: string; amount: number; percentage: number }[] = []

export const REVENUE_BY_CITY: { city: string; amount: number; clients: number }[] = []

// ═══════════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════════

export const EXPENSE_RECORDS: ExpenseRecord[] = []

export const EXPENSE_SUMMARY: { category: string; amount: number; budget: number; percentage: number }[] = []

// ═══════════════════════════════════════════════════════════════
// CAMPAIGNS
// ═══════════════════════════════════════════════════════════════

export const CAMPAIGN_METRICS: CampaignMetric[] = []

// ═══════════════════════════════════════════════════════════════
// LEADS
// ═══════════════════════════════════════════════════════════════

export interface ReportLead {
  id: string
  name: string
  email: string
  phone: string
  source: string
  campaignId?: string
  status: 'new' | 'contacted' | 'qualified' | 'pitched' | 'negotiating' | 'won' | 'lost'
  score: number
  city: string
  estimatedValue: number
  createdAt: string
}

export const REPORT_LEADS: ReportLead[] = []

// Funnel data
export const LEAD_FUNNEL: { stage: string; count: number; percentage: number }[] = []

// ═══════════════════════════════════════════════════════════════
// KPIs
// ═══════════════════════════════════════════════════════════════

export const REPORT_KPIS = {
  totalAUM: 0,
  totalAUMChange: 0,
  totalClients: 0,
  activeClients: 0,
  newClientsMonth: 0,
  retentionRate: 0,
  monthlyRevenue: 0,
  revenueChange: 0,
  monthlyExpenses: 0,
  expenseChange: 0,
  netProfit: 0,
  profitMargin: 0,
  cac: 0,
  ltv: 0,
  ltvCacRatio: 0,
  leadConversionRate: 0,
  staffProductivityScore: 0,
  nps: 0,
  burnRate: 0,
  cashRunway: 0,
  websiteVisitors: 0,
  websiteVisitorsChange: 0,
  bounceRate: 0,
  avgSessionDuration: '-',
  aiHealthScore: 0,
}

// ═══════════════════════════════════════════════════════════════
// AI INSIGHTS
// ═══════════════════════════════════════════════════════════════

export const AI_INSIGHTS: AIInsight[] = []

// ═══════════════════════════════════════════════════════════════
// SCHEDULED & GENERATED REPORTS
// ═══════════════════════════════════════════════════════════════

export const SCHEDULED_REPORTS: ScheduledReport[] = []

export const GENERATED_REPORTS: GeneratedReport[] = []

// ═══════════════════════════════════════════════════════════════
// STAFF ACTIVITY
// ═══════════════════════════════════════════════════════════════

export interface StaffActivityItem {
  id: string
  staffId: string
  staffName: string
  action: string
  entity: string
  portal: string
  timestamp: string
}

export const STAFF_ACTIVITY: StaffActivityItem[] = []

// ═══════════════════════════════════════════════════════════════
// WEBSITE ANALYTICS (Simulated GA4)
// ═══════════════════════════════════════════════════════════════

export const WEBSITE_TRAFFIC: { month: string; visitors: number; unique: number; pageviews: number }[] = []

export const TRAFFIC_SOURCES: { source: string; visitors: number; percentage: number }[] = []

export const TOP_PAGES: { page: string; title: string; views: number; avgTime: string; bounceRate: number }[] = []

// ═══════════════════════════════════════════════════════════════
// FORECASTS
// ═══════════════════════════════════════════════════════════════

export const REVENUE_FORECAST: { month: string; projected: number; lower: number; upper: number }[] = []

export const AUM_FORECAST: { current: number; projectedGrowth: number; target: number; timeline: { month: string; aum: number }[] } = {
  current: 0,
  projectedGrowth: 0,
  target: 0,
  timeline: [],
}

// ═══════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════

export const EMAIL_TEMPLATES: { id: string; name: string; subject: string; category: string }[] = []

// ═══════════════════════════════════════════════════════════════
// CALL LOGS
// ═══════════════════════════════════════════════════════════════

export const CALL_LOGS: CallLog[] = []

// ═══════════════════════════════════════════════════════════════
// DOCUMENT VAULT
// ═══════════════════════════════════════════════════════════════

export const DOCUMENT_VAULT: DocumentVaultItem[] = []

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/** Format number in Indian notation (lakhs/crores) */
export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount.toLocaleString('en-IN')}`
}

/** Format full INR */
export function formatINRFull(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

/** Calculate totals from revenue array by period */
export function getTotalRevenueByPeriod(period: string): number {
  return REVENUE_STREAMS.filter(r => r.period === period).reduce((sum, r) => sum + r.amount, 0)
}

/** Calculate total expenses by period */
export function getTotalExpensesByMonth(month: string): number {
  return EXPENSE_RECORDS.filter(e => e.month === month).reduce((sum, e) => sum + e.amount, 0)
}

/** Get client tier label */
export function getTierLabel(tier: number): string {
  const labels: Record<number, string> = {
    1: '₹25L - ₹1Cr',
    2: '₹1Cr - ₹5Cr',
    3: '₹5Cr - ₹15Cr',
    4: '₹15Cr - ₹25Cr',
    5: '₹25Cr+',
  }
  return labels[tier] || 'Unknown'
}

/** Get clients by tier */
export function getClientsByTier(): { tier: number; label: string; count: number; totalInvestment: number }[] {
  const tiers = [1, 2, 3, 4, 5]
  return tiers.map(tier => ({
    tier,
    label: getTierLabel(tier),
    count: REPORT_CLIENTS.filter(c => c.tier === tier).length,
    totalInvestment: REPORT_CLIENTS.filter(c => c.tier === tier).reduce((sum, c) => sum + c.investmentAmount, 0),
  }))
}

/** Cross-portal data sync via LocalStorage events */
export function publishSync(entity: string, action: string, data: unknown): void {
  // BACKEND_HOOK: Replace with WebSocket or SSE for real-time sync
  if (typeof window !== 'undefined') {
    const sync = { entity, action, data, timestamp: Date.now(), source: 'reports' }
    localStorage.setItem('ghl_data_sync', JSON.stringify(sync))
  }
}

/** Listen for cross-portal sync events */
export function onSync(callback: (update: { entity: string; action: string; data: unknown }) => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === 'ghl_data_sync' && e.newValue) {
      try {
        callback(JSON.parse(e.newValue))
      } catch { /* ignore */ }
    }
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
