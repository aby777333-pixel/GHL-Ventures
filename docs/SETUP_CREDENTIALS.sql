-- ═══════════════════════════════════════════════════════════════
-- GHL India Ventures — Test Account Setup
-- ═══════════════════════════════════════════════════════════════
--
-- STEP 1: Create users in Supabase Auth dashboard:
--   admin@ghlindiaventures.com  / GHL@Admin2025!
--   staff@ghlindiaventures.com  / GHL@Staff2025!
--   client@ghlindiaventures.com / GHL@Client2025!
--
-- STEP 2: Run this SQL in Supabase SQL Editor after creating auth users
-- ═══════════════════════════════════════════════════════════════

-- Get the auth.users IDs (replace with actual UUIDs after creating accounts)
-- You can find these in Supabase Dashboard > Authentication > Users

-- Admin profile
INSERT INTO profiles (id, email, full_name, role, phone, city, is_active)
SELECT id, email, 'GHL Admin', 'admin', '+91 44 2843 1043', 'Chennai', true
FROM auth.users WHERE email = 'admin@ghlindiaventures.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'GHL Admin', is_active = true;

-- Staff profile
INSERT INTO profiles (id, email, full_name, role, phone, city, is_active)
SELECT id, email, 'GHL Staff', 'staff', '+91 72002 55252', 'Chennai', true
FROM auth.users WHERE email = 'staff@ghlindiaventures.com'
ON CONFLICT (id) DO UPDATE SET role = 'staff', full_name = 'GHL Staff', is_active = true;

-- Staff member entry in staff_profiles
INSERT INTO staff_profiles (user_id, employee_id, department, designation, is_active)
SELECT id, 'GHL001', 'Sales', 'Relationship Manager', true
FROM auth.users WHERE email = 'staff@ghlindiaventures.com'
ON CONFLICT (user_id) DO UPDATE SET department = 'Sales', designation = 'Relationship Manager', is_active = true;

-- Client profile
INSERT INTO profiles (id, email, full_name, role, phone, city, is_active)
SELECT id, email, 'Test Client', 'viewer', '+91 98765 43210', 'Mumbai', true
FROM auth.users WHERE email = 'client@ghlindiaventures.com'
ON CONFLICT (id) DO UPDATE SET role = 'viewer', full_name = 'Test Client', is_active = true;

-- Client entry
INSERT INTO clients (user_id, full_name, client_code, kyc_status, risk_profile)
SELECT id, 'Test Client', 'GHL-TST-001', 'verified', 'Moderate'
FROM auth.users WHERE email = 'client@ghlindiaventures.com'
ON CONFLICT (user_id) DO UPDATE SET full_name = 'Test Client', kyc_status = 'verified';
