-- ================================================================
-- 20261013_pan_aadhar_status.sql
-- Add explicit PAN & Aadhaar verification and linkage status columns
-- to public.kyc_identity_details.
--
-- Preserves existing schema and allows authoritative recording
-- of PAN verification, Aadhaar verification, and CBDT/UIDAI linkage.
-- ================================================================

ALTER TABLE public.kyc_identity_details
  ADD COLUMN IF NOT EXISTS pan_verified BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS aadhar_verified BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pan_aadhaar_linked BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN public.kyc_identity_details.pan_verified IS 'Authoritative PAN verification confirmation';
COMMENT ON COLUMN public.kyc_identity_details.aadhar_verified IS 'Authoritative Aadhaar verification confirmation';
COMMENT ON COLUMN public.kyc_identity_details.pan_aadhaar_linked IS 'Authoritative CBDT/UIDAI PAN-Aadhaar linkage confirmation';
