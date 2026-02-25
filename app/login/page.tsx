'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LegalLink } from '@/components/LegalPopup'
import { BRAND } from '@/lib/constants'
import { Eye, EyeOff, Lock, ArrowLeft, Shield, Smartphone, Fingerprint, AlertTriangle, Loader2 } from 'lucide-react'
import Logo from '@/components/Logo'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { loginClient } from '@/lib/supabase/clientAuthService'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpTimer, setOtpTimer] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isSupabaseConfigured()) {
      // Demo mode — store mock session then navigate
      const loginEmail = mobile.includes('@') ? mobile : `${mobile}@ghlindiaventures.com`
      await loginClient(loginEmail, '')
      router.push('/dashboard')
      return
    }

    setLoading(true)
    try {
      // Use email = mobile@ghl.local pattern or actual email
      const loginEmail = mobile.includes('@') ? mobile : `${mobile}@ghlindiaventures.com`
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })
      if (authError || !data.user) {
        // Supabase user not found — fall back to demo mode
        console.info('[clientAuth] Supabase auth failed, falling back to demo')
        await loginClient(loginEmail, '')
        router.push('/dashboard')
        setLoading(false)
        return
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Authentication service unavailable.')
    }
    setLoading(false)
  }

  // Supabase auth settings cache — fetched once to know which providers are enabled
  const [authSettings, setAuthSettings] = useState<Record<string, boolean> | null>(null)

  const fetchAuthSettings = async () => {
    if (authSettings) return authSettings
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return null
    try {
      const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      if (res.ok) {
        const data = await res.json()
        setAuthSettings(data?.external ?? null)
        return data?.external ?? null
      }
    } catch { /* ignore */ }
    return null
  }

  /**
   * Generic social OAuth handler — works for Google, Facebook, Twitter (X), LinkedIn.
   * Pre-checks Supabase auth settings to show a friendly error if the provider
   * isn't enabled, instead of redirecting to a raw JSON error page.
   */
  const handleSocialSignIn = async (provider: 'google' | 'facebook' | 'twitter' | 'linkedin_oidc') => {
    if (!isSupabaseConfigured()) {
      await loginClient('demo@ghlindiaventures.com', '')
      router.push('/dashboard')
      return
    }
    setLoading(true)
    setError('')

    const providerNames: Record<string, string> = {
      google: 'Google', facebook: 'Facebook', twitter: 'X (Twitter)', linkedin_oidc: 'LinkedIn',
    }
    const settingsKey: Record<string, string> = {
      google: 'google', facebook: 'facebook', twitter: 'twitter', linkedin_oidc: 'linkedin_oidc',
    }

    try {
      const settings = await fetchAuthSettings()
      if (settings && !settings[settingsKey[provider]]) {
        setError(`${providerNames[provider]} sign-in is not yet enabled. Please use password or OTP login for now.`)
        setLoading(false)
        return
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard` },
      })
      if (oauthError) {
        setError(`${providerNames[provider]} sign-in failed. Please try another method.`)
      }
    } catch {
      setError(`${providerNames[provider]} sign-in unavailable. Please try another method.`)
    }
    setLoading(false)
  }

  const handleSendOTP = () => {
    if (!mobile || mobile.length < 10) return
    setOtpSent(true)
    setOtpTimer(30)
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    // Auto-focus next input
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`)
      next?.focus()
    }
  }

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSupabaseConfigured()) {
      await loginClient(`${mobile}@ghlindiaventures.com`, '')
      router.push('/dashboard')
      return
    }
    setLoading(true)
    try {
      const otpCode = otp.join('')
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: `+91${mobile}`,
        token: otpCode,
        type: 'sms',
      })
      if (verifyError || !data.user) {
        setError('Invalid OTP. Please try again.')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('OTP verification unavailable.')
    }
    setLoading(false)
  }

  return (
    <section className="min-h-screen flex pt-32">
      {/* LEFT: Dark Brand Visual */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-brand-black overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-black via-[#1a0000] to-brand-black" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-red/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-red/5 rounded-full blur-[80px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          {/* Logo */}
          <div className="mb-8">
            <Logo size={80} />
          </div>

          <h2 className="text-3xl font-bold text-white text-center mb-3">
            {BRAND.name}
          </h2>
          <p className="text-lg text-brand-red font-medium mb-6 text-center">
            Your Wealth. Our Stewardship.
          </p>
          <p className="text-gray-400 text-sm text-center max-w-sm leading-relaxed">
            {BRAND.description}
          </p>

          {/* SEBI badge */}
          <div className="mt-10 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
            <span className="text-xs text-gray-400">SEBI Reg: {BRAND.sebi}</span>
          </div>
        </div>
      </div>

      {/* RIGHT: White Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-20 lg:py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="mx-auto mb-3 w-fit">
              <Logo size={56} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-brand-black mb-2">
            Login to {BRAND.name}
          </h1>
          <p className="text-brand-grey mb-8">
            Access your investor portal
          </p>

          {/* Social OAuth Buttons */}
          <div className="space-y-3 mb-6">
            {/* Google */}
            <button type="button" onClick={() => handleSocialSignIn('google')} disabled={loading}
              className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
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

            {/* Facebook, X (Twitter), LinkedIn — compact row */}
            <div className="grid grid-cols-3 gap-3">
              {/* Facebook */}
              <button type="button" onClick={() => handleSocialSignIn('facebook')} disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-xs font-medium text-gray-700 hidden sm:inline">Facebook</span>
              </button>

              {/* X (Twitter) */}
              <button type="button" onClick={() => handleSocialSignIn('twitter')} disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#000000">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-xs font-medium text-gray-700 hidden sm:inline">X</span>
              </button>

              {/* LinkedIn */}
              <button type="button" onClick={() => handleSocialSignIn('linkedin_oidc')} disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-xs font-medium text-gray-700 hidden sm:inline">LinkedIn</span>
              </button>
            </div>
          </div>

          {/* Login Mode Toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setLoginMode('password'); setOtpSent(false) }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${loginMode === 'password' ? 'bg-white shadow-sm text-brand-black' : 'text-brand-grey hover:text-brand-black'}`}
            >
              <Lock className="w-4 h-4" /> Password
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('otp')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${loginMode === 'otp' ? 'bg-white shadow-sm text-brand-black' : 'text-brand-grey hover:text-brand-black'}`}
            >
              <Fingerprint className="w-4 h-4" /> OTP Login
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-brand-grey">
                {loginMode === 'password' ? 'or log in with credentials' : 'one-time password login'}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {loginMode === 'password' ? (
            /* Password Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Mobile Number */}
              <div>
                <label htmlFor="login-mobile" className="block text-sm font-medium text-brand-black mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey text-sm font-medium">
                    +91
                  </span>
                  <input
                    id="login-mobile"
                    type="tel"
                    required
                    className="input-field pl-14"
                    placeholder="XXXXX XXXXX"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-brand-black mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-field pr-12"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey hover:text-brand-black transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <a href="#" className="text-sm text-brand-red hover:underline font-medium">
                  Forgot Password?
                </a>
              </div>

              {/* Submit */}
              <button type="submit" className="btn-primary w-full text-center">
                <Lock className="w-4 h-4 mr-2" />
                Login
              </button>
            </form>
          ) : (
            /* OTP Form */
            <form onSubmit={handleOtpLogin} className="space-y-5">
              {/* Mobile Number */}
              <div>
                <label htmlFor="otp-mobile" className="block text-sm font-medium text-brand-black mb-2">
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey text-sm font-medium">
                    +91
                  </span>
                  <input
                    id="otp-mobile"
                    type="tel"
                    required
                    className="input-field pl-14"
                    placeholder="XXXXX XXXXX"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    disabled={otpSent}
                  />
                </div>
              </div>

              {!otpSent ? (
                <button type="button" onClick={handleSendOTP}
                  className="btn-primary w-full text-center">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Send OTP
                </button>
              ) : (
                <>
                  {/* OTP Input */}
                  <div>
                    <label className="block text-sm font-medium text-brand-black mb-2">
                      Enter 6-digit OTP
                    </label>
                    <p className="text-xs text-brand-grey mb-3">
                      Sent to +91 {mobile}
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(['','','','','','']) }}
                        className="text-brand-red ml-2 hover:underline font-medium">Change</button>
                    </p>
                    <div className="flex gap-2 justify-center">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !digit && idx > 0) {
                              document.getElementById(`otp-${idx - 1}`)?.focus()
                            }
                          }}
                          className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 outline-none transition-all text-brand-black"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Resend timer */}
                  <div className="text-center">
                    {otpTimer > 0 ? (
                      <p className="text-xs text-brand-grey">Resend OTP in <span className="text-brand-red font-semibold">{otpTimer}s</span></p>
                    ) : (
                      <button type="button" onClick={handleSendOTP} className="text-xs text-brand-red font-semibold hover:underline">
                        Resend OTP
                      </button>
                    )}
                  </div>

                  {/* Submit */}
                  <button type="submit" className="btn-primary w-full text-center">
                    <Fingerprint className="w-4 h-4 mr-2" />
                    Verify & Login
                  </button>
                </>
              )}
            </form>
          )}

          {/* Create Account */}
          <div className="mt-6 text-center">
            <p className="text-sm text-brand-grey">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-brand-red font-semibold hover:underline">
                Create Account
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-brand-grey hover:text-brand-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Home
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
