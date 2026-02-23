-- ============================================================
-- 013 · STORAGE BUCKETS & POLICIES
-- ============================================================

-- ── Create Buckets ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
    ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
    ('documents', 'documents', FALSE, 52428800, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv','image/jpeg','image/png']),
    ('reports', 'reports', FALSE, 52428800, ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv','application/json']),
    ('kyc-documents', 'kyc-documents', FALSE, 10485760, ARRAY['application/pdf','image/jpeg','image/png']),
    ('marketing-assets', 'marketing-assets', TRUE, 20971520, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','video/mp4','application/pdf']),
    ('resumes', 'resumes', FALSE, 5242880, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS Policies ──

-- Avatars: public read, authenticated upload own
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_auth_upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
);
CREATE POLICY "avatars_owner_update" ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Documents: admin full access, staff read, clients own folder
CREATE POLICY "documents_admin_all" ON storage.objects FOR ALL USING (
    bucket_id = 'documents' AND is_admin_or_above()
);
CREATE POLICY "documents_staff_read" ON storage.objects FOR SELECT USING (
    bucket_id = 'documents' AND get_user_role() = 'staff'
);
CREATE POLICY "documents_client_own" ON storage.objects FOR SELECT USING (
    bucket_id = 'documents' AND (storage.foldername(name))[1] = 'clients' AND (storage.foldername(name))[2] = get_my_client_id()::TEXT
);

-- Reports: admin & staff access
CREATE POLICY "reports_staff_access" ON storage.objects FOR ALL USING (
    bucket_id = 'reports' AND get_user_role() IN ('super_admin','admin','staff')
);

-- KYC: admin only
CREATE POLICY "kyc_admin_only" ON storage.objects FOR ALL USING (
    bucket_id = 'kyc-documents' AND is_admin_or_above()
);
CREATE POLICY "kyc_client_upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'kyc-documents' AND get_user_role() = 'client'
);

-- Marketing assets: public read, admin write
CREATE POLICY "marketing_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'marketing-assets');
CREATE POLICY "marketing_admin_write" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'marketing-assets' AND is_admin_or_above()
);

-- Resumes: anonymous upload, admin read
CREATE POLICY "resumes_anon_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes');
CREATE POLICY "resumes_admin_read" ON storage.objects FOR SELECT USING (
    bucket_id = 'resumes' AND is_admin_or_above()
);
