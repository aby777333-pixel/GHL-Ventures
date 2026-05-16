/* ================================================================
   SARVAM AI — Translate (REST)

   POST /.netlify/functions/sarvam-translate

   Body (JSON):
     {
       "input":                "मैं ऑफिस जा रहा हूँ",
       "source_language_code": "hi-IN",         // or 'auto' for mayura:v1
       "target_language_code": "en-IN",
       "model":                "sarvam-translate:v1",  // optional
       "mode":                 "formal",        // optional
       "output_script":        null,            // optional, mayura:v1 only
       "numerals_format":      "international", // optional
       "speaker_gender":       "Male"           // optional
     }

   Returns: SarvamTranslateResponse = {
     request_id, translated_text, source_language_code
   }

   Model auto-selection (when caller omits `model`):
     - if either source or target language is OUTSIDE the 11-language
       core (i.e. Sanskrit / Urdu / Manipuri / Bodo / Maithili / etc.)
       → route to sarvam-translate:v1 (all 22 Indian langs + English).
     - else → mayura:v1 (faster, supports auto-detect + 4 modes +
       output_script + colloquial modes).
   ================================================================ */

import {
  SARVAM_CAPABILITY_LANG_SUPPORT,
  SARVAM_DEFAULTS,
  SARVAM_ENDPOINTS,
  validateTranslateRequest,
  type SarvamLanguageCode,
  type TranslateRequest,
  type TranslateResponse,
} from '../../lib/sarvam/types'
import {
  SarvamApiError,
  assertSarvamConfigured,
  logSarvamCall,
  sarvamJson,
} from '../../lib/sarvam/client'

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

// Auto-select the model when the caller didn't pin one. mayura:v1
// is faster + supports auto-detect + colloquial modes + output_script
// but only covers the 11 core languages. sarvam-translate:v1 covers
// all 22 + English in `formal` mode only.
function pickModel(
  source: TranslateRequest['source_language_code'],
  target: SarvamLanguageCode,
): 'mayura:v1' | 'sarvam-translate:v1' {
  // If source is 'auto', mayura:v1 is the only option that supports it.
  if (source === 'auto') return 'mayura:v1'
  const isCore = (l: SarvamLanguageCode) =>
    SARVAM_CAPABILITY_LANG_SUPPORT['translate-mayura-v1'](l)
  if (!isCore(target) || !isCore(source as SarvamLanguageCode)) {
    return 'sarvam-translate:v1'
  }
  // Both inside the core 11 → default to mayura:v1 unless the caller's
  // chosen mode forces sarvam-translate:v1. We let the validator handle
  // the latter case.
  return 'mayura:v1'
}

export default async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== 'POST')
    return json(405, { error: 'Method not allowed' }, request)

  try {
    assertSarvamConfigured()
  } catch (e: unknown) {
    return json(500, { error: (e as Error).message }, request)
  }

  // ── Auth gate ────────────────────────────────────────────
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

  // ── Parse + validate ─────────────────────────────────────
  let body: TranslateRequest
  let rawIn: Record<string, unknown>
  try {
    rawIn = await request.json()
    // Auto-pick model BEFORE validation so the caller doesn't have
    // to know about the 11-vs-22 split. Caller's explicit `model`
    // wins.
    if (!rawIn.model) {
      rawIn = {
        ...rawIn,
        model: pickModel(
          rawIn.source_language_code as TranslateRequest['source_language_code'],
          rawIn.target_language_code as SarvamLanguageCode,
        ),
      }
    }
    // sarvam-translate:v1 only supports `formal`. Quietly coerce
    // unset/missing mode → 'formal' so the validator doesn't reject
    // a perfectly reasonable caller that didn't pass `mode`.
    if (rawIn.model === 'sarvam-translate:v1' && !rawIn.mode) {
      rawIn = { ...rawIn, mode: 'formal' }
    }
    body = validateTranslateRequest(rawIn)
  } catch (e: unknown) {
    const err = e as { message?: string; field?: string }
    return json(400, { error: err.message || 'Invalid request', field: err.field }, request)
  }

  // Project defaults: international numerals + formal mode for the
  // sarvam-translate:v1 path (already validated). mayura:v1 default
  // mode is whatever the caller picked or unset (Sarvam picks formal).
  const payload: TranslateRequest = {
    numerals_format: SARVAM_DEFAULTS.TRANSLATE_MODEL === 'sarvam-translate:v1' ? 'international' : undefined,
    ...body,
  }
  // Sanitise: drop output_script if model isn't mayura:v1.
  if (payload.model !== 'mayura:v1') {
    delete (payload as Record<string, unknown>).output_script
  }

  try {
    const resp = await sarvamJson<TranslateResponse>(
      SARVAM_ENDPOINTS.TRANSLATE,
      payload,
      {
        logEndpoint: 'translate',
        timeoutMs: 30_000,
        logContext: {
          user_id: userId,
          model: payload.model,
          source_language: String(payload.source_language_code),
          target_language: payload.target_language_code,
          mode: payload.mode,
          input_chars: payload.input.length,
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
        endpoint: 'translate',
        status: e.status,
        latency_ms: 0,
        error_code: e.code,
        error_message: e.message.slice(0, 500),
        model: payload.model,
        source_language: String(payload.source_language_code),
        target_language: payload.target_language_code,
        mode: payload.mode,
        input_chars: payload.input.length,
        request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message,
        code: e.code,
        request_id: e.requestId,
      }, request)
    }
    const msg = (e as Error)?.message || 'Translate failed'
    return json(500, { error: msg }, request)
  }
}
