import { NextRequest, NextResponse } from 'next/server'

const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text-translate'

export async function POST(request: NextRequest) {
  try {
    const sarvamKey = process.env.SARVAM_API_KEY || process.env.NEXT_PUBLIC_SARVAM_API_KEY || ''

    if (!sarvamKey) {
      return NextResponse.json({ error: 'No Sarvam API key configured' }, { status: 500 })
    }

    // Parse incoming FormData and rebuild it for Sarvam API
    const formData = await request.formData()
    const outForm = new FormData()

    const file = formData.get('file')
    if (file && file instanceof Blob) {
      outForm.append('file', file, 'recording.wav')
    } else {
      // Fallback: treat entire body as audio
      const body = await request.arrayBuffer()
      outForm.append('file', new Blob([body], { type: 'audio/webm' }), 'recording.wav')
    }

    const model = formData.get('model')
    if (model) outForm.append('model', model.toString())
    const langCode = formData.get('language_code')
    if (langCode) outForm.append('language_code', langCode.toString())

    const response = await fetch(SARVAM_STT_URL, {
      method: 'POST',
      headers: {
        'api-subscription-key': sarvamKey,
      },
      body: outForm,
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.ok ? 200 : response.status })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
