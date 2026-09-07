create table if not exists meeting_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null unique references meetings(id) on delete cascade,
  status varchar(24) not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 3),
  last_error_code varchar(80),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists meeting_processing_jobs_claim_index
  on meeting_processing_jobs(status, next_attempt_at);

create table if not exists meeting_actionable_notes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null unique references meetings(id) on delete cascade,
  summary text not null check (length(btrim(summary)) between 1 and 12000),
  detected_languages jsonb not null default '[]'::jsonb check (jsonb_typeof(detected_languages) = 'array'),
  generation_warning varchar(500),
  generation_provider varchar(80) not null,
  reviewed_at timestamptz,
  reviewed_by_user_id text references "user"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists meeting_actionable_note_items (
  id uuid primary key default gen_random_uuid(),
  actionable_notes_id uuid not null references meeting_actionable_notes(id) on delete cascade,
  item_type varchar(24) not null check (item_type in ('decision', 'action', 'commitment', 'blocker', 'question')),
  content varchar(2000) not null check (length(btrim(content)) between 1 and 2000),
  owner_display_name varchar(120),
  due_date date,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  review_status varchar(24) not null default 'pending' check (review_status in ('pending', 'accepted', 'corrected', 'removed')),
  display_order integer not null check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (actionable_notes_id, display_order)
);

create table if not exists meeting_actionable_note_evidence (
  actionable_note_item_id uuid not null references meeting_actionable_note_items(id) on delete cascade,
  transcript_chunk_id uuid not null references meeting_transcript_chunks(id) on delete cascade,
  primary key (actionable_note_item_id, transcript_chunk_id)
);

insert into meeting_processing_jobs (meeting_id)
select id from meetings where status in ('finalizing', 'processing', 'failed')
on conflict (meeting_id) do nothing;
