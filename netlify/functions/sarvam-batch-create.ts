/* ================================================================
   SARVAM AI — Batch STT: create job

   POST /.netlify/functions/sarvam-batch-create

   Body (JSON):
     {
       "model":            "saaras:v3",            // optional
       "mode":             "transcribe",           // saaras:v3 only
       "language_code":    "hi-IN",                // or 'unknown'
       "with_diarization": true,                   // Batch-only feature
       "num_speakers":     2,                      // 1..10 hint
       "with_timestamps":  true,
       "file_count":       3,                      // 1..20, how many uploads
       "translate_to_english": false,              // route to STTT batch
                                                   // endpoint instead
       "input_audio_codec":   "pcm_s16le"          // raw PCM only
     }

   Returns:
     {
       job_id:      "...",
       state:       "PENDING",
       upload_urls: [{ file_index, url, expires_at }, ...]
     }

   Side effects:
     - Inserts a row into public.sarvam_batch_jobs with state=PENDING
       so the UI can subscribe via Supabase Realtime.
     - Wires the webhook automatically when SARVAM_WEBHOOK_TOKEN is
       set, so the user doesn't have to poll status — the callback
       handler (sarvam-batch-webhook.ts) updates the row in place.
   ================================================================ */

import {
  SARVAM_DEFAULTS,
  SARVAM_ENDPOINTS,
  type BatchJobCreateRequest,
  type BatchJobCreateResponse,
  type SarvamLanguageCode,
  type SttMode,
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const WEBHOOK_TOKEN = process.env.SARVAM_WEBHOOK_TOKEN || ''
const SITE_HOST = process.env.URL || process.env.DEPLOY_URL || 'https://ghl-india-ventures-2025.netlify.app'

interface BatchCreateBody {
  model?: 'saaras:v3' | 'saarika:v2.5' | 'saaras:v2.5'
  mode?: SttMode
  language_code?: SarvamLanguageCode | 'unknown'
  with_diarization?: boolean
  num_speakers?: number
  with_timestamps?: boolean
  file_count?: number
  translate_to_english?: boolean
  input_audio_codec?: 'wav' | 'pcm_s16le' | 'pcm_l16' | 'pcm_raw'
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
    const limited = rateLimitResponse(userId, 'batch-create', corsHeaders(request))
    if (limited) return limited
  }

  // ── Parse + validate ────────────────────────────────────
  let body: BatchCreateBody
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'Body must be JSON' }, request)
  }

  const fileCount = Math.max(1, Math.min(20, Number(body.file_count) || 1))
  const model = body.model || SARVAM_DEFAULTS.STT_MODEL
  if (body.mode && model !== 'saaras:v3') {
    return json(400, { error: 'mode requires saaras:v3' }, request)
  }
  if (body.num_speakers !== undefined) {
    const n = Number(body.num_speakers)
    if (!Number.isInteger(n) || n < 1 || n > 10) {
      return json(400, { error: 'num_speakers must be 1..10' }, request)
    }
  }
  if (body.language_code && body.language_code !== 'unknown') {
    // Light check — full check happens server-side at Sarvam.
    if (!/^[a-z]{2,3}-IN$/.test(body.language_code)) {
      return json(400, { error: 'invalid language_code' }, request)
    }
  }

  // ── Build the Sarvam payload ────────────────────────────
  const sarvamPayload: BatchJobCreateRequest = {
    model: model as BatchJobCreateRequest['model'],
    mode: body.mode,
    language_code: body.language_code,
    with_diarization: !!body.with_diarization,
    num_speakers: body.num_speakers,
    with_timestamps: !!body.with_timestamps,
    input_audio_codec: body.input_audio_codec,
  }
  // Auto-wire the webhook if we have a token + reachable URL. The
  // user can still poll; the webhook just removes the need.
  if (WEBHOOK_TOKEN) {
    sarvamPayload.callback = {
      url: `${SITE_HOST.replace(/\/$/, '')}/.netlify/functions/sarvam-batch-webhook`,
      auth_token: WEBHOOK_TOKEN,
    }
  }
  // Sarvam's create-job body needs `file_count` so it knows how many
  // upload URLs to mint. The field name in the spec is just `file_count`.
  ;(sarvamPayload as Record<string, unknown>).file_count = fileCount

  // ── Pick endpoint (transcribe vs translate-to-English) ──
  const endpoint = body.translate_to_english
    ? SARVAM_ENDPOINTS.STT_TRANSLATE_BATCH
    : SARVAM_ENDPOINTS.STT_BATCH

  try {
    const resp = await sarvamJson<BatchJobCreateResponse>(endpoint, sarvamPayload, {
      logEndpoint: body.translate_to_english ? 'batch-translate-create' : 'batch-create',
      timeoutMs: 30_000,
      logContext: {
        user_id: userId,
        model,
        mode: body.mode,
        source_language: body.language_code,
      },
    })

    // ── Persist the job row so the UI can subscribe ────────
    try {
      await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_batch_jobs`, {
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
          model,
          mode: body.mode || null,
          language_code: body.language_code || null,
          with_diarization: !!body.with_diarization,
          num_speakers: body.num_speakers || null,
          file_count: fileCount,
          state: resp.state || 'PENDING',
          callback_url: sarvamPayload.callback?.url || null,
        }),
      })
    } catch (e) {
      // Non-fatal — the job is created at Sarvam either way; we just
      // lose the realtime convenience.
      // eslint-disable-next-line no-console
      console.warn('[sarvam-batch-create] db insert failed:', (e as Error)?.message)
    }

    return new Response(JSON.stringify(resp), {
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
        endpoint: 'batch-create',
        status: e.status,
        latency_ms: 0,
        error_code: e.code,
        error_message: e.message.slice(0, 500),
        model,
        request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message,
        code: e.code,
        request_id: e.requestId,
      }, request)
    }
    const msg = (e as Error)?.message || 'Batch create failed'
    return json(500, { error: msg }, request)
  }
}
