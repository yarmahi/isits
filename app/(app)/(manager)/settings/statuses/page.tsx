import {
  STATUSES_DEFAULT_PAGE_SIZE,
  StatusesSettingsClient,
} from "@/components/statuses/statuses-settings-client";
import { requireManager } from "@/lib/permissions";
import { getStatusesPage } from "@/services/statuses";

/** Manager-only: statuses CRUD (Chapter 2 Phase C). */
export default async function SettingsStatusesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  await requireManager();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(
      5,
      parseInt(sp.pageSize ?? String(STATUSES_DEFAULT_PAGE_SIZE), 10) ||
        STATUSES_DEFAULT_PAGE_SIZE,
    ),
  );
  const { rows, total } = await getStatusesPage({ page, pageSize });

  return (
    <StatusesSettingsClient
      rows={rows}
      total={total}
      page={page}
      pageSize={pageSize}
    />
  );
}
