import { existsSync } from "node:fs";
import {
  loadObserverEnv,
  loadPaydayEnv,
  loadSentinelEnv
} from "../packages/mission-core/src/env.js";

if (!existsSync(".env")) {
  throw new Error(".env is required for environment validation");
}

process.loadEnvFile(".env");

function project(keys: readonly string[]): Record<string, string | undefined> {
  return Object.fromEntries(keys.map((key) => [key, process.env[key]]));
}

const shared = [
  "PAYMENT_AMOUNT_USDC",
  "PAYROLL_BUDGET_USDC",
  "ESCROW_FUND_USDC",
  "MAINNET_TOTAL_SPEND_CAP_USDC",
  "CADENCE_SECONDS",
  "GRACE_MISSED_RUNS",
  "SENTINEL_POLL_SECONDS",
  "CLOCK_SKEW_SECONDS",
  "RECEIPT_CONFIRMATIONS",
  "MAX_REPLAY_SLOTS",
  "X402_FEE_USDC",
  "X402_MAX_FEE_USDC",
  "CHAIN_ID_MAINNET",
  "CHAIN_ID_REHEARSAL",
  "BASE_RPC_URL",
  "BASE_RPC_URL_FALLBACK",
  "BASE_SEPOLIA_RPC_URL",
  "BASE_SEPOLIA_RPC_URL_FALLBACK",
  "USDC_ADDRESS_BASE",
  "USDC_ADDRESS_BASE_SEPOLIA",
  "CONTINUITY_ADDRESS_SEPOLIA",
  "CONTINUITY_ADDRESS_MAINNET",
  "MISSION_ID_SEPOLIA",
  "MISSION_ID_MAINNET",
  "WORKFLOW_HASH_SEPOLIA",
  "WORKFLOW_HASH_MAINNET",
  "LOG_LEVEL",
  "SENTINEL_PUBLIC_URL",
  "PRIMARY_OBSERVER_PUBLIC_URL"
] as const;

loadPaydayEnv(
  project([
    ...shared,
    "KH_API_BASE",
    "KH_API_KEY_PRIMARY_EXECUTOR",
    "KH_ORG_A_W1_WORKFLOW_ID",
    "ORG_A_WALLET_ADDRESS",
    "EMPLOYEE_ADDRESS",
    "ORG_A_WALLET_INTEGRATION_ID",
    "MISSION_START_AT",
    "RESCUE_JOURNAL_DIR",
    "PAYDAY_ENABLE",
    "PAYDAY_CONTROL_TOKEN",
    "PAYDAY_PORT",
    "PORT"
  ])
);
loadObserverEnv(
  project([
    "KH_API_BASE",
    "KH_API_KEY_PRIMARY_OBSERVER",
    "KH_ORG_A_W1_WORKFLOW_ID",
    "PRIMARY_OBSERVER_SHARED_SECRET",
    "PRIMARY_OBSERVER_PORT",
    "PORT",
    "PRIMARY_OBSERVER_PUBLIC_URL"
  ])
);
loadSentinelEnv(
  project([
    ...shared,
    "KH_API_BASE",
    "KH_API_KEY_STANDBY",
    "KH_ORG_B_W2_WORKFLOW_ID",
    "KH_ORG_B_W3_WORKFLOW_ID",
    "SENTINEL_SHARED_SECRET",
    "SENTINEL_PORT",
    "PORT",
    "SENTINEL_PUBLIC_URL",
    "MISSION_START_AT"
  ])
);
if (process.env.SENTINEL_SHARED_SECRET === process.env.PRIMARY_OBSERVER_SHARED_SECRET) {
  throw new Error("service authentication secrets must differ");
}
if (process.env.PROOF_ANCHOR_ENABLE === "1") {
  for (const key of [
    "KH_MCP_URL",
    "PINATA_JWT",
    "IPFS_GATEWAY",
    "CONTINUITY_ADDRESS_SEPOLIA"
  ] as const) {
    if (!process.env[key]) throw new Error(`${key} is required when PROOF_ANCHOR_ENABLE=1`);
  }
}
console.log("Environment validation passed.");
