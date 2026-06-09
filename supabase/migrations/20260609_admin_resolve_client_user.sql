-- =============================================================================
-- admin_resolve_client_user — resolve (and best-effort link) a client's auth user
-- =============================================================================
-- Some `clients` rows were created (via public registration / the auto-trigger
-- path) WITHOUT a `user_id`, even though a matching `auth.users` row exists for
-- the same email. The admin "Add KYC" flow needs the client's auth user_id so
-- the KYC rows are owned by the investor (the client-side RLS on the kyc_*
-- tables is `user_id = auth.uid()`), and previously bailed out with
-- "Could not locate the auth user for this client." whenever clients.user_id
-- was null — even when the auth user actually existed.
--
-- The browser (anon/authenticated key) cannot read `auth.users`, so this
-- SECURITY DEFINER RPC does the lookup server-side. It:
--   1. Verifies the caller is an admin / super_admin (the only roles that can
--      actually write KYC rows — see admin_insert_kyc_* policies).
--   2. Returns clients.user_id if already linked.
--   3. Otherwise resolves auth.users by the client's email and returns it.
--   4. Best-effort backfills clients.user_id, but ONLY when no other clients row
--      already owns that user_id — clients_user_id_key is UNIQUE, and the same
--      email can have several duplicate (null-user_id) client rows.
--
-- Read-only when it can't safely link; never throws on the unique constraint.
-- Purely additive: existing flows (clients that already have user_id) are
-- untouched, and genuinely orphaned clients (no auth user at all) still return
-- NULL so the caller shows the original "ask them to log in once" message.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_resolve_client_user(p_client_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_user_id     uuid;
  v_email       text;
  v_conflict    uuid;
BEGIN
  -- 1. Admin gate (matches who can write KYC rows).
  SELECT role::text INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  -- 2. Already linked → done.
  SELECT user_id, email INTO v_user_id, v_email
  FROM public.clients WHERE id = p_client_id;

  IF v_user_id IS NOT NULL THEN
    RETURN v_user_id;
  END IF;

  IF v_email IS NULL OR length(btrim(v_email)) = 0 THEN
    RETURN NULL;
  END IF;

  -- 3. Resolve the auth user by email (case-insensitive, oldest first).
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(v_email)
  ORDER BY created_at
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 4. Best-effort link — only when no other client row already owns this
  --    user_id (clients_user_id_key is UNIQUE). Never let a link failure stop
  --    us returning the resolved id; KYC writes key on client_id + user_id and
  --    do not require clients.user_id to be set.
  SELECT id INTO v_conflict
  FROM public.clients
  WHERE user_id = v_user_id AND id <> p_client_id
  LIMIT 1;

  IF v_conflict IS NULL THEN
    BEGIN
      UPDATE public.clients
      SET user_id = v_user_id
      WHERE id = p_client_id AND user_id IS NULL;
    EXCEPTION WHEN unique_violation THEN
      NULL; -- raced; keep going with the resolved id
    END;
  END IF;

  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_resolve_client_user(uuid) TO authenticated;
