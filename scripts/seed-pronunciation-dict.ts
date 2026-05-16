#!/usr/bin/env -S npx tsx
/* ================================================================
   Seed Sarvam Pronunciation Dictionaries

   Creates three project-specific dicts at Sarvam AND mirrors the
   returned `dictionary_id`s into public.sarvam_dictionaries so the
   TTS UI / TTSPlayer / NEXUS voice agent can look them up by
   friendly name.

   Three dicts, per §4.3 of the Sarvam integration spec:
     • ghl-financial — NEFT / RTGS / KYC / EMI / SEBI / AIF / etc.
     • gio-trading   — GIO4X / NEXUS / A-book / lot / pip / etc.
     • brand-names   — Sarvam / GHL India Ventures / GIO4X / etc.

   Run with:
     npx tsx scripts/seed-pronunciation-dict.ts
     # or, if you've added "tsx" to your dev deps:
     pnpm tsx scripts/seed-pronunciation-dict.ts

   Required env vars (read from .env.local or shell):
     SARVAM_API_KEY
     SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY

   Idempotency: each dict is keyed by `name` in sarvam_dictionaries.
   On re-run:
     - If a row with that name already exists → PATCH the dict at
       Sarvam (preserving dictionary_id), then upsert the registry
       row.
     - Otherwise → create at Sarvam, insert the registry row.
   ================================================================ */

// Native fetch + FormData on Node 18+, no extra deps.

// ── .env.local auto-loader ──────────────────────────────────
// Next.js loads .env.local during dev/build automatically, but a
// standalone Node CLI doesn't. Rather than add the dotenv dep (and
// to keep this script drop-in for anyone who clones the repo), we
// do a tiny inline parse of the project's .env.local + .env if
// present. Variables already set in the real shell env take
// precedence — never overwrite.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvFile(path: string): void {
  let raw: string
  try { raw = readFileSync(path, 'utf8') } catch { return }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    // Strip wrapping quotes — single or double.
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}
// Try .env.local first (project convention), then .env. cwd-relative
// so `npx tsx scripts/seed-pronunciation-dict.ts` works from repo root.
loadEnvFile(resolve(process.cwd(), '.env.local'))
loadEnvFile(resolve(process.cwd(), '.env'))

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || ''
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Nested under /text-to-speech/. The bare /pronunciation-dictionary
// path 404s in production; the nested one is the live endpoint.
const SARVAM_DICT_URL = 'https://api.sarvam.ai/text-to-speech/pronunciation-dictionary'

interface DictBlueprint {
  name: string
  description: string
  pronunciations: Record<string, Record<string, string>>
}

const DICTS: DictBlueprint[] = [
  // 1. ghl-financial — BFSI / investor / SEBI terminology.
  {
    name: 'ghl-financial',
    description: 'BFSI / SEBI / AIF terminology — used by GHL India Ventures investor TTS announcements.',
    pronunciations: {
      'hi-IN': {
        NEFT:  'एन ई एफ टी',
        RTGS:  'आर टी जी एस',
        KYC:   'के वाई सी',
        EMI:   'ई एम आई',
        CIBIL: 'सिबिल',
        SEBI:  'सेबी',
        AIF:   'ए आई एफ',
        NAV:   'एन ए वी',
        HNI:   'एच एन आई',
        IRR:   'आई आर आर',
        TDS:   'टी डी एस',
        PAN:   'पैन',
      },
      'en-IN': {
        NEFT:  'N E F T',
        RTGS:  'R T G S',
        KYC:   'K Y C',
        CIBIL: 'sib-il',
        SEBI:  'seb-ee',
        AIF:   'A I F',
        NAV:   'N A V',
        HNI:   'H N I',
        IRR:   'I R R',
        TDS:   'T D S',
        PAN:   'pan',
      },
    },
  },
  // 2. gio-trading — GIO RAPTOR / NEXUS dealer-room terms.
  {
    name: 'gio-trading',
    description: 'GIO RAPTOR / NEXUS dealer-room trading terminology — A-book / B-book / FIX / etc.',
    pronunciations: {
      'hi-IN': {
        GIO4X:        'जी आई ओ four X',
        GIORAPTOR:    'जी आई ओ रैप्टर',
        NEXUS:        'नेक्सस',
        'A-book':     'A book',
        'B-book':     'B book',
        ECN:          'ई सी एन',
        STP:          'एस टी पी',
        SOR:          'एस ओ आर',
        FIX:          'फिक्स',
        PAMM:         'पाम',
        MAM:          'मैम',
        'copy trading': 'कॉपी ट्रेडिंग',
        lot:          'लॉट',
        pip:          'पिप',
        spread:       'स्प्रेड',
        slippage:     'स्लिपेज',
        PnL:          'P n L',
        drawdown:     'ड्रॉडाउन',
      },
      'en-IN': {
        GIO4X:        'G I O four X',
        GIORAPTOR:    'G I O Raptor',
        NEXUS:        'Nexus',
        'A-book':     'A book',
        'B-book':     'B book',
        ECN:          'E C N',
        STP:          'S T P',
        SOR:          'S O R',
        FIX:          'fix',
        PAMM:         'pam',
        MAM:          'mam',
        PnL:          'P n L',
      },
    },
  },
  // 3. brand-names — proper-noun pronunciation across the portfolio.
  {
    name: 'brand-names',
    description: 'Portfolio brand-name pronunciation — Sarvam / GHL India Ventures / GIO4X / etc.',
    pronunciations: {
      'hi-IN': {
        Sarvam:                'सारवम',
        'GHL India Ventures':  'जी एच एल India Ventures',
        '777 Capital':         'triple seven Capital',
        JetFyX:                'Jet F y X',
        GIOBOTS:               'जी आई ओ बॉट्स',
        Orgaby:                'ऑर्गेबी',
        'Jamin Properties':    'Jamin Properties',
        Landmaxo:              'Land मैक्सो',
      },
      'en-IN': {
        Sarvam:                'Saar-vum',
        'GHL India Ventures':  'G H L India Ventures',
        '777':                 'triple seven',
        '777 Capital':         'triple seven Capital',
        JetFyX:                'Jet F y X',
        GIOBOTS:               'G I O bots',
        GIO4X:                 'G I O four X',
        Orgaby:                'Or-ga-bee',
        Landmaxo:              'Land-max-o',
      },
      'ta-IN': {
        EMI:  'இ எம் ஐ',
        Sarvam: 'சார்வம்',
      },
    },
  },
]

// ── Helpers ─────────────────────────────────────────────────

interface SarvamCreateResp { dictionary_id?: string }
interface RegistryRow { dictionary_id: string; name: string }

async function ensureEnv(): Promise<void> {
  const missing: string[] = []
  if (!SARVAM_API_KEY) missing.push('SARVAM_API_KEY')
  if (!SUPABASE_URL) missing.push('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (missing.length) {
    console.error(`\n[seed-dict] Missing env vars:\n  - ${missing.join('\n  - ')}\n`)
    console.error('Tip: run from the repo root with .env.local present, or:')
    console.error('  SARVAM_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-pronunciation-dict.ts\n')
    process.exit(1)
  }
}

async function existingRegistry(name: string): Promise<RegistryRow | null> {
  const url = `${SUPABASE_URL!.replace(/\/$/, '')}/rest/v1/sarvam_dictionaries?name=eq.${encodeURIComponent(name)}&select=dictionary_id,name&limit=1`
  const r = await fetch(url, {
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
  })
  if (!r.ok) {
    console.warn(`[seed-dict] Registry lookup for ${name} failed: HTTP ${r.status}`)
    return null
  }
  const rows = (await r.json()) as RegistryRow[]
  return rows[0] || null
}

function buildBlob(payload: { pronunciations: Record<string, Record<string, string>> }, filename: string): { blob: Blob; size: number } {
  const text = JSON.stringify(payload, null, 2)
  // Node 18 has global Blob.
  // Using `as any` here is local to the script — keeps the TS strict
  // pass happy without dragging in @types/node-blob.
  const blob = new (globalThis as { Blob: typeof Blob }).Blob([text], { type: 'application/json' })
  return { blob, size: text.length }
}

async function createAtSarvam(d: DictBlueprint): Promise<string> {
  const { blob } = buildBlob({ pronunciations: d.pronunciations }, `${d.name}.json`)
  const form = new FormData()
  form.append('file', blob, `${d.name}.json`)
  const r = await fetch(SARVAM_DICT_URL, {
    method: 'POST',
    headers: { 'api-subscription-key': SARVAM_API_KEY },
    body: form,
  })
  if (!r.ok) {
    const errText = await r.text().catch(() => '')
    throw new Error(`Sarvam create failed for ${d.name}: HTTP ${r.status} — ${errText.slice(0, 200)}`)
  }
  const data = (await r.json()) as SarvamCreateResp
  if (!data.dictionary_id) {
    throw new Error(`Sarvam create returned no dictionary_id for ${d.name}`)
  }
  return data.dictionary_id
}

async function updateAtSarvam(dictId: string, d: DictBlueprint): Promise<void> {
  const { blob } = buildBlob({ pronunciations: d.pronunciations }, `${d.name}.json`)
  const form = new FormData()
  form.append('file', blob, `${d.name}.json`)
  const r = await fetch(`${SARVAM_DICT_URL}/${encodeURIComponent(dictId)}`, {
    method: 'PATCH',
    headers: { 'api-subscription-key': SARVAM_API_KEY },
    body: form,
  })
  if (!r.ok) {
    const errText = await r.text().catch(() => '')
    throw new Error(`Sarvam update failed for ${d.name}: HTTP ${r.status} — ${errText.slice(0, 200)}`)
  }
}

async function upsertRegistry(d: DictBlueprint, dictId: string): Promise<void> {
  const wordCount = Object.values(d.pronunciations).reduce(
    (s, lang) => s + Object.keys(lang).length, 0,
  )
  const languages = Object.keys(d.pronunciations)
  const body = JSON.stringify({
    name: d.name,
    dictionary_id: dictId,
    description: d.description,
    word_count: wordCount,
    languages,
    updated_at: new Date().toISOString(),
  })
  const r = await fetch(
    `${SUPABASE_URL!.replace(/\/$/, '')}/rest/v1/sarvam_dictionaries?on_conflict=name`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body,
    },
  )
  if (!r.ok) {
    const errText = await r.text().catch(() => '')
    throw new Error(`Registry upsert failed for ${d.name}: HTTP ${r.status} — ${errText.slice(0, 200)}`)
  }
}

// ── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
  await ensureEnv()

  console.log('[seed-dict] Seeding 3 pronunciation dictionaries…\n')
  let created = 0, updated = 0, failed = 0

  for (const d of DICTS) {
    const wordCount = Object.values(d.pronunciations).reduce((s, l) => s + Object.keys(l).length, 0)
    try {
      const existing = await existingRegistry(d.name)
      let dictId: string
      if (existing) {
        console.log(`  · ${d.name}  →  ${existing.dictionary_id}  (update, ${wordCount} words)`)
        await updateAtSarvam(existing.dictionary_id, d)
        dictId = existing.dictionary_id
        updated++
      } else {
        dictId = await createAtSarvam(d)
        console.log(`  + ${d.name}  →  ${dictId}  (created, ${wordCount} words)`)
        created++
      }
      await upsertRegistry(d, dictId)
    } catch (e) {
      console.error(`  ! ${d.name} failed: ${(e as Error).message}`)
      failed++
    }
  }

  console.log(`\n[seed-dict] Done — ${created} created, ${updated} updated, ${failed} failed.`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
