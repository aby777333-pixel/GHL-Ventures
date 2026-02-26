/* ================================================================
   LEAD NOTIFICATION — Netlify Serverless Function

   Called after a form submission to send email notifications to
   the GHL team. Uses Resend API for email delivery.

   Set RESEND_API_KEY in Netlify Environment Variables to enable.
   Without it, the function logs the submission and returns success.
   ================================================================ */

interface LeadNotificationBody {
  fullName: string
  email?: string
  phone?: string
  source: string
  message?: string
  investmentInterest?: string
  investmentRange?: string
  city?: string
  pageUrl?: string
  formData?: Record<string, unknown>
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const NOTIFICATION_EMAILS = [
  'ghlindiaventures@gmail.com',
  'leads@ghlindiaventures.com',
  'aby777333@gmail.com',
]

function formatEmailHtml(lead: LeadNotificationBody): string {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  const sourceLabels: Record<string, string> = {
    contact_form: 'Contact Form',
    investment_inquiry: 'Investment Inquiry',
    callback_request: 'Callback Request',
    newsletter: 'Newsletter Signup',
    referral: 'Investor Referral',
    startup_apply: 'Startup Application',
    grievance: 'Grievance/Complaint',
    careers: 'Career Application',
    nri_invest: 'NRI Investment Inquiry',
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 8px; overflow: hidden;">
      <div style="background: #0A0A0A; padding: 20px; text-align: center;">
        <h1 style="color: #D0021B; margin: 0; font-size: 18px;">GHL India Ventures</h1>
        <p style="color: #888; margin: 4px 0 0; font-size: 12px;">New Lead Notification</p>
      </div>
      <div style="padding: 24px;">
        <h2 style="color: #333; font-size: 16px; margin-top: 0;">New ${sourceLabels[lead.source] || lead.source} Submission</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #666; width: 140px;">Name</td><td style="padding: 8px 0; color: #333; font-weight: 600;">${lead.fullName}</td></tr>
          ${lead.email ? `<tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:${lead.email}" style="color: #D0021B;">${lead.email}</a></td></tr>` : ''}
          ${lead.phone ? `<tr><td style="padding: 8px 0; color: #666;">Phone</td><td style="padding: 8px 0;"><a href="tel:${lead.phone}" style="color: #D0021B;">${lead.phone}</a></td></tr>` : ''}
          ${lead.city ? `<tr><td style="padding: 8px 0; color: #666;">City</td><td style="padding: 8px 0; color: #333;">${lead.city}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #666;">Source</td><td style="padding: 8px 0; color: #333;">${sourceLabels[lead.source] || lead.source}</td></tr>
          ${lead.investmentInterest ? `<tr><td style="padding: 8px 0; color: #666;">Interest</td><td style="padding: 8px 0; color: #333;">${lead.investmentInterest}</td></tr>` : ''}
          ${lead.investmentRange ? `<tr><td style="padding: 8px 0; color: #666;">Investment Range</td><td style="padding: 8px 0; color: #333;">${lead.investmentRange}</td></tr>` : ''}
          ${lead.message ? `<tr><td style="padding: 8px 0; color: #666; vertical-align: top;">Message</td><td style="padding: 8px 0; color: #333;">${lead.message}</td></tr>` : ''}
          ${lead.pageUrl ? `<tr><td style="padding: 8px 0; color: #666;">Page URL</td><td style="padding: 8px 0;"><a href="${lead.pageUrl}" style="color: #D0021B; font-size: 12px;">${lead.pageUrl}</a></td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #666;">Submitted At</td><td style="padding: 8px 0; color: #333;">${timestamp}</td></tr>
        </table>
      </div>
      <div style="background: #f0f0f0; padding: 12px; text-align: center; font-size: 11px; color: #999;">
        Automated notification from GHL India Ventures CRM &bull; SEBI Reg: IN/AIF2/24-25/1517
      </div>
    </div>
  `
}

export default async (request: Request) => {
  // Pre-flight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    )
  }

  try {
    const lead: LeadNotificationBody = await request.json()
    const resendKey = process.env.RESEND_API_KEY || ''

    if (!resendKey) {
      // No Resend API key configured — log and return success
      console.log('[lead-notification] No RESEND_API_KEY configured. Lead received:', JSON.stringify({
        name: lead.fullName,
        email: lead.email,
        source: lead.source,
        timestamp: new Date().toISOString(),
      }))
      return new Response(
        JSON.stringify({ success: true, emailsSent: false, reason: 'No RESEND_API_KEY configured' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
      )
    }

    // Send email to all notification recipients
    const html = formatEmailHtml(lead)
    const sourceLabels: Record<string, string> = {
      contact_form: 'Contact Form',
      investment_inquiry: 'Investment Inquiry',
      referral: 'Referral',
      startup_apply: 'Startup Application',
      grievance: 'Grievance',
      careers: 'Career Application',
    }
    const subject = `New Lead: ${lead.fullName} — ${sourceLabels[lead.source] || lead.source}`

    const results = await Promise.allSettled(
      NOTIFICATION_EMAILS.map(to =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'GHL India Ventures <noreply@ghlindiaventures.com>',
            to,
            subject,
            html,
          }),
        })
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return new Response(
      JSON.stringify({ success: true, emailsSent: true, sent, failed }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    )
  }
}
