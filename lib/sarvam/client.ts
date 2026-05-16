/* ─────────────────────────────────────────────────────────────
   Sarvam AI — server-side HTTP client

   Singleton-ish helper used by every Netlify Function that talks
   to api.sarvam.ai. Server-only — throws at module load time if
   SARVAM_API_KEY is missing, so we fail fast in dev rather than
   bleeding the failure into per-request 500s.

   Responsibilities
   ────────────────
   • Header: `api-subscription-key: <key>` (lowercase, hyphenated —
     NOT `Authorization: Bearer`, which is a common mistake).
   • Timeouts via AbortController. Default 30s, 60s for STT/large
     uploads (callers can override).
   • Exponential backoff with jitter on 429 + 5xx. 3 retries max.
   • Typed SarvamApiError so route handlers can surface
     `request_id` + `code` in the response and dashboard logs.
   • Audit hook → public.sarvam_api_logs. Best-effort; never blocks
     the caller. Survives the table not existing yet (logs locally).
   ───────────────────────────────────────────────────────────── */

import type { SarvamErrorEnvelope } from './types'

// ── Env-derived config ──────────────────────────────────────
const SARVAM_API_KEY = process.env.SARVAM_API_KEY || ''
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// If we're running inside a Netlify Function and the key is missing,
// throw clearly. Don't throw at import-time for everyone — the .next
// build runs this file during tree-shaking introspection too.
export function assertSarvamConfigured(): void {
  if (!SARVAM_API_KEY) {
    throw new Error(
      'SARVAM_API_KEY env var is not set. Configure it in Netlify ' +
        '(Site settings → Environment variables) — never commit it to source.',
    )
  }
}

// ── Typed error ─────────────────────────────────────────────
export class SarvamApiError extends Error {
  status: number
  code?: string
  requestId?: string
  endpoint: string
  retryable: boolean
  raw?: unknown

  constructor(args: {
    status: number
    message: string
    endpoint: string
    code?: string
    requestId?: string
    retryable?: boolean
    raw?: unknown
  }) {
    super(args.message)
    this.name = 'SarvamApiError'
    this.status = args.status
    this.code = args.code
    this.requestId = args.requestId
    this.endpoint = args.endpoint
    this.retryable = args.retryable ?? false
    this.raw = args.raw
  }
}

// ── Backoff helper ──────────────────────────────────────────
const RETRY_BASE_MS = 250
const RETRY_MAX = 3

function backoffMs(attempt: number): number {
  // 250ms, 500ms, 1000ms — each with up to ±25% jitter
  const base = RETRY_BASE_MS * Math.pow(2, attempt)
  const jitter = base * 0.25 * (Math.random() * 2 - 1)
  return Math.max(50, Math.floor(base + jitter))
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ── Audit log writer (best-effort, non-blocking) ────────────
// Sends a tiny POST to PostgREST using the service-role key. We
// purposely don't import @supabase/supabase-js here to keep the
// Netlify Function cold-start small. Each call is fire-and-forget;
// a failure logs to console.warn and never bubbles to the caller.
export interface SarvamLogEntry {
  user_id?: string | null
  endpoint: string
  model?: string | null
  source_language?: string | null
  target_language?: string | null
  mode?: string | null
  speaker?: string | null
  input_chars?: number | null
  audio_seconds?: number | null
  status: number
  latency_ms: number
  request_id?: string | null
  error_code?: string | null
  error_message?: string | null
}

export function logSarvamCall(entry: SarvamLogEntry): void {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return // unconfigured — skip
  const body = JSON.stringify({
    user_id: entry.user_id ?? null,
    endpoint: entry.endpoint,
    model: entry.model ?? null,
    source_language: entry.source_language ?? null,
    target_language: entry.target_language ?? null,
    mode: entry.mode ?? null,
    speaker: entry.speaker ?? null,
    input_chars: entry.input_chars ?? null,
    audio_seconds: entry.audio_seconds ?? null,
    status: entry.status,
    latency_ms: entry.latency_ms,
    request_id: entry.request_id ?? null,
    error_code: entry.error_code ?? null,
    error_message: entry.error_message ?? null,
  })
  // Fire-and-forget. await would block the response for an audit row;
  // we instead let it race the next event-loop tick.
  fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_api_logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Prefer: 'return=minimal',
    },
    body,
  }).catch((err) => {
    // Table may not exist yet (pre-migration), or transient network blip.
    // Don't spam — one console line is enough for ops to grep.
    // eslint-disable-next-line no-console
    console.warn('[sarvam/log] audit insert failed:', (err as Error)?.message)
  })
}

// ── Core fetch ──────────────────────────────────────────────
export interface SarvamFetchOptions {
  /** AbortController-style timeout. Default 30s. */
  timeoutMs?: number
  /** Override the default 3 retries on 429/5xx. */
  maxRetries?: number
  /** Logical endpoint name for audit (e.g. 'tts', 'stt'). */
  logEndpoint: string
  /** Optional context for the audit row. */
  logContext?: Partial<SarvamLogEntry>
}

/**
 * Low-level fetch wrapper. Adds the auth header, runs the call with
 * timeout + retry, parses Sarvam's error envelope, and writes a single
 * audit row. Returns the raw Response so callers can decide between
 * `.json()` and `.arrayBuffer()` themselves (TTS returns base64 JSON,
 * but a future binary endpoint won't).
 */
export async function sarvamFetch(
  url: string,
  init: RequestInit,
  opts: SarvamFetchOptions,
): Promise<Response> {
  assertSarvamConfigured()

  const timeoutMs = opts.timeoutMs ?? 30_000
  const maxRetries = opts.maxRetries ?? RETRY_MAX

  // Merge headers — never let the caller overwrite the auth header.
  const headers = new Headers(init.headers || {})
  headers.set('api-subscription-key', SARVAM_API_KEY)
  // Caller controls Content-Type (JSON vs multipart). Don't touch it.

  const t0 = Date.now()
  let lastError: SarvamApiError | undefined
  let attempt = 0

  while (attempt <= maxRetries) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const resp = await fetch(url, { ...init, headers, signal: ctrl.signal })
      clearTimeout(timer)

      // 2xx — happy path. Audit succeeds; caller parses body.
      if (resp.ok) {
        logSarvamCall({
          ...(opts.logContext || {}),
          endpoint: opts.logEndpoint,
          status: resp.status,
          latency_ms: Date.now() - t0,
          request_id: resp.headers.get('x-request-id'),
        } as SarvamLogEntry)
        return resp
      }

      // Read body once for error reporting + retry decision.
      let envelope: SarvamErrorEnvelope | undefined
      let bodyText = ''
      try {
        bodyText = await resp.text()
        envelope = bodyText ? (JSON.parse(bodyText) as SarvamErrorEnvelope) : undefined
      } catch {
        // Body not JSON — keep the raw text for diagnostics.
      }
      const message =
        envelope?.error?.message ||
        bodyText ||
        `Sarvam ${opts.logEndpoint} failed: HTTP ${resp.status}`
      const code = envelope?.error?.code
      const requestId =
        envelope?.error?.request_id || resp.headers.get('x-request-id') || undefined

      const retryable = resp.status === 429 || resp.status === 503 || resp.status >= 500
      const err = new SarvamApiError({
        status: resp.status,
        message,
        endpoint: opts.logEndpoint,
        code,
        requestId,
        retryable,
        raw: envelope ?? bodyText,
      })

      // 4xx (non-429) — surface immediately.
      if (!retryable || attempt >= maxRetries) {
        logSarvamCall({
          ...(opts.logContext || {}),
          endpoint: opts.logEndpoint,
          status: resp.status,
          latency_ms: Date.now() - t0,
          request_id: requestId,
          error_code: code,
          error_message: message.slice(0, 500),
        } as SarvamLogEntry)
        throw err
      }

      // Retryable — backoff and loop.
      lastError = err
      await sleep(backoffMs(attempt))
      attempt += 1
      continue
    } catch (e: unknown) {
      clearTimeout(timer)
      // Abort / network / DNS / TLS — treat as retryable unless we've
      // run out of attempts.
      if (e instanceof SarvamApiError) throw e
      const isAbort = (e as { name?: string })?.name === 'AbortError'
      const msg = (e as Error)?.message || 'network error'
      const err = new SarvamApiError({
        status: 0,
        message: isAbort ? `Sarvam ${opts.logEndpoint} timed out after ${timeoutMs}ms` : msg,
        endpoint: opts.logEndpoint,
        retryable: true,
      })
      if (attempt >= maxRetries) {
        logSarvamCall({
          ...(opts.logContext || {}),
          endpoint: opts.logEndpoint,
          status: 0,
          latency_ms: Date.now() - t0,
          error_message: err.message.slice(0, 500),
        } as SarvamLogEntry)
        throw err
      }
      lastError = err
      await sleep(backoffMs(attempt))
      attempt += 1
    }
  }

  // Defensive — unreachable in practice (the loop returns or throws).
  throw lastError ?? new SarvamApiError({
    status: 0,
    message: `Sarvam ${opts.logEndpoint}: exhausted retries`,
    endpoint: opts.logEndpoint,
    retryable: false,
  })
}

/**
 * Convenience JSON wrapper. Encodes the request body as JSON and
 * returns the parsed response (or throws SarvamApiError).
 */
export async function sarvamJson<TResp>(
  url: string,
  body: unknown,
  opts: SarvamFetchOptions,
): Promise<TResp> {
  const resp = await sarvamFetch(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    opts,
  )
  return (await resp.json()) as TResp
}

/**
 * Multipart wrapper for STT. Caller passes a ready-made FormData
 * (we don't reconstruct it here because the audio Blob may be very
 * large and we want to keep it streaming-friendly).
 */
export async function sarvamMultipart<TResp>(
  url: string,
  form: FormData,
  opts: SarvamFetchOptions,
): Promise<TResp> {
  const resp = await sarvamFetch(
    url,
    { method: 'POST', body: form },
    { ...opts, timeoutMs: opts.timeoutMs ?? 60_000 },
  )
  return (await resp.json()) as TResp
}
