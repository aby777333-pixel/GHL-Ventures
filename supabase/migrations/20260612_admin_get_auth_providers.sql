-- =============================================================================
-- admin_get_auth_providers — let the admin "User Passwords" console see each
-- user's auth provider(s) + canonical email (both live in the auth schema)
-- =============================================================================
-- The console lists every profile, but profiles.email is typically empty and
-- the UI cannot tell a password account from a Google-OAuth account — so OAuth
-- users (who have NO password at all) were shown the same "User-set (hashed) —
-- not retrievable" placeholder as password users whose plaintext simply hasn't
-- been mirrored yet. This RPC exposes, for an admin-supplied list of user ids:
--   - the auth.users email (fixes the blank EMAIL column)
--   - the distinct identity providers (e.g. {google}, {email}, {email,google})
-- so the UI can render "Google sign-in — no password" honestly.
--
-- Admin/super-admin gated via auth.uid() — same gate as admin_force_set_password.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_get_auth_providers(p_user_ids uuid[])
RETURNS TABLE (user_id uuid, email text, providers text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role text;
BEGIN
  -- Admin gate (same roles allowed by admin-password-reset).
  SELECT role::text INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NULL OR v_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT u.id,
         u.email::text,
         COALESCE(
           array_agg(DISTINCT i.provider::text) FILTER (WHERE i.provider IS NOT NULL),
           '{}'::text[]
         )
  FROM auth.users u
  LEFT JOIN auth.identities i ON i.user_id = u.id
  WHERE u.id = ANY(p_user_ids)
  GROUP BY u.id, u.email;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_auth_providers(uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_get_auth_providers(uuid[]) TO authenticated;
