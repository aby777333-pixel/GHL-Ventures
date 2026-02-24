-- ============================================================
-- 001 · CORE IDENTITY — roles, profiles, audit
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom ENUM types
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'staff', 'client', 'viewer');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
CREATE TYPE lead_source AS ENUM ('website', 'referral', 'social_media', 'cold_call', 'event', 'partner', 'other');
CREATE TYPE expense_status AS ENUM ('pending', 'approved', 'rejected', 'paid');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');
CREATE TYPE report_status AS ENUM ('draft', 'scheduled', 'generating', 'completed', 'failed');

-- ── Roles Lookup Table ──
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Profiles (extends auth.users) ──
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'viewer',
    role_id UUID REFERENCES roles(id),
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    city TEXT,
    department TEXT,
    job_title TEXT,
    bio TEXT,
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Audit Logs ──
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ================================================================
-- END OF 001_core_identity.sql | START OF 002_client_staff.sql
-- ================================================================

-- ============================================================
-- 002 · CLIENT & STAFF TABLES
-- ============================================================

-- ── Staff Profiles ──
CREATE TABLE staff_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE,
    department TEXT NOT NULL,
    designation TEXT,
    date_of_joining DATE,
    reporting_to UUID REFERENCES staff_profiles(id),
    skills TEXT[],
    certifications TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Clients ──
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    client_code TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    pan TEXT,
    aadhar_encrypted TEXT,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending','submitted','verified','rejected')),
    investor_type TEXT DEFAULT 'individual' CHECK (investor_type IN ('individual','huf','corporate','trust','nri')),
    risk_profile TEXT DEFAULT 'moderate' CHECK (risk_profile IN ('conservative','moderate','aggressive')),
    total_invested NUMERIC(15,2) DEFAULT 0,
    lifetime_value NUMERIC(15,2) DEFAULT 0,
    acquisition_source TEXT,
    assigned_rm UUID REFERENCES staff_profiles(id),
    tags TEXT[],
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Client Assignments (many-to-many) ──
CREATE TABLE client_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'relationship_manager',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, staff_id)
);

-- Indexes
CREATE INDEX idx_staff_department ON staff_profiles(department);
CREATE INDEX idx_staff_user ON staff_profiles(user_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_city ON clients(city);
CREATE INDEX idx_clients_rm ON clients(assigned_rm);
CREATE INDEX idx_clients_kyc ON clients(kyc_status);
CREATE INDEX idx_client_assignments_client ON client_assignments(client_id);
CREATE INDEX idx_client_assignments_staff ON client_assignments(staff_id);

-- ================================================================
-- END OF 002_client_staff.sql | START OF 003_revenue_subscriptions.sql
-- ================================================================

-- ============================================================
-- 003 · REVENUE & SUBSCRIPTIONS
-- ============================================================

-- ── Revenue Streams ──
CREATE TABLE revenue_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('management_fee','performance_fee','advisory','subscription','other')),
    client_id UUID REFERENCES clients(id),
    amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    frequency TEXT DEFAULT 'one_time' CHECK (frequency IN ('one_time','monthly','quarterly','annually')),
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','completed')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Subscriptions ──
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','quarterly','annually')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','expired')),
    start_date DATE NOT NULL,
    next_billing_date DATE,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_revenue_type ON revenue_streams(type);
CREATE INDEX idx_revenue_client ON revenue_streams(client_id);
CREATE INDEX idx_revenue_status ON revenue_streams(status);
CREATE INDEX idx_revenue_created ON revenue_streams(created_at DESC);
CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_billing ON subscriptions(next_billing_date);

-- ================================================================
-- END OF 003_revenue_subscriptions.sql | START OF 004_expenses_payroll.sql
-- ================================================================

-- ============================================================
-- 004 · EXPENSES & PAYROLL
-- ============================================================

-- ── Expenses ──
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    subcategory TEXT,
    description TEXT,
    amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    date DATE NOT NULL,
    vendor TEXT,
    invoice_number TEXT,
    receipt_url TEXT,
    status expense_status DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    department TEXT,
    budget_code TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Payroll ──
CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    basic_salary NUMERIC(12,2) NOT NULL,
    hra NUMERIC(12,2) DEFAULT 0,
    special_allowance NUMERIC(12,2) DEFAULT 0,
    bonus NUMERIC(12,2) DEFAULT 0,
    deductions JSONB DEFAULT '{}',
    gross_salary NUMERIC(12,2),
    net_salary NUMERIC(12,2),
    tax_deducted NUMERIC(12,2) DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','processed','paid','cancelled')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, month)
);

-- Indexes
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_department ON expenses(department);
CREATE INDEX idx_payroll_staff ON payroll(staff_id);
CREATE INDEX idx_payroll_month ON payroll(month DESC);
CREATE INDEX idx_payroll_status ON payroll(status);

-- ================================================================
-- END OF 004_expenses_payroll.sql | START OF 005_marketing_campaigns.sql
-- ================================================================

-- ============================================================
-- 005 · MARKETING CAMPAIGNS & LEADS
-- ============================================================

-- ── Campaigns ──
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email','social','search','display','event','content','referral','other')),
    status campaign_status DEFAULT 'draft',
    budget NUMERIC(12,2) DEFAULT 0,
    spent NUMERIC(12,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    target_audience TEXT,
    channels TEXT[],
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    revenue_attributed NUMERIC(15,2) DEFAULT 0,
    roi NUMERIC(8,2),
    cpc NUMERIC(8,2),
    cpl NUMERIC(8,2),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Leads ──
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    city TEXT,
    state TEXT,
    source lead_source DEFAULT 'website',
    status lead_status DEFAULT 'new',
    campaign_id UUID REFERENCES campaigns(id),
    assigned_to UUID REFERENCES staff_profiles(id),
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    investment_interest TEXT,
    estimated_value NUMERIC(15,2),
    converted_client_id UUID REFERENCES clients(id),
    converted_at TIMESTAMPTZ,
    last_contacted TIMESTAMPTZ,
    next_follow_up TIMESTAMPTZ,
    tags TEXT[],
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Lead Activities ──
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('call','email','meeting','note','status_change','score_change')),
    description TEXT,
    performed_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_campaign ON leads(campaign_id);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_type ON lead_activities(type);

-- ================================================================
-- END OF 005_marketing_campaigns.sql | START OF 006_reports_intelligence.sql
-- ================================================================

-- ============================================================
-- 006 · REPORTS & INTELLIGENCE
-- ============================================================

-- ── Report Templates ──
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('financial','marketing','investor','operational','compliance','custom')),
    config JSONB NOT NULL DEFAULT '{}',
    schedule TEXT CHECK (schedule IN ('daily','weekly','monthly','quarterly','on_demand')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Generated Reports ──
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES report_templates(id),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    status report_status DEFAULT 'draft',
    data JSONB,
    summary TEXT,
    generated_by UUID REFERENCES auth.users(id),
    file_url TEXT,
    file_size INTEGER,
    parameters JSONB DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Report Exports ──
CREATE TABLE report_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    format TEXT NOT NULL CHECK (format IN ('pdf','xlsx','csv','json')),
    file_url TEXT,
    file_size INTEGER,
    exported_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── KPI Snapshots ──
CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC(15,2) NOT NULL,
    metric_unit TEXT DEFAULT 'INR',
    period TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    comparison_value NUMERIC(15,2),
    comparison_period TEXT,
    change_percentage NUMERIC(8,2),
    category TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI Insights ──
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('trend','anomaly','recommendation','prediction','alert')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info','low','medium','high','critical')),
    category TEXT,
    data_source TEXT,
    confidence NUMERIC(5,2),
    is_actionable BOOLEAN DEFAULT FALSE,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Forecasts ──
CREATE TABLE forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    forecast_date DATE NOT NULL,
    predicted_value NUMERIC(15,2) NOT NULL,
    lower_bound NUMERIC(15,2),
    upper_bound NUMERIC(15,2),
    confidence NUMERIC(5,2),
    model_used TEXT,
    actual_value NUMERIC(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reports_template ON reports(template_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_created ON reports(created_at DESC);
CREATE INDEX idx_kpis_metric ON kpis(metric_name);
CREATE INDEX idx_kpis_period ON kpis(period_start, period_end);
CREATE INDEX idx_kpis_category ON kpis(category);
CREATE INDEX idx_ai_insights_type ON ai_insights(type);
CREATE INDEX idx_ai_insights_severity ON ai_insights(severity);
CREATE INDEX idx_ai_insights_created ON ai_insights(created_at DESC);
CREATE INDEX idx_forecasts_metric ON forecasts(metric_name);
CREATE INDEX idx_forecasts_date ON forecasts(forecast_date);

-- ================================================================
-- END OF 006_reports_intelligence.sql | START OF 007_communication.sql
-- ================================================================

-- ============================================================
-- 007 · COMMUNICATION — emails, calls, SMS, notifications
-- ============================================================

-- ── Emails ──
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_address TEXT NOT NULL,
    to_addresses TEXT[] NOT NULL,
    cc_addresses TEXT[],
    bcc_addresses TEXT[],
    subject TEXT NOT NULL,
    body TEXT,
    html_body TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','queued','sent','delivered','failed','bounced')),
    template_id TEXT,
    related_entity_type TEXT,
    related_entity_id UUID,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    sent_by UUID REFERENCES auth.users(id),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Call Logs ──
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID REFERENCES auth.users(id),
    contact_name TEXT,
    contact_phone TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
    duration_seconds INTEGER DEFAULT 0,
    outcome TEXT CHECK (outcome IN ('connected','no_answer','voicemail','busy','wrong_number','callback_requested')),
    notes TEXT,
    recording_url TEXT,
    related_entity_type TEXT,
    related_entity_id UUID,
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SMS Messages ──
CREATE TABLE sms_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_phone TEXT NOT NULL,
    from_phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','failed')),
    sent_by UUID REFERENCES auth.users(id),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    cost NUMERIC(8,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notifications ──
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('info','success','warning','error','action_required')),
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_emails_status ON emails(status);
CREATE INDEX idx_emails_sent_by ON emails(sent_by);
CREATE INDEX idx_emails_sent_at ON emails(sent_at DESC);
CREATE INDEX idx_emails_related ON emails(related_entity_type, related_entity_id);
CREATE INDEX idx_calls_caller ON calls(caller_id);
CREATE INDEX idx_calls_direction ON calls(direction);
CREATE INDEX idx_calls_started ON calls(started_at DESC);
CREATE INDEX idx_sms_status ON sms_messages(status);
CREATE INDEX idx_sms_sent_at ON sms_messages(sent_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ================================================================
-- END OF 007_communication.sql | START OF 008_documents.sql
-- ================================================================

-- ============================================================
-- 008 · DOCUMENTS (polymorphic)
-- ============================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    mime_type TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('kyc','agreement','report','invoice','compliance','marketing','general')),
    entity_type TEXT,
    entity_id UUID,
    tags TEXT[],
    version INTEGER DEFAULT 1,
    is_template BOOLEAN DEFAULT FALSE,
    is_confidential BOOLEAN DEFAULT FALSE,
    access_level TEXT DEFAULT 'internal' CHECK (access_level IN ('public','internal','restricted','confidential')),
    uploaded_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_access ON documents(access_level);
CREATE INDEX idx_documents_created ON documents(created_at DESC);

-- ================================================================
-- END OF 008_documents.sql | START OF 009_website_forms.sql
-- ================================================================

-- ============================================================
-- 009 · WEBSITE FORMS & ANALYTICS
-- ============================================================

-- ── Contact Form Submissions ──
CREATE TABLE contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_type TEXT NOT NULL DEFAULT 'general' CHECK (form_type IN ('general','invest','refer_investor','startup_apply','grievance','career_application','newsletter','callback')),
    full_name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    city TEXT,
    subject TEXT,
    message TEXT,
    page_url TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    ip_address INET,
    user_agent TEXT,
    is_spam BOOLEAN DEFAULT FALSE,
    is_processed BOOLEAN DEFAULT FALSE,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Newsletter Subscribers ──
CREATE TABLE newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    source TEXT DEFAULT 'website',
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Website Analytics ──
CREATE TABLE website_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_url TEXT NOT NULL,
    page_title TEXT,
    visitor_id TEXT,
    session_id TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    device_type TEXT,
    browser TEXT,
    country TEXT,
    city TEXT,
    time_on_page INTEGER,
    scroll_depth INTEGER,
    events JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Marketing Sync Logs ──
CREATE TABLE marketing_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT NOT NULL,
    sync_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── API Tokens (for storing API keys like Claude) ──
CREATE TABLE api_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    token_encrypted TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, service_name)
);

-- Indexes
CREATE INDEX idx_contact_submissions_type ON contact_submissions(form_type);
CREATE INDEX idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX idx_contact_submissions_processed ON contact_submissions(is_processed);
CREATE INDEX idx_contact_submissions_created ON contact_submissions(created_at DESC);
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(is_active);
CREATE INDEX idx_analytics_page ON website_analytics(page_url);
CREATE INDEX idx_analytics_visitor ON website_analytics(visitor_id);
CREATE INDEX idx_analytics_created ON website_analytics(created_at DESC);
CREATE INDEX idx_api_tokens_user ON api_tokens(user_id);
CREATE INDEX idx_api_tokens_service ON api_tokens(service_name);

-- ================================================================
-- END OF 009_website_forms.sql | START OF 010_materialized_views.sql
-- ================================================================

-- ============================================================
-- 010 · MATERIALIZED VIEWS for Dashboard Performance
-- ============================================================

-- ── Dashboard KPI Summary ──
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_kpis AS
SELECT
    COUNT(DISTINCT c.id) AS total_clients,
    COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= DATE_TRUNC('month', NOW())) AS new_clients_this_month,
    COALESCE(SUM(c.total_invested), 0) AS total_aum,
    COALESCE(SUM(r.amount) FILTER (WHERE r.status = 'active'), 0) AS active_revenue,
    COALESCE(SUM(e.amount) FILTER (WHERE e.date >= DATE_TRUNC('month', NOW())), 0) AS monthly_expenses,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'new') AS new_leads,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'won') AS converted_leads,
    COUNT(DISTINCT sp.id) FILTER (WHERE sp.is_active = TRUE) AS active_staff
FROM clients c
LEFT JOIN revenue_streams r ON r.client_id = c.id
LEFT JOIN expenses e ON TRUE
LEFT JOIN leads l ON TRUE
LEFT JOIN staff_profiles sp ON TRUE;

-- ── Monthly Revenue Trend ──
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_revenue AS
SELECT
    DATE_TRUNC('month', rs.created_at) AS month,
    rs.type,
    SUM(rs.amount) AS total_amount,
    COUNT(*) AS transaction_count
FROM revenue_streams rs
WHERE rs.status = 'active'
GROUP BY DATE_TRUNC('month', rs.created_at), rs.type
ORDER BY month DESC;

-- ── Lead Funnel Summary ──
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_lead_funnel AS
SELECT
    l.status,
    l.source,
    COUNT(*) AS count,
    COALESCE(AVG(l.score), 0) AS avg_score,
    COALESCE(SUM(l.estimated_value), 0) AS total_pipeline_value
FROM leads l
GROUP BY l.status, l.source;

-- ── Campaign Performance ──
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_campaign_performance AS
SELECT
    c.id,
    c.name,
    c.type,
    c.status,
    c.budget,
    c.spent,
    c.impressions,
    c.clicks,
    c.conversions,
    c.leads_generated,
    c.revenue_attributed,
    CASE WHEN c.spent > 0 THEN ROUND((c.revenue_attributed - c.spent) / c.spent * 100, 2) ELSE 0 END AS roi_pct,
    CASE WHEN c.clicks > 0 THEN ROUND(c.spent / c.clicks, 2) ELSE 0 END AS cpc,
    CASE WHEN c.leads_generated > 0 THEN ROUND(c.spent / c.leads_generated, 2) ELSE 0 END AS cpl,
    CASE WHEN c.impressions > 0 THEN ROUND(c.clicks::NUMERIC / c.impressions * 100, 2) ELSE 0 END AS ctr
FROM campaigns c;

-- ── Expense Breakdown ──
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_expense_breakdown AS
SELECT
    e.category,
    e.department,
    DATE_TRUNC('month', e.date) AS month,
    SUM(e.amount) AS total_amount,
    COUNT(*) AS expense_count,
    AVG(e.amount) AS avg_amount
FROM expenses e
WHERE e.status IN ('approved', 'paid')
GROUP BY e.category, e.department, DATE_TRUNC('month', e.date);

-- ── Client Insights ──
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_client_insights AS
SELECT
    c.id AS client_id,
    c.full_name,
    c.city,
    c.investor_type,
    c.risk_profile,
    c.total_invested,
    c.lifetime_value,
    c.kyc_status,
    c.acquisition_source,
    COUNT(DISTINCT rs.id) AS revenue_stream_count,
    COALESCE(SUM(rs.amount), 0) AS total_revenue,
    COUNT(DISTINCT d.id) AS document_count,
    MAX(rs.created_at) AS last_transaction_at
FROM clients c
LEFT JOIN revenue_streams rs ON rs.client_id = c.id
LEFT JOIN documents d ON d.entity_type = 'client' AND d.entity_id = c.id
WHERE c.is_active = TRUE
GROUP BY c.id, c.full_name, c.city, c.investor_type, c.risk_profile,
         c.total_invested, c.lifetime_value, c.kyc_status, c.acquisition_source;

-- ── Refresh Function ──
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_kpis;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_revenue;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_lead_funnel;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_campaign_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_expense_breakdown;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_client_insights;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unique indexes for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS mv_monthly_revenue_idx ON mv_monthly_revenue(month, type);
CREATE UNIQUE INDEX IF NOT EXISTS mv_lead_funnel_idx ON mv_lead_funnel(status, source);
CREATE UNIQUE INDEX IF NOT EXISTS mv_campaign_performance_idx ON mv_campaign_performance(id);
CREATE UNIQUE INDEX IF NOT EXISTS mv_expense_breakdown_idx ON mv_expense_breakdown(category, department, month);
CREATE UNIQUE INDEX IF NOT EXISTS mv_client_insights_idx ON mv_client_insights(client_id);

-- ================================================================
-- END OF 010_materialized_views.sql | START OF 011_triggers.sql
-- ================================================================

-- ============================================================
-- 011 · BUSINESS LOGIC TRIGGERS
-- ============================================================

-- ── 1. Auto-calculate Client LTV on revenue change ──
CREATE OR REPLACE FUNCTION fn_update_client_ltv()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE clients
    SET lifetime_value = (
        SELECT COALESCE(SUM(amount), 0) FROM revenue_streams
        WHERE client_id = COALESCE(NEW.client_id, OLD.client_id) AND status = 'active'
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.client_id, OLD.client_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_client_ltv
AFTER INSERT OR UPDATE OR DELETE ON revenue_streams
FOR EACH ROW EXECUTE FUNCTION fn_update_client_ltv();

-- ── 2. Lead conversion — create client on status='won' ──
CREATE OR REPLACE FUNCTION fn_lead_conversion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'won' AND OLD.status != 'won' AND NEW.converted_client_id IS NULL THEN
        INSERT INTO clients (full_name, email, phone, city, acquisition_source)
        VALUES (
            TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')),
            NEW.email,
            NEW.phone,
            NEW.city,
            NEW.source::TEXT
        )
        RETURNING id INTO NEW.converted_client_id;
        NEW.converted_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lead_conversion
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION fn_lead_conversion();

-- ── 3. Auto-create profile on user signup ──
CREATE OR REPLACE FUNCTION fn_auto_create_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, role, full_name)
    VALUES (
        NEW.id,
        'viewer',
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_create_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION fn_auto_create_profile();

-- ── 4. Auto-calculate payroll totals ──
CREATE OR REPLACE FUNCTION fn_calculate_payroll()
RETURNS TRIGGER AS $$
BEGIN
    NEW.gross_salary = COALESCE(NEW.basic_salary, 0)
                     + COALESCE(NEW.hra, 0)
                     + COALESCE(NEW.special_allowance, 0)
                     + COALESCE(NEW.bonus, 0);

    NEW.net_salary = NEW.gross_salary
                   - COALESCE(NEW.tax_deducted, 0)
                   - COALESCE((NEW.deductions->>'pf')::NUMERIC, 0)
                   - COALESCE((NEW.deductions->>'esi')::NUMERIC, 0)
                   - COALESCE((NEW.deductions->>'other')::NUMERIC, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_payroll
BEFORE INSERT OR UPDATE ON payroll
FOR EACH ROW EXECUTE FUNCTION fn_calculate_payroll();

-- ── 5. Audit log trigger (generic) ──
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit logging to critical tables
CREATE TRIGGER trg_audit_clients AFTER INSERT OR UPDATE OR DELETE ON clients FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_audit_revenue AFTER INSERT OR UPDATE OR DELETE ON revenue_streams FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_audit_expenses AFTER INSERT OR UPDATE OR DELETE ON expenses FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_audit_leads AFTER INSERT OR UPDATE OR DELETE ON leads FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ── 6. Lead scoring trigger ──
CREATE OR REPLACE FUNCTION fn_lead_scoring()
RETURNS TRIGGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Base score by source
    CASE NEW.source
        WHEN 'referral' THEN score := 30;
        WHEN 'website' THEN score := 20;
        WHEN 'event' THEN score := 25;
        WHEN 'partner' THEN score := 28;
        ELSE score := 10;
    END CASE;

    -- Boost for email
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN score := score + 10; END IF;
    -- Boost for phone
    IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN score := score + 10; END IF;
    -- Boost for investment interest
    IF NEW.investment_interest IS NOT NULL THEN score := score + 15; END IF;
    -- Boost for estimated value
    IF NEW.estimated_value IS NOT NULL AND NEW.estimated_value > 0 THEN
        IF NEW.estimated_value >= 10000000 THEN score := score + 25;
        ELSIF NEW.estimated_value >= 5000000 THEN score := score + 20;
        ELSIF NEW.estimated_value >= 1000000 THEN score := score + 15;
        ELSE score := score + 5;
        END IF;
    END IF;

    -- Cap at 100
    NEW.score = LEAST(score, 100);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lead_scoring
BEFORE INSERT OR UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION fn_lead_scoring();

-- ── Updated_at trigger function ──
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_updated_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_updated_staff BEFORE UPDATE ON staff_profiles FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_updated_clients BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_updated_revenue BEFORE UPDATE ON revenue_streams FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_updated_subscriptions BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_updated_expenses BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_updated_payroll BEFORE UPDATE ON payroll FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_updated_campaigns BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_updated_leads BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_updated_documents BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_updated_report_templates BEFORE UPDATE ON report_templates FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_updated_api_tokens BEFORE UPDATE ON api_tokens FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ================================================================
-- END OF 011_triggers.sql | START OF 012_rls_policies.sql
-- ================================================================

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

-- ================================================================
-- END OF 012_rls_policies.sql | START OF 013_storage_buckets.sql
-- ================================================================

-- ============================================================
-- 013 · STORAGE BUCKETS & POLICIES
-- ============================================================

-- ── Create Buckets ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
    ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
    ('documents', 'documents', FALSE, 52428800, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv','image/jpeg','image/png']),
    ('reports', 'reports', FALSE, 52428800, ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv','application/json']),
    ('kyc-documents', 'kyc-documents', FALSE, 10485760, ARRAY['application/pdf','image/jpeg','image/png']),
    ('marketing-assets', 'marketing-assets', TRUE, 20971520, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','video/mp4','application/pdf']),
    ('resumes', 'resumes', FALSE, 5242880, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS Policies ──

-- Avatars: public read, authenticated upload own
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_auth_upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
);
CREATE POLICY "avatars_owner_update" ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Documents: admin full access, staff read, clients own folder
CREATE POLICY "documents_admin_all" ON storage.objects FOR ALL USING (
    bucket_id = 'documents' AND is_admin_or_above()
);
CREATE POLICY "documents_staff_read" ON storage.objects FOR SELECT USING (
    bucket_id = 'documents' AND get_user_role() = 'staff'
);
CREATE POLICY "documents_client_own" ON storage.objects FOR SELECT USING (
    bucket_id = 'documents' AND (storage.foldername(name))[1] = 'clients' AND (storage.foldername(name))[2] = get_my_client_id()::TEXT
);

-- Reports: admin & staff access
CREATE POLICY "reports_staff_access" ON storage.objects FOR ALL USING (
    bucket_id = 'reports' AND get_user_role() IN ('super_admin','admin','staff')
);

-- KYC: admin only
CREATE POLICY "kyc_admin_only" ON storage.objects FOR ALL USING (
    bucket_id = 'kyc-documents' AND is_admin_or_above()
);
CREATE POLICY "kyc_client_upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'kyc-documents' AND get_user_role() = 'client'
);

-- Marketing assets: public read, admin write
CREATE POLICY "marketing_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'marketing-assets');
CREATE POLICY "marketing_admin_write" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'marketing-assets' AND is_admin_or_above()
);

-- Resumes: anonymous upload, admin read
CREATE POLICY "resumes_anon_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes');
CREATE POLICY "resumes_admin_read" ON storage.objects FOR SELECT USING (
    bucket_id = 'resumes' AND is_admin_or_above()
);

-- ================================================================
-- END OF 013_storage_buckets.sql | START OF 014_seed_data.sql
-- ================================================================

-- ============================================================
-- 014 · SEED DATA — Roles & Report Templates
-- ============================================================

-- ── System Roles ──
INSERT INTO roles (name, description, permissions, is_system) VALUES
    ('Super Admin', 'Full system access. Can manage all users, data, and settings.', '{"all": true}', TRUE),
    ('Admin', 'Administrative access. Can manage clients, staff, reports, and operations.', '{"manage_clients": true, "manage_staff": true, "manage_reports": true, "manage_campaigns": true, "manage_expenses": true, "view_analytics": true}', TRUE),
    ('Staff', 'Staff-level access. Can view assigned clients, create reports, and log activities.', '{"view_clients": true, "create_reports": true, "log_activities": true, "view_campaigns": true}', TRUE),
    ('Client', 'Client portal access. Can view own investments, documents, and reports.', '{"view_own_data": true, "view_own_documents": true, "view_own_reports": true}', TRUE),
    ('Viewer', 'Read-only access. Can view public information and own profile.', '{"view_public": true}', TRUE)
ON CONFLICT (name) DO NOTHING;

-- ── Report Templates ──
INSERT INTO report_templates (name, description, type, config, schedule, is_active) VALUES
    ('Monthly Financial Summary', 'Comprehensive monthly financial overview including revenue, expenses, margins, and key metrics.', 'financial',
     '{"sections": ["revenue_summary","expense_breakdown","margin_analysis","cash_flow","budget_vs_actual"], "charts": ["monthly_trend","pie_breakdown"], "kpis": ["total_revenue","total_expenses","net_margin","operating_margin"]}',
     'monthly', TRUE),

    ('Investor Quarterly Report', 'Quarterly report for LP/investor communications with fund performance and portfolio updates.', 'investor',
     '{"sections": ["fund_performance","nav_update","portfolio_companies","exits_and_distributions","market_commentary"], "charts": ["nav_trend","allocation_pie","benchmark_comparison"], "compliance": true}',
     'quarterly', TRUE),

    ('Campaign Performance Report', 'Marketing campaign analysis with ROI, conversion rates, and channel attribution.', 'marketing',
     '{"sections": ["campaign_summary","channel_performance","lead_attribution","roi_analysis","budget_utilization"], "charts": ["funnel","channel_comparison","roi_trend"], "kpis": ["total_spend","total_leads","avg_cpl","overall_roi"]}',
     'monthly', TRUE),

    ('Lead Pipeline Report', 'Sales funnel analysis with lead status distribution, conversion rates, and pipeline value.', 'marketing',
     '{"sections": ["funnel_summary","stage_breakdown","source_analysis","conversion_rates","pipeline_value"], "charts": ["funnel_chart","source_pie","trend_line"]}',
     'weekly', TRUE),

    ('Client Portfolio Summary', 'Individual client investment summary with holdings, returns, and document status.', 'investor',
     '{"sections": ["investment_summary","holdings_detail","returns_analysis","document_status","transaction_history"], "per_client": true}',
     'on_demand', TRUE),

    ('Operational Dashboard', 'Daily operational metrics including team productivity, task completion, and SLA compliance.', 'operational',
     '{"sections": ["team_overview","task_metrics","sla_compliance","communication_stats","pending_actions"], "charts": ["productivity_trend","task_distribution"]}',
     'daily', TRUE),

    ('Compliance & Audit Report', 'Regulatory compliance status, KYC verification progress, and audit trail summary.', 'compliance',
     '{"sections": ["kyc_status","regulatory_filings","audit_trail","policy_compliance","risk_flags"], "regulatory": true}',
     'quarterly', TRUE),

    ('Revenue Forecast Report', 'AI-powered revenue forecasting with trend analysis, seasonality, and confidence intervals.', 'financial',
     '{"sections": ["forecast_summary","trend_analysis","seasonality","confidence_intervals","scenario_analysis"], "charts": ["forecast_line","confidence_band","scenario_comparison"], "ai_powered": true}',
     'monthly', TRUE)
ON CONFLICT DO NOTHING;
