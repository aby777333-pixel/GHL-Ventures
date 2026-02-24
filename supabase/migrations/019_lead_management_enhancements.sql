-- ============================================================
-- 019 · LEAD MANAGEMENT ENHANCEMENTS
-- Lead folder mappings, source tracking, staff notifications,
-- extended lead columns, and auto-triggers for folder creation
-- and staff assignment notifications.
-- ============================================================

-- ── Lead Folder Mappings ─────────────────────────────────────
-- Links a lead to auto-created folders in Sales & Reports
CREATE TABLE IF NOT EXISTS lead_folder_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    folder_type TEXT NOT NULL CHECK (folder_type IN ('sales', 'reports', 'client')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lead_id, folder_type)
);

CREATE INDEX IF NOT EXISTS idx_lead_folder_lead ON lead_folder_mappings(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_folder_folder ON lead_folder_mappings(folder_id);

-- ── Lead Source Tracking ─────────────────────────────────────
-- Detailed attribution data for every lead
CREATE TABLE IF NOT EXISTS lead_source_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    referrer_url TEXT,
    landing_page_url TEXT,
    landing_page_title TEXT,
    form_id TEXT,
    form_name TEXT,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    geo_city TEXT,
    geo_state TEXT,
    geo_country TEXT DEFAULT 'India',
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    browser TEXT,
    ip_address TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_source_lead ON lead_source_tracking(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_source_campaign ON lead_source_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lead_source_utm ON lead_source_tracking(utm_source, utm_medium);
CREATE INDEX IF NOT EXISTS idx_lead_source_created ON lead_source_tracking(created_at DESC);

-- ── Staff Lead Notifications ─────────────────────────────────
-- Notifies staff when leads are assigned or updated
CREATE TABLE IF NOT EXISTS staff_lead_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'new_assignment', 'lead_update', 'follow_up_due',
        'lead_converted', 'document_uploaded', 'status_change'
    )),
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_notif_staff ON staff_lead_notifications(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_notif_lead ON staff_lead_notifications(lead_id);
CREATE INDEX IF NOT EXISTS idx_staff_notif_unread ON staff_lead_notifications(staff_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_staff_notif_created ON staff_lead_notifications(created_at DESC);

-- ── Extend leads table ───────────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_quality TEXT DEFAULT 'unknown'
    CHECK (lead_quality IN ('hot', 'warm', 'cold', 'unknown'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS total_touchpoints INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lifetime_value_estimate NUMERIC(15,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'phone'
    CHECK (preferred_contact_method IN ('phone', 'email', 'whatsapp', 'in-person'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS documents_folder_id UUID REFERENCES folders(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_leads_quality ON leads(lead_quality);
CREATE INDEX IF NOT EXISTS idx_leads_docs_folder ON leads(documents_folder_id);

-- ── RLS Policies ─────────────────────────────────────────────

-- lead_folder_mappings: admin full, staff read own leads
ALTER TABLE lead_folder_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_folder_admin_all" ON lead_folder_mappings
    FOR ALL USING (is_admin_or_above());
CREATE POLICY "lead_folder_staff_read" ON lead_folder_mappings
    FOR SELECT USING (
        get_user_role() = 'staff' AND
        lead_id IN (SELECT id FROM leads WHERE assigned_to = get_my_staff_id())
    );

-- lead_source_tracking: admin full, staff read own leads
ALTER TABLE lead_source_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_source_admin_all" ON lead_source_tracking
    FOR ALL USING (is_admin_or_above());
CREATE POLICY "lead_source_staff_read" ON lead_source_tracking
    FOR SELECT USING (
        get_user_role() = 'staff' AND
        lead_id IN (SELECT id FROM leads WHERE assigned_to = get_my_staff_id())
    );

-- staff_lead_notifications: admin full, staff own notifications
ALTER TABLE staff_lead_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_notif_admin_all" ON staff_lead_notifications
    FOR ALL USING (is_admin_or_above());
CREATE POLICY "staff_notif_own" ON staff_lead_notifications
    FOR ALL USING (staff_id = get_my_staff_id());

-- ── Trigger: Auto-create lead folders on INSERT ──────────────
CREATE OR REPLACE FUNCTION fn_create_lead_folders()
RETURNS TRIGGER AS $$
DECLARE
    sales_folder_id UUID;
    reports_folder_id UUID;
    new_sales_folder UUID;
    new_reports_folder UUID;
    lead_slug TEXT;
BEGIN
    -- Sales & CRM root folder
    sales_folder_id := '00000000-0000-0000-0001-000000000011';
    -- Reports & Analytics root folder
    reports_folder_id := '00000000-0000-0000-0001-000000000010';

    lead_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]', '-', 'g'));

    -- Create Sales subfolder for this lead
    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order)
    VALUES (
        NEW.name,
        'lead-' || lead_slug,
        sales_folder_id,
        '/sales/lead-' || lead_slug,
        'Lead: ' || NEW.name || ' (' || COALESCE(NEW.email, '') || ')',
        'UserPlus',
        '#EF4444',
        0
    )
    ON CONFLICT (parent_id, slug) DO NOTHING
    RETURNING id INTO new_sales_folder;

    -- Create Reports subfolder for this lead
    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order)
    VALUES (
        NEW.name,
        'lead-' || lead_slug,
        reports_folder_id,
        '/reports/lead-' || lead_slug,
        'Lead Report: ' || NEW.name || ' | Source: ' || COALESCE(NEW.source::TEXT, 'unknown') || ' | Value: ' || COALESCE(NEW.deal_value::TEXT, '0'),
        'FileBarChart',
        '#F97316',
        0
    )
    ON CONFLICT (parent_id, slug) DO NOTHING
    RETURNING id INTO new_reports_folder;

    -- Update lead with folder reference
    IF new_sales_folder IS NOT NULL THEN
        UPDATE leads SET documents_folder_id = new_sales_folder WHERE id = NEW.id;

        INSERT INTO lead_folder_mappings (lead_id, folder_id, folder_type)
        VALUES (NEW.id, new_sales_folder, 'sales')
        ON CONFLICT DO NOTHING;
    END IF;

    IF new_reports_folder IS NOT NULL THEN
        INSERT INTO lead_folder_mappings (lead_id, folder_id, folder_type)
        VALUES (NEW.id, new_reports_folder, 'reports')
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_lead_folders ON leads;
CREATE TRIGGER trg_create_lead_folders
    AFTER INSERT ON leads
    FOR EACH ROW EXECUTE FUNCTION fn_create_lead_folders();

-- ── Trigger: Notify staff on lead assignment ─────────────────
CREATE OR REPLACE FUNCTION fn_notify_staff_on_lead()
RETURNS TRIGGER AS $$
BEGIN
    -- Only fire when assigned_to changes (or is set for the first time)
    IF (TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL) OR
       (TG_OP = 'UPDATE' AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL) THEN

        INSERT INTO staff_lead_notifications (staff_id, lead_id, notification_type, title, message)
        VALUES (
            NEW.assigned_to,
            NEW.id,
            CASE WHEN TG_OP = 'INSERT' THEN 'new_assignment' ELSE 'new_assignment' END,
            'New Lead Assigned: ' || NEW.name,
            'Lead ' || NEW.name || ' (' || COALESCE(NEW.email, 'no email') || ') has been assigned to you. Source: ' || COALESCE(NEW.source::TEXT, 'unknown') || '.'
        );
    END IF;

    -- Notify on status change
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.assigned_to IS NOT NULL THEN
        INSERT INTO staff_lead_notifications (staff_id, lead_id, notification_type, title, message)
        VALUES (
            NEW.assigned_to,
            NEW.id,
            'status_change',
            'Lead Status Changed: ' || NEW.name,
            'Lead ' || NEW.name || ' status changed from ' || OLD.status::TEXT || ' to ' || NEW.status::TEXT || '.'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_staff_on_lead ON leads;
CREATE TRIGGER trg_notify_staff_on_lead
    AFTER INSERT OR UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION fn_notify_staff_on_lead();

-- ── Trigger: Update touchpoints on activity ──────────────────
CREATE OR REPLACE FUNCTION fn_update_lead_touchpoints()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE leads
    SET total_touchpoints = (
        SELECT COUNT(*) FROM lead_activities WHERE lead_id = NEW.lead_id
    )
    WHERE id = NEW.lead_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_lead_touchpoints ON lead_activities;
CREATE TRIGGER trg_update_lead_touchpoints
    AFTER INSERT ON lead_activities
    FOR EACH ROW EXECUTE FUNCTION fn_update_lead_touchpoints();
