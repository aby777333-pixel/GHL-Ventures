-- ================================================================
-- 20260515 · ADMIN COMMAND CENTER FIXES
--
-- Adds:
--   1. clients.deleted_at / deleted_by / deleted_reason       (soft-delete)
--   2. admin_restore_client(p_client_id UUID) RPC             (un-trash)
--   3. Index on clients(deleted_at) for fast trash filtering
--   4. Reuses existing public.contact_submissions, public.bank_accounts,
--      public.audit_logs, public.profiles — no new tables needed.
--
-- Safe to run multiple times: all DDL is IF NOT EXISTS / OR REPLACE.
-- ================================================================

-- ── 1. Soft-delete columns on clients ─────────────────────────────
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON public.clients(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- ── 2. Restore RPC (super-admin or admin only) ────────────────────
-- SECURITY DEFINER so the policy below doesn't block the UPDATE.
CREATE OR REPLACE FUNCTION public.admin_restore_client(p_client_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Caller must be admin / super_admin.
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role NOT IN ('admin','super_admin') THEN
    RAISE EXCEPTION 'Only admins may restore trashed clients';
  END IF;

  UPDATE public.clients
     SET deleted_at = NULL,
         deleted_by = NULL,
         deleted_reason = NULL,
         updated_at = NOW()
   WHERE id = p_client_id
     AND deleted_at IS NOT NULL;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Audit
  BEGIN
    INSERT INTO public.audit_logs(
      action, entity_type, entity_id, module, actor_id, details
    ) VALUES (
      'restore_client', 'client', p_client_id, 'admin',
      auth.uid(), jsonb_build_object('restored_at', NOW())
    );
  EXCEPTION WHEN OTHERS THEN
    -- audit_logs is optional, never fail the restore for an audit error
    NULL;
  END;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_restore_client(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_restore_client(UUID) TO authenticated;

-- ── 3. Soft-trash RPC (records who/why; updates timestamp) ────────
CREATE OR REPLACE FUNCTION public.admin_trash_client(p_client_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role NOT IN ('admin','super_admin') THEN
    RAISE EXCEPTION 'Only admins may trash clients';
  END IF;

  UPDATE public.clients
     SET deleted_at = NOW(),
         deleted_by = auth.uid(),
         deleted_reason = COALESCE(p_reason, deleted_reason),
         updated_at = NOW()
   WHERE id = p_client_id
     AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  BEGIN
    INSERT INTO public.audit_logs(
      action, entity_type, entity_id, module, actor_id, details
    ) VALUES (
      'trash_client', 'client', p_client_id, 'admin',
      auth.uid(), jsonb_build_object('reason', p_reason, 'trashed_at', NOW())
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_trash_client(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_trash_client(UUID, TEXT) TO authenticated;

-- ── 4. Helpful comment for downstream queries ─────────────────────
COMMENT ON COLUMN public.clients.deleted_at IS
  'Soft-delete timestamp. NULL = active. Set by admin_trash_client(); cleared by admin_restore_client().';
