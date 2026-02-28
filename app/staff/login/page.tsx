'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Shield, Lock, Fingerprint, AlertCircle } from 'lucide-react'
import { loginStaff } from '@/lib/supabase/staffAuthService'
import Logo from '@/components/Logo'
import { BRAND } from '@/lib/constants'

export default function StaffLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [staffCode, setStaffCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const session = await loginStaff(email, password, staffCode)

      if (session) {
        router.push('/staff')
      } else {
        setError('Invalid credentials. Please check your email, password, and employee code.')
      }
    } catch {
      setError('Authentication service unavailable. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-500/[0.03] rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-teal-500/[0.03] rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <Logo size={48} />
          </div>
          <h1 className="text-white font-bold text-lg tracking-wider">{BRAND.name}</h1>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20">
            <Shield className="w-3 h-3 text-teal-400" />
            <span className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">Staff Portal</span>
          </div>
        </div>

        {/* Login Card */}
        <div
          className="rounded-2xl border border-white/[0.08] p-8 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(40px)',
          }}
        >
          <h2 className="text-white text-lg font-semibold mb-1">Employee Login</h2>
          <p className="text-gray-500 text-sm mb-6">Access the Customer Service & Employee Portal</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1.5">Employee Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@ghlindiaventures.com"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Staff Code */}
            <div>
              <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1.5">Employee Code</label>
              <input
                type="text"
                value={staffCode}
                onChange={e => setStaffCode(e.target.value.toUpperCase())}
                placeholder="GHL001"
                required
                maxLength={6}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 transition-all font-mono tracking-widest"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 hover:shadow-lg hover:shadow-teal-500/20"
              style={{ background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  Secure Login
                </span>
              )}
            </button>
          </form>

          {/* Biometric */}
          <div className="mt-4 flex justify-center">
            <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-400 transition-colors">
              <Fingerprint className="w-4 h-4" />
              Biometric Login
            </button>
          </div>

          {/* Forgot Password */}
          <div className="mt-3 text-center">
            <button className="text-xs text-gray-500 hover:text-teal-400 transition-colors">
              Forgot Password?
            </button>
          </div>
        </div>

        {/* Security Info */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-[10px] text-gray-600">
            GHL India Ventures — Internal Staff Access
          </p>
          <p className="text-[10px] text-gray-700">
            All activity is monitored and logged
          </p>
          <div className="flex items-center justify-center gap-3 text-[10px] text-gray-700">
            <span>256-bit SSL</span>
            <span>•</span>
            <span>Activity Logged</span>
            <span>•</span>
            <span>IP Monitored</span>
          </div>
        </div>
      </div>
    </div>
  )
}
