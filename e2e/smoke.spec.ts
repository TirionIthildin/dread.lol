import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Dread/i);
  });

  test("leaderboard page loads", async ({ page }) => {
    const res = await page.goto("/leaderboard");
    expect(res?.status()).toBe(200);
  });

  test("marketplace page loads", async ({ page }) => {
    const res = await page.goto("/marketplace");
    expect(res?.status()).toBe(200);
  });

  test("privacy page loads", async ({ page }) => {
    const res = await page.goto("/privacy");
    expect(res?.status()).toBe(200);
  });
});
