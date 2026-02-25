/* ─────────────────────────────────────────────────────────────
   Sarvam AI Service — Indian Language AI Platform Integration

   Provides TTS, STT, Translation, and Language Detection for
   22+ Indian languages via Sarvam AI APIs (api.sarvam.ai).

   Used across: Voice SDK, AvatarConcierge, ChatWidget,
   SpeechTranslationWidget, VoiceCommandWidget, Admin AI Ops.
   ───────────────────────────────────────────────────────────── */

// ── Config ──────────────────────────────────────────────────

const SARVAM_API_KEY = process.env.NEXT_PUBLIC_SARVAM_API_KEY || ''
const SARVAM_BASE_URL = 'https://api.sarvam.ai'

export function isSarvamConfigured(): boolean {
  return Boolean(SARVAM_API_KEY)
}

// ── Language Codes ──────────────────────────────────────────

export const SARVAM_LANGUAGES = [
  { code: 'en-IN', label: 'English', native: 'English' },
  { code: 'hi-IN', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta-IN', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te-IN', label: 'Telugu', native: 'తెలుగు' },
  { code: 'kn-IN', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml-IN', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'bn-IN', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr-IN', label: 'Marathi', native: 'मराठी' },
  { code: 'gu-IN', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'pa-IN', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'od-IN', label: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'ur-IN', label: 'Urdu', native: 'اردو' },
  { code: 'as-IN', label: 'Assamese', native: 'অসমীয়া' },
  { code: 'ne-IN', label: 'Nepali', native: 'नेपाली' },
  { code: 'sa-IN', label: 'Sanskrit', native: 'संस्कृतम्' },
  { code: 'sd-IN', label: 'Sindhi', native: 'سنڌي' },
  { code: 'kok-IN', label: 'Konkani', native: 'कोंकणी' },
  { code: 'mai-IN', label: 'Maithili', native: 'मैथिली' },
  { code: 'doi-IN', label: 'Dogri', native: 'डोगरी' },
  { code: 'mni-IN', label: 'Manipuri', native: 'মৈতৈলোন্' },
  { code: 'ks-IN', label: 'Kashmiri', native: 'کٲشُر' },
  { code: 'sat-IN', label: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'brx-IN', label: 'Bodo', native: 'बड़ो' },
] as const

export type SarvamLanguageCode = typeof SARVAM_LANGUAGES[number]['code']

// TTS languages (subset supported by Bulbul model)
export const SARVAM_TTS_LANGUAGES: SarvamLanguageCode[] = [
  'en-IN', 'hi-IN', 'ta-IN', 'te-IN', 'kn-IN', 'ml-IN',
  'bn-IN', 'mr-IN', 'gu-IN', 'pa-IN', 'od-IN',
]

// ── TTS Speakers ────────────────────────────────────────────

export const SARVAM_SPEAKERS = {
  v3: [
    'shubh', 'aditya', 'ritu', 'priya', 'neha', 'rahul', 'pooja',
    'rohan', 'simran', 'kavya', 'amit', 'dev', 'ishita', 'shreya',
    'ratan', 'varun', 'manan', 'sumit', 'roopa', 'kabir', 'aayan',
    'ashutosh', 'advait', 'amelia', 'sophia', 'anand', 'tanya',
    'tarun', 'sunny', 'mani', 'gokul', 'vijay', 'shruti', 'suhani',
    'mohit', 'kavitha', 'rehan', 'soham', 'rupali',
  ],
  v2: ['anushka', 'manisha', 'vidya', 'arya', 'abhilash', 'karun', 'hitesh'],
} as const

// Default speakers for Abe & Tina avatars
export const SARVAM_AVATAR_VOICES = {
  abe: 'ratan',     // Professional male advisor voice
  tina: 'priya',    // Friendly female navigator voice
} as const

// ── Types ───────────────────────────────────────────────────

export interface SarvamTTSRequest {
  text: string
  targetLanguage: SarvamLanguageCode
  speaker?: string
  model?: 'bulbul:v3' | 'bulbul:v2'
  pace?: number           // 0.5–2.0
  sampleRate?: number     // 8000–48000, default 24000
}

export interface SarvamTTSResponse {
  request_id: string
  audios: string[]        // base64-encoded audio
}

export interface SarvamSTTRequest {
  audioBlob: Blob
  model?: 'saarika:v2.5' | 'saaras:v3'
  languageCode?: SarvamLanguageCode | 'unknown'
  mode?: 'transcribe' | 'translate' | 'verbatim' | 'translit' | 'codemix'
}

export interface SarvamSTTResponse {
  request_id: string
  transcript: string
  language_code: string
  language_probability: number
  timestamps?: {
    words: string[]
    start_time_seconds: number[]
    end_time_seconds: number[]
  }
}

export interface SarvamTranslateRequest {
  input: string
  sourceLanguage: SarvamLanguageCode | 'auto'
  targetLanguage: SarvamLanguageCode
  mode?: 'formal' | 'modern-colloquial' | 'classic-colloquial' | 'code-mixed'
  model?: 'mayura:v1' | 'sarvam-translate:v1'
}

export interface SarvamTranslateResponse {
  request_id: string | null
  translated_text: string
  source_language_code: string
}

// ── Helper ──────────────────────────────────────────────────

function headers(contentType?: string): Record<string, string> {
  const h: Record<string, string> = {
    'api-subscription-key': SARVAM_API_KEY,
  }
  if (contentType) h['Content-Type'] = contentType
  return h
}

/** Map short language codes (en, hi, ta) to Sarvam BCP-47 codes */
export function toSarvamLangCode(short: string): SarvamLanguageCode {
  const map: Record<string, SarvamLanguageCode> = {
    en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
    kn: 'kn-IN', ml: 'ml-IN', bn: 'bn-IN', mr: 'mr-IN',
    gu: 'gu-IN', pa: 'pa-IN', od: 'od-IN', ur: 'ur-IN',
    as: 'as-IN', ne: 'ne-IN', sa: 'sa-IN', sd: 'sd-IN',
    kok: 'kok-IN', mai: 'mai-IN', doi: 'doi-IN', mni: 'mni-IN',
    ks: 'ks-IN', sat: 'sat-IN', brx: 'brx-IN',
  }
  // Already a full code
  if (short.includes('-')) return short as SarvamLanguageCode
  return map[short] || 'en-IN'
}

/** Check if a language code is supported by Sarvam TTS */
export function isSarvamTTSLanguage(langCode: string): boolean {
  const sarvamCode = toSarvamLangCode(langCode)
  return SARVAM_TTS_LANGUAGES.includes(sarvamCode)
}

// ── Text-to-Speech ──────────────────────────────────────────

export async function sarvamTTS(req: SarvamTTSRequest): Promise<string | null> {
  if (!isSarvamConfigured()) return null

  try {
    const res = await fetch(`${SARVAM_BASE_URL}/text-to-speech`, {
      method: 'POST',
      headers: headers('application/json'),
      body: JSON.stringify({
        text: req.text.slice(0, 2500),
        target_language_code: req.targetLanguage,
        speaker: req.speaker || SARVAM_AVATAR_VOICES.abe,
        model: req.model || 'bulbul:v3',
        pace: req.pace || 1.0,
        speech_sample_rate: req.sampleRate || 24000,
      }),
    })

    if (!res.ok) {
      console.warn('[sarvam] TTS error:', res.status, res.statusText)
      return null
    }

    const data: SarvamTTSResponse = await res.json()
    return data.audios?.[0] || null  // base64 audio
  } catch (err) {
    console.warn('[sarvam] TTS exception:', err)
    return null
  }
}

/** Play Sarvam TTS audio from base64 string */
export function playSarvamAudio(base64Audio: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(`data:audio/wav;base64,${base64Audio}`)
      audio.onended = () => resolve()
      audio.onerror = () => reject(new Error('Audio playback failed'))
      audio.play().catch(reject)
    } catch (err) {
      reject(err)
    }
  })
}

/** Convenience: TTS + play in one call */
export async function sarvamSpeak(
  text: string,
  language: string,
  speaker?: string,
): Promise<boolean> {
  const audio = await sarvamTTS({
    text,
    targetLanguage: toSarvamLangCode(language),
    speaker,
  })
  if (!audio) return false
  try {
    await playSarvamAudio(audio)
    return true
  } catch {
    return false
  }
}

// ── Speech-to-Text ──────────────────────────────────────────

export async function sarvamSTT(req: SarvamSTTRequest): Promise<SarvamSTTResponse | null> {
  if (!isSarvamConfigured()) return null

  try {
    const formData = new FormData()
    formData.append('file', req.audioBlob, 'audio.wav')
    formData.append('model', req.model || 'saarika:v2.5')
    if (req.languageCode) formData.append('language_code', req.languageCode)
    if (req.mode) formData.append('mode', req.mode)

    const res = await fetch(`${SARVAM_BASE_URL}/speech-to-text`, {
      method: 'POST',
      headers: { 'api-subscription-key': SARVAM_API_KEY },
      body: formData,
    })

    if (!res.ok) {
      console.warn('[sarvam] STT error:', res.status, res.statusText)
      return null
    }

    return await res.json()
  } catch (err) {
    console.warn('[sarvam] STT exception:', err)
    return null
  }
}

// ── Translation ─────────────────────────────────────────────

export async function sarvamTranslate(req: SarvamTranslateRequest): Promise<SarvamTranslateResponse | null> {
  if (!isSarvamConfigured()) return null

  try {
    const res = await fetch(`${SARVAM_BASE_URL}/translate`, {
      method: 'POST',
      headers: headers('application/json'),
      body: JSON.stringify({
        input: req.input.slice(0, 2000),
        source_language_code: req.sourceLanguage,
        target_language_code: req.targetLanguage,
        mode: req.mode || 'formal',
        model: req.model || 'mayura:v1',
      }),
    })

    if (!res.ok) {
      console.warn('[sarvam] Translate error:', res.status, res.statusText)
      return null
    }

    return await res.json()
  } catch (err) {
    console.warn('[sarvam] Translate exception:', err)
    return null
  }
}

/** Convenience: translate text and return translated string */
export async function sarvamTranslateText(
  text: string,
  targetLang: string,
  sourceLang: string = 'auto',
): Promise<string | null> {
  const result = await sarvamTranslate({
    input: text,
    sourceLanguage: sourceLang === 'auto' ? 'auto' : toSarvamLangCode(sourceLang),
    targetLanguage: toSarvamLangCode(targetLang),
  })
  return result?.translated_text || null
}
