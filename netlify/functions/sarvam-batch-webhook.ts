/* ================================================================
   SARVAM AI — Batch STT: webhook callback handler

   POST /.netlify/functions/sarvam-batch-webhook
   (Called by Sarvam, NOT the browser.)

   Auth: Sarvam sets `X-SARVAM-JOB-CALLBACK-TOKEN` header from the
   `callback.auth_token` we passed at create-job time (which we read
   from process.env.SARVAM_WEBHOOK_TOKEN). Reject with 403 on
   mismatch — no other auth model is used here.

   Sarvam's docs require us to respond 200 within 30 seconds. So
   the contract here is:
     1. Validate token            (<1 ms)
     2. Patch sarvam_batch_jobs   (best-effort, no await on response)
     3. Audit-log the callback    (best-effort, no await)
     4. Return 200 OK immediately
   Any heavy follow-up (downloading outputs, generating SRT,
   notifying the user) is handled lazily by the UI when it picks
   up the state change via Supabase Realtime — keeps this handler
   fast + idempotent.

   Idempotency: Sarvam may retry on non-200 (and occasionally on
   200s too). The PATCH is keyed on job_id with no side effects
   beyond the row update, so re-delivery is safe.
   ================================================================ */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const WEBHOOK_TOKEN = process.env.SARVAM_WEBHOOK_TOKEN || ''

const TERMINAL_STATES = new Set(['COMPLETED', 'FAILED', 'PARTIAL'])

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

interface SarvamWebhookPayload {
  job_id?: string
  job_state?: string                  // 'COMPLETED' | 'FAILED' | 'PARTIAL' | ...
  state?: string                      // alt key seen in some payloads
  progress?: number
  results?: { metadata?: unknown }
  error_message?: string | null
}

export default async (request: Request): Promise<Response> => {
  // Sarvam should only POST; reject everything else cleanly.
  if (request.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }
  if (!WEBHOOK_TOKEN) {
    // If the token isn't configured server-side, we MUST reject —
    // accepting unauthenticated webhooks would let any actor mark
    // any job COMPLETED with arbitrary results.
    return json(503, { error: 'Webhook token not configured on server' })
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE) {
    return json(500, { error: 'Supabase env vars not configured' })
  }

  // ── Token check ─────────────────────────────────────────
  // Header name is case-insensitive per HTTP spec; we read the
  // exact value Sarvam sends.
  const presented =
    request.headers.get('x-sarvam-job-callback-token') ||
    request.headers.get('X-SARVAM-JOB-CALLBACK-TOKEN') ||
    ''
  if (presented !== WEBHOOK_TOKEN) {
    // Do NOT echo the expected value or its length — just refuse.
    return json(403, { error: 'forbidden' })
  }

  // ── Parse payload ───────────────────────────────────────
  let payload: SarvamWebhookPayload
  try {
    payload = (await request.json()) as SarvamWebhookPayload
  } catch {
    // Sarvam expects 200 even on garbage to avoid retries; but a
    // genuinely-bad body is worth surfacing so we 400.
    return json(400, { error: 'Body must be JSON' })
  }
  const jobId = (payload.job_id || '').trim()
  if (!jobId) {
    return json(400, { error: 'job_id missing from webhook payload' })
  }
  const state = String(payload.job_state || payload.state || '').toUpperCase()

  // ── Best-effort DB update (fire-and-forget) ─────────────
  const patch: Record<string, unknown> = {
    state: state || 'COMPLETED',
    error_message: payload.error_message ?? null,
    results_summary:
      (payload.results && typeof payload.results === 'object' && 'metadata' in payload.results
        ? (payload.results as { metadata: unknown }).metadata
        : payload.results) ?? null,
  }
  if (typeof payload.progress === 'number') patch.progress = payload.progress
  if (TERMINAL_STATES.has(state)) patch.completed_at = new Date().toISOString()

  fetch(
    `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_batch_jobs?job_id=eq.${encodeURIComponent(jobId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE,
        Authorization: `Bearer ${SUPABASE_SERVICE}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    },
  ).catch((e) => {
    // eslint-disable-next-line no-console
    console.warn('[sarvam-batch-webhook] db patch failed:', (e as Error)?.message)
  })

  // Audit row so ops can confirm every callback we received,
  // regardless of whether the DB update succeeded.
  fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_api_logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE,
      Authorization: `Bearer ${SUPABASE_SERVICE}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id: null,                    // webhook isn't user-scoped
      endpoint: 'batch-webhook',
      status: 200,
      latency_ms: 0,
      request_id: jobId,                // we don't get a sarvam request_id here
      error_code: state === 'FAILED' ? 'job_failed' : null,
      error_message: payload.error_message ?? null,
    }),
  }).catch((e) => {
    // eslint-disable-next-line no-console
    console.warn('[sarvam-batch-webhook] audit insert failed:', (e as Error)?.message)
  })

  // 200 OK immediately — Sarvam's 30 s SLA is satisfied.
  return json(200, { status: 'ok' })
}
