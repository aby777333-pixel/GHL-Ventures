-- ============================================================
-- 034 · FIX chat session last_message_at NULL issue
--
-- Problems:
--   1. create_visitor_chat_session never sets last_message_at → NULL
--   2. send_visitor_chat_message never updates session's last_message_at
--   3. get_active_chat_sessions_staff orders by last_message_at DESC,
--      so NULL sessions (newest!) sink to the bottom / become invisible
--
-- Fixes:
--   1. Set last_message_at = NOW() on session creation
--   2. After inserting a message, update the parent session's last_message_at
--   3. Use COALESCE(last_message_at, created_at) + NULLS FIRST in ORDER BY
--   4. Backfill any existing sessions that have NULL last_message_at
-- ============================================================

-- ── 1. Backfill existing NULL rows ──
UPDATE chat_sessions
SET last_message_at = COALESCE(
  (SELECT MAX(cm.created_at) FROM chat_messages cm WHERE cm.session_id = chat_sessions.id),
  created_at
)
WHERE last_message_at IS NULL;

-- ── 2. Recreate create_visitor_chat_session — now sets last_message_at ──
DROP FUNCTION IF EXISTS create_visitor_chat_session(text,text,text,uuid,text,text);
CREATE OR REPLACE FUNCTION create_visitor_chat_session(
  p_visitor_id TEXT,
  p_visitor_name TEXT,
  p_visitor_email TEXT DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL,
  p_channel TEXT DEFAULT 'web_chat'
)
RETURNS TABLE (
  id UUID,
  visitor_id TEXT,
  visitor_name TEXT,
  visitor_email TEXT,
  client_id UUID,
  assigned_rep_id UUID,
  status TEXT,
  channel TEXT,
  priority INTEGER,
  page_url TEXT,
  assigned_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  csat_rating TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
  INSERT INTO chat_sessions (
    visitor_id, visitor_name, visitor_email, client_id,
    page_url, channel, status, last_message_at
  )
  VALUES (
    p_visitor_id, p_visitor_name, p_visitor_email, p_client_id,
    p_page_url, p_channel, 'waiting', NOW()
  )
  RETURNING
    chat_sessions.id, chat_sessions.visitor_id, chat_sessions.visitor_name,
    chat_sessions.visitor_email, chat_sessions.client_id, chat_sessions.assigned_rep_id,
    chat_sessions.status, chat_sessions.channel, chat_sessions.priority,
    chat_sessions.page_url, chat_sessions.assigned_at, chat_sessions.first_response_at,
    chat_sessions.resolved_at, chat_sessions.last_message_at, chat_sessions.csat_rating,
    chat_sessions.metadata, chat_sessions.created_at, chat_sessions.updated_at;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── 3. Recreate send_visitor_chat_message — now updates session last_message_at ──
CREATE OR REPLACE FUNCTION send_visitor_chat_message(
  p_session_id UUID,
  p_sender_type TEXT,
  p_sender_name TEXT DEFAULT NULL,
  p_message TEXT DEFAULT ''
)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  sender_type TEXT,
  sender_id UUID,
  sender_name TEXT,
  message TEXT,
  attachments TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
  -- Update the parent session's last_message_at timestamp
  UPDATE chat_sessions SET last_message_at = NOW(), updated_at = NOW()
  WHERE chat_sessions.id = p_session_id;

  -- Insert the message and return it
  INSERT INTO chat_messages (session_id, sender_type, sender_name, message)
  VALUES (p_session_id, p_sender_type, p_sender_name, p_message)
  RETURNING
    chat_messages.id, chat_messages.session_id, chat_messages.sender_type,
    chat_messages.sender_id, chat_messages.sender_name, chat_messages.message,
    chat_messages.attachments, chat_messages.metadata, chat_messages.created_at;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── 4. Recreate get_active_chat_sessions_staff — NULLS FIRST + COALESCE ──
DROP FUNCTION IF EXISTS get_active_chat_sessions_staff(uuid);
CREATE OR REPLACE FUNCTION get_active_chat_sessions_staff(
  p_rep_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  visitor_id TEXT,
  visitor_name TEXT,
  visitor_email TEXT,
  client_id UUID,
  assigned_rep_id UUID,
  status TEXT,
  channel TEXT,
  priority INTEGER,
  page_url TEXT,
  assigned_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  csat_rating TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
  SELECT cs.id, cs.visitor_id, cs.visitor_name, cs.visitor_email,
         cs.client_id, cs.assigned_rep_id, cs.status, cs.channel,
         cs.priority, cs.page_url, cs.assigned_at, cs.first_response_at,
         cs.resolved_at, cs.last_message_at, cs.csat_rating,
         cs.metadata, cs.created_at, cs.updated_at
  FROM chat_sessions cs
  WHERE cs.status IN ('waiting', 'assigned', 'active', 'queued')
    AND (p_rep_id IS NULL OR cs.assigned_rep_id = p_rep_id)
  ORDER BY cs.priority DESC, COALESCE(cs.last_message_at, cs.created_at) DESC NULLS FIRST;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
