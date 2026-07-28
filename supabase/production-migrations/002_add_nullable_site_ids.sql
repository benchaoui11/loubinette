-- 002_add_nullable_site_ids.sql
-- Production preparation only. Do not execute until the rollout window is approved.
--
-- This file has three execution sections:
--   A) Transaction-safe schema changes.
--   B) CREATE INDEX CONCURRENTLY statements that must run outside a transaction.
--   C) Transaction-safe foreign-key validation.
--
-- Existing rows intentionally remain NULL/unattributed. Do not backfill legacy rows.

-- ============================================================================
-- A) Run inside a transaction
-- ============================================================================

begin;

alter table public.applications
  add column if not exists site_id uuid;

alter table public.visitors
  add column if not exists site_id uuid;

alter table public.site_settings
  add column if not exists site_id uuid;

alter table public.switch_log
  add column if not exists site_id uuid;

alter table public.applications
  drop constraint if exists applications_site_id_fkey,
  add constraint applications_site_id_fkey
  foreign key (site_id) references public.sites(id) on delete restrict not valid;

alter table public.visitors
  drop constraint if exists visitors_site_id_fkey,
  add constraint visitors_site_id_fkey
  foreign key (site_id) references public.sites(id) on delete restrict not valid;

alter table public.site_settings
  drop constraint if exists site_settings_site_id_fkey,
  add constraint site_settings_site_id_fkey
  foreign key (site_id) references public.sites(id) on delete restrict not valid;

alter table public.switch_log
  drop constraint if exists switch_log_site_id_fkey,
  add constraint switch_log_site_id_fkey
  foreign key (site_id) references public.sites(id) on delete restrict not valid;

comment on column public.applications.site_id is
  'Nullable during rollout. New records must set this from the originating IDP website. Existing legacy rows remain NULL/unattributed unless proven by a trusted source.';

comment on column public.visitors.site_id is
  'Nullable during rollout. New visitor rows must set this server-side from the originating IDP website. Do not infer from referrer.';

comment on column public.site_settings.site_id is
  'Nullable during rollout. New per-site settings rows must set this to the managed IDP website.';

comment on column public.switch_log.site_id is
  'Nullable during rollout. New mode-switch audit rows must set this to the managed IDP website.';

commit;

-- ============================================================================
-- B) Run each CREATE INDEX CONCURRENTLY statement outside a transaction
-- ============================================================================
--
-- Manual retry rule:
--   If a CREATE INDEX CONCURRENTLY attempt fails, Postgres can leave an invalid
--   index with the target name. Before retrying each index, run its preflight
--   query below. If it returns a row, run the matching DROP INDEX CONCURRENTLY
--   command outside a transaction, then rerun CREATE INDEX CONCURRENTLY.

-- Preflight: invalid applications_site_id_created_at_idx
select
  schemaname,
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and indexname = 'applications_site_id_created_at_idx'
  and not exists (
    select 1
    from pg_index i
    join pg_class idx on idx.oid = i.indexrelid
    join pg_namespace n on n.oid = idx.relnamespace
    where n.nspname = 'public'
      and idx.relname = 'applications_site_id_created_at_idx'
      and i.indisvalid
  );
-- If the preflight query returns a row, run outside a transaction:
-- drop index concurrently if exists public.applications_site_id_created_at_idx;
create index concurrently if not exists applications_site_id_created_at_idx
  on public.applications (site_id, created_at desc);

-- Preflight: invalid visitors_site_id_created_at_idx
select
  schemaname,
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and indexname = 'visitors_site_id_created_at_idx'
  and not exists (
    select 1
    from pg_index i
    join pg_class idx on idx.oid = i.indexrelid
    join pg_namespace n on n.oid = idx.relnamespace
    where n.nspname = 'public'
      and idx.relname = 'visitors_site_id_created_at_idx'
      and i.indisvalid
  );
-- If the preflight query returns a row, run outside a transaction:
-- drop index concurrently if exists public.visitors_site_id_created_at_idx;
create index concurrently if not exists visitors_site_id_created_at_idx
  on public.visitors (site_id, created_at desc);

-- Preflight: invalid switch_log_site_id_changed_at_idx
select
  schemaname,
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and indexname = 'switch_log_site_id_changed_at_idx'
  and not exists (
    select 1
    from pg_index i
    join pg_class idx on idx.oid = i.indexrelid
    join pg_namespace n on n.oid = idx.relnamespace
    where n.nspname = 'public'
      and idx.relname = 'switch_log_site_id_changed_at_idx'
      and i.indisvalid
  );
-- If the preflight query returns a row, run outside a transaction:
-- drop index concurrently if exists public.switch_log_site_id_changed_at_idx;
create index concurrently if not exists switch_log_site_id_changed_at_idx
  on public.switch_log (site_id, changed_at desc);

-- Preflight: invalid site_settings_site_id_idx
select
  schemaname,
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and indexname = 'site_settings_site_id_idx'
  and not exists (
    select 1
    from pg_index i
    join pg_class idx on idx.oid = i.indexrelid
    join pg_namespace n on n.oid = idx.relnamespace
    where n.nspname = 'public'
      and idx.relname = 'site_settings_site_id_idx'
      and i.indisvalid
  );
-- If the preflight query returns a row, run outside a transaction:
-- drop index concurrently if exists public.site_settings_site_id_idx;
create index concurrently if not exists site_settings_site_id_idx
  on public.site_settings (site_id);

-- Preflight: invalid site_settings_one_row_per_site_idx
select
  schemaname,
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and indexname = 'site_settings_one_row_per_site_idx'
  and not exists (
    select 1
    from pg_index i
    join pg_class idx on idx.oid = i.indexrelid
    join pg_namespace n on n.oid = idx.relnamespace
    where n.nspname = 'public'
      and idx.relname = 'site_settings_one_row_per_site_idx'
      and i.indisvalid
  );
-- If the preflight query returns a row, run outside a transaction:
-- drop index concurrently if exists public.site_settings_one_row_per_site_idx;
create unique index concurrently if not exists site_settings_one_row_per_site_idx
  on public.site_settings (site_id)
  where site_id is not null;

-- ============================================================================
-- C) Run inside a transaction after the concurrent indexes finish
-- ============================================================================

begin;

alter table public.applications validate constraint applications_site_id_fkey;
alter table public.visitors validate constraint visitors_site_id_fkey;
alter table public.site_settings validate constraint site_settings_site_id_fkey;
alter table public.switch_log validate constraint switch_log_site_id_fkey;

commit;
