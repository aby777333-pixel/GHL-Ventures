/* ─────────────────────────────────────────────────────────────
   Sarvam AI — per-user rate limiting

   In-memory token bucket keyed by (userId, endpointGroup). Lives
   inside one Netlify Function instance, so it only catches bursts
   from the *same* warm container — fine for the common abuse
   shape (one logged-in user spamming Play / Send / Retry) and
   keeps us off Redis for now.

   Real distributed enforcement (across cold starts + parallel
   container instances) would need Upstash Redis. Wired so a
   future swap to a shared store is a single function-body change.

   Defaults match Sarvam's documented per-key tier:
     - translate           300 req / minute
     - everything else      60 req / minute
   We deliberately keep our per-user cap *well below* the platform
   cap so one noisy admin can't exhaust the whole account.
   ───────────────────────────────────────────────────────────── */

type Bucket = {
  tokens: number          // tokens currently available
  capacity: number        // max tokens
  refillPerSec: number    // tokens added per second
  lastRefill: number      // ms timestamp of last refill
}

// One Map per process. Netlify Function warm containers share this
// across invocations until the container is reaped (a few minutes).
const _buckets = new Map<string, Bucket>()

/** Per-endpoint-group limits. Add new groups here as Sarvam ships
 *  new endpoints. */
const LIMITS: Record<string, { capacity: number; refillPerSec: number }> = {
  // 60 req/min — Sarvam's general default. We give the user 30/min
  // so two of us can hammer in parallel without blowing the key.
  default:        { capacity: 30, refillPerSec: 30 / 60 },
  tts:            { capacity: 30, refillPerSec: 30 / 60 },
  stt:            { capacity: 30, refillPerSec: 30 / 60 },
  'stt-translate':{ capacity: 30, refillPerSec: 30 / 60 },
  // Batch lifecycle calls are tiny and the user does ~5 per job;
  // 60/min per user is generous and still well under platform cap.
  'batch-create': { capacity: 10, refillPerSec: 10 / 60 },
  'batch-start':  { capacity: 10, refillPerSec: 10 / 60 },
  'batch-status': { capacity: 60, refillPerSec: 60 / 60 },  // poll-friendly
  'batch-output': { capacity: 30, refillPerSec: 30 / 60 },
  // Translate gets a higher cap to match Sarvam's 300/min platform
  // ceiling — investor i18n pages can fan out dozens of strings.
  translate:      { capacity: 150, refillPerSec: 150 / 60 },
}

export type RateLimitDecision =
  | { ok: true; remaining: number; capacity: number }
  | { ok: false; retryAfterSec: number; capacity: number }

/**
 * Try to consume one token from the (userId, endpoint) bucket.
 * Always allows when userId is empty (anonymous request path) —
 * the caller is expected to have ALLOW_ANON gates of its own.
 */
export function checkRateLimit(
  userId: string | null | undefined,
  endpoint: string,
  cost = 1,
): RateLimitDecision {
  if (!userId) return { ok: true, remaining: Infinity, capacity: Infinity }

  const cfg = LIMITS[endpoint] || LIMITS.default
  const key = `${userId}|${endpoint}`
  const now = Date.now()

  let bucket = _buckets.get(key)
  if (!bucket) {
    bucket = {
      tokens: cfg.capacity,
      capacity: cfg.capacity,
      refillPerSec: cfg.refillPerSec,
      lastRefill: now,
    }
    _buckets.set(key, bucket)
  }

  // Refill: tokens += elapsed * rate, capped at capacity.
  const elapsedSec = (now - bucket.lastRefill) / 1000
  bucket.tokens = Math.min(bucket.capacity, bucket.tokens + elapsedSec * bucket.refillPerSec)
  bucket.lastRefill = now

  if (bucket.tokens < cost) {
    const needed = cost - bucket.tokens
    const retryAfterSec = Math.max(1, Math.ceil(needed / bucket.refillPerSec))
    return { ok: false, retryAfterSec, capacity: bucket.capacity }
  }
  bucket.tokens -= cost
  return { ok: true, remaining: Math.floor(bucket.tokens), capacity: bucket.capacity }
}

/**
 * Convenience: build a 429 Response if the bucket says no, else
 * return null and let the caller proceed. Plays nicely with the
 * Netlify Function signature: `const limited = rateLimitResponse(...);
 *  if (limited) return limited`.
 */
export function rateLimitResponse(
  userId: string | null | undefined,
  endpoint: string,
  corsHeaders: Record<string, string>,
): Response | null {
  const d = checkRateLimit(userId, endpoint)
  if (d.ok) return null
  return new Response(
    JSON.stringify({
      error: `Rate limit exceeded for ${endpoint}. Try again in ${d.retryAfterSec}s.`,
      code: 'rate_limit',
      retry_after_sec: d.retryAfterSec,
      capacity_per_minute: d.capacity,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(d.retryAfterSec),
        ...corsHeaders,
      },
    },
  )
}

/** Test helper — resets the in-memory bucket. Don't call in production. */
export function _resetBuckets(): void {
  _buckets.clear()
}
