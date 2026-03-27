import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required (Neon pooled connection string on Vercel)"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Parses database URL and related core env (used by Drizzle). */
export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
  });
}

/** Resolves Better Auth base URL (Vercel, explicit, or local). */
export function getBetterAuthBaseUrl(): string {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/** Resolves Better Auth secret; production deployments must set BETTER_AUTH_SECRET. */
export function getBetterAuthSecret(): string {
  const s = process.env.BETTER_AUTH_SECRET;
  if (s && s.length >= 32) {
    return s;
  }
  if (process.env.VERCEL) {
    throw new Error(
      "BETTER_AUTH_SECRET must be set in Vercel project environment variables",
    );
  }
  return "development-only-secret-min-32-characters!";
}
