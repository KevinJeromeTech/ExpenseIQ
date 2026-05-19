import { test, expect } from "@playwright/test";
test.describe("Authentication", () => {
  test("shows login form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });
  test("can switch to sign up", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /sign up/i }).click();
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
  });
  test("shows error on bad credentials", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(/email/i).fill("bad@test.com");
    await page.getByLabel(/password/i).fill("wrongpass");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page.locator(".auth-error")).toBeVisible({ timeout: 10000 });
  });
  test("forgot password page works", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /forgot password/i })).toBeVisible();
  });
});
