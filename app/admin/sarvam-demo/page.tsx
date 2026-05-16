'use client'

/* ─────────────────────────────────────────────────────────────
   /admin/sarvam-demo — Phase 1 Sarvam end-to-end verification

   Admin-gated demo page. Mounts <TTSPlayer /> so an admin can
   verify the full Phase 1 round-trip (browser → Supabase JWT
   → Netlify Function → Sarvam → audio bytes → playback) without
   touching production surfaces.

   Auth: redirects to /admin/login if there's no admin session.
   Phase 4 will reuse <TTSPlayer /> inside the proper Staff Portal
   "Sarvam" tab, but this page is the QA gate until then.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getAdminSession } from '@/lib/supabase/adminAuthService'

// Dynamically loaded so the component (and its supabase deps)
// don't blow up the initial admin bundle.
const TTSPlayer = dynamic(() => import('@/components/sarvam/TTSPlayer'), { ssr: false })

export default function SarvamDemoPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [userName, setUserName] = useState('')

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
        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Phase 1 · QA</p>
          <h1 className="text-2xl font-bold text-white mt-1">Sarvam AI — TTS Demo</h1>
          <p className="text-sm text-gray-400 mt-1">
            End-to-end verification surface for the Phase 1 Sarvam integration.
            Synthesises text → speech via bulbul:v3 through the Netlify Function proxy.
          </p>
          <p className="text-[11px] text-gray-600 mt-1">
            Signed in as <span className="text-gray-300">{userName}</span>. Every call is audited in <code className="text-gray-400">sarvam_api_logs</code>.
          </p>
        </header>

        <TTSPlayer />

        <footer className="mt-6 text-[11px] text-gray-600">
          STT recorder + Translator UI ship in Phase 2. Live WebSocket streaming + NEXUS voice agent in Phase 3.
          Side chat + Staff Portal "Sarvam" tab in Phase 4.
        </footer>
      </div>
    </main>
  )
}
