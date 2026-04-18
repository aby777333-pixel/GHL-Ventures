-- ================================================================
-- 044 — Grievances table for public grievance-redressal form
-- (/contact/grievance). Matches SEBI AIF 3-level escalation.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.grievances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  folio_number text,
  complaint_type text,
  incident_date date,
  description text NOT NULL,
  desired_resolution text,
  contacted_before boolean DEFAULT false,
  previous_reference text,
  -- Lifecycle
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','acknowledged','in_progress','resolved','rejected','escalated')),
  escalation_level integer DEFAULT 1 CHECK (escalation_level BETWEEN 1 AND 3),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes text,
  resolution_summary text,
  resolved_at timestamptz,
  -- Meta
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  page_url text,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS grievances_status_idx ON public.grievances (status);
CREATE INDEX IF NOT EXISTS grievances_created_at_idx ON public.grievances (created_at DESC);
CREATE INDEX IF NOT EXISTS grievances_email_idx ON public.grievances (email);

-- Auto-generate GRV-YYYYMMDD-XXXX ticket numbers.
CREATE OR REPLACE FUNCTION public.set_grievance_ticket_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := 'GRV-' || to_char(NEW.created_at, 'YYYYMMDD') || '-' || upper(substring(md5(NEW.id::text), 1, 4));
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS grievances_set_ticket_number ON public.grievances;
CREATE TRIGGER grievances_set_ticket_number
  BEFORE INSERT OR UPDATE ON public.grievances
  FOR EACH ROW EXECUTE FUNCTION public.set_grievance_ticket_number();

-- RLS: public website form inserts; admin/staff read & update.
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grievances_public_insert" ON public.grievances;
CREATE POLICY "grievances_public_insert" ON public.grievances
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "grievances_admin_read" ON public.grievances;
CREATE POLICY "grievances_admin_read" ON public.grievances
  FOR SELECT USING (is_admin_or_above() OR is_staff());

DROP POLICY IF EXISTS "grievances_admin_update" ON public.grievances;
CREATE POLICY "grievances_admin_update" ON public.grievances
  FOR UPDATE USING (is_admin_or_above() OR is_staff());
