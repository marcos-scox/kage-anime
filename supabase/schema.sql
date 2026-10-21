-- Optional personal-data schema for the KAGE ANIME client.
-- Enable RLS before exposing the public anon key; never use service_role in the APK.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  anime_id bigint not null,
  anime_data jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, anime_id)
);

create table if not exists public.watch_history (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  anime_id bigint not null,
  anime_data jsonb not null,
  episode_number integer,
  episode_title text,
  playback_position_seconds integer not null default 0 check (playback_position_seconds >= 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists favorites_user_created_idx on public.favorites (user_id, created_at desc);
create index if not exists watch_history_user_updated_idx on public.watch_history (user_id, updated_at desc);
create index if not exists watch_history_anime_idx on public.watch_history (user_id, anime_id);

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.watch_history enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites for select to authenticated using (auth.uid() = user_id);
drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own" on public.favorites for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "favorites_update_own" on public.favorites;
create policy "favorites_update_own" on public.favorites for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own" on public.favorites for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "watch_history_select_own" on public.watch_history;
create policy "watch_history_select_own" on public.watch_history for select to authenticated using (auth.uid() = user_id);
drop policy if exists "watch_history_insert_own" on public.watch_history;
create policy "watch_history_insert_own" on public.watch_history for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "watch_history_update_own" on public.watch_history;
create policy "watch_history_update_own" on public.watch_history for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "watch_history_delete_own" on public.watch_history;
create policy "watch_history_delete_own" on public.watch_history for delete to authenticated using (auth.uid() = user_id);
