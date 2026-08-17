-- 0002: provenance for imported timetables.
-- Schedules can now come from a live provider instead of the bundled dataset,
-- so every row records where it came from and when it was last confirmed.

alter table public.schedules
  add column if not exists source       text not null default 'dataset',
  add column if not exists source_ref   text,
  add column if not exists last_seen_at timestamptz not null default now();

create index if not exists schedules_source_idx
  on public.schedules (source, last_seen_at desc);

comment on column public.schedules.source is
  'dataset | aerodatabox | opensky — which provider produced this row';
comment on column public.schedules.source_ref is
  'Stable identifier at the provider, for reconciliation';
comment on column public.schedules.last_seen_at is
  'Last time an import confirmed this flight still operates';

-- Imported airports may not be in the curated reference set. Mark the ones the
-- importer created so a later cleanup can tell them apart.
alter table public.airports
  add column if not exists source text not null default 'dataset';

-- Observability for the sync job: what ran, against whom, with what outcome.
create table if not exists public.import_runs (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null,
  airline_icao  text,
  airport_icao  text,
  target_date   date,
  flights_found integer not null default 0,
  flights_saved integer not null default 0,
  airports_added integer not null default 0,
  skipped       jsonb,
  error         text,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);

create index if not exists import_runs_recent_idx
  on public.import_runs (started_at desc);

alter table public.import_runs enable row level security;

-- Import history is operational data: readable by signed-in pilots so the UI
-- can show data freshness, writable only by the service role (which bypasses RLS).
drop policy if exists "import runs readable" on public.import_runs;
create policy "import runs readable" on public.import_runs
  for select using (auth.role() = 'authenticated');
