-- 001_idp_sites_registry.sql
-- Production preparation only. Do not execute until the rollout window is approved.
--
-- Transaction: yes. Run this whole file in one transaction.
--
-- Goal:
--   Create/align the IDP-only site registry used for durable multi-site
--   attribution. Existing business rows are not backfilled by this migration.

begin;

create extension if not exists pgcrypto;

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  domain text not null,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sites add column if not exists id uuid default gen_random_uuid();
alter table public.sites add column if not exists slug text;
alter table public.sites add column if not exists name text;
alter table public.sites add column if not exists domain text;
alter table public.sites add column if not exists status text default 'planned';
alter table public.sites add column if not exists created_at timestamptz not null default now();
alter table public.sites add column if not exists updated_at timestamptz not null default now();

do $$
declare
  duplicate_ids text;
  null_id_count bigint;
begin
  select string_agg(id::text, ', ' order by id::text)
  into duplicate_ids
  from (
    select id
    from public.sites
    where id is not null
    group by id
    having count(*) > 1
    limit 20
  ) duplicate_site_ids;

  if duplicate_ids is not null then
    raise exception
      'Preflight failed: public.sites.id contains duplicate values: %. Resolve duplicate IDs before rerunning this migration.',
      duplicate_ids;
  end if;

  select count(*)
  into null_id_count
  from public.sites
  where id is null;

  if null_id_count > 0 then
    raise exception
      'Preflight failed: public.sites.id is NULL on % row(s). Manually resolve these rows before rerunning this migration.',
      null_id_count;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.sites'::regclass
      and contype = 'p'
  ) then
    alter table public.sites add constraint sites_pkey primary key (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_index i
    join pg_class c on c.oid = i.indrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid
    where n.nspname = 'public'
      and c.relname = 'sites'
      and a.attname = 'id'
      and i.indisunique
      and i.indisvalid
      and i.indpred is null
      and i.indkey::text = a.attnum::text
  ) then
    alter table public.sites add constraint sites_id_key unique (id);
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sites'
      and column_name = 'site_key'
  ) then
    update public.sites
    set slug = site_key
    where slug is null
      and site_key is not null;
  end if;
end $$;

-- Drop only known legacy status constraints. Do not scan/drop arbitrary checks.
alter table public.sites drop constraint if exists sites_status_check;
alter table public.sites drop constraint if exists sites_status_chk;
alter table public.sites drop constraint if exists sites_status_valid;

alter table public.sites
  add constraint sites_status_transition_check
  check (status in ('active', 'live', 'planned', 'disabled', 'archived'))
  not valid;

update public.sites
set status = 'live'
where status = 'active';

do $$
declare
  unsupported_statuses text;
begin
  select string_agg(status_value, ', ' order by status_value)
  into unsupported_statuses
  from (
    select distinct coalesce(status, '<NULL>') as status_value
    from public.sites
    where status is null
      or status not in ('live', 'planned', 'disabled', 'archived')
  ) invalid_statuses;

  if unsupported_statuses is not null then
    raise exception
      'Preflight failed: public.sites.status contains unsupported values: %. Resolve these statuses before rerunning this migration. Only active is normalized automatically to live.',
      unsupported_statuses;
  end if;
end $$;

alter table public.sites drop constraint if exists sites_status_transition_check;

alter table public.sites
  add constraint sites_status_check
  check (status in ('live', 'planned', 'disabled', 'archived'));

alter table public.sites
  alter column id set not null,
  alter column slug set not null,
  alter column name set not null,
  alter column domain set not null,
  alter column status set default 'planned',
  alter column status set not null,
  alter column created_at set default now(),
  alter column updated_at set default now();

create unique index if not exists sites_slug_key on public.sites (slug);
create unique index if not exists sites_domain_key on public.sites (domain);

create temporary table idp_site_seed (
  slug text primary key,
  name text not null,
  domain text not null,
  status text not null
) on commit drop;

insert into idp_site_seed (slug, name, domain, status)
values
  ('firstidp', 'FirstIDP', 'firstidp.com', 'live'),
  ('worldidp', 'WorldIDP', 'worldidp.com', 'live'),
  ('applyinternationaldrivingpermit', 'Apply International Driving Permit', 'applyinternationaldrivingpermit.com', 'planned'),
  ('international-auto-association', 'International Auto Association', 'international-auto-association.com', 'planned'),
  ('internationaldriversdocument', 'International Drivers Document', 'internationaldriversdocument.com', 'planned'),
  ('international-driving-document', 'International Driving Document', 'international-driving-document.com', 'planned'),
  ('international-idp', 'International IDP', 'international-idp.com', 'planned'),
  ('international-license', 'International License', 'international-license.net', 'planned'),
  ('applyidponline', 'Apply IDP Online', 'applyidponline.com', 'planned'),
  ('getidponline', 'Get IDP Online', 'getidponline.com', 'planned');

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sites'
      and column_name = 'site_key'
  ) then
    insert into public.sites (site_key, slug, name, domain, status)
    select slug, slug, name, domain, status
    from idp_site_seed
    on conflict (slug) do update set
      site_key = excluded.site_key,
      name = excluded.name,
      domain = excluded.domain,
      status = excluded.status,
      updated_at = now();
  else
    insert into public.sites (slug, name, domain, status)
    select slug, name, domain, status
    from idp_site_seed
    on conflict (slug) do update set
      name = excluded.name,
      domain = excluded.domain,
      status = excluded.status,
      updated_at = now();
  end if;
end $$;

create or replace function public.set_sites_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_sites_updated_at on public.sites;
create trigger set_sites_updated_at
before update on public.sites
for each row
execute function public.set_sites_updated_at();

alter table public.sites enable row level security;

drop policy if exists "service role manages sites" on public.sites;
create policy "service role manages sites"
  on public.sites
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

commit;
