-- ============================================================
-- 028 · EMPLOYEE ONBOARDING + RM AUTO-ASSIGNMENT
--
-- 1. RPC to auto-assign an RM to a newly registered client
-- 2. RPC to fetch all active RMs (for admin manual assignment)
-- 3. RPC to manually assign/reassign RM to a client
-- 4. Fix fetchEmployees: create a view joining staff_profiles+profiles
-- ============================================================

-- ── 1. Auto-assign RM to a new client ──────────────────────
-- Finds the least-loaded active RM and assigns them to the client.
-- Called during client registration (signupClient / ensureProfile).
CREATE OR REPLACE FUNCTION auto_assign_rm_to_client(p_client_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_client_id UUID;
  v_rm_staff_id UUID;
  v_rm_user_id UUID;
  v_rm_name TEXT;
BEGIN
  -- Get the client row id from user_id
  SELECT id INTO v_client_id
  FROM clients
  WHERE user_id = p_client_user_id;

  IF v_client_id IS NULL THEN
    RETURN NULL;  -- No client row yet
  END IF;

  -- Skip if RM already assigned
  IF (SELECT assigned_rm FROM clients WHERE id = v_client_id) IS NOT NULL THEN
    RETURN (SELECT assigned_rm FROM clients WHERE id = v_client_id);
  END IF;

  -- Find the least-loaded active RM (by number of assigned clients)
  SELECT sp.id, sp.user_id, p.full_name
  INTO v_rm_staff_id, v_rm_user_id, v_rm_name
  FROM staff_profiles sp
  JOIN profiles p ON p.id = sp.user_id
  WHERE sp.designation IN ('relationship-manager', 'team-leader', 'cs-lead')
    AND sp.is_active = TRUE
  ORDER BY (
    SELECT COUNT(*) FROM clients c
    WHERE c.assigned_rm = sp.id
  ) ASC
  LIMIT 1;

  IF v_rm_staff_id IS NULL THEN
    RETURN NULL;  -- No available RMs
  END IF;

  -- Assign the RM to the client
  UPDATE clients
  SET assigned_rm = v_rm_staff_id
  WHERE id = v_client_id;

  -- Also create client_assignments row for many-to-many tracking
  INSERT INTO client_assignments (client_id, staff_id, role)
  VALUES (v_client_id, v_rm_staff_id, 'relationship_manager')
  ON CONFLICT (client_id, staff_id) DO NOTHING;

  -- Notify the RM
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (
    v_rm_user_id,
    'info',
    'New Client Assigned',
    'A new client has been assigned to you as their Relationship Manager.',
    '/staff/clients',
    jsonb_build_object('client_id', v_client_id)
  );

  RETURN v_rm_staff_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. Get all active RMs (for admin dropdown / CS transfer list) ──
CREATE OR REPLACE FUNCTION get_active_rms()
RETURNS TABLE (
  staff_id UUID,
  user_id UUID,
  full_name TEXT,
  designation TEXT,
  department TEXT,
  client_count BIGINT
) AS $$
  SELECT
    sp.id AS staff_id,
    sp.user_id,
    p.full_name,
    sp.designation,
    sp.department,
    (SELECT COUNT(*) FROM clients c WHERE c.assigned_rm = sp.id) AS client_count
  FROM staff_profiles sp
  JOIN profiles p ON p.id = sp.user_id
  WHERE sp.designation IN ('relationship-manager', 'team-leader', 'cs-lead', 'senior-cs-agent')
    AND sp.is_active = TRUE
  ORDER BY p.full_name ASC;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── 3. Manually assign/reassign RM to a client (Super Admin) ──
CREATE OR REPLACE FUNCTION assign_rm_to_client(
  p_client_id UUID,
  p_rm_staff_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_rm_user_id UUID;
  v_rm_name TEXT;
  v_client_name TEXT;
BEGIN
  -- Get RM info
  SELECT sp.user_id, p.full_name
  INTO v_rm_user_id, v_rm_name
  FROM staff_profiles sp
  JOIN profiles p ON p.id = sp.user_id
  WHERE sp.id = p_rm_staff_id;

  -- Get client name
  SELECT full_name INTO v_client_name
  FROM clients WHERE id = p_client_id;

  -- Update the client's assigned RM
  UPDATE clients
  SET assigned_rm = p_rm_staff_id
  WHERE id = p_client_id;

  -- Upsert client_assignments
  INSERT INTO client_assignments (client_id, staff_id, role)
  VALUES (p_client_id, p_rm_staff_id, 'relationship_manager')
  ON CONFLICT (client_id, staff_id) DO UPDATE SET role = 'relationship_manager';

  -- Notify the RM
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (
    v_rm_user_id,
    'info',
    'Client Assignment',
    'You have been assigned as Relationship Manager for ' || COALESCE(v_client_name, 'a client') || '.',
    '/staff/clients',
    jsonb_build_object('client_id', p_client_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. View for employee directory (joins staff_profiles + profiles) ──
CREATE OR REPLACE VIEW employee_directory AS
SELECT
  sp.id,
  sp.user_id,
  sp.employee_id,
  p.full_name AS name,
  p.phone,
  COALESCE(
    (SELECT au.email FROM auth.users au WHERE au.id = sp.user_id),
    ''
  ) AS email,
  sp.department,
  sp.designation AS role,
  sp.date_of_joining AS join_date,
  sp.reporting_to,
  sp.skills,
  sp.certifications,
  CASE WHEN sp.is_active THEN 'active' ELSE 'inactive' END AS status,
  sp.created_at,
  sp.updated_at,
  -- Get the reporting manager's name
  (SELECT p2.full_name FROM profiles p2 WHERE p2.id = sp.reporting_to) AS reporting_to_name
FROM staff_profiles sp
JOIN profiles p ON p.id = sp.user_id
ORDER BY p.full_name ASC;

-- ── 5. RPC to fetch employee directory (bypasses RLS for the view) ──
CREATE OR REPLACE FUNCTION get_employee_directory()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  employee_id TEXT,
  name TEXT,
  phone TEXT,
  email TEXT,
  department TEXT,
  role TEXT,
  join_date DATE,
  reporting_to UUID,
  skills TEXT[],
  certifications TEXT[],
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  reporting_to_name TEXT
) AS $$
  SELECT * FROM employee_directory;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── 6. RPC to create employee profile records ──
-- Creates profiles + staff_profiles rows for a new employee.
-- The auth.users account is created separately via the Admin API.
CREATE OR REPLACE FUNCTION create_employee_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_employee_id TEXT DEFAULT NULL,
  p_department TEXT DEFAULT 'Operations',
  p_designation TEXT DEFAULT 'general-employee',
  p_date_of_joining DATE DEFAULT CURRENT_DATE,
  p_reporting_to UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_staff_id UUID;
BEGIN
  -- Create or update profiles row
  INSERT INTO profiles (id, full_name, phone, role)
  VALUES (p_user_id, p_full_name, p_phone, 'staff')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role = 'staff';

  -- Create staff_profiles row
  INSERT INTO staff_profiles (user_id, employee_id, department, designation, date_of_joining, reporting_to, is_active)
  VALUES (
    p_user_id,
    COALESCE(p_employee_id, 'GHL-' || SUBSTR(p_user_id::text, 1, 8)),
    p_department,
    p_designation,
    p_date_of_joining,
    p_reporting_to,
    TRUE
  )
  ON CONFLICT (user_id) DO UPDATE SET
    department = EXCLUDED.department,
    designation = EXCLUDED.designation,
    date_of_joining = EXCLUDED.date_of_joining,
    reporting_to = EXCLUDED.reporting_to
  RETURNING id INTO v_staff_id;

  RETURN v_staff_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
