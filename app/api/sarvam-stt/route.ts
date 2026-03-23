import { NextRequest, NextResponse } from 'next/server'

const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text-translate'

export async function POST(request: NextRequest) {
  try {
    const sarvamKey = process.env.SARVAM_API_KEY || process.env.NEXT_PUBLIC_SARVAM_API_KEY || ''

    if (!sarvamKey) {
      return NextResponse.json({ error: 'No Sarvam API key configured' }, { status: 500 })
    }

    const body = await request.arrayBuffer()
    const contentType = request.headers.get('content-type') || 'multipart/form-data'

    const response = await fetch(SARVAM_STT_URL, {
      method: 'POST',
      headers: {
        'api-subscription-key': sarvamKey,
        'Content-Type': contentType,
      },
      body,
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.ok ? 200 : response.status })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
