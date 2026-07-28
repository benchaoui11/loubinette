# Architecture

The Control Center is a separate Next.js App Router application. It is not deployed inside `firstidp.com/admin`.

Core principles:

- Multi-site first: every durable business table receives `site_id`.
- Server-side data access: the service-role key is never sent to the browser.
- Read-only first: mutations are disabled until RBAC, audit logs, and history tables are verified.
- Accurate financial semantics: `applications.total` is Submitted Value, not revenue.
- Private documents: existing storage paths are preserved; signed URLs are generated only after authorization and access logging.

Website registry:

- Live IDP websites: `firstidp.com`, `worldidp.com`.
- Planned IDP websites are visible in Website Manager with all data-producing feature flags disabled until configured.
- Non-IDP businesses do not belong in this Control Center.

Major layers:

- `app/`: route groups for auth and dashboard workspaces.
- `components/`: reusable shell, charts, tables, document metadata, and states.
- `lib/sites/`: typed IDP website registry and dynamic dashboard navigation.
- `lib/database/`: read-only connected data access.
- `lib/auth/`: Supabase Auth owner bootstrap.
- `lib/analytics/`: date boundaries and metrics.
- `lib/attribution/`: deterministic source classification.
- `supabase/migrations/`: additive migrations, not automatically applied.
