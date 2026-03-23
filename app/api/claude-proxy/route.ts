import { NextRequest, NextResponse } from 'next/server'

interface ProxyRequestBody {
  messages: { role: 'user' | 'assistant'; content: string }[]
  system?: string
  model?: string
  max_tokens?: number
  apiKey?: string
}

export async function POST(request: NextRequest) {
  // Auth Check: Validate token if provided
  const authHeader = request.headers.get('Authorization') || ''
  if (authHeader.startsWith('Bearer ') && authHeader.slice(7).trim()) {
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
  }

  try {
    const body: ProxyRequestBody = await request.json()
    const apiKey = process.env.CLAUDE_API_KEY || ''

    if (!apiKey) {
      return NextResponse.json({
        error: {
          message: 'No API key configured. Add CLAUDE_API_KEY in environment variables.',
        },
      }, { status: 401 })
    }

    const { messages, system, model, max_tokens } = body

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
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: { message } }, { status: 500 })
  }
}
