import { expect, test } from "@playwright/test";

/**
 * Admin journey: staff login → admin dashboard (KPIs) → user management.
 * The admin account is created by e2e/backend-setup.sh.
 */
test("admin login → dashboard → user management", async ({ page }) => {
  // Never auto-open guide tours so their dialogs don't intercept clicks.
  await page.addInitScript(() => {
    localStorage.setItem(
      "tj:tours-seen:v2",
      JSON.stringify({ "/app/admin": true, "/app/dashboard": true }),
    );
  });

  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill("admin@dlea.test");
  await page.getByPlaceholder("••••••••").fill("AdminPass123");
  await page.getByRole("button", { name: "ورود", exact: true }).click();

  // Logins land on the dashboard; admins then open the admin area.
  await page.waitForURL(/\/app\/dashboard/, { timeout: 20_000 });
  await page.goto("/app/admin/dashboard");
  await page.waitForURL(/\/app\/admin\/dashboard/, { timeout: 20_000 });
  await expect(page.getByText("مدیریت کاربران").first()).toBeVisible({
    timeout: 20_000,
  });

  // User management table loads and lists at least the admin itself
  await page.goto("/app/admin/users");
  await expect(page.getByText("admin@dlea.test").first()).toBeVisible({
    timeout: 20_000,
  });
});
