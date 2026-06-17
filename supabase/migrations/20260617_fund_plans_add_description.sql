-- ================================================================
-- 20260617 · FUND PLANS — add free-text description
-- Adds an optional long-form description to investment plans.
-- Surfaced in the admin Add/Edit Plan form (textarea) and on the
-- investor dashboard plan tab.
-- Idempotent + non-destructive (additive column only).
-- ================================================================

ALTER TABLE public.fund_plans ADD COLUMN IF NOT EXISTS description TEXT;
