/* ================================================================
   SARVAM AI — Pronunciation Dictionary: get contents

   GET /.netlify/functions/sarvam-dict-get?id=p_xxxxxxxx

   Returns Sarvam's JSON for the dictionary (pronunciations map).
   Auth: any signed-in user.
   ================================================================ */

import { SARVAM_ENDPOINTS } from '../../lib/sarvam/types'
import { SarvamApiError, assertSarvamConfigured, logSarvamCall, sarvamFetch } from '../../lib/sarvam/client'

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }
}
const json = (status: number, body: unknown, req: Request) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders(req) } })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export default async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== 'GET') return json(405, { error: 'Method not allowed' }, request)

  try { assertSarvamConfigured() } catch (e) { return json(500, { error: (e as Error).message }, request) }
  if (!SUPABASE_URL || !SUPABASE_ANON) return json(500, { error: 'Supabase env vars not configured' }, request)

  const auth = request.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) return json(401, { error: 'Missing Authorization header' }, request)

  let userId: string | null = null
  try {
    const verify = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: auth, apikey: SUPABASE_ANON },
    })
    if (!verify.ok) return json(401, { error: 'Invalid session' }, request)
    const u = await verify.json()
    userId = u?.id || null
    if (!userId) return json(401, { error: 'Invalid session' }, request)
  } catch { return json(401, { error: 'Session verification failed' }, request) }

  const url = new URL(request.url)
  const id = (url.searchParams.get('id') || '').trim()
  if (!id) return json(400, { error: 'id query param is required' }, request)
  // Light sanity check — Sarvam IDs are 'p_' + alphanumerics.
  if (!/^p_[a-zA-Z0-9_-]+$/.test(id)) return json(400, { error: 'invalid dictionary id format' }, request)

  try {
    const resp = await sarvamFetch(SARVAM_ENDPOINTS.DICT_BY_ID(id), { method: 'GET' }, {
      logEndpoint: 'dict-get',
      timeoutMs: 20_000,
      maxRetries: 1,
      logContext: { user_id: userId },
    })
    const payload = await resp.json()
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
    })
  } catch (e: unknown) {
    if (e instanceof SarvamApiError) {
      logSarvamCall({
        user_id: userId, endpoint: 'dict-get', status: e.status, latency_ms: 0,
        error_code: e.code, error_message: e.message.slice(0, 500), request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message, code: e.code, request_id: e.requestId,
      }, request)
    }
    return json(500, { error: (e as Error)?.message || 'Dict get failed' }, request)
  }
}
