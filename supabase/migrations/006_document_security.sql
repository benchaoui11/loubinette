-- 006_document_security.sql
-- Normalize document metadata without moving existing storage files.

create table if not exists public.application_documents (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id),
  application_ref text not null,
  document_type text not null check (document_type in ('selfie', 'license_front', 'license_back', 'signature', 'passport', 'other')),
  storage_bucket text not null default 'documents',
  storage_path text not null,
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed', 'approved', 'rejected', 'replacement_requested')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_ref, document_type, storage_path)
);

create table if not exists public.document_access_logs (
  id bigint generated always as identity primary key,
  document_id uuid references public.application_documents(id),
  site_id uuid references public.sites(id),
  actor_id uuid references public.admin_profiles(id),
  actor_email text,
  action text not null default 'signed_url_requested',
  created_at timestamptz not null default now(),
  metadata jsonb
);

create table if not exists public.document_review_events (
  id bigint generated always as identity primary key,
  document_id uuid references public.application_documents(id),
  site_id uuid references public.sites(id),
  actor_id uuid references public.admin_profiles(id),
  previous_status text,
  new_status text not null,
  reason text,
  created_at timestamptz not null default now()
);
