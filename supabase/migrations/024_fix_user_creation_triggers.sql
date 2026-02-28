-- ═══════════════════════════════════════════════════════════════
-- Migration 024: Fix triggers that block user creation & lead insertion
-- ═══════════════════════════════════════════════════════════════
--
-- Problem 1: fn_auto_create_profile() fires AFTER INSERT on auth.users.
--            If it fails (e.g., RLS, missing column, constraint), the entire
--            user creation transaction rolls back → "Database error creating new user".
--            FIX: Add EXCEPTION handler so profile creation failure never blocks signup.
--
-- Problem 2: fn_notify_staff_on_lead() references staff_lead_notifications table
--            which does NOT exist in production. Any lead with assigned_to set
--            would cause INSERT to fail.
--            FIX: Rewrite to use the existing 'notifications' table instead.
-- ═══════════════════════════════════════════════════════════════


-- ── 1. Fix auto-create profile trigger (bulletproof) ──────────

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
EXCEPTION WHEN OTHERS THEN
    -- Log the error but NEVER block user creation
    RAISE WARNING '[fn_auto_create_profile] Failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ── 2. Fix lead notification trigger (use 'notifications' table) ──

CREATE OR REPLACE FUNCTION fn_notify_staff_on_lead()
RETURNS TRIGGER AS $$
BEGIN
    -- Only fire when assigned_to changes (or is set for the first time)
    IF (TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL) OR
       (TG_OP = 'UPDATE' AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL) THEN

        INSERT INTO notifications (user_id, title, body, type, priority, action_url, metadata)
        VALUES (
            NEW.assigned_to,
            'New Lead Assigned: ' || COALESCE(NEW.name, 'Unknown'),
            'Lead ' || COALESCE(NEW.name, '') || ' (' || COALESCE(NEW.email, 'no email') || ') has been assigned to you. Source: ' || COALESCE(NEW.source::TEXT, 'unknown') || '.',
            'lead',
            'high',
            '/staff/leads',
            jsonb_build_object('lead_id', NEW.id)
        );
    END IF;

    -- Notify on status change
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.assigned_to IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, body, type, priority, metadata)
        VALUES (
            NEW.assigned_to,
            'Lead Status Changed: ' || COALESCE(NEW.name, 'Unknown'),
            'Lead ' || COALESCE(NEW.name, '') || ' status changed from ' || OLD.status::TEXT || ' to ' || NEW.status::TEXT || '.',
            'lead',
            'normal',
            jsonb_build_object('lead_id', NEW.id, 'old_status', OLD.status::TEXT, 'new_status', NEW.status::TEXT)
        );
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Never block lead operations due to notification failure
    RAISE WARNING '[fn_notify_staff_on_lead] Failed for lead %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
