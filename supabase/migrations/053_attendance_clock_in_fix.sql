-- Attendance / Leave clock-in fix (2026-05):
--
-- The 2026-05 staff dashboard correction wired clock-in/out and
-- leave-submission through SECURITY DEFINER RPCs that resolve auth.uid()
-- → staff_profiles.id and auto-create the staff profile when missing
-- (see migration 051). Two issues remained:
--
-- 1. The original ensure_staff_profile() inserted columns that don't exist
--    on staff_profiles (full_name, email, role). Any user without a
--    pre-existing staff_profiles row hit a "column does not exist" error,
--    surfacing as a generic clock-in failure.
--
-- 2. Custom-domain hosts (ghlindiaventures.com via nginx) may serve an
--    older bundle for some time. The legacy bundle inserts staff_id =
--    auth.uid() directly, which violates the FK to staff_profiles(id) and
--    is rejected by RLS. We add a BEFORE-INSERT trigger that rewrites the
--    staff_id at the row level, plus permissive RLS policies that accept
--    either format. New clients are unaffected because they already pass
--    the correct staff_profiles.id.

-- ── 1. Fix ensure_staff_profile() column list ────────────────────────
CREATE OR REPLACE FUNCTION public.ensure_staff_profile(p_uid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  IF p_uid IS NULL THEN RETURN NULL; END IF;
  SELECT id INTO v_staff_id FROM public.staff_profiles WHERE user_id = p_uid LIMIT 1;
  IF v_staff_id IS NOT NULL THEN RETURN v_staff_id; END IF;

  -- Insert only columns that exist on staff_profiles. department is NOT
  -- NULL so we default it to 'Operations'; an admin can edit later from
  -- /admin/employees/directory.
  INSERT INTO public.staff_profiles (user_id, department, designation, status)
  VALUES (p_uid, 'Operations', 'Staff', 'active')
  RETURNING id INTO v_staff_id;
  RETURN v_staff_id;
EXCEPTION WHEN unique_violation THEN
  -- Concurrent call won the race — re-read the row.
  SELECT id INTO v_staff_id FROM public.staff_profiles WHERE user_id = p_uid LIMIT 1;
  RETURN v_staff_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_staff_profile(uuid) TO authenticated;

-- ── 2a. Backstop trigger: rewrite legacy staff_id (auth.uid()) ──────
CREATE OR REPLACE FUNCTION public.attendance_resolve_staff_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_resolved uuid;
BEGIN
  PERFORM 1 FROM public.staff_profiles WHERE id = NEW.staff_id;
  IF FOUND THEN RETURN NEW; END IF;

  IF NEW.staff_id IS NOT NULL THEN
    SELECT id INTO v_resolved FROM public.staff_profiles WHERE user_id = NEW.staff_id LIMIT 1;
    IF v_resolved IS NULL THEN
      v_resolved := public.ensure_staff_profile(NEW.staff_id);
    END IF;
    IF v_resolved IS NOT NULL THEN
      NEW.staff_id := v_resolved;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_attendance_resolve_staff_id ON public.attendance;
CREATE TRIGGER trg_attendance_resolve_staff_id
  BEFORE INSERT ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.attendance_resolve_staff_id();

-- ── 2b. Same backstop on leave_requests ─────────────────────────────
CREATE OR REPLACE FUNCTION public.leave_requests_resolve_staff_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_resolved uuid;
BEGIN
  PERFORM 1 FROM public.staff_profiles WHERE id = NEW.staff_id;
  IF FOUND THEN RETURN NEW; END IF;

  IF NEW.staff_id IS NOT NULL THEN
    SELECT id INTO v_resolved FROM public.staff_profiles WHERE user_id = NEW.staff_id LIMIT 1;
    IF v_resolved IS NULL THEN
      v_resolved := public.ensure_staff_profile(NEW.staff_id);
    END IF;
    IF v_resolved IS NOT NULL THEN
      NEW.staff_id := v_resolved;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leave_requests_resolve_staff_id ON public.leave_requests;
CREATE TRIGGER trg_leave_requests_resolve_staff_id
  BEFORE INSERT ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.leave_requests_resolve_staff_id();

-- ── 3. Permissive RLS policies that accept both staff_id formats ────
DROP POLICY IF EXISTS "attendance_legacy_insert" ON public.attendance;
CREATE POLICY "attendance_legacy_insert" ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    staff_id = auth.uid()
    OR staff_id IN (SELECT id FROM public.staff_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "leave_requests_legacy_insert" ON public.leave_requests;
CREATE POLICY "leave_requests_legacy_insert" ON public.leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    staff_id = auth.uid()
    OR staff_id IN (SELECT id FROM public.staff_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "attendance_legacy_select" ON public.attendance;
CREATE POLICY "attendance_legacy_select" ON public.attendance
  FOR SELECT
  TO authenticated
  USING (
    staff_id = auth.uid()
    OR staff_id IN (SELECT id FROM public.staff_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "leave_requests_legacy_select" ON public.leave_requests;
CREATE POLICY "leave_requests_legacy_select" ON public.leave_requests
  FOR SELECT
  TO authenticated
  USING (
    staff_id = auth.uid()
    OR staff_id IN (SELECT id FROM public.staff_profiles WHERE user_id = auth.uid())
  );
