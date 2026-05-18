/* ─────────────────────────────────────────────────────────────
   TTSPlayer — small Sarvam Bulbul text-to-speech button.

   Click ▶ plays the supplied text in the selected language via
   Sarvam TTS. Click ■ stops playback. Falls back silently when
   the Sarvam API key is missing (the surrounding chat keeps
   working — only the audio button becomes a no-op).
   ───────────────────────────────────────────────────────────── */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, Pause, Loader2 } from 'lucide-react'
import {
  sarvamTTS,
  SARVAM_AVATAR_VOICES,
  toSarvamLangCode,
  isSarvamTTSLanguage,
  type SarvamLanguageCode,
} from '@/lib/sarvamService'

interface TTSPlayerProps {
  /** Text to speak (≤ 2500 chars is recommended; the service caps it) */
  text: string
  /** Sarvam BCP-47 language code (e.g. 'en-IN', 'hi-IN'). Falls back to en-IN. */
  lang?: SarvamLanguageCode | string
  /** Sarvam Bulbul speaker id. Defaults to the Abe (male) voice. */
  speaker?: string
  /** Size variant */
  size?: 'sm' | 'md'
  /** Optional className for the outer button */
  className?: string
  /** Accent color (hex) — controls icon/ring colour */
  accent?: string
  /** Title attribute override */
  title?: string
}

/** Cache for in-flight audio objects so repeat plays are instant */
const audioCache = new Map<string, string>()

function cacheKey(text: string, lang: string, speaker: string) {
  return `${lang}::${speaker}::${text.slice(0, 200)}`
}

export default function TTSPlayer({
  text,
  lang = 'en-IN',
  speaker = SARVAM_AVATAR_VOICES.abe,
  size = 'sm',
  className = '',
  accent = '#6366F1',
  title,
}: TTSPlayerProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle')
  const [error, setError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => () => {
    mountedRef.current = false
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [])

  // Normalize lang to a Sarvam code, fall back to en-IN for unsupported
  const targetLang: SarvamLanguageCode = isSarvamTTSLanguage(lang)
    ? toSarvamLangCode(lang)
    : 'en-IN'

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setState('idle')
  }, [])

  const play = useCallback(async () => {
    if (state === 'playing') {
      stop()
      return
    }
    if (!text?.trim()) return

    setError(false)
    setState('loading')

    const key = cacheKey(text, targetLang, speaker)
    let dataUrl = audioCache.get(key)

    if (!dataUrl) {
      const b64 = await sarvamTTS({
        text,
        targetLanguage: targetLang,
        speaker,
      })
      if (!mountedRef.current) return
      if (!b64) {
        setError(true)
        setState('idle')
        return
      }
      dataUrl = `data:audio/wav;base64,${b64}`
      audioCache.set(key, dataUrl)
    }

    const audio = new Audio(dataUrl)
    audioRef.current = audio
    audio.onended = () => {
      if (mountedRef.current) setState('idle')
    }
    audio.onerror = () => {
      if (mountedRef.current) {
        setError(true)
        setState('idle')
      }
    }
    try {
      await audio.play()
      if (mountedRef.current) setState('playing')
    } catch {
      if (mountedRef.current) {
        setError(true)
        setState('idle')
      }
    }
  }, [text, targetLang, speaker, state, stop])

  const dim = size === 'md' ? 'w-8 h-8' : 'w-6 h-6'
  const icon = size === 'md' ? 'w-4 h-4' : 'w-3 h-3'

  return (
    <button
      type="button"
      onClick={play}
      title={title ?? (state === 'playing' ? 'Stop playback' : `Play in ${targetLang}`)}
      aria-label={state === 'playing' ? 'Stop audio' : 'Play audio'}
      className={`${dim} inline-flex items-center justify-center rounded-full transition-all hover:scale-110 ${className}`}
      style={{
        background: state === 'playing' ? `${accent}33` : 'rgba(255,255,255,0.06)',
        border: `1px solid ${state === 'playing' ? accent : 'rgba(255,255,255,0.08)'}`,
        color: error ? '#ef4444' : accent,
      }}
    >
      {state === 'loading' ? (
        <Loader2 className={`${icon} animate-spin`} />
      ) : state === 'playing' ? (
        <Pause className={icon} />
      ) : (
        <Volume2 className={icon} />
      )}
    </button>
  )
}
