import { describe, expect, it } from "vitest";
import { loadObserverEnv, loadPaydayEnv, loadSentinelEnv, redactSecret } from "./env.js";

const economics = {
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
  X402_MAX_FEE_USDC: "500000"
};
const chain = {
  CHAIN_ID_MAINNET: "8453",
  CHAIN_ID_REHEARSAL: "84532"
};
const secret = "a".repeat(64);

describe("service environment validation", () => {
  it("accepts the bounded rehearsal policy", () => {
    expect(
      loadSentinelEnv({
        ...economics,
        ...chain,
        SENTINEL_SHARED_SECRET: secret
      }).MAX_REPLAY_SLOTS
    ).toBe(12);
  });

  it("rejects an underfunded daily payroll policy", () => {
    expect(() =>
      loadPaydayEnv({
        ...economics,
        ...chain,
        PAYROLL_BUDGET_USDC: "10000",
        KH_API_BASE: "https://app.keeperhub.com",
        KH_API_KEY_PRIMARY_EXECUTOR: "kh_test"
      })
    ).toThrow("must fund at least 24 hours");
  });

  it("rejects short HMAC secrets", () => {
    expect(() =>
      loadObserverEnv({
        KH_API_BASE: "https://app.keeperhub.com",
        KH_API_KEY_PRIMARY_OBSERVER: "kh_test",
        PRIMARY_OBSERVER_SHARED_SECRET: "short"
      })
    ).toThrow("at least 64 characters");
  });

  it("rejects forbidden cross-boundary credentials", () => {
    expect(() =>
      loadPaydayEnv({
        ...economics,
        ...chain,
        KH_API_BASE: "https://app.keeperhub.com",
        KH_API_KEY_PRIMARY_EXECUTOR: "kh_test",
        KH_API_KEY_STANDBY: "kh_forbidden"
      })
    ).toThrow("must not be present in payday");
  });

  it("redacts secrets without exposing short values", () => {
    expect(redactSecret("abcdefgh")).toBe("abcd***");
    expect(redactSecret("abc")).toBe("***");
    expect(() => redactSecret("abc", -1)).toThrow("must not be negative");
  });
});
