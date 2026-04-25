/* ─────────────────────────────────────────────────────────────
   reset-test-storage.mjs

   One-off cleanup helper that empties the storage buckets used
   for client/investor test data after the DB-side reset on
   2026-04-25. Skips buckets that hold app/marketing/staff assets.

   Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from the
   environment (passed via netlify env or a .env loader). Run
   with:  node scripts/reset-test-storage.mjs
   ───────────────────────────────────────────────────────────── */

import { createClient } from '@supabase/supabase-js'

const URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

if (!URL || !KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.')
  process.exit(1)
}

// Buckets that hold per-user / test data → wipe.
const WIPE_BUCKETS = [
  'kyc-documents',
  'client-uploads',
  'documents',
  'investment-documents',
  'lead-attachments',
  'message-attachments',
  'chat-files',
  'downloads',
  'ghl-temp-uploads',
  'legacy-kyc-documents',
  'legacy-uploads',
  'resumes',
  'reports',
  'ghl-exports',
  'avatars',
]

const supabase = createClient(URL, KEY, { auth: { persistSession: false } })

async function listAll(bucket) {
  // storage list returns at most ~1000 entries per call; recurse one
  // level for buckets that use a top-level folder.
  const collected = []
  async function walk(prefix) {
    let offset = 0
    while (true) {
      const { data, error } = await supabase.storage.from(bucket).list(prefix, {
        limit: 1000,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      })
      if (error) {
        console.warn(`[${bucket}] list error at "${prefix}":`, error.message)
        return
      }
      if (!data || data.length === 0) break
      for (const obj of data) {
        const name = prefix ? `${prefix}/${obj.name}` : obj.name
        if (obj.id === null) {
          // It's a folder — recurse
          await walk(name)
        } else {
          collected.push(name)
        }
      }
      if (data.length < 1000) break
      offset += data.length
    }
  }
  await walk('')
  return collected
}

async function wipeBucket(bucket) {
  const paths = await listAll(bucket)
  if (paths.length === 0) {
    console.log(`[${bucket}] empty — skip`)
    return { bucket, removed: 0, errors: 0 }
  }
  console.log(`[${bucket}] removing ${paths.length} object(s)...`)
  let removed = 0
  let errors = 0
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100)
    const { data, error } = await supabase.storage.from(bucket).remove(batch)
    if (error) {
      console.warn(`[${bucket}] batch error:`, error.message)
      errors += batch.length
    } else {
      removed += data?.length || batch.length
    }
  }
  console.log(`[${bucket}] removed=${removed} errors=${errors}`)
  return { bucket, removed, errors }
}

const summary = []
for (const b of WIPE_BUCKETS) {
  try {
    const r = await wipeBucket(b)
    summary.push(r)
  } catch (e) {
    console.error(`[${b}] fatal:`, e?.message || e)
    summary.push({ bucket: b, removed: 0, errors: -1 })
  }
}

console.log('\n── Summary ──')
console.table(summary)
