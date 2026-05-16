'use client'

/* ─────────────────────────────────────────────────────────────
   Sarvam LID Checker — detect language + script of arbitrary text

   Single textarea → POST /sarvam-lid → shows the resolved
   { language_code, script_code } as chips.

   Cheap pre-flight before translate / transliterate when the
   admin pastes content of unknown origin (investor decks scraped
   from email, multilingual chat logs, etc.).

   Integration: optional `onAccept(code)` callback fires when the
   user clicks "Use as source" — wired by the demo page so the
   <Translator /> tab picks up the detected source language
   without a manual click.

   1000-char cap enforced inline.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import { sarvamLID, formatSarvamError, type SarvamLIDResult } from '@/lib/sarvam/browserClient'

const MAX_CHARS = 1000

// Friendly labels for the ISO-15924 script codes Sarvam returns.
const SCRIPT_LABELS: Record<string, string> = {
  Latn: 'Latin',
  Deva: 'Devanagari',
  Beng: 'Bengali',
  Gujr: 'Gujarati',
  Knda: 'Kannada',
  Mlym: 'Malayalam',
  Orya: 'Odia',
  Guru: 'Gurmukhi',
  Taml: 'Tamil',
  Telu: 'Telugu',
}

const LANG_LABELS: Record<string, string> = {
  'en-IN': 'English',
  'hi-IN': 'Hindi',
  'bn-IN': 'Bengali',
  'ta-IN': 'Tamil',
  'te-IN': 'Telugu',
  'kn-IN': 'Kannada',
  'ml-IN': 'Malayalam',
  'mr-IN': 'Marathi',
  'gu-IN': 'Gujarati',
  'pa-IN': 'Punjabi',
  'od-IN': 'Odia',
}

export interface LIDCheckerProps {
  className?: string
  /** When set, a "Use as source" button appears on a successful
   *  detection and fires this callback with the BCP-47 code. */
  onAccept?: (langCode: string) => void
}

export default function LIDChecker({ className = '', onAccept }: LIDCheckerProps) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<SarvamLIDResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<number | null>(null)

  // Debounced auto-detect — fires 800 ms after typing stops so we
  // don't burn an LID call on every keystroke.
  useEffect(() => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    if (!input.trim()) { setResult(null); setError(null); return }
    if (input.length > MAX_CHARS) { setError(`Input exceeds ${MAX_CHARS} chars.`); return }
    debounceRef.current = window.setTimeout(() => { void run() }, 800)
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input])

  const run = useCallback(async () => {
    setBusy(true); setError(null)
    try {
      const r = await sarvamLID(input.slice(0, MAX_CHARS))
      setResult(r)
    } catch (e: unknown) {
      setError(formatSarvamError(e))
    } finally { setBusy(false) }
  }, [input])

  const isOver = input.length > MAX_CHARS
  const langLabel = result?.language_code
    ? (LANG_LABELS[result.language_code] || result.language_code)
    : null
  const scriptLabel = result?.script_code
    ? (SCRIPT_LABELS[result.script_code] || result.script_code)
    : null

  return (
    <section className={`rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 ${className}`}>
      <header className="mb-4">
        <h2 className="text-base font-bold text-white">Sarvam LID</h2>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Detect language + script · auto-runs ~800 ms after you stop typing · ≤1000 chars
        </p>
      </header>

      <div className="rounded-xl bg-white/[0.02] border border-white/[0.08] p-3 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Text</span>
          <span className={`text-[10px] font-mono ${isOver ? 'text-red-400' : 'text-gray-500'}`}>
            {input.length} / {MAX_CHARS}
          </span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          placeholder="Paste any text — Hindi, English, Tamil, Hinglish, anything…"
          className="w-full bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none resize-vertical"
          maxLength={MAX_CHARS + 100}
        />
      </div>

      <div className="rounded-xl bg-blue-500/[0.05] border border-blue-500/20 p-3 min-h-[80px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">Detected</span>
          {busy && <span className="text-[10px] text-amber-300">Working…</span>}
        </div>
        {result ? (
          <div className="flex items-center gap-2 flex-wrap">
            {result.language_code ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/[0.08]">
                <span className="text-[9px] uppercase tracking-wider text-gray-500">Lang</span>
                <span className="text-xs text-white font-medium">{langLabel}</span>
                <span className="text-[10px] font-mono text-gray-500">{result.language_code}</span>
              </span>
            ) : (
              <span className="text-xs text-gray-500 italic">No language detected</span>
            )}
            {result.script_code && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/[0.08]">
                <span className="text-[9px] uppercase tracking-wider text-gray-500">Script</span>
                <span className="text-xs text-white font-medium">{scriptLabel}</span>
                <span className="text-[10px] font-mono text-gray-500">{result.script_code}</span>
              </span>
            )}
            {onAccept && result.language_code && (
              <button
                type="button"
                onClick={() => result.language_code && onAccept(result.language_code)}
                className="ml-auto px-2.5 py-1 rounded-md text-[10px] font-medium text-blue-300 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
              >
                Use as source →
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-600 italic">Detection appears here.</p>
        )}
      </div>

      {error && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300">
          {error}
        </div>
      )}
    </section>
  )
}
