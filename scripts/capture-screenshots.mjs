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
  { path: "/app", file: "console.png" },
  { path: "/app/mission", file: "mission.png" },
  { path: "/app/mission/new", file: "mission-builder.png" },
  { path: "/app/executions", file: "payday.png" },
  { path: "/app/rescues", file: "rescue.png" },
  { path: "/app/proofs", file: "proofs.png" },
  { path: "/app/operations", file: "operations.png" },
  { path: "/app/wallets", file: "wallets.png" },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.addInitScript(() => {
  localStorage.setItem("ember.demoMode", "1");
  localStorage.setItem(
    "ember.mission.draft",
    JSON.stringify({
      walletLabel: "Primary payroll wallet",
      employeeName: "Alex",
      beneficiary: "0xBDfCeE82Bd42FEfA58ee850B3709636a8B6b0034",
      amountUsdc: "0.01",
      cadenceMin: "5",
      recoveryOrg: "Standby rescue org",
    })
  );
});

for (const item of pages) {
  await page.goto(`${BASE}${item.path}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(800);
  const file = resolve(OUT, item.file);
  await page.screenshot({ path: file, fullPage: false });
  console.log("wrote", item.file);
}

await browser.close();
console.log("done");
