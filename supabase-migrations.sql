-- ============================================================
-- Migration: profiles, checkins, chat_messages + project columns
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. User profiles
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nickname text,
  first_name text,
  last_name text,
  avatar_color text default '#6366f1',
  avatar_gradient text default 'from-violet-500 to-indigo-500',
  avatar_shape text default 'circle',
  billing_name text,
  billing_address text,
  billing_city text,
  billing_country text,
  billing_vat text,
  skill_tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Daily check-ins
create table if not exists public.checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  progress text not null,
  blockers text not null,
  next_steps text not null,
  ai_summary text,
  created_at timestamptz default now()
);

alter table public.checkins enable row level security;

create policy "Users can manage own checkins"
  on public.checkins for all using (auth.uid() = user_id);

-- 3. Chat messages
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;

create policy "Users can manage own chat messages"
  on public.chat_messages for all using (auth.uid() = user_id);

-- 4. Add columns to projects
alter table public.projects
  add column if not exists idea_validation jsonb,
  add column if not exists launch_checklist jsonb default '[]';

-- 5. updated_at trigger for profiles
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- Migration: Build in Public + momentum
-- ============================================================

-- 6. Add public visibility columns to projects
alter table public.projects
  add column if not exists is_public boolean default false,
  add column if not exists public_slug text unique;

-- Allow anonymous reads for publicly published projects
create policy "Public projects are viewable by anyone"
  on public.projects for select
  using (is_public = true);

-- Allow anonymous reads for check-ins that belong to public projects
create policy "Checkins of public projects are viewable by anyone"
  on public.checkins for select
  using (
    exists (
      select 1 from public.projects
      where public.projects.id = public.checkins.project_id
        and public.projects.is_public = true
    )
  );

-- ============================================================
-- Migration: Closed Beta
-- ============================================================

-- 1. Beta access flag on profiles (existing users get access immediately)
alter table public.profiles
  add column if not exists beta_access boolean default false;

update public.profiles set beta_access = true where beta_access is false or beta_access is null;

-- 2. Invite codes
create table if not exists public.beta_invites (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  max_uses integer default 1,
  use_count integer default 0,
  note text,
  created_at timestamptz default now()
);

alter table public.beta_invites enable row level security;
-- No public read — all access is through the RPC below

-- 3. Waitlist
create table if not exists public.beta_waitlist (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  handle text not null,
  status text default 'pending' check (status in ('pending', 'invited', 'joined')),
  created_at timestamptz default now()
);

alter table public.beta_waitlist enable row level security;
create policy "Anyone can read waitlist"
  on public.beta_waitlist for select
  using (true);

create policy "Anyone can join waitlist"
  on public.beta_waitlist for insert
  with check (true);

create policy "Anyone can update their waitlist entry"
  on public.beta_waitlist for update
  using (true)
  with check (true);

-- 4. Rename name → handle if old schema was already applied
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'beta_waitlist'
      and column_name  = 'name'
  ) then
    alter table public.beta_waitlist rename column "name" to handle;
    alter table public.beta_waitlist alter column handle set not null;
  end if;
end $$;

-- 5. RPC: validate + consume a code and grant beta_access
create or replace function public.redeem_beta_invite(code_to_use text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_rec record;
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    return false;
  end if;

  select * into invite_rec
  from public.beta_invites
  where code = upper(trim(code_to_use))
    and use_count < max_uses;

  if not found then
    return false;
  end if;

  update public.beta_invites
  set use_count = use_count + 1
  where id = invite_rec.id;

  update public.profiles
  set beta_access = true
  where id = caller_id;

  return true;
end;
$$;

grant execute on function public.redeem_beta_invite(text) to authenticated;

-- 6. RPC: join waitlist (callable anonymously)
drop function if exists public.join_beta_waitlist(text, text);
create or replace function public.join_beta_waitlist(p_email text, p_handle text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.beta_waitlist (email, handle)
  values (lower(trim(p_email)), ltrim(trim(p_handle), '@'))
  on conflict (email) do update set handle = excluded.handle;
  return true;
exception when others then
  return false;
end;
$$;

grant execute on function public.join_beta_waitlist(text, text) to anon, authenticated;
