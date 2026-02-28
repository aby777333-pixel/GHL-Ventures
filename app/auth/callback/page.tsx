'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import Logo from '@/components/Logo'

/**
 * OAuth callback page — processes the Supabase auth tokens from the URL
 * after Google/Facebook/Twitter/LinkedIn redirect, ensures a profile exists,
 * then navigates to /dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    async function handleCallback() {
      if (!isSupabaseConfigured()) {
        router.replace('/dashboard')
        return
      }

      try {
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
          router.replace('/dashboard')
          return
        }

        await ensureProfile(session.user)
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
            <p className="text-brand-grey text-sm">Completing sign-in...</p>
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
    }
  } catch {
    // Non-blocking — profile creation can fail due to RLS, but auth still works
    console.warn('[auth/callback] Could not ensure profile exists')
  }
}
