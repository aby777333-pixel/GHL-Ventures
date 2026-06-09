-- =============================================================================
-- record_user_password — let a user mirror their OWN chosen password into the
-- super-admin password audit so the admin "User Passwords" console can view/edit it
-- =============================================================================
-- Supabase Auth stores passwords hashed/irreversible. When an ADMIN sets a temp
-- password we already mirror the plaintext into user_password_audit (047). But
-- when a CLIENT picks their own password (email reset link or the forced
-- change-at-next-login flow, both via supabase.auth.updateUser), the app has the
-- plaintext in hand yet cannot write it: user_password_audit RLS only lets
-- super-admins INSERT.
--
-- This SECURITY DEFINER RPC closes that gap WITHOUT loosening the table's RLS.
-- It records ONLY the caller's own password (user_id := auth.uid(),
-- set_by := auth.uid() so the row is identifiable as user-set). The admin
-- console reads the most recent row per user, so the freshly-chosen password
-- shows up immediately and stays editable via the existing "Set Password" flow.
--
-- NOTE (security): this intentionally retains user-chosen plaintext for admin
-- visibility — a deliberate product requirement. Reads remain restricted to
-- super-admins by the existing user_password_audit RLS.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.record_user_password(p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_password IS NULL OR length(p_password) = 0 THEN
    RETURN;  -- nothing to record
  END IF;

  INSERT INTO public.user_password_audit (user_id, password_plain, set_by)
  VALUES (v_uid, p_password, v_uid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_user_password(text) TO authenticated;
