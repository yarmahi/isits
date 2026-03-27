# IT Support Intake & Tracking System (ISITS)

Next.js app for intake records, user management, and manager activity audit.

## Prerequisites

- **Node.js** 20+ (see `package.json` engines if added)
- **PostgreSQL** (local or hosted, e.g. Neon)

## Local setup

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd isits
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` and set at least:

   - `DATABASE_URL` — PostgreSQL connection string  
   - `BETTER_AUTH_SECRET` — at least 32 characters (any long random string in dev)

3. **Database**

   ```bash
   npm run db:migrate
   npm run db:seed:all
   ```

   This seeds branches, statuses, delivery methods, optional field definitions, and the first **manager** account (default username `manager`, password `ChangeMe123!` unless overridden by `SEED_MANAGER_*` in `.env.local`).

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000), sign in, and you should land on **Records**.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run db:generate` | Drizzle: generate SQL migrations from schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema (dev only; prefer migrate for production) |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Seed manager only |
| `npm run db:seed:lookups` | Seed lookups only |
| `npm run db:seed:fields` | Seed field definitions |
| `npm run db:seed:all` | All seeds in order |
| `npm run e2e` | Playwright E2E (starts dev server; needs DB + seed) |
| `npm run e2e:install` | Install Playwright browser binaries |

## Documentation

| Doc | Content |
|-----|---------|
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production env and hosting |
| [docs/BACKUP-MIGRATIONS.md](docs/BACKUP-MIGRATIONS.md) | Backups and migrations |
| [docs/MAINTENANCE.md](docs/MAINTENANCE.md) | Ongoing maintenance |
| [docs/build-checklist.md](docs/build-checklist.md) | Phased delivery checklist |
| [docs/build-checklist-chapter-2.md](docs/build-checklist-chapter-2.md) | Chapter 2 — Settings shell, lookups, record detail timeline |
| [docs/build-checklist-chapter-3.md](docs/build-checklist-chapter-3.md) | Chapter 3 — CSV bulk import (lookups + records) |

## Testing

- **Unit / service-oriented tests** live under `tests/` and run with Vitest (no DB required for most).
- **E2E tests** live under `e2e/` and use Playwright. Use the same `DATABASE_URL` and seeded manager credentials; optional env: `E2E_MANAGER_USERNAME`, `E2E_MANAGER_PASSWORD`, `PLAYWRIGHT_BASE_URL`.

First-time Playwright:

```bash
npm run e2e:install
npm run e2e
```

## Project layout

- `app/` — App Router pages and API routes  
- `components/` — UI components  
- `db/` — Drizzle schema and client  
- `drizzle/` — Generated SQL migrations  
- `lib/` — Shared utilities  
- `services/` — Server actions and domain logic  
- `scripts/` — Seed and maintenance scripts  

## License

Private / internal use unless otherwise specified.
