/* ================================================================
   SARVAM AI — Text-to-Speech HTTP Streaming

   POST /.netlify/functions/sarvam-tts-stream

   Same JSON body as /sarvam-tts (TtsRequest) BUT:
     • Higher text cap: ≤ 3500 chars on bulbul:v3 (vs 2500 REST).
     • Response is RAW BINARY AUDIO (Sarvam's /text-to-speech/stream
       returns the audio body directly — no base64 JSON wrap).
     • We pipe Sarvam's body straight back to the caller, so the
       browser <audio> can start playback before the full file is
       generated. Critical for serverless pipelines + long
       narration where the REST round-trip would block on the
       full base64 download.

   Behaviour
   ─────────
     • Auth, rate-limit, validation: same as /sarvam-tts.
     • On success: streams body bytes, Content-Type set per codec,
       X-Sarvam-Request-Id forwarded if present.
     • On error: Sarvam returns JSON instead of audio bytes — we
       detect that (text/json content type) and surface as our
       usual { error, code, request_id } envelope.

   Use this when
   ─────────────
     • Generating a long Hindi narration (>2500 chars) from a route
       handler / cron / pipeline.
     • You want playback to start within a second instead of
       waiting for the full base64 chunk.
     • You need to pipe to a file / S3 / R2 / Supabase Storage on
       the server side without a manual base64 decode pass.
   ================================================================ */

import {
  SARVAM_DEFAULTS,
  SARVAM_ENDPOINTS,
  validateTtsStreamRequest,
  type TtsStreamRequest,
} from '../../lib/sarvam/types'
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

const CODEC_MIME: Record<string, string> = {
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
  opus: 'audio/ogg; codecs=opus',
  flac: 'audio/flac',
  pcm: 'audio/L16',
  linear16: 'audio/L16',
  mulaw: 'audio/basic',
  alaw: 'audio/x-alaw',
}

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

  // Rate-limit — share the 'tts' bucket. Streaming costs the same
  // at Sarvam's tier and we don't want a stream-spam shortcut.
  {
    const limited = rateLimitResponse(userId, 'tts', corsHeaders(request))
    if (limited) return limited
  }

  // Parse + validate (3500-char cap on bulbul:v3)
  let body: TtsStreamRequest
  try {
    body = validateTtsStreamRequest(await request.json())
  } catch (e: unknown) {
    const err = e as { message?: string; field?: string }
    return json(400, { error: err.message || 'Invalid request', field: err.field }, request)
  }

  // Fill defaults — same rules as /sarvam-tts.
  const payload: TtsStreamRequest = {
    speaker: SARVAM_DEFAULTS.SPEAKER,
    model: SARVAM_DEFAULTS.TTS_MODEL,
    pace: SARVAM_DEFAULTS.TTS_PACE,
    temperature: SARVAM_DEFAULTS.TTS_TEMPERATURE,
    speech_sample_rate: SARVAM_DEFAULTS.TTS_SAMPLE_RATE,
    output_audio_codec: SARVAM_DEFAULTS.TTS_OUTPUT_CODEC,
    enable_preprocessing: true,
    ...body,
  }
  if (payload.model === 'bulbul:v3') {
    delete (payload as Record<string, unknown>).pitch
    delete (payload as Record<string, unknown>).loudness
  }

  // Call Sarvam — sarvamFetch returns a Response we can stream from.
  // We deliberately don't use sarvamJson here: the success body is
  // binary audio bytes, not JSON. sarvamFetch will detect 4xx/5xx
  // and throw a SarvamApiError with the parsed error envelope.
  try {
    const upstream = await sarvamFetch(
      SARVAM_ENDPOINTS.TTS_STREAM,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      {
        logEndpoint: 'tts-stream',
        // Long narrations can take a while to start streaming —
        // give the *initial* connection 30s. Sarvam keeps the
        // body flowing on its own clock after that.
        timeoutMs: 30_000,
        // No retries on streaming success — if the first byte
        // shipped we can't safely retry. Retries on 429/5xx
        // happen before any bytes flow.
        maxRetries: 3,
        logContext: {
          user_id: userId,
          model: payload.model,
          target_language: payload.target_language_code,
          speaker: payload.speaker,
          input_chars: payload.text.length,
        },
      },
    )

    // Guard: if Sarvam returns JSON (unlikely on 2xx but possible
    // for unrecognised payloads under their CDN's behaviour), surface
    // as an error envelope instead of streaming garbage.
    const contentType = upstream.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const parsed = await upstream.json().catch(() => ({}))
      return json(502, {
        error: (parsed as { error?: { message?: string } })?.error?.message || 'Sarvam returned JSON instead of audio',
        request_id: upstream.headers.get('x-request-id') || undefined,
      }, request)
    }

    const codec = payload.output_audio_codec ?? 'mp3'
    const mime = upstream.headers.get('content-type') || CODEC_MIME[codec] || 'application/octet-stream'

    // Forward the streaming body as-is. The browser's <audio>
    // element can start playback as bytes arrive.
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'X-Sarvam-Request-Id': upstream.headers.get('x-request-id') || '',
        // Browsers default to "Transfer-Encoding: chunked" when
        // the upstream is streaming; don't set Content-Length —
        // we don't know it.
        'Cache-Control': 'no-store',
        ...corsHeaders(request),
      },
    })
  } catch (e: unknown) {
    if (e instanceof SarvamApiError) {
      logSarvamCall({
        user_id: userId,
        endpoint: 'tts-stream',
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
    return json(500, { error: (e as Error)?.message || 'TTS stream failed' }, request)
  }
}
