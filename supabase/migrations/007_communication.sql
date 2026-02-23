-- ============================================================
-- 007 · COMMUNICATION — emails, calls, SMS, notifications
-- ============================================================

-- ── Emails ──
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_address TEXT NOT NULL,
    to_addresses TEXT[] NOT NULL,
    cc_addresses TEXT[],
    bcc_addresses TEXT[],
    subject TEXT NOT NULL,
    body TEXT,
    html_body TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','queued','sent','delivered','failed','bounced')),
    template_id TEXT,
    related_entity_type TEXT,
    related_entity_id UUID,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    sent_by UUID REFERENCES auth.users(id),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Call Logs ──
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID REFERENCES auth.users(id),
    contact_name TEXT,
    contact_phone TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
    duration_seconds INTEGER DEFAULT 0,
    outcome TEXT CHECK (outcome IN ('connected','no_answer','voicemail','busy','wrong_number','callback_requested')),
    notes TEXT,
    recording_url TEXT,
    related_entity_type TEXT,
    related_entity_id UUID,
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SMS Messages ──
CREATE TABLE sms_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_phone TEXT NOT NULL,
    from_phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','failed')),
    sent_by UUID REFERENCES auth.users(id),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    cost NUMERIC(8,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notifications ──
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('info','success','warning','error','action_required')),
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_emails_status ON emails(status);
CREATE INDEX idx_emails_sent_by ON emails(sent_by);
CREATE INDEX idx_emails_sent_at ON emails(sent_at DESC);
CREATE INDEX idx_emails_related ON emails(related_entity_type, related_entity_id);
CREATE INDEX idx_calls_caller ON calls(caller_id);
CREATE INDEX idx_calls_direction ON calls(direction);
CREATE INDEX idx_calls_started ON calls(started_at DESC);
CREATE INDEX idx_sms_status ON sms_messages(status);
CREATE INDEX idx_sms_sent_at ON sms_messages(sent_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
