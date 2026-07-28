-- 005_application_history.sql

create table if not exists public.application_status_history (
  id bigint generated always as identity primary key,
  application_ref text not null,
  application_id uuid,
  site_id uuid references public.sites(id),
  previous_status text,
  new_status text not null,
  reason text,
  changed_by uuid references public.admin_profiles(id),
  changed_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists application_status_history_ref_idx on public.application_status_history(application_ref);
create index if not exists application_status_history_site_created_idx on public.application_status_history(site_id, created_at desc);
