import type { Page } from "@playwright/test";

const user = process.env.E2E_MANAGER_USERNAME ?? "manager";
const password = process.env.E2E_MANAGER_PASSWORD ?? "ChangeMe123!";

/** Logs in as seeded manager; requires DB seeded with same password. */
export async function loginAsManager(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Username").fill(user);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/records/, { timeout: 30_000 });
}
