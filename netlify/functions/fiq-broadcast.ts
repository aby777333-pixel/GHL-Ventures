/* ================================================================
   FIQ BROADCAST — Netlify Serverless Function

   Sends a Financial IQ article to selected clients via email and/or
   WhatsApp, and writes one row per (recipient × channel) into the
   fiq_broadcasts audit table. Invoked by:

     - The admin "Send to Clients" modal (trigger='manual')
     - The weekly cron (trigger='scheduled') via internal HTTP

   Required env:
     RESEND_API_KEY
     RESEND_FROM_EMAIL              (optional, default noreply@ghlindiaventures.com — must be on a Resend-verified domain)
     RESEND_REPLY_TO                (optional, default info@ghlindiaventures.com)
     SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY

   Optional env (for WhatsApp Cloud API — if unset, function returns
   wa.me click-to-chat links per recipient for the admin to open):
     WHATSAPP_API_TOKEN
     WHATSAPP_PHONE_NUMBER_ID
     WHATSAPP_TEMPLATE_NAME         (must be approved in Meta Business)
     WHATSAPP_TEMPLATE_LANGUAGE     (default en)
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

interface BroadcastBody {
  post_id: string
  client_ids: string[]                    // empty = all active, non-opted-out clients
  channels: Array<'email' | 'whatsapp'>
  trigger?: 'manual' | 'scheduled'
}

type BroadcastResult = {
  channel: 'email' | 'whatsapp'
  recipient: string
  client_id: string | null
  status: 'sent' | 'failed' | 'skipped'
  error?: string
  provider_id?: string
  wa_link?: string
}

function buildEmailHtml(post: any, articleUrl: string, unsubUrl: string) {
  const safeTitle = esc(post.title)
  const safeExcerpt = esc(post.excerpt || '')
  const safeCategory = esc(post.category || 'Financial IQ')

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background:#ffffff; border:1px solid #e5e5e5; border-radius:8px; overflow:hidden;">
      <div style="background:#0A0A0A; padding:20px; text-align:center;">
        <h1 style="color:#D0021B; margin:0; font-size:22px; font-weight:700;">GHL India Ventures</h1>
        <p style="color:#888; margin:6px 0 0; font-size:12px; letter-spacing:1px;">FINANCIAL IQ · ${safeCategory.toUpperCase()}</p>
      </div>
      <div style="padding:28px 24px;">
        <h2 style="color:#0A0A0A; font-size:22px; line-height:1.3; margin:0 0 14px;">${safeTitle}</h2>
        <p style="color:#444; font-size:14px; line-height:1.7; margin:0 0 22px;">${safeExcerpt}</p>
        <a href="${articleUrl}" style="display:inline-block; background:#D0021B; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:8px; font-size:14px; font-weight:700;">
          Read the full article →
        </a>
        <p style="color:#666; font-size:12px; margin:26px 0 0; line-height:1.6;">
          This is a weekly educational update from GHL India Ventures — SEBI Registered Category II AIF.
          Articles are produced by our research team and do not constitute investment advice. Past performance
          is not indicative of future results.
        </p>
      </div>
      <div style="background:#f9f9f9; padding:16px; text-align:center; border-top:1px solid #eee;">
        <p style="color:#999; font-size:11px; margin:0; line-height:1.6;">
          GHL India Ventures Private Limited · SEBI Reg: IN/AIF2/24-25/1517<br/>
          Queens Court, Egmore, Chennai 600008<br/>
          <a href="https://ghlindiaventures.com" style="color:#D0021B; text-decoration:none;">www.ghlindiaventures.com</a>
          &nbsp;·&nbsp;
          <a href="${unsubUrl}" style="color:#999; text-decoration:underline;">Unsubscribe</a>
        </p>
      </div>
    </div>`
}

function buildWhatsAppText(post: any, articleUrl: string) {
  const parts = [
    `*${post.title}*`,
    '',
    post.excerpt || '',
    '',
    `Read the full article: ${articleUrl}`,
    '',
    `— Financial IQ, GHL India Ventures`,
  ]
  return parts.join('\n')
}

function e164ish(phone: string): string {
  // Accept "+91 98765 43210", "919876543210", "9876543210" → "+919876543210".
  // Default country code +91 (India) if the number is 10 digits.
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`
  return phone.startsWith('+') ? phone : `+${digits}`
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

  const { post_id, client_ids, channels, trigger } = body
  if (!post_id) {
    return new Response(JSON.stringify({ error: 'post_id is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...cors(request) } })
  }
  const chanList = (channels || []).filter(c => c === 'email' || c === 'whatsapp')
  // chanList may legitimately be empty — in that case the broadcast is
  // "dashboard-only" and just posts in-app notifications. Email and
  // WhatsApp are optional escalation channels on top.

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Supabase service role not configured on the server' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...cors(request) } })
  }
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // 1. Load the article.
  const { data: post, error: postErr } = await sb
    .from('financial_iq_posts')
    .select('id, slug, title, excerpt, category, cover_image, author, is_published')
    .eq('id', post_id)
    .maybeSingle()
  if (postErr || !post) {
    return new Response(JSON.stringify({ error: postErr?.message || 'Post not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...cors(request) } })
  }

  // 2. Load the recipient client set. Empty client_ids = "all eligible".
  let clientQuery = sb.from('clients')
    .select('id, user_id, full_name, email, phone, newsletter_opt_out, is_active')
    .eq('is_active', true)
  if (client_ids && client_ids.length > 0) {
    clientQuery = clientQuery.in('id', client_ids)
  } else {
    clientQuery = clientQuery.eq('newsletter_opt_out', false)
  }
  const { data: clients, error: clientsErr } = await clientQuery
  if (clientsErr) {
    return new Response(JSON.stringify({ error: clientsErr.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...cors(request) } })
  }
  const recipients = clients || []
  if (recipients.length === 0) {
    return new Response(JSON.stringify({ results: [], message: 'No eligible recipients' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...cors(request) } })
  }

  const articleUrl = `https://ghlindiaventures.com/financial-iq/${post.slug}`
  const siteBase = process.env.URL || 'https://ghl-india-ventures-2025.netlify.app'

  // 3. Send per channel, per recipient. Results accumulated for audit + response.
  const resendKey = process.env.RESEND_API_KEY || ''
  // ghlindiaventures.com is verified on Resend (DKIM + SPF green). Send
  // from the branded address by default so Gmail/Outlook show a clean
  // "GHL India Ventures" sender and not an "on behalf of resend.dev"
  // strip. Override with RESEND_FROM_EMAIL if needed.
  const fromEmail = (process.env.RESEND_FROM_EMAIL || 'noreply@ghlindiaventures.com').trim()
  const replyToEmail = (process.env.RESEND_REPLY_TO || 'info@ghlindiaventures.com').trim()
  const waToken = process.env.WHATSAPP_API_TOKEN || ''
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
  const waTemplate = process.env.WHATSAPP_TEMPLATE_NAME || ''
  const waLang = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en'

  const results: BroadcastResult[] = []
  const auditRows: any[] = []

  const useAudit = (row: BroadcastResult) => {
    auditRows.push({
      post_id: post.id,
      client_id: row.client_id,
      channel: row.channel,
      recipient: row.recipient,
      status: row.status,
      trigger: trigger === 'scheduled' ? 'scheduled' : 'manual',
      error: row.error || null,
      provider_id: row.provider_id || null,
    })
  }

  for (const c of recipients) {
    // EMAIL
    if (chanList.includes('email')) {
      if (c.newsletter_opt_out) {
        const r: BroadcastResult = { channel: 'email', recipient: c.email || '', client_id: c.id, status: 'skipped', error: 'Opted out of newsletter' }
        results.push(r); useAudit(r)
      } else if (!c.email) {
        const r: BroadcastResult = { channel: 'email', recipient: '', client_id: c.id, status: 'skipped', error: 'No email on file' }
        results.push(r); useAudit(r)
      } else if (!resendKey) {
        const r: BroadcastResult = { channel: 'email', recipient: c.email, client_id: c.id, status: 'failed', error: 'RESEND_API_KEY not configured' }
        results.push(r); useAudit(r)
      } else {
        const unsubUrl = `${siteBase}/.netlify/functions/fiq-unsubscribe?cid=${encodeURIComponent(c.id)}`
        try {
          const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
            body: JSON.stringify({
              from: `GHL India Ventures <${fromEmail}>`,
              to: c.email.trim(),
              reply_to: replyToEmail,
              subject: `${post.title} — Financial IQ`,
              html: buildEmailHtml(post, articleUrl, unsubUrl),
              // One-click unsubscribe: satisfies Gmail/Yahoo 2024 bulk
              // sender rules and raises the "inbox" vs "promotions"
              // placement odds. The List-Unsubscribe-Post header pairs
              // with the function's existing GET unsubscribe endpoint.
              headers: {
                'List-Unsubscribe': `<${unsubUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            }),
          })
          if (!resp.ok) {
            const errText = await resp.text()
            let msg = errText
            try { const j = JSON.parse(errText); msg = j.message || j.error || errText } catch { /* keep */ }
            // If the sender domain gets unverified (DKIM/SPF changes),
            // Resend returns a "verified domain" error. Surface an
            // actionable hint instead of a raw message.
            const lower = msg.toLowerCase()
            if (lower.includes('testing emails') || lower.includes('verified domain')) {
              msg = `${msg}  ·  Fix: re-verify ${fromEmail.split('@')[1] || 'the sender domain'} at resend.com/domains.`
            }
            const r: BroadcastResult = { channel: 'email', recipient: c.email, client_id: c.id, status: 'failed', error: msg }
            results.push(r); useAudit(r)
          } else {
            const j: any = await resp.json().catch(() => ({}))
            const r: BroadcastResult = { channel: 'email', recipient: c.email, client_id: c.id, status: 'sent', provider_id: j.id }
            results.push(r); useAudit(r)
          }
        } catch (e: any) {
          const r: BroadcastResult = { channel: 'email', recipient: c.email, client_id: c.id, status: 'failed', error: e?.message || 'network' }
          results.push(r); useAudit(r)
        }
      }
    }

    // WHATSAPP
    if (chanList.includes('whatsapp')) {
      const phone = c.phone ? e164ish(c.phone) : ''
      if (!phone) {
        const r: BroadcastResult = { channel: 'whatsapp', recipient: '', client_id: c.id, status: 'skipped', error: 'No phone on file' }
        results.push(r); useAudit(r)
      } else if (waToken && waPhoneId && waTemplate) {
        // WhatsApp Cloud API — requires a pre-approved template with
        // two body variables: {{1}} = title, {{2}} = article URL.
        try {
          const resp = await fetch(`https://graph.facebook.com/v21.0/${waPhoneId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${waToken}` },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: phone.replace(/^\+/, ''),
              type: 'template',
              template: {
                name: waTemplate,
                language: { code: waLang },
                components: [{
                  type: 'body',
                  parameters: [
                    { type: 'text', text: post.title },
                    { type: 'text', text: articleUrl },
                  ],
                }],
              },
            }),
          })
          if (!resp.ok) {
            const errText = await resp.text()
            let msg = errText
            try { const j = JSON.parse(errText); msg = j.error?.message || errText } catch { /* keep */ }
            const r: BroadcastResult = { channel: 'whatsapp', recipient: phone, client_id: c.id, status: 'failed', error: msg }
            results.push(r); useAudit(r)
          } else {
            const j: any = await resp.json().catch(() => ({}))
            const r: BroadcastResult = { channel: 'whatsapp', recipient: phone, client_id: c.id, status: 'sent', provider_id: j.messages?.[0]?.id }
            results.push(r); useAudit(r)
          }
        } catch (e: any) {
          const r: BroadcastResult = { channel: 'whatsapp', recipient: phone, client_id: c.id, status: 'failed', error: e?.message || 'network' }
          results.push(r); useAudit(r)
        }
      } else {
        // No WhatsApp API configured → return a wa.me click-to-chat link.
        // Admin can click each link to open WhatsApp with a pre-filled message.
        const text = buildWhatsAppText(post, articleUrl)
        const waLink = `https://wa.me/${phone.replace(/^\+/, '')}?text=${encodeURIComponent(text)}`
        const r: BroadcastResult = {
          channel: 'whatsapp', recipient: phone, client_id: c.id,
          status: 'sent', wa_link: waLink,
          error: 'WA API not configured — wa.me link returned for manual click',
        }
        results.push(r); useAudit(r)
      }
    }
  }

  // 4. Persist audit log in one batch. Don't fail the response if audit fails;
  //    the admin still needs to see results.
  if (auditRows.length > 0) {
    const { error: auditErr } = await sb.from('fiq_broadcasts').insert(auditRows)
    if (auditErr) console.error('[fiq-broadcast] audit insert error:', auditErr.message)
  }

  // 5. Dashboard notifications — one per recipient (regardless of channel)
  //    so every client who was targeted sees the new article as an alert
  //    inside their investor dashboard. The notifications.user_id column
  //    references auth.users, so we skip clients without an auth account
  //    (legacy imports that haven't logged in yet).
  const notifRows = recipients
    .filter((c: any) => !!c.user_id)
    .map((c: any) => ({
      user_id: c.user_id,
      type: 'info',
      module: 'financial-iq',
      title: 'New Financial IQ article',
      message: `${post.title}${post.excerpt ? ' — ' + post.excerpt.slice(0, 180) : ''}`,
      link: `/financial-iq/${post.slug}`,
      metadata: {
        post_id: post.id,
        slug: post.slug,
        category: post.category || null,
        trigger: trigger === 'scheduled' ? 'scheduled' : 'manual',
      },
    }))

  let notifInserted = 0
  if (notifRows.length > 0) {
    const { error: notifErr, count } = await sb
      .from('notifications')
      .insert(notifRows, { count: 'exact' })
    if (notifErr) {
      console.error('[fiq-broadcast] notification insert error:', notifErr.message)
    } else {
      notifInserted = count ?? notifRows.length
    }
  }

  return new Response(
    JSON.stringify({ post_id: post.id, results, dashboard_notified: notifInserted }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...cors(request) } },
  )
}
