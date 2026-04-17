-- ================================================================
-- 039 — Backfill investment_applications approved BEFORE the
-- approval-flow hardening added in adminDataService.approveInvestmentApplication.
--
-- For each approved/credited application that is missing the
-- downstream fields (investment_date, maturity_date, interest_rate,
-- appreciation_rate, tds_rate, commitment_id, reference_number),
-- populate them with safe defaults. Also backfill an Acknowledgement
-- Letter row in investment_documents if one doesn't already exist.
--
-- Idempotent: uses `WHERE investment_date IS NULL` + COALESCE.
-- ================================================================

DO $$
DECLARE
  rec record;
  v_tenure_years int;
  v_rate numeric;
  v_appr numeric;
  v_investment_date date := CURRENT_DATE;
BEGIN
  FOR rec IN
    SELECT id, fund_vehicle, tenure_preference
    FROM public.investment_applications
    WHERE status IN ('approved','credited') AND investment_date IS NULL
  LOOP
    v_tenure_years := COALESCE(NULLIF(regexp_replace(rec.tenure_preference, '\D', '', 'g'), '')::int, 3);

    IF rec.fund_vehicle = 'Direct AIF Route' THEN
      v_rate := 18; v_appr := 15;
    ELSIF rec.fund_vehicle ILIKE '%Debenture%' THEN
      v_rate := 12; v_appr := 12;
    ELSIF rec.fund_vehicle ILIKE '%LLP%' THEN
      v_rate := 12; v_appr := 12;
    ELSE
      v_rate := 12; v_appr := 12;
    END IF;

    UPDATE public.investment_applications
    SET
      investment_date   = v_investment_date,
      maturity_date     = v_investment_date + (v_tenure_years || ' years')::interval,
      interest_rate     = COALESCE(interest_rate, v_rate),
      appreciation_rate = COALESCE(appreciation_rate, v_appr),
      tds_rate          = COALESCE(tds_rate, 10),
      commitment_id     = COALESCE(commitment_id, 'GHL-CMT-' || UPPER(SUBSTRING(rec.id::text, 1, 8))),
      reference_number  = COALESCE(reference_number, 'GHL-REF-' || UPPER(SUBSTRING(rec.id::text, 1, 8)))
    WHERE id = rec.id;
  END LOOP;
END $$;

-- Ensure an Acknowledgement Letter exists for every approved application
INSERT INTO public.investment_documents (investment_app_id, client_id, document_type, title, file_name, file_url, uploaded_by, status)
SELECT
  a.id,
  a.client_id,
  'acknowledgement',
  'Acknowledgement Letter',
  'Acknowledgement-' || COALESCE(a.commitment_id, SUBSTRING(a.id::text, 1, 8)) || '.pdf',
  '',
  a.reviewed_by,
  'issued'
FROM public.investment_applications a
WHERE a.status IN ('approved','credited')
  AND NOT EXISTS (
    SELECT 1 FROM public.investment_documents d
    WHERE d.investment_app_id = a.id AND d.document_type = 'acknowledgement'
  );
