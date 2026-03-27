"use server";

import { hashPassword } from "better-auth/crypto";
import { and, eq, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { account, user } from "@/db/schema";
import { requireManager } from "@/lib/permissions";
import { syntheticEmailFromUsername, USERNAME_REGEX } from "@/lib/user-helpers";

const usernameSchema = z
  .string()
  .min(4)
  .max(32)
  .regex(
    USERNAME_REGEX,
    "Use letters, numbers, underscores, or dots only",
  );

const passwordSchema = z.string().min(6).max(128);

const createSpecialistSchema = z.object({
  name: z.string().min(1).max(200),
  username: usernameSchema,
  password: passwordSchema,
});

/** Creates a specialist account with username/password (manager-only). */
export async function createSpecialistAction(input: unknown) {
  await requireManager();
  const parsed = createSpecialistSchema.parse(input);
  const uname = parsed.username.trim().toLowerCase();
  const db = getDb();
  const id = randomUUID();
  const hashed = await hashPassword(parsed.password);
  const email = syntheticEmailFromUsername(uname);
  try {
    await db.insert(user).values({
      id,
      name: parsed.name.trim(),
      email,
      username: uname,
      displayUsername: uname,
      emailVerified: true,
      role: "specialist",
      isActive: true,
    });
    await db.insert(account).values({
      id: randomUUID(),
      accountId: uname,
      providerId: "credential",
      userId: id,
      password: hashed,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not create user";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { ok: false as const, error: "That username is already taken." };
    }
    return { ok: false as const, error: msg };
  }
  revalidatePath("/users");
  return { ok: true as const };
}

const updateUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(200),
  username: usernameSchema,
  isActive: z.boolean(),
  newPassword: z.string().max(128).optional(),
});

/** Updates a user; managers cannot deactivate their own account here. */
export async function updateUserAction(input: unknown) {
  const session = await requireManager();
  const parsed = updateUserSchema.parse(input);
  const uname = parsed.username.trim().toLowerCase();
  const email = syntheticEmailFromUsername(uname);
  const db = getDb();
  const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.id, parsed.userId))
    .limit(1);
  if (!existing) {
    return { ok: false as const, error: "User not found." };
  }
  if (existing.role === "manager" && parsed.isActive === false) {
    return { ok: false as const, error: "Cannot deactivate a manager account." };
  }
  const sessionUserId = (session.user as { id: string }).id;
  if (existing.id === sessionUserId && parsed.isActive === false) {
    return { ok: false as const, error: "You cannot deactivate your own account." };
  }
  const [other] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(ne(user.id, parsed.userId), eq(user.username, uname)))
    .limit(1);
  if (other) {
    return { ok: false as const, error: "That username is already taken." };
  }
  try {
    await db
      .update(user)
      .set({
        name: parsed.name.trim(),
        email,
        username: uname,
        displayUsername: uname,
        isActive: parsed.isActive,
        updatedAt: new Date(),
      })
      .where(eq(user.id, parsed.userId));
    await db
      .update(account)
      .set({
        accountId: uname,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(account.userId, parsed.userId),
          eq(account.providerId, "credential"),
        ),
      );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not update user";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { ok: false as const, error: "That username is already taken." };
    }
    return { ok: false as const, error: msg };
  }
  if (parsed.newPassword && parsed.newPassword.length >= 6) {
    const hashed = await hashPassword(parsed.newPassword);
    await db
      .update(account)
      .set({ password: hashed, updatedAt: new Date() })
      .where(
        and(
          eq(account.userId, parsed.userId),
          eq(account.providerId, "credential"),
        ),
      );
  }
  revalidatePath("/users");
  return { ok: true as const };
}

const setUserActiveSchema = z.object({
  userId: z.string().min(1),
  isActive: z.boolean(),
});

/** Sets account active flag (e.g. deactivate specialist from the list). */
export async function setUserActiveAction(input: unknown) {
  const session = await requireManager();
  const parsed = setUserActiveSchema.parse(input);
  const db = getDb();
  const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.id, parsed.userId))
    .limit(1);
  if (!existing) {
    return { ok: false as const, error: "User not found." };
  }
  if (existing.role === "manager" && parsed.isActive === false) {
    return { ok: false as const, error: "Cannot deactivate a manager account." };
  }
  const sessionUserId = (session.user as { id: string }).id;
  if (existing.id === sessionUserId && parsed.isActive === false) {
    return { ok: false as const, error: "You cannot deactivate your own account." };
  }
  await db
    .update(user)
    .set({ isActive: parsed.isActive, updatedAt: new Date() })
    .where(eq(user.id, parsed.userId));
  revalidatePath("/users");
  return { ok: true as const };
}
