-- ================================================================
-- 042 — Allow `credited` on investment_applications.status
--
-- The admin "Give Credit" action flips status from `approved` to
-- `credited` via markInvestmentCreditGiven(). The original CHECK
-- constraint didn't include `credited`, so every Give Credit click
-- surfaced "Failed to mark credit" and the row stayed at `approved`.
--
-- Idempotent — drops and re-adds the constraint.
-- ================================================================
ALTER TABLE public.investment_applications
  DROP CONSTRAINT IF EXISTS investment_applications_status_check;

ALTER TABLE public.investment_applications
  ADD CONSTRAINT investment_applications_status_check
  CHECK (status = ANY (ARRAY['pending','under_review','approved','credited','rejected','completed']));
