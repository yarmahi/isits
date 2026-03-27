# Backup and migrations

## Backups

- **PostgreSQL**: use your provider’s automated backups (e.g. Neon PITR) or `pg_dump` on a schedule.
- Store dumps encrypted at rest; restrict access to production credentials.

## Migrations

- Schema lives in `db/schema.ts` and generated SQL in `drizzle/`.
- **Generate** a new migration after schema edits:

  ```bash
  npm run db:generate
  ```

- **Apply** migrations (local or production):

  ```bash
  npm run db:migrate
  ```

- **`db:push`** applies schema without migration files—use only for quick local experiments, not for production.

## Clean environment

To verify migrations from scratch:

1. Create an empty database.
2. Set `DATABASE_URL` to that database.
3. Run `npm run db:migrate`, then `npm run db:seed:all` if you need seed data.

If migration fails, fix the SQL or schema, regenerate if needed, and retry on a fresh DB before touching production.
