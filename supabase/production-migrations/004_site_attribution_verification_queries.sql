-- 004_site_attribution_verification_queries.sql
-- Read-only verification queries. Do not run until after the migration and
-- site writer deployments.
--
-- Operator must replace every value marked __REPLACE_*__ before running.
-- Do not infer attribution from referrer.

-- ============================================================================
-- Parameters used by the checks below
-- ============================================================================

-- Replace in every query:
--   __REPLACE_FIRSTIDP_CUTOVER_AT__       example: 2026-07-28 14:30:00+00
--   __REPLACE_WORLDIDP_CUTOVER_AT__       example: 2026-07-28 15:00:00+00
--   __REPLACE_ALL_LIVE_SITES_CUTOVER_AT__ example: after both live writers are deployed
--   __REPLACE_FIRSTIDP_SMOKE_REF__        exact test application ref
--   __REPLACE_WORLDIDP_SMOKE_REF__        exact test application ref
--   __REPLACE_FIRSTIDP_SMOKE_SESSION_ID__ exact test visitor session id
--   __REPLACE_WORLDIDP_SMOKE_SESSION_ID__ exact test visitor session id

select
  status,
  count(*) as site_count
from public.sites
group by status
order by status;

select
  slug,
  name,
  domain,
  status
from public.sites
where slug in (
  'firstidp',
  'worldidp',
  'applyinternationaldrivingpermit',
  'international-auto-association',
  'internationaldriversdocument',
  'international-driving-document',
  'international-idp',
  'international-license',
  'applyidponline',
  'getidponline'
)
order by status, slug;

select
  'legacy_applications_still_nullable' as check_name,
  count(*) as rows_with_null_site_id
from public.applications
where site_id is null;

select
  'legacy_visitors_still_nullable' as check_name,
  count(*) as rows_with_null_site_id
from public.visitors
where site_id is null;

with site_ids as (
  select
    max(id) filter (where slug = 'firstidp') as firstidp_site_id,
    max(id) filter (where slug = 'worldidp') as worldidp_site_id
  from public.sites
)
select
  'firstidp_smoke_application' as check_name,
  count(*) as matched_rows
from public.applications a, site_ids
where a.ref = '__REPLACE_FIRSTIDP_SMOKE_REF__'
  and a.site_id = site_ids.firstidp_site_id;

with site_ids as (
  select
    max(id) filter (where slug = 'firstidp') as firstidp_site_id,
    max(id) filter (where slug = 'worldidp') as worldidp_site_id
  from public.sites
)
select
  'worldidp_smoke_application' as check_name,
  count(*) as matched_rows
from public.applications a, site_ids
where a.ref = '__REPLACE_WORLDIDP_SMOKE_REF__'
  and a.site_id = site_ids.worldidp_site_id;

with site_ids as (
  select
    max(id) filter (where slug = 'firstidp') as firstidp_site_id,
    max(id) filter (where slug = 'worldidp') as worldidp_site_id
  from public.sites
)
select
  'firstidp_smoke_visitor' as check_name,
  count(*) as matched_rows
from public.visitors v, site_ids
where v.session_id = '__REPLACE_FIRSTIDP_SMOKE_SESSION_ID__'
  and v.site_id = site_ids.firstidp_site_id;

with site_ids as (
  select
    max(id) filter (where slug = 'firstidp') as firstidp_site_id,
    max(id) filter (where slug = 'worldidp') as worldidp_site_id
  from public.sites
)
select
  'worldidp_smoke_visitor' as check_name,
  count(*) as matched_rows
from public.visitors v, site_ids
where v.session_id = '__REPLACE_WORLDIDP_SMOKE_SESSION_ID__'
  and v.site_id = site_ids.worldidp_site_id;

select
  'applications_written_to_non_live_sites' as check_name,
  s.slug,
  s.status,
  count(a.id) as rows_written
from public.sites s
join public.applications a on a.site_id = s.id
where s.status <> 'live'
group by s.slug, s.status
order by rows_written desc, s.slug;

select
  'visitors_written_to_non_live_sites' as check_name,
  s.slug,
  s.status,
  count(v.id) as rows_written
from public.sites s
join public.visitors v on v.site_id = s.id
where s.status <> 'live'
group by s.slug, s.status
order by rows_written desc, s.slug;

select
  'site_settings_written_to_non_live_sites' as check_name,
  s.slug,
  s.status,
  count(ss.id) as rows_written
from public.sites s
join public.site_settings ss on ss.site_id = s.id
where s.status <> 'live'
group by s.slug, s.status
order by rows_written desc, s.slug;

select
  'switch_log_written_to_non_live_sites' as check_name,
  s.slug,
  s.status,
  count(sl.id) as rows_written
from public.sites s
join public.switch_log sl on sl.site_id = s.id
where s.status <> 'live'
group by s.slug, s.status
order by rows_written desc, s.slug;

select
  'duplicate_site_settings_rows_per_site' as check_name,
  site_id,
  count(*) as settings_rows
from public.site_settings
where site_id is not null
group by site_id
having count(*) > 1
order by settings_rows desc;

with params as (
  select
    timestamptz '__REPLACE_ALL_LIVE_SITES_CUTOVER_AT__' as all_live_sites_cutover_at
)
select
  'applications_after_cutover_with_null_site_id' as check_name,
  count(*) as failing_rows
from public.applications, params
where created_at >= params.all_live_sites_cutover_at
  and site_id is null;

with params as (
  select
    timestamptz '__REPLACE_ALL_LIVE_SITES_CUTOVER_AT__' as all_live_sites_cutover_at
)
select
  'visitors_after_cutover_with_null_site_id' as check_name,
  count(*) as failing_rows
from public.visitors, params
where created_at >= params.all_live_sites_cutover_at
  and site_id is null;
