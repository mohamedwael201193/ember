/**
 * Capture product screenshots for README / docs/screenshots.
 * Requires: pnpm dev running on :5173
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const BASE = process.env.EMBER_UI_URL || "http://127.0.0.1:5173";
const OUT = resolve("docs/screenshots");
mkdirSync(OUT, { recursive: true });

const pages = [
  { path: "/", file: "landing.png" },
  { path: "/app", file: "console.png", full: true },
  { path: "/app/mission", file: "mission.png", full: true },
  { path: "/app/mission/new", file: "mission-builder.png" },
  { path: "/app/executions", file: "payday.png", full: true },
  { path: "/app/rescues", file: "rescue.png", full: true },
  { path: "/app/proofs", file: "proofs.png", full: true },
  { path: "/app/operations", file: "operations.png", full: true },
  { path: "/app/wallets", file: "wallets.png", full: true }
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1
});
const page = await context.newPage();
await page.addInitScript(() => {
  localStorage.setItem("ember.demoMode", "1");
  localStorage.setItem("ember.onboarding.v2", "1");
  localStorage.setItem(
    "ember.mission.draft",
    JSON.stringify({
      walletLabel: "Primary payroll wallet",
      employeeName: "Alex",
      beneficiary: "0xBDfCeE82Bd42FEfA58ee850B3709636a8B6b0034",
      amountUsdc: "0.01",
      cadenceMin: "5",
      recoveryOrg: "Standby rescue org"
    })
  );
});

/**
 * Scroll-triggered draw/fade animations only settle once an element has been
 * inside the viewport, so walk the page top to bottom before capturing.
 */
async function settleAnimations() {
  await page.evaluate(async () => {
    /* eslint-disable no-undef -- browser context inside Playwright page.evaluate */
    const step = Math.round(window.innerHeight * 0.6);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
    /* eslint-enable no-undef */
  });
}

for (const item of pages) {
  await page.goto(`${BASE}${item.path}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(900);
  await settleAnimations();
  await page.waitForTimeout(600);
  const file = resolve(OUT, item.file);
  await page.screenshot({ path: file, fullPage: Boolean(item.full) });
  console.log("wrote", item.file);
}

await browser.close();
console.log("done");
