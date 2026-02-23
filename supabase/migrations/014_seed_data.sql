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
