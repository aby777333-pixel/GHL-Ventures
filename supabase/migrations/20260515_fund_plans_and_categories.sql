-- ================================================================
-- 20260515 · FUND CATEGORIES + INVESTMENT PLANS
-- 1. fund_categories     - admin-managed fund types (Add Category)
-- 2. fund_plans          - admin-managed investment plans (Add Plan)
-- 3. fund_plan_banks     - per-plan bank accounts (multi-row inside Plan)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.fund_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fund_categories_type ON public.fund_categories (LOWER(type)) WHERE is_active = TRUE;
ALTER TABLE public.fund_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY fund_categories_admin_all ON public.fund_categories FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY fund_categories_public_read ON public.fund_categories FOR SELECT
    USING (is_active = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.fund_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_name TEXT NOT NULL,
  fund_type_id UUID REFERENCES public.fund_categories(id) ON DELETE SET NULL,
  tenure TEXT,
  yearly_return TEXT,
  yearly_appreciation TEXT,
  yearly_tds TEXT,
  tax TEXT,
  capital_gain TEXT,
  tds_of_tax TEXT,
  locking_period TEXT,
  investment_strategy TEXT[] NOT NULL DEFAULT '{}',
  minimum_investment_range TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','draft','archived')),
  country TEXT,
  image_url TEXT,
  pdf_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_fund_plans_fund_type ON public.fund_plans(fund_type_id);
CREATE INDEX IF NOT EXISTS idx_fund_plans_status ON public.fund_plans(status);
ALTER TABLE public.fund_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY fund_plans_admin_all ON public.fund_plans FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY fund_plans_public_read ON public.fund_plans FOR SELECT
    USING (status = 'active');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.fund_plan_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_plan_id UUID NOT NULL REFERENCES public.fund_plans(id) ON DELETE CASCADE,
  account_holder_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  branch_name TEXT,
  bank_name TEXT,
  swift_iban_code TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fund_plan_banks_plan ON public.fund_plan_banks(fund_plan_id);
ALTER TABLE public.fund_plan_banks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY fund_plan_banks_admin_all ON public.fund_plan_banks FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS fund_categories_touch_updated_at ON public.fund_categories;
CREATE TRIGGER fund_categories_touch_updated_at BEFORE UPDATE ON public.fund_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS fund_plans_touch_updated_at ON public.fund_plans;
CREATE TRIGGER fund_plans_touch_updated_at BEFORE UPDATE ON public.fund_plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
