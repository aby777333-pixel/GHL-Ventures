-- Staff Dashboard Corrections (2026-05):
--   1. Add clock_in_now() / clock_out_now() RPCs that resolve staff_profiles.id
--      from auth.uid() and auto-create the staff_profile when missing. The
--      previous direct insert into public.attendance was failing because
--      attendance.staff_id is FK to staff_profiles(id), not auth.users(id),
--      so passing auth.uid() raised a foreign-key error.
--   2. Patch submit_my_leave_request() to auto-create staff_profile when
--      missing (same root cause as the clock-in failure).

-- ── 1a. Auto-create staff_profile helper ─────────────────────────────
CREATE OR REPLACE FUNCTION public.ensure_staff_profile(p_uid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_staff_id uuid;
  v_email    text;
  v_name     text;
BEGIN
  IF p_uid IS NULL THEN RETURN NULL; END IF;
  SELECT id INTO v_staff_id FROM public.staff_profiles WHERE user_id = p_uid LIMIT 1;
  IF v_staff_id IS NOT NULL THEN RETURN v_staff_id; END IF;

  -- Pull display fields from profiles for a friendlier auto-created row
  SELECT coalesce(p.full_name, p.email, 'Staff'), p.email
    INTO v_name, v_email
    FROM public.profiles p WHERE p.id = p_uid LIMIT 1;

  INSERT INTO public.staff_profiles (user_id, full_name, email, designation, department, role)
  VALUES (p_uid, coalesce(v_name, 'Staff'), v_email, 'Staff', 'Operations', 'staff')
  RETURNING id INTO v_staff_id;
  RETURN v_staff_id;
EXCEPTION WHEN unique_violation THEN
  -- Two concurrent calls — re-read the row that the other path created.
  SELECT id INTO v_staff_id FROM public.staff_profiles WHERE user_id = p_uid LIMIT 1;
  RETURN v_staff_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_staff_profile(uuid) TO authenticated;

-- ── 1b. clock_in_now() ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.clock_in_now()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_staff_id  uuid;
  v_today     date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_now       timestamptz := now();
  v_row       public.attendance;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  v_staff_id := public.ensure_staff_profile(v_uid);
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'no_staff_profile'; END IF;

  -- Upsert today's attendance row. If a row already exists with no check_in
  -- (e.g. created by an admin marking attendance) we set the check_in time.
  INSERT INTO public.attendance (staff_id, date, check_in, status)
  VALUES (v_staff_id, v_today, v_now, 'present')
  ON CONFLICT (staff_id, date) DO UPDATE
    SET check_in = COALESCE(public.attendance.check_in, EXCLUDED.check_in),
        status   = CASE WHEN public.attendance.status IS NULL OR public.attendance.status = '' THEN 'present' ELSE public.attendance.status END
  RETURNING * INTO v_row;

  RETURN to_jsonb(v_row);
END;
$$;

GRANT EXECUTE ON FUNCTION public.clock_in_now() TO authenticated;

-- ── 1c. clock_out_now() ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.clock_out_now()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_staff_id uuid;
  v_today    date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_now      timestamptz := now();
  v_row      public.attendance;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  v_staff_id := public.ensure_staff_profile(v_uid);
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'no_staff_profile'; END IF;

  UPDATE public.attendance
     SET check_out = COALESCE(check_out, v_now)
   WHERE staff_id = v_staff_id AND date = v_today
   RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    -- No clock-in row today; create a closed row to keep the audit trail.
    INSERT INTO public.attendance (staff_id, date, check_in, check_out, status)
    VALUES (v_staff_id, v_today, v_now, v_now, 'present')
    RETURNING * INTO v_row;
  END IF;

  RETURN to_jsonb(v_row);
END;
$$;

GRANT EXECUTE ON FUNCTION public.clock_out_now() TO authenticated;

-- ── 2. Auto-create staff profile inside submit_my_leave_request() ───
CREATE OR REPLACE FUNCTION public.submit_my_leave_request(
  p_leave_type text,
  p_start_date date,
  p_end_date   date,
  p_half_day   boolean DEFAULT false,
  p_reason     text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_staff_id   uuid;
  v_staff_name text;
  v_inserted   public.leave_requests;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  v_staff_id := public.ensure_staff_profile(v_uid);
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'no_staff_profile'; END IF;

  IF coalesce(trim(p_leave_type), '') = '' THEN RAISE EXCEPTION 'leave_type required'; END IF;
  IF p_start_date IS NULL THEN RAISE EXCEPTION 'start_date required'; END IF;

  SELECT coalesce(p.full_name, p.email, 'Staff') INTO v_staff_name
    FROM public.profiles p WHERE p.id = v_uid LIMIT 1;

  INSERT INTO public.leave_requests (
    staff_id, leave_type, start_date, end_date, reason, status, half_day, requested_by
  )
  VALUES (
    v_staff_id, p_leave_type, p_start_date, coalesce(p_end_date, p_start_date),
    nullif(trim(p_reason), ''), 'pending', coalesce(p_half_day, false), v_uid
  )
  RETURNING * INTO v_inserted;

  BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, link, metadata)
    SELECT p.id,
           'New Leave Request',
           coalesce(v_staff_name, 'Staff') ||
           ' requested ' || p_leave_type || ' leave (' || to_char(p_start_date, 'DD Mon') ||
           CASE WHEN p_end_date IS NOT NULL AND p_end_date <> p_start_date
                THEN ' → ' || to_char(p_end_date, 'DD Mon') ELSE '' END || ')',
           'action_required',
           '/admin/people/leave',
           jsonb_build_object('leave_request_id', v_inserted.id, 'staff_id', v_staff_id)
      FROM public.profiles p
     WHERE p.role IN ('admin', 'super_admin');
  EXCEPTION WHEN others THEN NULL;
  END;

  RETURN to_jsonb(v_inserted);
END;
$$;
