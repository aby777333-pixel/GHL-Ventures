-- 054_client_contact_extras_and_backfill — applied 2026-05-14 via MCP.
-- Adds support for multiple contact emails / phones on a client and
-- backfills any rows that were imported without an email/phone so the
-- super-admin's Clients view stops showing blank chips.

-- Multiple contact emails / phones per client. Existing rows default to '{}'.
alter table public.clients add column if not exists additional_emails text[] not null default '{}'::text[];
alter table public.clients add column if not exists additional_phones text[] not null default '{}'::text[];

-- One-time backfill: pull canonical email from auth.users when the
-- client row was created without one (legacy imports).
update public.clients c
set email = au.email,
    updated_at = now()
from auth.users au
where au.id = c.user_id
  and coalesce(c.email, '') = ''
  and au.email is not null
  and au.email <> '';

-- One-time backfill: pull phone from KYC basic details when empty.
update public.clients c
set phone = kbd.phone,
    updated_at = now()
from public.kyc_basic_details kbd
where kbd.client_id = c.id
  and coalesce(c.phone, '') = ''
  and kbd.phone is not null
  and kbd.phone <> '';

-- Mirror into profiles for parity (older signups left profiles.email empty).
update public.profiles p
set email = au.email
from auth.users au
where au.id = p.id
  and coalesce(p.email, '') = ''
  and au.email is not null
  and au.email <> '';

-- Safety-net RPC: returns auth.users.email for a batch of user ids.
-- Admin-only via profiles.role check; non-admins get an empty set.
-- Used by the admin Clients view as a final fallback when both
-- clients.email and profiles.email are empty for a row.
create or replace function public.admin_get_auth_emails(p_user_ids uuid[])
returns table(user_id uuid, email text)
language plpgsql
security definer
set search_path = public
as $$
declare caller_role text;
begin
  select role::text into caller_role from public.profiles where id = auth.uid();
  if caller_role is null or caller_role not in ('super_admin', 'admin') then
    return;
  end if;
  return query
    select au.id, au.email::text
    from auth.users au
    where au.id = any(p_user_ids)
      and au.email is not null
      and au.email <> '';
end;
$$;

grant execute on function public.admin_get_auth_emails(uuid[]) to authenticated;
