/* ─────────────────────────────────────────────────────────────
   AI Service — Tool execution + result logging in Supabase

   Provides a unified interface for all AI tools across portals.
   Logs usage to ai_results table for analytics and audit.

   When Supabase is not configured, returns simulated results.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'

// Untyped reference
const sb = supabase as any

// ── Types ───────────────────────────────────────────────────

export interface AIToolInput {
  toolId: string
  toolName: string
  portal: 'admin' | 'staff' | 'client'
  userId?: string
  inputData: Record<string, any>
}

export interface AIToolResult {
  id: string
  tool_id: string
  tool_name: string
  portal: string
  user_id: string | null
  input_data: Record<string, any>
  output_data: Record<string, any>
  status: 'success' | 'error' | 'pending'
  processing_time_ms: number
  created_at: string
}

// ── Execute Tool ────────────────────────────────────────────

export async function executeAITool(input: AIToolInput): Promise<{
  success: boolean
  result: Record<string, any>
  processingTimeMs: number
}> {
  const startTime = Date.now()

  try {
    // Route to the appropriate handler
    const result = await routeToHandler(input)
    const processingTimeMs = Date.now() - startTime

    // Log result to Supabase
    await logAIResult({
      tool_id: input.toolId,
      tool_name: input.toolName,
      portal: input.portal,
      user_id: input.userId || null,
      input_data: input.inputData,
      output_data: result,
      status: 'success',
      processing_time_ms: processingTimeMs,
    })

    return { success: true, result, processingTimeMs }
  } catch (error: any) {
    const processingTimeMs = Date.now() - startTime

    await logAIResult({
      tool_id: input.toolId,
      tool_name: input.toolName,
      portal: input.portal,
      user_id: input.userId || null,
      input_data: input.inputData,
      output_data: { error: error?.message || 'Unknown error' },
      status: 'error',
      processing_time_ms: processingTimeMs,
    })

    return {
      success: false,
      result: { error: error?.message || 'AI tool execution failed' },
      processingTimeMs,
    }
  }
}

// ── Tool Router ─────────────────────────────────────────────

async function routeToHandler(input: AIToolInput): Promise<Record<string, any>> {
  // In Phase 3 we provide simulated responses.
  // When an AI API key is configured, these will call real models.
  const handlers: Record<string, () => Promise<Record<string, any>>> = {
    // Admin AI Tools
    'document-analyzer': () => simulateDocumentAnalysis(input.inputData),
    'email-composer': () => simulateEmailComposer(input.inputData),
    'risk-engine': () => simulateRiskEngine(input.inputData),
    'compliance-checker': () => simulateComplianceChecker(input.inputData),
    'contract-generator': () => simulateContractGenerator(input.inputData),
    'meeting-summarizer': () => simulateMeetingSummarizer(input.inputData),
    'report-builder': () => simulateReportBuilder(input.inputData),
    'market-analyzer': () => simulateMarketAnalyzer(input.inputData),

    // Staff AI Tools
    'smart-reply': () => simulateSmartReply(input.inputData),
    'sentiment-analyzer': () => simulateSentimentAnalyzer(input.inputData),
    'ticket-classifier': () => simulateTicketClassifier(input.inputData),
    'knowledge-search': () => simulateKnowledgeSearch(input.inputData),
    'call-script': () => simulateCallScript(input.inputData),
    'escalation-advisor': () => simulateEscalationAdvisor(input.inputData),

    // Shared Tools
    'ai-assistant': () => simulateAssistant(input.inputData),
    'translate': () => simulateTranslate(input.inputData),
    'summarize': () => simulateSummarize(input.inputData),
  }

  const handler = handlers[input.toolId]
  if (handler) return handler()

  // Default: generic simulation
  return {
    message: `AI analysis complete for ${input.toolName}`,
    confidence: 0.85,
    suggestions: ['Review the generated output', 'Verify key data points', 'Consider edge cases'],
    generatedAt: new Date().toISOString(),
  }
}

// ── Simulated Handlers ──────────────────────────────────────

async function simulateDocumentAnalysis(data: Record<string, any>) {
  await delay(800)
  return {
    documentType: data.type || 'financial',
    summary: 'Document analysis complete. Key findings extracted.',
    entities: [
      { type: 'organization', value: 'GHL India Ventures', confidence: 0.98 },
      { type: 'amount', value: '₹25,00,000', confidence: 0.95 },
      { type: 'date', value: '2025-03-15', confidence: 0.97 },
    ],
    riskFlags: [],
    complianceScore: 92,
  }
}

async function simulateEmailComposer(data: Record<string, any>) {
  await delay(600)
  const tone = data.tone || 'professional'
  return {
    subject: `Re: ${data.subject || 'Your inquiry'}`,
    body: `Dear ${data.recipient || 'Valued Client'},\n\nThank you for your ${data.context || 'inquiry'}. We have reviewed your request and would like to share the following update...\n\nWarm regards,\nGHL India Ventures Team`,
    tone,
    wordCount: 85,
    suggestions: ['Add specific fund details', 'Include next steps', 'Mention compliance requirements'],
  }
}

async function simulateRiskEngine(data: Record<string, any>) {
  await delay(1000)
  return {
    riskScore: 65,
    riskLevel: 'moderate',
    factors: [
      { factor: 'Market Volatility', impact: 'medium', score: 55 },
      { factor: 'Concentration Risk', impact: 'high', score: 72 },
      { factor: 'Liquidity Risk', impact: 'low', score: 35 },
      { factor: 'Regulatory Risk', impact: 'medium', score: 48 },
    ],
    recommendations: [
      'Diversify across asset classes',
      'Increase fixed-income allocation by 10%',
      'Review concentration in stressed RE assets',
    ],
  }
}

async function simulateComplianceChecker(data: Record<string, any>) {
  await delay(700)
  return {
    status: 'compliant',
    overallScore: 88,
    checks: [
      { rule: 'SEBI AIF Regulations', status: 'pass', details: 'All investment limits within prescribed range' },
      { rule: 'KYC/AML Requirements', status: 'pass', details: 'All investor KYC documents verified and current' },
      { rule: 'FATCA Compliance', status: 'warning', details: 'Self-certification due for 3 investors' },
      { rule: 'Risk Disclosure', status: 'pass', details: 'All disclosures made as required' },
    ],
    actionItems: ['Update FATCA self-certifications before April 30'],
  }
}

async function simulateContractGenerator(data: Record<string, any>) {
  await delay(1200)
  return {
    contractType: data.type || 'investment-agreement',
    sections: ['Definitions', 'Investment Terms', 'Risk Disclosure', 'Fee Structure', 'Redemption Policy', 'Governing Law'],
    generatedLength: '12 pages',
    complianceChecked: true,
    needsReview: ['Fee Structure section — verify management fee %', 'Redemption lock-in period'],
  }
}

async function simulateMeetingSummarizer(data: Record<string, any>) {
  await delay(800)
  return {
    duration: data.duration || '45 minutes',
    participants: data.participants || 3,
    keyPoints: [
      'Q4 fund performance reviewed — 18.9% NAV appreciation',
      'New stressed RE opportunity in Pune discussed',
      'Compliance audit scheduled for next quarter',
    ],
    actionItems: [
      { owner: 'Fund Manager', action: 'Prepare due diligence report for Pune project', due: '2025-04-01' },
      { owner: 'Compliance', action: 'Schedule annual audit', due: '2025-04-15' },
    ],
    sentiment: 'positive',
  }
}

async function simulateReportBuilder(data: Record<string, any>) {
  await delay(1500)
  return {
    reportType: data.type || 'quarterly-performance',
    sections: ['Executive Summary', 'Portfolio Performance', 'Market Commentary', 'Risk Analysis', 'Outlook'],
    dataPoints: 47,
    charts: ['NAV Performance', 'Asset Allocation', 'Risk Metrics', 'Benchmark Comparison'],
    status: 'draft-ready',
  }
}

async function simulateMarketAnalyzer(data: Record<string, any>) {
  await delay(900)
  return {
    sector: data.sector || 'Real Estate',
    outlook: 'bullish',
    confidence: 0.78,
    insights: [
      'Stressed asset recovery rates improving across NCLTs',
      'Commercial real estate demand strong in tier-1 cities',
      'Interest rate cuts expected to benefit real estate sector',
    ],
    dataSourceCount: 12,
  }
}

async function simulateSmartReply(data: Record<string, any>) {
  await delay(400)
  return {
    replies: [
      'Thank you for reaching out. I\'ve reviewed your account and can see the status has been updated.',
      'I understand your concern. Let me check the details and get back to you within 2 hours.',
      'We appreciate your patience. Your request has been escalated to the senior team.',
    ],
    context: data.context || 'general',
    tone: 'empathetic-professional',
  }
}

async function simulateSentimentAnalyzer(data: Record<string, any>) {
  await delay(500)
  return {
    sentiment: 'neutral-positive',
    score: 0.62,
    emotions: { satisfaction: 0.45, concern: 0.25, urgency: 0.15, frustration: 0.15 },
    keywords: ['investment', 'query', 'update', 'status'],
    suggestedPriority: 'medium',
  }
}

async function simulateTicketClassifier(data: Record<string, any>) {
  await delay(300)
  return {
    category: 'account-inquiry',
    subcategory: 'portfolio-update',
    priority: 'medium',
    suggestedAssignee: 'Relationship Manager',
    confidence: 0.89,
    tags: ['portfolio', 'NAV', 'quarterly'],
  }
}

async function simulateKnowledgeSearch(data: Record<string, any>) {
  await delay(600)
  return {
    query: data.query || '',
    results: [
      { title: 'AIF Category II — Investor Guide', relevance: 0.95, source: 'Knowledge Base' },
      { title: 'KYC Requirements Checklist', relevance: 0.87, source: 'Compliance Docs' },
      { title: 'Fee Structure Explained', relevance: 0.82, source: 'FAQ' },
    ],
    answer: 'Based on the knowledge base, the most relevant information has been compiled above.',
  }
}

async function simulateCallScript(data: Record<string, any>) {
  await delay(500)
  return {
    opening: `Good ${getTimeOfDay()}, this is ${data.agentName || 'the team'} from GHL India Ventures.`,
    talkingPoints: [
      'Acknowledge the client\'s recent investment activity',
      'Share Q4 performance highlights',
      'Discuss upcoming opportunities',
    ],
    closing: 'Thank you for your time. We\'ll send a summary email with the details discussed.',
    objectionHandlers: [
      { objection: 'Returns seem low', response: 'Our stressed RE fund has delivered 18.9% this year, outperforming the benchmark by 6.6%.' },
    ],
  }
}

async function simulateEscalationAdvisor(data: Record<string, any>) {
  await delay(400)
  return {
    shouldEscalate: true,
    reason: 'Client has expressed dissatisfaction across multiple interactions',
    suggestedLevel: 'Senior RM',
    urgency: 'high',
    context: 'Review last 3 interactions before escalation call',
  }
}

async function simulateAssistant(data: Record<string, any>) {
  await delay(700)
  return {
    response: `I've analyzed your query about "${data.query || 'the topic'}". Here are my findings and recommendations based on the available data.`,
    sources: ['Internal knowledge base', 'Recent market data', 'Compliance guidelines'],
    confidence: 0.82,
  }
}

async function simulateTranslate(data: Record<string, any>) {
  await delay(400)
  return {
    original: data.text || '',
    translated: `[Translated to ${data.targetLang || 'Hindi'}] — Translation would appear here when API is connected.`,
    sourceLang: data.sourceLang || 'English',
    targetLang: data.targetLang || 'Hindi',
  }
}

async function simulateSummarize(data: Record<string, any>) {
  await delay(600)
  return {
    originalLength: (data.text || '').length,
    summary: 'Key points have been extracted and summarized from the provided content.',
    bulletPoints: [
      'Main topic identified and analyzed',
      'Key stakeholders and entities noted',
      'Action items and next steps outlined',
    ],
    compressionRatio: 0.25,
  }
}

// ── Logging ─────────────────────────────────────────────────

async function logAIResult(result: Omit<AIToolResult, 'id' | 'created_at'>) {
  if (!isSupabaseConfigured()) return

  try {
    await sb.from('ai_results').insert(result)
  } catch {
    console.warn('[ai] Failed to log AI result')
  }
}

// ── Fetch History ───────────────────────────────────────────

export async function fetchAIHistory(
  portal?: string,
  userId?: string,
  limit = 50
): Promise<AIToolResult[]> {
  if (!isSupabaseConfigured()) return []

  let query = sb.from('ai_results').select('*').order('created_at', { ascending: false }).limit(limit)
  if (portal) query = query.eq('portal', portal)
  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error || !data) return []
  return data as AIToolResult[]
}

export async function getAIUsageStats(portal?: string): Promise<{
  totalCalls: number
  successRate: number
  avgProcessingTime: number
  topTools: { tool_name: string; count: number }[]
}> {
  if (!isSupabaseConfigured()) {
    return { totalCalls: 0, successRate: 100, avgProcessingTime: 0, topTools: [] }
  }

  let query = sb.from('ai_results').select('*')
  if (portal) query = query.eq('portal', portal)

  const { data, error } = await query
  if (error || !data || data.length === 0) {
    return { totalCalls: 0, successRate: 100, avgProcessingTime: 0, topTools: [] }
  }

  const totalCalls = data.length
  const successes = data.filter((r: any) => r.status === 'success').length
  const avgTime = data.reduce((sum: number, r: any) => sum + (r.processing_time_ms || 0), 0) / totalCalls

  // Count tool usage
  const toolCounts: Record<string, number> = {}
  data.forEach((r: any) => {
    toolCounts[r.tool_name] = (toolCounts[r.tool_name] || 0) + 1
  })

  const topTools = Object.entries(toolCounts)
    .map(([tool_name, count]) => ({ tool_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalCalls,
    successRate: Math.round((successes / totalCalls) * 100),
    avgProcessingTime: Math.round(avgTime),
    topTools,
  }
}

// ── Helpers ─────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
