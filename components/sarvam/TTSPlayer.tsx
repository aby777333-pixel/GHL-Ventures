'use client'

/* ─────────────────────────────────────────────────────────────
   Sarvam TTS Player — Phase 1 demo UI

   Self-contained component. Drop it anywhere; it only needs a
   signed-in Supabase session (the helper handles the JWT).

   What it does
   ────────────
   • Lets the user type / paste text (≤2500 chars on bulbul:v3).
   • Pick one of the 11 core languages bulbul:v3 supports.
   • Pick one of 30+ v3 voices, grouped Male / Female.
   • Adjust pace (0.5 – 2.0) and pick output codec (wav / mp3).
   • Hit Play → calls /.netlify/functions/sarvam-tts → plays
     the returned audio via a native <audio> element.
   • Surfaces Sarvam errors via formatSarvamError (toast-free
     so this component stays portable).

   Used as the verification surface for Phase 1. Once the
   Staff Portal "Sarvam" tab lands in Phase 4, this same
   component is reused inside it.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  sarvamTTS,
  formatSarvamError,
  type SarvamTtsCallOptions,
} from '@/lib/sarvam/browserClient'

// Mirrors lib/sarvam/types.ts (kept duplicated on purpose so this
// client component doesn't import the server-only module).
const CORE_LANGS: Array<{ code: string; english: string; native: string }> = [
  { code: 'en-IN', english: 'English',   native: 'English' },
  { code: 'hi-IN', english: 'Hindi',     native: 'हिन्दी' },
  { code: 'bn-IN', english: 'Bengali',   native: 'বাংলা' },
  { code: 'ta-IN', english: 'Tamil',     native: 'தமிழ்' },
  { code: 'te-IN', english: 'Telugu',    native: 'తెలుగు' },
  { code: 'kn-IN', english: 'Kannada',   native: 'ಕನ್ನಡ' },
  { code: 'ml-IN', english: 'Malayalam', native: 'മലയാളം' },
  { code: 'mr-IN', english: 'Marathi',   native: 'मराठी' },
  { code: 'gu-IN', english: 'Gujarati',  native: 'ગુજરાતી' },
  { code: 'pa-IN', english: 'Punjabi',   native: 'ਪੰਜਾਬੀ' },
  { code: 'od-IN', english: 'Odia',      native: 'ଓଡ଼ିଆ' },
]

const MALE_SPEAKERS = [
  'shubh', 'aditya', 'rahul', 'rohan', 'amit', 'dev', 'ratan',
  'varun', 'manan', 'sumit', 'kabir', 'aayan', 'ashutosh',
  'advait', 'anand', 'tarun', 'sunny', 'mani', 'gokul', 'vijay',
  'mohit', 'rehan', 'soham',
] as const
const FEMALE_SPEAKERS = [
  'ritu', 'priya', 'neha', 'pooja', 'simran', 'kavya', 'ishita',
  'shreya', 'roopa', 'amelia', 'sophia', 'tanya', 'shruti',
  'suhani', 'kavitha', 'rupali',
] as const

const SAMPLE_TEXT: Record<string, string> = {
  'en-IN': 'Welcome to GHL India Ventures — where your prosperity is our purpose.',
  'hi-IN': 'जी एच एल इंडिया वेंचर्स में आपका स्वागत है।',
  'bn-IN': 'জিএইচএল ইন্ডিয়া ভেঞ্চার্সে আপনাকে স্বাগতম।',
  'ta-IN': 'ஜி.எச்.எல் இந்தியா வென்ச்சர்ஸ்க்கு வரவேற்கிறோம்.',
  'te-IN': 'జి.హెచ్.ఎల్. ఇండియా వెంచర్స్‌కు స్వాగతం.',
  'kn-IN': 'ಜಿಎಚ್‌ಎಲ್ ಇಂಡಿಯಾ ವೆಂಚರ್ಸ್‌ಗೆ ಸ್ವಾಗತ.',
  'ml-IN': 'GHL ഇന്ത്യ വെഞ്ച്വേഴ്സിലേക്ക് സ്വാഗതം.',
  'mr-IN': 'जीएचएल इंडिया व्हेंचर्समध्ये आपले स्वागत आहे.',
  'gu-IN': 'જી.એચ.એલ ઇન્ડિયા વેન્ચર્સમાં આપનું સ્વાગત છે.',
  'pa-IN': 'ਜੀਐਚਐਲ ਇੰਡੀਆ ਵੈਂਚਰਜ਼ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ।',
  'od-IN': 'ଜିଏଚଏଲ ଇଣ୍ଡିଆ ଭେଞ୍ଚର୍ସକୁ ସ୍ୱାଗତ।',
}

const MAX_CHARS = 2500

export interface TTSPlayerProps {
  /** Hide the demo "Load sample text" button. Default false. */
  hideSampleButton?: boolean
  /** Hide the codec picker (keep the default WAV). Default false. */
  hideCodecPicker?: boolean
  /** Callback fired after a successful synthesis with the audio Blob. */
  onAudio?: (audio: { blob: Blob; url: string; requestId: string | null }) => void
  className?: string
}

export default function TTSPlayer({
  hideSampleButton = false,
  hideCodecPicker = false,
  onAudio,
  className = '',
}: TTSPlayerProps) {
  const [text, setText] = useState(SAMPLE_TEXT['en-IN'])
  const [lang, setLang] = useState('en-IN')
  const [speaker, setSpeaker] = useState<string>('shubh')
  const [pace, setPace] = useState(1.0)
  const [codec, setCodec] = useState<NonNullable<SarvamTtsCallOptions['output_audio_codec']>>('wav')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Revoke previous object URL whenever a new one replaces it (or
  // the component unmounts). Avoids memory leaks across multiple
  // synth runs.
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const handlePlay = useCallback(async () => {
    if (!text.trim()) {
      setError('Type something to synthesise.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await sarvamTTS({
        text: text.slice(0, MAX_CHARS),
        target_language_code: lang,
        speaker,
        pace,
        output_audio_codec: codec,
      })
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      setAudioUrl(result.url)
      setRequestId(result.requestId)
      onAudio?.({ blob: result.blob, url: result.url, requestId: result.requestId })
      // Give React a tick to render the <audio src>, then play.
      setTimeout(() => {
        try { void audioRef.current?.play() } catch { /* ignore */ }
      }, 0)
    } catch (e: unknown) {
      setError(formatSarvamError(e))
    } finally {
      setBusy(false)
    }
  }, [text, lang, speaker, pace, codec, audioUrl, onAudio])

  const charCount = text.length
  const overLimit = charCount > MAX_CHARS

  const sampleForLang = useMemo(() => SAMPLE_TEXT[lang] || SAMPLE_TEXT['en-IN'], [lang])

  return (
    <section className={`rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 ${className}`}>
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-white">Sarvam TTS Player</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Powered by bulbul:v3 · {CORE_LANGS.length} languages · {MALE_SPEAKERS.length + FEMALE_SPEAKERS.length} voices
          </p>
        </div>
        {!hideSampleButton && (
          <button
            type="button"
            onClick={() => setText(sampleForLang)}
            className="text-[11px] px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            Load sample
          </button>
        )}
      </header>

      {/* Text input */}
      <div className="mb-4">
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">
          Text to synthesise
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Type or paste text in any of the supported languages…"
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 resize-vertical"
          maxLength={MAX_CHARS + 100}
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className={`text-[10px] ${overLimit ? 'text-red-400' : 'text-gray-500'}`}>
            {charCount} / {MAX_CHARS} characters
          </span>
          {requestId && (
            <span className="text-[9px] text-gray-600 font-mono truncate max-w-[200px]" title={requestId}>
              req {requestId.slice(0, 10)}…
            </span>
          )}
        </div>
      </div>

      {/* Language picker */}
      <div className="mb-4">
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">
          Language
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
          {CORE_LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLang(l.code)
                // Auto-swap to a culturally-fitting sample if the user
                // hasn't typed much yet (≤80 chars). Otherwise keep
                // their content alone.
                if (text.length <= 80) setText(SAMPLE_TEXT[l.code] || sampleForLang)
              }}
              className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                lang === l.code
                  ? 'bg-brand-red/20 border border-brand-red/40 text-white'
                  : 'bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:bg-white/[0.06] hover:text-white'
              }`}
              title={l.english}
            >
              {l.native}
            </button>
          ))}
        </div>
      </div>

      {/* Speaker picker */}
      <div className="mb-4">
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">
          Voice
        </label>
        <div className="space-y-2.5">
          <SpeakerGrid
            title="Male"
            voices={MALE_SPEAKERS as unknown as string[]}
            selected={speaker}
            onSelect={setSpeaker}
          />
          <SpeakerGrid
            title="Female"
            voices={FEMALE_SPEAKERS as unknown as string[]}
            selected={speaker}
            onSelect={setSpeaker}
          />
        </div>
      </div>

      {/* Pace + codec row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">
            <span>Pace</span>
            <span className="font-mono text-gray-400 normal-case tracking-normal">{pace.toFixed(2)}×</span>
          </label>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.05}
            value={pace}
            onChange={(e) => setPace(Number(e.target.value))}
            className="w-full accent-brand-red"
          />
        </div>
        {!hideCodecPicker && (
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">
              Format
            </label>
            <select
              value={codec}
              onChange={(e) => setCodec(e.target.value as typeof codec)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            >
              <option value="wav">WAV (uncompressed)</option>
              <option value="mp3">MP3</option>
              <option value="opus">Opus (smallest)</option>
              <option value="flac">FLAC (lossless)</option>
            </select>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300">
          {error}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handlePlay}
          disabled={busy || overLimit}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}
        >
          {busy ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Synthesising…
            </>
          ) : (
            <>▶ Play</>
          )}
        </button>
        {audioUrl && (
          <a
            href={audioUrl}
            download={`tts-${lang}-${speaker}.${codec}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            ⤓ Download
          </a>
        )}
      </div>

      {/* Native audio element. Hidden until we have audio. */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          className="w-full mt-4"
        />
      )}
    </section>
  )
}

// ── SpeakerGrid (internal) ──────────────────────────────────
function SpeakerGrid({
  title,
  voices,
  selected,
  onSelect,
}: {
  title: string
  voices: string[]
  selected: string
  onSelect: (v: string) => void
}) {
  return (
    <div>
      <div className="text-[10px] text-gray-600 mb-1 uppercase tracking-wider">{title}</div>
      <div className="flex flex-wrap gap-1">
        {voices.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onSelect(v)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-colors ${
              selected === v
                ? 'bg-amber-500/20 border border-amber-500/40 text-white'
                : 'bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
