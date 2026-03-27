import { expect, test } from "@playwright/test";
import { loginAsManager } from "./helpers";

test.describe("login", () => {
  test("manager can sign in and reach records", async ({ page }) => {
    await loginAsManager(page);
    await expect(page.getByRole("heading", { name: "Records" })).toBeVisible();
  });
});
