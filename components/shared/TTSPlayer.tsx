/* ─────────────────────────────────────────────────────────────
   TTSPlayer — small Sarvam Bulbul text-to-speech button.

   Click ▶ plays the supplied text in the selected language via
   Sarvam TTS. Click ■ stops playback. Falls back silently when
   the Sarvam API key is missing (the surrounding chat keeps
   working — only the audio button becomes a no-op).
   ───────────────────────────────────────────────────────────── */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, Pause, Loader2, BookOpen, ChevronDown } from 'lucide-react'
import {
  sarvamTTS,
  SARVAM_AVATAR_VOICES,
  toSarvamLangCode,
  isSarvamTTSLanguage,
  type SarvamLanguageCode,
} from '@/lib/sarvamService'

/** A single Sarvam pronunciation dictionary entry — keep this loose
 *  so callers can pass either the rich SarvamDictEntry shape from
 *  the new browserClient or a minimal { id, name } pair. */
export interface DictOption {
  id: string
  name: string
  word_count?: number | null
  languages?: string[] | null
}

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
  /** Sarvam pronunciation_dictionary_id ('p_xxxxxxxx') — v3 only. */
  dictionaryId?: string | null
  /** When provided, renders an inline dictionary picker next to the
   *  speaker button. Pick `null` to disable the dictionary on the
   *  current playback. */
  dictionaries?: DictOption[]
  /** Fires when the user picks a different dictionary from the picker. */
  onDictionaryChange?: (id: string | null) => void
}

/** Cache for in-flight audio objects so repeat plays are instant */
const audioCache = new Map<string, string>()

function cacheKey(text: string, lang: string, speaker: string, dictId: string | null | undefined) {
  return `${lang}::${speaker}::${dictId || '-'}::${text.slice(0, 200)}`
}

export default function TTSPlayer({
  text,
  lang = 'en-IN',
  speaker = SARVAM_AVATAR_VOICES.abe,
  size = 'sm',
  className = '',
  accent = '#6366F1',
  title,
  dictionaryId = null,
  dictionaries,
  onDictionaryChange,
}: TTSPlayerProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle')
  const [error, setError] = useState(false)
  const [dictOpen, setDictOpen] = useState(false)
  const [internalDict, setInternalDict] = useState<string | null>(dictionaryId)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mountedRef = useRef(true)

  // Keep internal pick in sync with controlled prop
  useEffect(() => { setInternalDict(dictionaryId ?? null) }, [dictionaryId])

  const activeDictId = internalDict ?? null
  const activeDict = dictionaries?.find(d => d.id === activeDictId) || null

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

    const key = cacheKey(text, targetLang, speaker, activeDictId)
    let dataUrl = audioCache.get(key)

    if (!dataUrl) {
      const b64 = await sarvamTTS({
        text,
        targetLanguage: targetLang,
        speaker,
        pronunciationDictionaryId: activeDictId || undefined,
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
  }, [text, targetLang, speaker, state, stop, activeDictId])

  const dim = size === 'md' ? 'w-8 h-8' : 'w-6 h-6'
  const icon = size === 'md' ? 'w-4 h-4' : 'w-3 h-3'

  const pickDict = (id: string | null) => {
    setInternalDict(id)
    setDictOpen(false)
    if (onDictionaryChange) onDictionaryChange(id)
  }

  const showPicker = (dictionaries && dictionaries.length > 0)

  // No picker → render just the speaker button as before
  if (!showPicker) {
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

  // With picker → speaker button + tiny dict chip
  return (
    <span className={`relative inline-flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={play}
        title={title ?? (state === 'playing' ? 'Stop playback' : `Play in ${targetLang}`)}
        aria-label={state === 'playing' ? 'Stop audio' : 'Play audio'}
        className={`${dim} inline-flex items-center justify-center rounded-full transition-all hover:scale-110`}
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

      <button
        type="button"
        onClick={() => setDictOpen(v => !v)}
        title={activeDict ? `Pronunciation dict: ${activeDict.name}` : 'No pronunciation dict'}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium transition-all"
        style={{
          background: activeDict ? `${accent}22` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${activeDict ? `${accent}55` : 'rgba(255,255,255,0.08)'}`,
          color: activeDict ? accent : '#9ca3af',
        }}
      >
        <BookOpen className="w-2.5 h-2.5" />
        <span className="truncate max-w-[60px]">{activeDict ? activeDict.name : 'dict'}</span>
        <ChevronDown className={`w-2.5 h-2.5 transition-transform ${dictOpen ? 'rotate-180' : ''}`} />
      </button>

      {dictOpen && (
        <div
          className="absolute z-50 top-full left-0 mt-1 w-52 max-h-[200px] overflow-y-auto rounded-xl shadow-2xl"
          style={{ background: '#0e0e14', border: `1px solid ${accent}33` }}
        >
          <button
            type="button"
            onClick={() => pickDict(null)}
            className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors hover:bg-white/[0.06] ${
              activeDictId === null ? 'text-white bg-white/[0.04]' : 'text-gray-400'
            }`}
          >
            <span className="font-medium">No dictionary</span>
            <span className="block text-[9px] text-gray-600 mt-0.5">Use Sarvam defaults</span>
          </button>
          {dictionaries!.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => pickDict(d.id)}
              className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors hover:bg-white/[0.06] ${
                activeDictId === d.id ? 'text-white bg-white/[0.04]' : 'text-gray-400'
              }`}
            >
              <span className="font-medium truncate block">{d.name}</span>
              {(d.word_count != null || (d.languages && d.languages.length > 0)) && (
                <span className="block text-[9px] text-gray-600 mt-0.5">
                  {d.word_count != null && `${d.word_count} words`}
                  {d.word_count != null && d.languages?.length ? ' · ' : ''}
                  {d.languages?.join(', ')}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </span>
  )
}
