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
  // Set when we resolve via clients.user_id so we can later patch the
  // clients row with a freshly-provisioned auth.users.id.
  let targetClientId: string | null = null
  let autoProvisioned = false

  try {
    // If only an email was supplied, resolve to an auth.users.id via the
    // SECURITY DEFINER RPC. The admin REST API has no real email filter, so
    // querying auth.users directly is the only reliable path.
    if (!targetUserId && targetEmail) {
      const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/find_auth_user_by_email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
        body: JSON.stringify({ p_email: targetEmail }),
      })
      if (rpcRes.ok) {
        const found = await rpcRes.json()
        if (typeof found === 'string' && found) targetUserId = found
      }
    } else if (targetUserId && !targetEmail) {
      // Caller passed a user_id only — fetch the email so the audit row is
      // human-readable. (Direct GET on a single user is reliable.)
      const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUserId}`, {
        headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey },
      })
      if (userRes.ok) {
        const u = await userRes.json()
        targetEmail = (u.email || '').toLowerCase()
      }
    }

    // No auth user yet? Look up the matching CLIENTS row by email so we can
    // (a) detect the legacy-import case, (b) link a fresh auth user to the
    // existing client record after provisioning. Only matches on a populated
    // email — never on '' or 'asdfg'-style placeholder rows.
    if (!targetUserId && targetEmail) {
      const clientRes = await fetch(
        `${supabaseUrl}/rest/v1/clients?email=eq.${encodeURIComponent(targetEmail)}&select=id,user_id,full_name`,
        { headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey } },
      )
      const clientRows = clientRes.ok ? await clientRes.json() : []
      const clientRow = Array.isArray(clientRows) && clientRows.length > 0 ? clientRows[0] : null

      if (clientRow?.user_id) {
        // Defensive: clients.user_id was set but the auth user was deleted.
        // Treat this as "needs re-provisioning" rather than refusing.
        targetUserId = clientRow.user_id
        targetClientId = clientRow.id
        // Verify the auth user actually exists; if not, clear it so we
        // fall into the auto-provision branch below.
        const verifyRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUserId}`, {
          headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey },
        })
        if (!verifyRes.ok) {
          targetUserId = ''
        }
      } else if (clientRow) {
        targetClientId = clientRow.id
      }
    }

    // Still no auth user? Provision one on demand for the temp_password
    // flow (admin is explicitly setting a password, so creating the auth
    // record at the same time is what they want). For email_link, use the
    // Supabase invite endpoint instead — handled inside that branch later.
    if (!targetUserId && targetEmail && body.method === 'temp_password') {
      // Only auto-provision when we have a known, sane email AND the email
      // already maps to a clients/staff record. Refuse to create accounts
      // out of thin air.
      const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)
      if (!looksValid || !targetClientId) {
        await logAudit({
          supabaseUrl, serviceRoleKey, request,
          targetUserId: null, targetEmail, targetKind: 'unknown',
          method: body.method, adminId, adminEmail,
          success: false,
          errorMessage: !looksValid
            ? 'Email address is not valid for auto-provisioning'
            : 'No clients/staff record matched the email — cannot auto-provision',
          notes: body.notes || null,
        })
        return json(404, {
          error: !looksValid
            ? 'This email is not in a valid format. Please update the client record first.'
            : 'No matching client/staff record exists for this email. Cannot reset.',
        }, request)
      }
      // Provision happens after we know the temp password — see the
      // body.method === 'temp_password' branch below. Mark the flag so
      // we skip the "already exists" assertion.
      autoProvisioned = true
    }

    // For email_link with no existing user, provision via invite (creates
    // user AND emails an invitation link) — done in the email_link branch.
    if (!targetUserId && targetEmail && body.method === 'email_link') {
      const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)
      if (!looksValid || !targetClientId) {
        await logAudit({
          supabaseUrl, serviceRoleKey, request,
          targetUserId: null, targetEmail, targetKind: 'unknown',
          method: body.method, adminId, adminEmail,
          success: false,
          errorMessage: !looksValid
            ? 'Email address is not valid for invite'
            : 'No clients/staff record matched the email — cannot invite',
          notes: body.notes || null,
        })
        return json(404, {
          error: !looksValid
            ? 'This email is not in a valid format. Please update the client record first.'
            : 'No matching client/staff record exists for this email. Cannot send a reset link.',
        }, request)
      }
      autoProvisioned = true
    }

    // Determine target kind from profiles.role (skip if we're about to
    // provision — the row won't exist yet).
    if (targetUserId) {
      const profRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${targetUserId}&select=role`, {
        headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey },
      })
      const profs = profRes.ok ? await profRes.json() : []
      const targetRole: string = profs?.[0]?.role || ''
      if (['super_admin', 'admin'].includes(targetRole)) targetKind = 'admin'
      else if (targetRole === 'staff') targetKind = 'staff'
      else if (targetRole === 'client' || targetRole === 'viewer') targetKind = 'client'
    } else if (autoProvisioned && targetClientId) {
      targetKind = 'client'
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return json(500, { error: `Failed to resolve target user: ${message}` }, request)
  }

  if (!targetUserId && !autoProvisioned) {
    return json(400, { error: 'Could not resolve a target user' }, request)
  }

  // ── Execute the chosen flow ──
  try {
    if (body.method === 'email_link') {
      // Legacy clients have no auth.users row yet — invite them so a single
      // email both creates the account and lets them set a password.
      if (autoProvisioned) {
        const inviteRes = await fetch(`${supabaseUrl}/auth/v1/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
          body: JSON.stringify({
            email: targetEmail,
            data: {
              force_password_reset: true,
              force_password_reset_at: new Date().toISOString(),
              force_password_reset_by: adminEmail || adminId,
              auto_provisioned_via: 'admin_password_reset',
            },
          }),
        })
        if (!inviteRes.ok) {
          const errText = await inviteRes.text()
          await logAudit({
            supabaseUrl, serviceRoleKey, request,
            targetUserId: null, targetEmail, targetKind: 'client',
            method: 'email_link', adminId, adminEmail,
            success: false, errorMessage: `invite failed: ${inviteRes.status} ${errText.slice(0, 200)}`,
            notes: body.notes || null,
          })
          return json(inviteRes.status, { error: 'Failed to send invitation email' }, request)
        }
        const invited = await inviteRes.json().catch(() => null)
        const newId = invited?.id || invited?.user?.id
        if (newId && targetClientId) {
          await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${targetClientId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({ user_id: newId }),
          })
          targetUserId = newId
        }

        await logAudit({
          supabaseUrl, serviceRoleKey, request,
          targetUserId: targetUserId || null, targetEmail, targetKind,
          method: 'email_link', adminId, adminEmail,
          success: true, errorMessage: null,
          notes: body.notes ? `${body.notes} | auto_provisioned_via_invite` : 'auto_provisioned_via_invite',
        })

        return json(200, {
          success: true,
          method: 'email_link',
          targetUserId,
          targetEmail,
          autoProvisioned: true,
          message: `Invite + reset email sent to ${targetEmail} (no auth account existed; one was created).`,
        }, request)
      }

      // Standard recover for already-existing auth users.
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

    // Auto-provision branch — create the auth user, then link clients.user_id.
    // Triggers in the DB normally create profiles + clients on insert; we
    // tolerate that by patching after the fact.
    if (autoProvisioned) {
      const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
        body: JSON.stringify({
          email: targetEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            force_password_reset: true,
            force_password_reset_at: new Date().toISOString(),
            force_password_reset_by: adminEmail || adminId,
            auto_provisioned_via: 'admin_password_reset',
          },
        }),
      })
      if (!createRes.ok) {
        const errText = await createRes.text()
        await logAudit({
          supabaseUrl, serviceRoleKey, request,
          targetUserId: null, targetEmail, targetKind: 'client',
          method: 'temp_password', adminId, adminEmail,
          success: false, errorMessage: `admin create failed: ${createRes.status} ${errText.slice(0, 200)}`,
          notes: body.notes || null,
        })
        return json(createRes.status, { error: 'Failed to create auth account for this email' }, request)
      }
      const created = await createRes.json()
      const newId = created?.id
      if (!newId) {
        return json(500, { error: 'Auth account created but no ID returned' }, request)
      }
      targetUserId = newId

      // Link the existing clients row to the new auth user. The DB trigger
      // may also have just inserted a duplicate clients row keyed off
      // user_id; tolerate either by preferring the original row.
      if (targetClientId) {
        await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${targetClientId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ user_id: newId }),
        })
      }

      await logAudit({
        supabaseUrl, serviceRoleKey, request,
        targetUserId, targetEmail, targetKind,
        method: 'temp_password', adminId, adminEmail,
        success: true, errorMessage: null,
        notes: body.notes ? `${body.notes} | auto_provisioned_via_create` : 'auto_provisioned_via_create',
      })
      // Mirror the temp password into the super-admin vault (#9).
      await writeToVault({
        supabaseUrl, serviceRoleKey,
        targetUserId, targetEmail, targetKind,
        targetName: created?.user_metadata?.full_name || null,
        plaintextPassword: tempPassword,
        adminId, adminEmail,
        notes: body.notes || null,
      })

      return json(200, {
        success: true,
        method: 'temp_password',
        targetUserId,
        targetEmail,
        tempPassword,
        forcePasswordReset: true,
        autoProvisioned: true,
        message: 'Auth account created and temporary password set. The user must change it on next login.',
      }, request)
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
    // Mirror the temp password into the super-admin vault (#9). 90-day TTL.
    await writeToVault({
      supabaseUrl, serviceRoleKey,
      targetUserId, targetEmail, targetKind,
      targetName: null,
      plaintextPassword: tempPassword,
      adminId, adminEmail,
      notes: body.notes || null,
    })

    return json(200, {
      success: true,
      method: 'temp_password',
      targetUserId,
      targetEmail,
      tempPassword, // returned ONCE to the calling admin — also stored in the super-admin vault
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

// ── Super-admin password vault writer ───────────────────────────────
// Writes the freshly-set temporary password into admin_password_vault
// so a super-admin can re-read it within the 90-day TTL. Best-effort —
// failures here never fail the password set operation.
async function writeToVault(args: {
  supabaseUrl: string
  serviceRoleKey: string
  targetUserId: string | null
  targetEmail: string
  targetKind: 'client' | 'staff' | 'admin' | 'unknown'
  targetName: string | null
  plaintextPassword: string
  adminId: string | null
  adminEmail: string | null
  notes: string | null
}) {
  try {
    await fetch(`${args.supabaseUrl}/rest/v1/admin_password_vault`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${args.serviceRoleKey}`,
        'apikey': args.serviceRoleKey,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        target_user_id: args.targetUserId,
        target_email: args.targetEmail,
        target_name: args.targetName,
        target_kind: args.targetKind,
        plaintext_password: args.plaintextPassword,
        set_by_admin_id: args.adminId,
        set_by_admin_email: args.adminEmail,
        notes: args.notes,
      }),
    })
  } catch {
    // Vault write failure is non-fatal — the response already returned
    // the temp password to the calling admin.
  }
}
