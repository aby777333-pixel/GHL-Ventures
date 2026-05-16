/* ================================================================
   SARVAM AI — Batch STT: poll job status

   GET /.netlify/functions/sarvam-batch-status?job_id=<id>

   Returns Sarvam's status payload as-is:
     {
       job_id, state, progress,
       file_results?: { successful: [...], failed: [...] },
       error_message?: string | null
     }

   Side effects (opportunistic — never blocks the response):
     - Mirrors `state` / `progress` / `error_message` into
       public.sarvam_batch_jobs so the UI's Realtime sub keeps
       working even when the webhook isn't configured and the
       client falls back to polling.
     - Sets completed_at on first observation of a terminal state.

   Auth: Supabase user JWT + ownership check against the row.
   ================================================================ */

import { SARVAM_ENDPOINTS } from '../../lib/sarvam/types'
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

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }
}

const json = (status: number, body: unknown, req: Request) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const TERMINAL_STATES = new Set(['COMPLETED', 'FAILED', 'PARTIAL'])

interface BatchStatusResponse {
  job_id: string
  state: string
  progress?: number
  error_message?: string | null
  file_results?: {
    successful?: Array<{ file_index: number; output_url?: string }>
    failed?: Array<{ file_index: number; error?: string }>
  }
}

export default async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== 'GET')
    return json(405, { error: 'Method not allowed' }, request)

  try { assertSarvamConfigured() } catch (e) {
    return json(500, { error: (e as Error).message }, request)
  }
  if (!SUPABASE_URL || !SUPABASE_ANON || !SUPABASE_SERVICE) {
    return json(500, { error: 'Supabase env vars not configured' }, request)
  }

  // ── Auth ────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return json(401, { error: 'Missing Authorization header' }, request)
  }
  let userId: string | null = null
  try {
    const verify = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: SUPABASE_ANON },
    })
    if (!verify.ok) return json(401, { error: 'Invalid session' }, request)
    const u = await verify.json()
    userId = u?.id || null
    if (!userId) return json(401, { error: 'Invalid session' }, request)
  } catch {
    return json(401, { error: 'Session verification failed' }, request)
  }

  // ── Rate limit ──────────────────────────────────────────
  // Status polls get a generous 60/min bucket so the UI's poll
  // loop doesn't trip its own rate limit.
  {
    const limited = rateLimitResponse(userId, 'batch-status', corsHeaders(request))
    if (limited) return limited
  }

  const url = new URL(request.url)
  const jobId = (url.searchParams.get('job_id') || '').trim()
  if (!jobId) return json(400, { error: 'job_id query param is required' }, request)

  // Ownership guard (same pattern as -start).
  try {
    const owner = await fetch(
      `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_batch_jobs?job_id=eq.${encodeURIComponent(jobId)}&select=user_id,completed_at`,
      { headers: { apikey: SUPABASE_SERVICE, Authorization: `Bearer ${SUPABASE_SERVICE}` } },
    )
    const rows = (await owner.json()) as Array<{ user_id: string | null; completed_at: string | null }>
    if (rows.length > 0 && rows[0]?.user_id && rows[0].user_id !== userId) {
      return json(403, { error: 'job_id does not belong to this user' }, request)
    }
  } catch {
    // Lookup failure shouldn't block status — fall through.
  }

  try {
    const resp = await sarvamFetch(
      SARVAM_ENDPOINTS.BATCH_STATUS(jobId),
      { method: 'GET' },
      {
        logEndpoint: 'batch-status',
        // Status polls are cheap; don't waste retries on a flaky
        // poll — the UI is already in a poll loop.
        maxRetries: 1,
        timeoutMs: 20_000,
        logContext: { user_id: userId },
      },
    )
    const payload = (await resp.json()) as BatchStatusResponse

    // Mirror to the DB so the Realtime subscription sees the
    // transitions. Don't await — the response to the caller is
    // what matters; the row update can race the next tick.
    const patch: Record<string, unknown> = {
      state: payload.state,
      progress: typeof payload.progress === 'number' ? payload.progress : undefined,
      error_message: payload.error_message ?? null,
    }
    if (TERMINAL_STATES.has(String(payload.state || ''))) {
      patch.completed_at = new Date().toISOString()
    }
    // Strip undefined to avoid sending nulls that overwrite real
    // values when Sarvam omits a field (e.g. progress on COMPLETED).
    for (const k of Object.keys(patch)) {
      if (patch[k] === undefined) delete patch[k]
    }
    fetch(
      `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_batch_jobs?job_id=eq.${encodeURIComponent(jobId)}`,
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
      console.warn('[sarvam-batch-status] db patch failed:', (e as Error)?.message)
    })

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        ...corsHeaders(request),
      },
    })
  } catch (e: unknown) {
    if (e instanceof SarvamApiError) {
      logSarvamCall({
        user_id: userId,
        endpoint: 'batch-status',
        status: e.status,
        latency_ms: 0,
        error_code: e.code,
        error_message: e.message.slice(0, 500),
        request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message,
        code: e.code,
        request_id: e.requestId,
      }, request)
    }
    return json(500, { error: (e as Error)?.message || 'Batch status failed' }, request)
  }
}
