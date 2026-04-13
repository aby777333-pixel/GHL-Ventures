/* ================================================================
   SEND SMS OTP — Netlify Serverless Function

   Generates a 6-digit OTP, stores in Supabase, sends via SMS.
   Tries Fast2SMS (DLT) → MSG91 OTP → MSG91 Flow as fallbacks.
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
  const digits = '0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += digits[Math.floor(Math.random() * 10)]
  }
  return code
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

    // Validate mobile: must be exactly 10 digits
    const cleanMobile = (mobile || '').replace(/\D/g, '')
    if (cleanMobile.length !== 10) {
      return new Response(JSON.stringify({ error: 'Please enter a valid 10-digit mobile number.' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const authKey = process.env.MSG91_AUTH_KEY || ''
    const templateId = process.env.MSG91_TEMPLATE_ID || ''
    const senderId = process.env.MSG91_SENDER_ID || 'GHLAIF'
    const entityId = process.env.MSG91_ENTITY_ID || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    if (!authKey) {
      return new Response(JSON.stringify({ error: 'SMS service not configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check mobile uniqueness: reject if already registered
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

    // Also check profiles table
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

    // Rate limit: max 1 OTP per mobile per 60 seconds
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

    // Generate OTP and store
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

    // DLT Template: "Dear customer, Your OTP is {#var#}. Please do not share this code with anyone."
    // BSNL DLT Template ID: 1407175818803308914
    // BSNL DLT Entity ID: 1401499410000070879
    const smsMessage = `Dear customer, Your OTP is ${code}. Please do not share this code with anyone.`

    let smsSuccess = false
    let successProvider = ''
    let successResponse = ''
    const errors: string[] = []

    // ── Attempt 1: MSG91 Send SMS v2 API (supports DLT_TE_ID explicitly) ──
    try {
      const payload = {
        sender: senderId,
        route: '4',
        country: '91',
        DLT_TE_ID: templateId,
        sms: [{
          message: smsMessage,
          to: [cleanMobile],
        }],
      }
      console.log('[send-sms-otp] MSG91 v2 request:', JSON.stringify(payload))

      const res = await fetch('https://api.msg91.com/api/v2/sendsms', {
        method: 'POST',
        headers: {
          'authkey': authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      const bodyStr = JSON.stringify(body)
      console.log('[send-sms-otp] MSG91 v2 response:', bodyStr)

      if (body.type === 'success' || body.message === '1 SMS sent successfully') {
        smsSuccess = true
        successProvider = 'MSG91 v2 SMS'
        successResponse = bodyStr
      } else {
        errors.push(`MSG91 v2: ${body.message || bodyStr}`)
      }
    } catch (err) {
      errors.push(`MSG91 v2: ${err instanceof Error ? err.message : String(err)}`)
    }

    // ── Attempt 2: MSG91 SendHTTP (legacy, explicit DLT_TE_ID in URL) ─────
    if (!smsSuccess) {
      try {
        const params = new URLSearchParams({
          authkey: authKey,
          mobiles: `91${cleanMobile}`,
          message: smsMessage,
          sender: senderId,
          route: '4',
          country: '91',
          DLT_TE_ID: templateId,
        })
        const res = await fetch(`https://api.msg91.com/api/sendhttp.php?${params.toString()}`)
        const text = await res.text()
        console.log('[send-sms-otp] MSG91 sendhttp response:', text)

        // sendhttp returns a numeric request ID on success, error messages otherwise
        if (res.ok && text && /^[a-f0-9]{20,}$/i.test(text.trim())) {
          smsSuccess = true
          successProvider = 'MSG91 sendhttp'
          successResponse = text.trim()
        } else {
          errors.push(`MSG91 sendhttp: ${text}`)
        }
      } catch (err) {
        errors.push(`MSG91 sendhttp: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // ── Attempt 3: MSG91 OTP API (may use MSG91's internal template) ──────
    if (!smsSuccess) {
      try {
        const otpUrl = new URL('https://control.msg91.com/api/v5/otp')
        otpUrl.searchParams.set('template_id', templateId)
        otpUrl.searchParams.set('mobile', `91${cleanMobile}`)
        otpUrl.searchParams.set('authkey', authKey)
        otpUrl.searchParams.set('otp', code)
        otpUrl.searchParams.set('otp_expiry', '10')

        const res = await fetch(otpUrl.toString(), { method: 'POST' })
        const body = await res.json()
        const bodyStr = JSON.stringify(body)
        console.log('[send-sms-otp] MSG91 OTP response:', bodyStr)

        if (res.ok && body.type === 'success') {
          smsSuccess = true
          successProvider = 'MSG91 OTP'
          successResponse = bodyStr
        } else {
          errors.push(`MSG91 OTP: ${body.message || bodyStr}`)
        }
      } catch (err) {
        errors.push(`MSG91 OTP: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // ── All attempts failed ───────────────────────────────────
    if (!smsSuccess) {
      await supabase
        .from('sms_otp_codes')
        .delete()
        .eq('mobile', cleanMobile)
        .eq('code', code)

      const debugInfo = errors.join(' | ')
      console.error('[send-sms-otp] ALL attempts failed:', debugInfo)
      return new Response(JSON.stringify({
        error: 'Failed to send OTP. Please try again later.',
        debug: debugInfo,
      }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    console.log(`[send-sms-otp] SUCCESS via ${successProvider}: ${successResponse}`)
    return new Response(JSON.stringify({
      success: true,
      _provider: successProvider,
      _response: successResponse,
      _errors: errors.length > 0 ? errors : undefined,
    }), {
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
