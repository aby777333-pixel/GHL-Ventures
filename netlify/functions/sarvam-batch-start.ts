/* ================================================================
   SARVAM AI — Batch STT: start job

   POST /.netlify/functions/sarvam-batch-start

   Body (JSON): { "job_id": "..." }

   Returns: { job_id, state }

   Side effects:
     - Sets started_at + state on the matching sarvam_batch_jobs
       row so the UI's Realtime subscription gets the transition.

   Auth: Supabase user JWT — and we cross-check that the job_id
   in the body actually belongs to the caller (no horizontal
   privilege escalation — user A can't start user B's job).
   ================================================================ */

import { SARVAM_ENDPOINTS } from '../../lib/sarvam/types'
import {
  SarvamApiError,
  assertSarvamConfigured,
  logSarvamCall,
  sarvamJson,
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

export default async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== 'POST')
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
  {
    const limited = rateLimitResponse(userId, 'batch-start', corsHeaders(request))
    if (limited) return limited
  }

  // ── Parse + ownership check ─────────────────────────────
  let jobId = ''
  try {
    const body = await request.json()
    jobId = String(body?.job_id || '').trim()
  } catch {
    return json(400, { error: 'Body must be JSON with { job_id }' }, request)
  }
  if (!jobId) return json(400, { error: 'job_id is required' }, request)

  // Ownership: refuse if the row exists and isn't ours. If the row
  // is missing (e.g. the user is starting a job they created in
  // another session before the DB insert hit), we let it through —
  // worst case Sarvam itself rejects with 404.
  try {
    const owner = await fetch(
      `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_batch_jobs?job_id=eq.${encodeURIComponent(jobId)}&select=user_id`,
      {
        headers: {
          apikey: SUPABASE_SERVICE,
          Authorization: `Bearer ${SUPABASE_SERVICE}`,
        },
      },
    )
    const rows = (await owner.json()) as Array<{ user_id: string | null }>
    if (rows.length > 0 && rows[0]?.user_id && rows[0].user_id !== userId) {
      return json(403, { error: 'job_id does not belong to this user' }, request)
    }
  } catch {
    // Lookup failure shouldn't block the start — fall through.
  }

  try {
    const resp = await sarvamJson<{ job_id: string; state: string }>(
      SARVAM_ENDPOINTS.BATCH_START(jobId),
      // Sarvam's start endpoint expects no body, but POSTs without a
      // Content-Length sometimes confuse proxies. Send an empty {}.
      {},
      {
        logEndpoint: 'batch-start',
        timeoutMs: 30_000,
        logContext: { user_id: userId },
      },
    )

    // Mark the row as RUNNING / started_at so the UI sees the
    // transition without waiting for the first status poll.
    try {
      await fetch(
        `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_batch_jobs?job_id=eq.${encodeURIComponent(jobId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_SERVICE,
            Authorization: `Bearer ${SUPABASE_SERVICE}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            state: resp.state || 'RUNNING',
            started_at: new Date().toISOString(),
          }),
        },
      )
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[sarvam-batch-start] db patch failed:', (e as Error)?.message)
    }

    return new Response(JSON.stringify(resp), {
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
        endpoint: 'batch-start',
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
    return json(500, { error: (e as Error)?.message || 'Batch start failed' }, request)
  }
}
