-- ═══════════════════════════════════════════════════════════════
-- Migration 023: Enable Realtime on leads + Admin access hardening
-- ═══════════════════════════════════════════════════════════════

-- 1. Add leads to Realtime publication so admin/staff get live updates
ALTER PUBLICATION supabase_realtime ADD TABLE leads;

-- 2. Ensure admin has full access on tables that may be missing explicit admin policies

-- Notifications: admin should be able to insert (for system notifications)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_admin_manage'
  ) THEN
    CREATE POLICY "notifications_admin_manage" ON notifications
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin'))
      );
  END IF;
END $$;

-- Lead activities: ensure admin full access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lead_activities' AND policyname = 'lead_activities_admin_manage'
  ) THEN
    CREATE POLICY "lead_activities_admin_manage" ON lead_activities
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin'))
      );
  END IF;
END $$;

-- Staff lead notifications: ensure admin can view all
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff_lead_notifications' AND policyname = 'staff_lead_notifications_admin_view'
  ) THEN
    CREATE POLICY "staff_lead_notifications_admin_view" ON staff_lead_notifications
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin'))
      );
  END IF;
END $$;
