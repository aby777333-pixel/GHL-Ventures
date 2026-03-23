/* ─────────────────────────────────────────────────────────────
   Sarvam AI — Speech-to-Text Service
   Model: Saaras v3 (23 languages: 22 Indian + English)
   API proxied through Netlify function for security
   ───────────────────────────────────────────────────────────── */

const STT_ENDPOINT = '/api/sarvam-stt'

export interface SarvamSTTResult {
  transcript: string
  language_code?: string
  confidence?: number
}

export interface SarvamSTTOptions {
  language_code?: string  // e.g. 'hi-IN', 'ta-IN', 'en-IN'
  model?: string
}

// Supported languages
export const SARVAM_LANGUAGES = [
  { code: 'en-IN', name: 'English', nativeName: 'English' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as-IN', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'ur-IN', name: 'Urdu', nativeName: 'اردو' },
  { code: 'sa-IN', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
  { code: 'ne-IN', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'sd-IN', name: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'ks-IN', name: 'Kashmiri', nativeName: 'कॉशुर' },
  { code: 'doi-IN', name: 'Dogri', nativeName: 'डोगरी' },
  { code: 'kok-IN', name: 'Konkani', nativeName: 'कोंकणी' },
  { code: 'mni-IN', name: 'Manipuri', nativeName: 'মৈতৈলোন্' },
  { code: 'brx-IN', name: 'Bodo', nativeName: 'बड़ो' },
  { code: 'sat-IN', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'mai-IN', name: 'Maithili', nativeName: 'मैथिली' },
] as const

export type SarvamLanguageCode = typeof SARVAM_LANGUAGES[number]['code']

/**
 * Convert audio blob to text using Sarvam AI STT
 */
export async function speechToText(
  audioBlob: Blob,
  options: SarvamSTTOptions = {}
): Promise<SarvamSTTResult> {
  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.wav')
  formData.append('model', options.model || 'saaras:v2')
  if (options.language_code) {
    formData.append('language_code', options.language_code)
  }

  const response = await fetch(STT_ENDPOINT, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `STT request failed: ${response.status}`)
  }

  const data = await response.json()

  return {
    transcript: data.transcript || '',
    language_code: data.language_code,
    confidence: data.confidence,
  }
}
