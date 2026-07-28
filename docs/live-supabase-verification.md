# Live Supabase Verification

Status: not performed in this local implementation pass.

Reason:

- Live Supabase credentials were not provided in the conversation. The app is prepared to use `.env.local`, but no live schema verification was run.

Before applying migrations, verify:

- Tables and columns.
- Functions and triggers.
- RLS policies.
- Storage bucket visibility.
- Storage policies.
- Existing authenticated users.
- `admin_users` object.
- `get_order_number()` function.
- `site_settings` row.
- Existing application statuses.

Do not claim migrations are applied until this verification is complete.
