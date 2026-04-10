/* ─────────────────────────────────────────────────────────────
   035 — Fix send_visitor_chat_message overload ambiguity

   Problem:
   Two overloads existed with identical parameter names but
   different types for p_sender_type (text vs sender_type enum).
   PostgREST could not determine which to call, returning a
   "could not choose a best candidate function" error.
   This silently broke ALL message sending from the visitor
   chat widget — messages were never stored.

   Fix:
   Drop the old enum-based overload (OID with sender_type param).
   Keep the text-based version which also updates updated_at.
   ───────────────────────────────────────────────────────────── */

-- Drop the ambiguous enum overload
DROP FUNCTION IF EXISTS public.send_visitor_chat_message(uuid, sender_type, text, text);

-- Ensure the correct text-based version exists with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.send_visitor_chat_message(
  p_session_id   uuid,
  p_sender_type  text,
  p_sender_name  text DEFAULT NULL,
  p_message      text DEFAULT ''
)
RETURNS TABLE(
  id          uuid,
  session_id  uuid,
  sender_type text,
  sender_id   uuid,
  sender_name text,
  message     text,
  attachments text[],
  metadata    jsonb,
  created_at  timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
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
$$;

-- Grant execute to anon + authenticated (visitors are anonymous)
GRANT EXECUTE ON FUNCTION public.send_visitor_chat_message(uuid, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.send_visitor_chat_message(uuid, text, text, text) TO authenticated;
