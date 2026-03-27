import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  role: text("role").default("specialist").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/** Minimal key/value store for app-level metadata (Phase 1). */
export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** Branch locations for intake records. */
export const branches = pgTable("branches", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/** Workflow statuses for a record. */
export const statuses = pgTable("statuses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

/** How equipment is delivered (lookup). */
export const deliveryMethods = pgTable("delivery_methods", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/** Core intake / repair tracking record (Excel-equivalent fields + system columns). */
export const records = pgTable(
  "records",
  {
    id: text("id").primaryKey(),
    recordNo: text("record_no").notNull().unique(),
    dateReceived: date("date_received").notNull(),
    dateReturned: date("date_returned"),
    branchId: text("branch_id")
      .notNull()
      .references(() => branches.id),
    pcModel: text("pc_model").notNull(),
    serialNumber: text("serial_number").notNull(),
    tagNumber: text("tag_number"),
    maintenanceNote: text("maintenance_note"),
    customerName: text("customer_name").notNull(),
    phoneNumber: text("phone_number").notNull(),
    statusId: text("status_id")
      .notNull()
      .references(() => statuses.id),
    deliveryMethodId: text("delivery_method_id")
      .notNull()
      .references(() => deliveryMethods.id),
    customData: jsonb("custom_data")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("records_created_at_idx").on(table.createdAt),
    index("records_created_by_idx").on(table.createdBy),
    index("records_deleted_at_idx").on(table.deletedAt),
    index("records_status_id_idx").on(table.statusId),
    index("records_date_received_idx").on(table.dateReceived),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const branchesRelations = relations(branches, ({ many }) => ({
  records: many(records),
}));

export const statusesRelations = relations(statuses, ({ many }) => ({
  records: many(records),
}));

export const deliveryMethodsRelations = relations(deliveryMethods, ({ many }) => ({
  records: many(records),
}));

export const recordsRelations = relations(records, ({ one }) => ({
  branch: one(branches, {
    fields: [records.branchId],
    references: [branches.id],
  }),
  status: one(statuses, {
    fields: [records.statusId],
    references: [statuses.id],
  }),
  deliveryMethod: one(deliveryMethods, {
    fields: [records.deliveryMethodId],
    references: [deliveryMethods.id],
  }),
  creator: one(user, {
    fields: [records.createdBy],
    references: [user.id],
    relationName: "recordCreator",
  }),
  updater: one(user, {
    fields: [records.updatedBy],
    references: [user.id],
    relationName: "recordUpdater",
  }),
}));

/** Audit trail (Phase 5): append-only activity log for managers. */
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    eventType: text("event_type").notNull(),
    actorUserId: text("actor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    actorRole: text("actor_role"),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    route: text("route"),
    url: text("url"),
    httpMethod: text("http_method"),
    requestId: text("request_id"),
    sessionId: text("session_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    browserName: text("browser_name"),
    browserVersion: text("browser_version"),
    osName: text("os_name"),
    deviceType: text("device_type"),
    beforeSnapshot: jsonb("before_snapshot").$type<Record<string, unknown>>(),
    afterSnapshot: jsonb("after_snapshot").$type<Record<string, unknown>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (table) => [
    index("activity_logs_created_at_idx").on(table.createdAt),
    index("activity_logs_event_type_idx").on(table.eventType),
    index("activity_logs_actor_user_id_idx").on(table.actorUserId),
    index("activity_logs_entity_idx").on(table.entityType, table.entityId),
  ],
);
