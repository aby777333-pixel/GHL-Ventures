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
  avgSessionDuration: '—',
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

export const AUM_FORECAST = {
  current: 0,
  projectedGrowth: 0,
  target: 0,
  timeline: [] as { month: string; aum: number }[],
}

// ═══════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════

// Pending 30-04-2026 (follow-up): each template now ships a default
// body with merge-tag fillers so the Emailer can populate the composer
// in one click. `mergeTags` is the set of placeholders the body uses,
// surfaced by the EmailerTab as quick-insert chips when a template is
// selected. Replace tokens server-side at send time, or by hand in the
// composer before clicking Send.
export type EmailTemplate = {
  id: string
  name: string
  subject: string
  category: string
  body: string
  mergeTags: string[]
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'TPL001',
    name: 'Monthly Performance Update',
    subject: 'GHL India Ventures — {{month}} Performance Update',
    category: 'investor',
    mergeTags: ['{{client_name}}', '{{month}}', '{{portfolio_value}}', '{{monthly_return_pct}}', '{{ytd_return_pct}}', '{{net_payout}}', '{{next_payout_date}}'],
    body: `Dear {{client_name}},

Greetings from GHL India Ventures.

Please find below your portfolio performance summary for {{month}}:

  • Portfolio value (as of month-end): ₹{{portfolio_value}}
  • Monthly return: {{monthly_return_pct}}%
  • Year-to-date return: {{ytd_return_pct}}%
  • Net interest credited this month: ₹{{net_payout}}
  • Next scheduled payout: {{next_payout_date}}

Detailed performance and tax breakups are attached for your records.

Should you have any queries, please reply to this email or reach out to your relationship manager.

Warm regards,
GHL India Ventures
SEBI Registered Category II AIF`,
  },
  {
    id: 'TPL002',
    name: 'Quarterly NAV Report',
    subject: 'Q{{quarter}} NAV Report — GHL India Ventures AIF',
    category: 'investor',
    mergeTags: ['{{client_name}}', '{{quarter}}', '{{fy}}', '{{nav_per_unit}}', '{{units_held}}', '{{total_value}}', '{{quarterly_return_pct}}'],
    body: `Dear {{client_name}},

The NAV Statement for Q{{quarter}} FY{{fy}} is attached.

Quick highlights:

  • NAV per unit (close of quarter): ₹{{nav_per_unit}}
  • Units held: {{units_held}}
  • Total holding value: ₹{{total_value}}
  • Quarterly return: {{quarterly_return_pct}}%

The attached PDF contains the full NAV computation, fund-level performance, and the auditor-signed quarterly disclosure.

Please reach out if you would like a portfolio review.

Warm regards,
GHL India Ventures`,
  },
  {
    id: 'TPL003',
    name: 'New Opportunity Alert',
    subject: 'Exclusive: New Investment Opportunity — {{fund_name}}',
    category: 'marketing',
    mergeTags: ['{{client_name}}', '{{fund_name}}', '{{min_ticket}}', '{{target_irr}}', '{{tenure}}', '{{deadline}}', '{{rm_name}}'],
    body: `Dear {{client_name}},

We are pleased to share an exclusive new opportunity available to our priority investors.

  • Vehicle: {{fund_name}}
  • Minimum ticket: ₹{{min_ticket}}
  • Target IRR: {{target_irr}}%
  • Tenure: {{tenure}}
  • Subscription closes: {{deadline}}

The full term sheet is attached. Allocations are on a first-come basis. To express interest, please reply to this email or contact {{rm_name}} directly.

Best regards,
GHL India Ventures`,
  },
  {
    id: 'TPL004',
    name: 'Compliance Notice',
    subject: 'Important: Compliance Update — {{notice_type}}',
    category: 'compliance',
    mergeTags: ['{{client_name}}', '{{notice_type}}', '{{effective_date}}', '{{action_required}}', '{{deadline}}'],
    body: `Dear {{client_name}},

This is to bring to your attention an important compliance update concerning your investment with GHL India Ventures.

  • Notice: {{notice_type}}
  • Effective date: {{effective_date}}
  • Action required: {{action_required}}
  • Response deadline: {{deadline}}

The detailed circular is attached. Please review at the earliest. Failure to act within the deadline may attract regulatory consequences.

For any clarifications, please reach out to compliance@ghlindiaventures.com.

Regards,
Compliance Desk
GHL India Ventures`,
  },
  {
    id: 'TPL005',
    name: 'Event Invitation',
    subject: 'You\'re Invited: {{event_name}} — GHL India Ventures',
    category: 'marketing',
    mergeTags: ['{{client_name}}', '{{event_name}}', '{{event_date}}', '{{event_time}}', '{{event_venue}}', '{{rsvp_link}}'],
    body: `Dear {{client_name}},

You are cordially invited to {{event_name}}, hosted by GHL India Ventures.

  • Date: {{event_date}}
  • Time: {{event_time}}
  • Venue: {{event_venue}}

The agenda + speaker line-up are attached. Please confirm your attendance via the RSVP link below:

{{rsvp_link}}

We look forward to hosting you.

Warm regards,
GHL India Ventures`,
  },
  {
    id: 'TPL006',
    name: 'Welcome Email',
    subject: 'Welcome to GHL India Ventures, {{client_name}}!',
    category: 'onboarding',
    mergeTags: ['{{client_name}}', '{{ghl_id}}', '{{rm_name}}', '{{rm_email}}', '{{rm_phone}}', '{{login_url}}'],
    body: `Dear {{client_name}},

Welcome to GHL India Ventures — we're delighted to have you on board.

Your investor profile is now active:

  • GHL ID: {{ghl_id}}
  • Relationship Manager: {{rm_name}}
  • RM email: {{rm_email}}
  • RM phone: {{rm_phone}}

You can sign in to the investor portal anytime at {{login_url}} to track your investments, payouts, and documents.

A welcome kit (KYC checklist, fund overview, FAQs) is attached for your reference.

If you have any questions getting started, please reach out to {{rm_name}}.

Warm regards,
GHL India Ventures`,
  },
  {
    id: 'TPL007',
    name: 'KYC Reminder',
    subject: 'Action Required: Complete Your KYC — {{client_name}}',
    category: 'compliance',
    mergeTags: ['{{client_name}}', '{{pending_step}}', '{{kyc_link}}', '{{deadline}}', '{{rm_name}}'],
    body: `Dear {{client_name}},

Your KYC on the GHL India Ventures portal is incomplete. To begin investing, please complete the following:

  • Pending step: {{pending_step}}
  • Resume KYC: {{kyc_link}}
  • Recommended completion by: {{deadline}}

The KYC checklist + sample documents are attached. If you need assistance, your relationship manager {{rm_name}} can walk you through the process.

Regards,
GHL India Ventures Compliance`,
  },
  {
    id: 'TPL008',
    name: 'Board Communication',
    subject: '{{subject}} — Board of Directors',
    category: 'internal',
    mergeTags: ['{{recipient_name}}', '{{subject}}', '{{meeting_date}}', '{{summary}}'],
    body: `Dear {{recipient_name}},

Re: {{subject}}

Please find attached the briefing pack for the Board meeting scheduled on {{meeting_date}}.

Summary:
{{summary}}

Kindly review at your earliest and revert with any pre-read comments.

Regards,
GHL India Ventures
Office of the MD`,
  },
]

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
