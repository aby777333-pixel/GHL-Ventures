-- 2026-05-16: Sarvam AI integration — audit trail + batch job tracking.
--
-- Two tables, both writable only by the service-role key (Netlify
-- Functions). Users can read their own rows for the dashboard.
--
-- 1. sarvam_api_logs   — one row per call to api.sarvam.ai. Used by
--                        the cost guardrail, ops triage, and the
--                        admin Sarvam usage dashboard.
-- 2. sarvam_batch_jobs — long-running Batch STT jobs. The webhook
--                        handler updates state here; the UI subscribes
--                        via Supabase Realtime for live progress.

-- ── sarvam_api_logs ────────────────────────────────────────
create table if not exists public.sarvam_api_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  endpoint        text not null,                  -- 'tts', 'stt', 'translate', 'batch-create', ...
  model           text,
  source_language text,
  target_language text,
  mode            text,
  speaker         text,
  input_chars     int,                            -- TTS / translate
  audio_seconds   numeric(10,3),                  -- STT (REST + batch)
  status          int not null,                   -- HTTP status from Sarvam (0 = network)
  latency_ms      int,
  request_id      text,                           -- Sarvam x-request-id
  error_code      text,
  error_message   text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_sarvam_api_logs_user_created
  on public.sarvam_api_logs (user_id, created_at desc);
create index if not exists idx_sarvam_api_logs_endpoint_created
  on public.sarvam_api_logs (endpoint, created_at desc);

alter table public.sarvam_api_logs enable row level security;

-- Users read their own audit rows; service role writes everything.
drop policy if exists "users read own sarvam logs" on public.sarvam_api_logs;
create policy "users read own sarvam logs"
  on public.sarvam_api_logs
  for select
  using (auth.uid() = user_id);

-- Super admins can read all rows for the admin Sarvam dashboard.
drop policy if exists "admins read all sarvam logs" on public.sarvam_api_logs;
create policy "admins read all sarvam logs"
  on public.sarvam_api_logs
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role::text in ('admin', 'super_admin')
    )
  );

-- ── sarvam_batch_jobs ──────────────────────────────────────
-- One row per Sarvam batch STT/STT-Translate job. The webhook
-- handler (created in Phase 2) updates `state` + `completed_at`
-- + `results_summary`; the UI subscribes via Supabase Realtime
-- on (user_id) so progress + completion notify the dashboard
-- without polling.

create table if not exists public.sarvam_batch_jobs (
  job_id           text primary key,              -- Sarvam-issued id
  user_id          uuid references auth.users(id) on delete cascade,
  model            text not null,                 -- saaras:v3 / saarika:v2.5 / saaras:v2.5
  mode             text,                          -- transcribe / translate / verbatim / translit / codemix
  language_code    text,                          -- BCP-47 or 'unknown'
  with_diarization boolean not null default false,
  num_speakers     int,                           -- 1..10 hint
  file_count       int not null,
  state            text not null default 'PENDING',
                                                  -- PENDING / RUNNING / COMPLETED / FAILED / PARTIAL
  progress         int not null default 0,        -- 0..100
  error_message    text,
  results_summary  jsonb,                         -- shape varies; opaque blob from webhook
  callback_url     text,
  created_at       timestamptz not null default now(),
  started_at       timestamptz,
  completed_at     timestamptz
);

create index if not exists idx_sarvam_batch_jobs_user_created
  on public.sarvam_batch_jobs (user_id, created_at desc);

-- Useful for the "still pending" dashboard tile.
create index if not exists idx_sarvam_batch_jobs_active
  on public.sarvam_batch_jobs (state)
  where state in ('PENDING', 'RUNNING');

alter table public.sarvam_batch_jobs enable row level security;

drop policy if exists "users read own batch jobs" on public.sarvam_batch_jobs;
create policy "users read own batch jobs"
  on public.sarvam_batch_jobs
  for select
  using (auth.uid() = user_id);

drop policy if exists "admins read all batch jobs" on public.sarvam_batch_jobs;
create policy "admins read all batch jobs"
  on public.sarvam_batch_jobs
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role::text in ('admin', 'super_admin')
    )
  );

-- ── user_preferences extensions ────────────────────────────
-- Per-user Sarvam defaults (voice, language, pace, translate
-- target). Survives missing rows — only adds the columns if the
-- table exists. If user_preferences hasn't been created yet,
-- the DO block becomes a no-op and the columns get added by a
-- later migration when the table lands.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_preferences'
  ) then
    alter table public.user_preferences
      add column if not exists tts_speaker      text default 'shubh',
      add column if not exists tts_language     text default 'en-IN',
      add column if not exists tts_pace         numeric(3,2) default 1.0,
      add column if not exists stt_language     text default 'unknown',
      add column if not exists translate_target text default 'hi-IN';
  end if;
end $$;
