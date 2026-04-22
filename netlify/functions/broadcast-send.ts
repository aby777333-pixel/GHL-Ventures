/* ================================================================
   BROADCAST SEND — Netlify Serverless Function

   Sends a bulk broadcast (email + WhatsApp) to selected leads from
   the `broadcast_leads` table. Writes a campaign row and one
   `broadcast_deliveries` row per (recipient × channel), then
   updates campaign counters once all sends complete.

   Called from the Admin "Content & Support → Broadcast" UI.

   Required env:
     SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY

   Email (Resend) — optional if channel ∈ {email, both}:
     RESEND_API_KEY
     RESEND_FROM_EMAIL   (default noreply@ghlindiaventures.com)
     RESEND_REPLY_TO     (default info@ghlindiaventures.com)

   WhatsApp (Wati) — optional if channel ∈ {whatsapp, both}:
     WATI_API_ENDPOINT   (e.g. https://live-server-319019.wati.io)
     WATI_API_TOKEN      (Bearer token from Wati → API Docs)
     WATI_TEMPLATE_NAME  (optional — uses sendTemplateMessage when set)
     WATI_TEMPLATE_LANG  (optional — default en)
   ================================================================ */

import { createClient } from '@supabase/supabase-js'

const ALLOWED_ORIGINS = [
  'https://ghl-india-ventures-2025.netlify.app',
  'https://ghlindiaventures.com',
]

function cors(req?: Request) {
  const origin = req?.headers?.get('origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function esc(s: string) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

type ContentType = 'text' | 'image' | 'video' | 'pdf' | 'link' | 'blog' | 'html'
type Channel = 'email' | 'whatsapp' | 'both'

interface BroadcastBody {
  name: string                    // campaign name / internal label
  subject?: string                // email subject
  body: string                    // message body (plain text; HTML allowed when content_type='html')
  content_type?: ContentType
  attachment_url?: string         // public URL for media / pdf / link / blog
  channel: Channel
  lead_ids?: string[]             // if empty/absent, uses `all_leads=true` or ad-hoc recipients
  all_leads?: boolean
  ad_hoc?: Array<{ name?: string; email?: string; mobile?: string }>  // allow one-off sends
  created_by?: string             // profile id — optional audit
}

function formatEmailHtml(payload: { subject: string; body: string; content_type: ContentType; attachment_url?: string }) {
  const { body, content_type, attachment_url } = payload
  const isHtml = content_type === 'html'
  const mainHtml = isHtml
    ? body
    : esc(body).replace(/\n/g, '<br>')

  let mediaBlock = ''
  if (attachment_url) {
    const safeUrl = esc(attachment_url)
    if (content_type === 'image') {
      mediaBlock = `<div style="margin:18px 0;"><img src="${safeUrl}" alt="" style="max-width:100%; border-radius:8px; border:1px solid #eee;" /></div>`
    } else if (content_type === 'video') {
      mediaBlock = `<div style="margin:18px 0;"><a href="${safeUrl}" style="display:inline-block; padding:12px 20px; background:#D0021B; color:#fff; text-decoration:none; border-radius:8px; font-weight:700;">▶ Watch Video</a></div>`
    } else if (content_type === 'pdf') {
      mediaBlock = `<div style="margin:18px 0;"><a href="${safeUrl}" style="display:inline-block; padding:12px 20px; background:#0A0A0A; color:#fff; text-decoration:none; border-radius:8px; font-weight:700;">📄 Open PDF</a></div>`
    } else if (content_type === 'link' || content_type === 'blog') {
      mediaBlock = `<div style="margin:18px 0;"><a href="${safeUrl}" style="display:inline-block; padding:12px 20px; background:#D0021B; color:#fff; text-decoration:none; border-radius:8px; font-weight:700;">${content_type === 'blog' ? 'Read Full Article →' : 'Open Link →'}</a></div>`
    }
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background:#ffffff; border:1px solid #e5e5e5; border-radius:8px; overflow:hidden;">
      <div style="background:#0A0A0A; padding:20px; text-align:center;">
        <h1 style="color:#D0021B; margin:0; font-size:22px; font-weight:700;">GHL India Ventures</h1>
        <p style="color:#888; margin:6px 0 0; font-size:12px; letter-spacing:1px;">SEBI Registered Category II AIF</p>
      </div>
      <div style="padding:28px 24px;">
        <div style="color:#333; font-size:14px; line-height:1.7;">${mainHtml}</div>
        ${mediaBlock}
      </div>
      <div style="background:#f9f9f9; padding:16px; text-align:center; border-top:1px solid #eee;">
        <p style="color:#999; font-size:11px; margin:0; line-height:1.6;">
          GHL India Ventures Private Limited &bull; SEBI Reg: IN/AIF2/24-25/1517<br/>
          Queens Court, Egmore, Chennai 600008<br/>
          <a href="https://ghlindiaventures.com" style="color:#D0021B; text-decoration:none;">www.ghlindiaventures.com</a>
        </p>
      </div>
    </div>`
}

function buildWhatsAppText(body: string, attachment_url?: string) {
  const parts = [body.trim()]
  if (attachment_url) {
    parts.push('')
    parts.push(attachment_url.trim())
  }
  return parts.join('\n')
}

function e164ish(phone: string): string {
  // Accept "+91 98765 43210", "919876543210", "9876543210" → "919876543210"
  // Wati wants the phone number without the leading +, so we return digits.
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`
  if (digits.startsWith('91') && digits.length === 12) return digits
  return digits
}

interface SendResult {
  status: 'sent' | 'failed'
  error?: string
  provider_id?: string
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  cfg: { resendKey: string; fromEmail: string; replyToEmail: string },
): Promise<SendResult> {
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.resendKey}` },
      body: JSON.stringify({
        from: `GHL India Ventures <${cfg.fromEmail}>`,
        to: to.trim(),
        reply_to: cfg.replyToEmail,
        subject,
        html,
      }),
    })
    if (!resp.ok) {
      const raw = await resp.text()
      let msg = raw
      try { const j = JSON.parse(raw); msg = j.message || j.error || raw } catch { /* keep raw */ }
      return { status: 'failed', error: msg }
    }
    const j: any = await resp.json().catch(() => ({}))
    return { status: 'sent', provider_id: j?.id }
  } catch (err: any) {
    return { status: 'failed', error: err?.message || 'network error' }
  }
}

async function sendWhatsApp(
  phone: string,
  messageText: string,
  cfg: { endpoint: string; token: string; templateName: string; templateLang: string },
): Promise<SendResult> {
  const e164 = e164ish(phone)
  if (!e164) return { status: 'failed', error: 'Invalid phone number' }
  const base = cfg.endpoint.replace(/\/+$/, '')

  try {
    if (cfg.templateName) {
      // Template message — can be sent outside 24h session window.
      // Single {{1}} body variable = messageText.
      const url = `${base}/api/v1/sendTemplateMessage?whatsappNumber=${encodeURIComponent(e164)}`
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.token}` },
        body: JSON.stringify({
          template_name: cfg.templateName,
          broadcast_name: 'ghl_broadcast',
          parameters: [{ name: '1', value: messageText.slice(0, 900) }],
          language: cfg.templateLang,
        }),
      })
      const j: any = await resp.json().catch(() => ({}))
      if (!resp.ok || j?.result === false) {
        return { status: 'failed', error: j?.info || j?.error || `HTTP ${resp.status}` }
      }
      return { status: 'sent', provider_id: j?.messageId || j?.id }
    }

    // Free-form session message. Only works for contacts inside the 24h
    // conversation window — otherwise Wati will reject with a clear error.
    const url = `${base}/api/v1/sendSessionMessage/${encodeURIComponent(e164)}`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.token}` },
      body: JSON.stringify({ messageText }),
    })
    const j: any = await resp.json().catch(() => ({}))
    if (!resp.ok || j?.result === false) {
      return { status: 'failed', error: j?.info || j?.error || `HTTP ${resp.status}` }
    }
    return { status: 'sent', provider_id: j?.messageId || j?.id }
  } catch (err: any) {
    return { status: 'failed', error: err?.message || 'network error' }
  }
}

export default async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors(request) })
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...cors(request) } })
  }

  let body: BroadcastBody
  try {
    body = await request.json() as BroadcastBody
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...cors(request) } })
  }

  // ── Validate input ────────────────────────────────────────
  const channel: Channel = (body.channel === 'email' || body.channel === 'whatsapp' || body.channel === 'both') ? body.channel : 'both'
  const contentType: ContentType = (['text','image','video','pdf','link','blog','html'] as ContentType[]).includes(body.content_type as any)
    ? (body.content_type as ContentType)
    : 'text'

  if (!body.name?.trim()) {
    return new Response(JSON.stringify({ error: 'Campaign name is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...cors(request) } })
  }
  if (!body.body?.trim()) {
    return new Response(JSON.stringify({ error: 'Message body is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...cors(request) } })
  }
  if ((channel === 'email' || channel === 'both') && !body.subject?.trim()) {
    return new Response(JSON.stringify({ error: 'Email subject is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...cors(request) } })
  }

  // ── Supabase service client ──────────────────────────────
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Supabase service role not configured on the server' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...cors(request) } })
  }
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // ── Resolve recipient list ───────────────────────────────
  type Recipient = { id: string | null; name: string; email: string | null; mobile: string | null }
  let recipients: Recipient[] = []

  if (Array.isArray(body.ad_hoc) && body.ad_hoc.length > 0) {
    recipients = body.ad_hoc.map(r => ({
      id: null,
      name: (r.name || '').trim() || (r.email || r.mobile || 'Recipient'),
      email: r.email?.trim() || null,
      mobile: r.mobile?.trim() || null,
    }))
  } else if (Array.isArray(body.lead_ids) && body.lead_ids.length > 0) {
    const { data, error } = await sb.from('broadcast_leads')
      .select('id, name, email, mobile')
      .in('id', body.lead_ids)
    if (error) {
      return new Response(JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...cors(request) } })
    }
    recipients = (data || []).map(r => ({ id: r.id, name: r.name || '', email: r.email, mobile: r.mobile }))
  } else if (body.all_leads) {
    const { data, error } = await sb.from('broadcast_leads')
      .select('id, name, email, mobile')
    if (error) {
      return new Response(JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...cors(request) } })
    }
    recipients = (data || []).map(r => ({ id: r.id, name: r.name || '', email: r.email, mobile: r.mobile }))
  }

  if (recipients.length === 0) {
    return new Response(JSON.stringify({ error: 'No recipients selected' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...cors(request) } })
  }

  // ── Create campaign row ──────────────────────────────────
  const { data: campaign, error: campErr } = await sb.from('broadcast_campaigns').insert({
    name: body.name.trim(),
    subject: body.subject?.trim() || null,
    body: body.body.trim(),
    content_type: contentType,
    attachment_url: body.attachment_url?.trim() || null,
    channel,
    status: 'sending',
    recipient_count: recipients.length,
    created_by: body.created_by || null,
  }).select().single()
  if (campErr || !campaign) {
    return new Response(JSON.stringify({ error: campErr?.message || 'Failed to create campaign' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...cors(request) } })
  }

  // ── Config ───────────────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY || ''
  const fromEmail = (process.env.RESEND_FROM_EMAIL || 'noreply@ghlindiaventures.com').trim()
  const replyToEmail = (process.env.RESEND_REPLY_TO || 'info@ghlindiaventures.com').trim()

  const watiEndpoint = (process.env.WATI_API_ENDPOINT || '').trim()
  const watiToken = (process.env.WATI_API_TOKEN || '').trim()
  const watiTemplate = (process.env.WATI_TEMPLATE_NAME || '').trim()
  const watiLang = (process.env.WATI_TEMPLATE_LANG || 'en').trim()

  const subject = body.subject?.trim() || body.name.trim()
  const emailHtml = formatEmailHtml({ subject, body: body.body, content_type: contentType, attachment_url: body.attachment_url })
  const waText = buildWhatsAppText(body.body, body.attachment_url)

  // ── Send loop ────────────────────────────────────────────
  let sentCount = 0
  let failedCount = 0
  const deliveryRows: any[] = []

  for (const r of recipients) {
    // EMAIL
    if (channel === 'email' || channel === 'both') {
      const email = (r.email || '').trim()
      if (!email) {
        deliveryRows.push({
          campaign_id: campaign.id, lead_id: r.id, recipient_name: r.name, email: null, mobile: r.mobile,
          channel: 'email', status: 'skipped', error: 'No email on file', sent_at: null,
        })
      } else if (!resendKey) {
        deliveryRows.push({
          campaign_id: campaign.id, lead_id: r.id, recipient_name: r.name, email, mobile: r.mobile,
          channel: 'email', status: 'failed', error: 'RESEND_API_KEY not configured', sent_at: null,
        })
        failedCount++
      } else {
        const res = await sendEmail(email, subject, emailHtml, { resendKey, fromEmail, replyToEmail })
        deliveryRows.push({
          campaign_id: campaign.id, lead_id: r.id, recipient_name: r.name, email, mobile: r.mobile,
          channel: 'email', status: res.status, error: res.error || null, provider_id: res.provider_id || null,
          sent_at: res.status === 'sent' ? new Date().toISOString() : null,
        })
        res.status === 'sent' ? sentCount++ : failedCount++
      }
    }

    // WHATSAPP
    if (channel === 'whatsapp' || channel === 'both') {
      const mobile = (r.mobile || '').trim()
      if (!mobile) {
        deliveryRows.push({
          campaign_id: campaign.id, lead_id: r.id, recipient_name: r.name, email: r.email, mobile: null,
          channel: 'whatsapp', status: 'skipped', error: 'No mobile on file', sent_at: null,
        })
      } else if (!watiEndpoint || !watiToken) {
        deliveryRows.push({
          campaign_id: campaign.id, lead_id: r.id, recipient_name: r.name, email: r.email, mobile,
          channel: 'whatsapp', status: 'failed', error: 'WATI_API_ENDPOINT / WATI_API_TOKEN not configured', sent_at: null,
        })
        failedCount++
      } else {
        const res = await sendWhatsApp(mobile, waText, {
          endpoint: watiEndpoint, token: watiToken, templateName: watiTemplate, templateLang: watiLang,
        })
        deliveryRows.push({
          campaign_id: campaign.id, lead_id: r.id, recipient_name: r.name, email: r.email, mobile,
          channel: 'whatsapp', status: res.status, error: res.error || null, provider_id: res.provider_id || null,
          sent_at: res.status === 'sent' ? new Date().toISOString() : null,
        })
        res.status === 'sent' ? sentCount++ : failedCount++
      }
    }
  }

  // Persist all deliveries in one insert (best-effort; single row failure
  // shouldn't abort the whole batch — log & continue).
  if (deliveryRows.length > 0) {
    const { error: delErr } = await sb.from('broadcast_deliveries').insert(deliveryRows)
    if (delErr) console.error('[broadcast-send] Failed to persist deliveries:', delErr.message)
  }

  // Final campaign status
  const finalStatus = failedCount === 0
    ? 'sent'
    : sentCount === 0
      ? 'failed'
      : 'partial'

  const { error: updErr } = await sb.from('broadcast_campaigns').update({
    status: finalStatus,
    sent_count: sentCount,
    failed_count: failedCount,
    sent_at: new Date().toISOString(),
  }).eq('id', campaign.id)
  if (updErr) console.error('[broadcast-send] Failed to update campaign:', updErr.message)

  console.log(`[broadcast-send] Campaign ${campaign.id} — sent: ${sentCount}, failed: ${failedCount}, total deliveries: ${deliveryRows.length}`)

  return new Response(
    JSON.stringify({
      success: sentCount > 0,
      campaign_id: campaign.id,
      status: finalStatus,
      sent: sentCount,
      failed: failedCount,
      total_deliveries: deliveryRows.length,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...cors(request) } },
  )
}
