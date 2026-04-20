#!/usr/bin/env node
/*
 * Legacy client migration — one-shot.
 *
 * Source: C:/Users/GIO4X/Documents/ghl live data/Live DB Details/
 *   - users.csv           → clients + kyc_basic_details
 *   - identitykycs.csv    → kyc_identity_details
 *   - bankkycs.csv        → kyc_bank_details
 *   - dematkycs.csv       → kyc_demat_details
 *   - nomineekycs.csv     → nominees
 *   - uploads/*           → legacy-uploads storage bucket
 *
 * Idempotent: re-running skips rows that already landed (looks up by ghl_id
 * on clients, then cascades via client_id / user_id on child tables).
 *
 * Requires env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   LEGACY_DATA_DIR  (defaults to C:/Users/GIO4X/Documents/ghl live data/Live DB Details)
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const LEGACY_DIR = process.env.LEGACY_DATA_DIR ||
  'C:/Users/GIO4X/Documents/ghl live data/Live DB Details'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

const BUCKET = 'legacy-uploads'

// ── CSV parsing ─────────────────────────────────────────────
// Minimal RFC-4180-ish parser: quoted fields with embedded commas,
// escaped quotes (""). Legacy export uses LF line endings and "NULL"
// string for missing values.
function parseCsv(text) {
  const rows = []
  let row = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') { inQuotes = false }
      else { cur += c }
    } else {
      if (c === '"') { inQuotes = true }
      else if (c === ',') { row.push(cur); cur = '' }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
      else if (c === '\r') { /* skip */ }
      else { cur += c }
    }
  }
  if (cur.length > 0 || row.length > 0) { row.push(cur); rows.push(row) }
  const header = rows.shift()
  return rows
    .filter(r => r.some(v => v && v.length > 0))
    .map(r => Object.fromEntries(header.map((h, i) => [h, r[i] === 'NULL' ? null : (r[i] ?? null)])))
}

function readCsv(name) {
  const full = path.join(LEGACY_DIR, name)
  const text = fs.readFileSync(full, 'utf-8')
  return parseCsv(text)
}

// ── Helpers ────────────────────────────────────────────────
// Legacy timestamps are "DD-MM-YYYY HH:MM" in IST. Convert to ISO-8601
// without timezone (let Postgres interpret as the session timezone).
function toIso(legacy) {
  if (!legacy) return null
  const m = legacy.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!m) return null
  const [, dd, mm, yyyy, hh, mi, ss] = m
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss || '00'}+05:30`
}

function toDate(legacy) {
  if (!legacy) return null
  const m = legacy.match(/^(\d{2})-(\d{2})-(\d{4})/)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  return `${yyyy}-${mm}-${dd}`
}

// Legacy kyc_status int → current text enum. Per old Laravel schema:
// 0 = not started, 1 = submitted, 2 = approved, 3 = rejected.
// Used for clients.kyc_status (text enum: pending/submitted/verified/rejected).
function mapKycStatus(n) {
  const v = parseInt(n || '0', 10)
  return ({ 0: 'pending', 1: 'submitted', 2: 'verified', 3: 'rejected' })[v] || 'pending'
}

// kyc_*_details.status CHECK constraint only allows
// pending / submitted / approved / rejected (no "verified").
function mapSubKycStatus(n) {
  const v = parseInt(n || '0', 10)
  return ({ 0: 'pending', 1: 'submitted', 2: 'approved', 3: 'rejected' })[v] || 'pending'
}

// kyc_bank_details.account_type CHECK: savings/current/nro/nre.
// Legacy Laravel uses "saving" (no s), "current" etc.
function mapAccountType(t) {
  const raw = (t || '').toLowerCase().trim()
  if (raw === 'saving' || raw === 'savings') return 'savings'
  if (raw === 'current') return 'current'
  if (raw === 'nro') return 'nro'
  if (raw === 'nre') return 'nre'
  return 'savings'
}

// kyc_basic_details.gender CHECK: male/female/other.
function mapGender(g) {
  const raw = (g || '').toLowerCase().trim()
  if (raw === 'male' || raw === 'female' || raw === 'other') return raw
  return null
}

// kyc_basic_details.investor_type CHECK.
function mapInvestorType(t) {
  const raw = (t || '').toLowerCase().trim()
  const valid = ['individual', 'huf', 'corporate', 'partnership', 'trust']
  return valid.includes(raw) ? raw : 'individual'
}

// kyc_basic_details.resident_type CHECK.
function mapResidentType(v) {
  const raw = (v || '').toLowerCase().trim()
  return raw === 'nri' || raw === 'foreign' ? raw : 'indian'
}

// Rewrite a legacy "/uploads/NNN.ext" path to the public URL in our
// legacy-uploads bucket. Returns null when the source path is missing.
function rewriteUploadPath(legacyPath) {
  if (!legacyPath) return null
  const base = path.basename(legacyPath)
  if (!base) return null
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${base}`
}

// ── Step 1: upload files ───────────────────────────────────
async function uploadAllFiles() {
  const srcDir = path.join(LEGACY_DIR, 'uploads')
  const files = fs.readdirSync(srcDir).filter(f => !f.startsWith('.'))
  console.log(`[files] uploading ${files.length} files to bucket ${BUCKET}`)

  let uploaded = 0, skipped = 0, failed = 0
  for (const file of files) {
    const full = path.join(srcDir, file)
    const stat = fs.statSync(full)
    if (!stat.isFile()) continue

    const body = fs.readFileSync(full)
    const ext = path.extname(file).toLowerCase().replace('.', '')
    const mime = ({
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
      webp: 'image/webp', pdf: 'application/pdf', heic: 'image/heic',
    })[ext] || 'application/octet-stream'

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(file, body, { contentType: mime, upsert: true })

    if (error) { failed++; console.warn(`  FAIL ${file}: ${error.message}`) }
    else { uploaded++ }

    if ((uploaded + skipped + failed) % 50 === 0) {
      console.log(`  …${uploaded + skipped + failed}/${files.length}`)
    }
  }
  console.log(`[files] done — uploaded=${uploaded} skipped=${skipped} failed=${failed}`)
}

// ── Step 2: clients + kyc_basic_details ────────────────────
async function migrateClients() {
  const users = readCsv('users.csv').filter(u => u.user_type === 'customer' || u.user_type === null)
  console.log(`[clients] ${users.length} users to consider`)

  // Pull city/state/pincode/address from identitykycs by legacy user_id.
  const identityById = new Map()
  for (const i of readCsv('identitykycs.csv')) {
    identityById.set(i.user_id, i)
  }

  let inserted = 0, updated = 0, skipped = 0
  const ghlIdToClientId = new Map()
  const legacyIdToClientId = new Map()

  for (const u of users) {
    if (!u.ghl_id) { skipped++; continue }

    // Skip if already present (idempotent re-run).
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('ghl_id', u.ghl_id)
      .maybeSingle()

    if (existing?.id) {
      ghlIdToClientId.set(u.ghl_id, existing.id)
      legacyIdToClientId.set(u.id, existing.id)
      skipped++
      continue
    }

    const ident = identityById.get(u.id) || {}
    const kycStatusText = mapKycStatus(u.kyc_status)

    const row = {
      ghl_id: u.ghl_id,
      client_code: u.folio_no || null,
      full_name: [u.name, u.last_name].filter(Boolean).join(' ').trim() || u.name || 'Unknown',
      email: (u.email || '').trim().toLowerCase() || null,
      phone: u.phone || null,
      city: ident.city || u.city || null,
      state: ident.state || u.state || null,
      country: ident.country || u.country || 'India',
      pan: ident.pan_number || null,
      kyc_status: kycStatusText,
      investor_type: u.type || 'individual',
      risk_profile: 'moderate',
      total_invested: parseFloat(u.invested || '0') || 0,
      acquisition_source: (() => {
        const raw = (u.utm_source || '').toLowerCase()
        const valid = ['website', 'referral', 'social_media', 'cold_call', 'event', 'partner', 'other']
        if (valid.includes(raw)) return raw
        if (u.referred_by) return 'referral'
        return 'other'
      })(),
      is_active: u.banned === '0' || u.banned === null,
      referral_code: u.referral_code || null,
      referred_by: u.referred_by || null,
      kyc_step: parseInt(u.kyc_status || '0', 10) >= 2 ? 6 : parseInt(u.kyc_status || '0', 10) + 1,
      created_at: toIso(u.created_at) || new Date().toISOString(),
      updated_at: toIso(u.updated_at) || new Date().toISOString(),
      notes: `Legacy import · legacy_id=${u.id} · folio=${u.folio_no || '-'}`,
    }

    const { data, error } = await supabase
      .from('clients')
      .insert(row)
      .select('id')
      .single()

    if (error) {
      console.warn(`  FAIL client ${u.ghl_id}: ${error.message}`)
      continue
    }

    const clientId = data.id
    ghlIdToClientId.set(u.ghl_id, clientId)
    legacyIdToClientId.set(u.id, clientId)
    inserted++

    // kyc_basic_details — one-row-per-client. Only insert if absent.
    const { data: basicExists } = await supabase
      .from('kyc_basic_details')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle()
    if (!basicExists) {
      const subStatus = mapSubKycStatus(u.kyc_status)
      const { error: bErr } = await supabase.from('kyc_basic_details').insert({
        client_id: clientId,
        user_id: null, // legacy clients have no auth.users row yet
        investor_name: row.full_name,
        investor_type: mapInvestorType(row.investor_type),
        resident_type: mapResidentType(u.value),
        email: row.email,
        phone: row.phone,
        gender: mapGender(u.gender),
        email_verified: !!u.email_verified_at,
        status: subStatus,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
      if (bErr) console.warn(`  WARN basic ${u.ghl_id}: ${bErr.message}`)
    }
  }

  console.log(`[clients] inserted=${inserted} updated=${updated} skipped=${skipped}`)
  return { legacyIdToClientId, ghlIdToClientId }
}

// ── Step 2b: kyc_basic_details top-up for clients imported on a
//          prior run that didn't get a basic row (or got one with a
//          now-invalid status). Idempotent — skips if row exists.
async function topUpBasicDetails(users, legacyIdToClientId) {
  let inserted = 0, skipped = 0
  for (const u of users) {
    const clientId = legacyIdToClientId.get(u.id)
    if (!clientId) continue
    const { data: existing } = await supabase
      .from('kyc_basic_details')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle()
    if (existing) { skipped++; continue }

    const { error } = await supabase.from('kyc_basic_details').insert({
      client_id: clientId,
      user_id: null,
      investor_name: [u.name, u.last_name].filter(Boolean).join(' ').trim() || u.name || 'Unknown',
      investor_type: mapInvestorType(u.type),
      resident_type: mapResidentType(u.value),
      email: (u.email || '').trim().toLowerCase() || null,
      phone: u.phone || null,
      gender: mapGender(u.gender),
      email_verified: !!u.email_verified_at,
      status: mapSubKycStatus(u.kyc_status),
      created_at: toIso(u.created_at) || new Date().toISOString(),
      updated_at: toIso(u.updated_at) || new Date().toISOString(),
    })
    if (error) console.warn(`  WARN basic-topup ${u.ghl_id}: ${error.message}`)
    else inserted++
  }
  console.log(`[basic-topup] inserted=${inserted} skipped=${skipped}`)
}

// ── Step 3: kyc_identity_details ───────────────────────────
async function migrateIdentity(legacyIdToClientId) {
  const rows = readCsv('identitykycs.csv')
  console.log(`[identity] ${rows.length} rows`)
  let inserted = 0, skipped = 0
  for (const r of rows) {
    const clientId = legacyIdToClientId.get(r.user_id)
    if (!clientId) { skipped++; continue }

    const { data: existing } = await supabase
      .from('kyc_identity_details')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle()
    if (existing) { skipped++; continue }

    const { error } = await supabase.from('kyc_identity_details').insert({
      client_id: clientId,
      user_id: null,
      pan_number: r.pan_number,
      aadhar_number: r.aadhaar_number,
      passport_number: r.passport_number,
      name_on_document: r.user_name,
      father_name: r.father_name,
      dob: toDate(r.dob),
      address: [r.address, r.address1].filter(Boolean).join(', ') || r.address,
      country: r.country,
      state: r.state,
      city: r.city,
      pincode: r.pincode,
      // id_proof (Laravel) was the primary ID scan. Route to the
      // appropriate _doc_url based on which number is present.
      aadhar_doc_url: r.aadhaar_number ? rewriteUploadPath(r.id_proof || r.id_proof1) : null,
      pan_doc_url: r.pan_number ? rewriteUploadPath(r.id_proof1 || r.id_proof) : null,
      passport_doc_url: r.passport_number ? rewriteUploadPath(r.id_proof3 || r.id_proof) : null,
      status: 'approved',
      created_at: toIso(r.created_at),
      updated_at: toIso(r.updated_at),
    })
    if (error) console.warn(`  WARN identity legacy_user=${r.user_id}: ${error.message}`)
    else inserted++
  }
  console.log(`[identity] inserted=${inserted} skipped=${skipped}`)
}

// ── Step 4: kyc_bank_details ───────────────────────────────
async function migrateBank(legacyIdToClientId) {
  const rows = readCsv('bankkycs.csv')
  console.log(`[bank] ${rows.length} rows`)
  let inserted = 0, skipped = 0
  for (const r of rows) {
    const clientId = legacyIdToClientId.get(r.user_id)
    if (!clientId) { skipped++; continue }

    const { data: existing } = await supabase
      .from('kyc_bank_details')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle()
    if (existing) { skipped++; continue }

    const { error } = await supabase.from('kyc_bank_details').insert({
      client_id: clientId,
      user_id: null,
      account_type: mapAccountType(r.account_type),
      account_number: r.account_number,
      ifsc_code: r.ifsc_code,
      swift_iban_code: r.swift_iban_code,
      account_holder_name: r.account_holder_name,
      bank_name: r.bank_name,
      bank_doc_url: rewriteUploadPath(r.bank_statement),
      status: mapSubKycStatus(r.status),
      admin_notes: r.remark,
      created_at: toIso(r.created_at),
      updated_at: toIso(r.updated_at),
    })
    if (error) console.warn(`  WARN bank legacy_user=${r.user_id}: ${error.message}`)
    else inserted++
  }
  console.log(`[bank] inserted=${inserted} skipped=${skipped}`)
}

// ── Step 5: kyc_demat_details ──────────────────────────────
async function migrateDemat(legacyIdToClientId) {
  const rows = readCsv('dematkycs.csv')
  console.log(`[demat] ${rows.length} rows`)
  let inserted = 0, skipped = 0
  for (const r of rows) {
    const clientId = legacyIdToClientId.get(r.user_id)
    if (!clientId) { skipped++; continue }

    const { data: existing } = await supabase
      .from('kyc_demat_details')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle()
    if (existing) { skipped++; continue }

    const { error } = await supabase.from('kyc_demat_details').insert({
      client_id: clientId,
      user_id: null,
      demat_account_number: r.demat_account_number,
      demat_doc_url: rewriteUploadPath(r.upload_statement),
      status: 'approved',
      skipped: false,
      created_at: toIso(r.created_at),
      updated_at: toIso(r.updated_at),
    })
    if (error) console.warn(`  WARN demat legacy_user=${r.user_id}: ${error.message}`)
    else inserted++
  }
  console.log(`[demat] inserted=${inserted} skipped=${skipped}`)
}

// ── Step 6: nominees ───────────────────────────────────────
async function migrateNominees(legacyIdToClientId) {
  const rows = readCsv('nomineekycs.csv')
  console.log(`[nominees] ${rows.length} rows`)
  let inserted = 0, skipped = 0
  for (const r of rows) {
    const clientId = legacyIdToClientId.get(r.user_id)
    if (!clientId) { skipped++; continue }

    // Skip if this exact nominee name already exists for the client.
    const { data: existing } = await supabase
      .from('nominees')
      .select('id')
      .eq('client_id', clientId)
      .eq('name', r.nominee_name || '')
      .maybeSingle()
    if (existing) { skipped++; continue }

    const { error } = await supabase.from('nominees').insert({
      client_id: clientId,
      user_id: null,
      name: r.nominee_name,
      dob: toDate(r.nominee_dob),
      phone: r.nominee_phone,
      relationship: r.relationship,
      percentage: parseFloat(r.percentage || '100') || 100,
      proof_url: rewriteUploadPath(r.upload_nominee_proof),
      // nominees.status CHECK: active / inactive
      status: 'active',
      created_at: toIso(r.created_at),
      updated_at: toIso(r.updated_at),
    })
    if (error) { console.warn(`  WARN nominee legacy_user=${r.user_id}: ${error.message}`); continue }

    // Also denormalise onto the client row for the single-nominee
    // surfaces in the dashboard (nominee_name / nominee_relation).
    await supabase.from('clients').update({
      nominee_name: r.nominee_name,
      nominee_relation: r.relationship,
      nominee_share: parseFloat(r.percentage || '100') || 100,
    }).eq('id', clientId)

    inserted++
  }
  console.log(`[nominees] inserted=${inserted} skipped=${skipped}`)
}

// ── Driver ────────────────────────────────────────────────
async function main() {
  const skipFiles = process.argv.includes('--skip-files')
  if (!skipFiles) await uploadAllFiles()
  const { legacyIdToClientId } = await migrateClients()
  const users = readCsv('users.csv').filter(u => u.user_type === 'customer' || u.user_type === null)
  await topUpBasicDetails(users, legacyIdToClientId)
  await migrateIdentity(legacyIdToClientId)
  await migrateBank(legacyIdToClientId)
  await migrateDemat(legacyIdToClientId)
  await migrateNominees(legacyIdToClientId)
  console.log('migration complete')
}

main().catch(err => { console.error(err); process.exit(1) })
