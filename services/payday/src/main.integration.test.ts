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
    if (process_.exitCode !== null) throw new Error(`payday exited with ${process_.exitCode}`);
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Process has not bound the port yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("payday health timeout");
}

afterEach(() => {
  child?.kill();
  child = undefined;
});

describe("PAYDAY HTTP boundary", () => {
  it("is ready with cadence disabled and protects manual control with Bearer auth", async () => {
    const port = await freePort();
    child = spawn(process.execPath, ["--import", "tsx", "services/payday/src/main.ts"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        KH_API_BASE: "https://app.keeperhub.com",
        KH_API_KEY_PRIMARY_EXECUTOR: "kh_executor_test",
        KH_ORG_A_W1_WORKFLOW_ID: "wf-test",
        PAYDAY_CONTROL_TOKEN: "control-token-that-is-long-enough",
        PAYDAY_ENABLE: "0",
        PAYDAY_PORT: String(port),
        PORT: String(port),
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
        CHAIN_ID_REHEARSAL: "84532"
      },
      stdio: "pipe"
    });
    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForHealth(`${baseUrl}/healthz`, child);

    expect((await fetch(`${baseUrl}/readyz`)).status).toBe(200);
    expect((await fetch(`${baseUrl}/run-once`, { method: "POST" })).status).toBe(401);
    expect(
      (
        await fetch(`${baseUrl}/run-once`, {
          method: "POST",
          headers: { authorization: "Bearer wrong-token" }
        })
      ).status
    ).toBe(401);
  }, 15_000);
});
