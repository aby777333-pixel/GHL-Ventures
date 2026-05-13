/* ─────────────────────────────────────────────────────────────────────────
 * Seed Admin Document Library + Blank Templates
 *
 * Run once. Idempotent — safe to re-run; existing rows are upserted.
 *
 *  • Uploads reference / sample PDFs (the ones already shipped by ops in
 *    `GHL/docs/`) to the private `ghl-documents` bucket and registers
 *    metadata rows in `public.documents` with `is_template = false`. These
 *    are the filled examples + the spec PDF.
 *  • Generates 4 blank PDF templates (no logos, no names, no numbers, no
 *    prefilled details) using `jspdf` and uploads them to the public
 *    `ghl-templates` bucket. Each gets a `documents` row with
 *    `is_template = true` and `access_level = 'public'` so the Templates
 *    repository in the admin UI can auto-fetch them without auth.
 *
 *  Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env. If both are
 *  absent we fall back to reading them from `netlify env:list --plain`
 *  in the linked Netlify site, which is how the rest of `scripts/*` works.
 * ──────────────────────────────────────────────────────────────────────── */

import { createClient } from '@supabase/supabase-js'
import { jsPDF } from 'jspdf'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
// `GHL/docs` lives two levels above the project root (../../docs).
const SOURCE_DIR = path.resolve(REPO_ROOT, '..', 'docs')

// ── 1. Resolve Supabase credentials ─────────────────────────────────────
function readNetlifyEnv() {
  try {
    const out = execSync('netlify env:list --plain', { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString()
    const map = {}
    for (const line of out.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m) map[m[1]] = m[2]
    }
    return map
  } catch {
    return {}
  }
}
const envFromNetlify = readNetlifyEnv()
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || envFromNetlify.SUPABASE_URL || envFromNetlify.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envFromNetlify.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Set env or run inside a linked Netlify project.')
  process.exit(1)
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

// ── 2. Source PDFs (filled samples + spec) ──────────────────────────────
const REFERENCE_SOURCES = [
  { file: 'Admin dashboard - Document section.pdf', title: 'Admin Dashboard — Document Section Spec', category: 'spec',           tags: ['spec', 'admin'] },
  { file: 'Acknowledgement Letter.pdf',              title: 'Acknowledgement Letter (Reference)',     category: 'acknowledgement', tags: ['reference', 'sample'] },
  { file: 'acknowledgement-ref-edit.pdf',            title: 'Acknowledgement Letter (Editable Reference)', category: 'acknowledgement', tags: ['reference', 'editable'] },
  { file: 'Allotment Letter.pdf',                    title: 'Allotment Letter (Reference)',           category: 'allotment',       tags: ['reference', 'sample'] },
  { file: 'Allotment - ref-edit.pdf',                title: 'Allotment Letter (Editable Reference)',  category: 'allotment',       tags: ['reference', 'editable'] },
  { file: 'Debenture Agreement.pdf',                 title: 'Debenture Agreement (Reference)',        category: 'agreement',       tags: ['reference', 'sample'] },
  { file: 'Debenture Agreement - ref-edit.pdf',      title: 'Debenture Agreement (Editable Reference)', category: 'agreement',     tags: ['reference', 'editable'] },
  { file: 'Debenture Certificate.pdf',               title: 'Debenture Certificate (Reference)',      category: 'certificate',     tags: ['reference', 'sample'] },
  { file: 'Debenture Certificate -ref.pdf',          title: 'Debenture Certificate (Editable Reference)', category: 'certificate', tags: ['reference', 'editable'] },
]

// ── 3. Blank-template specs (generated locally, NO branding/values) ─────
// These follow the field list from `Admin dashboard - Document section.pdf`.
// Each placeholder is wrapped in {{ }} so the eventual generation step can
// do a simple replace().
const BLANK_TEMPLATES = [
  {
    key: 'acknowledgement-letter',
    title: 'Acknowledgement Letter — Blank Template',
    category: 'acknowledgement',
    headline: 'Acknowledgement of Investment Receipt',
    placeholders: [
      ['Reference Number',        '{{REFERENCE_NUMBER}}'],
      ['Date',                    '{{CREDIT_DATE}}'],
      ['Investor Name',           '{{INVESTOR_NAME}}'],
      ['Investor Address',        '{{INVESTOR_ADDRESS}}'],
      ['Phone Number',            '{{INVESTOR_PHONE}}'],
      ['Date of Receipt',         '{{CREDIT_DATE}}'],
      ['Amount (in figures)',     '{{INVESTMENT_AMOUNT}}'],
      ['Amount (in words)',       '{{INVESTMENT_AMOUNT_WORDS}}'],
    ],
    body: [
      'This is an acknowledgement of the investment amount received from',
      'the above-named investor for the subscription of debentures.',
      '',
      'The debentures carry interest as per the agreed terms. Interest is paid',
      'on or before the 10th of each month after applicable TDS.',
    ],
  },
  {
    key: 'debenture-agreement',
    title: 'Debenture Agreement — Blank Template',
    category: 'agreement',
    headline: 'Debenture Subscription Agreement',
    placeholders: [
      ['Date',                    '{{CREDIT_DATE}}'],
      ['Investor Name',           '{{INVESTOR_NAME}}'],
      ['Investor Address',        '{{INVESTOR_ADDRESS}}'],
      ['Investor Email',          '{{INVESTOR_EMAIL}}'],
      ['Schedule I — Date',       '{{CREDIT_DATE}}'],
      ['Schedule I — Name',       '{{INVESTOR_NAME}}'],
      ['No. of Debentures',       '{{NUM_DEBENTURES}}'],
      ['Nominal Value',           '{{INVESTMENT_AMOUNT}}'],
    ],
    body: [
      'This agreement is entered into between the Company and the Investor for',
      'the subscription of debentures as per Schedule I below.',
      '',
      'The Investor agrees to the terms set out in the principal agreement,',
      'including the interest, tenure and redemption clauses.',
    ],
  },
  {
    key: 'allotment-letter',
    title: 'Allotment Letter — Blank Template',
    category: 'allotment',
    headline: 'Letter of Allotment',
    placeholders: [
      ['Date',                    '{{ALLOTMENT_DATE}}'],
      ['Investor Name',           '{{INVESTOR_NAME}}'],
      ['Investor Address',        '{{INVESTOR_ADDRESS}}'],
      ['Folio Number',            '{{FOLIO_NUMBER}}'],
      ['No. of Debentures',       '{{NUM_DEBENTURES}}'],
      ['Distinctive Nos. (From)', '{{DISTINCTIVE_FROM}}'],
      ['Distinctive Nos. (To)',   '{{DISTINCTIVE_TO}}'],
      ['Amount Received (Rs.)',   '{{INVESTMENT_AMOUNT}}'],
      ['Fund Type',               '{{FUND_TYPE}}'],
      ['Rate of Interest',        '{{INTEREST_RATE}}'],
      ['Tenure',                  '{{TENURE}}'],
    ],
    body: [
      'We are pleased to inform you that you have been allotted the debentures',
      'detailed above against the amount received from you.',
    ],
  },
  {
    key: 'debenture-certificate',
    title: 'Debenture Certificate — Blank Template',
    category: 'certificate',
    headline: 'Debenture Certificate',
    placeholders: [
      ['Regd. Folio No.',         '{{FOLIO_NUMBER}}'],
      ['Certificate No.',         '{{CERTIFICATE_NUMBER}}'],
      ['Name of the Holder',      '{{INVESTOR_NAME}}'],
      ['No. of Debentures Held',  '{{NUM_DEBENTURES}}'],
      ['Distinctive Nos.',        '{{DISTINCTIVE_RANGE}}'],
      ['Total Value of Debentures', '{{INVESTMENT_AMOUNT}}'],
    ],
    body: [
      'This is to certify that the holder named above is the registered holder',
      'of the debentures detailed in this certificate.',
      '',
      '________________________            ________________________',
      'Authorised Signatory                Authorised Signatory',
    ],
  },
]

// ── 4. PDF generator (deliberately plain — no logos, no brand) ──────────
function generateBlankTemplatePdf(t) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 56
  let y = margin

  doc.setFont('helvetica', 'bold').setFontSize(16)
  doc.text(t.headline, pageWidth / 2, y, { align: 'center' })
  y += 28

  doc.setFont('helvetica', 'normal').setFontSize(9)
  doc.setTextColor(120)
  doc.text('Blank template — populate placeholders before issuing.', pageWidth / 2, y, { align: 'center' })
  doc.setTextColor(0)
  y += 30

  doc.setFontSize(11)
  for (const [label, placeholder] of t.placeholders) {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(placeholder, margin + 180, y)
    y += 20
  }

  y += 12
  doc.setFont('helvetica', 'normal').setFontSize(10)
  for (const line of t.body) {
    doc.text(line, margin, y, { maxWidth: pageWidth - margin * 2 })
    y += 16
  }

  // Footer marker so the file is clearly identifiable as a template
  doc.setFontSize(8).setTextColor(140)
  doc.text(`Template ID: ${t.key}`, margin, doc.internal.pageSize.getHeight() - 24)

  return Buffer.from(doc.output('arraybuffer'))
}

// ── 5. Helpers ──────────────────────────────────────────────────────────
async function uploadBytes(bucket, storagePath, bytes, contentType) {
  const { error } = await sb.storage.from(bucket).upload(storagePath, bytes, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error(`Upload to ${bucket}/${storagePath} failed: ${error.message}`)
}

function publicUrl(bucket, storagePath) {
  return sb.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl
}

// Private buckets (e.g. ghl-documents) do not serve files at the
// /storage/v1/object/public/... path — that endpoint returns 404
// "Bucket not found". The UI must mint a fresh signed URL on demand,
// so for these objects we leave `file_url` blank and stash bucket +
// path in `metadata`. AssetDocModule reads that and calls
// `storageService.getDownloadUrl(path, bucket)` when the admin clicks
// View / Download.
const PRIVATE_BUCKETS = new Set(['ghl-documents', 'ghl-exports', 'ghl-backups', 'investment-documents', 'kyc-documents', 'reports', 'staff-documents', 'resumes', 'client-uploads'])

async function upsertDocumentRow(row) {
  // Idempotent by (metadata.bucket + metadata.path) when present, else file_url.
  // The bucket+path key is stable across URL-scheme changes (public ↔ signed).
  const meta = row.metadata || {}
  let existing = null
  if (meta.bucket && meta.path) {
    const { data, error } = await sb
      .from('documents')
      .select('id')
      .eq('metadata->>bucket', meta.bucket)
      .eq('metadata->>path', meta.path)
      .maybeSingle()
    if (error && error.code !== 'PGRST116') throw error
    existing = data
  }
  if (!existing) {
    const { data, error } = await sb
      .from('documents')
      .select('id')
      .eq('file_url', row.file_url)
      .maybeSingle()
    if (error && error.code !== 'PGRST116') throw error
    existing = data
  }

  if (existing?.id) {
    const { error } = await sb.from('documents').update(row).eq('id', existing.id)
    if (error) throw error
    return { id: existing.id, action: 'updated' }
  }
  const { data, error } = await sb.from('documents').insert(row).select('id').single()
  if (error) throw error
  return { id: data.id, action: 'inserted' }
}

// ── 6. Run ──────────────────────────────────────────────────────────────
async function main() {
  console.log('→ Source dir:', SOURCE_DIR)

  // 6a. Reference / sample PDFs → ghl-documents (private)
  const REF_BUCKET = 'ghl-documents'
  const referenceResults = []
  for (const ref of REFERENCE_SOURCES) {
    const abs = path.join(SOURCE_DIR, ref.file)
    if (!fs.existsSync(abs)) {
      console.warn(`  ⚠ skip (missing): ${ref.file}`)
      continue
    }
    const bytes = fs.readFileSync(abs)
    const storagePath = `admin-library/references/${ref.file}`
    await uploadBytes(REF_BUCKET, storagePath, bytes, 'application/pdf')
    // Private buckets: leave file_url empty; UI mints a signed URL on demand
    // using metadata.bucket + metadata.path. The historic upsert key was
    // `file_url`, so we synthesise a stable `supabase://` pseudo-URL just
    // for idempotency.
    const upsertKey = `supabase://${REF_BUCKET}/${storagePath}`
    const res = await upsertDocumentRow({
      title: ref.title,
      file_url: upsertKey,
      file_name: ref.file,
      file_type: 'pdf',
      mime_type: 'application/pdf',
      file_size: bytes.length,
      category: ref.category,
      tags: ref.tags,
      version: 1,
      is_template: false,
      is_confidential: false,
      access_level: 'internal',
      status: 'active',
      owner_type: 'admin',
      metadata: {
        source: 'ops-upload-2026-05-13',
        kind: 'reference',
        bucket: REF_BUCKET,
        path: storagePath,
      },
    })
    console.log(`  ${res.action === 'inserted' ? '+' : '~'} reference: ${ref.file}`)
    referenceResults.push({ file: ref.file, ...res })
  }

  // 6b. Blank templates → ghl-templates (public, auto-fetchable)
  const templateResults = []
  for (const t of BLANK_TEMPLATES) {
    const bytes = generateBlankTemplatePdf(t)
    const storagePath = `admin/${t.key}.pdf`
    await uploadBytes('ghl-templates', storagePath, bytes, 'application/pdf')
    const url = publicUrl('ghl-templates', storagePath)
    const res = await upsertDocumentRow({
      title: t.title,
      file_url: url,
      file_name: `${t.key}.pdf`,
      file_type: 'pdf',
      mime_type: 'application/pdf',
      file_size: bytes.length,
      category: t.category,
      tags: ['template', 'blank', t.category],
      version: 1,
      is_template: true,
      is_confidential: false,
      access_level: 'public',
      status: 'active',
      owner_type: 'admin',
      metadata: {
        source: 'auto-generated-blank-template',
        template_key: t.key,
        placeholders: t.placeholders.map(([, p]) => p),
      },
    })
    console.log(`  ${res.action === 'inserted' ? '+' : '~'} template: ${t.key}.pdf`)
    templateResults.push({ key: t.key, url, ...res })
  }

  console.log('\n✔ Seed complete')
  console.log(`  References:  ${referenceResults.length}`)
  console.log(`  Templates:   ${templateResults.length}`)
}

main().catch(err => {
  console.error('✘ Seed failed:', err)
  process.exit(1)
})
