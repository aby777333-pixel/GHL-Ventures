/* ================================================================
   SARVAM AI — Document Digitization: start job

   POST /.netlify/functions/sarvam-doc-start
   Body: { "job_id": "..." }

   Kicks off processing after the client has PUT the source file
   to the signed upload_url returned by /sarvam-doc-create.
   Patches the sarvam_document_jobs row → state=Running + started_at.

   Auth: Supabase JWT + ownership check.
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
const corsHeaders = (req: Request) => {
  const o = req.headers.get('origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
const json = (status: number, body: unknown, req: Request) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders(req) } })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' }, request)

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
    const limited = rateLimitResponse(userId, 'batch-start', corsHeaders(request))
    if (limited) return limited
  }

  let jobId = ''
  try {
    const b = await request.json()
    jobId = String(b?.job_id || '').trim()
  } catch {
    return json(400, { error: 'Body must be JSON with { job_id }' }, request)
  }
  if (!jobId) return json(400, { error: 'job_id is required' }, request)

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
    const resp = await sarvamJson<{ job_id: string; state: string }>(
      SARVAM_ENDPOINTS.DOC_JOB_START(jobId),
      {},
      {
        logEndpoint: 'doc-start',
        timeoutMs: 30_000,
        logContext: { user_id: userId },
      },
    )

    await fetch(
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
          state: resp.state || 'Running',
          started_at: new Date().toISOString(),
        }),
      },
    ).catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('[sarvam-doc-start] db patch failed:', (e as Error)?.message)
    })

    return new Response(JSON.stringify(resp), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders(request) },
    })
  } catch (e: unknown) {
    if (e instanceof SarvamApiError) {
      logSarvamCall({
        user_id: userId, endpoint: 'doc-start', status: e.status, latency_ms: 0,
        error_code: e.code, error_message: e.message.slice(0, 500), request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message, code: e.code, request_id: e.requestId,
      }, request)
    }
    return json(500, { error: (e as Error)?.message || 'Doc start failed' }, request)
  }
}
