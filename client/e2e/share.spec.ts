import { test, expect } from "@playwright/test";
test.describe("Share page", () => {
  test("shows error for invalid share token", async ({ page }) => {
    await page.goto("/share/invalidtoken123");
    await expect(page.getByRole("heading", { name: /link unavailable/i })).toBeVisible({ timeout: 10000 });
  });
});
