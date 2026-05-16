/* ================================================================
   SARVAM AI — Batch STT: download URLs for completed outputs

   GET /.netlify/functions/sarvam-batch-output?job_id=<id>

   Returns Sarvam's signed-URL payload as-is. The browser then
   fetches each URL directly — no proxy needed because the URLs
   are pre-signed and short-lived (typically minutes to hours).

   Response shape (best-effort — Sarvam's exact field names may
   vary by model; we forward verbatim and let the UI normalise):
     {
       job_id: "...",
       output_urls: [
         { file_index: 0, url: "https://...signed...", expires_at: "..." },
         ...
       ]
     }

   Refuses if the job isn't in a terminal state — saves the user a
   confusing 404 from Sarvam's CDN if outputs aren't ready yet.
   Auth: Supabase JWT + ownership check on sarvam_batch_jobs.
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

const NOT_READY_STATES = new Set(['PENDING', 'RUNNING'])

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
  {
    const limited = rateLimitResponse(userId, 'batch-output', corsHeaders(request))
    if (limited) return limited
  }

  const url = new URL(request.url)
  const jobId = (url.searchParams.get('job_id') || '').trim()
  if (!jobId) return json(400, { error: 'job_id query param is required' }, request)

  // Ownership + readiness check in one DB hit.
  try {
    const lookup = await fetch(
      `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_batch_jobs?job_id=eq.${encodeURIComponent(jobId)}&select=user_id,state`,
      { headers: { apikey: SUPABASE_SERVICE, Authorization: `Bearer ${SUPABASE_SERVICE}` } },
    )
    const rows = (await lookup.json()) as Array<{ user_id: string | null; state: string }>
    if (rows.length > 0) {
      if (rows[0]?.user_id && rows[0].user_id !== userId) {
        return json(403, { error: 'job_id does not belong to this user' }, request)
      }
      if (NOT_READY_STATES.has(String(rows[0]?.state || ''))) {
        return json(409, {
          error: `Job is still ${rows[0].state}. Wait for COMPLETED / FAILED / PARTIAL before requesting outputs.`,
          state: rows[0].state,
        }, request)
      }
    }
    // If no row exists, fall through — Sarvam itself will 404 or
    // succeed and we'll surface whichever.
  } catch {
    // Lookup failure shouldn't block the output fetch — proceed.
  }

  try {
    const resp = await sarvamFetch(
      SARVAM_ENDPOINTS.BATCH_OUTPUT_URL(jobId),
      { method: 'GET' },
      {
        logEndpoint: 'batch-output',
        timeoutMs: 30_000,
        // One retry is enough — output URLs are minted on demand and
        // shouldn't be flaky.
        maxRetries: 1,
        logContext: { user_id: userId },
      },
    )
    const payload = await resp.json()
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
        endpoint: 'batch-output',
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
    return json(500, { error: (e as Error)?.message || 'Batch output failed' }, request)
  }
}
