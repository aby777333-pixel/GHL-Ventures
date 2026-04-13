/* ================================================================
   SEND SMS OTP — Netlify Serverless Function

   Generates a 6-digit OTP, stores in Supabase, sends via Fast2SMS.
   Also checks mobile uniqueness against clients table.
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

function generateOTP(): string {
  // Secure random OTP using Web Crypto API (available in all modern runtimes)
  const arr = new Uint32Array(1)
  globalThis.crypto.getRandomValues(arr)
  return String(100000 + (arr[0] % 900000))
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
    const { mobile } = await request.json()

    const cleanMobile = (mobile || '').replace(/\D/g, '')
    if (cleanMobile.length !== 10) {
      return new Response(JSON.stringify({ error: 'Please enter a valid 10-digit mobile number.' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const fast2smsKey = process.env.MSG91_AUTH_KEY || ''
    const templateId = process.env.MSG91_TEMPLATE_ID || ''
    const senderId = process.env.MSG91_SENDER_ID || 'GHLAIF'

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    if (!fast2smsKey) {
      return new Response(JSON.stringify({ error: 'SMS service not configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check mobile uniqueness
    const { data: existingClients } = await supabase
      .from('clients')
      .select('id')
      .or(`phone.eq.${cleanMobile},phone.eq.+91${cleanMobile},phone.eq.+91 ${cleanMobile.slice(0,5)} ${cleanMobile.slice(5)}`)
      .limit(1)

    if (existingClients && existingClients.length > 0) {
      return new Response(JSON.stringify({ error: 'This mobile number is already registered. Please sign in instead.' }), {
        status: 409, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id')
      .or(`phone.eq.${cleanMobile},phone.eq.+91${cleanMobile},phone.eq.+91 ${cleanMobile.slice(0,5)} ${cleanMobile.slice(5)}`)
      .limit(1)

    if (existingProfiles && existingProfiles.length > 0) {
      return new Response(JSON.stringify({ error: 'This mobile number is already registered. Please sign in instead.' }), {
        status: 409, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    // Rate limit: 1 OTP per 60 seconds
    const { data: recent } = await supabase
      .from('sms_otp_codes')
      .select('created_at')
      .eq('mobile', cleanMobile)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (recent && recent.length > 0) {
      const lastSent = new Date(recent[0].created_at).getTime()
      const now = Date.now()
      if (now - lastSent < 60000) {
        const wait = Math.ceil((60000 - (now - lastSent)) / 1000)
        return new Response(JSON.stringify({ error: `Please wait ${wait} seconds before requesting a new OTP.` }), {
          status: 429, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
        })
      }
    }

    // Generate OTP
    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase.from('sms_otp_codes').insert({
      mobile: cleanMobile,
      code,
      expires_at: expiresAt,
    })

    if (insertError) {
      console.error('[send-sms-otp] Insert error:', insertError.message)
      return new Response(JSON.stringify({ error: 'Failed to generate OTP. Please try again.' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    // DLT Template: "Dear customer, Your OTP is {#var#} . Please do not share this code with anyone."
    // DLT Template ID: 1407175818803308914 | Sender: GHLAIF | Entity: 1401499410000070879
    const smsMessage = `Dear customer, Your OTP is ${code} . Please do not share this code with anyone.`

    let smsSuccess = false
    let smsError = ''

    // ── Fast2SMS DLT Manual Route (branded as GHLAIF) ─────────
    try {
      const payload = {
        route: 'dlt_manual',
        sender_id: senderId,
        message: smsMessage,
        language: 'english',
        flash: 0,
        numbers: cleanMobile,
        DLT_TE_ID: templateId,
      }
      console.log('[SMS OTP] Sending to:', cleanMobile, 'via Fast2SMS DLT route')

      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      console.log('[send-sms-otp] Fast2SMS DLT response:', JSON.stringify(body))

      if (body.return === true) {
        smsSuccess = true
      } else {
        smsError = typeof body.message === 'string' ? body.message : JSON.stringify(body.message || body)
      }
    } catch (err) {
      smsError = err instanceof Error ? err.message : String(err)
    }

    // ── Fallback: Fast2SMS OTP Route (works immediately, default branding) ──
    if (!smsSuccess) {
      console.warn('[send-sms-otp] DLT failed:', smsError, '— trying OTP route')
      try {
        const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': fast2smsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: code,
            flash: 0,
            numbers: cleanMobile,
          }),
        })
        const body = await res.json()
        console.log('[send-sms-otp] Fast2SMS OTP response:', JSON.stringify(body))
        if (body.return === true) {
          smsSuccess = true
        } else {
          smsError += ` | OTP route: ${body.message || JSON.stringify(body)}`
        }
      } catch (err) {
        smsError += ` | OTP route: ${err instanceof Error ? err.message : String(err)}`
      }
    }

    if (!smsSuccess) {
      await supabase
        .from('sms_otp_codes')
        .delete()
        .eq('mobile', cleanMobile)
        .eq('code', code)

      console.error('[send-sms-otp] All attempts failed:', smsError)
      return new Response(JSON.stringify({ error: 'Failed to send OTP. Please try again later.' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[send-sms-otp] Unhandled error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
    })
  }
}
