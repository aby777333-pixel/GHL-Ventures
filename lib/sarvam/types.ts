/* ─────────────────────────────────────────────────────────────
   Sarvam AI — shared types + constants

   Single source of truth for languages, voices, models, modes,
   and request / response shapes used by every Sarvam wrapper.

   Server-only. Anything importing this file MUST run in a
   Netlify Function (Node runtime) — not in the browser bundle.
   The browser talks to /.netlify/functions/sarvam-* instead.

   No `zod` dependency on purpose — the project doesn't ship it
   and the validation surface is small enough to express with
   plain TypeScript + a tiny `validate(...)` helper exported at
   the bottom.
   ───────────────────────────────────────────────────────────── */

// ── Language codes (BCP-47, Indic + English) ────────────────
//   23 codes. Coverage varies per capability — see the
//   SARVAM_CAPABILITY_LANG_SUPPORT matrix below.
export const SARVAM_LANGUAGE_CODES = [
  'en-IN', 'hi-IN', 'bn-IN', 'ta-IN', 'te-IN', 'kn-IN', 'ml-IN',
  'mr-IN', 'gu-IN', 'pa-IN', 'od-IN', 'as-IN', 'brx-IN', 'doi-IN',
  'kok-IN', 'ks-IN', 'mai-IN', 'mni-IN', 'ne-IN', 'sa-IN', 'sat-IN',
  'sd-IN', 'ur-IN',
] as const
export type SarvamLanguageCode = typeof SARVAM_LANGUAGE_CODES[number]

// 11-lang subset that bulbul:v3 (TTS) + saaras:v3 (STT) + mayura:v1
// (Translate) all support. Use this for components that share state
// across all three capabilities (e.g. NEXUS voice agent).
export const SARVAM_CORE_LANG_CODES: SarvamLanguageCode[] = [
  'en-IN', 'hi-IN', 'bn-IN', 'ta-IN', 'te-IN', 'kn-IN', 'ml-IN',
  'mr-IN', 'gu-IN', 'pa-IN', 'od-IN',
]

export const SARVAM_LANGUAGE_LABELS: Record<SarvamLanguageCode, { english: string; native: string }> = {
  'en-IN':  { english: 'English',           native: 'English' },
  'hi-IN':  { english: 'Hindi',             native: 'हिन्दी' },
  'bn-IN':  { english: 'Bengali',           native: 'বাংলা' },
  'ta-IN':  { english: 'Tamil',             native: 'தமிழ்' },
  'te-IN':  { english: 'Telugu',            native: 'తెలుగు' },
  'kn-IN':  { english: 'Kannada',           native: 'ಕನ್ನಡ' },
  'ml-IN':  { english: 'Malayalam',         native: 'മലയാളം' },
  'mr-IN':  { english: 'Marathi',           native: 'मराठी' },
  'gu-IN':  { english: 'Gujarati',          native: 'ગુજરાતી' },
  'pa-IN':  { english: 'Punjabi',           native: 'ਪੰਜਾਬੀ' },
  'od-IN':  { english: 'Odia',              native: 'ଓଡ଼ିଆ' },
  'as-IN':  { english: 'Assamese',          native: 'অসমীয়া' },
  'brx-IN': { english: 'Bodo',              native: 'बड़ो' },
  'doi-IN': { english: 'Dogri',             native: 'डोगरी' },
  'kok-IN': { english: 'Konkani',           native: 'कोंकणी' },
  'ks-IN':  { english: 'Kashmiri',          native: 'کٲشُر' },
  'mai-IN': { english: 'Maithili',          native: 'मैथिली' },
  'mni-IN': { english: 'Manipuri',          native: 'ꯃꯩꯇꯩꯂꯣꯟ' },
  'ne-IN':  { english: 'Nepali',            native: 'नेपाली' },
  'sa-IN':  { english: 'Sanskrit',          native: 'संस्कृतम्' },
  'sat-IN': { english: 'Santali',           native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  'sd-IN':  { english: 'Sindhi',            native: 'سنڌي' },
  'ur-IN':  { english: 'Urdu',              native: 'اُردُو' },
}

// Capability support matrix. `true` = the language is supported by
// that capability/model; `false` = not supported.
export type SarvamCapability =
  | 'tts-bulbul-v3'
  | 'stt-saaras-v3'
  | 'translate-mayura-v1'
  | 'translate-sarvam-v1'

const _coreOnly = new Set<SarvamLanguageCode>(SARVAM_CORE_LANG_CODES)
const _allLangs = new Set<SarvamLanguageCode>(SARVAM_LANGUAGE_CODES)

export const SARVAM_CAPABILITY_LANG_SUPPORT: Record<SarvamCapability, (l: SarvamLanguageCode) => boolean> = {
  // bulbul:v3 covers the 11 core langs
  'tts-bulbul-v3':       (l) => _coreOnly.has(l),
  // saaras:v3 covers the 11 core langs (it also accepts the literal
  // 'unknown' as a separate sentinel — see SttLanguageCode below)
  'stt-saaras-v3':       (l) => _coreOnly.has(l),
  // mayura:v1 — 11 core langs (plus the 'auto' sentinel for source)
  'translate-mayura-v1': (l) => _coreOnly.has(l),
  // sarvam-translate:v1 — all 22 scheduled langs + English
  'translate-sarvam-v1': (l) => _allLangs.has(l),
}

// ── Bulbul v3 speakers (TTS) ────────────────────────────────
//   Names are lowercase + case-sensitive ('ritu' ≠ 'Ritu').
export const BULBUL_V3_MALE_SPEAKERS = [
  'shubh', 'aditya', 'rahul', 'rohan', 'amit', 'dev', 'ratan',
  'varun', 'manan', 'sumit', 'kabir', 'aayan', 'ashutosh',
  'advait', 'anand', 'tarun', 'sunny', 'mani', 'gokul', 'vijay',
  'mohit', 'rehan', 'soham',
] as const
export const BULBUL_V3_FEMALE_SPEAKERS = [
  'ritu', 'priya', 'neha', 'pooja', 'simran', 'kavya', 'ishita',
  'shreya', 'roopa', 'amelia', 'sophia', 'tanya', 'shruti',
  'suhani', 'kavitha', 'rupali',
] as const
export const BULBUL_V3_SPEAKERS = [
  ...BULBUL_V3_MALE_SPEAKERS,
  ...BULBUL_V3_FEMALE_SPEAKERS,
] as const
export type BulbulV3Speaker = typeof BULBUL_V3_SPEAKERS[number]

// Legacy v2 voices — kept so existing callers don't break.
export const BULBUL_V2_SPEAKERS = [
  'anushka', 'manisha', 'vidya', 'arya',
  'abhilash', 'karun', 'hitesh',
] as const
export type BulbulV2Speaker = typeof BULBUL_V2_SPEAKERS[number]

// ── Models ──────────────────────────────────────────────────
export const TTS_MODELS = ['bulbul:v2', 'bulbul:v3'] as const
export type TtsModel = typeof TTS_MODELS[number]

export const STT_MODELS = ['saaras:v3', 'saarika:v2.5', 'saaras:v2.5'] as const
export type SttModel = typeof STT_MODELS[number]

export const TRANSLATE_MODELS = ['mayura:v1', 'sarvam-translate:v1'] as const
export type TranslateModel = typeof TRANSLATE_MODELS[number]

// ── STT modes (saaras:v3 only) ──────────────────────────────
export const STT_MODES = ['transcribe', 'translate', 'verbatim', 'translit', 'codemix'] as const
export type SttMode = typeof STT_MODES[number]

// Sarvam STT auto-detect sentinel is the literal string 'unknown'
// (NOT 'auto', which is the Translate convention). Keep this typed
// so callers can't accidentally pass 'auto' to STT.
export type SttLanguageCode = SarvamLanguageCode | 'unknown'

// Translate-side auto-detect sentinel (mayura:v1 only).
export type TranslateSourceLanguageCode = SarvamLanguageCode | 'auto'

// ── Translate modes ─────────────────────────────────────────
export const TRANSLATE_MODES = [
  'formal',
  'modern-colloquial',
  'classic-colloquial',
  'code-mixed',
] as const
export type TranslateMode = typeof TRANSLATE_MODES[number]

export const TRANSLATE_OUTPUT_SCRIPTS = [
  'roman',
  'fully-native',
  'spoken-form-in-native',
] as const
export type TranslateOutputScript = typeof TRANSLATE_OUTPUT_SCRIPTS[number]

export const NUMERAL_FORMATS = ['international', 'native'] as const
export type NumeralFormat = typeof NUMERAL_FORMATS[number]

// ── Audio codecs ────────────────────────────────────────────
export const TTS_OUTPUT_CODECS = [
  'wav', 'mp3', 'aac', 'opus', 'flac', 'pcm', 'mulaw', 'alaw',
] as const
export type TtsOutputCodec = typeof TTS_OUTPUT_CODECS[number]

export const STT_INPUT_CODECS_REQUIRED = [
  'pcm_s16le', 'pcm_l16', 'pcm_raw',
] as const
export type SttInputCodec = typeof STT_INPUT_CODECS_REQUIRED[number] | 'wav'

// Default sample rates — TTS v3 REST supports up to 48 kHz; streaming
// STT only ever sees 16 kHz (or 8 kHz for telephony).
export const TTS_SAMPLE_RATES = [
  8000, 16000, 22050, 24000, 32000, 44100, 48000,
] as const
export type TtsSampleRate = typeof TTS_SAMPLE_RATES[number]

// ── Request / Response shapes ───────────────────────────────

export interface TtsRequest {
  text: string                            // ≤ 2500 chars on bulbul:v3
  target_language_code: SarvamLanguageCode
  speaker?: string                        // default 'shubh' (v3) / 'anushka' (v2)
  pace?: number                           // v3: 0.5–2.0, v2: 0.3–3.0
  pitch?: number                          // v2 ONLY (-0.75 to 0.75)
  loudness?: number                       // v2 ONLY (0.3 to 3.0)
  temperature?: number                    // v3 ONLY (0.01–2.0, default 0.6)
  speech_sample_rate?: TtsSampleRate
  enable_preprocessing?: boolean
  model?: TtsModel
  output_audio_codec?: TtsOutputCodec
  pronunciation_dictionary_id?: string    // v3 only
}

export interface TtsResponse {
  request_id?: string
  audios: string[]                        // base64-encoded
}

export interface SttRestRequest {
  // `file` itself is sent as multipart, not JSON — see netlify function.
  model?: SttModel                        // default 'saaras:v3'
  mode?: SttMode                          // saaras:v3 only
  language_code?: SttLanguageCode         // pass 'unknown' for auto-detect
  input_audio_codec?: SttInputCodec       // required for raw PCM uploads
}

export interface DiarizedEntry {
  transcript: string
  start_time_seconds: number
  end_time_seconds: number
  speaker_id: string                      // "0", "1", ...
}

export interface SttTimestamps {
  words: string[]
  start_time_seconds: number[]
  end_time_seconds: number[]
}

export interface SttResponse {
  request_id?: string
  transcript: string
  language_code: string | null
  timestamps?: SttTimestamps
  diarized_transcript?: { entries: DiarizedEntry[] }
}

export interface BatchJobCreateRequest {
  model?: SttModel
  mode?: SttMode
  language_code?: SttLanguageCode
  with_diarization?: boolean              // Batch-only; up to 10 speakers
  num_speakers?: number                   // 1–10 hint
  with_timestamps?: boolean
  input_audio_codec?: SttInputCodec
  callback?: { url: string; auth_token: string }
}

export interface BatchJobCreateResponse {
  job_id: string
  state: 'PENDING'
  upload_urls: Array<{ file_index: number; url: string; expires_at: string }>
}

export type BatchJobState =
  | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL'

export interface BatchJobStatusResponse {
  job_id: string
  state: BatchJobState
  progress: number
  file_results?: {
    successful: Array<{ file_index: number; output_url?: string }>
    failed: Array<{ file_index: number; error?: string }>
  }
  error_message?: string | null
}

export interface TranslateRequest {
  input: string                           // ≤ 1000 chars (mayura) / ≤ 2000 (sarvam-translate)
  source_language_code: TranslateSourceLanguageCode
  target_language_code: SarvamLanguageCode
  speaker_gender?: 'Male' | 'Female'
  mode?: TranslateMode
  model?: TranslateModel
  output_script?: TranslateOutputScript | null
  numerals_format?: NumeralFormat
}

export interface TranslateResponse {
  request_id: string | null
  translated_text: string
  source_language_code: string
}

// ── Defaults ────────────────────────────────────────────────
// Centralised so the Netlify functions can read them from process.env
// with a deterministic fallback, instead of each function picking its
// own constant and drifting.
export const SARVAM_DEFAULTS = {
  TTS_MODEL: 'bulbul:v3' as TtsModel,
  STT_MODEL: 'saaras:v3' as SttModel,
  TRANSLATE_MODEL: 'sarvam-translate:v1' as TranslateModel,
  SPEAKER: 'shubh' as BulbulV3Speaker,
  LANGUAGE: 'en-IN' as SarvamLanguageCode,
  TTS_SAMPLE_RATE: 24000 as TtsSampleRate,
  TTS_OUTPUT_CODEC: 'wav' as TtsOutputCodec,
  TTS_TEMPERATURE: 0.6,
  TTS_PACE: 1.0,
}

// ── Endpoint constants ──────────────────────────────────────
export const SARVAM_ENDPOINTS = {
  TTS:                'https://api.sarvam.ai/text-to-speech',
  TTS_WSS:            'wss://api.sarvam.ai/text-to-speech/ws',
  STT:                'https://api.sarvam.ai/speech-to-text',
  STT_TRANSLATE:      'https://api.sarvam.ai/speech-to-text-translate',
  STT_BATCH:          'https://api.sarvam.ai/speech-to-text/job/v1',
  STT_TRANSLATE_BATCH:'https://api.sarvam.ai/speech-to-text-translate/job/v1',
  STT_WSS:            'wss://api.sarvam.ai/speech-to-text/ws',
  STT_TRANSLATE_WSS:  'wss://api.sarvam.ai/speech-to-text-translate/ws',
  TRANSLATE:          'https://api.sarvam.ai/translate',
  TRANSLITERATE:      'https://api.sarvam.ai/transliterate',
  TEXT_LID:           'https://api.sarvam.ai/text-lid',
  // Batch job lifecycle uses templated paths
  BATCH_UPLOAD_URL:   (jobId: string) => `https://api.sarvam.ai/speech-to-text/job/${jobId}/upload-url`,
  BATCH_START:        (jobId: string) => `https://api.sarvam.ai/speech-to-text/job/${jobId}/start`,
  BATCH_STATUS:       (jobId: string) => `https://api.sarvam.ai/speech-to-text/job/${jobId}/status`,
  BATCH_OUTPUT_URL:   (jobId: string) => `https://api.sarvam.ai/speech-to-text/job/${jobId}/output-url`,
} as const

// ── Error envelope returned by Sarvam ───────────────────────
export interface SarvamErrorEnvelope {
  error: {
    message: string
    code?: string
    request_id?: string
  }
}

// ── Lightweight validator ───────────────────────────────────
// Replaces zod for this module. Throws a typed ValidationError on
// any field that violates the constraints documented in the spec.
// Used by every Netlify function before forwarding the request body
// to Sarvam.
export class ValidationError extends Error {
  field?: string
  constructor(message: string, field?: string) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}

const _ttsModels = new Set<string>(TTS_MODELS)
const _sttModels = new Set<string>(STT_MODELS)
const _translateModels = new Set<string>(TRANSLATE_MODELS)
const _sttModes = new Set<string>(STT_MODES)
const _translateModes = new Set<string>(TRANSLATE_MODES)
const _outputScripts = new Set<string>(TRANSLATE_OUTPUT_SCRIPTS)
const _numeralFormats = new Set<string>(NUMERAL_FORMATS)
const _ttsCodecs = new Set<string>(TTS_OUTPUT_CODECS)
const _sttCodecs = new Set<string>([...STT_INPUT_CODECS_REQUIRED, 'wav'])
const _sampleRates = new Set<number>(TTS_SAMPLE_RATES as readonly number[])

function isLang(v: unknown): v is SarvamLanguageCode {
  return typeof v === 'string' && _allLangs.has(v as SarvamLanguageCode)
}

export function validateTtsRequest(raw: unknown): TtsRequest {
  if (!raw || typeof raw !== 'object') throw new ValidationError('Body must be a JSON object')
  const b = raw as Record<string, unknown>

  if (typeof b.text !== 'string' || b.text.length === 0) {
    throw new ValidationError('text is required', 'text')
  }
  const model = (b.model as string | undefined) || SARVAM_DEFAULTS.TTS_MODEL
  if (!_ttsModels.has(model)) throw new ValidationError(`unknown model: ${model}`, 'model')
  const maxText = model === 'bulbul:v3' ? 2500 : 1500
  if (b.text.length > maxText) {
    throw new ValidationError(`text exceeds ${maxText} chars for ${model}`, 'text')
  }
  if (!isLang(b.target_language_code)) {
    throw new ValidationError('invalid target_language_code', 'target_language_code')
  }
  // bulbul:v3 only supports the 11 core langs
  if (model === 'bulbul:v3' && !SARVAM_CAPABILITY_LANG_SUPPORT['tts-bulbul-v3'](b.target_language_code as SarvamLanguageCode)) {
    throw new ValidationError(`bulbul:v3 does not support ${b.target_language_code}`, 'target_language_code')
  }
  if (b.pace !== undefined) {
    const p = Number(b.pace)
    const min = model === 'bulbul:v3' ? 0.5 : 0.3
    const max = model === 'bulbul:v3' ? 2.0 : 3.0
    if (!isFinite(p) || p < min || p > max) {
      throw new ValidationError(`pace must be in [${min}, ${max}] for ${model}`, 'pace')
    }
  }
  if (b.temperature !== undefined && model !== 'bulbul:v3') {
    throw new ValidationError('temperature is bulbul:v3 only', 'temperature')
  }
  if ((b.pitch !== undefined || b.loudness !== undefined) && model === 'bulbul:v3') {
    throw new ValidationError('pitch/loudness are bulbul:v2 only', 'pitch/loudness')
  }
  if (b.speech_sample_rate !== undefined && !_sampleRates.has(Number(b.speech_sample_rate))) {
    throw new ValidationError('unsupported speech_sample_rate', 'speech_sample_rate')
  }
  if (b.output_audio_codec !== undefined && !_ttsCodecs.has(String(b.output_audio_codec))) {
    throw new ValidationError('unsupported output_audio_codec', 'output_audio_codec')
  }
  return { ...(b as object), model } as TtsRequest
}

export function validateSttFields(b: Record<string, unknown>): SttRestRequest {
  const model = (b.model as string | undefined) || SARVAM_DEFAULTS.STT_MODEL
  if (!_sttModels.has(model)) throw new ValidationError(`unknown stt model: ${model}`, 'model')
  if (b.mode !== undefined) {
    if (model !== 'saaras:v3') throw new ValidationError('mode requires saaras:v3', 'mode')
    if (!_sttModes.has(String(b.mode))) throw new ValidationError(`unknown mode: ${b.mode}`, 'mode')
  }
  if (b.language_code !== undefined) {
    const lc = String(b.language_code)
    if (lc !== 'unknown' && !_allLangs.has(lc as SarvamLanguageCode)) {
      throw new ValidationError(`invalid language_code: ${lc}`, 'language_code')
    }
  }
  if (b.input_audio_codec !== undefined && !_sttCodecs.has(String(b.input_audio_codec))) {
    throw new ValidationError('unsupported input_audio_codec', 'input_audio_codec')
  }
  return {
    model: model as SttModel,
    mode: b.mode as SttMode | undefined,
    language_code: b.language_code as SttLanguageCode | undefined,
    input_audio_codec: b.input_audio_codec as SttInputCodec | undefined,
  }
}

export function validateTranslateRequest(raw: unknown): TranslateRequest {
  if (!raw || typeof raw !== 'object') throw new ValidationError('Body must be a JSON object')
  const b = raw as Record<string, unknown>

  if (typeof b.input !== 'string' || b.input.length === 0) {
    throw new ValidationError('input is required', 'input')
  }
  const model = (b.model as string | undefined) || SARVAM_DEFAULTS.TRANSLATE_MODEL
  if (!_translateModels.has(model)) throw new ValidationError(`unknown model: ${model}`, 'model')
  const maxInput = model === 'mayura:v1' ? 1000 : 2000
  if (b.input.length > maxInput) {
    throw new ValidationError(`input exceeds ${maxInput} chars for ${model}`, 'input')
  }
  const src = b.source_language_code
  if (src !== 'auto' && !isLang(src)) {
    throw new ValidationError('invalid source_language_code', 'source_language_code')
  }
  if (src === 'auto' && model !== 'mayura:v1') {
    throw new ValidationError(`source 'auto' requires mayura:v1`, 'source_language_code')
  }
  if (!isLang(b.target_language_code)) {
    throw new ValidationError('invalid target_language_code', 'target_language_code')
  }
  // sarvam-translate:v1 only supports `mode: 'formal'`
  if (model === 'sarvam-translate:v1') {
    if (b.mode !== undefined && b.mode !== 'formal') {
      throw new ValidationError(`sarvam-translate:v1 only supports mode='formal'`, 'mode')
    }
    if (b.output_script !== undefined && b.output_script !== null) {
      throw new ValidationError(`sarvam-translate:v1 does not accept output_script`, 'output_script')
    }
  } else if (b.mode !== undefined && !_translateModes.has(String(b.mode))) {
    throw new ValidationError(`unknown mode: ${b.mode}`, 'mode')
  }
  if (b.output_script !== undefined && b.output_script !== null && !_outputScripts.has(String(b.output_script))) {
    throw new ValidationError(`unknown output_script: ${b.output_script}`, 'output_script')
  }
  if (b.numerals_format !== undefined && !_numeralFormats.has(String(b.numerals_format))) {
    throw new ValidationError(`unknown numerals_format: ${b.numerals_format}`, 'numerals_format')
  }
  return { ...(b as object), model } as TranslateRequest
}
