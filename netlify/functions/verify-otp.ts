/* ================================================================
   VERIFY OTP — Netlify Serverless Function

   Checks the 6-digit code against the email_otp_codes table.
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

  try {
    const { email, code } = await request.json()

    if (!email || !code || code.length !== 6) {
      return new Response(JSON.stringify({ error: 'Email and 6-digit code required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find the most recent unverified code for this email
    const { data: otpRecord, error: fetchError } = await supabase
      .from('email_otp_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !otpRecord) {
      return new Response(JSON.stringify({ error: 'No verification code found. Please request a new one.' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Verification code has expired. Please request a new one.' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    // Check max attempts (5)
    if (otpRecord.attempts >= 5) {
      return new Response(JSON.stringify({ error: 'Too many failed attempts. Please request a new code.' }), {
        status: 429, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    // Verify code
    if (otpRecord.code !== code) {
      // Increment attempts
      await supabase
        .from('email_otp_codes')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id)

      const remaining = 4 - otpRecord.attempts
      return new Response(JSON.stringify({
        error: remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'Too many failed attempts. Please request a new code.',
      }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    // Mark as verified
    await supabase
      .from('email_otp_codes')
      .update({ verified: true })
      .eq('id', otpRecord.id)

    return new Response(JSON.stringify({ success: true, verified: true }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
    })
  }
}
