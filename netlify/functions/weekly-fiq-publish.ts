/* ================================================================
   WEEKLY FIQ PUBLISH — Netlify Scheduled Function (V2)

   Runs every Monday at 04:30 UTC (= 10:00 IST). Behaviour:

     1. Find all financial_iq_posts where:
          is_published = false
          AND scheduled_for IS NOT NULL
          AND scheduled_for <= now()
     2. For each due post, flip is_published=true and set
        published_at = now().
     3. Call fiq-broadcast internally to email the new article to
        every active, non-opted-out client. Marks the post's
        email_sent_at once the send completes.

   Manual fire: POST /.netlify/functions/weekly-fiq-publish with
   header "x-admin-trigger: <ADMIN_MANUAL_TRIGGER_TOKEN>" — useful
   for catching up after downtime or for testing. When the admin
   token is unset, manual POSTs are rejected.

   Required env:
     SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY
     RESEND_API_KEY  (used by fiq-broadcast side-call)

   Optional:
     ADMIN_MANUAL_TRIGGER_TOKEN    (gate for manual HTTP fires)
   ================================================================ */

import { createClient } from '@supabase/supabase-js'

// Netlify V2 scheduled function — the `config.schedule` cron string
// tells the platform to invoke this at the given UTC schedule.
export const config = {
  schedule: '30 4 * * 1',            // Monday 04:30 UTC = 10:00 IST
}

async function run(trigger: 'scheduled' | 'manual') {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const siteBase = process.env.URL || 'https://ghl-india-ventures-2025.netlify.app'

  if (!supabaseUrl || !serviceKey) {
    return { ok: false, error: 'Supabase service role not configured' }
  }

  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const now = new Date().toISOString()

  const { data: due, error } = await sb
    .from('financial_iq_posts')
    .select('id, slug, title')
    .eq('is_published', false)
    .not('scheduled_for', 'is', null)
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })

  if (error) {
    console.error('[weekly-fiq-publish] fetch error:', error.message)
    return { ok: false, error: error.message }
  }

  if (!due || due.length === 0) {
    console.log(`[weekly-fiq-publish] ${trigger}: no posts due at ${now}`)
    return { ok: true, processed: 0, timestamp: now }
  }

  const processed: Array<{
    id: string
    slug: string
    title: string
    emailed?: number
    email_error?: string
  }> = []

  for (const post of due) {
    // 1. Publish. Optimistic guard on is_published=false in case a
    //    human raced us.
    const { data: upd, error: updErr } = await sb
      .from('financial_iq_posts')
      .update({ is_published: true, published_at: now })
      .eq('id', post.id)
      .eq('is_published', false)
      .select('id')
      .maybeSingle()
    if (updErr || !upd) {
      const msg = updErr?.message || 'already published'
      console.error(`[weekly-fiq-publish] publish skipped for ${post.slug}: ${msg}`)
      processed.push({ ...post, email_error: `publish failed: ${msg}` })
      continue
    }

    // 2. Trigger the broadcast. Email only from the cron — WhatsApp
    //    broadcasts require a pre-approved Meta template and should
    //    be initiated manually from the admin UI for now.
    try {
      const resp = await fetch(`${siteBase}/.netlify/functions/fiq-broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          client_ids: [],             // empty = all active, non-opted-out
          channels: ['email'],
          trigger: 'scheduled',
        }),
      })
      const j: any = await resp.json().catch(() => ({}))
      const sent = Array.isArray(j.results)
        ? j.results.filter((r: any) => r.status === 'sent' && r.channel === 'email').length
        : 0
      if (sent > 0) {
        await sb.from('financial_iq_posts').update({ email_sent_at: now }).eq('id', post.id)
      }
      processed.push({ ...post, emailed: sent })
      console.log(`[weekly-fiq-publish] ${post.slug}: published + emailed ${sent}`)
    } catch (e: any) {
      console.error(`[weekly-fiq-publish] broadcast error for ${post.slug}:`, e?.message)
      processed.push({ ...post, email_error: e?.message || 'network' })
    }
  }

  return { ok: true, processed: processed.length, posts: processed, timestamp: now }
}

export default async (request: Request) => {
  // Scheduled invocation — Netlify injects a special header on the
  // request so we can distinguish it from manual HTTP calls.
  const isScheduled = request.headers.get('x-netlify-event') === 'schedule'
    || request.headers.get('x-scheduled-function') === 'true'

  if (isScheduled) {
    const r = await run('scheduled')
    return new Response(JSON.stringify(r), {
      status: r.ok ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Manual HTTP fire — token-gated.
  const expected = process.env.ADMIN_MANUAL_TRIGGER_TOKEN
  const sent = request.headers.get('x-admin-trigger') || ''
  if (!expected || sent !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const r = await run('manual')
  return new Response(JSON.stringify(r), {
    status: r.ok ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  })
}
