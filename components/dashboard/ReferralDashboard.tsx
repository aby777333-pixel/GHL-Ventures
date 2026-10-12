'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Gift,
  Copy,
  Check,
  Mail,
  Info,
} from 'lucide-react'
import {
  PartnerRole,
  PartnerDashboardResponse,
  fetchPartnerDashboard,
} from '@/lib/supabase/partnerDashboardService'

// Helper for Indian Rupee Formatting
function formatINR(n: number): string {
  if (!n || isNaN(n)) return '0'
  return new Intl.NumberFormat('en-IN').format(n)
}

function WhatsAppIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.529 1.764.814 2.791.814 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm3.385 8.163c-.144.405-.837.774-1.171.823-.312.045-.718.067-1.15-.072-.266-.086-.606-.214-1.04-.401-1.834-.792-3.029-2.651-3.12-2.772-.092-.121-.745-.992-.745-1.892 0-.9.471-1.343.639-1.527.168-.184.368-.23.491-.23.124 0 .247.001.355.006.114.006.267-.043.417.321.155.378.531 1.296.577 1.389.046.092.077.2.015.323-.061.123-.092.2-.184.308-.092.108-.194.24-.277.323-.092.092-.188.192-.081.376.107.184.477.787 1.024 1.274.704.628 1.298.822 1.482.914.184.092.292.077.4-.046.108-.123.461-.538.584-.722.123-.185.246-.154.415-.092.169.061 1.074.507 1.258.6.184.092.307.138.353.215.046.077.046.446-.098.851zM12.004 2C6.48 2 2 6.48 2 12c0 1.837.5 3.559 1.368 5.04L2 22l5.127-1.344A9.957 9.957 0 0012.004 22c5.523 0 10-4.48 10-10s-4.477-10-10-10z" />
    </svg>
  )
}

const HOW_IT_WORKS_STEPS = [
  {
    number: 1,
    title: 'Share Link',
    description: 'Share your unique referral link with friends and family',
  },
  {
    number: 2,
    title: 'They Register',
    description: 'Your referral signs up using your link',
  },
  {
    number: 3,
    title: 'They Invest',
    description: 'Once they complete an investment, you get notified',
  },
  {
    number: 4,
    title: 'You Earn',
    description: 'Receive referral bonus as per the slab above',
  },
]

export interface ReferralDashboardProps {
  theme?: 'dark' | 'light'
  isDark?: boolean
  authenticatedPartnerId?: string | null
  partnerName?: string
  partnerEmail?: string
  partnerPhone?: string
  authToken?: string
  showToast?: (msg: string, type?: 'success' | 'info') => void
  onNavigateTab?: (tab: string) => void
  targetRole?: PartnerRole
  isReferralSection?: boolean
}

export default function ReferralDashboard({
  isDark = false,
  authenticatedPartnerId,
  partnerName = '',
  authToken = '',
  showToast,
}: ReferralDashboardProps) {
  // Theme utility
  const t = (darkClass: string, lightClass: string) => (isDark ? darkClass : lightClass)

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PartnerDashboardResponse | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch real partner dashboard data
  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetchPartnerDashboard(authToken)
        if (isMounted && res && res.success) {
          setData(res)
        }
      } catch {
        // Fallback gracefully without breaking UI
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [authToken, authenticatedPartnerId])

  // Real referral code
  const referralCode = useMemo(() => {
    return (
      data?.partner?.referralCode ||
      authenticatedPartnerId ||
      (data?.partner as any)?.client_code ||
      'GHL666228'
    )
  }, [data?.partner, authenticatedPartnerId])

  // Real referral URL
  const referralLink = useMemo(() => {
    if (data?.partner?.referralLink) {
      return data.partner.referralLink
    }
    const origin =
      typeof window !== 'undefined' &&
      window.location.origin &&
      !window.location.origin.includes('localhost')
        ? window.location.origin
        : 'https://ghlindiaventures.com'
    return `${origin}/register?ref=${referralCode}`
  }, [data?.partner?.referralLink, referralCode])

  // Real referred users count
  const referredCount = useMemo(() => {
    return data?.kpis?.totalReferrals ?? (data?.referrals?.length ?? 0)
  }, [data?.kpis?.totalReferrals, data?.referrals])

  // Real earned rewards
  const earnedRewards = useMemo(() => {
    return data?.kpis?.totalCommission ?? data?.kpis?.paidCommission ?? 0
  }, [data?.kpis?.totalCommission, data?.kpis?.paidCommission])

  // Copy referral link
  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      showToast?.('Referral link copied to clipboard!', 'success')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    const text = `Join GHL India Ventures using my referral link: ${referralLink}`
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Share via Email
  const handleEmailShare = () => {
    const subject = 'Invitation to invest with GHL India Ventures'
    const body = `Hi,\n\nI would like to invite you to join GHL India Ventures.\n\nYou can register using my unique referral link:\n${referralLink}\n\nBest regards,\n${partnerName || ''}`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="space-y-6">
      {/* ─── Page Heading ─── */}
      <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${t('text-white', 'text-gray-900')}`}>
        Referral Program
      </h1>

      {/* ─── Two-Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ─── Left Card: Refer & Earn ─── */}
        <div
          className={`lg:col-span-7 rounded-2xl p-6 sm:p-8 border flex flex-col justify-between shadow-sm transition-all ${t(
            'bg-[#120606] border-white/10 shadow-black/40',
            'bg-white border-gray-200/80'
          )}`}
        >
          <div>
            {/* Header: Gift Icon + Subtitle */}
            <div className="flex items-center gap-3.5 mb-6">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${t(
                  'bg-red-950/40 border-red-500/20 text-brand-red',
                  'bg-red-50 border-red-100 text-brand-red'
                )}`}
              >
                <Gift className="w-5 h-5 text-brand-red" />
              </div>
              <div>
                <h2 className={`text-base font-bold leading-tight ${t('text-white', 'text-gray-900')}`}>
                  Refer & Earn
                </h2>
                <p className={`text-xs mt-0.5 ${t('text-gray-400', 'text-gray-500')}`}>
                  Invite investors, earn rewards
                </p>
              </div>
            </div>

            {/* Unique Referral Code */}
            <div className="mb-4">
              <p className={`text-xs font-normal mb-2 ${t('text-gray-400', 'text-gray-500')}`}>
                Your unique referral code
              </p>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-mono font-bold tracking-wide border ${t(
                  'bg-red-950/30 text-red-400 border-red-500/30',
                  'bg-red-50/80 text-brand-red border-red-200/70'
                )}`}
              >
                {referralCode}
              </div>
            </div>

            {/* Referral Link Box with Copy Button */}
            <div
              className={`rounded-xl px-4 py-3 border flex items-center justify-between gap-3 mb-5 transition-colors ${t(
                'bg-white/[0.03] border-white/10 hover:border-white/20',
                'bg-gray-50/70 border-gray-200/80 hover:border-gray-300'
              )}`}
            >
              <span className={`font-mono text-xs truncate select-all ${t('text-gray-300', 'text-gray-600')}`}>
                {referralLink}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                title="Copy referral link"
                className={`p-1 rounded-md transition-colors shrink-0 cursor-pointer ${t(
                  'text-gray-400 hover:text-white hover:bg-white/10',
                  'text-gray-400 hover:text-gray-700 hover:bg-gray-200/60'
                )}`}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* WhatsApp and Email Sharing Actions */}
            <div className="flex flex-wrap items-center gap-2.5 mb-8">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${t(
                  'bg-emerald-950/30 text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/50',
                  'bg-emerald-50/80 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                )}`}
              >
                <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleEmailShare}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${t(
                  'bg-blue-950/30 text-blue-400 border-blue-500/30 hover:bg-blue-950/50',
                  'bg-blue-50/80 text-blue-700 border-blue-200 hover:bg-blue-100'
                )}`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>
            </div>
          </div>

          {/* Stats: Referred & Earned */}
          <div className="flex items-center gap-12 mt-auto pt-4">
            <div>
              <p className={`text-xs ${t('text-gray-400', 'text-gray-500')}`}>
                Referred
              </p>
              <p className={`text-2xl sm:text-3xl font-bold tracking-tight mt-1 ${t('text-white', 'text-gray-900')}`}>
                {loading ? '0' : referredCount}
              </p>
            </div>
            <div>
              <p className={`text-xs ${t('text-gray-400', 'text-gray-500')}`}>
                Earned
              </p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-500 dark:text-emerald-400 mt-1">
                {loading ? '₹0' : (earnedRewards > 0 ? `₹${formatINR(earnedRewards)}` : '₹0')}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Right Card: Referral Reward Slab ─── */}
        <div
          className={`lg:col-span-5 rounded-2xl p-6 sm:p-7 border shadow-sm transition-all flex flex-col justify-between ${t(
            'bg-[#120606] border-white/10 shadow-black/40',
            'bg-white border-gray-200/80'
          )}`}
        >
          <div>
            <h3 className={`text-xs sm:text-sm font-semibold mb-4 ${t('text-gray-300', 'text-gray-700')}`}>
              Referral Reward Slab
            </h3>

            {/* Slab 1: Up to ₹5 Crore — 3% */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between mb-2.5 transition-colors ${t(
                'bg-white/[0.02] border-white/5',
                'bg-gray-50/80 border-gray-100'
              )}`}
            >
              <span className={`text-xs font-normal ${t('text-gray-300', 'text-gray-700')}`}>
                Up to ₹5 Crore
              </span>
              <span className="text-xs font-semibold text-brand-red">
                3%
              </span>
            </div>

            {/* Slab 2: ₹5.01 Crore and above — 4% */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between mb-2.5 transition-colors ${t(
                'bg-white/[0.02] border-white/5',
                'bg-gray-50/80 border-gray-100'
              )}`}
            >
              <span className={`text-xs font-normal ${t('text-gray-300', 'text-gray-700')}`}>
                ₹5.01 Crore and above
              </span>
              <span className="text-xs font-semibold text-brand-red">
                4%
              </span>
            </div>

            {/* Slab 3: Management Fee — 1% PA */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between mb-6 transition-colors ${t(
                'bg-emerald-950/20 border-emerald-900/30',
                'bg-emerald-50/60 border-emerald-100'
              )}`}
            >
              <span className={`text-xs font-normal ${t('text-gray-200', 'text-gray-800')}`}>
                Management Fee
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                1% PA
              </span>
            </div>

            {/* How It Works Steps */}
            <h4 className={`text-xs font-semibold mb-3.5 ${t('text-gray-300', 'text-gray-700')}`}>
              How It Works
            </h4>

            <div className="space-y-3.5">
              {HOW_IT_WORKS_STEPS.map((step) => (
                <div key={step.number} className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${t(
                      'bg-red-950/40 text-red-400 border border-red-500/20',
                      'bg-red-50 text-brand-red border border-red-100'
                    )}`}
                  >
                    {step.number}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold leading-tight ${t('text-white', 'text-gray-900')}`}>
                      {step.title}
                    </p>
                    <p className={`text-[11px] leading-tight mt-0.5 ${t('text-gray-400', 'text-gray-500')}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Disclaimer Card ─── */}
      <div
        className={`rounded-xl p-4 border flex items-start sm:items-center gap-2.5 shadow-sm transition-all ${t(
          'bg-[#120606] border-white/10 text-gray-400',
          'bg-white border-gray-200/80 text-gray-600'
        )}`}
      >
        <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-xs leading-relaxed">
          Referral rewards are subject to the successful onboarding and investment by the referred party. Terms and conditions apply. Contact your relationship manager for details on reward structure.
        </p>
      </div>
    </div>
  )
}
