'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PenSquare, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { loginToCms, type CmsSession } from '@/lib/supabase/cmsAuthService'

export default function CmsLogin({ onSuccess }: { onSuccess: (s: CmsSession) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    const res = await loginToCms(email, password)
    setBusy(false)
    if (res.ok && res.session) onSuccess(res.session)
    else setError(res.message || 'Could not sign in.')
  }

  return (
    <div className="min-h-screen bg-[#0B090A] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-brand-red/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex w-12 h-12 rounded-xl bg-brand-red items-center justify-center mb-4">
            <PenSquare className="w-5 h-5 text-white" />
          </span>
          <h1 className="text-xl font-bold text-white">Content Studio</h1>
          <p className="text-xs text-white/40 mt-1">GHL India Ventures — blog &amp; research publishing</p>
        </div>

        <form onSubmit={submit} className="bg-[#161A1D] border border-white/10 rounded-2xl p-6 space-y-3">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-red-500/25 bg-red-500/10 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="cms-email" className="block text-[11px] font-semibold uppercase tracking-wider text-white/45 mb-1.5">
              Email
            </label>
            <input
              id="cms-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-red transition-colors"
              placeholder="you@ghlindiaventures.com"
            />
          </div>

          <div>
            <label htmlFor="cms-password" className="block text-[11px] font-semibold uppercase tracking-wider text-white/45 mb-1.5">
              Password
            </label>
            <input
              id="cms-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-red transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full px-4 py-2.5 rounded-lg bg-brand-red hover:bg-brand-red-deep disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign in
          </button>

          <p className="text-[11px] text-white/30 text-center pt-1">
            This console manages blog content only. It has no access to
            investor, KYC or financial data.
          </p>
        </form>

        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-white/70 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to ghlindiaventures.com
          </Link>
        </div>
      </div>
    </div>
  )
}
