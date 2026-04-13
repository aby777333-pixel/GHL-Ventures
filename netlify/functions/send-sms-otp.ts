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
    // DLT Template ID: 1407175818803308914
    const smsMessage = `Dear customer, Your OTP is ${code}. Please do not share this code with anyone.`

    let smsSuccess = false
    let successProvider = ''
    let successResponse = ''
    const errors: string[] = []

    // ── Attempt 1: Fast2SMS DLT Manual Route ───────────────────
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
      console.log('[send-sms-otp] Fast2SMS DLT request:', JSON.stringify(payload))

      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      const bodyStr = JSON.stringify(body)
      console.log('[send-sms-otp] Fast2SMS DLT response:', bodyStr)

      if (body.return === true) {
        smsSuccess = true
        successProvider = 'Fast2SMS DLT'
        successResponse = bodyStr
      } else {
        errors.push(`Fast2SMS DLT: ${body.message || bodyStr}`)
      }
    } catch (err) {
      errors.push(`Fast2SMS DLT: ${err instanceof Error ? err.message : String(err)}`)
    }

    // ── Attempt 2: Fast2SMS Quick Transactional ────────────────
    if (!smsSuccess) {
      try {
        const payload = {
          route: 'q',
          message: smsMessage,
          language: 'english',
          flash: 0,
          numbers: cleanMobile,
        }
        const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': authKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
        const body = await res.json()
        const bodyStr = JSON.stringify(body)
        console.log('[send-sms-otp] Fast2SMS Quick response:', bodyStr)

        if (body.return === true) {
          smsSuccess = true
          successProvider = 'Fast2SMS Quick'
          successResponse = bodyStr
        } else {
          errors.push(`Fast2SMS Quick: ${body.message || bodyStr}`)
        }
      } catch (err) {
        errors.push(`Fast2SMS Quick: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // ── Attempt 3: MSG91 OTP API ──────────────────────────────
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

    // ── Attempt 4: MSG91 Flow API ─────────────────────────────
    if (!smsSuccess) {
      try {
        const res = await fetch('https://control.msg91.com/api/v5/flow/', {
          method: 'POST',
          headers: {
            'authkey': authKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_id: templateId,
            sender: senderId,
            short_url: '0',
            mobiles: `91${cleanMobile}`,
            OTP: code,
            var1: code,
          }),
        })
        const body = await res.json()
        const bodyStr = JSON.stringify(body)
        console.log('[send-sms-otp] MSG91 Flow response:', bodyStr)

        if (res.ok && (body.type === 'success' || body.message === 'success')) {
          smsSuccess = true
          successProvider = 'MSG91 Flow'
          successResponse = bodyStr
        } else {
          errors.push(`MSG91 Flow: ${body.message || bodyStr}`)
        }
      } catch (err) {
        errors.push(`MSG91 Flow: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // ── All attempts failed ───────────────────────────────────
    if (!smsSuccess) {
      // Clean up the stored OTP since SMS failed
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

    // Return success with debug info (temporary — helps diagnose delivery issues)
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
