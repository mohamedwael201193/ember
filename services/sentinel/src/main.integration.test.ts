import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";

let child: ChildProcess | undefined;

async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("server did not bind");
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return address.port;
}

async function waitForHealth(url: string, process_: ChildProcess): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (process_.exitCode !== null) throw new Error(`sentinel exited with ${process_.exitCode}`);
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Process has not bound the port yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("sentinel health timeout");
}

afterEach(() => {
  child?.kill();
  child = undefined;
});

describe("sentinel HTTP boundary", () => {
  it("reports readiness and rejects unauthenticated or oversized rescue requests", async () => {
    const port = await freePort();
    child = spawn(process.execPath, ["--import", "tsx", "services/sentinel/src/main.ts"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        KH_API_BASE: "https://app.keeperhub.com",
        KH_API_KEY_STANDBY: "kh_standby_test",
        SENTINEL_SHARED_SECRET: "s".repeat(64),
        PRIMARY_OBSERVER_SHARED_SECRET: "o".repeat(64),
        PRIMARY_OBSERVER_URL: "http://127.0.0.1:9",
        SENTINEL_PORT: String(port),
        PORT: String(port),
        MISSION_START_AT: "1000",
        MISSION_ID_SEPOLIA: "1",
        CONTINUITY_ADDRESS_SEPOLIA: "0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770",
        PAYMENT_AMOUNT_USDC: "10000",
        PAYROLL_BUDGET_USDC: "5000000",
        ESCROW_FUND_USDC: "1000000",
        MAINNET_TOTAL_SPEND_CAP_USDC: "10000000",
        CADENCE_SECONDS: "300",
        GRACE_MISSED_RUNS: "2",
        SENTINEL_POLL_SECONDS: "120",
        CLOCK_SKEW_SECONDS: "60",
        RECEIPT_CONFIRMATIONS: "3",
        MAX_REPLAY_SLOTS: "12",
        X402_FEE_USDC: "50000",
        X402_MAX_FEE_USDC: "500000",
        CHAIN_ID_MAINNET: "8453",
        CHAIN_ID_REHEARSAL: "84532",
        BASE_SEPOLIA_RPC_URL: "http://127.0.0.1:9",
        USDC_ADDRESS_BASE_SEPOLIA: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        WORKFLOW_HASH_SEPOLIA: `0x${"1".repeat(64)}`,
        PROOF_ANCHOR_ENABLE: "0",
        SENTINEL_SELF_POLL: "0"
      },
      stdio: "pipe"
    });
    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForHealth(`${baseUrl}/healthz`, child);

    expect((await fetch(`${baseUrl}/readyz`)).status).toBe(200);
    expect(
      (
        await fetch(`${baseUrl}/rescue`, {
          method: "POST",
          body: "{}",
          headers: { "content-type": "application/json" }
        })
      ).status
    ).toBe(401);
    expect(
      (
        await fetch(`${baseUrl}/rescue`, {
          method: "POST",
          body: "x".repeat(70_000),
          headers: { "content-type": "application/json" }
        })
      ).status
    ).toBe(413);
  }, 15_000);
});
