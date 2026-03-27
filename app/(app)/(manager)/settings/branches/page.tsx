import {
  BRANCHES_DEFAULT_PAGE_SIZE,
  BranchesSettingsClient,
} from "@/components/branches/branches-settings-client";
import { requireManager } from "@/lib/permissions";
import { getBranchesPage } from "@/services/branches";

/** Manager-only: branches CRUD (Chapter 2 Phase B). */
export default async function SettingsBranchesPage({
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
      parseInt(sp.pageSize ?? String(BRANCHES_DEFAULT_PAGE_SIZE), 10) ||
        BRANCHES_DEFAULT_PAGE_SIZE,
    ),
  );
  const { rows, total } = await getBranchesPage({ page, pageSize });

  return (
    <BranchesSettingsClient
      rows={rows}
      total={total}
      page={page}
      pageSize={pageSize}
    />
  );
}
