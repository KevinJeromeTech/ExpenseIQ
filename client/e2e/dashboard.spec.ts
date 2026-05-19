import { test, expect } from "@playwright/test";
test.describe("Dashboard", () => {
  test("redirects unauthenticated to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });
  test("page title is correct", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ExpenseIQ/);
  });
});
