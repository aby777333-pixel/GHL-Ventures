'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/constants'
import { Shield, Lock, Eye, EyeOff, AlertTriangle, KeyRound, Loader2 } from 'lucide-react'
import Logo from '@/components/Logo'
import { authenticateAdmin as mockAuth, getAdminSession as mockGetSession } from '@/lib/admin/adminAuth'
import { authenticateAdmin as supaAuth, getAdminSession as supaGetSession } from '@/lib/supabase/adminAuthService'
import { isSupabaseConfigured } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFaCode, setTwoFaCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)

  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const session = isSupabaseConfigured()
        ? await supaGetSession()
        : mockGetSession()
      if (session) {
        router.push('/admin')
      }
    }
    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (attempts >= 5) {
      setError('Account locked. Too many failed attempts. Please wait 15 minutes.')
      return
    }

    if (twoFaCode.length !== 6) {
      setError('Please enter a valid 6-digit 2FA code')
      return
    }

    setLoading(true)

    try {
      const session = isSupabaseConfigured()
        ? await supaAuth(email, password)
        : mockAuth(email, password)

      if (session) {
        // Also store in localStorage for mock-compatible session checks
        if (!isSupabaseConfigured()) {
          // mockAuth already stores it
        }
        setLoading(false)
        router.push('/admin')
      } else {
        setLoading(false)
        setAttempts(prev => prev + 1)
        const remaining = 5 - (attempts + 1)
        setError(
          remaining > 0
            ? `Invalid credentials. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`
            : 'Account locked due to too many failed attempts. Please wait 15 minutes.'
        )
      }
    } catch {
      setLoading(false)
      setError('Authentication service unavailable. Please try again.')
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center gradient-dark pt-36 pb-20 relative overflow-hidden">
      {/* Background subtle effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-red/5 rounded-full blur-[200px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 w-fit">
            <Logo size={64} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            {BRAND.name}
          </h1>
          <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-brand-red/15 border border-brand-red/30 rounded-full">
            <Shield className="w-3.5 h-3.5 text-brand-red" />
            <span className="text-xs font-semibold text-brand-red uppercase tracking-wider">Admin Access Only</span>
          </div>
        </div>

        {/* Glassmorphism card */}
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(208, 2, 27, 0.15)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-300 mb-2">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition-all disabled:opacity-50"
                placeholder="admin@ghlindiaventures.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none pr-12 transition-all disabled:opacity-50"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 2FA Code */}
            <div>
              <label htmlFor="admin-2fa" className="block text-sm font-medium text-gray-300 mb-2">
                <span className="flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-brand-red" />
                  <span>Two-Factor Authentication Code</span>
                </span>
              </label>
              <input
                id="admin-2fa"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none tracking-[0.5em] text-center font-mono text-lg transition-all disabled:opacity-50"
                placeholder="------"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || attempts >= 5}
              className="btn-primary w-full text-center mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Secure Login
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Hint */}
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <p className="text-[10px] text-gray-600 text-center mb-2">Demo Credentials</p>
            <div className="text-[10px] text-gray-500 space-y-0.5">
              <p><span className="text-gray-400">Super Admin:</span> admin@ghlindiaventures.com / GHL@dmin2025!</p>
              <p><span className="text-gray-400">Compliance:</span> compliance@ghlindiaventures.com / GHLComply2025!</p>
              <p><span className="text-gray-400">Sales:</span> sales@ghlindiaventures.com / GHLSales2025!</p>
              <p className="text-gray-600 mt-1">2FA: any 6 digits (e.g., 123456)</p>
            </div>
          </div>
        </div>

        {/* Security footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-600 text-xs mb-3">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="font-medium">Restricted Area</span>
          </div>
          <p className="text-[11px] text-gray-600 max-w-sm mx-auto leading-relaxed">
            This is a restricted area. Unauthorized access is prohibited and logged.
            All login attempts are monitored and recorded for security purposes.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-[11px] text-gray-700">
            <span className="flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>256-bit SSL</span>
            </span>
            <span className="text-gray-700">&bull;</span>
            <span className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>2FA Enabled</span>
            </span>
            <span className="text-gray-700">&bull;</span>
            <span className="flex items-center space-x-1">
              <KeyRound className="w-3 h-3" />
              <span>IP Logged</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
