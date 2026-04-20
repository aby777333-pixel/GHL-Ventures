#!/usr/bin/env node
/* ============================================================
 * Legacy Clients Import — generic, idempotent, auditable.
 *
 * Consumes a CSV or JSON file of legacy investors and provisions:
 *   - auth.users       (service-role createUser, email pre-confirmed)
 *   - public.profiles  (full_name, phone, role='client')
 *   - public.clients   (phone, email, acquisition_source='legacy',
 *                       legacy_id, legacy_source, imported_at)
 * Every row lands in public.migration_log so the full batch can be
 * audited and re-run safely.
 *
 * ── Usage ────────────────────────────────────────────────────
 *
 *   SUPABASE_URL=...            \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/import-legacy-clients.mjs \
 *     --file ./legacy-clients.csv \
 *     --source old-portal       \
 *     --dry-run
 *
 * Flags:
 *   --file      Path to CSV or JSON input. Required.
 *   --source    Free-form tag stored on every imported row (e.g. old-portal,
 *               crm-dec-2025). Required. Also forms the uniqueness boundary
 *               for legacy_id via clients_legacy_key.
 *   --dry-run   Read + match + plan only. No writes to auth or clients.
 *               Still writes dry_run rows to migration_log for audit.
 *   --invite    After a successful insert, email a password-reset link
 *               using Supabase admin generateLink('recovery'). Default off
 *               to avoid mailstorm during testing.
 *   --batch-id  Optional batch identifier. Defaults to timestamped value.
 *
 * ── Input schema ─────────────────────────────────────────────
 *
 * CSV/JSON rows must carry at least ONE of: email, phone, legacy_id.
 * Recognised columns (case-insensitive, hyphen/underscore-agnostic):
 *   legacy_id | id          — source primary key
 *   full_name | name        — display name
 *   email                   — lower-cased for matching
 *   phone | mobile          — normalised to 10 digits for matching
 *   city, pan, dob, occupation
 *   nominee_name, nominee_relation, nominee_pan, nominee_share
 *
 * ── Match strategy (in order) ────────────────────────────────
 *   1. legacy_source + legacy_id → existing clients row (true idempotency)
 *   2. lower(email)              → existing clients row
 *   3. phone (10 digits)         → existing clients row
 *   4. miss → insert new auth user + profile + client
 * Existing matched rows are UPDATED only on NULL/empty target fields so
 * manually-edited live data is never clobbered.
 *
 * ── Safety ───────────────────────────────────────────────────
 *   - Uses the service role. Never commit the key. Run from a local shell.
 *   - --dry-run first. Compare counts, then re-run without the flag.
 *   - Logs every decision (insert / update / skip / error) with match
 *     strategy and payload to public.migration_log.
 * ============================================================ */

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

// ── CLI arg parsing ─────────────────────────────────────────
function parseArgs(argv) {
  const args = { dryRun: false, invite: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    const next = () => argv[++i]
    if (a === '--file') args.file = next()
    else if (a === '--source') args.source = next()
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--invite') args.invite = true
    else if (a === '--batch-id') args.batchId = next()
    else if (a === '-h' || a === '--help') args.help = true
  }
  return args
}

const args = parseArgs(process.argv)

if (args.help || !args.file || !args.source) {
  console.log(`Usage: node scripts/import-legacy-clients.mjs --file <path> --source <tag> [--dry-run] [--invite] [--batch-id <id>]

Env required:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
`)
  process.exit(args.help ? 0 : 1)
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('✖ Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.')
  process.exit(1)
}

const BATCH_ID = args.batchId || `import-${new Date().toISOString().replace(/[:.]/g, '-')}`
const SOURCE = args.source

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

// ── CSV / JSON reader ──────────────────────────────────────
function parseCsv(text) {
  const rows = []
  let row = [], cur = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') inQ = false
      else cur += c
    } else {
      if (c === '"') inQ = true
      else if (c === ',') { row.push(cur); cur = '' }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
      else if (c === '\r') { /* skip */ }
      else cur += c
    }
  }
  if (cur.length > 0 || row.length > 0) { row.push(cur); rows.push(row) }
  const header = rows.shift().map(h => h.trim())
  return rows
    .filter(r => r.some(v => v && v.length > 0))
    .map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim() || null])))
}

function readInput(file) {
  const full = path.resolve(file)
  const text = fs.readFileSync(full, 'utf-8')
  if (full.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : parsed.rows || parsed.data || []
  }
  return parseCsv(text)
}

// ── Field normalization ────────────────────────────────────
function pick(obj, ...keys) {
  for (const k of keys) {
    const hit = Object.keys(obj).find(kk => kk.toLowerCase().replace(/[-_\s]/g, '') === k.toLowerCase().replace(/[-_\s]/g, ''))
    if (hit && obj[hit] != null && String(obj[hit]).trim() !== '') return String(obj[hit]).trim()
  }
  return null
}

function normalize(row) {
  const email = pick(row, 'email')
  const phoneRaw = pick(row, 'phone', 'mobile', 'contact')
  return {
    legacy_id: pick(row, 'legacy_id', 'id', 'client_id', 'user_id'),
    full_name: pick(row, 'full_name', 'name'),
    email: email ? email.toLowerCase() : null,
    phone: phoneRaw ? phoneRaw.replace(/\D/g, '').slice(-10) : null,
    city: pick(row, 'city'),
    pan: pick(row, 'pan'),
    dob: pick(row, 'dob', 'date_of_birth'),
    occupation: pick(row, 'occupation'),
    nominee_name: pick(row, 'nominee_name'),
    nominee_relation: pick(row, 'nominee_relation'),
    nominee_pan: pick(row, 'nominee_pan'),
    nominee_share: pick(row, 'nominee_share'),
    _raw: row,
  }
}

// ── Match lookup ───────────────────────────────────────────
async function findExistingClient(n) {
  // 1. legacy_source + legacy_id — strongest identity
  if (n.legacy_id) {
    const { data } = await sb.from('clients')
      .select('id, user_id, email, phone, full_name, legacy_id, legacy_source')
      .eq('legacy_source', SOURCE)
      .eq('legacy_id', n.legacy_id)
      .limit(1)
      .maybeSingle()
    if (data) return { client: data, strategy: 'legacy_id' }
  }
  // 2. email
  if (n.email) {
    const { data } = await sb.from('clients')
      .select('id, user_id, email, phone, full_name, legacy_id, legacy_source')
      .ilike('email', n.email)
      .limit(1)
      .maybeSingle()
    if (data) return { client: data, strategy: 'email' }
  }
  // 3. phone (compare normalised 10-digit)
  if (n.phone && n.phone.length === 10) {
    const { data } = await sb.from('clients')
      .select('id, user_id, email, phone, full_name, legacy_id, legacy_source')
      .or(`phone.eq.${n.phone},phone.eq.+91${n.phone},phone.eq.+91 ${n.phone.slice(0,5)} ${n.phone.slice(5)}`)
      .limit(1)
      .maybeSingle()
    if (data) return { client: data, strategy: 'phone' }
  }
  return null
}

async function log(entry) {
  await sb.from('migration_log').insert({
    batch_id: BATCH_ID,
    source: SOURCE,
    ...entry,
  })
}

// ── Per-row handler ────────────────────────────────────────
async function handleRow(raw, i) {
  const n = normalize(raw)

  // Every row MUST carry at least one identifier we can match on.
  if (!n.email && !n.phone && !n.legacy_id) {
    await log({ action: 'error', notes: 'no email/phone/legacy_id', payload: raw })
    return { kind: 'error' }
  }

  const match = await findExistingClient(n)

  if (args.dryRun) {
    await log({
      action: 'dry_run',
      legacy_id: n.legacy_id,
      email: n.email,
      phone: n.phone,
      client_id: match?.client?.id || null,
      match_strategy: match?.strategy || 'none',
      notes: match ? `would UPDATE client ${match.client.id}` : 'would INSERT new auth+profile+client',
      payload: n,
    })
    return { kind: match ? 'update' : 'insert', dry: true }
  }

  // ── UPDATE path (client already exists) ─────────────────
  if (match) {
    const c = match.client
    const patch = {}
    if (!c.full_name && n.full_name) patch.full_name = n.full_name
    if (!c.email && n.email) patch.email = n.email
    if (!c.phone && n.phone) patch.phone = n.phone
    if (!c.legacy_id && n.legacy_id) patch.legacy_id = n.legacy_id
    if (!c.legacy_source) patch.legacy_source = SOURCE
    if (!c.imported_at) patch.imported_at = new Date().toISOString()

    if (Object.keys(patch).length > 0) {
      const { error } = await sb.from('clients').update(patch).eq('id', c.id)
      if (error) {
        await log({ action: 'error', legacy_id: n.legacy_id, email: n.email, phone: n.phone, client_id: c.id, notes: `update failed: ${error.message}`, payload: n })
        return { kind: 'error' }
      }
    }
    await log({
      action: 'update',
      legacy_id: n.legacy_id,
      email: n.email,
      phone: n.phone,
      client_id: c.id,
      auth_user_id: c.user_id,
      match_strategy: match.strategy,
      notes: Object.keys(patch).length > 0 ? `patched ${Object.keys(patch).join(',')}` : 'no-op (already complete)',
      payload: n,
    })
    return { kind: 'update' }
  }

  // ── INSERT path ─────────────────────────────────────────
  if (!n.email) {
    // Cannot create an auth user without an email. Skip and surface.
    await log({ action: 'skip', legacy_id: n.legacy_id, phone: n.phone, notes: 'insert skipped: no email on row', payload: n })
    return { kind: 'skip' }
  }

  // Create auth user. Email pre-confirmed so they can use password reset.
  const randomPassword = crypto.randomBytes(24).toString('base64url')
  const { data: created, error: authErr } = await sb.auth.admin.createUser({
    email: n.email,
    password: randomPassword,
    email_confirm: true,
    user_metadata: {
      full_name: n.full_name,
      phone: n.phone,
      legacy_source: SOURCE,
      legacy_id: n.legacy_id,
    },
  })

  // If the email already exists in auth.users but no matching client row,
  // treat that as a recoverable "resurrect" case — link the existing auth
  // user to a new client row instead of failing.
  let authUserId = created?.user?.id
  if (authErr) {
    const msg = (authErr.message || '').toLowerCase()
    if (msg.includes('already been registered') || msg.includes('duplicate')) {
      const { data: existing } = await sb.auth.admin.listUsers({ page: 1, perPage: 1, email: n.email })
      authUserId = existing?.users?.[0]?.id
    }
    if (!authUserId) {
      await log({ action: 'error', legacy_id: n.legacy_id, email: n.email, phone: n.phone, notes: `auth createUser failed: ${authErr.message}`, payload: n })
      return { kind: 'error' }
    }
  }

  // Upsert profile and client rows. The DB trigger normally handles profile,
  // but we call explicitly to guarantee presence even if the trigger is off.
  await sb.from('profiles').upsert({
    id: authUserId,
    full_name: n.full_name || n.email.split('@')[0],
    phone: n.phone,
    role: 'client',
  }, { onConflict: 'id' })

  const clientRow = {
    user_id: authUserId,
    full_name: n.full_name || n.email.split('@')[0],
    email: n.email,
    phone: n.phone,
    city: n.city,
    pan: n.pan,
    dob: n.dob,
    occupation: n.occupation,
    nominee_name: n.nominee_name,
    nominee_relation: n.nominee_relation,
    nominee_pan: n.nominee_pan,
    nominee_share: n.nominee_share ? Number(n.nominee_share) || null : null,
    acquisition_source: 'legacy',
    legacy_id: n.legacy_id,
    legacy_source: SOURCE,
    imported_at: new Date().toISOString(),
  }
  // Strip nulls so we don't overwrite DB defaults with explicit NULLs.
  for (const k of Object.keys(clientRow)) if (clientRow[k] == null) delete clientRow[k]

  const { data: clientIns, error: clientErr } = await sb.from('clients')
    .upsert(clientRow, { onConflict: 'user_id' })
    .select('id')
    .single()

  if (clientErr) {
    await log({ action: 'error', legacy_id: n.legacy_id, email: n.email, phone: n.phone, auth_user_id: authUserId, notes: `client upsert failed: ${clientErr.message}`, payload: n })
    return { kind: 'error' }
  }

  // Optional: send a Supabase password-reset ("recovery") email.
  let inviteError = null
  if (args.invite) {
    const { error: inviteErr } = await sb.auth.admin.generateLink({ type: 'recovery', email: n.email })
    if (inviteErr) inviteError = inviteErr.message
  }

  await log({
    action: 'insert',
    legacy_id: n.legacy_id,
    email: n.email,
    phone: n.phone,
    client_id: clientIns?.id || null,
    auth_user_id: authUserId,
    match_strategy: 'none',
    notes: inviteError ? `inserted; invite email failed: ${inviteError}` : (args.invite ? 'inserted; invite sent' : 'inserted'),
    payload: n,
  })
  return { kind: 'insert' }
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  const input = readInput(args.file)
  console.log(`Batch: ${BATCH_ID}`)
  console.log(`Source: ${SOURCE}`)
  console.log(`File: ${args.file} (${input.length} rows)`)
  console.log(`Mode: ${args.dryRun ? 'DRY-RUN (no writes)' : args.invite ? 'LIVE + INVITE' : 'LIVE'}`)
  console.log('')

  const counters = { insert: 0, update: 0, skip: 0, error: 0 }
  for (let i = 0; i < input.length; i++) {
    try {
      const res = await handleRow(input[i], i)
      counters[res.kind] = (counters[res.kind] || 0) + 1
      if ((i + 1) % 25 === 0) console.log(`  …${i + 1}/${input.length}`)
    } catch (err) {
      console.error(`  row ${i}: ${err.message}`)
      counters.error++
      await log({ action: 'error', notes: err.message, payload: input[i] }).catch(() => {})
    }
  }

  console.log('')
  console.log('Done.')
  console.log(`  inserts: ${counters.insert}`)
  console.log(`  updates: ${counters.update}`)
  console.log(`  skipped: ${counters.skip}`)
  console.log(`  errors:  ${counters.error}`)
  console.log(`  audit:   SELECT * FROM migration_log WHERE batch_id = '${BATCH_ID}';`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
