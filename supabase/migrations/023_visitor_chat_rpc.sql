-- ============================================================
-- 023 · VISITOR CHAT RPC — Bypass RLS for anonymous visitors
--
-- Anonymous website visitors can't pass RLS checks (auth.uid()
-- is null). These SECURITY DEFINER functions let visitors read
-- their own chat messages using their session_id / visitor_id.
-- ============================================================

-- ── Get messages for a chat session (visitor-safe) ──
CREATE OR REPLACE FUNCTION get_visitor_chat_messages(p_session_id UUID)
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
  SELECT id, session_id, sender_type, sender_id, sender_name,
         message, attachments, metadata, created_at
  FROM chat_messages
  WHERE chat_messages.session_id = p_session_id
  ORDER BY created_at ASC;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Get active session for a visitor by visitor_id ──
CREATE OR REPLACE FUNCTION get_visitor_active_session(p_visitor_id TEXT)
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
  SELECT id, visitor_id, visitor_name, visitor_email, client_id,
         assigned_rep_id, status, channel, priority, page_url,
         assigned_at, first_response_at, resolved_at, last_message_at,
         csat_rating, metadata, created_at, updated_at
  FROM chat_sessions
  WHERE chat_sessions.visitor_id = p_visitor_id
    AND chat_sessions.status IN ('waiting', 'assigned', 'active', 'queued')
  ORDER BY created_at DESC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Get new messages since a timestamp (for polling) ──
CREATE OR REPLACE FUNCTION get_visitor_new_messages(
  p_session_id UUID,
  p_since TIMESTAMPTZ
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
  SELECT id, session_id, sender_type, sender_id, sender_name,
         message, attachments, metadata, created_at
  FROM chat_messages
  WHERE chat_messages.session_id = p_session_id
    AND chat_messages.created_at > p_since
    AND chat_messages.sender_type IN ('agent', 'system')
  ORDER BY created_at ASC;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
