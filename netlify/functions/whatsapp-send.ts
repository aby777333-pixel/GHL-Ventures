/* ================================================================
   WHATSAPP SEND — Netlify Serverless Function (WATI)

   Pending 30-04-2026 — Items 11/12. Sends a WhatsApp message via
   WATI (https://wati.io). Configured via Netlify env vars:
     * WATI_API_TOKEN     — bearer token, no "Bearer " prefix needed
     * WATI_API_ENDPOINT  — e.g. https://live-mt-server.wati.io/319019

   Two modes:
     * Template message (preferred for transactional / out-of-window):
         POST /api/v1/sendTemplateMessage?whatsappNumber=<E164-no-+>
         body: { template_name, broadcast_name, parameters: [{name,value}] }
     * Session message (only valid inside the 24h window):
         POST /api/v1/sendSessionMessage/<E164-no-+>?messageText=<text>

   The function picks "session" by default if `text` is provided,
   "template" if `template_name` is provided.
   ================================================================ */

const ALLOWED_ORIGINS = [
  'https://ghl-india-ventures-2025.netlify.app',
  'https://ghlindiaventures.com',
]

function getCorsHeaders(request?: Request) {
  const origin = request?.headers?.get('origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

interface WhatsAppBody {
  to: string                       // E.164 phone (with or without +)
  text?: string                    // session message body
  template_name?: string           // template message name
  broadcast_name?: string          // broadcast tag (template mode)
  parameters?: { name: string; value: string }[]   // template variables
  media_url?: string               // optional attachment URL
  media_filename?: string          // optional attachment filename
}

// Normalise to E.164 without leading +. WATI expects e.g. 919876543210.
function normaliseNumber(n: string): string {
  let v = (n || '').replace(/\D/g, '')
  // Indian numbers without country code → assume +91
  if (v.length === 10) v = '91' + v
  return v
}

export default async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(request) })
  }
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }

  try {
    const body: WhatsAppBody = await request.json()
    const to = normaliseNumber(body.to || '')
    if (!to || to.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }
    if (!body.text && !body.template_name) {
      return new Response(
        JSON.stringify({ error: 'Either text or template_name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    const rawToken = (process.env.WATI_API_TOKEN || '').trim()
    const endpoint = (process.env.WATI_API_ENDPOINT || '').trim()
    if (!rawToken || !endpoint) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp service not configured. Set WATI_API_TOKEN and WATI_API_ENDPOINT.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    // Accept token with or without "Bearer " prefix.
    const token = rawToken.toLowerCase().startsWith('bearer ')
      ? rawToken
      : `Bearer ${rawToken}`

    let url: string
    let payload: any

    if (body.template_name) {
      url = `${endpoint}/api/v1/sendTemplateMessage?whatsappNumber=${encodeURIComponent(to)}`
      payload = {
        template_name: body.template_name,
        broadcast_name: body.broadcast_name || `tx-${Date.now()}`,
        parameters: body.parameters || [],
      }
    } else if (body.media_url) {
      // Send a media (file/document) message — useful for soft-copy and TDS PDFs.
      url = `${endpoint}/api/v1/sendSessionFile/${encodeURIComponent(to)}`
      payload = {
        file_url: body.media_url,
        caption: body.text || '',
      }
    } else {
      url = `${endpoint}/api/v1/sendSessionMessage/${encodeURIComponent(to)}?messageText=${encodeURIComponent(body.text || '')}`
      payload = {}
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined,
    })

    const text = await res.text()
    let parsed: any = text
    try { parsed = JSON.parse(text) } catch { /* keep raw */ }

    if (!res.ok) {
      console.error('[whatsapp-send] WATI error:', res.status, parsed)
      return new Response(
        JSON.stringify({ error: parsed?.message || parsed?.error || `WATI ${res.status}`, details: parsed }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    console.log(`[whatsapp-send] Sent to ${to}`)
    return new Response(
      JSON.stringify({ success: true, to, response: parsed }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[whatsapp-send] Error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }
}
