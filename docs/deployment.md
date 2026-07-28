# Deployment

Deploy this as a separate Vercel project.

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `OWNER_ADMIN_EMAIL`

Prepared future variables:

- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `ANALYTICS_INGEST_SECRET`
- `INTERNAL_TRAFFIC_SECRET`

Vercel setup:

1. Create a GitHub repository.
2. Push this local repo.
3. Import it into Vercel as a new project.
4. Add environment variables for Preview and Production.
5. Add the Vercel preview/production URL to Supabase Auth redirect URLs.
6. Deploy to a temporary Vercel domain.

Do not connect `admin.loubinette.com` yet.
