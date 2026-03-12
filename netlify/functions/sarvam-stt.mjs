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

  try {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64')
      : event.body

    const response = await fetch(SARVAM_STT_URL, {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'Content-Type': event.headers['content-type'] || 'multipart/form-data',
      },
      body,
    })

    const data = await response.json()

    return {
      statusCode: response.ok ? 200 : response.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    }
  }
}
