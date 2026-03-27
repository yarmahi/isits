import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins/username";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { user } from "@/db/schema";
import { getBetterAuthBaseUrl, getBetterAuthSecret } from "@/lib/env";

const baseURL = getBetterAuthBaseUrl();
const secret = getBetterAuthSecret();

/** Better Auth server instance (sessions, email/password, Drizzle adapter). */
export const auth = betterAuth({
  appName: "ISITS",
  baseURL,
  secret,
  trustedOrigins: [baseURL],
  plugins: [
    nextCookies(),
    username({
      minUsernameLength: 4,
      maxUsernameLength: 32,
    }),
  ],
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 6,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "specialist",
      },
      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (sess) => {
          const db = getDb();
          const rows = await db
            .select()
            .from(user)
            .where(eq(user.id, sess.userId))
            .limit(1);
          const u = rows[0];
          if (!u?.isActive) {
            return false;
          }
        },
      },
    },
  },
});
