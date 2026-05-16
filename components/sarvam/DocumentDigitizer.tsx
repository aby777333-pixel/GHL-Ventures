'use client'

/* ─────────────────────────────────────────────────────────────
   Sarvam Document Digitizer — PDF / image → Markdown / HTML

   Lifecycle (mirrors batch STT)
   ──────────────────────────────
     1. User drops one PDF / image / ZIP. We sniff the PDF page
        count from the file header (cheap regex, no pdf-lib in
        the bundle) and warn at 11+ pages — Sarvam caps PDFs at
        10 per job.
     2. Picks language (any of 23 BCP-47 codes) + output format
        (md / html).
     3. Submit:
        a. sarvamDocCreate → { job_id, upload_url }.
        b. sarvamDocUpload  → XHR PUT direct to Sarvam CDN with
           per-byte progress bar (no proxy).
        c. sarvamDocStart   → state flips to Running.
        d. sarvamDocPollStatus + Supabase Realtime on
           sarvam_document_jobs (whichever updates first wins).
        e. sarvamDocOutput → signed ZIP URL on terminal success.
     4. Result panel:
        • Page metrics dashboard (succeeded / processed / failed).
        • Download ZIP button (browser → Sarvam CDN, no proxy).
        • Error message when PartiallyCompleted / Failed.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  sarvamDocCreate,
  sarvamDocUpload,
  sarvamDocStart,
  sarvamDocPollStatus,
  sarvamDocFetchOutput,
  formatSarvamError,
  type SarvamDocJobStatus,
} from '@/lib/sarvam/browserClient'

// All 23 langs (11 core + 12 extended) — document digitization
// supports the same surface as sarvam-translate:v1.
const LANGS: Array<{ code: string; label: string }> = [
  { code: 'en-IN',  label: 'English' },
  { code: 'hi-IN',  label: 'हिन्दी (Hindi)' },
  { code: 'bn-IN',  label: 'বাংলা (Bengali)' },
  { code: 'ta-IN',  label: 'தமிழ் (Tamil)' },
  { code: 'te-IN',  label: 'తెలుగు (Telugu)' },
  { code: 'kn-IN',  label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml-IN',  label: 'മലയാളം (Malayalam)' },
  { code: 'mr-IN',  label: 'मराठी (Marathi)' },
  { code: 'gu-IN',  label: 'ગુજરાતી (Gujarati)' },
  { code: 'pa-IN',  label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'od-IN',  label: 'ଓଡ଼ିଆ (Odia)' },
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

const formatBytes = (b: number): string => {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

/** Cheap PDF page-count sniff. Reads the first ~1 MB of the file
 *  and counts `/Type /Page` (NOT /Pages) entries. Accurate enough
 *  for the 10-page-cap warning; not a substitute for pdf-lib. */
async function sniffPdfPages(file: Blob): Promise<number | null> {
  try {
    const slice = file.slice(0, Math.min(file.size, 1024 * 1024))
    const text = await slice.text()
    if (!text.startsWith('%PDF')) return null
    const matches = text.match(/\/Type\s*\/Page[^s]/g)
    return matches ? matches.length : null
  } catch { return null }
}

type Phase = 'idle' | 'uploading' | 'processing' | 'complete' | 'error'

export interface DocumentDigitizerProps {
  className?: string
  onComplete?: (info: { jobId: string; downloadUrl: string; metrics: SarvamDocJobStatus }) => void
}

export default function DocumentDigitizer({ className = '', onComplete }: DocumentDigitizerProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [pageHint, setPageHint] = useState<number | null>(null)
  const [language, setLanguage] = useState('en-IN')
  const [outputFormat, setOutputFormat] = useState<'md' | 'html'>('md')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<SarvamDocJobStatus | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isWorking = phase === 'uploading' || phase === 'processing'

  // Realtime sub on the job row.
  useEffect(() => {
    if (!jobId) return
    const channel = supabase
      .channel(`sarvam-doc-${jobId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'UPDATE', schema: 'public', table: 'sarvam_document_jobs', filter: `job_id=eq.${jobId}` },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new
          setStatus((prev) => ({
            job_id: jobId,
            job_state: String(row.state || prev?.job_state || 'Pending'),
            total_pages: typeof row.total_pages === 'number' ? row.total_pages : prev?.total_pages,
            pages_processed: typeof row.pages_processed === 'number' ? row.pages_processed : prev?.pages_processed,
            pages_succeeded: typeof row.pages_succeeded === 'number' ? row.pages_succeeded : prev?.pages_succeeded,
            pages_failed: typeof row.pages_failed === 'number' ? row.pages_failed : prev?.pages_failed,
            error_message: (row.error_message as string | null) ?? prev?.error_message ?? null,
          }))
        },
      )
      .subscribe()
    return () => { try { void supabase.removeChannel(channel) } catch { /* noop */ } }
  }, [jobId])

  const acceptFile = useCallback(async (f: File) => {
    setError(null); setStatus(null); setDownloadUrl(null); setUploadProgress(0)
    setFile(f)
    setPhase('idle')
    // Sniff PDF page count.
    if (/\.pdf$/i.test(f.name) || f.type === 'application/pdf') {
      const n = await sniffPdfPages(f)
      setPageHint(n)
    } else {
      setPageHint(null)
    }
  }, [])

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (f) void acceptFile(f)
  }
  const onDrop: React.DragEventHandler = (e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) void acceptFile(f)
  }

  const handleSubmit = useCallback(async () => {
    if (!file) { setError('Drop a PDF, image, or ZIP first.'); return }
    setError(null); setStatus(null); setDownloadUrl(null); setUploadProgress(0); setPhase('uploading')

    try {
      // 1. Create job.
      const created = await sarvamDocCreate({
        language,
        output_format: outputFormat,
        file_name: file.name,
        file_size: file.size,
      })
      setJobId(created.job_id)
      if (!created.upload_url) throw new Error('Sarvam did not return an upload URL.')

      // 2. Upload (direct to CDN).
      await sarvamDocUpload(created.upload_url, file, (loaded, total) => {
        if (total > 0) setUploadProgress(Math.floor((loaded / total) * 100))
      })
      setUploadProgress(100)

      // 3. Start.
      await sarvamDocStart(created.job_id)
      setPhase('processing')
      setStatus({ job_id: created.job_id, job_state: 'Running' })

      // 4. Poll until terminal (Realtime also updates `status`).
      const final = await sarvamDocPollStatus(created.job_id, {
        onTick: (s) => setStatus(s),
      })

      if (String(final.job_state).toLowerCase() === 'failed' && (final.pages_succeeded || 0) === 0) {
        setError(final.error_message || 'Document job failed.')
        setPhase('error')
        return
      }

      // 5. Fetch output URL (cached if available).
      const out = await sarvamDocFetchOutput(created.job_id)
      setDownloadUrl(out.url)
      setPhase('complete')
      onComplete?.({ jobId: created.job_id, downloadUrl: out.url, metrics: final })
    } catch (e: unknown) {
      setError(formatSarvamError(e))
      setPhase('error')
    }
  }, [file, language, outputFormat, onComplete])

  const handleReset = useCallback(() => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    setFile(null); setPageHint(null); setUploadProgress(0)
    setJobId(null); setStatus(null); setDownloadUrl(null); setError(null); setPhase('idle')
  }, [downloadUrl])

  const metrics = useMemo(() => ({
    total: status?.total_pages ?? null,
    processed: status?.pages_processed ?? null,
    succeeded: status?.pages_succeeded ?? null,
    failed: status?.pages_failed ?? null,
  }), [status])

  const tooManyPages = pageHint !== null && pageHint > 10

  return (
    <section className={`rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 ${className}`}>
      <header className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-white">Sarvam Document Digitizer</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Sarvam Vision · PDFs ≤10 pages · 23 langs · output as Markdown or HTML
          </p>
        </div>
        <span className={`text-[10px] uppercase tracking-wider font-bold ${
          phase === 'idle' ? 'text-gray-600'
          : phase === 'uploading' ? 'text-amber-400'
          : phase === 'processing' ? 'text-blue-400'
          : phase === 'complete' ? 'text-emerald-400'
          : 'text-red-400'
        }`}>{phase}</span>
      </header>

      {/* Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Language</label>
          <select
            value={language} onChange={(e) => setLanguage(e.target.value)} disabled={isWorking}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 disabled:opacity-50"
          >
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Output format</label>
          <div className="inline-flex items-center rounded-xl overflow-hidden border border-white/[0.08]">
            <button
              type="button" onClick={() => setOutputFormat('md')} disabled={isWorking}
              className={`px-3 py-2 text-sm font-medium transition-colors ${outputFormat === 'md' ? 'bg-brand-red/20 text-white' : 'bg-white/[0.02] text-gray-400 hover:text-white'}`}
            >Markdown</button>
            <button
              type="button" onClick={() => setOutputFormat('html')} disabled={isWorking}
              className={`px-3 py-2 text-sm font-medium transition-colors ${outputFormat === 'html' ? 'bg-brand-red/20 text-white' : 'bg-white/[0.02] text-gray-400 hover:text-white'}`}
            >HTML</button>
          </div>
          <p className="text-[10px] text-gray-600 mt-1">HTML preserves tables; Markdown is cleaner for prose.</p>
        </div>
      </div>

      {/* Dropzone */}
      <label
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
        <p className="text-sm text-white">Drop a PDF, image, or ZIP — or click to browse</p>
        <p className="text-[11px] text-gray-500">PDF ≤10 pages · PNG · JPG · JPEG · ZIP of images</p>
        <input
          ref={fileInputRef}
          type="file" accept=".pdf,.png,.jpg,.jpeg,.zip,application/pdf,image/png,image/jpeg,application/zip"
          onChange={onPick} disabled={isWorking}
          className="hidden"
        />
      </label>

      {/* File summary + page warning */}
      {file && (
        <div className="mt-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-gray-300 flex items-center gap-3 flex-wrap">
          <span className="font-medium truncate flex-1 min-w-0">{file.name}</span>
          <span className="font-mono text-gray-500">{formatBytes(file.size)}</span>
          {pageHint !== null && (
            <span className={`font-mono ${tooManyPages ? 'text-red-300' : 'text-gray-500'}`}>
              ~{pageHint} pages
            </span>
          )}
          {phase === 'idle' && (
            <button onClick={handleReset} className="text-gray-500 hover:text-red-300" title="Remove">×</button>
          )}
        </div>
      )}
      {tooManyPages && (
        <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
          PDF appears to have ~{pageHint} pages. Sarvam caps documents at <strong>10 pages per job</strong>. Split the PDF and submit one job per chunk, or expect a 422 error.
        </div>
      )}

      {/* Upload progress */}
      {phase === 'uploading' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
            <span>Uploading…</span>
            <span className="font-mono">{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full bg-amber-400 transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Page metrics dashboard (during + after processing) */}
      {status && (phase === 'processing' || phase === 'complete' || phase === 'error') && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Metric label="Total"      value={metrics.total}     color="text-gray-300" />
          <Metric label="Processed"  value={metrics.processed} color="text-blue-300" />
          <Metric label="Succeeded"  value={metrics.succeeded} color="text-emerald-300" />
          <Metric label="Failed"     value={metrics.failed}    color={(metrics.failed || 0) > 0 ? 'text-red-300' : 'text-gray-500'} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isWorking || !file}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}
        >
          {phase === 'uploading' ? 'Uploading…'
            : phase === 'processing' ? 'Processing…'
            : '▶ Digitize'}
        </button>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={`${(file?.name || 'document').replace(/\.[^.]+$/, '')}-${outputFormat}.zip`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
          >
            ⤓ Download ZIP
          </a>
        )}
        {(phase === 'complete' || phase === 'error') && (
          <button
            type="button" onClick={handleReset}
            className="px-3 py-2 rounded-xl text-[11px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:text-white hover:bg-white/[0.08] transition-colors"
          >↻ New job</button>
        )}
        {jobId && (
          <span className="ml-auto text-[10px] font-mono text-gray-500">
            job {jobId.slice(0, 10)}… · {status?.job_state || phase}
          </span>
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

function Metric({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-2.5">
      <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">{label}</p>
      <p className={`text-base font-bold mt-1 ${color}`}>{value ?? '—'}</p>
    </div>
  )
}
