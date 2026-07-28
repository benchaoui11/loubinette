# Security Model

Authentication uses Supabase Auth. The first owner is bootstrapped through `OWNER_ADMIN_EMAIL`; the email must never be hardcoded in committed source.

The current milestone is read-only:

- No application status changes.
- No document review actions.
- No site mode switching.
- No exports.
- No public document URLs.

Feature guard:

- FirstIDP is configured with Offer Page, White Page, and page switching.
- WorldIDP is configured with Offer Page only. It must not use `site_settings`, `switch_log`, or switching controls unless its site config explicitly enables both page types and `has_page_switching`.

Server-side controls:

- Protected dashboard layout verifies the Supabase session.
- Owner bootstrap checks the authenticated email against `OWNER_ADMIN_EMAIL`.
- Read-only data is loaded server-side.
- Service-role access is server-only.

Document policy:

- Existing Supabase Storage files must not be moved, renamed, or made public.
- Signed URL endpoint currently refuses access until `document_access_logs`, RBAC, and storage policies are verified.
- Future signed URLs must be short-lived and returned with `Cache-Control: no-store`.

PostHog:

- FirstIDP Session Replay was disabled in `/Users/soufiane/Desktop/FIRSTIDP-FINAL2/posthog-init.js`.
- Historical recordings may still exist inside PostHog and require manual review/deletion.
