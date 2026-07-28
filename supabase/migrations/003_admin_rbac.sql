-- 003_admin_rbac.sql
-- Role and permission foundation. Apply only after verifying auth setup.

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  role_key text not null unique,
  name text not null
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  permission_key text not null unique,
  description text
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.admin_roles (
  admin_id uuid not null references public.admin_profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  primary key (admin_id, role_id)
);

create table if not exists public.admin_site_access (
  admin_id uuid not null references public.admin_profiles(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  primary key (admin_id, site_id)
);

insert into public.roles (role_key, name) values
  ('super_admin', 'Super Admin'),
  ('manager', 'Manager'),
  ('reviewer', 'Reviewer'),
  ('support', 'Support'),
  ('analytics_viewer', 'Analytics Viewer')
on conflict (role_key) do nothing;

insert into public.permissions (permission_key, description) values
  ('sites.view_all', 'View all sites'),
  ('sites.view_assigned', 'View assigned sites'),
  ('analytics.view', 'View analytics'),
  ('applications.view', 'View applications'),
  ('applications.update', 'Update applications'),
  ('documents.view', 'View sensitive documents'),
  ('documents.review', 'Review documents'),
  ('financials.view', 'View financial data'),
  ('orders.update', 'Update orders'),
  ('emails.send', 'Send emails'),
  ('team.manage', 'Manage team'),
  ('settings.manage', 'Manage settings'),
  ('exports.create', 'Create exports')
on conflict (permission_key) do nothing;
