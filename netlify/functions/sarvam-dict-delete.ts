/* ================================================================
   SARVAM AI — Pronunciation Dictionary: delete

   POST /.netlify/functions/sarvam-dict-delete?id=p_xxxxxxxx
   (Body ignored. POST instead of DELETE for the same edge-layer
   reason as -update.)

   Deletes the dictionary at Sarvam AND the registry row.
   Auth: super_admin / admin only. Confirm prompt is the UI's job.
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

  try {
    await sarvamFetch(SARVAM_ENDPOINTS.DICT_BY_ID(id), { method: 'DELETE' }, {
      logEndpoint: 'dict-delete',
      timeoutMs: 20_000,
      maxRetries: 1,
      logContext: { user_id: userId },
    })

    // Drop the registry row.
    await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_dictionaries?dictionary_id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_SERVICE, Authorization: `Bearer ${SUPABASE_SERVICE}` },
    }).catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('[sarvam-dict-delete] registry delete failed:', (e as Error)?.message)
    })

    return new Response(JSON.stringify({ deleted: true, dictionary_id: id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
    })
  } catch (e: unknown) {
    if (e instanceof SarvamApiError) {
      logSarvamCall({
        user_id: userId, endpoint: 'dict-delete', status: e.status, latency_ms: 0,
        error_code: e.code, error_message: e.message.slice(0, 500), request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message, code: e.code, request_id: e.requestId,
      }, request)
    }
    return json(500, { error: (e as Error)?.message || 'Dict delete failed' }, request)
  }
}
