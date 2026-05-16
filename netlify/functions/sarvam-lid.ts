/* ================================================================
   SARVAM AI — Language Identification (REST)

   POST /.netlify/functions/sarvam-lid

   Body (JSON): { "input": "Hello, how are you?" }

   Returns:
     {
       request_id:    string | null,
       language_code: "en-IN" | "hi-IN" | ... | null,
       script_code:   "Latn" | "Deva" | "Beng" | "Gujr" | ... | null
     }

   Cheap pre-flight before calling translate when source is uncertain.
   Max input 1000 chars.
   ================================================================ */

import {
  SARVAM_ENDPOINTS,
  validateLIDRequest,
  type LIDRequest,
  type LIDResponse,
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

export default async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' }, request)

  try { assertSarvamConfigured() } catch (e) {
    return json(500, { error: (e as Error).message }, request)
  }

  // Auth
  const authHeader = request.headers.get('authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return json(401, { error: 'Missing Authorization header' }, request)
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!supabaseUrl || !anonKey) {
    return json(500, { error: 'Supabase env vars not configured' }, request)
  }
  let userId: string | null = null
  try {
    const verify = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: anonKey },
    })
    if (!verify.ok) return json(401, { error: 'Invalid session' }, request)
    const u = await verify.json()
    userId = u?.id || null
    if (!userId) return json(401, { error: 'Invalid session' }, request)
  } catch {
    return json(401, { error: 'Session verification failed' }, request)
  }

  // Rate limit — LID is cheap; share translate's high bucket.
  {
    const limited = rateLimitResponse(userId, 'translate', corsHeaders(request))
    if (limited) return limited
  }

  let body: LIDRequest
  try {
    body = validateLIDRequest(await request.json())
  } catch (e: unknown) {
    const err = e as { message?: string; field?: string }
    return json(400, { error: err.message || 'Invalid request', field: err.field }, request)
  }

  try {
    const resp = await sarvamJson<LIDResponse>(
      SARVAM_ENDPOINTS.TEXT_LID,
      body,
      {
        logEndpoint: 'lid',
        timeoutMs: 15_000,
        logContext: {
          user_id: userId,
          input_chars: body.input.length,
        },
      },
    )
    return new Response(JSON.stringify(resp), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Sarvam-Request-Id': resp.request_id ?? '',
        'Cache-Control': 'no-store',
        ...corsHeaders(request),
      },
    })
  } catch (e: unknown) {
    if (e instanceof SarvamApiError) {
      logSarvamCall({
        user_id: userId,
        endpoint: 'lid',
        status: e.status,
        latency_ms: 0,
        error_code: e.code,
        error_message: e.message.slice(0, 500),
        input_chars: body.input.length,
        request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message,
        code: e.code,
        request_id: e.requestId,
      }, request)
    }
    return json(500, { error: (e as Error)?.message || 'LID failed' }, request)
  }
}
