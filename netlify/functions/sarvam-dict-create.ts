/* ================================================================
   SARVAM AI — Pronunciation Dictionary: create

   POST /.netlify/functions/sarvam-dict-create  (multipart/form-data)

   Form fields:
     file         the JSON file with { pronunciations: { ... } }
     name         human-friendly name → 'ghl-financial', 'gio-trading'
     description  (optional) free text shown in the registry
     languages    (optional) comma-separated BCP-47 codes for the registry

   Returns: { dictionary_id, name, ... } (the registry row).

   Auth: super_admin / admin only. Dictionaries are global shared
   state that every TTS caller can attach via dict_id, so we want
   one source of truth — not per-user.
   ================================================================ */

import { SARVAM_ENDPOINTS } from '../../lib/sarvam/types'
import {
  SarvamApiError,
  assertSarvamConfigured,
  logSarvamCall,
  sarvamFetch,
} from '../../lib/sarvam/client'

const ALLOWED_ORIGINS = [
  'https://ghl-india-ventures-2025.netlify.app',
  'https://ghlindiaventures.com',
  'https://www.ghlindiaventures.com',
]
function corsHeaders(req: Request): Record<string, string> {
  const o = req.headers.get('origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
const json = (status: number, body: unknown, req: Request) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function requireAdmin(authHeader: string): Promise<{ userId: string } | Response> {
  try {
    const verify = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: SUPABASE_ANON },
    })
    if (!verify.ok) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 })
    const u = await verify.json()
    if (!u?.id) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 })
    // Role check via service role (anon RLS may hide other rows).
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${u.id}&select=role`, {
      headers: { apikey: SUPABASE_SERVICE, Authorization: `Bearer ${SUPABASE_SERVICE}` },
    })
    const rows = await r.json() as Array<{ role: string }>
    const role = rows?.[0]?.role || ''
    if (!['admin', 'super_admin'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), { status: 403 })
    }
    return { userId: u.id }
  } catch {
    return new Response(JSON.stringify({ error: 'Auth verification failed' }), { status: 401 })
  }
}

export default async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' }, request)

  try { assertSarvamConfigured() } catch (e) {
    return json(500, { error: (e as Error).message }, request)
  }
  if (!SUPABASE_URL || !SUPABASE_ANON || !SUPABASE_SERVICE) {
    return json(500, { error: 'Supabase env vars not configured' }, request)
  }

  const auth = request.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) return json(401, { error: 'Missing Authorization header' }, request)

  const adminCheck = await requireAdmin(auth)
  if (adminCheck instanceof Response) {
    const status = adminCheck.status
    const body = await adminCheck.json()
    return json(status, body, request)
  }
  const { userId } = adminCheck

  let form: FormData
  try { form = await request.formData() } catch {
    return json(400, { error: 'Expected multipart/form-data' }, request)
  }
  const file = form.get('file')
  if (!(file instanceof Blob)) return json(400, { error: 'Missing `file` field' }, request)
  const name = String(form.get('name') || '').trim()
  if (!name) return json(400, { error: 'Missing `name` field' }, request)
  const description = String(form.get('description') || '').trim() || null
  const languages = String(form.get('languages') || '').split(',').map(s => s.trim()).filter(Boolean)

  // Validate the JSON quickly so we don't burn a Sarvam call on a typo.
  let payload: Record<string, unknown>
  try {
    const txt = await file.text()
    payload = JSON.parse(txt)
    if (!payload || typeof payload !== 'object' || !('pronunciations' in payload)) {
      throw new Error('JSON must contain `pronunciations`')
    }
  } catch (e) {
    return json(400, { error: (e as Error).message || 'Invalid dictionary JSON' }, request)
  }

  // Word count for the registry — cheap traversal.
  let wordCount = 0
  const langSet = new Set<string>(languages)
  for (const [lang, entries] of Object.entries((payload as { pronunciations: Record<string, unknown> }).pronunciations || {})) {
    if (entries && typeof entries === 'object') {
      wordCount += Object.keys(entries as Record<string, unknown>).length
      langSet.add(lang)
    }
  }

  try {
    // Sarvam expects multipart with the file under `file`. Forward
    // our parsed JSON as a new Blob so unknown form fields don't leak.
    const upstreamForm = new FormData()
    upstreamForm.append('file', new Blob([JSON.stringify(payload)], { type: 'application/json' }), `${name}.json`)
    const resp = await sarvamFetch(SARVAM_ENDPOINTS.DICT, {
      method: 'POST',
      body: upstreamForm,
    }, {
      logEndpoint: 'dict-create',
      timeoutMs: 30_000,
      logContext: { user_id: userId, input_chars: wordCount },
    })
    const data = await resp.json() as { dictionary_id?: string }
    if (!data.dictionary_id) {
      return json(502, { error: 'Sarvam returned no dictionary_id' }, request)
    }

    // Persist to sarvam_dictionaries registry (idempotent by name —
    // upsert so re-running the seeder doesn't error).
    await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_dictionaries?on_conflict=name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE,
        Authorization: `Bearer ${SUPABASE_SERVICE}`,
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        name,
        dictionary_id: data.dictionary_id,
        description,
        word_count: wordCount,
        languages: Array.from(langSet),
        created_by: userId,
        updated_at: new Date().toISOString(),
      }),
    }).catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('[sarvam-dict-create] registry upsert failed:', (e as Error)?.message)
    })

    return new Response(JSON.stringify({
      dictionary_id: data.dictionary_id,
      name,
      word_count: wordCount,
      languages: Array.from(langSet),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
    })
  } catch (e: unknown) {
    if (e instanceof SarvamApiError) {
      logSarvamCall({
        user_id: userId,
        endpoint: 'dict-create',
        status: e.status,
        latency_ms: 0,
        error_code: e.code,
        error_message: e.message.slice(0, 500),
        request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message,
        code: e.code,
        request_id: e.requestId,
      }, request)
    }
    return json(500, { error: (e as Error)?.message || 'Dict create failed' }, request)
  }
}
