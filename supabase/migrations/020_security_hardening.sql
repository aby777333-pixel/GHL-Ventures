-- ============================================================
-- 020 · SECURITY HARDENING
-- Addresses all Supabase linter warnings:
--   1. Function search_path mutable (16 functions)
--   2. Materialized views exposed to anon via Data API (6 views)
--   3. Overly permissive RLS policies on file tables (20+ policies)
--
-- NOTE: Leaked password protection must be enabled separately
-- in the Supabase Dashboard under Authentication > Settings.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. FIX FUNCTION SEARCH_PATH
-- Pin search_path to 'public' to prevent search-path hijacking.
-- ════════════════════════════════════════════════════════════

ALTER FUNCTION public.fn_lead_conversion()       SET search_path = public;
ALTER FUNCTION public.fn_auto_create_profile()    SET search_path = public;
ALTER FUNCTION public.fn_calculate_payroll()      SET search_path = public;
ALTER FUNCTION public.fn_audit_log()              SET search_path = public;
ALTER FUNCTION public.fn_lead_scoring()           SET search_path = public;
ALTER FUNCTION public.fn_update_timestamp()       SET search_path = public;
ALTER FUNCTION public.fn_update_client_ltv()      SET search_path = public;

ALTER FUNCTION public.get_user_role()             SET search_path = public;
ALTER FUNCTION public.is_admin_or_above()         SET search_path = public;
ALTER FUNCTION public.is_super_admin()            SET search_path = public;
ALTER FUNCTION public.get_my_client_id()          SET search_path = public;
ALTER FUNCTION public.get_my_staff_id()           SET search_path = public;

ALTER FUNCTION public.refresh_all_materialized_views() SET search_path = public;
ALTER FUNCTION public.get_file_type_from_mime(TEXT)     SET search_path = public;
ALTER FUNCTION public.trg_set_file_type()              SET search_path = public;
ALTER FUNCTION public.trg_update_quota_on_file()       SET search_path = public;


-- ════════════════════════════════════════════════════════════
-- 2. RESTRICT MATERIALIZED VIEWS FROM ANONYMOUS API ACCESS
-- These contain sensitive business KPIs, revenue, campaign data.
-- Only authenticated users (admin/staff) should access them.
-- ════════════════════════════════════════════════════════════

REVOKE SELECT ON public.mv_dashboard_kpis        FROM anon;
REVOKE SELECT ON public.mv_monthly_revenue       FROM anon;
REVOKE SELECT ON public.mv_lead_funnel           FROM anon;
REVOKE SELECT ON public.mv_campaign_performance  FROM anon;
REVOKE SELECT ON public.mv_expense_breakdown     FROM anon;
REVOKE SELECT ON public.mv_client_insights       FROM anon;

-- Ensure authenticated role still has access
GRANT SELECT ON public.mv_dashboard_kpis         TO authenticated;
GRANT SELECT ON public.mv_monthly_revenue        TO authenticated;
GRANT SELECT ON public.mv_lead_funnel            TO authenticated;
GRANT SELECT ON public.mv_campaign_performance   TO authenticated;
GRANT SELECT ON public.mv_expense_breakdown      TO authenticated;
GRANT SELECT ON public.mv_client_insights        TO authenticated;


-- ════════════════════════════════════════════════════════════
-- 3. TIGHTEN RLS POLICIES ON FILE TABLES
-- Replace wide-open anon INSERT/UPDATE/DELETE with
-- authenticated-user-only policies. SELECT remains open
-- so public/shared files can still be viewed.
-- ════════════════════════════════════════════════════════════

-- ── file_records ──────────────────────────────────────────
DROP POLICY IF EXISTS "file_records_anon_insert" ON file_records;
DROP POLICY IF EXISTS "file_records_anon_update" ON file_records;
DROP POLICY IF EXISTS "file_records_anon_delete" ON file_records;

CREATE POLICY "file_records_auth_insert" ON file_records
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "file_records_auth_update" ON file_records
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "file_records_auth_delete" ON file_records
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── file_activity_log ─────────────────────────────────────
DROP POLICY IF EXISTS "file_activity_anon_insert" ON file_activity_log;

CREATE POLICY "file_activity_auth_insert" ON file_activity_log
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── file_permissions ──────────────────────────────────────
DROP POLICY IF EXISTS "file_perms_anon_insert" ON file_permissions;
DROP POLICY IF EXISTS "file_perms_anon_update" ON file_permissions;
DROP POLICY IF EXISTS "file_perms_anon_delete" ON file_permissions;

CREATE POLICY "file_perms_auth_insert" ON file_permissions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "file_perms_auth_update" ON file_permissions
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "file_perms_auth_delete" ON file_permissions
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── file_shares ───────────────────────────────────────────
DROP POLICY IF EXISTS "file_shares_anon_insert" ON file_shares;
DROP POLICY IF EXISTS "file_shares_anon_update" ON file_shares;
DROP POLICY IF EXISTS "file_shares_anon_delete" ON file_shares;

CREATE POLICY "file_shares_auth_insert" ON file_shares
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "file_shares_auth_update" ON file_shares
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "file_shares_auth_delete" ON file_shares
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── folders ───────────────────────────────────────────────
DROP POLICY IF EXISTS "folders_anon_insert" ON folders;
DROP POLICY IF EXISTS "folders_anon_update" ON folders;
DROP POLICY IF EXISTS "folders_anon_delete" ON folders;

CREATE POLICY "folders_auth_insert" ON folders
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "folders_auth_update" ON folders
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "folders_auth_delete" ON folders
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── storage_quotas ────────────────────────────────────────
DROP POLICY IF EXISTS "quotas_anon_insert" ON storage_quotas;
DROP POLICY IF EXISTS "quotas_anon_update" ON storage_quotas;

CREATE POLICY "quotas_auth_insert" ON storage_quotas
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "quotas_auth_update" ON storage_quotas
    FOR UPDATE USING (auth.uid() IS NOT NULL);


-- ════════════════════════════════════════════════════════════
-- 4. TIGHTEN AUDIT LOG INSERT POLICY
-- Require authentication — the fn_audit_log() trigger runs
-- as SECURITY DEFINER so it always has access.
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "audit_insert" ON audit_logs;
CREATE POLICY "audit_insert" ON audit_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- ════════════════════════════════════════════════════════════
-- NOTE ON INTENTIONALLY PERMISSIVE POLICIES (not changed):
--
-- The following INSERT policies use WITH CHECK (TRUE) by design
-- because they power anonymous public-facing forms:
--
--   contact_submissions.contact_insert_anon  — Contact Us form
--   newsletter_subscribers.newsletter_insert_anon — Newsletter signup
--   website_analytics.analytics_insert_anon  — Page view tracking
--   leads.leads_insert — Lead capture from website/referrals
--
-- These are safe because:
--   - Only INSERT is allowed (no UPDATE/DELETE for anon)
--   - The tables have no sensitive read access for anon
--   - Rate limiting should be enforced at the edge (Netlify/CDN)
-- ════════════════════════════════════════════════════════════
