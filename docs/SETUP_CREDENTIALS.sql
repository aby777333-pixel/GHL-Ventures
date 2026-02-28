-- ═══════════════════════════════════════════════════════════════
-- GHL India Ventures — Test Account Setup
-- ═══════════════════════════════════════════════════════════════
--
-- STEP 1: Run migration 024 first (fixes the trigger that blocks user creation)
--
-- STEP 2: Create users in Supabase Auth dashboard:
--   admin@ghlindiaventures.com  / GHL@Admin2025!
--   staff@ghlindiaventures.com  / GHL@Staff2025!
--   client@ghlindiaventures.com / GHL@Client2025!
--
-- STEP 3: Run this SQL in Supabase SQL Editor after creating auth users
-- ═══════════════════════════════════════════════════════════════

-- The trigger fn_auto_create_profile() auto-creates a basic profile row
-- with role='viewer' on signup. This script upgrades roles & adds details.

-- Admin profile (upgrade from viewer → admin)
INSERT INTO profiles (id, full_name, role, phone, city, is_active)
SELECT id, 'GHL Admin', 'admin', '+91 44 2843 1043', 'Chennai', true
FROM auth.users WHERE email = 'admin@ghlindiaventures.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'GHL Admin', phone = '+91 44 2843 1043', city = 'Chennai', is_active = true;

-- Staff profile (upgrade from viewer → staff)
INSERT INTO profiles (id, full_name, role, phone, city, is_active)
SELECT id, 'GHL Staff', 'staff', '+91 72002 55252', 'Chennai', true
FROM auth.users WHERE email = 'staff@ghlindiaventures.com'
ON CONFLICT (id) DO UPDATE SET role = 'staff', full_name = 'GHL Staff', phone = '+91 72002 55252', city = 'Chennai', is_active = true;

-- Staff member entry in staff_profiles
INSERT INTO staff_profiles (user_id, employee_id, department, designation, is_active)
SELECT id, 'GHL001', 'Sales', 'Relationship Manager', true
FROM auth.users WHERE email = 'staff@ghlindiaventures.com'
ON CONFLICT (user_id) DO UPDATE SET department = 'Sales', designation = 'Relationship Manager', is_active = true;

-- Client profile (keep as viewer)
INSERT INTO profiles (id, full_name, role, phone, city, is_active)
SELECT id, 'Test Client', 'viewer', '+91 98765 43210', 'Mumbai', true
FROM auth.users WHERE email = 'client@ghlindiaventures.com'
ON CONFLICT (id) DO UPDATE SET role = 'viewer', full_name = 'Test Client', phone = '+91 98765 43210', city = 'Mumbai', is_active = true;

-- Client entry
INSERT INTO clients (user_id, full_name, client_code, kyc_status, risk_profile)
SELECT id, 'Test Client', 'GHL-TST-001', 'verified', 'Moderate'
FROM auth.users WHERE email = 'client@ghlindiaventures.com'
ON CONFLICT (user_id) DO UPDATE SET full_name = 'Test Client', kyc_status = 'verified';
