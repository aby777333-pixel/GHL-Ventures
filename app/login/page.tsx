'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'
import { Eye, EyeOff, Lock, ArrowLeft, Shield } from 'lucide-react'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Demo: redirect to dashboard (Production: connect to authentication backend)
    router.push('/dashboard')
  }

  const handleGoogleSignIn = () => {
    // Demo: redirect to dashboard (Production: connect Google OAuth)
    router.push('/dashboard')
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

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-6 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-brand-grey">or log in with credentials</span>
            </div>
          </div>

          {/* Form */}
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
              <Link href="/terms" className="text-brand-red hover:underline">Terms of Service</Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-brand-red hover:underline">Privacy Policy</Link>.
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
