import { checkDatabase } from "@/lib/health";

/** JSON health endpoint for uptime checks (e.g. Vercel). */
export async function GET() {
  const db = await checkDatabase();
  return Response.json({
    ok: true,
    database: db ? "up" : "down_or_unconfigured",
  });
}
