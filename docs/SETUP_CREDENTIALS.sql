-- ═══════════════════════════════════════════════════════════════
-- GHL India Ventures — Test Account Setup (Comprehensive)
-- ═══════════════════════════════════════════════════════════════
--
-- STEP 1: Run all migrations first (000 through 025)
--
-- STEP 2: Create users in Supabase Auth dashboard (Authentication → Users → Add User):
--
--   ADMIN:
--   superadmin@ghlindia.com     / GHL@SuperAdmin2025!
--
--   STAFF:
--   staff1@ghlindia.com         / GHL@Staff2025!
--   staff2@ghlindia.com         / GHL@Staff2025!
--   staff3@ghlindia.com         / GHL@Staff2025!
--
--   CLIENTS:
--   client1@ghlindia.com        / GHL@Client2025!
--   client2@ghlindia.com        / GHL@Client2025!
--
-- STEP 3: Run this SQL in Supabase SQL Editor after creating auth users
-- ═══════════════════════════════════════════════════════════════

-- The trigger fn_auto_create_profile() auto-creates a basic profile row
-- with role='viewer' on signup. This script upgrades roles & adds details.

-- ─── SUPER ADMIN ─────────────────────────────────────────────

INSERT INTO profiles (id, full_name, role, phone, city, department, job_title, is_active)
SELECT id, 'Arun Sharma (Super Admin)', 'super_admin', '+91 44 2843 1043', 'Chennai', 'Management', 'CEO & Fund Manager', true
FROM auth.users WHERE email = 'superadmin@ghlindia.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  full_name = 'Arun Sharma (Super Admin)',
  phone = '+91 44 2843 1043',
  city = 'Chennai',
  department = 'Management',
  job_title = 'CEO & Fund Manager',
  is_active = true;

-- ─── STAFF 1 — CS Lead ──────────────────────────────────────

INSERT INTO profiles (id, full_name, role, phone, city, department, job_title, is_active)
SELECT id, 'Priya Nair', 'staff', '+91 72002 55001', 'Chennai', 'Customer Service', 'CS Lead', true
FROM auth.users WHERE email = 'staff1@ghlindia.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'staff',
  full_name = 'Priya Nair',
  phone = '+91 72002 55001',
  city = 'Chennai',
  department = 'Customer Service',
  job_title = 'CS Lead',
  is_active = true;

INSERT INTO staff_profiles (user_id, employee_id, department, designation, is_active)
SELECT id, 'GHL-CS-001', 'Customer Service', 'CS Lead', true
FROM auth.users WHERE email = 'staff1@ghlindia.com'
ON CONFLICT (user_id) DO UPDATE SET
  employee_id = 'GHL-CS-001',
  department = 'Customer Service',
  designation = 'CS Lead',
  is_active = true;

-- ─── STAFF 2 — Relationship Manager ─────────────────────────

INSERT INTO profiles (id, full_name, role, phone, city, department, job_title, is_active)
SELECT id, 'Rahul Menon', 'staff', '+91 72002 55002', 'Chennai', 'Sales', 'Relationship Manager', true
FROM auth.users WHERE email = 'staff2@ghlindia.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'staff',
  full_name = 'Rahul Menon',
  phone = '+91 72002 55002',
  city = 'Chennai',
  department = 'Sales',
  job_title = 'Relationship Manager',
  is_active = true;

INSERT INTO staff_profiles (user_id, employee_id, department, designation, is_active)
SELECT id, 'GHL-RM-001', 'Sales', 'Relationship Manager', true
FROM auth.users WHERE email = 'staff2@ghlindia.com'
ON CONFLICT (user_id) DO UPDATE SET
  employee_id = 'GHL-RM-001',
  department = 'Sales',
  designation = 'Relationship Manager',
  is_active = true;

-- ─── STAFF 3 — Field Sales Executive ────────────────────────

INSERT INTO profiles (id, full_name, role, phone, city, department, job_title, is_active)
SELECT id, 'Deepa Rajan', 'staff', '+91 72002 55003', 'Mumbai', 'Sales', 'Field Sales Executive', true
FROM auth.users WHERE email = 'staff3@ghlindia.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'staff',
  full_name = 'Deepa Rajan',
  phone = '+91 72002 55003',
  city = 'Mumbai',
  department = 'Sales',
  job_title = 'Field Sales Executive',
  is_active = true;

INSERT INTO staff_profiles (user_id, employee_id, department, designation, is_active)
SELECT id, 'GHL-FS-001', 'Sales', 'Field Sales Executive', true
FROM auth.users WHERE email = 'staff3@ghlindia.com'
ON CONFLICT (user_id) DO UPDATE SET
  employee_id = 'GHL-FS-001',
  department = 'Sales',
  designation = 'Field Sales Executive',
  is_active = true;

-- ─── CLIENT 1 — Verified Investor ───────────────────────────

INSERT INTO profiles (id, full_name, role, phone, city, is_active)
SELECT id, 'Vikram Patel', 'viewer', '+91 98765 43001', 'Mumbai', true
FROM auth.users WHERE email = 'client1@ghlindia.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'viewer',
  full_name = 'Vikram Patel',
  phone = '+91 98765 43001',
  city = 'Mumbai',
  is_active = true;

INSERT INTO clients (user_id, full_name, email, phone, client_code, city, kyc_status, risk_profile, investor_type, total_invested, is_active)
SELECT id, 'Vikram Patel', 'client1@ghlindia.com', '+91 98765 43001', 'GHL-INV-001', 'Mumbai', 'verified', 'moderate', 'individual', 2500000, true
FROM auth.users WHERE email = 'client1@ghlindia.com'
ON CONFLICT (user_id) DO UPDATE SET
  full_name = 'Vikram Patel',
  email = 'client1@ghlindia.com',
  client_code = 'GHL-INV-001',
  kyc_status = 'verified',
  risk_profile = 'moderate',
  total_invested = 2500000,
  is_active = true;

-- ─── CLIENT 2 — Pending KYC ─────────────────────────────────

INSERT INTO profiles (id, full_name, role, phone, city, is_active)
SELECT id, 'Anjali Deshmukh', 'viewer', '+91 98765 43002', 'Pune', true
FROM auth.users WHERE email = 'client2@ghlindia.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'viewer',
  full_name = 'Anjali Deshmukh',
  phone = '+91 98765 43002',
  city = 'Pune',
  is_active = true;

INSERT INTO clients (user_id, full_name, email, phone, client_code, city, kyc_status, risk_profile, investor_type, total_invested, is_active)
SELECT id, 'Anjali Deshmukh', 'client2@ghlindia.com', '+91 98765 43002', 'GHL-INV-002', 'Pune', 'pending', 'conservative', 'individual', 0, true
FROM auth.users WHERE email = 'client2@ghlindia.com'
ON CONFLICT (user_id) DO UPDATE SET
  full_name = 'Anjali Deshmukh',
  email = 'client2@ghlindia.com',
  client_code = 'GHL-INV-002',
  kyc_status = 'pending',
  risk_profile = 'conservative',
  total_invested = 0,
  is_active = true;

-- ─── Assign RM to Client 1 ──────────────────────────────────
UPDATE clients SET assigned_rm = (
  SELECT sp.id FROM staff_profiles sp
  JOIN auth.users u ON sp.user_id = u.id
  WHERE u.email = 'staff2@ghlindia.com'
  LIMIT 1
)
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'client1@ghlindia.com');

-- ─── Verification Queries ────────────────────────────────────
-- Run these to verify setup:

-- SELECT u.email, p.full_name, p.role, p.is_active
-- FROM auth.users u
-- JOIN profiles p ON u.id = p.id
-- WHERE u.email LIKE '%ghlindia.com'
-- ORDER BY p.role, u.email;

-- SELECT u.email, sp.employee_id, sp.department, sp.designation
-- FROM staff_profiles sp
-- JOIN auth.users u ON sp.user_id = u.id;

-- SELECT u.email, c.client_code, c.full_name, c.kyc_status, c.total_invested
-- FROM clients c
-- JOIN auth.users u ON c.user_id = u.id;
