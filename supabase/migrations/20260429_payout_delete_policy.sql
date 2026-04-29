-- ================================================================
-- 2026-04-29 — Allow authenticated DELETE on monthly_payouts.
--
-- Bug (Payout Recalculation Logic — Credit Date scenario, 29-04-2026):
-- When the admin issued credit with a back-dated Credit Date, the
-- adminDataService.markInvestmentCreditGiven flow tried to delete the
-- existing pending payouts and regenerate them from the new start
-- date. The delete silently returned 0 rows because RLS on
-- monthly_payouts only granted INSERT / SELECT / UPDATE — there was
-- no DELETE policy. generateFullPayoutSchedule then skipped every
-- date that already existed (its idempotent guard), so the partial
-- first-month amount and the 37th-month catch-up stayed pegged to
-- the original (pre-credit) investment date. The user-facing dashboard
-- therefore showed the same payout amounts before and after credit.
--
-- This migration adds the missing DELETE policy so the cleanup step
-- can actually purge stale pending rows. The complementary code-side
-- fix in lib/supabase/adminDataService.ts also makes the regenerator
-- update pending rows in place as a defence-in-depth (so a future
-- RLS misconfiguration cannot mask the bug again).
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.monthly_payouts'::regclass
      AND polname = 'Allow authenticated delete payouts'
  ) THEN
    CREATE POLICY "Allow authenticated delete payouts"
      ON public.monthly_payouts
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;
