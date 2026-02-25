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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export default async (request: Request) => {
  // ── Pre-flight ──
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: { message: 'Method not allowed' } }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    )
  }

  try {
    const body: MondayProxyBody = await request.json()

    // Prefer user-provided key (from sessionStorage), fall back to server env
    const apiKey = body.apiKey || process.env.MONDAY_API_KEY || ''

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: {
            message:
              'No Monday.com API key configured. Add MONDAY_API_KEY in Netlify environment variables, or paste your key in Admin > Settings > Integrations.',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
      )
    }

    const { query, variables } = body

    // Forward to Monday.com GraphQL API
    const mondayResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
        'API-Version': '2024-10',
      },
      body: JSON.stringify({
        query,
        variables: variables || {},
      }),
    })

    const responseText = await mondayResponse.text()

    return new Response(responseText, {
      status: mondayResponse.status,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: { message } }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    )
  }
}
