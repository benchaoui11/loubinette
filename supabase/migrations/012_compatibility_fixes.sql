-- 012_compatibility_fixes.sql
-- Compatibility objects referenced by the current FirstIDP repo.

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

create or replace function public.get_order_number(p_ref text, p_email text)
returns integer
language sql
security definer
set search_path = public
as $$
  select a.order_number
  from public.applications a
  where a.ref = p_ref
    and lower(a.email) = lower(p_email)
  limit 1;
$$;

grant execute on function public.get_order_number(text, text) to anon, authenticated;
