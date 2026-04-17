-- ================================================================
-- 041 — Two auth/messaging fixes
--
-- A) Signup was blocked by orphan rows in auth.identities (and
--    analogous phone/email rows). The previous delete_user_complete
--    removed auth.users but left auth.identities behind, so a
--    deleted user's email/phone continued to fail uniqueness checks.
--
-- B) Investors can't read admin profile rows under RLS, so the
--    client-side compose fallback to "first admin" failed silently
--    and defaulted to self-address. Introduce a SECURITY DEFINER
--    RPC that returns a routable recipient (assigned RM → super_admin
--    → admin) without exposing the profile table.
--
-- Both changes are idempotent.
-- ================================================================

-- ── Orphan identity cleanup (safe to re-run) ───────────────────
DELETE FROM auth.identities i
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = i.user_id);

-- ── Harden delete_user_complete so auth.identities goes with the user
CREATE OR REPLACE FUNCTION public.delete_user_complete(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  target_client_id UUID;
  target_email TEXT;
BEGIN
  SELECT id INTO target_client_id FROM public.clients WHERE user_id = target_user_id;
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;

  DELETE FROM public.audit_logs     WHERE user_id   = target_user_id;
  DELETE FROM public.notifications  WHERE user_id   = target_user_id;
  DELETE FROM public.messages       WHERE from_id   = target_user_id OR to_id = target_user_id;
  DELETE FROM public.tickets        WHERE client_id = target_user_id OR created_by = target_user_id;
  DELETE FROM public.investment_transactions WHERE client_id = target_client_id;
  DELETE FROM public.investment_documents    WHERE client_id = target_client_id;
  DELETE FROM public.monthly_payouts         WHERE client_id = target_client_id;
  DELETE FROM public.allotments              WHERE client_id = target_client_id;
  DELETE FROM public.investment_applications WHERE client_id = target_client_id OR user_id = target_user_id;

  IF target_client_id IS NOT NULL THEN
    UPDATE public.kyc_basic_details    SET reviewed_by = NULL WHERE reviewed_by = target_user_id;
    UPDATE public.kyc_identity_details SET reviewed_by = NULL WHERE reviewed_by = target_user_id;
    UPDATE public.kyc_bank_details     SET reviewed_by = NULL WHERE reviewed_by = target_user_id;
    UPDATE public.kyc_demat_details    SET reviewed_by = NULL WHERE reviewed_by = target_user_id;

    DELETE FROM public.kyc_basic_details    WHERE client_id = target_client_id;
    DELETE FROM public.kyc_identity_details WHERE client_id = target_client_id;
    DELETE FROM public.kyc_bank_details     WHERE client_id = target_client_id;
    DELETE FROM public.kyc_demat_details    WHERE client_id = target_client_id;
    DELETE FROM public.nominees             WHERE client_id = target_client_id;
    DELETE FROM public.clients              WHERE id        = target_client_id;
  END IF;

  DELETE FROM public.leads    WHERE email = target_email;
  DELETE FROM public.profiles WHERE id    = target_user_id;

  DELETE FROM auth.identities WHERE user_id = target_user_id;
  DELETE FROM auth.users      WHERE id      = target_user_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'delete_user_complete error: %', SQLERRM;
    RETURN FALSE;
END;
$function$;

-- ── Support recipient resolver (for investor compose) ──────────
CREATE OR REPLACE FUNCTION public.get_support_recipient_id(p_sender uuid DEFAULT NULL)
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  recipient_id UUID;
BEGIN
  IF p_sender IS NOT NULL THEN
    SELECT sp.user_id INTO recipient_id
    FROM public.clients c
    JOIN public.staff_profiles sp ON sp.id = c.assigned_rm
    WHERE c.user_id = p_sender
      AND sp.user_id IS NOT NULL
      AND sp.user_id <> p_sender
    LIMIT 1;
    IF recipient_id IS NOT NULL THEN RETURN recipient_id; END IF;
  END IF;

  SELECT id INTO recipient_id FROM public.profiles
  WHERE role = 'super_admin' AND (p_sender IS NULL OR id <> p_sender)
  ORDER BY created_at ASC LIMIT 1;
  IF recipient_id IS NOT NULL THEN RETURN recipient_id; END IF;

  SELECT id INTO recipient_id FROM public.profiles
  WHERE role = 'admin' AND (p_sender IS NULL OR id <> p_sender)
  ORDER BY created_at ASC LIMIT 1;
  RETURN recipient_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_support_recipient_id(uuid) TO anon, authenticated;
