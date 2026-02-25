-- ============================================================
-- 021 · FIX TRIGGER COLUMNS, UNIQUE INDEX, FOLDER RLS CONFLICT
--
-- Addresses:
--   1. CRITICAL: fn_create_lead_folders() references NEW.name and
--      NEW.deal_value which do NOT exist on the leads table
--      (correct: first_name + last_name, estimated_value)
--   2. CRITICAL: fn_notify_staff_on_lead() references NEW.name
--   3. MEDIUM: mv_dashboard_kpis needs UNIQUE INDEX for
--      REFRESH MATERIALIZED VIEW CONCURRENTLY
--   4. MEDIUM: Folder RLS policies in 020 conflict with 016
--      (016 uses admin/staff role check; 020 adds auth.uid() checks)
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. FIX fn_create_lead_folders()
-- Replace NEW.name → computed full name from first_name + last_name
-- Replace NEW.deal_value → NEW.estimated_value
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_create_lead_folders()
RETURNS TRIGGER AS $$
DECLARE
    sales_folder_id UUID;
    reports_folder_id UUID;
    new_sales_folder UUID;
    new_reports_folder UUID;
    lead_name TEXT;
    lead_slug TEXT;
BEGIN
    -- Sales & CRM root folder
    sales_folder_id := '00000000-0000-0000-0001-000000000011';
    -- Reports & Analytics root folder
    reports_folder_id := '00000000-0000-0000-0001-000000000010';

    -- Build lead name from first_name + last_name (both exist on leads table)
    lead_name := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
    IF lead_name = '' THEN
        lead_name := 'Lead-' || NEW.id::TEXT;
    END IF;

    lead_slug := lower(regexp_replace(lead_name, '[^a-zA-Z0-9]', '-', 'g'));

    -- Create Sales subfolder for this lead
    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order)
    VALUES (
        lead_name,
        'lead-' || lead_slug,
        sales_folder_id,
        '/sales/lead-' || lead_slug,
        'Lead: ' || lead_name || ' (' || COALESCE(NEW.email, '') || ')',
        'UserPlus',
        '#EF4444',
        0
    )
    ON CONFLICT (parent_id, slug) DO NOTHING
    RETURNING id INTO new_sales_folder;

    -- Create Reports subfolder for this lead
    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order)
    VALUES (
        lead_name,
        'lead-' || lead_slug,
        reports_folder_id,
        '/reports/lead-' || lead_slug,
        'Lead Report: ' || lead_name || ' | Source: ' || COALESCE(NEW.source::TEXT, 'unknown') || ' | Value: ' || COALESCE(NEW.estimated_value::TEXT, '0'),
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ════════════════════════════════════════════════════════════
-- 2. FIX fn_notify_staff_on_lead()
-- Replace NEW.name → computed full name from first_name + last_name
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_notify_staff_on_lead()
RETURNS TRIGGER AS $$
DECLARE
    lead_name TEXT;
BEGIN
    -- Build lead name from first_name + last_name
    lead_name := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
    IF lead_name = '' THEN
        lead_name := 'Lead-' || NEW.id::TEXT;
    END IF;

    -- Only fire when assigned_to changes (or is set for the first time)
    IF (TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL) OR
       (TG_OP = 'UPDATE' AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL) THEN

        INSERT INTO staff_lead_notifications (staff_id, lead_id, notification_type, title, message)
        VALUES (
            NEW.assigned_to,
            NEW.id,
            'new_assignment',
            'New Lead Assigned: ' || lead_name,
            'Lead ' || lead_name || ' (' || COALESCE(NEW.email, 'no email') || ') has been assigned to you. Source: ' || COALESCE(NEW.source::TEXT, 'unknown') || '.'
        );
    END IF;

    -- Notify on status change
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.assigned_to IS NOT NULL THEN
        INSERT INTO staff_lead_notifications (staff_id, lead_id, notification_type, title, message)
        VALUES (
            NEW.assigned_to,
            NEW.id,
            'status_change',
            'Lead Status Changed: ' || lead_name,
            'Lead ' || lead_name || ' status changed from ' || OLD.status::TEXT || ' to ' || NEW.status::TEXT || '.'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ════════════════════════════════════════════════════════════
-- 3. ADD UNIQUE INDEX ON mv_dashboard_kpis
-- Required for REFRESH MATERIALIZED VIEW CONCURRENTLY.
-- mv_dashboard_kpis is a single-row aggregate view, so we add
-- a constant expression as the unique key.
-- ════════════════════════════════════════════════════════════

-- First check if the materialized view exists; the index is idempotent
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_kpis_unique
    ON mv_dashboard_kpis ((1));


-- ════════════════════════════════════════════════════════════
-- 4. FIX FOLDER RLS POLICY CONFLICT
-- Migration 016 created: folders_admin_all, folders_staff_read
-- Migration 020 created: folders_auth_insert, folders_auth_update, folders_auth_delete
--
-- The 020 policies (auth.uid() IS NOT NULL) are weaker than
-- 016's admin-only ALL policy. Drop the conflicting 020 policies
-- since 016 already properly restricts access:
--   admin → full CRUD (folders_admin_all)
--   staff → read only (folders_staff_read)
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "folders_auth_insert" ON folders;
DROP POLICY IF EXISTS "folders_auth_update" ON folders;
DROP POLICY IF EXISTS "folders_auth_delete" ON folders;


-- ════════════════════════════════════════════════════════════
-- 5. PIN search_path ON NEWLY CREATED/REPLACED FUNCTIONS
-- (019 functions weren't covered by 020's search_path fix)
-- ════════════════════════════════════════════════════════════

ALTER FUNCTION public.fn_update_lead_touchpoints() SET search_path = public;
