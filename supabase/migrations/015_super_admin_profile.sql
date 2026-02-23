-- ============================================================
-- 015 · CREATE SUPER ADMIN PROFILE
-- Run this after creating the auth user in Supabase dashboard
-- ============================================================

-- Insert profile for super admin (links to auth.users)
INSERT INTO profiles (id, role, full_name, department, job_title, is_active)
VALUES (
    '19be82d3-1bb4-429a-ae31-516cf1cda2b1',
    'super_admin',
    'Abe Thayil',
    'Executive',
    'Managing Director & Fund Manager',
    TRUE
)
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    full_name = 'Abe Thayil',
    department = 'Executive',
    job_title = 'Managing Director & Fund Manager',
    is_active = TRUE,
    updated_at = NOW();
