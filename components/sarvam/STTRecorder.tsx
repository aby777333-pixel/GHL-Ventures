'use client'

/* ─────────────────────────────────────────────────────────────
   Sarvam STT Recorder — REST recorder for short clips (≤30 s)

   What it does
   ────────────
   • Mic button: start/stop recording via MediaRecorder.
   • Live waveform from AnalyserNode (no canvas lib needed —
     a 32-bar SVG drawn from the frequency-domain magnitudes).
   • Hard cap at 30 s with an auto-stop + countdown; the UI
     points the user to <BatchTranscriber /> for longer clips.
   • Pickers: language (10 core + Auto), mode (transcribe /
     translate / verbatim / translit / codemix).
   • On stop → POSTs the WebM Blob to /.netlify/functions/sarvam-stt-v2
     via the shared browserClient helper.
   • Shows the transcript + the detected language + the request_id.

   Re-uses the existing project's crimson palette and Tailwind
   tokens for visual consistency with TTSPlayer.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  sarvamSTT,
  formatSarvamError,
  type SarvamSttResult,
} from '@/lib/sarvam/browserClient'

const CORE_LANGS: Array<{ code: string; label: string }> = [
  { code: 'unknown', label: 'Auto-detect' },
  { code: 'en-IN',   label: 'English' },
  { code: 'hi-IN',   label: 'हिन्दी' },
  { code: 'bn-IN',   label: 'বাংলা' },
  { code: 'ta-IN',   label: 'தமிழ்' },
  { code: 'te-IN',   label: 'తెలుగు' },
  { code: 'kn-IN',   label: 'ಕನ್ನಡ' },
  { code: 'ml-IN',   label: 'മലയാളം' },
  { code: 'mr-IN',   label: 'मराठी' },
  { code: 'gu-IN',   label: 'ગુજરાતી' },
  { code: 'pa-IN',   label: 'ਪੰਜਾਬੀ' },
  { code: 'od-IN',   label: 'ଓଡ଼ିଆ' },
]

const MODES: Array<{ key: 'transcribe' | 'translate' | 'verbatim' | 'translit' | 'codemix'; label: string; hint: string }> = [
  { key: 'transcribe', label: 'Transcribe', hint: 'Plain text in the spoken language' },
  { key: 'translate',  label: 'Translate',  hint: 'Output in English regardless of source' },
  { key: 'verbatim',   label: 'Verbatim',   hint: 'Exact words, numbers spoken as said' },
  { key: 'translit',   label: 'Transliterate', hint: 'Indic words written in Latin script' },
  { key: 'codemix',    label: 'Code-mix',   hint: 'Preserves Hinglish-style mixed content' },
]

const MAX_SECONDS = 30

export interface STTRecorderProps {
  className?: string
  /** Fires after every successful transcription. */
  onResult?: (r: SarvamSttResult & { audioUrl: string }) => void
}

type Phase = 'idle' | 'recording' | 'processing' | 'result' | 'error'

export default function STTRecorder({ className = '', onResult }: STTRecorderProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState<string>('unknown')
  const [mode, setMode] = useState<typeof MODES[number]['key']>('transcribe')
  const [seconds, setSeconds] = useState(0)
  const [result, setResult] = useState<SarvamSttResult | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [bars, setBars] = useState<number[]>(Array(32).fill(0))

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const startedAtRef = useRef<number>(0)
  const tickRef = useRef<number | null>(null)

  // Cleanup on unmount — releases the mic + revokes object URLs.
  useEffect(() => {
    return () => {
      stopEverything()
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopEverything = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    if (tickRef.current !== null) clearInterval(tickRef.current)
    tickRef.current = null
    try { recorderRef.current?.state === 'recording' && recorderRef.current?.stop() } catch { /* noop */ }
    try { streamRef.current?.getTracks().forEach((t) => t.stop()) } catch { /* noop */ }
    try { audioCtxRef.current?.close() } catch { /* noop */ }
    streamRef.current = null
    audioCtxRef.current = null
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    setResult(null)
    setBars(Array(32).fill(0))
    setSeconds(0)
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null) }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
    } catch (e: unknown) {
      const msg = (e as Error)?.name === 'NotAllowedError'
        ? 'Microphone permission denied. Allow mic access in the browser address bar.'
        : `Could not start mic: ${(e as Error)?.message || 'unknown'}`
      setError(msg)
      setPhase('error')
      return
    }
    streamRef.current = stream

    // Visualiser
    try {
      const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
      const ctx = new Ctx()
      audioCtxRef.current = ctx
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64                       // 32 frequency bins
      analyser.smoothingTimeConstant = 0.7
      src.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        // Normalise to 0..1 and clamp the high bins (mostly noise).
        const next = Array.from(data).map((v) => v / 255)
        setBars(next)
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      // Visualiser failure is non-fatal.
    }

    // Recorder — let the browser pick the best webm/opus encoder it has.
    let recorder: MediaRecorder
    try {
      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : ''
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64_000 })
        : new MediaRecorder(stream)
    } catch (e: unknown) {
      setError(`Browser doesn't support recording: ${(e as Error)?.message || 'unknown'}`)
      setPhase('error')
      stopEverything()
      return
    }
    recorderRef.current = recorder
    chunksRef.current = []
    recorder.ondataavailable = (evt) => {
      if (evt.data && evt.data.size > 0) chunksRef.current.push(evt.data)
    }
    recorder.onstop = async () => {
      const mime = recorder.mimeType || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type: mime })
      chunksRef.current = []
      const localUrl = URL.createObjectURL(blob)
      setAudioUrl(localUrl)
      setPhase('processing')
      try {
        const res = await sarvamSTT({
          file: blob,
          mode,
          language_code: lang === 'unknown' ? 'unknown' : lang,
        })
        setResult(res)
        setPhase('result')
        onResult?.({ ...res, audioUrl: localUrl })
      } catch (e: unknown) {
        setError(formatSarvamError(e))
        setPhase('error')
      } finally {
        stopEverything()
      }
    }

    startedAtRef.current = Date.now()
    recorder.start(250)
    setPhase('recording')
    // 30-s cap + per-second tick.
    tickRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
      setSeconds(elapsed)
      if (elapsed >= MAX_SECONDS) {
        try { recorder.state === 'recording' && recorder.stop() } catch { /* noop */ }
      }
    }, 250) as unknown as number
  }, [audioUrl, lang, mode, onResult, stopEverything])

  const handleStop = useCallback(() => {
    try { recorderRef.current?.state === 'recording' && recorderRef.current?.stop() } catch { /* noop */ }
  }, [])

  const handleReset = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setResult(null)
    setError(null)
    setSeconds(0)
    setBars(Array(32).fill(0))
    setPhase('idle')
  }, [audioUrl])

  const isRecording = phase === 'recording'
  const isBusy = phase === 'processing'

  return (
    <section className={`rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 ${className}`}>
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-white">Sarvam STT Recorder</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            saaras:v3 · {MAX_SECONDS}s max · longer clips → use Batch Transcriber
          </p>
        </div>
        <span className={`text-[10px] uppercase tracking-wider font-bold ${
          isRecording ? 'text-red-400' : isBusy ? 'text-amber-400' : phase === 'result' ? 'text-emerald-400' : 'text-gray-600'
        }`}>
          {phase}
        </span>
      </header>

      {/* Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">
            Language
          </label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={isRecording || isBusy}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 disabled:opacity-50"
          >
            {CORE_LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">
            Mode
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
            disabled={isRecording || isBusy}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 disabled:opacity-50"
          >
            {MODES.map((m) => (
              <option key={m.key} value={m.key}>{m.label} — {m.hint}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Recorder surface */}
      <div className="rounded-xl bg-black/30 border border-white/[0.06] p-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={isRecording ? handleStop : startRecording}
            disabled={isBusy}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold transition-all shadow-lg disabled:opacity-50"
            style={{
              background: isRecording
                ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                : 'linear-gradient(135deg, #D0021B, #8B0000)',
              boxShadow: isRecording ? '0 0 0 6px rgba(239,68,68,0.18)' : undefined,
            }}
            title={isRecording ? 'Stop' : 'Record'}
          >
            {isRecording ? (
              <span className="block w-4 h-4 bg-white rounded-sm" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
              </svg>
            )}
          </button>

          {/* Waveform / state strip */}
          <div className="flex-1 min-w-0">
            {(isRecording || isBusy || phase === 'result') ? (
              <div className="flex items-center gap-0.5 h-12">
                {bars.map((v, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-sm transition-all"
                    style={{
                      height: `${Math.max(4, v * 100)}%`,
                      background: isRecording
                        ? `rgba(239,68,68,${0.4 + v * 0.6})`
                        : isBusy
                          ? 'rgba(251,191,36,0.4)'
                          : 'rgba(52,211,153,0.4)',
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Tap the mic to record. Recording auto-stops at {MAX_SECONDS}s.
              </p>
            )}
            {isRecording && (
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] text-gray-400 font-mono">
                  {seconds}s / {MAX_SECONDS}s
                </span>
                <span className="text-[10px] text-gray-600">
                  {Math.max(0, MAX_SECONDS - seconds)}s left
                </span>
              </div>
            )}
            {isBusy && (
              <p className="text-[11px] text-amber-300 mt-1.5">Transcribing…</p>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Transcript</span>
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                {result.language_code && (
                  <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-300 font-mono">
                    {result.language_code}
                  </span>
                )}
                {result.request_id && (
                  <span className="font-mono truncate max-w-[160px]" title={result.request_id}>
                    req {result.request_id.slice(0, 10)}…
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
              {result.transcript || <span className="text-gray-500 italic">— empty —</span>}
            </p>
          </div>

          {audioUrl && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">
                Recording
              </label>
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              ↻ Record again
            </button>
            {result.transcript && (
              <button
                type="button"
                onClick={() => {
                  try { void navigator.clipboard.writeText(result.transcript) } catch { /* noop */ }
                }}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                ⎘ Copy
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
