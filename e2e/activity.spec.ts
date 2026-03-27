import { expect, test } from "@playwright/test";
import { loginAsManager } from "./helpers";

test.describe("activity log (manager)", () => {
  test("manager can open activity page", async ({ page }) => {
    await loginAsManager(page);
    await page.goto("/activity");
    await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Time" }).first(),
    ).toBeVisible();
  });
});
