/* ================================================================
   MATURITY REMINDER — scheduled Netlify function

   Pending 30-04-2026 #12.i. Runs daily at 17:00 IST (11:30 UTC) and
   sends a WhatsApp reminder to every investor whose investment
   maturity_date is exactly one calendar month from today (so they
   get a 30-day heads-up to plan renewal / redemption).

   Behaviour:
     - Pulls investment_applications where status IN
       ('approved','credited','completed') AND maturity_date is set.
     - Filters to those where maturity_date == today + 1 month.
     - Joins clients to get the investor's name + phone number.
     - Calls /.netlify/functions/whatsapp-send for each match.
     - De-duplicates on a metadata flag so the same investor isn't
       reminded twice (writes a row into notifications with
       metadata.reminder_kind='maturity_30d_<app_id>').

   Manual fire (for testing): POST to this function. Returns a
   summary { processed, sent, failed, errors[] }.
   ================================================================ */

import { createClient } from '@supabase/supabase-js'

// Netlify v2 scheduled function — daily at 11:30 UTC = 17:00 IST.
// Cron in UTC because Netlify schedules don't honour timezones.
export const config = {
  schedule: '30 11 * * *',
}

type DbApp = {
  id: string
  client_id: string | null
  fund_vehicle: string | null
  investment_amount: number | null
  final_investment_amount: number | null
  maturity_date: string | null
  status: string
}

type DbClient = {
  id: string
  full_name: string | null
  phone: string | null
}

function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return d }
}

function fmtINR(n: number): string {
  try { return new Intl.NumberFormat('en-IN').format(n) } catch { return String(n) }
}

// Today + 1 calendar month, returned as YYYY-MM-DD (UTC).
function targetMaturityDate(): string {
  const d = new Date()
  d.setUTCMonth(d.getUTCMonth() + 1)
  return d.toISOString().split('T')[0]
}

async function sendWhatsApp(
  siteBase: string,
  to: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${siteBase}/.netlify/functions/whatsapp-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, text }),
    })
    if (!res.ok) {
      const t = await res.text()
      return { ok: false, error: `whatsapp ${res.status}: ${t}` }
    }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'fetch failed' }
  }
}

async function run(trigger: 'scheduled' | 'manual') {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const siteBase = process.env.URL || 'https://ghl-india-ventures-2025.netlify.app'

  if (!supabaseUrl || !serviceKey) {
    return { ok: false, error: 'Supabase service role not configured' }
  }

  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const target = targetMaturityDate()

  const { data: apps, error: appsErr } = await sb
    .from('investment_applications')
    .select('id, client_id, fund_vehicle, investment_amount, final_investment_amount, maturity_date, status')
    .in('status', ['approved', 'credited', 'completed'])
    .eq('maturity_date', target)

  if (appsErr) {
    console.error('[maturity-reminder] fetch error:', appsErr.message)
    return { ok: false, error: appsErr.message }
  }

  const dueApps = (apps as DbApp[] | null) || []
  if (dueApps.length === 0) {
    console.log(`[maturity-reminder] ${trigger}: no investments maturing on ${target}`)
    return { ok: true, processed: 0, sent: 0, failed: 0, target, timestamp: new Date().toISOString() }
  }

  // Pull client phone/name for everyone we'll message.
  const clientIds = Array.from(new Set(dueApps.map(a => a.client_id).filter(Boolean) as string[]))
  let clientMap = new Map<string, DbClient>()
  if (clientIds.length > 0) {
    const { data: clients } = await sb
      .from('clients')
      .select('id, full_name, phone')
      .in('id', clientIds)
    clientMap = new Map(((clients as DbClient[]) || []).map(c => [c.id, c]))
  }

  // De-dupe: skip rows we've already reminded about. We tag the
  // notifications row with metadata.reminder_kind so re-runs are
  // idempotent.
  const reminderTag = `maturity_30d`
  const { data: prior } = await sb
    .from('notifications')
    .select('metadata')
    .eq('metadata->>reminder_kind', reminderTag)
    .in('metadata->>investment_app_id', dueApps.map(a => a.id))
  const alreadySent = new Set<string>(
    (((prior as any[]) || [])
      .map(p => p?.metadata?.investment_app_id)
      .filter(Boolean)) as string[],
  )

  let sent = 0
  let failed = 0
  const errors: Array<{ app_id: string; error: string }> = []

  for (const app of dueApps) {
    if (alreadySent.has(app.id)) {
      console.log(`[maturity-reminder] skipping ${app.id} (already reminded)`)
      continue
    }
    const client = app.client_id ? clientMap.get(app.client_id) : null
    if (!client?.phone) {
      console.log(`[maturity-reminder] no phone for app ${app.id}`)
      continue
    }
    const amount = Number(app.final_investment_amount) || Number(app.investment_amount) || 0
    const fund = app.fund_vehicle || 'GHL India Ventures investment'
    const matStr = app.maturity_date ? fmtDate(app.maturity_date) : target
    const text = [
      `⏰ Maturity Reminder`,
      `Hi ${client.full_name || 'Investor'}, your ${fund} investment ${amount > 0 ? `of ₹${fmtINR(amount)}` : ''} is maturing on ${matStr} — one month from now.`,
      `Please reach out to plan renewal or redemption.`,
      `— GHL India Ventures`,
    ].join('\n')

    const res = await sendWhatsApp(siteBase, client.phone, text)
    if (res.ok) {
      sent += 1
      // Audit + de-dupe row (best-effort)
      try {
        await sb.from('notifications').insert({
          user_id: null,
          title: 'Maturity Reminder Sent',
          message: text,
          type: 'info',
          metadata: {
            reminder_kind: reminderTag,
            investment_app_id: app.id,
            client_id: app.client_id,
            phone: client.phone,
            sent_at: new Date().toISOString(),
            trigger,
          },
        } as any)
      } catch (e) { console.warn('[maturity-reminder] audit insert failed:', (e as any)?.message) }
    } else {
      failed += 1
      errors.push({ app_id: app.id, error: res.error || 'unknown' })
    }
  }

  console.log(`[maturity-reminder] ${trigger}: target=${target} processed=${dueApps.length} sent=${sent} failed=${failed}`)
  return { ok: true, processed: dueApps.length, sent, failed, target, errors, timestamp: new Date().toISOString() }
}

// Scheduled invocation (Netlify supplies an empty Request).
export default async (req: Request) => {
  const trigger: 'scheduled' | 'manual' = req.method === 'POST' ? 'manual' : 'scheduled'
  const result = await run(trigger)
  return new Response(JSON.stringify(result), {
    status: (result as any)?.ok === false ? 500 : 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
