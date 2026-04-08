'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LegalLink } from '@/components/LegalPopup'
import { BRAND } from '@/lib/constants'
import { Eye, EyeOff, UserPlus, ArrowLeft, Shield, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import Logo from '@/components/Logo'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { submitContactForm } from '@/lib/supabase/reportsDataService'
import { AUTH_ERRORS, mapSupabaseError } from '@/lib/auth/errorMessages'

function RegisterPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', password: '', referral: '', terms: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Email OTP Verification State ──────────────────────────
  const [otpStep, setOtpStep] = useState(false)
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [otpSending, setOtpSending] = useState(false)
  const [otpCooldown, setOtpCooldown] = useState(0)
  const [emailVerified, setEmailVerified] = useState(false)

  // Capture referral code from URL (?ref=GHL-XXXXXXXX)
  useEffect(() => {
    const refCode = searchParams.get('ref')
    if (refCode) {
      setForm(prev => ({ ...prev, referral: refCode }))
    }
  }, [searchParams])

  // Redirect if already authenticated
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) router.replace('/dashboard')
    })
  }, [router])

  const handleChange = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (field === 'email') { setEmailVerified(false); setOtpStep(false) }
  }

  // ── OTP Cooldown Timer ────────────────────────────────────
  useEffect(() => {
    if (otpCooldown <= 0) return
    const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [otpCooldown])

  // ── Send Email OTP ────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!form.email || otpCooldown > 0) return
    if (!isSupabaseConfigured()) { setError(AUTH_ERRORS.SERVICE_UNAVAILABLE); return }

    setOtpSending(true)
    setError('')
    try {
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: form.email,
        options: { shouldCreateUser: false },
      })
      if (otpErr) {
        const { error: otpErr2 } = await supabase.auth.signInWithOtp({ email: form.email })
        if (otpErr2) { setError(mapSupabaseError(otpErr2.message)); setOtpSending(false); return }
      }

      setOtpStep(true)
      setOtpCode(['', '', '', '', '', ''])
      setOtpCooldown(60)
    } catch {
      setError(AUTH_ERRORS.OTP_SEND_FAILED)
    }
    setOtpSending(false)
  }

  // ── Verify Email OTP ──────────────────────────────────────
  const handleVerifyOTP = async () => {
    const code = otpCode.join('')
    if (code.length !== 6) { setError('Please enter the complete 6-digit code.'); return }

    setLoading(true)
    setError('')
    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: form.email,
        token: code,
        type: 'email',
      })
      if (verifyErr) {
        setError(mapSupabaseError(verifyErr.message))
        setLoading(false)
        return
      }
      await supabase.auth.signOut()
      setEmailVerified(true)
      setOtpStep(false)
    } catch {
      setError(AUTH_ERRORS.OTP_INVALID)
    }
    setLoading(false)
  }

  // ── OTP Input Handler ─────────────────────────────────────
  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return
    const next = [...otpCode]
    next[index] = value
    setOtpCode(next)
    if (value && index < 5) {
      const el = document.getElementById(`otp-${index + 1}`)
      el?.focus()
    }
  }

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const el = document.getElementById(`otp-${index - 1}`)
      el?.focus()
    }
  }

  // ── Google OAuth Sign-Up ───────────────────────────────────
  const handleGoogleSignUp = async () => {
    if (!isSupabaseConfigured()) {
      setError(AUTH_ERRORS.SERVICE_UNAVAILABLE)
      return
    }
    setLoading(true)
    setError('')

    let callbackUrl = ''
    if (typeof window !== 'undefined') {
      const cb = new URL('/auth/callback?flow=signup', window.location.origin)
      if (form.referral && form.referral.startsWith('GHL-')) {
        cb.searchParams.set('ref', form.referral)
      }
      callbackUrl = cb.toString()
    }

    try {
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

  // ── Form Sign-Up ──────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) { setError('Please enter your name.'); return }
    if (!form.email.trim()) { setError('Please enter your email.'); return }
    if (form.password.length < 8) { setError(AUTH_ERRORS.WEAK_PASSWORD); return }
    if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError('Password must contain both letters and numbers.')
      return
    }
    const mobileDigits = form.mobile.replace(/\D/g, '')
    if (mobileDigits.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }

    // Email OTP verification required
    if (!emailVerified) {
      handleSendOTP()
      return
    }

    if (!isSupabaseConfigured()) {
      setError(AUTH_ERRORS.SERVICE_UNAVAILABLE)
      return
    }

    setLoading(true)
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?flow=signup` : undefined,
          data: {
            full_name: form.name,
            phone: mobileDigits,
            referral_source: form.referral,
            email_verified_via_otp: true,
          },
        },
      })

      if (signupError) {
        setError(mapSupabaseError(signupError.message))
        setLoading(false)
        return
      }

      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setError(AUTH_ERRORS.EMAIL_EXISTS)
        setLoading(false)
        return
      }

      // Store referral code in the clients table (non-blocking)
      if (form.referral && data?.user?.id) {
        try {
          await (supabase as any).from('clients').update({ referred_by: form.referral }).eq('user_id', data.user.id)
        } catch { /* non-blocking */ }
      }

      // Save as lead (non-blocking)
      try {
        await submitContactForm({
          formType: 'invest',
          fullName: form.name,
          email: form.email,
          phone: mobileDigits,
          city: '',
          message: JSON.stringify({ referral: form.referral }),
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        })
      } catch { /* non-blocking */ }

      // Record referral if a referral code was used (non-blocking)
      if (form.referral && form.referral.startsWith('GHL-')) {
        try {
          const { recordReferral } = await import('@/lib/supabase/dashboardDataService')
          await recordReferral(form.referral, form.name, form.email)
        } catch { /* non-blocking */ }
      }

      setSubmitted(true)
    } catch {
      setError(AUTH_ERRORS.CONNECTION_ERROR)
    }
    setLoading(false)
  }

  // ── OTP Verification Screen ─────────────────────────────────
  if (otpStep) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-brand-black pt-36 pb-20">
        <div className="max-w-md mx-auto text-center px-6">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="relative w-20 h-20 rounded-full bg-brand-red/10 flex items-center justify-center">
              <Shield className="w-10 h-10 text-brand-red" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verify Your Email</h1>
          <p className="text-gray-400 mb-1">We&apos;ve sent a 6-digit code to</p>
          <p className="text-white font-medium mb-6">{form.email}</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-center gap-3 mb-6">
            {otpCode.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOTPChange(i, e.target.value)}
                onKeyDown={(e) => handleOTPKeyDown(i, e)}
                onPaste={(e) => {
                  e.preventDefault()
                  const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                  if (pasted.length > 0) {
                    const next = [...otpCode]
                    pasted.split('').forEach((ch, idx) => { if (idx < 6) next[idx] = ch })
                    setOtpCode(next)
                    const focusIdx = Math.min(pasted.length, 5)
                    document.getElementById(`otp-${focusIdx}`)?.focus()
                  }
                }}
                className="w-12 h-14 text-center text-xl font-bold text-white bg-white/[0.06] border border-white/[0.12] rounded-xl focus:border-brand-red focus:ring-1 focus:ring-brand-red/50 outline-none transition-colors"
                autoFocus={i === 0}
              />
            ))}
          </div>

          <button
            onClick={handleVerifyOTP}
            disabled={loading || otpCode.join('').length !== 6}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-brand-red hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin inline" /> Verifying...</> : 'Verify Email'}
          </button>

          <div className="flex items-center justify-center gap-4 text-sm">
            <button
              onClick={handleSendOTP}
              disabled={otpCooldown > 0 || otpSending}
              className="text-brand-red hover:underline disabled:text-gray-600 disabled:no-underline disabled:cursor-not-allowed"
            >
              {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : otpSending ? 'Sending...' : 'Resend Code'}
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={() => { setOtpStep(false); setError('') }}
              className="text-gray-400 hover:text-white"
            >
              Change Email
            </button>
          </div>
        </div>
      </section>
    )
  }

  // ── Success Screen ─────────────────────────────────────────
  if (submitted) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-brand-black pt-36 pb-20">
        <div className="max-w-md mx-auto text-center px-6">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping opacity-30" />
            <div className="relative w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Registration Successful</h1>
          <p className="text-gray-400 mb-4">
            Your email has been verified and your account is ready.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Sign in now to access your investor dashboard.
          </p>
          <Link href="/login" className="btn-primary">Go to Login</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen flex pt-32">
      {/* LEFT: Dark Brand Visual */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-brand-black overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-black via-[#1a0000] to-brand-black" />
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-brand-red/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-brand-red/5 rounded-full blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          <div className="mb-8"><Logo size={76} /></div>
          <h2 className="text-3xl font-bold text-white text-center mb-3">{BRAND.name}</h2>
          <p className="text-lg text-brand-red font-medium mb-6 text-center">Your Wealth. Our Stewardship.</p>
          <p className="text-gray-400 text-sm text-center max-w-sm leading-relaxed">
            Join a community of discerning investors building wealth through disciplined, research-driven alternative investments.
          </p>
          <div className="mt-10 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
            <span className="text-xs text-gray-400">SEBI Reg: {BRAND.sebi}</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Registration Form */}
      <div className="flex-1 overflow-y-auto bg-white px-6 py-12 lg:py-10">
        <div className="w-full max-w-lg mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="mx-auto mb-3 w-fit"><Logo size={54} /></div>
          </div>

          <h1 className="text-2xl font-bold text-brand-black mb-1">Register to <span className="text-brand-red">GHL India Ventures</span></h1>
          <div className="w-full h-0.5 bg-brand-red/20 mb-6" />

          {/* Google OAuth */}
          <button type="button" onClick={handleGoogleSignUp} disabled={loading}
            className="w-full flex items-center justify-center space-x-3 px-5 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-5 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span className="text-sm font-medium text-gray-700">Sign up with Google</span>
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-4 text-brand-grey">or register with details</span></div>
          </div>

          {/* Error */}
          {error && (
            error === AUTH_ERRORS.EMAIL_EXISTS ? (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-amber-800">{error}</p>
                </div>
                <Link href="/login"
                  className="inline-flex items-center justify-center w-full mt-1 px-4 py-2 bg-brand-red text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors">
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )
          )}

          {/* Form — Simplified */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="reg-name" className="block text-xs font-medium text-brand-black mb-1">Name</label>
              <input id="reg-name" type="text" required className="input-field" placeholder="Enter Your Name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
            </div>

            {/* Mobile */}
            <div>
              <label htmlFor="reg-mobile" className="block text-xs font-medium text-brand-black mb-1">Mobile</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey text-sm font-medium">+91</span>
                <input id="reg-mobile" type="tel" required className="input-field pl-14" placeholder="XXXXX XXXXX" value={form.mobile} onChange={(e) => handleChange('mobile', e.target.value)} />
              </div>
            </div>

            {/* Email with OTP verification badge */}
            <div>
              <label htmlFor="reg-email" className="block text-xs font-medium text-brand-black mb-1">Email Address</label>
              <div className="relative">
                <input id="reg-email" type="email" required className={`input-field ${emailVerified ? 'pr-20 border-green-400 bg-green-50' : ''}`} placeholder="your@email.com" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                {emailVerified && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 text-xs font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-medium text-brand-black mb-1">Password</label>
              <div className="relative">
                <input id="reg-password" type={showPassword ? 'text' : 'password'} required className="input-field pr-12" placeholder="Min 8 characters (letters + numbers)" value={form.password} onChange={(e) => handleChange('password', e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey hover:text-brand-black" aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Referred By */}
            <div>
              <label htmlFor="reg-referral" className="block text-xs font-medium text-brand-black mb-1">Referred By</label>
              {form.referral && form.referral.startsWith('GHL-') ? (
                <div className="flex items-center gap-2">
                  <input id="reg-referral" type="text" className="input-field font-mono font-semibold" value={form.referral} readOnly
                    style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a' }} />
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                </div>
              ) : (
                <input id="reg-referral" type="text" className="input-field" placeholder="Enter Referral Code" value={form.referral} onChange={(e) => handleChange('referral', e.target.value)} />
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start space-x-3 cursor-pointer pt-1">
              <input type="checkbox" required checked={form.terms} onChange={(e) => handleChange('terms', e.target.checked)}
                className="w-4 h-4 text-brand-red rounded border-gray-300 mt-0.5 focus:ring-brand-red" />
              <span className="text-xs text-brand-grey">
                I agree to the{' '}
                <LegalLink type="terms" className="text-brand-red hover:underline">Terms of Service</LegalLink>{' '}
                and{' '}
                <LegalLink type="privacy" className="text-brand-red hover:underline">Privacy Policy</LegalLink>.
                I understand that investments in AIFs involve risks. <span className="text-brand-red">*</span>
              </span>
            </label>

            <button type="submit" disabled={loading || otpSending} className="btn-primary w-full text-center disabled:opacity-60">
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...</>
              ) : otpSending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP...</>
              ) : !emailVerified ? (
                <><Shield className="w-4 h-4 mr-2" /> Verify Email &amp; Register</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Register</>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-brand-grey">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-red font-semibold hover:underline">Sign In</Link>
            </p>
          </div>

          <div className="mt-3 text-center">
            <Link href="/" className="inline-flex items-center text-sm text-brand-grey hover:text-brand-black transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Home
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <div className="inline-flex items-center space-x-1.5 text-gray-400 text-xs">
              <Shield className="w-3.5 h-3.5" />
              <span>Your data is encrypted and secure &bull; SEBI compliant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-black" />}>
      <RegisterPageInner />
    </Suspense>
  )
}
