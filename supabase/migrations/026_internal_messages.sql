-- ============================================================
-- 026 · INTERNAL MESSAGES — Cross-portal internal chat
-- ============================================================

CREATE TABLE IF NOT EXISTS internal_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id TEXT NOT NULL,
    user_id TEXT,
    user_name TEXT NOT NULL,
    user_role TEXT DEFAULT 'staff',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast channel-based queries
CREATE INDEX IF NOT EXISTS idx_internal_messages_channel ON internal_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_internal_messages_created ON internal_messages(created_at DESC);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages;

-- RLS: Allow authenticated users to read and insert
ALTER TABLE internal_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read internal messages"
    ON internal_messages FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can send internal messages"
    ON internal_messages FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Also allow anon read (for build/static export compatibility)
CREATE POLICY "Anon can read internal messages"
    ON internal_messages FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Anon can insert internal messages"
    ON internal_messages FOR INSERT
    TO anon
    WITH CHECK (true);
