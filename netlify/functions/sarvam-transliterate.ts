/* ================================================================
   SARVAM AI — Transliteration (REST)

   POST /.netlify/functions/sarvam-transliterate

   Body (JSON):
     {
       "input":                "मुझे कल 9:30am को अपॉइंटमेंट है",
       "source_language_code": "hi-IN",       // or 'auto'
       "target_language_code": "hi-IN",
       "spoken_form":          true,          // optional
       "numerals_format":      "international" // optional
     }

   Three use cases (all on the same endpoint):
     - Romanize:           Indic script  → Roman
     - Indic conversion:   Roman/English → Indic script
     - Spoken form:        written       → speakable (spoken_form=true)

   Returns: { request_id, transliterated_text, source_language_code }

   Supports 11 core langs (10 Indic + en-IN). Max input 1000 chars.
   ================================================================ */

import {
  SARVAM_ENDPOINTS,
  validateTransliterateRequest,
  type TransliterateRequest,
  type TransliterateResponse,
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

  // Rate limit — share the 'translate' bucket since these are
  // conceptually the same family at Sarvam's pricing tier.
  {
    const limited = rateLimitResponse(userId, 'translate', corsHeaders(request))
    if (limited) return limited
  }

  // Validate + forward
  let body: TransliterateRequest
  try {
    body = validateTransliterateRequest(await request.json())
  } catch (e: unknown) {
    const err = e as { message?: string; field?: string }
    return json(400, { error: err.message || 'Invalid request', field: err.field }, request)
  }

  try {
    const resp = await sarvamJson<TransliterateResponse>(
      SARVAM_ENDPOINTS.TRANSLITERATE,
      body,
      {
        logEndpoint: 'transliterate',
        timeoutMs: 30_000,
        logContext: {
          user_id: userId,
          source_language: String(body.source_language_code),
          target_language: body.target_language_code,
          mode: body.spoken_form ? 'spoken_form' : null,
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
        endpoint: 'transliterate',
        status: e.status,
        latency_ms: 0,
        error_code: e.code,
        error_message: e.message.slice(0, 500),
        source_language: String(body.source_language_code),
        target_language: body.target_language_code,
        input_chars: body.input.length,
        request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message,
        code: e.code,
        request_id: e.requestId,
      }, request)
    }
    return json(500, { error: (e as Error)?.message || 'Transliterate failed' }, request)
  }
}
