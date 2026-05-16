'use client'

/* ─────────────────────────────────────────────────────────────
   Sarvam Translator — dual-pane translator UI

   What it does
   ────────────
   • Source pane on left, target pane on right.
   • Debounced auto-translate (~600 ms after typing stops).
   • Model toggle:
       - mayura:v1            (fast, 11 langs + auto-detect +
                               formal / modern-colloquial / classic-colloquial
                               / code-mixed modes)
       - sarvam-translate:v1  (all 22 Indian langs + English, formal mode only)
   • Swap button flips source ↔ target.
   • Source-language detection chip shown when auto-detect resolves.
   • Per-pane char counter; model-specific max length enforced
     (1000 chars for mayura, 2000 for sarvam-translate).
   • Copy + reset on the target side.

   Re-uses crimson/gold palette for consistency with the other
   sarvam components.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  sarvamTranslate,
  formatSarvamError,
  type SarvamTranslateResult,
} from '@/lib/sarvam/browserClient'

// 11 core langs supported by mayura:v1 (and the inner ring of
// sarvam-translate:v1).
const CORE_LANGS: Array<{ code: string; label: string }> = [
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
// Outer-ring langs only sarvam-translate:v1 supports.
const EXTENDED_LANGS: Array<{ code: string; label: string }> = [
  { code: 'as-IN',  label: 'অসমীয়া (Assamese)' },
  { code: 'brx-IN', label: 'बड़ो (Bodo)' },
  { code: 'doi-IN', label: 'डोगरी (Dogri)' },
  { code: 'kok-IN', label: 'कोंकणी (Konkani)' },
  { code: 'ks-IN',  label: 'کٲشُر (Kashmiri)' },
  { code: 'mai-IN', label: 'मैथिली (Maithili)' },
  { code: 'mni-IN', label: 'Manipuri' },
  { code: 'ne-IN',  label: 'नेपाली (Nepali)' },
  { code: 'sa-IN',  label: 'संस्कृतम् (Sanskrit)' },
  { code: 'sat-IN', label: 'Santali' },
  { code: 'sd-IN',  label: 'سنڌي (Sindhi)' },
  { code: 'ur-IN',  label: 'اُردُو (Urdu)' },
]

const MODES = [
  { key: 'formal',              label: 'Formal' },
  { key: 'modern-colloquial',   label: 'Modern colloquial' },
  { key: 'classic-colloquial',  label: 'Classic colloquial' },
  { key: 'code-mixed',          label: 'Code-mixed' },
] as const
type Mode = typeof MODES[number]['key']

type Model = 'mayura:v1' | 'sarvam-translate:v1'

const MAX_BY_MODEL: Record<Model, number> = {
  'mayura:v1': 1000,
  'sarvam-translate:v1': 2000,
}

export interface TranslatorProps {
  className?: string
  defaultSource?: string
  defaultTarget?: string
  onResult?: (r: SarvamTranslateResult) => void
}

export default function Translator({
  className = '',
  defaultSource = 'auto',
  defaultTarget = 'hi-IN',
  onResult,
}: TranslatorProps) {
  const [model, setModel] = useState<Model>('mayura:v1')
  const [source, setSource] = useState(defaultSource)
  const [target, setTarget] = useState(defaultTarget)
  const [mode, setMode] = useState<Mode>('formal')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detectedSource, setDetectedSource] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const debounceRef = useRef<number | null>(null)

  // Pick the language list per model. mayura:v1 supports the 11
  // core + the 'auto' source sentinel. sarvam-translate:v1 supports
  // all 22 + English, no auto-detect.
  const sourceOptions = useMemo(() => {
    if (model === 'mayura:v1') {
      return [{ code: 'auto', label: 'Auto-detect' }, ...CORE_LANGS]
    }
    return [...CORE_LANGS, ...EXTENDED_LANGS]
  }, [model])

  const targetOptions = useMemo(() => {
    return model === 'mayura:v1'
      ? CORE_LANGS
      : [...CORE_LANGS, ...EXTENDED_LANGS]
  }, [model])

  // Keep the picked source/target valid for the current model. If
  // someone switches mayura→sarvam-translate while 'auto' is picked,
  // demote to 'en-IN'. Similarly when switching back, snap an
  // extended-only target to en-IN.
  useEffect(() => {
    if (model === 'mayura:v1') {
      if (!sourceOptions.some((l) => l.code === source)) setSource('auto')
      if (!targetOptions.some((l) => l.code === target)) setTarget('hi-IN')
    } else {
      if (source === 'auto') setSource('en-IN')
      if (!targetOptions.some((l) => l.code === target)) setTarget('hi-IN')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model])

  // Auto-translate: debounce on the input/lang/mode/model.
  useEffect(() => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    if (!input.trim()) {
      setOutput('')
      setError(null)
      setDetectedSource(null)
      return
    }
    if (input.length > MAX_BY_MODEL[model]) {
      setError(`Input exceeds ${MAX_BY_MODEL[model]} chars for ${model}.`)
      return
    }
    debounceRef.current = window.setTimeout(() => { void runTranslate() }, 600)
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, source, target, mode, model])

  const runTranslate = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      // sarvam-translate:v1 only allows 'formal'. Coerce silently.
      const sendMode: Mode = model === 'sarvam-translate:v1' ? 'formal' : mode
      const result = await sarvamTranslate({
        input: input.slice(0, MAX_BY_MODEL[model]),
        source_language_code: source,
        target_language_code: target,
        model,
        mode: sendMode,
        numerals_format: 'international',
      })
      setOutput(result.translated_text)
      setDetectedSource(result.source_language_code || null)
      setRequestId(result.request_id || null)
      onResult?.(result)
    } catch (e: unknown) {
      setError(formatSarvamError(e))
    } finally {
      setBusy(false)
    }
  }, [input, source, target, mode, model, onResult])

  const handleSwap = useCallback(() => {
    // 'auto' isn't a real language — if the source is auto, prefer
    // the detected one (if known) when swapping; otherwise default
    // to en-IN.
    const effectiveSource = source === 'auto'
      ? (detectedSource && CORE_LANGS.some((l) => l.code === detectedSource)
          ? detectedSource
          : 'en-IN')
      : source
    setSource(target)
    setTarget(effectiveSource)
    setInput(output)
    setOutput(input)
    setDetectedSource(null)
  }, [source, target, input, output, detectedSource])

  const langLabel = (code: string): string => {
    if (code === 'auto') return 'Auto-detect'
    return [...sourceOptions, ...targetOptions].find((l) => l.code === code)?.label || code
  }

  const isOverLimit = input.length > MAX_BY_MODEL[model]

  return (
    <section className={`rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 ${className}`}>
      <header className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-white">Sarvam Translator</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {model === 'mayura:v1'
              ? 'mayura:v1 · 11 langs · auto-detect · 4 modes · ≤1000 chars'
              : 'sarvam-translate:v1 · 22 Indian langs + English · formal · ≤2000 chars'}
          </p>
        </div>
        {/* Model toggle */}
        <div className="inline-flex items-center rounded-lg overflow-hidden border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setModel('mayura:v1')}
            className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
              model === 'mayura:v1'
                ? 'bg-brand-red/20 text-white'
                : 'bg-white/[0.02] text-gray-400 hover:text-white'
            }`}
          >
            mayura:v1
          </button>
          <button
            type="button"
            onClick={() => setModel('sarvam-translate:v1')}
            className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
              model === 'sarvam-translate:v1'
                ? 'bg-brand-red/20 text-white'
                : 'bg-white/[0.02] text-gray-400 hover:text-white'
            }`}
          >
            sarvam-translate:v1
          </button>
        </div>
      </header>

      {/* Language row with swap */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-end mb-3">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">From</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
          >
            {sourceOptions.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleSwap}
          title="Swap source and target"
          className="self-end mb-1 px-2 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          ⇄
        </button>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">To</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
          >
            {targetOptions.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode picker (mayura:v1 only) */}
      {model === 'mayura:v1' && (
        <div className="mb-3">
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">Mode</label>
          <div className="flex flex-wrap gap-1.5">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  mode === m.key
                    ? 'bg-amber-500/20 border border-amber-500/40 text-white'
                    : 'bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dual panes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Source pane */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.08] p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
              {langLabel(source)}
            </span>
            <span className={`text-[10px] font-mono ${isOverLimit ? 'text-red-400' : 'text-gray-500'}`}>
              {input.length} / {MAX_BY_MODEL[model]}
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder="Type or paste the text you want translated…"
            className="w-full bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none resize-vertical"
            maxLength={MAX_BY_MODEL[model] + 100}
          />
        </div>

        {/* Target pane */}
        <div className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 p-3 relative min-h-[140px]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                {langLabel(target)}
              </span>
              {detectedSource && source === 'auto' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-300 font-mono">
                  src: {detectedSource}
                </span>
              )}
            </div>
            {busy && <span className="text-[10px] text-amber-300">Translating…</span>}
          </div>
          <p className="text-sm text-white whitespace-pre-wrap leading-relaxed min-h-[80px]">
            {output || <span className="text-gray-600 italic">Translation appears here.</span>}
          </p>
          {output && (
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => { try { void navigator.clipboard.writeText(output) } catch { /* noop */ } }}
                className="px-2 py-1 rounded text-[10px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                ⎘ Copy
              </button>
              {requestId && (
                <span className="text-[9px] text-gray-600 font-mono truncate" title={requestId}>
                  req {requestId.slice(0, 10)}…
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300">
          {error}
        </div>
      )}
    </section>
  )
}
