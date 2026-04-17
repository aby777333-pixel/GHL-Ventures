-- ================================================================
-- 040 — Backfill monthly_payouts for every approved/credited
-- investment. AIF = yearly; Debenture / LLP = monthly. Idempotent.
--
-- New approvals and credit_given flip now auto-generate their
-- schedule via lib/supabase/adminDataService.generateFullPayoutSchedule().
-- This migration backfills investments that were already approved
-- before that hook landed.
-- ================================================================

WITH apps AS (
  SELECT
    a.id                                            AS investment_id,
    a.client_id,
    a.fund_vehicle,
    a.investment_date,
    a.maturity_date,
    COALESCE(a.final_investment_amount, a.investment_amount) AS amount,
    COALESCE(a.interest_rate, 12)                   AS interest_rate,
    COALESCE(a.tds_rate, 10)                        AS tds_rate,
    CASE
      WHEN a.fund_vehicle = 'Direct AIF Route'
        OR (a.fund_vehicle ILIKE '%AIF%' AND a.fund_vehicle NOT ILIKE '%debenture%' AND a.fund_vehicle NOT ILIKE '%llp%')
      THEN 12
      ELSE 1
    END AS frequency_months,
    c.client_code                                   AS ghl_id,
    c.full_name                                     AS investor_name,
    b.account_number, b.account_holder_name, b.bank_name, b.ifsc_code
  FROM public.investment_applications a
  LEFT JOIN public.clients c ON c.id = a.client_id
  LEFT JOIN public.kyc_bank_details b ON b.client_id = a.client_id
  WHERE a.status IN ('approved', 'credited')
    AND a.investment_date IS NOT NULL
    AND a.maturity_date IS NOT NULL
),
periods AS (
  SELECT
    apps.*,
    (generate_series(
      apps.investment_date + (apps.frequency_months || ' months')::interval,
      apps.maturity_date,
      (apps.frequency_months || ' months')::interval
    ))::date AS due_date
  FROM apps
),
rows_to_insert AS (
  SELECT
    p.client_id,
    p.investment_id,
    p.ghl_id,
    p.fund_vehicle                                                    AS fund_type,
    p.amount                                                          AS investment_amount,
    p.investment_date,
    p.due_date,
    ROUND(
      CASE WHEN p.frequency_months = 12
        THEN p.amount * p.interest_rate / 100
        ELSE p.amount * p.interest_rate / 100 / 12
      END, 2
    )                                                                 AS gross_amount,
    p.tds_rate                                                        AS tds_percentage,
    ROUND(
      CASE WHEN p.frequency_months = 12
        THEN p.amount * p.interest_rate / 100
        ELSE p.amount * p.interest_rate / 100 / 12
      END * p.tds_rate / 100, 2
    )                                                                 AS tds_amount,
    ROUND(
      (CASE WHEN p.frequency_months = 12
        THEN p.amount * p.interest_rate / 100
        ELSE p.amount * p.interest_rate / 100 / 12
      END) * (1 - p.tds_rate / 100), 2
    )                                                                 AS net_interest,
    'pending'                                                         AS payment_status,
    p.account_number, COALESCE(p.account_holder_name, p.investor_name) AS account_holder_name,
    p.bank_name, p.ifsc_code
  FROM periods p
)
INSERT INTO public.monthly_payouts (
  client_id, investment_id, ghl_id, fund_type, investment_amount,
  investment_date, due_date, gross_amount, tds_percentage, tds_amount,
  net_interest, payment_status, account_number, account_holder_name,
  bank_name, ifsc_code
)
SELECT
  r.client_id, r.investment_id, r.ghl_id, r.fund_type, r.investment_amount,
  r.investment_date, r.due_date, r.gross_amount, r.tds_percentage, r.tds_amount,
  r.net_interest, r.payment_status, r.account_number, r.account_holder_name,
  r.bank_name, r.ifsc_code
FROM rows_to_insert r
WHERE NOT EXISTS (
  SELECT 1 FROM public.monthly_payouts mp
  WHERE mp.investment_id = r.investment_id
    AND mp.due_date = r.due_date
);
