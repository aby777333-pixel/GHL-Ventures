/* ─────────────────────────────────────────────────────────────
   Blog CMS console — authentication

   Separate from adminAuthService on purpose. The blog-only roles
   (blog_editor / blog_author) are NOT in that service's
   ADMIN_ROLES whitelist, so an SEO-team account can sign in here
   and nowhere else: /admin, /staff and /dashboard all reject it.

   Conversely admin and super_admin can use this console too, so
   the owner does not need a second account.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'

export type CmsRole = 'super_admin' | 'admin' | 'blog_editor' | 'blog_author'

/** Roles allowed into the /cms console. */
export const CMS_ROLES: CmsRole[] = ['super_admin', 'admin', 'blog_editor', 'blog_author']

/** Roles that may delete content and change CMS settings.
 *  Mirrors public.is_blog_admin() in the database — the database is
 *  the real gate; this only shapes the UI. */
const CMS_ADMIN_ROLES: CmsRole[] = ['super_admin', 'admin', 'blog_editor']

export interface CmsUser {
  id: string
  email: string
  name: string
  role: CmsRole
  avatarUrl?: string | null
}

export interface CmsSession {
  user: CmsUser
  canEdit: boolean
  canDelete: boolean
}

export const ROLE_LABEL: Record<CmsRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  blog_editor: 'Blog Editor',
  blog_author: 'Blog Author',
}

function toSession(user: CmsUser): CmsSession {
  return {
    user,
    canEdit: true,
    canDelete: CMS_ADMIN_ROLES.includes(user.role),
  }
}

export async function loginToCms(
  email: string,
  password: string,
): Promise<{ ok: boolean; message?: string; session?: CmsSession }> {
  if (!isSupabaseConfigured()) return { ok: false, message: 'Content system is not configured.' }

  // Trim both: a mobile keyboard once registered an account with a
  // leading space in its password, and that class of bug is painful.
  const cleanEmail = (email || '').trim().toLowerCase()
  const cleanPassword = (password || '').trim()

  if (!cleanEmail || !cleanPassword) return { ok: false, message: 'Enter your email and password.' }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    })

    if (error || !data?.user) {
      return { ok: false, message: 'Incorrect email or password.' }
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('id, role, full_name, avatar_url')
      .eq('id', data.user.id)
      .maybeSingle()

    const role = profile?.role as CmsRole | undefined

    if (!role || !CMS_ROLES.includes(role)) {
      // Not a content account — do not leave them half signed-in.
      await supabase.auth.signOut()
      return { ok: false, message: 'This account does not have access to the content console.' }
    }

    return {
      ok: true,
      session: toSession({
        id: data.user.id,
        email: data.user.email || cleanEmail,
        name: profile?.full_name || data.user.email || 'Content team',
        role,
        avatarUrl: profile?.avatar_url ?? null,
      }),
    }
  } catch {
    return { ok: false, message: 'Could not sign in right now. Please try again.' }
  }
}

export async function getCmsSession(): Promise<CmsSession | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('id, role, full_name, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle()

    const role = profile?.role as CmsRole | undefined
    if (!role || !CMS_ROLES.includes(role)) return null

    return toSession({
      id: session.user.id,
      email: session.user.email || '',
      name: profile?.full_name || session.user.email || 'Content team',
      role,
      avatarUrl: profile?.avatar_url ?? null,
    })
  } catch {
    return null
  }
}

export async function logoutFromCms(): Promise<void> {
  try { await supabase.auth.signOut() } catch { /* ignore */ }
}

export async function changeOwnCmsPassword(
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured()) return { ok: false, message: 'Not configured.' }
  const pw = (newPassword || '').trim()
  if (pw.length < 10) return { ok: false, message: 'Use at least 10 characters.' }
  try {
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) return { ok: false, message: error.message }
    return { ok: true, message: 'Password updated.' }
  } catch {
    return { ok: false, message: 'Could not update the password.' }
  }
}
