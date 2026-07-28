-- 003_reject_planned_site_writes.sql
-- Production preparation only. Do not execute until the rollout window is approved.
--
-- Transaction: yes. Run this whole file in one transaction.
--
-- Goal:
--   Permit writes only when the referenced site is live. Existing NULL site_id
--   rows remain valid temporarily for backward compatibility during rollout.

begin;

create or replace function public.reject_non_live_site_writes()
returns trigger
language plpgsql
as $$
declare
  site_status text;
begin
  if new.site_id is null then
    return new;
  end if;

  select status into site_status
  from public.sites
  where id = new.site_id;

  if site_status is distinct from 'live' then
    raise exception 'Invalid site attribution for production write';
  end if;

  return new;
end;
$$;

drop trigger if exists reject_non_live_site_writes_applications on public.applications;
create trigger reject_non_live_site_writes_applications
before insert or update of site_id on public.applications
for each row
execute function public.reject_non_live_site_writes();

drop trigger if exists reject_non_live_site_writes_visitors on public.visitors;
create trigger reject_non_live_site_writes_visitors
before insert or update of site_id on public.visitors
for each row
execute function public.reject_non_live_site_writes();

drop trigger if exists reject_non_live_site_writes_site_settings on public.site_settings;
create trigger reject_non_live_site_writes_site_settings
before insert or update of site_id on public.site_settings
for each row
execute function public.reject_non_live_site_writes();

drop trigger if exists reject_non_live_site_writes_switch_log on public.switch_log;
create trigger reject_non_live_site_writes_switch_log
before insert or update of site_id on public.switch_log
for each row
execute function public.reject_non_live_site_writes();

-- Clean up the previous trigger names if an earlier draft was applied.
drop trigger if exists reject_planned_site_writes_applications on public.applications;
drop trigger if exists reject_planned_site_writes_visitors on public.visitors;
drop trigger if exists reject_planned_site_writes_site_settings on public.site_settings;
drop trigger if exists reject_planned_site_writes_switch_log on public.switch_log;
drop function if exists public.reject_planned_site_writes();

commit;

-- Rollback trigger-drop statements for emergency use:
--
-- drop trigger if exists reject_non_live_site_writes_applications on public.applications;
-- drop trigger if exists reject_non_live_site_writes_visitors on public.visitors;
-- drop trigger if exists reject_non_live_site_writes_site_settings on public.site_settings;
-- drop trigger if exists reject_non_live_site_writes_switch_log on public.switch_log;
