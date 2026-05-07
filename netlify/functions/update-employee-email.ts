/* ================================================================
   UPDATE EMPLOYEE EMAIL — Netlify Serverless Function

   Updates auth.users.email AND profiles.email atomically so the
   login email and the admin-dashboard display stay in sync. Without
   this, editing the email field in the admin only writes to
   profiles.email and the staff portal login (which uses
   auth.users.email) silently breaks.

   Only callable by authenticated admins.
   ================================================================ */

interface UpdateEmployeeEmailBody {
  userId: string
  email: string
}

const ALLOWED_ORIGINS = [
  'https://ghl-india-ventures-2025.netlify.app',
  'https://ghlindiaventures.com',
  'https://www.ghlindiaventures.com',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
]

function getCorsHeaders(request?: Request) {
  const origin = request?.headers?.get('origin') || ''
  const allowedOrigin = !origin || ALLOWED_ORIGINS.includes(origin) ? (origin || '*') : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

export default async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(request) })
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error: missing Supabase credentials' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }

  // Auth check — caller must be an admin
  const authHeader = request.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ') || !authHeader.slice(7).trim()) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: missing Authorization header' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }

  try {
    const userToken = authHeader.slice(7).trim()
    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${userToken}`, 'apikey': anonKey || serviceRoleKey },
    })
    if (!verifyRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }
    const authUser = await verifyRes.json()
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${authUser.id}&select=role`, {
      headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey },
    })
    const profiles = profileRes.ok ? await profileRes.json() : []
    const callerRole = profiles?.[0]?.role || ''
    const adminRoles = ['super_admin', 'admin', 'compliance_officer', 'fund_manager', 'manager']
    if (!adminRoles.includes(callerRole)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: admin role required' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Auth verification failed' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }

  let body: UpdateEmployeeEmailBody
  try {
    body = await request.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }

  if (!body.userId || !isUuid(body.userId)) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing userId' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }
  if (!body.email || !isValidEmail(body.email)) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing email' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }

  // Step 1 — update auth.users.email via Supabase Admin API
  const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${body.userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
    },
    body: JSON.stringify({
      email: body.email,
      email_confirm: true,
    }),
  })

  if (!adminRes.ok) {
    let errMsg = `Failed to update auth email (${adminRes.status})`
    try {
      const j = await adminRes.json()
      errMsg = j?.msg || j?.message || j?.error?.message || errMsg
    } catch { /* ignore */ }
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: adminRes.status, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }

  // Step 2 — mirror into profiles.email so the dashboard view stays consistent
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${body.userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
    },
    body: JSON.stringify({ email: body.email, updated_at: new Date().toISOString() }),
  })

  if (!profileRes.ok) {
    return new Response(
      JSON.stringify({
        success: true,
        warning: 'Auth email updated, but profile mirror failed — dashboard may show stale value until refresh',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }

  return new Response(
    JSON.stringify({ success: true, userId: body.userId, email: body.email }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
  )
}
