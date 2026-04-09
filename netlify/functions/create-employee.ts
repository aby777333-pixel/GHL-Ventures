/* ================================================================
   CREATE EMPLOYEE — Netlify Serverless Function

   Uses the Supabase Admin API (service_role key) to create a new
   auth.users account for an employee, then calls an RPC to create
   the corresponding profiles + staff_profiles rows.

   Only callable by authenticated admins.
   ================================================================ */

interface CreateEmployeeBody {
  email: string
  password: string
  fullName: string
  phone?: string
  employeeId?: string
  department: string
  designation: string
  dateOfJoining?: string
  reportingTo?: string | null
}

const ALLOWED_ORIGINS = [
  'https://ghl-india-ventures-2025.netlify.app',
  'https://ghlindiaventures.com',
  'https://www.ghlindiaventures.com',
]

function getCorsHeaders(request?: Request) {
  const origin = request?.headers?.get('origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
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

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error: missing Supabase credentials' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }

  // ── Auth Check: Verify caller is an authenticated admin ──
  const authHeader = request.headers.get('Authorization') || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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
    // Verify caller has admin role via profiles table
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
  } catch (authErr) {
    return new Response(
      JSON.stringify({ error: 'Auth verification failed' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
    )
  }

  try {
    const body: CreateEmployeeBody = await request.json()

    // Validate required fields
    if (!body.email || !body.password || !body.fullName || !body.department || !body.designation) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, fullName, department, designation' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    // Validate password strength
    if (body.password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    // Step 1: Create auth.users account via Supabase Admin API
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
        email_confirm: true, // Auto-confirm the email
        user_metadata: {
          full_name: body.fullName,
          phone: body.phone || null,
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

    // Step 2: Create profiles + staff_profiles via RPC
    const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/create_employee_profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_full_name: body.fullName,
        p_email: body.email,
        p_phone: body.phone || null,
        p_employee_id: body.employeeId || null,
        p_department: body.department,
        p_designation: body.designation,
        p_date_of_joining: body.dateOfJoining || new Date().toISOString().split('T')[0],
        p_reporting_to: body.reportingTo || null,
      }),
    })

    if (!rpcResponse.ok) {
      const rpcError = await rpcResponse.text()
      console.error('[create-employee] RPC failed:', rpcError)
      // Still return success since the auth user was created
      return new Response(
        JSON.stringify({
          success: true,
          userId,
          warning: 'Auth account created but profile records may need manual setup',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        email: body.email,
        fullName: body.fullName,
        designation: body.designation,
        department: body.department,
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
