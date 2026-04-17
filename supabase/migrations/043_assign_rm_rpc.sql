-- ================================================================
-- 043 — assign_rm_to_client RPC
--
-- The admin Client Profile modal calls rpc('assign_rm_to_client')
-- first and falls back to a direct UPDATE on clients.assigned_rm if
-- the RPC doesn't exist. The RPC was missing in production so every
-- reassignment was going through the fallback path silently.
--
-- Adding the RPC as SECURITY DEFINER so the frontend call succeeds
-- on the primary path and an audit_logs row is written for the
-- reassignment.
-- ================================================================

CREATE OR REPLACE FUNCTION public.assign_rm_to_client(p_client_id uuid, p_rm_staff_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_prev_rm UUID;
BEGIN
  SELECT assigned_rm INTO v_prev_rm FROM public.clients WHERE id = p_client_id;

  UPDATE public.clients
     SET assigned_rm = p_rm_staff_id,
         updated_at  = NOW()
   WHERE id = p_client_id;

  BEGIN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, module, details)
    VALUES ('assign_rm', 'client', p_client_id, 'admin',
            jsonb_build_object('from', v_prev_rm, 'to', p_rm_staff_id));
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN TRUE;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.assign_rm_to_client(uuid, uuid) TO authenticated;
