-- 2026-05-16: Expand public.user_role enum to cover all admin-side roles
-- the UI has been offering for months.
--
-- The Settings → Permissions admin user list calls fetchAdminUsers, which
-- runs `profiles.role in (...)` with the full 11-role list. Until today the
-- enum only had 5 values (admin, client, staff, super_admin, viewer), so the
-- PostgREST `in` filter errored on the unknown values and returned [] — the
-- screen showed "0 users" for every role, Add Admin User silently rejected
-- writes for non-existing values, and Change Role for those targets failed.
--
-- ADD VALUE IF NOT EXISTS is idempotent and additive. No existing rows or
-- RLS policies reference these names yet, so this is safe to re-run.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'compliance_officer';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'fund_manager';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'marketing_manager';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'marketing_executive';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'sales';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'operations';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'hr';
