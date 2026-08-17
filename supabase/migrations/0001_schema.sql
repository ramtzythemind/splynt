-- Splynt — virtual airline career for MSFS 2020/2024
-- 0001: core schema, functions, triggers and row level security.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reference data (world state — readable by everyone, written by admins/seed)
-- ---------------------------------------------------------------------------

create table public.airports (
  icao          char(4) primary key,
  iata          char(3),
  name          text        not null,
  city          text        not null,
  country       text        not null,
  lat           double precision not null,
  lon           double precision not null,
  elevation_ft  integer     not null default 0,
  timezone      text        not null,           -- IANA, e.g. 'Europe/Rome'
  longest_rwy_ft integer
);

create index airports_iata_idx on public.airports (iata);

create type public.aircraft_class as enum (
  'turboprop', 'regional', 'narrowbody', 'widebody', 'heavy'
);

create table public.aircraft_types (
  icao            varchar(8) primary key,        -- A320, B38M, ...
  name            text not null,
  manufacturer    text not null,
  class           public.aircraft_class not null,
  pax_capacity    integer not null,
  cruise_speed_kt integer not null,
  range_nm        integer not null,
  mtow_kg         integer not null,
  min_rank_level  integer not null default 1     -- career gate
);

create table public.airlines (
  id           uuid primary key default gen_random_uuid(),
  icao         char(3) not null unique,
  iata         char(2),
  name         text not null,
  callsign     text not null,
  country      text not null,
  hub_icao     char(4) not null references public.airports(icao),
  accent       text not null default '#3ea6ff',  -- brand colour for the UI
  tagline      text,
  description  text,
  difficulty   integer not null default 2 check (difficulty between 1 and 5)
);

create table public.airline_fleet (
  airline_id     uuid not null references public.airlines(id) on delete cascade,
  aircraft_icao  varchar(8) not null references public.aircraft_types(icao),
  tail_count     integer not null default 1,
  primary key (airline_id, aircraft_icao)
);

-- The real timetable. All times are UTC (Zulu) — the reference sim pilots use.
create table public.schedules (
  id             uuid primary key default gen_random_uuid(),
  airline_id     uuid not null references public.airlines(id) on delete cascade,
  flight_number  text not null,
  dep_icao       char(4) not null references public.airports(icao),
  arr_icao       char(4) not null references public.airports(icao),
  std_utc        time not null,                 -- scheduled time of departure
  block_minutes  integer not null check (block_minutes > 0),
  aircraft_icao  varchar(8) not null references public.aircraft_types(icao),
  pax_typical    integer not null,
  cargo_kg       integer not null default 0,
  distance_nm    integer not null,
  days_of_week   smallint[] not null default '{1,2,3,4,5,6,7}',  -- 1 = Monday
  is_active      boolean not null default true,
  unique (airline_id, flight_number, dep_icao)
);

create index schedules_airline_idx on public.schedules (airline_id, is_active);
create index schedules_dep_idx on public.schedules (dep_icao);

create table public.ranks (
  level        integer primary key,
  name         text not null,
  min_xp       integer not null,
  max_class    public.aircraft_class not null,
  perk         text
);

-- ---------------------------------------------------------------------------
-- Pilot state
-- ---------------------------------------------------------------------------

create table public.pilots (
  id             uuid primary key references auth.users(id) on delete cascade,
  callsign       text not null unique,
  display_name   text not null,
  airline_id     uuid references public.airlines(id) on delete set null,
  home_base_icao char(4) references public.airports(icao),
  current_icao   char(4) references public.airports(icao),  -- where the pilot physically is
  xp             integer not null default 0,
  rank_level     integer not null default 1 references public.ranks(level),
  total_flights  integer not null default 0,
  total_minutes  integer not null default 0,
  total_pax      integer not null default 0,
  onboarded_at   timestamptz,
  created_at     timestamptz not null default now()
);

create index pilots_airline_idx on public.pilots (airline_id);

-- Long-lived tokens used by the desktop ACARS client. Only the hash is stored.
create table public.acars_tokens (
  id           uuid primary key default gen_random_uuid(),
  pilot_id     uuid not null references public.pilots(id) on delete cascade,
  label        text not null default 'Desktop',
  token_hash   text not null unique,
  prefix       text not null,                   -- first 8 chars, for display
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);

create index acars_tokens_pilot_idx on public.acars_tokens (pilot_id);

create type public.booking_status as enum (
  'booked', 'in_progress', 'completed', 'cancelled'
);

create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  pilot_id      uuid not null references public.pilots(id) on delete cascade,
  schedule_id   uuid not null references public.schedules(id) on delete cascade,
  flight_date   date not null,                  -- which dated instance of the schedule
  status        public.booking_status not null default 'booked',
  aircraft_icao varchar(8) not null references public.aircraft_types(icao),
  pax           integer not null,
  cargo_kg      integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (pilot_id, schedule_id, flight_date)
);

create index bookings_pilot_status_idx on public.bookings (pilot_id, status);

create type public.pirep_status as enum ('in_progress', 'filed', 'accepted', 'rejected');

create table public.pireps (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null unique references public.bookings(id) on delete cascade,
  pilot_id       uuid not null references public.pilots(id) on delete cascade,
  status         public.pirep_status not null default 'in_progress',
  aircraft_icao  varchar(8) not null references public.aircraft_types(icao),
  dep_icao       char(4) not null references public.airports(icao),
  arr_icao       char(4) not null references public.airports(icao),
  actual_out     timestamptz,                   -- off blocks
  actual_off     timestamptz,                   -- wheels up
  actual_on      timestamptz,                   -- touchdown
  actual_in      timestamptz,                   -- on blocks
  block_minutes  integer,
  landing_rate_fpm integer,                     -- negative = descending
  fuel_used_kg   integer,
  distance_nm    integer,
  max_altitude_ft integer,
  max_g          numeric(4,2),
  overspeed_events integer not null default 0,
  stall_events     integer not null default 0,
  pause_events     integer not null default 0,
  landed_off_target boolean not null default false,
  score          integer,
  xp_awarded     integer,
  breakdown      jsonb,                         -- itemised XP lines
  remarks        text,
  sim            text,                          -- 'MSFS2020' | 'MSFS2024'
  client_version text,
  created_at     timestamptz not null default now(),
  filed_at       timestamptz
);

create index pireps_pilot_idx on public.pireps (pilot_id, created_at desc);

create table public.telemetry (
  id          bigserial primary key,
  pirep_id    uuid not null references public.pireps(id) on delete cascade,
  ts          timestamptz not null,
  lat         double precision not null,
  lon         double precision not null,
  altitude_ft integer not null,
  gs_kt       integer not null,
  ias_kt      integer,
  vs_fpm      integer,
  heading     integer,
  fuel_kg     integer,
  on_ground   boolean not null default false,
  phase       text
);

create index telemetry_pirep_ts_idx on public.telemetry (pirep_id, ts);

create table public.xp_events (
  id         uuid primary key default gen_random_uuid(),
  pilot_id   uuid not null references public.pilots(id) on delete cascade,
  pirep_id   uuid references public.pireps(id) on delete set null,
  amount     integer not null,
  reason     text not null,
  created_at timestamptz not null default now()
);

create index xp_events_pilot_idx on public.xp_events (pilot_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Functions & triggers
-- ---------------------------------------------------------------------------

create or replace function public.rank_for_xp(p_xp integer)
returns integer
language sql
stable
as $$
  select coalesce(max(level), 1) from public.ranks where min_xp <= p_xp;
$$;

-- Creates the pilot profile as soon as a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_callsign text;
  final_callsign text;
  suffix integer := 0;
begin
  base_callsign := upper(
    regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')
  );
  if base_callsign = '' then
    base_callsign := 'PILOT';
  end if;
  base_callsign := left(base_callsign, 10);
  final_callsign := base_callsign;

  while exists (select 1 from public.pilots where callsign = final_callsign) loop
    suffix := suffix + 1;
    final_callsign := base_callsign || suffix::text;
  end loop;

  insert into public.pilots (id, callsign, display_name)
  values (
    new.id,
    final_callsign,
    coalesce(new.raw_user_meta_data ->> 'display_name', final_callsign)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Applies an accepted PIREP to the pilot's career: XP, rank, totals, position.
create or replace function public.apply_pirep()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and coalesce(old.status, 'in_progress') <> 'accepted' then
    insert into public.xp_events (pilot_id, pirep_id, amount, reason)
    values (new.pilot_id, new.id, coalesce(new.xp_awarded, 0), 'Flight completed');

    update public.pilots p
    set xp            = p.xp + coalesce(new.xp_awarded, 0),
        rank_level    = public.rank_for_xp(p.xp + coalesce(new.xp_awarded, 0)),
        total_flights = p.total_flights + 1,
        total_minutes = p.total_minutes + coalesce(new.block_minutes, 0),
        total_pax     = p.total_pax + coalesce(
          (select b.pax from public.bookings b where b.id = new.booking_id), 0
        ),
        current_icao  = new.arr_icao
    where p.id = new.pilot_id;

    update public.bookings set status = 'completed' where id = new.booking_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_pirep_accepted on public.pireps;
create trigger on_pirep_accepted
  after update on public.pireps
  for each row execute function public.apply_pirep();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.airports       enable row level security;
alter table public.aircraft_types enable row level security;
alter table public.airlines       enable row level security;
alter table public.airline_fleet  enable row level security;
alter table public.schedules      enable row level security;
alter table public.ranks          enable row level security;
alter table public.pilots         enable row level security;
alter table public.acars_tokens   enable row level security;
alter table public.bookings       enable row level security;
alter table public.pireps         enable row level security;
alter table public.telemetry      enable row level security;
alter table public.xp_events      enable row level security;

-- Reference data: world-readable, never client-writable.
create policy "reference readable" on public.airports       for select using (true);
create policy "reference readable" on public.aircraft_types for select using (true);
create policy "reference readable" on public.airlines       for select using (true);
create policy "reference readable" on public.airline_fleet  for select using (true);
create policy "reference readable" on public.schedules      for select using (true);
create policy "reference readable" on public.ranks          for select using (true);

-- Pilots: everyone can read rosters/leaderboards, only you edit yourself.
create policy "pilots readable" on public.pilots
  for select using (true);
create policy "pilots update self" on public.pilots
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ACARS tokens are private, and the raw token never leaves the issuing request.
create policy "tokens own" on public.acars_tokens
  for all using (auth.uid() = pilot_id) with check (auth.uid() = pilot_id);

create policy "bookings own" on public.bookings
  for all using (auth.uid() = pilot_id) with check (auth.uid() = pilot_id);

-- PIREPs are public (logbooks are shown on pilot profiles) but only self-written.
create policy "pireps readable" on public.pireps
  for select using (true);
create policy "pireps insert own" on public.pireps
  for insert with check (auth.uid() = pilot_id);
create policy "pireps update own" on public.pireps
  for update using (auth.uid() = pilot_id) with check (auth.uid() = pilot_id);

create policy "telemetry own" on public.telemetry
  for select using (
    exists (
      select 1 from public.pireps p
      where p.id = telemetry.pirep_id and p.pilot_id = auth.uid()
    )
  );

create policy "xp readable" on public.xp_events for select using (true);
