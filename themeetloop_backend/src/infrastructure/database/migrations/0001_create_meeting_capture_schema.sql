create extension if not exists pgcrypto;

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null check (length(btrim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id text not null references "user"(id) on delete cascade,
  role varchar(20) not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create unique index if not exists workspace_members_personal_workspace_user_id_unique
  on workspace_members(user_id) where role = 'owner';

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  created_by_user_id text not null references "user"(id) on delete restrict,
  title varchar(160) not null check (length(btrim(title)) between 1 and 160),
  source_platform varchar(30) not null check (source_platform in ('google_meet', 'manual_demo')),
  source_language varchar(35) not null check (length(btrim(source_language)) between 2 and 35),
  status varchar(24) not null default 'capturing' check (status in ('capturing', 'finalizing', 'processing', 'review_required', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create index if not exists meetings_workspace_started_at_index
  on meetings(workspace_id, started_at desc);

create table if not exists meeting_capture_sessions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  connection_status varchar(24) not null default 'waiting' check (connection_status in ('waiting', 'connected', 'reconnecting', 'offline_buffering', 'ended', 'failed')),
  last_acknowledged_sequence_number integer not null default 0 check (last_acknowledged_sequence_number >= 0),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists meeting_capture_sessions_meeting_id_index
  on meeting_capture_sessions(meeting_id);

create table if not exists meeting_transcript_chunks (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  capture_session_id uuid not null references meeting_capture_sessions(id) on delete cascade,
  sequence_number integer not null check (sequence_number > 0),
  captured_at timestamptz not null,
  speaker_display_name varchar(120) not null check (length(btrim(speaker_display_name)) between 1 and 120),
  source_language varchar(35) not null check (length(btrim(source_language)) between 2 and 35),
  transcript_text varchar(4000) not null check (length(btrim(transcript_text)) between 1 and 4000),
  created_at timestamptz not null default now(),
  unique (capture_session_id, sequence_number)
);

create index if not exists meeting_transcript_chunks_meeting_sequence_index
  on meeting_transcript_chunks(meeting_id, sequence_number);

create table if not exists idempotency_records (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  request_scope varchar(120) not null,
  idempotency_key varchar(100) not null,
  request_fingerprint varchar(64) not null,
  response_status integer not null,
  response_body jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (user_id, request_scope, idempotency_key)
);

create index if not exists idempotency_records_expires_at_index on idempotency_records(expires_at);
