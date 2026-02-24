-- ============================================================
-- 018 · ENHANCED STORAGE — Additional buckets, file tracking,
--       activity logging, permissions, quotas
-- ============================================================
-- Builds on 013 (base buckets), 016 (file repository), 017 (uploads bucket).
-- All policies use anonymous-friendly access since the platform
-- uses mock auth (no Supabase Auth sessions).
-- ============================================================

-- ── Additional Storage Buckets ──
-- ghl-documents: primary document store with folder structure
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
    ('ghl-documents', 'ghl-documents', TRUE, 52428800, ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/csv', 'text/plain', 'application/json', 'application/zip',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'audio/mpeg'
    ])
ON CONFLICT (id) DO NOTHING;

-- ghl-templates: reusable document templates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
    ('ghl-templates', 'ghl-templates', TRUE, 20971520, ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv', 'text/plain', 'application/json'
    ])
ON CONFLICT (id) DO NOTHING;

-- ghl-media: images, videos, audio for website/marketing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
    ('ghl-media', 'ghl-media', TRUE, 104857600, ARRAY[
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav'
    ])
ON CONFLICT (id) DO NOTHING;

-- ghl-exports: generated exports (CSV, PDF reports, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
    ('ghl-exports', 'ghl-exports', TRUE, 52428800, ARRAY[
        'application/pdf', 'text/csv', 'application/json',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip', 'text/plain'
    ])
ON CONFLICT (id) DO NOTHING;

-- ghl-temp-uploads: temporary staging area (auto-cleaned)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
    ('ghl-temp-uploads', 'ghl-temp-uploads', TRUE, 52428800, ARRAY[
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv', 'text/plain', 'application/json', 'application/zip',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'audio/mpeg'
    ])
ON CONFLICT (id) DO NOTHING;

-- ghl-backups: database/config backups
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
    ('ghl-backups', 'ghl-backups', TRUE, 104857600, ARRAY[
        'application/json', 'application/zip', 'application/gzip',
        'text/plain', 'text/csv'
    ])
ON CONFLICT (id) DO NOTHING;


-- ── Anonymous-friendly policies for new buckets ──
-- (Mock auth = no Supabase Auth sessions = anonymous access required)

-- ghl-documents
CREATE POLICY "ghl_docs_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'ghl-documents');
CREATE POLICY "ghl_docs_anon_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ghl-documents');
CREATE POLICY "ghl_docs_anon_update" ON storage.objects FOR UPDATE USING (bucket_id = 'ghl-documents');
CREATE POLICY "ghl_docs_anon_delete" ON storage.objects FOR DELETE USING (bucket_id = 'ghl-documents');

-- ghl-templates
CREATE POLICY "ghl_tpl_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'ghl-templates');
CREATE POLICY "ghl_tpl_anon_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ghl-templates');
CREATE POLICY "ghl_tpl_anon_update" ON storage.objects FOR UPDATE USING (bucket_id = 'ghl-templates');
CREATE POLICY "ghl_tpl_anon_delete" ON storage.objects FOR DELETE USING (bucket_id = 'ghl-templates');

-- ghl-media
CREATE POLICY "ghl_media_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'ghl-media');
CREATE POLICY "ghl_media_anon_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ghl-media');
CREATE POLICY "ghl_media_anon_update" ON storage.objects FOR UPDATE USING (bucket_id = 'ghl-media');
CREATE POLICY "ghl_media_anon_delete" ON storage.objects FOR DELETE USING (bucket_id = 'ghl-media');

-- ghl-exports
CREATE POLICY "ghl_exp_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'ghl-exports');
CREATE POLICY "ghl_exp_anon_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ghl-exports');
CREATE POLICY "ghl_exp_anon_update" ON storage.objects FOR UPDATE USING (bucket_id = 'ghl-exports');
CREATE POLICY "ghl_exp_anon_delete" ON storage.objects FOR DELETE USING (bucket_id = 'ghl-exports');

-- ghl-temp-uploads
CREATE POLICY "ghl_tmp_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'ghl-temp-uploads');
CREATE POLICY "ghl_tmp_anon_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ghl-temp-uploads');
CREATE POLICY "ghl_tmp_anon_update" ON storage.objects FOR UPDATE USING (bucket_id = 'ghl-temp-uploads');
CREATE POLICY "ghl_tmp_anon_delete" ON storage.objects FOR DELETE USING (bucket_id = 'ghl-temp-uploads');

-- ghl-backups
CREATE POLICY "ghl_bak_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'ghl-backups');
CREATE POLICY "ghl_bak_anon_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ghl-backups');
CREATE POLICY "ghl_bak_anon_update" ON storage.objects FOR UPDATE USING (bucket_id = 'ghl-backups');
CREATE POLICY "ghl_bak_anon_delete" ON storage.objects FOR DELETE USING (bucket_id = 'ghl-backups');


-- ============================================================
-- FILE TRACKING & ACTIVITY TABLES
-- ============================================================

-- ── file_records: tracks every file across all buckets ──
CREATE TABLE IF NOT EXISTS file_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    bucket TEXT NOT NULL DEFAULT 'ghl-documents',
    file_size BIGINT DEFAULT 0,
    mime_type TEXT,
    file_type TEXT,                          -- pdf, docx, xlsx, image, video, etc.

    -- Organizational
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    category TEXT,                           -- fund, compliance, client, employee, etc.
    tags TEXT[] DEFAULT '{}',
    description TEXT,

    -- Entity linkage (cross-module)
    entity_type TEXT,                        -- client, employee, deal, compliance, asset, etc.
    entity_id TEXT,                          -- UUID or ID of the linked entity

    -- Portal & user tracking
    portal TEXT DEFAULT 'admin',             -- admin, staff, client, investor, agent
    uploaded_by TEXT,                        -- user ID (from mock auth)
    uploaded_by_name TEXT,

    -- Access & security
    access_level TEXT DEFAULT 'internal' CHECK (access_level IN ('public','internal','restricted','confidential')),
    is_confidential BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,

    -- Versioning
    version INTEGER DEFAULT 1,
    parent_file_id UUID REFERENCES file_records(id) ON DELETE SET NULL,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active','archived','deleted','processing')),
    starred BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_records_folder ON file_records(folder_id);
CREATE INDEX IF NOT EXISTS idx_file_records_entity ON file_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_records_portal ON file_records(portal);
CREATE INDEX IF NOT EXISTS idx_file_records_category ON file_records(category);
CREATE INDEX IF NOT EXISTS idx_file_records_bucket ON file_records(bucket);
CREATE INDEX IF NOT EXISTS idx_file_records_status ON file_records(status);
CREATE INDEX IF NOT EXISTS idx_file_records_starred ON file_records(starred) WHERE starred = TRUE;
CREATE INDEX IF NOT EXISTS idx_file_records_created ON file_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_records_mime ON file_records(mime_type);

-- ── file_activity_log: comprehensive activity tracking ──
CREATE TABLE IF NOT EXISTS file_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES file_records(id) ON DELETE SET NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    action TEXT NOT NULL,                    -- upload, download, view, delete, move, rename, share, version, star, archive
    performed_by TEXT,                       -- user ID (mock auth)
    performed_by_name TEXT,
    portal TEXT DEFAULT 'admin',
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_activity_file ON file_activity_log(file_id);
CREATE INDEX IF NOT EXISTS idx_file_activity_doc ON file_activity_log(document_id);
CREATE INDEX IF NOT EXISTS idx_file_activity_action ON file_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_file_activity_user ON file_activity_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_file_activity_created ON file_activity_log(created_at DESC);

-- ── file_permissions: granular access control ──
CREATE TABLE IF NOT EXISTS file_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES file_records(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    user_id TEXT,                            -- mock auth user ID
    role TEXT,                               -- admin, staff, client, investor, agent
    permission TEXT DEFAULT 'view' CHECK (permission IN ('view','download','edit','delete','admin')),
    granted_by TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (file_id IS NOT NULL OR folder_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_file_perm_file ON file_permissions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_perm_folder ON file_permissions(folder_id);
CREATE INDEX IF NOT EXISTS idx_file_perm_user ON file_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_file_perm_role ON file_permissions(role);

-- ── file_shares: shareable links ──
CREATE TABLE IF NOT EXISTS file_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES file_records(id) ON DELETE CASCADE,
    share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    shared_by TEXT,                          -- mock auth user ID
    shared_with_email TEXT,
    permission TEXT DEFAULT 'view' CHECK (permission IN ('view','download')),
    password_hash TEXT,
    max_downloads INTEGER,
    current_downloads INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_shares_token ON file_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_file_shares_file ON file_shares(file_id);

-- ── storage_quotas: per-portal/entity storage limits ──
CREATE TABLE IF NOT EXISTS storage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,               -- portal, client, employee, department
    entity_id TEXT NOT NULL,
    quota_bytes BIGINT DEFAULT 536870912,    -- 512 MB default
    used_bytes BIGINT DEFAULT 0,
    file_count INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_quotas_entity ON storage_quotas(entity_type, entity_id);


-- ── RLS Policies (permissive for demo/mock auth) ──

ALTER TABLE file_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "file_records_public_read" ON file_records FOR SELECT USING (TRUE);
CREATE POLICY "file_records_anon_insert" ON file_records FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "file_records_anon_update" ON file_records FOR UPDATE USING (TRUE);
CREATE POLICY "file_records_anon_delete" ON file_records FOR DELETE USING (TRUE);

ALTER TABLE file_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "file_activity_public_read" ON file_activity_log FOR SELECT USING (TRUE);
CREATE POLICY "file_activity_anon_insert" ON file_activity_log FOR INSERT WITH CHECK (TRUE);

ALTER TABLE file_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "file_perms_public_read" ON file_permissions FOR SELECT USING (TRUE);
CREATE POLICY "file_perms_anon_insert" ON file_permissions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "file_perms_anon_update" ON file_permissions FOR UPDATE USING (TRUE);
CREATE POLICY "file_perms_anon_delete" ON file_permissions FOR DELETE USING (TRUE);

ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "file_shares_public_read" ON file_shares FOR SELECT USING (TRUE);
CREATE POLICY "file_shares_anon_insert" ON file_shares FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "file_shares_anon_update" ON file_shares FOR UPDATE USING (TRUE);
CREATE POLICY "file_shares_anon_delete" ON file_shares FOR DELETE USING (TRUE);

ALTER TABLE storage_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotas_public_read" ON storage_quotas FOR SELECT USING (TRUE);
CREATE POLICY "quotas_anon_insert" ON storage_quotas FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "quotas_anon_update" ON storage_quotas FOR UPDATE USING (TRUE);


-- ── Helper function: get file type from mime ──
CREATE OR REPLACE FUNCTION get_file_type_from_mime(mime TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
    IF mime LIKE 'image/%' THEN RETURN 'image';
    ELSIF mime LIKE 'video/%' THEN RETURN 'video';
    ELSIF mime LIKE 'audio/%' THEN RETURN 'audio';
    ELSIF mime = 'application/pdf' THEN RETURN 'pdf';
    ELSIF mime LIKE '%word%' THEN RETURN 'docx';
    ELSIF mime LIKE '%spreadsheet%' OR mime LIKE '%excel%' THEN RETURN 'xlsx';
    ELSIF mime LIKE '%presentation%' OR mime LIKE '%powerpoint%' THEN RETURN 'pptx';
    ELSIF mime = 'text/csv' THEN RETURN 'csv';
    ELSIF mime = 'application/json' THEN RETURN 'json';
    ELSIF mime LIKE '%zip%' OR mime LIKE '%gzip%' THEN RETURN 'archive';
    ELSIF mime = 'text/plain' THEN RETURN 'txt';
    ELSE RETURN 'other';
    END IF;
END;
$$;

-- ── Trigger: auto-set file_type from mime_type on insert ──
CREATE OR REPLACE FUNCTION trg_set_file_type()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.file_type IS NULL AND NEW.mime_type IS NOT NULL THEN
        NEW.file_type := get_file_type_from_mime(NEW.mime_type);
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_file_type_on_insert ON file_records;
CREATE TRIGGER set_file_type_on_insert
    BEFORE INSERT OR UPDATE ON file_records
    FOR EACH ROW EXECUTE FUNCTION trg_set_file_type();

-- ── Trigger: auto-update quota usage on file insert/delete ──
CREATE OR REPLACE FUNCTION trg_update_quota_on_file()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO storage_quotas (entity_type, entity_id, used_bytes, file_count, last_calculated_at)
        VALUES (COALESCE(NEW.portal, 'admin'), COALESCE(NEW.portal, 'admin'), COALESCE(NEW.file_size, 0), 1, NOW())
        ON CONFLICT (entity_type, entity_id)
        DO UPDATE SET
            used_bytes = storage_quotas.used_bytes + COALESCE(NEW.file_size, 0),
            file_count = storage_quotas.file_count + 1,
            last_calculated_at = NOW(),
            updated_at = NOW();
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE storage_quotas
        SET used_bytes = GREATEST(0, used_bytes - COALESCE(OLD.file_size, 0)),
            file_count = GREATEST(0, file_count - 1),
            last_calculated_at = NOW(),
            updated_at = NOW()
        WHERE entity_type = COALESCE(OLD.portal, 'admin')
          AND entity_id = COALESCE(OLD.portal, 'admin');
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS update_quota_on_file_change ON file_records;
CREATE TRIGGER update_quota_on_file_change
    AFTER INSERT OR DELETE ON file_records
    FOR EACH ROW EXECUTE FUNCTION trg_update_quota_on_file();

-- ── Seed default quotas ──
INSERT INTO storage_quotas (entity_type, entity_id, quota_bytes) VALUES
    ('portal', 'admin', 5368709120),     -- 5 GB
    ('portal', 'staff', 2147483648),     -- 2 GB
    ('portal', 'client', 1073741824),    -- 1 GB
    ('portal', 'investor', 1073741824),  -- 1 GB
    ('portal', 'agent', 1073741824)      -- 1 GB
ON CONFLICT (entity_type, entity_id) DO NOTHING;
