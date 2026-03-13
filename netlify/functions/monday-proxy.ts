/* ================================================================
   MONDAY.COM API PROXY — Netlify Serverless Function

   Keeps the Monday.com API key server-side only.
   The browser calls  /.netlify/functions/monday-proxy  instead of
   hitting api.monday.com directly, so the secret is never
   bundled into client JS.
   ================================================================ */

interface MondayProxyBody {
  query: string
  variables?: Record<string, unknown>
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
    const body: MondayProxyBody = await request.json()
    const { query, variables } = body

    // ── Check-config request — tells the UI whether a server key exists ──
    if (query === '__check_config__') {
      return new Response(
        JSON.stringify({ data: { serverKeyConfigured: Boolean(process.env.MONDAY_API_KEY) } }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    // Build ordered list of keys to try: client key first, then env var
    const clientKey = body.apiKey?.trim() || ''
    const serverKey = (process.env.MONDAY_API_KEY || '').trim()
    const keysToTry = [clientKey, serverKey].filter(Boolean)

    // De-duplicate if both keys are the same
    const uniqueKeys = keysToTry.filter((k, i) => keysToTry.indexOf(k) === i)

    if (uniqueKeys.length === 0) {
      return new Response(
        JSON.stringify({
          error: {
            message:
              'No Monday.com API key configured. Add MONDAY_API_KEY in Netlify environment variables, or paste your key in Admin > Settings > Integrations.',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    // Try each key — if the first one 401s, fall back to the next
    let lastResponse: Response | null = null

    for (const apiKey of uniqueKeys) {
      const mondayResponse = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'API-Version': '2024-10',
        },
        body: JSON.stringify({ query, variables: variables || {} }),
      })

      lastResponse = mondayResponse

      // If success or non-auth error, return immediately
      if (mondayResponse.status !== 401) {
        const responseText = await mondayResponse.text()
        return new Response(responseText, {
          status: mondayResponse.status,
          headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
        })
      }

      // 401 — try the next key if available
    }

    // All keys failed with 401
    const responseText = lastResponse ? await lastResponse.text() : JSON.stringify({ error: { message: 'Authentication failed' } })
    return new Response(responseText, {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: { message } }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }
}
