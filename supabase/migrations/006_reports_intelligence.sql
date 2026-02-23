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
