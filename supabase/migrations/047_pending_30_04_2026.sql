-- ================================================================
-- 047 — Ventures Pending (30-04-2026)
--
-- Schema additions for the 30-04-2026 admin-panel testing report:
--   * investment_doc_tracking — 6-stage progression per investment
--                         (invested / acknowledgement / document_prep /
--                          soft_copy / courier / received) with
--                         courier code + tracking-page URL.
--   * referrals — investment + commission columns so the referrer
--                 list can show what each referee actually invested.
--
-- A pre-existing public.document_tracking table from earlier seed
-- data has a different (per-document) shape; we use the distinct
-- name `investment_doc_tracking` to avoid colliding with it.
--
-- All changes are idempotent. Triggers use SECURITY DEFINER so admin
-- updates flow through RLS-protected reads on the investor side.
-- ================================================================

-- ── investment_doc_tracking ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.investment_doc_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_app_id uuid NOT NULL UNIQUE
    REFERENCES public.investment_applications(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  invested_at              timestamptz,
  acknowledgement_at       timestamptz,
  document_prep_at         timestamptz,
  soft_copy_at             timestamptz,
  courier_started_at       timestamptz,
  courier_received_at      timestamptz,
  courier_code             text,
  courier_partner          text,
  courier_tracking_url     text,
  notes                    text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS investment_doc_tracking_app_idx
  ON public.investment_doc_tracking (investment_app_id);
CREATE INDEX IF NOT EXISTS investment_doc_tracking_client_idx
  ON public.investment_doc_tracking (client_id);

ALTER TABLE public.investment_doc_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investment_doc_tracking_admin_all" ON public.investment_doc_tracking;
CREATE POLICY "investment_doc_tracking_admin_all" ON public.investment_doc_tracking
  FOR ALL USING (is_admin_or_above() OR is_staff())
            WITH CHECK (is_admin_or_above() OR is_staff());

DROP POLICY IF EXISTS "investment_doc_tracking_owner_read" ON public.investment_doc_tracking;
CREATE POLICY "investment_doc_tracking_owner_read" ON public.investment_doc_tracking
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

-- ── Auto-create + auto-flag stages ─────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_inv_doc_tracking_on_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IN ('approved', 'credited', 'completed') THEN
    INSERT INTO public.investment_doc_tracking (investment_app_id, client_id, invested_at)
    VALUES (NEW.id, NEW.client_id, COALESCE(NEW.investment_date::timestamptz, now()))
    ON CONFLICT (investment_app_id) DO UPDATE
      SET invested_at = COALESCE(public.investment_doc_tracking.invested_at, EXCLUDED.invested_at),
          client_id = COALESCE(public.investment_doc_tracking.client_id, EXCLUDED.client_id),
          updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inv_doc_tracking_on_status ON public.investment_applications;
CREATE TRIGGER trg_inv_doc_tracking_on_status
  AFTER INSERT OR UPDATE OF status ON public.investment_applications
  FOR EACH ROW EXECUTE FUNCTION public.fn_inv_doc_tracking_on_status();

CREATE OR REPLACE FUNCTION public.fn_inv_doc_tracking_on_doc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  app_id uuid;
  c_id   uuid;
  ack_ok boolean;
  agr_ok boolean;
  alt_ok boolean;
  cer_ok boolean;
BEGIN
  app_id := COALESCE(NEW.investment_app_id, OLD.investment_app_id);
  IF app_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT EXISTS(SELECT 1 FROM public.investment_documents
                 WHERE investment_app_id = app_id
                   AND document_type IN ('acknowledgement','acknowledgement_letter')
                   AND COALESCE(file_url, '') <> '')
    INTO ack_ok;
  SELECT EXISTS(SELECT 1 FROM public.investment_documents
                 WHERE investment_app_id = app_id
                   AND document_type IN ('agreement','debenture_agreement')
                   AND COALESCE(file_url, '') <> '')
    INTO agr_ok;
  SELECT EXISTS(SELECT 1 FROM public.investment_documents
                 WHERE investment_app_id = app_id
                   AND document_type IN ('allotment','allotment_letter')
                   AND COALESCE(file_url, '') <> '')
    INTO alt_ok;
  SELECT EXISTS(SELECT 1 FROM public.investment_documents
                 WHERE investment_app_id = app_id
                   AND document_type IN ('certificate','debenture_certificate')
                   AND COALESCE(file_url, '') <> '')
    INTO cer_ok;

  SELECT client_id INTO c_id FROM public.investment_applications WHERE id = app_id;

  IF ack_ok AND agr_ok AND alt_ok AND cer_ok THEN
    INSERT INTO public.investment_doc_tracking (investment_app_id, client_id, soft_copy_at)
    VALUES (app_id, c_id, now())
    ON CONFLICT (investment_app_id) DO UPDATE
      SET soft_copy_at = COALESCE(public.investment_doc_tracking.soft_copy_at, now()),
          updated_at = now();
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_inv_doc_tracking_on_doc ON public.investment_documents;
CREATE TRIGGER trg_inv_doc_tracking_on_doc
  AFTER INSERT OR UPDATE OR DELETE ON public.investment_documents
  FOR EACH ROW EXECUTE FUNCTION public.fn_inv_doc_tracking_on_doc();

CREATE OR REPLACE FUNCTION public.fn_inv_doc_tracking_courier_auto()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.courier_code IS NOT NULL AND length(trim(NEW.courier_code)) > 0
     AND NEW.courier_started_at IS NULL THEN
    NEW.courier_started_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inv_doc_tracking_courier_auto ON public.investment_doc_tracking;
CREATE TRIGGER trg_inv_doc_tracking_courier_auto
  BEFORE INSERT OR UPDATE ON public.investment_doc_tracking
  FOR EACH ROW EXECUTE FUNCTION public.fn_inv_doc_tracking_courier_auto();

INSERT INTO public.investment_doc_tracking (investment_app_id, client_id, invested_at)
SELECT a.id, a.client_id, COALESCE(a.investment_date::timestamptz, a.created_at)
FROM public.investment_applications a
WHERE a.status IN ('approved','credited','completed')
ON CONFLICT (investment_app_id) DO NOTHING;


-- ── referrals: investment + commission tracking ────────────────
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS investment_app_id uuid
    REFERENCES public.investment_applications(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS investment_amount numeric,
  ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS commission_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_status text DEFAULT 'pending'
    CHECK (commission_status IN ('pending','accrued','paid','cancelled')),
  ADD COLUMN IF NOT EXISTS referee_client_id uuid
    REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS referrals_referee_client_idx
  ON public.referrals (referee_client_id);
CREATE INDEX IF NOT EXISTS referrals_investment_app_idx
  ON public.referrals (investment_app_id);

CREATE OR REPLACE VIEW public.referrer_summary AS
  SELECT
    referrer_email,
    referrer_name,
    referrer_phone,
    count(*)                                              AS total_referrals,
    count(*) FILTER (WHERE status = 'converted')          AS converted_count,
    coalesce(sum(investment_amount), 0)                   AS total_invested,
    coalesce(sum(commission_amount), 0)                   AS total_commission,
    coalesce(sum(commission_amount) FILTER
             (WHERE commission_status = 'paid'), 0)       AS paid_commission
  FROM public.referrals
  GROUP BY referrer_email, referrer_name, referrer_phone;

GRANT SELECT ON public.referrer_summary TO authenticated;
