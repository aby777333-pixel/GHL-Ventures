-- ================================================================
-- 050 — Editable joined date on clients (Pending Re-Testing #6)
--
-- Existing clients show today's date as their join date because the
-- admin-created flow stamps `created_at` at insert time. We add a
-- dedicated `joined_at` column that admin can edit independently of
-- the system audit timestamp, defaulting to the original created_at
-- so historical data stays accurate.
-- ================================================================

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS joined_at timestamptz;

-- Backfill existing rows so every client has a joined_at value.
UPDATE public.clients
SET joined_at = created_at
WHERE joined_at IS NULL;

CREATE INDEX IF NOT EXISTS clients_joined_at_idx ON public.clients (joined_at);
