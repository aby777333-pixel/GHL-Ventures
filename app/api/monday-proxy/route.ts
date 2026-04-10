import { NextRequest, NextResponse } from 'next/server'

interface MondayProxyBody {
  query: string
  variables?: Record<string, unknown>
  apiKey?: string
}

export async function POST(request: NextRequest) {
  // Auth Check: Require valid Supabase session
  const authHeader = request.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ') || !authHeader.slice(7).trim()) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (supabaseUrl && anonKey) {
    try {
      const verifyRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { 'Authorization': authHeader, 'apikey': anonKey },
      })
      if (!verifyRes.ok) {
        return NextResponse.json({ error: { message: 'Unauthorized: invalid token' } }, { status: 401 })
      }
    } catch { /* If Supabase is unreachable, allow through */ }
  }

  try {
    const body: MondayProxyBody = await request.json()
    const { query, variables } = body

    // Check-config request
    if (query === '__check_config__') {
      return NextResponse.json({ data: { serverKeyConfigured: Boolean(process.env.MONDAY_API_KEY) } })
    }

    const clientKey = body.apiKey?.trim() || ''
    const serverKey = (process.env.MONDAY_API_KEY || '').trim()
    const uniqueKeys = [clientKey, serverKey].filter(Boolean).filter((k, i, arr) => arr.indexOf(k) === i)

    if (uniqueKeys.length === 0) {
      return NextResponse.json({
        error: {
          message: 'No Monday.com API key configured. Add MONDAY_API_KEY in environment variables, or paste your key in Admin > Settings > Integrations.',
        },
      }, { status: 401 })
    }

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

      if (mondayResponse.status !== 401) {
        const responseText = await mondayResponse.text()
        return new Response(responseText, {
          status: mondayResponse.status,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const responseText = lastResponse ? await lastResponse.text() : JSON.stringify({ error: { message: 'Authentication failed' } })
    return new Response(responseText, { status: 401, headers: { 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: { message } }, { status: 500 })
  }
}
