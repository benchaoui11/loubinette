-- 009_orders_payments.sql

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  application_ref text,
  order_number integer,
  status text not null default 'pending',
  submitted_value numeric,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  order_id uuid references public.orders(id),
  provider text,
  provider_payment_id text,
  amount numeric not null default 0,
  currency text not null default 'USD',
  status text not null check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded', 'disputed')),
  paid_at timestamptz,
  refunded_amount numeric not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_site_status_idx on public.payments(site_id, status);
create index if not exists orders_site_created_idx on public.orders(site_id, created_at desc);
