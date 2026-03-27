# Maintenance

## Routine

- **Dependencies**: periodically `npm audit` and apply safe updates; run `npm run build` and `npm run test` after upgrades.
- **Database**: monitor connection limits and disk; keep indexes aligned with list filters (see `docs/build-checklist.md` Phase 4).
- **Secrets**: rotate `BETTER_AUTH_SECRET` and DB passwords on a schedule; update Vercel/host env without downtime.

## Logs

- Application errors: use your host’s runtime logs (Vercel, etc.).
- **Audit trail**: managers use **Activity** in-app; entries are append-only in `activity_logs`.

## Seeds

- `npm run db:seed:all` — lookups, manager, field definitions (idempotent where possible).
- Re-running seed scripts is safe for missing rows; manager seed skips if username already exists.

## Support

- **Docs**: `README.md`, `docs/DEPLOYMENT.md`, `docs/BACKUP-MIGRATIONS.md`, `docs/project-description.md`.
- **Tests**: `npm run test` (Vitest), `npm run e2e` (Playwright, requires DB + dev server).
