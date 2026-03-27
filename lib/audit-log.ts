import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { activityLogs, user } from "@/db/schema";

function isSensitiveKey(k: string): boolean {
  const s = k.toLowerCase();
  return (
    s === "password" ||
    s === "access_token" ||
    s === "refresh_token" ||
    s === "authorization" ||
    s === "cookie" ||
    s === "secret" ||
    s === "token"
  );
}

export function sanitizeSnapshot(
  obj: unknown,
): Record<string, unknown> | undefined {
  if (obj === null || obj === undefined) return undefined;
  const inner = (v: unknown): unknown => {
    if (v === null || v === undefined) return v;
    if (Array.isArray(v)) return v.map(inner);
    if (typeof v !== "object") return v;
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (isSensitiveKey(k)) continue;
      out[k] = inner(val);
    }
    return out;
  };
  const r = inner(obj);
  return typeof r === "object" && r !== null && !Array.isArray(r)
    ? (r as Record<string, unknown>)
    : { value: r as unknown };
}

export type ParsedUa = {
  browserName: string;
  browserVersion: string;
  osName: string;
  deviceType: string;
};

/** Lightweight UA parsing (no extra dependencies). */
export function parseUserAgent(ua: string): ParsedUa {
  let browserName = "Unknown";
  let browserVersion = "";
  if (/Edg\/([\d.]+)/.exec(ua)) {
    browserName = "Edge";
    browserVersion = /Edg\/([\d.]+)/.exec(ua)?.[1] ?? "";
  } else if (/Chrome\/([\d.]+)/.exec(ua) && !/Edg|OPR/.test(ua)) {
    browserName = "Chrome";
    browserVersion = /Chrome\/([\d.]+)/.exec(ua)?.[1] ?? "";
  } else if (/Firefox\/([\d.]+)/.exec(ua)) {
    browserName = "Firefox";
    browserVersion = /Firefox\/([\d.]+)/.exec(ua)?.[1] ?? "";
  } else if (/Safari\/([\d.]+)/.exec(ua) && !/Chrome/.test(ua)) {
    browserName = "Safari";
    browserVersion = /Version\/([\d.]+)/.exec(ua)?.[1] ?? "";
  }

  let osName = "Unknown";
  if (/Windows NT/.test(ua)) osName = "Windows";
  else if (/Mac OS X/.test(ua)) osName = "macOS";
  else if (/Linux/.test(ua) && !/Android/.test(ua)) osName = "Linux";
  else if (/Android/.test(ua)) osName = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) osName = "iOS";

  let deviceType = "desktop";
  if (/Mobi|Android.*Mobile|iPhone|iPod/.test(ua)) deviceType = "mobile";
  else if (/Tablet|iPad/.test(ua)) deviceType = "tablet";

  return { browserName, browserVersion, osName, deviceType };
}

export type WriteAuditInput = {
  eventType: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  entityType?: string;
  entityId?: string;
  route?: string;
  url?: string;
  httpMethod?: string;
  requestId?: string;
  sessionId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  deviceType?: string;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

/** Reads proxy / Next headers for IP, UA, and request id. */
export async function getRequestMetaFromHeaders(): Promise<
  Pick<
    WriteAuditInput,
    | "ipAddress"
    | "userAgent"
    | "requestId"
    | "browserName"
    | "browserVersion"
    | "osName"
    | "deviceType"
  >
> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwarded ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent");
  const requestId = h.get("x-request-id") ?? randomUUID();
  const ua = userAgent ?? "";
  const p = parseUserAgent(ua);
  return {
    ipAddress,
    userAgent,
    requestId,
    browserName: p.browserName,
    browserVersion: p.browserVersion,
    osName: p.osName,
    deviceType: p.deviceType,
  };
}

/** Persists one audit row; failures are swallowed (never break user flows). */
export async function writeAuditLog(input: WriteAuditInput): Promise<void> {
  try {
    const db = getDb();
    let actorRole = input.actorRole ?? null;
    if (input.actorUserId) {
      const [row] = await db
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, input.actorUserId))
        .limit(1);
      if (row?.role) actorRole = row.role;
    }

    await db.insert(activityLogs).values({
      id: randomUUID(),
      eventType: input.eventType,
      actorUserId: input.actorUserId ?? null,
      actorRole,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      route: input.route ?? null,
      url: input.url ?? null,
      httpMethod: input.httpMethod ?? null,
      requestId: input.requestId ?? null,
      sessionId: input.sessionId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      browserName: input.browserName ?? null,
      browserVersion: input.browserVersion ?? null,
      osName: input.osName ?? null,
      deviceType: input.deviceType ?? null,
      beforeSnapshot: input.beforeSnapshot
        ? sanitizeSnapshot(input.beforeSnapshot)
        : undefined,
      afterSnapshot: input.afterSnapshot
        ? sanitizeSnapshot(input.afterSnapshot)
        : undefined,
      metadata: input.metadata ? sanitizeSnapshot(input.metadata) : undefined,
    });
  } catch (e) {
    console.error("[audit-log]", e);
  }
}
