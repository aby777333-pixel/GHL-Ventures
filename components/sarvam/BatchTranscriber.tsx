'use client'

/* ─────────────────────────────────────────────────────────────
   Sarvam Batch Transcriber — long-audio + diarization + timestamps

   Lifecycle (state machine: idle → uploading → processing → complete)
   ──────────────────────────────────────────────────────────────────
   1.  User drops 1..20 audio files (per file ≤1 hr per Sarvam's cap).
   2.  Picks language, mode, diarization on/off, num_speakers,
       timestamps on/off, translate-to-English on/off.
   3.  Submit:
         a. sarvamBatchCreate  → job_id + signed upload URLs.
         b. sarvamBatchUploadAll → PUT each file directly to Sarvam
            CDN with per-file progress bars.
         c. sarvamBatchStart   → flips state to RUNNING.
         d. sarvamBatchPollStatus + Realtime subscription on
            sarvam_batch_jobs row (whichever updates first wins —
            both update the same state).
         e. sarvamBatchFetchResults on terminal COMPLETED/PARTIAL.
   4.  Result view: per-file collapsible card with
         - diarized chat-style transcript (speaker bubble colors),
         - plain-text transcript fallback when no diarization,
         - SRT download (built client-side from word timestamps),
         - plain transcript copy + JSON download.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  sarvamBatchCreate,
  sarvamBatchUploadAll,
  sarvamBatchStart,
  sarvamBatchPollStatus,
  sarvamBatchFetchResults,
  sarvamResultToSRT,
  formatSarvamError,
  type SarvamBatchCreateResult,
  type SarvamBatchStatusResult,
  type SarvamBatchFileResult,
  type SarvamDiarizedEntry,
} from '@/lib/sarvam/browserClient'

// ── Picker data ─────────────────────────────────────────────
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
const MODES = [
  { key: 'transcribe',  label: 'Transcribe' },
  { key: 'translate',   label: 'Translate (→ English)' },
  { key: 'verbatim',    label: 'Verbatim' },
  { key: 'translit',    label: 'Transliterate' },
  { key: 'codemix',     label: 'Code-mix' },
] as const

const SPEAKER_PALETTE = [
  '#D0021B', // crimson — Speaker 0
  '#C8A951', // gold    — Speaker 1
  '#3B82F6', // blue
  '#10B981', // emerald
  '#A855F7', // purple
  '#F97316', // orange
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#22C55E', // green
  '#EAB308', // yellow
]
const speakerColor = (id: string) => {
  const n = Number(id)
  if (Number.isFinite(n) && n >= 0) return SPEAKER_PALETTE[n % SPEAKER_PALETTE.length]
  return '#9CA3AF'
}

const formatBytes = (b: number): string => {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}
const formatTimecode = (s: number): string => {
  const hh = Math.floor(s / 3600)
  const mm = Math.floor((s % 3600) / 60)
  const ss = Math.floor(s % 60)
  return hh > 0
    ? `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    : `${mm}:${String(ss).padStart(2, '0')}`
}

const downloadString = (filename: string, content: string, mime = 'text/plain') => {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ── Types ───────────────────────────────────────────────────
type Phase = 'idle' | 'uploading' | 'processing' | 'complete' | 'error'

interface PerFileProgress {
  name: string
  size: number
  uploaded: number       // bytes
  state: 'queued' | 'uploading' | 'done' | 'failed'
  error?: string
}

export interface BatchTranscriberProps {
  className?: string
  onComplete?: (results: SarvamBatchFileResult[]) => void
}

export default function BatchTranscriber({ className = '', onComplete }: BatchTranscriberProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [files, setFiles] = useState<File[]>([])
  const [lang, setLang] = useState('unknown')
  const [mode, setMode] = useState<typeof MODES[number]['key']>('transcribe')
  const [withDiarization, setWithDiarization] = useState(true)
  const [numSpeakers, setNumSpeakers] = useState<number | ''>('')   // '' = auto
  const [withTimestamps, setWithTimestamps] = useState(true)
  const [translateToEnglish, setTranslateToEnglish] = useState(false)
  const [progress, setProgress] = useState<PerFileProgress[]>([])
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<SarvamBatchStatusResult | null>(null)
  const [results, setResults] = useState<SarvamBatchFileResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const dropRef = useRef<HTMLLabelElement | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const isWorking = phase === 'uploading' || phase === 'processing'

  // ── File selection ─────────────────────────────────────
  const acceptFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list)
      .filter((f) => /^audio\//.test(f.type) || /\.(wav|mp3|m4a|aac|flac|ogg|opus|webm|aiff?|amr|wma|mp4)$/i.test(f.name))
      .slice(0, 20 - files.length)
    if (!arr.length) return
    setFiles((cur) => [...cur, ...arr].slice(0, 20))
  }, [files.length])

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.files) acceptFiles(e.target.files)
    e.target.value = ''
  }
  const onDrop: React.DragEventHandler = (e) => {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer?.files) acceptFiles(e.dataTransfer.files)
  }
  const removeFile = (i: number) => setFiles((cur) => cur.filter((_, j) => j !== i))

  // ── Realtime subscription (Postgres changes) ───────────
  // When we have a job_id and the row exists in sarvam_batch_jobs,
  // listen for updates and mirror them into local status. The poll
  // still runs as fallback — whichever updates first wins.
  useEffect(() => {
    if (!jobId) return
    const channel = supabase
      .channel(`sarvam-batch-${jobId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'UPDATE', schema: 'public', table: 'sarvam_batch_jobs', filter: `job_id=eq.${jobId}` },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new
          setStatus((prev) => ({
            job_id: jobId,
            state: String(row.state || prev?.state || 'PENDING'),
            progress: typeof row.progress === 'number' ? row.progress : prev?.progress,
            error_message: (row.error_message as string | null) ?? prev?.error_message ?? null,
          }))
        },
      )
      .subscribe()
    return () => {
      try { void supabase.removeChannel(channel) } catch { /* noop */ }
    }
  }, [jobId])

  // ── Submit ──────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (files.length === 0) {
      setError('Pick at least one audio file.')
      return
    }
    setError(null)
    setResults(null)
    setStatus(null)
    setPhase('uploading')

    // Init progress.
    const initial: PerFileProgress[] = files.map((f) => ({
      name: f.name,
      size: f.size,
      uploaded: 0,
      state: 'queued',
    }))
    setProgress(initial)

    try {
      // 1. Create job.
      const created: SarvamBatchCreateResult = await sarvamBatchCreate({
        model: 'saaras:v3',
        mode,
        language_code: lang === 'unknown' ? 'unknown' : lang,
        with_diarization: withDiarization,
        num_speakers: numSpeakers === '' ? undefined : Number(numSpeakers),
        with_timestamps: withTimestamps,
        file_count: files.length,
        translate_to_english: translateToEnglish,
      })
      setJobId(created.job_id)

      // 2. Upload files (parallel). Match URLs to files by file_index.
      const sortedUrls = [...created.upload_urls].sort((a, b) => a.file_index - b.file_index)
      setProgress((cur) =>
        cur.map((p, i) => ({ ...p, state: sortedUrls[i] ? 'uploading' : 'queued' })),
      )
      await sarvamBatchUploadAll(sortedUrls, files, (fileIndex, loaded, total) => {
        setProgress((cur) =>
          cur.map((p, i) =>
            i === fileIndex
              ? { ...p, uploaded: loaded, size: total || p.size }
              : p,
          ),
        )
      })
      setProgress((cur) => cur.map((p) => ({ ...p, state: 'done' as const, uploaded: p.size })))

      // 3. Start.
      await sarvamBatchStart(created.job_id)
      setPhase('processing')
      setStatus({ job_id: created.job_id, state: 'RUNNING', progress: 0 })

      // 4. Poll until terminal (Realtime sub will also update).
      const final = await sarvamBatchPollStatus(created.job_id, {
        onTick: (s) => setStatus(s),
      })

      // 5. Fetch outputs on COMPLETED / PARTIAL. FAILED → bail.
      if (final.state === 'FAILED') {
        setError(final.error_message || 'Batch job failed.')
        setPhase('error')
        return
      }
      const fetched = await sarvamBatchFetchResults(
        created.job_id,
        files.map((f) => f.name),
      )
      setResults(fetched)
      setPhase('complete')
      onComplete?.(fetched)
    } catch (e: unknown) {
      setError(formatSarvamError(e))
      setPhase('error')
    }
  }, [files, lang, mode, withDiarization, numSpeakers, withTimestamps, translateToEnglish, onComplete])

  const handleReset = useCallback(() => {
    setFiles([])
    setProgress([])
    setStatus(null)
    setResults(null)
    setJobId(null)
    setError(null)
    setPhase('idle')
  }, [])

  // ── Stats for header ──────────────────────────────────
  const totalBytes = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files])

  return (
    <section className={`rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 ${className}`}>
      <header className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-white">Sarvam Batch Transcriber</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            saaras:v3 · up to 20 files per job · 1 hr per file · diarization + word-level timestamps
          </p>
        </div>
        <span className={`text-[10px] uppercase tracking-wider font-bold ${
          phase === 'idle' ? 'text-gray-600'
          : phase === 'uploading' ? 'text-amber-400'
          : phase === 'processing' ? 'text-blue-400'
          : phase === 'complete' ? 'text-emerald-400'
          : 'text-red-400'
        }`}>
          {phase}
        </span>
      </header>

      {/* Settings */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Language</label>
          <select
            value={lang} onChange={(e) => setLang(e.target.value)} disabled={isWorking}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red/40 disabled:opacity-50"
          >
            {CORE_LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Mode</label>
          <select
            value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} disabled={isWorking}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red/40 disabled:opacity-50"
          >
            {MODES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Speakers</label>
          <select
            value={numSpeakers} onChange={(e) => setNumSpeakers(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={isWorking || !withDiarization}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red/40 disabled:opacity-50"
          >
            <option value="">Auto</option>
            {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 text-[11px] text-gray-300 pt-4">
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox" checked={withDiarization}
              onChange={(e) => setWithDiarization(e.target.checked)}
              disabled={isWorking}
              className="accent-brand-red"
            />
            Diarize
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox" checked={withTimestamps}
              onChange={(e) => setWithTimestamps(e.target.checked)}
              disabled={isWorking}
              className="accent-brand-red"
            />
            Timestamps
          </label>
        </div>
      </div>

      {/* Drop zone */}
      <label
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-1.5 py-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-brand-red/60 bg-brand-red/5'
            : 'border-white/[0.12] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
        } ${isWorking ? 'pointer-events-none opacity-50' : ''}`}
      >
        <div className="text-2xl text-gray-400">⤓</div>
        <p className="text-sm text-white">Drop audio files here or click to browse</p>
        <p className="text-[11px] text-gray-500">
          WAV · MP3 · M4A · OGG · FLAC · WebM · {Math.max(0, 20 - files.length)} slot{20 - files.length === 1 ? '' : 's'} left · {formatBytes(totalBytes)} queued
        </p>
        <input
          type="file" multiple accept="audio/*"
          onChange={onPick} disabled={isWorking}
          className="hidden"
        />
      </label>

      {/* Queue */}
      {files.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {files.map((f, i) => {
            const p = progress[i]
            const pct = p && p.size > 0 ? Math.min(100, Math.floor((p.uploaded / p.size) * 100)) : 0
            return (
              <div key={`${f.name}-${i}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className="text-xs flex-1 min-w-0 truncate text-white">{f.name}</span>
                <span className="text-[11px] text-gray-500 shrink-0 font-mono">{formatBytes(f.size)}</span>
                {p && p.state !== 'queued' && (
                  <div className="w-28 h-1.5 rounded-full bg-white/[0.06] overflow-hidden shrink-0">
                    <div
                      className={`h-full ${p.state === 'failed' ? 'bg-red-500' : p.state === 'done' ? 'bg-emerald-500' : 'bg-amber-400'}`}
                      style={{ width: `${p.state === 'done' ? 100 : pct}%` }}
                    />
                  </div>
                )}
                {phase === 'idle' && (
                  <button onClick={() => removeFile(i)} className="p-1 text-gray-500 hover:text-red-300" title="Remove">×</button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isWorking || files.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}
        >
          {phase === 'uploading' ? 'Uploading…' : phase === 'processing' ? 'Processing…' : '▶ Transcribe'}
        </button>
        {(phase === 'complete' || phase === 'error') && (
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl text-[11px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            ↻ New job
          </button>
        )}
        {status && (
          <span className="ml-auto text-[10px] font-mono text-gray-500">
            job {String(jobId || '').slice(0, 10)}… · {status.state}{typeof status.progress === 'number' ? ` · ${status.progress}%` : ''}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300">
          {error}
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="mt-5 space-y-4">
          {results.map((r) => (
            <ResultCard key={r.file_index} result={r} originalName={r.original_filename} />
          ))}
        </div>
      )}
    </section>
  )
}

// ── Per-file result card ────────────────────────────────────
function ResultCard({
  result,
  originalName,
}: {
  result: SarvamBatchFileResult
  originalName?: string
}) {
  const [open, setOpen] = useState(true)
  const entries = result.diarized_transcript?.entries || []
  const hasDiarization = entries.length > 0
  const srt = useMemo(() => sarvamResultToSRT(result), [result])
  const fileLabel = originalName || `file ${result.file_index}`

  return (
    <div className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 p-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white truncate">{fileLabel}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {hasDiarization
              ? `${entries.length} utterance${entries.length === 1 ? '' : 's'} · ${new Set(entries.map((e) => e.speaker_id)).size} speakers`
              : `${result.transcript.length} chars · plain`}
            {result.language_code && <span className="ml-2 text-gray-600">· {result.language_code}</span>}
          </p>
        </div>
        <span className="text-xs text-gray-500">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="p-3 pt-0 space-y-3">
          {hasDiarization ? (
            <div className="space-y-1.5">
              {entries.map((e, i) => <DiarizedBubble key={i} entry={e} />)}
            </div>
          ) : (
            <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
              {result.transcript || <span className="text-gray-500 italic">— empty —</span>}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/[0.04]">
            <button
              type="button"
              onClick={() => { try { void navigator.clipboard.writeText(result.transcript) } catch { /* noop */ } }}
              className="px-2.5 py-1 rounded text-[10px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              ⎘ Copy transcript
            </button>
            <button
              type="button"
              onClick={() => downloadString(`${fileLabel}.json`, JSON.stringify(result, null, 2), 'application/json')}
              className="px-2.5 py-1 rounded text-[10px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              ⤓ JSON
            </button>
            {srt && (
              <button
                type="button"
                onClick={() => downloadString(`${fileLabel}.srt`, srt, 'application/x-subrip')}
                className="px-2.5 py-1 rounded text-[10px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                ⤓ SRT
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DiarizedBubble({ entry }: { entry: SarvamDiarizedEntry }) {
  const color = speakerColor(entry.speaker_id)
  return (
    <div className="flex items-start gap-2">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
        style={{ background: color }}
        title={`Speaker ${entry.speaker_id}`}
      >
        S{entry.speaker_id}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-gray-500 font-mono mb-0.5">
          {formatTimecode(entry.start_time_seconds)} – {formatTimecode(entry.end_time_seconds)}
        </div>
        <p
          className="text-sm text-white whitespace-pre-wrap leading-relaxed inline-block px-3 py-2 rounded-lg"
          style={{
            background: `${color}1a`,         // 10 % alpha
            borderLeft: `2px solid ${color}`,
          }}
        >
          {entry.transcript}
        </p>
      </div>
    </div>
  )
}
