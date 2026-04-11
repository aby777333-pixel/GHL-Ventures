-- =============================================
-- FINAL FIX: All remaining bugs from testing report 3
-- =============================================

-- 1. Fix delete_user_complete to handle ALL FK constraints
CREATE OR REPLACE FUNCTION public.delete_user_complete(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_client_id UUID;
BEGIN
  SELECT id INTO target_client_id FROM clients WHERE user_id = target_user_id;
  DELETE FROM audit_logs WHERE user_id = target_user_id;
  DELETE FROM notifications WHERE user_id = target_user_id;
  IF target_client_id IS NOT NULL THEN
    UPDATE kyc_basic_details SET reviewed_by = NULL WHERE reviewed_by = target_user_id;
    UPDATE kyc_identity_details SET reviewed_by = NULL WHERE reviewed_by = target_user_id;
    UPDATE kyc_bank_details SET reviewed_by = NULL WHERE reviewed_by = target_user_id;
    UPDATE kyc_demat_details SET reviewed_by = NULL WHERE reviewed_by = target_user_id;
    DELETE FROM kyc_basic_details WHERE client_id = target_client_id;
    DELETE FROM kyc_identity_details WHERE client_id = target_client_id;
    DELETE FROM kyc_bank_details WHERE client_id = target_client_id;
    DELETE FROM kyc_demat_details WHERE client_id = target_client_id;
    DELETE FROM nominees WHERE client_id = target_client_id;
    DELETE FROM clients WHERE id = target_client_id;
  END IF;
  DELETE FROM leads WHERE email = (SELECT email FROM auth.users WHERE id = target_user_id);
  DELETE FROM profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'delete_user_complete error: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- 2. Fix admin KYC RLS with proper user_role enum casting + WITH CHECK (true)
DROP POLICY IF EXISTS admin_update_kyc_basic ON public.kyc_basic_details;
DROP POLICY IF EXISTS admin_update_kyc_identity ON public.kyc_identity_details;
DROP POLICY IF EXISTS admin_update_kyc_bank ON public.kyc_bank_details;
DROP POLICY IF EXISTS admin_update_kyc_demat ON public.kyc_demat_details;
DROP POLICY IF EXISTS admin_update_nominees ON public.nominees;
DROP POLICY IF EXISTS admin_read_kyc_basic ON public.kyc_basic_details;
DROP POLICY IF EXISTS admin_read_kyc_identity ON public.kyc_identity_details;
DROP POLICY IF EXISTS admin_read_kyc_bank ON public.kyc_bank_details;
DROP POLICY IF EXISTS admin_read_kyc_demat ON public.kyc_demat_details;
DROP POLICY IF EXISTS admin_read_nominees ON public.nominees;

CREATE POLICY admin_update_kyc_basic ON public.kyc_basic_details FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)))
  WITH CHECK (true);
CREATE POLICY admin_update_kyc_identity ON public.kyc_identity_details FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)))
  WITH CHECK (true);
CREATE POLICY admin_update_kyc_bank ON public.kyc_bank_details FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)))
  WITH CHECK (true);
CREATE POLICY admin_update_kyc_demat ON public.kyc_demat_details FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)))
  WITH CHECK (true);
CREATE POLICY admin_update_nominees ON public.nominees FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)))
  WITH CHECK (true);

CREATE POLICY admin_read_kyc_basic ON public.kyc_basic_details FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)));
CREATE POLICY admin_read_kyc_identity ON public.kyc_identity_details FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)));
CREATE POLICY admin_read_kyc_bank ON public.kyc_bank_details FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)));
CREATE POLICY admin_read_kyc_demat ON public.kyc_demat_details FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)));
CREATE POLICY admin_read_nominees ON public.nominees FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)));

-- 3. Admin update clients table
DROP POLICY IF EXISTS admin_update_clients ON public.clients;
CREATE POLICY admin_update_clients ON public.clients FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)))
  WITH CHECK (true);

-- 4. Fix storage: client upload + read access to kyc-documents
DROP POLICY IF EXISTS kyc_client_upload ON storage.objects;
CREATE POLICY kyc_client_upload ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kyc-documents' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS kyc_client_read ON storage.objects;
CREATE POLICY kyc_client_read ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND auth.role() = 'authenticated');
