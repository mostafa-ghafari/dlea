import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config.
 *
 * Boots two servers:
 *  1. Django backend  → http://127.0.0.1:8000  (dedicated e2e.sqlite3 DB)
 *  2. Production build → http://localhost:5173 (run `npm run build` first;
 *     `npm run test:e2e` does this automatically via the pretest hook)
 *
 * The production server is used instead of the Vite dev server because the
 * nitro dev worker 503s when polled before it finishes booting.
 *
 * Locally it drives the system Chrome (Playwright's own Chromium download is
 * geo-blocked in some regions); CI installs Chromium explicitly.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:5173",
    channel:
      process.env.PLAYWRIGHT_CHANNEL ?? (process.env.CI ? undefined : "chrome"),
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "bash e2e/backend-setup.sh",
      url: "http://127.0.0.1:8000/api/schema/",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: "bash e2e/frontend-setup.sh",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
