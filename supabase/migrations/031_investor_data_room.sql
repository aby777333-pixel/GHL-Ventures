-- ============================================================
-- 031 · INVESTOR DATA ROOM
-- Hierarchical folder structure for the Investor Data Room,
-- RLS policies for role-based access, and a helper function
-- to grant investor access to specific folders.
-- ============================================================

-- ── 1. Create folder_access table for investor-level folder permissions ──
CREATE TABLE IF NOT EXISTS folder_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'download')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(folder_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_folder_access_folder ON folder_access(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_access_user ON folder_access(user_id);

ALTER TABLE folder_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "folder_access_admin_all"
    ON folder_access FOR ALL
    USING (is_admin_or_above());

CREATE POLICY "folder_access_user_own"
    ON folder_access FOR SELECT
    USING (user_id = auth.uid());

-- ── 2. Insert Investor Data Room folder hierarchy ────────────────────────
DO $$
DECLARE
    v_root_id        UUID;
    v_fund_overview   UUID;
    v_regulatory      UUID;
    v_fund_docs       UUID;
    v_portfolio       UUID;
    v_performance     UUID;
    v_communications  UUID;
    v_media           UUID;
BEGIN
    -- ── Root: Investor Data Room ──
    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order, is_system)
    VALUES (
        'Investor Data Room',
        'investor-data-room',
        NULL,
        '/investor-data-room',
        'Secure data room for investor due diligence and fund documentation',
        'Building2',
        '#D0021B',
        20,
        TRUE
    )
    ON CONFLICT (parent_id, slug) DO NOTHING
    RETURNING id INTO v_root_id;

    -- If the root already existed, fetch its id
    IF v_root_id IS NULL THEN
        SELECT id INTO v_root_id FROM folders
        WHERE slug = 'investor-data-room' AND parent_id IS NULL;
    END IF;

    -- ── 01 Fund Overview ──
    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order, is_system)
    VALUES (
        '01 Fund Overview',
        '01-fund-overview',
        v_root_id,
        '/investor-data-room/01-fund-overview',
        'Fund pitch materials, executive summaries, and investment strategy documents',
        'Briefcase',
        '#2563EB',
        1,
        TRUE
    )
    ON CONFLICT (parent_id, slug) DO NOTHING
    RETURNING id INTO v_fund_overview;

    IF v_fund_overview IS NULL THEN
        SELECT id INTO v_fund_overview FROM folders
        WHERE slug = '01-fund-overview' AND parent_id = v_root_id;
    END IF;

    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order)
    VALUES
        ('Pitch Deck', 'pitch-deck', v_fund_overview, '/investor-data-room/01-fund-overview/pitch-deck', 'Fund pitch decks and presentations', 'FileText', '#2563EB', 1),
        ('Executive Summary', 'executive-summary', v_fund_overview, '/investor-data-room/01-fund-overview/executive-summary', 'Executive summary documents', 'FileText', '#2563EB', 2),
        ('Investment Strategy', 'investment-strategy', v_fund_overview, '/investor-data-room/01-fund-overview/investment-strategy', 'Investment strategy and thesis documents', 'FileText', '#2563EB', 3)
    ON CONFLICT (parent_id, slug) DO NOTHING;

    -- ── 02 Regulatory ──
    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order, is_system)
    VALUES (
        '02 Regulatory',
        '02-regulatory',
        v_root_id,
        '/investor-data-room/02-regulatory',
        'SEBI registration, compliance documents, and legal structure',
        'Shield',
        '#DC2626',
        2,
        TRUE
    )
    ON CONFLICT (parent_id, slug) DO NOTHING
    RETURNING id INTO v_regulatory;

    IF v_regulatory IS NULL THEN
        SELECT id INTO v_regulatory FROM folders
        WHERE slug = '02-regulatory' AND parent_id = v_root_id;
    END IF;

    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order)
    VALUES
        ('SEBI Registration', 'sebi-registration', v_regulatory, '/investor-data-room/02-regulatory/sebi-registration', 'SEBI registration and license documents', 'FileText', '#DC2626', 1),
        ('Compliance Documents', 'compliance-documents', v_regulatory, '/investor-data-room/02-regulatory/compliance-documents', 'Regulatory compliance documentation', 'FileText', '#DC2626', 2),
        ('Legal Structure', 'legal-structure', v_regulatory, '/investor-data-room/02-regulatory/legal-structure', 'Fund legal structure and entity documents', 'FileText', '#DC2626', 3)
    ON CONFLICT (parent_id, slug) DO NOTHING;

    -- ── 03 Fund Documents ──
    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order, is_system)
    VALUES (
        '03 Fund Documents',
        '03-fund-documents',
        v_root_id,
        '/investor-data-room/03-fund-documents',
        'PPM, subscription agreements, and term sheets',
        'FileText',
        '#7C3AED',
        3,
        TRUE
    )
    ON CONFLICT (parent_id, slug) DO NOTHING
    RETURNING id INTO v_fund_docs;

    IF v_fund_docs IS NULL THEN
        SELECT id INTO v_fund_docs FROM folders
        WHERE slug = '03-fund-documents' AND parent_id = v_root_id;
    END IF;

    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order)
    VALUES
        ('Private Placement Memorandum', 'private-placement-memorandum', v_fund_docs, '/investor-data-room/03-fund-documents/private-placement-memorandum', 'PPM and offering documents', 'FileText', '#7C3AED', 1),
        ('Subscription Agreement', 'subscription-agreement', v_fund_docs, '/investor-data-room/03-fund-documents/subscription-agreement', 'Investor subscription agreements', 'FileText', '#7C3AED', 2),
        ('Term Sheets', 'term-sheets', v_fund_docs, '/investor-data-room/03-fund-documents/term-sheets', 'Investment term sheets', 'FileText', '#7C3AED', 3)
    ON CONFLICT (parent_id, slug) DO NOTHING;

    -- ── 04 Portfolio Assets ──
    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order, is_system)
    VALUES (
        '04 Portfolio Assets',
        '04-portfolio-assets',
        v_root_id,
        '/investor-data-room/04-portfolio-assets',
        'Asset profiles, due diligence reports, and financial models',
        'BarChart3',
        '#059669',
        4,
        TRUE
    )
    ON CONFLICT (parent_id, slug) DO NOTHING
    RETURNING id INTO v_portfolio;

    IF v_portfolio IS NULL THEN
        SELECT id INTO v_portfolio FROM folders
        WHERE slug = '04-portfolio-assets' AND parent_id = v_root_id;
    END IF;

    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order)
    VALUES
        ('Asset Profiles', 'asset-profiles', v_portfolio, '/investor-data-room/04-portfolio-assets/asset-profiles', 'Individual asset and company profiles', 'FileText', '#059669', 1),
        ('Due Diligence', 'due-diligence', v_portfolio, '/investor-data-room/04-portfolio-assets/due-diligence', 'Due diligence reports and findings', 'FileText', '#059669', 2),
        ('Financial Models', 'financial-models', v_portfolio, '/investor-data-room/04-portfolio-assets/financial-models', 'Financial projections and valuation models', 'FileText', '#059669', 3)
    ON CONFLICT (parent_id, slug) DO NOTHING;

    -- ── 05 Performance Reports ──
    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order, is_system)
    VALUES (
        '05 Performance Reports',
        '05-performance-reports',
        v_root_id,
        '/investor-data-room/05-performance-reports',
        'Quarterly reports, annual reports, and NAV statements',
        'TrendingUp',
        '#F59E0B',
        5,
        TRUE
    )
    ON CONFLICT (parent_id, slug) DO NOTHING
    RETURNING id INTO v_performance;

    IF v_performance IS NULL THEN
        SELECT id INTO v_performance FROM folders
        WHERE slug = '05-performance-reports' AND parent_id = v_root_id;
    END IF;

    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order)
    VALUES
        ('Quarterly Reports', 'quarterly-reports', v_performance, '/investor-data-room/05-performance-reports/quarterly-reports', 'Quarterly fund performance reports', 'FileText', '#F59E0B', 1),
        ('Annual Reports', 'annual-reports', v_performance, '/investor-data-room/05-performance-reports/annual-reports', 'Annual fund reports and audited financials', 'FileText', '#F59E0B', 2),
        ('NAV Statements', 'nav-statements', v_performance, '/investor-data-room/05-performance-reports/nav-statements', 'Net Asset Value statements', 'FileText', '#F59E0B', 3)
    ON CONFLICT (parent_id, slug) DO NOTHING;

    -- ── 06 Investor Communications ──
    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order, is_system)
    VALUES (
        '06 Investor Communications',
        '06-investor-communications',
        v_root_id,
        '/investor-data-room/06-investor-communications',
        'Newsletters, announcements, and investor updates',
        'Mail',
        '#0891B2',
        6,
        TRUE
    )
    ON CONFLICT (parent_id, slug) DO NOTHING
    RETURNING id INTO v_communications;

    IF v_communications IS NULL THEN
        SELECT id INTO v_communications FROM folders
        WHERE slug = '06-investor-communications' AND parent_id = v_root_id;
    END IF;

    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order)
    VALUES
        ('Newsletters', 'newsletters', v_communications, '/investor-data-room/06-investor-communications/newsletters', 'Periodic investor newsletters', 'FileText', '#0891B2', 1),
        ('Announcements', 'announcements', v_communications, '/investor-data-room/06-investor-communications/announcements', 'Important fund announcements', 'FileText', '#0891B2', 2),
        ('Investor Updates', 'investor-updates', v_communications, '/investor-data-room/06-investor-communications/investor-updates', 'General investor update communications', 'FileText', '#0891B2', 3)
    ON CONFLICT (parent_id, slug) DO NOTHING;

    -- ── 07 Media Resources ──
    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order, is_system)
    VALUES (
        '07 Media Resources',
        '07-media-resources',
        v_root_id,
        '/investor-data-room/07-media-resources',
        'Brand assets, press releases, and marketing materials',
        'Image',
        '#EC4899',
        7,
        TRUE
    )
    ON CONFLICT (parent_id, slug) DO NOTHING
    RETURNING id INTO v_media;

    IF v_media IS NULL THEN
        SELECT id INTO v_media FROM folders
        WHERE slug = '07-media-resources' AND parent_id = v_root_id;
    END IF;

    INSERT INTO folders (name, slug, parent_id, path, description, icon, color, sort_order)
    VALUES
        ('Brand Assets', 'brand-assets', v_media, '/investor-data-room/07-media-resources/brand-assets', 'Logos, brand guidelines, and visual identity assets', 'FileText', '#EC4899', 1),
        ('Press Releases', 'press-releases', v_media, '/investor-data-room/07-media-resources/press-releases', 'Official press releases and media statements', 'FileText', '#EC4899', 2),
        ('Marketing Materials', 'marketing-materials', v_media, '/investor-data-room/07-media-resources/marketing-materials', 'Marketing collateral and promotional materials', 'FileText', '#EC4899', 3)
    ON CONFLICT (parent_id, slug) DO NOTHING;

    RAISE NOTICE 'Investor Data Room folder hierarchy created successfully';
END $$;

-- ── 3. Additional RLS policy: client/investor read on folders via folder_access ──
-- Drop existing policy if re-running (safe for idempotency)
DROP POLICY IF EXISTS "folders_client_data_room_read" ON folders;

CREATE POLICY "folders_client_data_room_read"
    ON folders FOR SELECT
    USING (
        get_user_role() = 'client'
        AND (
            -- Allow access to the folder itself if granted
            EXISTS (
                SELECT 1 FROM folder_access fa
                WHERE fa.folder_id = folders.id
                  AND fa.user_id = auth.uid()
                  AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
            )
            -- Allow access to parent folders in the path (so the tree renders)
            OR EXISTS (
                SELECT 1 FROM folder_access fa
                JOIN folders granted ON granted.id = fa.folder_id
                WHERE fa.user_id = auth.uid()
                  AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
                  AND granted.path LIKE folders.path || '/%'
            )
            -- Allow access to child folders of granted folders
            OR EXISTS (
                SELECT 1 FROM folder_access fa
                JOIN folders granted ON granted.id = fa.folder_id
                WHERE fa.user_id = auth.uid()
                  AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
                  AND folders.path LIKE granted.path || '/%'
            )
        )
    );

-- ── 4. RLS policy: client/investor read on documents in accessible folders ──
DROP POLICY IF EXISTS "documents_client_data_room_read" ON documents;

CREATE POLICY "documents_client_data_room_read"
    ON documents FOR SELECT
    USING (
        get_user_role() = 'client'
        AND folder_id IS NOT NULL
        AND (
            -- Direct folder access
            EXISTS (
                SELECT 1 FROM folder_access fa
                WHERE fa.folder_id = documents.folder_id
                  AND fa.user_id = auth.uid()
                  AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
            )
            -- Or access via document_shares (existing mechanism)
            OR EXISTS (
                SELECT 1 FROM document_shares ds
                WHERE ds.document_id = documents.id
                  AND ds.shared_with_user = auth.uid()
                  AND (ds.expires_at IS NULL OR ds.expires_at > NOW())
            )
        )
    );

-- ── 5. Helper function: grant investor access to data room folders ────────
CREATE OR REPLACE FUNCTION grant_investor_data_room_access(
    p_investor_id UUID,
    p_folder_ids UUID[],
    p_permission TEXT DEFAULT 'view',
    p_granted_by UUID DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS SETOF folder_access
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
    v_folder_id UUID;
    v_all_folder_ids UUID[];
BEGIN
    -- Validate permission value
    IF p_permission NOT IN ('view', 'download') THEN
        RAISE EXCEPTION 'Invalid permission: %. Must be view or download.', p_permission;
    END IF;

    -- Validate investor exists and has client role
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = p_investor_id AND role = 'client'
    ) THEN
        RAISE EXCEPTION 'User % is not a registered client/investor.', p_investor_id;
    END IF;

    -- Collect all folder IDs including children of the specified folders
    -- so granting access to a parent also grants access to its subfolders
    SELECT array_agg(DISTINCT f.id) INTO v_all_folder_ids
    FROM folders f
    WHERE f.id = ANY(p_folder_ids)
       OR EXISTS (
           SELECT 1 FROM folders parent
           WHERE parent.id = ANY(p_folder_ids)
             AND f.path LIKE parent.path || '/%'
       );

    -- Insert folder_access records (with ON CONFLICT to handle re-grants)
    RETURN QUERY
    INSERT INTO folder_access (folder_id, user_id, permission, granted_by, expires_at)
    SELECT
        unnest(v_all_folder_ids),
        p_investor_id,
        p_permission,
        COALESCE(p_granted_by, auth.uid()),
        p_expires_at
    ON CONFLICT (folder_id, user_id) DO UPDATE SET
        permission = EXCLUDED.permission,
        granted_by = EXCLUDED.granted_by,
        expires_at = EXCLUDED.expires_at,
        granted_at = NOW()
    RETURNING *;
END;
$fn$;

-- Grant execute to authenticated users (admin will be enforced at app level)
GRANT EXECUTE ON FUNCTION grant_investor_data_room_access(UUID, UUID[], TEXT, UUID, TIMESTAMPTZ) TO authenticated;

-- ── 6. Helper function: revoke investor access from data room folders ─────
CREATE OR REPLACE FUNCTION revoke_investor_data_room_access(
    p_investor_id UUID,
    p_folder_ids UUID[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
BEGIN
    IF p_folder_ids IS NULL THEN
        -- Revoke all data room access for this investor
        DELETE FROM folder_access
        WHERE user_id = p_investor_id;
    ELSE
        -- Revoke access to specific folders and their children
        DELETE FROM folder_access
        WHERE user_id = p_investor_id
          AND (
              folder_id = ANY(p_folder_ids)
              OR EXISTS (
                  SELECT 1 FROM folders parent
                  WHERE parent.id = ANY(p_folder_ids)
                    AND EXISTS (
                        SELECT 1 FROM folders child
                        WHERE child.id = folder_access.folder_id
                          AND child.path LIKE parent.path || '/%'
                    )
              )
          );
    END IF;
END;
$fn$;

GRANT EXECUTE ON FUNCTION revoke_investor_data_room_access(UUID, UUID[]) TO authenticated;

-- ── 7. View: list investor data room access summary ──────────────────────
CREATE OR REPLACE VIEW investor_data_room_access AS
SELECT
    fa.user_id AS investor_id,
    p.full_name AS investor_name,
    p.email AS investor_email,
    f.id AS folder_id,
    f.name AS folder_name,
    f.path AS folder_path,
    fa.permission,
    fa.granted_at,
    fa.expires_at,
    gp.full_name AS granted_by_name
FROM folder_access fa
JOIN folders f ON f.id = fa.folder_id
JOIN profiles p ON p.id = fa.user_id
LEFT JOIN profiles gp ON gp.id = fa.granted_by
WHERE f.path LIKE '/investor-data-room%';
