'use client'

/* ─────────────────────────────────────────────────────────────
   /admin/sarvam-demo — Sarvam end-to-end verification (Phase 3a)

   Tabbed access to every Sarvam capability shipped through Phase 3a:
     Phase 1+2 (unchanged):
       • TTS         (bulbul:v3, 11 langs, 39 voices)
       • STT         (saaras:v3 REST, ≤30 s)
       • Translate   (mayura:v1 + sarvam-translate:v1)
       • Batch       (long audio + diarization + timestamps)
     Phase 3a (new):
       • Stream      (TTS HTTP Streaming, ≤3500 chars)
       • Transliterate (script + spoken-form)
       • LID         (language + script detection)
       • Dictionaries (pronunciation CRUD — admin gated)
       • Documents   (PDF/image → Markdown/HTML)

   Cross-tab integration: LIDChecker's "Use as source →" callback
   sets a translator preset + switches to the Translate tab so the
   detected language flows into the Translator without a manual
   click.

   Auth: redirects to /admin/login if there's no admin session.
   Phase 4 will reuse these components inside the proper Staff
   Portal "Sarvam" tab; this page remains the QA surface until then.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getAdminSession } from '@/lib/supabase/adminAuthService'
import {
  sarvamTTSStream,
  formatSarvamError,
} from '@/lib/sarvam/browserClient'

// Lazy-load every component so the admin shell cold-start stays small.
const TTSPlayer         = dynamic(() => import('@/components/sarvam/TTSPlayer'),         { ssr: false })
const STTRecorder       = dynamic(() => import('@/components/sarvam/STTRecorder'),       { ssr: false })
const Translator        = dynamic(() => import('@/components/sarvam/Translator'),        { ssr: false })
const BatchTranscriber  = dynamic(() => import('@/components/sarvam/BatchTranscriber'),  { ssr: false })
const Transliterator    = dynamic(() => import('@/components/sarvam/Transliterator'),    { ssr: false })
const LIDChecker        = dynamic(() => import('@/components/sarvam/LIDChecker'),        { ssr: false })
const DictionaryManager = dynamic(() => import('@/components/sarvam/DictionaryManager'), { ssr: false })
const DocumentDigitizer = dynamic(() => import('@/components/sarvam/DocumentDigitizer'), { ssr: false })

type TabKey =
  | 'tts' | 'stt' | 'translate' | 'batch'
  | 'stream' | 'transliterate' | 'lid' | 'dict' | 'doc'

const TABS: Array<{ key: TabKey; label: string; hint: string }> = [
  { key: 'tts',           label: 'TTS',          hint: 'Text → speech (REST, ≤2500 chars)' },
  { key: 'stream',        label: 'Stream',       hint: 'TTS HTTP streaming (≤3500 chars)' },
  { key: 'stt',           label: 'STT',          hint: 'Speech → text (≤30 s)' },
  { key: 'batch',         label: 'Batch',        hint: 'Long audio + diarization' },
  { key: 'translate',     label: 'Translate',    hint: 'Text translation' },
  { key: 'transliterate', label: 'Translit',     hint: 'Script + spoken form' },
  { key: 'lid',           label: 'LID',          hint: 'Detect language + script' },
  { key: 'dict',          label: 'Dictionaries', hint: 'Pronunciation overrides' },
  { key: 'doc',           label: 'Documents',    hint: 'PDF → Markdown / HTML' },
]

export default function SarvamDemoPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [userName, setUserName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [tab, setTab] = useState<TabKey>('tts')
  /** Set by LIDChecker's "Use as source →" — passed to Translator
   *  as defaultSource so the detected lang flows in on tab switch. */
  const [translatorPresetSource, setTranslatorPresetSource] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const session = await getAdminSession()
      if (!session) {
        router.replace('/admin/login')
        return
      }
      setUserName(session.user.name || session.user.email || '')
      // session.user.role uses the UI kebab-case form (super-admin / admin / etc.)
      setIsAdmin(['super-admin', 'admin'].includes(session.user.role))
      setReady(true)
    })()
  }, [router])

  // Restore last tab.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = sessionStorage.getItem('sarvam-demo-tab') as TabKey | null
      if (saved && TABS.some((t) => t.key === saved)) setTab(saved)
    } catch { /* ignore */ }
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { sessionStorage.setItem('sarvam-demo-tab', tab) } catch { /* ignore */ }
  }, [tab])

  const handleLIDAccept = useCallback((langCode: string) => {
    setTranslatorPresetSource(langCode)
    setTab('translate')
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-gray-500 text-sm">
        Loading Sarvam demo…
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black px-4 sm:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-5">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Phase 3a · QA</p>
          <h1 className="text-2xl font-bold text-white mt-1">Sarvam AI — All Capabilities</h1>
          <p className="text-sm text-gray-400 mt-1">
            End-to-end verification surface. Every call goes through a Netlify Function proxy
            and is audited in <code className="text-gray-300">sarvam_api_logs</code>.
          </p>
          <p className="text-[11px] text-gray-600 mt-1">
            Signed in as <span className="text-gray-300">{userName}</span>
            {isAdmin && <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[9px] uppercase tracking-wider">admin</span>}.
          </p>
        </header>

        {/* Tabs */}
        <nav className="flex items-center gap-1 mb-5 border-b border-white/[0.06] overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                tab === t.key ? 'text-white' : 'text-gray-500 hover:text-white'
              }`}
              title={t.hint}
            >
              {t.label}
              {tab === t.key && (
                <span
                  className="absolute left-0 right-0 -bottom-px h-0.5 rounded-t"
                  style={{ background: 'linear-gradient(90deg, #D0021B, #C8A951)' }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Mounted component */}
        {tab === 'tts'           && <TTSPlayer />}
        {tab === 'stream'        && <StreamTTSPanel />}
        {tab === 'stt'           && <STTRecorder />}
        {tab === 'batch'         && <BatchTranscriber />}
        {tab === 'translate'     && (
          <Translator
            key={translatorPresetSource || 'default'}
            defaultSource={translatorPresetSource || 'auto'}
          />
        )}
        {tab === 'transliterate' && <Transliterator />}
        {tab === 'lid'           && <LIDChecker onAccept={handleLIDAccept} />}
        {tab === 'dict'          && <DictionaryManager isAdmin={isAdmin} />}
        {tab === 'doc'           && <DocumentDigitizer />}

        <footer className="mt-6 text-[11px] text-gray-600 leading-relaxed">
          Live WebSocket streaming (dictation + NEXUS voice agent) lands in Phase 3b — needs an
          external Node service since Netlify Functions can't hold persistent WSS connections.
          Sarvam side chat module + Staff Portal Sarvam tab + knowledge base ship in Phase 4.
        </footer>
      </div>
    </main>
  )
}

/* ─────────────────────────────────────────────────────────────
   StreamTTSPanel — inline mini-component for the "Stream" tab.

   Same Netlify Function family as TTSPlayer but routes through
   sarvam-tts-stream (3500-char cap). Kept tiny on purpose — when
   the dedicated <StreamingDictation /> + NEXUS agent components
   land in Phase 3b they'll subsume this affordance.
   ───────────────────────────────────────────────────────────── */

function StreamTTSPanel() {
  const [text, setText] = useState(
    'भारत की सबसे प्राचीन भाषाएँ संस्कृत, पाली और प्राकृत हैं। ये भाषाएँ हमारी सांस्कृतिक विरासत का अमूल्य हिस्सा हैं। ' +
    'In Phase 3a we tested the HTTP streaming endpoint — text up to 3,500 characters can be processed without splitting.',
  )
  const [lang, setLang] = useState('en-IN')
  const [speaker, setSpeaker] = useState('shubh')
  const [codec, setCodec] = useState<'wav' | 'mp3' | 'opus' | 'flac'>('mp3')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [streamed, setStreamed] = useState(false)
  const [requestId, setRequestId] = useState<string | null>(null)

  useEffect(() => {
    return () => { if (audioUrl) URL.revokeObjectURL(audioUrl) }
  }, [audioUrl])

  const over = text.length > 3500

  const handlePlay = async () => {
    if (over) { setError('Text exceeds 3500 chars.'); return }
    setBusy(true); setError(null)
    try {
      const r = await sarvamTTSStream({
        text,
        target_language_code: lang,
        speaker,
        output_audio_codec: codec,
      })
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      setAudioUrl(r.url)
      setStreamed(r.streamed)
      setRequestId(r.requestId)
    } catch (e: unknown) {
      setError(formatSarvamError(e))
    } finally { setBusy(false) }
  }

  return (
    <section className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
      <header className="mb-4">
        <h2 className="text-base font-bold text-white">Sarvam TTS · HTTP Stream</h2>
        <p className="text-[11px] text-gray-500 mt-0.5">
          /text-to-speech/stream · ≤3500 chars (vs 2500 REST) · raw binary streamed back
        </p>
      </header>

      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Text</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 resize-vertical"
        />
        <div className="flex items-center justify-between mt-1">
          <span className={`text-[10px] font-mono ${over ? 'text-red-400' : 'text-gray-500'}`}>
            {text.length} / 3500
          </span>
          {requestId && (
            <span className="text-[9px] text-gray-600 font-mono truncate" title={requestId}>
              req {requestId.slice(0, 10)}…
              {streamed && <span className="ml-1.5 text-emerald-400">· streamed</span>}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <select
          value={lang} onChange={(e) => setLang(e.target.value)} disabled={busy}
          className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red/40 disabled:opacity-50"
        >
          {['en-IN','hi-IN','bn-IN','ta-IN','te-IN','kn-IN','ml-IN','mr-IN','gu-IN','pa-IN','od-IN'].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select
          value={speaker} onChange={(e) => setSpeaker(e.target.value)} disabled={busy}
          className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red/40 disabled:opacity-50"
        >
          {['shubh','aditya','ratan','ashutosh','rehan','priya','ishita','suhani','ritu'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={codec} onChange={(e) => setCodec(e.target.value as typeof codec)} disabled={busy}
          className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red/40 disabled:opacity-50"
        >
          <option value="mp3">MP3</option>
          <option value="wav">WAV</option>
          <option value="opus">Opus</option>
          <option value="flac">FLAC</option>
        </select>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handlePlay}
          disabled={busy || over}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}
        >
          {busy ? 'Streaming…' : '▶ Play'}
        </button>
        {audioUrl && (
          <a
            href={audioUrl}
            download={`stream-${lang}-${speaker}.${codec}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            ⤓ Download
          </a>
        )}
      </div>

      {audioUrl && (
        <audio src={audioUrl} controls autoPlay className="w-full mt-4" />
      )}
    </section>
  )
}
