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
