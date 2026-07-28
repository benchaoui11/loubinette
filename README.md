# Loubinette IDP Control Center

Premium multi-site control center for IDP websites only. FirstIDP (`firstidp.com`) and WorldIDP (`worldidp.com`) are the current live brands; additional IDP domains are tracked as planned until configured.

## Current milestone

- Supabase Auth owner bootstrap through `OWNER_ADMIN_EMAIL`.
- Protected dashboard shell.
- IDP-only website registry with live and planned statuses.
- Per-site feature flags for Offer Page, White Page, and optional page switching. FirstIDP supports switching; WorldIDP is offer-only.
- Read-only applications, visitors, submitted value, status metrics, and day-by-day charts.
- Document metadata only. No public document URLs.
- Payment/revenue shown honestly as unavailable until a verified payment ledger exists.
- Additive SQL migrations prepared but not applied automatically.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add Supabase values and `OWNER_ADMIN_EMAIL`.
3. Make sure the owner email exists in Supabase Auth.
4. Run:

```bash
npm run dev
```

## Safety rules

- Do not commit `.env.local` or real secrets.
- Do not apply migrations without verifying the live Supabase schema.
- Do not treat `applications.total` as revenue.
- Do not expose Supabase Storage document paths through public URLs.

## Validation

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## GitHub and Vercel

Create a GitHub repo, add it as `origin`, push, then import the repo into Vercel as a separate project. Configure the environment variables listed in `.env.example`. The custom domain `admin.loubinette.com` is optional and should not be connected yet.

See `docs/deployment.md`.
