-- ================================================================
-- 049 — Investment delete RLS policies (Pending Testing 30-04-2026 #3)
--
-- The earlier RLS pass left investment_applications,
-- investment_documents, and investment_transactions WITHOUT a DELETE
-- policy. RLS-on-no-policy = implicit deny, so DELETE statements
-- returned 204 with no rows touched, the UI optimistically removed
-- the row, and a refresh brought the row back.
--
-- Add DELETE policies scoped to admin / super_admin so the cascading
-- deleteInvestmentSafe (lib/supabase/adminDataService.ts) actually
-- removes data.
-- ================================================================

DROP POLICY IF EXISTS "inv_app_admin_delete" ON public.investment_applications;
CREATE POLICY "inv_app_admin_delete" ON public.investment_applications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['admin'::user_role, 'super_admin'::user_role])
    )
  );

DROP POLICY IF EXISTS "inv_docs_admin_delete" ON public.investment_documents;
CREATE POLICY "inv_docs_admin_delete" ON public.investment_documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['admin'::user_role, 'super_admin'::user_role])
    )
  );

DROP POLICY IF EXISTS "inv_txn_admin_delete" ON public.investment_transactions;
CREATE POLICY "inv_txn_admin_delete" ON public.investment_transactions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['admin'::user_role, 'super_admin'::user_role])
    )
  );
