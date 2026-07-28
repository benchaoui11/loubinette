-- 008_attribution.sql

create table if not exists public.attribution_touchpoints (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  anonymous_visitor_id text,
  session_id text,
  touch_type text not null check (touch_type in ('first_touch', 'session_touch', 'last_non_direct')),
  source_category text not null,
  source_name text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  gclid text,
  msclkid text,
  fbclid text,
  referrer text,
  referrer_domain text,
  landing_page text,
  occurred_at timestamptz not null default now(),
  metadata jsonb
);

create table if not exists public.conversion_attribution_snapshots (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  application_ref text,
  order_id uuid,
  first_touch jsonb,
  session_touch jsonb,
  last_non_direct_touch jsonb,
  created_at timestamptz not null default now()
);
