/* ================================================================
   ADMIN CREATE CLIENT — Netlify Serverless Function

   Creates an investor account on behalf of a client from the admin
   panel (Sales & CRM → Create Account). Uses the Supabase Admin API
   (service_role key) to:
     1. Create auth.users entry (email + phone confirmed by default).
     2. Rely on the existing auto-create triggers on auth.users to
        populate profiles + clients rows.
     3. Patch the newly-created clients row with admin-supplied fields
        (phone, acquisition_source='admin_created', referred_by, …).

   Admin-created accounts are treated as verified by default — no OTP
   or email confirmation is required. Only callable by authenticated
   admin / compliance / fund-manager roles.
   ================================================================ */

interface CreateClientBody {
  email: string
  password: string
  fullName?: string
  full_name?: string
  phone?: string
  referral?: string
  // 2026-05-15: optional admin-side fields. When `role` is provided AND in
  // ADMIN_ROLE_VALUES, after the standard creation flow the function will
  // promote the new profile to that role and (if `skip_client_row` is true)
  // delete the auto-created clients row so the user is an admin-only account.
  role?: string
  department?: string
  skip_client_row?: boolean
}

const ADMIN_ROLE_VALUES = [
  'super_admin', 'admin', 'compliance_officer', 'fund_manager',
  'manager', 'marketing_manager', 'sales',
  'marketing_executive', 'operations', 'hr', 'viewer',
]

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

export default async (request: Request) => {
  // Pre-flight
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

  // ── Auth Check: Verify caller is an authenticated admin ──
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

  try {
    const body: CreateClientBody = await request.json()
    // Allow both `fullName` (legacy) and `full_name` (new admin-user flow).
    const fullName = fullName || body.full_name || ''

    if (!body.email || !body.password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, full_name' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    if (body.password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    const phoneDigits = (body.phone || '').replace(/\D/g, '')

    // Step 1: Create auth.users via Supabase Admin API (email_confirm=true → no OTP).
    const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone: phoneDigits || null,
          referral_source: body.referral || null,
          created_by_admin: true,
        },
      }),
    })

    const createUserData = await createUserResponse.json()

    if (!createUserResponse.ok) {
      const errMsg = createUserData?.msg || createUserData?.message || createUserData?.error?.message || 'Failed to create user account'
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: createUserResponse.status, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    const userId = createUserData.id
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User creation succeeded but no user ID returned' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    // Step 2: Upsert profile (trigger may have already created one as 'viewer').
    // Keep the role='viewer' (client-equivalent) that the trigger sets; just
    // patch the fields we know. When `role` is provided AND in
    // ADMIN_ROLE_VALUES, promote the profile to that role and persist
    // department metadata for the Settings → Permissions view.
    const wantsAdminRole = !!body.role && ADMIN_ROLE_VALUES.includes(body.role)
    const profilePatch: Record<string, unknown> = {
      full_name: fullName,
      phone: phoneDigits || null,
      email: body.email,
    }
    if (wantsAdminRole) {
      profilePatch.role = body.role
      if (body.department) profilePatch.department = body.department
    }
    await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(profilePatch),
    })

    // 2026-05-15: admin-side user creation. Skip the clients-row patch below
    // and remove the auto-created clients row so the user is admin-only.
    if (wantsAdminRole && body.skip_client_row) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/clients?user_id=eq.${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey },
        })
      } catch { /* best-effort — RLS-safe */ }

      // Audit
      try {
        await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            action: 'create_admin_user',
            entity_type: 'user',
            entity_id: userId,
            module: 'settings',
            details: { email: body.email, role: body.role, department: body.department || null },
          }),
        })
      } catch { /* non-blocking */ }

      return new Response(
        JSON.stringify({ success: true, userId, email: body.email, fullName, role: body.role }),
        { status: 201, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    // Step 3: Patch the clients row created by the auto-trigger, or upsert
    // if the trigger did not run (e.g., role wasn't 'viewer'). The trigger
    // inserts (user_id, full_name, email). Update phone + acquisition_source.
    let clientId: string | null = null
    {
      // First try to find the client row created by the trigger.
      const lookupRes = await fetch(
        `${supabaseUrl}/rest/v1/clients?user_id=eq.${userId}&select=id,client_code,ghl_id`,
        { headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey } },
      )
      const existing = lookupRes.ok ? await lookupRes.json() : []
      if (Array.isArray(existing) && existing.length > 0) {
        clientId = existing[0].id
        await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${clientId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            full_name: fullName,
            email: body.email,
            phone: phoneDigits || null,
            acquisition_source: 'admin_created',
            referred_by: body.referral || null,
            kyc_status: 'pending',
            kyc_step: 0,
            is_active: true,
          }),
        })
      } else {
        // Fallback: insert a clients row directly.
        const insertRes = await fetch(`${supabaseUrl}/rest/v1/clients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            user_id: userId,
            full_name: fullName,
            email: body.email,
            phone: phoneDigits || null,
            acquisition_source: 'admin_created',
            referred_by: body.referral || null,
            kyc_status: 'pending',
            kyc_step: 0,
            is_active: true,
            risk_profile: 'moderate',
            total_invested: 0,
          }),
        })
        if (insertRes.ok) {
          const inserted = await insertRes.json()
          clientId = Array.isArray(inserted) ? inserted[0]?.id : inserted?.id
        }
      }
    }

    // Pending 30-04-2026 #12.a: also notify admins when a client is
    // created via this admin-side flow (not just public registration).
    // Best-effort — failures shouldn't block the success response.
    try {
      const adminsRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?role=in.(admin,super_admin)&select=id`,
        { headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey } },
      )
      if (adminsRes.ok) {
        const admins = (await adminsRes.json()) as Array<{ id: string }>
        if (Array.isArray(admins) && admins.length > 0) {
          const notifs = admins.map(a => ({
            user_id: a.id,
            title: 'New Client Created',
            message: `Admin created an account for ${fullName} (${body.email}). KYC pending.`,
            type: 'info',
            link: '/admin/clients',
            metadata: { client_id: clientId, user_id: userId, source: 'admin_created' },
          }))
          await fetch(`${supabaseUrl}/rest/v1/notifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify(notifs),
          })
        }
      }
    } catch (e) {
      console.warn('[admin-create-client] notify admins failed (non-fatal):', e)
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        clientId,
        email: body.email,
        fullName: fullName,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }
}
