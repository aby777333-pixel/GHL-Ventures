-- ================================================================
-- 048 — Emailer attachments + audit log (30-04-2026 follow-up)
--
-- Adds:
--   * email_logs table — audit row for every send (recipients,
--     subject, body, attachment names + URLs, sent/failed counts,
--     status, scheduled_for, metadata).
--   * email-attachments storage bucket (private) — for any future
--     server-side hosting of attachments larger than the 25MB
--     base64-inline cap. Today the Emailer sends attachments as
--     base64 inline (Resend), so this bucket is reserved for
--     archival / scheduled-send flows.
--
-- Idempotent. RLS restricts log reads + bucket access to admin/staff.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipients text[] NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  attachment_names text[],
  attachment_urls text[],
  template_id text,
  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'failed', 'partial', 'scheduled')),
  sent_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  scheduled_for timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_logs_sent_by_idx     ON public.email_logs (sent_by);
CREATE INDEX IF NOT EXISTS email_logs_created_at_idx  ON public.email_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS email_logs_status_idx      ON public.email_logs (status);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_logs_admin_all" ON public.email_logs;
CREATE POLICY "email_logs_admin_all" ON public.email_logs
  FOR ALL USING (is_admin_or_above() OR is_staff())
            WITH CHECK (is_admin_or_above() OR is_staff());

-- ── Storage bucket ─────────────────────────────────────────────
-- Private bucket used for archival storage of large email
-- attachments (today the sender uses inline base64; this bucket
-- backs the future scheduled-send flow).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('email-attachments', 'email-attachments', false, 26214400, NULL)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "email_attach_admin_read" ON storage.objects;
CREATE POLICY "email_attach_admin_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'email-attachments' AND (is_admin_or_above() OR is_staff()));

DROP POLICY IF EXISTS "email_attach_admin_insert" ON storage.objects;
CREATE POLICY "email_attach_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'email-attachments' AND (is_admin_or_above() OR is_staff()));

DROP POLICY IF EXISTS "email_attach_admin_delete" ON storage.objects;
CREATE POLICY "email_attach_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'email-attachments' AND (is_admin_or_above() OR is_staff()));
