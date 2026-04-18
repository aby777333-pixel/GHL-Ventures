-- ================================================================
-- 045 — Three public forms: referrals, startup_applications, nri_consultations
-- Each uses the same pattern: public anon INSERT, admin/staff SELECT+UPDATE.
-- ================================================================

-- ── REFERRALS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_name text NOT NULL,
  referrer_email text NOT NULL,
  referrer_phone text,
  relationship text,
  referee_name text NOT NULL,
  referee_email text,
  referee_phone text,
  referee_city text,
  investable_surplus text,
  message text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','converted','rejected')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  page_url text,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referrals_status_idx ON public.referrals (status);
CREATE INDEX IF NOT EXISTS referrals_created_at_idx ON public.referrals (created_at DESC);
CREATE INDEX IF NOT EXISTS referrals_referrer_email_idx ON public.referrals (referrer_email);

-- ── STARTUP APPLICATIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.startup_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number text UNIQUE,
  founder_name text NOT NULL,
  email text NOT NULL,
  phone text,
  linkedin text,
  company_name text NOT NULL,
  founding_year integer,
  website text,
  stage text,
  sector text,
  city text,
  mrr text,
  mau text,
  metrics text,
  amount_seeking text,
  use_of_funds text,
  pitch text,
  pitch_deck_url text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','shortlisted','passed','meeting_scheduled','in_diligence','funded','rejected')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes text,
  review_score integer CHECK (review_score BETWEEN 1 AND 10),
  page_url text,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS startup_apps_status_idx ON public.startup_applications (status);
CREATE INDEX IF NOT EXISTS startup_apps_created_at_idx ON public.startup_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS startup_apps_email_idx ON public.startup_applications (email);

CREATE OR REPLACE FUNCTION public.set_startup_application_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.application_number IS NULL THEN
    NEW.application_number := 'SA-' || to_char(NEW.created_at, 'YYYYMMDD') || '-' || upper(substring(md5(NEW.id::text), 1, 4));
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS startup_apps_set_number ON public.startup_applications;
CREATE TRIGGER startup_apps_set_number
  BEFORE INSERT OR UPDATE ON public.startup_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_startup_application_number();

-- ── NRI CONSULTATIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nri_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  country text,
  investment_range text,
  preferred_route text,
  message text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','scheduled','completed','converted','rejected')),
  scheduled_at timestamptz,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  page_url text,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nri_consultations_status_idx ON public.nri_consultations (status);
CREATE INDEX IF NOT EXISTS nri_consultations_created_at_idx ON public.nri_consultations (created_at DESC);
CREATE INDEX IF NOT EXISTS nri_consultations_email_idx ON public.nri_consultations (email);

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "referrals_public_insert" ON public.referrals;
CREATE POLICY "referrals_public_insert" ON public.referrals FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "referrals_admin_read" ON public.referrals;
CREATE POLICY "referrals_admin_read" ON public.referrals FOR SELECT USING (is_admin_or_above() OR is_staff());
DROP POLICY IF EXISTS "referrals_admin_update" ON public.referrals;
CREATE POLICY "referrals_admin_update" ON public.referrals FOR UPDATE USING (is_admin_or_above() OR is_staff());

ALTER TABLE public.startup_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "startup_apps_public_insert" ON public.startup_applications;
CREATE POLICY "startup_apps_public_insert" ON public.startup_applications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "startup_apps_admin_read" ON public.startup_applications;
CREATE POLICY "startup_apps_admin_read" ON public.startup_applications FOR SELECT USING (is_admin_or_above() OR is_staff());
DROP POLICY IF EXISTS "startup_apps_admin_update" ON public.startup_applications;
CREATE POLICY "startup_apps_admin_update" ON public.startup_applications FOR UPDATE USING (is_admin_or_above() OR is_staff());

ALTER TABLE public.nri_consultations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nri_consultations_public_insert" ON public.nri_consultations;
CREATE POLICY "nri_consultations_public_insert" ON public.nri_consultations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "nri_consultations_admin_read" ON public.nri_consultations;
CREATE POLICY "nri_consultations_admin_read" ON public.nri_consultations FOR SELECT USING (is_admin_or_above() OR is_staff());
DROP POLICY IF EXISTS "nri_consultations_admin_update" ON public.nri_consultations;
CREATE POLICY "nri_consultations_admin_update" ON public.nri_consultations FOR UPDATE USING (is_admin_or_above() OR is_staff());
