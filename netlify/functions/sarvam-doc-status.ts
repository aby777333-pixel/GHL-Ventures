/* ================================================================
   SARVAM AI — Document Digitization: poll status

   GET /.netlify/functions/sarvam-doc-status?job_id=<id>

   Forwards Sarvam's status payload and opportunistically mirrors
   state / page_metrics into sarvam_document_jobs so the UI's
   Realtime subscription stays current even without a webhook.
   ================================================================ */

import { SARVAM_ENDPOINTS, type DocumentJobStatusResponse } from '../../lib/sarvam/types'
import {
  SarvamApiError,
  assertSarvamConfigured,
  logSarvamCall,
  sarvamFetch,
} from '../../lib/sarvam/client'
import { rateLimitResponse } from '../../lib/sarvam/rateLimit'

const ALLOWED_ORIGINS = [
  'https://ghl-india-ventures-2025.netlify.app',
  'https://ghlindiaventures.com',
  'https://www.ghlindiaventures.com',
]
const corsHeaders = (req: Request) => {
  const o = req.headers.get('origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }
}
const json = (status: number, body: unknown, req: Request) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders(req) } })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const TERMINAL = new Set(['Completed', 'PartiallyCompleted', 'Failed'])

export default async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== 'GET') return json(405, { error: 'Method not allowed' }, request)

  try { assertSarvamConfigured() } catch (e) { return json(500, { error: (e as Error).message }, request) }
  if (!SUPABASE_URL || !SUPABASE_ANON || !SUPABASE_SERVICE) {
    return json(500, { error: 'Supabase env vars not configured' }, request)
  }

  const auth = request.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) return json(401, { error: 'Missing Authorization header' }, request)
  let userId: string | null = null
  try {
    const verify = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: auth, apikey: SUPABASE_ANON },
    })
    if (!verify.ok) return json(401, { error: 'Invalid session' }, request)
    const u = await verify.json()
    userId = u?.id || null
    if (!userId) return json(401, { error: 'Invalid session' }, request)
  } catch { return json(401, { error: 'Session verification failed' }, request) }

  {
    // Reuse the poll-friendly batch-status bucket (60/min).
    const limited = rateLimitResponse(userId, 'batch-status', corsHeaders(request))
    if (limited) return limited
  }

  const url = new URL(request.url)
  const jobId = (url.searchParams.get('job_id') || '').trim()
  if (!jobId) return json(400, { error: 'job_id query param is required' }, request)

  // Ownership guard.
  try {
    const owner = await fetch(
      `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_document_jobs?job_id=eq.${encodeURIComponent(jobId)}&select=user_id`,
      { headers: { apikey: SUPABASE_SERVICE, Authorization: `Bearer ${SUPABASE_SERVICE}` } },
    )
    const rows = (await owner.json()) as Array<{ user_id: string | null }>
    if (rows.length > 0 && rows[0]?.user_id && rows[0].user_id !== userId) {
      return json(403, { error: 'job_id does not belong to this user' }, request)
    }
  } catch { /* fall through */ }

  try {
    const resp = await sarvamFetch(SARVAM_ENDPOINTS.DOC_JOB_STATUS(jobId), { method: 'GET' }, {
      logEndpoint: 'doc-status',
      maxRetries: 1,
      timeoutMs: 20_000,
      logContext: { user_id: userId },
    })
    const payload = await resp.json() as DocumentJobStatusResponse

    const patch: Record<string, unknown> = {
      state: payload.job_state,
      total_pages: payload.total_pages ?? undefined,
      pages_processed: payload.pages_processed ?? undefined,
      pages_succeeded: payload.pages_succeeded ?? undefined,
      pages_failed: payload.pages_failed ?? undefined,
      error_message: payload.error_message ?? null,
    }
    if (TERMINAL.has(String(payload.job_state || ''))) {
      patch.completed_at = new Date().toISOString()
    }
    for (const k of Object.keys(patch)) if (patch[k] === undefined) delete patch[k]
    fetch(
      `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_document_jobs?job_id=eq.${encodeURIComponent(jobId)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_SERVICE,
          Authorization: `Bearer ${SUPABASE_SERVICE}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(patch),
      },
    ).catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('[sarvam-doc-status] db patch failed:', (e as Error)?.message)
    })

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders(request) },
    })
  } catch (e: unknown) {
    if (e instanceof SarvamApiError) {
      logSarvamCall({
        user_id: userId, endpoint: 'doc-status', status: e.status, latency_ms: 0,
        error_code: e.code, error_message: e.message.slice(0, 500), request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message, code: e.code, request_id: e.requestId,
      }, request)
    }
    return json(500, { error: (e as Error)?.message || 'Doc status failed' }, request)
  }
}
