/* ─────────────────────────────────────────────────────────────
   Sarvam AI — browser-safe call helpers

   Thin wrappers around the three Phase-1 Netlify Functions:
     - /.netlify/functions/sarvam-tts          (TTS, returns audio Blob)
     - /.netlify/functions/sarvam-stt-v2       (STT, returns SttResponse)
     - /.netlify/functions/sarvam-translate    (Translate, returns TranslateResponse)

   Responsibilities
   ────────────────
   • Attach the current Supabase access token as Bearer auth.
   • Resolve the right base URL — localhost in dev, the live
     Netlify host in prod (matches the pattern in
     adminDataService.createAdminUser).
   • Surface Sarvam's typed errors so callers can show
     "Try again" vs "Bad input" vs "Out of quota" without
     parsing strings.
   • Re-import types only — no server-only modules — so the
     bundler can tree-shake safely.

   Server-side modules (lib/sarvam/types.ts, lib/sarvam/client.ts)
   are NOT imported here on purpose: importing types.ts brings in
   the validators (server-side validation), and importing client.ts
   would drag the SARVAM_API_KEY reference into the browser bundle.
   We re-declare the response shapes locally as `type` aliases.
   ───────────────────────────────────────────────────────────── */

import { supabase } from '@/lib/supabase/client'

// ── Re-declared response shapes (browser-safe) ──────────────
// Keep these in sync with lib/sarvam/types.ts. Duplicated by
// design — see top-of-file note.
export interface SarvamSttTimestamps {
  words: string[]
  start_time_seconds: number[]
  end_time_seconds: number[]
}

export interface SarvamDiarizedEntry {
  transcript: string
  start_time_seconds: number
  end_time_seconds: number
  speaker_id: string
}

export interface SarvamSttResult {
  request_id?: string
  transcript: string
  language_code: string | null
  timestamps?: SarvamSttTimestamps
  diarized_transcript?: { entries: SarvamDiarizedEntry[] }
}

export interface SarvamTranslateResult {
  request_id: string | null
  translated_text: string
  source_language_code: string
}

// ── Endpoint resolution ─────────────────────────────────────
// Mirrors createAdminUser's logic: in prod and on a Netlify
// branch deploy, call the same origin. On localhost (next dev),
// route to the Netlify dev tunnel (8888) so the functions are
// reachable. Falls back to the production host for any unknown
// origin (e.g. running from the custom domain).
const NETLIFY_FALLBACK = 'https://ghl-india-ventures-2025.netlify.app'

function getFunctionsBase(): string {
  if (typeof window === 'undefined') return NETLIFY_FALLBACK
  const o = window.location.origin
  if (o.includes('localhost')) return 'http://localhost:8888'
  if (o.endsWith('.netlify.app')) return o
  return NETLIFY_FALLBACK
}

// ── Auth header ─────────────────────────────────────────────
async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) {
    throw new SarvamBrowserError({
      status: 401,
      message: 'You need to be signed in to use Sarvam AI.',
      code: 'no_session',
    })
  }
  return { Authorization: `Bearer ${token}` }
}

// ── Typed browser error ─────────────────────────────────────
export class SarvamBrowserError extends Error {
  status: number
  code?: string
  requestId?: string
  constructor(args: { status: number; message: string; code?: string; requestId?: string }) {
    super(args.message)
    this.name = 'SarvamBrowserError'
    this.status = args.status
    this.code = args.code
    this.requestId = args.requestId
  }
}

// Parse the JSON error envelope our Netlify Functions return
// ({ error, code?, request_id? }) and the equivalent envelope
// Sarvam itself would have produced.
async function throwOnHttpError(resp: Response, endpoint: string): Promise<void> {
  if (resp.ok) return
  let payload: { error?: string; code?: string; request_id?: string } = {}
  try {
    payload = await resp.json()
  } catch {
    /* ignore */
  }
  throw new SarvamBrowserError({
    status: resp.status,
    message: payload.error || `Sarvam ${endpoint} failed (HTTP ${resp.status})`,
    code: payload.code,
    requestId: payload.request_id,
  })
}

// ── TTS ─────────────────────────────────────────────────────
export interface SarvamTtsCallOptions {
  text: string
  target_language_code?: string                    // default 'en-IN'
  speaker?: string                                  // default 'shubh'
  model?: 'bulbul:v2' | 'bulbul:v3'                 // default 'bulbul:v3'
  pace?: number
  temperature?: number
  speech_sample_rate?: 8000 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000
  output_audio_codec?: 'wav' | 'mp3' | 'aac' | 'opus' | 'flac' | 'pcm' | 'mulaw' | 'alaw'
  enable_preprocessing?: boolean
}

export interface SarvamTtsCallResult {
  blob: Blob
  /** Object URL ready for <audio src>. Caller is responsible for
   *  URL.revokeObjectURL when done to avoid leaks. */
  url: string
  requestId: string | null
  contentType: string
}

/** Call the TTS function and get back a playable audio Blob. */
export async function sarvamTTS(opts: SarvamTtsCallOptions): Promise<SarvamTtsCallResult> {
  const auth = await getAuthHeader()
  const resp = await fetch(`${getFunctionsBase()}/.netlify/functions/sarvam-tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({
      target_language_code: 'en-IN',
      ...opts,
    }),
  })
  await throwOnHttpError(resp, 'tts')
  const contentType = resp.headers.get('Content-Type') || 'audio/wav'
  const blob = await resp.blob()
  const url = URL.createObjectURL(blob)
  return {
    blob,
    url,
    requestId: resp.headers.get('X-Sarvam-Request-Id') || null,
    contentType,
  }
}

// ── STT ─────────────────────────────────────────────────────
export interface SarvamSttCallOptions {
  /** Recorded audio. Pass a Blob from MediaRecorder or a File from
   *  an upload input. Must be ≤30 s for the REST endpoint —
   *  longer clips need the Phase-2 Batch endpoint. */
  file: Blob | File
  model?: 'saaras:v3' | 'saarika:v2.5' | 'saaras:v2.5'
  mode?: 'transcribe' | 'translate' | 'verbatim' | 'translit' | 'codemix'
  language_code?: string             // BCP-47 or 'unknown'
  input_audio_codec?: 'wav' | 'pcm_s16le' | 'pcm_l16' | 'pcm_raw'
  translate_to_english?: boolean
}

/** Send an audio Blob to the STT function. Returns the parsed
 *  SttResponse on success. */
export async function sarvamSTT(opts: SarvamSttCallOptions): Promise<SarvamSttResult> {
  const auth = await getAuthHeader()
  const form = new FormData()
  const fileName = opts.file instanceof File ? opts.file.name : 'recording.wav'
  form.append('file', opts.file, fileName)
  if (opts.model) form.append('model', opts.model)
  if (opts.mode) form.append('mode', opts.mode)
  if (opts.language_code) form.append('language_code', opts.language_code)
  if (opts.input_audio_codec) form.append('input_audio_codec', opts.input_audio_codec)
  if (opts.translate_to_english) form.append('translate_to_english', 'true')

  const resp = await fetch(`${getFunctionsBase()}/.netlify/functions/sarvam-stt-v2`, {
    method: 'POST',
    // NOTE: do NOT set Content-Type — the browser fills in the
    // correct multipart boundary automatically.
    headers: { ...auth },
    body: form,
  })
  await throwOnHttpError(resp, 'stt')
  return (await resp.json()) as SarvamSttResult
}

// ── Translate ───────────────────────────────────────────────
export interface SarvamTranslateCallOptions {
  input: string
  source_language_code: string       // BCP-47 or 'auto' (mayura:v1 only)
  target_language_code: string
  model?: 'mayura:v1' | 'sarvam-translate:v1'
  mode?: 'formal' | 'modern-colloquial' | 'classic-colloquial' | 'code-mixed'
  output_script?: 'roman' | 'fully-native' | 'spoken-form-in-native' | null
  numerals_format?: 'international' | 'native'
  speaker_gender?: 'Male' | 'Female'
}

/** Translate text. Server auto-picks `mayura:v1` vs `sarvam-translate:v1`
 *  if `model` is omitted. */
export async function sarvamTranslate(
  opts: SarvamTranslateCallOptions,
): Promise<SarvamTranslateResult> {
  const auth = await getAuthHeader()
  const resp = await fetch(`${getFunctionsBase()}/.netlify/functions/sarvam-translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify(opts),
  })
  await throwOnHttpError(resp, 'translate')
  return (await resp.json()) as SarvamTranslateResult
}

// ── Tiny helper: human-friendly error messages ──────────────
// Components can call this in a toast / inline error block
// without parsing status codes themselves.
export function formatSarvamError(e: unknown): string {
  if (e instanceof SarvamBrowserError) {
    if (e.status === 401) return 'Please sign in again to continue.'
    if (e.status === 403) return 'Sarvam AI is not configured. Contact an admin.'
    if (e.status === 422) return 'That audio format or file size is not supported.'
    if (e.status === 429) return 'Too many requests — try again in a few seconds.'
    if (e.status === 0 || e.status >= 500) return 'Sarvam AI is having trouble. Please retry.'
    return e.message
  }
  return (e as Error)?.message || 'Unexpected error talking to Sarvam AI.'
}
