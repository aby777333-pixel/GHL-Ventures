const SARVAM_API_KEY = process.env.SARVAM_API_KEY || 'sk_qlvx1qvk_00N5DAg22VRNdDrzOb3f7TPc'
const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text-translate'

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!SARVAM_API_KEY) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Sarvam API Key not configured. Set SARVAM_API_KEY in environment variables.' }),
    }
  }

  try {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64')
      : event.body

    // Forward the exact content-type (must include boundary for multipart)
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || 'multipart/form-data'

    const response = await fetch(SARVAM_STT_URL, {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'Content-Type': contentType,
      },
      body,
    })

    const data = await response.json()

    if (!response.ok) {
      console.warn('[sarvam-stt] API error:', response.status, JSON.stringify(data))
    }

    return {
      statusCode: response.ok ? 200 : response.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  } catch (error) {
    console.error('[sarvam-stt] Function error:', error)
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    }
  }
}
