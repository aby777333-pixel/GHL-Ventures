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
