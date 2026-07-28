-- 002_site_association.sql
-- Add nullable site_id columns and safely backfill FirstIDP rows.

alter table public.applications add column if not exists site_id uuid references public.sites(id);
alter table public.visitors add column if not exists site_id uuid references public.sites(id);
alter table public.switch_log add column if not exists site_id uuid references public.sites(id);
alter table public.site_settings add column if not exists site_id uuid references public.sites(id);

update public.applications
set site_id = (select id from public.sites where site_key = 'firstidp')
where site_id is null;

update public.visitors
set site_id = (select id from public.sites where site_key = 'firstidp')
where site_id is null;

update public.switch_log
set site_id = (select id from public.sites where site_key = 'firstidp')
where site_id is null;

update public.site_settings
set site_id = (select id from public.sites where site_key = 'firstidp')
where site_id is null;
