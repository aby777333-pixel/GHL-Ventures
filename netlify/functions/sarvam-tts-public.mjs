/* ─────────────────────────────────────────────────────────────
   Public Sarvam TTS proxy — for the anonymous Smarty widget.

   Same shape and reasoning as sarvam-translate-public.mjs: the
   speaker button under each reply is used by unauthenticated
   visitors, so there is no auth, but the function is locked to
   the GHL origins so it can't be used as a free speech oracle.

   Why a proxy at all: the widget used to call api.sarvam.ai
   directly from the browser using NEXT_PUBLIC_SARVAM_API_KEY.
   That inlines a paid API key into the client bundle, and the
   droplet build has no such env var — so the key resolved empty,
   sarvamTTS() bailed out before making a request, and the
   speaker button was a silent no-op. Proxying keeps the key
   server-side (SARVAM_API_KEY, same var the translate proxy
   already uses) and makes the button work on both hosts.

   Returns Sarvam's payload verbatim: { audios: [ "<base64 wav>" ] }.
   ───────────────────────────────────────────────────────────── */

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || ''
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech'

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
    text,
    target_language_code,
    speaker,
    model = 'bulbul:v3',
    pace = 1.0,
    speech_sample_rate = 24000,
    pronunciation_dictionary_id,
  } = body || {}

  if (!text || !target_language_code) {
    return new Response(
      JSON.stringify({ error: 'text and target_language_code are required' }),
      { status: 400, headers: cors },
    )
  }

  const upstreamBody = {
    text: String(text).slice(0, 2500),
    target_language_code,
    model,
    pace,
    speech_sample_rate,
  }
  if (speaker) upstreamBody.speaker = speaker
  if (pronunciation_dictionary_id) {
    upstreamBody.pronunciation_dictionary_id = pronunciation_dictionary_id
  }

  // TTS synthesis is slower than translate — allow a little more headroom.
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 45000)

  try {
    const upstream = await fetch(SARVAM_TTS_URL, {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(upstreamBody),
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
      JSON.stringify({ error: err?.message || 'TTS proxy failed' }),
      { status: 500, headers: cors },
    )
  }
}
