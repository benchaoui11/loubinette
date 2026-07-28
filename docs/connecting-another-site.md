# Connecting Another Site

1. Add one IDP website configuration record with a stable `site_id`.
2. Keep feature flags disabled until the real website flow and data source are connected.
3. Update that website's application insert path to include `site_id` or `site_key`.
4. Install the first-party analytics tracker with the new `site_id`.
5. Verify RLS site isolation.
6. Verify dashboard site selector filtering.
7. Backfill only that site's historical records after source ownership is clear.

Do not mix records from multiple websites without a site identifier.
