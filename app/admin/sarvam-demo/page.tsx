'use client'

/* ─────────────────────────────────────────────────────────────
   /admin/sarvam-demo — Sarvam end-to-end verification (Phase 2)

   Admin-gated demo page with tabbed access to all four
   Sarvam capabilities shipped through Phase 2:

     • TTS         (bulbul:v3, 11 langs, 39 voices)
     • STT         (saaras:v3 REST, ≤30 s)
     • Translate   (mayura:v1 + sarvam-translate:v1)
     • Batch       (long audio + diarization + timestamps)

   Auth: redirects to /admin/login if there's no admin session.
   Phase 4 will reuse these components inside the proper Staff
   Portal "Sarvam" tab; this page is the QA gate until then.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getAdminSession } from '@/lib/supabase/adminAuthService'

// Dynamic imports keep the admin shell small — each component
// (and its supabase deps) only loads when the user clicks its tab.
const TTSPlayer        = dynamic(() => import('@/components/sarvam/TTSPlayer'),        { ssr: false })
const STTRecorder      = dynamic(() => import('@/components/sarvam/STTRecorder'),      { ssr: false })
const Translator       = dynamic(() => import('@/components/sarvam/Translator'),       { ssr: false })
const BatchTranscriber = dynamic(() => import('@/components/sarvam/BatchTranscriber'), { ssr: false })

type TabKey = 'tts' | 'stt' | 'translate' | 'batch'

const TABS: Array<{ key: TabKey; label: string; hint: string }> = [
  { key: 'tts',       label: 'TTS',         hint: 'Text → speech' },
  { key: 'stt',       label: 'STT',         hint: 'Speech → text (≤30 s)' },
  { key: 'translate', label: 'Translate',   hint: 'Text translation' },
  { key: 'batch',     label: 'Batch',       hint: 'Long audio + diarization' },
]

export default function SarvamDemoPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [userName, setUserName] = useState('')
  const [tab, setTab] = useState<TabKey>('tts')

  useEffect(() => {
    (async () => {
      const session = await getAdminSession()
      if (!session) {
        router.replace('/admin/login')
        return
      }
      setUserName(session.user.name || session.user.email || '')
      setReady(true)
    })()
  }, [router])

  // Restore the last selected tab on remount (admin clicks around).
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
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Phase 2 · QA</p>
          <h1 className="text-2xl font-bold text-white mt-1">Sarvam AI — All Capabilities</h1>
          <p className="text-sm text-gray-400 mt-1">
            End-to-end verification surface for the Phase 2 Sarvam integration. Every call goes
            through a Netlify Function proxy and is audited in <code className="text-gray-300">sarvam_api_logs</code>.
          </p>
          <p className="text-[11px] text-gray-600 mt-1">
            Signed in as <span className="text-gray-300">{userName}</span>.
          </p>
        </header>

        {/* Tabs */}
        <nav className="flex items-center gap-1 mb-5 border-b border-white/[0.06]">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative px-3 py-2 text-xs font-medium transition-colors ${
                tab === t.key
                  ? 'text-white'
                  : 'text-gray-500 hover:text-white'
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
        {tab === 'tts'       && <TTSPlayer />}
        {tab === 'stt'       && <STTRecorder />}
        {tab === 'translate' && <Translator />}
        {tab === 'batch'     && <BatchTranscriber />}

        <footer className="mt-6 text-[11px] text-gray-600 leading-relaxed">
          Live WebSocket streaming (dictation + NEXUS voice agent) lands in Phase 3 — needs an
          external Node service since Netlify Functions can't hold persistent WSS connections.
          Sarvam side chat module + Staff Portal Sarvam tab + knowledge base ship in Phase 4.
        </footer>
      </div>
    </main>
  )
}
