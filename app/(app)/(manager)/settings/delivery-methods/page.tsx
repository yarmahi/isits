import {
  DELIVERY_METHODS_DEFAULT_PAGE_SIZE,
  DeliveryMethodsSettingsClient,
} from "@/components/delivery-methods/delivery-methods-settings-client";
import { requireManager } from "@/lib/permissions";
import { getDeliveryMethodsPage } from "@/services/delivery-methods";

/** Manager-only: delivery methods CRUD (Chapter 2 Phase D). */
export default async function SettingsDeliveryMethodsPage({
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
      parseInt(sp.pageSize ?? String(DELIVERY_METHODS_DEFAULT_PAGE_SIZE), 10) ||
        DELIVERY_METHODS_DEFAULT_PAGE_SIZE,
    ),
  );
  const { rows, total } = await getDeliveryMethodsPage({ page, pageSize });

  return (
    <DeliveryMethodsSettingsClient
      rows={rows}
      total={total}
      page={page}
      pageSize={pageSize}
    />
  );
}
