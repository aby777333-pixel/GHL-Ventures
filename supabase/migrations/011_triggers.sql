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
