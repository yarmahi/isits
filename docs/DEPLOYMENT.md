# Deployment

## Production environment variables

Set these in your host (e.g. Vercel project settings):

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon pooled URL is recommended for serverless). |
| `BETTER_AUTH_SECRET` | Yes | At least 32 random characters; never commit. |
| `BETTER_AUTH_URL` | Recommended | Public site URL, e.g. `https://your-app.vercel.app`. If omitted, `VERCEL_URL` is used when present. |
| `VERCEL_URL` | Auto | Set by Vercel; used to derive auth URL if `BETTER_AUTH_URL` is not set. |

Optional:

- `SEED_MANAGER_*` — Only for one-off seed scripts, not for runtime app behavior.

## Build

```bash
npm install
npm run build
```

## Database on first deploy

1. Run migrations against the production database (from CI or locally with `DATABASE_URL`):

   ```bash
   npm run db:migrate
   ```

2. Seed lookups and manager (restricted operation; run only when needed):

   ```bash
   npm run db:seed:all
   ```

   Or use individual `db:seed` scripts. Change default manager password after first login.

## Vercel

- Connect the repo, set env vars, use **Build Command** `npm run build` and **Output** as Next.js defaults.
- Ensure `DATABASE_URL` points to a production DB with SSL as required by your provider.

## Health check

The app exposes `GET /api/health` (and `/health` page) for uptime checks.
