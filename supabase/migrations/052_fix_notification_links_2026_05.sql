-- Fix notification deep-links (2026-05):
-- The leave-request RPC was writing the link as '/admin/people/leave', but
-- the actual admin module is 'employees' (route /admin/employees/leave).
-- Clicking the bell entry would route to /admin/people/leave which is not a
-- valid prerendered static path → Netlify 404.

-- 1. Patch the RPC so future leave requests use the correct module slug.
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
           '/admin/employees/leave',
           jsonb_build_object('leave_request_id', v_inserted.id, 'staff_id', v_staff_id)
      FROM public.profiles p
     WHERE p.role IN ('admin', 'super_admin');
  EXCEPTION WHEN others THEN NULL;
  END;

  RETURN to_jsonb(v_inserted);
END;
$$;

-- 2. Backfill existing notifications that already point to the bad path.
UPDATE public.notifications
   SET link = '/admin/employees/leave'
 WHERE link = '/admin/people/leave';

UPDATE public.notifications
   SET link = '/admin/employees'
 WHERE link = '/admin/people';
