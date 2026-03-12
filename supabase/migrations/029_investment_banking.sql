-- ================================================================
-- 029: Investment Applications, Bank Accounts, and Client Pipeline
--
-- Creates:
-- 1. bank_accounts — client bank accounts (multiple per client)
-- 2. investment_applications — investment interest/applications
-- 3. Adds lead creation trigger on new client registration
-- 4. RLS policies for both tables
-- ================================================================

-- ── Bank Accounts ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  account_holder_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  bank_name TEXT,
  branch_name TEXT,
  account_type TEXT DEFAULT 'savings' CHECK (account_type IN ('savings','current','nro','nre')),
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  cancelled_cheque_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_client ON public.bank_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON public.bank_accounts(user_id);

-- ── Investment Applications ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.investment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fund_vehicle TEXT NOT NULL,
  investment_amount NUMERIC(15,2) NOT NULL,
  tenure_preference TEXT DEFAULT '5 Years',
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  terms_accepted BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','under_review','approved','rejected','completed')),
  assigned_rm UUID REFERENCES public.staff_profiles(id),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  document_urls TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_app_client ON public.investment_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_inv_app_status ON public.investment_applications(status);
CREATE INDEX IF NOT EXISTS idx_inv_app_user ON public.investment_applications(user_id);

-- ── Interest Registrations ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.interest_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fund_title TEXT NOT NULL,
  fund_type TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','converted','expired')),
  assigned_to UUID REFERENCES public.staff_profiles(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interest_client ON public.interest_registrations(client_id);

-- ── RLS Policies ───────────────────────────────────────────

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_registrations ENABLE ROW LEVEL SECURITY;

-- Bank accounts: clients see own, admins see all
DO $$ BEGIN
  CREATE POLICY bank_accounts_client_select ON public.bank_accounts FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY bank_accounts_client_insert ON public.bank_accounts FOR INSERT
    WITH CHECK (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY bank_accounts_client_update ON public.bank_accounts FOR UPDATE
    USING (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Investment applications: clients see own, admins/staff see all
DO $$ BEGIN
  CREATE POLICY inv_app_client_select ON public.investment_applications FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY inv_app_client_insert ON public.investment_applications FOR INSERT
    WITH CHECK (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY inv_app_admin_update ON public.investment_applications FOR UPDATE
    USING (EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Interest registrations: clients see own, admins see all
DO $$ BEGIN
  CREATE POLICY interest_client_select ON public.interest_registrations FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY interest_client_insert ON public.interest_registrations FOR INSERT
    WITH CHECK (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Auto-create lead when new client is registered ─────────

CREATE OR REPLACE FUNCTION public.fn_auto_create_lead_for_client()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a lead entry for the new client so they appear in the CRM pipeline
  INSERT INTO public.leads (
    first_name,
    last_name,
    email,
    phone,
    city,
    source,
    status,
    investment_interest,
    converted_client_id,
    converted_at,
    metadata
  ) VALUES (
    split_part(COALESCE(NEW.full_name, ''), ' ', 1),
    CASE WHEN position(' ' IN COALESCE(NEW.full_name, '')) > 0
      THEN substring(NEW.full_name FROM position(' ' IN NEW.full_name) + 1)
      ELSE NULL
    END,
    NEW.email,
    NEW.phone,
    NEW.city,
    COALESCE(NEW.acquisition_source, 'website'),
    'won',
    'AIF Investment',
    NEW.id,
    NOW(),
    jsonb_build_object('auto_created', true, 'source', 'client_registration')
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_create_lead_for_client ON public.clients;
CREATE TRIGGER trg_auto_create_lead_for_client
  AFTER INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_create_lead_for_client();

-- ── Notify admins on new investment application ────────────

CREATE OR REPLACE FUNCTION public.fn_notify_investment_application()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name TEXT;
  v_admin RECORD;
BEGIN
  SELECT full_name INTO v_client_name FROM clients WHERE id = NEW.client_id;

  FOR v_admin IN
    SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
  LOOP
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      v_admin.id,
      'action_required',
      'New Investment Application',
      format('%s submitted an investment application for %s — %s',
        COALESCE(v_client_name, 'A client'),
        NEW.fund_vehicle,
        'Rs. ' || to_char(NEW.investment_amount, 'FM99,99,99,999')
      ),
      '/admin?tab=clients',
      jsonb_build_object('application_id', NEW.id, 'client_id', NEW.client_id)
    );
  END LOOP;

  -- Also notify assigned RM if any
  IF NEW.assigned_rm IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    SELECT
      sp.user_id,
      'action_required',
      'New Investment Application from Your Client',
      format('%s submitted an investment application for %s',
        COALESCE(v_client_name, 'A client'), NEW.fund_vehicle),
      '/staff?tab=clients',
      jsonb_build_object('application_id', NEW.id, 'client_id', NEW.client_id)
    FROM staff_profiles sp WHERE sp.id = NEW.assigned_rm;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_investment_application ON public.investment_applications;
CREATE TRIGGER trg_notify_investment_application
  AFTER INSERT ON public.investment_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_investment_application();

-- ── Enable realtime for new tables ─────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interest_registrations;
