/* ================================================================
   GHL INTELLIGENCE OS — CLAUDE API CLIENT

   Routes all AI Advisor requests through a Netlify serverless
   function (/.netlify/functions/claude-proxy) so the Anthropic
   API key stays server-side and is never bundled into client JS.

   If the user has pasted a personal key via Admin > Settings,
   that key is forwarded through the proxy instead.
   ================================================================ */

import {
  REPORT_KPIS, REVENUE_BY_TYPE, REVENUE_BY_CITY, EXPENSE_SUMMARY,
  CAMPAIGN_METRICS, AI_INSIGHTS, LEAD_FUNNEL, MONTHLY_REVENUE,
  formatINRCompact,
} from './reportsData'

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT — Injects live business data as context
// ─────────────────────────────────────────────────────────────

function buildBusinessContext(): string {
  const k = REPORT_KPIS

  const kpiBlock = [
    `Total AUM: ${formatINRCompact(k.totalAUM)} (${k.totalAUMChange > 0 ? '+' : ''}${k.totalAUMChange}% YoY)`,
    `Active Clients: ${k.activeClients} of ${k.totalClients} total (${k.newClientsMonth} new this month)`,
    `Monthly Revenue: ${formatINRCompact(k.monthlyRevenue)} (${k.revenueChange > 0 ? '+' : ''}${k.revenueChange}% MoM)`,
    `Monthly Expenses: ${formatINRCompact(k.monthlyExpenses)} (${k.expenseChange}% MoM)`,
    `Net Profit: ${formatINRCompact(k.netProfit)} | Margin: ${k.profitMargin}%`,
    `CAC: ${formatINRCompact(k.cac)} | LTV: ${formatINRCompact(k.ltv)} | LTV:CAC Ratio: ${k.ltvCacRatio}x`,
    `Lead Conversion Rate: ${k.leadConversionRate}% | Retention Rate: ${k.retentionRate}%`,
    `NPS: ${k.nps} | Staff Productivity Score: ${k.staffProductivityScore}/100`,
    `Website: ${k.websiteVisitors.toLocaleString()} visitors/month (+${k.websiteVisitorsChange}%), Bounce: ${k.bounceRate}%, Avg Session: ${k.avgSessionDuration}`,
    `Cash Runway: ${k.cashRunway} months | AI Health Score: ${k.aiHealthScore}/100`,
  ].join('\n')

  const revenueByType = REVENUE_BY_TYPE.map(r => `  ${r.type}: ${formatINRCompact(r.amount)} (${r.percentage}%)`).join('\n')

  const revenueByCity = REVENUE_BY_CITY.map(r => `  ${r.city}: ${formatINRCompact(r.amount)} — ${r.clients} clients`).join('\n')

  const expenses = EXPENSE_SUMMARY.map(e =>
    `  ${e.category}: ${formatINRCompact(e.amount)} of ${formatINRCompact(e.budget)} budget (${e.percentage}%)`
  ).join('\n')

  const campaigns = CAMPAIGN_METRICS.map(c =>
    `  ${c.name} (${c.platform}): Spend ${formatINRCompact(c.spend)}, ${c.conversions} conv, Revenue ${formatINRCompact(c.revenueGenerated)}, ROI ${((c.revenueGenerated / c.spend) - 1).toFixed(1)}x [${c.status}]`
  ).join('\n')

  const funnel = LEAD_FUNNEL.map(f => `  ${f.stage}: ${f.count.toLocaleString()} (${f.percentage}%)`).join('\n')

  const revTrend = MONTHLY_REVENUE.map(m => `  ${m.month}: Revenue ${formatINRCompact(m.revenue)}, Expenses ${formatINRCompact(m.expenses)}`).join('\n')

  const insights = AI_INSIGHTS.map(i =>
    `  [${i.type.toUpperCase()}] ${i.summary}${i.impact ? ` → Impact: ${i.impact}` : ''}`
  ).join('\n')

  return `
=== GHL INDIA VENTURES — LIVE BUSINESS DATA (Feb 2025) ===

COMPANY: GHL India Ventures (SEBI-registered Category II AIF)
LOCATION: Chennai, India | Sectors: Stressed Real Estate, Startup Equity, NRI Investments

KEY PERFORMANCE INDICATORS:
${kpiBlock}

REVENUE BY TYPE (Annual):
${revenueByType}

REVENUE BY GEOGRAPHY:
${revenueByCity}

EXPENSE BREAKDOWN (Monthly):
${expenses}

MARKETING CAMPAIGNS (Active & Recent):
${campaigns}

LEAD FUNNEL (Current Month):
${funnel}

REVENUE TREND (12 Months):
${revTrend}

AI-GENERATED INSIGHTS:
${insights}
`.trim()
}

const SYSTEM_PROMPT = `You are the GHL Intelligence Advisor — a senior financial strategist and business intelligence analyst for GHL India Ventures, a SEBI-registered Category II AIF based in Chennai, India.

You have access to the company's live operational data provided below. Use this data to give precise, data-backed answers. Always reference specific numbers from the data.

${buildBusinessContext()}

RESPONSE GUIDELINES:
- Use **bold** for section headers and key figures
- Format all Indian currency in lakhs (L) and crores (Cr) — e.g. ₹3.28Cr, ₹52L
- Be concise but thorough — aim for 150-300 words per response
- Always back claims with specific data points from above
- Provide actionable recommendations with expected impact
- When asked about campaigns, reference actual campaign names and ROI numbers
- When discussing clients, reference tier segments and city-level data
- If asked to draft reports or summaries, produce structured, professional output
- You can compare metrics across time periods, identify trends, and flag anomalies
- Never make up data that isn't in the context above — say "I don't have data on that" if needed`

// ─────────────────────────────────────────────────────────────
// API CALL  — routed through Netlify serverless proxy
// ─────────────────────────────────────────────────────────────

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

// Models to try in order of preference
const CLAUDE_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-3-5-sonnet-20241022',
  'claude-3-haiku-20240307',
]

// Proxy endpoint — Netlify function keeps the API key server-side
const PROXY_URL = '/.netlify/functions/claude-proxy'

/**
 * Calls the Claude API through the server-side proxy.
 *
 * @param messages  Conversation history
 * @param apiKey    Optional user-supplied key (from sessionStorage).
 *                  If empty/blank the proxy falls back to the
 *                  server-side CLAUDE_API_KEY env var.
 */
export async function callClaudeAPI(
  messages: ClaudeMessage[],
  apiKey?: string
): Promise<string> {
  let lastError = ''

  for (const model of CLAUDE_MODELS) {
    try {
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages,
          // Only forward if the user pasted their own key in settings
          ...(apiKey ? { apiKey } : {}),
        }),
      })

      if (!response.ok) {
        // Parse the actual error body for better diagnostics
        let errorDetail = ''
        try {
          const errBody = await response.json()
          errorDetail = errBody?.error?.message || JSON.stringify(errBody)
        } catch {
          errorDetail = await response.text().catch(() => '')
        }

        const status = response.status

        // If model not found, try next model
        if (status === 400 && errorDetail.toLowerCase().includes('model')) {
          lastError = `Model ${model} not available`
          continue
        }
        if (status === 404) {
          lastError = `Model ${model} not found`
          continue
        }

        if (status === 401) throw new Error(`Invalid API key. ${errorDetail}`)
        if (status === 429) throw new Error('Rate limit exceeded. Please wait a moment and try again.')
        if (status === 529) throw new Error('Claude is currently overloaded. Please try again shortly.')
        throw new Error(`API error (${status}): ${errorDetail}`)
      }

      const data = await response.json()

      if (data.content && data.content.length > 0 && data.content[0].type === 'text') {
        return data.content[0].text
      }

      throw new Error('Unexpected response format from Claude API.')
    } catch (err) {
      // If it's a model fallback, continue to next; otherwise rethrow
      if (err instanceof Error && (err.message.includes('not available') || err.message.includes('not found'))) {
        lastError = err.message
        continue
      }
      throw err
    }
  }

  throw new Error(`All models failed. Last error: ${lastError}`)
}
