/* ================================================================
   SARVAM AI — Document Digitization: create job

   POST /.netlify/functions/sarvam-doc-create

   Body (JSON):
     {
       "language":       "hi-IN",       // BCP-47 (any of 23 incl. extended Indic)
       "output_format":  "md" | "html", // default 'md'
       "file_name":      "deck.pdf",    // optional, just for the audit row
       "file_size":      1234567         // optional, persisted in source_bytes
     }

   Returns:
     {
       job_id, state, upload_url, expires_at?
     }

   Flow (mirrors batch STT):
     1. Browser POSTs here → gets job_id + signed upload_url.
     2. Browser PUTs the PDF directly to upload_url (no proxy).
     3. Browser POSTs to /sarvam-doc-start.
     4. Browser polls /sarvam-doc-status until terminal.
     5. Browser GETs /sarvam-doc-output → signed download for the
        result ZIP.

   PDFs > 10 pages: split client-side before upload. The function
   returns a friendly 422 if Sarvam complains; we don't carry pdf-lib
   in the function cold-start.
   ================================================================ */

import {
  SARVAM_ENDPOINTS,
  validateDocumentJobCreate,
  type DocumentJobCreateRequest,
  type DocumentJobCreateResponse,
} from '../../lib/sarvam/types'
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

interface BodyExtra { file_name?: string; file_size?: number }

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

  // Share batch-create's 10/min cap — document jobs cost real Vision-
  // model time so we don't want users spamming them.
  {
    const limited = rateLimitResponse(userId, 'batch-create', corsHeaders(request))
    if (limited) return limited
  }

  let body: DocumentJobCreateRequest & BodyExtra
  try {
    const raw = await request.json()
    const validated = validateDocumentJobCreate(raw)
    body = {
      ...validated,
      file_name: typeof (raw as BodyExtra).file_name === 'string' ? (raw as BodyExtra).file_name : undefined,
      file_size: typeof (raw as BodyExtra).file_size === 'number' ? (raw as BodyExtra).file_size : undefined,
    }
  } catch (e: unknown) {
    const err = e as { message?: string; field?: string }
    return json(400, { error: err.message || 'Invalid request', field: err.field }, request)
  }

  try {
    const resp = await sarvamJson<DocumentJobCreateResponse>(
      SARVAM_ENDPOINTS.DOC_PARSE,
      { language: body.language, output_format: body.output_format || 'md' },
      {
        logEndpoint: 'doc-create',
        timeoutMs: 30_000,
        logContext: { user_id: userId, source_language: body.language, mode: body.output_format || 'md' },
      },
    )
    if (!resp.job_id) return json(502, { error: 'Sarvam returned no job_id' }, request)

    // Persist for tracking + Realtime.
    await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_document_jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE,
        Authorization: `Bearer ${SUPABASE_SERVICE}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        job_id: resp.job_id,
        user_id: userId,
        language: body.language,
        output_format: body.output_format || 'md',
        source_file_name: body.file_name || null,
        source_bytes: body.file_size ?? null,
        state: resp.state || 'Accepted',
      }),
    }).catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('[sarvam-doc-create] db insert failed:', (e as Error)?.message)
    })

    return new Response(JSON.stringify(resp), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders(request) },
    })
  } catch (e: unknown) {
    if (e instanceof SarvamApiError) {
      logSarvamCall({
        user_id: userId,
        endpoint: 'doc-create',
        status: e.status,
        latency_ms: 0,
        error_code: e.code,
        error_message: e.message.slice(0, 500),
        source_language: body.language,
        request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message, code: e.code, request_id: e.requestId,
      }, request)
    }
    return json(500, { error: (e as Error)?.message || 'Doc create failed' }, request)
  }
}
