-- =============================================================================
-- record_user_password — make idempotent so it's safe to call on every login
-- =============================================================================
-- Extends 20260609_record_user_password.sql. We now also capture the password
-- at registration (auth.signUp) and on every successful login (loginClient),
-- so the admin "User Passwords" console fills in even for users who self-
-- registered or whose password was never previously mirrored. To avoid writing
-- a duplicate audit row on every single login, the RPC now SKIPS the insert
-- when the most recent stored value already equals the supplied password —
-- it only records when the password is new/changed.
--
-- Still SECURITY DEFINER, still records ONLY the caller's own password
-- (user_id/set_by = auth.uid()), and does NOT loosen user_password_audit RLS.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.record_user_password(p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid  uuid;
  v_last text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_password IS NULL OR length(p_password) = 0 THEN
    RETURN;  -- nothing to record
  END IF;

  -- Idempotent: skip when the latest recorded value is already this password.
  SELECT password_plain INTO v_last
  FROM public.user_password_audit
  WHERE user_id = v_uid
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last IS NOT NULL AND v_last = p_password THEN
    RETURN;  -- unchanged — don't spam the audit on every login
  END IF;

  INSERT INTO public.user_password_audit (user_id, password_plain, set_by)
  VALUES (v_uid, p_password, v_uid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_user_password(text) TO authenticated;
