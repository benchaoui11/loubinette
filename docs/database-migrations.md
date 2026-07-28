# Database Migration Plan

Migrations are additive and are not applied automatically.

Order:

1. `001_sites.sql`
2. `002_site_association.sql`
3. `003_admin_rbac.sql`
4. `004_audit_logs.sql`
5. `005_application_history.sql`
6. `006_document_security.sql`
7. `007_analytics_foundation.sql`
8. `008_attribution.sql`
9. `009_orders_payments.sql`
10. `010_email_events.sql`
11. `011_indexes_and_views.sql`
12. `012_compatibility_fixes.sql`

Before applying:

- Verify live tables, columns, functions, triggers, RLS, storage buckets, and policies.
- Confirm `admin_users` and `get_order_number()` status.
- Back up production data.
- Apply in a staging Supabase project first if available.

Rollback:

- Most objects are additive and can be dropped in reverse order.
- Do not drop added `site_id` columns after application code starts depending on them without a planned deployment rollback.
