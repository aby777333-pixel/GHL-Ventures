-- ============================================================
-- 016 · FILE REPOSITORY (folders, versions, audit, shares)
-- Extends the existing documents table (008) with a full
-- hierarchical folder system, version tracking, audit log,
-- and document sharing capabilities.
-- ============================================================

-- ── Folders ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Folder',
    color TEXT DEFAULT '#6B7280',
    sort_order INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_path ON folders(path);
CREATE INDEX IF NOT EXISTS idx_folders_system ON folders(is_system) WHERE is_system = TRUE;

-- ── Document Versions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    change_summary TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_doc_versions_doc ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_versions_created ON document_versions(created_at DESC);

-- ── Document Audit Log ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    performed_by UUID REFERENCES auth.users(id),
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_audit_doc ON document_audit_log(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_audit_action ON document_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_doc_audit_created ON document_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_audit_user ON document_audit_log(performed_by);

-- ── Document Shares ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    shared_with_user UUID REFERENCES auth.users(id),
    shared_with_role TEXT,
    permission TEXT DEFAULT 'view' CHECK (permission IN ('view','download','edit')),
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_shares_doc ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_shares_user ON document_shares(shared_with_user);

-- ── Extend documents table ──────────────────────────────────
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_starred ON documents(starred) WHERE starred = TRUE;

-- ── RLS Policies ────────────────────────────────────────────

-- Folders: admin full access, staff read
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "folders_admin_all" ON folders FOR ALL USING (is_admin_or_above());
CREATE POLICY "folders_staff_read" ON folders FOR SELECT USING (get_user_role() IN ('staff'));

-- Document Versions: same access as parent document
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_versions_admin_all" ON document_versions FOR ALL USING (is_admin_or_above());
CREATE POLICY "doc_versions_staff_read" ON document_versions FOR SELECT USING (get_user_role() IN ('staff'));

-- Audit Log: admin only
ALTER TABLE document_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_audit_admin_only" ON document_audit_log FOR ALL USING (is_admin_or_above());

-- Document Shares: admin full, staff can view own shares
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_shares_admin_all" ON document_shares FOR ALL USING (is_admin_or_above());
CREATE POLICY "doc_shares_user_own" ON document_shares FOR SELECT USING (shared_with_user = auth.uid());

-- ── Default Folder Hierarchy Seed ───────────────────────────
-- (15 root folders + subfolders, matching the application mock data)
-- This seed data is inserted by the application mock layer when
-- Supabase is not configured. When running with Supabase,
-- execute this section manually or via a seed migration.

-- Root folders
INSERT INTO folders (id, name, slug, parent_id, path, description, icon, color, sort_order, is_system) VALUES
    ('00000000-0000-0000-0001-000000000001', 'Fund Documents', 'fund', NULL, '/fund', 'PPMs, NAV reports, capital calls, side letters', 'Briefcase', '#DC2626', 1, TRUE),
    ('00000000-0000-0000-0001-000000000002', 'Compliance & Regulatory', 'compliance', NULL, '/compliance', 'SEBI filings, AML/KYC master, RBI submissions', 'Shield', '#F59E0B', 2, TRUE),
    ('00000000-0000-0000-0001-000000000003', 'Client Documents', 'clients', NULL, '/clients', 'Per-client KYC, agreements, correspondence', 'Users', '#3B82F6', 3, TRUE),
    ('00000000-0000-0000-0001-000000000004', 'Employee Records', 'employees', NULL, '/employees', 'Offer letters, ID proofs, appraisals, exits', 'UserCircle', '#10B981', 4, TRUE),
    ('00000000-0000-0000-0001-000000000005', 'Financial Records', 'financial', NULL, '/financial', 'Invoices, receipts, tax filings, bank statements', 'IndianRupee', '#8B5CF6', 5, TRUE),
    ('00000000-0000-0000-0001-000000000006', 'Marketing Assets', 'marketing', NULL, '/marketing', 'Brochures, pitch decks, ad creatives, brand guidelines', 'Megaphone', '#EC4899', 6, TRUE),
    ('00000000-0000-0000-0001-000000000007', 'Legal', 'legal', NULL, '/legal', 'Contracts, MOUs, NDAs, litigation files', 'Scale', '#6366F1', 7, TRUE),
    ('00000000-0000-0000-0001-000000000008', 'Board & Governance', 'board', NULL, '/board', 'Board minutes, resolutions, committee agendas', 'Building2', '#D4AF37', 8, TRUE),
    ('00000000-0000-0000-0001-000000000009', 'Internal Operations', 'internal', NULL, '/internal', 'SOPs, templates, training materials, handbooks', 'Settings', '#06B6D4', 9, TRUE),
    ('00000000-0000-0000-0001-000000000010', 'Reports & Analytics', 'reports', NULL, '/reports', 'Generated reports, scheduled exports, custom analytics', 'FileBarChart', '#F97316', 10, TRUE),
    ('00000000-0000-0000-0001-000000000011', 'Sales & CRM', 'sales', NULL, '/sales', 'Proposals, term sheets, deal memos', 'TrendingUp', '#EF4444', 11, TRUE),
    ('00000000-0000-0000-0001-000000000012', 'Technology', 'technology', NULL, '/technology', 'Architecture docs, API specs, security audits', 'Code', '#14B8A6', 12, TRUE),
    ('00000000-0000-0000-0001-000000000013', 'Insurance & Risk', 'insurance', NULL, '/insurance', 'Policies, claims, coverage documentation', 'ShieldCheck', '#A855F7', 13, TRUE),
    ('00000000-0000-0000-0001-000000000014', 'Correspondence', 'correspondence', NULL, '/correspondence', 'Regulatory letters, client communications, notices', 'Mail', '#0EA5E9', 14, TRUE),
    ('00000000-0000-0000-0001-000000000015', 'Archives', 'archives', NULL, '/archives', 'Closed funds, former clients, legacy records', 'Archive', '#78716C', 15, TRUE)
ON CONFLICT DO NOTHING;
