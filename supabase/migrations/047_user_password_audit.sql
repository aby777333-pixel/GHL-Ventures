-- Tests 28-04-2026 #6: super-admin needs a way to verify users' passwords.
-- Supabase Auth stores passwords hashed and irreversible. Whenever a super
-- admin issues or rotates a password through the Admin Panel UI, we keep
-- a record of the plaintext value here for the next admin to inspect.
--
-- IMPORTANT: this is intentionally restricted to super-admin reads + writes
-- via RLS. Regular admins, staff, and clients cannot see anything here.

create table if not exists public.user_password_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  password_plain text not null,
  set_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_password_audit_user on public.user_password_audit(user_id, created_at desc);

alter table public.user_password_audit enable row level security;

drop policy if exists "Super admins can read password audit" on public.user_password_audit;
create policy "Super admins can read password audit"
  on public.user_password_audit
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  );

drop policy if exists "Super admins can insert password audit" on public.user_password_audit;
create policy "Super admins can insert password audit"
  on public.user_password_audit
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  );
