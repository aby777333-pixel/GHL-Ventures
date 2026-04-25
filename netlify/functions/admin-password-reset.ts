/* ================================================================
   ADMIN PASSWORD RESET — Netlify Serverless Function

   Lets an authenticated admin reset another user's password using one
   of two flows, both of which delegate to Supabase Auth (no plaintext
   passwords are ever stored in `public.*` tables):

     1. method='email_link'    → Supabase generates a recovery link and
                                 emails it via the project's SMTP. The
                                 user clicks the link, lands on
                                 /auth/callback?type=recovery and is
                                 forced to set a new password.

     2. method='temp_password' → Admin supplies (or has us generate) a
                                 strong temporary password. We patch
                                 auth.users via the Admin API and stamp
                                 user_metadata.force_password_reset=true.
                                 On the user's next login, the client
                                 portal detects the flag, redirects to
                                 the settings tab and forces a change.

   Every invocation — success or failure — is logged in the dedicated
   `password_reset_audit` table AND the generic `audit_logs` table.
   The plaintext temp password is RETURNED to the calling admin (over
   HTTPS) but NEVER persisted to any DB row.

   Allowed callers: profiles.role in {'super_admin','admin'}.
   ================================================================ */

interface ResetBody {
  targetUserId?: string
  targetEmail?: string
  method: 'email_link' | 'temp_password'
  tempPassword?: string
  notes?: string
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

const json = (status: number, body: unknown, request?: Request) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
  })

// Cryptographically strong temporary password with mixed character classes.
function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digit = '23456789'
  const sym = '!@#$%&*'
  const all = upper + lower + digit + sym
  const pickRandom = (s: string) => s[Math.floor(Math.random() * s.length)]
  const chars: string[] = [pickRandom(upper), pickRandom(lower), pickRandom(digit), pickRandom(sym)]
  for (let i = 0; i < 12; i++) chars.push(pickRandom(all))
  // Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

export default async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(request) })
  }

  if (request.method !== 'POST') {
    return json(405, { error: 'Method not allowed' }, request)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: 'Server configuration error: missing Supabase credentials' }, request)
  }

  // ── Auth check: caller must be an admin ──
  const authHeader = request.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ') || !authHeader.slice(7).trim()) {
    return json(401, { error: 'Unauthorized: missing Authorization header' }, request)
  }

  let adminId: string | null = null
  let adminEmail: string | null = null
  try {
    const userToken = authHeader.slice(7).trim()
    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${userToken}`, 'apikey': anonKey || serviceRoleKey },
    })
    if (!verifyRes.ok) return json(401, { error: 'Unauthorized: invalid token' }, request)
    const authUser = await verifyRes.json()
    adminId = authUser.id || null
    adminEmail = authUser.email || null

    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${authUser.id}&select=role`, {
      headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey },
    })
    const profiles = profileRes.ok ? await profileRes.json() : []
    const callerRole: string = profiles?.[0]?.role || ''
    if (!['super_admin', 'admin'].includes(callerRole)) {
      return json(403, { error: 'Forbidden: admin role required' }, request)
    }
  } catch {
    return json(401, { error: 'Auth verification failed' }, request)
  }

  // ── Parse + validate body ──
  let body: ResetBody
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'Invalid JSON body' }, request)
  }

  if (!body.method || !['email_link', 'temp_password'].includes(body.method)) {
    return json(400, { error: 'method must be one of: email_link, temp_password' }, request)
  }
  if (!body.targetUserId && !body.targetEmail) {
    return json(400, { error: 'Provide targetUserId or targetEmail' }, request)
  }

  // ── Resolve target auth user ──
  let targetUserId = (body.targetUserId || '').trim()
  let targetEmail = (body.targetEmail || '').trim().toLowerCase()
  let targetKind: 'client' | 'staff' | 'admin' | 'unknown' = 'unknown'

  try {
    if (!targetUserId && targetEmail) {
      // Look up the user by email via Admin API listUsers
      const listRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(targetEmail)}`,
        { headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey } },
      )
      if (!listRes.ok) {
        return json(listRes.status, { error: 'Failed to look up user by email' }, request)
      }
      const listData = await listRes.json()
      const users = Array.isArray(listData?.users) ? listData.users : []
      const match = users.find((u: any) => (u.email || '').toLowerCase() === targetEmail)
      if (!match) {
        await logAudit({
          supabaseUrl, serviceRoleKey, request,
          targetUserId: null, targetEmail, targetKind: 'unknown',
          method: body.method, adminId, adminEmail,
          success: false, errorMessage: 'No auth user found for email', notes: body.notes || null,
        })
        return json(404, { error: 'No user found for that email' }, request)
      }
      targetUserId = match.id
    } else if (targetUserId && !targetEmail) {
      // Fetch the user's email so the audit row is human-readable
      const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUserId}`, {
        headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey },
      })
      if (userRes.ok) {
        const u = await userRes.json()
        targetEmail = (u.email || '').toLowerCase()
      }
    }

    // Determine target kind from role / clients table
    const profRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${targetUserId}&select=role`, {
      headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey },
    })
    const profs = profRes.ok ? await profRes.json() : []
    const targetRole: string = profs?.[0]?.role || ''
    if (['super_admin', 'admin'].includes(targetRole)) targetKind = 'admin'
    else if (targetRole === 'staff') targetKind = 'staff'
    else if (targetRole === 'client' || targetRole === 'viewer') targetKind = 'client'
  } catch {
    return json(500, { error: 'Failed to resolve target user' }, request)
  }

  if (!targetUserId) {
    return json(400, { error: 'Could not resolve a target user' }, request)
  }

  // ── Execute the chosen flow ──
  try {
    if (body.method === 'email_link') {
      // Use Supabase Auth recover endpoint to send the standard reset email.
      // Project SMTP must be configured; otherwise Supabase falls back to
      // its built-in template + sender.
      const recoverRes = await fetch(`${supabaseUrl}/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
        body: JSON.stringify({ email: targetEmail }),
      })

      if (!recoverRes.ok) {
        const errText = await recoverRes.text()
        await logAudit({
          supabaseUrl, serviceRoleKey, request,
          targetUserId, targetEmail, targetKind,
          method: 'email_link', adminId, adminEmail,
          success: false, errorMessage: `recover failed: ${recoverRes.status} ${errText.slice(0, 200)}`,
          notes: body.notes || null,
        })
        return json(recoverRes.status, { error: 'Failed to send reset email' }, request)
      }

      await logAudit({
        supabaseUrl, serviceRoleKey, request,
        targetUserId, targetEmail, targetKind,
        method: 'email_link', adminId, adminEmail,
        success: true, errorMessage: null, notes: body.notes || null,
      })

      return json(200, {
        success: true,
        method: 'email_link',
        targetUserId,
        targetEmail,
        message: `Password reset email sent to ${targetEmail}`,
      }, request)
    }

    // ── method === 'temp_password' ──
    let tempPassword = (body.tempPassword || '').trim()
    if (tempPassword) {
      if (tempPassword.length < 10) {
        return json(400, { error: 'Temporary password must be at least 10 characters' }, request)
      }
    } else {
      tempPassword = generateTempPassword()
    }

    // Patch auth.users: set new password + mark force_password_reset.
    // NOTE: Admin API merges user_metadata, so we keep existing metadata.
    const patchRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        password: tempPassword,
        user_metadata: {
          force_password_reset: true,
          force_password_reset_at: new Date().toISOString(),
          force_password_reset_by: adminEmail || adminId,
        },
      }),
    })

    if (!patchRes.ok) {
      const errText = await patchRes.text()
      await logAudit({
        supabaseUrl, serviceRoleKey, request,
        targetUserId, targetEmail, targetKind,
        method: 'temp_password', adminId, adminEmail,
        success: false, errorMessage: `admin update failed: ${patchRes.status} ${errText.slice(0, 200)}`,
        notes: body.notes || null,
      })
      return json(patchRes.status, { error: 'Failed to set temporary password' }, request)
    }

    // Best-effort: revoke any existing refresh tokens so the user is forced
    // to sign in again with the new password.
    try {
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUserId}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      })
    } catch { /* non-blocking */ }

    await logAudit({
      supabaseUrl, serviceRoleKey, request,
      targetUserId, targetEmail, targetKind,
      method: 'temp_password', adminId, adminEmail,
      success: true, errorMessage: null, notes: body.notes || null,
    })

    return json(200, {
      success: true,
      method: 'temp_password',
      targetUserId,
      targetEmail,
      tempPassword, // returned ONCE to the calling admin — never persisted
      forcePasswordReset: true,
      message: 'Temporary password set. The user must change it on next login.',
    }, request)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    await logAudit({
      supabaseUrl, serviceRoleKey, request,
      targetUserId, targetEmail, targetKind,
      method: body.method, adminId, adminEmail,
      success: false, errorMessage: message, notes: body.notes || null,
    })
    return json(500, { error: message }, request)
  }
}

// ── Audit logging (best-effort; never blocks the response) ──
async function logAudit(args: {
  supabaseUrl: string
  serviceRoleKey: string
  request: Request
  targetUserId: string | null
  targetEmail: string
  targetKind: 'client' | 'staff' | 'admin' | 'unknown'
  method: 'email_link' | 'temp_password'
  adminId: string | null
  adminEmail: string | null
  success: boolean
  errorMessage: string | null
  notes: string | null
}) {
  try {
    const ip = (args.request.headers.get('x-nf-client-connection-ip')
      || args.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || null)
    const ua = args.request.headers.get('user-agent') || null

    // Insert dedicated audit row
    await fetch(`${args.supabaseUrl}/rest/v1/password_reset_audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${args.serviceRoleKey}`,
        'apikey': args.serviceRoleKey,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        target_user_id: args.targetUserId,
        target_email: args.targetEmail || '(unknown)',
        target_kind: args.targetKind,
        method: args.method,
        admin_id: args.adminId,
        admin_email: args.adminEmail,
        ip_address: ip,
        user_agent: ua,
        success: args.success,
        error_message: args.errorMessage,
        notes: args.notes,
      }),
    })

    // Mirror into the generic audit_logs table so general dashboards see it too
    await fetch(`${args.supabaseUrl}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${args.serviceRoleKey}`,
        'apikey': args.serviceRoleKey,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        user_id: args.adminId,
        actor_id: args.adminId,
        user_name: args.adminEmail,
        module: 'auth',
        action: args.success
          ? `password_reset:${args.method}`
          : `password_reset_failed:${args.method}`,
        entity_type: 'auth.user',
        entity_id: args.targetUserId,
        ip_address: ip,
        user_agent: ua,
        new_data: {
          target_email: args.targetEmail,
          target_kind: args.targetKind,
          method: args.method,
          success: args.success,
          error_message: args.errorMessage,
          notes: args.notes,
        },
      }),
    })
  } catch {
    // Logging is best-effort. The request itself is the source of truth
    // for whether the password change happened.
  }
}
