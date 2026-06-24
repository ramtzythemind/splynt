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
