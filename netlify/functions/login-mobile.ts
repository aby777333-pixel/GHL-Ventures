/* ================================================================
   LOGIN WITH MOBILE — Netlify Serverless Function

   Resolves a 10-digit mobile number to the registered email via the
   clients table (service role), then performs Supabase password
   sign-in with the anon key and returns session tokens on success.

   Keeps the registered email private — never returned to the client.
   ================================================================ */

import { createClient } from '@supabase/supabase-js'

const ALLOWED_ORIGINS = [
  'https://ghl-india-ventures-2025.netlify.app',
  'https://ghlindiaventures.com',
  'http://localhost:3000',
]

function getCorsHeaders(request?: Request) {
  const origin = request?.headers?.get('origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

export default async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(request) })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
    })
  }

  const invalidCredentialsResponse = () =>
    new Response(JSON.stringify({ error: 'Incorrect mobile or password. Please try again.' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
    })

  try {
    const { mobile, password } = await request.json()

    const cleanMobile = String(mobile || '').replace(/\D/g, '')
    if (cleanMobile.length !== 10) {
      return new Response(JSON.stringify({ error: 'Please enter a valid 10-digit mobile number.' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }
    if (!password || typeof password !== 'string') {
      return invalidCredentialsResponse()
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'Authentication service unavailable. Please try again later.' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Look up the registered email by mobile number.
    // We match the same phone formats used during signup (raw 10 digits, +91 prefix, or formatted).
    const formatted = `+91 ${cleanMobile.slice(0, 5)} ${cleanMobile.slice(5)}`
    const { data: clients, error: lookupError } = await adminClient
      .from('clients')
      .select('email, user_id, is_active')
      .or(`phone.eq.${cleanMobile},phone.eq.+91${cleanMobile},phone.eq.+91${cleanMobile.slice(0, 5)}${cleanMobile.slice(5)},phone.eq.${formatted}`)
      .not('user_id', 'is', null)
      .limit(5)

    if (lookupError) {
      console.error('[login-mobile] Lookup error:', lookupError.message)
      return new Response(JSON.stringify({ error: 'Authentication service unavailable. Please try again later.' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    const match = (clients || []).find((c: any) => c?.email && c?.user_id && c?.is_active !== false)
    if (!match) {
      return invalidCredentialsResponse()
    }

    // Perform the actual password sign-in using the anon key (same auth path as email login).
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error: signInError } = await anonClient.auth.signInWithPassword({
      email: match.email as string,
      password,
    })

    if (signInError) {
      const msg = (signInError.message || '').toLowerCase()
      if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
        return new Response(JSON.stringify({ error: 'Please verify your email address. Check your inbox for the confirmation link.' }), {
          status: 403, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
        })
      }
      return invalidCredentialsResponse()
    }

    if (!data?.session) {
      return invalidCredentialsResponse()
    }

    return new Response(JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[login-mobile] Unhandled error:', message)
    return new Response(JSON.stringify({ error: 'Authentication service unavailable. Please try again later.' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
    })
  }
}
