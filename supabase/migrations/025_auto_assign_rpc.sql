-- ============================================================
-- 025 · AUTO-ASSIGN CHAT SESSION — SECURITY DEFINER RPC
--
-- The client-side autoAssignChat() function was running in
-- the visitor's anonymous browser context, so all direct
-- table queries (staff_profiles, chat_sessions update,
-- notifications insert) failed silently due to RLS.
--
-- This moves the logic to a SECURITY DEFINER function that
-- runs with the function owner's permissions, bypassing RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION auto_assign_visitor_chat(p_session_id UUID)
RETURNS UUID AS $$
DECLARE
  v_rep_user_id UUID;
  v_rep_name TEXT;
BEGIN
  -- Find the CS rep with the fewest active sessions (least-busy first)
  SELECT sp.user_id, sp.full_name
  INTO v_rep_user_id, v_rep_name
  FROM staff_profiles sp
  WHERE sp.designation IN ('cs-agent', 'senior-cs-agent', 'cs-lead', 'relationship-manager')
    AND sp.status = 'active'
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
