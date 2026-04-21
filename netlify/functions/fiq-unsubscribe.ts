/* ================================================================
   FIQ UNSUBSCRIBE — Netlify Serverless Function

   One-click opt-out endpoint linked from every Financial IQ email
   footer. Flips clients.newsletter_opt_out=true and records the
   timestamp. Idempotent — safe to hit multiple times.

   Usage:
     GET /.netlify/functions/fiq-unsubscribe?cid=<client_uuid>

   Required env:
     SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY
   ================================================================ */

import { createClient } from '@supabase/supabase-js'

function page(title: string, message: string, detail?: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${title}</title>
<style>
  body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#0a0a0a;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
  .card{background:#141414;border:1px solid #262626;border-radius:16px;padding:32px 28px;max-width:440px;width:100%;text-align:center;}
  h1{font-size:20px;margin:12px 0 8px;color:#fff;}
  p{font-size:14px;color:#a1a1a1;line-height:1.6;margin:0 0 16px;}
  .accent{color:#D0021B;font-weight:700;}
  a{color:#fff;text-decoration:underline;}
  .brand{font-size:12px;letter-spacing:1.5px;color:#D0021B;font-weight:700;margin-bottom:4px;}
</style>
</head>
<body>
<div class="card">
  <div class="brand">GHL INDIA VENTURES</div>
  <h1>${title}</h1>
  <p>${message}</p>
  ${detail ? `<p style="font-size:12px;color:#666;">${detail}</p>` : ''}
  <p style="margin-top:20px;"><a href="https://ghlindiaventures.com">Return to our website</a></p>
</div>
</body>
</html>`
}

export default async (request: Request) => {
  const url = new URL(request.url)
  const cid = url.searchParams.get('cid') || ''

  if (!cid) {
    return new Response(
      page('Invalid link', 'The unsubscribe link is missing its client reference. If you were trying to opt out, please reply to the original email and we will remove you manually.'),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceKey) {
    return new Response(
      page('Unable to process', 'The server is not configured to handle unsubscribe requests right now. Please reply to the email and our team will remove you from the list.'),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }

  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const { data, error } = await sb
    .from('clients')
    .update({ newsletter_opt_out: true, newsletter_opt_out_at: new Date().toISOString() })
    .eq('id', cid)
    .select('id, full_name, email')
    .maybeSingle()

  if (error) {
    console.error('[fiq-unsubscribe] update error:', error.message)
    return new Response(
      page('Something went wrong', 'We could not process your request. Please reply to the email we sent and our team will remove you manually.', error.message),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }

  if (!data) {
    // The client id didn't match — still show a success page (don't leak whether an id exists).
    return new Response(
      page('You have been unsubscribed', 'You will no longer receive Financial IQ articles by email from GHL India Ventures.'),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }

  return new Response(
    page(
      'You have been unsubscribed',
      `${data.full_name || 'Your account'} will no longer receive Financial IQ articles by email. ` +
      `You can still access your investor dashboard and transactional emails (statements, KYC, support).`,
      'Changed your mind? Contact us at info@ghlindiaventures.com and we will add you back to the list.',
    ),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}
