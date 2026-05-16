-- 2026-05-16: Sarvam AI Phase 3a — pronunciation dictionary registry,
-- document digitization jobs, voice session log.
--
-- Purely additive — no changes to Phase 1+2 tables (sarvam_api_logs,
-- sarvam_batch_jobs). RLS follows the same pattern: users read own rows,
-- super-admins read all, service role writes everything.
--
-- sarvam_voice_sessions is created now even though Phase 3b (WS streaming
-- + voice agents) is deferred — landing the schema in one shot avoids a
-- second migration when the agents come online.

-- ── sarvam_dictionaries ────────────────────────────────────
-- Registry of Sarvam-returned pronunciation dictionary IDs
-- (`p_xxxxxxxx`). Looked up by name when calling TTS so callers
-- don't have to copy-paste IDs across environments. One row per
-- dictionary; updates to the dict's *contents* happen via
-- Sarvam's PATCH endpoint and only the metadata changes here.
create table if not exists public.sarvam_dictionaries (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,           -- 'ghl-financial', 'gio-trading', 'brand-names'
  dictionary_id   text not null unique,           -- Sarvam's 'p_xxxxxxxx'
  description     text,
  word_count      int  not null default 0,
  languages       text[] not null default '{}',   -- BCP-47 codes covered
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_sarvam_dictionaries_name
  on public.sarvam_dictionaries (name);

alter table public.sarvam_dictionaries enable row level security;

-- Anyone signed in can read the registry (TTS callers need the
-- dictionary_id to attach to requests). Service role writes only.
drop policy if exists "any auth user reads sarvam_dictionaries" on public.sarvam_dictionaries;
create policy "any auth user reads sarvam_dictionaries"
  on public.sarvam_dictionaries
  for select
  using (auth.uid() is not null);

-- ── sarvam_document_jobs ───────────────────────────────────
-- Mirrors sarvam_batch_jobs in spirit. Parallel lifecycle:
-- Accepted → Pending → Running → Completed | PartiallyCompleted | Failed.
create table if not exists public.sarvam_document_jobs (
  job_id            text primary key,             -- Sarvam-issued
  user_id           uuid references auth.users(id) on delete cascade,
  language          text not null,                -- BCP-47
  output_format     text not null check (output_format in ('md', 'html')),
  source_file_name  text,
  source_bytes      bigint,
  state             text not null default 'Accepted'
                      check (state in ('Accepted','Pending','Running','Completed','PartiallyCompleted','Failed')),
  total_pages       int,
  pages_processed   int,
  pages_succeeded   int,
  pages_failed      int,
  output_url        text,                         -- signed URL (short-lived; refresh via -output endpoint)
  output_url_expires_at timestamptz,
  error_message     text,
  created_at        timestamptz not null default now(),
  started_at        timestamptz,
  completed_at      timestamptz
);

create index if not exists idx_sarvam_document_jobs_user_created
  on public.sarvam_document_jobs (user_id, created_at desc);
create index if not exists idx_sarvam_document_jobs_active
  on public.sarvam_document_jobs (state)
  where state in ('Accepted', 'Pending', 'Running');

alter table public.sarvam_document_jobs enable row level security;

drop policy if exists "users read own document jobs" on public.sarvam_document_jobs;
create policy "users read own document jobs"
  on public.sarvam_document_jobs
  for select
  using (auth.uid() = user_id);

drop policy if exists "admins read all document jobs" on public.sarvam_document_jobs;
create policy "admins read all document jobs"
  on public.sarvam_document_jobs
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role::text in ('admin', 'super_admin')
    )
  );

-- ── sarvam_voice_sessions ──────────────────────────────────
-- Used by Phase 3b voice agents (LiveKit / Pipecat / custom).
-- Each row is one user-facing voice session — STT + LLM + TTS
-- happen across many Sarvam calls per session.
create table if not exists public.sarvam_voice_sessions (
  id                  uuid primary key default gen_random_uuid(),
  session_id          text not null,              -- agent-side ID (LiveKit room, etc.)
  agent_type          text check (agent_type in ('livekit', 'pipecat', 'browser_ws', 'custom')),
  user_id             uuid references auth.users(id) on delete set null,
  language            text,                       -- BCP-47 primary
  speaker             text,                       -- bulbul:v3 voice
  total_audio_seconds numeric,
  total_chars         int,
  metadata            jsonb,                      -- opaque per-agent context
  started_at          timestamptz not null default now(),
  ended_at            timestamptz
);

create index if not exists idx_sarvam_voice_sessions_user_started
  on public.sarvam_voice_sessions (user_id, started_at desc);

alter table public.sarvam_voice_sessions enable row level security;

drop policy if exists "users read own voice sessions" on public.sarvam_voice_sessions;
create policy "users read own voice sessions"
  on public.sarvam_voice_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists "admins read all voice sessions" on public.sarvam_voice_sessions;
create policy "admins read all voice sessions"
  on public.sarvam_voice_sessions
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role::text in ('admin', 'super_admin')
    )
  );
