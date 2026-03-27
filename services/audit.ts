"use server";

import { getSession } from "@/lib/session";
import {
  getRequestMetaFromHeaders,
  writeAuditLog,
} from "@/lib/audit-log";

/** Client-triggered page view (authenticated routes). */
export async function logPageViewAction(pathname: string) {
  const session = await getSession();
  if (!session?.user) return;
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;
  const sess = session as { session?: { id?: string } };
  const sessionId = sess.session?.id;
  const meta = await getRequestMetaFromHeaders();
  await writeAuditLog({
    eventType: "page_view",
    actorUserId: userId,
    actorRole: role,
    entityType: "route",
    entityId: pathname,
    route: pathname,
    url: pathname,
    httpMethod: "GET",
    sessionId,
    ...meta,
    metadata: { source: "client_navigation" },
  });
}

/** Call before sign-out so the session is still valid. */
export async function logLogoutAction() {
  const session = await getSession();
  if (!session?.user) return;
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;
  const sess = session as { session?: { id?: string } };
  const sessionId = sess.session?.id;
  const meta = await getRequestMetaFromHeaders();
  await writeAuditLog({
    eventType: "logout",
    actorUserId: userId,
    actorRole: role,
    entityType: "session",
    entityId: sessionId,
    sessionId,
    route: "/logout",
    httpMethod: "POST",
    ...meta,
  });
}
