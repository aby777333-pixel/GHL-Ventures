/* ================================================================
   SEND OTP — Netlify Serverless Function

   Generates a 6-digit OTP, stores in Supabase, and sends via Resend.
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

function formatOTPEmailHtml(code: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5e5;">
      <div style="background: #0A0A0A; padding: 28px; text-align: center;">
        <h1 style="color: #D0021B; margin: 0; font-size: 22px; font-weight: 700;">GHL India Ventures</h1>
        <p style="color: #888; margin: 6px 0 0; font-size: 12px; letter-spacing: 1px;">SEBI Registered Category II AIF</p>
      </div>

      <div style="padding: 36px 28px; text-align: center;">
        <h2 style="color: #0A0A0A; font-size: 18px; margin-top: 0; margin-bottom: 8px;">Email Verification</h2>
        <p style="color: #666; font-size: 14px; margin-bottom: 28px;">
          Use the code below to verify your email address
        </p>

        <div style="background: #F8F8F8; border: 2px dashed #D0021B; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
          <p style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #0A0A0A; margin: 0; font-family: 'Courier New', monospace;">
            ${code}
          </p>
        </div>

        <p style="color: #999; font-size: 12px; margin-bottom: 4px;">This code expires in <strong>10 minutes</strong></p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>

      <div style="background: #f9f9f9; padding: 14px; text-align: center; border-top: 1px solid #eee;">
        <p style="color: #bbb; font-size: 10px; margin: 0;">
          GHL India Ventures Pvt Ltd &bull; SEBI Reg: IN/AIF2/24-25/1517
        </p>
      </div>
    </div>
  `
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
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    const resendKey = process.env.RESEND_API_KEY || ''
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Rate limit: max 1 OTP per email per 60 seconds
    const { data: recent } = await supabase
      .from('email_otp_codes')
      .select('created_at')
      .eq('email', email.toLowerCase())
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (recent && recent.length > 0) {
      const lastSent = new Date(recent[0].created_at).getTime()
      const now = Date.now()
      if (now - lastSent < 60000) {
        const wait = Math.ceil((60000 - (now - lastSent)) / 1000)
        return new Response(JSON.stringify({ error: `Please wait ${wait} seconds before requesting a new code` }), {
          status: 429, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
        })
      }
    }

    // Generate OTP and store
    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

    const { error: insertError } = await supabase.from('email_otp_codes').insert({
      email: email.toLowerCase(),
      code,
      expires_at: expiresAt,
    })

    if (insertError) {
      console.error('[send-otp] Insert error:', insertError.message)
      return new Response(JSON.stringify({ error: 'Failed to generate verification code' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'GHL India Ventures <noreply@ghlindiaventures.com>',
        to: email,
        subject: `${code} — Your GHL Verification Code`,
        html: formatOTPEmailHtml(code),
      }),
    })

    if (!emailRes.ok) {
      const errBody = await emailRes.text()
      console.error('[send-otp] Resend error:', errBody)
      return new Response(JSON.stringify({ error: 'Failed to send verification email' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
    })
  }
}
