import { expect, test } from "@playwright/test";
import { loginAsManager } from "./helpers";

test.describe("records workflow", () => {
  test("create record and find it via search", async ({ page }) => {
    await loginAsManager(page);

    await page.getByRole("link", { name: "New record" }).click();
    await expect(page.getByRole("heading", { name: "New record" })).toBeVisible();

    const unique = `E2E-${Date.now()}`;
    await page.locator("#dateReceived").fill("2026-03-15");
    await page.locator("#branchId").selectOption("br-main");
    await page.locator("#pcModel").fill("Test Model");
    await page.locator("#serialNumber").fill(`SN-${unique}`);
    await page.locator("#customerName").fill(`Customer ${unique}`);
    await page.locator("#phoneNumber").fill("555-0199");
    await page.locator("#statusId").selectOption("st-received");
    await page.locator("#deliveryMethodId").selectOption("dm-physical");

    await page.getByRole("button", { name: "Create record" }).click();
    await page.waitForURL(/\/records/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Records" })).toBeVisible();

    await page.goto(`/records?q=${encodeURIComponent(unique)}`);
    await expect(page.getByText(`Customer ${unique}`).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("edit record from list", async ({ page }) => {
    await loginAsManager(page);

    await page.goto("/records/new");
    const unique = `Edit-${Date.now()}`;
    await page.locator("#dateReceived").fill("2026-03-16");
    await page.locator("#branchId").selectOption("br-main");
    await page.locator("#pcModel").fill("PC");
    await page.locator("#serialNumber").fill(`SN-EDIT-${unique}`);
    await page.locator("#customerName").fill(`Edit ${unique}`);
    await page.locator("#phoneNumber").fill("555-0200");
    await page.locator("#statusId").selectOption("st-received");
    await page.locator("#deliveryMethodId").selectOption("dm-physical");
    await page.getByRole("button", { name: "Create record" }).click();
    await page.waitForURL(/\/records/, { timeout: 30_000 });

    await page.goto(`/records?q=${encodeURIComponent(unique)}`);
    await page.getByRole("link", { name: "Edit record" }).first().click();
    await expect(page.getByRole("heading", { name: "Edit record" })).toBeVisible();
    await page.locator("#pcModel").fill("PC updated");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.waitForURL(/\/records\//, { timeout: 30_000 });
    await expect(page.getByText("PC updated")).toBeVisible();
  });
});
