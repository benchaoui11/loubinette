-- 007_analytics_foundation.sql

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  anonymous_visitor_id text,
  session_id text,
  event_name text not null,
  occurred_at timestamptz not null default now(),
  page_url text,
  page_path text,
  landing_page text,
  referrer text,
  referrer_domain text,
  device_type text,
  browser text,
  operating_system text,
  country text,
  is_internal boolean not null default false,
  is_bot boolean not null default false,
  event_metadata jsonb,
  application_ref text,
  order_id uuid
);

create index if not exists analytics_events_site_time_idx on public.analytics_events(site_id, occurred_at desc);
create index if not exists analytics_events_name_time_idx on public.analytics_events(event_name, occurred_at desc);
