/* ================================================================
   CLAUDE API PROXY — Netlify Serverless Function

   Keeps the Anthropic API key server-side only.
   The browser calls  /.netlify/functions/claude-proxy  instead of
   hitting api.anthropic.com directly, so the secret is never
   bundled into client JS.
   ================================================================ */

interface ProxyRequestBody {
  messages: { role: 'user' | 'assistant'; content: string }[]
  system?: string
  model?: string
  max_tokens?: number
  /** Optional — user-supplied key from sessionStorage */
  apiKey?: string
}

// Restrict CORS to our own domain for security
const ALLOWED_ORIGINS = [
  'https://ghl-india-ventures-2025.netlify.app',
  // 'http://localhost:3000', // disabled for production
]

function getCorsHeaders(request?: Request) {
  const origin = request?.headers?.get('origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

export default async (request: Request) => {
  // ── Pre-flight ──
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(request) })
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: { message: 'Method not allowed' } }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }

  try {
    const body: ProxyRequestBody = await request.json()

    // Use server-side API key only — never accept client-provided keys
    const apiKey = process.env.CLAUDE_API_KEY || ''

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: {
            message:
              'No API key configured. Add CLAUDE_API_KEY in Netlify environment variables, or paste your key in Admin > Reports > Settings.',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    const { messages, system, model, max_tokens } = body

    // Forward to Anthropic
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 1024,
        ...(system ? { system } : {}),
        messages,
      }),
    })

    const responseText = await anthropicResponse.text()

    return new Response(responseText, {
      status: anthropicResponse.status,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request),
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: { message } }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }
}
