# GHL India Ventures — Database Dependency Audit & Safe Cleanup Strategy

> Last reviewed: 2026-04-25 by automated audit against project `obugyxjgwnwijhsfyfxp`.
> **Do NOT truncate any of these tables blindly. Read this document first.**

This document accompanies the new admin password-reset feature. The
password-reset flow itself never touches application data — it only updates
`auth.users` via the Admin API and writes to `public.password_reset_audit`.
This document exists for the **separate** "align user credentials and clean
system data" task: it explains exactly which tables depend on each user-
facing entity so the team can plan a safe cleanup without breaking
relational integrity or live workflows.

---

## 1. Identity model in this project

| Layer | Table | Notes |
|------|-------|-------|
| Auth | `auth.users` (Supabase) | Owns `id`, `email`, `password_hash`, `user_metadata`. Source of truth for credentials. |
| Profile | `public.profiles` | `id` ↔ `auth.users.id` (1:1, ON DELETE CASCADE). `role` enum: `super_admin`, `admin`, `staff`, `client`, `viewer`. |
| Investor | `public.clients` | `user_id` ↔ `auth.users.id`. Joined to all KYC, investments, payouts. |
| Employee | `public.staff_profiles` | `user_id` ↔ `auth.users.id`. Joined to attendance, payroll, leave, lead/CRM ownership. |
| Admin | `public.admin_profiles` | `id` ↔ `public.profiles.id` (CASCADE). Permission overlay only. |

All three of `clients` / `staff_profiles` / `admin_profiles` are derived from
`auth.users`. **Never delete from `auth.users` without first walking the FK
chain below.**

---

## 2. Foreign-key map — `clients` (investor)

`clients.id` is referenced by 27 tables. Cascade behavior matters:

### 2a. ON DELETE CASCADE (auto-deleted with the client)

| Child table | Risk if deleted |
|---|---|
| `kyc_basic_details`, `kyc_identity_details`, `kyc_bank_details`, `kyc_demat_details`, `kyc_documents` | KYC artifacts gone — SEBI compliance loss for that investor. |
| `bank_accounts` | Mandates / NACH targets disappear. |
| `nominees` | Nomination record disappears. |
| `allotments`, `debenture_certificates` (`allotment_id` CASCADE) | Holding record disappears; investor's units vanish. |
| `investments`, `investment_applications`, `monthly_payouts`, `transactions`, `nav_history` | Subscription, ledger, NAV history lost. |
| `subscriptions`, `interest_registrations`, `client_assignments` | RM assignment + interest log lost. |
| `document_tracking` | Marketing analytics gap. |

### 2b. ON DELETE SET NULL (record kept; link orphaned)

| Child table | Effect |
|---|---|
| `leads.converted_client_id` | Lead row preserved, but loses link to the client it converted into. |
| `grievances.client_id` | Ticket history preserved (anonymous). |
| `fiq_broadcasts.client_id` | Broadcast log keeps the row. |
| `migration_log.client_id` | Audit trail keeps the row. |

### 2c. ON DELETE NO ACTION (deletion will FAIL until cleared first)

| Child table | Implication |
|---|---|
| `client_interactions` | RM call/email history. **Blocks delete.** |
| `investment_documents` | Statements / contract notes. **Blocks delete.** |
| `investment_transactions` | Ledger. **Blocks delete.** |
| `invoices` | Invoicing/billing history. **Blocks delete.** |
| `revenue_streams` | Revenue analytics. **Blocks delete.** |

---

## 3. Foreign-key map — `profiles` / `staff_profiles`

`profiles.id` is referenced by ~25 tables, mostly with `ON DELETE NO ACTION`
(staff "ownership" links). Critical examples:

- `clients.assigned_rm` → `staff_profiles.id` (NO ACTION) — deleting a staff
  profile that owns a client breaks the listing UI.
- `leads.assigned_to` → `staff_profiles.id` (NO ACTION) — same.
- `investment_applications.assigned_rm` → `staff_profiles.id` (NO ACTION).
- `payroll`, `payslips`, `leave_requests`, `attendance` are CASCADE on staff
  delete — **all payroll records vanish** if you delete the staff profile.
- `staff_profiles.reporting_to` is self-referential NO ACTION — managers
  cannot be deleted while reports exist.
- `admin_profiles.id` is CASCADE on `profiles.id` — deleting the profile
  drops the admin overlay automatically.

---

## 4. Risks of TRUNCATE / blind DELETE

`TRUNCATE` (or unrestricted `DELETE`) is **never safe** on any of these
tables for the following reasons:

1. **Data loss.** Most child rows above are CASCADE — wiping `clients` wipes
   every investor's KYC, allotments, NAV history, and payouts.
2. **Foreign-key failure.** Tables with NO ACTION FKs will refuse the
   truncate — and if you `TRUNCATE … CASCADE` you cascade across everything,
   including `auth.*` indirectly via triggers.
3. **Orphan records.** SET NULL FKs leave you with rows that look real but
   point to nothing — leads "converted to" a deleted client, broadcasts
   targeting a missing client, etc.
4. **RLS / Auth desync.** Deleting `public.clients` does NOT remove
   `auth.users`. The user can still log in but has no profile, and the
   portal's auto-repair will silently re-create a fresh `clients` row,
   masking the cleanup.
5. **Compliance.** SEBI Cat-II AIF rules require KYC + transaction
   retention. Truncation without an export is a regulatory violation.

---

## 5. Safe cleanup options

Pick the strategy that matches the goal. **Always take a backup first
(see §6).**

### Option A — Controlled deletion (per-record, in dependency order)

Use this when you must permanently remove a *specific* user. The repo
already has a battle-tested helper:

- [`deleteClientSafe(clientId, userId)`](../lib/supabase/adminDataService.ts) for investors
- [`deleteEmployeeSafe(staffProfileId, userId)`](../lib/supabase/adminDataService.ts) for staff

Both helpers walk the NO-ACTION dependents first (e.g. `client_interactions`,
`investment_transactions`, `invoices`), check for "approved" guards (KYC
verified or investment_application status='approved' refuses to delete),
then issue the parent delete which CASCADEs the rest, and finally call the
Admin API to remove `auth.users`. Use these from the admin UI rather than
issuing raw SQL. **Wire them into a script — don't call them in a loop
without a guard.**

For raw SQL, the correct order for a single client is:

```sql
BEGIN;
DELETE FROM client_interactions      WHERE client_id = $1;
DELETE FROM investment_documents     WHERE client_id = $1;
DELETE FROM investment_transactions  WHERE client_id = $1;
DELETE FROM invoices                 WHERE client_id = $1;
DELETE FROM revenue_streams          WHERE client_id = $1;
DELETE FROM clients                  WHERE id        = $1;  -- CASCADE handles the rest
-- Finally, via Admin API (NOT SQL):
--   DELETE /auth/v1/admin/users/<auth.user_id>
COMMIT;
```

### Option B — Soft reset using status flags (RECOMMENDED for "align" work)

Almost every entity here already has a status column, which means a *logical*
delete is preferable to a hard one for compliance and analytics:

| Table | Soft-delete column |
|---|---|
| `clients` | `is_active` (boolean), `account_status` (enum) |
| `staff_profiles` | `is_active`, `status='inactive'` |
| `profiles` | `is_active` |
| `tickets` | `status='closed'` |
| `leads` | `status='lost'` |
| `investment_applications` | `status='cancelled'` |

Soft reset preserves SEBI / audit trails AND keeps relationships intact.
For "credential alignment", use the new admin password-reset flow
(temp password + force_password_reset) — **don't delete, reset.**

### Option C — Backup + selective purge

For bulk archival (e.g. legacy migrated rows):

1. **Snapshot first** (see §6).
2. Filter by `legacy_source IS NOT NULL` or `imported_at < cutoff`.
3. Move purgeable rows into an `archive_*` table in a parallel schema.
4. Verify counts and FKs against the snapshot before issuing the delete.

The `migration_log` table already records every imported client; use it as
the source of truth for "what was imported and can therefore be re-imported
if we lose it". Never purge `migration_log` itself.

---

## 6. Backup procedure (always run first)

```bash
# Full project backup via supabase CLI (pg_dump under the hood)
supabase db dump --linked --schema public --schema auth -f backup-$(date +%F).sql

# Or, per-table dumps — useful when you only need one entity:
pg_dump "$DB_URL" --table=public.clients --table=public.kyc_* \
  --table=public.investment_applications --table=public.investment_transactions \
  -f clients-backup-$(date +%F).sql
```

For one-off snapshots Supabase also lets you `CREATE TABLE archive.<name> AS
TABLE public.<name>` inside a transaction; the `archive` schema isn't picked
up by RLS or the API, so it's a safe place to park data.

---

## 7. Decision flowchart

```
                ┌────────────────────────────────────────┐
                │ Goal: align user credentials only?     │
                └────────────────────────────────────────┘
                       │ yes                       │ no
                       ▼                           ▼
            Use admin-password-reset      Goal: remove a SPECIFIC user?
            (email link OR temp pwd).      │ yes                  │ no
            No data is touched.            ▼                      ▼
                                  Use deleteClientSafe /     Goal: bulk archive?
                                  deleteEmployeeSafe.        ▼
                                  Hard-blocks if KYC          Snapshot → move to
                                  approved / investments      archive schema →
                                  active.                     selective DELETE.
                                                              Never TRUNCATE.
```

---

## 8. Hard "do-NOT-touch" list

Tables that hold the only copy of regulator-relevant data — these should
**never** be cleared without legal sign-off, regardless of strategy:

- `kyc_basic_details`, `kyc_identity_details`, `kyc_bank_details`,
  `kyc_demat_details`, `kyc_documents`
- `nominees`, `bank_accounts`
- `allotments`, `debenture_certificates`
- `investment_applications`, `investment_transactions`, `monthly_payouts`,
  `nav_history`, `transactions`
- `audit_logs`, `password_reset_audit`, `migration_log`,
  `document_audit_log`, `file_activity_log`
- `payroll`, `payslips` (statutory — labour law retention)
