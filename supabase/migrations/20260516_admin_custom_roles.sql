-- ================================================================
-- 20260516 · Custom admin roles
--
-- Built-in roles live in lib/admin/adminRBAC.ts (Postgres user_role enum
-- + ROLE_PERMISSIONS map). This table layers user-defined permission
-- templates on top so a Super Admin can create a "Senior Analyst" role
-- (etc.) from the UI without a code deploy.
--
-- Assignment model: built-in roles still flow through profiles.role
-- (enum). Custom roles attach to a user via profiles.custom_role_id;
-- the resolver in lib/admin/adminRBAC reads built-in perms first, then
-- unions the custom role's permissions and the user's permission_overrides.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.admin_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key          TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  description  TEXT,
  permissions  JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_key ON public.admin_roles(key);
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON public.admin_roles(is_active);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES public.admin_roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_custom_role_id ON public.profiles(custom_role_id);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_roles_select_authed" ON public.admin_roles;
CREATE POLICY "admin_roles_select_authed" ON public.admin_roles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_roles_super_admin_write" ON public.admin_roles;
CREATE POLICY "admin_roles_super_admin_write" ON public.admin_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

CREATE OR REPLACE FUNCTION public.admin_roles_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS admin_roles_touch_updated_at ON public.admin_roles;
CREATE TRIGGER admin_roles_touch_updated_at
  BEFORE UPDATE ON public.admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.admin_roles_touch_updated_at();
