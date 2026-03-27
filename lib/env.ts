import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required (Neon pooled connection string on Vercel)"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Parses and returns validated server environment variables, or throws if invalid. */
export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse(process.env);
}
