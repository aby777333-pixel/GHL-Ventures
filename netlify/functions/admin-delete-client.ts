/* ================================================================
   ADMIN DELETE CLIENT — Netlify Serverless Function

   Wraps the public.admin_delete_client_full RPC with a Storage API
   cleanup pass (the RPC can't delete from storage.objects directly
   because Supabase ships a protect_delete trigger on that table).

   Flow:
     1. Auth-gate — caller must have role super_admin or admin.
     2. SELECT all storage paths for the client via the
        get_client_storage_paths RPC.
     3. Group paths by bucket, call the Storage REST API to remove.
     4. Call admin_delete_client_full to wipe DB rows + auth user.
   ================================================================ */

const ALLOWED_ORIGINS = [
  'https://ghl-india-ventures-2025.netlify.app',
  'https://ghlindiaventures.com',
  'https://www.ghlindiaventures.com',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
]

function getCorsHeaders(req?: Request) {
  const origin = req?.headers?.get('origin') || ''
  const allowed = !origin || ALLOWED_ORIGINS.includes(origin) ? (origin || '*') : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

const json = (status: number, body: unknown, req?: Request) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(req) } })

// Convert "kyc-documents/clients/foo.pdf" or a public URL → { bucket, path }.
// We accept three forms:
//   1) "<bucket>/<path>"
//   2) absolute URL with "/storage/v1/object/{public,sign}/<bucket>/<path>"
//   3) raw "<path>" (we can't infer bucket → caller must skip)
function splitPath(raw: string): { bucket: string; path: string } | null {
  if (!raw) return null
  // URL form
  const m = raw.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/)
  if (m) return { bucket: m[1], path: decodeURIComponent(m[2]) }
  // bucket/path form
  const slash = raw.indexOf('/')
  if (slash > 0) return { bucket: raw.slice(0, slash), path: raw.slice(slash + 1) }
  return null
}

export default async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: getCorsHeaders(request) })
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' }, request)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!supabaseUrl || !serviceKey) return json(500, { error: 'Missing Supabase credentials' }, request)

  // Auth-gate
  const authHeader = request.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) return json(401, { error: 'Missing Authorization header' }, request)
  let adminId: string | null = null
  let adminEmail: string | null = null
  try {
    const userToken = authHeader.slice(7).trim()
    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${userToken}`, 'apikey': anonKey || serviceKey },
    })
    if (!verifyRes.ok) return json(401, { error: 'Invalid token' }, request)
    const u = await verifyRes.json()
    adminId = u.id; adminEmail = u.email || null
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${u.id}&select=role`, {
      headers: { 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey },
    })
    const profs = profileRes.ok ? await profileRes.json() : []
    if (!['super_admin','admin'].includes(profs?.[0]?.role || '')) {
      return json(403, { error: 'Admin role required' }, request)
    }
  } catch {
    return json(401, { error: 'Auth verification failed' }, request)
  }

  let body: { clientId?: string }
  try { body = await request.json() } catch { return json(400, { error: 'Invalid JSON' }, request) }
  if (!body.clientId) return json(400, { error: 'clientId is required' }, request)

  // Step 1 — fetch storage paths via the RPC (SECURITY DEFINER)
  let paths: string[] = []
  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/rpc/get_client_storage_paths`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      body: JSON.stringify({ p_client_id: body.clientId }),
    })
    if (r.ok) paths = (await r.json()) || []
  } catch { /* non-fatal; DB purge still happens */ }

  // Step 2 — group by bucket and remove
  const removed: Record<string, number> = {}
  const failed: Record<string, number> = {}
  const grouped: Record<string, string[]> = {}
  for (const p of paths) {
    const split = splitPath(p)
    if (!split) continue
    if (!grouped[split.bucket]) grouped[split.bucket] = []
    grouped[split.bucket].push(split.path)
  }
  for (const [bucket, ps] of Object.entries(grouped)) {
    try {
      const r = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
        },
        body: JSON.stringify({ prefixes: ps }),
      })
      if (r.ok) removed[bucket] = ps.length
      else failed[bucket] = ps.length
    } catch {
      failed[bucket] = (failed[bucket] || 0) + ps.length
    }
  }

  // Step 3 — DB purge via the RPC
  const purgeRes = await fetch(`${supabaseUrl}/rest/v1/rpc/admin_delete_client_full`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
    },
    body: JSON.stringify({ p_client_id: body.clientId }),
  })
  if (!purgeRes.ok) {
    const err = await purgeRes.text()
    return json(purgeRes.status, { error: 'DB purge failed', detail: err.slice(0, 300) }, request)
  }
  const ok = await purgeRes.json()

  // Step 4 — audit row (best-effort)
  try {
    await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        user_id: adminId, actor_id: adminId, user_name: adminEmail,
        module: 'admin', action: 'delete_client_full',
        entity_type: 'client', entity_id: body.clientId,
        new_data: { paths_total: paths.length, removed, failed, rpc_ok: ok === true },
      }),
    })
  } catch { /* non-blocking */ }

  return json(200, {
    success: ok === true,
    clientId: body.clientId,
    storage: { removed, failed, totalPaths: paths.length },
  }, request)
}
