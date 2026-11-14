-- SECURITY LAB production storage
-- Run this script in Supabase SQL Editor.
create table if not exists public.lab_runs (
  run_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  record jsonb not null,
  created_at timestamptz not null default now(),
  constraint lab_runs_pkey primary key (user_id, run_id),
  constraint lab_runs_record_object check (jsonb_typeof(record) = 'object')
);

create index if not exists lab_runs_user_created_idx
  on public.lab_runs (user_id, created_at desc);

alter table public.lab_runs enable row level security;

drop policy if exists "Users can read their own lab runs" on public.lab_runs;
create policy "Users can read their own lab runs"
  on public.lab_runs for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own lab runs" on public.lab_runs;
create policy "Users can insert their own lab runs"
  on public.lab_runs for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own lab runs" on public.lab_runs;
create policy "Users can delete their own lab runs"
  on public.lab_runs for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.lab_runs to authenticated;
