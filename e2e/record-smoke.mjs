#!/usr/bin/env node
/**
 * Record a screen-capture video of a smoke test on the LIVE site.
 *
 * Flow:
 *   1. Opens a headed browser on https://dlea.piqagram.ir/signup
 *   2. Signs up a fresh account (name / email / password)
 *   3. PAUSES — the OTP code is sent to your email, so enter it in the
 *      browser window and press Enter here in the terminal to continue.
 *   4. Tours the key sections (dashboard, portfolios, trades, journal,
 *      goals, calendar, achievements, settings, news, support) while
 *      Playwright records a video of the whole session.
 *   5. Saves the video to smoke-test/ and prints the path.
 *
 * Usage:
 *   node e2e/record-smoke.mjs
 *
 * Optional env vars:
 *   LIVE_URL        site to record (default https://dlea.piqagram.ir)
 *   SMOKE_EMAIL     email to use for signup (default smoke-<ts>@example.com)
 *   SMOKE_NAME      first name (default "علی")
 *   SMOKE_LAST      last name (default "رضایی")
 *   SMOKE_PASSWORD  password (default "SmokeTest123!")
 *   SMOKE_VIDEO_DIR where to save the video (default ./smoke-test)
 */
import { chromium } from "@playwright/test";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const LIVE_URL = process.env.LIVE_URL ?? "https://dlea.piqagram.ir";
const EMAIL = process.env.SMOKE_EMAIL ?? `smoke-${Date.now()}@example.com`;
const FIRST = process.env.SMOKE_NAME ?? "علی";
const LAST = process.env.SMOKE_LAST ?? "رضایی";
const PASSWORD = process.env.SMOKE_PASSWORD ?? "SmokeTest123!";
const VIDEO_DIR = path.resolve(
  ROOT,
  process.env.SMOKE_VIDEO_DIR ?? "smoke-test",
);

fs.mkdirSync(VIDEO_DIR, { recursive: true });

const sections = [
  { to: "/app/dashboard", name: "داشبورد", wait: 2500 },
  { to: "/app/portfolios", name: "پرتفولیوها", wait: 2500 },
  { to: "/app/trades", name: "معاملات", wait: 2500 },
  { to: "/app/journal", name: "ژورنال", wait: 2500 },
  { to: "/app/goals", name: "اهداف", wait: 2000 },
  { to: "/app/calendar", name: "تقویم", wait: 2000 },
  { to: "/app/achievements", name: "نشان‌ها", wait: 2000 },
  { to: "/app/settings", name: "تنظیمات", wait: 2500 },
  { to: "/app/news", name: "اخبار", wait: 2000 },
  { to: "/app/support", name: "پشتیبانی", wait: 2000 },
];

const rl = readline.createInterface({ input, output });

async function run() {
  console.log(`🎬 Recording smoke test on ${LIVE_URL}`);
  console.log(`   Account: ${EMAIL} (first name: ${FIRST} ${LAST})\n`);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    // Bypass the broken injected system proxy so the live site loads directly.
    args: ["--no-proxy-server"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "fa-IR",
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();

  try {
    // ---- Signup ------------------------------------------------------
    console.log("1️⃣  Opening the signup page...");
    await page.goto(`${LIVE_URL}/signup`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    await page.getByPlaceholder("علی").fill(FIRST);
    await page.getByPlaceholder("رضایی").fill(LAST);
    await page.getByPlaceholder("you@example.com").fill(EMAIL);
    await page.getByPlaceholder("حداقل ۸ کاراکتر").fill(PASSWORD);
    await page.getByRole("button", { name: "ارسال کد تأیید" }).click();

    console.log(`   Code sent to ${EMAIL}.`);
    console.log(
      "   ▶ Check your inbox, open the OTP email, and type the 6-digit",
    );
    console.log("     code into the browser window, then press Enter here.");
    await rl.question(
      "   Press Enter after entering the code in the browser: ",
    );
    console.log("   Verifying...\n");
    await page.waitForTimeout(2500);

    // ---- Guided tour -------------------------------------------------
    console.log("2️⃣  Touring key sections...");
    for (const s of sections) {
      console.log(`   → ${s.name}`);
      await page.goto(`${LIVE_URL}${s.to}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(s.wait);
    }
    console.log("   Tour complete.\n");

    console.log("3️⃣  Finalizing video...");
    await context.close();
    const video = page.video();
    const vPath = video ? await video.path() : null;

    if (vPath && fs.existsSync(vPath)) {
      const out = path.join(VIDEO_DIR, `smoke-test-${Date.now()}.webm`);
      fs.renameSync(vPath, out);
      console.log(`✅ Video saved:\n   ${out}\n`);
    } else {
      console.log(
        "⚠️  No video file was produced (recording may not have started).",
      );
    }
    await browser.close();
  } catch (err) {
    console.error("\n❌ Recording failed:", err.message);
    await browser.close();
    process.exit(1);
  } finally {
    rl.close();
  }
}

run();
