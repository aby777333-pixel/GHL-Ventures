/* ================================================================
   SEND SMS OTP — Netlify Serverless Function

   Generates a 6-digit OTP, stores in Supabase, sends via MSG91.
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
    const msg91AuthKey = process.env.MSG91_AUTH_KEY || ''
    const msg91TemplateId = process.env.MSG91_TEMPLATE_ID || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    if (!msg91AuthKey) {
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

    // Send SMS via MSG91 API
    // DLT Template: "Dear customer, Your OTP is {#var#}. Please do not share this code with anyone."
    // DLT Template ID: 1407175818803308914
    let smsSuccess = false
    let smsError = ''

    // Attempt 1: MSG91 OTP API (dedicated OTP endpoint)
    try {
      const otpUrl = new URL('https://control.msg91.com/api/v5/otp')
      otpUrl.searchParams.set('template_id', msg91TemplateId)
      otpUrl.searchParams.set('mobile', `91${cleanMobile}`)
      otpUrl.searchParams.set('authkey', msg91AuthKey)
      otpUrl.searchParams.set('otp', code)
      otpUrl.searchParams.set('otp_expiry', '10')

      const smsRes = await fetch(otpUrl.toString(), { method: 'POST' })
      const smsBody = await smsRes.json()
      console.log('[send-sms-otp] MSG91 OTP response:', JSON.stringify(smsBody))

      if (smsRes.ok && smsBody.type === 'success') {
        smsSuccess = true
      } else {
        smsError = smsBody.message || 'MSG91 OTP API failed'
      }
    } catch (err) {
      smsError = err instanceof Error ? err.message : 'MSG91 OTP API error'
      console.error('[send-sms-otp] MSG91 OTP exception:', smsError)
    }

    // Attempt 2: MSG91 Flow API with DLT template variable
    if (!smsSuccess) {
      try {
        const smsRes = await fetch('https://control.msg91.com/api/v5/flow/', {
          method: 'POST',
          headers: {
            'authkey': msg91AuthKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_id: msg91TemplateId,
            sender: process.env.MSG91_SENDER_ID || 'GHLAIF',
            short_url: '0',
            mobiles: `91${cleanMobile}`,
            OTP: code,
            var1: code,
          }),
        })
        const smsBody = await smsRes.json()
        console.log('[send-sms-otp] MSG91 Flow response:', JSON.stringify(smsBody))

        if (smsRes.ok && (smsBody.type === 'success' || smsBody.message === 'success')) {
          smsSuccess = true
        } else {
          smsError = smsBody.message || 'MSG91 Flow API failed'
        }
      } catch (err) {
        smsError = err instanceof Error ? err.message : 'MSG91 Flow API error'
        console.error('[send-sms-otp] MSG91 Flow exception:', smsError)
      }
    }

    // Attempt 3: MSG91 SendHTTP API (legacy, broadest compatibility)
    if (!smsSuccess) {
      try {
        const message = encodeURIComponent(`Dear customer, Your OTP is ${code}. Please do not share this code with anyone.`)
        const httpUrl = `https://api.msg91.com/api/sendhttp.php?authkey=${msg91AuthKey}&mobiles=91${cleanMobile}&message=${message}&sender=${process.env.MSG91_SENDER_ID || 'GHLAIF'}&route=4&country=91&DLT_TE_ID=${msg91TemplateId}`

        const smsRes = await fetch(httpUrl, { method: 'GET' })
        const smsText = await smsRes.text()
        console.log('[send-sms-otp] MSG91 HTTP response:', smsText)

        // sendhttp returns a request ID string on success, or error JSON
        if (smsRes.ok && smsText && !smsText.includes('error') && !smsText.includes('Error')) {
          smsSuccess = true
        } else {
          smsError = smsText || 'MSG91 HTTP API failed'
        }
      } catch (err) {
        smsError = err instanceof Error ? err.message : 'MSG91 HTTP API error'
        console.error('[send-sms-otp] MSG91 HTTP exception:', smsError)
      }
    }

    if (!smsSuccess) {
      // Clean up the stored OTP since SMS failed
      await supabase
        .from('sms_otp_codes')
        .delete()
        .eq('mobile', cleanMobile)
        .eq('code', code)

      console.error('[send-sms-otp] All SMS attempts failed:', smsError)
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
