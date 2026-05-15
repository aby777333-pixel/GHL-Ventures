-- ================================================================
-- 20260515 · Per-user permission overrides + document tracking (admin)
--
-- 1. profiles.permission_overrides — JSONB array of permission tokens
--    granted to a specific user beyond their role (e.g. ["view:reports"]).
-- 2. document_tracking already existed with schema:
--      (id, client_id, investment_id, document_type, document_name,
--       document_url, status, provided_date, signed_copy_url,
--       signed_at, notes, created_by, created_at, updated_at)
--    so this migration only ALTERs profiles. The Admin Tracking tab
--    inserts into the existing table.
-- ================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS permission_overrides JSONB NOT NULL DEFAULT '[]'::jsonb;
