-- SECURITY LAB Dashboard: Supabase persistence
-- Each authenticated account can read, insert, and delete only its own rows.

create table if not exists public.lab_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  run_id text not null,
  record jsonb not null,
  created_at timestamptz not null default now(),
  constraint lab_runs_owner_run_id_unique unique (owner_id, run_id),
  constraint lab_runs_record_is_object check (jsonb_typeof(record) = 'object')
);

create index if not exists lab_runs_owner_created_at_idx
  on public.lab_runs (owner_id, created_at desc);

alter table public.lab_runs enable row level security;

grant select, insert, delete on table public.lab_runs to authenticated;
revoke all on table public.lab_runs from anon;

drop policy if exists "Users can read their own lab runs" on public.lab_runs;
create policy "Users can read their own lab runs"
  on public.lab_runs for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Users can insert their own lab runs" on public.lab_runs;
create policy "Users can insert their own lab runs"
  on public.lab_runs for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can delete their own lab runs" on public.lab_runs;
create policy "Users can delete their own lab runs"
  on public.lab_runs for delete to authenticated
  using ((select auth.uid()) = owner_id);

comment on table public.lab_runs is
  'Synthetic iOS Security Lab test records. Each authenticated user can access only their own rows.';
