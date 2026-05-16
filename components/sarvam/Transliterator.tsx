'use client'

/* ─────────────────────────────────────────────────────────────
   Sarvam Transliterator — script conversion + spoken form

   Three use cases (same endpoint, behaviour controlled by the
   language pair + the spoken_form flag):
     1. Romanise:           Indic → Roman   (mera office hai)
     2. Indic conversion:   Roman/English → Indic  (मैं ऑफिस)
     3. Spoken form:        written → speakable  (9:30am → सुबह
                            साढ़े नौ बजे) — toggle on.

   Same UI affordances as <Translator />: dual-pane, lang pickers,
   debounced auto-run, copy button. 1000-char cap enforced inline.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  sarvamTransliterate,
  formatSarvamError,
  type SarvamTransliterateResult,
} from '@/lib/sarvam/browserClient'

const LANGS: Array<{ code: string; label: string }> = [
  { code: 'en-IN',  label: 'English' },
  { code: 'hi-IN',  label: 'हिन्दी' },
  { code: 'bn-IN',  label: 'বাংলা' },
  { code: 'ta-IN',  label: 'தமிழ்' },
  { code: 'te-IN',  label: 'తెలుగు' },
  { code: 'kn-IN',  label: 'ಕನ್ನಡ' },
  { code: 'ml-IN',  label: 'മലയാളം' },
  { code: 'mr-IN',  label: 'मराठी' },
  { code: 'gu-IN',  label: 'ગુજરાતી' },
  { code: 'pa-IN',  label: 'ਪੰਜਾਬੀ' },
  { code: 'od-IN',  label: 'ଓଡ଼ିଆ' },
]
const MAX_CHARS = 1000

export interface TransliteratorProps {
  className?: string
  defaultSource?: string
  defaultTarget?: string
  onResult?: (r: SarvamTransliterateResult) => void
}

export default function Transliterator({
  className = '',
  defaultSource = 'auto',
  defaultTarget = 'hi-IN',
  onResult,
}: TransliteratorProps) {
  const [source, setSource] = useState(defaultSource)
  const [target, setTarget] = useState(defaultTarget)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [spokenForm, setSpokenForm] = useState(false)
  const [numerals, setNumerals] = useState<'international' | 'native'>('international')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detectedSource, setDetectedSource] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const debounceRef = useRef<number | null>(null)

  const sourceOptions = useMemo(() => ([
    { code: 'auto', label: 'Auto-detect' },
    ...LANGS,
  ]), [])

  // Auto-run with debounce.
  useEffect(() => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    if (!input.trim()) {
      setOutput(''); setError(null); setDetectedSource(null); return
    }
    if (input.length > MAX_CHARS) {
      setError(`Input exceeds ${MAX_CHARS} chars.`)
      return
    }
    debounceRef.current = window.setTimeout(() => { void run() }, 600)
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, source, target, spokenForm, numerals])

  const run = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const result = await sarvamTransliterate({
        input: input.slice(0, MAX_CHARS),
        source_language_code: source,
        target_language_code: target,
        spoken_form: spokenForm,
        numerals_format: numerals,
      })
      setOutput(result.transliterated_text)
      setDetectedSource(result.source_language_code || null)
      setRequestId(result.request_id || null)
      onResult?.(result)
    } catch (e: unknown) {
      setError(formatSarvamError(e))
    } finally { setBusy(false) }
  }, [input, source, target, spokenForm, numerals, onResult])

  const handleSwap = useCallback(() => {
    const effectiveSource = source === 'auto'
      ? (detectedSource && LANGS.some((l) => l.code === detectedSource) ? detectedSource : 'en-IN')
      : source
    setSource(target); setTarget(effectiveSource)
    setInput(output); setOutput(input)
    setDetectedSource(null)
  }, [source, target, input, output, detectedSource])

  const langLabel = (code: string): string =>
    code === 'auto' ? 'Auto-detect' : LANGS.find((l) => l.code === code)?.label || code

  const isOver = input.length > MAX_CHARS

  return (
    <section className={`rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 ${className}`}>
      <header className="mb-4">
        <h2 className="text-base font-bold text-white">Sarvam Transliterator</h2>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Script conversion + spoken form · 11 langs · ≤1000 chars · auto-detect supported
        </p>
      </header>

      {/* Lang pickers + swap */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-end mb-3">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">From</label>
          <select
            value={source} onChange={(e) => setSource(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
          >
            {sourceOptions.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <button
          type="button" onClick={handleSwap} title="Swap"
          className="self-end mb-1 px-2 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >⇄</button>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">To</label>
          <select
            value={target} onChange={(e) => setTarget(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
          >
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap items-center gap-3 mb-3 text-[11px] text-gray-300">
        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox" checked={spokenForm}
            onChange={(e) => setSpokenForm(e.target.checked)}
            className="accent-brand-red"
          />
          Spoken form
          <span className="text-gray-600">— "9:30am" → "साढ़े नौ बजे"</span>
        </label>
        <span className="text-gray-600">·</span>
        <label className="inline-flex items-center gap-1.5">
          <span>Numerals</span>
          <select
            value={numerals} onChange={(e) => setNumerals(e.target.value as typeof numerals)}
            className="bg-white/[0.03] border border-white/[0.08] rounded px-2 py-0.5 text-[11px] text-white focus:outline-none focus:border-brand-red/40"
          >
            <option value="international">International</option>
            <option value="native">Native</option>
          </select>
        </label>
      </div>

      {/* Dual panes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.08] p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
              {langLabel(source)}
            </span>
            <span className={`text-[10px] font-mono ${isOver ? 'text-red-400' : 'text-gray-500'}`}>
              {input.length} / {MAX_CHARS}
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            placeholder="Type or paste text…"
            className="w-full bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none resize-vertical"
            maxLength={MAX_CHARS + 100}
          />
        </div>
        <div className="rounded-xl bg-amber-500/[0.04] border border-amber-500/20 p-3 relative min-h-[120px]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                {langLabel(target)}
              </span>
              {detectedSource && source === 'auto' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-300 font-mono">
                  src: {detectedSource}
                </span>
              )}
            </div>
            {busy && <span className="text-[10px] text-amber-300">Working…</span>}
          </div>
          <p className="text-sm text-white whitespace-pre-wrap leading-relaxed min-h-[64px]">
            {output || <span className="text-gray-600 italic">Result appears here.</span>}
          </p>
          {output && (
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => { try { void navigator.clipboard.writeText(output) } catch { /* noop */ } }}
                className="px-2 py-1 rounded text-[10px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors"
              >⎘ Copy</button>
              {requestId && (
                <span className="text-[9px] text-gray-600 font-mono truncate" title={requestId}>
                  req {requestId.slice(0, 10)}…
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300">
          {error}
        </div>
      )}
    </section>
  )
}
