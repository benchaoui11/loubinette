-- 001_sites.sql
-- Additive site registry for the multi-site control center.

create extension if not exists pgcrypto;

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  site_key text not null unique,
  name text not null,
  domain text not null,
  logo_url text,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  color text,
  has_white_page boolean not null default false,
  has_offer_page boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.sites (site_key, name, domain, status, timezone, currency, color, has_white_page, has_offer_page)
values ('firstidp', 'FirstIDP', 'firstidp.com', 'active', 'UTC', 'USD', '#4f8cff', true, true)
on conflict (site_key) do update set
  name = excluded.name,
  domain = excluded.domain,
  has_white_page = excluded.has_white_page,
  has_offer_page = excluded.has_offer_page,
  updated_at = now();
