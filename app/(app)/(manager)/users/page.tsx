import { and, count, desc, eq, ilike, isNotNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import { user } from "@/db/schema";
import { UsersManager } from "@/components/users/users-manager";

const DEFAULT_PAGE_SIZE = 10;

function parseSearchParams(sp: Record<string, string | string[] | undefined>) {
  const get = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  };
  const pageRaw = parseInt(get("page") ?? "1", 10) || 1;
  const pageSizeRaw =
    parseInt(get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10) ||
    DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(50, Math.max(5, pageSizeRaw));
  const q = (get("q") ?? "").trim();
  const roleRaw = get("role") ?? "all";
  const roleFilter: "all" | "manager" | "specialist" =
    roleRaw === "manager" || roleRaw === "specialist" ? roleRaw : "all";
  const statusRaw = get("status") ?? "all";
  const statusFilter: "all" | "active" | "inactive" =
    statusRaw === "active" || statusRaw === "inactive" ? statusRaw : "all";

  return { pageRaw, pageSize, q, roleFilter, statusFilter };
}

/** Lists users with server-side filters and pagination. */
export default async function UsersListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { pageRaw, pageSize, q, roleFilter, statusFilter } = parseSearchParams(
    sp,
  );

  const db = getDb();
  const conditions = [];

  if (q) {
    const p = `%${q}%`;
    conditions.push(
      or(
        ilike(user.name, p),
        ilike(user.email, p),
        and(isNotNull(user.username), ilike(user.username, p)),
      ),
    );
  }
  if (roleFilter !== "all") {
    conditions.push(eq(user.role, roleFilter));
  }
  if (statusFilter === "active") {
    conditions.push(eq(user.isActive, true));
  } else if (statusFilter === "inactive") {
    conditions.push(eq(user.isActive, false));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ total: count() })
    .from(user)
    .where(whereClause);

  const total = Number(countRow?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const page = Math.min(Math.max(1, pageRaw), totalPages);

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(whereClause)
    .orderBy(desc(user.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const users = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <UsersManager
      users={users}
      total={total}
      page={page}
      pageSize={pageSize}
      q={q}
      roleFilter={roleFilter}
      statusFilter={statusFilter}
    />
  );
}
