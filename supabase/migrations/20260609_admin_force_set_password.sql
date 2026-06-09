-- =============================================================================
-- admin_force_set_password — set a user's password bypassing GoTrue's
-- leaked/weak-password protection (admin-only, deliberate product requirement)
-- =============================================================================
-- Supabase Auth's "leaked password protection" (HaveIBeenPwned) rejects common
-- passwords like "Orange@123" even when a super-admin sets a TEMPORARY password
-- via the Admin API ("Password is known to be weak and easy to guess"). That is
-- a project-level Auth setting, not something the app can toggle. The owner
-- requires admins to be able to hand out simple temporary passwords (the user is
-- forced to change it at next login anyway).
--
-- This SECURITY DEFINER RPC writes the bcrypt hash directly to
-- auth.users.encrypted_password (GoTrue verifies plain bcrypt on login, so the
-- user can sign in with it) and stamps force_password_reset in user metadata —
-- matching the existing temp-password flow. It is admin/super-admin gated via
-- auth.uid(); the admin-password-reset Netlify function calls it (with the
-- admin's JWT) ONLY as a fallback when GoTrue rejected the password as weak.
-- Normal/strong passwords still go through the standard Admin API path.
--
-- Uses pgcrypto (extensions schema). cost 10 matches GoTrue's bcrypt default.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_force_set_password(p_user_id uuid, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_role text;
BEGIN
  -- Admin gate (same roles allowed by admin-password-reset).
  SELECT role::text INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NULL OR v_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  IF p_user_id IS NULL OR p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'invalid arguments';
  END IF;

  UPDATE auth.users
     SET encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
         updated_at = now(),
         raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
           || jsonb_build_object(
                'force_password_reset', true,
                'force_password_reset_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
              )
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_force_set_password(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_force_set_password(uuid, text) TO authenticated;
