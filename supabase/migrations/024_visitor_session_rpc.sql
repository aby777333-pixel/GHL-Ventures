-- ============================================================
-- 024 · CREATE SESSION + SEND MESSAGE RPCs for anonymous visitors
--
-- The insert works via RLS (WITH CHECK true) but the .select()
-- after insert fails because anonymous users can't SELECT.
-- These SECURITY DEFINER functions handle the full round-trip.
-- ============================================================

-- ── Create a chat session and return it ──
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
  INSERT INTO chat_sessions (visitor_id, visitor_name, visitor_email, client_id, page_url, channel, status)
  VALUES (p_visitor_id, p_visitor_name, p_visitor_email, p_client_id, p_page_url, p_channel, 'waiting')
  RETURNING
    chat_sessions.id, chat_sessions.visitor_id, chat_sessions.visitor_name,
    chat_sessions.visitor_email, chat_sessions.client_id, chat_sessions.assigned_rep_id,
    chat_sessions.status, chat_sessions.channel, chat_sessions.priority,
    chat_sessions.page_url, chat_sessions.assigned_at, chat_sessions.first_response_at,
    chat_sessions.resolved_at, chat_sessions.last_message_at, chat_sessions.csat_rating,
    chat_sessions.metadata, chat_sessions.created_at, chat_sessions.updated_at;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── Send a chat message and return it ──
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
  INSERT INTO chat_messages (session_id, sender_type, sender_name, message)
  VALUES (p_session_id, p_sender_type, p_sender_name, p_message)
  RETURNING
    chat_messages.id, chat_messages.session_id, chat_messages.sender_type,
    chat_messages.sender_id, chat_messages.sender_name, chat_messages.message,
    chat_messages.attachments, chat_messages.metadata, chat_messages.created_at;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── Resolve a chat session (visitor rating) ──
CREATE OR REPLACE FUNCTION resolve_visitor_chat_session(
  p_session_id UUID,
  p_rating TEXT DEFAULT NULL
)
RETURNS VOID AS $$
  UPDATE chat_sessions
  SET status = 'resolved',
      resolved_at = NOW(),
      csat_rating = p_rating
  WHERE id = p_session_id;
$$ LANGUAGE sql SECURITY DEFINER;
