import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Minimal key/value store for app-level metadata until domain tables land in later phases. */
export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
