/* ─────────────────────────────────────────────────────────────
   Reports Data Service — Supabase queries with mock fallback

   Provides Supabase-backed data for the Reports & Intelligence
   module. Falls back to reportsData.ts mock data when Supabase
   is not configured or queries fail.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'
import {
  REPORT_KPIS, MONTHLY_REVENUE, REVENUE_BY_TYPE, REVENUE_BY_CITY,
  AI_INSIGHTS, CAMPAIGN_METRICS, EXPENSE_SUMMARY, LEAD_FUNNEL,
  SCHEDULED_REPORTS, GENERATED_REPORTS, STAFF_ACTIVITY,
  REVENUE_FORECAST, EMAIL_TEMPLATES, CALL_LOGS, DOCUMENT_VAULT,
  REVENUE_STREAMS, REPORT_LEADS, REPORT_CLIENTS,
  WEBSITE_TRAFFIC, TRAFFIC_SOURCES, TOP_PAGES,
} from '../admin/reportsData'

// ── Generic query helper ────────────────────────────────────
async function queryOrFallback<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallback: T,
  label: string
): Promise<T> {
  if (!isSupabaseConfigured()) return fallback
  try {
    const { data, error } = await queryFn() as any
    if (error) {
      console.warn(`[reportsData] Error fetching ${label}:`, error.message)
      return fallback
    }
    return (data as T) ?? fallback
  } catch (err) {
    console.warn(`[reportsData] Exception fetching ${label}:`, err)
    return fallback
  }
}

// ── KPIs ────────────────────────────────────────────────────
export async function fetchReportKPIs() {
  if (!isSupabaseConfigured()) return REPORT_KPIS
  try {
    const { data, error } = await (supabase
      .from('kpis')
      .select('*')
      .eq('period_type', 'monthly')
      .order('calculated_at', { ascending: false })
      .limit(30) as any)
    if (error || !data || data.length === 0) return REPORT_KPIS
    // Transform KPI rows into the flat object the UI expects
    const kpiMap: Record<string, number> = {}
    for (const row of data as any[]) {
      kpiMap[row.name] = Number(row.value)
    }
    return { ...REPORT_KPIS, ...kpiMap }
  } catch {
    return REPORT_KPIS
  }
}

// ── Revenue ─────────────────────────────────────────────────
export async function fetchMonthlyRevenue() {
  return queryOrFallback(
    () => supabase.from('mv_monthly_revenue' as any).select('*').order('period', { ascending: true }).limit(24) as any,
    MONTHLY_REVENUE,
    'monthly_revenue'
  )
}

export async function fetchRevenueStreams() {
  return queryOrFallback(
    () => supabase.from('revenue_streams').select('*').order('created_at', { ascending: false }).limit(100) as any,
    REVENUE_STREAMS,
    'revenue_streams'
  )
}

export function getRevenueByType() { return REVENUE_BY_TYPE }
export function getRevenueByCity() { return REVENUE_BY_CITY }
export function getRevenueForecast() { return REVENUE_FORECAST }

// ── Expenses ────────────────────────────────────────────────
export async function fetchExpenseSummary() {
  return queryOrFallback(
    () => supabase.from('mv_expense_breakdown' as any).select('*').order('month', { ascending: false }).limit(24) as any,
    EXPENSE_SUMMARY,
    'expense_breakdown'
  )
}

// ── Campaigns ───────────────────────────────────────────────
export async function fetchCampaignMetrics() {
  return queryOrFallback(
    () => supabase.from('mv_campaign_roi' as any).select('*').order('start_date', { ascending: false }) as any,
    CAMPAIGN_METRICS,
    'campaign_roi'
  )
}

// ── Leads & Funnel ──────────────────────────────────────────
export async function fetchLeads() {
  return queryOrFallback(
    () => supabase.from('leads').select('*, campaigns(campaign_name, platform)').order('created_at', { ascending: false }).limit(100) as any,
    REPORT_LEADS,
    'leads'
  )
}

export function getLeadFunnel() { return LEAD_FUNNEL }

// ── AI Insights ─────────────────────────────────────────────
export async function fetchAIInsights() {
  return queryOrFallback(
    () => supabase.from('ai_insights').select('*').order('generated_at', { ascending: false }).limit(50) as any,
    AI_INSIGHTS as any,
    'ai_insights'
  )
}

// ── Reports ─────────────────────────────────────────────────
export async function fetchScheduledReports() {
  return queryOrFallback(
    () => supabase.from('reports').select('*, report_templates(name, category)').order('created_at', { ascending: false }).limit(50) as any,
    SCHEDULED_REPORTS,
    'reports'
  )
}

export async function fetchGeneratedReports() {
  return queryOrFallback(
    () => supabase.from('report_exports').select('*, reports(title)').order('created_at', { ascending: false }).limit(50) as any,
    GENERATED_REPORTS,
    'report_exports'
  )
}

export async function fetchReportTemplates() {
  return queryOrFallback(
    () => supabase.from('report_templates').select('*').order('name') as any,
    [],
    'report_templates'
  )
}

// ── Clients ─────────────────────────────────────────────────
export async function fetchReportClients() {
  return queryOrFallback(
    () => supabase.from('mv_client_metrics' as any).select('*').order('client_since', { ascending: false }) as any,
    REPORT_CLIENTS,
    'client_metrics'
  )
}

// ── Staff Activity ──────────────────────────────────────────
export async function fetchStaffActivity() {
  return queryOrFallback(
    () => supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20) as any,
    STAFF_ACTIVITY,
    'staff_activity'
  )
}

export async function fetchStaffProductivity() {
  return queryOrFallback(
    () => supabase.from('mv_staff_productivity' as any).select('*') as any,
    [],
    'staff_productivity'
  )
}

// ── Communication ───────────────────────────────────────────
export async function fetchEmails() {
  return queryOrFallback(
    () => supabase.from('emails').select('*').order('created_at', { ascending: false }).limit(50) as any,
    EMAIL_TEMPLATES,
    'emails'
  )
}

export async function fetchCallLogs() {
  return queryOrFallback(
    () => supabase.from('calls').select('*').order('created_at', { ascending: false }).limit(50) as any,
    CALL_LOGS,
    'calls'
  )
}

// ── Documents ───────────────────────────────────────────────
export async function fetchDocuments(ownerType?: string) {
  if (!isSupabaseConfigured()) return DOCUMENT_VAULT
  try {
    let query = supabase.from('documents').select('*').eq('status', 'active')
    if (ownerType) query = query.eq('owner_type', ownerType) as any
    const { data, error } = await (query.order('created_at', { ascending: false }).limit(100) as any)
    if (error || !data) return DOCUMENT_VAULT
    return data
  } catch {
    return DOCUMENT_VAULT
  }
}

// ── Website Analytics ───────────────────────────────────────
export function getWebsiteTraffic() { return WEBSITE_TRAFFIC }
export function getTrafficSources() { return TRAFFIC_SOURCES }
export function getTopPages() { return TOP_PAGES }

// ── Email Notification Helper ──────────────────────────────
async function sendLeadNotification(payload: {
  fullName: string
  email?: string
  phone?: string
  source: string
  message?: string
  investmentInterest?: string
  investmentRange?: string
  city?: string
  pageUrl?: string
}) {
  try {
    await fetch('/.netlify/functions/lead-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    // Email notification is best-effort — don't block form submission
    console.warn('[reportsData] Lead notification email failed:', err)
  }
}

// ── Contact Form Submissions ────────────────────────────────
export async function submitContactForm(formData: {
  formType: string
  fullName: string
  email?: string
  phone?: string
  company?: string
  city?: string
  subject?: string
  message?: string
  investmentRange?: string
  investmentInterest?: string
  pageUrl?: string
}) {
  // Fire email notification (best-effort, non-blocking)
  sendLeadNotification({
    fullName: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    source: formData.formType,
    message: formData.message,
    investmentInterest: formData.investmentInterest,
    investmentRange: formData.investmentRange,
    city: formData.city,
    pageUrl: formData.pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
  })

  if (!isSupabaseConfigured()) {
    console.debug('[reportsData] Supabase not configured, form submission logged locally')
    return { success: true, local: true }
  }
  try {
    const { data, error } = await supabase.from('contact_submissions').insert({
      form_type: formData.formType,
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      city: formData.city,
      subject: formData.subject,
      message: formData.message,
      page_url: formData.pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      utm_source: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_source') : null,
      utm_medium: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_medium') : null,
      utm_campaign: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_campaign') : null,
      referrer: typeof document !== 'undefined' ? document.referrer : null,
    } as any).select().single()
    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.warn('[reportsData] Contact form submission error:', err)
    return { success: false, error: err }
  }
}

// ── Investment Range → Numeric Value Converter ──────────────
function parseInvestmentRange(range?: string): number {
  if (!range) return 0
  const r = range.toLowerCase().replace(/[₹,\s]/g, '')
  if (r.includes('under') || r === 'under-1' || r.includes('<1')) return 5000000      // ₹50L
  if (r.includes('1-5') || r === '1-5cr') return 30000000     // ₹3Cr midpoint
  if (r.includes('5-10') || r === '5-10cr') return 75000000   // ₹7.5Cr midpoint
  if (r.includes('10-25')) return 175000000                     // ₹17.5Cr midpoint
  if (r.includes('25+') || r.includes('25cr+')) return 250000000 // ₹25Cr
  if (r.includes('10cr+') || r.includes('10+')) return 100000000 // ₹10Cr
  // Try to parse a plain number (e.g. "2cr" → 20000000)
  const numMatch = r.match(/(\d+(?:\.\d+)?)\s*cr/)
  if (numMatch) return Math.round(parseFloat(numMatch[1]) * 10000000)
  const lakhMatch = r.match(/(\d+(?:\.\d+)?)\s*l/)
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000)
  return 0
}

// ── Lead Submission (from website forms) ────────────────────
export async function submitLead(leadData: {
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  city?: string
  source?: string
  investmentInterest?: string
  estimatedInvestment?: number
  investmentRange?: string
  message?: string
}) {
  // Fire email notification (best-effort, non-blocking)
  sendLeadNotification({
    fullName: [leadData.firstName, leadData.lastName].filter(Boolean).join(' '),
    email: leadData.email,
    phone: leadData.phone,
    source: leadData.source || 'website',
    investmentInterest: leadData.investmentInterest,
    investmentRange: leadData.investmentRange || (leadData.estimatedInvestment ? `${leadData.estimatedInvestment}` : undefined),
    city: leadData.city,
    pageUrl: typeof window !== 'undefined' ? window.location.href : '',
  })

  if (!isSupabaseConfigured()) {
    console.debug('[reportsData] Supabase not configured, lead logged locally')
    return { success: true, local: true }
  }
  try {
    // Insert lead with correct column names matching DB schema
    const { data, error } = await supabase.from('leads').insert({
      first_name: leadData.firstName,
      last_name: leadData.lastName || '',
      email: leadData.email,
      phone: leadData.phone,
      city: leadData.city,
      source: leadData.source || 'website',
      investment_interest: leadData.investmentInterest,
      estimated_value: leadData.estimatedInvestment || parseInvestmentRange(leadData.investmentRange) || 0,
      status: 'new',
      notes: leadData.message || null,
    } as any).select().single() as any
    if (error) throw error

    // Track UTM/source data in the dedicated tracking table
    if (data?.id) {
      const utmSource = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_source') : null
      const utmMedium = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_medium') : null
      const utmCampaign = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_campaign') : null
      const landingPage = typeof window !== 'undefined' ? window.location.pathname : ''
      const referrer = typeof document !== 'undefined' ? document.referrer : ''

      if (utmSource || landingPage || referrer) {
        await supabase.from('lead_source_tracking' as any).insert({
          lead_id: (data as any).id,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          referrer_url: referrer || null,
          landing_page_url: landingPage || null,
        } as any)
      }

      // Auto-assign lead to least-loaded staff (round-robin, non-blocking)
      import('./leadAssignmentService').then(({ autoAssignLead }) => {
        autoAssignLead((data as any).id).catch(() => {})
      }).catch(() => {})
    }

    return { success: true, data }
  } catch (err) {
    console.warn('[reportsData] Lead submission error:', err)
    return { success: false, error: err }
  }
}

// ── Newsletter Subscription ─────────────────────────────────
export async function subscribeNewsletter(email: string, name?: string) {
  if (!isSupabaseConfigured()) {
    console.debug('[reportsData] Supabase not configured, subscription logged locally')
    return { success: true, local: true }
  }
  try {
    const { error } = await supabase.from('newsletter_subscribers').upsert({
      email,
      name: name || '',
      source: 'website',
      is_active: true,
    } as any)
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.warn('[reportsData] Newsletter subscription error:', err)
    return { success: false, error: err }
  }
}

// ── Website Analytics ───────────────────────────────────────
export async function trackPageView() {
  if (!isSupabaseConfigured() || typeof window === 'undefined') return
  try {
    const visitorId = localStorage.getItem('ghl_visitor_id') || (() => {
      const id = crypto.randomUUID()
      localStorage.setItem('ghl_visitor_id', id)
      return id
    })()
    const sessionId = sessionStorage.getItem('ghl_session_id') || (() => {
      const id = crypto.randomUUID()
      sessionStorage.setItem('ghl_session_id', id)
      return id
    })()

    await supabase.from('website_analytics').insert({
      page_path: window.location.pathname,
      page_title: document.title,
      visitor_id: visitorId,
      session_id: sessionId,
      referrer: document.referrer,
      utm_source: new URLSearchParams(window.location.search).get('utm_source'),
      event_type: 'pageview',
      device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browser: navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/)?.[0] || 'unknown',
    } as any)
  } catch {
    // Silent fail for analytics
  }
}

// ── API Token Management ────────────────────────────────────
export async function getApiToken(platform: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const { data, error } = await (supabase
      .from('api_tokens')
      .select('access_token')
      .eq('platform', platform)
      .eq('is_active', true)
      .single() as any)
    if (error || !data) return null
    return (data as any).access_token
  } catch {
    return null
  }
}

export async function saveApiToken(platform: string, accessToken: string) {
  if (!isSupabaseConfigured()) return { success: false, reason: 'Supabase not configured' }
  try {
    const { error } = await supabase.from('api_tokens').upsert({
      platform,
      access_token: accessToken,
      is_active: true,
      updated_at: new Date().toISOString(),
    } as any)
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.warn('[reportsData] API token save error:', err)
    return { success: false, error: err }
  }
}

// ── Forecasts ───────────────────────────────────────────────
export async function fetchForecasts(modelType?: string) {
  if (!isSupabaseConfigured()) return REVENUE_FORECAST
  try {
    let query = supabase.from('forecasts').select('*')
    if (modelType) query = query.eq('model_type', modelType) as any
    const { data, error } = await (query.order('period') as any)
    if (error || !data || (data as any[]).length === 0) return REVENUE_FORECAST
    return data
  } catch {
    return REVENUE_FORECAST
  }
}

// ── Notifications ───────────────────────────────────────────
export async function fetchNotifications() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session) return []
    const { data, error } = await (supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.session.user.id)
      .order('created_at', { ascending: false })
      .limit(50) as any)
    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

// ── Email Logging ───────────────────────────────────────────
export async function logEmail(emailData: {
  recipientEmail: string
  recipientName?: string
  subject: string
  bodyHtml?: string
  bodyText?: string
  templateName?: string
}) {
  if (!isSupabaseConfigured()) return { success: true, local: true }
  try {
    const { data: session } = await supabase.auth.getSession()
    const { error } = await supabase.from('emails').insert({
      sender_id: session?.session?.user?.id,
      recipient_email: emailData.recipientEmail,
      recipient_name: emailData.recipientName,
      subject: emailData.subject,
      body_html: emailData.bodyHtml,
      body_text: emailData.bodyText,
      template_name: emailData.templateName,
      status: 'queued',
    } as any)
    if (error) throw error
    return { success: true }
  } catch (err) {
    return { success: false, error: err }
  }
}

// ── Call Logging ────────────────────────────────────────────
export async function logCall(callData: {
  recipientNumber: string
  recipientName?: string
  direction: 'outbound' | 'inbound'
  callType?: string
  outcome?: string
  durationSeconds?: number
  notes?: string
}) {
  if (!isSupabaseConfigured()) return { success: true, local: true }
  try {
    const { data: session } = await supabase.auth.getSession()
    const { error } = await supabase.from('calls').insert({
      caller_id: session?.session?.user?.id,
      recipient_number: callData.recipientNumber,
      recipient_name: callData.recipientName,
      direction: callData.direction,
      call_type: callData.callType,
      outcome: callData.outcome,
      duration_seconds: callData.durationSeconds,
      notes: callData.notes,
    } as any)
    if (error) throw error
    return { success: true }
  } catch (err) {
    return { success: false, error: err }
  }
}
