-- =============================================
-- Fix Admin KYC Update Policies + User Deletion
-- =============================================

-- Fix admin KYC update policies by adding WITH CHECK clause

-- kyc_basic_details
DROP POLICY IF EXISTS admin_update_kyc_basic ON public.kyc_basic_details;
CREATE POLICY admin_update_kyc_basic ON public.kyc_basic_details FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- kyc_identity_details
DROP POLICY IF EXISTS admin_update_kyc_identity ON public.kyc_identity_details;
CREATE POLICY admin_update_kyc_identity ON public.kyc_identity_details FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- kyc_bank_details
DROP POLICY IF EXISTS admin_update_kyc_bank ON public.kyc_bank_details;
CREATE POLICY admin_update_kyc_bank ON public.kyc_bank_details FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- kyc_demat_details
DROP POLICY IF EXISTS admin_update_kyc_demat ON public.kyc_demat_details;
CREATE POLICY admin_update_kyc_demat ON public.kyc_demat_details FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- nominees
DROP POLICY IF EXISTS admin_update_nominees ON public.nominees;
CREATE POLICY admin_update_nominees ON public.nominees FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- Function to fully delete a user (auth + data) for Bug #9
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
  IF target_client_id IS NOT NULL THEN
    DELETE FROM kyc_basic_details WHERE client_id = target_client_id;
    DELETE FROM kyc_identity_details WHERE client_id = target_client_id;
    DELETE FROM kyc_bank_details WHERE client_id = target_client_id;
    DELETE FROM kyc_demat_details WHERE client_id = target_client_id;
    DELETE FROM nominees WHERE client_id = target_client_id;
    DELETE FROM clients WHERE id = target_client_id;
  END IF;
  DELETE FROM profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'delete_user_complete error: %', SQLERRM;
    RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_complete(UUID) TO authenticated;
