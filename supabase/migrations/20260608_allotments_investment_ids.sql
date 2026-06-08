-- 08-06-2026: Allotment & DC full-flow rework.
--
-- An allotment is now created once per investor for a (from_date, to_date,
-- fund_type) window and may aggregate multiple investments made by that
-- investor in the window (their amounts are summed). investment_ids records
-- every investment_applications.id the allotment covers, so the next monthly
-- run can exclude investments that have already been allotted.
ALTER TABLE public.allotments ADD COLUMN IF NOT EXISTS investment_ids uuid[];
