import { expect, test } from "@playwright/test";

const EMAIL = `e2e-${Date.now()}@example.com`;

/**
 * Critical user journey: signup (OTP) → create portfolio → add a trade
 * (via API, the UI has no manual trade form) → journal entry → dashboard.
 */
test("signup → portfolio → trade → journal → dashboard", async ({
  page,
  request,
}) => {
  // Mark every section's guide tour as seen so onboarding dialogs never
  // auto-open and intercept clicks during the journey.
  await page.addInitScript(() => {
    const all = [
      "/app/dashboard",
      "/app/portfolios",
      "/app/trades",
      "/app/trades/new",
      "/app/journal",
      "/app/ai-coach",
      "/app/calendar",
      "/app/risk",
      "/app/goals",
      "/app/achievements",
      "/app/news",
      "/app/support",
      "/app/settings",
      "/app/billing",
      "/app/admin",
    ];
    localStorage.setItem(
      "tj:tours-seen:v2",
      JSON.stringify(Object.fromEntries(all.map((p) => [p, true]))),
    );
  });

  // ---- Signup via email OTP (debug OTP shown in dev) -----------------
  await page.goto("/signup");
  await page.getByPlaceholder("علی").fill("علی");
  await page.getByPlaceholder("رضایی").fill("رضایی");
  await page.getByPlaceholder("you@example.com").fill(EMAIL);
  await page.getByPlaceholder("حداقل ۸ کاراکتر").fill("SecretPass123");
  await page.getByRole("button", { name: "ارسال کد تأیید" }).click();

  // The OTP step shows the dev debug code in an amber box
  const otpText = await page
    .locator("p.font-mono")
    .filter({ hasText: /^\d{6}$/ })
    .first()
    .textContent();
  expect(otpText).toMatch(/^\d{6}$/);

  // input-otp renders a single hidden input with data-input-otp
  await page.locator("[data-input-otp]").click();
  await page.keyboard.type(otpText!, { delay: 20 });

  await page.getByRole("button", { name: /تأیید|تایید/ }).click();

  // New accounts land in the app; go to portfolios to create the first one
  await page.waitForURL(/\/app\/dashboard/, { timeout: 20_000 });
  await page.goto("/app/portfolios");
  await page.waitForURL(/\/app\/portfolios/, { timeout: 20_000 });

  // ---- Onboarding: create the first portfolio ------------------------
  await page.getByRole("button", { name: "پرتفولیو جدید" }).first().click();
  await page.getByPlaceholder("پرتفوی اصلی").fill("حساب اصلی");
  await page.getByPlaceholder("IC Markets").fill("IC Markets");
  await page.locator("input[type='number']").first().fill("10000");
  await page.getByRole("button", { name: "ایجاد پرتفولیو" }).click();

  // The portfolio card appears
  await expect(page.getByText("حساب اصلی").first()).toBeVisible({
    timeout: 15_000,
  });

  // ---- Add a trade through the API (session token from localStorage) --
  const token = await page.evaluate(() =>
    window.localStorage.getItem("dlea:access"),
  );
  expect(token).toBeTruthy();

  const portfolios = await request.get(
    "http://localhost:8000/api/portfolios/",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  expect(portfolios.ok()).toBeTruthy();
  const list = await portfolios.json();
  const portfolioId = list.results?.[0]?.id ?? list[0]?.id;
  expect(portfolioId).toBeTruthy();

  const created = await request.post("http://localhost:8000/api/trades/", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: {
      ticket: `E2E-${Date.now()}`,
      symbol: "XAUUSD",
      side: "buy",
      entry: 2000,
      exit: 2010,
      sl: 1990,
      tp: 2020,
      volume: 0.1,
      pnl: 100,
      rr: 2,
      pips: 100,
      open_time: "2026-08-19T10:00:00",
      close_time: "2026-08-19T11:00:00",
      portfolio_id: Number(portfolioId),
    },
  });
  expect(created.ok()).toBeTruthy();

  // ---- Trades page shows the new trade -------------------------------
  await page.goto("/app/trades");
  await expect(page.getByText("XAUUSD").first()).toBeVisible({
    timeout: 15_000,
  });

  // ---- Journal: add an entry -----------------------------------------
  await page.goto("/app/journal");
  await page.getByRole("button", { name: "ژورنال جدید" }).first().click();
  await page.getByRole("dialog").locator("input").first().fill("معامله XAUUSD");
  await page.getByRole("button", { name: "ثبت ژورنال" }).click();
  await expect(page.getByText("معامله XAUUSD").first()).toBeVisible({
    timeout: 15_000,
  });

  // ---- Dashboard shows the stats -------------------------------------
  await page.goto("/app/dashboard");
  // The trade count chip includes "۱ معامله" (Persian digit)
  await expect(page.getByText("۱ معامله").first()).toBeVisible({
    timeout: 15_000,
  });
});
