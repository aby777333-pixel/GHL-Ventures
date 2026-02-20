'use client'

import { useState } from 'react'
import { BRAND } from '@/lib/constants'
import { Shield, Lock, Eye, EyeOff, AlertTriangle, KeyRound } from 'lucide-react'
import Logo from '@/components/Logo'

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFaCode, setTwoFaCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Admin login will be connected to your secure backend. This is a demo.')
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
          {/* Admin Access Only badge */}
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
            {/* Email */}
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-300 mb-2">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition-all"
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none pr-12 transition-all"
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
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none tracking-[0.5em] text-center font-mono text-lg transition-all"
                placeholder="------"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary w-full text-center mt-2">
              <Lock className="w-4 h-4 mr-2" />
              Secure Login
            </button>
          </form>
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
