-- ============================================================
-- 022 · CROSS-PORTAL WIRING — messages, tickets, tasks,
--       chat sessions, and chat messages for real-time
--       Client ↔ CS Dashboard ↔ Admin communication
-- ============================================================

-- ── Messages (Client ↔ RM secure messaging) ──
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    attachments TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_id);
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_read ON messages(to_id, read);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- ── Support Tickets (Client → CS → Admin) ──
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT NOT NULL UNIQUE,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting','escalated','resolved','closed')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    channel TEXT DEFAULT 'web',
    escalation_level INTEGER DEFAULT 0,
    csat_score INTEGER CHECK (csat_score BETWEEN 1 AND 5),
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_client ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at DESC);

-- ── Tasks (Internal staff task management) ──
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);

-- ── Chat Sessions (Website visitor / Client → CS Dashboard) ──
-- Tracks a live chat conversation between a visitor/client and a CS rep
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Visitor info (anonymous or authenticated)
    visitor_id TEXT,                                -- localStorage visitor id or auth user id
    visitor_name TEXT DEFAULT 'Visitor',
    visitor_email TEXT,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- set if authenticated client
    -- Assignment
    assigned_rep_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    -- Status & routing
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','assigned','active','resolved','closed','queued')),
    channel TEXT DEFAULT 'web_chat',
    priority INTEGER DEFAULT 0,                    -- higher = more urgent
    -- Metadata
    page_url TEXT,                                 -- page visitor was on when chat started
    user_agent TEXT,
    ip_address TEXT,
    -- Timestamps
    assigned_at TIMESTAMPTZ,
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    csat_rating TEXT CHECK (csat_rating IN ('Great','Okay','Poor')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_assigned ON chat_sessions(assigned_rep_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_visitor ON chat_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_client ON chat_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_msg ON chat_sessions(last_message_at DESC);

-- ── Chat Messages (individual messages within a chat session) ──
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor','agent','system','bot')),
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- null for anonymous visitors
    sender_name TEXT,
    message TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(session_id, created_at);

-- ── RM Request Queue (Client "Talk with RM" requests) ──
-- When a client clicks "Talk with your RM", a request is created here
-- and pushed to the top of the RM's queue
CREATE TABLE IF NOT EXISTS rm_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    rm_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,   -- resolved from client_assignments
    request_type TEXT DEFAULT 'chat' CHECK (request_type IN ('chat','call','video','callback')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','in_progress','completed','missed','cancelled')),
    priority INTEGER DEFAULT 5,                     -- 1=highest, 10=lowest
    notes TEXT,
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rm_requests_rm ON rm_requests(rm_id);
CREATE INDEX IF NOT EXISTS idx_rm_requests_client ON rm_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_rm_requests_status ON rm_requests(status);
CREATE INDEX IF NOT EXISTS idx_rm_requests_priority ON rm_requests(priority, created_at DESC);

-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rm_requests ENABLE ROW LEVEL SECURITY;

-- ── Messages policies ──
CREATE POLICY "messages_select_own" ON messages FOR SELECT
    USING (from_id = auth.uid() OR to_id = auth.uid() OR is_admin_or_above());

CREATE POLICY "messages_insert_own" ON messages FOR INSERT
    WITH CHECK (from_id = auth.uid());

CREATE POLICY "messages_update_recipient" ON messages FOR UPDATE
    USING (to_id = auth.uid() OR is_admin_or_above());

-- ── Tickets policies ──
CREATE POLICY "tickets_select" ON tickets FOR SELECT
    USING (
        client_id = auth.uid()
        OR assigned_to = auth.uid()
        OR is_admin_or_above()
        OR get_user_role() = 'staff'
    );

CREATE POLICY "tickets_insert" ON tickets FOR INSERT
    WITH CHECK (client_id = auth.uid() OR is_admin_or_above());

CREATE POLICY "tickets_update" ON tickets FOR UPDATE
    USING (
        assigned_to = auth.uid()
        OR is_admin_or_above()
        OR get_user_role() = 'staff'
    );

-- ── Tasks policies ──
CREATE POLICY "tasks_select" ON tasks FOR SELECT
    USING (assigned_to = auth.uid() OR assigned_by = auth.uid() OR is_admin_or_above());

CREATE POLICY "tasks_insert" ON tasks FOR INSERT
    WITH CHECK (is_admin_or_above() OR get_user_role() = 'staff');

CREATE POLICY "tasks_update" ON tasks FOR UPDATE
    USING (assigned_to = auth.uid() OR assigned_by = auth.uid() OR is_admin_or_above());

-- ── Chat Sessions policies ──
-- Reps see their assigned sessions; admins see all; anonymous insert allowed
CREATE POLICY "chat_sessions_select" ON chat_sessions FOR SELECT
    USING (
        client_id = auth.uid()
        OR assigned_rep_id = auth.uid()
        OR is_admin_or_above()
        OR get_user_role() = 'staff'
    );

CREATE POLICY "chat_sessions_insert" ON chat_sessions FOR INSERT
    WITH CHECK (true);  -- anonymous visitors can create sessions

CREATE POLICY "chat_sessions_update" ON chat_sessions FOR UPDATE
    USING (
        assigned_rep_id = auth.uid()
        OR is_admin_or_above()
        OR get_user_role() = 'staff'
    );

-- ── Chat Messages policies ──
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions cs
            WHERE cs.id = chat_messages.session_id
            AND (
                cs.client_id = auth.uid()
                OR cs.assigned_rep_id = auth.uid()
                OR is_admin_or_above()
                OR get_user_role() = 'staff'
            )
        )
    );

CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT
    WITH CHECK (true);  -- visitors and agents can both send messages

-- ── RM Requests policies ──
CREATE POLICY "rm_requests_select" ON rm_requests FOR SELECT
    USING (
        client_id = auth.uid()
        OR rm_id = auth.uid()
        OR is_admin_or_above()
        OR get_user_role() = 'staff'
    );

CREATE POLICY "rm_requests_insert" ON rm_requests FOR INSERT
    WITH CHECK (client_id = auth.uid() OR is_admin_or_above());

CREATE POLICY "rm_requests_update" ON rm_requests FOR UPDATE
    USING (rm_id = auth.uid() OR is_admin_or_above());

-- ════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ════════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_messages_updated') THEN
        CREATE TRIGGER trg_messages_updated BEFORE UPDATE ON messages
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tickets_updated') THEN
        CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON tickets
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tasks_updated') THEN
        CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_chat_sessions_updated') THEN
        CREATE TRIGGER trg_chat_sessions_updated BEFORE UPDATE ON chat_sessions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_rm_requests_updated') THEN
        CREATE TRIGGER trg_rm_requests_updated BEFORE UPDATE ON rm_requests
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Auto-update chat_sessions.last_message_at when a new chat_message is inserted
CREATE OR REPLACE FUNCTION update_chat_session_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET last_message_at = NEW.created_at,
        status = CASE
            WHEN status = 'waiting' AND NEW.sender_type = 'agent' THEN 'active'
            ELSE status
        END,
        first_response_at = CASE
            WHEN first_response_at IS NULL AND NEW.sender_type = 'agent' THEN NEW.created_at
            ELSE first_response_at
        END
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_chat_message_update_session') THEN
        CREATE TRIGGER trg_chat_message_update_session
            AFTER INSERT ON chat_messages
            FOR EACH ROW EXECUTE FUNCTION update_chat_session_last_message();
    END IF;
END $$;

-- ════════════════════════════════════════════════════════════════
-- REALTIME — Enable Supabase Realtime on key tables
-- ════════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE rm_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
