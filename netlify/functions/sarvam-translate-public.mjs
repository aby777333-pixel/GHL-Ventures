/* ─────────────────────────────────────────────────────────────
   Public Sarvam Translate proxy — for the anonymous Smarty widget.

   Sarvam's https://api.sarvam.ai/translate endpoint returns HTTP
   400 on the CORS preflight (OPTIONS), which Chrome / Firefox /
   Edge all reject — so browser-direct calls from the widget die
   silently and the user sees English forever.

   This function is the server-side proxy: same pattern as
   sarvam-stt.mjs. No auth required (it's used by anonymous
   visitors on the public site), but it's locked to the GHL
   origin so it can't be used as an open translation oracle.

   The Phase-3a sibling `sarvam-translate.ts` stays — it serves
   the staff portal with auth gating + audit logging. This
   `-public` variant exists for the unauthenticated widget only.
   ───────────────────────────────────────────────────────────── */

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || ''
const SARVAM_TRANSLATE_URL = 'https://api.sarvam.ai/translate'

const ALLOWED_ORIGINS = [
  'https://ghl-india-ventures-2025.netlify.app',
  'https://ghlindiaventures.com',
  'https://www.ghlindiaventures.com',
]

function getCorsOrigin(request) {
  const origin = request?.headers?.get('origin') || ''
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
}

export default async (request) => {
  const cors = {
    'Access-Control-Allow-Origin': getCorsOrigin(request),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: cors })
  }
  if (!SARVAM_API_KEY) {
    return new Response(JSON.stringify({ error: 'Sarvam API key not configured' }), { status: 500, headers: cors })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: cors })
  }

  const {
    input,
    source_language_code,
    target_language_code,
    mode = 'formal',
    model = 'sarvam-translate:v1',
  } = body || {}

  if (!input || !target_language_code) {
    return new Response(
      JSON.stringify({ error: 'input and target_language_code are required' }),
      { status: 400, headers: cors },
    )
  }

  // 30s cap — Sarvam translate usually responds in under 2s
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const upstream = await fetch(SARVAM_TRANSLATE_URL, {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: String(input).slice(0, 2000),
        source_language_code: source_language_code || 'auto',
        target_language_code,
        mode,
        model,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const data = await upstream.json().catch(() => ({}))
    return new Response(JSON.stringify(data), {
      status: upstream.ok ? 200 : upstream.status,
      headers: cors,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    return new Response(
      JSON.stringify({ error: err?.message || 'Translate proxy failed' }),
      { status: 500, headers: cors },
    )
  }
}
