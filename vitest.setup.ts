/**
 * Vitest loads modules that initialize Better Auth / Drizzle; a dummy URL is required.
 * Unit tests do not connect to a real database.
 */
process.env.DATABASE_URL ??= "postgresql://127.0.0.1:5432/vitest_dummy";
process.env.BETTER_AUTH_SECRET ??= "development-only-secret-min-32-characters!";
