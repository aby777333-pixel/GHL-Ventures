-- =============================================================================
-- prevent_duplicate_orphan_client — stop orphan (null user_id) duplicate clients
-- =============================================================================
-- Background: a handful of `clients` rows existed with user_id = NULL even though
-- a matching auth.users row (and a canonical linked clients row) already existed
-- for the same email — duplicate junk that cluttered the admin list and broke
-- "Add KYC" (see 20260609_admin_resolve_client_user.sql). Every current code
-- path (the handle_new_user trigger, admin-create-client, clientAuthService
-- signup/auto-repair) inserts clients WITH a user_id and is idempotent on
-- clients_user_id_key, so the orphans came from a legacy/import path. This is a
-- defensive net so they can't come back.
--
-- BEFORE INSERT on clients, FOR EACH ROW. It intervenes ONLY on the exact bad
-- case and is otherwise a pass-through:
--   * Rows with a non-null user_id  -> untouched (all normal flows).
--   * Rows with an empty email      -> untouched (~30 legit distinct clients
--                                       share an empty email, each with its own
--                                       user_id — NOT duplicates).
--   * Rows with NULL user_id + real email:
--       1. self-heal: if an auth.users row exists for that email and no other
--          client owns it, link it (clients_user_id_key stays satisfied).
--       2. if still orphaned AND an active (deleted_at IS NULL) client already
--          exists for that email, cancel the insert silently (RETURN NULL — no
--          error is raised, the caller just gets 0 rows; no current flow does
--          this intentionally).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prevent_duplicate_orphan_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth     uuid;
  v_existing uuid;
BEGIN
  -- Empty-email rows and already-linked rows are always allowed.
  IF NEW.email IS NULL OR btrim(NEW.email) = '' OR NEW.user_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- 1. Self-heal: link a matching auth user when it isn't already taken.
  SELECT id INTO v_auth
  FROM auth.users
  WHERE lower(email) = lower(NEW.email)
  ORDER BY created_at
  LIMIT 1;

  IF v_auth IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.clients WHERE user_id = v_auth) THEN
    NEW.user_id := v_auth;
    RETURN NEW;
  END IF;

  -- 2. Still orphaned — if an active client already exists for this email,
  --    don't create a duplicate. Cancel silently.
  SELECT id INTO v_existing
  FROM public.clients
  WHERE lower(email) = lower(NEW.email) AND deleted_at IS NULL
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RAISE NOTICE '[prevent_duplicate_orphan_client] skipped orphan duplicate for %', NEW.email;
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_orphan_client ON public.clients;
CREATE TRIGGER trg_prevent_duplicate_orphan_client
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_orphan_client();
