-- LIVE CHAT ENHANCEMENT - Staff Presence & Canned Responses - Migration 033

CREATE TABLE IF NOT EXISTS staff_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  display_name TEXT, role TEXT, active_chats INT DEFAULT 0, max_chats INT DEFAULT 5, last_seen TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcut TEXT UNIQUE NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, category TEXT,
  created_by UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_presence_status ON staff_presence(status);
CREATE INDEX IF NOT EXISTS idx_canned_responses_category ON canned_responses(category);

ALTER TABLE staff_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage own presence" ON staff_presence FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Auth see presence" ON staff_presence FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff read canned" ON canned_responses FOR SELECT USING (auth.role() = 'authenticated');

ALTER PUBLICATION supabase_realtime ADD TABLE staff_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE canned_responses;


-- Add Missing Columns to chat_sessions
DO $block$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'visitor_phone') THEN ALTER TABLE chat_sessions ADD COLUMN visitor_phone TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'referrer') THEN ALTER TABLE chat_sessions ADD COLUMN referrer TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'portal') THEN ALTER TABLE chat_sessions ADD COLUMN portal TEXT DEFAULT 'website'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'user_agent') THEN ALTER TABLE chat_sessions ADD COLUMN user_agent TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'csat_score') THEN ALTER TABLE chat_sessions ADD COLUMN csat_score INT CHECK (csat_score BETWEEN 1 AND 5); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'csat_feedback') THEN ALTER TABLE chat_sessions ADD COLUMN csat_feedback TEXT; END IF;
END $block$;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_portal ON chat_sessions(portal);

-- Seed Canned Responses
INSERT INTO canned_responses (shortcut, title, message, category) VALUES
  ('/greet', 'Greeting', 'Hello! Welcome to GHL India Ventures. How can I assist you today?', 'General'),
  ('/wait', 'Ask to Wait', 'Thank you for your patience. Let me look into this for you right away.', 'General'),
  ('/rm', 'Transfer to RM', 'I will connect you with one of our Relationship Managers. One moment please.', 'Transfer'),
  ('/callback', 'Offer Callback', 'Would you prefer a callback? Share your number and preferred time.', 'General'),
  ('/close', 'Close Chat', 'Thank you for reaching out to GHL India Ventures. Anything else?', 'Closing'),
  ('/invest', 'Investment Info', 'GHL India Ventures is a SEBI-registered Category II AIF. Want to know more?', 'Investment'),
  ('/kyc', 'KYC Info', 'To begin investing, you will need to complete our KYC process.', 'Onboarding'),
  ('/hold', 'Please Hold', 'Thank you for your patience. I am looking into this. Please stay on chat.', 'General'),
  ('/aif', 'AIF Overview', 'We manage SEBI-registered AIFs focused on real estate and venture capital.', 'Investment'),
  ('/fee', 'Fee Structure', 'Management Fee: 2% p.a. Performance Fee: 20% above hurdle. Entry Load: Nil.', 'Investment'),
  ('/nri', 'NRI Investment', 'NRI investors can invest through NRE/NRO accounts with FEMA docs.', 'Onboarding'),
  ('/risk', 'Risk Disclaimer', 'Investments in AIFs are subject to market risks. Read the PPM carefully.', 'Compliance')
ON CONFLICT (shortcut) DO NOTHING;

-- RPC: Upsert Staff Presence
CREATE OR REPLACE FUNCTION upsert_staff_presence(p_user_id UUID, p_status TEXT DEFAULT 'online', p_display_name TEXT DEFAULT NULL, p_role TEXT DEFAULT NULL)
RETURNS VOID AS $fn$
BEGIN
  INSERT INTO staff_presence (user_id, status, display_name, role, last_seen) VALUES (p_user_id, p_status, p_display_name, p_role, NOW())
  ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status, display_name = COALESCE(EXCLUDED.display_name, staff_presence.display_name), role = COALESCE(EXCLUDED.role, staff_presence.role), last_seen = NOW();
END; $fn$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Update Staff Status
CREATE OR REPLACE FUNCTION update_staff_status(p_user_id UUID, p_status TEXT) RETURNS VOID AS $fn$
BEGIN UPDATE staff_presence SET status = p_status, last_seen = NOW() WHERE user_id = p_user_id;
END; $fn$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Staff Heartbeat
CREATE OR REPLACE FUNCTION staff_heartbeat(p_user_id UUID) RETURNS VOID AS $fn$
BEGIN UPDATE staff_presence SET last_seen = NOW() WHERE user_id = p_user_id;
END; $fn$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get Online Staff
CREATE OR REPLACE FUNCTION get_online_staff() RETURNS TABLE(user_id UUID, display_name TEXT, role TEXT, status TEXT, active_chats INT, max_chats INT) AS $fn$
BEGIN RETURN QUERY SELECT sp.user_id, sp.display_name, sp.role, sp.status, sp.active_chats, sp.max_chats FROM staff_presence sp WHERE sp.status IN ('online', 'away') AND sp.last_seen > NOW() - INTERVAL '5 minutes' ORDER BY sp.active_chats ASC;
END; $fn$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get Canned Responses
CREATE OR REPLACE FUNCTION get_canned_responses() RETURNS TABLE(id UUID, shortcut TEXT, title TEXT, message TEXT, category TEXT) AS $fn$
BEGIN RETURN QUERY SELECT cr.id, cr.shortcut, cr.title, cr.message, cr.category FROM canned_responses cr ORDER BY cr.category, cr.shortcut;
END; $fn$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Save CSAT Rating
CREATE OR REPLACE FUNCTION save_csat_rating(p_session_id UUID, p_score INT, p_feedback TEXT DEFAULT NULL) RETURNS VOID AS $fn$
BEGIN UPDATE chat_sessions SET csat_score = p_score, csat_feedback = p_feedback, resolved_at = COALESCE(resolved_at, NOW()) WHERE id = p_session_id;
END; $fn$ LANGUAGE plpgsql SECURITY DEFINER;
