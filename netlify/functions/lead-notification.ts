/* ================================================================
   LEAD NOTIFICATION — Netlify Serverless Function

   Called after a form submission to:
   1. Send email notifications to the GHL team
   2. Send a confirmation email to the client

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

const SOURCE_LABELS: Record<string, string> = {
  contact_form: 'Contact Form',
  contact: 'Contact Form',
  investment_inquiry: 'Investment Inquiry',
  investment: 'Investment Consultation',
  callback_request: 'Callback Request',
  newsletter: 'Newsletter Signup',
  referral: 'Investor Referral',
  refer_investor: 'Investor Referral',
  startup_apply: 'Startup Application',
  'startup-funding': 'Startup Funding',
  grievance: 'Grievance/Complaint',
  career_application: 'Career Application',
  careers: 'Career Application',
  nri_invest: 'NRI Investment Inquiry',
  'nri-investment': 'NRI Investment Inquiry',
  'fund-info': 'Fund Information',
  'land-broker': 'Land Broker Inquiry',
  'realty-broker': 'Realty Broker Inquiry',
  partnership: 'Partnership Inquiry',
  general: 'General Inquiry',
}

// ── Internal notification email (to GHL team) ──────────────
function formatTeamEmailHtml(lead: LeadNotificationBody): string {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 8px; overflow: hidden;">
      <div style="background: #0A0A0A; padding: 20px; text-align: center;">
        <h1 style="color: #D0021B; margin: 0; font-size: 18px;">GHL India Ventures</h1>
        <p style="color: #888; margin: 4px 0 0; font-size: 12px;">New Lead Notification</p>
      </div>
      <div style="padding: 24px;">
        <h2 style="color: #333; font-size: 16px; margin-top: 0;">New ${SOURCE_LABELS[lead.source] || lead.source} Submission</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #666; width: 140px;">Name</td><td style="padding: 8px 0; color: #333; font-weight: 600;">${lead.fullName}</td></tr>
          ${lead.email ? `<tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:${lead.email}" style="color: #D0021B;">${lead.email}</a></td></tr>` : ''}
          ${lead.phone ? `<tr><td style="padding: 8px 0; color: #666;">Phone</td><td style="padding: 8px 0;"><a href="tel:${lead.phone}" style="color: #D0021B;">${lead.phone}</a></td></tr>` : ''}
          ${lead.city ? `<tr><td style="padding: 8px 0; color: #666;">City</td><td style="padding: 8px 0; color: #333;">${lead.city}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #666;">Source</td><td style="padding: 8px 0; color: #333;">${SOURCE_LABELS[lead.source] || lead.source}</td></tr>
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

// ── Client confirmation email ──────────────────────────────
function formatClientConfirmationHtml(lead: LeadNotificationBody): string {
  const firstName = lead.fullName.split(' ')[0] || 'there'
  const sourceLabel = SOURCE_LABELS[lead.source] || 'inquiry'

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5;">
      <div style="background: #0A0A0A; padding: 24px; text-align: center;">
        <h1 style="color: #D0021B; margin: 0; font-size: 22px; font-weight: 700;">GHL India Ventures</h1>
        <p style="color: #aaa; margin: 6px 0 0; font-size: 12px; letter-spacing: 1px;">SEBI Registered Category II AIF</p>
      </div>

      <div style="padding: 32px 24px;">
        <h2 style="color: #0A0A0A; font-size: 18px; margin-top: 0; margin-bottom: 16px;">
          Thank you, ${firstName}!
        </h2>

        <p style="color: #444; font-size: 14px; line-height: 1.7; margin-bottom: 16px;">
          We have received your <strong>${sourceLabel.toLowerCase()}</strong> and a member of our team will be in touch with you shortly.
        </p>

        <div style="background: #FDF2F2; border-left: 4px solid #D0021B; padding: 16px 20px; border-radius: 0 6px 6px 0; margin-bottom: 20px;">
          <p style="color: #333; font-size: 14px; margin: 0; font-weight: 600;">
            What happens next?
          </p>
          <ul style="color: #555; font-size: 13px; line-height: 1.8; margin: 8px 0 0; padding-left: 18px;">
            <li>A dedicated relationship manager from GHL will contact you within <strong>24–48 business hours</strong></li>
            <li>We will schedule a consultation at a time convenient for you</li>
            <li>All your information is kept strictly confidential</li>
          </ul>
        </div>

        <p style="color: #444; font-size: 14px; line-height: 1.7; margin-bottom: 20px;">
          In the meantime, feel free to explore our website or reach out to us directly:
        </p>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
          <tr>
            <td style="padding: 6px 0; color: #888;">Phone</td>
            <td style="padding: 6px 0;"><a href="tel:+917200255252" style="color: #D0021B; text-decoration: none;">+91 72002 55252</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888;">Email</td>
            <td style="padding: 6px 0;"><a href="mailto:ghlindiaventures@gmail.com" style="color: #D0021B; text-decoration: none;">ghlindiaventures@gmail.com</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888;">WhatsApp</td>
            <td style="padding: 6px 0;"><a href="https://wa.me/917200255252" style="color: #D0021B; text-decoration: none;">Chat with us</a></td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://ghl-india-ventures-2025.netlify.app" style="display: inline-block; background: #D0021B; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Visit Our Website
          </a>
        </div>
      </div>

      <div style="background: #f9f9f9; padding: 16px; text-align: center; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 11px; margin: 0; line-height: 1.6;">
          GHL India Ventures Private Limited &bull; SEBI Reg: IN/AIF2/24-25/1517<br>
          Queens Court, Egmore, Chennai 600008<br>
          <a href="https://ghl-india-ventures-2025.netlify.app/disclaimer" style="color: #999; text-decoration: underline;">Disclaimer</a> &bull;
          <a href="https://ghl-india-ventures-2025.netlify.app" style="color: #999; text-decoration: underline;">Website</a>
        </p>
      </div>
    </div>
  `
}

function getClientEmailSubject(source: string): string {
  const subjects: Record<string, string> = {
    contact_form: 'Thank you for contacting GHL India Ventures',
    contact: 'Thank you for contacting GHL India Ventures',
    investment: 'Your investment consultation request — GHL India Ventures',
    investment_inquiry: 'Your investment inquiry — GHL India Ventures',
    referral: 'Thank you for your referral — GHL India Ventures',
    refer_investor: 'Thank you for your referral — GHL India Ventures',
    startup_apply: 'Your startup application has been received — GHL India Ventures',
    'startup-funding': 'Your startup application has been received — GHL India Ventures',
    grievance: 'Your grievance has been registered — GHL India Ventures',
    career_application: 'Your application has been received — GHL India Ventures',
    careers: 'Your application has been received — GHL India Ventures',
    nri_invest: 'Your NRI consultation request — GHL India Ventures',
    'nri-investment': 'Your NRI consultation request — GHL India Ventures',
  }
  return subjects[source] || 'Thank you for reaching out — GHL India Ventures'
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

    // ── 1. Send notification to GHL team ──────────────────────
    const teamHtml = formatTeamEmailHtml(lead)
    const teamSubject = `New Lead: ${lead.fullName} — ${SOURCE_LABELS[lead.source] || lead.source}`

    const teamEmails = NOTIFICATION_EMAILS.map(to =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'GHL India Ventures <noreply@ghlindiaventures.com>',
          to,
          subject: teamSubject,
          html: teamHtml,
        }),
      })
    )

    // ── 2. Send confirmation to client ────────────────────────
    const clientEmails: Promise<Response>[] = []
    if (lead.email) {
      const clientHtml = formatClientConfirmationHtml(lead)
      const clientSubject = getClientEmailSubject(lead.source)
      clientEmails.push(
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'GHL India Ventures <noreply@ghlindiaventures.com>',
            to: lead.email,
            subject: clientSubject,
            html: clientHtml,
          }),
        })
      )
    }

    const results = await Promise.allSettled([...teamEmails, ...clientEmails])
    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return new Response(
      JSON.stringify({ success: true, emailsSent: true, sent, failed, clientNotified: clientEmails.length > 0 }),
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
