import { z } from "zod";

const optionalString = z.string().trim().optional();
const nonEmptyString = z.string().trim().min(1);
const sharedSecret = z.string().trim().min(64, "must contain at least 64 characters");
const positiveInteger = z.coerce.number().int().positive();
const port = z.coerce.number().int().min(1).max(65_535);
const url = z.url();
const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "must be an EVM address");
const optionalUrl = z.preprocess((value) => (value === "" ? undefined : value), url.optional());
const optionalAddress = z.preprocess(
  (value) => (value === "" ? undefined : value),
  address.optional()
);

export const sharedMissionEconomicsSchema = z.object({
  PAYMENT_AMOUNT_USDC: positiveInteger.max(1_000_000),
  PAYROLL_BUDGET_USDC: positiveInteger,
  ESCROW_FUND_USDC: positiveInteger,
  MAINNET_TOTAL_SPEND_CAP_USDC: positiveInteger,
  CADENCE_SECONDS: positiveInteger,
  GRACE_MISSED_RUNS: z.coerce.number().int().min(1).max(5),
  SENTINEL_POLL_SECONDS: positiveInteger,
  CLOCK_SKEW_SECONDS: z.coerce.number().int().min(0),
  RECEIPT_CONFIRMATIONS: positiveInteger,
  MAX_REPLAY_SLOTS: z.coerce.number().int().min(1).max(12),
  X402_FEE_USDC: z.coerce.number().int().min(0),
  X402_MAX_FEE_USDC: z.coerce.number().int().min(0)
});

function validateEconomics(
  env: z.output<typeof sharedMissionEconomicsSchema>,
  context: z.RefinementCtx
): void {
  const dailySlots = Math.ceil(86_400 / env.CADENCE_SECONDS);
  if (env.PAYROLL_BUDGET_USDC < dailySlots * env.PAYMENT_AMOUNT_USDC) {
    context.addIssue({
      code: "custom",
      path: ["PAYROLL_BUDGET_USDC"],
      message: "must fund at least 24 hours of configured payments"
    });
  }
  if (env.PAYROLL_BUDGET_USDC + env.ESCROW_FUND_USDC > env.MAINNET_TOTAL_SPEND_CAP_USDC) {
    context.addIssue({
      code: "custom",
      path: ["MAINNET_TOTAL_SPEND_CAP_USDC"],
      message: "must cover payroll budget plus escrow"
    });
  }
  if (env.X402_FEE_USDC > env.X402_MAX_FEE_USDC) {
    context.addIssue({
      code: "custom",
      path: ["X402_FEE_USDC"],
      message: "must not exceed X402_MAX_FEE_USDC"
    });
  }
}

const sharedChainSchema = z.object({
  CHAIN_ID_MAINNET: z.coerce.number().int().positive(),
  CHAIN_ID_REHEARSAL: z.coerce.number().int().positive(),
  BASE_RPC_URL: optionalUrl,
  BASE_RPC_URL_FALLBACK: optionalUrl,
  BASE_SEPOLIA_RPC_URL: optionalUrl,
  BASE_SEPOLIA_RPC_URL_FALLBACK: optionalUrl,
  USDC_ADDRESS_BASE: optionalAddress,
  USDC_ADDRESS_BASE_SEPOLIA: optionalAddress,
  CONTINUITY_ADDRESS_SEPOLIA: optionalString,
  CONTINUITY_ADDRESS_MAINNET: optionalString,
  MISSION_ID_SEPOLIA: optionalString,
  MISSION_ID_MAINNET: optionalString,
  WORKFLOW_HASH_SEPOLIA: optionalString,
  WORKFLOW_HASH_MAINNET: optionalString
});

const sharedServiceSchema = z.object({
  LOG_LEVEL: optionalString,
  SENTINEL_PUBLIC_URL: optionalUrl,
  PRIMARY_OBSERVER_PUBLIC_URL: optionalUrl
});

export const paydayEnvSchema = z
  .object({
    KH_API_BASE: url,
    KH_API_KEY_PRIMARY_EXECUTOR: nonEmptyString,
    KH_ORG_A_W1_WORKFLOW_ID: optionalString,
    ORG_A_WALLET_ADDRESS: optionalAddress,
    EMPLOYEE_ADDRESS: optionalAddress,
    ORG_A_WALLET_INTEGRATION_ID: optionalString,
    MISSION_START_AT: z.coerce.number().int().positive().optional(),
    PAYMENT_AMOUNT_USDC: positiveInteger.max(1_000_000),
    CADENCE_SECONDS: positiveInteger,
    RESCUE_JOURNAL_DIR: optionalString,
    PAYDAY_ENABLE: z.enum(["0", "1"]).optional(),
    PAYDAY_CONTROL_TOKEN: optionalString,
    PAYDAY_PORT: port.optional(),
    PORT: port.optional()
  })
  .merge(sharedMissionEconomicsSchema)
  .merge(sharedChainSchema)
  .merge(sharedServiceSchema)
  .passthrough()
  .superRefine((env, context) => {
    validateEconomics(env, context);
    for (const key of [
      "KH_API_KEY_PRIMARY_OBSERVER",
      "KH_API_KEY_STANDBY",
      "DEPLOYER_PRIVATE_KEY",
      "PINATA_JWT"
    ] as const) {
      if (env[key] !== undefined)
        context.addIssue({
          code: "custom",
          path: [key],
          message: `${key} must not be present in payday`
        });
    }
  });

export const observerEnvSchema = z
  .object({
    KH_API_BASE: url,
    KH_API_KEY_PRIMARY_OBSERVER: nonEmptyString,
    KH_ORG_A_W1_WORKFLOW_ID: optionalString,
    PRIMARY_OBSERVER_SHARED_SECRET: sharedSecret,
    PRIMARY_OBSERVER_PORT: port.optional(),
    PORT: port.optional(),
    PRIMARY_OBSERVER_PUBLIC_URL: optionalUrl
  })
  .passthrough()
  .superRefine((env, context) => {
    for (const key of [
      "KH_API_KEY_STANDBY",
      "KH_API_KEY_PRIMARY_EXECUTOR",
      "DEPLOYER_PRIVATE_KEY"
    ] as const) {
      if (env[key] !== undefined)
        context.addIssue({
          code: "custom",
          path: [key],
          message: `${key} must not be present in primary-observer`
        });
    }
  });

export const sentinelEnvSchema = z
  .object({
    KH_API_BASE: optionalUrl,
    KH_API_KEY_STANDBY: nonEmptyString.optional(),
    KH_ORG_B_W2_WORKFLOW_ID: optionalString,
    KH_ORG_B_W3_WORKFLOW_ID: optionalString,
    SENTINEL_SHARED_SECRET: sharedSecret,
    SENTINEL_PORT: port.optional(),
    PORT: port.optional(),
    SENTINEL_PUBLIC_URL: optionalUrl,
    MISSION_START_AT: z.coerce.number().int().positive().optional()
  })
  .merge(sharedMissionEconomicsSchema)
  .merge(sharedChainSchema)
  .merge(sharedServiceSchema)
  .passthrough()
  .superRefine((env, context) => {
    validateEconomics(env, context);
    for (const key of [
      "KH_API_KEY_PRIMARY_EXECUTOR",
      "KH_API_KEY_PRIMARY_OBSERVER",
      "DEPLOYER_PRIVATE_KEY"
    ] as const) {
      if (env[key] !== undefined)
        context.addIssue({
          code: "custom",
          path: [key],
          message: `${key} must not be present in sentinel`
        });
    }
  });

export type PaydayEnv = z.output<typeof paydayEnvSchema>;
export type ObserverEnv = z.output<typeof observerEnvSchema>;
export type SentinelEnv = z.output<typeof sentinelEnvSchema>;
