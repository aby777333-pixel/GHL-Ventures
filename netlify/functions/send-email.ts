/* ================================================================
   SEND EMAIL — Netlify Serverless Function

   Called from the Admin Emailer to send emails via Resend API.
   Set RESEND_API_KEY in Netlify Environment Variables to enable.
   ================================================================ */

const ALLOWED_ORIGINS = [
  'https://ghl-india-ventures-2025.netlify.app',
  'https://ghlindiaventures.com',
  // 'http://localhost:3000',
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

function escapeHtml(str: string): string {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

interface SendEmailBody {
  recipients: string[]
  subject: string
  body: string
  senderName?: string
}

function formatEmailHtml(body: string): string {
  // Convert newlines to <br> for the email body
  const htmlBody = escapeHtml(body).replace(/\n/g, '<br>')

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5;">
      <div style="background: #0A0A0A; padding: 20px; text-align: center;">
        <h1 style="color: #D0021B; margin: 0; font-size: 22px; font-weight: 700;">GHL India Ventures</h1>
        <p style="color: #888; margin: 6px 0 0; font-size: 12px; letter-spacing: 1px;">SEBI Registered Category II AIF</p>
      </div>

      <div style="padding: 32px 28px;">
        <div style="color: #333; font-size: 14px; line-height: 1.8;">
          ${htmlBody}
        </div>
      </div>

      <div style="background: #f9f9f9; padding: 16px; text-align: center; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 11px; margin: 0; line-height: 1.6;">
          GHL India Ventures Private Limited &bull; SEBI Reg: IN/AIF2/24-25/1517<br>
          Queens Court, Egmore, Chennai 600008<br>
          <a href="https://ghl-india-ventures-2025.netlify.app" style="color: #D0021B; text-decoration: none;">www.ghlindiaventures.com</a>
        </p>
      </div>
    </div>
  `
}

export default async (request: Request) => {
  // Pre-flight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(request) })
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }

  try {
    const { recipients, subject, body, senderName }: SendEmailBody = await request.json()

    // Validate
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one recipient email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    if (!subject || !subject.trim()) {
      return new Response(
        JSON.stringify({ error: 'Subject is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    if (!body || !body.trim()) {
      return new Response(
        JSON.stringify({ error: 'Email body is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipients.filter(e => !emailRegex.test(e.trim()))
    if (invalidEmails.length > 0) {
      return new Response(
        JSON.stringify({ error: `Invalid email(s): ${invalidEmails.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    const resendKey = process.env.RESEND_API_KEY || ''

    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured. Set RESEND_API_KEY in Netlify environment variables.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    const fromName = senderName || 'GHL India Ventures'
    // FROM address is configurable via RESEND_FROM_EMAIL (must belong to a Resend-verified domain).
    // If the domain isn't verified, the Resend error is now surfaced back to the UI (see below).
    const fromEmail = (process.env.RESEND_FROM_EMAIL || 'noreply@ghlindiaventures.com').trim()
    const replyToEmail = (process.env.RESEND_REPLY_TO || 'info@ghlindiaventures.com').trim()
    const htmlContent = formatEmailHtml(body)

    // Send to each recipient
    const results = await Promise.allSettled(
      recipients.map(to =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: to.trim(),
            reply_to: replyToEmail,
            subject: subject.trim(),
            html: htmlContent,
          }),
        }).then(async res => {
          if (!res.ok) {
            const errText = await res.text()
            let parsed = errText
            try {
              const j = JSON.parse(errText)
              parsed = j.message || j.error || errText
            } catch { /* keep raw text */ }
            throw new Error(parsed)
          }
          return res.json()
        })
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason?.message || 'Unknown error')

    console.log(`[send-email] From: ${fromEmail} — Sent: ${sent}, Failed: ${failed}`)
    if (errors.length > 0) console.error('[send-email] Errors:', errors)

    // Build a single readable error string so the frontend can always surface the real reason.
    const errorMessage = errors.length > 0 ? errors.join(' | ') : undefined

    return new Response(
      JSON.stringify({
        success: sent > 0,
        sent,
        failed,
        total: recipients.length,
        ...(errorMessage ? { error: errorMessage, errors } : {}),
      }),
      { status: sent > 0 ? 200 : 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[send-email] Error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }
}
