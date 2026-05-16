/* ================================================================
   SARVAM AI — Document Digitization: signed download URL

   GET /.netlify/functions/sarvam-doc-output?job_id=<id>

   Returns { job_id, output_url, expires_at? } from Sarvam.
   Refuses 409 if the job isn't terminal yet (saves the user a
   confusing 404 from the CDN).

   Caches the signed URL + its expiry into sarvam_document_jobs
   so the UI can hand back the same URL on a refresh without
   another round-trip to Sarvam, until expires_at.
   ================================================================ */

import { SARVAM_ENDPOINTS, type DocumentJobOutputResponse } from '../../lib/sarvam/types'
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

const NOT_READY = new Set(['Accepted', 'Pending', 'Running'])

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
    const limited = rateLimitResponse(userId, 'batch-output', corsHeaders(request))
    if (limited) return limited
  }

  const url = new URL(request.url)
  const jobId = (url.searchParams.get('job_id') || '').trim()
  if (!jobId) return json(400, { error: 'job_id query param is required' }, request)

  // Ownership + readiness + cached-URL check in one DB hit.
  let cachedUrl: string | null = null
  let cachedExpiresAt: string | null = null
  try {
    const lookup = await fetch(
      `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_document_jobs?job_id=eq.${encodeURIComponent(jobId)}&select=user_id,state,output_url,output_url_expires_at`,
      { headers: { apikey: SUPABASE_SERVICE, Authorization: `Bearer ${SUPABASE_SERVICE}` } },
    )
    const rows = (await lookup.json()) as Array<{
      user_id: string | null; state: string; output_url: string | null; output_url_expires_at: string | null
    }>
    if (rows.length > 0) {
      if (rows[0]?.user_id && rows[0].user_id !== userId) {
        return json(403, { error: 'job_id does not belong to this user' }, request)
      }
      if (NOT_READY.has(String(rows[0]?.state || ''))) {
        return json(409, {
          error: `Job is still ${rows[0].state}. Wait for Completed / PartiallyCompleted / Failed.`,
          state: rows[0].state,
        }, request)
      }
      // Cache hit if URL still has > 60s of life.
      if (rows[0]?.output_url && rows[0]?.output_url_expires_at) {
        const expiry = new Date(rows[0].output_url_expires_at).getTime()
        if (expiry - Date.now() > 60_000) {
          cachedUrl = rows[0].output_url
          cachedExpiresAt = rows[0].output_url_expires_at
        }
      }
    }
  } catch { /* fall through */ }

  if (cachedUrl) {
    return new Response(JSON.stringify({
      job_id: jobId, output_url: cachedUrl, expires_at: cachedExpiresAt,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders(request) },
    })
  }

  try {
    const resp = await sarvamFetch(SARVAM_ENDPOINTS.DOC_JOB_OUTPUT(jobId), { method: 'GET' }, {
      logEndpoint: 'doc-output',
      maxRetries: 1,
      timeoutMs: 20_000,
      logContext: { user_id: userId },
    })
    const payload = await resp.json() as DocumentJobOutputResponse

    // Cache the URL + expiry.
    if (payload.output_url) {
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
          body: JSON.stringify({
            output_url: payload.output_url,
            output_url_expires_at: payload.expires_at ?? null,
          }),
        },
      ).catch((e) => {
        // eslint-disable-next-line no-console
        console.warn('[sarvam-doc-output] db patch failed:', (e as Error)?.message)
      })
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders(request) },
    })
  } catch (e: unknown) {
    if (e instanceof SarvamApiError) {
      logSarvamCall({
        user_id: userId, endpoint: 'doc-output', status: e.status, latency_ms: 0,
        error_code: e.code, error_message: e.message.slice(0, 500), request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message, code: e.code, request_id: e.requestId,
      }, request)
    }
    return json(500, { error: (e as Error)?.message || 'Doc output failed' }, request)
  }
}
