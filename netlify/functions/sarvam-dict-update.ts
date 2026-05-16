/* ================================================================
   SARVAM AI — Pronunciation Dictionary: update (PATCH)

   POST /.netlify/functions/sarvam-dict-update?id=p_xxxxxxxx
   (multipart/form-data with `file` + optional `description` /
   `languages` to refresh registry metadata)

   Why POST and not PATCH on the function URL: Netlify Functions
   reliably proxy POST + multipart; PATCH multipart can hit edge
   layer quirks. We do the upstream PATCH internally.

   Auth: super_admin / admin only.
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
const corsHeaders = (req: Request) => {
  const o = req.headers.get('origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
const json = (status: number, body: unknown, req: Request) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders(req) } })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function requireAdmin(auth: string): Promise<{ userId: string } | { error: string; status: number }> {
  try {
    const verify = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: auth, apikey: SUPABASE_ANON },
    })
    if (!verify.ok) return { error: 'Invalid session', status: 401 }
    const u = await verify.json()
    if (!u?.id) return { error: 'Invalid session', status: 401 }
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${u.id}&select=role`, {
      headers: { apikey: SUPABASE_SERVICE, Authorization: `Bearer ${SUPABASE_SERVICE}` },
    })
    const rows = await r.json() as Array<{ role: string }>
    if (!['admin', 'super_admin'].includes(rows?.[0]?.role || '')) {
      return { error: 'Admin role required', status: 403 }
    }
    return { userId: u.id }
  } catch {
    return { error: 'Auth verification failed', status: 401 }
  }
}

export default async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' }, request)

  try { assertSarvamConfigured() } catch (e) { return json(500, { error: (e as Error).message }, request) }
  if (!SUPABASE_URL || !SUPABASE_ANON || !SUPABASE_SERVICE) {
    return json(500, { error: 'Supabase env vars not configured' }, request)
  }

  const auth = request.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) return json(401, { error: 'Missing Authorization header' }, request)
  const adminCheck = await requireAdmin(auth)
  if ('error' in adminCheck) return json(adminCheck.status, { error: adminCheck.error }, request)
  const { userId } = adminCheck

  const url = new URL(request.url)
  const id = (url.searchParams.get('id') || '').trim()
  if (!id || !/^p_[a-zA-Z0-9_-]+$/.test(id)) {
    return json(400, { error: 'valid `id` query param required' }, request)
  }

  let form: FormData
  try { form = await request.formData() } catch {
    return json(400, { error: 'Expected multipart/form-data' }, request)
  }
  const file = form.get('file')
  if (!(file instanceof Blob)) return json(400, { error: 'Missing `file` field' }, request)
  const description = String(form.get('description') || '').trim()
  const languages = String(form.get('languages') || '').split(',').map(s => s.trim()).filter(Boolean)

  // Validate JSON.
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

  let wordCount = 0
  const langSet = new Set<string>(languages)
  for (const [lang, entries] of Object.entries((payload as { pronunciations: Record<string, unknown> }).pronunciations || {})) {
    if (entries && typeof entries === 'object') {
      wordCount += Object.keys(entries as Record<string, unknown>).length
      langSet.add(lang)
    }
  }

  try {
    const upstreamForm = new FormData()
    upstreamForm.append('file', new Blob([JSON.stringify(payload)], { type: 'application/json' }), `${id}.json`)
    await sarvamFetch(SARVAM_ENDPOINTS.DICT_BY_ID(id), {
      method: 'PATCH',
      body: upstreamForm,
    }, {
      logEndpoint: 'dict-update',
      timeoutMs: 30_000,
      logContext: { user_id: userId, input_chars: wordCount },
    })

    // Update registry row (idempotent).
    const patch: Record<string, unknown> = {
      word_count: wordCount,
      languages: Array.from(langSet),
      updated_at: new Date().toISOString(),
    }
    if (description) patch.description = description
    await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_dictionaries?dictionary_id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE,
        Authorization: `Bearer ${SUPABASE_SERVICE}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    }).catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('[sarvam-dict-update] registry patch failed:', (e as Error)?.message)
    })

    return new Response(JSON.stringify({ dictionary_id: id, word_count: wordCount, languages: Array.from(langSet) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
    })
  } catch (e: unknown) {
    if (e instanceof SarvamApiError) {
      logSarvamCall({
        user_id: userId, endpoint: 'dict-update', status: e.status, latency_ms: 0,
        error_code: e.code, error_message: e.message.slice(0, 500), request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message, code: e.code, request_id: e.requestId,
      }, request)
    }
    return json(500, { error: (e as Error)?.message || 'Dict update failed' }, request)
  }
}
