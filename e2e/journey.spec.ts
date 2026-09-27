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
  // A fresh account auto-opens the create dialog. Clicking the trigger while it
  // is opening means clicking through its overlay, which never resolves — so
  // give the auto-open a moment and only press the trigger if it did not come.
  const nameField = page.getByPlaceholder("پرتفوی اصلی");
  const autoOpened = await nameField
    .waitFor({ state: "visible", timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  if (!autoOpened) {
    await page.getByRole("button", { name: "پرتفولیو جدید" }).first().click();
  }
  await nameField.fill("حساب اصلی");
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

  // ---- A second portfolio, and exactly one card may look active --------
  // Regression for "both portfolios show the active style". The active one is
  // decided in two places — the server's `is_active` and the id stored in
  // localStorage — and a card used to render as active when *either* said so.
  // Every step below leaves and returns through the sidebar, because a page
  // reload would drop the in-memory GET cache that made the two disagree.
  const auth = { Authorization: `Bearer ${token}` };
  const second = await request.post("http://localhost:8000/api/portfolios/", {
    headers: { ...auth, "Content-Type": "application/json" },
    data: {
      name: "حساب دوم",
      broker: "IC Markets",
      initial: 5000,
      balance: 5000,
      leverage: "1:100",
      currency: "USD",
      // Created active, so the server now marks this one and deactivates the
      // first — while the page below still has the first one stored.
    },
  });
  expect(second.ok()).toBeTruthy();

  async function leaveAndReturn() {
    // `exact` matters: "معاملات" is also a substring of "تقویم معاملاتی".
    await page.getByRole("link", { name: "معاملات", exact: true }).click();
    await page.waitForURL(/\/app\/trades/, { timeout: 20_000 });
    await page.getByRole("link", { name: "پرتفولیوها", exact: true }).click();
    await page.waitForURL(/\/app\/portfolios/, { timeout: 20_000 });
    await expect(page.getByText("حساب اصلی").first()).toBeVisible({
      timeout: 15_000,
    });
  }

  await leaveAndReturn();
  await expect(page.getByText("فعال", { exact: true })).toHaveCount(1);
  await expect(
    page
      .locator(".card-surface", { hasText: "حساب دوم" })
      .getByText("فعال", { exact: true }),
  ).toBeVisible();

  // Activating the first portfolio again tests the other direction: the list
  // fetched before this click is the one a stale cache would serve back.
  await page
    .locator(".card-surface", { hasText: "حساب اصلی" })
    .getByRole("button", { name: "فعال‌سازی" })
    .click();
  await leaveAndReturn();

  // The badge is the visible claim, so it is the thing to count: exactly one
  // card says فعال, and it is the one that was just activated.
  await expect(page.getByText("فعال", { exact: true })).toHaveCount(1);
  await expect(
    page
      .locator(".card-surface", { hasText: "حساب اصلی" })
      .getByText("فعال", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".card-surface", { hasText: "حساب دوم" })
      .getByText("غیر فعال", { exact: true }),
  ).toBeVisible();

  const portfolios = await request.get(
    "http://localhost:8000/api/portfolios/",
    {
      headers: auth,
    },
  );
  expect(portfolios.ok()).toBeTruthy();
  const list = await portfolios.json();
  const rows: { id: number | string; is_active?: boolean }[] =
    list.results ?? list;
  // The journey above re-activated the first portfolio, so the row order is
  // not what the app is scoped to — the trade has to land on the *active*
  // portfolio or the dashboard assertion at the end reads zero trades.
  const portfolioId = rows.find((p) => p.is_active)?.id;
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
