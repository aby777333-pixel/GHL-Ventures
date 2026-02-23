-- ============================================================
-- 008 · DOCUMENTS (polymorphic)
-- ============================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    mime_type TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('kyc','agreement','report','invoice','compliance','marketing','general')),
    entity_type TEXT,
    entity_id UUID,
    tags TEXT[],
    version INTEGER DEFAULT 1,
    is_template BOOLEAN DEFAULT FALSE,
    is_confidential BOOLEAN DEFAULT FALSE,
    access_level TEXT DEFAULT 'internal' CHECK (access_level IN ('public','internal','restricted','confidential')),
    uploaded_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_access ON documents(access_level);
CREATE INDEX idx_documents_created ON documents(created_at DESC);
