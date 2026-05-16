/* ================================================================
   SARVAM AI — Speech-to-Text (REST, saaras:v3)

   POST /.netlify/functions/sarvam-stt-v2

   Multipart form fields:
     file              audio blob — wav | mp3 | aac | aiff | ogg | opus
                       | flac | mp4 | m4a | amr | wma | webm | raw pcm
     model             default 'saaras:v3'
     mode              transcribe | translate | verbatim | translit | codemix
                       (saaras:v3 only)
     language_code     BCP-47 (e.g. 'hi-IN') OR the literal 'unknown'
                       for auto-detect (NOT 'auto' — that's a Translate
                       thing).
     input_audio_codec pcm_s16le | pcm_l16 | pcm_raw  — required only
                       for raw PCM uploads (which must be 16 kHz mono).
     translate_to_english   if 'true', routes to /speech-to-text-translate
                       instead of /speech-to-text. Mutually exclusive
                       with mode='translate' — pass exactly one.

   Returns: JSON SttResponse = { request_id, transcript, language_code,
            timestamps?, diarized_transcript? }

   Coexists with the legacy `sarvam-stt.mjs`. New callers use this one;
   the .mjs stays in place to not break anything that already points at it.

   Diarization is Batch-only — if the caller passes `with_diarization`
   or `num_speakers` we reject with 400 and a clear pointer to the
   /sarvam-batch-create endpoint (Phase 2). REST hard-caps audio at
   30 seconds; we don't enforce this here (we let Sarvam reject), but
   the UI in <STTRecorder /> warns.
   ================================================================ */

import {
  SARVAM_DEFAULTS,
  SARVAM_ENDPOINTS,
  validateSttFields,
  type SttRestRequest,
  type SttResponse,
} from '../../lib/sarvam/types'
import {
  SarvamApiError,
  assertSarvamConfigured,
  logSarvamCall,
  sarvamMultipart,
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

// Best-effort audio duration estimate for the audit row. We can't
// fully decode the file in a Netlify Function (no ffmpeg), but for
// WAV we can read the header. Falls back to null otherwise.
function estimateWavSeconds(buf: ArrayBuffer): number | null {
  try {
    const view = new DataView(buf)
    if (view.byteLength < 44) return null
    // RIFF header + fmt chunk parsing
    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
    if (riff !== 'RIFF') return null
    const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))
    if (wave !== 'WAVE') return null
    const channels = view.getUint16(22, true)
    const sampleRate = view.getUint32(24, true)
    const bitsPerSample = view.getUint16(34, true)
    const bytesPerSecond = (channels * sampleRate * bitsPerSample) / 8
    if (!bytesPerSecond) return null
    // dataSize is at offset 40 only if no extra chunks; good enough
    // for our 30s REST audit needs.
    const dataSize = view.getUint32(40, true)
    return +(dataSize / bytesPerSecond).toFixed(3)
  } catch {
    return null
  }
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

  // ── Parse multipart ──────────────────────────────────────
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json(400, { error: 'Expected multipart/form-data' }, request)
  }

  const file = form.get('file')
  if (!(file instanceof Blob)) {
    return json(400, { error: 'Missing `file` field' }, request)
  }

  // Reject diarization knobs — Batch-only.
  if (form.get('with_diarization') || form.get('num_speakers')) {
    return json(400, {
      error: 'Diarization is Batch-only. Use POST /.netlify/functions/sarvam-batch-create with with_diarization=true.',
    }, request)
  }

  const translateToEnglish = String(form.get('translate_to_english') || '').toLowerCase() === 'true'

  // Validate the remaining fields with the shared helper.
  let validated: SttRestRequest
  try {
    validated = validateSttFields({
      model: form.get('model') ?? undefined,
      mode: form.get('mode') ?? undefined,
      language_code: form.get('language_code') ?? undefined,
      input_audio_codec: form.get('input_audio_codec') ?? undefined,
    })
  } catch (e: unknown) {
    const err = e as { message?: string; field?: string }
    return json(400, { error: err.message || 'Invalid request', field: err.field }, request)
  }

  if (translateToEnglish && validated.mode === 'translate') {
    return json(400, {
      error: 'Pass either translate_to_english=true OR mode=translate, not both.',
    }, request)
  }

  // Build the Sarvam-side multipart. We rebuild it (rather than
  // forwarding `form` verbatim) so unknown fields the caller sent
  // don't get echoed upstream.
  const sarvamForm = new FormData()
  sarvamForm.append('file', file, (file as File).name || 'recording.wav')
  sarvamForm.append('model', validated.model ?? SARVAM_DEFAULTS.STT_MODEL)
  if (validated.mode) sarvamForm.append('mode', validated.mode)
  if (validated.language_code) sarvamForm.append('language_code', validated.language_code)
  if (validated.input_audio_codec) sarvamForm.append('input_audio_codec', validated.input_audio_codec)

  // Pick endpoint. mode='translate' on the standard endpoint and
  // the dedicated /speech-to-text-translate endpoint produce
  // equivalent output for saaras:v3 — we prefer mode='translate'
  // (forward-compatible), but expose the legacy STTT URL via the
  // translate_to_english flag for callers that need it.
  const endpoint = translateToEnglish
    ? SARVAM_ENDPOINTS.STT_TRANSLATE
    : SARVAM_ENDPOINTS.STT

  // Audit context — duration is best-effort.
  let audioSeconds: number | null = null
  try {
    const buf = await file.slice(0, 64).arrayBuffer()
    audioSeconds = estimateWavSeconds(buf as ArrayBuffer)
  } catch { /* ignore */ }

  try {
    const resp = await sarvamMultipart<SttResponse>(endpoint, sarvamForm, {
      logEndpoint: translateToEnglish ? 'stt-translate' : 'stt',
      // STT can be slow on the largest accepted clip — give it a
      // generous timeout. The 30s audio cap is enforced by Sarvam,
      // not us.
      timeoutMs: 60_000,
      logContext: {
        user_id: userId,
        model: validated.model ?? SARVAM_DEFAULTS.STT_MODEL,
        mode: validated.mode,
        source_language: validated.language_code,
        audio_seconds: audioSeconds,
      },
    })

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
        endpoint: translateToEnglish ? 'stt-translate' : 'stt',
        status: e.status,
        latency_ms: 0,
        error_code: e.code,
        error_message: e.message.slice(0, 500),
        model: validated.model ?? SARVAM_DEFAULTS.STT_MODEL,
        mode: validated.mode,
        source_language: validated.language_code,
        audio_seconds: audioSeconds,
        request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message,
        code: e.code,
        request_id: e.requestId,
      }, request)
    }
    const msg = (e as Error)?.message || 'STT failed'
    return json(500, { error: msg }, request)
  }
}
