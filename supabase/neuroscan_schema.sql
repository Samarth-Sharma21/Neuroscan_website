-- ═══════════════════════════════════════════════════
--  Neuroscan — Supabase Database Schema
--  All tables prefixed with neuroscan_ for isolation
--  Run this SQL in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════

-- ────────────────────────────────────────────────────
-- 1. neuroscan_profiles — user profiles linked to auth
-- ────────────────────────────────────────────────────

create table if not exists public.neuroscan_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  age         integer check (age is null or (age >= 0 and age <= 130)),
  sex         text,
  date_of_birth date,
  blood_group text,
  known_conditions text,
  current_medications text,
  allergies text,
  family_history text,
  clinical_notes text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Enable RLS
alter table public.neuroscan_profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.neuroscan_profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.neuroscan_profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.neuroscan_profiles for update
  using (auth.uid() = id);


-- ────────────────────────────────────────────────────
-- 2. neuroscan_reports — saved MRI analysis reports
-- ────────────────────────────────────────────────────

create table if not exists public.neuroscan_reports (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  prediction_id     text,                 -- from model API
  predicted_class   text not null,
  confidence        numeric(5,2),
  severity_level    int,
  severity_label    text,
  class_description text,
  probabilities     jsonb,                -- { "Non Demented": 85.2, ... }
  input_filename    text,
  model_version     text,
  attention_heatmap text,                 -- base64 (optional, can be large)
  attention_overlay text,                 -- base64 (optional)
  hufa_stats        jsonb,                -- raw HUFA stats JSON
  brain_regions     jsonb,                -- [{region_name, attention_percent}, ...]
  created_at        timestamptz default now()
);

-- Enable RLS
alter table public.neuroscan_reports enable row level security;

-- Users can read their own reports
create policy "Users can read own reports"
  on public.neuroscan_reports for select
  using (auth.uid() = user_id);

-- Users can insert their own reports
create policy "Users can insert own reports"
  on public.neuroscan_reports for insert
  with check (auth.uid() = user_id);

-- Users can delete their own reports
create policy "Users can delete own reports"
  on public.neuroscan_reports for delete
  using (auth.uid() = user_id);

-- Index for fast lookups by user
create index if not exists idx_neuroscan_reports_user_id
  on public.neuroscan_reports(user_id);

-- Index for ordering by date
create index if not exists idx_neuroscan_reports_created_at
  on public.neuroscan_reports(created_at desc);


-- ────────────────────────────────────────────────────
-- 3. Auto-create profile on signup (trigger)
-- ────────────────────────────────────────────────────

create or replace function public.handle_neuroscan_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.neuroscan_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

-- Drop existing trigger if re-running
drop trigger if exists on_auth_user_created_neuroscan on auth.users;

create trigger on_auth_user_created_neuroscan
  after insert on auth.users
  for each row
  execute function public.handle_neuroscan_new_user();
