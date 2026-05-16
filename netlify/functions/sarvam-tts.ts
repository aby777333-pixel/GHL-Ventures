/* ================================================================
   SARVAM AI — Text-to-Speech (REST)

   POST /.netlify/functions/sarvam-tts

   Body (JSON):
     {
       "text":                 "Welcome to GHL India Ventures",
       "target_language_code": "en-IN",
       "speaker":              "shubh",      // optional, default 'shubh'
       "model":                "bulbul:v3",  // optional, default
       "pace":                 1.0,          // optional, 0.5–2.0
       "temperature":          0.6,          // optional, v3 only
       "speech_sample_rate":   24000,        // optional
       "output_audio_codec":   "wav"         // optional
     }

   Returns: audio bytes (binary), Content-Type matches the codec.
            X-Sarvam-Request-Id header for traceability.

   Auth: Supabase user session OR public access — see ALLOW_ANON
         below. Currently locked to authenticated users to avoid
         shipping a public TTS endpoint that bleeds credits.
   ================================================================ */

import {
  SARVAM_DEFAULTS,
  SARVAM_ENDPOINTS,
  validateTtsRequest,
  type TtsRequest,
  type TtsResponse,
} from '../../lib/sarvam/types'
import {
  SarvamApiError,
  assertSarvamConfigured,
  logSarvamCall,
  sarvamJson,
} from '../../lib/sarvam/client'
import { rateLimitResponse } from '../../lib/sarvam/rateLimit'

// Set to true ONLY for an explicit public TTS demo with Turnstile
// in front. Production = false. Public TTS without a captcha is a
// blank cheque for credit drain.
const ALLOW_ANON = false

const ALLOWED_ORIGINS = [
  'https://ghl-india-ventures-2025.netlify.app',
  'https://ghlindiaventures.com',
  'https://www.ghlindiaventures.com',
]

function corsHeaders(req: Request, extra: Record<string, string> = {}): Record<string, string> {
  const origin = req.headers.get('origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...extra,
  }
}

const json = (status: number, body: unknown, req: Request) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  })

// MIME mapping for the audio response. Sarvam returns base64 in
// `audios[0]`; we hand the browser ready-to-play bytes so the
// <audio> element can decode without a re-wrap.
const CODEC_MIME: Record<string, string> = {
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
  opus: 'audio/ogg; codecs=opus',
  flac: 'audio/flac',
  pcm: 'audio/L16',
  mulaw: 'audio/basic',
  alaw: 'audio/x-alaw',
}

export default async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== 'POST')
    return json(405, { error: 'Method not allowed' }, request)

  // Refuse early if the API key isn't configured — gives a clear
  // ops error instead of a generic 500 from sarvam-side auth fail.
  try {
    assertSarvamConfigured()
  } catch (e: unknown) {
    return json(500, { error: (e as Error).message }, request)
  }

  // ── Auth gate ────────────────────────────────────────────
  // Supabase session is checked via the user's access token in
  // the Authorization header. We don't need to load the profile —
  // a valid JWT is enough to say "you're allowed to spend credits".
  // Rate limiting (Phase 2) refines per-user caps.
  let userId: string | null = null
  if (!ALLOW_ANON) {
    const authHeader = request.headers.get('authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return json(401, { error: 'Missing Authorization header' }, request)
    }
    const token = authHeader.slice(7).trim()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    if (!supabaseUrl || !anonKey) {
      return json(500, { error: 'Supabase env vars not configured' }, request)
    }
    try {
      const verify = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
      })
      if (!verify.ok) return json(401, { error: 'Invalid session' }, request)
      const u = await verify.json()
      userId = u?.id || null
      if (!userId) return json(401, { error: 'Invalid session' }, request)
    } catch {
      return json(401, { error: 'Session verification failed' }, request)
    }
  }

  // ── Rate limit (per-user, in-memory bucket) ──────────────
  {
    const limited = rateLimitResponse(userId, 'tts', corsHeaders(request))
    if (limited) return limited
  }

  // ── Parse + validate body ────────────────────────────────
  let body: TtsRequest
  try {
    const raw = await request.json()
    body = validateTtsRequest(raw)
  } catch (e: unknown) {
    const err = e as { message?: string; field?: string }
    return json(400, { error: err.message || 'Invalid request', field: err.field }, request)
  }

  // Fill in our project defaults if the caller didn't.
  const payload: TtsRequest = {
    speaker: SARVAM_DEFAULTS.SPEAKER,
    model: SARVAM_DEFAULTS.TTS_MODEL,
    pace: SARVAM_DEFAULTS.TTS_PACE,
    temperature: SARVAM_DEFAULTS.TTS_TEMPERATURE,
    speech_sample_rate: SARVAM_DEFAULTS.TTS_SAMPLE_RATE,
    output_audio_codec: SARVAM_DEFAULTS.TTS_OUTPUT_CODEC,
    enable_preprocessing: true,
    ...body,
  }
  // bulbul:v3 ignores pitch/loudness — strip them defensively so we
  // don't surface a 400 from Sarvam if a stale UI sends them.
  if (payload.model === 'bulbul:v3') {
    delete (payload as Record<string, unknown>).pitch
    delete (payload as Record<string, unknown>).loudness
  }

  // ── Call Sarvam ──────────────────────────────────────────
  try {
    const resp = await sarvamJson<TtsResponse>(
      SARVAM_ENDPOINTS.TTS,
      payload,
      {
        logEndpoint: 'tts',
        timeoutMs: 30_000,
        logContext: {
          user_id: userId,
          model: payload.model,
          target_language: payload.target_language_code,
          speaker: payload.speaker,
          input_chars: payload.text.length,
        },
      },
    )
    const b64 = resp.audios?.[0]
    if (!b64) return json(502, { error: 'Sarvam returned no audio' }, request)

    const bytes = Buffer.from(b64, 'base64')
    const codec = payload.output_audio_codec ?? 'wav'
    const mime = CODEC_MIME[codec] || 'application/octet-stream'

    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(bytes.length),
        'X-Sarvam-Request-Id': resp.request_id ?? '',
        'Cache-Control': 'no-store',
        ...corsHeaders(request),
      },
    })
  } catch (e: unknown) {
    if (e instanceof SarvamApiError) {
      // Audit row was already written inside sarvamFetch.
      logSarvamCall({
        user_id: userId,
        endpoint: 'tts',
        status: e.status,
        latency_ms: 0,
        error_code: e.code,
        error_message: e.message.slice(0, 500),
        model: payload.model,
        target_language: payload.target_language_code,
        speaker: payload.speaker,
        input_chars: payload.text.length,
        request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message,
        code: e.code,
        request_id: e.requestId,
      }, request)
    }
    const msg = (e as Error)?.message || 'TTS failed'
    return json(500, { error: msg }, request)
  }
}
