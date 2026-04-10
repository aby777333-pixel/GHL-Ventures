const SARVAM_API_KEY = process.env.SARVAM_API_KEY || ''
const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text-translate'

export default async (request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers })
  }

  if (!SARVAM_API_KEY) {
    return new Response(JSON.stringify({ error: 'Sarvam API key not configured' }), { status: 500, headers })
  }

  try {
    // The client sends FormData with file, model, language_code
    // Forward it directly to Sarvam API
    const formData = await request.formData()

    // Rebuild FormData for Sarvam (ensure correct field names)
    const sarvamForm = new FormData()
    const audioFile = formData.get('file')
    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), { status: 400, headers })
    }
    sarvamForm.append('file', audioFile, 'recording.wav')
    const model = formData.get('model') || 'saaras:v2'
    sarvamForm.append('model', model)
    const langCode = formData.get('language_code')
    if (langCode) sarvamForm.append('language_code', langCode)

    const response = await fetch(SARVAM_STT_URL, {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
      },
      body: sarvamForm,
    })

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      status: response.ok ? 200 : response.status,
      headers,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers },
    )
  }
}
