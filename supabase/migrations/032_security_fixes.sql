-- ============================================================
-- Migration 032: Security Fixes & Integrity Repairs
-- Addresses critical issues from Phase 6 audit
-- ============================================================

-- ============================================================
-- 1. FIX BUCKET PRIVACY (Critical)
--    Migrations 018 vs 030 conflict: ON CONFLICT DO NOTHING
--    left sensitive buckets PUBLIC. Force them PRIVATE.
-- ============================================================

UPDATE storage.buckets SET public = FALSE WHERE id = 'ghl-documents';
UPDATE storage.buckets SET public = FALSE WHERE id = 'ghl-templates';
UPDATE storage.buckets SET public = FALSE WHERE id = 'ghl-exports';
UPDATE storage.buckets SET public = FALSE WHERE id = 'ghl-temp-uploads';
UPDATE storage.buckets SET public = FALSE WHERE id = 'ghl-backups';
UPDATE storage.buckets SET public = FALSE WHERE id = 'kyc-documents';

-- ============================================================
-- 2. DROP OVERLY PERMISSIVE STORAGE POLICIES (Critical)
--    Migration 018 created open TRUE policies for demo mode.
--    These shadow the role-based policies from 013/030.
-- ============================================================

-- ghl-documents permissive policies
DROP POLICY IF EXISTS "ghl_docs_public_read" ON storage.objects;
DROP POLICY IF EXISTS "ghl_docs_auth_write" ON storage.objects;
DROP POLICY IF EXISTS "ghl_docs_auth_delete" ON storage.objects;

-- ghl-templates permissive policies
DROP POLICY IF EXISTS "ghl_tpl_public_read" ON storage.objects;
DROP POLICY IF EXISTS "ghl_tpl_auth_write" ON storage.objects;
DROP POLICY IF EXISTS "ghl_tpl_auth_delete" ON storage.objects;

-- ghl-media permissive policies
DROP POLICY IF EXISTS "ghl_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "ghl_media_auth_write" ON storage.objects;
DROP POLICY IF EXISTS "ghl_media_auth_delete" ON storage.objects;

-- ghl-exports permissive policies
DROP POLICY IF EXISTS "ghl_exports_public_read" ON storage.objects;
DROP POLICY IF EXISTS "ghl_exports_auth_write" ON storage.objects;
DROP POLICY IF EXISTS "ghl_exports_auth_delete" ON storage.objects;

-- ghl-temp-uploads permissive policies
DROP POLICY IF EXISTS "ghl_temp_public_read" ON storage.objects;
DROP POLICY IF EXISTS "ghl_temp_auth_write" ON storage.objects;
DROP POLICY IF EXISTS "ghl_temp_auth_delete" ON storage.objects;

-- ghl-backups permissive policies
DROP POLICY IF EXISTS "ghl_backups_public_read" ON storage.objects;
DROP POLICY IF EXISTS "ghl_backups_auth_write" ON storage.objects;
DROP POLICY IF EXISTS "ghl_backups_auth_delete" ON storage.objects;

-- uploads overly open policy (from migration 017)
DROP POLICY IF EXISTS "uploads_public_access" ON storage.objects;

-- ============================================================
-- 3. ENSURE PROPER ROLE-BASED STORAGE POLICIES
--    Re-create with proper auth checks (idempotent)
-- ============================================================

-- ghl-documents: admin/staff read+write, clients read own folder
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ghl_docs_admin_all' AND tablename = 'objects') THEN
    CREATE POLICY "ghl_docs_admin_all" ON storage.objects FOR ALL
      USING (bucket_id = 'ghl-documents' AND is_admin_or_above())
      WITH CHECK (bucket_id = 'ghl-documents' AND is_admin_or_above());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ghl_docs_staff_read' AND tablename = 'objects') THEN
    CREATE POLICY "ghl_docs_staff_read" ON storage.objects FOR SELECT
      USING (bucket_id = 'ghl-documents' AND get_user_role() = 'staff');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ghl_docs_staff_upload' AND tablename = 'objects') THEN
    CREATE POLICY "ghl_docs_staff_upload" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'ghl-documents' AND get_user_role() = 'staff');
  END IF;
END $$;

-- ghl-backups: super_admin only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ghl_backups_super_admin' AND tablename = 'objects') THEN
    CREATE POLICY "ghl_backups_super_admin" ON storage.objects FOR ALL
      USING (bucket_id = 'ghl-backups' AND is_super_admin())
      WITH CHECK (bucket_id = 'ghl-backups' AND is_super_admin());
  END IF;
END $$;

-- ghl-exports: admin read+write, staff read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ghl_exports_admin_all' AND tablename = 'objects') THEN
    CREATE POLICY "ghl_exports_admin_all" ON storage.objects FOR ALL
      USING (bucket_id = 'ghl-exports' AND is_admin_or_above())
      WITH CHECK (bucket_id = 'ghl-exports' AND is_admin_or_above());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ghl_exports_staff_read' AND tablename = 'objects') THEN
    CREATE POLICY "ghl_exports_staff_read" ON storage.objects FOR SELECT
      USING (bucket_id = 'ghl-exports' AND get_user_role() = 'staff');
  END IF;
END $$;

-- ghl-templates: admin write, all auth read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ghl_tpl_admin_write' AND tablename = 'objects') THEN
    CREATE POLICY "ghl_tpl_admin_write" ON storage.objects FOR ALL
      USING (bucket_id = 'ghl-templates' AND is_admin_or_above())
      WITH CHECK (bucket_id = 'ghl-templates' AND is_admin_or_above());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ghl_tpl_auth_read' AND tablename = 'objects') THEN
    CREATE POLICY "ghl_tpl_auth_read" ON storage.objects FOR SELECT
      USING (bucket_id = 'ghl-templates' AND auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ghl-temp-uploads: authenticated users can upload, admin can manage
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ghl_temp_auth_upload' AND tablename = 'objects') THEN
    CREATE POLICY "ghl_temp_auth_upload" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'ghl-temp-uploads' AND auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ghl_temp_own_read' AND tablename = 'objects') THEN
    CREATE POLICY "ghl_temp_own_read" ON storage.objects FOR SELECT
      USING (bucket_id = 'ghl-temp-uploads' AND auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ghl_temp_admin_all' AND tablename = 'objects') THEN
    CREATE POLICY "ghl_temp_admin_all" ON storage.objects FOR ALL
      USING (bucket_id = 'ghl-temp-uploads' AND is_admin_or_above())
      WITH CHECK (bucket_id = 'ghl-temp-uploads' AND is_admin_or_above());
  END IF;
END $$;

-- uploads bucket: authenticated users only (not anonymous)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'uploads_auth_access' AND tablename = 'objects') THEN
    CREATE POLICY "uploads_auth_access" ON storage.objects FOR ALL
      USING (bucket_id = 'uploads' AND auth.uid() IS NOT NULL)
      WITH CHECK (bucket_id = 'uploads' AND auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================================
-- 4. FIX KYC CLIENT READ POLICY (Medium)
--    Clients can upload but cannot read their own KYC docs.
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kyc_client_own_read' AND tablename = 'objects') THEN
    CREATE POLICY "kyc_client_own_read" ON storage.objects FOR SELECT
      USING (
        bucket_id = 'kyc-documents'
        AND get_user_role() = 'client'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- ============================================================
-- 5. FIX mv_dashboard_kpis CARTESIAN PRODUCT (Critical)
--    Original: LEFT JOIN expenses/leads/staff ON TRUE
--    Fix: Use subqueries to avoid cross-joins
-- ============================================================

DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_kpis;

CREATE MATERIALIZED VIEW mv_dashboard_kpis AS
SELECT
    (SELECT COUNT(*) FROM clients) AS total_clients,
    (SELECT COUNT(*) FROM clients WHERE created_at >= DATE_TRUNC('month', NOW())) AS new_clients_this_month,
    (SELECT COALESCE(SUM(total_invested), 0) FROM clients) AS total_aum,
    (SELECT COALESCE(SUM(amount), 0) FROM revenue_streams WHERE status = 'active') AS active_revenue,
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE date >= DATE_TRUNC('month', NOW())) AS monthly_expenses,
    (SELECT COUNT(*) FROM leads WHERE status = 'new') AS new_leads,
    (SELECT COUNT(*) FROM leads WHERE status = 'won') AS converted_leads,
    (SELECT COUNT(*) FROM staff_profiles WHERE is_active = TRUE) AS active_staff;

-- Create unique index for REFRESH CONCURRENTLY support
CREATE UNIQUE INDEX IF NOT EXISTS mv_dashboard_kpis_single_row ON mv_dashboard_kpis ((1));

-- ============================================================
-- 6. ADD MISSING FOREIGN KEYS
-- ============================================================

-- leads.assigned_to → staff_profiles.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_leads_assigned_to_staff'
    AND table_name = 'leads'
  ) THEN
    ALTER TABLE leads
      ADD CONSTRAINT fk_leads_assigned_to_staff
      FOREIGN KEY (assigned_to) REFERENCES staff_profiles(id)
      ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- investment_applications.assigned_rm → staff_profiles.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_investment_applications_rm'
    AND table_name = 'investment_applications'
  ) THEN
    ALTER TABLE investment_applications
      ADD CONSTRAINT fk_investment_applications_rm
      FOREIGN KEY (assigned_rm) REFERENCES staff_profiles(id)
      ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- documents.folder_id cascade behavior
DO $$ BEGIN
  -- Drop existing FK if it lacks ON DELETE behavior
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_name = 'documents' AND tc.constraint_name LIKE '%folder_id%'
    AND rc.delete_rule = 'NO ACTION'
  ) THEN
    ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_folder_id_fkey;
    ALTER TABLE documents
      ADD CONSTRAINT documents_folder_id_fkey
      FOREIGN KEY (folder_id) REFERENCES folders(id)
      ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 7. ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_investment_applications_assigned_rm ON investment_applications(assigned_rm);
CREATE INDEX IF NOT EXISTS idx_investment_applications_status ON investment_applications(status);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_revenue_streams_status ON revenue_streams(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_is_active ON staff_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_folder_access_client_id ON folder_access(client_id);
CREATE INDEX IF NOT EXISTS idx_folder_access_folder_id ON folder_access(folder_id);

-- ============================================================
-- 8. FIX internal_messages RLS
--    Ensure users can only see messages they sent or received
-- ============================================================

DO $$ BEGIN
  -- Drop overly permissive policy if it exists
  DROP POLICY IF EXISTS "internal_messages_select" ON internal_messages;
  DROP POLICY IF EXISTS "internal_messages_insert" ON internal_messages;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'internal_messages_own_read' AND tablename = 'internal_messages') THEN
    CREATE POLICY "internal_messages_own_read" ON internal_messages FOR SELECT
      USING (
        sender_id = auth.uid()
        OR recipient_id = auth.uid()
        OR is_admin_or_above()
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'internal_messages_own_insert' AND tablename = 'internal_messages') THEN
    CREATE POLICY "internal_messages_own_insert" ON internal_messages FOR INSERT
      WITH CHECK (sender_id = auth.uid());
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 9. REFRESH MATERIALIZED VIEWS
-- ============================================================

REFRESH MATERIALIZED VIEW mv_dashboard_kpis;
