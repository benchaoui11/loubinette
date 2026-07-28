-- 004_audit_logs.sql

create table if not exists public.admin_activity_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.admin_profiles(id),
  actor_email text,
  site_id uuid references public.sites(id),
  action text not null,
  entity_type text,
  entity_id text,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_activity_log enable row level security;
