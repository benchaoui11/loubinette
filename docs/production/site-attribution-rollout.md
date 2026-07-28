# Production Site Attribution Rollout

This runbook prepares reliable `site_id` attribution for IDP websites only. Do not infer old site ownership from `referrer`, hostname, landing page, or order reference. Existing unattributed records stay `site_id = null` unless a trusted source proves ownership.

## Files

1. `supabase/production-migrations/001_idp_sites_registry.sql`
2. `supabase/production-migrations/002_add_nullable_site_ids.sql`
3. `supabase/production-migrations/003_reject_planned_site_writes.sql`
4. `supabase/production-migrations/004_site_attribution_verification_queries.sql`

These files are prepared only. They must be reviewed manually and executed during an approved maintenance window.

## Backup Checklist

1. Confirm a recent Supabase backup exists.
2. Confirm the backup restore process has been tested or documented.
3. Export current schemas for `applications`, `visitors`, `site_settings`, `switch_log`, and any existing `sites` table.
4. Record current counts for those tables.
5. Record the current FirstIDP `site_settings.mode` and do not change it during the migration.

## Migration Order

1. Run `001_idp_sites_registry.sql` inside a transaction. It creates/aligns `public.sites`, enables RLS, seeds FirstIDP and WorldIDP as `live`, and seeds future IDP domains as `planned`.
2. Confirm `public.sites(id)` has a valid unique index or constraint before creating foreign keys. Migration `001` fails before adding that guarantee if duplicate `id` values already exist.
3. If migration `001` reports unsupported legacy site statuses, resolve those statuses manually, then rerun `001`. Only `active` is normalized automatically to `live`; unknown values such as `paused` are intentionally not mapped.
4. Run section A of `002_add_nullable_site_ids.sql` inside a transaction. It adds nullable `site_id` columns and `NOT VALID` foreign keys.
5. Run each concurrent-index preflight query in section B of `002_add_nullable_site_ids.sql` outside a transaction. If a preflight query returns an invalid index, run only that index's matching `DROP INDEX CONCURRENTLY IF EXISTS public.index_name` command outside a transaction.
6. Rerun the matching `CREATE INDEX CONCURRENTLY IF NOT EXISTS` statement outside a transaction. `CREATE INDEX CONCURRENTLY` and `DROP INDEX CONCURRENTLY` must never be wrapped in `begin`/`commit`.
7. Run section C of `002_add_nullable_site_ids.sql` inside a transaction. It validates the foreign keys after the indexes finish.
8. Run `003_reject_planned_site_writes.sql` inside a transaction. It keeps `site_id` nullable for compatibility but rejects non-null site IDs unless the referenced site is `live`.
9. Do not run `004_site_attribution_verification_queries.sql` until after the FirstIDP and WorldIDP writer deployments.

## Concurrent Index Retry

Each index in section B of `002_add_nullable_site_ids.sql` has a preflight query. Use it before every retry. A returned row means the previous concurrent build left an invalid index with the target name.

Drop only invalid leftovers with the exact matching command shown under that preflight query, for example:

```sql
drop index concurrently if exists public.applications_site_id_created_at_idx;
```

Then rerun the matching `CREATE INDEX CONCURRENTLY IF NOT EXISTS` statement. Do not drop valid indexes, and do not run any concurrent index command inside a transaction.

## Deployment Order

1. Database foundation: run corrected migration files `001`, `002`, and `003`.
2. FirstIDP writers: deploy application submission, visitor tracking, site settings, and switch log writes with the FirstIDP `site_id`.
3. WorldIDP writers: deploy application submission and visitor tracking with the WorldIDP `site_id`. WorldIDP remains offer-only and must not use `site_settings` or `switch_log`.
4. Control Center filtering: switch per-site filtering from legacy/unattributed handling to reliable `site_id` attribution only after both live writers are verified.
5. Verification: replace every `__REPLACE_*__` value in `004_site_attribution_verification_queries.sql`, then run the read-only checks.

## Smoke Tests

1. Submit one FirstIDP application with a known smoke-test reference and verify it has the FirstIDP `site_id`.
2. Trigger one FirstIDP visitor beacon with a known smoke-test session ID and verify it has the FirstIDP `site_id`.
3. Switch FirstIDP mode only if an approved operator test requires it; otherwise verify current mode reads by FirstIDP `site_id` without changing mode.
4. Submit one WorldIDP application with a known smoke-test reference and verify it has the WorldIDP `site_id`.
5. Trigger one WorldIDP visitor beacon with a known smoke-test session ID and verify it has the WorldIDP `site_id`.
6. Confirm planned sites have zero applications, visitors, site settings, and switch log rows.
7. Confirm old records before the rollout remain `site_id = null`.

## Rollback Triggers

Rollback or pause the rollout if any of these happen:

1. Current FirstIDP or WorldIDP inserts fail.
2. FirstIDP cannot read the current mode.
3. FirstIDP mode updates fail unexpectedly.
4. Public visitor tracking errors affect page loading.
5. Any live writer records a planned, disabled, archived, missing, or wrong site ID.
6. The Control Center shows mixed or incorrect per-site data.

## Rollback Commands

First disable the write guard. Do not drop nullable columns during an incident.

```sql
drop trigger if exists reject_non_live_site_writes_applications on public.applications;
drop trigger if exists reject_non_live_site_writes_visitors on public.visitors;
drop trigger if exists reject_non_live_site_writes_site_settings on public.site_settings;
drop trigger if exists reject_non_live_site_writes_switch_log on public.switch_log;
```

Then roll back website code in this order:

1. Roll back the affected website writer deployment.
2. Pause Control Center per-site filtering for the affected site.
3. Keep nullable `site_id` columns and the `sites` registry in place.
4. Correct wrongly attributed rows only when there is audit-proof ownership from the smoke test or deployment window.

## Data Rules

- Old rows remain unattributed.
- Do not backfill from `referrer`.
- Do not backfill from `landing_page`.
- Do not backfill from hostname.
- Do not backfill from guessed order-reference prefixes.
- Planned sites must not query or write production applications, visitors, settings, switch logs, orders, or revenue.
