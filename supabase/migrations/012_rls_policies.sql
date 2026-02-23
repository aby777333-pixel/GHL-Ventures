-- ============================================================
-- 012 · ROW-LEVEL SECURITY POLICIES
-- ============================================================

-- ── Helper Functions ──
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT COALESCE(
        (SELECT role FROM profiles WHERE id = auth.uid()),
        'viewer'::user_role
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS BOOLEAN AS $$
    SELECT get_user_role() IN ('super_admin', 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT get_user_role() = 'super_admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_client_id()
RETURNS UUID AS $$
    SELECT id FROM clients WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_staff_id()
RETURNS UUID AS $$
    SELECT id FROM staff_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Enable RLS on all tables ──
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════
-- PROFILES
-- ════════════════════════════════════════════════════════════
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid() OR is_admin_or_above());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid() OR is_admin_or_above());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING (is_super_admin());

-- ════════════════════════════════════════════════════════════
-- ROLES (admin read, super_admin write)
-- ════════════════════════════════════════════════════════════
CREATE POLICY "roles_select" ON roles FOR SELECT USING (is_admin_or_above());
CREATE POLICY "roles_manage" ON roles FOR ALL USING (is_super_admin());

-- ════════════════════════════════════════════════════════════
-- AUDIT LOGS (admin read-only)
-- ════════════════════════════════════════════════════════════
CREATE POLICY "audit_select" ON audit_logs FOR SELECT USING (is_admin_or_above());
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (TRUE);

-- ════════════════════════════════════════════════════════════
-- STAFF PROFILES
-- ════════════════════════════════════════════════════════════
CREATE POLICY "staff_select" ON staff_profiles FOR SELECT USING (user_id = auth.uid() OR is_admin_or_above());
CREATE POLICY "staff_manage" ON staff_profiles FOR ALL USING (is_admin_or_above());

-- ════════════════════════════════════════════════════════════
-- CLIENTS
-- ════════════════════════════════════════════════════════════
CREATE POLICY "clients_select_own" ON clients FOR SELECT USING (
    user_id = auth.uid()
    OR is_admin_or_above()
    OR assigned_rm = get_my_staff_id()
    OR id IN (SELECT client_id FROM client_assignments WHERE staff_id = get_my_staff_id())
);
CREATE POLICY "clients_manage_admin" ON clients FOR ALL USING (is_admin_or_above());

-- ════════════════════════════════════════════════════════════
-- CLIENT ASSIGNMENTS
-- ════════════════════════════════════════════════════════════
CREATE POLICY "assignments_select" ON client_assignments FOR SELECT USING (
    staff_id = get_my_staff_id() OR is_admin_or_above()
);
CREATE POLICY "assignments_manage" ON client_assignments FOR ALL USING (is_admin_or_above());

-- ════════════════════════════════════════════════════════════
-- REVENUE
-- ════════════════════════════════════════════════════════════
CREATE POLICY "revenue_select" ON revenue_streams FOR SELECT USING (
    is_admin_or_above()
    OR client_id IN (SELECT client_id FROM client_assignments WHERE staff_id = get_my_staff_id())
    OR client_id = get_my_client_id()
);
CREATE POLICY "revenue_manage" ON revenue_streams FOR ALL USING (is_admin_or_above());

-- ════════════════════════════════════════════════════════════
-- SUBSCRIPTIONS
-- ════════════════════════════════════════════════════════════
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (
    client_id = get_my_client_id() OR is_admin_or_above()
);
CREATE POLICY "subscriptions_manage" ON subscriptions FOR ALL USING (is_admin_or_above());

-- ════════════════════════════════════════════════════════════
-- EXPENSES & PAYROLL
-- ════════════════════════════════════════════════════════════
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (is_admin_or_above() OR created_by = auth.uid());
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (get_user_role() IN ('super_admin','admin','staff'));
CREATE POLICY "expenses_manage" ON expenses FOR UPDATE USING (is_admin_or_above());
CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (is_super_admin());

CREATE POLICY "payroll_select" ON payroll FOR SELECT USING (
    is_admin_or_above() OR staff_id = get_my_staff_id()
);
CREATE POLICY "payroll_manage" ON payroll FOR ALL USING (is_admin_or_above());

-- ════════════════════════════════════════════════════════════
-- CAMPAIGNS & LEADS
-- ════════════════════════════════════════════════════════════
CREATE POLICY "campaigns_select" ON campaigns FOR SELECT USING (get_user_role() IN ('super_admin','admin','staff'));
CREATE POLICY "campaigns_manage" ON campaigns FOR ALL USING (is_admin_or_above());

CREATE POLICY "leads_select" ON leads FOR SELECT USING (
    is_admin_or_above() OR assigned_to = get_my_staff_id()
);
CREATE POLICY "leads_insert" ON leads FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "leads_update" ON leads FOR UPDATE USING (
    is_admin_or_above() OR assigned_to = get_my_staff_id()
);
CREATE POLICY "leads_delete" ON leads FOR DELETE USING (is_admin_or_above());

CREATE POLICY "lead_activities_select" ON lead_activities FOR SELECT USING (
    is_admin_or_above()
    OR lead_id IN (SELECT id FROM leads WHERE assigned_to = get_my_staff_id())
);
CREATE POLICY "lead_activities_insert" ON lead_activities FOR INSERT WITH CHECK (
    get_user_role() IN ('super_admin','admin','staff')
);

-- ════════════════════════════════════════════════════════════
-- REPORTS & INTELLIGENCE
-- ════════════════════════════════════════════════════════════
CREATE POLICY "report_templates_select" ON report_templates FOR SELECT USING (get_user_role() IN ('super_admin','admin','staff'));
CREATE POLICY "report_templates_manage" ON report_templates FOR ALL USING (is_admin_or_above());

CREATE POLICY "reports_select" ON reports FOR SELECT USING (
    is_admin_or_above() OR generated_by = auth.uid()
);
CREATE POLICY "reports_manage" ON reports FOR ALL USING (get_user_role() IN ('super_admin','admin','staff'));

CREATE POLICY "report_exports_select" ON report_exports FOR SELECT USING (
    is_admin_or_above() OR exported_by = auth.uid()
);
CREATE POLICY "report_exports_insert" ON report_exports FOR INSERT WITH CHECK (
    get_user_role() IN ('super_admin','admin','staff')
);

CREATE POLICY "kpis_select" ON kpis FOR SELECT USING (get_user_role() IN ('super_admin','admin','staff'));
CREATE POLICY "kpis_manage" ON kpis FOR ALL USING (is_admin_or_above());

CREATE POLICY "ai_insights_select" ON ai_insights FOR SELECT USING (get_user_role() IN ('super_admin','admin','staff'));
CREATE POLICY "ai_insights_manage" ON ai_insights FOR ALL USING (is_admin_or_above());

CREATE POLICY "forecasts_select" ON forecasts FOR SELECT USING (get_user_role() IN ('super_admin','admin','staff'));
CREATE POLICY "forecasts_manage" ON forecasts FOR ALL USING (is_admin_or_above());

-- ════════════════════════════════════════════════════════════
-- COMMUNICATION
-- ════════════════════════════════════════════════════════════
CREATE POLICY "emails_select" ON emails FOR SELECT USING (is_admin_or_above() OR sent_by = auth.uid());
CREATE POLICY "emails_manage" ON emails FOR ALL USING (get_user_role() IN ('super_admin','admin','staff'));

CREATE POLICY "calls_select" ON calls FOR SELECT USING (is_admin_or_above() OR caller_id = auth.uid());
CREATE POLICY "calls_manage" ON calls FOR ALL USING (get_user_role() IN ('super_admin','admin','staff'));

CREATE POLICY "sms_select" ON sms_messages FOR SELECT USING (is_admin_or_above() OR sent_by = auth.uid());
CREATE POLICY "sms_manage" ON sms_messages FOR ALL USING (is_admin_or_above());

CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (get_user_role() IN ('super_admin','admin','staff'));

-- ════════════════════════════════════════════════════════════
-- DOCUMENTS
-- ════════════════════════════════════════════════════════════
CREATE POLICY "documents_select" ON documents FOR SELECT USING (
    access_level = 'public'
    OR is_admin_or_above()
    OR uploaded_by = auth.uid()
    OR (access_level = 'internal' AND get_user_role() IN ('super_admin','admin','staff'))
);
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (
    get_user_role() IN ('super_admin','admin','staff')
);
CREATE POLICY "documents_manage" ON documents FOR UPDATE USING (is_admin_or_above() OR uploaded_by = auth.uid());
CREATE POLICY "documents_delete" ON documents FOR DELETE USING (is_admin_or_above());

-- ════════════════════════════════════════════════════════════
-- WEBSITE / PUBLIC FORMS (anonymous inserts allowed)
-- ════════════════════════════════════════════════════════════
CREATE POLICY "contact_insert_anon" ON contact_submissions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "contact_select_admin" ON contact_submissions FOR SELECT USING (is_admin_or_above());
CREATE POLICY "contact_manage_admin" ON contact_submissions FOR UPDATE USING (is_admin_or_above());

CREATE POLICY "newsletter_insert_anon" ON newsletter_subscribers FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "newsletter_select_admin" ON newsletter_subscribers FOR SELECT USING (is_admin_or_above());
CREATE POLICY "newsletter_manage_admin" ON newsletter_subscribers FOR UPDATE USING (is_admin_or_above());

CREATE POLICY "analytics_insert_anon" ON website_analytics FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "analytics_select_admin" ON website_analytics FOR SELECT USING (is_admin_or_above());

CREATE POLICY "sync_logs_select" ON marketing_sync_logs FOR SELECT USING (is_admin_or_above());
CREATE POLICY "sync_logs_manage" ON marketing_sync_logs FOR ALL USING (is_admin_or_above());

-- ════════════════════════════════════════════════════════════
-- API TOKENS (user own only)
-- ════════════════════════════════════════════════════════════
CREATE POLICY "api_tokens_select_own" ON api_tokens FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "api_tokens_insert_own" ON api_tokens FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "api_tokens_update_own" ON api_tokens FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "api_tokens_delete_own" ON api_tokens FOR DELETE USING (user_id = auth.uid());
