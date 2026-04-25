'use client'

/* ─────────────────────────────────────────────────────────────
   Admin Password Reset Modal — shared component used by the
   Client and Employee modules. Two flows:

     • Send reset link to user email (Supabase recover endpoint)
     • Set a temporary password (admin sets a value or we generate
       a strong one); user is forced to change it on next login.

   Calls the admin-password-reset Netlify function. Never stores
   plaintext passwords anywhere — the temp password is shown to
   the admin once for handoff and discarded.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { Mail, KeyRound, RefreshCw, Copy, CheckCircle2, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react'
import AdminModal, { ModalButton } from './AdminModal'
import { getAuthToken } from '@/lib/supabase/client'

const NETLIFY_FUNCTIONS_HOST = 'https://ghl-india-ventures-2025.netlify.app'

function getFunctionBase(): string {
  if (typeof window === 'undefined') return ''
  const origin = window.location.origin
  if (origin.includes('localhost')) return 'http://localhost:8888'
  if (origin.endsWith('.netlify.app')) return origin
  return NETLIFY_FUNCTIONS_HOST
}

export interface PasswordResetTarget {
  userId?: string | null
  email: string
  name?: string
}

interface PasswordResetModalProps {
  isOpen: boolean
  target: PasswordResetTarget | null
  onClose: () => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

type Method = 'email_link' | 'temp_password'

export default function PasswordResetModal({ isOpen, target, onClose, showToast }: PasswordResetModalProps) {
  const [method, setMethod] = useState<Method>('email_link')
  const [tempPassword, setTempPassword] = useState('')
  const [showTemp, setShowTemp] = useState(false)
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ tempPassword?: string; emailSent?: boolean; autoProvisioned?: boolean } | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      // Reset transient state when the modal closes so it never
      // re-opens with a stale temp password on screen.
      setMethod('email_link')
      setTempPassword('')
      setAutoGenerate(true)
      setShowTemp(false)
      setResult(null)
      setCopied(false)
      setError('')
      setSubmitting(false)
    }
  }, [isOpen])

  if (!target) return null

  const handleSubmit = async () => {
    setError('')
    if (method === 'temp_password' && !autoGenerate && tempPassword.length < 10) {
      setError('Temporary password must be at least 10 characters')
      return
    }

    setSubmitting(true)
    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Your admin session has expired. Please log in again.')
        setSubmitting(false)
        return
      }

      const body: Record<string, unknown> = { method }
      if (target.userId) body.targetUserId = target.userId
      else body.targetEmail = target.email
      if (method === 'temp_password' && !autoGenerate) body.tempPassword = tempPassword

      const res = await fetch(`${getFunctionBase()}/.netlify/functions/admin-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || `Reset failed (${res.status})`)
        setSubmitting(false)
        return
      }

      if (method === 'email_link') {
        setResult({ emailSent: true, autoProvisioned: !!data.autoProvisioned })
        showToast(
          data.autoProvisioned
            ? `Account created and invite sent to ${target.email}`
            : `Reset email sent to ${target.email}`,
          'success',
        )
      } else {
        setResult({ tempPassword: data.tempPassword, autoProvisioned: !!data.autoProvisioned })
        showToast(
          data.autoProvisioned
            ? 'Auth account created and temporary password set. Hand it off securely — it will not be shown again.'
            : 'Temporary password set. Hand it off securely — it will not be shown again.',
          'success',
        )
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const copyTemp = async () => {
    if (!result?.tempPassword) return
    try {
      await navigator.clipboard.writeText(result.tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Copy failed — please select and copy manually', 'warning')
    }
  }

  // ── Confirmation view (after reset) ──────────────────────────────
  if (result) {
    return (
      <AdminModal
        isOpen={isOpen}
        onClose={onClose}
        title="Password Reset Complete"
        subtitle={target.name || target.email}
        maxWidth="max-w-md"
        footer={
          <ModalButton variant="primary" onClick={onClose}>Done</ModalButton>
        }
      >
        {result.emailSent ? (
          <div className="space-y-3">
            {result.autoProvisioned && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
                <AlertTriangle className="w-3.5 h-3.5 text-blue-300 flex-shrink-0 mt-0.5" />
                <span>This client had no auth account — one was created automatically and an invitation email was sent.</span>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-emerald-200">
                {result.autoProvisioned
                  ? <>An invitation email has been sent to <span className="font-medium">{target.email}</span>. Ask the user to click the link in their inbox to set their password and sign in.</>
                  : <>A password reset link has been emailed to <span className="font-medium">{target.email}</span>. The link expires after a short window — ask the user to act on it promptly.</>}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {result.autoProvisioned && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
                <AlertTriangle className="w-3.5 h-3.5 text-blue-300 flex-shrink-0 mt-0.5" />
                <span>This client had no auth account — one was created automatically and the temporary password below was set on it.</span>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-200">
                This temporary password is shown <span className="font-semibold">once</span>. Hand it off through a secure channel.
                The user must change it on their next sign-in before they can use the app.
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] p-3">
              <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1.5">Temporary Password</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-md bg-black/40 font-mono text-sm text-white break-all">
                  {result.tempPassword}
                </code>
                <button
                  type="button"
                  onClick={copyTemp}
                  className="p-2 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 hover:text-white transition-colors"
                  title="Copy"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    )
  }

  // ── Form view ───────────────────────────────────────────────────
  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Password"
      subtitle={target.name ? `${target.name} — ${target.email}` : target.email}
      maxWidth="max-w-md"
      footer={
        <>
          <ModalButton onClick={onClose}>Cancel</ModalButton>
          <ModalButton variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Working…</span>
            ) : method === 'email_link' ? 'Send Reset Email' : 'Set Temporary Password'}
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => setMethod('email_link')}
            className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
              method === 'email_link'
                ? 'bg-brand-red/10 border-brand-red/30'
                : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
            }`}
          >
            <Mail className={`w-5 h-5 mt-0.5 ${method === 'email_link' ? 'text-brand-red' : 'text-gray-400'}`} />
            <div>
              <div className="text-sm font-medium text-white">Send password reset link</div>
              <div className="text-xs text-gray-400 mt-0.5">User receives an email with a Supabase reset link. They pick the new password themselves.</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMethod('temp_password')}
            className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
              method === 'temp_password'
                ? 'bg-brand-red/10 border-brand-red/30'
                : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
            }`}
          >
            <KeyRound className={`w-5 h-5 mt-0.5 ${method === 'temp_password' ? 'text-brand-red' : 'text-gray-400'}`} />
            <div>
              <div className="text-sm font-medium text-white">Set a temporary password</div>
              <div className="text-xs text-gray-400 mt-0.5">Hand off a one-time password. The user is forced to change it at next login.</div>
            </div>
          </button>
        </div>

        {method === 'temp_password' && (
          <div className="space-y-3 pt-1">
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input
                type="checkbox"
                checked={autoGenerate}
                onChange={(e) => setAutoGenerate(e.target.checked)}
                className="rounded border-gray-600 bg-white/[0.04] text-brand-red focus:ring-brand-red/40"
              />
              Auto-generate a strong password (recommended)
            </label>

            {!autoGenerate && (
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-gray-500 mb-1.5">Temporary Password</label>
                <div className="relative">
                  <input
                    type={showTemp ? 'text' : 'password'}
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Min. 10 characters"
                    className="w-full px-3 py-2 pr-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTemp(s => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300"
                    aria-label="Toggle visibility"
                  >
                    {showTemp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5">Use a generator if possible. The user is forced to change it on next login.</p>
              </div>
            )}

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-gray-400">
              <RefreshCw className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>The user&apos;s existing sessions will be revoked. They must sign in with the new password before using the app.</span>
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  )
}
