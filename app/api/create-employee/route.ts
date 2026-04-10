import { NextRequest, NextResponse } from 'next/server'

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

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error: missing Supabase credentials' }, { status: 500 })
  }

  // Auth Check: Verify caller is an authenticated admin
  const authHeader = request.headers.get('Authorization') || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!authHeader.startsWith('Bearer ') || !authHeader.slice(7).trim()) {
    return NextResponse.json({ error: 'Unauthorized: missing Authorization header' }, { status: 401 })
  }

  try {
    const userToken = authHeader.slice(7).trim()
    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${userToken}`, 'apikey': anonKey || serviceRoleKey },
    })
    if (!verifyRes.ok) {
      return NextResponse.json({ error: 'Unauthorized: invalid token' }, { status: 401 })
    }
    const authUser = await verifyRes.json()
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${authUser.id}&select=role`, {
      headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey },
    })
    const profiles = profileRes.ok ? await profileRes.json() : []
    const callerRole = profiles?.[0]?.role || ''
    const adminRoles = ['super_admin', 'admin', 'compliance_officer', 'fund_manager', 'manager']
    if (!adminRoles.includes(callerRole)) {
      return NextResponse.json({ error: 'Forbidden: admin role required' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Auth verification failed' }, { status: 401 })
  }

  try {
    const body: CreateEmployeeBody = await request.json()

    if (!body.email || !body.password || !body.fullName || !body.department || !body.designation) {
      return NextResponse.json({ error: 'Missing required fields: email, password, fullName, department, designation' }, { status: 400 })
    }

    if (body.password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Step 1: Create auth.users account
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
        user_metadata: { full_name: body.fullName, phone: body.phone || null },
      }),
    })

    const createUserData = await createUserResponse.json()

    if (!createUserResponse.ok) {
      const errMsg = createUserData?.msg || createUserData?.message || createUserData?.error?.message || 'Failed to create user account'
      return NextResponse.json({ error: errMsg }, { status: createUserResponse.status })
    }

    const userId = createUserData.id
    if (!userId) {
      return NextResponse.json({ error: 'User creation succeeded but no user ID returned' }, { status: 500 })
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
      return NextResponse.json({
        success: true,
        userId,
        warning: 'Auth account created but profile records may need manual setup',
      }, { status: 201 })
    }

    return NextResponse.json({
      success: true,
      userId,
      email: body.email,
      fullName: body.fullName,
      designation: body.designation,
      department: body.department,
    }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
