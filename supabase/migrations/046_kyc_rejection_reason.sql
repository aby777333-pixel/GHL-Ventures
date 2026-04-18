-- ================================================================
-- 046 — KYC rejection reason: dedicated columns instead of prose in notes.
-- Powers the new Reject-KYC modal (manual text input) and the
-- rejection banner on the investor dashboard.
-- ================================================================

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason text,
  ADD COLUMN IF NOT EXISTS kyc_rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS kyc_rejected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
