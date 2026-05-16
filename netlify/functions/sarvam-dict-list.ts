/* ================================================================
   SARVAM AI — Pronunciation Dictionary: list

   GET /.netlify/functions/sarvam-dict-list

   Returns a merged view:
     - Live list from Sarvam (/pronunciation-dictionary)
     - Registry rows from sarvam_dictionaries (name / description /
       word_count / languages) joined by dictionary_id.

   Auth: any signed-in user (TTS callers need the dictionary_id to
   attach to their requests).
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }
}
const json = (status: number, body: unknown, req: Request) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders(req) } })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== 'GET') return json(405, { error: 'Method not allowed' }, request)

  try { assertSarvamConfigured() } catch (e) { return json(500, { error: (e as Error).message }, request) }
  if (!SUPABASE_URL || !SUPABASE_ANON || !SUPABASE_SERVICE) {
    return json(500, { error: 'Supabase env vars not configured' }, request)
  }

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

  try {
    // Live list from Sarvam.
    const resp = await sarvamFetch(SARVAM_ENDPOINTS.DICT, { method: 'GET' }, {
      logEndpoint: 'dict-list',
      timeoutMs: 20_000,
      maxRetries: 1,
      logContext: { user_id: userId },
    })
    const sarvamList = await resp.json() as Array<{ dictionary_id?: string; id?: string; [k: string]: unknown }>

    // Registry rows.
    const reg = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sarvam_dictionaries?select=*`, {
      headers: { apikey: SUPABASE_SERVICE, Authorization: `Bearer ${SUPABASE_SERVICE}` },
    })
    const regRows = (reg.ok ? await reg.json() : []) as Array<{ dictionary_id: string; name: string; description: string | null; word_count: number; languages: string[] }>
    const byId = new Map(regRows.map((r) => [r.dictionary_id, r]))

    // Merge.
    const merged = sarvamList.map((d) => {
      const id = String(d.dictionary_id || d.id || '')
      const meta = byId.get(id)
      return {
        ...d,
        dictionary_id: id,
        name: meta?.name || null,
        description: meta?.description || null,
        word_count: meta?.word_count ?? null,
        languages: meta?.languages || null,
      }
    })

    return new Response(JSON.stringify({ dictionaries: merged }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
    })
  } catch (e: unknown) {
    if (e instanceof SarvamApiError) {
      logSarvamCall({
        user_id: userId,
        endpoint: 'dict-list',
        status: e.status,
        latency_ms: 0,
        error_code: e.code,
        error_message: e.message.slice(0, 500),
        request_id: e.requestId,
      })
      return json(e.status >= 400 && e.status < 600 ? e.status : 502, {
        error: e.message, code: e.code, request_id: e.requestId,
      }, request)
    }
    return json(500, { error: (e as Error)?.message || 'Dict list failed' }, request)
  }
}
