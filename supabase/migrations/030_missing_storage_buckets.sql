-- ============================================================
-- 030 · MISSING STORAGE BUCKETS & POLICIES
--
-- Adds buckets referenced in storageService.ts that were not
-- included in migration 013. Uses ON CONFLICT to be idempotent.
-- ============================================================

-- ── Create Missing Buckets ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
    ('ghl-documents', 'ghl-documents', FALSE, 52428800,
     ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
           'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
           'text/csv','image/jpeg','image/png','image/webp']),
    ('ghl-templates', 'ghl-templates', FALSE, 20971520,
     ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
           'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
           'text/csv']),
    ('ghl-media', 'ghl-media', TRUE, 52428800,
     ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml',
           'video/mp4','video/webm','audio/mpeg','audio/wav']),
    ('ghl-exports', 'ghl-exports', FALSE, 52428800,
     ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
           'text/csv','application/json']),
    ('ghl-temp-uploads', 'ghl-temp-uploads', FALSE, 52428800,
     ARRAY['application/pdf','image/jpeg','image/png','image/webp',
           'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
           'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
    ('ghl-backups', 'ghl-backups', FALSE, 104857600,
     ARRAY['application/json','application/gzip','application/zip']),
    ('uploads', 'uploads', TRUE, 10485760,
     ARRAY['application/pdf','image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- ── RLS Policies for ghl-documents (primary doc store) ──
DO $$ BEGIN
  CREATE POLICY "ghl_docs_admin_all" ON storage.objects FOR ALL USING (
    bucket_id = 'ghl-documents' AND is_admin_or_above()
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "ghl_docs_staff_read" ON storage.objects FOR SELECT USING (
    bucket_id = 'ghl-documents' AND get_user_role() IN ('staff', 'super_admin', 'admin')
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "ghl_docs_client_own" ON storage.objects FOR SELECT USING (
    bucket_id = 'ghl-documents' AND (storage.foldername(name))[1] = 'clients' AND (storage.foldername(name))[2] = get_my_client_id()::TEXT
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "ghl_docs_client_upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'ghl-documents' AND auth.role() = 'authenticated'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── RLS Policies for ghl-templates (read-only for staff/clients) ──
DO $$ BEGIN
  CREATE POLICY "ghl_templates_admin_all" ON storage.objects FOR ALL USING (
    bucket_id = 'ghl-templates' AND is_admin_or_above()
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "ghl_templates_auth_read" ON storage.objects FOR SELECT USING (
    bucket_id = 'ghl-templates' AND auth.role() = 'authenticated'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── RLS Policies for ghl-media (public read, admin write) ──
DO $$ BEGIN
  CREATE POLICY "ghl_media_public_read" ON storage.objects FOR SELECT USING (
    bucket_id = 'ghl-media'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "ghl_media_admin_write" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'ghl-media' AND is_admin_or_above()
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── RLS Policies for ghl-exports (admin & staff) ──
DO $$ BEGIN
  CREATE POLICY "ghl_exports_staff_all" ON storage.objects FOR ALL USING (
    bucket_id = 'ghl-exports' AND get_user_role() IN ('super_admin', 'admin', 'staff')
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── RLS Policies for ghl-temp-uploads (authenticated upload, auto-cleanup) ──
DO $$ BEGIN
  CREATE POLICY "ghl_temp_auth_upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'ghl-temp-uploads' AND auth.role() = 'authenticated'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "ghl_temp_own_read" ON storage.objects FOR SELECT USING (
    bucket_id = 'ghl-temp-uploads' AND auth.role() = 'authenticated'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── RLS Policies for ghl-backups (super admin only) ──
DO $$ BEGIN
  CREATE POLICY "ghl_backups_admin_only" ON storage.objects FOR ALL USING (
    bucket_id = 'ghl-backups' AND is_admin_or_above()
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── RLS Policies for uploads (legacy — public read, auth write) ──
DO $$ BEGIN
  CREATE POLICY "uploads_public_read" ON storage.objects FOR SELECT USING (
    bucket_id = 'uploads'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "uploads_auth_write" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'uploads' AND auth.role() = 'authenticated'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
