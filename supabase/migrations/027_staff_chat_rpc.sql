-- ============================================================
-- 027 · STAFF CHAT RPCs + FIX auto_assign column references
--
-- staff_profiles has NO full_name or status column.
-- Name lives in profiles.full_name, active flag is is_active.
-- This migration fixes 025's auto_assign_visitor_chat and adds
-- new RPCs for CS Dashboard and RM transfer.
-- ============================================================

-- ── Fix: Recreate auto_assign_visitor_chat with correct columns ──
CREATE OR REPLACE FUNCTION auto_assign_visitor_chat(p_session_id UUID)
RETURNS UUID AS $$
DECLARE
  v_rep_user_id UUID;
BEGIN
  -- Find the CS rep with the fewest active sessions (least-busy first)
  -- Name comes from profiles table, active flag is is_active on staff_profiles
  SELECT sp.user_id
  INTO v_rep_user_id
  FROM staff_profiles sp
  WHERE sp.designation IN ('cs-agent', 'senior-cs-agent', 'cs-lead', 'relationship-manager')
    AND sp.is_active = TRUE
  ORDER BY (
    SELECT COUNT(*) FROM chat_sessions cs
    WHERE cs.assigned_rep_id = sp.user_id
      AND cs.status IN ('assigned', 'active')
  ) ASC
  LIMIT 1;

  IF v_rep_user_id IS NULL THEN
    -- No reps available — mark session as queued
    UPDATE chat_sessions SET status = 'queued' WHERE id = p_session_id;
    RETURN NULL;
  END IF;

  -- Assign the session to the rep
  UPDATE chat_sessions
  SET assigned_rep_id = v_rep_user_id,
      status = 'assigned',
      assigned_at = NOW()
  WHERE id = p_session_id;

  -- Create a notification for the assigned rep
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (
    v_rep_user_id,
    'action_required',
    'New Chat Assigned',
    'A website visitor is waiting for assistance.',
    '/staff/cs/chat',
    jsonb_build_object('session_id', p_session_id)
  );

  RETURN v_rep_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Get all active chat sessions (for CS Dashboard) ──
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
  ORDER BY cs.priority DESC, cs.last_message_at DESC;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Mark a session as active (called when agent sends first reply) ──
CREATE OR REPLACE FUNCTION mark_chat_session_active(p_session_id UUID)
RETURNS VOID AS $$
  UPDATE chat_sessions
  SET status = CASE
        WHEN status IN ('waiting', 'assigned') THEN 'active'
        ELSE status
      END,
      first_response_at = CASE
        WHEN first_response_at IS NULL THEN NOW()
        ELSE first_response_at
      END
  WHERE id = p_session_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── Find an available RM for chat transfer ──
-- Joins profiles to get full_name; uses is_active instead of status
CREATE OR REPLACE FUNCTION find_available_rm_for_transfer()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  designation TEXT
) AS $$
  SELECT sp.user_id, p.full_name, sp.designation
  FROM staff_profiles sp
  JOIN profiles p ON p.id = sp.user_id
  WHERE sp.designation IN ('team-leader', 'relationship-manager', 'cs-lead')
    AND sp.is_active = TRUE
  ORDER BY (
    SELECT COUNT(*) FROM chat_sessions cs
    WHERE cs.assigned_rep_id = sp.user_id
      AND cs.status IN ('assigned', 'active')
  ) ASC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Transfer a chat session to an RM ──
CREATE OR REPLACE FUNCTION transfer_chat_to_rm(
  p_session_id UUID,
  p_rm_user_id UUID,
  p_agent_name TEXT DEFAULT 'CS Agent',
  p_rm_name TEXT DEFAULT 'Relationship Manager'
)
RETURNS VOID AS $$
BEGIN
  -- Update the session assignment
  UPDATE chat_sessions
  SET assigned_rep_id = p_rm_user_id,
      assigned_at = NOW(),
      status = 'active',
      priority = GREATEST(priority, 5)
  WHERE id = p_session_id;

  -- Insert a system message about the transfer
  INSERT INTO chat_messages (session_id, sender_type, sender_name, message)
  VALUES (
    p_session_id,
    'system',
    'System',
    p_agent_name || ' has transferred this chat to ' || p_rm_name || ' (Relationship Manager). They will continue assisting you shortly.'
  );

  -- Notify the RM
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (
    p_rm_user_id,
    'action_required',
    'Chat Transfer — Visitor Needs RM',
    'A chat has been transferred to you by ' || p_agent_name || '. The visitor is waiting for assistance.',
    '/staff/cs/chat',
    jsonb_build_object('session_id', p_session_id, 'transferred_by', p_agent_name)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
