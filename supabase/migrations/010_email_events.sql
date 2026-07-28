-- 010_email_events.sql

create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id),
  application_ref text,
  order_id uuid references public.orders(id),
  customer_email text,
  template_key text,
  provider text not null default 'resend',
  provider_message_id text unique,
  subject text,
  status text,
  created_at timestamptz not null default now()
);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  email_message_id uuid references public.email_messages(id),
  provider_event_id text unique,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  metadata jsonb
);
