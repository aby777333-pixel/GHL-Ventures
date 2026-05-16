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

// ── Batch STT — types ───────────────────────────────────────
export interface SarvamBatchUploadUrl {
  file_index: number
  url: string
  expires_at?: string
}

export interface SarvamBatchCreateResult {
  job_id: string
  state: 'PENDING' | string
  upload_urls: SarvamBatchUploadUrl[]
}

export type SarvamBatchState =
  | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL'

export interface SarvamBatchStatusResult {
  job_id: string
  state: SarvamBatchState | string
  progress?: number
  error_message?: string | null
  file_results?: {
    successful?: Array<{ file_index: number; output_url?: string }>
    failed?: Array<{ file_index: number; error?: string }>
  }
}

export interface SarvamBatchOutputItem {
  file_index: number
  url: string
  expires_at?: string
}
export interface SarvamBatchOutputsResult {
  job_id: string
  output_urls: SarvamBatchOutputItem[]
}

/** A single file's parsed output — same shape as SarvamSttResult. */
export type SarvamBatchFileResult = SarvamSttResult & {
  file_index: number
  /** Original input filename if the UI tracked it; not provided by Sarvam. */
  original_filename?: string
}

// ── Batch STT — call helpers ────────────────────────────────

export interface SarvamBatchCreateOptions {
  model?: 'saaras:v3' | 'saarika:v2.5' | 'saaras:v2.5'
  mode?: 'transcribe' | 'translate' | 'verbatim' | 'translit' | 'codemix'
  language_code?: string
  with_diarization?: boolean
  num_speakers?: number
  with_timestamps?: boolean
  file_count: number
  input_audio_codec?: 'wav' | 'pcm_s16le' | 'pcm_l16' | 'pcm_raw'
  translate_to_english?: boolean
}

/** Create a batch STT job. Returns the job_id and one signed upload URL
 *  per file. */
export async function sarvamBatchCreate(
  opts: SarvamBatchCreateOptions,
): Promise<SarvamBatchCreateResult> {
  const auth = await getAuthHeader()
  const resp = await fetch(`${getFunctionsBase()}/.netlify/functions/sarvam-batch-create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify(opts),
  })
  await throwOnHttpError(resp, 'batch-create')
  return (await resp.json()) as SarvamBatchCreateResult
}

/**
 * Upload a single audio file directly to its Sarvam-signed URL. No
 * Authorization header — the signature is in the URL itself. Reports
 * progress via the optional `onProgress(loaded, total)` callback.
 *
 * Uses XMLHttpRequest (not fetch) because fetch doesn't expose upload
 * progress events in any current browser without a streaming
 * ReadableStream that Sarvam's CDN doesn't accept.
 */
export function sarvamBatchUpload(
  signedUrl: string,
  file: Blob | File,
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl, true)
    // Do NOT set Authorization — the URL is pre-signed.
    // Content-Type left blank: the CDN reads the file body's bytes;
    // some signed-URL schemes reject if Content-Type doesn't match
    // what was signed, so we let the browser decide.
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) onProgress(evt.loaded, evt.total)
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new SarvamBrowserError({
          status: xhr.status,
          message: `Upload failed (HTTP ${xhr.status}): ${xhr.responseText?.slice(0, 200) || ''}`,
        }))
      }
    }
    xhr.onerror = () => reject(new SarvamBrowserError({
      status: 0,
      message: 'Upload network error — check your connection and retry.',
    }))
    xhr.ontimeout = () => reject(new SarvamBrowserError({
      status: 0,
      message: 'Upload timed out.',
    }))
    xhr.send(file)
  })
}

/** Convenience: upload an array of files in parallel against a matching
 *  array of signed URLs (in `upload_urls` order). Per-file progress is
 *  reported via `onProgress(fileIndex, loaded, total)`. */
export async function sarvamBatchUploadAll(
  uploadUrls: SarvamBatchUploadUrl[],
  files: Array<Blob | File>,
  onProgress?: (fileIndex: number, loaded: number, total: number) => void,
): Promise<void> {
  if (uploadUrls.length !== files.length) {
    throw new SarvamBrowserError({
      status: 0,
      message: `Got ${uploadUrls.length} upload URLs but ${files.length} files.`,
    })
  }
  // Sort by file_index so the URL ↔ file pairing is deterministic.
  const sorted = [...uploadUrls].sort((a, b) => a.file_index - b.file_index)
  await Promise.all(
    sorted.map((u, i) =>
      sarvamBatchUpload(u.url, files[i], (loaded, total) =>
        onProgress?.(u.file_index, loaded, total),
      ),
    ),
  )
}

/** Kick off processing for a job once all files have been uploaded. */
export async function sarvamBatchStart(jobId: string): Promise<{ job_id: string; state: string }> {
  const auth = await getAuthHeader()
  const resp = await fetch(`${getFunctionsBase()}/.netlify/functions/sarvam-batch-start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ job_id: jobId }),
  })
  await throwOnHttpError(resp, 'batch-start')
  return (await resp.json()) as { job_id: string; state: string }
}

/** Single status check. Use sarvamBatchPollStatus for the long-poll
 *  helper with auto-backoff. */
export async function sarvamBatchStatus(jobId: string): Promise<SarvamBatchStatusResult> {
  const auth = await getAuthHeader()
  const resp = await fetch(
    `${getFunctionsBase()}/.netlify/functions/sarvam-batch-status?job_id=${encodeURIComponent(jobId)}`,
    { headers: { ...auth } },
  )
  await throwOnHttpError(resp, 'batch-status')
  return (await resp.json()) as SarvamBatchStatusResult
}

/**
 * Long-poll a batch job until it reaches a terminal state. Cadence:
 * 5 s for the first 2 minutes, then 30 s. Caps total wait at 90 minutes
 * (Sarvam's hard max is 1 hour of audio per file; this leaves headroom).
 * Calls `onTick(status)` on every poll, even when the state hasn't
 * changed, so the UI can update progress bars.
 *
 * Resolves with the final terminal-state status. Rejects only on
 * abort, hard auth failures, or running past the cap.
 */
export async function sarvamBatchPollStatus(
  jobId: string,
  opts?: {
    onTick?: (s: SarvamBatchStatusResult) => void
    abortSignal?: AbortSignal
    /** Override the 90-minute cap (in milliseconds). */
    maxMs?: number
  },
): Promise<SarvamBatchStatusResult> {
  const TERMINAL = new Set(['COMPLETED', 'FAILED', 'PARTIAL'])
  const start = Date.now()
  const maxMs = opts?.maxMs ?? 90 * 60 * 1000
  let lastStatus: SarvamBatchStatusResult | null = null

  while (true) {
    if (opts?.abortSignal?.aborted) {
      throw new SarvamBrowserError({ status: 0, message: 'Polling aborted' })
    }
    if (Date.now() - start > maxMs) {
      throw new SarvamBrowserError({
        status: 0,
        message: `Job ${jobId} did not complete within ${(maxMs / 60000).toFixed(0)} min.`,
      })
    }
    try {
      const status = await sarvamBatchStatus(jobId)
      lastStatus = status
      opts?.onTick?.(status)
      if (TERMINAL.has(String(status.state || ''))) return status
    } catch (e) {
      // Transient errors shouldn't break the poll loop — log + keep going.
      // eslint-disable-next-line no-console
      console.warn('[sarvamBatchPollStatus] tick failed:', formatSarvamError(e))
    }
    const elapsed = Date.now() - start
    const delay = elapsed < 2 * 60 * 1000 ? 5_000 : 30_000
    await new Promise<void>((r) => setTimeout(r, delay))
    if (opts?.abortSignal?.aborted) {
      throw new SarvamBrowserError({ status: 0, message: 'Polling aborted' })
    }
  }
  // Unreachable — the loop only exits via terminal state, throw, or
  // cap. lastStatus is consumed elsewhere via onTick.
}

/** Fetch the signed download URLs for a completed job. */
export async function sarvamBatchOutputs(jobId: string): Promise<SarvamBatchOutputsResult> {
  const auth = await getAuthHeader()
  const resp = await fetch(
    `${getFunctionsBase()}/.netlify/functions/sarvam-batch-output?job_id=${encodeURIComponent(jobId)}`,
    { headers: { ...auth } },
  )
  await throwOnHttpError(resp, 'batch-output')
  return (await resp.json()) as SarvamBatchOutputsResult
}

/**
 * Convenience: given a completed job_id, fetch its signed download
 * URLs AND fetch each output JSON in parallel, returning the parsed
 * results sorted by file_index. The transcripts are loaded straight
 * from Sarvam's CDN (no proxy hop).
 */
export async function sarvamBatchFetchResults(
  jobId: string,
  originalFilenames?: string[],
): Promise<SarvamBatchFileResult[]> {
  const outputs = await sarvamBatchOutputs(jobId)
  const sorted = [...(outputs.output_urls || [])].sort((a, b) => a.file_index - b.file_index)

  // Fetch all outputs in parallel from Sarvam's CDN.
  const parsed = await Promise.all(
    sorted.map(async (o) => {
      let body: SarvamSttResult
      try {
        const r = await fetch(o.url, { method: 'GET' })
        if (!r.ok) {
          throw new SarvamBrowserError({
            status: r.status,
            message: `Output ${o.file_index} fetch failed: HTTP ${r.status}`,
          })
        }
        body = (await r.json()) as SarvamSttResult
      } catch (e) {
        if (e instanceof SarvamBrowserError) throw e
        throw new SarvamBrowserError({
          status: 0,
          message: `Output ${o.file_index} fetch failed: ${(e as Error)?.message || 'network'}`,
        })
      }
      return {
        ...body,
        file_index: o.file_index,
        original_filename: originalFilenames?.[o.file_index],
      } as SarvamBatchFileResult
    }),
  )
  return parsed
}

/** Build a WebVTT/SRT timeline from a SarvamSttResult that has
 *  timestamps. Returns "" if timestamps aren't present. */
export function sarvamResultToSRT(result: SarvamSttResult): string {
  const ts = result.timestamps
  if (!ts || !ts.words?.length) return ''
  const lines: string[] = []
  const fmt = (s: number) => {
    const hh = Math.floor(s / 3600).toString().padStart(2, '0')
    const mm = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const ss = (s % 60).toFixed(3).padStart(6, '0').replace('.', ',')
    return `${hh}:${mm}:${ss}`
  }
  // Group into ~7-word cues so the captions are readable.
  const CHUNK = 7
  let cue = 1
  for (let i = 0; i < ts.words.length; i += CHUNK) {
    const slice = ts.words.slice(i, i + CHUNK)
    const start = ts.start_time_seconds[i] ?? 0
    const end = ts.end_time_seconds[Math.min(i + slice.length - 1, ts.end_time_seconds.length - 1)] ?? start + 1
    lines.push(String(cue++))
    lines.push(`${fmt(start)} --> ${fmt(end)}`)
    lines.push(slice.join(' '))
    lines.push('')
  }
  return lines.join('\n')
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
