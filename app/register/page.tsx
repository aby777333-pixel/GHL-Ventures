'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LegalLink } from '@/components/LegalPopup'
import { BRAND } from '@/lib/constants'
import { Eye, EyeOff, UserPlus, ArrowLeft, Shield, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import Logo from '@/components/Logo'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { submitContactForm } from '@/lib/supabase/reportsDataService'
import { loginClient } from '@/lib/supabase/clientAuthService'

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirm: '',
    pan: '',
    city: '',
    referral: '',
    accredited: false,
    terms: false,
  })

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    if (!isSupabaseConfigured()) {
      // Demo mode — show success
      setSubmitted(true)
      return
    }

    setLoading(true)
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
            phone: form.mobile,
            city: form.city,
            pan: form.pan,
            referral_source: form.referral,
          },
        },
      })

      if (signupError) {
        setError(signupError.message)
        setLoading(false)
        return
      }

      // Also save as contact form / lead
      try {
        await submitContactForm({
          formType: 'invest',
          fullName: form.name,
          email: form.email,
          phone: form.mobile,
          city: form.city,
          message: JSON.stringify({ pan: form.pan, referral: form.referral }),
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        })
      } catch { /* non-blocking */ }

      setSubmitted(true)
    } catch {
      setError('Registration service unavailable. Please try again.')
    }
    setLoading(false)
  }

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
          <h1 className="text-3xl font-bold text-white mb-4">Registration Submitted</h1>
          <p className="text-gray-400 mb-8">
            Thank you for your interest in {BRAND.name}. Our team will review your application and contact you within 2 business days to complete the onboarding process.
          </p>
          <Link href="/login" className="btn-primary">
            Go to Login
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen flex pt-32">
      {/* LEFT: Dark Brand Visual */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-brand-black overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-black via-[#1a0000] to-brand-black" />
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-brand-red/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-brand-red/5 rounded-full blur-[80px]" />
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
            <Logo size={56} />
          </div>

          <h2 className="text-3xl font-bold text-white text-center mb-3">
            {BRAND.name}
          </h2>
          <p className="text-lg text-brand-red font-medium mb-6 text-center">
            Your Wealth. Our Stewardship.
          </p>
          <p className="text-gray-400 text-sm text-center max-w-sm leading-relaxed">
            Join a community of discerning investors building wealth through disciplined, research-driven alternative investments.
          </p>

          {/* SEBI badge */}
          <div className="mt-10 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
            <span className="text-xs text-gray-400">SEBI Reg: {BRAND.sebi}</span>
          </div>
        </div>
      </div>

      {/* RIGHT: White Form Panel */}
      <div className="flex-1 overflow-y-auto bg-white px-6 py-12 lg:py-10">
        <div className="w-full max-w-lg mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="mx-auto mb-3 w-fit">
              <Logo size={40} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-brand-black mb-1.5">
            Create Your Account
          </h1>
          <p className="text-brand-grey text-sm mb-5">
            Register to access investment opportunities with {BRAND.name}
          </p>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={async () => {
              if (!isSupabaseConfigured()) {
                await loginClient()
                router.push('/dashboard')
                return
              }
              setLoading(true)
              setError('')
              try {
                const { error: oauthError } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback/` },
                })
                if (oauthError) {
                  setError('Google sign-up failed. Please try registering with email.')
                }
              } catch {
                setError('Google sign-up unavailable. Please try registering with email.')
              }
              setLoading(false)
            }}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 px-5 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-4 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
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

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-brand-grey">or register with details</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label htmlFor="reg-name" className="block text-xs font-medium text-brand-black mb-1">
                Full Name <span className="text-brand-red">*</span>
              </label>
              <input
                id="reg-name"
                type="text"
                required
                className="input-field"
                placeholder="Your full legal name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>

            {/* Email + Mobile */}
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-email" className="block text-xs font-medium text-brand-black mb-1">
                  Email Address <span className="text-brand-red">*</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  className="input-field"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="reg-mobile" className="block text-xs font-medium text-brand-black mb-1">
                  Mobile Number <span className="text-brand-red">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey text-sm font-medium">+91</span>
                  <input
                    id="reg-mobile"
                    type="tel"
                    required
                    className="input-field pl-14"
                    placeholder="XXXXX XXXXX"
                    value={form.mobile}
                    onChange={(e) => handleChange('mobile', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-password" className="block text-xs font-medium text-brand-black mb-1">
                  Password <span className="text-brand-red">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-field pr-12"
                    placeholder="Min 8 characters"
                    minLength={8}
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey hover:text-brand-black"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="reg-confirm" className="block text-xs font-medium text-brand-black mb-1">
                  Confirm Password <span className="text-brand-red">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reg-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    className="input-field pr-12"
                    placeholder="Re-enter password"
                    value={form.confirm}
                    onChange={(e) => handleChange('confirm', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey hover:text-brand-black"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* PAN + City */}
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-pan" className="block text-xs font-medium text-brand-black mb-1">
                  PAN Number <span className="text-xs text-brand-grey">(for KYC)</span>
                </label>
                <input
                  id="reg-pan"
                  type="text"
                  className="input-field uppercase"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  value={form.pan}
                  onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label htmlFor="reg-city" className="block text-xs font-medium text-brand-black mb-1">
                  City of Residence
                </label>
                <input
                  id="reg-city"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Chennai, Mumbai"
                  value={form.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </div>
            </div>

            {/* How did you hear about us */}
            <div>
              <label htmlFor="reg-referral" className="block text-xs font-medium text-brand-black mb-1">
                How did you hear about us?
              </label>
              <select
                id="reg-referral"
                className="input-field"
                value={form.referral}
                onChange={(e) => handleChange('referral', e.target.value)}
              >
                <option value="">Select an option</option>
                <option value="linkedin">LinkedIn</option>
                <option value="referral">Referral</option>
                <option value="news">News Article</option>
                <option value="social">Social Media</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={form.accredited}
                  onChange={(e) => handleChange('accredited', e.target.checked)}
                  className="w-4 h-4 text-brand-red rounded border-gray-300 mt-0.5 focus:ring-brand-red"
                />
                <span className="text-xs text-brand-grey">
                  I confirm I am a Qualified / Accredited Investor as defined by SEBI regulations for Alternative Investment Funds. <span className="text-brand-red">*</span>
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={form.terms}
                  onChange={(e) => handleChange('terms', e.target.checked)}
                  className="w-4 h-4 text-brand-red rounded border-gray-300 mt-0.5 focus:ring-brand-red"
                />
                <span className="text-xs text-brand-grey">
                  I agree to the{' '}
                  <LegalLink type="terms" className="text-brand-red hover:underline">Terms of Service</LegalLink>{' '}
                  and{' '}
                  <LegalLink type="privacy" className="text-brand-red hover:underline">Privacy Policy</LegalLink>.
                  I understand that investments in AIFs involve risks. <span className="text-brand-red">*</span>
                </span>
              </label>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full text-center disabled:opacity-60">
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Create Account</>
              )}
            </button>
          </form>

          {/* Already have an account */}
          <div className="mt-5 text-center">
            <p className="text-sm text-brand-grey">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-red font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-3 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-brand-grey hover:text-brand-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Home
            </Link>
          </div>

          {/* Security note */}
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
