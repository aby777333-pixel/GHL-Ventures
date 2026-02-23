/* ================================================================
   useReportsLiveData — Fetches Reports module data from Supabase
   with automatic fallback to static mock data.

   Returns the SAME shape as the static imports from reportsData.ts
   so tabs can swap seamlessly between mock and live data.
   ================================================================ */

import { useState, useEffect, createContext, useContext } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import {
  fetchReportKPIs,
  fetchMonthlyRevenue,
  fetchRevenueStreams,
  fetchExpenseSummary,
  fetchCampaignMetrics,
  fetchLeads,
  fetchAIInsights,
  fetchScheduledReports,
  fetchGeneratedReports,
  fetchStaffActivity,
  fetchReportClients,
  fetchEmails,
  fetchCallLogs,
  fetchDocuments,
  fetchForecasts,
} from '@/lib/supabase/reportsDataService'

// Static fallback imports
import {
  REPORT_KPIS as STATIC_KPIS,
  MONTHLY_REVENUE as STATIC_MONTHLY_REVENUE,
  REVENUE_BY_TYPE as STATIC_REVENUE_BY_TYPE,
  AI_INSIGHTS as STATIC_AI_INSIGHTS,
  STAFF_ACTIVITY as STATIC_STAFF_ACTIVITY,
  SCHEDULED_REPORTS as STATIC_SCHEDULED_REPORTS,
  GENERATED_REPORTS as STATIC_GENERATED_REPORTS,
  LEAD_FUNNEL as STATIC_LEAD_FUNNEL,
  CAMPAIGN_METRICS as STATIC_CAMPAIGN_METRICS,
  REVENUE_FORECAST as STATIC_REVENUE_FORECAST,
  REPORT_CLIENTS as STATIC_REPORT_CLIENTS,
  REPORT_LEADS as STATIC_REPORT_LEADS,
  EXPENSE_SUMMARY as STATIC_EXPENSE_SUMMARY,
  REVENUE_BY_CITY as STATIC_REVENUE_BY_CITY,
  CALL_LOGS as STATIC_CALL_LOGS,
  DOCUMENT_VAULT as STATIC_DOCUMENT_VAULT,
  EMAIL_TEMPLATES as STATIC_EMAIL_TEMPLATES,
  TRAFFIC_SOURCES as STATIC_TRAFFIC_SOURCES,
  TOP_PAGES as STATIC_TOP_PAGES,
} from '@/lib/admin/reportsData'

export interface ReportsData {
  REPORT_KPIS: typeof STATIC_KPIS
  MONTHLY_REVENUE: typeof STATIC_MONTHLY_REVENUE
  REVENUE_BY_TYPE: typeof STATIC_REVENUE_BY_TYPE
  AI_INSIGHTS: typeof STATIC_AI_INSIGHTS
  STAFF_ACTIVITY: typeof STATIC_STAFF_ACTIVITY
  SCHEDULED_REPORTS: typeof STATIC_SCHEDULED_REPORTS
  GENERATED_REPORTS: typeof STATIC_GENERATED_REPORTS
  LEAD_FUNNEL: typeof STATIC_LEAD_FUNNEL
  CAMPAIGN_METRICS: typeof STATIC_CAMPAIGN_METRICS
  REVENUE_FORECAST: typeof STATIC_REVENUE_FORECAST
  REPORT_CLIENTS: typeof STATIC_REPORT_CLIENTS
  REPORT_LEADS: typeof STATIC_REPORT_LEADS
  EXPENSE_SUMMARY: typeof STATIC_EXPENSE_SUMMARY
  REVENUE_BY_CITY: typeof STATIC_REVENUE_BY_CITY
  CALL_LOGS: typeof STATIC_CALL_LOGS
  DOCUMENT_VAULT: typeof STATIC_DOCUMENT_VAULT
  EMAIL_TEMPLATES: typeof STATIC_EMAIL_TEMPLATES
  TRAFFIC_SOURCES: typeof STATIC_TRAFFIC_SOURCES
  TOP_PAGES: typeof STATIC_TOP_PAGES
  isLiveData: boolean
  loading: boolean
}

// Default / static data
const DEFAULT_DATA: ReportsData = {
  REPORT_KPIS: STATIC_KPIS,
  MONTHLY_REVENUE: STATIC_MONTHLY_REVENUE,
  REVENUE_BY_TYPE: STATIC_REVENUE_BY_TYPE,
  AI_INSIGHTS: STATIC_AI_INSIGHTS,
  STAFF_ACTIVITY: STATIC_STAFF_ACTIVITY,
  SCHEDULED_REPORTS: STATIC_SCHEDULED_REPORTS,
  GENERATED_REPORTS: STATIC_GENERATED_REPORTS,
  LEAD_FUNNEL: STATIC_LEAD_FUNNEL,
  CAMPAIGN_METRICS: STATIC_CAMPAIGN_METRICS,
  REVENUE_FORECAST: STATIC_REVENUE_FORECAST,
  REPORT_CLIENTS: STATIC_REPORT_CLIENTS,
  REPORT_LEADS: STATIC_REPORT_LEADS,
  EXPENSE_SUMMARY: STATIC_EXPENSE_SUMMARY,
  REVENUE_BY_CITY: STATIC_REVENUE_BY_CITY,
  CALL_LOGS: STATIC_CALL_LOGS,
  DOCUMENT_VAULT: STATIC_DOCUMENT_VAULT,
  EMAIL_TEMPLATES: STATIC_EMAIL_TEMPLATES,
  TRAFFIC_SOURCES: STATIC_TRAFFIC_SOURCES,
  TOP_PAGES: STATIC_TOP_PAGES,
  isLiveData: false,
  loading: false,
}

// Context for sub-tabs
export const ReportsDataContext = createContext<ReportsData>(DEFAULT_DATA)
export const useReportsDataContext = () => useContext(ReportsDataContext)

// Main hook — call in ReportsModule, provide via context
export function useReportsLiveData(): ReportsData {
  const [data, setData] = useState<ReportsData>(DEFAULT_DATA)

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    let cancelled = false
    setData(prev => ({ ...prev, loading: true }))

    async function fetchAll() {
      try {
        const [
          kpis,
          monthlyRev,
          revenueStreams,
          expenses,
          campaigns,
          leads,
          insights,
          scheduledReports,
          generatedReports,
          staffActivity,
          clients,
          callLogs,
          documents,
          forecasts,
        ] = await Promise.allSettled([
          fetchReportKPIs(),
          fetchMonthlyRevenue(),
          fetchRevenueStreams(),
          fetchExpenseSummary(),
          fetchCampaignMetrics(),
          fetchLeads(),
          fetchAIInsights(),
          fetchScheduledReports(),
          fetchGeneratedReports(),
          fetchStaffActivity(),
          fetchReportClients(),
          fetchCallLogs(),
          fetchDocuments(),
          fetchForecasts(),
        ])

        if (cancelled) return

        // Helper to safely extract resolved values or fall back
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resolve = (result: PromiseSettledResult<any>, fallback: any): any =>
          result.status === 'fulfilled' && result.value != null
            ? result.value
            : fallback

        setData({
          REPORT_KPIS: resolve(kpis, STATIC_KPIS) as any,
          MONTHLY_REVENUE: resolve(monthlyRev, STATIC_MONTHLY_REVENUE) as any,
          REVENUE_BY_TYPE: resolve(revenueStreams, STATIC_REVENUE_BY_TYPE) as any,
          AI_INSIGHTS: resolve(insights, STATIC_AI_INSIGHTS) as any,
          STAFF_ACTIVITY: resolve(staffActivity, STATIC_STAFF_ACTIVITY) as any,
          SCHEDULED_REPORTS: resolve(scheduledReports, STATIC_SCHEDULED_REPORTS) as any,
          GENERATED_REPORTS: resolve(generatedReports, STATIC_GENERATED_REPORTS) as any,
          LEAD_FUNNEL: STATIC_LEAD_FUNNEL, // derived from leads
          CAMPAIGN_METRICS: resolve(campaigns, STATIC_CAMPAIGN_METRICS) as any,
          REVENUE_FORECAST: resolve(forecasts, STATIC_REVENUE_FORECAST) as any,
          REPORT_CLIENTS: resolve(clients, STATIC_REPORT_CLIENTS) as any,
          REPORT_LEADS: resolve(leads, STATIC_REPORT_LEADS) as any,
          EXPENSE_SUMMARY: resolve(expenses, STATIC_EXPENSE_SUMMARY) as any,
          REVENUE_BY_CITY: STATIC_REVENUE_BY_CITY, // keep as-is (derived)
          CALL_LOGS: resolve(callLogs, STATIC_CALL_LOGS) as any,
          DOCUMENT_VAULT: resolve(documents, STATIC_DOCUMENT_VAULT) as any,
          EMAIL_TEMPLATES: STATIC_EMAIL_TEMPLATES, // templates are static config
          TRAFFIC_SOURCES: STATIC_TRAFFIC_SOURCES, // analytics pending
          TOP_PAGES: STATIC_TOP_PAGES, // analytics pending
          isLiveData: true,
          loading: false,
        })
      } catch (err) {
        console.warn('[ReportsLiveData] Fetch error, using static fallback:', err)
        if (!cancelled) setData(prev => ({ ...prev, loading: false }))
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [])

  return data
}
