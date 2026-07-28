-- 011_indexes_and_views.sql

create index if not exists applications_site_created_idx on public.applications(site_id, created_at desc);
create index if not exists applications_site_status_idx on public.applications(site_id, status);
create index if not exists applications_ref_idx on public.applications(ref);
create index if not exists applications_email_idx on public.applications(lower(email));
create index if not exists applications_group_ref_idx on public.applications(group_ref);
create index if not exists visitors_site_created_idx on public.visitors(site_id, created_at desc);

create or replace view public.daily_application_metrics as
select
  site_id,
  date_trunc('day', created_at) as day,
  count(*) as applicant_rows,
  count(distinct coalesce(group_ref, ref)) as application_groups,
  sum(coalesce(total, 0)) as submitted_value
from public.applications
group by site_id, date_trunc('day', created_at);
