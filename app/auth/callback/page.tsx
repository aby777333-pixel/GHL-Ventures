'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import Logo from '@/components/Logo'

/**
 * Auth callback page — processes Supabase auth tokens from the URL
 * after OAuth redirect (Google, etc.), email verification, or password recovery.
 * Ensures a profile exists, then navigates to the appropriate page.
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'auth' | 'recovery'>('auth')

  useEffect(() => {
    async function handleCallback() {
      if (!isSupabaseConfigured()) {
        router.replace('/dashboard')
        return
      }

      try {
        // Detect recovery (password reset) flow from URL hash
        if (typeof window !== 'undefined') {
          const hash = window.location.hash
          if (hash.includes('type=recovery')) {
            setMode('recovery')
            // Supabase auto-exchanges the token — redirect to password update page
            // For now, redirect to login with a message since we don't have a
            // dedicated password-update page. The session is established so they
            // can update their password from their profile.
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
              await ensureProfile(session.user)
              router.replace('/dashboard/settings?password_reset=true')
              return
            }
          }
        }

        // Supabase client with detectSessionInUrl: true will automatically
        // pick up the tokens from the URL hash fragment (#access_token=...)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session?.user) {
          // Retry once — sometimes the session takes a moment to be established
          await new Promise(r => setTimeout(r, 1000))
          const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession()

          if (retryError || !retrySession?.user) {
            setError('Authentication failed. Please try signing in again.')
            setTimeout(() => router.replace('/login'), 3000)
            return
          }

          await ensureProfile(retrySession.user)
          await handleReferral(retrySession.user)
          router.replace('/dashboard')
          return
        }

        await ensureProfile(session.user)
        await handleReferral(session.user)
        router.replace('/dashboard')
      } catch {
        setError('Something went wrong. Redirecting to login...')
        setTimeout(() => router.replace('/login'), 3000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <section className="min-h-screen flex items-center justify-center bg-white pt-32">
      <div className="text-center">
        <div className="mx-auto mb-6 w-fit">
          <Logo size={54} />
        </div>
        {error ? (
          <>
            <p className="text-red-600 text-sm mb-2">{error}</p>
            <p className="text-brand-grey text-xs">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-brand-red mx-auto mb-4" />
            <p className="text-brand-grey text-sm">
              {mode === 'recovery' ? 'Processing password reset...' : 'Completing sign-in...'}
            </p>
          </>
        )}
      </div>
    </section>
  )
}

/**
 * Ensure a `profiles` row exists for the authenticated user.
 * OAuth users (Google, etc.) won't have one after first sign-in.
 */
async function ensureProfile(user: { id: string; email?: string; user_metadata?: Record<string, any> }) {
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existing) {
      const meta = user.user_metadata ?? {}
      await supabase.from('profiles').insert({
        id: user.id,
        full_name: meta.full_name || meta.name || user.email?.split('@')[0] || '',
        phone: meta.phone || null,
        role: 'client',
        avatar_url: meta.avatar_url || meta.picture || null,
      } as any)
    }

    // Also ensure a clients row exists so getClientSession() works
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!existingClient) {
      const meta = user.user_metadata ?? {}
      await supabase.from('clients').insert({
        user_id: user.id,
        full_name: meta.full_name || meta.name || user.email?.split('@')[0] || '',
        email: user.email || '',
        phone: meta.phone || null,
      } as any)

      // Auto-assign an RM to the new client (non-blocking)
      try {
        const { autoAssignRMToClient } = await import('@/lib/supabase/employeeService')
        autoAssignRMToClient(user.id)
      } catch { /* non-blocking */ }
    }
  } catch {
    // Non-blocking — profile creation can fail due to RLS, but auth still works
    console.warn('[auth/callback] Could not ensure profile exists')
  }
}

/**
 * Check for referral code in URL params and record the referral.
 * The ref code is passed from register page → Google OAuth → callback URL.
 */
async function handleReferral(user: { id: string; email?: string; user_metadata?: Record<string, any> }) {
  try {
    if (typeof window === 'undefined') return

    // Check URL search params for ref code
    const url = new URL(window.location.href)
    const refCode = url.searchParams.get('ref')
    if (!refCode || !refCode.startsWith('GHL-')) return

    const meta = user.user_metadata ?? {}
    const name = meta.full_name || meta.name || user.email?.split('@')[0] || 'New User'

    const { recordReferral } = await import('@/lib/supabase/dashboardDataService')
    await recordReferral(refCode, name, user.email || '')
  } catch {
    // Non-blocking
    console.warn('[auth/callback] Could not record referral')
  }
}
