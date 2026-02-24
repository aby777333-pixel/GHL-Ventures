-- ============================================================
-- 017 · PUBLIC UPLOADS BUCKET (demo-friendly, no auth required)
-- ============================================================
-- This bucket allows anonymous uploads and public reads.
-- Suitable for demo/portfolio applications using mock auth.
-- In production, replace with authenticated bucket + RLS.

-- ── Create public uploads bucket ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
    ('uploads', 'uploads', TRUE, 52428800, ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/csv',
        'text/plain',
        'application/json',
        'application/zip',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'video/mp4',
        'audio/mpeg'
    ])
ON CONFLICT (id) DO NOTHING;

-- ── Permissive policies for demo ──
-- Public read: anyone can view/download files
CREATE POLICY "uploads_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'uploads');

-- Anonymous upload: anyone can upload files
CREATE POLICY "uploads_anon_insert" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'uploads');

-- Anonymous update: anyone can overwrite files
CREATE POLICY "uploads_anon_update" ON storage.objects
    FOR UPDATE USING (bucket_id = 'uploads');

-- Anonymous delete: anyone can delete files
CREATE POLICY "uploads_anon_delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'uploads');
